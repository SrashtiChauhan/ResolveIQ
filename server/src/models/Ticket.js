const mongoose = require("mongoose");

const investigationSchema = new mongoose.Schema(
  {
    intent: String,
    urgency: String,
    sentiment: String,

    confidence: Number,

    decision: {
      type: String,
      enum: ["resolve", "resolve_with_action", "escalate"],
    },

    rationale: String,

    escalationReason: String,

    toolCalls: [
      {
        tool: String,
        status: String,
        result: mongoose.Schema.Types.Mixed,
      },
    ],

    retrievedKnowledge: [
      {
        source: String,
        content: String,
        score: Number,
      },
    ],

    actionTaken: mongoose.Schema.Types.Mixed,
  },
  {
    _id: false,
  }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    intent: {
      type: String,
    },

    status: {
      type: String,
      enum: ["open", "escalated", "resolved"],
      default: "open",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    investigation: investigationSchema,

    notes: [
      {
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);