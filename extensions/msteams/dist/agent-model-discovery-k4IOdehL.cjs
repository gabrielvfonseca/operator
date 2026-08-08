const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_sessions = require("./sessions-Bcpn-MAP.cjs");
const require_model_discovery_context = require("./model-discovery-context-BQgsMJ_3.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_synthetic_auth_runtime = require("./synthetic-auth.runtime-DB9g0UmZ.cjs");
const require_openai_completions_compat = require("./openai-completions-compat-plxocpXB.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
require("@gabrielvfonseca/ai/internal/openai");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/plugins/provider-model-compat.ts
function extractModelCompat(modelOrCompat) {
	if (!modelOrCompat || typeof modelOrCompat !== "object") return;
	if ("compat" in modelOrCompat) {
		const compat = modelOrCompat.compat;
		return compat && typeof compat === "object" ? compat : void 0;
	}
	return modelOrCompat;
}
function resolveToolCallArgumentsEncoding(modelOrCompat) {
	return extractModelCompat(modelOrCompat)?.toolCallArgumentsEncoding;
}
function isOpenAiCompletionsModel(model) {
	return model.api === "openai-completions";
}
function isAnthropicMessagesModel(model) {
	return model.api === "anthropic-messages";
}
function normalizeAnthropicBaseUrl(baseUrl) {
	return baseUrl.replace(/\/v1\/?$/, "");
}
function normalizeModelCompat(model) {
	const baseUrl = model.baseUrl ?? "";
	if (isAnthropicMessagesModel(model) && baseUrl) {
		const normalized = normalizeAnthropicBaseUrl(baseUrl);
		if (normalized !== baseUrl) return {
			...model,
			baseUrl: normalized
		};
	}
	if (!isOpenAiCompletionsModel(model)) return model;
	const compat = model.compat ?? void 0;
	const detectedCompatDefaults = baseUrl ? require_openai_completions_compat.detectOpenAICompletionsCompat(model).defaults : void 0;
	if (!Boolean(detectedCompatDefaults && (!detectedCompatDefaults.supportsDeveloperRole || !detectedCompatDefaults.supportsUsageInStreaming || !detectedCompatDefaults.supportsStrictMode))) return model;
	const forcedDeveloperRole = compat?.supportsDeveloperRole === true;
	const hasStreamingUsageOverride = compat?.supportsUsageInStreaming !== void 0;
	const targetStrictMode = compat?.supportsStrictMode ?? detectedCompatDefaults?.supportsStrictMode;
	if (compat?.supportsDeveloperRole !== void 0 && hasStreamingUsageOverride && compat?.supportsStrictMode !== void 0) return model;
	return {
		...model,
		compat: compat ? {
			...compat,
			supportsDeveloperRole: forcedDeveloperRole || false,
			...hasStreamingUsageOverride ? {} : { supportsUsageInStreaming: detectedCompatDefaults?.supportsUsageInStreaming ?? false },
			supportsStrictMode: targetStrictMode
		} : {
			supportsDeveloperRole: false,
			supportsUsageInStreaming: detectedCompatDefaults?.supportsUsageInStreaming ?? false,
			supportsStrictMode: detectedCompatDefaults?.supportsStrictMode ?? false
		}
	};
}
//#endregion
//#region src/agents/agent-auth-credentials.ts
/** Converts auth-profile credentials into agent runtime credential maps. */
const AGENT_SECRET_REF_CONFIGURED_MARKER = "operator-secret-ref-configured";
function hasConfiguredSecretRef(value) {
	return require_types_secrets.coerceSecretRef(value) !== null;
}
function secretRefPlaceholder(options) {
	if (options?.includeSecretRefPlaceholders === true) return {
		type: "api_key",
		key: AGENT_SECRET_REF_CONFIGURED_MARKER
	};
	return null;
}
function convertAuthProfileCredentialToAgent(cred, options) {
	if (cred.type === "api_key") {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cred.key) ?? "";
		if (!key) return hasConfiguredSecretRef(cred.keyRef) ? secretRefPlaceholder(options) : null;
		return {
			type: "api_key",
			key
		};
	}
	if (cred.type === "token") {
		if (cred.expires !== void 0) {
			const expires = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(cred.expires);
			if (expires === void 0 || Date.now() >= expires) return null;
		}
		const token = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cred.token) ?? "";
		if (!token) return hasConfiguredSecretRef(cred.tokenRef) ? secretRefPlaceholder(options) : null;
		return {
			type: "api_key",
			key: token
		};
	}
	if (cred.type === "oauth") {
		const access = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cred.access) ?? "";
		const refresh = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cred.refresh) ?? "";
		const expires = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(cred.expires);
		if (!access || !refresh || expires === void 0 || expires <= 0) return null;
		return {
			type: "oauth",
			access,
			refresh,
			expires
		};
	}
	return null;
}
/** Build one credential per normalized provider from an auth profile store. */
function resolveAgentCredentialMapFromStore(store, options) {
	const credentials = {};
	for (const credential of Object.values(store.profiles)) {
		const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(credential.provider ?? "");
		if (!provider || credentials[provider]) continue;
		const converted = convertAuthProfileCredentialToAgent(credential, options);
		if (converted) credentials[provider] = converted;
	}
	return credentials;
}
//#endregion
//#region src/agents/agent-auth-discovery-core.ts
/** Adds provider credentials resolvable from env/config without mutating existing credentials. */
function addEnvBackedAgentCredentials(credentials, options = {}) {
	const env = options.env ?? process.env;
	const { aliasMap, envCandidateMap: candidateMap, authEvidenceMap } = require_model_auth_markers.resolveProviderEnvAuthLookupMaps({
		config: options.config,
		workspaceDir: options.workspaceDir,
		env
	});
	const next = { ...credentials };
	for (const provider of require_model_auth_markers.listProviderEnvAuthLookupKeys({
		envCandidateMap: candidateMap,
		authEvidenceMap
	})) {
		if (next[provider]) continue;
		const resolved = require_model_auth_env.resolveEnvApiKey(provider, env, {
			config: options.config,
			workspaceDir: options.workspaceDir,
			aliasMap,
			candidateMap,
			authEvidenceMap
		});
		if (!resolved?.apiKey) continue;
		next[provider] = {
			type: "api_key",
			key: resolved.apiKey
		};
	}
	return next;
}
//#endregion
//#region src/agents/agent-auth-discovery.ts
/** Discovers agent runtime credentials from auth profiles, env, and synthetic providers. */
/** Resolves agent credentials from auth profiles, env, and synthetic auth hooks. */
function resolveAgentCredentialsForDiscovery(agentDir, options) {
	const storeOptions = {
		allowKeychainPrompt: false,
		...options?.config ? { config: options.config } : {},
		...options?.externalCli ? { externalCli: options.externalCli } : {}
	};
	const credentials = addEnvBackedAgentCredentials(resolveAgentCredentialMapFromStore(options?.skipExternalAuthProfiles === true ? options.readOnly === true ? require_store.loadAuthProfileStoreWithoutExternalProfiles(agentDir) : require_store.ensureAuthProfileStoreWithoutExternalProfiles(agentDir, { allowKeychainPrompt: false }) : options?.readOnly === true ? options.externalCli || options.config ? require_store.loadAuthProfileStoreForRuntime(agentDir, {
		readOnly: true,
		...storeOptions
	}) : require_store.loadAuthProfileStoreForSecretsRuntime(agentDir) : require_store.ensureAuthProfileStore(agentDir, storeOptions), { includeSecretRefPlaceholders: options?.readOnly === true }), {
		config: options?.config,
		workspaceDir: options?.workspaceDir,
		env: options?.env
	});
	const syntheticAuthProviderRefs = options?.syntheticAuthProviderRefs ?? require_synthetic_auth_runtime.resolveRuntimeSyntheticAuthProviderRefs();
	for (const provider of syntheticAuthProviderRefs) {
		if (credentials[provider]) continue;
		const apiKey = require_provider_runtime.resolveProviderSyntheticAuthWithPlugin({
			provider,
			context: {
				config: void 0,
				provider,
				providerConfig: void 0
			}
		})?.apiKey?.trim();
		if (!apiKey) continue;
		credentials[provider] = {
			type: "api_key",
			key: apiKey
		};
	}
	return credentials;
}
//#endregion
//#region src/agents/agent-model-discovery.ts
/** Discovers agent models and auth storage with provider/plugin normalization hooks. */
var agent_model_discovery_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	addEnvBackedAgentCredentials: () => addEnvBackedAgentCredentials,
	discoverAuthStorage: () => discoverAuthStorage,
	discoverModels: () => discoverModels,
	normalizeDiscoveredAgentModel: () => normalizeDiscoveredAgentModel,
	resolveAgentCredentialsForDiscovery: () => resolveAgentCredentialsForDiscovery
});
/** Applies plugin model normalization and transport hooks to discovered agent models. */
function normalizeDiscoveredAgentModel(value, agentDir, options) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return value;
	if (typeof value.id !== "string" || typeof value.name !== "string" || typeof value.provider !== "string") return value;
	const model = value;
	const runtimeContext = {
		...options?.config !== void 0 ? { config: options.config } : {},
		...options?.workspaceDir !== void 0 ? { workspaceDir: options.workspaceDir } : {}
	};
	const pluginNormalized = require_provider_runtime.normalizeProviderResolvedModelWithPlugin({
		provider: model.provider,
		modelId: model.id,
		...runtimeContext,
		context: {
			provider: model.provider,
			modelId: model.id,
			model,
			agentDir
		}
	}) ?? model;
	const transportNormalized = require_provider_runtime.applyProviderResolvedTransportWithPlugin({
		provider: model.provider,
		modelId: model.id,
		...runtimeContext,
		context: {
			provider: model.provider,
			modelId: model.id,
			model: pluginNormalized,
			agentDir
		}
	}) ?? pluginNormalized;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(transportNormalized) || typeof transportNormalized.id !== "string" || typeof transportNormalized.name !== "string" || typeof transportNormalized.provider !== "string" || typeof transportNormalized.api !== "string") return value;
	return normalizeModelCompat(transportNormalized);
}
function createOperatorModelRegistry(authStorage, modelsJsonPath, agentDir, options) {
	const pluginMetadataSnapshot = require_model_discovery_context.resolveModelPluginMetadataSnapshot({
		...options?.config ? { config: options.config } : {},
		...options?.pluginMetadataSnapshot ? { pluginMetadataSnapshot: options.pluginMetadataSnapshot } : {},
		...options?.workspaceDir ? { workspaceDir: options.workspaceDir } : {},
		allowWorkspaceScopedCurrent: options?.workspaceDir === void 0,
		useRuntimeConfig: options?.config === void 0
	});
	const registryOptions = pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {};
	const registry = require_sessions.ModelRegistry.create(authStorage, modelsJsonPath, registryOptions);
	const getAll = registry.getAll.bind(registry);
	const getAvailable = registry.getAvailable.bind(registry);
	const find = registry.find.bind(registry);
	const refresh = registry.refresh.bind(registry);
	const providerFilter = options?.providerFilter ? (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(options.providerFilter) : "";
	const matchesProviderFilter = (entry) => !providerFilter || (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) === providerFilter;
	const shouldNormalize = options?.normalizeModels !== false;
	const findCache = /* @__PURE__ */ new Map();
	const normalizeEntry = (entry) => shouldNormalize ? normalizeDiscoveredAgentModel(entry, agentDir, options) : entry;
	registry.getAll = () => {
		const entries = getAll().filter((entry) => matchesProviderFilter(entry));
		return shouldNormalize ? entries.map(normalizeEntry) : entries;
	};
	registry.getAvailable = () => {
		const entries = getAvailable().filter((entry) => matchesProviderFilter(entry));
		return shouldNormalize ? entries.map(normalizeEntry) : entries;
	};
	registry.find = (provider, modelId) => {
		const key = `${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider)}\0${modelId}`;
		if (findCache.has(key)) return findCache.get(key);
		const fallbackEntry = find(provider, modelId);
		const resolved = fallbackEntry ? normalizeEntry(fallbackEntry) : void 0;
		findCache.set(key, resolved);
		return resolved;
	};
	registry.refresh = () => {
		findCache.clear();
		return refresh();
	};
	return registry;
}
/** Creates auth storage for model discovery from stored and env-backed credentials. */
/** Builds auth storage for model discovery without prompting for secrets. */
function discoverAuthStorage(agentDir, options) {
	const credentials = options?.skipCredentials === true ? {} : resolveAgentCredentialsForDiscovery(agentDir, options);
	return require_sessions.AuthStorage.inMemory(credentials);
}
/** Creates the model registry used by agent model discovery. */
/** Creates a model registry for one agent directory, optionally filtered and plugin-normalized. */
function discoverModels(authStorage, agentDir, options) {
	return createOperatorModelRegistry(authStorage, node_path.default.join(agentDir, "models.json"), agentDir, options);
}
//#endregion
Object.defineProperty(exports, "agent_model_discovery_exports", {
	enumerable: true,
	get: function() {
		return agent_model_discovery_exports;
	}
});
Object.defineProperty(exports, "discoverAuthStorage", {
	enumerable: true,
	get: function() {
		return discoverAuthStorage;
	}
});
Object.defineProperty(exports, "discoverModels", {
	enumerable: true,
	get: function() {
		return discoverModels;
	}
});
Object.defineProperty(exports, "extractModelCompat", {
	enumerable: true,
	get: function() {
		return extractModelCompat;
	}
});
Object.defineProperty(exports, "normalizeModelCompat", {
	enumerable: true,
	get: function() {
		return normalizeModelCompat;
	}
});
Object.defineProperty(exports, "resolveToolCallArgumentsEncoding", {
	enumerable: true,
	get: function() {
		return resolveToolCallArgumentsEncoding;
	}
});
