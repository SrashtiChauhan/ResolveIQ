const { getToolPlan } = require("../src/agent/toolPlanner");

const intents = [
  "order_status",
  "refund_request",
  "payment_issue",
  "cancellation",
  "general_policy",
  "complaint_unresolved",
  "unknown",
];

for (const intent of intents) {
  console.log(`\nIntent: ${intent}`);
  console.log("Tools:", getToolPlan(intent));
}