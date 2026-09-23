const dotenv = require("dotenv");
const mongoose = require("mongoose");

const getCustomer = require("../src/tools/getCustomer");
const getOrder = require("../src/tools/getOrder");
const getPayment = require("../src/tools/getPayment");
const getPreviousTickets = require("../src/tools/getPreviousTickets");

dotenv.config();

const testTools = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("\n=== GET CUSTOMER ===");

    const customer = await getCustomer({
      customerId: "cust_1004",
    });

    console.log(customer);

    console.log("\n=== GET ORDER ===");

    const orders = await getOrder({
      customerId: "cust_1004",
    });

    console.log(orders);

    console.log("\n=== GET PAYMENT ===");

    const payments = await getPayment({
      customerId: "cust_1004",
    });

    console.log(payments);

    console.log("\n=== GET PREVIOUS TICKETS ===");

    const tickets = await getPreviousTickets({
      customerId: "cust_1004",
    });

    console.log(tickets);

    await mongoose.connection.close();

    console.log("\nAll tools executed successfully.");
  } catch (error) {
    console.error("\nTool test failed:");
    console.error(error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

testTools();