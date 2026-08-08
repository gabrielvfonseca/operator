const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/allowlist-match.ts
/**
* Channel allowlist matching primitives.
*
* Compiles normalized allowlists and records match metadata for diagnostics.
*/
/** Formats match metadata for diagnostics without leaking channel-specific text. */
function formatAllowlistMatchMeta(match) {
	return `matchKey=${match?.matchKey ?? "none"} matchSource=${match?.matchSource ?? "none"}`;
}
/** Compiles normalized allowlist entries and records wildcard presence. */
function compileAllowlist(entries) {
	const set = new Set(entries.filter(Boolean));
	return {
		set,
		wildcard: set.has("*")
	};
}
function compileSimpleAllowlist(entries) {
	return compileAllowlist(entries.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(String(entry))).filter((entry) => Boolean(entry)));
}
function resolveAllowlistCandidates(params) {
	for (const candidate of params.candidates) {
		if (!candidate.value) continue;
		if (params.compiledAllowlist.set.has(candidate.value)) return {
			allowed: true,
			matchKey: candidate.value,
			matchSource: candidate.source
		};
	}
	return { allowed: false };
}
/** Matches simple sender id/name allowlists used by legacy channel config. */
function resolveAllowlistMatchSimple(params) {
	const allowFrom = compileSimpleAllowlist(params.allowFrom);
	if (allowFrom.set.size === 0) return { allowed: false };
	if (allowFrom.wildcard) return {
		allowed: true,
		matchKey: "*",
		matchSource: "wildcard"
	};
	const senderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.senderId);
	const senderName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.senderName);
	return resolveAllowlistCandidates({
		compiledAllowlist: allowFrom,
		candidates: [{
			value: senderId,
			source: "id"
		}, ...params.allowNameMatching === true && senderName ? [{
			value: senderName,
			source: "name"
		}] : []]
	});
}
//#endregion
//#region src/channels/channel-config.ts
/**
* Channel config matching helpers.
*
* Resolves direct, parent, normalized, and wildcard config entries with match metadata.
*/
/** Copies match metadata onto resolved channel config output. */
function applyChannelMatchMeta(result, match) {
	if (match.matchKey && match.matchSource) {
		result.matchKey = match.matchKey;
		result.matchSource = match.matchSource;
	}
	return result;
}
/** Resolves a matched entry and preserves the config key that selected it. */
function resolveChannelMatchConfig(match, resolveEntry) {
	if (!match.entry) return null;
	return applyChannelMatchMeta(resolveEntry(match.entry), match);
}
/** Normalizes human channel names into config-safe slugs. */
function normalizeChannelSlug(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value).replace(/^#/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
/** Builds unique config lookup keys from optional channel/account identifiers. */
function buildChannelKeyCandidates(...keys) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(keys);
}
/** Finds a direct channel entry and separately carries a wildcard fallback candidate. */
function resolveChannelEntryMatch(params) {
	const entries = params.entries ?? {};
	const match = {};
	for (const key of params.keys) {
		if (!Object.hasOwn(entries, key)) continue;
		match.entry = entries[key];
		match.key = key;
		break;
	}
	if (params.wildcardKey && Object.hasOwn(entries, params.wildcardKey)) {
		match.wildcardEntry = entries[params.wildcardKey];
		match.wildcardKey = params.wildcardKey;
	}
	return match;
}
/** Resolves config entry precedence: direct, normalized direct, parent, normalized parent, wildcard. */
function resolveChannelEntryMatchWithFallback(params) {
	const direct = resolveChannelEntryMatch({
		entries: params.entries,
		keys: params.keys,
		wildcardKey: params.wildcardKey
	});
	if (direct.entry && direct.key) return {
		...direct,
		matchKey: direct.key,
		matchSource: "direct"
	};
	const normalizeKey = params.normalizeKey;
	if (normalizeKey) {
		const normalizedKeys = params.keys.map((key) => normalizeKey(key)).filter(Boolean);
		if (normalizedKeys.length > 0) for (const [entryKey, entry] of Object.entries(params.entries ?? {})) {
			const normalizedEntry = normalizeKey(entryKey);
			if (normalizedEntry && normalizedKeys.includes(normalizedEntry)) return {
				...direct,
				entry,
				key: entryKey,
				matchKey: entryKey,
				matchSource: "direct"
			};
		}
	}
	const parentKeys = params.parentKeys ?? [];
	if (parentKeys.length > 0) {
		const parent = resolveChannelEntryMatch({
			entries: params.entries,
			keys: parentKeys
		});
		if (parent.entry && parent.key) return {
			...direct,
			entry: parent.entry,
			key: parent.key,
			parentEntry: parent.entry,
			parentKey: parent.key,
			matchKey: parent.key,
			matchSource: "parent"
		};
		if (normalizeKey) {
			const normalizedParentKeys = parentKeys.map((key) => normalizeKey(key)).filter(Boolean);
			if (normalizedParentKeys.length > 0) for (const [entryKey, entry] of Object.entries(params.entries ?? {})) {
				const normalizedEntry = normalizeKey(entryKey);
				if (normalizedEntry && normalizedParentKeys.includes(normalizedEntry)) return {
					...direct,
					entry,
					key: entryKey,
					parentEntry: entry,
					parentKey: entryKey,
					matchKey: entryKey,
					matchSource: "parent"
				};
			}
		}
	}
	if (direct.wildcardEntry && direct.wildcardKey) return {
		...direct,
		entry: direct.wildcardEntry,
		key: direct.wildcardKey,
		matchKey: direct.wildcardKey,
		matchSource: "wildcard"
	};
	return direct;
}
/** Resolves nested allowlists where an inner list only applies after the outer list matches. */
function resolveNestedAllowlistDecision(params) {
	if (!params.outerConfigured) return true;
	if (!params.outerMatched) return false;
	if (!params.innerConfigured) return true;
	return params.innerMatched;
}
//#endregion
//#region src/channels/plugins/approvals.ts
/**
* Returns the approval capability exposed by a channel plugin.
*/
function resolveChannelApprovalCapability(plugin) {
	return plugin?.approvalCapability;
}
/**
* Projects a channel approval capability into the runtime approval adapter shape.
*/
function resolveChannelApprovalAdapter(plugin) {
	const capability = resolveChannelApprovalCapability(plugin);
	if (!capability) return;
	if (!capability.delivery && !capability.nativeRuntime && !capability.render && !capability.native) return;
	return {
		describeExecApprovalSetup: capability.describeExecApprovalSetup,
		describePluginApprovalSetup: capability.describePluginApprovalSetup,
		delivery: capability.delivery,
		nativeRuntime: capability.nativeRuntime,
		render: capability.render,
		native: capability.native
	};
}
//#endregion
//#region src/channels/plugins/index.ts
var plugins_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	applyChannelMatchMeta: () => applyChannelMatchMeta,
	buildChannelKeyCandidates: () => buildChannelKeyCandidates,
	formatAllowlistMatchMeta: () => formatAllowlistMatchMeta,
	getChannelPlugin: () => require_registry.getChannelPlugin,
	getLoadedChannelPlugin: () => require_registry.getLoadedChannelPlugin,
	getLoadedChannelPluginOrigin: () => require_registry.getLoadedChannelPluginOrigin,
	listChannelPlugins: () => require_registry.listChannelPlugins,
	normalizeChannelId: () => require_registry.normalizeChannelId,
	normalizeChannelSlug: () => normalizeChannelSlug,
	resolveChannelApprovalAdapter: () => resolveChannelApprovalAdapter,
	resolveChannelApprovalCapability: () => resolveChannelApprovalCapability,
	resolveChannelEntryMatch: () => resolveChannelEntryMatch,
	resolveChannelEntryMatchWithFallback: () => resolveChannelEntryMatchWithFallback,
	resolveChannelMatchConfig: () => resolveChannelMatchConfig,
	resolveNestedAllowlistDecision: () => resolveNestedAllowlistDecision
});
//#endregion
Object.defineProperty(exports, "buildChannelKeyCandidates", {
	enumerable: true,
	get: function() {
		return buildChannelKeyCandidates;
	}
});
Object.defineProperty(exports, "formatAllowlistMatchMeta", {
	enumerable: true,
	get: function() {
		return formatAllowlistMatchMeta;
	}
});
Object.defineProperty(exports, "normalizeChannelSlug", {
	enumerable: true,
	get: function() {
		return normalizeChannelSlug;
	}
});
Object.defineProperty(exports, "plugins_exports", {
	enumerable: true,
	get: function() {
		return plugins_exports;
	}
});
Object.defineProperty(exports, "resolveAllowlistMatchSimple", {
	enumerable: true,
	get: function() {
		return resolveAllowlistMatchSimple;
	}
});
Object.defineProperty(exports, "resolveChannelApprovalAdapter", {
	enumerable: true,
	get: function() {
		return resolveChannelApprovalAdapter;
	}
});
Object.defineProperty(exports, "resolveChannelApprovalCapability", {
	enumerable: true,
	get: function() {
		return resolveChannelApprovalCapability;
	}
});
Object.defineProperty(exports, "resolveChannelEntryMatchWithFallback", {
	enumerable: true,
	get: function() {
		return resolveChannelEntryMatchWithFallback;
	}
});
Object.defineProperty(exports, "resolveNestedAllowlistDecision", {
	enumerable: true,
	get: function() {
		return resolveNestedAllowlistDecision;
	}
});
