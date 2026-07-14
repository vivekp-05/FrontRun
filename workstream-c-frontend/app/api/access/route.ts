/**
 * POST /api/access — validate the submitted access key and, on success, set the
 * httpOnly `frontrun_access` cookie that the middleware checks. Public route.
 */
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const key = process.env.DASHBOARD_ACCESS_KEY
  let submitted = ""
  try {
    const body = (await req.json()) as { key?: unknown }
    submitted = String(body?.key ?? "").trim()
  } catch {
    /* no/invalid body → treated as wrong key */
  }

  if (!key || submitted !== key) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const jar = await cookies()
  jar.set("frontrun_access", key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // allow http on localhost
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return Response.json({ ok: true })
}
