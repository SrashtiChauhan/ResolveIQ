const Ticket = require("../models/Ticket");

const escalateTicket = async ({
  ticketId,
  reason,
  priority = "high",
}) => {
  if (!ticketId) {
    throw new Error("ticketId is required");
  }

  if (!reason) {
    throw new Error("Escalation reason is required");
  }

  const ticket = await Ticket.findOne({ ticketId });

  if (!ticket) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  ticket.status = "escalated";
  ticket.priority = priority;

  ticket.notes.push({
    text: `Escalated: ${reason}`,
  });

  await ticket.save();

  return {
    success: true,
    action: "escalate_ticket",
    ticketId: ticket.ticketId,
    status: "escalated",
    priority: priority,
    reason,
  };
};

module.exports = escalateTicket;