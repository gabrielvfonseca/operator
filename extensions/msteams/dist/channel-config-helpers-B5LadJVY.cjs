const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./helpers-Dw37GavQ.cjs");
require("./dm-access-UxTYSelO.cjs");
//#region src/channels/plugins/config-write-policy-shared.ts
/**
* Shared channel config-write policy helpers.
*
* Authorizes config writes by origin/target channel and account scope.
*/
function listConfigWriteTargetScopes(target) {
	if (!target || target.kind === "global") return [];
	if (target.kind === "ambiguous") return target.scopes;
	return [target.scope];
}
function resolveChannelConfig(cfg, channelId) {
	if (!channelId) return;
	const channelConfig = cfg.channels?.[channelId];
	return channelConfig != null && typeof channelConfig === "object" && !Array.isArray(channelConfig) ? channelConfig : void 0;
}
function resolveChannelAccountConfig(channelConfig, accountId) {
	return require_account_lookup.resolveAccountEntry(channelConfig.accounts, require_account_id.normalizeAccountId(accountId));
}
/**
* Resolves whether config writes are enabled for a channel/account scope.
*/
function resolveChannelConfigWritesShared(params) {
	const channelConfig = resolveChannelConfig(params.cfg, params.channelId);
	if (!channelConfig) return true;
	return (resolveChannelAccountConfig(channelConfig, params.accountId)?.configWrites ?? channelConfig.configWrites) !== false;
}
/**
* Authorizes a channel-initiated config write against origin and target policy.
*/
function authorizeConfigWriteShared(params) {
	if (params.allowBypass) return { allowed: true };
	if (params.target?.kind === "ambiguous") return {
		allowed: false,
		reason: "ambiguous-target"
	};
	if (params.origin?.channelId && !resolveChannelConfigWritesShared({
		cfg: params.cfg,
		channelId: params.origin.channelId,
		accountId: params.origin.accountId
	})) return {
		allowed: false,
		reason: "origin-disabled",
		blockedScope: {
			kind: "origin",
			scope: params.origin
		}
	};
	const seen = /* @__PURE__ */ new Set();
	for (const target of listConfigWriteTargetScopes(params.target)) {
		if (!target.channelId) continue;
		const key = `${target.channelId}:${require_account_id.normalizeAccountId(target.accountId)}`;
		if (seen.has(key)) continue;
		seen.add(key);
		if (!resolveChannelConfigWritesShared({
			cfg: params.cfg,
			channelId: target.channelId,
			accountId: target.accountId
		})) return {
			allowed: false,
			reason: "target-disabled",
			blockedScope: {
				kind: "target",
				scope: target
			}
		};
	}
	return { allowed: true };
}
/**
* Resolves an explicit channel/account scope into a config write target.
*/
function resolveExplicitConfigWriteTargetShared(scope) {
	if (!scope.channelId) return { kind: "global" };
	const accountId = require_account_id.normalizeAccountId(scope.accountId);
	if (!accountId || accountId === "default") return {
		kind: "channel",
		scope: { channelId: scope.channelId }
	};
	return {
		kind: "account",
		scope: {
			channelId: scope.channelId,
			accountId
		}
	};
}
/**
* Infers the config write target from a config path.
*/
function resolveConfigWriteTargetFromPathShared(params) {
	if (params.path[0] !== "channels") return { kind: "global" };
	if (params.path.length < 2) return {
		kind: "ambiguous",
		scopes: []
	};
	const channelId = params.normalizeChannelId(params.path[1] ?? "");
	if (!channelId) return {
		kind: "ambiguous",
		scopes: []
	};
	if (params.path.length === 2) return {
		kind: "ambiguous",
		scopes: [{ channelId }]
	};
	if (params.path[2] !== "accounts") return {
		kind: "channel",
		scope: { channelId }
	};
	if (params.path.length < 4) return {
		kind: "ambiguous",
		scopes: [{ channelId }]
	};
	return resolveExplicitConfigWriteTargetShared({
		channelId,
		accountId: require_account_id.normalizeAccountId(params.path[3])
	});
}
/**
* Checks whether an internal admin client can bypass channel config write policy.
*/
function canBypassConfigWritePolicyShared(params) {
	return params.isInternalMessageChannel(params.channel) && params.gatewayClientScopes?.includes("operator.admin") === true;
}
/**
* Formats the user-facing denial message for a blocked config write.
*/
function formatConfigWriteDeniedMessageShared(params) {
	if (params.result.reason === "ambiguous-target") return "⚠️ Channel-initiated /config writes cannot replace channels, channel roots, or accounts collections. Use a more specific path or gateway operator.admin.";
	const blocked = params.result.blockedScope?.scope;
	return `⚠️ Config writes are disabled for ${blocked?.channelId ?? params.fallbackChannelId ?? "this channel"}. Set ${blocked?.channelId ? blocked.accountId ? `channels.${blocked.channelId}.accounts.${blocked.accountId}.configWrites=true` : `channels.${blocked.channelId}.configWrites=true` : params.fallbackChannelId ? `channels.${params.fallbackChannelId}.configWrites=true` : "channels.<channel>.configWrites=true"} to enable.`;
}
//#endregion
//#region src/plugin-sdk/channel-config-helpers.ts
/** Coerce mixed allowlist config values into plain strings without trimming or deduping. */
function mapAllowFromEntries(allowFrom) {
	return (allowFrom ?? []).map((entry) => String(entry));
}
/** Collapse nullable config scalars into a trimmed optional string. */
function resolveOptionalConfigString(value) {
	if (value == null) return;
	return String(value).trim() || void 0;
}
/** Build the shared allowlist/default target adapter surface for account-scoped channel configs. */
function createScopedAccountConfigAccessors(params) {
	const base = {
		resolveAllowFrom({ cfg, accountId }) {
			return mapAllowFromEntries(params.resolveAllowFrom(params.resolveAccount({
				cfg,
				accountId
			})));
		},
		formatAllowFrom({ allowFrom }) {
			return params.formatAllowFrom(allowFrom);
		}
	};
	if (!params.resolveDefaultTo) return base;
	return {
		...base,
		resolveDefaultTo({ cfg, accountId }) {
			return resolveOptionalConfigString(params.resolveDefaultTo?.(params.resolveAccount({
				cfg,
				accountId
			})));
		}
	};
}
function resolveAccessorAccountWithFallback(resolveAccessorAccount, fallbackResolveAccessorAccount) {
	return resolveAccessorAccount ?? fallbackResolveAccessorAccount;
}
function createChannelConfigAdapterWithAccessors(params) {
	return {
		...params.base,
		...createScopedAccountConfigAccessors({
			resolveAccount: resolveAccessorAccountWithFallback(params.resolveAccessorAccount, params.fallbackResolveAccessorAccount),
			resolveAllowFrom: params.resolveAllowFrom,
			formatAllowFrom: params.formatAllowFrom,
			resolveDefaultTo: params.resolveDefaultTo
		})
	};
}
function createChannelConfigAdapterFromBase(params) {
	return createChannelConfigAdapterWithAccessors({
		base: params.base,
		resolveAccessorAccount: params.resolveAccessorAccount,
		fallbackResolveAccessorAccount: params.resolveAccountForAccessors,
		resolveAllowFrom: params.resolveAllowFrom,
		formatAllowFrom: params.formatAllowFrom,
		resolveDefaultTo: params.resolveDefaultTo
	});
}
function setTopLevelChannelEnabledInConfigSection(params) {
	const section = params.cfg.channels?.[params.sectionKey];
	return {
		...params.cfg,
		channels: {
			...params.cfg.channels,
			[params.sectionKey]: {
				...section,
				enabled: params.enabled
			}
		}
	};
}
function removeTopLevelChannelConfigSection(params) {
	const nextChannels = { ...params.cfg.channels };
	delete nextChannels[params.sectionKey];
	const nextCfg = { ...params.cfg };
	if (Object.keys(nextChannels).length > 0) nextCfg.channels = nextChannels;
	else delete nextCfg.channels;
	return nextCfg;
}
function clearTopLevelChannelConfigFields(params) {
	const section = params.cfg.channels?.[params.sectionKey];
	if (!section) return params.cfg;
	const nextSection = { ...section };
	for (const field of params.clearBaseFields) delete nextSection[field];
	return {
		...params.cfg,
		channels: {
			...params.cfg.channels,
			[params.sectionKey]: nextSection
		}
	};
}
/** Build CRUD/config helpers for top-level single-account channels. */
function createTopLevelChannelConfigBase(params) {
	return {
		listAccountIds(cfg) {
			return params.listAccountIds?.(cfg) ?? ["default"];
		},
		resolveAccount(cfg) {
			return params.resolveAccount(cfg);
		},
		inspectAccount: params.inspectAccount ? (cfg) => params.inspectAccount?.(cfg) : void 0,
		defaultAccountId(cfg) {
			return params.defaultAccountId?.(cfg) ?? "default";
		},
		setAccountEnabled({ cfg, enabled }) {
			return setTopLevelChannelEnabledInConfigSection({
				cfg,
				sectionKey: params.sectionKey,
				enabled
			});
		},
		deleteAccount({ cfg }) {
			return params.deleteMode === "clear-fields" ? clearTopLevelChannelConfigFields({
				cfg,
				sectionKey: params.sectionKey,
				clearBaseFields: params.clearBaseFields ?? []
			}) : removeTopLevelChannelConfigSection({
				cfg,
				sectionKey: params.sectionKey
			});
		}
	};
}
/** Build the full shared config adapter for top-level single-account channels with allowlist/default target accessors. */
function createTopLevelChannelConfigAdapter(params) {
	return createChannelConfigAdapterFromBase({
		base: createTopLevelChannelConfigBase({
			sectionKey: params.sectionKey,
			resolveAccount: params.resolveAccount,
			listAccountIds: params.listAccountIds,
			defaultAccountId: params.defaultAccountId,
			inspectAccount: params.inspectAccount,
			deleteMode: params.deleteMode,
			clearBaseFields: params.clearBaseFields
		}),
		resolveAccessorAccount: params.resolveAccessorAccount,
		resolveAccountForAccessors({ cfg }) {
			return params.resolveAccount(cfg);
		},
		resolveAllowFrom: params.resolveAllowFrom,
		formatAllowFrom: params.formatAllowFrom,
		resolveDefaultTo: params.resolveDefaultTo
	});
}
//#endregion
Object.defineProperty(exports, "authorizeConfigWriteShared", {
	enumerable: true,
	get: function() {
		return authorizeConfigWriteShared;
	}
});
Object.defineProperty(exports, "canBypassConfigWritePolicyShared", {
	enumerable: true,
	get: function() {
		return canBypassConfigWritePolicyShared;
	}
});
Object.defineProperty(exports, "createTopLevelChannelConfigAdapter", {
	enumerable: true,
	get: function() {
		return createTopLevelChannelConfigAdapter;
	}
});
Object.defineProperty(exports, "formatConfigWriteDeniedMessageShared", {
	enumerable: true,
	get: function() {
		return formatConfigWriteDeniedMessageShared;
	}
});
Object.defineProperty(exports, "mapAllowFromEntries", {
	enumerable: true,
	get: function() {
		return mapAllowFromEntries;
	}
});
Object.defineProperty(exports, "resolveConfigWriteTargetFromPathShared", {
	enumerable: true,
	get: function() {
		return resolveConfigWriteTargetFromPathShared;
	}
});
Object.defineProperty(exports, "resolveExplicitConfigWriteTargetShared", {
	enumerable: true,
	get: function() {
		return resolveExplicitConfigWriteTargetShared;
	}
});
