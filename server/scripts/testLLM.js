const callLLM = require("../src/agent/llmClient");

const run = async () => {
  const response = await callLLM([
    {
      role: "user",
      content: "Reply with exactly: ResolveIQ LLM connected",
    },
  ]);

  console.log("=== LLM RESPONSE ===");
  console.log(response);
};

run().catch((error) => {
  console.error("LLM test failed:", error.message);
});