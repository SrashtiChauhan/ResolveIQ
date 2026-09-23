# Architecture.md — SupportFlow AI

**Project:** SupportFlow AI
**Track:** Track 2 — Customer Support
**Document owner:** Architecture Agent (01)
**Status:** Draft v1.0 — validated for 12-hour hackathon scope

---

## 1. What SupportFlow AI actually is

SupportFlow AI is **not** a chatbot that answers customer questions from a script. It is a **tool-using reasoning agent** that:

1. Receives a raw customer message.
2. Identifies the customer and pulls their real context (orders, payments, ticket history) through backend tools.
3. Retrieves relevant policy knowledge through semantic search (RAG).
4. Reasons over all collected evidence with an LLM.
5. Decides between three outcomes: **auto-resolve**, **auto-resolve with action**, or **escalate to a human**.
6. If it acts, it calls a real (simulated) backend mutation — e.g. creating a refund request.
7. If it escalates, it hands the human agent the full investigation trail, not just the raw message.

Every architectural decision below exists to make that investigate → reason → decide → act/escalate loop visible and demoable, not to add technology for its own sake.

---

## 2. Architecture goals (and constraints)

| Goal | Why it matters for this project |
|---|---|
| Make the agent's reasoning visible | Judges must see *why* a decision was made, not just the final reply |
| Support multi-source investigation | Core differentiator vs. a chatbot |
| Keep automated actions safe | Refunds/updates must be gated by confidence + policy checks |
| Support clean human handoff | Escalation must carry full context, not a cold ticket |
| Be buildable in 12 hours | No infra work that doesn't serve a demo scenario |
| Be provider-agnostic for the LLM | Judges may test with different keys; avoid vendor lock-in |
| Be deployable | Vercel + Render/Railway + Atlas, zero custom infra |

**Explicit non-goals for the prototype:** multi-tenant auth, horizontal scaling, real payment gateway integration, real ticketing system integration, production observability stack. These are listed in every document as "Future scope," never silently dropped.

---

## 3. High-level system diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                             │
│                                                                        │
│   ┌─────────────────────────┐        ┌────────────────────────────┐  │
│   │  Customer Support Chat   │        │   Human Agent Dashboard     │  │
│   │  (React + Vite + Tailwind)│       │   (React + Vite + Tailwind) │  │
│   └────────────┬─────────────┘        └───────────────┬────────────┘  │
└────────────────┼───────────────────────────────────────┼──────────────┘
                  │ REST (JSON)                           │ REST (JSON)
┌─────────────────▼───────────────────────────────────────▼──────────────┐
│                          APPLICATION LAYER (Express)                    │
│                                                                          │
│  ┌────────────────┐   ┌─────────────────────┐   ┌────────────────────┐ │
│  │ Conversation API│   │  Agent Orchestrator  │   │   Ticket / Agent   │ │
│  │ (POST /message) │──▶│  (reasoning loop)    │──▶│   API (dashboard)  │ │
│  └────────────────┘   └──────────┬───────────┘   └────────────────────┘ │
│                                    │                                     │
│                    ┌───────────────┼────────────────┐                   │
│                    ▼               ▼                ▼                   │
│           ┌────────────────┐┌─────────────┐┌──────────────────┐        │
│           │  Tool Layer      ││ RAG Retriever││  LLM Client       │        │
│           │  (get_customer,  ││ (FAISS +     ││  (provider-       │        │
│           │  get_order, ...) ││ embeddings)  ││  agnostic wrapper)│        │
│           └────────┬─────────┘└──────┬───────┘└─────────┬─────────┘        │
└────────────────────┼──────────────────┼─────────────────┼──────────────┘
                      ▼                  ▼                 ▼
            ┌──────────────────┐ ┌────────────────┐ ┌─────────────────┐
            │     MongoDB       │ │  FAISS index    │ │  LLM Provider    │
            │  (Atlas / local)  │ │  (knowledge     │ │  (OpenAI /       │
            │  customers,       │ │  base vectors,  │ │  Anthropic /     │
            │  orders, payments,│ │  built at       │ │  configurable    │
            │  tickets, kb docs │ │  startup)       │ │  via env var)    │
            └──────────────────┘ └────────────────┘ └─────────────────┘
```

---

## 4. Core components

### 4.1 Customer Support Chat (frontend)
The customer-facing surface. A single conversation view where a customer types a problem and sees the agent's final response. Internally, every response is backed by a structured `investigation` object (see §5), even though the customer only sees the natural-language reply.

### 4.2 Human Agent Dashboard (frontend)
The escalation surface. Lists tickets, and for escalated ones shows: the original message, every tool call the agent made, the evidence retrieved, the policy snippets used, the agent's reasoning summary, and its recommended action — so a human never starts from zero.

### 4.3 Conversation API
A thin Express layer that accepts a customer message, creates/loads a conversation, and invokes the Agent Orchestrator. No business logic lives here.

### 4.4 Agent Orchestrator
The heart of the system. A deterministic control loop (not a single "ask the LLM once" call) that:
1. Classifies intent + urgency + sentiment.
2. Identifies the customer.
3. Decides which tools are relevant to the intent (order lookup, payment lookup, ticket history).
4. Calls those tools.
5. Runs a RAG query against the knowledge base for applicable policy.
6. Sends the assembled evidence bundle to the LLM with a reasoning prompt.
7. Parses a structured decision (`resolve`, `resolve_with_action`, `escalate`) with a confidence score and rationale.
8. Executes the action tool if applicable, or escalates.

This loop is intentionally explicit code, not "the LLM does everything," so it stays debuggable within the hackathon timeframe and produces the audit trail the demo needs.

### 4.5 Tool Layer
A registry of backend functions the orchestrator can call: `get_customer()`, `get_order()`, `get_payment()`, `get_previous_tickets()`, `search_knowledge_base()`, `create_refund_request()`, `update_ticket()`, `escalate_ticket()`. Each tool has a fixed input/output schema so the LLM can be given a tool-calling interface (native function calling where the provider supports it, or a structured-JSON fallback otherwise).

### 4.6 RAG Retriever
At startup, policy documents (`refund_policy`, `cancellation_policy`, `payment_policy`, `shipping_policy`, `account_policy`, `product_faq`) are chunked, embedded with Sentence Transformers, and indexed in FAISS. At query time the retriever embeds the customer's issue + relevant keywords and returns the top-k matching policy chunks, which get injected into the reasoning prompt as evidence.

### 4.7 LLM Client
A single wrapper module (`ai/llmClient.js`) that exposes one function, e.g. `generateDecision(promptPayload)`, and internally routes to whichever provider is set in `LLM_PROVIDER` env var. Swapping providers should never require touching the orchestrator.

### 4.8 Database (MongoDB / Mongoose)
Stores customers, orders, payments, tickets (with embedded investigation logs), and knowledge base source documents. Chosen for schema flexibility (investigation logs and evidence bundles are naturally nested JSON) and speed of hackathon setup versus a relational DB.

---

## 5. The investigation object (why this is not a chatbot)

Every customer message produces a persisted `Investigation` record, not just a chat reply:

```json
{
  "intent": "refund_request",
  "urgency": "high",
  "sentiment": "frustrated",
  "customerId": "...",
  "toolCalls": [
    { "tool": "get_order", "input": {...}, "output": {...} },
    { "tool": "get_payment", "input": {...}, "output": {...} },
    { "tool": "get_previous_tickets", "input": {...}, "output": {...} }
  ],
  "knowledgeRetrieved": [
    { "doc": "refund_policy", "chunk": "...", "score": 0.83 }
  ],
  "reasoning": "Order was cancelled on 2024-XX-XX, payment captured same day, no refund issued in 3 previous ticket touches. Refund policy guarantees reversal within 5 business days of cancellation, which has elapsed.",
  "decision": "resolve_with_action",
  "confidence": 0.91,
  "actionTaken": { "tool": "create_refund_request", "result": {...} },
  "escalated": false
}
```

This object is what makes explainability real: the dashboard and the demo narration both read directly from it.

---

## 6. Decision boundaries (high-level; detailed in FTL.md)

The orchestrator resolves automatically only when **all** of the following hold:
- Confidence score from the reasoning step is above threshold (default `0.75`).
- The required evidence (order + payment + policy match) is present and unambiguous.
- The action, if any, is on the pre-approved safe-action list (e.g. `create_refund_request` under policy-defined limits).

Otherwise it escalates. Repeated-contact patterns (e.g. 3+ prior tickets on the same issue) force escalation regardless of confidence — this directly powers Demo Scenario 4.

---

## 7. Technology mapping

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite + Tailwind + Lucide React | Fast dev loop, no build config overhead |
| Charts | Recharts (dashboard only, sparingly) | Only where a real metric exists (escalation rate, resolution time) |
| Backend | Node.js + Express | Same language as frontend, minimal boilerplate |
| DB | MongoDB + Mongoose | Flexible schema for nested investigation logs |
| AI orchestration | Custom orchestrator in `ai/` (Node) | Full control over the reasoning loop for the demo |
| LLM | Configurable via `LLM_PROVIDER` env var | Avoids vendor lock-in; judges may swap keys |
| Embeddings | Sentence Transformers | Free, local, no external API dependency for RAG |
| Vector search | FAISS | In-process, no extra infra service needed |
| Auth | Simple mock/session-based | Enterprise auth is explicitly out of scope |
| Deployment | Vercel (client) + Render/Railway (server) + Atlas (DB) | Zero-ops, free-tier friendly |

Note: Sentence Transformers + FAISS are Python-native. The prototype runs the embedding/indexing step as a small Python microservice (or a one-time Python script invoked at build/startup that writes a FAISS index consumed via a lightweight Python process called from Node, or via a `child_process` bridge) — see TAD.md for the exact process boundary. This is flagged here so later documents don't silently assume a pure-Node RAG stack.

---

## 8. Validation checklist (self-review before proceeding to Agent 02)

- [x] **Contradictions:** None found. Frontend/backend/DB choices are consistent with the mandated stack.
- [x] **12-hour realism:** Architecture uses one orchestrator, one tool registry, one RAG index built at startup from ~6 static docs, mock data instead of real integrations. Realistic.
- [x] **Every component has a purpose:** Conversation API (entry point), Orchestrator (reasoning), Tool Layer (investigation actions), RAG Retriever (knowledge), LLM Client (provider abstraction), Dashboard (human handoff). No decorative components.
- [x] **Supports reasoning, automation, human handoff:** Reasoning → `Investigation.reasoning` + confidence; Automation → Tool Layer safe-action execution; Human handoff → full `Investigation` object surfaced in dashboard.
- [x] **Demo scenarios supported:** Scenario 1 (order lookup) uses `get_order` only; Scenario 2 (multi-source) uses `get_order`+`get_payment`+`get_previous_tickets`+RAG; Scenario 3 (action) adds `create_refund_request`+`update_ticket`; Scenario 4 (escalation) uses `get_previous_tickets` pattern detection + `escalate_ticket`.

**Result: Architecture validated. Proceeding to Agent 02 → PRD.md.**

---

*End of Architecture.md*
