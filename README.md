
# ResolveIQ

### AI-Powered Customer Support Investigation & Resolution Agent

> **ResolveIQ is an agentic customer-support system that investigates customer issues using real customer, order, payment, ticket-history and policy data — then resolves the issue, performs an allowed action, or escalates it to a human agent.**

---

## 🚀 What is ResolveIQ?

Traditional customer-support chatbots mainly generate answers from a conversation.

**ResolveIQ follows an investigation-first approach.**

When a customer raises an issue, ResolveIQ:

```text
Customer Message
       ↓
Intent Classification
       ↓
Tool Planning
       ↓
Customer / Order / Payment Investigation
       ↓
Previous Ticket Analysis
       ↓
Policy Retrieval using RAG
       ↓
Evidence-Based Decision
       ↓
 ┌───────────────┐
 │               │
Resolve        Escalate
 │               │
Action          Human Agent
       ↓
Customer Response
       ↓
Investigation Persisted
```

This makes the system more than a simple conversational interface: the backend orchestrates a structured investigation pipeline before taking an action.

---

# 🎯 Problem

Customer-support teams often need to manually combine information from multiple sources before resolving a request:

* Customer profile
* Order status
* Payment status
* Previous support tickets
* Company policies
* Resolution history

For example, a request such as:

> *"My order was cancelled but I was already charged. Can I get a refund?"*

cannot reliably be answered from the message alone.

The system needs to verify:

```text
Customer
   +
Order
   +
Payment
   +
Previous Tickets
   +
Refund Policy
```

ResolveIQ automates this investigation and provides a structured path toward resolution or escalation.

---

# 🧠 Core Idea

ResolveIQ separates **investigation, decision-making and execution**.

The LLM does not directly control the entire system.

Instead:

```text
LLM / Intent
      ↓
Backend-controlled Orchestrator
      ↓
Tools
      ↓
Evidence
      ↓
Decision Engine
      ↓
Action / Escalation
```

This makes the reasoning workflow more explicit and inspectable rather than relying on a single black-box LLM response. 

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│                                                              │
│   Customer Chat UI              Agent Dashboard              │
│   React + Vite + Tailwind      React + Vite + Tailwind      │
└───────────────┬───────────────────────┬──────────────────────┘
                │ REST                  │ REST
                ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│                                                              │
│  Conversation API     Agent Orchestrator    Ticket API      │
│                              │                               │
│               ┌──────────────┼──────────────┐                │
│               ▼              ▼              ▼                │
│            Tools           LLM Client    RAG Retrieval       │
│               │              │              │                │
└───────────────┼──────────────┼──────────────┼────────────────┘
                │              │              │
                ▼              ▼              ▼
          ┌──────────┐    ┌─────────┐    ┌──────────────┐
          │ MongoDB  │    │ Ollama  │    │ Sentence     │
          │  Atlas   │    │ LLM     │    │ Transformers │
          └──────────┘    └─────────┘    └──────┬───────┘
                                                 │
                                            ┌────▼────┐
                                            │  FAISS  │
                                            └─────────┘
```

The architecture uses React/Vite/Tailwind for the client, Node/Express for the application layer, MongoDB for domain data, an LLM client behind an abstraction, and a separate retrieval service using Sentence Transformers and FAISS. 

---

# 🔄 Agent Investigation Pipeline

Every support request follows a controlled pipeline:

### 1. Intent Classification

The incoming message is classified into intents such as:

```text
order_status
refund_request
payment_issue
cancellation
general_policy
complaint_unresolved
unknown
```

### 2. Tool Planning

The orchestrator determines which backend tools are required for the detected intent.

Example:

```text
Refund Request
      ↓
get_customer()
get_order()
get_payment()
get_previous_tickets()
search_knowledge_base()
```

### 3. Tool Execution

Tools retrieve structured information from MongoDB or the knowledge-retrieval service.

### 4. Evidence Building

The system combines:

```text
Customer Data
Order Data
Payment Data
Previous Tickets
Policy Evidence
```

into an investigation context.

### 5. Decision Engine

The decision layer determines whether the request can be resolved safely based on the available evidence.

For example, a refund requires verification of the order, payment and applicable refund policy.

### 6. Action / Escalation

If the request is eligible:

```text
create_refund_request()
        ↓
update_ticket()
```

If the system cannot safely resolve the request:

```text
escalate_ticket()
```

### 7. Response Generation

The customer receives a concise response based on the verified result.

---

# 🛠️ Tool Layer

ResolveIQ exposes backend capabilities through a controlled tool registry:

| Tool                      | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `get_customer()`          | Retrieve customer information              |
| `get_order()`             | Retrieve order information                 |
| `get_payment()`           | Retrieve payment information               |
| `get_previous_tickets()`  | Analyze support history                    |
| `search_knowledge_base()` | Retrieve relevant policies                 |
| `create_refund_request()` | Initiate refund workflow                   |
| `update_ticket()`         | Update support ticket                      |
| `escalate_ticket()`       | Transfer unresolved cases to human support |

These tools form the interface between the agent orchestration layer and the application's data/actions.

---

# 📚 RAG Knowledge Retrieval

ResolveIQ uses **Retrieval-Augmented Generation (RAG)** for policy-related questions.

### Pipeline

```text
Knowledge Documents
        ↓
Chunking
        ↓
Sentence Transformers
        ↓
Embeddings
        ↓
FAISS Vector Index
        ↓
Semantic Retrieval
        ↓
Relevant Policy Evidence
        ↓
Agent Decision / Response
```

Embedding model:

```text
all-MiniLM-L6-v2
```

Vector search:

```text
FAISS IndexFlatIP
```

The retrieval service exposes a retrieval endpoint that the Node backend accesses through the knowledge-base tool. This keeps the Python retrieval component separate from the main Express orchestration layer. 

---

# 🤖 LLM Layer

The LLM is used as part of the agent pipeline rather than being responsible for unrestricted system control.

Current prototype:

```text
Ollama
   ↓
Gemma 3 4B
```

The LLM client is isolated behind a dedicated interface, allowing the model/provider to be changed without redesigning the entire application.

---

# 🚨 Deterministic Escalation

ResolveIQ does not rely only on the LLM to decide when human intervention is required.

The escalation layer evaluates deterministic conditions such as:

```text
Low confidence
       OR
Required tool failure
       OR
Missing policy evidence
       OR
3+ unresolved related tickets
       OR
Unsafe action
       OR
High urgency + strong negative sentiment
       ↓
Human Escalation
```

This provides a controlled fallback when automated resolution is insufficient.

---

# 👨‍💼 Human Agent Dashboard

Escalated cases are surfaced through the agent dashboard.

The dashboard provides:

```text
Customer
Issue
Priority
Intent
Investigation Evidence
Tools Used
Policy Information
Decision
Escalation Reason
Ticket Status
```

The goal is that the human agent receives the **investigation context**, rather than having to repeat the same investigation manually.

---

# 🗄️ Data Model

MongoDB stores the primary application data:

```text
MongoDB Atlas
│
├── customers
├── orders
├── payments
├── tickets
└── knowledgeDocuments
```

This allows the prototype to simulate a realistic support environment while keeping the architecture ready for integration with external systems.

---

# 🧪 Demo Scenarios

The MVP is designed around four core support scenarios.

### Scenario 1 — Order Status

```text
"Where is my order?"
```

Flow:

```text
Intent
 ↓
Customer Lookup
 ↓
Order Lookup
 ↓
Customer Response
```

---

### Scenario 2 — Refund Investigation

```text
"My order was cancelled but I was already charged.
Can I get a refund?"
```

Flow:

```text
Customer
   +
Order
   +
Payment
   +
Previous Tickets
   +
Refund Policy
        ↓
Investigation
        ↓
Decision
```

---

### Scenario 3 — Policy Question

```text
"What is your refund policy?"
```

Flow:

```text
Question
   ↓
Semantic Retrieval
   ↓
Relevant Knowledge Document
   ↓
Policy-based Response
```

---

### Scenario 4 — Repeated Unresolved Complaint

```text
"I have contacted support multiple times
and this still isn't resolved."
```

Flow:

```text
Previous Tickets
       ↓
3+ unresolved cases
       ↓
High-priority escalation
       ↓
Agent Dashboard
       ↓
Human Resolution
```

The four scenarios correspond to the MVP acceptance criteria defined for the system. 

---

# 🔐 Safety & Control

ResolveIQ uses backend-controlled actions.

The system does **not** allow the LLM to directly modify arbitrary database records.

Instead:

```text
LLM / Agent Decision
        ↓
Decision Engine
        ↓
Action Executor
        ↓
Approved Tool
        ↓
Database
```

Actions such as refunds are therefore validated before execution.

---

# 💻 Tech Stack

| Layer               | Technology                  |
| ------------------- | --------------------------- |
| Frontend            | React, Vite, Tailwind CSS   |
| Backend             | Node.js, Express            |
| Database            | MongoDB Atlas, Mongoose     |
| Agent Orchestration | Custom Node.js orchestrator |
| LLM                 | Ollama + Gemma 3 4B         |
| Embeddings          | Sentence Transformers       |
| Vector Search       | FAISS                       |
| RAG Service         | Python + FastAPI            |
| API Communication   | REST / JSON                 |
| Development         | Git + GitHub                |

---

# 📁 Project Structure

```text
ResolveIQ/
│
├── client/
│   └── React + Vite frontend
│
├── server/
│   ├── src/
│   │   ├── agent/
│   │   ├── models/
│   │   └── tools/
│   │
│   └── scripts/
│
├── rag-service/
│   ├── api.py
│   ├── embedder.py
│   ├── chunker.py
│   ├── retrieve.py
│   └── vector_store.py
│
├── files/
│   ├── Architecture.md
│   ├── FAD.md
│   ├── FTL.md
│   ├── PRD.md
│   ├── SAD.md
│   └── TAD.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

# ▶️ Running Locally

### 1. Clone

```bash
git clone https://github.com/SrashtiChauhan/ResolveIQ.git
cd ResolveIQ
```

### 2. Backend

```bash
cd server
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

### 4. RAG Service

```bash
cd rag-service
uv sync
uv run python main.py
```

### 5. Environment

Create the required `.env` files using:

```text
.env.example
```

Never commit real credentials or database connection strings.

---

# 📌 Current MVP Scope

### Implemented

* Customer support chat
* Agent dashboard
* MongoDB-backed customer/order/payment/ticket data
* Intent classification
* Deterministic tool planning
* Tool execution layer
* Policy retrieval using RAG
* LLM integration
* Decision engine
* Refund action workflow
* Ticket updates
* Deterministic escalation
* Human-agent handoff
* Seeded demonstration scenarios

### Future Scope

The architecture intentionally leaves production-scale concerns outside the MVP, including:

* Multi-tenant authentication
* Real payment gateway integration
* Integration with production ticketing platforms
* Horizontal scaling
* Production observability infrastructure

These are outside the prototype scope defined in the architecture. 

---

# 🏆 Why ResolveIQ?

ResolveIQ demonstrates an **investigation-first support architecture**:

```text
Not just:

User → LLM → Answer

Instead:

User
 ↓
Intent
 ↓
Investigation
 ↓
Tools
 ↓
Real Data
 ↓
Policy Retrieval
 ↓
Decision
 ↓
Action / Escalation
 ↓
Response
```

The core design principle is:

> **Don't just generate an answer — investigate the case, verify the evidence, take an allowed action, or hand the case to a human with the investigation context intact.**

---

## 👥 Team

**Team:** PHANTOM CODERS

**Project:** ResolveIQ

**Category:** Agentic AI / Customer Support Automation

---
