const classifyIntent = require("./intentClassifier");
const { getToolPlan } = require("./toolPlanner");
const executeTool = require("./toolExecutor");
const { evaluateRefund } = require("./decisionEngine");
const { shouldEscalate } = require("./escalationEngine");
const executeAction = require("./actionExecutor");
const generateResponse = require("./responseGenerator");

const runAgent = async ({ customerId, ticketId, message }) => {
  const intent = classifyIntent(message);
  const plannedTools = getToolPlan(intent);

  const evidence = {};
  const toolErrors = [];

  for (const toolName of plannedTools) {
    try {
      let args = {};

      switch (toolName) {
        case "get_customer":
          args = { customerId };
          break;

        case "get_order":
          args = { customerId };
          break;

        case "get_payment":
          args = { customerId };
          break;

        case "get_previous_tickets":
          args = { customerId };
          break;

        case "search_knowledge_base":
          args = {
            query: message,
            topK: 3,
          };
          break;

        default:
          args = {};
      }

      evidence[toolName] = await executeTool(toolName, args);
    } catch (error) {
      toolErrors.push({
        tool: toolName,
        error: error.message,
      });
    }
  }

  let decision = null;

  if (intent === "refund_request") {
    const order = Array.isArray(evidence.get_order)
      ? evidence.get_order[0]
      : evidence.get_order;

    const payment = Array.isArray(evidence.get_payment)
      ? evidence.get_payment[0]
      : evidence.get_payment;

    decision = evaluateRefund({
      order,
      payment,
      policy: evidence.search_knowledge_base,
    });
  }

  const previousTickets = evidence.get_previous_tickets || [];

  const knowledgeResults = evidence.search_knowledge_base?.results || [];

  const escalation = shouldEscalate({
    confidence: 1,
    previousTickets,
    knowledgeResults,
    knowledgeRequired: plannedTools.includes("search_knowledge_base"),
    toolError: toolErrors.length > 0,
    unsafeAction: false,
  });

  if (decision && !decision.allowed && !escalation.escalate) {
    escalation.escalate = true;
    escalation.reason = decision.reason;
    escalation.priority = "high";
  }

  let actionResult = null;

  if (
    intent === "refund_request" &&
    decision?.allowed === true &&
    !escalation.escalate
  ) {
    const order = Array.isArray(evidence.get_order)
      ? evidence.get_order[0]
      : evidence.get_order;

    actionResult = await executeAction({
      action: "create_refund_request",
      allowed: true,
      args: {
        orderId: order.orderId,
        reason: message,
      },
    });
  }

  // Generate the customer-facing response AFTER
  // evidence, decision, escalation, and action are known.
  const response = await generateResponse({
    intent,
    decision,
    escalation,
    actionResult,
    evidence,
  });

  return {
    success: toolErrors.length === 0,
    intent,
    plannedTools,
    evidence,
    decision,
    escalation,
    actionResult,
    response,
    action: null,
    ticketId: ticketId || null,
  };
};

module.exports = runAgent;
