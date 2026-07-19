// Gateway runtime plugin config resolver.
// Applies plugin auto-enable rules against the active manifest snapshot.
import { applyPluginAutoEnable } from "../config/plugin-auto-enable.js";
import type { OperatorConfig } from "../config/types.operator.js";
import { getCurrentPluginMetadataSnapshot } from "../plugins/current-plugin-metadata-snapshot.js";
import type { PluginMetadataSnapshot } from "../plugins/plugin-metadata-snapshot.types.js";

type CachedGatewayPluginConfig = {
  snapshot: PluginMetadataSnapshot;
  config: OperatorConfig;
};

const gatewayPluginConfigCache = new WeakMap<OperatorConfig, CachedGatewayPluginConfig>();

/** Resolves runtime config with plugin auto-enable applied for gateway startup/reload paths. */
export function resolveGatewayPluginConfig(params: { config: OperatorConfig }): OperatorConfig {
  const currentSnapshot = getCurrentPluginMetadataSnapshot({
    config: params.config,
    allowWorkspaceScopedSnapshot: true,
  });
  if (!currentSnapshot) {
    return applyPluginAutoEnable({
      config: params.config,
    }).config;
  }

  const cached = gatewayPluginConfigCache.get(params.config);
  if (cached?.snapshot === currentSnapshot) {
    return cached.config;
  }

  const config = applyPluginAutoEnable({
    config: params.config,
    manifestRegistry: currentSnapshot.manifestRegistry,
    discovery: currentSnapshot.discovery,
  }).config;
  gatewayPluginConfigCache.set(params.config, { snapshot: currentSnapshot, config });
  return config;
}
