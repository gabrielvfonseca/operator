require("./account-id-Di7YWYh4.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
const require_binding_registry = require("./binding-registry-CtJxOm6I.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/acp-reset-target.ts
const acpResetTargetDeps = {
	getSessionBindingService: require_session_binding_service.getSessionBindingService,
	listAcpBindings: require_bindings.listAcpBindings,
	resolveConfiguredBindingRecord: require_binding_registry.resolveConfiguredBindingRecord
};
const acpResetTargetTestApi = { setDepsForTest(overrides) {
	acpResetTargetDeps.getSessionBindingService = overrides?.getSessionBindingService ?? require_session_binding_service.getSessionBindingService;
	acpResetTargetDeps.listAcpBindings = overrides?.listAcpBindings ?? require_bindings.listAcpBindings;
	acpResetTargetDeps.resolveConfiguredBindingRecord = overrides?.resolveConfiguredBindingRecord ?? require_binding_registry.resolveConfiguredBindingRecord;
} };
if (process.env.VITEST || false) globalThis[Symbol.for("operator.acpResetTargetTestApi")] = acpResetTargetTestApi;
function resolveResetTargetAccountId(params) {
	const explicit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId) ?? "";
	if (explicit) return explicit;
	const configuredDefault = params.cfg.channels[params.channel]?.defaultAccount;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredDefault) ?? "default";
}
function resolveRawConfiguredAcpSessionKey(params) {
	for (const binding of acpResetTargetDeps.listAcpBindings(params.cfg)) {
		const bindingChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.match.channel));
		if (!bindingChannel || bindingChannel !== params.channel) continue;
		const bindingAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.match.accountId) ?? "";
		if (bindingAccountId && bindingAccountId !== "*" && bindingAccountId !== params.accountId) continue;
		const peerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.match.peer?.id) ?? "";
		const matchedConversationId = peerId === params.conversationId ? params.conversationId : peerId && peerId === params.parentConversationId ? params.parentConversationId : void 0;
		if (!matchedConversationId) continue;
		const acp = require_binding_registry.normalizeBindingConfig(binding.acp);
		return require_binding_registry.buildConfiguredAcpSessionKey({
			channel: params.channel,
			accountId: bindingAccountId && bindingAccountId !== "*" ? bindingAccountId : params.accountId,
			conversationId: matchedConversationId,
			...params.parentConversationId ? { parentConversationId: params.parentConversationId } : {},
			agentId: binding.agentId,
			mode: acp.mode === "oneshot" ? "oneshot" : "persistent",
			...acp.cwd ? { cwd: acp.cwd } : {},
			...acp.backend ? { backend: acp.backend } : {},
			...acp.label ? { label: acp.label } : {}
		});
	}
}
function resolveEffectiveResetTargetSessionKey(params) {
	const activeSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.activeSessionKey);
	const activeAcpSessionKey = activeSessionKey && require_session_key.isAcpSessionKey(activeSessionKey) ? activeSessionKey : void 0;
	const activeIsNonAcp = Boolean(activeSessionKey) && !activeAcpSessionKey;
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel));
	const conversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.conversationId) ?? "";
	if (!channel || !conversationId) return activeAcpSessionKey;
	const accountId = resolveResetTargetAccountId({
		cfg: params.cfg,
		channel,
		accountId: params.accountId
	});
	const parentConversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentConversationId) || void 0;
	const allowNonAcpBindingSessionKey = Boolean(params.allowNonAcpBindingSessionKey);
	const serviceBinding = acpResetTargetDeps.getSessionBindingService().resolveByConversation({
		channel,
		accountId,
		conversationId,
		parentConversationId
	});
	const serviceSessionKey = serviceBinding?.targetKind === "session" ? serviceBinding.targetSessionKey.trim() : "";
	if (serviceSessionKey) {
		if (allowNonAcpBindingSessionKey) return serviceSessionKey;
		return require_session_key.isAcpSessionKey(serviceSessionKey) ? serviceSessionKey : void 0;
	}
	if (activeIsNonAcp && params.skipConfiguredFallbackWhenActiveSessionNonAcp) return;
	const configuredBinding = acpResetTargetDeps.resolveConfiguredBindingRecord({
		cfg: params.cfg,
		channel,
		accountId,
		conversationId,
		parentConversationId
	});
	const configuredSessionKey = configuredBinding?.record.targetKind === "session" ? configuredBinding.record.targetSessionKey.trim() : "";
	if (configuredSessionKey) {
		if (allowNonAcpBindingSessionKey) return configuredSessionKey;
		return require_session_key.isAcpSessionKey(configuredSessionKey) ? configuredSessionKey : void 0;
	}
	const rawConfiguredSessionKey = resolveRawConfiguredAcpSessionKey({
		cfg: params.cfg,
		channel,
		accountId,
		conversationId,
		...parentConversationId ? { parentConversationId } : {}
	});
	if (rawConfiguredSessionKey) return rawConfiguredSessionKey;
	if (params.fallbackToActiveAcpWhenUnbound === false) return;
	return activeAcpSessionKey;
}
//#endregion
Object.defineProperty(exports, "resolveEffectiveResetTargetSessionKey", {
	enumerable: true,
	get: function() {
		return resolveEffectiveResetTargetSessionKey;
	}
});
