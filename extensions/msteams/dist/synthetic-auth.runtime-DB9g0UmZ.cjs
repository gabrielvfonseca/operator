const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/plugins/synthetic-auth.runtime.ts
/** Resolves synthetic and external auth provider refs from active runtime state or persisted manifests. */
function uniqueProviderRefs(values) {
	const seen = /* @__PURE__ */ new Set();
	const next = [];
	for (const raw of values) {
		const trimmed = raw.trim();
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed);
		if (!trimmed || seen.has(normalized)) continue;
		seen.add(normalized);
		next.push(trimmed);
	}
	return next;
}
function resolveManifestSyntheticAuthProviderRefState(params = {}) {
	if (params.index && (params.registryDiagnostics?.length ?? 0) > 0) return {
		refs: [],
		complete: false
	};
	const result = require_plugin_registry.loadPluginRegistrySnapshotWithMetadata(params);
	if (result.source !== "persisted" && result.source !== "provided") return {
		refs: [],
		complete: false
	};
	return {
		refs: uniqueProviderRefs(result.snapshot.plugins.flatMap((plugin) => plugin.syntheticAuthRefs ?? [])),
		complete: true
	};
}
function resolveManifestExternalAuthProviderRefs(params = {}) {
	if (params.index && (params.registryDiagnostics?.length ?? 0) > 0) return [];
	const result = require_plugin_registry.loadPluginRegistrySnapshotWithMetadata(params);
	if (result.source !== "persisted" && result.source !== "provided") return [];
	return uniqueProviderRefs(require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({ index: result.snapshot }).plugins.flatMap((plugin) => plugin.contracts?.externalAuthProviders ?? []));
}
/** Lists provider refs that can satisfy synthetic auth profile lookups. */
function resolveRuntimeSyntheticAuthProviderRefs(params = {}) {
	return resolveRuntimeSyntheticAuthProviderRefState(params).refs;
}
/** Returns synthetic-auth refs plus whether the control-plane data source was complete. */
function resolveRuntimeSyntheticAuthProviderRefState(params = {}) {
	const registry = require_runtime_state.getPluginRegistryState()?.activeRegistry;
	if (registry) return {
		refs: uniqueProviderRefs([
			...registry.plugins.flatMap((plugin) => plugin.syntheticAuthRefs ?? []),
			...(registry.providers ?? []).filter((entry) => "resolveSyntheticAuth" in entry.provider && typeof entry.provider.resolveSyntheticAuth === "function").map((entry) => entry.provider.id),
			...registry.cliBackends.filter((entry) => "resolveSyntheticAuth" in entry.backend && typeof entry.backend.resolveSyntheticAuth === "function").map((entry) => entry.backend.id)
		]),
		complete: true
	};
	return resolveManifestSyntheticAuthProviderRefState(params);
}
/** Lists provider refs that can expose external auth profiles to runtime consumers. */
function resolveRuntimeExternalAuthProviderRefs(params = {}) {
	const registry = require_runtime_state.getPluginRegistryState()?.activeRegistry;
	if (registry) return uniqueProviderRefs([
		...registry.plugins.flatMap((plugin) => plugin.contracts?.externalAuthProviders ?? []),
		...(registry.providers ?? []).filter((entry) => "resolveExternalAuthProfiles" in entry.provider && typeof entry.provider.resolveExternalAuthProfiles === "function" || "resolveExternalOAuthProfiles" in entry.provider && typeof entry.provider.resolveExternalOAuthProfiles === "function").map((entry) => entry.provider.id),
		...registry.cliBackends.filter((entry) => "resolveExternalAuthProfiles" in entry.backend && typeof entry.backend.resolveExternalAuthProfiles === "function" || "resolveExternalOAuthProfiles" in entry.backend && typeof entry.backend.resolveExternalOAuthProfiles === "function").map((entry) => entry.backend.id)
	]);
	return resolveManifestExternalAuthProviderRefs(params);
}
//#endregion
Object.defineProperty(exports, "resolveRuntimeExternalAuthProviderRefs", {
	enumerable: true,
	get: function() {
		return resolveRuntimeExternalAuthProviderRefs;
	}
});
Object.defineProperty(exports, "resolveRuntimeSyntheticAuthProviderRefState", {
	enumerable: true,
	get: function() {
		return resolveRuntimeSyntheticAuthProviderRefState;
	}
});
Object.defineProperty(exports, "resolveRuntimeSyntheticAuthProviderRefs", {
	enumerable: true,
	get: function() {
		return resolveRuntimeSyntheticAuthProviderRefs;
	}
});
