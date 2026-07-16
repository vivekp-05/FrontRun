/**
 * Detect-cycle tests — offline. The EDGAR scan and the pipeline are injected
 * through the test seams; candidates carry no CIK so the best-effort detail
 * fetch short-circuits without touching the network.
 *
 *   npx tsx workstream-b-pipeline/detect.test.ts
 */
import { FormDSignal, Lead, LeadStatus } from "../shared/types"
import { InMemoryStore } from "../workstream-a-backend/store"
import { runDetectCycle } from "./detect"
import { Candidate, detectedLeadFromSignal } from "./pollFormD"

let failures = 0
function check(label: string, actual: unknown, expected: unknown): void {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (!pass) failures++
  console.log(`${pass ? "PASS" : "FAIL"} · ${label}${pass ? "" : ` — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`)
}

function candidate(accession: string, companyName: string): Candidate {
  const signal: FormDSignal = {
    accessionNumber: accession,
    companyName,
    relatedPersons: [],
    filedAt: new Date().toISOString(),
  }
  return { signal } // no cik → enrichSignalFromFiling returns the signal as-is
}

async function main(): Promise<void> {
  // ── fresh filings are processed up to `max`, in scan order ────────────────
  {
    const store = new InMemoryStore()
    const processed: string[] = []
    const result = await runDetectCycle({
      store,
      max: 2,
      poll: async () => [candidate("0001-a", "Alpha"), candidate("0002-b", "Beta"), candidate("0003-c", "Gamma")],
      process: async (lead: Lead) => {
        processed.push(lead.signal.companyName)
        await store.upsertLead({ ...lead, status: LeadStatus.DETECTED })
        return lead
      },
    })
    check("scans all hits", result.scanned, 3)
    check("caps processing at max", processed, ["Alpha", "Beta"])
    check("reports processed companies", result.processed.map((p) => p.companyName), ["Alpha", "Beta"])
    check("nothing was known yet", result.known, 0)
  }

  // ── filings already in the store are skipped, never re-processed ──────────
  {
    const store = new InMemoryStore()
    const known = detectedLeadFromSignal(candidate("0001-a", "Alpha").signal)
    await store.upsertLead({ ...known, status: LeadStatus.SENT })
    const processed: string[] = []
    const result = await runDetectCycle({
      store,
      poll: async () => [candidate("0001-a", "Alpha"), candidate("0002-b", "Beta")],
      process: async (lead: Lead) => {
        processed.push(lead.signal.companyName)
        return lead
      },
    })
    check("known filing is skipped", result.known, 1)
    check("only the new filing runs", processed, ["Beta"])
    const stored = await store.getLead(known.id)
    check("existing lead untouched (still SENT)", stored?.status, LeadStatus.SENT)
  }

  // ── one lead failing does not abort the cycle ──────────────────────────────
  {
    const store = new InMemoryStore()
    const result = await runDetectCycle({
      store,
      max: 3,
      poll: async () => [candidate("0001-a", "Alpha"), candidate("0002-b", "Beta")],
      process: async (lead: Lead) => {
        if (lead.signal.companyName === "Alpha") throw new Error("pipeline exploded")
        return lead
      },
    })
    check("failure recorded per lead", result.errors.length, 1)
    check("failure carries the lead id", result.errors[0]?.id, detectedLeadFromSignal(candidate("0001-a", "x").signal).id)
    check("other lead still processed", result.processed.map((p) => p.companyName), ["Beta"])
  }

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`)
  if (failures > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
