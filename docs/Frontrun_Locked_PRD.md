# Frontrun — Locked PRD

**Hackathon:** Build Your Own AI Company
**Track:** Track 3 (AI Agent Company / Autonomous Workers), also reads as Track 1 (B2B SaaS)
**Team:** 4 generalists
**Build window:** 4–8 hours
**Status:** LOCKED

*(Name alternates if needed: Klaxon, Harbinger. Default is Frontrun.)*

---

## 1. One-liner

Frontrun is an autonomous SDR that detects the moment a company raises funding, researches it, finds the right contact, and runs the entire outreach conversation — send, reply triage, follow-up, and booking — as an AI employee, not a chatbot.

## 2. The problem

Recruiting and staffing agencies live or die on speed. A company that just raised a Series A will hire 20–50 people next quarter, and ten agencies race to reach them first. Whoever contacts the funded company on day one wins the deal. Small agencies lose because they find out late and reach out generically.

## 3. The user and the value

**Paying client:** recruiting / staffing agencies (e.g. Dana, runs a 6-person tech recruiting shop).
**Value:** Frontrun catches the raise the day the SEC Form D drops, hands Dana a researched, drafted, ready-to-send outreach before competitors even know the company raised, then handles replies and books the call. Speed + personalization + zero manual research.

## 4. The signal and why it's fresh (verified)

- **Trigger:** SEC **Form D** filing (a company just raised private capital). Appears in EDGAR full-text search **same-day**, free, no API key. Confirmed.
- **Confirmation layer:** You.com news search catching "Company X raised $Y" in real time.
- Form D gives real exec/director **names + company + mailing address** (no email — email is resolved downstream).
- Rejected freight/FMCSA because its data is ~weekly, not same-day. Funding is genuinely real-time.

## 5. Scope — IN for the hackathon

1. Scheduled job polls EDGAR Form D + You.com for newly funded companies.
2. Enrichment pipeline: company profile (You.com Research, cited) + web/contact scrape (Nimble) + email resolve (Nimble/Hunter fallback) + verify (Reoon).
3. Dashboard: leads as cards moving through a funnel, draft email ready per lead.
4. Outreach send via Resend, with delivered/opened status.
5. **Parallel demo:** 3 companies outreached at once (3 teammate inboxes as prospects).
6. Reply loop: inbound reply → triage agent summarizes + classifies **green / yellow / red** → decides next step and drafts it (follow-up, clarifier, or stop).
7. Booking detection via Cal.com `BOOKING_CREATED` webhook → lead marked booked.
8. Analytics strip (Hydra): reply rate, response time, green/red ratio.

## 6. Scope — OUT (say so in the demo, it reads as maturity)

- No LinkedIn automation. No official/legal API exists; automating it violates ToS. (Optional: draft a connection note for a human to send.)
- No real cold emails to real founders. Enrichment runs on real companies; sends route only to controlled demo inboxes.
- No EU contacts (GDPR minefield). US B2B only, CAN-SPAM compliant.
- No domain warmup / deliverability at scale (out of scope for a demo).

## 7. Architecture and sponsor mapping

| Layer | Tool | Sponsor prize |
|---|---|---|
| Backend: DB, auth, storage, functions | **InsForge** (agent-native, MCP) | InsForge ($500/300/100) |
| Company research (cited) | **You.com** Research API | You.com ($1,000) |
| Web + contact enrichment | **Nimble** (5,000 credits) | GTM: Nimble + Kylon |
| Email resolve fallback | Hunter.io (50/mo) | — |
| Email verify | Reoon (600/mo) | — |
| Enrich→verify→draft as one MCP tool | **RocketRide** pipeline | RocketRide ($500) |
| Multi-agent coordination + reply triage | **Band** | Band ($500) |
| Reply-rate / funnel analytics | **Hydra DB** (columnar) | Hydra (6mo + tokens) |
| Send + inbound replies | Resend | — |
| Booking detection | Cal.com webhook | — |

One build, seven prize surfaces.

## 8. Lead lifecycle (the dashboard state machine)

`DETECTED` → `ENRICHED` → `DRAFTED` → `SENT` → `DELIVERED` → (`OPENED`) → `REPLIED` → classify → `GREEN` / `YELLOW` / `RED` → `FOLLOW_UP_DRAFTED` → `BOOKED`

- Green = interested → draft follow-up / booking nudge.
- Yellow = neutral or question → draft clarifier.
- Red = not interested → mark lost, stop.
- `OPENED` is directional only (pixel unreliable). `DELIVERED` and `REPLIED` are the trustworthy signals.

## 9. Data sources (all verified free, live 2026)

- SEC EDGAR Form D full-text search — free, keyless (needs descriptive User-Agent header).
- You.com Search + Research API — $100 free credits/participant.
- Nimble Web/Leads API — 5,000 free credits/participant.
- Hunter.io — 50 free lookups/mo. Reoon — 600 free verify/mo.
- Resend — 3,000 emails/mo, 100/day; inbound `email.received` webhook + delivery webhooks.
- Cal.com — free plan includes `BOOKING_CREATED` webhook.

## 10. Demo script (~3 min, honest)

1. **Real detection (live):** Frontrun's feed shows real companies that filed Form D recently. Click one — real cited You.com brief, real Nimble enrichment, real founder name + resolved email shown in the dashboard, drafted email ready. "This is a real company that really just raised. We found the founder's real email. We are not going to email them."
2. **Parallel outreach (controlled):** 3 seeded demo companies whose founder inboxes are our own. Hit "Run outreach." All 3 send via Resend, dashboard shows Sent → Delivered in real time.
3. **Reply triage (live):** We reply from the 3 inboxes — one positive, one "who are you?", one "not interested." The triage agent summarizes each and flips them green / yellow / red, then drafts the correct next step per lead.
4. **Booking:** Book the Cal.com link from the green inbox. Lead flips to `BOOKED`. Analytics strip updates.
5. Close on the honesty line + the "AI employee that runs the whole loop" framing.

## 11. Tech stack (locked)

- **Frontend + app:** Next.js (App Router) + shadcn/ui + Tailwind. Build with the `frontend-design` skill + shadcn MCP.
- **Backend:** InsForge (Postgres, auth, storage, functions) via its MCP.
- **Agents:** Band for orchestration; agent logic in TypeScript (keep it in-repo). Pydantic/CrewAI only if a Python side-service is needed for the pipeline.
- **Heavy pipeline:** RocketRide as one MCP tool (enrich → verify → draft).
- **Email:** Resend (send + inbound webhooks). **Booking:** Cal.com.
- **Analytics:** Hydra DB for aggregations feeding the dashboard strip.
- Every external capability behind a thin interface (`search`, `scrape`, `resolveEmail`, `verify`, `store`, `send`, `analytics`) so sponsors swap by config.

## 12. Four-way work split (parallel, clean merge points)

Everyone works against a shared `types.ts` (the Lead object + status enum) agreed in the first 20 minutes. That contract is the merge boundary.

**A — Backend + data (InsForge, schema, state machine)**
- Stand up InsForge via MCP: `leads` table matching `types.ts`, auth, storage.
- Implement lifecycle transitions + status API the frontend and agents call.
- Wire Hydra analytics view (reply rate, funnel counts).
- Owns: the Lead contract, persistence, InsForge prize.

**B — Signal + enrichment pipeline (RocketRide, You.com, Nimble)**
- Form D poller (EDGAR full-text) + You.com confirmation → emits `DETECTED` leads.
- Enrichment: You.com Research brief + Nimble scrape + email resolve (Nimble/Hunter) + Reoon verify.
- Package enrich→verify→draft as one RocketRide MCP tool.
- Owns: You.com + Nimble + RocketRide prizes.

**C — Frontend dashboard (Next.js + shadcn)**
- Lead cards + funnel columns, live status via polling/subscription.
- Draft-email view, "Run outreach" action, analytics strip.
- Red/yellow/green states, booking indicator. Build with frontend-design skill + shadcn MCP.
- Owns: the demo's visual wow.

**D — Outreach + reply loop (Resend, Band triage agent, Cal.com)**
- Send via Resend, capture delivered/opened webhooks.
- Inbound `email.received` webhook → **Band-orchestrated triage agent**: summarize, classify green/yellow/red, draft next step.
- Cal.com `BOOKING_CREATED` webhook → mark booked.
- Seed the 3 demo companies + own the demo run.
- Owns: Band prize + the reply-loop wow.

**Integration checkpoints:** at hour 3 (contract + one lead flows end to end with fake data), hour 5 (real detection + real enrichment working), hour 7 (full send→reply→book loop on demo inboxes), hour 8 (demo rehearsal + fallback recording).

## 13. Timeline (8-hour version)

- **0:00–0:30** Lock `types.ts`, spin up InsForge + Next.js repo, everyone unblocked.
- **0:30–3:00** Parallel build of each workstream against fake data.
- **3:00** Checkpoint 1: one lead flows DETECTED→DRAFTED with mocked enrichment.
- **3:00–5:00** Wire real Form D + You.com + Nimble.
- **5:00** Checkpoint 2: real detection + enrichment live.
- **5:00–7:00** Outreach + reply triage + Cal.com booking on demo inboxes.
- **7:00** Checkpoint 3: full loop works, 3 companies parallel.
- **7:00–8:00** Polish, analytics strip, **record a fallback demo video**, rehearse the 3-min script.

## 14. Risks and mitigations

- **Email verify is probabilistic** (Gmail/catch-all return OK). Mitigation: show confidence tiers, don't claim certainty.
- **Open tracking flaky.** Mitigation: lead on Delivered + Replied, treat Opened as a nice-to-have.
- **Band/Kylon setup unverified (MCP, free tier).** Mitigation: confirm at kickoff; if Band blocks, fall back to a plain orchestrator and still demo the triage agent (lose only the Band prize, not the loop).
- **Live demo network risk.** Mitigation: record a fallback video at hour 7:30.
- **No paid API calls / money-spend without explicit team decision.** Anything that would cost money gets flagged, not auto-run.

## 15. Definition of done (verification)

- A real Form D company appears in the feed with a real cited brief and a real resolved email in the UI.
- 3 demo companies send in parallel and reach Delivered.
- 3 replies get correctly classified green/yellow/red with a drafted next step each.
- One Cal.com booking flips a lead to BOOKED and updates analytics.
- Fallback demo video recorded.
