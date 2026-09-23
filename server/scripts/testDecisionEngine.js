const { evaluateRefund } = require("../src/agent/decisionEngine");

const test = () => {
  const order = {
    status: "cancelled",
    refundStatus: "initiated",
  };

  const payment = {
    status: "successful",
  };

  const policy = {
    results: [
      {
        type: "refund_policy",
        title: "Refund Policy",
        text: "Cancelled orders that were successfully charged are eligible for a refund.",
      },
    ],
  };

  const result = evaluateRefund({
    order,
    payment,
    policy,
  });

  console.log("\n=== REFUND DECISION ===");
  console.log(result);
};

test();