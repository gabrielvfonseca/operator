// Workspace default tests cover environment-variable precedence for the
// built-in agent workspace location.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withEnv } from "../test-utils/env.js";
import { resolveDefaultAgentWorkspaceDir } from "./workspace.js";

describe("DEFAULT_AGENT_WORKSPACE_DIR", () => {
  it("uses OPERATOR_HOME when resolving the default workspace dir", () => {
    const home = path.join(path.sep, "srv", "openclaw-home");

    const resolved = withEnv(
      {
        OPERATOR_WORKSPACE_DIR: undefined,
        OPERATOR_PROFILE: undefined,
        OPERATOR_HOME: home,
        HOME: path.join(path.sep, "home", "other"),
      },
      () => resolveDefaultAgentWorkspaceDir(),
    );

    expect(resolved).toBe(path.join(path.resolve(home), ".openclaw", "workspace"));
  });

  it("uses OPERATOR_WORKSPACE_DIR before OPERATOR_HOME", () => {
    const workspaceDir = path.join(path.sep, "srv", "openclaw-workspace");

    const resolved = withEnv(
      {
        OPERATOR_WORKSPACE_DIR: workspaceDir,
        OPERATOR_HOME: path.join(path.sep, "srv", "openclaw-home"),
      },
      () => resolveDefaultAgentWorkspaceDir(),
    );

    expect(resolved).toBe(path.resolve(workspaceDir));
  });
});
