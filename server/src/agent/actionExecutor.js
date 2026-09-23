const toolRegistry = require("../tools/toolRegistry");

const executeAction = async ({
  action,
  allowed,
  args = {},
}) => {
  if (!allowed) {
    return {
      success: false,
      action: null,
      reason: "Action is not allowed by the decision engine",
    };
  }

  const tool = toolRegistry[action];

  if (!tool) {
    return {
      success: false,
      action,
      reason: `Action tool not found: ${action}`,
    };
  }

  try {
    const result = await tool(args);

    return {
      success: true,
      action,
      result,
    };
  } catch (error) {
    return {
      success: false,
      action,
      reason: error.message,
    };
  }
};

module.exports = executeAction;