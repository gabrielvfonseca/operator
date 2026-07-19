// LongCat provider module implements model/runtime integration.
import { buildManifestModelProviderConfig } from "@gabrielvfonseca/operator/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "@gabrielvfonseca/operator/plugin-sdk/provider-model-shared";
import manifest from "./operator.plugin.json" with { type: "json" };

export function buildLongCatProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "longcat",
    catalog: manifest.modelCatalog.providers.longcat,
  });
}
