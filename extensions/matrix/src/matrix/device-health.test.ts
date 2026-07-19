// Matrix tests cover device health plugin behavior.
import { describe, expect, it } from "vitest";
import { isOperatorManagedMatrixDevice, summarizeMatrixDeviceHealth } from "./device-health.js";

describe("matrix device health", () => {
  it("detects Operator-managed device names", () => {
    expect(isOperatorManagedMatrixDevice("Operator Gateway")).toBe(true);
    expect(isOperatorManagedMatrixDevice("Operator Debug")).toBe(true);
    expect(isOperatorManagedMatrixDevice("Element iPhone")).toBe(false);
    expect(isOperatorManagedMatrixDevice(null)).toBe(false);
  });

  it("summarizes stale Operator-managed devices separately from the current device", () => {
    const summary = summarizeMatrixDeviceHealth([
      {
        deviceId: "du314Zpw3A",
        displayName: "Operator Gateway",
        current: true,
      },
      {
        deviceId: "BritdXC6iL",
        displayName: "Operator Gateway",
        current: false,
      },
      {
        deviceId: "G6NJU9cTgs",
        displayName: "Operator Debug",
        current: false,
      },
      {
        deviceId: "phone123",
        displayName: "Element iPhone",
        current: false,
      },
    ]);

    expect(summary).toEqual({
      currentDeviceId: "du314Zpw3A",
      currentOperatorDevices: [
        {
          deviceId: "du314Zpw3A",
          displayName: "Operator Gateway",
          current: true,
        },
      ],
      staleOperatorDevices: [
        {
          deviceId: "BritdXC6iL",
          displayName: "Operator Gateway",
          current: false,
        },
        {
          deviceId: "G6NJU9cTgs",
          displayName: "Operator Debug",
          current: false,
        },
      ],
    });
  });
});
