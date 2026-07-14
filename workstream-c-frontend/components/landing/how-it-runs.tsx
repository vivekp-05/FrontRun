import { Reveal } from "./reveal"

/** One stage in the pipeline flow. */
type Stage = {
  n: string
  title: string
  sponsor: string
  body: string
  live?: boolean
}

const LANE_A: Stage[] = [
  { n: "01", title: "Detect", sponsor: "SEC EDGAR", body: "Form D filing, caught same-day.", live: true },
  { n: "02", title: "Research", sponsor: "You.com", body: "Cited brief — confirms the raise." },
  { n: "03", title: "Enrich", sponsor: "Nimble · Hunter · Reoon", body: "Founder + verified email." },
  { n: "04", title: "Draft", sponsor: "RocketRide", body: "Personalized outreach, ready." },
]

const LANE_B: Stage[] = [
  { n: "05", title: "Send", sponsor: "Resend", body: "Sent → delivered, controlled inboxes." },
  { n: "06", title: "Triage", sponsor: "Band", body: "3 agents → green / yellow / red.", live: true },
  { n: "07", title: "Book", sponsor: "Cal.com", body: "Green → meeting booked." },
]

function StageCard({ s }: { s: Stage }) {
  return (
    <div className="relative flex-1 rounded-lg border border-line bg-surface p-4 min-w-[150px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
          {s.n}
        </span>
        {s.live && (
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-signal">
            <span className="size-1.5 rounded-full bg-signal" />
            live
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-fg">
        {s.title}
      </h3>
      <p className="mt-1 text-[13px] leading-snug text-fg-muted">{s.body}</p>
      <span className="mt-3 inline-block rounded-md border border-line bg-inset px-2 py-1 font-mono text-[10px] tracking-wide text-fg-subtle">
        {s.sponsor}
      </span>
    </div>
  )
}

function Lane({ label, tag, stages }: { label: string; tag: string; stages: Stage[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[11px] font-medium tracking-wide text-fg">{label}</span>
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">{tag}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {stages.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <StageCard s={s} />
            {i < stages.length - 1 && (
              <span aria-hidden className="hidden shrink-0 text-fg-faint sm:block">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function HowItRuns() {
  return (
    <section className="border-t border-line bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-28 md:py-32">
        <Reveal>
          <p className="kicker">04 / How it runs</p>
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-fg md:text-5xl">
            Signal to booked meeting —
            <br />
            one autonomous loop.
          </h2>
          <p className="mt-6 max-w-xl leading-relaxed text-fg-muted">
            Every stage is a real integration, running on live data. A company
            files, and Frontrun researches, drafts, sends, triages the reply, and
            books — writing every state to InsForge as it goes.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-12 flex flex-col gap-6">
            <Lane label="Signal & enrichment" tag="detect → draft" stages={LANE_A} />
            <div className="flex justify-center text-fg-faint" aria-hidden>↓</div>
            <Lane label="Outreach & reply loop" tag="send → book" stages={LANE_B} />
          </div>
        </Reveal>

        {/* Foundation */}
        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-4">
              <span className="inline-block rounded-md border border-line bg-inset px-2 py-1 font-mono text-[10px] tracking-wide text-fg-subtle">
                InsForge
              </span>
              <p className="mt-2.5 text-[13px] leading-snug text-fg-muted">
                Postgres source of truth · guarded state machine · Claude model
                gateway. Every stage persists here.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4">
              <span className="inline-block rounded-md border border-line bg-inset px-2 py-1 font-mono text-[10px] tracking-wide text-fg-subtle">
                Hydra
              </span>
              <p className="mt-2.5 text-[13px] leading-snug text-fg-muted">
                Funnel analytics — reply rate, response time, green/red ratio.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Lifecycle ribbon */}
        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-fg-subtle">
            {[
              "detected", "enriched", "drafted", "sent", "delivered", "replied",
            ].map((s) => (
              <span key={s} className="rounded border border-line px-2 py-1">{s}</span>
            ))}
            <span className="rounded border border-signal/40 px-2 py-1 text-signal">green</span>
            <span className="rounded border border-line px-2 py-1">follow-up</span>
            <span className="rounded border border-signal/40 px-2 py-1 text-signal">booked</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
