// Covers supervisor marker files used to identify managed Operator processes.
import { describe, expect, it } from "vitest";
import { detectRespawnSupervisor, SUPERVISOR_HINT_ENV_VARS } from "./supervisor-markers.js";

describe("SUPERVISOR_HINT_ENV_VARS", () => {
  it("includes the cross-platform supervisor hint env vars", () => {
    const envVars = new Set(SUPERVISOR_HINT_ENV_VARS);
    expect(envVars.has("LAUNCH_JOB_LABEL")).toBe(true);
    expect(envVars.has("INVOCATION_ID")).toBe(true);
    expect(envVars.has("OPERATOR_WINDOWS_TASK_NAME")).toBe(true);
    expect(envVars.has("OPERATOR_SERVICE_MARKER")).toBe(true);
    expect(envVars.has("OPERATOR_SERVICE_KIND")).toBe(true);
  });
});

describe("detectRespawnSupervisor", () => {
  it("detects launchd from Operator's explicit marker or current gateway launchd job", () => {
    expect(
      detectRespawnSupervisor({ OPERATOR_LAUNCHD_LABEL: " ai.openclaw.gateway " }, "darwin"),
    ).toBe("launchd");
    expect(detectRespawnSupervisor({ OPERATOR_LAUNCHD_LABEL: "   " }, "darwin")).toBeNull();
    expect(detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.openclaw.gateway" }, "darwin")).toBe(
      "launchd",
    );
    expect(
      detectRespawnSupervisor(
        { LAUNCH_JOB_NAME: "ai.openclaw.work", OPERATOR_PROFILE: "work" },
        "darwin",
      ),
    ).toBe("launchd");
    expect(detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.openclaw.mac" }, "darwin")).toBeNull();
    expect(detectRespawnSupervisor({ XPC_SERVICE_NAME: "ai.openclaw.mac" }, "darwin")).toBeNull();
    expect(
      detectRespawnSupervisor(
        { XPC_SERVICE_NAME: "ai.openclaw.mac", OPERATOR_PROFILE: "mac" },
        "darwin",
      ),
    ).toBeNull();
    expect(detectRespawnSupervisor({ XPC_SERVICE_NAME: "ai.openclaw.gateway" }, "darwin")).toBe(
      "launchd",
    );
  });

  it("detects systemd only from non-blank platform-specific hints", () => {
    expect(detectRespawnSupervisor({ INVOCATION_ID: "abc123" }, "linux")).toBe("systemd");
    expect(detectRespawnSupervisor({ JOURNAL_STREAM: "" }, "linux")).toBeNull();
  });

  it("detects Linux Operator gateway service markers only for opt-in callers", () => {
    const gatewayServiceEnv = {
      OPERATOR_SERVICE_MARKER: " openclaw ",
      OPERATOR_SERVICE_KIND: " gateway ",
    };
    expect(detectRespawnSupervisor(gatewayServiceEnv, "linux")).toBeNull();
    expect(
      detectRespawnSupervisor(gatewayServiceEnv, "linux", {
        includeLinuxOperatorGatewayServiceMarker: true,
      }),
    ).toBe("systemd");
    expect(
      detectRespawnSupervisor(
        {
          OPERATOR_SERVICE_MARKER: "openclaw",
          OPERATOR_SERVICE_KIND: "worker",
        },
        "linux",
        { includeLinuxOperatorGatewayServiceMarker: true },
      ),
    ).toBeNull();
    expect(
      detectRespawnSupervisor(
        {
          OPERATOR_SERVICE_MARKER: "other",
          OPERATOR_SERVICE_KIND: "gateway",
        },
        "linux",
        { includeLinuxOperatorGatewayServiceMarker: true },
      ),
    ).toBeNull();
  });

  it("detects scheduled-task supervision on Windows from either hint family", () => {
    expect(
      detectRespawnSupervisor({ OPERATOR_WINDOWS_TASK_NAME: "Operator Gateway" }, "win32"),
    ).toBe("schtasks");
    expect(
      detectRespawnSupervisor(
        {
          OPERATOR_SERVICE_MARKER: "openclaw",
          OPERATOR_SERVICE_KIND: "gateway",
        },
        "win32",
      ),
    ).toBe("schtasks");
    expect(
      detectRespawnSupervisor(
        {
          OPERATOR_SERVICE_MARKER: "openclaw",
          OPERATOR_SERVICE_KIND: "worker",
        },
        "win32",
      ),
    ).toBeNull();
  });

  it("ignores service markers on non-Windows platforms and unknown platforms", () => {
    expect(
      detectRespawnSupervisor(
        {
          OPERATOR_SERVICE_MARKER: "openclaw",
          OPERATOR_SERVICE_KIND: "gateway",
        },
        "linux",
      ),
    ).toBeNull();
    expect(
      detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.openclaw.gateway" }, "freebsd"),
    ).toBeNull();
  });
});
