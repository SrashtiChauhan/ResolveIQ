require("dotenv").config();
const connectDB = require("../src/config");
const executeTool = require("../src/agent/toolExecutor");

const runTest = async () => {
  try {
    await connectDB();

    const customerId = "cust_1001";
    const orderId = "ORD-1001";

    const evidence = {};

    evidence.customer = await executeTool(
      "get_customer",
      { customerId }
    );

    evidence.order = await executeTool(
      "get_order",
      { customerId, orderId }
    );

    evidence.payment = await executeTool(
      "get_payment",
      { customerId, orderId }
    );

    evidence.previousTickets = await executeTool(
      "get_previous_tickets",
      { customerId }
    );

    evidence.policy = await executeTool(
      "search_knowledge_base",
      {
        query:
          "Can a cancelled order that was already charged be refunded?",
        topK: 3,
      }
    );

    console.log("\n=== EVIDENCE BUNDLE ===");
    console.log(JSON.stringify(evidence, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Tool execution failed:", error.message);
    process.exit(1);
  }
};

runTest();