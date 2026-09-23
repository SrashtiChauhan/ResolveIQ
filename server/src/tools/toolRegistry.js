const getCustomer = require("./getCustomer");
const getOrder = require("./getOrder");
const getPayment = require("./getPayment");
const getPreviousTickets = require("./getPreviousTickets");
const searchKnowledgeBase = require("./searchKnowledgeBase");

const createRefundRequest = require("./createRefundRequest");
const updateTicket = require("./updateTicket");
const escalateTicket = require("./escalateTicket");

const toolRegistry = {
  get_customer: getCustomer,
  get_order: getOrder,
  get_payment: getPayment,
  get_previous_tickets: getPreviousTickets,
  search_knowledge_base: searchKnowledgeBase,
  create_refund_request: createRefundRequest,
  update_ticket: updateTicket,
  escalate_ticket: escalateTicket,
};

module.exports = toolRegistry;