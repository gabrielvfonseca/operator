// Launchd current service tests cover resolving active macOS service labels.
import { describe, expect, it } from "vitest";
import { isCurrentProcessLaunchdServiceLabel } from "./launchd-current-service.js";

describe("isCurrentProcessLaunchdServiceLabel", () => {
  it("matches launchd-provided service labels", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.operator.gateway", {
        LAUNCH_JOB_LABEL: "ai.operator.gateway",
      }),
    ).toBe(true);
  });

  it("falls back to Operator service markers when XPC_SERVICE_NAME is inherited", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.operator.gateway", {
        XPC_SERVICE_NAME: "0",
        OPERATOR_SERVICE_MARKER: "@gabrielvfonseca/operator",
        OPERATOR_SERVICE_KIND: "gateway",
        OPERATOR_LAUNCHD_LABEL: "ai.operator.gateway",
      }),
    ).toBe(true);
  });

  it("preserves label-only fallback when launchd exposes no label variables", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.operator.gateway", {
        OPERATOR_LAUNCHD_LABEL: "ai.operator.gateway",
      }),
    ).toBe(true);
  });

  it("can require service markers for label-only fallback", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel(
        "ai.operator.gateway",
        {
          OPERATOR_LAUNCHD_LABEL: "ai.operator.gateway",
        },
        { allowConfiguredLabelFallback: false },
      ),
    ).toBe(false);
  });

  it("does not treat unrelated inherited launchd labels as current services", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.operator.gateway", {
        XPC_SERVICE_NAME: "0",
        OPERATOR_LAUNCHD_LABEL: "ai.operator.gateway",
      }),
    ).toBe(false);
  });
});
