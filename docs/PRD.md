# PRD.md — SupportFlow AI

**Reads:** Architecture.md
**Status:** Draft v1.0

---

## 1. Product overview

SupportFlow AI is an autonomous customer-support agent that investigates a customer's issue across multiple internal data sources (orders, payments, ticket history), retrieves relevant policy knowledge, reasons over the combined evidence, and either resolves the issue directly (with a real backend action where safe) or escalates it to a human agent with a complete investigation trail attached. It is built as a tool-using reasoning agent per Architecture.md §1, not a scripted chatbot.

## 2. Problem statement

Most "AI support" today is a FAQ chatbot: it answers generic questions but cannot look at a specific customer's order, verify a payment, check prior contact history, or take an action. Customers repeat themselves across tickets, agents start every escalation from zero context, and simple-but-verifiable cases (e.g. "my cancelled order was charged, refund me") still require a human even when all the evidence needed to resolve them safely already exists in the system.

## 3. Target users

| User | Need |
|---|---|
| End customer | Fast, correct resolution without repeating their story |
| Human support agent | Full context on escalated tickets, no cold starts |
| Support team lead (demo judge persona) | Visibility into why the AI made each decision |

## 4. Personas

**Priya, the customer.** Ordered a product, it was cancelled, but she was still charged. She has already emailed support once and gotten no result. She wants her money back or a clear explanation, without repeating the whole story.

**Arjun, the support agent.** Handles the queue of tickets the AI could not safely resolve. Needs to see immediately what was already checked (order, payment, policy) so he isn't duplicating investigation work.

**Meera, the support ops lead.** Cares that automated resolutions are actually correct and that escalations aren't just "AI giving up" — she wants an audit trail per ticket.

## 5. Goals

- Demonstrate genuine multi-source investigation, not single-turn Q&A.
- Automatically and safely resolve a meaningful subset of issues (refund status/creation, order status, cancellation status).
- Produce a complete, human-readable investigation trail for every conversation, resolved or escalated.
- Escalate reliably when confidence is low, evidence is missing/contradictory, or the case matches a "requires human" pattern (e.g. repeated unresolved contact).

## 6. Non-goals (explicit, for hackathon scope)

- Real payment gateway integration (mocked `get_payment` only).
- Real order-management system integration (mocked `get_order` only).
- Multi-tenant or role-based enterprise authentication.
- Multi-language support.
- Voice/phone channel.
- SLA management, staffing/routing optimization across multiple agents.
- Production-grade observability/alerting.

## 7. Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | System shall accept a free-text customer message and identify the customer (mocked identity, e.g. via a selected demo customer or email lookup). |
| FR-2 | System shall classify intent, urgency, and sentiment from the message. |
| FR-3 | System shall retrieve order data relevant to the message when order context is implicated. |
| FR-4 | System shall retrieve payment data relevant to the message when payment context is implicated. |
| FR-5 | System shall retrieve the customer's previous support tickets. |
| FR-6 | System shall perform semantic retrieval over the policy knowledge base relevant to the issue. |
| FR-7 | System shall produce a structured reasoning output with a decision (`resolve`, `resolve_with_action`, `escalate`), a confidence score, and a human-readable rationale. |
| FR-8 | System shall execute a backend action (e.g. `create_refund_request`, `update_ticket`) only when the decision is `resolve_with_action` and the action is on the pre-approved safe list. |
| FR-9 | System shall generate a natural-language response to the customer reflecting the decision and evidence. |
| FR-10 | System shall escalate the ticket when confidence is below threshold, evidence is missing/contradictory, or a repeated-unresolved-contact pattern is detected. |
| FR-11 | System shall persist a full investigation record (tool calls, retrieved knowledge, reasoning, decision, action outcome) per conversation. |
| FR-12 | Human agent dashboard shall list tickets, filterable by status (open/escalated/resolved) and priority. |
| FR-13 | Human agent dashboard shall display the full investigation record for any ticket, including tool calls and retrieved policy snippets. |
| FR-14 | Human agent shall be able to manually resolve, reassign priority, or add notes to an escalated ticket. |

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | End-to-end response time for a customer message (investigation + reasoning + reply) should target under ~8 seconds in the demo environment. |
| NFR-2 | LLM provider must be swappable via environment variable without code changes to the orchestrator. |
| NFR-3 | System must degrade gracefully (see FTL.md) if a tool call or the LLM call fails — never silently drop the customer's message. |
| NFR-4 | All automated actions must be logged with the evidence that justified them (auditability). |
| NFR-5 | Frontend must be responsive down to a single-column mobile layout for the customer chat view at minimum. |

## 9. Core user journeys

### Journey A — Customer submits an issue (all scenarios)
Customer opens chat → types issue → sees a "investigating..." state → receives either a resolution message or an "we've escalated this to a specialist" message with a ticket reference.

### Journey B — Agent handles an escalation
Agent opens dashboard → sees escalated tickets sorted by priority → opens one → reads the AI's investigation summary (tool calls, evidence, reasoning, why it escalated) → resolves manually or requests more info from the customer.

### Journey C — Ops lead reviews AI decisions (secondary, demo-support)
Ops lead (or judge) opens dashboard analytics view → sees resolution rate, escalation rate, and can click into any ticket to see the reasoning trail.

## 10. AI behavior

- The AI never fabricates order/payment data — it only reasons over what the Tool Layer actually returned.
- The AI always states its confidence and the evidence it relied on in the persisted investigation record, even when confidence is high enough to auto-resolve.
- The AI treats policy documents as ground truth for eligibility decisions (e.g. refund windows); it does not improvise policy.
- The AI is conservative by design: ties go to escalation, not resolution — a wrong auto-resolution is worse than an unnecessary escalation.

## 11. Support agent (human) behavior

- Agents work only escalated tickets; the dashboard does not show resolved-by-AI tickets as actionable items (they remain visible in a read-only "resolved" list for audit).
- Every escalated ticket must show *why* it was escalated as a first-class field, not buried in free text.

## 12. Escalation conditions

A ticket is escalated when any of the following hold:
1. Reasoning confidence < 0.75 (configurable).
2. Required evidence is missing or contradictory (e.g. payment record not found for a claimed charge).
3. The matched intent requires an action outside the pre-approved safe-action list.
4. Three or more previous tickets exist on the same unresolved issue (repeated-contact pattern).
5. Detected sentiment is strongly negative/high urgency combined with an ambiguous intent.

(Full decision logic lives in FTL.md; this section defines the product-level rule, not the implementation.)

## 13. Acceptance criteria (MVP)

- [ ] Given Scenario 1 input, the system returns an order-status answer without escalation, using only `get_customer` + `get_order`.
- [ ] Given Scenario 2 input, the investigation record shows tool calls to order, payment, and previous-ticket lookups plus a policy retrieval, and the reasoning explicitly references the refund policy.
- [ ] Given Scenario 3 input, the system calls `create_refund_request` and `update_ticket`, and the customer receives a response confirming the refund was initiated.
- [ ] Given Scenario 4 input, the system detects 3+ prior tickets, sets `escalated: true`, and the dashboard shows the full context on first load — no re-investigation needed by the agent.
- [ ] Every conversation, resolved or escalated, has a persisted investigation record retrievable via the dashboard or API.

## 14. MVP scope (12-hour hackathon)

**In:** Single customer chat flow, orchestrator with the 8 listed tools, FAISS-backed RAG over 6 static policy docs, mock customer/order/payment/ticket data (seeded), agent dashboard with ticket list + detail view, basic escalation logic with the 5 rules above, one working end-to-end demo per scenario.

**Out (deferred to Future scope):** real auth, multi-agent load balancing, analytics beyond basic counts, multi-language, editable knowledge base UI, streaming token-by-token responses (nice-to-have only if time remains).

## 15. Future scope (explicitly deferred)

- Real payment/order system integrations.
- Role-based authentication and multi-tenant support.
- Fine-grained action permissions per agent/team.
- Feedback loop where human corrections retrain confidence thresholds.
- Multi-language intent detection and response generation.
- SLA-aware priority queueing.

---

## Consistency check against Architecture.md

- Tool names match exactly: `get_customer`, `get_order`, `get_payment`, `get_previous_tickets`, `search_knowledge_base`, `create_refund_request`, `update_ticket`, `escalate_ticket`.
- Decision states (`resolve`, `resolve_with_action`, `escalate`) match the `Investigation.decision` field in Architecture.md §5.
- Confidence threshold (0.75) matches Architecture.md §6.
- No contradictions found. **Proceeding to Agent 03 → design.md.**

*End of PRD.md*
