/**
 * GET /api/cron/detect — run one detection cycle on demand.
 *
 * Two callers, two credentials (the proxy gate exempts /api/cron/*, so this
 * route authenticates itself):
 *   - Vercel Cron (vercel.json, daily backstop) sends Authorization: Bearer
 *     ${CRON_SECRET} when that env var is set on the project
 *   - an unlocked dashboard browser (frontrun_access cookie) may trigger one
 *     manually, e.g. right before a demo
 * Anything else is refused. No secret configured → the bearer path stays
 * impossible (fails closed); only the cookie path can unlock it.
 */
import { cookies } from "next/headers"
import { store } from "@a/store"
import { runDetectCycle } from "@b/detect"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const bearerOk = Boolean(cronSecret) && req.headers.get("authorization") === `Bearer ${cronSecret}`

  const accessKey = process.env.DASHBOARD_ACCESS_KEY
  const jar = await cookies()
  const cookieOk = Boolean(accessKey) && jar.get("frontrun_access")?.value === accessKey

  if (!bearerOk && !cookieOk) {
    return Response.json({ ok: false, error: "cron secret or dashboard access required" }, { status: 401 })
  }

  const max = Number(process.env.DETECT_MAX_PER_CYCLE ?? 2)
  try {
    const result = await runDetectCycle({ store, max })
    return Response.json({ ok: true, ...result })
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
