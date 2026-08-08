//#region src/channels/command-gating.ts
/** Resolves whether any configured authorizer permits a control command. */
function resolveCommandAuthorizedFromAuthorizers(params) {
	const { useAccessGroups, authorizers } = params;
	const mode = params.modeWhenAccessGroupsOff ?? "allow";
	if (!useAccessGroups) {
		if (mode === "allow") return true;
		if (mode === "deny") return false;
		if (!authorizers.some((entry) => entry.configured)) return true;
		return authorizers.some((entry) => entry.configured && entry.allowed);
	}
	return authorizers.some((entry) => entry.configured && entry.allowed);
}
//#endregion
//#region src/channels/mention-gating.ts
function implicitMentionKindWhen(kind, enabled) {
	return enabled ? [kind] : [];
}
function resolveMatchedImplicitMentionKinds(params) {
	const inputKinds = params.implicitMentionKinds ?? [];
	if (inputKinds.length === 0) return [];
	const allowedKinds = params.allowedImplicitMentionKinds ? new Set(params.allowedImplicitMentionKinds) : null;
	const matched = [];
	for (const kind of inputKinds) {
		if (allowedKinds && !allowedKinds.has(kind)) continue;
		if (!matched.includes(kind)) matched.push(kind);
	}
	return matched;
}
function resolveMentionDecisionCore(params) {
	const matchedImplicitMentionKinds = resolveMatchedImplicitMentionKinds({
		implicitMentionKinds: params.implicitMentionKinds,
		allowedImplicitMentionKinds: params.allowedImplicitMentionKinds
	});
	const implicitMention = matchedImplicitMentionKinds.length > 0;
	const effectiveWasMentioned = params.wasMentioned || implicitMention || params.shouldBypassMention;
	const shouldSkip = params.requireMention && params.canDetectMention && !effectiveWasMentioned;
	return {
		implicitMention,
		matchedImplicitMentionKinds,
		effectiveWasMentioned,
		shouldBypassMention: params.shouldBypassMention,
		shouldSkip
	};
}
function hasNestedMentionDecisionParams(params) {
	return "facts" in params && "policy" in params;
}
function normalizeMentionDecisionParams(params) {
	if (hasNestedMentionDecisionParams(params)) return params;
	const { canDetectMention, wasMentioned, hasAnyMention, implicitMentionKinds, isGroup, requireMention, allowedImplicitMentionKinds, allowTextCommands, hasControlCommand, commandAuthorized } = params;
	return {
		facts: {
			canDetectMention,
			wasMentioned,
			hasAnyMention,
			implicitMentionKinds
		},
		policy: {
			isGroup,
			requireMention,
			allowedImplicitMentionKinds,
			allowTextCommands,
			hasControlCommand,
			commandAuthorized
		}
	};
}
function resolveInboundMentionDecision(params) {
	const { facts, policy } = normalizeMentionDecisionParams(params);
	const shouldBypassMention = policy.isGroup && policy.requireMention && !facts.wasMentioned && !(facts.hasAnyMention ?? false) && policy.allowTextCommands && policy.commandAuthorized && policy.hasControlCommand;
	return resolveMentionDecisionCore({
		requireMention: policy.requireMention,
		canDetectMention: facts.canDetectMention,
		wasMentioned: facts.wasMentioned,
		implicitMentionKinds: facts.implicitMentionKinds,
		allowedImplicitMentionKinds: policy.allowedImplicitMentionKinds,
		shouldBypassMention
	});
}
//#endregion
Object.defineProperty(exports, "implicitMentionKindWhen", {
	enumerable: true,
	get: function() {
		return implicitMentionKindWhen;
	}
});
Object.defineProperty(exports, "resolveCommandAuthorizedFromAuthorizers", {
	enumerable: true,
	get: function() {
		return resolveCommandAuthorizedFromAuthorizers;
	}
});
Object.defineProperty(exports, "resolveInboundMentionDecision", {
	enumerable: true,
	get: function() {
		return resolveInboundMentionDecision;
	}
});
