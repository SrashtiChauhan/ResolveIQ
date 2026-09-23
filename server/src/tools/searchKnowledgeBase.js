const searchKnowledgeBase = async ({ query, topK = 3 }) => {
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  const response = await fetch("http://127.0.0.1:8000/retrieve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `RAG service returned status ${response.status}`
    );
  }

  const data = await response.json();

  return {
    success: data.success,
    query: data.query,
    results: data.results,
  };
};

module.exports = searchKnowledgeBase;