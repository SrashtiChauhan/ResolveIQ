const shouldEscalate = ({
  confidence = 1,
  previousTickets = [],
  knowledgeResults = [],
  knowledgeRequired = false,
  toolError = false,
  unsafeAction = false,
}) => {
  if (toolError) {
    return {
      escalate: true,
      reason: "Required tool failed",
      priority: "high",
    };
  }

  if (unsafeAction) {
    return {
      escalate: true,
      reason: "Unsafe action detected",
      priority: "high",
    };
  }

  if (confidence < 0.75) {
    return {
      escalate: true,
      reason: "Agent confidence is below threshold",
      priority: "high",
    };
  }

  if (
    knowledgeRequired &&
    (!knowledgeResults || knowledgeResults.length === 0)
  ) {
    return {
      escalate: true,
      reason: "No relevant knowledge match found",
      priority: "high",
    };
  }
  const unresolvedTickets = previousTickets.filter(
    (ticket) => ticket.status !== "resolved",
  );

  if (unresolvedTickets.length >= 3) {
    return {
      escalate: true,
      reason: "Three or more unresolved previous tickets found",
      priority: "high",
    };
  }

  return {
    escalate: false,
    reason: "No escalation rule triggered",
    priority: "normal",
  };
};

module.exports = {
  shouldEscalate,
};
