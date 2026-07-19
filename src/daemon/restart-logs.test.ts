// Daemon restart log tests cover restart log formatting and filtering.
import { describe, expect, it } from "vitest";
import {
  renderCmdRestartLogSetup,
  renderPosixRestartLogSetup,
  resolveGatewayLogPaths,
  resolveGatewayRestartLogPath,
  resolveGatewaySupervisorLogPaths,
} from "./restart-logs.js";

describe("restart log conventions", () => {
  it("resolves profile-aware gateway logs and restart attempts together", () => {
    const env = {
      HOME: "/Users/test",
      OPERATOR_PROFILE: "work",
    };

    expect(resolveGatewayLogPaths(env)).toEqual({
      logDir: "/Users/test/.operator-work/logs",
      stdoutPath: "/Users/test/.operator-work/logs/gateway.log",
      stderrPath: "/Users/test/.operator-work/logs/gateway.err.log",
    });
    expect(resolveGatewayRestartLogPath(env)).toBe(
      "/Users/test/.operator-work/logs/gateway-restart.log",
    );
  });

  it("honors OPERATOR_STATE_DIR for restart attempts", () => {
    const env = {
      HOME: "/Users/test",
      OPERATOR_STATE_DIR: "/tmp/operator-state",
    };

    expect(resolveGatewayRestartLogPath(env)).toBe("/tmp/operator-state/logs/gateway-restart.log");
  });

  it("keeps macOS LaunchAgent stdout outside the state directory", () => {
    const env = {
      HOME: "/Users/test",
      OPERATOR_STATE_DIR: "/Volumes/External/openclaw",
    };

    expect(resolveGatewaySupervisorLogPaths(env, { platform: "darwin" })).toEqual({
      logDir: "/Users/test/Library/Logs/openclaw",
      stdoutPath: "/Users/test/Library/Logs/openclaw/gateway.log",
      stderrPath: "/Users/test/Library/Logs/openclaw/gateway.err.log",
    });
    expect(resolveGatewayRestartLogPath(env)).toBe(
      "/Volumes/External/openclaw/logs/gateway-restart.log",
    );
  });

  it("keeps macOS LaunchAgent logs profile-aware in the shared user log directory", () => {
    const env = {
      HOME: "/Users/test",
      OPERATOR_PROFILE: "work",
    };

    expect(resolveGatewaySupervisorLogPaths(env, { platform: "darwin" })).toEqual({
      logDir: "/Users/test/Library/Logs/openclaw",
      stdoutPath: "/Users/test/Library/Logs/openclaw/gateway-work.log",
      stderrPath: "/Users/test/Library/Logs/openclaw/gateway-work.err.log",
    });
  });

  it("renders best-effort POSIX log setup with escaped paths", () => {
    const setup = renderPosixRestartLogSetup({
      HOME: "/Users/test's",
    });

    expect(setup).toContain(
      "if mkdir -p '/Users/test'\\''s/.operator/logs' 2>/dev/null && : >>'/Users/test'\\''s/.operator/logs/gateway-restart.log' 2>/dev/null; then",
    );
    expect(setup).toContain("exec >>'/Users/test'\\''s/.operator/logs/gateway-restart.log' 2>&1");
  });

  it("renders CMD log setup with quoted paths", () => {
    const setup = renderCmdRestartLogSetup({
      USERPROFILE: "C:\\Users\\Test User",
    });

    expect(setup.quotedLogPath).toBe('"C:\\Users\\Test User/.operator/logs/gateway-restart.log"');
    expect(setup.lines).toContain(
      'if not exist "C:\\Users\\Test User/.operator/logs" mkdir "C:\\Users\\Test User/.operator/logs" >nul 2>&1',
    );
  });
});
