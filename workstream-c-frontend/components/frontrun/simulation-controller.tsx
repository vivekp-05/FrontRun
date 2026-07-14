"use client"

import { useEffect } from "react"
import { useFrontrunStore } from "@/lib/ui/store"

/**
 * LIVE data controller. Polls A's real backend (/api/leads) and reflects real
 * state — cards only move when the backend actually changes (a real send /
 * reply / booking). The client-side simulation is intentionally NOT auto-started
 * (it made the funnel shuffle on its own); it stays available only behind the
 * manual play/pause toggle in the top bar for offline demos.
 */
export function SimulationController() {
  const hydrate = useFrontrunStore((s) => s.hydrateFromBackend)
  const stop = useFrontrunStore((s) => s.stopSimulation)

  useEffect(() => {
    let cancelled = false
    stop() // ensure no auto-simulation is running — the dashboard is live-only

    const tick = () => {
      if (!cancelled) void hydrate()
    }
    tick() // immediate
    const poll = setInterval(tick, 4000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [hydrate, stop])

  return null
}
