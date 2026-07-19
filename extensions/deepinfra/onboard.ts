// Deepinfra setup module handles plugin onboarding behavior.
import {
  applyAgentDefaultModelPrimary,
  type OperatorConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/provider-onboard";
import { DEEPINFRA_DEFAULT_MODEL_REF } from "./provider-models.js";

export function applyDeepInfraConfig(
  cfg: OperatorConfig,
  modelRef: string = DEEPINFRA_DEFAULT_MODEL_REF,
): OperatorConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[modelRef] = {
    ...models[modelRef],
    alias: models[modelRef]?.alias ?? "DeepInfra",
  };

  return applyAgentDefaultModelPrimary(
    {
      ...cfg,
      agents: {
        ...cfg.agents,
        defaults: {
          ...cfg.agents?.defaults,
          models,
        },
      },
    },
    modelRef,
  );
}
