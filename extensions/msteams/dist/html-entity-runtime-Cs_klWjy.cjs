const require_runtime_api = require("./runtime-api-CfjFtGFK.cjs");
const require_plugins = require("./plugins-_-82JYfc.cjs");
require("./sessions-Bcpn-MAP.cjs");
//#region extensions/msteams/src/policy.ts
const teamScopeKey = (teamKey) => require_runtime_api.scopeKey(["team", teamKey]);
const channelScopeKey = (teamKey, channelKey) => require_runtime_api.scopeKey(["team", teamKey], ["channel", channelKey]);
function buildMSTeamsToolPolicyTree(teams) {
	const scopes = {};
	for (const [teamKey, team] of Object.entries(teams ?? {})) {
		scopes[teamScopeKey(teamKey)] = {
			tools: team.tools,
			toolsBySender: team.toolsBySender
		};
		for (const [channelKey, channel] of Object.entries(team.channels ?? {})) scopes[channelScopeKey(teamKey, channelKey)] = {
			tools: channel.tools,
			toolsBySender: channel.toolsBySender
		};
	}
	return { scopes };
}
function resolveMSTeamsToolPolicyScope(params) {
	const teams = params.cfg.teams ?? {};
	const tree = buildMSTeamsToolPolicyTree(teams);
	const teamMatch = require_plugins.resolveChannelEntryMatchWithFallback({
		entries: teams,
		keys: require_plugins.buildChannelKeyCandidates(params.groupSpace?.trim()),
		wildcardKey: "*",
		normalizeKey: require_plugins.normalizeChannelSlug
	});
	const matchedTeamKey = teamMatch.matchKey ?? teamMatch.key;
	if (teamMatch.entry && matchedTeamKey) {
		const channelMatch = require_plugins.resolveChannelEntryMatchWithFallback({
			entries: teamMatch.entry.channels ?? {},
			keys: require_plugins.buildChannelKeyCandidates(params.groupId?.trim()),
			wildcardKey: "*",
			normalizeKey: require_plugins.normalizeChannelSlug
		});
		const matchedChannelKey = channelMatch.matchKey ?? channelMatch.key;
		return {
			tree,
			path: [teamScopeKey(matchedTeamKey), ...channelMatch.entry && matchedChannelKey ? [channelScopeKey(matchedTeamKey, matchedChannelKey)] : []]
		};
	}
	return {
		tree,
		path: []
	};
}
function resolveMSTeamsCrossTeamScanScope(params) {
	const teams = params.cfg.teams ?? {};
	const tree = buildMSTeamsToolPolicyTree(teams);
	const groupId = params.groupId?.trim();
	if (!groupId) return {
		tree,
		path: []
	};
	const channelCandidates = require_plugins.buildChannelKeyCandidates(groupId);
	for (const [teamKey, team] of Object.entries(teams)) {
		const channelMatch = require_plugins.resolveChannelEntryMatchWithFallback({
			entries: team.channels ?? {},
			keys: channelCandidates,
			wildcardKey: "*",
			normalizeKey: require_plugins.normalizeChannelSlug
		});
		const matchedChannelKey = channelMatch.matchKey ?? channelMatch.key;
		if (channelMatch.entry && matchedChannelKey) return {
			tree,
			path: [teamScopeKey(teamKey), channelScopeKey(teamKey, matchedChannelKey)]
		};
	}
	return {
		tree,
		path: []
	};
}
function resolveMSTeamsRouteConfig(params) {
	const teamId = params.teamId?.trim();
	const teamName = params.teamName?.trim();
	const conversationId = params.conversationId?.trim();
	const channelName = params.channelName?.trim();
	const teams = params.cfg?.teams ?? {};
	const allowlistConfigured = Object.keys(teams).length > 0;
	const teamMatch = require_plugins.resolveChannelEntryMatchWithFallback({
		entries: teams,
		keys: require_plugins.buildChannelKeyCandidates(teamId, params.allowNameMatching ? teamName : void 0, params.allowNameMatching && teamName ? require_plugins.normalizeChannelSlug(teamName) : void 0),
		wildcardKey: "*",
		normalizeKey: require_plugins.normalizeChannelSlug
	});
	const teamConfig = teamMatch.entry;
	const channels = teamConfig?.channels ?? {};
	const channelAllowlistConfigured = Object.keys(channels).length > 0;
	const channelMatch = require_plugins.resolveChannelEntryMatchWithFallback({
		entries: channels,
		keys: require_plugins.buildChannelKeyCandidates(conversationId, params.allowNameMatching ? channelName : void 0, params.allowNameMatching && channelName ? require_plugins.normalizeChannelSlug(channelName) : void 0),
		wildcardKey: "*",
		normalizeKey: require_plugins.normalizeChannelSlug
	});
	const channelConfig = channelMatch.entry;
	return {
		teamConfig,
		channelConfig,
		allowlistConfigured,
		allowed: require_plugins.resolveNestedAllowlistDecision({
			outerConfigured: allowlistConfigured,
			outerMatched: Boolean(teamConfig),
			innerConfigured: channelAllowlistConfigured,
			innerMatched: Boolean(channelConfig)
		}),
		teamKey: teamMatch.matchKey ?? teamMatch.key,
		channelKey: channelMatch.matchKey ?? channelMatch.key,
		channelMatchKey: channelMatch.matchKey,
		channelMatchSource: channelMatch.matchSource === "direct" || channelMatch.matchSource === "wildcard" ? channelMatch.matchSource : void 0
	};
}
function resolveMSTeamsGroupToolPolicy(params) {
	const cfg = params.cfg.channels?.msteams;
	if (!cfg) return;
	const scope = resolveMSTeamsToolPolicyScope({
		cfg,
		groupSpace: params.groupSpace,
		groupId: params.groupId
	});
	const senderScope = {
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	};
	const resolved = require_runtime_api.resolveScopeToolsPolicy({
		...scope,
		...senderScope
	});
	if (resolved !== void 0) return resolved;
	if (scope.path.length > 1) return;
	return require_runtime_api.resolveScopeToolsPolicy({
		...resolveMSTeamsCrossTeamScanScope({
			cfg,
			groupId: params.groupId
		}),
		...senderScope
	});
}
function resolveMSTeamsAllowlistMatch(params) {
	return require_plugins.resolveAllowlistMatchSimple(params);
}
function resolveMSTeamsReplyPolicy(params) {
	if (params.isDirectMessage) return {
		requireMention: false,
		replyStyle: "thread"
	};
	const requireMention = params.channelConfig?.requireMention ?? params.teamConfig?.requireMention ?? params.globalConfig?.requireMention ?? true;
	return {
		requireMention,
		replyStyle: params.channelConfig?.replyStyle ?? params.teamConfig?.replyStyle ?? params.globalConfig?.replyStyle ?? (requireMention ? "thread" : "top-level")
	};
}
//#endregion
Object.defineProperty(exports, "resolveMSTeamsAllowlistMatch", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsAllowlistMatch;
	}
});
Object.defineProperty(exports, "resolveMSTeamsGroupToolPolicy", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsGroupToolPolicy;
	}
});
Object.defineProperty(exports, "resolveMSTeamsReplyPolicy", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsReplyPolicy;
	}
});
Object.defineProperty(exports, "resolveMSTeamsRouteConfig", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsRouteConfig;
	}
});
