import { FormDSignal, Lead, LeadStatus } from "../shared/types"
import { fetchFormD } from "./edgar"
import { PipelineEnv, readPipelineEnv, requireEdgarUserAgent } from "./env"

interface EdgarHit {
  _id?: string
  accessionNo?: string
  adsh?: string
  cik?: string
  ciks?: string[]
  companyName?: string
  entityName?: string
  display_names?: string[]
  form?: string
  filedAt?: string
  filed?: string
  file_date?: string
  linkToFilingDetails?: string
  linkToHtml?: string
}

interface EdgarSearchResponse {
  hits?: {
    hits?: Array<{
      _id?: string
      _source?: EdgarHit
    }>
  }
}

/** A normalized hit plus the issuer CIK we need to fetch the filing document. */
interface Candidate {
  signal: FormDSignal
  cik?: string
}

export interface PollFormDOptions {
  env?: PipelineEnv
  limit?: number
  fromDate?: string
  lookbackDays?: number
  fallbackLookbackDays?: number
  includeFunds?: boolean
  /** Skip the primary_doc.xml detail fetch (names/amount/address). Default false. */
  skipFilingDetails?: boolean
}

export async function pollRecentFormD(options: PollFormDOptions = {}): Promise<FormDSignal[]> {
  const env = readPipelineEnv(options.env)
  const limit = options.limit ?? 10
  const lookbackDays = options.lookbackDays ?? 30
  const fallbackLookbackDays = options.fallbackLookbackDays ?? 365
  const fromDate = options.fromDate ?? isoDateDaysAgo(lookbackDays)
  const includeFunds = options.includeFunds ?? false

  let candidates = await searchWindow(fromDate, env, limit, includeFunds)
  if (candidates.length === 0 && !options.fromDate && fallbackLookbackDays > lookbackDays) {
    // Re-QUERY with the wider window — the first response only covered the narrow one.
    candidates = await searchWindow(isoDateDaysAgo(fallbackLookbackDays), env, limit, includeFunds)
  }

  if (options.skipFilingDetails) return candidates.map((c) => c.signal)
  // Fill real exec names / amount raised / address from primary_doc.xml (PRD §4).
  return Promise.all(candidates.map((c) => enrichSignalFromFiling(c)))
}

/**
 * One EDGAR full-text search request. EFTS silently ignores the date filter
 * unless BOTH startdt and enddt are present, and does not support sort/size
 * params — so we send the minimal verified query (same as edgar.ts) and
 * filter/sort client-side.
 */
async function searchWindow(
  fromDate: string,
  env: PipelineEnv,
  limit: number,
  includeFunds: boolean,
): Promise<Candidate[]> {
  const url = new URL("https://efts.sec.gov/LATEST/search-index")
  url.searchParams.set("q", "")
  url.searchParams.set("forms", "D")
  url.searchParams.set("startdt", fromDate)
  url.searchParams.set("enddt", isoDateDaysAgo(0))
  url.searchParams.set("from", "0")

  const response = await fetch(url, {
    headers: {
      "User-Agent": requireEdgarUserAgent(env),
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`EDGAR Form D search failed: ${response.status} ${response.statusText}`)
  }

  const payload = (await response.json()) as EdgarSearchResponse
  const hits = payload.hits?.hits ?? []
  return normalizeAndSortCandidates(hits, fromDate, limit, includeFunds)
}

function normalizeAndSortCandidates(
  hits: Array<{
    _id?: string
    _source?: EdgarHit
  }>,
  fromDate: string,
  limit: number,
  includeFunds: boolean,
): Candidate[] {
  const cutoff = new Date(fromDate).getTime()
  const normalized = hits
    .map((hit) => normalizeEdgarHit({ ...(hit._source ?? {}), _id: hit._source?._id ?? hit._id }))
    .filter((candidate): candidate is Candidate => Boolean(candidate))
    .filter((candidate) => new Date(candidate.signal.filedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.signal.filedAt).getTime() - new Date(a.signal.filedAt).getTime())

  const operatingCompanies = includeFunds
    ? normalized
    : normalized.filter((candidate) => !isFundLike(candidate.signal.companyName))
  const candidates = operatingCompanies.length > 0 ? operatingCompanies : normalized

  return candidates.slice(0, limit)
}

export function detectedLeadFromSignal(signal: FormDSignal): Lead {
  const now = new Date().toISOString()

  return {
    id: `form-d-${slug(signal.accessionNumber || signal.companyName)}`,
    status: LeadStatus.DETECTED,
    isDemo: false,
    signal,
    replies: [],
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeEdgarHit(hit: EdgarHit): Candidate | null {
  // EFTS `_id` is "<accession>:<document>"; `adsh` is the bare accession.
  const accessionNumber = hit.accessionNo ?? hit.adsh ?? String(hit._id ?? "").split(":")[0]
  const companyName =
    hit.companyName ?? hit.entityName ?? hit.display_names?.[0]?.replace(/\s+\(.*\)$/, "")

  if (!accessionNumber || !companyName) return null

  const filedAt = hit.filedAt ?? hit.filed ?? hit.file_date ?? new Date().toISOString()
  const cik = (hit.ciks?.[0] ?? hit.cik ?? "").replace(/^0+/, "") || undefined
  const edgarUrl =
    hit.linkToFilingDetails ??
    hit.linkToHtml ??
    (cik ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=D` : undefined)

  return {
    cik,
    signal: {
      accessionNumber,
      companyName,
      relatedPersons: [],
      filedAt: new Date(filedAt).toISOString(),
      edgarUrl: edgarUrl?.startsWith("http") ? edgarUrl : edgarUrl ? `https://www.sec.gov${edgarUrl}` : undefined,
    },
  }
}

/**
 * Pull the filing's primary_doc.xml (via edgar.ts's live-tested parser) to fill
 * the real Form D fields: exec/director names, amount raised, mailing address.
 * Best-effort — a parse failure keeps the basic signal instead of dropping it.
 */
async function enrichSignalFromFiling(candidate: Candidate): Promise<FormDSignal> {
  if (!candidate.cik) return candidate.signal
  try {
    const parsed = await fetchFormD(
      candidate.cik,
      candidate.signal.accessionNumber,
      candidate.signal.filedAt.slice(0, 10),
    )
    const relatedPersons = parsed.persons.map((p) =>
      p.role && p.role !== "Related Person" ? `${p.name} (${p.role})` : p.name,
    )
    return {
      ...candidate.signal,
      companyName: parsed.entityName || candidate.signal.companyName,
      relatedPersons,
      address: parsed.address || candidate.signal.address,
      amountRaised: parsed.amountRaised || candidate.signal.amountRaised,
    }
  } catch {
    return candidate.signal
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function isoDateDaysAgo(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function isFundLike(companyName: string): boolean {
  return /\b(fund|lp|l\.p\.|reit|portfolio|partners|holdings|capital|credit|income|bond|arbitrage|offshore|onshore|master|series)\b/i.test(
    companyName,
  )
}
