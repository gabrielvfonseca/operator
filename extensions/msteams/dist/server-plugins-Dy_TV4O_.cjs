const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_gateway_request_scope = require("./gateway-request-scope-Dy7CSqxn.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
require("./method-scopes-Dz-dMiDm.cjs");
const require_plugin_lookup_table = require("./plugin-lookup-table-CYK2rClH.cjs");
const require_server_plugin_runtime_client = require("./server-plugin-runtime-client-Dnm81hBY.cjs");
const require_server_plugin_fallback_context = require("./server-plugin-fallback-context-A5MnRYGO.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let node_crypto = require("node:crypto");
let node_perf_hooks = require("node:perf_hooks");
//#region src/gateway/server-plugins-node-runtime.ts
function hasInProcessGatewayContext() {
	return Boolean(require_gateway_request_scope.getPluginRuntimeGatewayRequestScope()?.context ?? require_server_plugin_fallback_context.getFallbackGatewayContext());
}
function projectGatewayRuntimeNodes(nodes) {
	const context = require_gateway_request_scope.getPluginRuntimeGatewayRequestScope()?.context ?? require_server_plugin_fallback_context.getFallbackGatewayContext();
	return nodes.map((node) => {
		if (!node || typeof node !== "object" || Array.isArray(node) || !context?.nodeRegistry?.get || !context.getRuntimeConfig) return node;
		const nodeRecord = node;
		const nodeId = typeof nodeRecord.nodeId === "string" ? nodeRecord.nodeId : "";
		const liveNode = nodeId ? context.nodeRegistry.get(nodeId) : void 0;
		if (!liveNode) return node;
		const allowlist = require_node_command_policy.resolveNodeCommandAllowlist(context.getRuntimeConfig(), {
			...liveNode,
			approvedCommands: liveNode.commands
		});
		const invocableCommands = liveNode.commands.filter((command) => require_node_command_policy.isNodeCommandAllowed({
			command,
			declaredCommands: liveNode.commands,
			allowlist
		}).ok);
		return Object.assign({}, nodeRecord, { invocableCommands });
	});
}
//#endregion
//#region src/gateway/server-plugins.ts
const PLUGIN_SUBAGENT_POLICY_STATE_KEY = Symbol.for("operator.pluginSubagentOverridePolicyState");
const getPluginSubagentPolicyState = () => require_global_singleton.resolveGlobalSingleton(PLUGIN_SUBAGENT_POLICY_STATE_KEY, () => ({ policies: {} }));
function normalizeAllowedModelRef(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (trimmed === "*") return "*";
	const parsed = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(trimmed);
	if (!parsed) return null;
	const normalized = require_model_selection_normalize.normalizeModelRef(parsed.provider, parsed.modelId);
	return `${normalized.provider}/${normalized.model}`;
}
function setPluginSubagentOverridePolicies(cfg) {
	const pluginSubagentPolicyState = getPluginSubagentPolicyState();
	const normalized = require_config_state.normalizePluginsConfig(cfg.plugins);
	const policies = {};
	for (const [pluginId, entry] of Object.entries(normalized.entries)) {
		const allowModelOverride = entry.subagent?.allowModelOverride === true;
		const hasConfiguredAllowlist = entry.subagent?.hasAllowedModelsConfig === true;
		const configuredAllowedModels = entry.subagent?.allowedModels ?? [];
		const allowedModels = /* @__PURE__ */ new Set();
		let allowAnyModel = false;
		for (const modelRef of configuredAllowedModels) {
			const normalizedModelRef = normalizeAllowedModelRef(modelRef);
			if (!normalizedModelRef) continue;
			if (normalizedModelRef === "*") {
				allowAnyModel = true;
				continue;
			}
			allowedModels.add(normalizedModelRef);
		}
		if (!allowModelOverride && !hasConfiguredAllowlist && allowedModels.size === 0 && !allowAnyModel) continue;
		policies[pluginId] = {
			allowModelOverride,
			allowAnyModel,
			hasConfiguredAllowlist,
			allowedModels
		};
	}
	pluginSubagentPolicyState.policies = policies;
}
function authorizeFallbackModelOverride(params) {
	const pluginSubagentPolicyState = getPluginSubagentPolicyState();
	const pluginId = params.pluginId?.trim();
	if (!pluginId) return {
		allowed: false,
		reason: "provider/model override requires plugin identity in fallback subagent runs."
	};
	const policy = pluginSubagentPolicyState.policies[pluginId];
	if (!policy?.allowModelOverride) return {
		allowed: false,
		reason: `plugin "${pluginId}" is not trusted for fallback provider/model override requests. See https://docs.operator.ai/plugins/sdk-runtime#api-runtime-subagent and search for: plugins.entries.<id>.subagent.allowModelOverride`
	};
	if (policy.allowAnyModel) return { allowed: true };
	if (policy.hasConfiguredAllowlist && policy.allowedModels.size === 0) return {
		allowed: false,
		reason: `plugin "${pluginId}" configured subagent.allowedModels, but none of the entries normalized to a valid provider/model target.`
	};
	if (policy.allowedModels.size === 0) return { allowed: true };
	const requestedModelRef = resolveRequestedFallbackModelRef(params);
	if (!requestedModelRef) return {
		allowed: false,
		reason: "fallback provider/model overrides that use an allowlist must resolve to a canonical provider/model target."
	};
	if (policy.allowedModels.has(requestedModelRef)) return { allowed: true };
	return {
		allowed: false,
		reason: `model override "${requestedModelRef}" is not allowlisted for plugin "${pluginId}".`
	};
}
function resolveRequestedFallbackModelRef(params) {
	if (params.provider && params.model) {
		const normalizedRequest = require_model_selection_normalize.normalizeModelRef(params.provider, params.model);
		return `${normalizedRequest.provider}/${normalizedRequest.model}`;
	}
	const rawModel = params.model?.trim();
	if (!rawModel?.includes("/")) return null;
	const parsed = require_model_selection_normalize.parseModelRef(rawModel, "");
	if (!parsed?.provider || !parsed.model) return null;
	return `${parsed.provider}/${parsed.model}`;
}
function hasAdminScope(client) {
	return (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(require_operator_scopes.ADMIN_SCOPE);
}
function canClientUseModelOverride(client) {
	return hasAdminScope(client) || client?.internal?.allowModelOverride === true;
}
function canTrustedOfficialPluginRequestScopes(params) {
	if (!params.pluginId) return false;
	if (params.pluginOrigin === "bundled" || params.pluginTrustedOfficialInstall === true) return true;
	const record = require_runtime.getActivePluginRegistry()?.plugins.find((entry) => entry.id === params.pluginId);
	return record?.origin === "bundled" || record?.trustedOfficialInstall === true;
}
function resolveRuntimeNodeInvokeSyntheticScopes(params) {
	return params.requestedScopes && canTrustedOfficialPluginRequestScopes(params) ? params.requestedScopes : void 0;
}
async function dispatchGatewayMethodInProcessRaw(method, params, options) {
	const scope = require_gateway_request_scope.getPluginRuntimeGatewayRequestScope();
	const context = scope?.context ?? require_server_plugin_fallback_context.getFallbackGatewayContext();
	const isWebchatConnect = scope?.isWebchatConnect ?? (() => false);
	if (!context) throw new Error(`In-process gateway dispatch requires a gateway request scope (method: ${method}). No scope set and no fallback context available.`);
	if (options?.requireScopedClient === true && !scope?.client) throw new Error(`In-process gateway dispatch requires an authenticated plugin request scope (method: ${method}).`);
	const pluginRuntimeOwnerId = typeof options?.pluginRuntimeOwnerId === "string" && options.pluginRuntimeOwnerId.trim() ? options.pluginRuntimeOwnerId.trim() : void 0;
	const syntheticClient = require_server_plugin_runtime_client.createSyntheticPluginRuntimeClient({
		allowModelOverride: options?.allowSyntheticModelOverride === true,
		agentRunTracking: options?.agentRunTracking,
		cronRunContinuation: options?.allowSyntheticCronRunContinuation === true,
		internalDeliveryMediaUrls: options?.internalDeliveryMediaUrls,
		internalDeliverySuppressText: options?.internalDeliverySuppressText,
		...pluginRuntimeOwnerId ? { pluginRuntimeOwnerId } : {},
		...options?.runtimePluginToolGrant ? { runtimePluginToolGrant: options.runtimePluginToolGrant } : {},
		scopes: options?.syntheticScopes
	});
	const scopedClient = require_server_plugin_runtime_client.mergePluginRuntimeClientInternal(scope?.client, pluginRuntimeOwnerId || options?.agentRunTracking || options?.runtimePluginToolGrant ? {
		...options?.agentRunTracking ? { agentRunTracking: options.agentRunTracking } : {},
		...pluginRuntimeOwnerId ? { pluginRuntimeOwnerId } : {},
		runtimePluginToolGrant: options?.runtimePluginToolGrant
	} : void 0);
	if (options?.disableSyntheticClient === true && !scopedClient) throw new Error(`In-process gateway dispatch requires a scoped client (method: ${method}).`);
	return await require_server_plugin_runtime_client.dispatchGatewayRequestInProcessRaw(method, params, {
		client: options?.forceSyntheticClient === true ? syntheticClient : scopedClient ?? (options?.disableSyntheticClient === true ? null : syntheticClient),
		context,
		expectFinal: options?.expectFinal,
		isWebchatConnect,
		onAccepted: options?.onAccepted,
		requestIdPrefix: "plugin-subagent",
		timeoutMs: options?.timeoutMs
	});
}
async function dispatchGatewayMethod(method, params, options) {
	return require_server_plugin_runtime_client.unwrapGatewayMethodDispatchResponse(method, await dispatchGatewayMethodInProcessRaw(method, params, options));
}
async function dispatchGatewayMethodInProcess(method, params, options) {
	return await dispatchGatewayMethod(method, params, options);
}
const PLUGIN_SUBAGENT_SESSION_MESSAGES_MAX_LIMIT = 1e3;
function createGatewaySubagentRuntime() {
	const getSessionMessages = async (params) => {
		const limit = params.limit == null || !Number.isFinite(params.limit) ? void 0 : Math.min(PLUGIN_SUBAGENT_SESSION_MESSAGES_MAX_LIMIT, Math.max(1, Math.floor(params.limit)));
		const payload = await dispatchGatewayMethod("sessions.get", {
			key: params.sessionKey,
			...limit != null && { limit }
		});
		return { messages: Array.isArray(payload?.messages) ? payload.messages : [] };
	};
	return {
		async run(params) {
			const scope = require_gateway_request_scope.getPluginRuntimeGatewayRequestScope();
			const pluginId = typeof scope?.pluginId === "string" && scope.pluginId.trim() ? scope.pluginId.trim() : void 0;
			const runtimePluginToolGrant = require_server_plugin_runtime_client.resolvePluginSubagentToolsAlsoAllow({
				pluginId,
				toolsAlsoAllow: params.toolsAlsoAllow
			});
			const overrideRequested = Boolean(params.provider || params.model);
			const hasRequestScopeClient = Boolean(scope?.client);
			let allowOverride = hasRequestScopeClient && canClientUseModelOverride(scope?.client ?? null);
			let allowSyntheticModelOverride = false;
			if (overrideRequested && !allowOverride && !hasRequestScopeClient) {
				const fallbackAuth = authorizeFallbackModelOverride({
					pluginId: scope?.pluginId,
					provider: params.provider,
					model: params.model
				});
				if (!fallbackAuth.allowed) throw new Error(fallbackAuth.reason);
				allowOverride = true;
				allowSyntheticModelOverride = true;
			}
			if (overrideRequested && !allowOverride) throw new Error("provider/model override is not authorized for this plugin subagent run.");
			const runId = (await dispatchGatewayMethod("agent", {
				sessionKey: params.sessionKey,
				message: params.message,
				deliver: params.deliver ?? false,
				...allowOverride && params.provider && { provider: params.provider },
				...allowOverride && params.model && { model: params.model },
				...params.extraSystemPrompt && { extraSystemPrompt: params.extraSystemPrompt },
				...params.lane && { lane: params.lane },
				...params.cwd && { cwd: params.cwd },
				...params.lightContext === true && { bootstrapContextMode: "lightweight" },
				idempotencyKey: params.idempotencyKey || (0, node_crypto.randomUUID)()
			}, {
				allowSyntheticModelOverride,
				agentRunTracking: "plugin_subagent",
				...pluginId ? { pluginRuntimeOwnerId: pluginId } : {},
				...runtimePluginToolGrant ? { runtimePluginToolGrant } : {}
			}))?.runId;
			if (typeof runId !== "string" || !runId) throw new Error("Gateway agent method returned an invalid runId.");
			return { runId };
		},
		async waitForRun(params) {
			const payload = await dispatchGatewayMethod("agent.wait", {
				runId: params.runId,
				...params.timeoutMs != null && { timeoutMs: params.timeoutMs }
			});
			let status = payload?.status;
			if (status === "completed" || status === "succeeded") status = "ok";
			else if (status === "error" && payload?.error?.trim().toLowerCase() === "completed") status = "ok";
			if (status !== "ok" && status !== "error" && status !== "timeout") throw new Error(`Gateway agent.wait returned unexpected status: ${payload?.status}`);
			return {
				status,
				...status !== "ok" && typeof payload?.error === "string" && payload.error && { error: payload.error }
			};
		},
		getSessionMessages,
		async getSession(params) {
			return getSessionMessages(params);
		},
		async deleteSession(params) {
			const scope = require_gateway_request_scope.getPluginRuntimeGatewayRequestScope();
			const pluginId = typeof scope?.pluginId === "string" && scope.pluginId.trim() ? scope.pluginId.trim() : void 0;
			const pluginOwnedCleanupOptions = pluginId ? {
				pluginRuntimeOwnerId: pluginId,
				...!hasAdminScope(scope?.client) ? {
					forceSyntheticClient: true,
					syntheticScopes: [require_operator_scopes.ADMIN_SCOPE]
				} : {}
			} : void 0;
			await dispatchGatewayMethod("sessions.delete", {
				key: params.sessionKey,
				deleteTranscript: params.deleteTranscript ?? true
			}, pluginOwnedCleanupOptions);
		}
	};
}
function createGatewayNodesRuntime() {
	return {
		async list(params) {
			const payload = await dispatchGatewayMethod("node.list", {});
			const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
			return { nodes: projectGatewayRuntimeNodes(params?.connected === true ? nodes.filter((node) => node !== null && typeof node === "object" && node.connected === true) : nodes) };
		},
		async invoke(params) {
			const scope = require_gateway_request_scope.getPluginRuntimeGatewayRequestScope();
			const pluginId = typeof scope?.pluginId === "string" && scope.pluginId.trim() ? scope.pluginId.trim() : void 0;
			const syntheticScopes = resolveRuntimeNodeInvokeSyntheticScopes({
				pluginId,
				pluginOrigin: scope?.pluginOrigin,
				pluginTrustedOfficialInstall: scope?.pluginTrustedOfficialInstall,
				requestedScopes: require_operator_scopes.normalizeOperatorScopeList(params.scopes)
			});
			return await dispatchGatewayMethod("node.invoke", {
				nodeId: params.nodeId,
				command: params.command,
				...params.params !== void 0 && { params: params.params },
				timeoutMs: params.timeoutMs,
				idempotencyKey: params.idempotencyKey || (0, node_crypto.randomUUID)()
			}, {
				...pluginId ? { pluginRuntimeOwnerId: pluginId } : {},
				...syntheticScopes ? {
					forceSyntheticClient: true,
					syntheticScopes
				} : {}
			});
		}
	};
}
function createGatewayPluginRegistrationLogger(params) {
	const logger = require_load_context.createPluginRuntimeLoaderLogger();
	if (params?.suppressInfoLogs !== true) return logger;
	return {
		...logger,
		info: (_message) => void 0
	};
}
function loadGatewayPlugins(params) {
	const started = node_perf_hooks.performance.now();
	const activationAutoEnabled = params.activationSourceConfig !== void 0 && params.autoEnabledReasons === void 0 ? require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.activationSourceConfig,
		env: process.env,
		...params.pluginLookUpTable?.manifestRegistry ? { manifestRegistry: params.pluginLookUpTable.manifestRegistry } : {},
		discovery: params.pluginLookUpTable?.discovery
	}) : void 0;
	const autoEnableMs = node_perf_hooks.performance.now() - started;
	const autoEnabled = params.activationSourceConfig !== void 0 ? {
		config: params.cfg,
		changes: activationAutoEnabled?.changes ?? [],
		autoEnabledReasons: params.autoEnabledReasons ?? activationAutoEnabled?.autoEnabledReasons ?? {}
	} : params.autoEnabledReasons !== void 0 ? {
		config: params.cfg,
		changes: [],
		autoEnabledReasons: params.autoEnabledReasons
	} : require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.cfg,
		env: process.env,
		...params.pluginLookUpTable?.manifestRegistry ? { manifestRegistry: params.pluginLookUpTable.manifestRegistry } : {},
		discovery: params.pluginLookUpTable?.discovery
	});
	const resolvedConfigMs = node_perf_hooks.performance.now() - started;
	const resolvedConfig = autoEnabled.config;
	const pluginIds = params.pluginIds ?? [...(params.pluginLookUpTable ?? require_plugin_lookup_table.loadPluginLookUpTable({
		config: resolvedConfig,
		activationSourceConfig: params.activationSourceConfig,
		workspaceDir: params.workspaceDir,
		env: process.env
	})).startup.pluginIds];
	const pluginIdsMs = node_perf_hooks.performance.now() - started;
	if (pluginIds.length === 0) {
		require_loader.clearActivatedPluginRuntimeState();
		const pluginRegistry = require_runtime.createEmptyPluginRegistry();
		require_runtime.setActivePluginRegistry(pluginRegistry, void 0, "gateway-bindable", params.workspaceDir);
		params.startupTrace?.detail("plugins.gateway-load", [
			["autoEnableMs", autoEnableMs],
			["resolvedConfigMs", resolvedConfigMs],
			["pluginIdsMs", pluginIdsMs],
			["loadMs", 0],
			["pluginIds", "0"],
			["pluginCount", 0],
			["gatewayHandlerCount", 0]
		]);
		return {
			pluginRegistry,
			gatewayMethods: [...params.baseMethods]
		};
	}
	const beforeLoad = node_perf_hooks.performance.now();
	const loaderStatsBefore = require_plugin_module_loader_cache.getPluginModuleLoaderStats();
	const pluginRegistry = require_loader.loadOperatorPlugins({
		config: resolvedConfig,
		activationSourceConfig: params.activationSourceConfig ?? params.cfg,
		autoEnabledReasons: autoEnabled.autoEnabledReasons,
		workspaceDir: params.workspaceDir,
		onlyPluginIds: pluginIds,
		logger: createGatewayPluginRegistrationLogger({ suppressInfoLogs: params.suppressPluginInfoLogs }),
		...params.coreGatewayHandlers !== void 0 && { coreGatewayHandlers: params.coreGatewayHandlers },
		...params.coreGatewayMethodNames !== void 0 && { coreGatewayMethodNames: params.coreGatewayMethodNames },
		...params.hostServices !== void 0 && { hostServices: params.hostServices },
		runtimeOptions: { allowGatewaySubagentBinding: true },
		preferSetupRuntimeForChannelPlugins: params.preferSetupRuntimeForChannelPlugins,
		preferBuiltPluginArtifacts: true,
		...params.startupTrace !== void 0 && { startupTrace: params.startupTrace },
		...params.pluginLookUpTable?.manifestRegistry ? { manifestRegistry: params.pluginLookUpTable.manifestRegistry } : {}
	});
	const loadMs = node_perf_hooks.performance.now() - beforeLoad;
	const loaderStatsAfter = require_plugin_module_loader_cache.getPluginModuleLoaderStats();
	const pluginMethods = Object.keys(pluginRegistry.gatewayHandlers);
	const gatewayMethods = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...params.baseMethods, ...pluginMethods]);
	params.startupTrace?.detail("plugins.gateway-load", [
		["autoEnableMs", autoEnableMs],
		["resolvedConfigMs", resolvedConfigMs],
		["pluginIdsMs", pluginIdsMs],
		["loadMs", loadMs],
		["pluginIds", String(pluginIds.length)],
		["pluginCount", pluginIds.length],
		["gatewayHandlers", String(pluginMethods.length)],
		["gatewayHandlerCount", pluginMethods.length],
		["loaderCallsCount", loaderStatsAfter.calls - loaderStatsBefore.calls],
		["loaderNativeHitsCount", loaderStatsAfter.nativeHits - loaderStatsBefore.nativeHits],
		["loaderNativeMissesCount", loaderStatsAfter.nativeMisses - loaderStatsBefore.nativeMisses],
		["loaderSourceTransformForcedCount", loaderStatsAfter.sourceTransformForced - loaderStatsBefore.sourceTransformForced],
		["loaderSourceTransformFallbacksCount", loaderStatsAfter.sourceTransformFallbacks - loaderStatsBefore.sourceTransformFallbacks],
		["loaderTopSourceTransformTargets", loaderStatsAfter.topSourceTransformTargets.slice(0, 3).map((entry) => `${entry.count}:${entry.target}`).join(",")]
	]);
	return {
		pluginRegistry,
		gatewayMethods
	};
}
//#endregion
Object.defineProperty(exports, "createGatewayNodesRuntime", {
	enumerable: true,
	get: function() {
		return createGatewayNodesRuntime;
	}
});
Object.defineProperty(exports, "createGatewaySubagentRuntime", {
	enumerable: true,
	get: function() {
		return createGatewaySubagentRuntime;
	}
});
Object.defineProperty(exports, "dispatchGatewayMethodInProcess", {
	enumerable: true,
	get: function() {
		return dispatchGatewayMethodInProcess;
	}
});
Object.defineProperty(exports, "hasInProcessGatewayContext", {
	enumerable: true,
	get: function() {
		return hasInProcessGatewayContext;
	}
});
Object.defineProperty(exports, "loadGatewayPlugins", {
	enumerable: true,
	get: function() {
		return loadGatewayPlugins;
	}
});
Object.defineProperty(exports, "setPluginSubagentOverridePolicies", {
	enumerable: true,
	get: function() {
		return setPluginSubagentOverridePolicies;
	}
});
