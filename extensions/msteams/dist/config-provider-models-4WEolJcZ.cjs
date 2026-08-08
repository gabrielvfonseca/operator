const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
//#region src/media-understanding/config-provider-models.ts
function hasImageCapableModel(providerCfg) {
	return (providerCfg.models ?? []).some((model) => Array.isArray(model?.input) && model.input.includes("image"));
}
/** Finds configured model providers that can be auto-registered for image understanding. */
function resolveImageCapableConfigProviderIds(cfg) {
	const configProviders = cfg?.models?.providers;
	if (!configProviders || typeof configProviders !== "object") return [];
	const providerIds = [];
	for (const [providerKey, providerCfg] of Object.entries(configProviders)) {
		if (!providerKey?.trim() || !hasImageCapableModel(providerCfg)) continue;
		providerIds.push(require_provider_id.normalizeMediaProviderId(providerKey));
	}
	return providerIds;
}
//#endregion
Object.defineProperty(exports, "resolveImageCapableConfigProviderIds", {
	enumerable: true,
	get: function() {
		return resolveImageCapableConfigProviderIds;
	}
});
