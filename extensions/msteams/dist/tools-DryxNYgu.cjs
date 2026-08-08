const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_glob_pattern = require("./glob-pattern-DmJJnFQo.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_agent_tool_result_middleware = require("./agent-tool-result-middleware-Do5BE8dK.cjs");
const require_gateway_request_scope = require("./gateway-request-scope-Dy7CSqxn.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-C-xn-esF.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
const require_standalone_runtime_registry_loader = require("./standalone-runtime-registry-loader-2s9-FIR1.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/compat/conversation-read-tools.ts
const HOST_RESTRICTED_CONVERSATION_READ_TOOLS = /* @__PURE__ */ new Set(["feishu:feishu_chat"]);
function normalizeContractName(value) {
	return value.trim().toLowerCase();
}
function isHostRestrictedConversationReadTool(params) {
	return HOST_RESTRICTED_CONVERSATION_READ_TOOLS.has(`${normalizeContractName(params.pluginId)}:${normalizeContractName(params.toolName)}`);
}
function registrationIncludesHostRestrictedConversationReadTool(entry) {
	return [...entry.names, ...entry.declaredNames ?? []].some((toolName) => isHostRestrictedConversationReadTool({
		pluginId: entry.pluginId,
		toolName
	}));
}
function isBundledConversationReadToolRegistration(params) {
	return params.entry.origin === "bundled" && params.manifestPlugin?.origin === "bundled";
}
//#endregion
//#region src/plugins/manifest-tool-availability.ts
function readPath(root, path) {
	if (!path?.trim()) return root;
	let current = root;
	for (const segment of path.split(".")) {
		const key = segment.trim();
		if (!key) return;
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current) || !(key in current)) return;
		current = current[key];
	}
	return current;
}
function readStringAtPath(root, path) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(readPath(root, path));
}
function readEffectiveConfigs(params) {
	const root = readPath(params.config, params.rootPath);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(root)) return [];
	const overlay = readPath(root, params.overlayPath);
	const baseConfig = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(overlay) ? {
		...root,
		...overlay
	} : root;
	if (params.overlayMapPath?.trim()) {
		const overlayMap = readPath(baseConfig, params.overlayMapPath);
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(overlayMap)) return [];
		return Object.entries(overlayMap).toSorted(([left], [right]) => left.localeCompare(right)).flatMap(([, mapOverlay]) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(mapOverlay) ? [{
			...baseConfig,
			...mapOverlay
		}] : []);
	}
	return [baseConfig];
}
function hasConfiguredSecretRefInConfigPath(params) {
	const providerConfig = params.config?.secrets?.providers?.[params.ref.provider];
	if (params.ref.source !== "env") return Boolean(providerConfig && providerConfig.source === params.ref.source);
	if (!providerConfig) return params.ref.provider === require_ref_contract.resolveDefaultSecretProviderAlias(params.config ?? {}, "env");
	if (providerConfig.source !== "env") return false;
	const allowlist = providerConfig.allowlist;
	return !allowlist || allowlist.includes(params.ref.id);
}
function hasConfiguredValue(params) {
	const secretRef = require_types_secrets.coerceSecretRef(params.value, params.config?.secrets?.defaults);
	if (secretRef) return hasConfiguredSecretRefInConfigPath({
		config: params.config,
		env: params.env,
		ref: secretRef
	}) && (secretRef.source !== "env" || Boolean(params.env[secretRef.id]?.trim()));
	if (typeof params.value === "string") return params.value.trim().length > 0;
	if (Array.isArray(params.value)) return params.value.length > 0;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.value)) return Object.keys(params.value).length > 0;
	return params.value !== void 0 && params.value !== null;
}
function manifestConfigSignalPasses(params) {
	const effectiveConfigs = readEffectiveConfigs({
		config: params.config,
		rootPath: params.signal.rootPath,
		overlayPath: params.signal.overlayPath,
		overlayMapPath: params.signal.overlayMapPath
	});
	if (effectiveConfigs.length === 0) return false;
	return effectiveConfigs.some((effectiveConfig) => manifestEffectiveConfigSignalPasses({
		config: params.config,
		env: params.env,
		effectiveConfig,
		signal: params.signal
	}));
}
function manifestEffectiveConfigSignalPasses(params) {
	const modeSignal = params.signal.mode;
	if (modeSignal) {
		const modePath = modeSignal.path?.trim() || "mode";
		const mode = readStringAtPath(params.effectiveConfig, modePath) ?? modeSignal.default;
		if (!mode) return false;
		if (modeSignal.allowed?.length && !modeSignal.allowed.includes(mode)) return false;
		if (modeSignal.disallowed?.includes(mode)) return false;
	}
	for (const requiredPath of params.signal.required ?? []) if (!hasConfiguredValue({
		config: params.config,
		env: params.env,
		value: readPath(params.effectiveConfig, requiredPath)
	})) return false;
	const requiredAny = params.signal.requiredAny ?? [];
	if (requiredAny.length > 0 && !requiredAny.some((path) => hasConfiguredValue({
		config: params.config,
		env: params.env,
		value: readPath(params.effectiveConfig, path)
	}))) return false;
	return true;
}
function normalizeBaseUrlForManifestGuard(value) {
	return value.trim().replace(/\/+$/, "");
}
function manifestProviderBaseUrlGuardPasses(params) {
	const guard = params.guard;
	if (!guard) return true;
	const providerConfig = params.config?.models?.providers?.[guard.provider];
	const rawBaseUrl = typeof providerConfig?.baseUrl === "string" && providerConfig.baseUrl.trim() ? providerConfig.baseUrl : guard.defaultBaseUrl;
	if (!rawBaseUrl) return false;
	const normalizedBaseUrl = normalizeBaseUrlForManifestGuard(rawBaseUrl);
	return guard.allowedBaseUrls.some((allowedBaseUrl) => normalizeBaseUrlForManifestGuard(allowedBaseUrl) === normalizedBaseUrl);
}
function manifestPluginSetupProviderEnvVars(plugin, providerId) {
	const direct = plugin.setup?.providers?.find((provider) => provider.id === providerId)?.envVars;
	if (direct && direct.length > 0) return direct;
	return plugin.providerAuthEnvVars?.[providerId] ?? [];
}
function hasNonEmptyManifestEnvCandidate(env, envVars) {
	return envVars.some((envVar) => {
		const key = envVar.trim();
		return key.length > 0 && Boolean(env[key]?.trim());
	});
}
function listToolAuthSignals(metadata) {
	if (metadata.authSignals?.length) return metadata.authSignals;
	return [...metadata.authProviders ?? [], ...metadata.aliases ?? []].map((provider) => ({ provider }));
}
function toolMetadataPasses(params) {
	const authSignals = listToolAuthSignals(params.metadata);
	if (!params.metadata.configSignals?.length && authSignals.length === 0) return true;
	if (params.metadata.configSignals?.some((signal) => manifestConfigSignalPasses({
		config: params.config,
		env: params.env,
		signal
	}))) return true;
	for (const signal of authSignals) {
		if (!manifestProviderBaseUrlGuardPasses({
			config: params.config,
			guard: signal.providerBaseUrl
		})) continue;
		if (params.hasAuthForProvider?.(signal.provider)) return true;
		if (hasNonEmptyManifestEnvCandidate(params.env, manifestPluginSetupProviderEnvVars(params.plugin, signal.provider))) return true;
	}
	return false;
}
function hasManifestToolAvailability(params) {
	for (const toolName of params.toolNames) {
		const metadata = params.plugin.toolMetadata?.[toolName];
		if (!metadata) return true;
		if (toolMetadataPasses({
			plugin: params.plugin,
			metadata,
			config: params.config,
			env: params.env,
			hasAuthForProvider: params.hasAuthForProvider
		})) return true;
	}
	return false;
}
//#endregion
//#region src/plugins/tool-descriptor-cache.ts
/** Caches plugin tool descriptors by plugin source, contract names, and runtime context. */
const PLUGIN_TOOL_DESCRIPTOR_CACHE_VERSION = 3;
const PLUGIN_TOOL_DESCRIPTOR_CACHE_LIMIT = 256;
const pluginToolDescriptorCacheState = {
	descriptors: /* @__PURE__ */ new Map(),
	objectIds: /* @__PURE__ */ new WeakMap(),
	nextObjectId: 1,
	runtimeRegistries: /* @__PURE__ */ new WeakMap()
};
/** Creates a memo table for config cache keys reused across descriptor cache calls. */
function createPluginToolDescriptorConfigCacheKeyMemo() {
	return /* @__PURE__ */ new WeakMap();
}
function sourceFingerprint(source) {
	try {
		const stat = node_fs.default.statSync(source);
		return `${stat.size}:${Math.round(stat.mtimeMs)}`;
	} catch {
		return "missing";
	}
}
function getDescriptorCacheObjectId(value) {
	if (!value) return null;
	const existing = pluginToolDescriptorCacheState.objectIds.get(value);
	if (existing !== void 0) return existing;
	const next = pluginToolDescriptorCacheState.nextObjectId++;
	pluginToolDescriptorCacheState.objectIds.set(value, next);
	return next;
}
function stripDescriptorVolatileConfigFields(value) {
	if (typeof value !== "object") return value;
	if (!("meta" in value) && !("wizard" in value)) return value;
	const { meta: _meta, wizard: _wizard, ...stableConfig } = value;
	return stableConfig;
}
function getDescriptorConfigCacheKey(value, memo) {
	if (!value) return null;
	const cached = memo?.get(value);
	if (cached !== void 0) return cached;
	let resolved;
	try {
		resolved = require_runtime_snapshot.resolveRuntimeConfigCacheKey(stripDescriptorVolatileConfigFields(value));
	} catch {
		resolved = getDescriptorCacheObjectId(value);
	}
	memo?.set(value, resolved);
	return resolved;
}
function buildDescriptorContextCacheKey(params) {
	const { ctx } = params;
	return JSON.stringify({
		config: getDescriptorConfigCacheKey(ctx.config, params.configCacheKeyMemo),
		runtimeConfig: getDescriptorConfigCacheKey(ctx.runtimeConfig, params.configCacheKeyMemo),
		currentRuntimeConfig: getDescriptorConfigCacheKey(params.currentRuntimeConfig, params.configCacheKeyMemo),
		fsPolicy: ctx.fsPolicy ?? null,
		workspaceDir: ctx.workspaceDir ?? null,
		agentDir: ctx.agentDir ?? null,
		agentId: ctx.agentId ?? null,
		activeModel: ctx.activeModel ?? null,
		browser: ctx.browser ?? null,
		messageChannel: ctx.messageChannel ?? null,
		agentAccountId: ctx.agentAccountId ?? null,
		nativeChannelId: ctx.nativeChannelId ?? null,
		deliveryContext: ctx.deliveryContext ?? null,
		requesterSenderId: ctx.requesterSenderId ?? null,
		senderIsOwner: ctx.senderIsOwner ?? null,
		sandboxed: ctx.sandboxed ?? null
	});
}
function buildPluginToolDescriptorCacheKey(params) {
	return JSON.stringify({
		version: PLUGIN_TOOL_DESCRIPTOR_CACHE_VERSION,
		pluginId: params.pluginId,
		source: params.source,
		rootDir: params.rootDir ?? null,
		sourceFingerprint: sourceFingerprint(params.source),
		contractToolNames: [...params.contractToolNames].toSorted(),
		context: buildDescriptorContextCacheKey({
			ctx: params.ctx,
			currentRuntimeConfig: params.currentRuntimeConfig,
			configCacheKeyMemo: params.configCacheKeyMemo
		})
	});
}
function asJsonObject(value) {
	return value;
}
function capturePluginToolDescriptor(params) {
	const label = params.tool.label;
	const title = typeof label === "string" && label.trim() ? label.trim() : void 0;
	return {
		...params.tool.displaySummary ? { displaySummary: params.tool.displaySummary } : {},
		...params.tool.requiredClientCaps ? { requiredClientCaps: [...params.tool.requiredClientCaps] } : {},
		optional: params.optional,
		descriptor: {
			name: params.tool.name,
			...title ? { title } : {},
			description: params.tool.description,
			inputSchema: asJsonObject(params.tool.parameters),
			owner: {
				kind: "plugin",
				pluginId: params.pluginId
			},
			executor: {
				kind: "plugin",
				pluginId: params.pluginId,
				toolName: params.tool.name
			}
		}
	};
}
function readCachedPluginToolDescriptors(cacheKey) {
	return pluginToolDescriptorCacheState.descriptors.get(cacheKey);
}
function writeCachedPluginToolDescriptors(params) {
	if (!pluginToolDescriptorCacheState.descriptors.has(params.cacheKey) && pluginToolDescriptorCacheState.descriptors.size >= PLUGIN_TOOL_DESCRIPTOR_CACHE_LIMIT) {
		const oldestKey = pluginToolDescriptorCacheState.descriptors.keys().next().value;
		if (oldestKey !== void 0) pluginToolDescriptorCacheState.descriptors.delete(oldestKey);
	}
	pluginToolDescriptorCacheState.descriptors.set(params.cacheKey, [...params.descriptors]);
}
//#endregion
//#region src/plugins/tool-grant-allowlist.ts
const RUNTIME_PLUGIN_TOOL_GRANT_PREFIX = "__operator_runtime_plugin_tool_grant__";
function runtimePluginToolGrantKey(pluginId, toolName) {
	return `${RUNTIME_PLUGIN_TOOL_GRANT_PREFIX}:${pluginId.trim().toLowerCase()}:${require_tool_policy.normalizeToolName(toolName)}`;
}
function appendRuntimePluginToolGrant(allowlist, grant) {
	return grant ? [...allowlist, ...grant.toolNames.map((toolName) => runtimePluginToolGrantKey(grant.pluginId, toolName))] : allowlist;
}
function isPluginToolAllowed(allowlist, pluginId, toolName) {
	const normalizedToolName = require_tool_policy.normalizeToolName(toolName);
	return allowlist.has(normalizedToolName) || allowlist.has(runtimePluginToolGrantKey(pluginId, normalizedToolName));
}
//#endregion
//#region src/plugins/tools.ts
/** Builds agent tools registered by plugins, preserving plugin scope around callbacks and descriptors. */
const log = require_subsystem.createSubsystemLogger("plugins/tools");
const PLUGIN_TOOL_FACTORY_WARN_TOTAL_MS = 5e3;
const PLUGIN_TOOL_FACTORY_WARN_FACTORY_MS = 1e3;
const PLUGIN_TOOL_FACTORY_SUMMARY_LIMIT = 20;
const pluginToolMeta = /* @__PURE__ */ new WeakMap();
const scopedPluginTools = /* @__PURE__ */ new WeakMap();
/** Attaches plugin ownership metadata to a concrete agent tool instance. */
function setPluginToolMeta(tool, meta) {
	pluginToolMeta.set(tool, meta);
}
/** Reads plugin ownership metadata for a concrete agent tool instance. */
function getPluginToolMeta(tool) {
	return pluginToolMeta.get(tool);
}
/** Copies plugin ownership metadata when wrappers replace a tool object. */
function copyPluginToolMeta(source, target) {
	const meta = pluginToolMeta.get(source);
	if (meta) pluginToolMeta.set(target, meta);
}
function pluginToolScopeKey(entry) {
	return JSON.stringify([entry.pluginId, entry.source]);
}
function runWithPluginToolScope(entry, run) {
	return require_gateway_request_scope.withPluginRuntimePluginScope({
		pluginId: entry.pluginId,
		...entry.source ? { pluginSource: entry.source } : {}
	}, run);
}
function isAgentTool(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof value.execute === "function";
}
function wrapPluginToolCallbacks(entry, tool) {
	const key = pluginToolScopeKey(entry);
	const scopedByKey = scopedPluginTools.get(tool);
	const cached = scopedByKey?.get(key);
	if (cached) return cached;
	const prepareArguments = tool.prepareArguments;
	const scopedPrepareArguments = prepareArguments ? (args) => runWithPluginToolScope(entry, () => Reflect.apply(prepareArguments, tool, [args])) : void 0;
	const scopedExecute = (toolCallId, params, signal, onUpdate) => runWithPluginToolScope(entry, () => Reflect.apply(tool.execute, tool, [
		toolCallId,
		params,
		signal,
		onUpdate
	]));
	const wrapped = new Proxy(tool, {
		get(target, prop) {
			if (prop === "prepareArguments" && scopedPrepareArguments) return scopedPrepareArguments;
			if (prop === "execute") return scopedExecute;
			return Reflect.get(target, prop, target);
		},
		getOwnPropertyDescriptor(target, prop) {
			if (prop === "prepareArguments" && scopedPrepareArguments) return {
				configurable: true,
				enumerable: Object.prototype.propertyIsEnumerable.call(target, prop),
				value: scopedPrepareArguments,
				writable: true
			};
			if (prop === "execute") return {
				configurable: true,
				enumerable: Object.prototype.propertyIsEnumerable.call(target, prop),
				value: scopedExecute,
				writable: true
			};
			return Reflect.getOwnPropertyDescriptor(target, prop);
		}
	});
	copyPluginToolMeta(tool, wrapped);
	const nextScopedByKey = scopedByKey ?? /* @__PURE__ */ new Map();
	nextScopedByKey.set(key, wrapped);
	scopedPluginTools.set(tool, nextScopedByKey);
	return wrapped;
}
function wrapPluginToolFactoryResult(entry, result) {
	if (Array.isArray(result)) return result.map((tool) => isAgentTool(tool) ? wrapPluginToolCallbacks(entry, tool) : tool);
	return isAgentTool(result) ? wrapPluginToolCallbacks(entry, result) : result;
}
function resolvePluginToolFactory(entry, ctx) {
	return runWithPluginToolScope(entry, () => wrapPluginToolFactoryResult(entry, entry.factory(ctx)));
}
function blocksHostRestrictedConversationReadTool(params) {
	if (require_conversation_read_origin.normalizeConversationReadInvocationOrigin(params.ctx.conversationReadOrigin) === "direct-operator" || params.bundledOwner) return false;
	return params.toolNames.some((toolName) => isHostRestrictedConversationReadTool({
		pluginId: params.pluginId,
		toolName
	}));
}
function blocksHostRestrictedConversationReadRegistration(params) {
	return registrationIncludesHostRestrictedConversationReadTool(params.entry) && blocksHostRestrictedConversationReadTool({
		pluginId: params.entry.pluginId,
		toolNames: [...params.entry.names, ...params.entry.declaredNames ?? []],
		bundledOwner: isBundledConversationReadToolRegistration({
			entry: params.entry,
			manifestPlugin: params.manifestPlugin
		}),
		ctx: params.ctx
	});
}
function resolveCurrentManifestPlugin(params) {
	let config = params.ctx.runtimeConfig ?? params.ctx.config ?? params.loadContext.config;
	if (params.ctx.getRuntimeConfig) try {
		config = params.ctx.getRuntimeConfig() ?? config;
	} catch {
		return;
	}
	return require_manifest_contract_eligibility.loadManifestContractSnapshot({
		config,
		workspaceDir: params.loadContext.workspaceDir,
		env: params.loadContext.env
	}).plugins.find((plugin) => plugin.id === params.pluginId);
}
/**
* Builds a collision-proof key for plugin-owned tool metadata lookups.
*/
function buildPluginToolMetadataKey(pluginId, toolName) {
	return JSON.stringify([pluginId, toolName]);
}
function normalizeAllowlist(list) {
	return new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)((list ?? []).map(require_tool_policy.normalizeToolName)));
}
function normalizeDenylist(list) {
	return require_glob_pattern.compileGlobPatterns({
		raw: list,
		normalize: require_tool_policy.normalizeToolName
	});
}
function denylistBlocksName(name, denylist) {
	const normalized = require_tool_policy.normalizeToolName(name);
	return normalized ? require_glob_pattern.matchesAnyGlobPattern(normalized, denylist) : false;
}
function denylistBlocksPlugin(params) {
	return denylistBlocksName(params.pluginId, params.denylist) || require_glob_pattern.matchesAnyGlobPattern("group:plugins", params.denylist);
}
function denylistBlocksPluginTool(params) {
	return denylistBlocksPlugin({
		pluginId: params.pluginId,
		denylist: params.denylist
	}) || denylistBlocksName(params.toolName, params.denylist);
}
function allowlistIncludesDefaultPluginTools(allowlist) {
	return allowlist.size === 0 || allowlist.has("__operator_default_plugin_tools__");
}
function isManifestToolOptional(plugin, toolName) {
	return plugin.toolMetadata?.[toolName]?.optional === true;
}
function isPluginToolOptional(params) {
	return params.entry.optional || (params.manifestPlugin ? isManifestToolOptional(params.manifestPlugin, params.toolName) : false);
}
function isManifestToolReplaySafe(params) {
	return params.manifestPlugin?.toolMetadata?.[params.toolName]?.replaySafe === true;
}
function isTrustedManifestLocalMediaTool(params) {
	return params.manifestPlugin?.origin === "bundled" && params.manifestPlugin.contracts?.tools?.includes(params.toolName) === true;
}
function isOptionalToolAllowed(params) {
	if (params.allowlist.size === 0) return false;
	if (params.allowlist.has("*")) return true;
	if (isPluginToolAllowed(params.allowlist, params.pluginId, params.toolName)) return true;
	const pluginKey = require_tool_policy.normalizeToolName(params.pluginId);
	if (params.allowlist.has(pluginKey)) return true;
	return params.allowlist.has("group:plugins");
}
function isOptionalToolEntryPotentiallyAllowed(params) {
	if (params.allowlist.size === 0) return false;
	if (params.allowlist.has("*")) return true;
	const pluginKey = require_tool_policy.normalizeToolName(params.pluginId);
	if (params.allowlist.has(pluginKey) || params.allowlist.has("group:plugins")) return true;
	if (params.names.length === 0) return true;
	return params.names.some((name) => isPluginToolAllowed(params.allowlist, params.pluginId, name));
}
function readPluginToolName(tool) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(tool)) return "";
	return typeof tool.name === "string" ? tool.name.trim() : "";
}
function toElapsedMs(value) {
	return Math.max(0, Math.round(value));
}
function describePluginToolFactoryResult(resolved, failed) {
	if (failed) return {
		result: "error",
		resultCount: 0
	};
	if (!resolved) return {
		result: "null",
		resultCount: 0
	};
	if (Array.isArray(resolved)) return {
		result: "array",
		resultCount: resolved.length
	};
	return {
		result: "single",
		resultCount: 1
	};
}
function createPluginToolFactoryTiming(params) {
	const result = describePluginToolFactoryResult(params.resolved, params.failed);
	return {
		pluginId: params.pluginId,
		names: params.names,
		durationMs: params.durationMs,
		elapsedMs: params.elapsedMs,
		result: result.result,
		resultCount: result.resultCount,
		optional: params.optional
	};
}
function resolvePluginToolFactoryEntry(params) {
	let resolved = null;
	let failed = false;
	const factoryStartedAt = Date.now();
	try {
		resolved = resolvePluginToolFactory(params.entry, params.ctx);
	} catch (err) {
		failed = true;
		params.logError(`plugin tool failed (${params.entry.pluginId}): ${String(err)}`);
	}
	const factoryEndedAt = Date.now();
	return {
		resolved,
		failed,
		timing: createPluginToolFactoryTiming({
			pluginId: params.entry.pluginId,
			names: params.declaredNames,
			durationMs: toElapsedMs(factoryEndedAt - factoryStartedAt),
			elapsedMs: toElapsedMs(factoryEndedAt - params.factoryTimingStartedAt),
			resolved,
			failed,
			optional: params.entry.optional
		})
	};
}
function formatPluginToolFactoryTiming(timing) {
	const names = timing.names.length > 0 ? timing.names.join("|") : "-";
	return [
		`${timing.pluginId}:${timing.durationMs}ms@${timing.elapsedMs}ms`,
		`names=[${names}]`,
		`result=${timing.result}`,
		`count=${timing.resultCount}`,
		`optional=${String(timing.optional)}`
	].join(" ");
}
function formatPluginToolFactoryTimingSummary(params) {
	const ranked = params.timings.toSorted((left, right) => right.durationMs - left.durationMs || left.pluginId.localeCompare(right.pluginId)).slice(0, PLUGIN_TOOL_FACTORY_SUMMARY_LIMIT);
	const omitted = Math.max(0, params.timings.length - ranked.length);
	const factories = ranked.length > 0 ? ranked.map((timing) => formatPluginToolFactoryTiming(timing)).join(", ") : "none";
	return [
		"[trace:plugin-tools] factory timings",
		`totalMs=${params.totalMs}`,
		`factoryCount=${params.timings.length}`,
		`shown=${ranked.length}`,
		`omitted=${omitted}`,
		`factories=${factories}`
	].join(" ");
}
function shouldWarnPluginToolFactoryTimings(params) {
	return params.totalMs >= PLUGIN_TOOL_FACTORY_WARN_TOTAL_MS || params.timings.some((timing) => timing.durationMs >= PLUGIN_TOOL_FACTORY_WARN_FACTORY_MS);
}
function describeMalformedPluginTool(tool) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(tool)) return "tool must be an object";
	const name = readPluginToolName(tool);
	if (!name) return "missing non-empty name";
	if (typeof tool.execute !== "function") return `${name} missing execute function`;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(tool.parameters)) return `${name} missing parameters object`;
}
function pluginToolNamesMatchAllowlist(params) {
	if (!params.optional && allowlistIncludesDefaultPluginTools(params.allowlist)) return true;
	return isOptionalToolEntryPotentiallyAllowed(params);
}
function listManifestToolNamesForAllowlist(params) {
	if (params.toolNames.length === 0) return [];
	if (params.allowlist.has("*") || params.allowlist.has("group:plugins")) return [...params.toolNames];
	const pluginKey = require_tool_policy.normalizeToolName(params.pluginId);
	if (params.allowlist.has(pluginKey)) return [...params.toolNames];
	const matchedToolNames = params.toolNames.filter((name) => isPluginToolAllowed(params.allowlist, params.pluginId, name));
	if (!allowlistIncludesDefaultPluginTools(params.allowlist)) return matchedToolNames;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...params.toolNames.filter((name) => !isManifestToolOptional(params.plugin, name)), ...matchedToolNames]);
}
function listManifestToolNamesForAvailability(params) {
	return listManifestToolNamesForAllowlist(params);
}
function isManifestToolNameAvailable(params) {
	return hasManifestToolAvailability({
		plugin: params.plugin,
		toolNames: [params.toolName],
		config: params.config,
		env: params.env,
		hasAuthForProvider: params.hasAuthForProvider
	});
}
function filterManifestToolNamesForAvailability(params) {
	return params.toolNames.filter((toolName) => isManifestToolNameAvailable({
		plugin: params.plugin,
		toolName,
		config: params.config,
		env: params.env,
		hasAuthForProvider: params.hasAuthForProvider
	}));
}
function resolvePluginToolRuntimePluginIds(params) {
	const pluginIds = /* @__PURE__ */ new Set();
	const allowlist = normalizeAllowlist(params.toolAllowlist);
	const denylist = normalizeDenylist(params.toolDenylist);
	const normalizedPlugins = require_config_state.normalizePluginsConfig(params.config?.plugins);
	const snapshot = params.snapshot ?? require_manifest_contract_eligibility.loadManifestContractSnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	for (const plugin of snapshot.plugins) {
		if (!require_manifest_contract_eligibility.isManifestPluginAvailableForControlPlane({
			snapshot,
			plugin,
			config: params.config
		})) continue;
		if (normalizedPlugins.entries[plugin.id]?.enabled === false || normalizedPlugins.deny.includes(plugin.id)) continue;
		if (denylistBlocksPlugin({
			pluginId: plugin.id,
			denylist
		})) continue;
		const selectedToolNames = listManifestToolNamesForAvailability({
			toolNames: plugin.contracts?.tools ?? [],
			plugin,
			pluginId: plugin.id,
			allowlist
		}).filter((toolName) => !denylistBlocksPluginTool({
			pluginId: plugin.id,
			toolName,
			denylist
		}));
		if (selectedToolNames.length > 0 && hasManifestToolAvailability({
			plugin,
			toolNames: selectedToolNames,
			config: params.availabilityConfig ?? params.config,
			env: params.env,
			hasAuthForProvider: params.hasAuthForProvider
		})) pluginIds.add(plugin.id);
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
function readPluginCacheSource(plugin) {
	const source = plugin.source;
	if (typeof source === "string" && source.trim()) return source;
	const manifestPath = plugin.manifestPath;
	if (typeof manifestPath === "string" && manifestPath.trim()) return manifestPath;
	return plugin.id;
}
function buildPluginDescriptorCacheKey(params) {
	return buildPluginToolDescriptorCacheKey({
		pluginId: params.plugin.id,
		source: readPluginCacheSource(params.plugin),
		rootDir: params.plugin.rootDir,
		contractToolNames: params.plugin.contracts?.tools ?? [],
		ctx: params.ctx,
		currentRuntimeConfig: params.currentRuntimeConfig,
		configCacheKeyMemo: params.configCacheKeyMemo
	});
}
function cachedDescriptorsCoverToolNames(params) {
	const descriptorNames = new Set(params.descriptors.map((entry) => require_tool_policy.normalizeToolName(entry.descriptor.name)));
	return params.toolNames.every((name) => descriptorNames.has(require_tool_policy.normalizeToolName(name)));
}
function createCachedDescriptorPluginTool(params) {
	const { descriptor } = params.descriptor;
	const pluginId = descriptor.owner.kind === "plugin" ? descriptor.owner.pluginId : "";
	const toolName = descriptor.name;
	const tool = {
		name: descriptor.name,
		label: descriptor.title ?? descriptor.name,
		description: descriptor.description,
		parameters: descriptor.inputSchema,
		...params.descriptor.requiredClientCaps ? { requiredClientCaps: [...params.descriptor.requiredClientCaps] } : {},
		async execute(toolCallId, executeParams, signal, onUpdate) {
			const candidates = resolvePluginToolRegistry({
				loadOptions: require_load_context.buildPluginRuntimeLoadOptions(params.loadContext, {
					activate: false,
					toolDiscovery: true,
					onlyPluginIds: [pluginId],
					...params.runtimeOptions ? { runtimeOptions: params.runtimeOptions } : {}
				}),
				onlyPluginIds: [pluginId],
				retainedRegistry: pluginToolDescriptorCacheState.runtimeRegistries.get(params.descriptor),
				onRetainRegistry: (retainedRegistry) => {
					pluginToolDescriptorCacheState.runtimeRegistries.set(params.descriptor, retainedRegistry);
				}
			})?.tools.filter((candidate) => candidate.pluginId === pluginId);
			if (!candidates || candidates.length === 0) throw new Error(`plugin tool runtime unavailable (${pluginId}): ${toolName}`);
			const requestedToolName = require_tool_policy.normalizeToolName(toolName);
			const matchingNamedCandidates = [];
			const unnamedCandidates = [];
			for (const candidate of candidates) {
				if (candidate.names.length === 0) {
					unnamedCandidates.push(candidate);
					continue;
				}
				if (candidate.names.some((name) => require_tool_policy.normalizeToolName(name) === requestedToolName)) matchingNamedCandidates.push(candidate);
			}
			const resolveCandidateTool = (candidate) => {
				if (blocksHostRestrictedConversationReadRegistration({
					entry: candidate,
					manifestPlugin: resolveCurrentManifestPlugin({
						pluginId,
						ctx: params.ctx,
						loadContext: params.loadContext
					}),
					ctx: params.ctx
				})) return;
				const resolved = resolvePluginToolFactory(candidate, params.ctx);
				const listRaw = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];
				for (const toolRaw of listRaw) {
					if (describeMalformedPluginTool(toolRaw)) continue;
					const runtimeTool = toolRaw;
					if (require_tool_policy.normalizeToolName(readPluginToolName(runtimeTool)) === requestedToolName) return runtimeTool;
				}
			};
			for (const candidate of [...matchingNamedCandidates, ...unnamedCandidates]) {
				let matchedTool;
				try {
					matchedTool = resolveCandidateTool(candidate);
				} catch {
					continue;
				}
				if (matchedTool) return matchedTool.execute(toolCallId, executeParams, signal, onUpdate);
			}
			throw new Error(`plugin tool runtime missing (${pluginId}): ${toolName}`);
		}
	};
	if (params.descriptor.displaySummary) tool.displaySummary = params.descriptor.displaySummary;
	setPluginToolMeta(tool, {
		pluginId,
		optional: params.descriptor.optional,
		replaySafe: isManifestToolReplaySafe({
			manifestPlugin: params.plugin,
			toolName
		}),
		trustedLocalMedia: isTrustedManifestLocalMediaTool({
			manifestPlugin: params.plugin,
			toolName
		})
	});
	return tool;
}
function resolveCachedPluginTools(params) {
	const tools = [];
	const handledPluginIds = /* @__PURE__ */ new Set();
	const onlyPluginIdSet = new Set(params.onlyPluginIds);
	for (const plugin of params.snapshot.plugins) {
		if (!onlyPluginIdSet.has(plugin.id)) continue;
		if (denylistBlocksPlugin({
			pluginId: plugin.id,
			denylist: params.denylist
		})) continue;
		if (!require_manifest_contract_eligibility.isManifestPluginAvailableForControlPlane({
			snapshot: params.snapshot,
			plugin,
			config: params.config
		})) continue;
		const availableToolNames = filterManifestToolNamesForAvailability({
			plugin,
			toolNames: listManifestToolNamesForAvailability({
				plugin,
				toolNames: plugin.contracts?.tools ?? [],
				pluginId: plugin.id,
				allowlist: params.allowlist
			}).filter((toolName) => !denylistBlocksPluginTool({
				pluginId: plugin.id,
				toolName,
				denylist: params.denylist
			})),
			config: params.availabilityConfig,
			env: params.env,
			hasAuthForProvider: params.hasAuthForProvider
		});
		if (availableToolNames.length === 0) continue;
		if (params.existingNormalized.has(require_tool_policy.normalizeToolName(plugin.id))) continue;
		const cached = readCachedPluginToolDescriptors(buildPluginDescriptorCacheKey({
			plugin,
			ctx: params.ctx,
			currentRuntimeConfig: params.currentRuntimeConfig,
			configCacheKeyMemo: params.configCacheKeyMemo
		}));
		if (!cached || !cachedDescriptorsCoverToolNames({
			descriptors: cached,
			toolNames: availableToolNames
		})) continue;
		const pluginTools = [];
		let hasNameConflict = false;
		const localNormalizedNames = /* @__PURE__ */ new Set();
		for (const cachedDescriptor of cached) {
			if (blocksHostRestrictedConversationReadTool({
				pluginId: plugin.id,
				toolNames: [cachedDescriptor.descriptor.name],
				bundledOwner: plugin.origin === "bundled",
				ctx: params.ctx
			})) continue;
			if (!cachedDescriptor.optional && !availableToolNames.some((name) => require_tool_policy.normalizeToolName(name) === require_tool_policy.normalizeToolName(cachedDescriptor.descriptor.name))) continue;
			if (cachedDescriptor.optional && !isOptionalToolAllowed({
				toolName: cachedDescriptor.descriptor.name,
				pluginId: plugin.id,
				allowlist: params.allowlist
			})) continue;
			const normalizedDescriptorName = require_tool_policy.normalizeToolName(cachedDescriptor.descriptor.name);
			if (denylistBlocksPluginTool({
				pluginId: plugin.id,
				toolName: cachedDescriptor.descriptor.name,
				denylist: params.denylist
			})) continue;
			if (localNormalizedNames.has(normalizedDescriptorName) || params.existingNormalized.has(normalizedDescriptorName)) {
				hasNameConflict = true;
				break;
			}
			localNormalizedNames.add(normalizedDescriptorName);
			pluginTools.push(createCachedDescriptorPluginTool({
				descriptor: cachedDescriptor,
				plugin,
				ctx: params.ctx,
				loadContext: params.loadContext,
				runtimeOptions: params.runtimeOptions
			}));
		}
		if (hasNameConflict) continue;
		for (const pluginTool of pluginTools) {
			params.existing.add(pluginTool.name);
			params.existingNormalized.add(require_tool_policy.normalizeToolName(pluginTool.name));
			params.pluginToolOwnersByName.set(require_tool_policy.normalizeToolName(pluginTool.name), plugin.id);
			tools.push(pluginTool);
		}
		handledPluginIds.add(plugin.id);
	}
	return {
		tools,
		handledPluginIds
	};
}
function resolvePluginToolRegistry(params) {
	const requestedPluginIds = params.onlyPluginIds;
	const retainedRegistry = requestedPluginIds === void 0 || requestedPluginIds.length === 1 ? params.retainedRegistry : void 0;
	const registries = [];
	const seenRegistries = /* @__PURE__ */ new Set();
	const ownerRegistryByPluginId = /* @__PURE__ */ new Map();
	const addRegistry = (registry) => {
		if (!registry || seenRegistries.has(registry)) return;
		seenRegistries.add(registry);
		registries.push(registry);
		if (requestedPluginIds === void 0) return;
		const toolPluginIds = new Set(registry.tools.map((entry) => entry.pluginId));
		for (const pluginId of requestedPluginIds) if (toolPluginIds.has(pluginId) && !ownerRegistryByPluginId.has(pluginId)) ownerRegistryByPluginId.set(pluginId, registry);
	};
	const missingPluginIds = () => requestedPluginIds?.filter((pluginId) => !ownerRegistryByPluginId.has(pluginId));
	const composeSelectedRegistries = () => composePluginToolRegistries({
		registries,
		ownerRegistryByPluginId,
		requestedPluginIds: requestedPluginIds ?? []
	});
	const runtimeState = require_runtime_state.getPluginRegistryState();
	const gatewayRegistry = runtimeState?.channel.pinned ? runtimeState.channel.registry ?? void 0 : void 0;
	if (requestedPluginIds === void 0 && registryHasScopedPluginTools(gatewayRegistry, void 0)) return gatewayRegistry;
	addRegistry(gatewayRegistry);
	let requiredPluginIds = missingPluginIds();
	if (requiredPluginIds?.length === 0) return composeSelectedRegistries();
	let activeRegistry;
	if (requiredPluginIds === void 0) activeRegistry = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
		env: params.loadOptions.env,
		workspaceDir: params.loadOptions.workspaceDir,
		surface: "active"
	});
	else for (const pluginId of requiredPluginIds) {
		activeRegistry = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
			env: params.loadOptions.env,
			workspaceDir: params.loadOptions.workspaceDir,
			requiredPluginIds: [pluginId],
			surface: "active"
		});
		if (activeRegistry) break;
	}
	if (requestedPluginIds === void 0 && registryHasScopedPluginTools(activeRegistry, void 0)) return activeRegistry;
	addRegistry(activeRegistry);
	requiredPluginIds = missingPluginIds();
	if (requiredPluginIds?.length === 0) return composeSelectedRegistries();
	if (requestedPluginIds === void 0 && registryHasScopedPluginTools(retainedRegistry, void 0)) return retainedRegistry;
	addRegistry(retainedRegistry);
	requiredPluginIds = missingPluginIds();
	if (requiredPluginIds?.length === 0) return composeSelectedRegistries();
	const forceStandaloneLoad = Boolean(gatewayRegistry || activeRegistry || retainedRegistry);
	const shouldRetainColdLoadedToolRegistry = forceStandaloneLoad && params.loadOptions.activate === false && params.loadOptions.toolDiscovery === true && params.onRetainRegistry !== void 0;
	const standaloneRegistry = require_standalone_runtime_registry_loader.ensureStandaloneRuntimePluginRegistryLoaded({
		surface: "active",
		forceLoad: forceStandaloneLoad,
		installRegistry: !forceStandaloneLoad,
		requiredPluginIds,
		loadOptions: requestedPluginIds === void 0 ? params.loadOptions : {
			...params.loadOptions,
			onlyPluginIds: requiredPluginIds
		}
	});
	if (standaloneRegistry && shouldRetainColdLoadedToolRegistry) params.onRetainRegistry?.(standaloneRegistry);
	addRegistry(standaloneRegistry);
	if (requestedPluginIds === void 0) return standaloneRegistry ?? gatewayRegistry ?? activeRegistry;
	return composeSelectedRegistries();
}
function composePluginToolRegistries(params) {
	if (params.registries.length === 0) return;
	const contributingRegistries = params.registries.filter((registry) => params.requestedPluginIds.some((pluginId) => params.ownerRegistryByPluginId.get(pluginId) === registry));
	const baseRegistry = params.registries.at(-1);
	if (contributingRegistries.length === 1 && contributingRegistries[0] === baseRegistry) return baseRegistry;
	const selectedPluginIds = new Set(params.requestedPluginIds);
	return {
		...baseRegistry,
		plugins: contributingRegistries.flatMap((registry) => registry.plugins.filter((plugin) => selectedPluginIds.has(plugin.id) && params.ownerRegistryByPluginId.get(plugin.id) === registry)),
		tools: contributingRegistries.flatMap((registry) => registry.tools.filter((entry) => params.ownerRegistryByPluginId.get(entry.pluginId) === registry))
	};
}
function registryHasScopedPluginTools(registry, pluginIds) {
	if (!registry) return false;
	if (pluginIds === void 0) return (registry.tools?.length ?? 0) > 0;
	const scopedPluginIds = new Set(pluginIds);
	if (scopedPluginIds.size === 0) return true;
	const registryPluginIds = new Set(registry.tools.map((entry) => entry.pluginId));
	return Array.from(scopedPluginIds).every((pluginId) => registryPluginIds.has(pluginId));
}
function resolvePluginToolLoadState(params) {
	const env = params.env ?? process.env;
	const context = require_load_context.resolvePluginRuntimeLoadContext({
		config: require_config_state.applyTestPluginDefaults(params.context.config ?? {}, env),
		env,
		workspaceDir: params.context.workspaceDir
	});
	if (!require_config_state.normalizePluginsConfig(context.config.plugins).enabled) return;
	const runtimeOptions = params.allowGatewaySubagentBinding ? { allowGatewaySubagentBinding: true } : void 0;
	const snapshot = require_manifest_contract_eligibility.loadManifestContractSnapshot({
		config: context.config,
		workspaceDir: context.workspaceDir,
		env
	});
	const onlyPluginIds = resolvePluginToolRuntimePluginIds({
		config: context.config,
		availabilityConfig: params.context.runtimeConfig ?? context.config,
		workspaceDir: context.workspaceDir,
		env,
		toolAllowlist: params.toolAllowlist,
		toolDenylist: params.toolDenylist,
		hasAuthForProvider: params.hasAuthForProvider,
		snapshot
	});
	return {
		context,
		env,
		loadOptions: require_load_context.buildPluginRuntimeLoadOptions(context, {
			activate: false,
			toolDiscovery: true,
			onlyPluginIds,
			runtimeOptions
		}),
		onlyPluginIds,
		runtimeOptions,
		snapshot
	};
}
function ensureStandalonePluginToolRegistryLoaded(params) {
	const loadState = resolvePluginToolLoadState(params);
	if (!loadState) return;
	const registry = require_standalone_runtime_registry_loader.ensureStandaloneRuntimePluginRegistryLoaded({
		surface: "channel",
		requiredPluginIds: loadState.onlyPluginIds,
		loadOptions: loadState.loadOptions
	});
	if (registryHasScopedPluginTools(registry, loadState.onlyPluginIds)) return registry;
	return resolvePluginToolRegistry({
		loadOptions: loadState.loadOptions,
		onlyPluginIds: loadState.onlyPluginIds
	});
}
function resolvePluginTools(params) {
	const loadState = resolvePluginToolLoadState(params);
	if (!loadState) return [];
	const { context, env, onlyPluginIds, runtimeOptions, snapshot } = loadState;
	const tools = [];
	const existing = params.existingToolNames ?? /* @__PURE__ */ new Set();
	const existingNormalized = new Set(Array.from(existing, (tool) => require_tool_policy.normalizeToolName(tool)));
	const pluginToolOwnersByName = /* @__PURE__ */ new Map();
	const allowlist = normalizeAllowlist(params.toolAllowlist);
	const denylist = normalizeDenylist(params.toolDenylist);
	const configCacheKeyMemo = createPluginToolDescriptorConfigCacheKeyMemo();
	let currentRuntimeConfigForDescriptorCache = params.context.runtimeConfig;
	if (currentRuntimeConfigForDescriptorCache === void 0 && params.context.getRuntimeConfig) try {
		currentRuntimeConfigForDescriptorCache = params.context.getRuntimeConfig();
	} catch {
		currentRuntimeConfigForDescriptorCache = null;
	}
	const cached = resolveCachedPluginTools({
		snapshot,
		config: context.config,
		availabilityConfig: params.context.runtimeConfig ?? context.config,
		env,
		allowlist,
		denylist,
		hasAuthForProvider: params.hasAuthForProvider,
		onlyPluginIds,
		existing,
		existingNormalized,
		pluginToolOwnersByName,
		ctx: params.context,
		loadContext: context,
		runtimeOptions,
		currentRuntimeConfig: currentRuntimeConfigForDescriptorCache,
		configCacheKeyMemo
	});
	tools.push(...cached.tools);
	const runtimePluginIds = onlyPluginIds.filter((pluginId) => !cached.handledPluginIds.has(pluginId));
	if (runtimePluginIds.length === 0) return tools;
	const loadOptions = require_load_context.buildPluginRuntimeLoadOptions(context, {
		activate: false,
		toolDiscovery: true,
		onlyPluginIds: runtimePluginIds,
		runtimeOptions
	});
	let registry = registryHasScopedPluginTools(params.runtimeRegistry, runtimePluginIds) ? params.runtimeRegistry : void 0;
	if (!registry) registry = resolvePluginToolRegistry({
		loadOptions,
		onlyPluginIds: runtimePluginIds
	});
	if (!registry) {
		try {
			require_standalone_runtime_registry_loader.ensureStandaloneRuntimePluginRegistryLoaded({
				surface: "channel",
				requiredPluginIds: runtimePluginIds,
				loadOptions
			});
		} catch (error) {
			context.logger.error(`failed to cold-load plugin tool registry for plugin ids [${runtimePluginIds.join(", ")}]: ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
		registry = resolvePluginToolRegistry({
			loadOptions,
			onlyPluginIds: runtimePluginIds
		});
		if (!registry) {
			context.logger.warn(`plugin tool registry still unavailable after cold load for plugin ids [${runtimePluginIds.join(", ")}]`);
			return tools;
		}
	}
	const scopedPluginIds = new Set(runtimePluginIds);
	const registryToolPluginIds = new Set(registry.tools.map((entry) => entry.pluginId));
	const missingRegistryToolPluginIds = runtimePluginIds.filter((pluginId) => !registryToolPluginIds.has(pluginId));
	for (const pluginId of missingRegistryToolPluginIds) registry.diagnostics.push({
		level: "warn",
		pluginId,
		source: "plugin-tools",
		message: `plugin tool registry did not include selected plugin tools after cold load (${pluginId})`
	});
	const blockedPlugins = /* @__PURE__ */ new Set();
	const factoryTimingStartedAt = Date.now();
	const factoryTimings = [];
	const capturedDescriptorsByPluginId = /* @__PURE__ */ new Map();
	const manifestPluginsById = new Map(snapshot.plugins.map((plugin) => [plugin.id, plugin]));
	for (const entry of registry.tools) {
		if (!scopedPluginIds.has(entry.pluginId)) continue;
		if (denylistBlocksPlugin({
			pluginId: entry.pluginId,
			denylist
		})) continue;
		if (blockedPlugins.has(entry.pluginId)) continue;
		const pluginIdKey = require_tool_policy.normalizeToolName(entry.pluginId);
		if (existingNormalized.has(pluginIdKey) && pluginToolOwnersByName.get(pluginIdKey) !== entry.pluginId) {
			const message = `plugin id conflicts with core tool name (${entry.pluginId})`;
			if (!params.suppressNameConflicts) {
				context.logger.error(message);
				registry.diagnostics.push({
					level: "error",
					pluginId: entry.pluginId,
					source: entry.source,
					message
				});
			}
			blockedPlugins.add(entry.pluginId);
			continue;
		}
		const manifestPlugin = manifestPluginsById.get(entry.pluginId);
		const declaredNames = entry.names ?? [];
		const availabilityNames = declaredNames.length > 0 ? declaredNames : entry.declaredNames ?? [];
		const allowlistNames = manifestPlugin ? filterManifestToolNamesForAvailability({
			plugin: manifestPlugin,
			toolNames: availabilityNames,
			config: params.context.runtimeConfig ?? context.config,
			env,
			hasAuthForProvider: params.hasAuthForProvider
		}).filter((toolName) => !denylistBlocksPluginTool({
			pluginId: entry.pluginId,
			toolName,
			denylist
		})) : declaredNames;
		if (manifestPlugin && availabilityNames.length > 0 && allowlistNames.length === 0) continue;
		if (!pluginToolNamesMatchAllowlist({
			names: allowlistNames,
			pluginId: entry.pluginId,
			optional: entry.optional,
			allowlist
		})) continue;
		if (blocksHostRestrictedConversationReadRegistration({
			entry,
			manifestPlugin,
			ctx: params.context
		})) continue;
		const factoryResult = resolvePluginToolFactoryEntry({
			entry,
			ctx: params.context,
			declaredNames,
			factoryTimingStartedAt,
			logError: (message) => context.logger.error(message)
		});
		factoryTimings.push(factoryResult.timing);
		if (factoryResult.failed) continue;
		const { resolved } = factoryResult;
		if (!resolved) {
			if (declaredNames.length > 0) context.logger.debug?.(`plugin tool factory returned null (${entry.pluginId}): [${declaredNames.join(", ")}]`);
			continue;
		}
		const listRaw = Array.isArray(resolved) ? resolved : [resolved];
		const selectedManifestToolNames = manifestPlugin && availabilityNames.length > 0 ? new Set(allowlistNames.map((name) => require_tool_policy.normalizeToolName(name))) : void 0;
		const manifestContractToolNames = manifestPlugin && availabilityNames.length > 0 ? new Set(availabilityNames.map((name) => require_tool_policy.normalizeToolName(name))) : void 0;
		const policyAvailableList = (manifestPlugin ? listRaw.filter((tool) => {
			const toolName = readPluginToolName(tool);
			const normalizedToolName = require_tool_policy.normalizeToolName(toolName);
			if (isManifestToolOptional(manifestPlugin, toolName) && !isOptionalToolAllowed({
				toolName,
				pluginId: entry.pluginId,
				allowlist
			})) return false;
			if (selectedManifestToolNames && manifestContractToolNames?.has(normalizedToolName) && !selectedManifestToolNames.has(normalizedToolName)) return false;
			return isManifestToolNameAvailable({
				plugin: manifestPlugin,
				toolName,
				config: params.context.runtimeConfig ?? context.config,
				env,
				hasAuthForProvider: params.hasAuthForProvider
			});
		}) : listRaw).filter((tool) => !denylistBlocksPluginTool({
			pluginId: entry.pluginId,
			toolName: readPluginToolName(tool),
			denylist
		}));
		const list = entry.optional ? policyAvailableList.filter((tool) => isOptionalToolAllowed({
			toolName: readPluginToolName(tool),
			pluginId: entry.pluginId,
			allowlist
		})) : policyAvailableList;
		if (list.length === 0) continue;
		const normalizedNameSet = /* @__PURE__ */ new Set();
		for (const toolRaw of list) {
			const malformedReason = describeMalformedPluginTool(toolRaw);
			if (malformedReason) {
				const message = `plugin tool is malformed (${entry.pluginId}): ${malformedReason}`;
				context.logger.error(message);
				registry.diagnostics.push({
					level: "error",
					pluginId: entry.pluginId,
					source: entry.source,
					message
				});
				continue;
			}
			const tool = toolRaw;
			const undeclared = entry.declaredNames ? require_agent_tool_result_middleware.findUndeclaredPluginToolNames({
				declaredNames: entry.declaredNames,
				toolNames: [tool.name]
			}) : [];
			if (undeclared.length > 0) {
				const message = `plugin tool is undeclared (${entry.pluginId}): ${undeclared.join(", ")}`;
				context.logger.error(message);
				registry.diagnostics.push({
					level: "error",
					pluginId: entry.pluginId,
					source: entry.source,
					message
				});
				continue;
			}
			const normalizedToolName = require_tool_policy.normalizeToolName(tool.name);
			if (normalizedNameSet.has(normalizedToolName) || existingNormalized.has(normalizedToolName)) {
				const message = `plugin tool name conflict (${entry.pluginId}): ${tool.name}`;
				if (!params.suppressNameConflicts) {
					context.logger.error(message);
					registry.diagnostics.push({
						level: "error",
						pluginId: entry.pluginId,
						source: entry.source,
						message
					});
				}
				continue;
			}
			normalizedNameSet.add(normalizedToolName);
			existing.add(tool.name);
			existingNormalized.add(normalizedToolName);
			pluginToolOwnersByName.set(normalizedToolName, entry.pluginId);
			const optional = isPluginToolOptional({
				entry,
				manifestPlugin,
				toolName: tool.name
			});
			pluginToolMeta.set(tool, {
				pluginId: entry.pluginId,
				optional,
				replaySafe: isManifestToolReplaySafe({
					manifestPlugin,
					toolName: tool.name
				}),
				trustedLocalMedia: isTrustedManifestLocalMediaTool({
					manifestPlugin,
					toolName: tool.name
				})
			});
			if (manifestPlugin) {
				const capturedDescriptors = capturedDescriptorsByPluginId.get(entry.pluginId) ?? [];
				capturedDescriptors.push(capturePluginToolDescriptor({
					pluginId: entry.pluginId,
					tool,
					optional
				}));
				capturedDescriptorsByPluginId.set(entry.pluginId, capturedDescriptors);
			}
			tools.push(tool);
		}
	}
	for (const [pluginId, descriptors] of capturedDescriptorsByPluginId) {
		const manifestPlugin = manifestPluginsById.get(pluginId);
		if (!manifestPlugin) continue;
		if (cachedDescriptorsCoverToolNames({
			descriptors,
			toolNames: listManifestToolNamesForAvailability({
				plugin: manifestPlugin,
				toolNames: manifestPlugin.contracts?.tools ?? [],
				pluginId,
				allowlist
			}).filter((toolName) => !denylistBlocksPluginTool({
				pluginId,
				toolName,
				denylist
			}))
		})) writeCachedPluginToolDescriptors({
			cacheKey: buildPluginDescriptorCacheKey({
				plugin: manifestPlugin,
				ctx: params.context,
				currentRuntimeConfig: currentRuntimeConfigForDescriptorCache,
				configCacheKeyMemo
			}),
			descriptors
		});
	}
	if (factoryTimings.length > 0) {
		const timingSummary = {
			totalMs: factoryTimings.at(-1)?.elapsedMs ?? toElapsedMs(Date.now() - factoryTimingStartedAt),
			timings: factoryTimings
		};
		if (shouldWarnPluginToolFactoryTimings(timingSummary)) log.warn(formatPluginToolFactoryTimingSummary(timingSummary));
		else if (log.isEnabled("trace")) log.trace(formatPluginToolFactoryTimingSummary(timingSummary));
	}
	return tools;
}
//#endregion
Object.defineProperty(exports, "appendRuntimePluginToolGrant", {
	enumerable: true,
	get: function() {
		return appendRuntimePluginToolGrant;
	}
});
Object.defineProperty(exports, "buildPluginToolMetadataKey", {
	enumerable: true,
	get: function() {
		return buildPluginToolMetadataKey;
	}
});
Object.defineProperty(exports, "copyPluginToolMeta", {
	enumerable: true,
	get: function() {
		return copyPluginToolMeta;
	}
});
Object.defineProperty(exports, "ensureStandalonePluginToolRegistryLoaded", {
	enumerable: true,
	get: function() {
		return ensureStandalonePluginToolRegistryLoaded;
	}
});
Object.defineProperty(exports, "getPluginToolMeta", {
	enumerable: true,
	get: function() {
		return getPluginToolMeta;
	}
});
Object.defineProperty(exports, "hasManifestToolAvailability", {
	enumerable: true,
	get: function() {
		return hasManifestToolAvailability;
	}
});
Object.defineProperty(exports, "hasNonEmptyManifestEnvCandidate", {
	enumerable: true,
	get: function() {
		return hasNonEmptyManifestEnvCandidate;
	}
});
Object.defineProperty(exports, "manifestConfigSignalPasses", {
	enumerable: true,
	get: function() {
		return manifestConfigSignalPasses;
	}
});
Object.defineProperty(exports, "manifestPluginSetupProviderEnvVars", {
	enumerable: true,
	get: function() {
		return manifestPluginSetupProviderEnvVars;
	}
});
Object.defineProperty(exports, "manifestProviderBaseUrlGuardPasses", {
	enumerable: true,
	get: function() {
		return manifestProviderBaseUrlGuardPasses;
	}
});
Object.defineProperty(exports, "resolvePluginTools", {
	enumerable: true,
	get: function() {
		return resolvePluginTools;
	}
});
Object.defineProperty(exports, "setPluginToolMeta", {
	enumerable: true,
	get: function() {
		return setPluginToolMeta;
	}
});
