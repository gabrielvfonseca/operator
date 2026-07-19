// LongCat setup module handles plugin onboarding behavior.
import {
  createModelCatalogPresetAppliers,
  type OperatorConfig,
} from "openclaw/plugin-sdk/provider-onboard";
import { LONGCAT_BASE_URL, LONGCAT_DEFAULT_MODEL_REF, LONGCAT_MODEL_CATALOG } from "./models.js";

const longCatPresetAppliers = createModelCatalogPresetAppliers({
  primaryModelRef: LONGCAT_DEFAULT_MODEL_REF,
  resolveParams: (_cfg: OperatorConfig) => ({
    providerId: "longcat",
    api: "openai-completions",
    baseUrl: LONGCAT_BASE_URL,
    catalogModels: LONGCAT_MODEL_CATALOG,
    aliases: [{ modelRef: LONGCAT_DEFAULT_MODEL_REF, alias: "LongCat 2.0" }],
  }),
});

export function applyLongCatConfig(cfg: OperatorConfig): OperatorConfig {
  return longCatPresetAppliers.applyConfig(cfg);
}
