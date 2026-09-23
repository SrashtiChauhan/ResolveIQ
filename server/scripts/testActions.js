const dotenv = require("dotenv");
const mongoose = require("mongoose");

const createRefundRequest = require("../src/tools/createRefundRequest");

dotenv.config();

const testActions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("\n=== CREATE REFUND REQUEST ===");

    const result = await createRefundRequest({
      orderId: "ORD-1001",
      reason: "Customer requested refund for cancelled order",
    });

    console.log(result);

    await mongoose.connection.close();

    console.log("\nAction test completed successfully.");
  } catch (error) {
    console.error("\nAction test failed:");
    console.error(error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

testActions();