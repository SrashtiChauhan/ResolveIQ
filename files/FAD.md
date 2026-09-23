# FAD.md — Functional Architecture Document — SupportFlow AI

**Reads:** Architecture.md, PRD.md, design.md
**Status:** Draft v1.0

---

## 1. Purpose

This document maps *what the system does* (functions/modules) onto *who owns each responsibility* (AI / backend / frontend / database), independent of implementation detail. TAD.md covers how it's implemented; SAD.md covers the software architecture; this document covers functional boundaries.

## 2. Functional modules

| Module | Responsibility |
|---|---|
| **Intake Module** | Receive customer message, attach/create conversation, forward to Orchestration Module |
| **Intent & Signal Module** | Classify intent, urgency, sentiment from raw message |
| **Identity Module** | Resolve message to a known customer record |
| **Investigation Module** | Call relevant data tools (order, payment, tickets) based on intent |
| **Knowledge Retrieval Module** | Run semantic search over policy documents relevant to intent |
| **Reasoning Module** | Send evidence bundle to LLM, receive structured decision + rationale + confidence |
| **Action Module** | Execute pre-approved safe actions (refund request, ticket update) when decision permits |
| **Escalation Module** | Apply escalation rules, create/flag ticket for human queue, attach full context |
| **Response Module** | Generate the customer-facing natural-language reply |
| **Ticket & Dashboard Module** | Serve ticket list/detail data and accept human agent actions (resolve, reassign, note) |
| **Persistence Module** | Store customers, orders, payments, tickets, investigations, knowledge documents |

## 3. Module relationships

```text
Intake ──▶ Intent & Signal ──▶ Identity ──▶ Investigation ──▶ Knowledge Retrieval ──▶ Reasoning
                                                                                          │
                                                                    ┌─────────────────────┼─────────────────────┐
                                                                    ▼                                           ▼
                                                              Action Module                              Escalation Module
                                                                    │                                           │
                                                                    └───────────────┬───────────────────────────┘
                                                                                    ▼
                                                                            Response Module
                                                                                    │
                                                                                    ▼
                                                                           Persistence Module
                                                                                    ▲
                                                                                    │
                                                                     Ticket & Dashboard Module (reads)
```

## 4. Customer workflow (functional view)

1. Customer sends a message via the chat interface (Frontend → Intake).
2. Intake creates/loads a conversation and passes control to Intent & Signal.
3. Intent & Signal + Identity determine *who* is asking and *what* they likely need.
4. Investigation Module gathers only the data sources relevant to the detected intent (not a blanket fetch of everything, to keep the loop fast and the reasoning input focused).
5. Knowledge Retrieval fetches applicable policy chunks.
6. Reasoning Module produces a decision.
7. Action or Escalation Module executes accordingly.
8. Response Module returns the final message; Persistence Module stores the full investigation.

## 5. AI investigation workflow (functional view)

- **Input:** customer message + resolved customer ID.
- **Process:** intent classification → tool selection → tool execution → knowledge retrieval → evidence bundling → LLM reasoning call → structured decision parsing.
- **Output:** `Investigation` object (Architecture.md §5) with decision, confidence, rationale, and full evidence trail.
- **Ownership:** entirely within the AI-adjacent backend modules (Intent & Signal, Investigation, Knowledge Retrieval, Reasoning) — the frontend never talks to the LLM directly.

## 6. Knowledge retrieval workflow (functional view)

1. Policy documents are pre-processed (chunked, embedded) at server startup — a one-time indexing step, not per-request.
2. Per request, the customer's issue text (plus detected intent as a keyword hint) is embedded and matched against the FAISS index.
3. Top-k chunks (with similarity scores) are returned to the Reasoning Module as evidence, tagged with their source document (e.g. `refund_policy`).

## 7. Automated action workflow (functional view)

1. Reasoning Module returns `decision: resolve_with_action` with a named action and parameters.
2. Action Module checks the action against the pre-approved safe-action list (`create_refund_request`, `update_ticket` only, in MVP scope).
3. Action Module executes the tool call against Persistence Module (mocked business effect — no real payment gateway).
4. Result is attached to the `Investigation.actionTaken` field and surfaced to Response Module.

## 8. Escalation workflow (functional view)

1. Escalation Module evaluates the five conditions defined in PRD.md §12 against the Reasoning Module's output and the Investigation Module's evidence (including previous-ticket count/pattern).
2. If any condition matches, the ticket status is set to `escalated`, a priority is assigned, and the full `Investigation` object is attached to the ticket record — nothing is re-derived later by a human.
3. Ticket & Dashboard Module surfaces the escalated ticket to the human queue in priority order.

## 9. Human-agent workflow (functional view)

1. Agent opens Ticket & Dashboard Module's ticket list, filtered to `escalated`.
2. Agent opens a ticket; Ticket & Dashboard Module renders the stored `Investigation` object (read-only) plus an action panel.
3. Agent resolves, reassigns priority, or adds a note; these mutations go through the Ticket & Dashboard Module directly (bypassing the AI reasoning loop — human actions are not re-reasoned over).

## 10. Data dependencies

| Module | Depends on data |
|---|---|
| Identity | `customers` collection |
| Investigation | `orders`, `payments`, `tickets` collections |
| Knowledge Retrieval | `knowledgeDocuments` collection (source) + FAISS index (derived) |
| Reasoning | Output of Investigation + Knowledge Retrieval (no direct DB access) |
| Action | `orders`/`payments`/`tickets` collections (writes, mocked effects) |
| Escalation | `tickets` collection (previous-ticket pattern), Reasoning output |
| Ticket & Dashboard | `tickets` collection (including embedded `Investigation`) |

## 11. Functional boundaries

- **AI responsibilities:** intent/urgency/sentiment classification, deciding which tools to call, producing the reasoning/decision/confidence, drafting the customer-facing reply text. The AI never directly writes to the database — it returns decisions that backend code executes.
- **Backend responsibilities:** identity resolution, tool execution (data fetch + mocked mutations), escalation rule enforcement (deterministic code, not left to the LLM's judgment alone — the five rules in PRD.md §12 are checked in code even if the LLM also independently signals low confidence), persistence, serving both frontend surfaces.
- **Frontend responsibilities:** rendering conversation/dashboard UI, presenting the investigation timeline read-only, capturing human agent actions and submitting them via API — no business logic, no direct DB or LLM access.
- **Database responsibilities:** durable storage of all domain entities and investigation logs; no logic beyond schema validation (Mongoose-level).

---

## Consistency check

- Module names introduced here (Intake, Intent & Signal, Identity, Investigation, Knowledge Retrieval, Reasoning, Action, Escalation, Response, Ticket & Dashboard, Persistence) will be reused verbatim in FTL.md, SAD.md, and TAD.md.
- Escalation rules reference PRD.md §12 directly rather than restating them differently — no drift.
- Tool list matches Architecture.md and PRD.md exactly.
- No contradictions found. **Proceeding to Agent 05 → FTL.md.**

*End of FAD.md*
