require("./rolldown-runtime-u92d-OFm.cjs");
const require_directive_handling_directive_only = require("./directive-handling.directive-only-DDJAF_Tl.cjs");
const require_directive_handling_impl = require("./directive-handling.impl-BVNecktC.cjs");
const require_directive_handling_levels = require("./directive-handling.levels-C8s7C_1q.cjs");
//#region src/auto-reply/reply/directive-handling.fast-lane.ts
async function applyInlineDirectivesFastLane(params) {
	const { directives, commandAuthorized, ctx, cfg, agentId, isGroup, sessionEntry, sessionStore, sessionKey, storePath, elevatedEnabled, elevatedAllowed, elevatedFailures, messageProviderKey, defaultProvider, defaultModel, aliasIndex, allowedModelKeys, allowedModelCatalog, resetModelOverride, formatModelSwitchEvent, modelState } = params;
	let { provider, model } = params;
	if (!commandAuthorized || require_directive_handling_directive_only.isDirectiveOnly({
		directives,
		cleanedBody: directives.cleaned,
		ctx,
		cfg,
		agentId,
		isGroup
	})) return {
		directiveAck: void 0,
		provider,
		model,
		sessionChangesApplied: true
	};
	const agentCfg = params.agentCfg;
	const { currentThinkLevel, currentFastMode, currentVerboseLevel, currentReasoningLevel, currentElevatedLevel } = await require_directive_handling_levels.resolveCurrentDirectiveLevels({
		sessionEntry,
		agentCfg,
		resolveDefaultThinkingLevel: directives.hasThinkDirective ? () => modelState.resolveDefaultThinkingLevel() : async () => void 0
	});
	const persistenceState = { sessionChangesApplied: true };
	const directiveAck = await require_directive_handling_impl.handleDirectiveOnly({
		cfg,
		directives,
		sessionEntry,
		sessionStore,
		sessionKey,
		storePath,
		elevatedEnabled,
		elevatedAllowed,
		elevatedFailures,
		messageProviderKey,
		defaultProvider,
		defaultModel,
		aliasIndex,
		allowedModelKeys,
		allowedModelCatalog,
		thinkingCatalog: await modelState.resolveThinkingCatalog(),
		resetModelOverride,
		provider,
		model,
		initialModelLabel: params.initialModelLabel,
		formatModelSwitchEvent,
		currentThinkLevel,
		currentFastMode,
		currentVerboseLevel,
		currentReasoningLevel,
		currentElevatedLevel,
		ctx,
		messageProvider: ctx.Provider,
		surface: ctx.Surface,
		gatewayClientScopes: ctx.GatewayClientScopes,
		commandAuthorized,
		senderIsOwner: params.senderIsOwner,
		workspaceDir: params.workspaceDir,
		persistenceState
	});
	if (sessionEntry?.providerOverride) provider = sessionEntry.providerOverride;
	if (sessionEntry?.modelOverride) model = sessionEntry.modelOverride;
	return {
		directiveAck,
		provider,
		model,
		...persistenceState
	};
}
//#endregion
exports.applyInlineDirectivesFastLane = applyInlineDirectivesFastLane;
