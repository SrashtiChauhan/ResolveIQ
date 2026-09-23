# FTL.md — Functional Technical Logic — SupportFlow AI

**Reads:** Architecture.md, PRD.md, design.md, FAD.md
**Status:** Draft v1.0

---

## 1. Purpose

This document specifies the detailed decision logic behind the modules defined in FAD.md — confidence thresholds, escalation rules, tool-calling logic, retrieval logic, and error handling — in enough detail to implement directly.

## 2. Support request flow (full)

```text
Customer Message
↓
[Intent & Signal] Classify intent, urgency, sentiment
↓
[Identity] Resolve customer (lookup by session/email/demo-selected ID)
↓
[Investigation] Select relevant tools based on intent → call get_order / get_payment / get_previous_tickets as applicable
↓
[Knowledge Retrieval] Embed issue text → FAISS top-k search → retrieve policy chunks
↓
[Reasoning] Build evidence bundle → call LLM with structured-output prompt
↓
[Decision Parsing] Parse decision, confidence, rationale, action (if any)
↓
[Escalation Check] Apply deterministic rules (independent of LLM confidence)
↓
   ├─ Escalate ─▶ [Escalation] create/flag ticket, attach full Investigation, notify dashboard
   └─ Resolve ─▶ [Action] (if resolve_with_action) execute safe tool → [Response] generate reply
↓
[Persistence] Save Investigation object regardless of branch
```

## 3. Intent classification logic

Intents recognized in MVP scope: `order_status`, `refund_request`, `payment_issue`, `cancellation_issue`, `general_policy_question`, `complaint_unresolved`, `unknown`.

```pseudocode
function classifyIntent(message):
  result = callLLM(
    system = INTENT_CLASSIFIER_PROMPT,
    input = message,
    responseFormat = JSON { intent, urgency: low|medium|high, sentiment: neutral|frustrated|angry }
  )
  if result.intent not in KNOWN_INTENTS:
    result.intent = "unknown"
  return result
```

If classification fails (LLM error/timeout) → default to `intent: "unknown", urgency: "medium"` and proceed; `unknown` intent always triggers minimal investigation (identity only) and, per §6, forces escalation rather than guessing.

## 4. Tool-calling logic (which tools fire for which intent)

| Intent | Tools called |
|---|---|
| `order_status` | `get_customer`, `get_order` |
| `refund_request` | `get_customer`, `get_order`, `get_payment`, `get_previous_tickets`, `search_knowledge_base(refund_policy)` |
| `payment_issue` | `get_customer`, `get_payment`, `get_previous_tickets`, `search_knowledge_base(payment_policy)` |
| `cancellation_issue` | `get_customer`, `get_order`, `search_knowledge_base(cancellation_policy)` |
| `general_policy_question` | `get_customer`, `search_knowledge_base(<inferred doc>)` |
| `complaint_unresolved` | `get_customer`, `get_previous_tickets` (always, regardless of sub-topic) |
| `unknown` | `get_customer` only, then escalate |

```pseudocode
function selectTools(intent):
  return INTENT_TOOL_MAP[intent] or ["get_customer"]

function runInvestigation(intent, customerId, message):
  tools = selectTools(intent)
  evidence = {}
  for tool in tools:
    try:
      evidence[tool] = callTool(tool, buildInput(tool, customerId, message))
    catch ToolError as e:
      evidence[tool] = { error: e.message, attempted: true }
      log(e)
  return evidence
```

## 5. Retrieval logic (RAG)

```pseudocode
function retrieveKnowledge(message, intent):
  queryText = message + " " + INTENT_KEYWORD_HINTS[intent]
  queryVector = embed(queryText)               # Sentence Transformers
  results = faissIndex.search(queryVector, k=3)
  return results.filter(r => r.score >= MIN_SIMILARITY)  # e.g. 0.55
```

If retrieval returns zero results above threshold, the Reasoning Module proceeds with an explicit "no matching policy found" evidence flag — this is a strong signal toward escalation (see §6, rule E3).

## 6. Escalation rules (deterministic, enforced in code — not left solely to the LLM)

| Rule | Condition | Result |
|---|---|---|
| E1 | `confidence < 0.75` | Escalate |
| E2 | Any tool called returned an `error` for a tool required by the matched intent | Escalate |
| E3 | Intent required a knowledge match and retrieval returned none above threshold | Escalate |
| E4 | `previousTickets` count on the same normalized issue topic ≥ 3 and none marked resolved | Escalate, priority = high |
| E5 | `sentiment == "angry"` AND `urgency == "high"` AND intent is not a simple `order_status` lookup | Escalate, priority = high |
| E6 | Decision's proposed action is not in `SAFE_ACTIONS = [create_refund_request, update_ticket]` | Escalate |
| — | None of the above, and `decision != "escalate"` from the LLM | Proceed to resolve/action |

```pseudocode
function shouldEscalate(evidence, retrieval, llmDecision):
  if llmDecision.confidence < 0.75: return {escalate: true, reason: "low_confidence"}
  if hasToolError(evidence): return {escalate: true, reason: "missing_evidence"}
  if requiresKnowledge(llmDecision.intent) and retrieval.isEmpty():
      return {escalate: true, reason: "no_policy_match"}
  if repeatedUnresolvedCount(evidence.previousTickets) >= 3:
      return {escalate: true, reason: "repeated_contact", priority: "high"}
  if evidence.sentiment == "angry" and evidence.urgency == "high" and llmDecision.intent != "order_status":
      return {escalate: true, reason: "high_risk_sentiment", priority: "high"}
  if llmDecision.action and llmDecision.action not in SAFE_ACTIONS:
      return {escalate: true, reason: "unsafe_action_requested"}
  return {escalate: llmDecision.decision == "escalate", reason: llmDecision.decision == "escalate" ? "model_requested" : null}
```

## 7. Reasoning / decision logic

```pseudocode
function reason(evidence, retrieval, intent, message):
  prompt = buildEvidenceBundle(evidence, retrieval, intent, message)
  response = callLLM(
    system = REASONING_SYSTEM_PROMPT,   # instructs: reason only from provided evidence, never invent data
    input = prompt,
    responseFormat = JSON {
      decision: "resolve" | "resolve_with_action" | "escalate",
      confidence: float(0-1),
      rationale: string,
      action: { tool: string, params: object } | null
    }
  )
  return response
```

The reasoning prompt explicitly instructs the model: *"Only use the evidence provided. If evidence is insufficient or contradictory, set decision to escalate with confidence reflecting your uncertainty. Never invent order, payment, or policy details not present in the evidence."*

## 8. Action execution logic

```pseudocode
function executeAction(decision, customerId):
  if decision.action.tool not in SAFE_ACTIONS:
      throw UnsafeActionError()
  result = callTool(decision.action.tool, { customerId, ...decision.action.params })
  updateTicket(ticketId, { status: "resolved", resolutionType: "automated" })
  return result
```

Every action call is wrapped so a failure here does **not** silently report success to the customer — see §10.

## 9. Response generation logic

```pseudocode
function generateResponse(decision, evidence, escalationResult):
  if escalationResult.escalate:
    return template("We've escalated your case to a specialist because {reason}. Reference: {ticketId}.")
  if decision.decision == "resolve_with_action":
    return callLLM(system=RESPONSE_PROMPT, input={decision, evidence, actionResult})
  return callLLM(system=RESPONSE_PROMPT, input={decision, evidence})
```

Response generation always passes through the LLM for natural phrasing, but the *facts* it's allowed to state come only from `evidence`/`actionResult` — the prompt forbids adding unstated details.

## 10. Error handling & retry behavior

| Failure point | Behavior |
|---|---|
| Tool call fails (DB error, mock timeout) | Retry once with backoff (e.g. 300ms); on second failure, record as `error` evidence (see §4) and continue — do not crash the request |
| LLM call fails (classification, reasoning, or response step) | Retry once; on second failure: for classification → default to `unknown` intent (§3); for reasoning → force `escalate` with `reason: "reasoning_unavailable"`; for response generation → fall back to a static template referencing the ticket/escalation state |
| Action execution fails after a `resolve_with_action` decision | Do not tell the customer the action succeeded. Downgrade to escalation with `reason: "action_execution_failed"`, and persist the attempted action + error in the Investigation record |
| FAISS/embedding service unavailable | Skip knowledge retrieval, mark `retrieval: unavailable` in evidence; per rule E3 this pushes intents that require policy knowledge toward escalation |
| Invalid/empty customer message | Return a clarifying prompt to the customer without invoking the full investigation pipeline (no tool calls, no LLM reasoning call — just a direct "Could you tell me more about the issue?" response) |
| Customer cannot be identified | Escalate immediately with `reason: "identity_unresolved"` — investigation modules that require a customer ID are skipped |
| Missing data mid-investigation (e.g. order not found for a valid customer) | Treated as evidence, not an error — the Reasoning Module explicitly handles "no order found" as a possible legitimate state (e.g. customer misremembered), and is instructed to ask a clarifying question or escalate rather than guess |

## 11. Human handoff logic

```pseudocode
function escalate(evidence, retrieval, decision, reason, priority):
  investigation = buildInvestigationRecord(evidence, retrieval, decision, reason)
  ticket = createOrUpdateTicket({
    status: "escalated",
    priority: priority or derivePriorityFromUrgency(evidence.urgency),
    escalationReason: reason,
    investigation: investigation
  })
  return ticket
```

No summarization/lossy compression happens at handoff time — the full tool call inputs/outputs and retrieved policy chunks are stored verbatim in `investigation`, so the dashboard (design.md §8–9) can render them directly without a second AI pass.

---

## Consistency check

- Tool names, decision states, confidence threshold (0.75), and escalation reasons all match Architecture.md, PRD.md §12, and FAD.md exactly.
- SAFE_ACTIONS list matches PRD.md §12 rule 3 and Architecture.md §6.
- No contradictions found. **Proceeding to Agent 06 → phases.md.**

*End of FTL.md*
