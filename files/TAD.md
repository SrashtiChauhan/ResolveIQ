# TAD.md — Technical Architecture Document — SupportFlow AI

**Reads:** Architecture.md, PRD.md, design.md, FAD.md, FTL.md, phases.md, Resource_Chart.md, SAD.md
**Status:** Draft v1.0

---

## 1. Technology choices (final)

| Layer | Choice | Version guidance |
|---|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + Lucide React + Recharts (optional) | Latest stable at build time |
| Backend | Node.js 20+ + Express 4 | LTS Node |
| Database | MongoDB 7 (Atlas) + Mongoose 8 | — |
| AI orchestration | Custom Node modules (`ai/`, `server/src/modules/`) | — |
| LLM | Provider-agnostic via `LLM_PROVIDER` env (`openai` \| `anthropic` \| others) | Pin exact model name in env, not code |
| Embeddings | `sentence-transformers` (Python), e.g. `all-MiniLM-L6-v2` (fast, small, good enough for 6 short documents) | — |
| Vector index | `faiss-cpu` (Python) | — |
| Retrieval interop | Small FastAPI (or Flask) service, `POST /retrieve` | localhost only, not internet-exposed |

## 2. Project structure

```text
supportflow-ai/
├── client/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── chat/                 # Customer chat UI
│   │   │   └── dashboard/            # Agent dashboard UI
│   │   ├── components/
│   │   │   ├── InvestigationTimeline.jsx
│   │   │   ├── TicketTable.jsx
│   │   │   ├── EscalationBanner.jsx
│   │   │   ├── StatusDot.jsx
│   │   │   └── ...
│   │   ├── lib/api.js
│   │   ├── styles/tokens.css         # design.md tokens as CSS vars
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── intake/
│   │   │   ├── identitySignal/
│   │   │   ├── investigation/
│   │   │   ├── knowledgeRetrieval/   # HTTP client to retrieval service
│   │   │   ├── reasoning/
│   │   │   ├── action/
│   │   │   ├── escalation/
│   │   │   ├── response/
│   │   │   └── ticketDashboard/
│   │   ├── tools/
│   │   │   ├── getCustomer.js
│   │   │   ├── getOrder.js
│   │   │   ├── getPayment.js
│   │   │   ├── getPreviousTickets.js
│   │   │   ├── createRefundRequest.js
│   │   │   ├── updateTicket.js
│   │   │   ├── escalateTicket.js
│   │   │   └── toolRegistry.js
│   │   ├── models/
│   │   │   ├── Customer.js
│   │   │   ├── Order.js
│   │   │   ├── Payment.js
│   │   │   ├── Ticket.js
│   │   │   └── KnowledgeDocument.js
│   │   ├── routes/
│   │   │   ├── conversations.js
│   │   │   └── tickets.js
│   │   ├── orchestrator.js           # runSupportPipeline()
│   │   ├── middleware/
│   │   └── app.js
│   ├── scripts/
│   │   └── seed.js
│   └── package.json
├── ai/
│   └── llmClient.js                  # classify(), reason(), generateResponse()
├── knowledge/
│   ├── docs/
│   │   ├── refund_policy.md
│   │   ├── cancellation_policy.md
│   │   ├── payment_policy.md
│   │   ├── shipping_policy.md
│   │   ├── account_policy.md
│   │   └── product_faq.md
│   └── retrieval_service/
│       ├── main.py                   # FastAPI: /retrieve, /index
│       ├── build_index.py
│       └── requirements.txt
├── docs/
│   ├── Architecture.md
│   ├── PRD.md
│   ├── design.md
│   ├── FAD.md
│   ├── FTL.md
│   ├── phases.md
│   ├── Resource_Chart.md
│   ├── SAD.md
│   └── TAD.md
└── README.md
```

## 3. Frontend architecture (implementation detail)

- `lib/api.js` centralizes all fetch calls (`sendMessage(conversationId, text)`, `getTickets(filters)`, `getTicket(id)`, `patchTicket(id, changes)`).
- `InvestigationTimeline.jsx` takes the `investigation` object (schema in §6) as a single prop and renders the steps described in design.md §8 — used identically in both the chat "investigating…" state (subset of steps, live-updating) and the dashboard detail view (full, static).
- Design tokens (design.md §3–4) implemented as CSS custom properties in `styles/tokens.css`, referenced from `tailwind.config.js` `theme.extend.colors` so Tailwind utility classes stay in sync with the design system rather than hardcoding hex values in components.

## 4. Backend structure

- `orchestrator.js` implements `runSupportPipeline(message, customerHint)` exactly per the sequence in FTL.md §2, calling each `modules/*` function in order and short-circuiting into escalation where FTL.md §10 error handling dictates.
- Each `modules/*` folder exports one primary function matching its FAD.md responsibility, keeping a 1:1 mapping between functional design and code for easy review.

## 5. API design

### `POST /api/conversations/:conversationId/message`

**Request:**
```json
{ "message": "₹1,299 was deducted from my account but my order was cancelled...", "customerId": "cust_1029" }
```

**Response (resolved):**
```json
{
  "reply": "I checked your order and payment — since your order was cancelled and the refund window has passed, I've initiated a refund of ₹1,299. It should reach your account in 3–5 business days.",
  "status": "resolved",
  "ticketId": "tkt_8841",
  "investigation": { "...": "see §6 schema" }
}
```

**Response (escalated):**
```json
{
  "reply": "I've escalated this to a specialist because you've contacted us multiple times about this issue without resolution. Reference: tkt_8842.",
  "status": "escalated",
  "ticketId": "tkt_8842",
  "investigation": { "...": "see §6 schema" }
}
```

### `GET /api/tickets?status=escalated&priority=high`
Returns a list of ticket summaries (no full investigation payload, for list performance).

### `GET /api/tickets/:id`
Returns full ticket including embedded `investigation`.

### `PATCH /api/tickets/:id`
```json
{ "status": "resolved", "priority": "medium", "note": "Refunded manually, confirmed with customer by phone." }
```

### Retrieval service — `POST /retrieve` (internal, called by `knowledgeRetrieval` module)
**Request:** `{ "query": "refund cancelled order charged", "k": 3 }`
**Response:** `{ "results": [ { "doc": "refund_policy", "chunk": "...", "score": 0.83 }, ... ] }`

## 6. Database schemas (Mongoose)

```js
// models/Customer.js
{
  name: String,
  email: { type: String, unique: true },
  createdAt: Date
}

// models/Order.js
{
  customerId: { type: ObjectId, ref: "Customer" },
  orderNumber: String,
  status: { type: String, enum: ["placed", "shipped", "delivered", "cancelled"] },
  amount: Number,
  currency: { type: String, default: "INR" },
  cancelledAt: Date,
  createdAt: Date
}

// models/Payment.js
{
  customerId: { type: ObjectId, ref: "Customer" },
  orderId: { type: ObjectId, ref: "Order" },
  amount: Number,
  status: { type: String, enum: ["captured", "refunded", "failed"] },
  capturedAt: Date,
  refundedAt: Date
}

// models/Ticket.js
{
  customerId: { type: ObjectId, ref: "Customer" },
  subject: String,
  topic: String,                      // normalized issue topic, used for repeated-contact detection (FTL.md E4)
  status: { type: String, enum: ["open", "resolved", "escalated"] },
  priority: { type: String, enum: ["low", "medium", "high"] },
  resolutionType: { type: String, enum: ["automated", "manual", null] },
  escalationReason: String,
  investigation: {
    intent: String,
    urgency: String,
    sentiment: String,
    toolCalls: [{ tool: String, input: Object, output: Object, error: String }],
    knowledgeRetrieved: [{ doc: String, chunk: String, score: Number }],
    reasoning: String,
    decision: { type: String, enum: ["resolve", "resolve_with_action", "escalate"] },
    confidence: Number,
    actionTaken: { tool: String, result: Object },
    escalated: Boolean
  },
  agentNotes: [{ text: String, createdAt: Date }],
  createdAt: Date,
  updatedAt: Date
}

// models/KnowledgeDocument.js
{
  key: String,          // e.g. "refund_policy"
  title: String,
  content: String,       // raw markdown/text, chunked at index-build time
  updatedAt: Date
}
```

## 7. AI agent architecture (implementation detail)

`ai/llmClient.js`:
```js
async function classify(message) { /* calls LLM_PROVIDER with INTENT_CLASSIFIER_PROMPT, JSON mode */ }
async function reason(evidenceBundle) { /* calls LLM_PROVIDER with REASONING_SYSTEM_PROMPT, JSON mode */ }
async function generateResponse(decision, evidence, actionResult) { /* natural language, evidence-constrained */ }
```

Provider routing:
```js
function getProviderAdapter() {
  switch (process.env.LLM_PROVIDER) {
    case "openai": return openaiAdapter;
    case "anthropic": return anthropicAdapter;
    default: throw new Error("Unsupported LLM_PROVIDER");
  }
}
```
Each adapter implements the same three-function interface, so `orchestrator.js` and every `modules/*` file never branch on provider.

## 8. Prompt architecture

- **System prompts stored as versioned text files** (`ai/prompts/intentClassifier.md`, `ai/prompts/reasoning.md`, `ai/prompts/response.md`), loaded at startup — not inlined as string literals in logic files, so they can be iterated on quickly during the hackathon without touching orchestration code.
- **Reasoning prompt structure:** system instructions (evidence-only constraint, JSON schema) + a serialized evidence bundle (customer, order, payment, previous tickets, retrieved policy chunks) + the original customer message.
- **Response prompt structure:** system instructions (tone per design.md — plain, professional, no "AI assistant" flourishes) + decision + evidence + action result (if any).

## 9. Tool calling (implementation)

`toolRegistry.js`:
```js
const registry = {
  get_customer: require("./getCustomer"),
  get_order: require("./getOrder"),
  get_payment: require("./getPayment"),
  get_previous_tickets: require("./getPreviousTickets"),
  search_knowledge_base: require("../modules/knowledgeRetrieval").retrieve,
  create_refund_request: require("./createRefundRequest"),
  update_ticket: require("./updateTicket"),
  escalate_ticket: require("./escalateTicket"),
};
module.exports = registry;
```
The Investigation Module (FTL.md §4) looks up tools by name from this registry — the same names are used in prompt descriptions if/when native LLM function-calling is adopted later (SAD.md §16), keeping the tool contract stable across that future migration.

## 10. RAG pipeline (implementation)

`knowledge/retrieval_service/build_index.py` (run once at deploy/startup):
```python
from sentence_transformers import SentenceTransformer
import faiss, json, glob

model = SentenceTransformer("all-MiniLM-L6-v2")
chunks = []  # [{doc, text}]
for path in glob.glob("../docs/*.md"):
    doc_key = path.split("/")[-1].replace(".md", "")
    text = open(path).read()
    for chunk in chunk_text(text, max_tokens=200):   # simple paragraph/sentence-window chunking
        chunks.append({"doc": doc_key, "text": chunk})

vectors = model.encode([c["text"] for c in chunks])
index = faiss.IndexFlatIP(vectors.shape[1])
index.add(vectors)
faiss.write_index(index, "index.faiss")
json.dump(chunks, open("chunks.json", "w"))
```

`main.py` (FastAPI):
```python
@app.post("/retrieve")
def retrieve(req: RetrieveRequest):
    qvec = model.encode([req.query])
    scores, ids = index.search(qvec, req.k)
    results = [
        {"doc": chunks[i]["doc"], "chunk": chunks[i]["text"], "score": float(scores[0][j])}
        for j, i in enumerate(ids[0]) if scores[0][j] >= MIN_SIMILARITY
    ]
    return {"results": results}
```

## 11. Embedding pipeline / FAISS structure

- Index type: `IndexFlatIP` (exact inner-product search) — appropriate given the corpus is only ~6 documents / a few dozen chunks; no need for approximate-search index types (`IVF`, `HNSW`) at this scale.
- Chunking: paragraph-based with a soft max size (~150–200 tokens) to keep retrieved evidence readable in the dashboard investigation timeline, not just optimal for embedding.
- Index persisted to disk (`index.faiss` + `chunks.json`) and rebuilt only when documents change (manual re-run of `build_index.py`, or an admin-triggered re-index endpoint if time allows).

## 12. Environment variables

```text
# server/.env
PORT=4000
MONGODB_URI=mongodb+srv://...
LLM_PROVIDER=openai            # or anthropic, etc.
LLM_API_KEY=...
LLM_MODEL=gpt-4o-mini           # example; pin explicitly, do not hardcode in code
RETRIEVAL_SERVICE_URL=http://localhost:8000
CONFIDENCE_THRESHOLD=0.75
CORS_ORIGIN=https://supportflow-client.vercel.app

# client/.env
VITE_API_BASE_URL=https://supportflow-server.onrender.com

# knowledge/retrieval_service/.env
EMBEDDING_MODEL=all-MiniLM-L6-v2
MIN_SIMILARITY=0.55
```

## 13. API contracts — request/response examples

See §5 for the primary conversation endpoint. Additional example — ticket patch:

**Request:** `PATCH /api/tickets/tkt_8842`
```json
{ "status": "resolved", "note": "Called customer, confirmed refund manually processed via ops tool." }
```
**Response:**
```json
{ "id": "tkt_8842", "status": "resolved", "resolutionType": "manual", "updatedAt": "2026-09-22T10:15:00Z" }
```

## 14. Error handling (implementation)

`safeCall()` utility used throughout `orchestrator.js` and `modules/*`:
```js
async function safeCall(fn, { retries = 1, onFinalFailure }) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (err) { lastErr = err; }
  }
  return onFinalFailure(lastErr);
}
```
Applied per FTL.md §10 at every tool call, every LLM call, and the retrieval service call.

## 15. Validation

- Request body validation on `POST /message` (non-empty string, max length e.g. 2000 chars) using a lightweight validator (e.g. `zod` or manual checks) before the orchestrator runs.
- LLM structured-output validation: parsed JSON checked against expected keys/enum values before being trusted; malformed output triggers the retry-then-fallback path (FTL.md §10).

## 16. Security (implementation)

- `helmet` middleware for basic HTTP header hardening.
- `cors` restricted to `CORS_ORIGIN`.
- No secrets in client bundle — `VITE_*` vars contain only the public API base URL.
- Rate limiting (basic, e.g. `express-rate-limit`) on the message endpoint to prevent trivial abuse during public demo access, time permitting.

## 17. Logging

- Structured console logging at each orchestrator stage (`[intent]`, `[investigation]`, `[retrieval]`, `[reasoning]`, `[decision]`) tagged with `conversationId`/`ticketId` for easy correlation while debugging live during the hackathon.

## 18. Deployment

- **Client:** Vercel, auto-deploy from `client/` on push to `main`.
- **Server + retrieval service:** Render or Railway; server as one service, retrieval service as a second small service (or combined into one deployment with a process manager if the platform's free tier makes two services impractical — acceptable simplification, noted here explicitly rather than silently done).
- **Database:** MongoDB Atlas, free-tier cluster, IP allowlist open to the deployment platform's egress ranges (or `0.0.0.0/0` for hackathon simplicity, rotated/closed after judging).

## 19. Testing strategy (prototype-appropriate)

- Manual scenario testing (the four demo scenarios) is the primary test strategy given the 12-hour constraint — formalized as a checklist run during Phase 9 (phases.md).
- If time allows: a handful of unit tests on pure logic functions with no external dependency — `shouldEscalate()` (FTL.md §6) and the intent-to-tool map (FTL.md §4) are the highest-value candidates, since they're deterministic and central to correctness.
- No end-to-end automated test suite is built for the prototype — explicitly deferred to Future scope, consistent with PRD.md §15.

---

## Final consistency check (across all 9 documents)

- Project name, tech stack, tool names, module names, decision states, confidence threshold, escalation rules, and folder structure are identical across Architecture.md, PRD.md, design.md, FAD.md, FTL.md, phases.md, Resource_Chart.md, SAD.md, and this document.
- No unresolved contradictions.
- All four demo scenarios are traceable end-to-end through every document, from product requirement (PRD.md) through UI (design.md) through functional flow (FAD.md/FTL.md) through implementation (SAD.md/TAD.md).

**Documentation set complete.**

*End of TAD.md*
