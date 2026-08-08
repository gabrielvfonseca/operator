require("./dm-allow-state-C8NDyPNp.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
require("@gabrielvfonseca/normalization-core/string-coerce");
/**
* Parses an access-group allowFrom entry and returns the referenced group name.
*/
function parseAccessGroupAllowFromEntry(entry) {
	const trimmed = entry.trim();
	if (!trimmed.startsWith("accessGroup:")) return null;
	const name = trimmed.slice(12).trim();
	return name.length > 0 ? name : null;
}
/**
* Merges configured DM allowFrom entries with pairing-store sender ids when policy allows it.
*/
function mergeDmAllowFromSources(params) {
	const storeEntries = params.dmPolicy === "allowlist" || params.dmPolicy === "open" ? [] : params.storeAllowFrom ?? [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)([...params.allowFrom ?? [], ...storeEntries]);
}
/**
* Resolves the allowFrom entries used for group chats, optionally falling back to DM policy.
*/
function resolveGroupAllowFromSources(params) {
	const explicitGroupAllowFrom = Array.isArray(params.groupAllowFrom) && params.groupAllowFrom.length > 0 ? params.groupAllowFrom : void 0;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(explicitGroupAllowFrom ? explicitGroupAllowFrom : params.fallbackToAllowFrom === false ? [] : params.allowFrom ?? []);
}
//#endregion
//#region src/config/runtime-group-policy.ts
/**
* Resolve the effective group policy for a channel/provider runtime.
* Missing provider config can fail closed separately from configured providers.
*/
function resolveRuntimeGroupPolicy(params) {
	const configuredFallbackPolicy = params.configuredFallbackPolicy ?? "open";
	const missingProviderFallbackPolicy = params.missingProviderFallbackPolicy ?? "allowlist";
	return {
		groupPolicy: params.providerConfigPresent ? params.groupPolicy ?? params.defaultGroupPolicy ?? configuredFallbackPolicy : params.groupPolicy ?? missingProviderFallbackPolicy,
		providerMissingFallbackApplied: !params.providerConfigPresent && params.groupPolicy === void 0
	};
}
/** Read the shared channels default group policy used by provider-specific resolvers. */
function resolveDefaultGroupPolicy(cfg) {
	return cfg.channels?.defaults?.groupPolicy;
}
/**
* Resolve the strict channel-provider policy.
* Configured and missing provider config both default allowlist.
*/
function resolveAllowlistProviderRuntimeGroupPolicy(params) {
	return resolveRuntimeGroupPolicy({
		providerConfigPresent: params.providerConfigPresent,
		groupPolicy: params.groupPolicy,
		defaultGroupPolicy: params.defaultGroupPolicy,
		configuredFallbackPolicy: "allowlist",
		missingProviderFallbackPolicy: "allowlist"
	});
}
//#endregion
//#region src/channels/message-access/effective-allow-from.ts
/**
* Merge configured direct, group, and pairing-store allowlists into the
* effective lists consumed by sender and context-visibility checks.
*/
function resolveChannelIngressEffectiveAllowFromLists(params) {
	const allowFrom = Array.isArray(params.allowFrom) ? params.allowFrom : void 0;
	const groupAllowFrom = Array.isArray(params.groupAllowFrom) ? params.groupAllowFrom : void 0;
	return {
		effectiveAllowFrom: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(mergeDmAllowFromSources({
			allowFrom,
			storeAllowFrom: Array.isArray(params.storeAllowFrom) ? params.storeAllowFrom : void 0,
			dmPolicy: params.dmPolicy ?? void 0
		})),
		effectiveGroupAllowFrom: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(resolveGroupAllowFromSources({
			allowFrom,
			groupAllowFrom,
			fallbackToAllowFrom: params.groupAllowFromFallbackToAllowFrom ?? void 0
		}))
	};
}
//#endregion
//#region src/security/dm-policy-shared.ts
/**
* Derive a stable main-DM owner from a single-entry allowlist.
* Wildcards, multi-owner lists, and non-main DM scopes stay unpinned so callers keep route-specific sessions.
*/
function resolvePinnedMainDmOwnerFromAllowlist(params) {
	if ((params.dmScope ?? "main") !== "main") return null;
	const rawAllowFrom = Array.isArray(params.allowFrom) ? params.allowFrom : [];
	if (rawAllowFrom.some((entry) => String(entry).trim() === "*")) return null;
	const normalizedOwners = Array.from(new Set(rawAllowFrom.map((entry) => params.normalizeEntry(String(entry))).filter((entry) => Boolean(entry))));
	return normalizedOwners.length === 1 ? (0, _gabrielvfonseca_normalization_core.expectDefined)(normalizedOwners[0], "normalized owners entry at 0") : null;
}
/** Stable reason codes used by channel plugins, command auth, and diagnostics. */
const DM_GROUP_ACCESS_REASON = {
	GROUP_POLICY_ALLOWED: "group_policy_allowed",
	GROUP_POLICY_DISABLED: "group_policy_disabled",
	GROUP_POLICY_EMPTY_ALLOWLIST: "group_policy_empty_allowlist",
	GROUP_POLICY_NOT_ALLOWLISTED: "group_policy_not_allowlisted",
	DM_POLICY_OPEN: "dm_policy_open",
	DM_POLICY_DISABLED: "dm_policy_disabled",
	DM_POLICY_ALLOWLISTED: "dm_policy_allowlisted",
	DM_POLICY_PAIRING_REQUIRED: "dm_policy_pairing_required",
	DM_POLICY_NOT_ALLOWLISTED: "dm_policy_not_allowlisted"
};
DM_GROUP_ACCESS_REASON.GROUP_POLICY_DISABLED, DM_GROUP_ACCESS_REASON.GROUP_POLICY_EMPTY_ALLOWLIST, DM_GROUP_ACCESS_REASON.GROUP_POLICY_NOT_ALLOWLISTED, DM_GROUP_ACCESS_REASON.GROUP_POLICY_NOT_ALLOWLISTED;
//#endregion
Object.defineProperty(exports, "parseAccessGroupAllowFromEntry", {
	enumerable: true,
	get: function() {
		return parseAccessGroupAllowFromEntry;
	}
});
Object.defineProperty(exports, "resolveAllowlistProviderRuntimeGroupPolicy", {
	enumerable: true,
	get: function() {
		return resolveAllowlistProviderRuntimeGroupPolicy;
	}
});
Object.defineProperty(exports, "resolveChannelIngressEffectiveAllowFromLists", {
	enumerable: true,
	get: function() {
		return resolveChannelIngressEffectiveAllowFromLists;
	}
});
Object.defineProperty(exports, "resolveDefaultGroupPolicy", {
	enumerable: true,
	get: function() {
		return resolveDefaultGroupPolicy;
	}
});
Object.defineProperty(exports, "resolvePinnedMainDmOwnerFromAllowlist", {
	enumerable: true,
	get: function() {
		return resolvePinnedMainDmOwnerFromAllowlist;
	}
});
