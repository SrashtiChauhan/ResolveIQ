const toolPlans = {
  order_status: [
    "get_customer",
    "get_order",
  ],

  refund_request: [
    "get_customer",
    "get_order",
    "get_payment",
    "get_previous_tickets",
    "search_knowledge_base",
  ],

  payment_issue: [
    "get_customer",
    "get_payment",
    "get_previous_tickets",
    "search_knowledge_base",
  ],

  cancellation: [
    "get_customer",
    "get_order",
    "search_knowledge_base",
  ],

  general_policy: [
    "get_customer",
    "search_knowledge_base",
  ],

  complaint_unresolved: [
    "get_customer",
    "get_previous_tickets",
  ],

  unknown: [
    "get_customer",
  ],
};

const getToolPlan = (intent) => {
  return toolPlans[intent] || toolPlans.unknown;
};

module.exports = {
  getToolPlan,
  toolPlans,
};