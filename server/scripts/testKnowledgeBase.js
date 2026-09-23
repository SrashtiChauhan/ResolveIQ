const searchKnowledgeBase = require("../src/tools/searchKnowledgeBase");

const runTest = async () => {
  try {
    const result = await searchKnowledgeBase({
      query: "My order was cancelled but I was already charged. Can I get a refund?",
      topK: 3,
    });

    console.log("\n=== KNOWLEDGE BASE TEST ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Knowledge base test failed:", error.message);
  }
};

runTest();