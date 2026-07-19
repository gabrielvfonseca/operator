// Workspace mount tests cover Docker bind arguments for workspace access modes
// and read-only resource overlays.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { appendWorkspaceMountArgs } from "./workspace-mounts.js";

const tmpDirs: string[] = [];

function makeTempWorkspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "operator-sandbox-mounts-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("appendWorkspaceMountArgs", () => {
  it.each([
    { access: "rw" as const, expected: "/tmp/workspace:/workspace:z" },
    { access: "ro" as const, expected: "/tmp/workspace:/workspace:ro,z" },
    { access: "none" as const, expected: "/tmp/workspace:/workspace:ro,z" },
  ])("sets main mount permissions for workspaceAccess=$access", ({ access, expected }) => {
    const args: string[] = [];
    appendWorkspaceMountArgs({
      args,
      workspaceDir: "/tmp/workspace",
      agentWorkspaceDir: "/tmp/agent-workspace",
      workdir: "/workspace",
      workspaceAccess: access,
    });

    expect(args).toContain(expected);
  });

  it("omits agent workspace mount when workspaceAccess is none", () => {
    const args: string[] = [];
    appendWorkspaceMountArgs({
      args,
      workspaceDir: "/tmp/workspace",
      agentWorkspaceDir: "/tmp/agent-workspace",
      workdir: "/workspace",
      workspaceAccess: "none",
    });

    const mounts = args.filter((arg) => arg.startsWith("/tmp/"));
    expect(mounts).toEqual(["/tmp/workspace:/workspace:ro,z"]);
  });

  it("omits agent workspace mount when paths are identical", () => {
    const workspaceDir = makeTempWorkspace();
    const args: string[] = [];
    appendWorkspaceMountArgs({
      args,
      workspaceDir,
      agentWorkspaceDir: workspaceDir,
      workdir: "/workspace",
      workspaceAccess: "rw",
    });

    const mounts = args.filter((arg) => arg.startsWith(workspaceDir));
    expect(mounts).toEqual([`${workspaceDir}:/workspace:z`]);
  });

  it("marks split agent workspace mounts shared for SELinux", () => {
    const args: string[] = [];
    appendWorkspaceMountArgs({
      args,
      workspaceDir: "/tmp/workspace",
      agentWorkspaceDir: "/tmp/agent-workspace",
      workdir: "/workspace",
      workspaceAccess: "ro",
    });

    const mounts = args.filter((arg) => arg.startsWith("/tmp/"));
    expect(mounts).toEqual(["/tmp/workspace:/workspace:ro,z", "/tmp/agent-workspace:/agent:ro,z"]);
  });

;

;

;

;

;

;
});
