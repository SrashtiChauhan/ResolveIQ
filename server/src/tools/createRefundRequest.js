const Order = require("../models/Order");
const Payment = require("../models/Payment");

const createRefundRequest = async ({ orderId, reason }) => {
  if (!orderId) {
    throw new Error("orderId is required");
  }

  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const payment = await Payment.findOne({ orderId });

  if (!payment) {
    throw new Error(`Payment not found for order: ${orderId}`);
  }

  if (order.status !== "cancelled") {
    throw new Error(
      "Refund request cannot be created because the order is not cancelled"
    );
  }

  if (payment.status !== "successful") {
    throw new Error(
      "Refund request cannot be created because payment was not successful"
    );
  }

  if (order.refundStatus === "completed") {
    throw new Error("Refund has already been completed");
  }

  order.refundStatus = "initiated";
  await order.save();

  return {
    success: true,
    action: "create_refund_request",
    orderId,
    paymentId: payment.paymentId,
    amount: payment.amount,
    reason: reason || "Customer refund request",
    refundStatus: "initiated",
  };
};

module.exports = createRefundRequest;