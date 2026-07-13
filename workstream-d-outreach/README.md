# Workstream D — Outreach + Reply Loop

**Branch:** `workstream-d-outreach` · **Owns:** Band prize + the reply-loop wow.

## Your job (PRD §12D)

- **Send** via Resend; capture `delivered` / `opened` webhooks → `OutreachStatus`.
- **Inbound** `email.received` webhook → **Band-orchestrated triage agent**: summarize the reply,
  classify **green / yellow / red**, draft the correct next step → `ReplyEvent`.
- **Cal.com** `BOOKING_CREATED` webhook → mark lead `BOOKED`.
- **Seed the 3 demo companies** (`isDemo: true`, founder inboxes = your own) + own the demo run.

## Interfaces you implement

`SendProvider` in `shared/types.ts`. You write back `outreach`, `replies`, and drive transitions
`SENT → DELIVERED → REPLIED → GREEN/YELLOW/RED → FOLLOW_UP_DRAFTED → BOOKED` via A's `transition()`.

## Triage classification (PRD §8)

- **green** = interested → draft follow-up / booking nudge.
- **yellow** = neutral / question → draft clarifier.
- **red** = not interested → mark `LOST`, stop.

## First moves

1. Confirm Band MCP works at kickoff. **Fallback:** if Band blocks, use a plain orchestrator —
   still demo the triage agent, lose only the Band prize (PRD §14).
2. Wire Resend send + delivery webhook on one demo inbox.
3. Add inbound-reply webhook → triage → classification. Cal.com booking last.

## Definition of done

- 3 demo companies send in parallel and reach `Delivered`.
- 3 replies classified green/yellow/red, each with a drafted next step.
- One Cal.com booking flips a lead to `BOOKED` + updates analytics.

## Files

```
workstream-d-outreach/
├── send.ts           # SendProvider impl (Resend)
├── webhooks.ts       # Resend delivery + inbound, Cal.com BOOKING_CREATED
├── triage.ts         # Band agent: summarize → classify → draft next step
└── seed.ts           # the 3 demo companies
```
