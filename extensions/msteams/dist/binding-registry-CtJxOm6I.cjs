const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_acp_core_normalize_text = require("@gabrielvfonseca/acp-core/normalize-text");
//#region src/acp/persistent-bindings.types.ts
/** Types and normalization helpers for configured channel-to-ACP persistent bindings. */
/** Normalizes binding mode, defaulting to persistent sessions. */
function normalizeMode(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) === "oneshot" ? "oneshot" : "persistent";
}
/** Extracts supported ACP binding config keys from unknown plugin config. */
function normalizeBindingConfig(raw) {
	if (!raw || typeof raw !== "object") return {};
	const shape = raw;
	const mode = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(shape.mode);
	return {
		mode: mode ? normalizeMode(mode) : void 0,
		cwd: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(shape.cwd),
		backend: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(shape.backend),
		label: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(shape.label)
	};
}
function buildBindingHash(params) {
	return require_crypto_digest.sha256HexPrefix(`${params.channel}:${params.accountId}:${params.conversationId}`, 16);
}
/** Builds the stable generated ACP session key for a configured binding. */
function buildConfiguredAcpSessionKey(spec) {
	const hash = buildBindingHash({
		channel: spec.channel,
		accountId: spec.accountId,
		conversationId: spec.conversationId
	});
	return `agent:${require_session_key.sanitizeAgentId(spec.agentId)}:acp:binding:${spec.channel}:${spec.accountId}:${hash}`;
}
/** Converts a configured ACP binding spec into an outbound session binding record. */
function toConfiguredAcpBindingRecord(spec) {
	return {
		bindingId: `config:acp:${spec.channel}:${spec.accountId}:${spec.conversationId}`,
		targetSessionKey: buildConfiguredAcpSessionKey(spec),
		targetKind: "session",
		conversation: {
			channel: spec.channel,
			accountId: spec.accountId,
			conversationId: spec.conversationId,
			parentConversationId: spec.parentConversationId
		},
		status: "active",
		boundAt: 0,
		metadata: {
			source: "config",
			mode: spec.mode,
			agentId: spec.agentId,
			...spec.acpAgentId ? { acpAgentId: spec.acpAgentId } : {},
			label: spec.label,
			...spec.backend ? { backend: spec.backend } : {},
			...spec.cwd ? { cwd: spec.cwd } : {}
		}
	};
}
/** Parses generated configured-binding session keys back to channel/account identity. */
function parseConfiguredAcpSessionKey(sessionKey) {
	const trimmed = sessionKey.trim();
	if (!trimmed.startsWith("agent:")) return null;
	const rest = trimmed.slice(trimmed.indexOf(":") + 1);
	const nextSeparator = rest.indexOf(":");
	if (nextSeparator === -1) return null;
	const tokens = rest.slice(nextSeparator + 1).split(":");
	if (tokens.length !== 5 || tokens[0] !== "acp" || tokens[1] !== "binding") return null;
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(tokens[2]);
	if (!channel) return null;
	return {
		channel,
		accountId: require_account_id.normalizeAccountId(tokens[3] ?? "default")
	};
}
function resolveConfiguredAcpBindingSpecFromRecord(record) {
	if (record.targetKind !== "session") return null;
	const conversationId = record.conversation.conversationId.trim();
	if (!conversationId) return null;
	const agentId = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(record.metadata?.agentId) ?? require_session_key.resolveAgentIdFromSessionKey(record.targetSessionKey);
	if (!agentId) return null;
	return {
		channel: record.conversation.channel,
		accountId: require_account_id.normalizeAccountId(record.conversation.accountId),
		conversationId,
		parentConversationId: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(record.conversation.parentConversationId),
		agentId,
		acpAgentId: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(record.metadata?.acpAgentId),
		mode: normalizeMode(record.metadata?.mode),
		cwd: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(record.metadata?.cwd),
		backend: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(record.metadata?.backend),
		label: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(record.metadata?.label)
	};
}
//#endregion
//#region src/channels/plugins/acp-configured-binding-consumer.ts
/**
* ACP configured binding consumer.
*
* Converts channel configured-binding rules into persistent ACP binding records.
*/
function resolveAgentRuntimeAcpDefaults(params) {
	const ownerAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.ownerAgentId);
	const agent = params.cfg.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.id) === ownerAgentId);
	if (agent?.runtime?.type !== "acp") return {};
	return {
		acpAgentId: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(agent.runtime.acp?.agent),
		mode: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(agent.runtime.acp?.mode),
		cwd: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(agent.runtime.acp?.cwd),
		backend: (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(agent.runtime.acp?.backend)
	};
}
function resolveConfiguredBindingWorkspaceCwd(params) {
	if ((0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId)?.workspace)) return require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId);
	if (params.agentId === require_agent_scope_config.resolveDefaultAgentId(params.cfg)) {
		if ((0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(params.cfg.agents?.defaults?.workspace)) return require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId);
	}
}
function buildConfiguredAcpSpec(params) {
	return {
		channel: params.channel,
		accountId: params.accountId,
		conversationId: params.conversation.conversationId,
		parentConversationId: params.conversation.parentConversationId,
		agentId: params.agentId,
		acpAgentId: params.acpAgentId,
		mode: params.mode,
		cwd: params.cwd,
		backend: params.backend,
		label: params.label
	};
}
function buildAcpTargetFactory(params) {
	if (params.binding.type !== "acp") return null;
	const runtimeDefaults = resolveAgentRuntimeAcpDefaults({
		cfg: params.cfg,
		ownerAgentId: params.agentId
	});
	const bindingOverrides = normalizeBindingConfig(params.binding.acp);
	const mode = normalizeMode(bindingOverrides.mode ?? runtimeDefaults.mode);
	const cwd = bindingOverrides.cwd ?? runtimeDefaults.cwd ?? resolveConfiguredBindingWorkspaceCwd({
		cfg: params.cfg,
		agentId: params.agentId
	});
	const backend = bindingOverrides.backend ?? runtimeDefaults.backend;
	const label = bindingOverrides.label;
	const acpAgentId = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(runtimeDefaults.acpAgentId);
	return {
		driverId: "acp",
		materialize: ({ accountId, conversation }) => {
			const spec = buildConfiguredAcpSpec({
				channel: params.channel,
				accountId,
				conversation,
				agentId: params.agentId,
				acpAgentId,
				mode,
				cwd,
				backend,
				label
			});
			return {
				record: toConfiguredAcpBindingRecord(spec),
				statefulTarget: {
					kind: "stateful",
					driverId: "acp",
					sessionKey: buildConfiguredAcpSessionKey(spec),
					agentId: params.agentId,
					...label ? { label } : {}
				}
			};
		}
	};
}
/**
* Configured binding consumer that materializes ACP persistent or oneshot targets.
*/
const acpConfiguredBindingConsumer = {
	id: "acp",
	supports: (binding) => binding.type === "acp",
	buildTargetFactory: (params) => buildAcpTargetFactory({
		cfg: params.cfg,
		binding: params.binding,
		channel: params.channel,
		agentId: params.agentId
	}),
	parseSessionKey: ({ sessionKey }) => parseConfiguredAcpSessionKey(sessionKey),
	matchesSessionKey: ({ sessionKey, materializedTarget }) => materializedTarget.record.targetSessionKey === sessionKey
};
//#endregion
//#region src/channels/plugins/configured-binding-consumers.ts
const registeredConfiguredBindingConsumers = /* @__PURE__ */ new Map();
/**
* Lists registered configured binding consumers in registration order.
*/
function listConfiguredBindingConsumers() {
	return [...registeredConfiguredBindingConsumers.values()];
}
/**
* Finds the first configured binding consumer that supports a raw binding rule.
*/
function resolveConfiguredBindingConsumer(binding) {
	for (const consumer of listConfiguredBindingConsumers()) if (consumer.supports(binding)) return consumer;
	return null;
}
/**
* Registers a configured binding consumer idempotently by trimmed id.
*/
function registerConfiguredBindingConsumer(consumer) {
	const id = consumer.id.trim();
	if (!id) throw new Error("Configured binding consumer id is required");
	if (registeredConfiguredBindingConsumers.get(id)) return;
	registeredConfiguredBindingConsumers.set(id, {
		...consumer,
		id
	});
}
//#endregion
//#region src/channels/plugins/configured-binding-builtins.ts
/**
* Configured binding built-in registration.
*
* Registers core configured binding consumers exactly when the registry facade needs them.
*/
/**
* Registers configured binding consumers bundled with core.
*/
function ensureConfiguredBindingBuiltinsRegistered() {
	registerConfiguredBindingConsumer(acpConfiguredBindingConsumer);
}
//#endregion
//#region src/channels/plugins/binding-provider.ts
/**
* Returns the configured binding provider exposed by a channel plugin, when present.
*/
function resolveChannelConfiguredBindingProvider(plugin) {
	return plugin?.bindings;
}
//#endregion
//#region src/channels/plugins/configured-binding-compiler.ts
/**
* Configured binding compiler.
*
* Compiles config rules into channel/provider-specific binding registry entries.
*/
function resolveLoadedChannelPlugin(channel) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!normalized) return;
	return require_registry.getChannelPlugin(normalized);
}
function resolveConfiguredBindingAdapter(channel) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!normalized) return null;
	const plugin = resolveLoadedChannelPlugin(normalized);
	const provider = resolveChannelConfiguredBindingProvider(plugin);
	if (!plugin || !provider?.compileConfiguredBinding || !provider.matchInboundConversation) return null;
	return {
		channel: plugin.id,
		provider
	};
}
function resolveBindingConversationId(binding) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.match?.peer?.id) ?? null;
}
function compileConfiguredBindingTarget(params) {
	return params.provider.compileConfiguredBinding({
		binding: params.binding,
		conversationId: params.conversationId
	});
}
function compileConfiguredBindingRule(params) {
	const agentId = require_resolve_route.pickFirstExistingAgentId(params.cfg, params.binding.agentId ?? "main");
	const consumer = resolveConfiguredBindingConsumer(params.binding);
	if (!consumer) return null;
	const targetFactory = consumer.buildTargetFactory({
		cfg: params.cfg,
		binding: params.binding,
		channel: params.channel,
		agentId,
		target: params.target,
		bindingConversationId: params.bindingConversationId
	});
	if (!targetFactory) return null;
	return {
		channel: params.channel,
		accountPattern: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.binding.match.accountId),
		binding: params.binding,
		bindingConversationId: params.bindingConversationId,
		target: params.target,
		agentId,
		provider: params.provider,
		targetFactory
	};
}
function pushCompiledRule(target, rule) {
	const existing = target.get(rule.channel);
	if (existing) {
		existing.push(rule);
		return;
	}
	target.set(rule.channel, [rule]);
}
function compileConfiguredBindingRegistry(params) {
	const rulesByChannel = /* @__PURE__ */ new Map();
	for (const binding of require_bindings.listConfiguredBindings(params.cfg)) {
		const bindingConversationId = resolveBindingConversationId(binding);
		if (!bindingConversationId) continue;
		const resolvedChannel = resolveConfiguredBindingAdapter(binding.match.channel);
		if (!resolvedChannel) continue;
		const target = compileConfiguredBindingTarget({
			provider: resolvedChannel.provider,
			binding,
			conversationId: bindingConversationId
		});
		if (!target) continue;
		const rule = compileConfiguredBindingRule({
			cfg: params.cfg,
			channel: resolvedChannel.channel,
			binding,
			target,
			bindingConversationId,
			provider: resolvedChannel.provider
		});
		if (!rule) continue;
		pushCompiledRule(rulesByChannel, rule);
	}
	return { rulesByChannel };
}
function resolveCompiledBindingRegistry(cfg) {
	return compileConfiguredBindingRegistry({ cfg });
}
function primeCompiledBindingRegistry(cfg) {
	return compileConfiguredBindingRegistry({ cfg });
}
function countCompiledBindingRegistry(registry) {
	return {
		bindingCount: [...registry.rulesByChannel.values()].reduce((sum, rules) => sum + rules.length, 0),
		channelCount: registry.rulesByChannel.size
	};
}
//#endregion
//#region src/channels/plugins/configured-binding-match.ts
/**
* Configured binding matching helpers.
*
* Matches compiled binding rules against inbound conversations and materializes targets.
*/
/**
* Ranks account pattern matches for configured binding rules.
*/
function resolveAccountMatchPriority(match, actual) {
	const trimmed = (match ?? "").trim();
	if (!trimmed) return actual === "default" ? 2 : 0;
	if (trimmed === "*") return 1;
	return require_account_id.normalizeAccountId(trimmed) === actual ? 2 : 0;
}
function matchCompiledBindingConversation(params) {
	return params.rule.provider.matchInboundConversation({
		binding: params.rule.binding,
		compiledBinding: params.rule.target,
		conversationId: params.conversationId,
		parentConversationId: params.parentConversationId
	});
}
/**
* Normalizes a raw channel id into a configured-binding channel id.
*/
function resolveCompiledBindingChannel(raw) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	return normalized ? normalized : null;
}
/**
* Converts an outbound conversation ref into configured-binding match input.
*/
function toConfiguredBindingConversationRef(conversation) {
	const channel = resolveCompiledBindingChannel(conversation.channel);
	const conversationId = conversation.conversationId.trim();
	if (!channel || !conversationId) return null;
	return {
		channel,
		accountId: require_account_id.normalizeAccountId(conversation.accountId),
		conversationId,
		parentConversationId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(conversation.parentConversationId)
	};
}
/**
* Materializes a configured binding record from the winning rule and conversation.
*/
function materializeConfiguredBindingRecord(params) {
	return params.rule.targetFactory.materialize({
		accountId: require_account_id.normalizeAccountId(params.accountId),
		conversation: params.conversation
	});
}
/**
* Resolves the best configured binding rule for a conversation.
*/
function resolveMatchingConfiguredBinding(params) {
	if (!params.conversation) return null;
	let wildcardMatch = null;
	let exactMatch = null;
	for (const rule of params.rules) {
		const accountMatchPriority = resolveAccountMatchPriority(rule.accountPattern, params.conversation.accountId);
		if (accountMatchPriority === 0) continue;
		const match = matchCompiledBindingConversation({
			rule,
			conversationId: params.conversation.conversationId,
			parentConversationId: params.conversation.parentConversationId
		});
		if (!match) continue;
		const matchPriority = match.matchPriority ?? 0;
		if (accountMatchPriority === 2) {
			if (!exactMatch || matchPriority > (exactMatch.match.matchPriority ?? 0)) exactMatch = {
				rule,
				match
			};
			continue;
		}
		if (!wildcardMatch || matchPriority > (wildcardMatch.match.matchPriority ?? 0)) wildcardMatch = {
			rule,
			match
		};
	}
	return exactMatch ?? wildcardMatch;
}
//#endregion
//#region src/channels/plugins/configured-binding-session-lookup.ts
/**
* Resolves a configured binding record from a stateful target session key.
*/
function resolveConfiguredBindingRecordBySessionKeyFromRegistry(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey) return null;
	for (const consumer of listConfiguredBindingConsumers()) {
		const parsed = consumer.parseSessionKey?.({ sessionKey });
		if (!parsed) continue;
		const channel = resolveCompiledBindingChannel(parsed.channel);
		if (!channel) continue;
		const rules = params.registry.rulesByChannel.get(channel);
		if (!rules || rules.length === 0) continue;
		let wildcardMatch = null;
		let exactMatch = null;
		for (const rule of rules) {
			if (rule.targetFactory.driverId !== consumer.id) continue;
			const accountMatchPriority = resolveAccountMatchPriority(rule.accountPattern, parsed.accountId);
			if (accountMatchPriority === 0) continue;
			const materializedTarget = materializeConfiguredBindingRecord({
				rule,
				accountId: parsed.accountId,
				conversation: rule.target
			});
			if (consumer.matchesSessionKey?.({
				sessionKey,
				compiledBinding: rule,
				accountId: parsed.accountId,
				materializedTarget
			}) ?? materializedTarget.record.targetSessionKey === sessionKey) {
				if (accountMatchPriority === 2) {
					exactMatch = materializedTarget;
					break;
				}
				wildcardMatch = materializedTarget;
			}
		}
		if (exactMatch) return exactMatch;
		if (wildcardMatch) return wildcardMatch;
	}
	return null;
}
//#endregion
//#region src/channels/plugins/configured-binding-registry.ts
function resolveMaterializedConfiguredBinding(params) {
	const conversation = toConfiguredBindingConversationRef(params.conversation);
	if (!conversation) return null;
	const rules = resolveCompiledBindingRegistry(params.cfg).rulesByChannel.get(conversation.channel);
	if (!rules || rules.length === 0) return null;
	const resolved = resolveMatchingConfiguredBinding({
		rules,
		conversation
	});
	if (!resolved) return null;
	return {
		conversation,
		resolved,
		materializedTarget: materializeConfiguredBindingRecord({
			rule: resolved.rule,
			accountId: conversation.accountId,
			conversation: resolved.match
		})
	};
}
/**
* Warms and counts the compiled configured binding registry for a config snapshot.
*/
function primeConfiguredBindingRegistry$1(params) {
	return countCompiledBindingRegistry(primeCompiledBindingRegistry(params.cfg));
}
/**
* Resolves a configured binding record from explicit channel/account/conversation ids.
*/
function resolveConfiguredBindingRecord$1(params) {
	const conversation = toConfiguredBindingConversationRef({
		channel: params.channel,
		accountId: params.accountId,
		conversationId: params.conversationId,
		parentConversationId: params.parentConversationId
	});
	if (!conversation) return null;
	return resolveConfiguredBindingRecordForConversation({
		cfg: params.cfg,
		conversation
	});
}
/**
* Resolves a configured binding record from a normalized conversation reference.
*/
function resolveConfiguredBindingRecordForConversation(params) {
	const resolved = resolveMaterializedConfiguredBinding(params);
	if (!resolved) return null;
	return resolved.materializedTarget;
}
/**
* Resolves a configured binding record by the stateful target session key.
*/
function resolveConfiguredBindingRecordBySessionKey$1(params) {
	return resolveConfiguredBindingRecordBySessionKeyFromRegistry({
		registry: resolveCompiledBindingRegistry(params.cfg),
		sessionKey: params.sessionKey
	});
}
//#endregion
//#region src/channels/plugins/binding-registry.ts
/**
* Configured binding registry public facade.
*
* Lazily registers built-in binding providers before resolving configured bindings.
*/
function primeConfiguredBindingRegistry(...args) {
	ensureConfiguredBindingBuiltinsRegistered();
	return primeConfiguredBindingRegistry$1(...args);
}
function resolveConfiguredBindingRecord(...args) {
	ensureConfiguredBindingBuiltinsRegistered();
	return resolveConfiguredBindingRecord$1(...args);
}
function resolveConfiguredBindingRecordBySessionKey(...args) {
	ensureConfiguredBindingBuiltinsRegistered();
	return resolveConfiguredBindingRecordBySessionKey$1(...args);
}
//#endregion
Object.defineProperty(exports, "buildConfiguredAcpSessionKey", {
	enumerable: true,
	get: function() {
		return buildConfiguredAcpSessionKey;
	}
});
Object.defineProperty(exports, "normalizeBindingConfig", {
	enumerable: true,
	get: function() {
		return normalizeBindingConfig;
	}
});
Object.defineProperty(exports, "primeConfiguredBindingRegistry", {
	enumerable: true,
	get: function() {
		return primeConfiguredBindingRegistry;
	}
});
Object.defineProperty(exports, "resolveConfiguredAcpBindingSpecFromRecord", {
	enumerable: true,
	get: function() {
		return resolveConfiguredAcpBindingSpecFromRecord;
	}
});
Object.defineProperty(exports, "resolveConfiguredBindingRecord", {
	enumerable: true,
	get: function() {
		return resolveConfiguredBindingRecord;
	}
});
Object.defineProperty(exports, "resolveConfiguredBindingRecordBySessionKey", {
	enumerable: true,
	get: function() {
		return resolveConfiguredBindingRecordBySessionKey;
	}
});
