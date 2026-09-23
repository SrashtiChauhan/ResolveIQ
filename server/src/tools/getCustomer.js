const Customer = require("../models/Customer");

const getCustomer = async ({ customerId }) => {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const customer = await Customer.findOne({ customerId }).lean();

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  return {
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
};

module.exports = getCustomer;