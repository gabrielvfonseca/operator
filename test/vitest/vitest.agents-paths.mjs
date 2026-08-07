// Test routing globs for agent core, embedded-agent, tool, and support suites.
export const agentsAllTestPatterns = ["tests/agents/**/*.test.ts"];

// These suites install mocks for shared runtime, network, or plugin modules.
// Keep their module graphs separate from the shared agents-core worker.
export const agentsCoreIsolatedTestFiles = [
  "tests/agents/image-generation-task-status.test.ts",
  "tests/agents/media-generation-task-status-shared.test.ts",
  "tests/agents/mcp-http-fetch.test.ts",
  "tests/agents/mcp-transport.test.ts",
  "tests/agents/model-auth-env.provider-aliases.test.ts",
  "tests/agents/model-selection.plugin-runtime.test.ts",
  "tests/agents/models-config.runtime-source-snapshot.test.ts",
  "tests/agents/video-generation-task-status.test.ts",
];

const agentsCoreIsolatedTestFileSet = new Set(agentsCoreIsolatedTestFiles);

export function isAgentsCoreIsolatedTestFile(value) {
  return agentsCoreIsolatedTestFileSet.has(value.replaceAll("\\", "/"));
}

export const agentsCoreTestPatterns = ["tests/agents/*.test.ts"];

export const agentsEmbeddedTestPatterns = ["tests/agents/embedded-agent-runner/**/*.test.ts"];

export const agentsToolsTestPatterns = ["tests/agents/tools/**/*.test.ts"];

export const agentsSupportTestPatterns = ["tests/agents/*/**/*.test.ts"];

export const agentsSupportExcludePatterns = [
  "tests/agents/embedded-agent-runner/**",
  "tests/agents/tools/**",
];
