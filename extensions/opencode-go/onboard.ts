// Opencode Go setup module handles plugin onboarding behavior.
import {
  applyAgentDefaultModelPrimary,
  type OperatorConfig,
} from "openclaw/plugin-sdk/provider-onboard";

export const OPENCODE_GO_DEFAULT_MODEL_REF = "opencode-go/kimi-k2.6";

export function applyOpencodeGoProviderConfig(cfg: OperatorConfig): OperatorConfig {
  return cfg;
}

export function applyOpencodeGoConfig(cfg: OperatorConfig): OperatorConfig {
  return applyAgentDefaultModelPrimary(
    applyOpencodeGoProviderConfig(cfg),
    OPENCODE_GO_DEFAULT_MODEL_REF,
  );
}
