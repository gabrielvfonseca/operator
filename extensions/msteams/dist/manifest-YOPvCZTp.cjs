const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_plugin_cache_primitives = require("./plugin-cache-primitives-DGHa8Ph9.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_model_catalog_core_model_catalog_normalize = require("@gabrielvfonseca/model-catalog-core/model-catalog-normalize");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/manifest-command-aliases.ts
/** Normalizes manifest-declared CLI command aliases. */
/** Normalizes manifest command alias records and reports duplicate/invalid entries. */
function normalizeManifestCommandAliases(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (typeof entry === "string") {
			const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry) ?? "";
			if (name) normalized.push({ name });
			continue;
		}
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name) ?? "";
		if (!name) continue;
		const kind = entry.kind === "runtime-slash" ? entry.kind : void 0;
		const cliCommand = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.cliCommand) ?? "";
		normalized.push({
			name,
			...kind ? { kind } : {},
			...cliCommand ? { cliCommand } : {}
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function resolveManifestCommandAliasOwnerInRegistry(params) {
	const normalizedCommand = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.command);
	if (!normalizedCommand) return;
	const commandIsPluginId = params.registry.plugins.some((plugin) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(plugin.id) === normalizedCommand);
	for (const plugin of params.registry.plugins) {
		const alias = plugin.commandAliases?.find((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.name) === normalizedCommand);
		if (alias) {
			if (commandIsPluginId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(plugin.id) !== normalizedCommand) continue;
			return {
				...alias,
				pluginId: plugin.id,
				...plugin.enabledByDefault === true ? { enabledByDefault: true } : {}
			};
		}
	}
}
//#endregion
//#region src/plugins/manifest.ts
/** Loads and normalizes Operator plugin manifests, including contracts and config schemas. */
/** Canonical plugin manifest filename inside plugin roots. */
const PLUGIN_MANIFEST_FILENAME = "operator.plugin.json";
const PLUGIN_MANIFEST_FILENAMES = [PLUGIN_MANIFEST_FILENAME];
const MAX_PLUGIN_MANIFEST_BYTES = 256 * 1024;
const MAX_PLUGIN_MANIFEST_LOAD_CACHE_ENTRIES = 512;
const MAX_SECRET_PROVIDER_EXEC_ARGS = 128;
const MAX_SECRET_PROVIDER_EXEC_ARG_BYTES = 1024;
const MAX_SECRET_PROVIDER_EXEC_TIMEOUT_MS = 12e4;
const MAX_SECRET_PROVIDER_EXEC_OUTPUT_BYTES = 20 * 1024 * 1024;
const MAX_SECRET_PROVIDER_EXEC_PASS_ENV = 128;
const SECRET_PROVIDER_NODE_COMMAND_PLACEHOLDER = "${node}";
const CORE_RESERVED_PLUGIN_IDS = /* @__PURE__ */ new Set(["node-mcp"]);
const pluginManifestLoadCache = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_MANIFEST_LOAD_CACHE_ENTRIES);
function normalizeStringListRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [key, rawValues] of Object.entries(value)) {
		const providerId = require_string_coerce.normalizeOptionalString(key) ?? "";
		if (!providerId || require_prototype_keys.isBlockedObjectKey(providerId)) continue;
		const values = require_string_normalization.normalizeTrimmedStringList(rawValues);
		if (values.length === 0) continue;
		normalized[providerId] = values;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeStringRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [rawKey, rawValue] of Object.entries(value)) {
		const key = require_string_coerce.normalizeOptionalString(rawKey) ?? "";
		const valueLocal = require_string_coerce.normalizeOptionalString(rawValue) ?? "";
		if (!key || require_prototype_keys.isBlockedObjectKey(key) || !valueLocal) continue;
		normalized[key] = valueLocal;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
const MEDIA_UNDERSTANDING_CAPABILITIES = /* @__PURE__ */ new Set([
	"image",
	"audio",
	"video"
]);
function normalizeMediaUnderstandingCapabilityRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = {};
	for (const [rawKey, rawValue] of Object.entries(value)) {
		if (!MEDIA_UNDERSTANDING_CAPABILITIES.has(rawKey)) continue;
		const model = require_string_coerce.normalizeOptionalString(rawValue);
		if (model) normalized[rawKey] = model;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeMediaUnderstandingPriorityRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = {};
	for (const [rawKey, rawValue] of Object.entries(value)) {
		if (!MEDIA_UNDERSTANDING_CAPABILITIES.has(rawKey) || typeof rawValue !== "number" || !Number.isFinite(rawValue)) continue;
		normalized[rawKey] = rawValue;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeMediaUnderstandingCapabilities(value) {
	const values = require_string_normalization.normalizeTrimmedStringList(value).filter((entry) => MEDIA_UNDERSTANDING_CAPABILITIES.has(entry));
	return values.length > 0 ? values : void 0;
}
function normalizeMediaUnderstandingNativeDocumentInputs(value) {
	const values = require_string_normalization.normalizeTrimmedStringList(value).filter((entry) => entry === "pdf");
	return values.length > 0 ? values : void 0;
}
function normalizeMediaUnderstandingDocumentModels(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const pdfRaw = value.pdf;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pdfRaw)) return;
	const textExtraction = require_string_coerce.normalizeOptionalString(pdfRaw.textExtraction);
	const image = pdfRaw.image === false ? false : require_string_coerce.normalizeOptionalString(pdfRaw.image);
	const pdf = {
		...textExtraction ? { textExtraction } : {},
		...image !== void 0 ? { image } : {}
	};
	return Object.keys(pdf).length > 0 ? { pdf } : void 0;
}
function normalizeMediaUnderstandingProviderMetadata(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [rawProviderId, rawMetadata] of Object.entries(value)) {
		const providerId = require_string_coerce.normalizeOptionalString(rawProviderId) ?? "";
		if (!providerId || require_prototype_keys.isBlockedObjectKey(providerId) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawMetadata)) continue;
		const capabilities = normalizeMediaUnderstandingCapabilities(rawMetadata.capabilities);
		const defaultModels = normalizeMediaUnderstandingCapabilityRecord(rawMetadata.defaultModels);
		const autoPriority = normalizeMediaUnderstandingPriorityRecord(rawMetadata.autoPriority);
		const nativeDocumentInputs = normalizeMediaUnderstandingNativeDocumentInputs(rawMetadata.nativeDocumentInputs);
		const documentModels = normalizeMediaUnderstandingDocumentModels(rawMetadata.documentModels);
		const metadata = {
			...capabilities ? { capabilities } : {},
			...defaultModels ? { defaultModels } : {},
			...autoPriority ? { autoPriority } : {},
			...nativeDocumentInputs ? { nativeDocumentInputs } : {},
			...documentModels ? { documentModels } : {}
		};
		if (Object.keys(metadata).length > 0) normalized[providerId] = metadata;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeProviderBaseUrlGuard(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const provider = require_string_coerce.normalizeOptionalString(value.provider);
	const allowedBaseUrls = require_string_normalization.normalizeTrimmedStringList(value.allowedBaseUrls);
	if (!provider || allowedBaseUrls.length === 0) return;
	const defaultBaseUrl = require_string_coerce.normalizeOptionalString(value.defaultBaseUrl);
	return {
		provider,
		...defaultBaseUrl ? { defaultBaseUrl } : {},
		allowedBaseUrls
	};
}
function normalizeCapabilityProviderAuthSignals(value) {
	if (!Array.isArray(value)) return;
	const signals = [];
	for (const rawSignal of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSignal)) continue;
		const provider = require_string_coerce.normalizeOptionalString(rawSignal.provider);
		if (!provider) continue;
		const providerBaseUrl = normalizeProviderBaseUrlGuard(rawSignal.providerBaseUrl);
		signals.push({
			provider,
			...providerBaseUrl ? { providerBaseUrl } : {}
		});
	}
	return signals.length > 0 ? signals : void 0;
}
function normalizeCapabilityProviderModeConfigSignal(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const pathResult = require_string_coerce.normalizeOptionalString(value.path);
	const defaultValue = require_string_coerce.normalizeOptionalString(value.default);
	const allowed = require_string_normalization.normalizeTrimmedStringList(value.allowed);
	const disallowed = require_string_normalization.normalizeTrimmedStringList(value.disallowed);
	const signal = {
		...pathResult ? { path: pathResult } : {},
		...defaultValue ? { default: defaultValue } : {},
		...allowed.length > 0 ? { allowed } : {},
		...disallowed.length > 0 ? { disallowed } : {}
	};
	return Object.keys(signal).length > 0 ? signal : void 0;
}
function normalizeCapabilityProviderConfigSignals(value) {
	if (!Array.isArray(value)) return;
	const signals = [];
	for (const rawSignal of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawSignal)) continue;
		const rootPath = require_string_coerce.normalizeOptionalString(rawSignal.rootPath);
		if (!rootPath) continue;
		const overlayPath = require_string_coerce.normalizeOptionalString(rawSignal.overlayPath);
		const overlayMapPath = require_string_coerce.normalizeOptionalString(rawSignal.overlayMapPath);
		const required = require_string_normalization.normalizeTrimmedStringList(rawSignal.required);
		const requiredAny = require_string_normalization.normalizeTrimmedStringList(rawSignal.requiredAny);
		const mode = normalizeCapabilityProviderModeConfigSignal(rawSignal.mode);
		const signal = {
			rootPath,
			...overlayPath ? { overlayPath } : {},
			...overlayMapPath ? { overlayMapPath } : {},
			...required.length > 0 ? { required } : {},
			...requiredAny.length > 0 ? { requiredAny } : {},
			...mode ? { mode } : {}
		};
		if (required.length > 0 || requiredAny.length > 0 || mode) signals.push(signal);
	}
	return signals.length > 0 ? signals : void 0;
}
function normalizeCapabilityProviderMetadataEntry(rawMetadata) {
	const aliases = require_string_normalization.normalizeTrimmedStringList(rawMetadata.aliases);
	const authProviders = require_string_normalization.normalizeTrimmedStringList(rawMetadata.authProviders);
	const authSignals = normalizeCapabilityProviderAuthSignals(rawMetadata.authSignals);
	const configSignals = normalizeCapabilityProviderConfigSignals(rawMetadata.configSignals);
	const referenceAudioInputs = rawMetadata.referenceAudioInputs === true ? true : void 0;
	const metadata = {
		...aliases.length > 0 ? { aliases } : {},
		...authProviders.length > 0 ? { authProviders } : {},
		...authSignals ? { authSignals } : {},
		...configSignals ? { configSignals } : {},
		...referenceAudioInputs ? { referenceAudioInputs } : {}
	};
	return Object.keys(metadata).length > 0 ? metadata : void 0;
}
function normalizeCapabilityProviderMetadata(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [rawProviderId, rawMetadata] of Object.entries(value)) {
		const providerId = require_string_coerce.normalizeOptionalString(rawProviderId) ?? "";
		if (!providerId || require_prototype_keys.isBlockedObjectKey(providerId) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawMetadata)) continue;
		const metadata = normalizeCapabilityProviderMetadataEntry(rawMetadata);
		if (metadata) normalized[providerId] = metadata;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizePluginToolMetadata(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [rawToolName, rawMetadata] of Object.entries(value)) {
		const toolName = require_string_coerce.normalizeOptionalString(rawToolName) ?? "";
		if (!toolName || require_prototype_keys.isBlockedObjectKey(toolName) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawMetadata)) continue;
		const metadata = {
			...normalizeCapabilityProviderMetadataEntry(rawMetadata),
			...rawMetadata.optional === true ? { optional: true } : {},
			...rawMetadata.replaySafe === true ? { replaySafe: true } : {}
		};
		if (Object.keys(metadata).length > 0) normalized[toolName] = metadata;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeManifestCatalog(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const featured = typeof value.featured === "boolean" ? value.featured : void 0;
	const order = typeof value.order === "number" && Number.isFinite(value.order) ? value.order : void 0;
	if (featured === void 0 && order === void 0) return;
	return {
		...featured !== void 0 ? { featured } : {},
		...order !== void 0 ? { order } : {}
	};
}
function normalizeManifestContracts(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const embeddedExtensionFactories = require_string_normalization.normalizeTrimmedStringList(value.embeddedExtensionFactories);
	const agentToolResultMiddleware = require_string_normalization.normalizeTrimmedStringList(value.agentToolResultMiddleware);
	const trustedToolPolicies = require_string_normalization.normalizeTrimmedStringList(value.trustedToolPolicies);
	const externalAuthProviders = require_string_normalization.normalizeTrimmedStringList(value.externalAuthProviders);
	const embeddingProviders = require_string_normalization.normalizeTrimmedStringList(value.embeddingProviders);
	const memoryEmbeddingProviders = require_string_normalization.normalizeTrimmedStringList(value.memoryEmbeddingProviders);
	const speechProviders = require_string_normalization.normalizeTrimmedStringList(value.speechProviders);
	const realtimeTranscriptionProviders = require_string_normalization.normalizeTrimmedStringList(value.realtimeTranscriptionProviders);
	const realtimeVoiceProviders = require_string_normalization.normalizeTrimmedStringList(value.realtimeVoiceProviders);
	const mediaUnderstandingProviders = require_string_normalization.normalizeTrimmedStringList(value.mediaUnderstandingProviders);
	const transcriptSourceProviders = require_string_normalization.normalizeTrimmedStringList(value.transcriptSourceProviders);
	const documentExtractors = require_string_normalization.normalizeTrimmedStringList(value.documentExtractors);
	const imageGenerationProviders = require_string_normalization.normalizeTrimmedStringList(value.imageGenerationProviders);
	const videoGenerationProviders = require_string_normalization.normalizeTrimmedStringList(value.videoGenerationProviders);
	const musicGenerationProviders = require_string_normalization.normalizeTrimmedStringList(value.musicGenerationProviders);
	const webContentExtractors = require_string_normalization.normalizeTrimmedStringList(value.webContentExtractors);
	const webFetchProviders = require_string_normalization.normalizeTrimmedStringList(value.webFetchProviders);
	const webSearchProviders = require_string_normalization.normalizeTrimmedStringList(value.webSearchProviders);
	const workerProviders = require_string_normalization.normalizeTrimmedStringList(value.workerProviders);
	const usageProviders = require_string_normalization.normalizeTrimmedStringList(value.usageProviders);
	const migrationProviders = require_string_normalization.normalizeTrimmedStringList(value.migrationProviders);
	const gatewayMethodDispatch = require_string_normalization.normalizeTrimmedStringList(value.gatewayMethodDispatch);
	const tools = require_string_normalization.normalizeTrimmedStringList(value.tools);
	const contracts = {
		...embeddedExtensionFactories.length > 0 ? { embeddedExtensionFactories } : {},
		...agentToolResultMiddleware.length > 0 ? { agentToolResultMiddleware } : {},
		...trustedToolPolicies.length > 0 ? { trustedToolPolicies } : {},
		...externalAuthProviders.length > 0 ? { externalAuthProviders } : {},
		...embeddingProviders.length > 0 ? { embeddingProviders } : {},
		...memoryEmbeddingProviders.length > 0 ? { memoryEmbeddingProviders } : {},
		...speechProviders.length > 0 ? { speechProviders } : {},
		...realtimeTranscriptionProviders.length > 0 ? { realtimeTranscriptionProviders } : {},
		...realtimeVoiceProviders.length > 0 ? { realtimeVoiceProviders } : {},
		...mediaUnderstandingProviders.length > 0 ? { mediaUnderstandingProviders } : {},
		...transcriptSourceProviders.length > 0 ? { transcriptSourceProviders } : {},
		...documentExtractors.length > 0 ? { documentExtractors } : {},
		...imageGenerationProviders.length > 0 ? { imageGenerationProviders } : {},
		...videoGenerationProviders.length > 0 ? { videoGenerationProviders } : {},
		...musicGenerationProviders.length > 0 ? { musicGenerationProviders } : {},
		...webContentExtractors.length > 0 ? { webContentExtractors } : {},
		...webFetchProviders.length > 0 ? { webFetchProviders } : {},
		...webSearchProviders.length > 0 ? { webSearchProviders } : {},
		...workerProviders.length > 0 ? { workerProviders } : {},
		...usageProviders.length > 0 ? { usageProviders } : {},
		...migrationProviders.length > 0 ? { migrationProviders } : {},
		...gatewayMethodDispatch.length > 0 ? { gatewayMethodDispatch } : {},
		...tools.length > 0 ? { tools } : {}
	};
	return Object.keys(contracts).length > 0 ? contracts : void 0;
}
function isManifestConfigLiteral(value) {
	return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function normalizeManifestDangerousConfigFlags(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const pathValue = require_string_coerce.normalizeOptionalString(entry.path) ?? "";
		if (!pathValue || !isManifestConfigLiteral(entry.equals)) continue;
		normalized.push({
			path: pathValue,
			equals: entry.equals
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestSecretInputPaths(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const pathLocal = require_string_coerce.normalizeOptionalString(entry.path) ?? "";
		if (!pathLocal) continue;
		const expected = entry.expected === "string" ? entry.expected : void 0;
		normalized.push({
			path: pathLocal,
			...expected ? { expected } : {}
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestConfigContracts(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const compatibilityMigrationPaths = require_string_normalization.normalizeTrimmedStringList(value.compatibilityMigrationPaths);
	const compatibilityRuntimePaths = require_string_normalization.normalizeTrimmedStringList(value.compatibilityRuntimePaths);
	const rawSecretInputs = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.secretInputs) ? value.secretInputs : void 0;
	const dangerousFlags = normalizeManifestDangerousConfigFlags(value.dangerousFlags);
	const secretInputPaths = rawSecretInputs ? normalizeManifestSecretInputPaths(rawSecretInputs.paths) : void 0;
	const secretInputs = secretInputPaths && secretInputPaths.length > 0 ? {
		...rawSecretInputs?.bundledDefaultEnabled === true ? { bundledDefaultEnabled: true } : rawSecretInputs?.bundledDefaultEnabled === false ? { bundledDefaultEnabled: false } : {},
		paths: secretInputPaths
	} : void 0;
	const configContracts = {
		...compatibilityMigrationPaths.length > 0 ? { compatibilityMigrationPaths } : {},
		...compatibilityRuntimePaths.length > 0 ? { compatibilityRuntimePaths } : {},
		...dangerousFlags ? { dangerousFlags } : {},
		...secretInputs ? { secretInputs } : {}
	};
	return Object.keys(configContracts).length > 0 ? configContracts : void 0;
}
function normalizeManifestModelSupport(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const modelPrefixes = require_string_normalization.normalizeTrimmedStringList(value.modelPrefixes);
	const modelPatterns = require_string_normalization.normalizeTrimmedStringList(value.modelPatterns);
	const modelSupport = {
		...modelPrefixes.length > 0 ? { modelPrefixes } : {},
		...modelPatterns.length > 0 ? { modelPatterns } : {}
	};
	return Object.keys(modelSupport).length > 0 ? modelSupport : void 0;
}
function normalizeManifestModelPricingSource(value) {
	if (value === false) return false;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const provider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(require_string_coerce.normalizeOptionalString(value.provider) ?? "");
	const modelIdTransforms = require_string_normalization.normalizeTrimmedStringList(value.modelIdTransforms).filter((entry) => entry === "version-dots");
	const source = {
		...provider ? { provider } : {},
		...value.passthroughProviderModel === true ? { passthroughProviderModel: true } : {},
		...modelIdTransforms.length > 0 ? { modelIdTransforms } : {}
	};
	return Object.keys(source).length > 0 ? source : void 0;
}
function normalizeManifestModelPricingProvider(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const openRouter = normalizeManifestModelPricingSource(value.openRouter);
	const liteLLM = normalizeManifestModelPricingSource(value.liteLLM);
	const policy = {
		...typeof value.external === "boolean" ? { external: value.external } : {},
		...openRouter !== void 0 ? { openRouter } : {},
		...liteLLM !== void 0 ? { liteLLM } : {}
	};
	return Object.keys(policy).length > 0 ? policy : void 0;
}
function normalizeManifestModelPricing(value, params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.providers)) return;
	const ownedProviders = new Set([...params.ownedProviders].map((provider) => (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(provider)).filter(Boolean));
	const providers = {};
	for (const [rawProviderId, rawPolicy] of Object.entries(value.providers)) {
		const providerId = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawProviderId);
		if (!providerId || !ownedProviders.has(providerId)) continue;
		const policy = normalizeManifestModelPricingProvider(rawPolicy);
		if (policy) providers[providerId] = policy;
	}
	return Object.keys(providers).length > 0 ? { providers } : void 0;
}
function normalizeManifestModelIdPrefixRules(value) {
	if (!Array.isArray(value)) return;
	const rules = [];
	for (const rawRule of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawRule)) continue;
		const modelPrefix = require_string_coerce.normalizeOptionalString(rawRule.modelPrefix);
		const prefix = require_string_coerce.normalizeOptionalString(rawRule.prefix);
		if (!modelPrefix || !prefix) continue;
		rules.push({
			modelPrefix,
			prefix
		});
	}
	return rules.length > 0 ? rules : void 0;
}
function normalizeManifestModelIdNormalizationProvider(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const aliases = {};
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.aliases)) for (const [rawAlias, rawCanonical] of Object.entries(value.aliases)) {
		const alias = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawAlias);
		const canonical = require_string_coerce.normalizeOptionalString(rawCanonical);
		if (alias && canonical) aliases[alias] = canonical;
	}
	const stripPrefixes = require_string_normalization.normalizeTrimmedStringList(value.stripPrefixes);
	const prefixWhenBare = require_string_coerce.normalizeOptionalString(value.prefixWhenBare);
	const prefixWhenBareAfterAliasStartsWith = normalizeManifestModelIdPrefixRules(value.prefixWhenBareAfterAliasStartsWith);
	const normalization = {
		...Object.keys(aliases).length > 0 ? { aliases } : {},
		...stripPrefixes.length > 0 ? { stripPrefixes } : {},
		...prefixWhenBare ? { prefixWhenBare } : {},
		...prefixWhenBareAfterAliasStartsWith ? { prefixWhenBareAfterAliasStartsWith } : {}
	};
	return Object.keys(normalization).length > 0 ? normalization : void 0;
}
function normalizeManifestModelIdNormalization(value, params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.providers)) return;
	const ownedProviders = new Set([...params.ownedProviders].map((provider) => (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(provider)).filter(Boolean));
	const providers = {};
	for (const [rawProviderId, rawPolicy] of Object.entries(value.providers)) {
		const providerId = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawProviderId);
		if (!providerId || !ownedProviders.has(providerId)) continue;
		const policy = normalizeManifestModelIdNormalizationProvider(rawPolicy);
		if (policy) providers[providerId] = policy;
	}
	return Object.keys(providers).length > 0 ? { providers } : void 0;
}
function normalizeManifestProviderEndpoints(value) {
	if (!Array.isArray(value)) return;
	const endpoints = [];
	for (const rawEndpoint of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEndpoint)) continue;
		const endpointClass = require_string_coerce.normalizeOptionalString(rawEndpoint.endpointClass);
		if (!endpointClass) continue;
		const hosts = require_string_normalization.normalizeTrimmedStringList(rawEndpoint.hosts).map((host) => host.toLowerCase());
		const hostSuffixes = require_string_normalization.normalizeTrimmedStringList(rawEndpoint.hostSuffixes).map((host) => host.toLowerCase());
		const baseUrls = require_string_normalization.normalizeTrimmedStringList(rawEndpoint.baseUrls);
		const googleVertexRegion = require_string_coerce.normalizeOptionalString(rawEndpoint.googleVertexRegion);
		const googleVertexRegionHostSuffix = require_string_coerce.normalizeOptionalString(rawEndpoint.googleVertexRegionHostSuffix)?.toLowerCase();
		if (hosts.length === 0 && hostSuffixes.length === 0 && baseUrls.length === 0) continue;
		endpoints.push({
			endpointClass,
			...hosts.length > 0 ? { hosts } : {},
			...hostSuffixes.length > 0 ? { hostSuffixes } : {},
			...baseUrls.length > 0 ? { baseUrls } : {},
			...googleVertexRegion ? { googleVertexRegion } : {},
			...googleVertexRegionHostSuffix ? { googleVertexRegionHostSuffix } : {}
		});
	}
	return endpoints.length > 0 ? endpoints : void 0;
}
function normalizeManifestProviderRequestProvider(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const family = require_string_coerce.normalizeOptionalString(value.family);
	const compatibilityFamily = require_string_coerce.normalizeOptionalString(value.compatibilityFamily) === "moonshot" ? "moonshot" : void 0;
	const supportsStreamingUsage = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.openAICompletions) ? value.openAICompletions.supportsStreamingUsage : void 0;
	const openAICompletions = typeof supportsStreamingUsage === "boolean" ? { supportsStreamingUsage } : void 0;
	const providerRequest = {
		...family ? { family } : {},
		...compatibilityFamily ? { compatibilityFamily } : {},
		...openAICompletions && Object.keys(openAICompletions).length > 0 ? { openAICompletions } : {}
	};
	return Object.keys(providerRequest).length > 0 ? providerRequest : void 0;
}
function normalizeManifestProviderRequest(value, params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.providers)) return;
	const ownedProviders = new Set([...params.ownedProviders].map((provider) => (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(provider)).filter(Boolean));
	const providers = {};
	for (const [rawProviderId, rawPolicy] of Object.entries(value.providers)) {
		const providerId = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawProviderId);
		if (!providerId || !ownedProviders.has(providerId)) continue;
		const policy = normalizeManifestProviderRequestProvider(rawPolicy);
		if (policy) providers[providerId] = policy;
	}
	return Object.keys(providers).length > 0 ? { providers } : void 0;
}
function normalizeManifestStringArray(value, options) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (typeof entry !== "string") continue;
		if (options?.maxLength !== void 0 && entry.length > options.maxLength) continue;
		if (options?.pattern && !options.pattern.test(entry)) continue;
		normalized.push(entry);
		if (options?.maxItems !== void 0 && normalized.length >= options.maxItems) break;
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestTrimmedStringArray(value, options) {
	const normalized = require_string_normalization.normalizeTrimmedStringList(value).filter((entry) => !options?.pattern || options.pattern.test(entry));
	const limited = options?.maxItems !== void 0 ? normalized.slice(0, options.maxItems) : normalized;
	return limited.length > 0 ? limited : void 0;
}
function normalizeManifestPositiveInteger(value, max) {
	return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= max ? value : void 0;
}
function normalizeManifestSecretProviderIntegrations(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [rawId, rawIntegration] of Object.entries(value)) {
		const id = require_string_coerce.normalizeOptionalString(rawId) ?? "";
		if (!id || require_prototype_keys.isBlockedObjectKey(id) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawIntegration)) continue;
		const command = require_string_coerce.normalizeOptionalString(rawIntegration.command);
		if (rawIntegration.source !== "exec" || command !== SECRET_PROVIDER_NODE_COMMAND_PLACEHOLDER) continue;
		const providerAlias = require_string_coerce.normalizeOptionalString(rawIntegration.providerAlias);
		const displayName = require_string_coerce.normalizeOptionalString(rawIntegration.displayName);
		const description = require_string_coerce.normalizeOptionalString(rawIntegration.description);
		const args = normalizeManifestStringArray(rawIntegration.args, {
			maxItems: MAX_SECRET_PROVIDER_EXEC_ARGS,
			maxLength: MAX_SECRET_PROVIDER_EXEC_ARG_BYTES
		});
		const timeoutMs = normalizeManifestPositiveInteger(rawIntegration.timeoutMs, MAX_SECRET_PROVIDER_EXEC_TIMEOUT_MS);
		const noOutputTimeoutMs = normalizeManifestPositiveInteger(rawIntegration.noOutputTimeoutMs, MAX_SECRET_PROVIDER_EXEC_TIMEOUT_MS);
		const maxOutputBytes = normalizeManifestPositiveInteger(rawIntegration.maxOutputBytes, MAX_SECRET_PROVIDER_EXEC_OUTPUT_BYTES);
		const env = normalizeStringRecord(rawIntegration.env);
		const passEnv = normalizeManifestTrimmedStringArray(rawIntegration.passEnv, {
			maxItems: MAX_SECRET_PROVIDER_EXEC_PASS_ENV,
			pattern: require_types_secrets.ENV_SECRET_REF_ID_RE
		});
		normalized[id] = {
			...providerAlias ? { providerAlias } : {},
			...displayName ? { displayName } : {},
			...description ? { description } : {},
			source: "exec",
			command,
			...args ? { args } : {},
			...timeoutMs !== void 0 ? { timeoutMs } : {},
			...noOutputTimeoutMs !== void 0 ? { noOutputTimeoutMs } : {},
			...maxOutputBytes !== void 0 ? { maxOutputBytes } : {},
			...typeof rawIntegration.jsonOnly === "boolean" ? { jsonOnly: rawIntegration.jsonOnly } : {},
			...env ? { env } : {},
			...passEnv ? { passEnv } : {},
			...rawIntegration.allowInsecurePath === true ? { allowInsecurePath: true } : {}
		};
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeManifestActivation(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const onProviders = require_string_normalization.normalizeTrimmedStringList(value.onProviders);
	const onAgentHarnesses = require_string_normalization.normalizeTrimmedStringList(value.onAgentHarnesses);
	const onCommands = require_string_normalization.normalizeTrimmedStringList(value.onCommands);
	const onChannels = require_string_normalization.normalizeTrimmedStringList(value.onChannels);
	const onRoutes = require_string_normalization.normalizeTrimmedStringList(value.onRoutes);
	const onConfigPaths = require_string_normalization.normalizeTrimmedStringList(value.onConfigPaths);
	const onStartup = typeof value.onStartup === "boolean" ? value.onStartup : void 0;
	const onCapabilities = require_string_normalization.normalizeTrimmedStringList(value.onCapabilities).filter((capability) => capability === "provider" || capability === "channel" || capability === "tool" || capability === "hook");
	const activation = {
		...onStartup !== void 0 ? { onStartup } : {},
		...onProviders.length > 0 ? { onProviders } : {},
		...onAgentHarnesses.length > 0 ? { onAgentHarnesses } : {},
		...onCommands.length > 0 ? { onCommands } : {},
		...onChannels.length > 0 ? { onChannels } : {},
		...onRoutes.length > 0 ? { onRoutes } : {},
		...onConfigPaths.length > 0 ? { onConfigPaths } : {},
		...onCapabilities.length > 0 ? { onCapabilities } : {}
	};
	return Object.keys(activation).length > 0 ? activation : void 0;
}
const MANIFEST_DEFAULT_ENABLEMENT_PLATFORMS = /* @__PURE__ */ new Set([
	"aix",
	"android",
	"darwin",
	"freebsd",
	"haiku",
	"linux",
	"openbsd",
	"sunos",
	"win32",
	"cygwin",
	"netbsd"
]);
function normalizeManifestDefaultPlatforms(value) {
	return require_string_normalization.normalizeTrimmedStringList(value).filter((platform) => MANIFEST_DEFAULT_ENABLEMENT_PLATFORMS.has(platform));
}
function normalizeManifestSetupProviders(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const id = require_string_coerce.normalizeOptionalString(entry.id) ?? "";
		if (!id) continue;
		const authMethods = require_string_normalization.normalizeTrimmedStringList(entry.authMethods);
		const envVars = require_string_normalization.normalizeTrimmedStringList(entry.envVars);
		const authEvidence = normalizeManifestSetupProviderAuthEvidence(entry.authEvidence);
		normalized.push({
			id,
			...authMethods.length > 0 ? { authMethods } : {},
			...envVars.length > 0 ? { envVars } : {},
			...authEvidence ? { authEvidence } : {}
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestSetupProviderAuthEvidence(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || entry.type !== "local-file-with-env") continue;
		const credentialMarker = require_string_coerce.normalizeOptionalString(entry.credentialMarker);
		if (!credentialMarker) continue;
		const fileEnvVar = require_string_coerce.normalizeOptionalString(entry.fileEnvVar);
		const fallbackPaths = require_string_normalization.normalizeTrimmedStringList(entry.fallbackPaths);
		if (!fileEnvVar && fallbackPaths.length === 0) continue;
		const requiresAnyEnv = require_string_normalization.normalizeTrimmedStringList(entry.requiresAnyEnv);
		const requiresAllEnv = require_string_normalization.normalizeTrimmedStringList(entry.requiresAllEnv);
		const source = require_string_coerce.normalizeOptionalString(entry.source);
		normalized.push({
			type: "local-file-with-env",
			...fileEnvVar ? { fileEnvVar } : {},
			...fallbackPaths.length > 0 ? { fallbackPaths } : {},
			...requiresAnyEnv.length > 0 ? { requiresAnyEnv } : {},
			...requiresAllEnv.length > 0 ? { requiresAllEnv } : {},
			credentialMarker,
			...source ? { source } : {}
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeManifestSetup(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const providers = normalizeManifestSetupProviders(value.providers);
	const cliBackends = require_string_normalization.normalizeTrimmedStringList(value.cliBackends);
	const configMigrations = require_string_normalization.normalizeTrimmedStringList(value.configMigrations);
	const requiresRuntime = typeof value.requiresRuntime === "boolean" ? value.requiresRuntime : void 0;
	const setup = {
		...providers ? { providers } : {},
		...cliBackends.length > 0 ? { cliBackends } : {},
		...configMigrations.length > 0 ? { configMigrations } : {},
		...requiresRuntime !== void 0 ? { requiresRuntime } : {}
	};
	return Object.keys(setup).length > 0 ? setup : void 0;
}
function normalizeManifestQaRunners(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const commandName = require_string_coerce.normalizeOptionalString(entry.commandName) ?? "";
		if (!commandName) continue;
		const description = require_string_coerce.normalizeOptionalString(entry.description) ?? "";
		normalized.push({
			commandName,
			...description ? { description } : {}
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeProviderAuthChoices(value) {
	if (!Array.isArray(value)) return;
	const normalized = [];
	for (const entry of value) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
		const provider = require_string_coerce.normalizeOptionalString(entry.provider) ?? "";
		const method = require_string_coerce.normalizeOptionalString(entry.method) ?? "";
		const choiceId = require_string_coerce.normalizeOptionalString(entry.choiceId) ?? "";
		if (!provider || !method || !choiceId) continue;
		const choiceLabel = require_string_coerce.normalizeOptionalString(entry.choiceLabel) ?? "";
		const choiceHint = require_string_coerce.normalizeOptionalString(entry.choiceHint) ?? "";
		const assistantPriority = typeof entry.assistantPriority === "number" && Number.isFinite(entry.assistantPriority) ? entry.assistantPriority : void 0;
		const assistantVisibility = entry.assistantVisibility === "manual-only" || entry.assistantVisibility === "visible" ? entry.assistantVisibility : void 0;
		const deprecatedChoiceIds = require_string_normalization.normalizeTrimmedStringList(entry.deprecatedChoiceIds);
		const groupId = require_string_coerce.normalizeOptionalString(entry.groupId) ?? "";
		const groupLabel = require_string_coerce.normalizeOptionalString(entry.groupLabel) ?? "";
		const groupHint = require_string_coerce.normalizeOptionalString(entry.groupHint) ?? "";
		const onboardingFeatured = entry.onboardingFeatured === true;
		const optionKey = require_string_coerce.normalizeOptionalString(entry.optionKey) ?? "";
		const cliFlag = require_string_coerce.normalizeOptionalString(entry.cliFlag) ?? "";
		const cliOption = require_string_coerce.normalizeOptionalString(entry.cliOption) ?? "";
		const cliDescription = require_string_coerce.normalizeOptionalString(entry.cliDescription) ?? "";
		const appGuidedSecret = entry.appGuidedSecret === true;
		const appGuidedAuth = entry.appGuidedAuth === "oauth" || entry.appGuidedAuth === "device-code" ? entry.appGuidedAuth : void 0;
		const onboardingScopes = require_string_normalization.normalizeTrimmedStringList(entry.onboardingScopes).filter((scope) => scope === "text-inference" || scope === "image-generation" || scope === "music-generation");
		const appGuidedDiscovery = entry.appGuidedDiscovery === true;
		normalized.push({
			provider,
			method,
			choiceId,
			...choiceLabel ? { choiceLabel } : {},
			...choiceHint ? { choiceHint } : {},
			...assistantPriority !== void 0 ? { assistantPriority } : {},
			...assistantVisibility ? { assistantVisibility } : {},
			...deprecatedChoiceIds.length > 0 ? { deprecatedChoiceIds } : {},
			...groupId ? { groupId } : {},
			...groupLabel ? { groupLabel } : {},
			...groupHint ? { groupHint } : {},
			...onboardingFeatured ? { onboardingFeatured: true } : {},
			...appGuidedDiscovery ? { appGuidedDiscovery: true } : {},
			...optionKey ? { optionKey } : {},
			...cliFlag ? { cliFlag } : {},
			...cliOption ? { cliOption } : {},
			...cliDescription ? { cliDescription } : {},
			...appGuidedSecret ? { appGuidedSecret: true } : {},
			...appGuidedAuth ? { appGuidedAuth } : {},
			...onboardingScopes.length > 0 ? { onboardingScopes } : {}
		});
	}
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeChannelConfigs(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const normalized = Object.create(null);
	for (const [key, rawEntry] of Object.entries(value)) {
		const channelId = require_string_coerce.normalizeOptionalString(key) ?? "";
		if (!channelId || require_prototype_keys.isBlockedObjectKey(channelId) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEntry)) continue;
		const schema = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEntry.schema) ? rawEntry.schema : null;
		if (!schema) continue;
		const uiHints = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEntry.uiHints) ? rawEntry.uiHints : void 0;
		const runtime = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawEntry.runtime) && typeof rawEntry.runtime.safeParse === "function" ? rawEntry.runtime : void 0;
		const label = require_string_coerce.normalizeOptionalString(rawEntry.label) ?? "";
		const description = require_string_coerce.normalizeOptionalString(rawEntry.description) ?? "";
		const preferOver = require_string_normalization.normalizeTrimmedStringList(rawEntry.preferOver);
		const commandDefaults = normalizeManifestChannelCommandDefaults(rawEntry.commands);
		normalized[channelId] = {
			schema,
			...uiHints ? { uiHints } : {},
			...runtime ? { runtime } : {},
			...label ? { label } : {},
			...description ? { description } : {},
			...preferOver.length > 0 ? { preferOver } : {},
			...commandDefaults ? { commands: commandDefaults } : {}
		};
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function normalizeManifestChannelCommandDefaults(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const nativeCommandsAutoEnabled = typeof value.nativeCommandsAutoEnabled === "boolean" ? value.nativeCommandsAutoEnabled : void 0;
	const nativeSkillsAutoEnabled = typeof value.nativeSkillsAutoEnabled === "boolean" ? value.nativeSkillsAutoEnabled : void 0;
	return nativeCommandsAutoEnabled !== void 0 || nativeSkillsAutoEnabled !== void 0 ? {
		...nativeCommandsAutoEnabled !== void 0 ? { nativeCommandsAutoEnabled } : {},
		...nativeSkillsAutoEnabled !== void 0 ? { nativeSkillsAutoEnabled } : {}
	} : void 0;
}
function resolvePluginManifestPath(rootDir) {
	for (const filename of PLUGIN_MANIFEST_FILENAMES) {
		const candidate = node_path.default.join(rootDir, filename);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return node_path.default.join(rootDir, PLUGIN_MANIFEST_FILENAME);
}
function buildPluginManifestLoadCacheKey(params) {
	return require_plugin_cache_primitives.createPluginCacheKey([
		[
			node_path.default.resolve(params.manifestPath),
			params.rejectHardlinks,
			params.rootRealPath ?? "",
			params.stats.dev,
			params.stats.ino
		],
		params.stats.size,
		params.stats.mtimeMs,
		params.stats.ctimeMs
	]);
}
function getCachedPluginManifestLoadResult(key, stats) {
	const entry = pluginManifestLoadCache.get(key);
	if (!entry || entry.size !== stats.size || entry.mtimeMs !== stats.mtimeMs || entry.ctimeMs !== stats.ctimeMs) return;
	return entry.result;
}
function setCachedPluginManifestLoadResult(key, stats, result) {
	pluginManifestLoadCache.set(key, {
		result,
		size: stats.size,
		mtimeMs: stats.mtimeMs,
		ctimeMs: stats.ctimeMs
	});
}
function parsePluginKind(raw) {
	if (typeof raw === "string") return raw;
	if (Array.isArray(raw) && raw.length > 0 && raw.every((k) => typeof k === "string")) return raw.length === 1 ? raw[0] : raw;
}
function loadPluginManifest(rootDir, rejectHardlinks = true, rootRealPath) {
	const manifestPath = resolvePluginManifestPath(rootDir);
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: manifestPath,
		rootPath: rootDir,
		...rootRealPath !== void 0 ? { rootRealPath } : {},
		boundaryLabel: "plugin root",
		maxBytes: MAX_PLUGIN_MANIFEST_BYTES,
		rejectHardlinks
	});
	if (!opened.ok) return (0, _openclaw_fs_safe_advanced.matchRootFileOpenFailure)(opened, {
		path: () => ({
			ok: false,
			error: `plugin manifest not found: ${manifestPath}`,
			manifestPath
		}),
		fallback: (failure) => ({
			ok: false,
			error: `unsafe plugin manifest path: ${manifestPath} (${failure.reason})`,
			manifestPath
		})
	});
	const stats = opened.stat;
	const cacheKey = buildPluginManifestLoadCacheKey({
		manifestPath,
		rejectHardlinks,
		...rootRealPath !== void 0 ? { rootRealPath } : {},
		stats
	});
	const cached = getCachedPluginManifestLoadResult(cacheKey, stats);
	if (cached) {
		node_fs.default.closeSync(opened.fd);
		return cached;
	}
	const cacheResult = (result) => {
		setCachedPluginManifestLoadResult(cacheKey, stats, result);
		return result;
	};
	let raw;
	try {
		raw = require_parse_json_compat.parseJsonWithJson5Fallback(node_fs.default.readFileSync(opened.fd, "utf-8"));
	} catch (err) {
		return cacheResult({
			ok: false,
			error: `failed to parse plugin manifest: ${String(err)}`,
			manifestPath
		});
	} finally {
		node_fs.default.closeSync(opened.fd);
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return cacheResult({
		ok: false,
		error: "plugin manifest must be an object",
		manifestPath
	});
	const id = require_string_coerce.normalizeOptionalString(raw.id) ?? "";
	if (!id) return cacheResult({
		ok: false,
		error: "plugin manifest requires id",
		manifestPath
	});
	if (CORE_RESERVED_PLUGIN_IDS.has(id)) return cacheResult({
		ok: false,
		error: `plugin manifest id "${id}" is reserved by Operator core`,
		manifestPath
	});
	const configSchema = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.configSchema) ? raw.configSchema : null;
	if (!configSchema) return cacheResult({
		ok: false,
		error: "plugin manifest requires configSchema",
		manifestPath
	});
	const requiresPlugins = require_string_normalization.normalizeTrimmedStringList(raw.requiresPlugins);
	const kind = parsePluginKind(raw.kind);
	const enabledByDefault = raw.enabledByDefault === true;
	const enabledByDefaultOnPlatforms = normalizeManifestDefaultPlatforms(raw.enabledByDefaultOnPlatforms);
	const legacyPluginIds = require_string_normalization.normalizeTrimmedStringList(raw.legacyPluginIds);
	const autoEnableWhenConfiguredProviders = require_string_normalization.normalizeTrimmedStringList(raw.autoEnableWhenConfiguredProviders);
	const name = require_string_coerce.normalizeOptionalString(raw.name);
	const description = require_string_coerce.normalizeOptionalString(raw.description);
	const catalog = normalizeManifestCatalog(raw.catalog);
	const icon = require_string_coerce.normalizeOptionalString(raw.icon);
	const version = require_string_coerce.normalizeOptionalString(raw.version);
	const channels = require_string_normalization.normalizeTrimmedStringList(raw.channels);
	const providers = require_string_normalization.normalizeTrimmedStringList(raw.providers);
	const cliBackends = require_string_normalization.normalizeTrimmedStringList(raw.cliBackends);
	const providerCatalogEntry = require_string_coerce.normalizeOptionalString(raw.providerCatalogEntry);
	const modelSupport = normalizeManifestModelSupport(raw.modelSupport);
	const modelCatalog = (0, _gabrielvfonseca_model_catalog_core_model_catalog_normalize.normalizeModelCatalog)(raw.modelCatalog, { ownedProviders: /* @__PURE__ */ new Set([...providers, ...cliBackends]) });
	const modelPricing = normalizeManifestModelPricing(raw.modelPricing, { ownedProviders: new Set(providers) });
	const modelIdNormalization = normalizeManifestModelIdNormalization(raw.modelIdNormalization, { ownedProviders: new Set(providers) });
	const providerEndpoints = normalizeManifestProviderEndpoints(raw.providerEndpoints);
	const providerRequest = normalizeManifestProviderRequest(raw.providerRequest, { ownedProviders: new Set(providers) });
	const secretProviderIntegrations = normalizeManifestSecretProviderIntegrations(raw.secretProviderIntegrations);
	const syntheticAuthRefs = require_string_normalization.normalizeTrimmedStringList(raw.syntheticAuthRefs);
	const nonSecretAuthMarkers = require_string_normalization.normalizeTrimmedStringList(raw.nonSecretAuthMarkers);
	const commandAliases = normalizeManifestCommandAliases(raw.commandAliases);
	const providerAuthEnvVars = normalizeStringListRecord(raw.providerAuthEnvVars);
	const providerUsageAuthEnvVars = normalizeStringListRecord(raw.providerUsageAuthEnvVars);
	const providerAuthAliases = normalizeStringRecord(raw.providerAuthAliases);
	const channelEnvVars = normalizeStringListRecord(raw.channelEnvVars);
	const providerAuthChoices = normalizeProviderAuthChoices(raw.providerAuthChoices);
	const activation = normalizeManifestActivation(raw.activation);
	const setup = normalizeManifestSetup(raw.setup);
	const qaRunners = normalizeManifestQaRunners(raw.qaRunners);
	const skills = require_string_normalization.normalizeTrimmedStringList(raw.skills);
	const contracts = normalizeManifestContracts(raw.contracts);
	const mediaUnderstandingProviderMetadata = normalizeMediaUnderstandingProviderMetadata(raw.mediaUnderstandingProviderMetadata);
	const imageGenerationProviderMetadata = normalizeCapabilityProviderMetadata(raw.imageGenerationProviderMetadata);
	const videoGenerationProviderMetadata = normalizeCapabilityProviderMetadata(raw.videoGenerationProviderMetadata);
	const musicGenerationProviderMetadata = normalizeCapabilityProviderMetadata(raw.musicGenerationProviderMetadata);
	const toolMetadata = normalizePluginToolMetadata(raw.toolMetadata);
	const configContracts = normalizeManifestConfigContracts(raw.configContracts);
	const channelConfigs = normalizeChannelConfigs(raw.channelConfigs);
	let uiHints;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.uiHints)) uiHints = raw.uiHints;
	return cacheResult({
		ok: true,
		manifest: {
			id,
			configSchema,
			...requiresPlugins.length > 0 ? { requiresPlugins } : {},
			...enabledByDefault ? { enabledByDefault } : {},
			...enabledByDefaultOnPlatforms.length > 0 ? { enabledByDefaultOnPlatforms } : {},
			...legacyPluginIds.length > 0 ? { legacyPluginIds } : {},
			...autoEnableWhenConfiguredProviders.length > 0 ? { autoEnableWhenConfiguredProviders } : {},
			kind,
			channels,
			providers,
			providerCatalogEntry,
			modelSupport,
			modelCatalog,
			modelPricing,
			modelIdNormalization,
			providerEndpoints,
			providerRequest,
			secretProviderIntegrations,
			cliBackends,
			syntheticAuthRefs,
			nonSecretAuthMarkers,
			commandAliases,
			providerAuthEnvVars,
			providerUsageAuthEnvVars,
			providerAuthAliases,
			channelEnvVars,
			providerAuthChoices,
			activation,
			setup,
			qaRunners,
			skills,
			name,
			description,
			catalog,
			icon,
			version,
			uiHints,
			contracts,
			mediaUnderstandingProviderMetadata,
			imageGenerationProviderMetadata,
			videoGenerationProviderMetadata,
			musicGenerationProviderMetadata,
			toolMetadata,
			configContracts,
			channelConfigs
		},
		manifestPath
	});
}
const DEFAULT_PLUGIN_ENTRY_CANDIDATES = [
	"index.ts",
	"index.js",
	"index.mjs",
	"index.cjs"
];
function getPackageManifestMetadata(manifest) {
	if (!manifest) return;
	return manifest[require_legacy_names.MANIFEST_KEY];
}
function resolvePackageExtensionEntries(manifest) {
	const rawOperator = manifest?.[require_legacy_names.MANIFEST_KEY];
	if (rawOperator === void 0 || rawOperator === null) return {
		status: "missing",
		entries: []
	};
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawOperator)) return {
		status: "invalid",
		entries: [],
		error: "package.json openclaw must be an object"
	};
	const raw = rawOperator.extensions;
	if (raw === void 0 || raw === null) return {
		status: "missing",
		entries: []
	};
	if (!Array.isArray(raw)) return {
		status: "invalid",
		entries: [],
		error: "package.json operator.extensions must be an array"
	};
	const entries = [];
	for (const [index, entry] of raw.entries()) {
		const normalized = require_string_coerce.normalizeOptionalString(entry);
		if (!normalized) return {
			status: "invalid",
			entries: [],
			error: `package.json operator.extensions[${index}] must be a non-empty string`
		};
		entries.push(normalized);
	}
	if (entries.length === 0) return {
		status: "empty",
		entries: []
	};
	return {
		status: "ok",
		entries
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_PLUGIN_ENTRY_CANDIDATES", {
	enumerable: true,
	get: function() {
		return DEFAULT_PLUGIN_ENTRY_CANDIDATES;
	}
});
Object.defineProperty(exports, "PLUGIN_MANIFEST_FILENAME", {
	enumerable: true,
	get: function() {
		return PLUGIN_MANIFEST_FILENAME;
	}
});
Object.defineProperty(exports, "getPackageManifestMetadata", {
	enumerable: true,
	get: function() {
		return getPackageManifestMetadata;
	}
});
Object.defineProperty(exports, "loadPluginManifest", {
	enumerable: true,
	get: function() {
		return loadPluginManifest;
	}
});
Object.defineProperty(exports, "normalizeManifestActivation", {
	enumerable: true,
	get: function() {
		return normalizeManifestActivation;
	}
});
Object.defineProperty(exports, "normalizeManifestChannelCommandDefaults", {
	enumerable: true,
	get: function() {
		return normalizeManifestChannelCommandDefaults;
	}
});
Object.defineProperty(exports, "resolveManifestCommandAliasOwnerInRegistry", {
	enumerable: true,
	get: function() {
		return resolveManifestCommandAliasOwnerInRegistry;
	}
});
Object.defineProperty(exports, "resolvePackageExtensionEntries", {
	enumerable: true,
	get: function() {
		return resolvePackageExtensionEntries;
	}
});
