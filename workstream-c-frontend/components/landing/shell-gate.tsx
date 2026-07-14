"use client"

import { usePathname } from "next/navigation"
import { AppShell } from "@/components/frontrun/app-shell"

/**
 * Routes render inside the dashboard AppShell, except the standalone full-bleed
 * surfaces: the marketing pitch (/pitch) and the access gate (/gate).
 */
const FULL_BLEED = new Set(["/pitch", "/gate"])

export function ShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (FULL_BLEED.has(pathname)) return <>{children}</>
  return <AppShell>{children}</AppShell>
}
