require("dotenv").config();

const connectDB = require("../src/config");
const executeAction = require("../src/agent/actionExecutor");

const runTest = async () => {
  try {
    await connectDB();

    const result = await executeAction({
      action: "create_refund_request",
      allowed: false,
      args: {
        orderId: "ORD-1001",
        reason: "Customer requested refund",
      },
    });

    console.log("\n=== ACTION EXECUTOR TEST ===");
    console.log(result);

    process.exit(0);
  } catch (error) {
    console.error("Action executor test failed:", error.message);
    process.exit(1);
  }
};

runTest();