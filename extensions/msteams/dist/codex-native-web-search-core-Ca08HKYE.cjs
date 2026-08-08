require("./utils-CXqBhRFw.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_sender_tool_policy = require("./sender-tool-policy-BpwQcnDR.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
const require_codex_native_web_search_shared = require("./codex-native-web-search.shared-BEYpYcyR.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/agents/web-search-tool-policy.ts
/** Resolves current and sender-independent policy for the managed web_search tool. */
function resolveWebSearchToolPolicy(params) {
	const { agentId, globalPolicy, globalProviderPolicy, agentPolicy, agentProviderPolicy, profile, providerProfile, profileAlsoAllow, providerProfileAlsoAllow } = require_agent_tools_policy.resolveEffectiveToolPolicy({
		config: params.config,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const profilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), profileAlsoAllow);
	const providerProfilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(providerProfile), providerProfileAlsoAllow);
	const groupPolicyParams = {
		config: params.config,
		sessionKey: params.sessionKey,
		spawnedBy: params.spawnedBy,
		messageProvider: params.messageProvider,
		groupId: params.groupId,
		groupChannel: params.groupChannel,
		groupSpace: params.groupSpace,
		accountId: params.agentAccountId
	};
	const groupPolicy = require_agent_tools_policy.resolveGroupToolPolicy({
		...groupPolicyParams,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	const persistentGroupPolicy = require_agent_tools_policy.resolveGroupToolPolicy(groupPolicyParams);
	const senderPolicyParams = {
		config: params.config,
		agentId,
		messageProvider: params.messageProvider
	};
	const senderPolicy = require_sender_tool_policy.resolveSenderToolPolicy({
		...senderPolicyParams,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	const persistentSenderPolicy = require_sender_tool_policy.resolveSenderToolPolicy(senderPolicyParams);
	const subagentStore = require_subagent_capabilities.resolveSubagentCapabilityStore(params.sessionKey, { cfg: params.config });
	const subagentPolicy = params.sessionKey && require_subagent_capabilities.isSubagentEnvelopeSession(params.sessionKey, {
		cfg: params.config,
		store: subagentStore
	}) ? require_agent_tools_policy.resolveSubagentToolPolicyForSession(params.config, params.sessionKey, { store: subagentStore }) : void 0;
	const inheritedToolPolicy = require_agent_tools_policy.resolveInheritedToolPolicyForSession(params.config, params.sessionKey, { store: subagentStore });
	const fixedPolicies = [
		profilePolicy,
		providerProfilePolicy,
		globalPolicy,
		globalProviderPolicy,
		agentPolicy,
		agentProviderPolicy
	];
	const trailingPolicies = [
		params.sandboxToolPolicy,
		subagentPolicy,
		inheritedToolPolicy
	];
	return {
		allowed: require_tool_policy_match.isToolAllowedByPolicies("web_search", [
			...fixedPolicies,
			groupPolicy,
			senderPolicy,
			...trailingPolicies
		]),
		persistentAllowed: require_tool_policy_match.isToolAllowedByPolicies("web_search", [
			...fixedPolicies,
			persistentGroupPolicy,
			persistentSenderPolicy,
			...trailingPolicies
		])
	};
}
//#endregion
//#region src/agents/codex-native-web-search-core.ts
const OPENAI_AUTH_PROVIDER_IDS = ["openai"];
function isOpenAIAuthProviderId(provider) {
	return OPENAI_AUTH_PROVIDER_IDS.some((candidate) => candidate === provider);
}
/** Returns whether a model API can accept the native Codex web_search tool. */
function isCodexNativeSearchEligibleModel(params) {
	return params.modelApi === "openai-chatgpt-responses";
}
function hasCodexNativeWebSearchTool(tools) {
	if (!Array.isArray(tools)) return false;
	return tools.some((tool) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(tool) && typeof tool.type === "string" && tool.type === "web_search");
}
/** Checks whether OpenAI/Codex auth is available for native web search. */
function hasAvailableCodexAuth(params) {
	if (Object.values(params.config?.auth?.profiles ?? {}).some((profile) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(profile) && isOpenAIAuthProviderId(profile.provider) && (profile.mode === "oauth" || profile.mode === "token"))) return true;
	if (params.agentDir) try {
		const store = require_store.ensureAuthProfileStore(params.agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({
			cfg: params.config,
			provider: "openai"
		}) });
		if (OPENAI_AUTH_PROVIDER_IDS.some((provider) => require_profile_list.listProfilesForProvider(store, provider).length > 0)) return true;
	} catch {}
	return false;
}
/** Resolves whether native search is active or why managed search should remain. */
function resolveCodexNativeSearchActivation(params) {
	const globalWebSearchEnabled = params.config?.tools?.web?.search?.enabled !== false;
	const codexConfig = require_codex_native_web_search_shared.resolveCodexNativeWebSearchConfig(params.config);
	const nativeEligible = isCodexNativeSearchEligibleModel(params);
	const hasRequiredAuth = params.modelApi !== "openai-chatgpt-responses" || !isOpenAIAuthProviderId(params.modelProvider) || hasAvailableCodexAuth(params);
	if (!globalWebSearchEnabled) return {
		globalWebSearchEnabled,
		codexNativeEnabled: codexConfig.enabled,
		codexMode: codexConfig.mode,
		nativeEligible,
		hasRequiredAuth,
		state: "managed_only",
		inactiveReason: "globally_disabled"
	};
	if (!codexConfig.enabled) return {
		globalWebSearchEnabled,
		codexNativeEnabled: false,
		codexMode: codexConfig.mode,
		nativeEligible,
		hasRequiredAuth,
		state: "managed_only",
		inactiveReason: "codex_not_enabled"
	};
	if (!nativeEligible) return {
		globalWebSearchEnabled,
		codexNativeEnabled: true,
		codexMode: codexConfig.mode,
		nativeEligible: false,
		hasRequiredAuth,
		state: "managed_only",
		inactiveReason: "model_not_eligible"
	};
	if (!hasRequiredAuth) return {
		globalWebSearchEnabled,
		codexNativeEnabled: true,
		codexMode: codexConfig.mode,
		nativeEligible: true,
		hasRequiredAuth: false,
		state: "managed_only",
		inactiveReason: "codex_auth_missing"
	};
	if (!isNativeWebSearchAllowedByToolPolicy(params)) return {
		globalWebSearchEnabled,
		codexNativeEnabled: true,
		codexMode: codexConfig.mode,
		nativeEligible: true,
		hasRequiredAuth: true,
		state: "managed_only",
		inactiveReason: "tool_policy_denied"
	};
	return {
		globalWebSearchEnabled,
		codexNativeEnabled: true,
		codexMode: codexConfig.mode,
		nativeEligible: true,
		hasRequiredAuth: true,
		state: "native_active"
	};
}
function isNativeWebSearchAllowedByToolPolicy(params) {
	return resolveWebSearchToolPolicy(params).allowed;
}
/** Builds the OpenAI Responses `web_search` tool payload from config. */
function buildCodexNativeWebSearchTool(config) {
	const nativeConfig = require_codex_native_web_search_shared.resolveCodexNativeWebSearchConfig(config);
	const tool = {
		type: "web_search",
		external_web_access: nativeConfig.mode === "live"
	};
	if (nativeConfig.allowedDomains) tool.filters = { allowed_domains: nativeConfig.allowedDomains };
	if (nativeConfig.contextSize) tool.search_context_size = nativeConfig.contextSize;
	if (nativeConfig.userLocation) tool.user_location = {
		type: "approximate",
		...nativeConfig.userLocation
	};
	return tool;
}
/** Injects a native Codex web-search tool into a mutable provider payload. */
function patchCodexNativeWebSearchPayload(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.payload)) return { status: "payload_not_object" };
	const payload = params.payload;
	if (hasCodexNativeWebSearchTool(payload.tools)) return { status: "native_tool_already_present" };
	const tools = Array.isArray(payload.tools) ? [...payload.tools] : [];
	tools.push(buildCodexNativeWebSearchTool(params.config));
	payload.tools = tools;
	return { status: "injected" };
}
/** Returns whether the managed Operator web-search tool should be hidden. */
function shouldSuppressManagedWebSearchTool(params) {
	return resolveCodexNativeSearchActivation(params).state === "native_active";
}
//#endregion
Object.defineProperty(exports, "buildCodexNativeWebSearchTool", {
	enumerable: true,
	get: function() {
		return buildCodexNativeWebSearchTool;
	}
});
Object.defineProperty(exports, "hasAvailableCodexAuth", {
	enumerable: true,
	get: function() {
		return hasAvailableCodexAuth;
	}
});
Object.defineProperty(exports, "isCodexNativeSearchEligibleModel", {
	enumerable: true,
	get: function() {
		return isCodexNativeSearchEligibleModel;
	}
});
Object.defineProperty(exports, "isNativeWebSearchAllowedByToolPolicy", {
	enumerable: true,
	get: function() {
		return isNativeWebSearchAllowedByToolPolicy;
	}
});
Object.defineProperty(exports, "patchCodexNativeWebSearchPayload", {
	enumerable: true,
	get: function() {
		return patchCodexNativeWebSearchPayload;
	}
});
Object.defineProperty(exports, "resolveCodexNativeSearchActivation", {
	enumerable: true,
	get: function() {
		return resolveCodexNativeSearchActivation;
	}
});
Object.defineProperty(exports, "shouldSuppressManagedWebSearchTool", {
	enumerable: true,
	get: function() {
		return shouldSuppressManagedWebSearchTool;
	}
});
