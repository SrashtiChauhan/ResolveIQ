const Ticket = require("../models/Ticket");

const getPreviousTickets = async ({ customerId }) => {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const tickets = await Ticket.find({ customerId })
    .sort({ createdAt: -1 })
    .lean();

  return tickets.map((ticket) => ({
    ticketId: ticket.ticketId,
    customerId: ticket.customerId,
    subject: ticket.subject,
    message: ticket.message,
    intent: ticket.intent,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt,
  }));
};

module.exports = getPreviousTickets;