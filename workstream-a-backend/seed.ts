/**
 * Workstream A — seed leads so C can render and B/D can transition by hour 3.
 * These are real SEC Form D companies (pulled 2026-07-13) plus the 3 controlled
 * demo companies for the parallel-outreach demo (isDemo = true). B replaces the
 * real ones with live detection; the demo trio stays.
 *
 * The demo trio comes from Workstream D's seed (the ONE canonical set): it has
 * contact + draft filled, so "Run outreach" can actually send it (D's
 * requireSendable). Inboxes come from DEMO_INBOX_1..3.
 */
import { Lead, LeadStatus } from "../shared/types";
import { demoLeads } from "../workstream-d-outreach/seed";

function iso(d = new Date()): string {
  return d.toISOString();
}

function makeLead(p: {
  id: string;
  company: string;
  persons: string[];
  amount: string;
  filedAt: string;
  address: string;
  isDemo?: boolean;
  status?: LeadStatus;
}): Lead {
  const t = iso();
  return {
    id: p.id,
    status: p.status ?? LeadStatus.DETECTED,
    isDemo: p.isDemo ?? false,
    signal: {
      accessionNumber: `demo-${p.id}`,
      companyName: p.company,
      relatedPersons: p.persons,
      address: p.address,
      amountRaised: p.amount,
      filedAt: p.filedAt,
      edgarUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${p.id}&type=D`,
    },
    createdAt: t,
    updatedAt: t,
    replies: [],
  };
}

/** Real SEC Form D leads (start at DETECTED — B enriches them). */
export const REAL_SEED: Lead[] = [
  makeLead({ id: "1708694", company: "Point2 Technology Inc.", persons: ["Jinho Park", "Jay Jeong"], amount: "62557918", filedAt: "2026-06-26", address: "100 Century Center Ct Ste 415, San Jose, CA 95112" }),
  makeLead({ id: "1716702", company: "PatientFi, Inc.", persons: ["Todd Watts", "Derrick Hoag"], amount: "13000000", filedAt: "2026-06-15", address: "530 Technology Drive Suite 350, Irvine, CA 92618" }),
  makeLead({ id: "2141371", company: "Choice AI Inc.", persons: ["Neha Mittal"], amount: "18694940", filedAt: "2026-06-24", address: "945 Market St Suite 501, San Francisco, CA 94103" }),
];

/** 3 controlled demo companies (D's canonical sendable trio, start DRAFTED). */
export const DEMO_SEED: Lead[] = demoLeads();

export const SEED_LEADS: Lead[] = [...DEMO_SEED, ...REAL_SEED];

/** Load the seed into any StoreProvider — but NEVER reset a lead that already
 *  exists (a mid-demo restart with SEED_DEMO=1 must not wipe in-flight demo
 *  leads back to DRAFTED). Returns how many were actually inserted. */
export async function seedInto(store: {
  upsertLead: (l: Lead) => Promise<Lead>;
  getLead?: (id: string) => Promise<Lead | null>;
}): Promise<number> {
  let inserted = 0;
  for (const l of SEED_LEADS) {
    if (store.getLead && (await store.getLead(l.id))) continue;
    await store.upsertLead(l);
    inserted++;
  }
  return inserted;
}
