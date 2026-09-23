const runAgent = require("./agent/agent");
const Ticket = require("./models/Ticket");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config");
const updateTicket = require("./tools/updateTicket");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ResolveIQ server is running",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { customerId, ticketId, message } = req.body;

    if (!customerId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "customerId and message are required",
      });
    }

    const result = await runAgent({
      customerId,
      ticketId,
      message: message.trim(),
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Chat API error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process the support request",
    });
  }
});
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("Ticket API error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch tickets",
    });
  }
});
app.put("/api/tickets/:ticketId", async (req, res) => {
  try {
    const { status, priority, note } = req.body;

    const result = await updateTicket({
      ticketId: req.params.ticketId,
      status,
      priority,
      note,
    });

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Ticket update error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`ResolveIQ server running on port ${PORT}`);
  });
};

startServer();