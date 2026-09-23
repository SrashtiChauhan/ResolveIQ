const classifyIntent = (message) => {
  const text = message.toLowerCase().trim();

  if (!text) {
    return "unknown";
  }

  // Policy questions should be detected first.
  if (
    text.includes("policy") ||
    text.includes("rule") ||
    text.includes("eligible") ||
    text.includes("allowed")
  ) {
    return "general_policy";
  }

  if (
    text.includes("refund") ||
    text.includes("money back") ||
    (text.includes("charged") && text.includes("cancel"))
  ) {
    return "refund_request";
  }

  if (
    text.includes("payment") ||
    text.includes("paid") ||
    text.includes("transaction") ||
    text.includes("charged")
  ) {
    return "payment_issue";
  }

  if (
    text.includes("cancel") ||
    text.includes("cancellation")
  ) {
    return "cancellation";
  }

  if (
    text.includes("where is my order") ||
    text.includes("order status") ||
    text.includes("track my order") ||
    text.includes("when will my order")
  ) {
    return "order_status";
  }

  if (
    text.includes("complaint") ||
    text.includes("still not resolved") ||
    text.includes("not resolved") ||
    text.includes("already contacted")
  ) {
    return "complaint_unresolved";
  }

  return "unknown";
};

module.exports = classifyIntent;