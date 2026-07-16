/**
 * The live detection cycle — what makes new companies appear on the dashboard
 * without anyone running the CLI.
 *
 * One bounded pass, safe to run repeatedly (idempotent via store dedup):
 *   1. scan the newest Form D filings (one cheap EFTS request, no detail fetches)
 *   2. drop every filing whose lead id is already in the store
 *   3. for up to `max` NEW filings: pull the real filing fields, then run the
 *      full pipeline (research → enrich → score → draft, persisted with guarded
 *      status transitions) — sequentially, to stay polite to EDGAR and inside a
 *      serverless time budget
 *
 * A failure on one lead never aborts the rest of the cycle.
 */
import { Lead, StoreProvider } from "../shared/types"
import { PipelineEnv } from "./env"
import {
  Candidate,
  detectedLeadFromSignal,
  enrichSignalFromFiling,
  pollRecentFormDCandidates,
  PollFormDOptions,
} from "./pollFormD"
import { runRocketRidePipeline } from "./rocketride"

export interface DetectCycleOptions {
  store: StoreProvider
  /** Max NEW companies fully processed per cycle. Default 2. */
  max?: number
  /** EDGAR hits scanned per cycle (one EFTS page caps at ~10). Default 10. */
  scanLimit?: number
  /** How far back the scan looks. Default 3 days (30-day fallback when quiet). */
  lookbackDays?: number
  env?: PipelineEnv
  /** Test seams — default to the real scan / real pipeline. */
  poll?: (options: PollFormDOptions) => Promise<Candidate[]>
  process?: (lead: Lead) => Promise<Lead>
}

export interface DetectCycleResult {
  /** Filings the scan returned. */
  scanned: number
  /** Filings skipped because the store already has them. */
  known: number
  /** New leads that ran the pipeline this cycle. */
  processed: Array<{ id: string; companyName: string; status: string }>
  /** Per-lead failures (the rest of the cycle still ran). */
  errors: Array<{ id: string; error: string }>
}

export async function runDetectCycle(options: DetectCycleOptions): Promise<DetectCycleResult> {
  const { store, env } = options
  const max = options.max ?? 2
  const poll = options.poll ?? pollRecentFormDCandidates
  const process_ =
    options.process ??
    (async (lead: Lead) =>
      (await runRocketRidePipeline({ lead, persist: true }, { env, store })).lead)

  const candidates = await poll({
    env,
    limit: options.scanLimit ?? 10,
    lookbackDays: options.lookbackDays ?? 3,
    fallbackLookbackDays: 30,
    skipFilingDetails: true,
  })

  const existing = new Set((await store.listLeads()).map((lead) => lead.id))
  const fresh = candidates.filter(
    (candidate) => !existing.has(detectedLeadFromSignal(candidate.signal).id),
  )

  const result: DetectCycleResult = {
    scanned: candidates.length,
    known: candidates.length - fresh.length,
    processed: [],
    errors: [],
  }

  for (const candidate of fresh.slice(0, max)) {
    const id = detectedLeadFromSignal(candidate.signal).id
    try {
      // Detail-fetch only the leads we actually take (best-effort inside).
      const signal = await enrichSignalFromFiling(candidate)
      const lead = await process_(detectedLeadFromSignal(signal))
      result.processed.push({
        id: lead.id,
        companyName: lead.signal.companyName,
        status: lead.status,
      })
    } catch (err) {
      result.errors.push({ id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return result
}
