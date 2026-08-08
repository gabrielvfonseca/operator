require("./utils-CXqBhRFw.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/plugins/web-search-install-catalog.ts
function normalizeOnboardingScopes(value) {
	if (!Array.isArray(value)) return;
	const scopes = value.filter((entry) => entry === "text-inference");
	return scopes.length > 0 ? scopes : void 0;
}
function pathSegments(path) {
	return path.split(".").map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}
function getConfigPath(config, path) {
	let current = config;
	for (const segment of pathSegments(path)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current)) return;
		current = current[segment];
	}
	return current;
}
function setConfigPath(target, path, value) {
	const segments = pathSegments(path);
	let current = target;
	for (const segment of segments.slice(0, -1)) {
		const next = current[segment];
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next)) current[segment] = {};
		current = current[segment];
	}
	const leaf = segments.at(-1);
	if (leaf) current[leaf] = value;
}
function buildProviderEntry(params) {
	const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.id);
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.label);
	const hint = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.hint);
	const configuredCredentialPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.credentialPath);
	const credentialPath = params.provider.credentialPath === "" ? "" : configuredCredentialPath ?? `plugins.entries.${params.pluginId}.config.webSearch.apiKey`;
	const requiresCredential = params.provider.requiresCredential !== false;
	const envVars = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(params.provider.envVars);
	const placeholder = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.placeholder);
	const signupUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.signupUrl);
	if (!providerId || !label || !hint || requiresCredential && envVars.length === 0 || !placeholder || !signupUrl) return null;
	return {
		id: providerId,
		pluginId: params.pluginId,
		label,
		hint,
		envVars,
		placeholder,
		signupUrl,
		credentialPath,
		...normalizeOnboardingScopes(params.provider.onboardingScopes) ? { onboardingScopes: normalizeOnboardingScopes(params.provider.onboardingScopes) } : {},
		...params.provider.requiresCredential === false ? { requiresCredential: false } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.credentialLabel) ? { credentialLabel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.credentialLabel) } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.docsUrl) ? { docsUrl: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider.docsUrl) } : {},
		...typeof params.provider.autoDetectOrder === "number" ? { autoDetectOrder: params.provider.autoDetectOrder } : {},
		getCredentialValue: (searchConfig) => searchConfig?.apiKey,
		setCredentialValue: (searchConfigTarget, value) => {
			searchConfigTarget.apiKey = value;
		},
		getConfiguredCredentialValue: (config) => getConfigPath(config, credentialPath),
		setConfiguredCredentialValue: (configTarget, value) => {
			setConfigPath(configTarget, credentialPath, value);
		},
		applySelectionConfig: (config) => require_enable.enablePluginInConfig(config, params.pluginId).config,
		createTool: () => null
	};
}
/** Lists web-search provider install catalog entries from official external plugins. */
function resolveWebSearchInstallCatalogEntries() {
	const entries = [];
	for (const entry of require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries()) {
		const manifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(entry);
		const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.plugin?.id);
		const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
		if (!manifest || !pluginId || !install) continue;
		for (const provider of manifest.webSearchProviders ?? []) {
			const providerEntry = buildProviderEntry({
				pluginId,
				provider
			});
			if (!providerEntry) continue;
			entries.push({
				pluginId,
				label: require_official_external_plugin_catalog.resolveOfficialExternalPluginLabel(entry),
				install,
				provider: providerEntry,
				trustedSourceLinkedOfficialInstall: true
			});
		}
	}
	return entries.toSorted((left, right) => left.provider.label.localeCompare(right.provider.label) || left.provider.id.localeCompare(right.provider.id));
}
/** Lists credential-backed web provider plugins selected by documented environment variables. */
function resolveWebSearchInstallCatalogEntriesForEnv(env) {
	return resolveWebSearchInstallCatalogEntries().filter((entry) => entry.provider.requiresCredential !== false && entry.provider.envVars.some((envVar) => Boolean(env[envVar]?.trim())));
}
/** Resolves one web-search install catalog entry by provider id or plugin id. */
function resolveWebSearchInstallCatalogEntry(params) {
	const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerId);
	const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.pluginId);
	return resolveWebSearchInstallCatalogEntries().find((entry) => (!providerId || entry.provider.id === providerId) && (!pluginId || entry.pluginId === pluginId));
}
//#endregion
Object.defineProperty(exports, "resolveWebSearchInstallCatalogEntries", {
	enumerable: true,
	get: function() {
		return resolveWebSearchInstallCatalogEntries;
	}
});
Object.defineProperty(exports, "resolveWebSearchInstallCatalogEntriesForEnv", {
	enumerable: true,
	get: function() {
		return resolveWebSearchInstallCatalogEntriesForEnv;
	}
});
Object.defineProperty(exports, "resolveWebSearchInstallCatalogEntry", {
	enumerable: true,
	get: function() {
		return resolveWebSearchInstallCatalogEntry;
	}
});
