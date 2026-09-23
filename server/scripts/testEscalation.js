const dotenv = require("dotenv");
const mongoose = require("mongoose");

const escalateTicket = require("../src/tools/escalateTicket");

dotenv.config();

const testEscalation = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("\n=== ESCALATE TICKET ===");

    const result = await escalateTicket({
      ticketId: "TKT-4001",
      reason: "Customer has contacted support repeatedly about the same unresolved refund issue.",
      priority: "high",
    });

    console.log(result);

    await mongoose.connection.close();

    console.log("\nEscalation test completed successfully.");
  } catch (error) {
    console.error("\nEscalation test failed:");
    console.error(error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

testEscalation();