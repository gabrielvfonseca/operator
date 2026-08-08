const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_error_format = require("./error-format-IzEUBRNs.cjs");
const require_manifest_contribution_ids = require("./manifest-contribution-ids-DiU20iE0.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/agents.binding-format.ts
/** Render one route binding as a compact CLI line fragment. */
function describeBinding(binding) {
	const match = binding.match;
	const parts = [match.channel];
	if (match.accountId) parts.push(`accountId=${match.accountId}`);
	if (match.peer) parts.push(`peer=${match.peer.kind}:${match.peer.id}`);
	if (match.guildId) parts.push(`guild=${match.guildId}`);
	if (match.teamId) parts.push(`team=${match.teamId}`);
	return parts.join(" ");
}
//#endregion
//#region src/commands/agents.bindings.ts
function bindingMatchKey(match) {
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(match.accountId) || "default";
	const identityKey = bindingMatchIdentityKey(match);
	return JSON.stringify([identityKey, accountId]);
}
function bindingMatchIdentityKey(match) {
	const roles = Array.isArray(match.roles) ? (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(match.roles) : [];
	return JSON.stringify([
		match.channel,
		match.peer?.kind ?? "",
		match.peer?.id ?? "",
		match.guildId ?? "",
		match.teamId ?? "",
		roles.join(",")
	]);
}
function canUpgradeBindingAccountScope(params) {
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.incoming.match.accountId)) return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.existing.match.accountId)) return false;
	if ((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.existing.agentId) !== params.normalizedIncomingAgentId) return false;
	return bindingMatchIdentityKey(params.existing.match) === bindingMatchIdentityKey(params.incoming.match);
}
/** Merge new route bindings into config while reporting adds, upgrades, skips, and conflicts. */
function applyAgentBindings(cfg, bindings) {
	const existingRoutes = [...require_bindings.listRouteBindings(cfg)];
	const nonRouteBindings = (cfg.bindings ?? []).filter((binding) => !require_bindings.isRouteBinding(binding));
	const existingMatchMap = /* @__PURE__ */ new Map();
	for (const binding of existingRoutes) {
		const key = bindingMatchKey(binding.match);
		if (!existingMatchMap.has(key)) existingMatchMap.set(key, (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(binding.agentId));
	}
	const added = [];
	const updated = [];
	const skipped = [];
	const conflicts = [];
	for (const binding of bindings) {
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(binding.agentId);
		const key = bindingMatchKey(binding.match);
		const existingAgentId = existingMatchMap.get(key);
		if (existingAgentId) {
			if (existingAgentId === agentId) skipped.push(binding);
			else conflicts.push({
				binding,
				existingAgentId
			});
			continue;
		}
		const upgradeIndex = existingRoutes.findIndex((candidate) => canUpgradeBindingAccountScope({
			existing: candidate,
			incoming: binding,
			normalizedIncomingAgentId: agentId
		}));
		if (upgradeIndex >= 0) {
			const current = existingRoutes[upgradeIndex];
			if (!current) continue;
			const previousKey = bindingMatchKey(current.match);
			const upgradedBinding = {
				...current,
				agentId,
				match: {
					...current.match,
					accountId: binding.match.accountId?.trim()
				}
			};
			existingRoutes[upgradeIndex] = upgradedBinding;
			existingMatchMap.delete(previousKey);
			existingMatchMap.set(bindingMatchKey(upgradedBinding.match), agentId);
			updated.push(upgradedBinding);
			continue;
		}
		existingMatchMap.set(key, agentId);
		added.push({
			...binding,
			agentId
		});
	}
	if (added.length === 0 && updated.length === 0) return {
		config: cfg,
		added,
		updated,
		skipped,
		conflicts
	};
	return {
		config: {
			...cfg,
			bindings: [
				...existingRoutes,
				...added,
				...nonRouteBindings
			]
		},
		added,
		updated,
		skipped,
		conflicts
	};
}
function resolveDefaultAccountId(cfg, provider) {
	const plugin = getBindingChannelPlugin(provider);
	if (!plugin) return require_account_id.DEFAULT_ACCOUNT_ID;
	return require_helpers.resolveChannelDefaultAccountId({
		plugin,
		cfg
	});
}
function listManifestChannelIds(config) {
	return new Set(require_manifest_contribution_ids.listManifestChannelContributionIds({
		includeDisabled: true,
		config,
		env: process.env
	}));
}
function normalizeBindingChannelId(raw, config) {
	const bundled = require_registry.normalizeChannelId(raw);
	if (bundled) return bundled;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw)?.toLowerCase();
	if (!normalized) return null;
	return listManifestChannelIds(config).has(normalized) ? normalized : null;
}
function getBindingChannelPlugin(channel) {
	return require_registry$1.getLoadedChannelPlugin(channel) ?? require_bundled.getBundledChannelSetupPlugin(channel);
}
function resolveBindingAccountId(params) {
	const explicitAccountId = params.explicitAccountId?.trim();
	if (explicitAccountId) return explicitAccountId;
	const plugin = getBindingChannelPlugin(params.channel);
	const pluginAccountId = plugin?.setup?.resolveBindingAccountId?.({
		cfg: params.config,
		agentId: params.agentId
	});
	if (pluginAccountId?.trim()) return pluginAccountId.trim();
	if (plugin && plugin.config.listAccountIds(params.config).length > 1) return "*";
	if (plugin?.meta.forceAccountBinding) return resolveDefaultAccountId(params.config, params.channel);
}
function buildChannelBindings(params) {
	const bindings = [];
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	for (const channel of params.selection) {
		const match = { channel };
		const accountId = resolveBindingAccountId({
			channel,
			config: params.config,
			agentId,
			explicitAccountId: params.accountIds?.[channel]
		});
		if (accountId) match.accountId = accountId;
		bindings.push({
			type: "route",
			agentId,
			match
		});
	}
	return bindings;
}
function parseBindingSpecs(params) {
	const bindings = [];
	const errors = [];
	const specs = params.specs ?? [];
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	for (const raw of specs) {
		const trimmed = raw?.trim();
		if (!trimmed) continue;
		const [channelRaw, accountRaw, ...extraSegments] = trimmed.split(":");
		if (extraSegments.length > 0) {
			errors.push(`Invalid binding "${trimmed}". Account id cannot contain ":". Use <channel>:<account>, for example telegram:default.`);
			continue;
		}
		const channel = normalizeBindingChannelId(channelRaw, params.config);
		if (!channel) {
			errors.push(require_error_format.formatUnknownChannelMessage({ channel: (0, _gabrielvfonseca_normalization_core.expectDefined)(channelRaw, "agents.bindings channel raw") }));
			continue;
		}
		let accountId = accountRaw?.trim();
		if (accountRaw !== void 0 && !accountId) {
			errors.push(`Invalid binding "${trimmed}". Account id is empty. Use <channel>:<account>, for example telegram:default.`);
			continue;
		}
		accountId = resolveBindingAccountId({
			channel,
			config: params.config,
			agentId,
			explicitAccountId: accountId
		});
		const match = { channel };
		if (accountId) match.accountId = accountId;
		bindings.push({
			type: "route",
			agentId,
			match
		});
	}
	return {
		bindings,
		errors
	};
}
//#endregion
Object.defineProperty(exports, "applyAgentBindings", {
	enumerable: true,
	get: function() {
		return applyAgentBindings;
	}
});
Object.defineProperty(exports, "buildChannelBindings", {
	enumerable: true,
	get: function() {
		return buildChannelBindings;
	}
});
Object.defineProperty(exports, "describeBinding", {
	enumerable: true,
	get: function() {
		return describeBinding;
	}
});
Object.defineProperty(exports, "parseBindingSpecs", {
	enumerable: true,
	get: function() {
		return parseBindingSpecs;
	}
});
