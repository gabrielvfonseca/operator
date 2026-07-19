import { describe, expect, it } from "vitest";
import { OperatorSchema } from "./zod-schema.js";

describe("OperatorSchema cron triggers", () => {
  it("accepts the strict trigger gate and interval floor", () => {
    expect(
      OperatorSchema.parse({ cron: { triggers: { enabled: true, minIntervalMs: 45_000 } } }).cron
        ?.triggers,
    ).toEqual({ enabled: true, minIntervalMs: 45_000 });
  });

  it("rejects invalid and unknown trigger settings", () => {
    expect(OperatorSchema.safeParse({ cron: { triggers: { minIntervalMs: 0 } } }).success).toBe(
      false,
    );
    expect(
      OperatorSchema.safeParse({ cron: { triggers: { enabled: true, extra: true } } }).success,
    ).toBe(false);
  });
});
