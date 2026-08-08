const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
//#region src/plugins/plugin-version-drift.ts
function resolveExactNpmPinPackageName(entry) {
	if (entry.source !== "npm" || !entry.spec) return;
	const parsed = require_npm_registry_spec.parseRegistryNpmSpec(entry.spec);
	if (parsed?.selectorKind !== "exact-version") return;
	return parsed.name;
}
/** Exact npm pins need a package@version target; id-only updates preserve the old pin. */
function resolvePluginVersionDriftUpdateCommand(entry) {
	const exactNpmPackageName = resolveExactNpmPinPackageName(entry);
	if (exactNpmPackageName) {
		const exactNpmTarget = `${exactNpmPackageName}@${entry.gatewayVersion}`;
		if (require_npm_registry_spec.parseRegistryNpmSpec(exactNpmTarget)?.selectorKind === "exact-version") return `operator plugins update ${exactNpmTarget}`;
	}
	return `operator plugins update ${entry.pluginId}`;
}
/**
* Strip a trailing build qualifier (e.g. `2026.5.4-1` -> `2026.5.4`) so that
* a gateway packaged as `2026.5.4-1` is not reported as drifted from a
* plugin packaged as `2026.5.4`. Both ends are normalized identically.
*/
function normalizeVersion(value) {
	return value.replace(/-\d+$/, "");
}
function isPluginEnabled(config, pluginId) {
	return require_config_state.resolveEffectiveEnableState({
		id: pluginId,
		origin: "global",
		config: require_config_state.normalizePluginsConfig(config?.plugins),
		rootConfig: config
	}).enabled;
}
function shouldCompareOfficialInstallToGateway(params) {
	const officialNpmSpec = require_manifest_registry.resolveTrustedSourceLinkedOfficialNpmSpec(params);
	if (officialNpmSpec) return require_npm_registry_spec.parseRegistryNpmSpec(officialNpmSpec)?.selectorKind !== "exact-version";
	const officialClawHubInstall = require_manifest_registry.resolveTrustedSourceLinkedOfficialClawHubInstall(params);
	if (officialClawHubInstall) {
		if (officialClawHubInstall.clawhubSpec) return !require_clawhub.parseClawHubPluginSpec(officialClawHubInstall.clawhubSpec)?.version;
		return require_npm_registry_spec.parseRegistryNpmSpec(officialClawHubInstall.npmSpec ?? "")?.selectorKind !== "exact-version";
	}
	return false;
}
/**
* Compare active official external plugin installs against the running gateway
* version and return any mismatches.
*
* @param params.gatewayVersion The gateway version string (typically the
*   `version` field of the installed operator package.json).
* @param params.installRecords The full set of recorded plugin installs (as
*   produced by `loadInstalledPluginIndexInstallRecords`).
* @param params.config The merged daemon-side OperatorConfig (optional).
*   Plugins inactive under the effective activation policy are skipped.
*
* The returned `drifts` list is sorted by `pluginId` for stable output.
*/
function detectPluginVersionDrift(params) {
	const { gatewayVersion, installRecords, config } = params;
	const normalizedGateway = normalizeVersion(gatewayVersion);
	const drifts = [];
	for (const [pluginId, record] of Object.entries(installRecords)) {
		if (!record) continue;
		if (!isPluginEnabled(config, pluginId)) continue;
		if (!shouldCompareOfficialInstallToGateway({
			pluginId,
			record
		})) continue;
		const installedVersion = record.resolvedVersion ?? record.version;
		if (!installedVersion) continue;
		if (normalizeVersion(installedVersion) === normalizedGateway) continue;
		drifts.push({
			pluginId,
			installedVersion,
			gatewayVersion,
			source: record.source,
			...record.resolvedName ? { packageName: record.resolvedName } : {},
			...record.spec ? { spec: record.spec } : {}
		});
	}
	drifts.sort((a, b) => a.pluginId.localeCompare(b.pluginId));
	return {
		gatewayVersion,
		drifts
	};
}
//#endregion
Object.defineProperty(exports, "detectPluginVersionDrift", {
	enumerable: true,
	get: function() {
		return detectPluginVersionDrift;
	}
});
Object.defineProperty(exports, "resolvePluginVersionDriftUpdateCommand", {
	enumerable: true,
	get: function() {
		return resolvePluginVersionDriftUpdateCommand;
	}
});
