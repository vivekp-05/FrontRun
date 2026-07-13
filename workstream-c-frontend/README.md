# Workstream C — Frontend Dashboard

**Branch:** `workstream-c-frontend` · **Owns:** the demo's visual wow.

## Your job (PRD §12C)

- **Lead cards** in **funnel columns** by `LeadStatus`, live via polling/subscription to A's status API.
- **Draft-email view** per lead (subject + body + cited brief + resolved email w/ confidence tier).
- **"Run outreach"** action → calls D's send. Show `Sent → Delivered` in real time.
- **Red / yellow / green** reply states, **booking** indicator, **analytics strip** (`FunnelAnalytics`).

## Build with

Next.js (App Router) + **shadcn/ui** + Tailwind. Use the `frontend-design` skill + shadcn MCP.

## Data contract

Render the `Lead` shape from [`shared/types.ts`](../shared/types.ts). Read from A's `StoreProvider`
(`listLeads`, `getLead`) and `AnalyticsProvider` (`funnel`). Trigger D's send on "Run outreach".

## First moves

1. `npx create-next-app@latest .` inside this folder (TypeScript, App Router, Tailwind).
2. `npx shadcn@latest init` + add card/badge/button.
3. Render mocked `Lead[]` immediately — don't wait on A. Swap to the real API at checkpoint 1.

## Definition of done

- Funnel board renders live leads by status.
- Draft view shows cited brief + resolved email + confidence.
- Analytics strip updates. `OPENED` shown as directional only.

## Notes

- Lead on **Delivered + Replied** as trustworthy; `OPENED` is a nice-to-have (pixel unreliable).
- 3 demo leads (`isDemo: true`) drive the parallel-outreach moment.
