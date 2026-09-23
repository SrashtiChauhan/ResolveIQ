const { shouldEscalate } = require("../src/agent/escalationEngine");

const result = shouldEscalate({
  confidence: 0.9,

  previousTickets: [
    {
      ticketId: "TKT-4001",
      status: "open",
      intent: "refund_request",
    },
    {
      ticketId: "TKT-4002",
      status: "open",
      intent: "refund_request",
    },
    {
      ticketId: "TKT-4003",
      status: "open",
      intent: "refund_request",
    },
  ],

  knowledgeResults: [
    {
      documentId: "KB-REFUND",
      type: "refund_policy",
      score: 0.82,
    },
  ],

  toolError: false,
  unsafeAction: false,
});

console.log("\n=== ESCALATION DECISION ===");
console.log(result);