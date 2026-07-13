# Workstream B — Signal + Enrichment Pipeline

**Branch:** `workstream-b-pipeline` · **Owns:** You.com + Nimble + RocketRide prizes.

## Your job (PRD §12B)

- **Form D poller:** EDGAR full-text search for new Form D filings → emit `DETECTED` leads (`FormDSignal`).
- **Confirmation:** You.com news search — "Company X raised $Y" → set `fundingConfirmed`.
- **Enrichment:** You.com Research (cited `CompanyBrief`) + Nimble scrape (`Contact`) + email resolve (Nimble → Hunter fallback) + Reoon verify (`EmailConfidence`).
- Package **enrich → verify → draft** as **one RocketRide MCP tool**.

## Interfaces you implement

`SearchProvider`, `ScrapeProvider`, `ResolveEmailProvider`, `VerifyProvider` in `shared/types.ts`.
You produce a `Lead` with `signal` + `brief` + `contact` + `draft` filled, then hand to A's `StoreProvider`.

## Key facts (verified, PRD §4/§9)

- EDGAR full-text search is **free, keyless, same-day** — but needs a descriptive `User-Agent` header (`EDGAR_USER_AGENT`).
- Form D gives **real exec/director names + company + mailing address**. No email → resolve downstream.
- Email verify is **probabilistic** — set confidence tiers, never claim certainty.

## First moves

1. Hit EDGAR full-text search, parse the most recent Form D filings.
2. Mock the enrichment output first (so A/C unblock), then wire You.com → Nimble → Reoon.
3. Build the RocketRide pipeline tool last, once the steps work standalone.

## Definition of done

- A real Form D company appears with a real cited brief + real resolved email.
- `enrich→verify→draft` runs as one callable RocketRide tool.

## Files

```
workstream-b-pipeline/
├── pollFormD.ts      # EDGAR full-text poller → FormDSignal
├── confirm.ts        # You.com news confirmation
├── enrich.ts         # You.com Research + Nimble + Hunter + Reoon
├── draft.ts          # generate EmailDraft
└── rocketride.ts     # enrich→verify→draft as one MCP tool
```
