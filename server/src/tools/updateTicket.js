const Ticket = require("../models/Ticket");

const updateTicket = async ({
  ticketId,
  status,
  priority,
  note,
}) => {
  if (!ticketId) {
    throw new Error("ticketId is required");
  }

  const ticket = await Ticket.findOne({ ticketId });

  if (!ticket) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  if (status) {
    ticket.status = status;
  }

  if (priority) {
    ticket.priority = priority;
  }

  if (note) {
    ticket.notes.push({
      text: note,
    });
  }

  await ticket.save();

  return {
    success: true,
    action: "update_ticket",
    ticketId: ticket.ticketId,
    status: ticket.status,
    priority: ticket.priority,
    note: note || null,
  };
};

module.exports = updateTicket;