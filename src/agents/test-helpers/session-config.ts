/**
 * Session config fixtures.
 *
 * Shared builders for agent/session tests that need configured session scope.
 */
import type { OperatorConfig } from "../../config/types.operator.js";

/** Builds a per-sender session config with optional targeted overrides. */
export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<OperatorConfig["session"]>> = {},
): NonNullable<OperatorConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
