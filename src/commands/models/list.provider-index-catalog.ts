/** Provider-index-backed model catalog rows for bundled model-list output. */
import { normalizeModelCatalogProviderId } from "@operator/model-catalog-core/model-catalog-refs";
import type { NormalizedModelCatalogRow } from "@operator/model-catalog-core/model-catalog-types";
import type { OperatorConfig } from "../../config/types.operator.js";
import {
  loadOperatorProviderIndex,
  planProviderIndexModelCatalogRows,
} from "../../model-catalog/index.js";
import { normalizePluginsConfig, resolveEffectiveEnableState } from "../../plugins/config-state.js";

/** Loads enabled bundled provider-index catalog rows, optionally scoped by provider. */
export function loadProviderIndexCatalogRowsForList(params: {
  providerFilter?: string;
  cfg: OperatorConfig;
}): readonly NormalizedModelCatalogRow[] {
  const providerFilter = params.providerFilter
    ? normalizeModelCatalogProviderId(params.providerFilter)
    : undefined;
  const index = loadOperatorProviderIndex();
  return planProviderIndexModelCatalogRows({
    index,
    ...(providerFilter ? { providerFilter } : {}),
  })
    .entries.filter(
      (entry) =>
        resolveEffectiveEnableState({
          id: entry.pluginId,
          origin: "bundled",
          config: normalizePluginsConfig(params.cfg.plugins),
          rootConfig: params.cfg,
          enabledByDefault: true,
        }).enabled,
    )
    .flatMap((entry) => entry.rows);
}
