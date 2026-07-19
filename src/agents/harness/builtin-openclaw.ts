/**
 * Built-in Operator harness registration.
 *
 * Harness selection uses this factory to expose the embedded Operator runtime
 * through the same AgentHarness contract as external harness plugins.
 */
import { OPERATOR_EMBEDDED_CONTEXT_ENGINE_HOST } from "../../context-engine/host-compat.js";
import { runEmbeddedAttempt } from "../embedded-agent-runner/run/attempt.js";
import type { AgentHarness } from "./types.js";

/** Creates the built-in harness backed by the embedded Operator agent runner. */
export function createOperatorAgentHarness(): AgentHarness {
  return {
    id: "@gabrielvfonseca/operator",
    label: "Operator embedded agent",
    contextEngineHostCapabilities: OPERATOR_EMBEDDED_CONTEXT_ENGINE_HOST.capabilities,
    supports: () => ({ supported: true, priority: 0 }),
    runAttempt: runEmbeddedAttempt,
  };
}
