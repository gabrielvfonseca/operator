// Context7 MCP Server Configuration
const context7ServerConfig = {
  enabled: true,
  port: 8080,
  host: "localhost",
  mcp: {
    serverName: "Context7",
    serverVersion: "1.0.0",
    capabilities: ["tools", "resources", "prompts"],
    tools: [
      {
        name: "context7-query",
        description: "Query Context7 knowledge base",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            context: { type: "string" },
          },
        },
      },
    ],
  },
};

module.exports = context7ServerConfig;
