const Payment = require("../models/Payment");

const getPayment = async ({ customerId, orderId, paymentId }) => {
  if (!customerId && !orderId && !paymentId) {
    throw new Error(
      "customerId, orderId, or paymentId is required"
    );
  }

  let query;

  if (paymentId) {
    query = { paymentId };
  } else if (orderId) {
    query = { orderId };
  } else {
    query = { customerId };
  }

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!payments.length) {
    throw new Error("Payment record not found");
  }

  return payments.map((payment) => ({
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    customerId: payment.customerId,
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
  }));
};

module.exports = getPayment;