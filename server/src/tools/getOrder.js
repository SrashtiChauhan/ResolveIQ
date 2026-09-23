const Order = require("../models/Order");

const getOrder = async ({ customerId, orderId }) => {
  if (!customerId && !orderId) {
    throw new Error("customerId or orderId is required");
  }

  let query;

  if (orderId) {
    query = { orderId };
  } else {
    query = { customerId };
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!orders.length) {
    throw new Error(
      `No order found for ${
        orderId ? `orderId ${orderId}` : `customerId ${customerId}`
      }`
    );
  }

  return orders.map((order) => ({
    orderId: order.orderId,
    customerId: order.customerId,
    product: order.product,
    amount: order.amount,
    status: order.status,
    cancelledAt: order.cancelledAt,
    refundStatus: order.refundStatus,
  }));
};

module.exports = getOrder;