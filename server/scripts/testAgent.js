require("dotenv").config({ path: "./server/.env" });

const connectDB = require("../src/config");
const runAgent = require("../src/agent/agent");

const runTest = async () => {
  try {
    await connectDB();

    const result = await runAgent({
    //   customerId: "cust_1004",
    //   ticketId: "TKT-4001",
    customerId: "cust_1001",
    ticketId: "TKT-1001",
      message:
        // "My order was cancelled but I was already charged. Can I get a refund?"
        // "Where is my order?"
        // "My payment failed",
        // "I want to cancel my order",
        // "What is your refund policy?",
        //  "I still haven't received my refund. I already contacted support multiple times.",
        "Tell me something about your company",
    });

    console.log("\n=== AGENT RESULT ===");
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Agent test failed:", error.message);
    process.exit(1);
  }
};

runTest();