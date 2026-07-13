# Frontrun

> An autonomous SDR that detects the moment a company raises funding, researches it,
> finds the right contact, and runs the entire outreach conversation — send, reply
> triage, follow-up, and booking — as an AI employee, not a chatbot.

**Hackathon:** Build Your Own AI Company · **Build window:** 4–8h · Full spec: [`docs/Frontrun_Locked_PRD.md`](docs/Frontrun_Locked_PRD.md)

---

## The one rule

Everyone imports the Lead contract from [`shared/types.ts`](shared/types.ts).
**That file is the merge boundary.** Don't change it without pinging the team.

## Repo layout

```
frontrun-app/
├── shared/                    # THE contract — types.ts (Lead + LeadStatus)
├── workstream-a-backend/      # A · InsForge DB, schema, state machine, Hydra analytics
├── workstream-b-pipeline/     # B · Form D poller, You.com + Nimble + RocketRide enrich
├── workstream-c-frontend/     # C · Next.js + shadcn dashboard, funnel, draft view
├── workstream-d-outreach/     # D · Resend send, Band reply triage, Cal.com booking
└── docs/                      # PRD + notes
```

## Who owns what

| Branch | Owner | Workstream | Sponsor prizes |
|---|---|---|---|
| `workstream-a-backend`  | A | Backend + data (InsForge, state machine) | InsForge, Hydra |
| `workstream-b-pipeline` | B | Signal + enrichment (RocketRide, You.com, Nimble) | You.com, Nimble, RocketRide |
| `workstream-c-frontend` | C | Dashboard (Next.js + shadcn) | visual wow |
| `workstream-d-outreach` | D | Outreach + reply loop (Resend, Band, Cal.com) | Band |

## Getting started

```bash
git clone https://github.com/sharique2004/Frontrun.git
cd Frontrun
git checkout workstream-a-backend   # ← your branch
cp .env.example .env.local          # fill in your keys
```

Work on your branch. Merge to `main` at the integration checkpoints.

## Integration checkpoints (PRD §12)

- **Hour 3** — contract locked + one lead flows `DETECTED → DRAFTED` with fake data.
- **Hour 5** — real Form D detection + real enrichment live.
- **Hour 7** — full `send → reply → book` loop on the 3 demo inboxes.
- **Hour 8** — demo rehearsal + fallback video recorded.

## Lead lifecycle

```
DETECTED → ENRICHED → DRAFTED → SENT → DELIVERED → (OPENED) → REPLIED
         → classify → GREEN / YELLOW / RED → FOLLOW_UP_DRAFTED → BOOKED
```
