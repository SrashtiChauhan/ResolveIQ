const dotenv = require("dotenv");
const mongoose = require("mongoose");

const updateTicket = require("../src/tools/updateTicket");

dotenv.config();

const testTicketAction = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("\n=== UPDATE TICKET ===");

    const result = await updateTicket({
      ticketId: "TKT-1001",
      status: "resolved",
      priority: "high",
      note: "Refund request is being investigated.",
    });

    console.log(result);

    await mongoose.connection.close();

    console.log("\nTicket update test completed successfully.");
  } catch (error) {
    console.error("\nTicket update test failed:");
    console.error(error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

testTicketAction();