# phases.md — Implementation Roadmap — SupportFlow AI

**Reads:** Architecture.md, PRD.md, design.md, FAD.md, FTL.md
**Status:** Draft v1.0 — 12-hour hackathon roadmap

---

## How to read this document

Each phase lists an objective, concrete tasks, expected output, dependencies, and a definition of done. Every task is tagged:

- **[MVP]** — Hackathon Critical. Required for the four demo scenarios to work end-to-end.
- **[OPT]** — Optional / Future. Only attempt if ahead of schedule.

Total budget: ~12 hours. Suggested time allocation is given per phase; adjust live based on team size (see Resource_Chart.md).

---

## Phase 1 — Project setup (Target: 0:00–0:45)

**Objective:** Get a running skeleton for client, server, and AI module with shared env config.

**Tasks:**
- [MVP] Initialize monorepo structure (`client/`, `server/`, `ai/`, `knowledge/`, `docs/`).
- [MVP] Scaffold React + Vite + Tailwind client; scaffold Express server.
- [MVP] Set up `.env` / `.env.example` with `LLM_PROVIDER`, `LLM_API_KEY`, `MONGODB_URI`.
- [MVP] Connect server to MongoDB (local or Atlas) with a health-check route.
- [OPT] CI lint/format hooks.

**Expected output:** `GET /health` returns 200; client dev server renders a blank shell; server connects to DB.

**Dependencies:** None.

**Definition of done:** Both client and server run locally with `npm run dev`; DB connection confirmed in logs.

---

## Phase 2 — Database and mock data (Target: 0:45–1:45)

**Objective:** Model and seed all domain data needed for the four demo scenarios.

**Tasks:**
- [MVP] Define Mongoose schemas: `Customer`, `Order`, `Payment`, `Ticket` (with embedded `Investigation`), `KnowledgeDocument`.
- [MVP] Write a seed script producing realistic mock data, including the exact records needed for Scenarios 1–4 (e.g. a cancelled-but-charged order, a customer with 3 prior unresolved tickets).
- [MVP] Write the 6 policy documents (`refund_policy`, `cancellation_policy`, `payment_policy`, `shipping_policy`, `account_policy`, `product_faq`) as plain text/markdown source files in `knowledge/`.
- [OPT] Seed additional "noise" data (unrelated customers/orders) to make the demo feel real rather than curated.

**Expected output:** Seeded MongoDB with enough data to run all four demo scenarios plus a few extras.

**Dependencies:** Phase 1.

**Definition of done:** Seed script runs idempotently; querying the DB directly confirms the Scenario 1–4 fixtures exist.

---

## Phase 3 — Backend APIs (Target: 1:45–3:15)

**Objective:** Build the Tool Layer and core REST endpoints, independent of AI logic.

**Tasks:**
- [MVP] Implement tool functions: `get_customer`, `get_order`, `get_payment`, `get_previous_tickets`, `create_refund_request`, `update_ticket`, `escalate_ticket` as plain backend functions with fixed schemas (FTL.md §4).
- [MVP] Implement `POST /api/conversations/:id/message` (Conversation API, Architecture.md §4.3) — stubbed to echo for now, wired to orchestrator in Phase 4.
- [MVP] Implement ticket/dashboard endpoints: `GET /api/tickets`, `GET /api/tickets/:id`, `PATCH /api/tickets/:id`.
- [OPT] Basic request logging middleware.

**Expected output:** All tool functions independently testable via Postman/curl; ticket CRUD endpoints functional against seeded data.

**Dependencies:** Phase 2.

**Definition of done:** Every tool function returns correct data for at least one seeded fixture; ticket endpoints return seeded tickets.

---

## Phase 4 — AI agent / orchestrator (Target: 3:15–5:45)

**Objective:** Build the reasoning loop — the core differentiator of the project.

**Tasks:**
- [MVP] Implement LLM Client wrapper (`ai/llmClient.js`) with provider abstraction per `LLM_PROVIDER`.
- [MVP] Implement Intent & Signal classification (FTL.md §3).
- [MVP] Implement Identity resolution (simple: match by demo-selected customer or email in message).
- [MVP] Implement tool-selection + Investigation Module (FTL.md §4).
- [MVP] Implement Reasoning Module + structured decision parsing (FTL.md §7).
- [MVP] Implement Escalation Module deterministic rules (FTL.md §6).
- [MVP] Implement Action Module for `create_refund_request` / `update_ticket` (FTL.md §8).
- [MVP] Implement Response Module (FTL.md §9).
- [MVP] Wire error handling per FTL.md §10 (at minimum: tool failure → evidence error flag; LLM failure → escalate).
- [OPT] Streaming responses to the client.

**Expected output:** `POST /api/conversations/:id/message` runs the full pipeline and returns a real decision + reply for at least Scenario 1 and Scenario 3 inputs.

**Dependencies:** Phase 3.

**Definition of done:** Manually testing all four demo scenario inputs against the API produces the expected decision type (resolve / resolve_with_action / escalate) with a populated `Investigation` object.

---

## Phase 5 — RAG / knowledge base (Target: 5:45–7:00)

**Objective:** Stand up semantic retrieval over the 6 policy documents.

**Tasks:**
- [MVP] Write embedding/indexing script (Python, Sentence Transformers) that chunks the 6 policy docs and builds a FAISS index at startup/build time.
- [MVP] Expose retrieval via `search_knowledge_base()` tool — bridged from Node to the Python process (see TAD.md for exact interop approach) or run as a small internal HTTP service called by the orchestrator.
- [MVP] Wire retrieval results into the Reasoning Module's evidence bundle (FTL.md §5).
- [OPT] Add a simple admin-only endpoint to re-index if documents change.

**Expected output:** A refund-related query returns relevant `refund_policy` chunks with similarity scores; irrelevant queries return nothing above threshold.

**Dependencies:** Phase 2 (documents exist), Phase 4 (orchestrator exists to consume retrieval).

**Definition of done:** Scenario 2 and 3 test inputs produce non-empty, correctly-sourced policy retrieval in the Investigation record.

---

## Phase 6 — Customer UI (Target: 7:00–8:30)

**Objective:** Build the customer chat surface per design.md §7–8.

**Tasks:**
- [MVP] Chat layout (message list + input), styled per design.md tokens.
- [MVP] Investigation status line during processing (design.md §7).
- [MVP] Resolution/escalation message rendering with outcome + reference number.
- [OPT] Investigation timeline component reused visually for a "see details" expandable view in customer chat (usually dashboard-only, but nice if time allows).

**Expected output:** A customer can type any of the four demo scenario messages and see a correctly styled, correctly worded response in the browser.

**Dependencies:** Phase 4 (API functional).

**Definition of done:** All four demo scenarios run successfully through the actual UI, not just via API testing.

---

## Phase 7 — Agent dashboard (Target: 8:30–9:45)

**Objective:** Build the human agent surface per design.md §9–13.

**Tasks:**
- [MVP] Ticket list table (Priority, Customer, Subject, Status, Confidence/Escalation reason, Updated).
- [MVP] Ticket detail view with investigation timeline component (design.md §8) and action panel (resolve / reassign / note).
- [MVP] Escalation banner (design.md §9).
- [OPT] Analytics summary cards (resolution rate, escalation rate) using Recharts.

**Expected output:** Opening the dashboard shows Scenario 4's escalated ticket with the full investigation pre-populated, requiring no additional digging.

**Dependencies:** Phase 3 (ticket endpoints), Phase 4 (Investigation objects being produced).

**Definition of done:** An escalated ticket from a live Scenario 4 run displays correctly with all evidence visible.

---

## Phase 8 — Integration (Target: 9:45–10:30)

**Objective:** Ensure client, server, AI, and RAG all work together end-to-end without manual intervention.

**Tasks:**
- [MVP] Run all four demo scenarios start-to-finish through the deployed-equivalent local stack.
- [MVP] Fix cross-module inconsistencies (field name mismatches, timing issues, error-state gaps).
- [OPT] Add basic loading/error states everywhere per design.md §16–17 if not already done per-component.

**Expected output:** A single uninterrupted run-through of all four scenarios without console errors.

**Dependencies:** Phases 4–7.

**Definition of done:** Team can perform the full demo twice in a row without manual data resets breaking anything.

---

## Phase 9 — Testing (Target: 10:30–11:15)

**Objective:** Harden against demo-day failure modes.

**Tasks:**
- [MVP] Re-test each of the five escalation rules (FTL.md §6) individually with targeted inputs.
- [MVP] Test failure paths: kill the LLM key temporarily to confirm graceful escalation fallback; test a tool error path.
- [MVP] Cross-browser/mobile check on the customer chat view (design.md §18).
- [OPT] Write down 2–3 "if the AI call is slow/down during judging" fallback talking points (not code — a team readiness note).

**Expected output:** Confidence that the demo will not crash or hang if judges deviate from the scripted scenarios.

**Dependencies:** Phase 8.

**Definition of done:** Team has manually tried at least one unscripted / edge-case message and confirmed it either resolves sensibly or escalates cleanly (never crashes, never fabricates data).

---

## Phase 10 — Demo preparation (Target: 11:15–12:00)

**Objective:** Prepare the actual presentation.

**Tasks:**
- [MVP] Seed a clean, demo-specific dataset (reset any state mutated during Phase 9 testing).
- [MVP] Script the four-scenario walkthrough, explicitly narrating investigation → reasoning → decision → action/escalation for each (tie back to the "not a chatbot" framing in Architecture.md §1).
- [MVP] Prepare a 1-slide or README summary of architecture for judges who want technical depth.
- [OPT] Record a backup video of the demo in case of live/network issues.

**Expected output:** A rehearsed, repeatable demo script covering all four scenarios in under ~5 minutes.

**Dependencies:** Phase 9.

**Definition of done:** Full dry run completed at least once with the exact data judges will see.

---

## Priority summary

If time runs short, the non-negotiable path is: **Phase 1 → 2 → 3 → 4 → 6 (minimal) → 7 (minimal) → 10.** Phase 5 (RAG) can degrade to a hardcoded keyword-match fallback over the same 6 documents if FAISS integration proves time-consuming — this still satisfies "knowledge retrieval" functionally, with a note in TAD.md marking it as a scoped-down fallback, not silently dropped.

---

## Consistency check

- Phase task names map directly to modules in FAD.md and logic in FTL.md.
- Demo scenario references match Architecture.md §8 / PRD.md §9/§13 exactly.
- No contradictions found. **Proceeding to Agent 07 → Resource_Chart.md.**

*End of phases.md*
