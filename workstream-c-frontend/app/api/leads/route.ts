/**
 * GET /api/leads — live leads from A's InsForge StoreProvider.
 * On any failure returns 200 + empty list so the dashboard falls back to the sim.
 *
 * Doubles as the realtime heartbeat: the dashboard polls this every 4s, and at
 * most once per DETECT_INTERVAL_MS we piggyback a detection cycle via after()
 * (runs post-response — the poll itself stays fast). New Form D companies then
 * land in the store and show up on the very next poll.
 */
import { after } from "next/server"
import { store } from "@a/store"
import { triggerDetectIfDue } from "@/lib/server/detect-trigger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Covers the after() detection work, not the response (which returns in <1s).
export const maxDuration = 60

export async function GET() {
  const detect = triggerDetectIfDue()
  if (detect) after(detect)

  try {
    const leads = await store.listLeads()
    return Response.json({ leads })
  } catch (err) {
    return Response.json({ leads: [], error: String(err) })
  }
}
