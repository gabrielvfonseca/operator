/**
 * Shared contract fixtures for agent prompt overlay runtime behavior.
 */
import type { OperatorConfig } from "../../../config/types.operator.js";
import type { ProviderSystemPromptContributionContext } from "../../../plugins/types.js";

export const GPT5_CONTRACT_MODEL_ID = "gpt-5.4";
export const GPT5_PREFIXED_CONTRACT_MODEL_ID = "openai/gpt-5.4";
export const NON_GPT5_CONTRACT_MODEL_ID = "gpt-4.1";
export const OPENAI_CONTRACT_PROVIDER_ID = "openai";
export const OPENAI_CODEX_CONTRACT_PROVIDER_ID = "openai";
export const CODEX_CONTRACT_PROVIDER_ID = "codex";
export const NON_OPENAI_CONTRACT_PROVIDER_ID = "openrouter";

export function openAiPluginPersonalityConfig(personality: "friendly" | "off"): OperatorConfig {
  return {
    plugins: {
      entries: {
        openai: {
          config: { personality },
        },
      },
    },
  } satisfies OperatorConfig;
}

export function sharedGpt5PersonalityConfig(personality: "friendly" | "off"): OperatorConfig {
  return {
    agents: {
      defaults: {
        promptOverlays: {
          gpt5: { personality },
        },
      },
    },
  } satisfies OperatorConfig;
}

export function codexPromptOverlayContext(params?: {
  modelId?: string;
  config?: OperatorConfig;
}): ProviderSystemPromptContributionContext {
  return {
    provider: CODEX_CONTRACT_PROVIDER_ID,
    modelId: params?.modelId ?? GPT5_CONTRACT_MODEL_ID,
    promptMode: "full",
    agentDir: "/tmp/operator-codex-prompt-contract-agent",
    workspaceDir: "/tmp/operator-codex-prompt-contract-workspace",
    ...(params?.config ? { config: params.config } : {}),
  };
}
