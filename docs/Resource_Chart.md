# Resource_Chart.md — SupportFlow AI

**Reads:** Architecture.md, PRD.md, design.md, FAD.md, FTL.md, phases.md
**Status:** Draft v1.0

---

## 1. Human resources

| Role | Responsibility | Primary phases |
|---|---|---|
| Frontend developer | Customer chat UI, agent dashboard UI (design.md implementation) | Phases 1, 6, 7 |
| Backend developer | Express APIs, Tool Layer, database schemas | Phases 1, 2, 3 |
| AI/ML developer | Orchestrator, reasoning logic, RAG pipeline | Phases 4, 5 |
| UI/UX responsibility | Design tokens, layout, states (design.md) — can be shared with frontend dev | Phases 6, 7 |
| Documentation/demo responsibility | Maintains the 9 docs, prepares demo script, narrates architecture to judges | Phase 10, ongoing |

**Team-size guidance:**
- **4 people (ideal):** one per row above.
- **3 people:** merge UI/UX responsibility into Frontend developer; one person still owns Documentation/demo on top of their primary role, done in the final hour.
- **2 people:** Person A = Backend + AI/ML (owns Phases 2–5), Person B = Frontend + UI/UX + Documentation (owns Phases 1, 6, 7, 10 collaboratively with A). This is the tightest realistic split — flag AI/ML + Backend combo as the highest-risk single point of failure and protect that person's time accordingly.
- **1 person (solo hackathon):** Follow phases sequentially in the exact order given in phases.md; do not parallelize; treat all [OPT] items as cut by default.

## 2. Software resources

| Tool | Purpose |
|---|---|
| Node.js | Backend runtime, frontend build tooling |
| React + Vite | Frontend framework/build |
| Tailwind CSS | Styling system (design.md tokens implemented as Tailwind config) |
| Lucide React | Icon set (used sparingly per design.md §17 — purposeful icons only) |
| Recharts | Dashboard analytics charts (optional scope) |
| MongoDB + Mongoose | Data modeling and persistence |
| Sentence Transformers | Embedding model for RAG |
| FAISS | Vector index for policy retrieval |
| LLM API (provider-agnostic) | Intent classification, reasoning, response generation |
| Git + GitHub | Version control, team collaboration |
| Postman (or Thunder Client/Insomnia) | API testing during Phases 3–4 |
| VS Code | Primary IDE |

No paid/enterprise tooling is required; all of the above have free tiers sufficient for a 12-hour prototype.

## 3. Infrastructure

| Resource | Purpose | Notes |
|---|---|---|
| MongoDB Atlas | Hosted database | Free tier (M0) sufficient |
| Vercel | Frontend hosting | Free tier, auto-deploy from GitHub |
| Render or Railway | Backend + Python retrieval process hosting | Free/hobby tier sufficient for demo traffic |
| Environment variables | `MONGODB_URI`, `LLM_PROVIDER`, `LLM_API_KEY`, `PORT`, `FAISS_INDEX_PATH` (or equivalent) | Stored in `.env` locally, in platform dashboard for deployment — never committed |
| API keys | One LLM provider key (whichever is configured) | Single key is sufficient; no need to provision multiple providers unless testing swap-ability |

No additional infrastructure (message queues, Redis, dedicated vector DB service, container orchestration) is needed — explicitly avoided as over-engineering for a 12-hour prototype per Architecture.md §2.

## 4. Data resources

| Data | Source for prototype | Volume needed |
|---|---|---|
| Customer data | Seeded mock records | 5–10 customers sufficient, including the specific fixtures for Scenarios 1–4 |
| Orders | Seeded mock records | 1–2 orders per customer, including a cancelled+charged order for Scenario 2/3 |
| Payments | Seeded mock records | Matched to orders above |
| Tickets | Seeded mock records | Include a customer with 3 unresolved prior tickets for Scenario 4 |
| Knowledge documents | Hand-written policy text (6 docs listed in Architecture.md) | Short, realistic policy documents — a few paragraphs each is enough for meaningful retrieval |

## 5. Time resources — priority during the 12-hour window

| Priority tier | Work | Rationale |
|---|---|---|
| **Highest** | Phases 1–4 (setup → orchestrator working for at least 2 scenarios) | Without a working reasoning loop, nothing else matters — this is the product |
| **High** | Phase 5 (RAG) and Phase 6 (customer UI) | RAG is the "multi-source investigation" proof; customer UI is what judges interact with first |
| **Medium** | Phase 7 (dashboard) | Needed for the escalation/human-handoff story, but a simplified version (list + JSON-ish detail view) is acceptable if time is tight |
| **Medium** | Phase 8 (integration) | Non-negotiable before demo, but should be fast if earlier phases were done cleanly |
| **Lower but non-skippable** | Phase 9 (testing) | Even 30–45 minutes of targeted failure-path testing meaningfully de-risks the live demo |
| **Fixed, protect at all costs** | Phase 10 (demo prep) | Reserve the last 45 minutes no matter how earlier phases ran over |

**Explicit guidance:** if behind schedule by Phase 5, cut RAG sophistication (fallback to keyword match, per phases.md priority summary) rather than cutting dashboard or demo prep — an incomplete but demo-able system beats a technically complete but unrehearsed one.

---

## Consistency check

- Phases referenced match phases.md exactly (same numbering, same names).
- Tech stack matches Architecture.md §7 exactly, no new tools introduced.
- No contradictions found. **Proceeding to Agent 08 → SAD.md.**

*End of Resource_Chart.md*
