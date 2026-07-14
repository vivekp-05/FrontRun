"use client"

import { useEffect } from "react"
import { useFrontrunStore } from "@/lib/ui/store"

/**
 * Data source controller. Polls A's real backend (/api/leads) on an interval.
 * - When real leads come back → go LIVE (and stop the sim if it was running).
 * - Until then → run the client-side simulation so the dashboard is never empty.
 * This keeps retrying, so a cold/slow backend on first load no longer pins the
 * app in demo mode forever — it upgrades to live as soon as data is reachable.
 */
export function SimulationController() {
  const hydrate = useFrontrunStore((s) => s.hydrateFromBackend)
  const start = useFrontrunStore((s) => s.startSimulation)
  const stop = useFrontrunStore((s) => s.stopSimulation)

  useEffect(() => {
    let cancelled = false
    let simming = false
    let isLive = false

    const tick = async () => {
      const ok = await hydrate()
      if (cancelled) return
      if (ok) {
        isLive = true
        if (simming) {
          stop() // real data arrived — drop the simulation
          simming = false
        }
      } else if (!isLive && !simming) {
        start() // backend not reachable yet — simulate in the meantime
        simming = true
      }
    }

    void tick() // immediate attempt
    const poll = setInterval(() => void tick(), 4000)

    return () => {
      cancelled = true
      clearInterval(poll)
      stop()
    }
  }, [hydrate, start, stop])

  return null
}
