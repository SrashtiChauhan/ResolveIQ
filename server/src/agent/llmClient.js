const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "gemma3:4b";

const callLLM = async (messages) => {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned status ${response.status}`);
  }

  const data = await response.json();

  return data.message?.content || "";
};

module.exports = callLLM;