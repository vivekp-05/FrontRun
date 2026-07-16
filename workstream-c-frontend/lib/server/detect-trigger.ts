/**
 * Lazy live-detection trigger — how the dashboard stays "realtime" on a plan
 * with no frequent crons. The dashboard already polls GET /api/leads every 4s;
 * that route calls triggerDetectIfDue() and, at most once per interval, gets
 * back a work function it schedules with next/server's after() — so detection
 * runs right after the response, off the request's critical path.
 *
 * The throttle state is per warm lambda instance. A cold instance may run one
 * extra cycle — harmless, because the cycle dedups against the store by id.
 */
import { store } from "@a/store"
import { runDetectCycle } from "@b/detect"

let lastAttemptAt = 0
let inFlight = false

function intervalMs(): number {
  return Number(process.env.DETECT_INTERVAL_MS ?? 120_000)
}

function maxPerCycle(): number {
  return Number(process.env.DETECT_MAX_PER_CYCLE ?? 2)
}

/** Returns the cycle to schedule (via after()) when one is due, else null. */
export function triggerDetectIfDue(): (() => Promise<void>) | null {
  if (process.env.DETECT_DISABLED === "1") return null
  if (inFlight || Date.now() - lastAttemptAt < intervalMs()) return null
  lastAttemptAt = Date.now()
  inFlight = true

  return async () => {
    try {
      const result = await runDetectCycle({ store, max: maxPerCycle() })
      if (result.processed.length > 0 || result.errors.length > 0) {
        console.log(
          `[detect] scanned=${result.scanned} known=${result.known}` +
            ` new=[${result.processed.map((p) => p.companyName).join(", ")}]` +
            (result.errors.length ? ` errors=${JSON.stringify(result.errors)}` : ""),
        )
      }
    } catch (err) {
      console.error("[detect] cycle failed:", err)
    } finally {
      inFlight = false
    }
  }
}
