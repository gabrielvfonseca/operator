const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/models/provider-aliases.ts
/** Provider alias canonicalization for model catalog rows. */
const sourcePeerModelCatalogCache = /* @__PURE__ */ new Map();
function listManifestPlugins(params) {
	return params.metadataSnapshot?.manifestRegistry.plugins ?? require_manifest_registry.loadPluginManifestRegistry({ config: params.cfg }).plugins;
}
function resolveSourcePeerPluginRoot(plugin) {
	if (plugin.origin !== "bundled") return;
	const parts = node_path.default.resolve(plugin.rootDir).split(node_path.default.sep);
	const pluginDirName = parts.at(-1);
	const extensionsDirName = parts.at(-2);
	const buildDirName = parts.at(-3);
	if (pluginDirName !== plugin.id || extensionsDirName !== "extensions" || buildDirName !== "dist" && buildDirName !== "dist-runtime") return;
	const packageRoot = parts.slice(0, -3).join(node_path.default.sep) || node_path.default.sep;
	const sourceRoot = node_path.default.join(packageRoot, "extensions", plugin.id);
	return node_fs.default.existsSync(node_path.default.join(sourceRoot, "operator.plugin.json")) ? sourceRoot : void 0;
}
function loadSourcePeerModelCatalog(plugin) {
	const cacheKey = node_path.default.resolve(plugin.rootDir);
	const cached = sourcePeerModelCatalogCache.get(cacheKey);
	if (cached !== void 0) return cached ?? void 0;
	const sourceRoot = resolveSourcePeerPluginRoot(plugin);
	if (!sourceRoot) {
		sourcePeerModelCatalogCache.set(cacheKey, null);
		return;
	}
	const loaded = require_manifest.loadPluginManifest(sourceRoot, false);
	if (!loaded.ok || loaded.manifest.id !== plugin.id) {
		sourcePeerModelCatalogCache.set(cacheKey, null);
		return;
	}
	const modelCatalog = loaded.manifest.modelCatalog ?? null;
	sourcePeerModelCatalogCache.set(cacheKey, modelCatalog);
	return modelCatalog ?? void 0;
}
function hasModelCatalogAliases(modelCatalog) {
	return Object.keys(modelCatalog?.aliases ?? {}).length > 0;
}
function collectModelCatalogAliases(aliases, modelCatalog) {
	for (const [aliasProvider, target] of Object.entries(modelCatalog?.aliases ?? {})) {
		const alias = require_model_selection_normalize.normalizeProviderId(aliasProvider);
		const provider = require_model_selection_normalize.normalizeProviderId(target.provider);
		if (alias && provider) aliases.set(alias, provider);
	}
}
function buildProviderAliasMap(params) {
	const aliases = /* @__PURE__ */ new Map();
	for (const plugin of listManifestPlugins(params)) {
		collectModelCatalogAliases(aliases, plugin.modelCatalog);
		if (!hasModelCatalogAliases(plugin.modelCatalog) && plugin.origin === "bundled") collectModelCatalogAliases(aliases, loadSourcePeerModelCatalog(plugin));
	}
	return aliases;
}
/** Builds provider/ref canonicalizers from manifest model-catalog aliases. */
function createModelCatalogProviderAliasCanonicalizer(params) {
	const aliases = buildProviderAliasMap(params);
	const provider = (providerId) => {
		const normalizedProvider = require_model_selection_normalize.normalizeProviderId(providerId);
		return aliases.get(normalizedProvider) ?? normalizedProvider;
	};
	return {
		provider,
		ref: (ref) => {
			const canonicalProvider = provider(ref.provider);
			return canonicalProvider === ref.provider ? ref : {
				...ref,
				provider: canonicalProvider
			};
		}
	};
}
/** Canonicalizes the provider field on a model reference. */
function canonicalizeModelCatalogProviderRef(ref, params) {
	return createModelCatalogProviderAliasCanonicalizer(params).ref(ref);
}
//#endregion
//#region src/commands/models/shared.ts
/** Shared helpers for model commands that read or mutate model config. */
var shared_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DEFAULT_MODEL: () => require_defaults.DEFAULT_MODEL,
	DEFAULT_PROVIDER: () => require_defaults.DEFAULT_PROVIDER,
	applyDefaultModelPrimaryUpdate: () => applyDefaultModelPrimaryUpdate,
	ensureFlagCompatibility: () => ensureFlagCompatibility,
	formatMs: () => formatMs,
	formatTokenK: () => formatTokenK,
	loadValidConfigOrThrow: () => loadValidConfigOrThrow,
	mergePrimaryFallbackConfig: () => mergePrimaryFallbackConfig,
	modelKey: () => require_model_selection_normalize.modelKey,
	resolveKnownAgentId: () => resolveKnownAgentId,
	resolveModelKeysFromEntries: () => resolveModelKeysFromEntries,
	resolveModelTarget: () => resolveModelTarget,
	resolveModelsTargetAgent: () => resolveModelsTargetAgent,
	updateConfig: () => updateConfig,
	upsertCanonicalModelConfigEntry: () => upsertCanonicalModelConfigEntry
});
const ensureFlagCompatibility = (opts) => {
	if (opts.json && opts.plain) throw new Error("Choose either --json or --plain, not both.");
};
/** Formats token counts as compact K-suffixed labels. */
const formatTokenK = (value) => {
	if (!value || !Number.isFinite(value)) return "-";
	if (value < 1e3) return `${Math.round(value)}`;
	return `${Math.round(value / 1e3)}k`;
};
/** Formats millisecond durations for model command output. */
const formatMs = (value) => {
	if (value === null || value === void 0) return "-";
	if (!Number.isFinite(value)) return "-";
	if (value < 1e3) return `${Math.round(value)}ms`;
	return `${Math.round(value / 100) / 10}s`;
};
/** Loads config from disk and throws a formatted error when validation fails. */
async function loadValidConfigOrThrow() {
	const snapshot = await require_io.readConfigFileSnapshot();
	if (!snapshot.valid) {
		const issues = require_io.formatConfigIssueLines(snapshot.issues, "-").join("\n");
		throw new Error(`Invalid config at ${snapshot.path}\n${issues}`);
	}
	return snapshot.runtimeConfig ?? snapshot.config;
}
/** Reads source config, applies a mutator, and writes only the source-form config. */
async function updateConfig(mutator) {
	const snapshot = await require_io.readConfigFileSnapshot();
	if (!snapshot.valid) {
		const issues = require_io.formatConfigIssueLines(snapshot.issues, "-").join("\n");
		throw new Error(`Invalid config at ${snapshot.path}\n${issues}`);
	}
	const next = mutator(structuredClone(snapshot.sourceConfig ?? snapshot.config), { runtimeConfig: structuredClone(snapshot.runtimeConfig ?? snapshot.config) });
	await require_config.replaceConfigFile({
		nextConfig: next,
		baseHash: snapshot.hash
	});
	return next;
}
/** Resolves a CLI model reference through aliases and catalog provider aliases. */
function resolveModelTarget(params) {
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	const resolved = require_model_selection_shared.resolveModelRefFromString({
		raw: params.raw,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		aliasIndex
	});
	if (!resolved) throw new Error(`Invalid model reference: ${params.raw}`);
	return canonicalizeModelCatalogProviderRef(resolved.ref, { cfg: params.cfg });
}
function resolveAuthoredModelAliasTarget(params) {
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	const resolved = require_model_selection_shared.resolveModelRefFromString({
		raw: params.raw,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		aliasIndex
	});
	return resolved?.alias ? resolved.ref : void 0;
}
/** Resolves model reference strings to canonical provider/model keys. */
function resolveModelKeysFromEntries(params) {
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	return params.entries.map((entry) => require_model_selection_shared.resolveModelRefFromString({
		raw: entry,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		aliasIndex
	})).filter((entry) => Boolean(entry)).map((entry) => require_model_selection_normalize.modelKey(entry.ref.provider, entry.ref.model));
}
/** Validates an optional agent id against configured agents. */
function resolveKnownAgentId(params) {
	const raw = params.rawAgentId?.trim();
	if (!raw) return;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(raw);
	if (!require_agent_scope_config.listAgentIds(params.cfg).includes(agentId)) throw new Error(`Unknown agent id "${raw}". Use "${require_command_format.formatCliCommand("operator agents list")}" to see configured agents.`);
	return agentId;
}
/** Resolves the selected model-command agent and its profile directory. */
function resolveModelsTargetAgent(cfg, rawAgentId) {
	const agentId = resolveKnownAgentId({
		cfg,
		rawAgentId
	}) ?? require_agent_scope_config.resolveDefaultAgentId(cfg);
	return {
		agentId,
		agentDir: require_agent_scope_config.resolveAgentDir(cfg, agentId)
	};
}
/** Upserts the canonical model entry and folds legacy key metadata into it. */
function upsertCanonicalModelConfigEntry(models, params) {
	const key = require_model_selection_normalize.modelKey(params.provider, params.model);
	const legacyKeys = [require_model_selection_normalize.legacyModelKey(params.provider, params.model), `${params.provider}/${key}`].filter((legacyKey) => typeof legacyKey === "string" && legacyKey.length > 0 && legacyKey !== key);
	let legacyEntry;
	for (const legacyKey of legacyKeys) {
		const entry = models[legacyKey];
		if (!entry) continue;
		Object.assign(legacyEntry ??= {}, entry);
		legacyEntry.params = {
			...legacyEntry.params,
			...entry.params
		};
	}
	if (legacyEntry) models[key] = {
		...legacyEntry,
		...models[key],
		params: {
			...legacyEntry.params,
			...models[key]?.params
		}
	};
	else if (!models[key]) models[key] = {};
	for (const legacyKey of legacyKeys) delete models[legacyKey];
	return key;
}
/** Merges primary/fallback patches while normalizing refs for config storage. */
function mergePrimaryFallbackConfig(existing, patch) {
	const next = { ...existing && typeof existing === "object" ? existing : void 0 };
	if (patch.primary !== void 0) next.primary = require_model_input.normalizeAgentModelRefForConfig(patch.primary);
	if (patch.fallbacks !== void 0) next.fallbacks = patch.fallbacks.map((fallback) => require_model_input.normalizeAgentModelRefForConfig(fallback));
	else if (next.fallbacks !== void 0) next.fallbacks = next.fallbacks.map((fallback) => require_model_input.normalizeAgentModelRefForConfig(fallback));
	return next;
}
/** Applies a default text/image primary-model update and ensures the model entry exists. */
function applyDefaultModelPrimaryUpdate(params) {
	const resolved = params.resolveCfg && params.resolveCfg !== params.cfg ? resolveAuthoredModelAliasTarget({
		raw: params.modelRaw,
		cfg: params.cfg
	}) ?? resolveModelTarget({
		raw: params.modelRaw,
		cfg: params.resolveCfg
	}) : resolveModelTarget({
		raw: params.modelRaw,
		cfg: params.cfg
	});
	const nextModels = { ...params.cfg.agents?.defaults?.models };
	const key = upsertCanonicalModelConfigEntry(nextModels, resolved);
	const defaults = params.cfg.agents?.defaults ?? {};
	const existing = require_model_input.toAgentModelListLike(defaults[params.field]);
	return {
		...params.cfg,
		agents: {
			...params.cfg.agents,
			defaults: {
				...defaults,
				[params.field]: mergePrimaryFallbackConfig(existing, { primary: key }),
				models: nextModels
			}
		}
	};
}
/**
* Model key format: "provider/model"
*
* The model key is displayed in `/model status` and used to reference models.
* When using `/model <key>`, use the exact format shown (e.g., "openrouter/moonshotai/kimi-k2").
*
* For providers with hierarchical model IDs (e.g., OpenRouter), the model ID may include
* sub-providers (e.g., "moonshotai/kimi-k2"), resulting in a key like "openrouter/moonshotai/kimi-k2".
*/
//#endregion
Object.defineProperty(exports, "formatTokenK", {
	enumerable: true,
	get: function() {
		return formatTokenK;
	}
});
Object.defineProperty(exports, "loadValidConfigOrThrow", {
	enumerable: true,
	get: function() {
		return loadValidConfigOrThrow;
	}
});
Object.defineProperty(exports, "resolveKnownAgentId", {
	enumerable: true,
	get: function() {
		return resolveKnownAgentId;
	}
});
Object.defineProperty(exports, "shared_exports", {
	enumerable: true,
	get: function() {
		return shared_exports;
	}
});
Object.defineProperty(exports, "updateConfig", {
	enumerable: true,
	get: function() {
		return updateConfig;
	}
});
