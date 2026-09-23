const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Customer = require("../src/models/Customer");
const Order = require("../src/models/Order");
const Payment = require("../src/models/Payment");
const Ticket = require("../src/models/Ticket");
const KnowledgeDocument = require("../src/models/KnowledgeDocument");

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    await Promise.all([
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Ticket.deleteMany({}),
      KnowledgeDocument.deleteMany({}),
    ]);

    console.log("Old data cleared");

    // --------------------------------
    // CUSTOMERS
    // --------------------------------

    const customers = await Customer.insertMany([
      {
        customerId: "cust_1001",
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "9876543210",
      },
      {
        customerId: "cust_1002",
        name: "Rahul Verma",
        email: "rahul@example.com",
        phone: "9876543211",
      },
      {
        customerId: "cust_1003",
        name: "Ananya Singh",
        email: "ananya@example.com",
        phone: "9876543212",
      },
      {
        customerId: "cust_1004",
        name: "Arjun Mehta",
        email: "arjun@example.com",
        phone: "9876543213",
      },
      {
        customerId: "cust_1005",
        name: "Neha Kapoor",
        email: "neha@example.com",
        phone: "9876543214",
      },
    ]);

    console.log(`${customers.length} customers inserted`);

    // --------------------------------
    // ORDERS
    // --------------------------------

    const orders = await Order.insertMany([
      {
        orderId: "ORD-1001",
        customerId: "cust_1001",
        product: "Wireless Headphones",
        amount: 1299,
        status: "cancelled",
        cancelledAt: new Date(),
        refundStatus: "pending",
      },
      {
        orderId: "ORD-1002",
        customerId: "cust_1002",
        product: "Mechanical Keyboard",
        amount: 2499,
        status: "shipped",
      },
      {
        orderId: "ORD-1003",
        customerId: "cust_1003",
        product: "Smart Watch",
        amount: 3999,
        status: "delivered",
      },
      {
        orderId: "ORD-1004",
        customerId: "cust_1004",
        product: "USB-C Hub",
        amount: 899,
        status: "confirmed",
      },
      {
        orderId: "ORD-1005",
        customerId: "cust_1005",
        product: "Laptop Stand",
        amount: 1499,
        status: "cancelled",
        cancelledAt: new Date(),
        refundStatus: "completed",
      },
    ]);

    console.log(`${orders.length} orders inserted`);

    // --------------------------------
    // PAYMENTS
    // --------------------------------

    const payments = await Payment.insertMany([
      {
        paymentId: "PMT-1001",
        orderId: "ORD-1001",
        customerId: "cust_1001",
        amount: 1299,
        status: "successful",
        method: "UPI",
      },
      {
        paymentId: "PMT-1002",
        orderId: "ORD-1002",
        customerId: "cust_1002",
        amount: 2499,
        status: "successful",
        method: "Card",
      },
      {
        paymentId: "PMT-1003",
        orderId: "ORD-1003",
        customerId: "cust_1003",
        amount: 3999,
        status: "successful",
        method: "UPI",
      },
      {
        paymentId: "PMT-1004",
        orderId: "ORD-1004",
        customerId: "cust_1004",
        amount: 899,
        status: "successful",
        method: "Card",
      },
      {
        paymentId: "PMT-1005",
        orderId: "ORD-1005",
        customerId: "cust_1005",
        amount: 1499,
        status: "refunded",
        method: "UPI",
      },
    ]);

    console.log(`${payments.length} payments inserted`);

    // --------------------------------
    // TICKETS
    // --------------------------------

    const tickets = await Ticket.insertMany([
      {
        ticketId: "TKT-1001",
        customerId: "cust_1001",
        subject: "Cancelled order but payment charged",
        message: "My order was cancelled but I was still charged.",
        intent: "refund_request",
        status: "open",
        priority: "medium",
      },

      {
        ticketId: "TKT-2001",
        customerId: "cust_1002",
        subject: "Where is my order?",
        message: "Please tell me where my order is.",
        intent: "order_status",
        status: "resolved",
        priority: "low",
      },

      {
        ticketId: "TKT-3001",
        customerId: "cust_1003",
        subject: "Payment question",
        message: "I want to know about my payment.",
        intent: "payment_issue",
        status: "resolved",
        priority: "medium",
      },

      // Repeated unresolved issue
      {
        ticketId: "TKT-4001",
        customerId: "cust_1004",
        subject: "Refund still not received",
        message: "I have still not received my refund.",
        intent: "refund_request",
        status: "escalated",
        priority: "high",
      },

      {
        ticketId: "TKT-4002",
        customerId: "cust_1004",
        subject: "Refund follow-up",
        message: "I already contacted support about my refund.",
        intent: "refund_request",
        status: "open",
        priority: "high",
      },

      {
        ticketId: "TKT-4003",
        customerId: "cust_1004",
        subject: "Third refund complaint",
        message: "Nobody has resolved my refund issue.",
        intent: "refund_request",
        status: "open",
        priority: "high",
      },
    ]);

    console.log(`${tickets.length} tickets inserted`);

    // --------------------------------
    // KNOWLEDGE DOCUMENTS
    // --------------------------------

    const knowledgeDocuments = await KnowledgeDocument.insertMany([
      {
        documentId: "KB-REFUND",
        title: "Refund Policy",
        type: "refund_policy",
        content:
          "Cancelled orders that were successfully charged are eligible for a refund when the cancellation is confirmed. Refund requests should be initiated after verifying the order and payment records.",
      },

      {
        documentId: "KB-CANCELLATION",
        title: "Cancellation Policy",
        type: "cancellation_policy",
        content:
          "Customers may cancel eligible orders before shipment. Once an order is confirmed as cancelled, the system should verify whether payment was captured.",
      },

      {
        documentId: "KB-PAYMENT",
        title: "Payment Policy",
        type: "payment_policy",
        content:
          "A successful payment indicates that the payment provider captured the transaction. Payment issues should be investigated using the payment record associated with the order.",
      },

      {
        documentId: "KB-SHIPPING",
        title: "Shipping Policy",
        type: "shipping_policy",
        content:
          "Customers can check shipment status using their order information. Delivered and shipped orders should display the latest available fulfillment status.",
      },

      {
        documentId: "KB-ACCOUNT",
        title: "Account Policy",
        type: "account_policy",
        content:
          "Customer identity must be verified before accessing account-specific information. Support agents should avoid exposing sensitive customer information.",
      },

      {
        documentId: "KB-FAQ",
        title: "Product FAQ",
        type: "product_faq",
        content:
          "Customers can request product information, order information, and general support assistance through the support system.",
      },
    ]);

    console.log(`${knowledgeDocuments.length} knowledge documents inserted`);

    console.log("Database seeded successfully");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
