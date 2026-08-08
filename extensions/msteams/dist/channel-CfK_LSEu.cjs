const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./types.secrets-2BFwbY6H.cjs");
require("./config-schema-DHVbD0xQ.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_setup_surface = require("./setup-surface-Bp54A5F5.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
require("./parse-finite-number-BTqU_Omp.cjs");
const require_runtime_api = require("./runtime-api-CfjFtGFK.cjs");
const require_dm_policy_shared = require("./dm-policy-shared-Cznamk_3.cjs");
const require_channel_config_helpers = require("./channel-config-helpers-B5LadJVY.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
require("./bundled-dir-OMER9nrW.cjs");
require("./registry-BWWaGAnQ.cjs");
require("./paths-C5Qy0ueD.cjs");
require("./subsystem-DVRgVNGQ.cjs");
require("./resolve-route-DQGFdHA5.cjs");
const require_outbound_session = require("./outbound-session-ca-y9vpw.cjs");
const require_thread_session = require("./thread-session-CBTa60Qg.cjs");
require("./config-schema-G1HIsf87.cjs");
require("./types-lecpXEXr.cjs");
require("./dedupe-CtfV06qO.cjs");
require("./tailscale-status-DgagbaYD.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./init-PqhbtEQA.cjs");
require("./setup-group-access-CPN6DyTf.cjs");
require("./typebox-Cmpdg63i.cjs");
require("./gateway-bind-url-DgVkjoud.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
require("./net-CakPoh2E.cjs");
require("./persistent-bindings.resolve-Duo7LLye.cjs");
const require_qr_terminal = require("./qr-terminal-D8aVGvhO.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_dangerous_name_matching = require("./dangerous-name-matching-CRIv1nH4.cjs");
const require_directory_runtime = require("./directory-runtime-B2H6ilHa.cjs");
const require_presentation = require("./presentation-HrJS558a.cjs");
require("./security-runtime-DuzdER7a.cjs");
require("./sandbox-paths-BmmHDLnB.cjs");
require("./date-time-zxjypawc.cjs");
const require_approval_auth_helpers = require("./approval-auth-helpers-C5CfR9ft.cjs");
const require_graph_users = require("./graph-users-Ct1vN_FN.cjs");
const require_resolve_allowlist = require("./resolve-allowlist-GKDaqKPK.cjs");
const require_config_schema$2 = require("./config-schema-CT-P8YXp.cjs");
const require_html_entity_runtime = require("./html-entity-runtime-Cs_klWjy.cjs");
require("@gabrielvfonseca/normalization-core");
let typebox = require("typebox");
require("@openclaw/fs-safe/secret");
//#region src/channels/plugins/threading-helpers.ts
/**
* Creates a resolver that reads reply-to mode from top-level channel config.
*/
function createTopLevelChannelReplyToModeResolver(channelId) {
	return ({ cfg }) => {
		return (cfg.channels?.[channelId])?.replyToMode ?? "off";
	};
}
/**
* Creates a resolver that reads reply-to mode from account-scoped config.
*/
function createScopedAccountReplyToModeResolver(params) {
	return ({ cfg, accountId, chatType }) => params.resolveReplyToMode(params.resolveAccount(cfg, accountId), chatType) ?? params.fallback ?? "off";
}
//#endregion
//#region src/plugin-sdk/core.ts
function createInlineTextPairingAdapter(params) {
	return {
		idLabel: params.idLabel,
		normalizeAllowEntry: params.normalizeAllowEntry,
		notifyApproval: async (ctx) => {
			await params.notify({
				...ctx,
				message: params.message
			});
		}
	};
}
/** Remove one of the known provider prefixes from a free-form target string. */
function stripChannelTargetPrefix(raw, ...providers) {
	const trimmed = raw.trim();
	for (const provider of providers) {
		const prefix = `${require_string_coerce.normalizeLowercaseStringOrEmpty(provider)}:`;
		if (require_string_coerce.normalizeLowercaseStringOrEmpty(trimmed).startsWith(prefix)) return trimmed.slice(prefix.length).trim();
	}
	return trimmed;
}
/** Remove generic target-kind prefixes such as `user:` or `group:`. */
function stripTargetKindPrefix(raw) {
	return raw.replace(/^(user|channel|group|conversation|room|dm):/i, "").trim();
}
/**
* Build the canonical outbound session route payload returned by channel
* message adapters.
*/
function buildChannelOutboundSessionRoute(params) {
	const baseSessionKey = require_outbound_session.buildOutboundBaseSessionKey({
		cfg: params.cfg,
		agentId: params.agentId,
		channel: params.channel,
		accountId: params.accountId,
		peer: params.peer
	});
	return {
		sessionKey: baseSessionKey,
		baseSessionKey,
		...params.recipientSessionExact !== void 0 ? { recipientSessionExact: params.recipientSessionExact } : {},
		peer: params.peer,
		chatType: params.chatType,
		from: params.from,
		to: params.to,
		...params.threadId !== void 0 ? { threadId: params.threadId } : {}
	};
}
function createInlineAttachedChannelResultAdapter(params) {
	return {
		sendText: params.sendText ? async (ctx) => ({
			channel: params.channel,
			...await params.sendText(ctx)
		}) : void 0,
		sendMedia: params.sendMedia ? async (ctx) => ({
			channel: params.channel,
			...await params.sendMedia(ctx)
		}) : void 0,
		sendPoll: params.sendPoll ? async (ctx) => ({
			channel: params.channel,
			...await params.sendPoll(ctx)
		}) : void 0
	};
}
function resolveChatChannelSecurity(security) {
	if (!security) return;
	if (!("dm" in security)) return security;
	return {
		resolveDmPolicy: ({ cfg, accountId, account }) => require_helpers.buildAccountScopedDmSecurityPolicy({
			cfg,
			channelKey: security.dm.channelKey,
			accountId,
			fallbackAccountId: security.dm.resolveFallbackAccountId?.(account) ?? account.accountId,
			policy: security.dm.resolvePolicy(account),
			allowFrom: security.dm.resolveAllowFrom(account) ?? [],
			defaultPolicy: security.dm.defaultPolicy,
			allowFromPathSuffix: security.dm.allowFromPathSuffix,
			policyPathSuffix: security.dm.policyPathSuffix,
			approveChannelId: security.dm.approveChannelId,
			approveHint: security.dm.approveHint,
			normalizeEntry: security.dm.normalizeEntry,
			inheritSharedDefaultsFromDefaultAccount: security.dm.inheritSharedDefaultsFromDefaultAccount
		}),
		...security.collectWarnings ? { collectWarnings: security.collectWarnings } : {},
		...security.collectAuditFindings ? { collectAuditFindings: security.collectAuditFindings } : {}
	};
}
function resolveChatChannelPairing(pairing) {
	if (!pairing) return;
	if (!("text" in pairing)) return pairing;
	return createInlineTextPairingAdapter(pairing.text);
}
function resolveChatChannelThreading(threading) {
	if (!threading) return;
	if (!("topLevelReplyToMode" in threading) && !("scopedAccountReplyToMode" in threading)) return threading;
	let resolveReplyToMode;
	if ("topLevelReplyToMode" in threading) resolveReplyToMode = createTopLevelChannelReplyToModeResolver(threading.topLevelReplyToMode);
	else resolveReplyToMode = createScopedAccountReplyToModeResolver(threading.scopedAccountReplyToMode);
	return {
		...threading,
		resolveReplyToMode
	};
}
function resolveChatChannelOutbound(outbound) {
	if (!outbound) return;
	if (!("attachedResults" in outbound)) return outbound;
	return {
		...outbound.base,
		...createInlineAttachedChannelResultAdapter(outbound.attachedResults)
	};
}
/**
* Build a chat-style channel plugin by composing common security, pairing,
* threading, and outbound adapters around a channel-specific base.
*/
function createChatChannelPlugin(params) {
	return {
		...params.base,
		conversationBindings: {
			supportsCurrentConversationBinding: true,
			...params.base.conversationBindings
		},
		...params.security ? { security: resolveChatChannelSecurity(params.security) } : {},
		...params.pairing ? { pairing: resolveChatChannelPairing(params.pairing) } : {},
		...params.threading ? { threading: resolveChatChannelThreading(params.threading) } : {},
		...params.outbound ? { outbound: resolveChatChannelOutbound(params.outbound) } : {}
	};
}
//#endregion
//#region src/channels/plugins/runtime-forwarders.ts
async function resolveForwardedMethod(params) {
	const runtime = await params.getRuntime();
	const method = params.resolve(runtime);
	if (method) return method;
	throw new Error(params.unavailableMessage ?? "Runtime method is unavailable");
}
/**
* Creates a directory adapter whose methods forward to a lazily resolved runtime.
*/
function createRuntimeDirectoryLiveAdapter(params) {
	const adapter = {};
	if (params.self) adapter.self = async (ctx) => await (await resolveForwardedMethod({
		getRuntime: params.getRuntime,
		resolve: params.self
	}))(ctx);
	if (params.listPeersLive) adapter.listPeersLive = async (ctx) => await (await resolveForwardedMethod({
		getRuntime: params.getRuntime,
		resolve: params.listPeersLive
	}))(ctx);
	if (params.listGroupsLive) adapter.listGroupsLive = async (ctx) => await (await resolveForwardedMethod({
		getRuntime: params.getRuntime,
		resolve: params.listGroupsLive
	}))(ctx);
	if (params.listGroupMembers) adapter.listGroupMembers = async (ctx) => await (await resolveForwardedMethod({
		getRuntime: params.getRuntime,
		resolve: params.listGroupMembers
	}))(ctx);
	return adapter;
}
/**
* Creates outbound delegates whose methods forward to a lazily resolved runtime.
*/
function createRuntimeOutboundDelegates(params) {
	return {
		renderPresentation: params.renderPresentation ? async (ctx) => await (await resolveForwardedMethod({
			getRuntime: params.getRuntime,
			resolve: params.renderPresentation.resolve,
			unavailableMessage: params.renderPresentation.unavailableMessage
		}))(ctx) : void 0,
		sendPayload: params.sendPayload ? async (ctx) => await (await resolveForwardedMethod({
			getRuntime: params.getRuntime,
			resolve: params.sendPayload.resolve,
			unavailableMessage: params.sendPayload.unavailableMessage
		}))(ctx) : void 0,
		sendText: params.sendText ? async (ctx) => await (await resolveForwardedMethod({
			getRuntime: params.getRuntime,
			resolve: params.sendText.resolve,
			unavailableMessage: params.sendText.unavailableMessage
		}))(ctx) : void 0,
		sendMedia: params.sendMedia ? async (ctx) => await (await resolveForwardedMethod({
			getRuntime: params.getRuntime,
			resolve: params.sendMedia.resolve,
			unavailableMessage: params.sendMedia.unavailableMessage
		}))(ctx) : void 0,
		sendPoll: params.sendPoll ? async (ctx) => await (await resolveForwardedMethod({
			getRuntime: params.getRuntime,
			resolve: params.sendPoll.resolve,
			unavailableMessage: params.sendPoll.unavailableMessage
		}))(ctx) : void 0
	};
}
//#endregion
//#region src/channels/plugins/pairing-adapters.ts
/**
* Creates an allowlist normalizer that strips a channel-specific target prefix.
*/
function createPairingPrefixStripper(prefixRe, map = (entry) => entry) {
	return (entry) => map(entry.trim().replace(prefixRe, "").trim());
}
//#endregion
//#region src/channels/plugins/directory-adapters.ts
const nullChannelDirectorySelf = async () => null;
/** Build a channel directory adapter with a null self resolver by default. */
function createChannelDirectoryAdapter(params = {}) {
	return {
		self: params.self ?? nullChannelDirectorySelf,
		...params
	};
}
//#endregion
//#region extensions/msteams/src/approval-auth.ts
const MSTEAMS_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function normalizeMSTeamsApproverId(value) {
	const normalized = require_resolve_allowlist.normalizeMSTeamsMessagingTarget(String(value));
	if (!normalized?.startsWith("user:")) return;
	const id = require_string_coerce.normalizeOptionalLowercaseString(normalized.slice(5));
	if (!id) return;
	return MSTEAMS_ID_RE.test(id) ? id : void 0;
}
function resolveMSTeamsChannelConfig$1(cfg) {
	return cfg.channels?.msteams;
}
const msTeamsApprovalAuth = require_approval_auth_helpers.createChannelApprovalAuth({
	channelLabel: "Microsoft Teams",
	resolveInputs: ({ cfg }) => {
		const channel = resolveMSTeamsChannelConfig$1(cfg);
		return {
			allowFrom: channel?.allowFrom,
			defaultTo: channel?.defaultTo
		};
	},
	normalizeApprover: normalizeMSTeamsApproverId,
	normalizeSenderId: (value) => {
		const trimmed = require_string_coerce.normalizeOptionalLowercaseString(value);
		if (!trimmed) return;
		return MSTEAMS_ID_RE.test(trimmed) ? trimmed : void 0;
	}
}).approvalAuth;
//#endregion
//#region extensions/msteams/src/doctor.ts
function isMSTeamsMutableAllowEntry(raw) {
	const text = raw.trim();
	if (!text || text === "*") return false;
	const withoutPrefix = text.replace(/^(msteams|user):/i, "").trim();
	return /\s/.test(withoutPrefix) || withoutPrefix.includes("@");
}
const collectMSTeamsMutableAllowlistWarnings = require_runtime_api.createDangerousNameMatchingMutableAllowlistWarningCollector({
	channel: "msteams",
	detector: isMSTeamsMutableAllowEntry,
	collectLists: (scope) => [{
		pathLabel: `${scope.prefix}.allowFrom`,
		list: scope.account.allowFrom
	}, {
		pathLabel: `${scope.prefix}.groupAllowFrom`,
		list: scope.account.groupAllowFrom
	}]
});
//#endregion
//#region extensions/msteams/src/read-policy.ts
function normalizeTarget(raw) {
	return raw ? require_resolve_allowlist.normalizeMSTeamsMessagingTarget(raw) ?? "" : "";
}
function sameAccount(ctx) {
	const requested = require_string_coerce.normalizeOptionalString(ctx.accountId) ?? "default";
	const requester = require_string_coerce.normalizeOptionalString(ctx.requesterAccountId);
	return requester !== void 0 && requester === requested;
}
function isCurrentMSTeamsReadTarget(params) {
	if (require_string_coerce.normalizeOptionalString(params.ctx.toolContext?.currentChannelProvider)?.toLowerCase() !== "msteams" || !sameAccount(params.ctx)) return false;
	const candidates = [
		params.ctx.toolContext?.currentChannelId,
		params.ctx.toolContext?.currentMessagingTarget,
		params.ctx.toolContext?.currentGraphChannelId
	];
	const target = normalizeTarget(params.target);
	return candidates.some((candidate) => normalizeTarget(candidate) === target);
}
function normalizeUserTarget(target) {
	return target.replace(/^user:/i, "").trim().toLowerCase();
}
function isStableUserId(value) {
	return /^[0-9a-f-]{16,}$/i.test(value);
}
async function resolveAllowedDmTarget(cfg, target) {
	const teams = cfg.channels?.msteams;
	if (teams?.dmPolicy === "disabled") return;
	const userId = normalizeUserTarget(target);
	if (!userId) return;
	const normalizedEntries = (teams?.allowFrom ?? []).map((entry) => normalizeUserTarget(entry.replace(/^(msteams|teams):/i, "")));
	const allowAll = (teams?.dmPolicy ?? "pairing") === "open" || normalizedEntries.includes("*");
	if (isStableUserId(userId)) return allowAll || normalizedEntries.some((entry) => entry === userId) ? `user:${userId}` : void 0;
	if (!require_dangerous_name_matching.isDangerousNameMatchingEnabled(teams)) return;
	try {
		const [resolvedTarget, ...resolvedEntries] = await require_resolve_allowlist.resolveMSTeamsUserAllowlist({
			cfg,
			entries: [userId, ...normalizedEntries.filter((entry) => entry !== "*")]
		});
		if (!resolvedTarget?.resolved || !resolvedTarget.id) return;
		return allowAll || resolvedEntries.some((entry) => entry.resolved && entry.id?.toLowerCase() === resolvedTarget.id?.toLowerCase()) ? `user:${resolvedTarget.id}` : void 0;
	} catch {
		return;
	}
}
async function resolveDirectDmTarget(cfg, target) {
	if (cfg.channels?.msteams?.dmPolicy === "disabled") return;
	const userId = normalizeUserTarget(target);
	if (!userId) return;
	if (isStableUserId(userId)) return `user:${userId}`;
	if (!require_dangerous_name_matching.isDangerousNameMatchingEnabled(cfg.channels?.msteams)) return;
	try {
		const [resolved] = await require_resolve_allowlist.resolveMSTeamsUserAllowlist({
			cfg,
			entries: [userId]
		});
		return resolved?.resolved && resolved.id ? `user:${resolved.id}` : void 0;
	} catch {
		return;
	}
}
function resolveMSTeamsReadGroupPolicy(cfg) {
	const teams = cfg.channels?.msteams;
	return teams ? teams.groupPolicy ?? require_dm_policy_shared.resolveDefaultGroupPolicy(cfg) ?? "allowlist" : "disabled";
}
function isStableChannelKey(value) {
	return /^[0-9a-f-]{16,}$/i.test(value) || /^19:.+@thread\./i.test(value);
}
function isStableGraphTeamId(value) {
	return /^[0-9a-f-]{16,}$/i.test(value);
}
function isStableGraphChannelTarget(target) {
	const [teamId, channelId] = target.split("/", 2);
	return Boolean(teamId && channelId && isStableGraphTeamId(teamId) && isStableChannelKey(channelId));
}
function hasMutableChannelConfig(cfg) {
	const teams = cfg.channels?.msteams?.teams ?? {};
	return Object.entries(teams).some(([teamKey, teamConfig]) => {
		if (teamKey !== "*" && !isStableChannelKey(teamKey)) return true;
		return Object.keys(teamConfig?.channels ?? {}).some((channelKey) => channelKey !== "*" && !isStableChannelKey(channelKey));
	});
}
async function resolveConfiguredBotFrameworkTeamKey(cfg, graphTeamId) {
	const configuredTeams = cfg.channels?.msteams?.teams;
	if (!configuredTeams) return;
	const stableConfiguredKeys = Object.keys(configuredTeams).filter((teamKey) => teamKey !== "*" && /^19:.+@thread\./i.test(teamKey));
	if (stableConfiguredKeys.length === 0) return;
	const channelResult = await require_graph_users.listChannelsForTeamWithPageInfo(await require_graph_users.resolveGraphToken(cfg), graphTeamId);
	if (channelResult.truncated) return;
	const channelIds = new Set(channelResult.items.map((channel) => channel.id?.trim()).filter((channelId) => Boolean(channelId)));
	const matches = stableConfiguredKeys.filter((teamKey) => channelIds.has(teamKey));
	return matches.length === 1 ? matches[0] : void 0;
}
async function resolveStableChannelTarget(cfg, target) {
	if (isStableGraphChannelTarget(target)) return target;
	if (!require_dangerous_name_matching.isDangerousNameMatchingEnabled(cfg.channels?.msteams)) return;
	try {
		const [resolved] = await require_resolve_allowlist.resolveMSTeamsChannelAllowlist({
			cfg,
			entries: [target]
		});
		return resolved?.resolved && resolved.graphTeamId && resolved.channelId ? `${resolved.graphTeamId}/${resolved.channelId}` : void 0;
	} catch {
		return;
	}
}
async function resolveAllowedChannelTarget(cfg, target) {
	const teams = cfg.channels?.msteams;
	const groupPolicy = resolveMSTeamsReadGroupPolicy(cfg);
	if (groupPolicy === "disabled") return;
	const [teamId, channelId] = target.split("/", 2);
	if (!teamId || !channelId) return;
	const directRoute = require_html_entity_runtime.resolveMSTeamsRouteConfig({
		cfg: teams,
		teamId,
		teamName: teamId,
		conversationId: channelId,
		channelName: channelId,
		allowNameMatching: require_dangerous_name_matching.isDangerousNameMatchingEnabled(teams)
	});
	const stableTarget = await resolveStableChannelTarget(cfg, target);
	if (directRoute.allowed) return stableTarget;
	if (!directRoute.allowlistConfigured) return groupPolicy === "open" ? stableTarget : void 0;
	if (!stableTarget || !teams?.teams) return;
	const [stableTeamId, stableChannelId] = stableTarget.split("/", 2);
	if (!stableTeamId || !stableChannelId) return;
	try {
		const botFrameworkTeamKey = await resolveConfiguredBotFrameworkTeamKey(cfg, stableTeamId);
		if (botFrameworkTeamKey) {
			if (require_html_entity_runtime.resolveMSTeamsRouteConfig({
				cfg: teams,
				teamId: botFrameworkTeamKey,
				conversationId: stableChannelId
			}).allowed) return stableTarget;
		}
		if (!hasMutableChannelConfig(cfg)) return;
		const resolved = await require_resolve_allowlist.resolveMSTeamsTeamsConfig({
			cfg,
			teamIdMode: "graph",
			teams: teams.teams
		});
		return require_html_entity_runtime.resolveMSTeamsRouteConfig({
			cfg: {
				...teams,
				teams: resolved.teams
			},
			teamId: stableTeamId,
			conversationId: stableChannelId
		}).allowed ? stableTarget : void 0;
	} catch {
		return;
	}
}
function bothUnknownScopesAllowed(cfg) {
	const teams = cfg.channels?.msteams;
	return resolveMSTeamsReadGroupPolicy(cfg) === "open" && (teams?.dmPolicy ?? "pairing") === "open";
}
async function assertMSTeamsReadTargetAllowed(params) {
	const target = normalizeTarget(params.target);
	const isChannel = target.includes("/");
	const isDm = /^user:/i.test(target);
	const isChat = require_resolve_allowlist.looksLikeMSTeamsConversationId(target);
	const current = isCurrentMSTeamsReadTarget({
		ctx: params.ctx,
		target
	});
	const directOperator = params.ctx.conversationReadOrigin === "direct-operator";
	const currentChatType = params.ctx.toolContext?.currentChatType;
	const allowedTarget = directOperator ? isChannel ? resolveMSTeamsReadGroupPolicy(params.cfg) !== "disabled" ? await resolveStableChannelTarget(params.cfg, target) : void 0 : isDm ? await resolveDirectDmTarget(params.cfg, target) : isChat && resolveMSTeamsReadGroupPolicy(params.cfg) !== "disabled" && params.cfg.channels?.msteams?.dmPolicy !== "disabled" ? target : void 0 : current ? isChannel ? resolveMSTeamsReadGroupPolicy(params.cfg) !== "disabled" ? target : void 0 : isDm ? params.cfg.channels?.msteams?.dmPolicy !== "disabled" ? target : void 0 : currentChatType === "direct" ? params.cfg.channels?.msteams?.dmPolicy !== "disabled" ? target : void 0 : currentChatType === "group" || currentChatType === "channel" ? resolveMSTeamsReadGroupPolicy(params.cfg) !== "disabled" ? target : void 0 : resolveMSTeamsReadGroupPolicy(params.cfg) !== "disabled" && params.cfg.channels?.msteams?.dmPolicy !== "disabled" ? target : void 0 : isChannel ? await resolveAllowedChannelTarget(params.cfg, target) : isDm ? await resolveAllowedDmTarget(params.cfg, target) : isChat ? bothUnknownScopesAllowed(params.cfg) ? target : void 0 : false;
	if (!allowedTarget) throw new require_common.ToolAuthorizationError("Microsoft Teams read target is not allowed.");
	return allowedTarget;
}
async function assertMSTeamsTeamEnumerationAllowed(params) {
	const teams = params.cfg.channels?.msteams;
	const groupPolicy = resolveMSTeamsReadGroupPolicy(params.cfg);
	if (groupPolicy === "disabled") throw new require_common.ToolAuthorizationError("Microsoft Teams channel list is not allowed.");
	const directRoute = require_html_entity_runtime.resolveMSTeamsRouteConfig({
		cfg: teams,
		teamId: params.teamId,
		teamName: params.teamId,
		conversationId: "__operator_all_channels__",
		allowNameMatching: require_dangerous_name_matching.isDangerousNameMatchingEnabled(teams)
	});
	const stableTeamId = isStableGraphTeamId(params.teamId) ? params.teamId : require_dangerous_name_matching.isDangerousNameMatchingEnabled(teams) ? (await require_resolve_allowlist.resolveMSTeamsChannelAllowlist({
		cfg: params.cfg,
		entries: [params.teamId]
	}))[0]?.graphTeamId : void 0;
	if (!stableTeamId) throw new require_common.ToolAuthorizationError("Microsoft Teams channel list requires access to every channel in the team.");
	if (params.ctx?.conversationReadOrigin === "direct-operator") return stableTeamId;
	let allowed = directRoute.allowlistConfigured ? directRoute.allowed : groupPolicy === "open";
	if (!allowed && teams?.teams) try {
		const botFrameworkTeamKey = await resolveConfiguredBotFrameworkTeamKey(params.cfg, stableTeamId);
		if (botFrameworkTeamKey) allowed = require_html_entity_runtime.resolveMSTeamsRouteConfig({
			cfg: teams,
			teamId: botFrameworkTeamKey,
			conversationId: "__operator_all_channels__"
		}).allowed;
		if (!allowed && hasMutableChannelConfig(params.cfg)) {
			const resolved = await require_resolve_allowlist.resolveMSTeamsTeamsConfig({
				cfg: params.cfg,
				teamIdMode: "graph",
				teams: teams.teams
			});
			allowed = require_html_entity_runtime.resolveMSTeamsRouteConfig({
				cfg: {
					...teams,
					teams: resolved.teams
				},
				teamId: stableTeamId,
				conversationId: "__operator_all_channels__"
			}).allowed;
		}
	} catch {
		allowed = false;
	}
	if (!allowed) throw new require_common.ToolAuthorizationError("Microsoft Teams channel list requires access to every channel in the team.");
	return stableTeamId;
}
//#endregion
//#region extensions/msteams/src/session-route.ts
function resolveMSTeamsOutboundSessionRoute(params) {
	const trimmed = stripChannelTargetPrefix(params.target, "msteams", "teams");
	if (!trimmed) return null;
	const isUser = require_string_coerce.normalizeLowercaseStringOrEmpty(trimmed).startsWith("user:");
	const rawId = stripTargetKindPrefix(trimmed);
	if (!rawId) return null;
	const conversationId = require_thread_session.normalizeMSTeamsConversationId(rawId);
	const isChannel = !isUser && /@thread\.tacv2/i.test(conversationId);
	const embeddedThreadId = require_thread_session.extractMSTeamsConversationMessageId(rawId);
	const explicitThreadId = params.threadId ?? params.replyToId;
	const channelThreadId = embeddedThreadId ?? (explicitThreadId !== void 0 && explicitThreadId !== null ? String(explicitThreadId) : void 0);
	const resolvedKind = params.resolvedTarget?.kind;
	const isCanonicalUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
	const recipientSessionExact = (isUser || resolvedKind === "user") && isCanonicalUserId || (isChannel ? channelThreadId !== void 0 : resolvedKind === "group");
	const route = buildChannelOutboundSessionRoute({
		cfg: params.cfg,
		agentId: params.agentId,
		channel: "msteams",
		accountId: params.accountId,
		recipientSessionExact,
		peer: {
			kind: isUser ? "direct" : isChannel ? "channel" : "group",
			id: conversationId
		},
		chatType: isUser ? "direct" : isChannel ? "channel" : "group",
		from: isUser ? `msteams:${conversationId}` : isChannel ? `msteams:channel:${conversationId}` : `msteams:group:${conversationId}`,
		to: isUser ? `user:${conversationId}` : `conversation:${conversationId}`
	});
	return isChannel ? {
		...route,
		sessionKey: require_thread_session.resolveMSTeamsRouteSessionKey({
			baseSessionKey: route.baseSessionKey,
			isChannel: true,
			conversationMessageId: channelThreadId
		}),
		...channelThreadId !== void 0 ? { threadId: channelThreadId } : {}
	} : route;
}
//#endregion
//#region extensions/msteams/src/channel.ts
const meta = {
	id: "msteams",
	label: "Microsoft Teams",
	selectionLabel: "Microsoft Teams (Bot Framework)",
	docsPath: "/channels/msteams",
	docsLabel: "msteams",
	blurb: "Teams SDK; enterprise support.",
	aliases: ["teams"],
	order: 60
};
const TEAMS_GRAPH_PERMISSION_HINTS = {
	"ChannelMessage.Read.All": "channel history",
	"Chat.Read.All": "chat history",
	"Channel.ReadBasic.All": "channel list",
	"Team.ReadBasic.All": "team list",
	"TeamsActivity.Read.All": "teams activity",
	"Sites.Read.All": "files (SharePoint)",
	"Files.Read.All": "files (OneDrive)"
};
const MSTEAMS_GROUP_MANAGEMENT_ACTIONS = /* @__PURE__ */ new Set([
	"addParticipant",
	"removeParticipant",
	"renameGroup"
]);
const collectMSTeamsSecurityWarnings = require_runtime_api.createAllowlistProviderGroupPolicyWarningCollector({
	providerConfigPresent: (cfg) => cfg.channels?.msteams !== void 0,
	resolveGroupPolicy: ({ cfg }) => cfg.channels?.msteams?.groupPolicy,
	collect: ({ groupPolicy }) => groupPolicy === "open" ? ["- MS Teams groups: groupPolicy=\"open\" allows any member to trigger (mention-gated). Set channels.msteams.groupPolicy=\"allowlist\" + channels.msteams.groupAllowFrom to restrict senders."] : []
});
const loadMSTeamsChannelRuntime = require_lazy_runtime.createLazyRuntimeNamedExport(() => Promise.resolve().then(() => require("./channel.runtime-DVAWinnH.cjs")), "msTeamsChannelRuntime");
const resolveMSTeamsChannelConfig = (cfg) => ({
	allowFrom: cfg.channels?.msteams?.allowFrom,
	defaultTo: cfg.channels?.msteams?.defaultTo
});
const msteamsConfigAdapter = require_channel_config_helpers.createTopLevelChannelConfigAdapter({
	sectionKey: "msteams",
	resolveAccount: (cfg) => ({
		accountId: require_account_id.DEFAULT_ACCOUNT_ID,
		enabled: cfg.channels?.msteams?.enabled !== false,
		configured: Boolean(require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams))
	}),
	resolveAccessorAccount: ({ cfg }) => resolveMSTeamsChannelConfig(cfg),
	resolveAllowFrom: (account) => account.allowFrom,
	formatAllowFrom: (allowFrom) => require_runtime_api.formatAllowFromLowercase({ allowFrom }),
	resolveDefaultTo: (account) => account.defaultTo
});
function jsonActionResult(data) {
	return {
		content: [{
			type: "text",
			text: JSON.stringify(data)
		}],
		details: data
	};
}
function jsonMSTeamsActionResult(action, data = {}) {
	return jsonActionResult({
		channel: "msteams",
		action,
		...data
	});
}
function jsonMSTeamsOkActionResult(action, data = {}) {
	return jsonActionResult({
		ok: true,
		channel: "msteams",
		action,
		...data
	});
}
function jsonMSTeamsConversationResult(conversationId) {
	return jsonActionResultWithDetails({
		ok: true,
		channel: "msteams",
		conversationId
	}, {
		ok: true,
		channel: "msteams"
	});
}
function jsonActionResultWithDetails(contentData, details) {
	return {
		content: [{
			type: "text",
			text: JSON.stringify(contentData)
		}],
		details
	};
}
const MSTEAMS_REACTION_TYPES = [
	"like",
	"heart",
	"laugh",
	"surprised",
	"sad",
	"angry"
];
function actionError(message) {
	return {
		isError: true,
		content: [{
			type: "text",
			text: message
		}],
		details: { error: message }
	};
}
function requireMSTeamsGroupManagementAuthorization(ctx) {
	if (ctx.senderIsOwner === true || ctx.gatewayClientScopes?.includes("operator.admin")) return null;
	return actionError("Microsoft Teams group management requires an owner or operator.admin requester.");
}
function resolveActionTarget(params, currentChannelId) {
	return typeof params.to === "string" ? params.to.trim() : typeof params.target === "string" ? params.target.trim() : currentChannelId?.trim() ?? "";
}
function resolveGraphActionTarget(params, currentChannelId, currentGraphChannelId, currentChatType) {
	const explicitTarget = resolveActionTarget(params);
	const currentChannelTarget = currentChannelId?.trim();
	const currentGraphTarget = currentGraphChannelId?.trim();
	if (explicitTarget) {
		if (currentChatType === "channel" && currentGraphTarget && currentChannelTarget && explicitTarget === currentChannelTarget) return currentGraphTarget;
		return explicitTarget;
	}
	if (currentGraphTarget) return currentGraphTarget;
	return currentChatType === "channel" ? "" : currentChannelTarget ?? "";
}
function resolveCurrentGraphActionTarget(toolContext) {
	return require_string_coerce.normalizeOptionalString(toolContext?.currentGraphChannelId) ?? require_string_coerce.normalizeOptionalString(toolContext?.currentMessagingTarget);
}
function resolveActionMessageId(params) {
	return require_string_coerce.normalizeOptionalString(params.messageId) ?? "";
}
function resolveActionPinnedMessageId(params) {
	return typeof params.pinnedMessageId === "string" ? params.pinnedMessageId.trim() : typeof params.messageId === "string" ? params.messageId.trim() : "";
}
function resolveActionQuery(params) {
	return require_string_coerce.normalizeOptionalString(params.query) ?? "";
}
function resolveActionContent(params) {
	return typeof params.text === "string" ? params.text : typeof params.content === "string" ? params.content : typeof params.message === "string" ? params.message : "";
}
function readOptionalTrimmedString(params, key) {
	return typeof params[key] === "string" ? params[key].trim() || void 0 : void 0;
}
function resolveActionUploadFilePath(params) {
	for (const key of [
		"filePath",
		"path",
		"media"
	]) if (typeof params[key] === "string") {
		const value = params[key];
		if (value.trim()) return value;
	}
}
function resolveRequiredActionTarget(params) {
	const to = params.graphOnly ? resolveGraphActionTarget(params.toolParams, params.currentChannelId, params.currentGraphChannelId, params.currentChatType) : resolveActionTarget(params.toolParams, params.currentChannelId);
	if (!to) return actionError(`${params.actionLabel} requires a target (to).`);
	return to;
}
function resolveRequiredActionMessageTarget(params) {
	const to = params.graphOnly ? resolveGraphActionTarget(params.toolParams, params.currentChannelId, params.currentGraphChannelId, params.currentChatType) : resolveActionTarget(params.toolParams, params.currentChannelId);
	const messageId = resolveActionMessageId(params.toolParams);
	if (!to || !messageId) return actionError(`${params.actionLabel} requires a target (to) and messageId.`);
	return {
		to,
		messageId
	};
}
function resolveRequiredActionPinnedMessageTarget(params) {
	const to = params.graphOnly ? resolveGraphActionTarget(params.toolParams, params.currentChannelId, params.currentGraphChannelId, params.currentChatType) : resolveActionTarget(params.toolParams, params.currentChannelId);
	const pinnedMessageId = resolveActionPinnedMessageId(params.toolParams);
	if (!to || !pinnedMessageId) return actionError(`${params.actionLabel} requires a target (to) and pinnedMessageId.`);
	return {
		to,
		pinnedMessageId
	};
}
async function runWithRequiredActionTarget(params) {
	const to = resolveRequiredActionTarget({
		actionLabel: params.actionLabel,
		toolParams: params.toolParams,
		currentChannelId: params.currentChannelId,
		currentGraphChannelId: params.currentGraphChannelId,
		currentChatType: params.currentChatType,
		graphOnly: params.graphOnly
	});
	if (typeof to !== "string") return to;
	return await params.run(to);
}
async function runWithRequiredActionMessageTarget(params) {
	const target = resolveRequiredActionMessageTarget({
		actionLabel: params.actionLabel,
		toolParams: params.toolParams,
		currentChannelId: params.currentChannelId,
		currentGraphChannelId: params.currentGraphChannelId,
		currentChatType: params.currentChatType,
		graphOnly: params.graphOnly
	});
	if ("isError" in target) return target;
	return await params.run(target);
}
async function runWithRequiredActionPinnedMessageTarget(params) {
	const target = resolveRequiredActionPinnedMessageTarget({
		actionLabel: params.actionLabel,
		toolParams: params.toolParams,
		currentChannelId: params.currentChannelId,
		currentGraphChannelId: params.currentGraphChannelId,
		currentChatType: params.currentChatType,
		graphOnly: params.graphOnly
	});
	if ("isError" in target) return target;
	return await params.run(target);
}
function describeMSTeamsMessageTool({ cfg }) {
	const enabled = cfg.channels?.msteams?.enabled !== false && Boolean(require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams));
	return {
		actions: enabled ? [
			"upload-file",
			"poll",
			"edit",
			"delete",
			"pin",
			"unpin",
			"list-pins",
			"read",
			"react",
			"reactions",
			"search",
			"member-info",
			"channel-list",
			"channel-info",
			"addParticipant",
			"removeParticipant",
			"renameGroup"
		] : [],
		capabilities: enabled ? ["presentation"] : [],
		schema: enabled ? {
			actions: ["unpin"],
			properties: { pinnedMessageId: typebox.Type.Optional(typebox.Type.String({ description: "Pinned message resource ID for unpin (from pin or list-pins, not the chat message ID)." })) }
		} : null
	};
}
const msteamsChannelOutbound = {
	deliveryMode: "direct",
	chunker: require_runtime_api.chunkTextForOutbound,
	chunkerMode: "markdown",
	textChunkLimit: 4e3,
	pollMaxOptions: 12,
	deliveryCapabilities: { durableFinal: {
		text: true,
		media: true,
		payload: true,
		messageSendingHooks: true
	} },
	presentationCapabilities: require_presentation.MSTEAMS_PRESENTATION_CAPABILITIES,
	...createRuntimeOutboundDelegates({
		getRuntime: loadMSTeamsChannelRuntime,
		renderPresentation: { resolve: (runtime) => runtime.msteamsOutbound.renderPresentation },
		sendPayload: { resolve: (runtime) => runtime.msteamsOutbound.sendPayload },
		sendText: { resolve: (runtime) => runtime.msteamsOutbound.sendText },
		sendMedia: { resolve: (runtime) => runtime.msteamsOutbound.sendMedia },
		sendPoll: { resolve: (runtime) => runtime.msteamsOutbound.sendPoll }
	})
};
const msteamsMessageAdapter = require_qr_terminal.createChannelMessageAdapterFromOutbound({
	id: "msteams",
	outbound: msteamsChannelOutbound,
	live: {
		capabilities: {
			draftPreview: true,
			previewFinalization: true,
			progressUpdates: true,
			nativeStreaming: true
		},
		finalizer: { capabilities: {
			finalEdit: true,
			normalFallback: true,
			previewReceipt: true
		} }
	}
});
const msteamsPlugin = createChatChannelPlugin({
	base: {
		id: "msteams",
		meta: {
			...meta,
			aliases: [...meta.aliases]
		},
		setupWizard: require_setup_surface.msteamsSetupWizard,
		capabilities: {
			chatTypes: [
				"direct",
				"channel",
				"thread"
			],
			polls: true,
			threads: true,
			media: true
		},
		streaming: { blockStreamingCoalesceDefaults: {
			minChars: 1500,
			idleMs: 1e3
		} },
		agentPrompt: { messageToolHints: () => ["- Adaptive Cards supported. Use `action=send` with `card={type,version,body}` to send rich cards.", "- MSTeams targeting: omit `target` to reply to the current conversation (auto-inferred). Explicit targets: `user:ID` or `user:Display Name` (requires Graph API) for DMs, `conversation:19:...@thread.tacv2` for groups/channels. Prefer IDs over display names for speed."] },
		groups: { resolveToolPolicy: require_html_entity_runtime.resolveMSTeamsGroupToolPolicy },
		reload: { configPrefixes: ["channels.msteams"] },
		configSchema: require_config_schema$2.MSTeamsChannelConfigSchema,
		config: {
			...msteamsConfigAdapter,
			isConfigured: (_account, cfg) => Boolean(require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams)),
			describeAccount: (account) => require_read_only.describeAccountSnapshot({
				account,
				configured: account.configured
			})
		},
		approvalCapability: msTeamsApprovalAuth,
		doctor: {
			dmAllowFromMode: "topOnly",
			groupModel: "hybrid",
			groupAllowFromFallbackToAllowFrom: true,
			warnOnEmptyGroupSenderAllowlist: true,
			collectMutableAllowlistWarnings: collectMSTeamsMutableAllowlistWarnings
		},
		setup: require_setup_surface.msteamsSetupAdapter,
		messaging: {
			targetPrefixes: ["msteams", "teams"],
			directTargetStyle: "user-prefixed",
			normalizeTarget: require_resolve_allowlist.normalizeMSTeamsMessagingTarget,
			resolveOutboundSessionRoute: (params) => resolveMSTeamsOutboundSessionRoute(params),
			targetResolver: {
				looksLikeId: (raw) => require_resolve_allowlist.looksLikeMSTeamsTargetId(raw),
				hint: "<conversationId|user:ID|conversation:ID>"
			}
		},
		message: msteamsMessageAdapter,
		directory: createChannelDirectoryAdapter({
			self: async ({ cfg }) => {
				const creds = require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams);
				if (!creds) return null;
				return {
					kind: "user",
					id: creds.appId,
					name: creds.appId
				};
			},
			listPeers: async ({ cfg, query, limit }) => require_directory_runtime.listDirectoryEntriesFromSources({
				kind: "user",
				sources: [cfg.channels?.msteams?.allowFrom ?? [], Object.keys(cfg.channels?.msteams?.dms ?? {})],
				query,
				limit,
				normalizeId: (raw) => {
					const normalized = require_resolve_allowlist.normalizeMSTeamsMessagingTarget(raw) ?? raw;
					const lowered = normalized.toLowerCase();
					if (lowered.startsWith("user:") || lowered.startsWith("conversation:")) return normalized;
					return `user:${normalized}`;
				}
			}),
			listGroups: async ({ cfg, query, limit }) => require_directory_runtime.listDirectoryEntriesFromSources({
				kind: "group",
				sources: [Object.values(cfg.channels?.msteams?.teams ?? {}).flatMap((team) => Object.keys(team.channels ?? {}))],
				query,
				limit,
				normalizeId: (raw) => `conversation:${raw.replace(/^conversation:/i, "").trim()}`
			}),
			...createRuntimeDirectoryLiveAdapter({
				getRuntime: loadMSTeamsChannelRuntime,
				listPeersLive: (runtime) => runtime.listMSTeamsDirectoryPeersLive,
				listGroupsLive: (runtime) => runtime.listMSTeamsDirectoryGroupsLive
			})
		}),
		resolver: { resolveTargets: async ({ cfg, inputs, kind, runtime }) => {
			const results = inputs.map((input) => ({
				input,
				resolved: false,
				id: void 0,
				name: void 0,
				note: void 0
			}));
			const stripPrefix = (value) => require_resolve_allowlist.normalizeMSTeamsUserInput(value);
			const markPendingLookupFailed = (pending) => {
				pending.forEach(({ index }) => {
					const entry = results[index];
					if (entry) entry.note = "lookup failed";
				});
			};
			const resolvePending = async (pending, resolveEntries, applyResolvedEntry) => {
				if (pending.length === 0) return;
				try {
					(await resolveEntries(pending.map((entry) => entry.query))).forEach((entry, idx) => {
						const target = results[pending[idx]?.index ?? -1];
						if (!target) return;
						applyResolvedEntry(target, entry);
					});
				} catch (err) {
					runtime.error?.(`msteams resolve failed: ${String(err)}`);
					markPendingLookupFailed(pending);
				}
			};
			if (kind === "user") {
				const pending = [];
				results.forEach((entry, index) => {
					const trimmed = entry.input.trim();
					if (!trimmed) {
						entry.note = "empty input";
						return;
					}
					const cleaned = stripPrefix(trimmed);
					if (/^[0-9a-fA-F-]{16,}$/.test(cleaned) || cleaned.includes("@")) {
						entry.resolved = true;
						entry.id = cleaned;
						return;
					}
					pending.push({
						input: entry.input,
						query: cleaned,
						index
					});
				});
				await resolvePending(pending, (entries) => require_resolve_allowlist.resolveMSTeamsUserAllowlist({
					cfg,
					entries
				}), (target, entry) => {
					target.resolved = entry.resolved;
					target.id = entry.id;
					target.name = entry.name;
					target.note = entry.note;
				});
				return results;
			}
			const pending = [];
			results.forEach((entry, index) => {
				const trimmed = entry.input.trim();
				if (!trimmed) {
					entry.note = "empty input";
					return;
				}
				const conversationId = require_resolve_allowlist.parseMSTeamsConversationId(trimmed);
				if (conversationId !== null) {
					entry.resolved = Boolean(conversationId);
					entry.id = conversationId || void 0;
					entry.note = conversationId ? "conversation id" : "empty conversation id";
					return;
				}
				const parsed = require_resolve_allowlist.parseMSTeamsTeamChannelInput(trimmed);
				if (!parsed.team) {
					entry.note = "missing team";
					return;
				}
				const query = parsed.channel ? `${parsed.team}/${parsed.channel}` : parsed.team;
				pending.push({
					input: entry.input,
					query,
					index
				});
			});
			await resolvePending(pending, (entries) => require_resolve_allowlist.resolveMSTeamsChannelAllowlist({
				cfg,
				entries
			}), (target, entry) => {
				if (!entry.resolved || !entry.teamId) {
					target.resolved = false;
					target.note = entry.note;
					return;
				}
				target.resolved = true;
				if (entry.channelId) {
					target.id = `${entry.teamId}/${entry.channelId}`;
					target.name = entry.channelName && entry.teamName ? `${entry.teamName}/${entry.channelName}` : entry.channelName ?? entry.teamName;
				} else {
					target.id = entry.teamId;
					target.name = entry.teamName;
					target.note = "team id";
				}
				if (entry.note) target.note = entry.note;
			});
			return results;
		} },
		actions: {
			describeMessageTool: describeMSTeamsMessageTool,
			requiresTrustedRequesterSender: ({ action, toolContext }) => require_string_coerce.normalizeOptionalString(toolContext?.currentChannelProvider)?.toLowerCase() === "msteams" && MSTEAMS_GROUP_MANAGEMENT_ACTIONS.has(action),
			handleAction: async (ctx) => {
				if (MSTEAMS_GROUP_MANAGEMENT_ACTIONS.has(ctx.action)) {
					const authError = requireMSTeamsGroupManagementAuthorization(ctx);
					if (authError) return authError;
				}
				const presentation = ctx.action === "send" ? require_payload.normalizeMessagePresentation(ctx.params.presentation) : void 0;
				if (ctx.action === "send" && presentation) {
					const card = require_presentation.buildMSTeamsPresentationCard({
						presentation,
						text: resolveActionContent(ctx.params)
					});
					return await runWithRequiredActionTarget({
						actionLabel: "Card send",
						toolParams: ctx.params,
						run: async (to) => {
							const { sendAdaptiveCardMSTeams } = await loadMSTeamsChannelRuntime();
							const result = await sendAdaptiveCardMSTeams({
								cfg: ctx.cfg,
								to,
								card
							});
							return jsonActionResultWithDetails({
								ok: true,
								channel: "msteams",
								messageId: result.messageId,
								conversationId: result.conversationId
							}, {
								ok: true,
								channel: "msteams",
								messageId: result.messageId
							});
						}
					});
				}
				if (ctx.action === "upload-file") {
					const mediaUrl = resolveActionUploadFilePath(ctx.params);
					if (!mediaUrl) return actionError("Upload-file requires media, filePath, or path.");
					return await runWithRequiredActionTarget({
						actionLabel: "Upload-file",
						toolParams: ctx.params,
						currentChannelId: ctx.toolContext?.currentChannelId,
						run: async (to) => {
							const { sendMessageMSTeams } = await loadMSTeamsChannelRuntime();
							const result = await sendMessageMSTeams({
								cfg: ctx.cfg,
								to,
								text: resolveActionContent(ctx.params),
								mediaUrl,
								filename: readOptionalTrimmedString(ctx.params, "filename") ?? readOptionalTrimmedString(ctx.params, "title"),
								mediaLocalRoots: ctx.mediaLocalRoots,
								mediaReadFile: ctx.mediaReadFile
							});
							return jsonActionResultWithDetails({
								ok: true,
								channel: "msteams",
								action: "upload-file",
								messageId: result.messageId,
								conversationId: result.conversationId,
								...result.pendingUploadId ? { pendingUploadId: result.pendingUploadId } : {}
							}, {
								ok: true,
								channel: "msteams",
								messageId: result.messageId,
								...result.pendingUploadId ? { pendingUploadId: result.pendingUploadId } : {}
							});
						}
					});
				}
				if (ctx.action === "edit") {
					const content = resolveActionContent(ctx.params);
					if (!content) return actionError("Edit requires content.");
					return await runWithRequiredActionMessageTarget({
						actionLabel: "Edit",
						toolParams: ctx.params,
						currentChannelId: ctx.toolContext?.currentChannelId,
						run: async (target) => {
							const to = await assertMSTeamsReadTargetAllowed({
								cfg: ctx.cfg,
								ctx,
								target: target.to
							});
							const { editMessageMSTeams } = await loadMSTeamsChannelRuntime();
							return jsonMSTeamsConversationResult((await editMessageMSTeams({
								cfg: ctx.cfg,
								to,
								activityId: target.messageId,
								text: content
							})).conversationId);
						}
					});
				}
				if (ctx.action === "delete") return await runWithRequiredActionMessageTarget({
					actionLabel: "Delete",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					run: async (target) => {
						const to = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: target.to
						});
						const { deleteMessageMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsConversationResult((await deleteMessageMSTeams({
							cfg: ctx.cfg,
							to,
							activityId: target.messageId
						})).conversationId);
					}
				});
				if (ctx.action === "read") return await runWithRequiredActionMessageTarget({
					actionLabel: "Read",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (target) => {
						const to = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: target.to
						});
						const { getMessageMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsOkActionResult("read", { message: await getMessageMSTeams({
							cfg: ctx.cfg,
							to,
							messageId: target.messageId
						}) });
					}
				});
				if (ctx.action === "pin") return await runWithRequiredActionMessageTarget({
					actionLabel: "Pin",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (target) => {
						const to = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: target.to
						});
						const { pinMessageMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsActionResult("pin", await pinMessageMSTeams({
							cfg: ctx.cfg,
							to,
							messageId: target.messageId
						}));
					}
				});
				if (ctx.action === "unpin") return await runWithRequiredActionPinnedMessageTarget({
					actionLabel: "Unpin",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (target) => {
						const to = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: target.to
						});
						const { unpinMessageMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsActionResult("unpin", await unpinMessageMSTeams({
							cfg: ctx.cfg,
							to,
							pinnedMessageId: target.pinnedMessageId
						}));
					}
				});
				if (ctx.action === "list-pins") return await runWithRequiredActionTarget({
					actionLabel: "List-pins",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (to) => {
						const allowedTarget = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: to
						});
						const { listPinsMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsOkActionResult("list-pins", await listPinsMSTeams({
							cfg: ctx.cfg,
							to: allowedTarget
						}));
					}
				});
				if (ctx.action === "react") return await runWithRequiredActionMessageTarget({
					actionLabel: "React",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (target) => {
						const emoji = typeof ctx.params.emoji === "string" ? ctx.params.emoji.trim() : "";
						const remove = typeof ctx.params.remove === "boolean" ? ctx.params.remove : false;
						if (!emoji) return {
							isError: true,
							content: [{
								type: "text",
								text: `React requires an emoji (reaction type). Valid types: ${MSTEAMS_REACTION_TYPES.join(", ")}.`
							}],
							details: {
								error: "React requires an emoji (reaction type).",
								validTypes: [...MSTEAMS_REACTION_TYPES]
							}
						};
						const to = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: target.to
						});
						if (remove) {
							const { unreactMessageMSTeams } = await loadMSTeamsChannelRuntime();
							return jsonMSTeamsActionResult("react", {
								removed: true,
								reactionType: emoji,
								...await unreactMessageMSTeams({
									cfg: ctx.cfg,
									to,
									messageId: target.messageId,
									reactionType: emoji
								})
							});
						}
						const { reactMessageMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsActionResult("react", {
							reactionType: emoji,
							...await reactMessageMSTeams({
								cfg: ctx.cfg,
								to,
								messageId: target.messageId,
								reactionType: emoji
							})
						});
					}
				});
				if (ctx.action === "reactions") return await runWithRequiredActionMessageTarget({
					actionLabel: "Reactions",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (target) => {
						const to = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: target.to
						});
						const { listReactionsMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsOkActionResult("reactions", await listReactionsMSTeams({
							cfg: ctx.cfg,
							to,
							messageId: target.messageId
						}));
					}
				});
				if (ctx.action === "search") return await runWithRequiredActionTarget({
					actionLabel: "Search",
					toolParams: ctx.params,
					currentChannelId: ctx.toolContext?.currentChannelId,
					currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
					currentChatType: ctx.toolContext?.currentChatType,
					graphOnly: true,
					run: async (to) => {
						const allowedTarget = await assertMSTeamsReadTargetAllowed({
							cfg: ctx.cfg,
							ctx,
							target: to
						});
						const query = resolveActionQuery(ctx.params);
						if (!query) return actionError("Search requires a target (to) and query.");
						const limit = typeof ctx.params.limit === "number" ? ctx.params.limit : void 0;
						const from = typeof ctx.params.from === "string" ? ctx.params.from.trim() : void 0;
						const { searchMessagesMSTeams } = await loadMSTeamsChannelRuntime();
						return jsonMSTeamsOkActionResult("search", await searchMessagesMSTeams({
							cfg: ctx.cfg,
							to: allowedTarget,
							query,
							from: from || void 0,
							limit
						}));
					}
				});
				if (ctx.action === "member-info") {
					const userId = require_string_coerce.normalizeOptionalString(ctx.params.userId) ?? "";
					if (!userId) return actionError("member-info requires a userId.");
					return await runWithRequiredActionTarget({
						actionLabel: "member-info",
						toolParams: ctx.params,
						currentChannelId: ctx.toolContext?.currentChannelId,
						currentGraphChannelId: resolveCurrentGraphActionTarget(ctx.toolContext),
						currentChatType: ctx.toolContext?.currentChatType,
						graphOnly: true,
						run: async (target) => {
							const to = await assertMSTeamsReadTargetAllowed({
								cfg: ctx.cfg,
								ctx,
								target
							});
							const currentRequesterId = isCurrentMSTeamsReadTarget({
								ctx,
								target: to
							}) ? ctx.requesterSenderId : void 0;
							const { getMemberInfoMSTeams } = await loadMSTeamsChannelRuntime();
							return jsonMSTeamsOkActionResult("member-info", await getMemberInfoMSTeams({
								cfg: ctx.cfg,
								to,
								userId,
								currentRequesterId
							}));
						}
					});
				}
				if (ctx.action === "channel-list") {
					const teamId = require_string_coerce.normalizeOptionalString(ctx.params.teamId) ?? "";
					if (!teamId) return actionError("channel-list requires a teamId.");
					const graphTeamId = await assertMSTeamsTeamEnumerationAllowed({
						cfg: ctx.cfg,
						ctx,
						teamId
					});
					const { listChannelsMSTeams } = await loadMSTeamsChannelRuntime();
					return jsonMSTeamsOkActionResult("channel-list", await listChannelsMSTeams({
						cfg: ctx.cfg,
						teamId: graphTeamId
					}));
				}
				if (ctx.action === "channel-info") {
					const teamId = require_string_coerce.normalizeOptionalString(ctx.params.teamId) ?? "";
					const channelId = require_string_coerce.normalizeOptionalString(ctx.params.channelId) ?? "";
					if (!teamId || !channelId) return actionError("channel-info requires teamId and channelId.");
					const [graphTeamId, graphChannelId] = (await assertMSTeamsReadTargetAllowed({
						cfg: ctx.cfg,
						ctx,
						target: `${teamId}/${channelId}`
					})).split("/", 2);
					if (!graphTeamId || !graphChannelId) throw new Error("Authorized Microsoft Teams channel target is invalid.");
					const { getChannelInfoMSTeams } = await loadMSTeamsChannelRuntime();
					return jsonMSTeamsOkActionResult("channel-info", { channelInfo: (await getChannelInfoMSTeams({
						cfg: ctx.cfg,
						teamId: graphTeamId,
						channelId: graphChannelId
					})).channel });
				}
				if (ctx.action === "addParticipant") {
					const userId = typeof ctx.params.userId === "string" ? ctx.params.userId.trim() : "";
					if (!userId) return actionError("addParticipant requires a userId.");
					return await runWithRequiredActionTarget({
						actionLabel: "addParticipant",
						toolParams: ctx.params,
						currentChannelId: ctx.toolContext?.currentChannelId,
						run: async (to) => {
							const role = readOptionalTrimmedString(ctx.params, "role");
							const { addParticipantMSTeams } = await loadMSTeamsChannelRuntime();
							return jsonMSTeamsOkActionResult("addParticipant", await addParticipantMSTeams({
								cfg: ctx.cfg,
								to,
								userId,
								role
							}));
						}
					});
				}
				if (ctx.action === "removeParticipant") {
					const userId = typeof ctx.params.userId === "string" ? ctx.params.userId.trim() : "";
					if (!userId) return actionError("removeParticipant requires a userId.");
					return await runWithRequiredActionTarget({
						actionLabel: "removeParticipant",
						toolParams: ctx.params,
						currentChannelId: ctx.toolContext?.currentChannelId,
						run: async (to) => {
							const { removeParticipantMSTeams } = await loadMSTeamsChannelRuntime();
							return jsonMSTeamsOkActionResult("removeParticipant", await removeParticipantMSTeams({
								cfg: ctx.cfg,
								to,
								userId
							}));
						}
					});
				}
				if (ctx.action === "renameGroup") {
					const name = typeof ctx.params.name === "string" ? ctx.params.name.trim() : "";
					if (!name) return actionError("renameGroup requires a name.");
					return await runWithRequiredActionTarget({
						actionLabel: "renameGroup",
						toolParams: ctx.params,
						currentChannelId: ctx.toolContext?.currentChannelId,
						run: async (to) => {
							const { renameGroupMSTeams } = await loadMSTeamsChannelRuntime();
							return jsonMSTeamsOkActionResult("renameGroup", await renameGroupMSTeams({
								cfg: ctx.cfg,
								to,
								name
							}));
						}
					});
				}
				return null;
			}
		},
		status: require_runtime_api.createComputedAccountStatusAdapter({
			defaultRuntime: require_runtime_api.createDefaultChannelRuntimeState(require_account_id.DEFAULT_ACCOUNT_ID, { port: null }),
			buildChannelSummary: ({ snapshot }) => require_runtime_api.buildProbeChannelStatusSummary(snapshot, { port: snapshot.port ?? null }),
			probeAccount: async ({ cfg }) => await (await loadMSTeamsChannelRuntime()).probeMSTeams(cfg.channels?.msteams),
			formatCapabilitiesProbe: ({ probe }) => {
				const teamsProbe = probe;
				const lines = [];
				const appId = typeof teamsProbe?.appId === "string" ? teamsProbe.appId.trim() : "";
				if (appId) lines.push({ text: `App: ${appId}` });
				const graph = teamsProbe?.graph;
				if (graph) {
					const roles = Array.isArray(graph.roles) ? require_string_normalization.normalizeStringEntries(graph.roles) : [];
					const scopes = Array.isArray(graph.scopes) ? require_string_normalization.normalizeStringEntries(graph.scopes) : [];
					const formatPermission = (permission) => {
						const hint = TEAMS_GRAPH_PERMISSION_HINTS[permission];
						return hint ? `${permission} (${hint})` : permission;
					};
					if (!graph.ok) lines.push({
						text: `Graph: ${graph.error ?? "failed"}`,
						tone: "error"
					});
					else if (roles.length > 0 || scopes.length > 0) {
						if (roles.length > 0) lines.push({ text: `Graph roles: ${roles.map(formatPermission).join(", ")}` });
						if (scopes.length > 0) lines.push({ text: `Graph scopes: ${scopes.map(formatPermission).join(", ")}` });
					} else if (graph.ok) lines.push({ text: "Graph: ok" });
				}
				return lines;
			},
			resolveAccountSnapshot: ({ account, runtime }) => ({
				accountId: account.accountId,
				enabled: account.enabled,
				configured: account.configured,
				extra: { port: runtime?.port ?? null }
			})
		}),
		gateway: { startAccount: async (ctx) => {
			const { monitorMSTeamsProvider } = await Promise.resolve().then(() => require("./src-CMZ_E1re.cjs"));
			const port = ctx.cfg.channels?.msteams?.webhook?.port ?? 3978;
			ctx.setStatus({
				accountId: ctx.accountId,
				port
			});
			ctx.log?.info(`starting provider (port ${port})`);
			return monitorMSTeamsProvider({
				cfg: ctx.cfg,
				runtime: ctx.runtime,
				abortSignal: ctx.abortSignal
			});
		} }
	},
	security: { collectWarnings: require_runtime_api.projectConfigWarningCollector(collectMSTeamsSecurityWarnings) },
	pairing: { text: {
		idLabel: "msteamsUserId",
		message: require_runtime_api.PAIRING_APPROVED_MESSAGE,
		normalizeAllowEntry: createPairingPrefixStripper(/^(msteams|user):/i),
		notify: async ({ cfg, id, message }) => {
			const { sendMessageMSTeams } = await loadMSTeamsChannelRuntime();
			await sendMessageMSTeams({
				cfg,
				to: id,
				text: message
			});
		}
	} },
	threading: { buildToolContext: ({ context, hasRepliedRef }) => {
		const nativeChannelId = context.NativeChannelId?.trim();
		const hasChannelRoute = Boolean(nativeChannelId?.includes("/"));
		return {
			currentChannelId: require_string_coerce.normalizeOptionalString(context.To),
			currentChatType: context.ChatType === "direct" || context.ChatType === "group" || context.ChatType === "channel" ? context.ChatType : void 0,
			currentMessagingTarget: hasChannelRoute ? nativeChannelId : void 0,
			currentGraphChannelId: hasChannelRoute ? nativeChannelId : void 0,
			currentThreadTs: context.ReplyToId,
			hasRepliedRef
		};
	} },
	outbound: msteamsChannelOutbound
});
//#endregion
Object.defineProperty(exports, "msteamsPlugin", {
	enumerable: true,
	get: function() {
		return msteamsPlugin;
	}
});
