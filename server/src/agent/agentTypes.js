const AgentInput = {
  customerId: "",
  ticketId: "",
  message: "",
};

const AgentOutput = {
  success: false,
  intent: null,
  response: "",
  action: null,
  escalated: false,
  evidence: [],
};

module.exports = {
  AgentInput,
  AgentOutput,
};