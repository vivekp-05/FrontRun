# Workstream A — Backend + Data

**Branch:** `workstream-a-backend` · **Owns:** the Lead contract, persistence, InsForge + Hydra prizes.

## Your job (PRD §12A)

- Stand up **InsForge** via its MCP: a `leads` table matching [`shared/types.ts`](../shared/types.ts), plus auth + storage.
- Implement the **lifecycle state machine** — enforce `LEAD_TRANSITIONS` from `types.ts`. Reject illegal jumps.
- Expose a **status API** the frontend (C) and agents (B, D) call: `upsertLead`, `getLead`, `listLeads`, `transition`.
- Wire the **Hydra analytics view**: reply rate, funnel counts, green/red ratio → `FunnelAnalytics`.

## Interfaces you implement

`StoreProvider` and `AnalyticsProvider` in `shared/types.ts`. Everyone else calls these — keep the shape stable.

## First moves

1. Confirm InsForge MCP is connected at kickoff (risk: unverified — PRD §14).
2. Create `leads` table: columns mirror the `Lead` interface (store nested objects as JSONB).
3. Seed one fake lead so C can render and B/D can transition it by hour 3.

## Definition of done

- CRUD + `transition()` enforcing the state machine, callable over HTTP/MCP.
- Analytics endpoint returns live funnel counts.
- One fake lead flows `DETECTED → DRAFTED` end-to-end at checkpoint 1.

## Files

```
workstream-a-backend/
├── schema.sql        # leads table (mirror shared/types.ts::Lead)
├── store.ts          # StoreProvider impl (InsForge)
├── analytics.ts      # AnalyticsProvider impl (Hydra)
└── stateMachine.ts   # transition() guard using LEAD_TRANSITIONS
```
