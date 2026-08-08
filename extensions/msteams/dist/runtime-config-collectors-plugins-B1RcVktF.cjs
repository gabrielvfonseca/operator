const require_path_array_index = require("./path-array-index-C9RRFl-Q.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
require("./shared-Bt0YEZDW.cjs");
const require_config_contract_matches = require("./config-contract-matches-BOy7ZHza.cjs");
const require_config_contracts = require("./config-contracts-DUBBUbeG.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/runtime-config-collectors-plugins.ts
/** Collects plugin config secret refs from runtime plugin metadata. */
function parsePluginConfigArrayIndex(segment) {
	return require_path_array_index.parseConfigPathArrayIndex(segment);
}
/**
* Walk manifest-declared plugin config SecretRef surfaces and collect
* assignments for runtime materialization. Plugin-owned metadata controls which
* config paths support SecretRefs and whether bundled plugins stay inactive on
* that surface until explicitly enabled.
*
* When `loadablePluginOrigins` is provided, entries whose ID is not in the map
* are treated as inactive (stale config entries for plugins that are no longer
* installed). This prevents resolution failures for SecretRefs belonging to
* non-loadable plugins from blocking startup or preflight validation.
*/
/** Collects SecretRef assignments from plugin-owned config contract paths. */
function collectPluginConfigAssignments(params) {
	const entries = params.config.plugins?.entries;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entries)) return;
	const normalizedConfig = require_config_state.normalizePluginsConfig(params.config.plugins);
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, require_agent_scope_config.resolveDefaultAgentId(params.config));
	const bundledLoadablePluginIds = [...params.loadablePluginOrigins?.entries() ?? []].filter(([, origin]) => origin === "bundled").map(([pluginId]) => pluginId);
	const pluginSecretInputs = new Map([...require_config_contracts.resolvePluginConfigContractsById({
		config: params.config,
		workspaceDir,
		env: params.context.env,
		fallbackToBundledMetadata: true,
		fallbackToBundledMetadataForResolvedBundled: true,
		fallbackBundledPluginIds: bundledLoadablePluginIds,
		pluginIds: Object.keys(entries)
	}).entries()].flatMap(([pluginId, metadata]) => {
		const secretInputs = metadata.configContracts.secretInputs;
		if (!secretInputs?.paths.length) return [];
		return [[pluginId, {
			origin: metadata.origin,
			bundledDefaultEnabled: secretInputs.bundledDefaultEnabled,
			paths: secretInputs.paths
		}]];
	}));
	for (const [pluginId, entry] of Object.entries(entries)) {
		const secretInputs = pluginSecretInputs.get(pluginId);
		if (!secretInputs) continue;
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const pluginConfig = entry.config;
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig)) continue;
		const pluginOrigin = params.loadablePluginOrigins?.get(pluginId);
		if (params.loadablePluginOrigins && !pluginOrigin) {
			collectConfiguredPluginSecretAssignments({
				pluginId,
				pluginConfig,
				secretPaths: secretInputs.paths,
				active: false,
				inactiveReason: "plugin is not loadable (stale config entry).",
				defaults: params.defaults,
				context: params.context
			});
			continue;
		}
		const resolvedOrigin = pluginOrigin ?? secretInputs.origin;
		const enableState = require_config_state.resolveEnableState(pluginId, resolvedOrigin, normalizedConfig, resolvedOrigin === "bundled" ? secretInputs.bundledDefaultEnabled : void 0);
		collectConfiguredPluginSecretAssignments({
			pluginId,
			pluginConfig,
			secretPaths: secretInputs.paths,
			active: enableState.enabled,
			inactiveReason: enableState.reason ?? "plugin is disabled.",
			defaults: params.defaults,
			context: params.context
		});
	}
}
function collectConfiguredPluginSecretAssignments(params) {
	const seenPaths = /* @__PURE__ */ new Set();
	for (const secretPath of params.secretPaths) for (const match of require_config_contract_matches.collectPluginConfigContractMatches({
		root: params.pluginConfig,
		pathPattern: secretPath.path
	})) {
		const fullPath = `plugins.entries.${params.pluginId}.config.${match.path}`;
		if (seenPaths.has(fullPath)) continue;
		seenPaths.add(fullPath);
		require_runtime_shared.collectSecretInputAssignment({
			value: match.value,
			path: fullPath,
			expected: secretPath.expected ?? "string",
			defaults: params.defaults,
			context: params.context,
			active: params.active,
			inactiveReason: `plugin "${params.pluginId}": ${params.inactiveReason}`,
			apply: createPluginConfigAssignmentApply(params.pluginConfig, match.path)
		});
	}
}
function createPluginConfigAssignmentApply(pluginConfig, relativePath) {
	return (value) => {
		const segments = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(relativePath.replace(/\[(\d+)\]/g, ".$1").split("."));
		if (segments.length === 0) return;
		let current = pluginConfig;
		for (const segment of segments.slice(0, -1)) {
			if (Array.isArray(current)) {
				const index = parsePluginConfigArrayIndex(segment);
				current = index !== void 0 && index < current.length ? current[index] : void 0;
				continue;
			}
			current = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current) ? current[segment] : void 0;
		}
		const finalSegment = segments.at(-1);
		if (!finalSegment) return;
		if (Array.isArray(current)) {
			const index = parsePluginConfigArrayIndex(finalSegment);
			if (index !== void 0 && index < current.length) current[index] = value;
			return;
		}
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current)) current[finalSegment] = value;
	};
}
//#endregion
Object.defineProperty(exports, "collectPluginConfigAssignments", {
	enumerable: true,
	get: function() {
		return collectPluginConfigAssignments;
	}
});
