const classifyIntent = require("../src/agent/intentClassifier");

const testMessages = [
  "Where is my order?",
  "I want a refund for my cancelled order",
  "My payment failed",
  "I want to cancel my order",
  "What is your refund policy?",
  "My complaint is still not resolved",
  "Tell me something about your company",
];

for (const message of testMessages) {
  console.log(`\nMessage: ${message}`);
  console.log(`Intent:  ${classifyIntent(message)}`);
}