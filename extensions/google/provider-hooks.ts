// Google provider module implements model/runtime integration.
import type {
  ProviderDefaultThinkingPolicyContext,
  ProviderThinkingProfile,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
import type { ProviderFailoverErrorContext } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import { buildProviderReplayFamilyHooks } from "@gabrielvfonseca/operator/plugin-sdk/provider-model-shared";
import { buildProviderToolCompatFamilyHooks } from "@gabrielvfonseca/operator/plugin-sdk/provider-tools";
import { resolveGoogleThinkingProfile } from "./provider-policy.js";
import { createGoogleThinkingStreamWrapper } from "./thinking-api.js";

// Google-family gRPC status codes stay with the shared Gemini provider hook.
function classifyGoogleFailoverCode(code: string | undefined) {
  switch (code?.trim().toUpperCase()) {
    case "UNAVAILABLE":
      return "overloaded" as const;
    case "DEADLINE_EXCEEDED":
      return "timeout" as const;
    case "INTERNAL":
      return "server_error" as const;
    default:
      return undefined;
  }
}

export const GOOGLE_GEMINI_PROVIDER_HOOKS = {
  ...buildProviderReplayFamilyHooks({
    family: "google-gemini",
  }),
  ...buildProviderToolCompatFamilyHooks("gemini"),
  resolveThinkingProfile: (context: ProviderDefaultThinkingPolicyContext) =>
    resolveGoogleThinkingProfile(context) satisfies ProviderThinkingProfile | undefined,
  wrapStreamFn: createGoogleThinkingStreamWrapper,
  classifyFailoverReason: ({ code }: ProviderFailoverErrorContext) =>
    classifyGoogleFailoverCode(code),
};
