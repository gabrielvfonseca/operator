// Shared base compatibility normalizers reused by core and plugin setup migrations.
import type { OperatorConfig } from "../../../config/types.operator.js";
import type { LegacyCodexModelIdentity } from "./codex-route-model-ref.js";
import {
  normalizeLegacyBrowserConfig,
  normalizeLegacyCrossContextMessageConfig,
  normalizeLegacyMediaProviderOptions,
  normalizeLegacyMistralModelDefaults,
  normalizeLegacyOpenAIModelProviderApi,
  normalizeLegacyOllamaNativeNumCtxParams,
  normalizeLegacyRuntimeModelRefs,
  normalizeLegacyNanoBananaSkill,
  normalizeLegacyTalkConfig,
  seedMissingDefaultAccountsFromSingleAccountBase,
} from "./legacy-config-core-normalizers.js";
import { migrateLegacyWebFetchConfig } from "./legacy-web-fetch-migrate.js";
import { migrateLegacyWebSearchConfig } from "./legacy-web-search-migrate.js";
import { migrateLegacyXSearchConfig } from "./legacy-x-search-migrate.js";

/** Run common compatibility migrations before caller-specific setup/channel passes. */
export function normalizeBaseCompatibilityConfigValues(
  cfg: OperatorConfig,
  changes: string[],
  afterBrowser?: (config: OperatorConfig) => OperatorConfig,
  blockedModelIdentities?: ReadonlySet<LegacyCodexModelIdentity>,
): OperatorConfig {
  let next = seedMissingDefaultAccountsFromSingleAccountBase(cfg, changes);
  next = normalizeLegacyBrowserConfig(next, changes);
  next = afterBrowser ? afterBrowser(next) : next;

  for (const migrate of [
    migrateLegacyWebSearchConfig,
    migrateLegacyWebFetchConfig,
    migrateLegacyXSearchConfig,
  ]) {
    const migrated = migrate(next);
    if (migrated.changes.length === 0) {
      continue;
    }
    next = migrated.config;
    changes.push(...migrated.changes);
  }

  next = normalizeLegacyNanoBananaSkill(next, changes);
  next = normalizeLegacyTalkConfig(next, changes);
  next = normalizeLegacyOpenAIModelProviderApi(next, changes);
  next = normalizeLegacyRuntimeModelRefs(next, changes, blockedModelIdentities);
  next = normalizeLegacyCrossContextMessageConfig(next, changes);
  next = normalizeLegacyMediaProviderOptions(next, changes);
  next = normalizeLegacyOllamaNativeNumCtxParams(next, changes);
  return normalizeLegacyMistralModelDefaults(next, changes);
}
