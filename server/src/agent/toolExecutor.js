const toolRegistry = require("../tools/toolRegistry");

const executeTool = async (toolName, args) => {
  const tool = toolRegistry[toolName];

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  return await tool(args);
};

module.exports = executeTool;