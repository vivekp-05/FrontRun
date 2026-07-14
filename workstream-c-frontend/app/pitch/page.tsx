import type { Metadata } from "next"
import { ScrollProgress } from "@/components/landing/scroll-progress"
import { Hero } from "@/components/landing/hero"
import { Problem } from "@/components/landing/problem"
import { HowItRuns } from "@/components/landing/how-it-runs"
import { Close } from "@/components/landing/close"

export const metadata: Metadata = {
  title: "Frontrun — Reach them first.",
  description:
    "By the time the press releases, it's too late. Frontrun detects the raise the day it files — then researches, drafts, sends, and books. End to end.",
}

export default function PitchPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <ScrollProgress />
      <Hero />
      <Problem />
      <HowItRuns />
      <Close />
    </div>
  )
}
