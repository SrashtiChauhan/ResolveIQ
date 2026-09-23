const evaluateRefund = ({ order, payment, policy }) => {
  if (!order || !payment) {
    return {
      allowed: false,
      reason: "Missing order or payment information",
    };
  }

  const refundPolicy = policy?.results?.find(
    (result) => result.type === "refund_policy",
  );

  if (!refundPolicy) {
    return {
      allowed: false,
      reason: "Refund policy could not be verified",
    };
  }

  if (order.status !== "cancelled") {
    return {
      allowed: false,
      reason: "Order is not cancelled",
    };
  }

  if (payment.status !== "successful") {
    return {
      allowed: false,
      reason: "Payment was not successfully captured",
    };
  }

  if (order.refundStatus === "completed") {
    return {
      allowed: false,
      reason: "Refund has already been completed",
    };
  }
  if (order.refundStatus === "initiated") {
    return {
      allowed: false,
      reason: "Refund request has already been initiated",
    };
  }

  return {
    allowed: true,
    reason: "Order, payment, and refund policy conditions are satisfied",
  };
};

module.exports = {
  evaluateRefund,
};
