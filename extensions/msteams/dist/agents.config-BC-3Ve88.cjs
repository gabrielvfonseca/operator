const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
const require_identity_file = require("./identity-file-BqNnk9aW.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/agents.config.ts
var agents_config_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	applyAgentConfig: () => applyAgentConfig,
	buildAgentSummaries: () => buildAgentSummaries,
	findAgentEntryIndex: () => findAgentEntryIndex,
	listAgentEntries: () => require_agent_scope_config.listAgentEntries,
	loadAgentIdentity: () => loadAgentIdentity,
	pruneAgentConfig: () => pruneAgentConfig
});
/** Find a configured agent entry by normalized id. */
function findAgentEntryIndex(list, agentId) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return list.findIndex((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === id);
}
function resolveAgentModel(cfg, agentId) {
	const entryPrimary = (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(require_agent_scope_config.listAgentEntries(cfg).find((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id) === (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId))?.model);
	if (entryPrimary) return entryPrimary;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(cfg.agents?.defaults?.model);
}
/** Load non-empty identity metadata from a workspace identity file. */
function loadAgentIdentity(workspace) {
	const parsed = require_identity_file.loadAgentIdentityFromWorkspace(workspace);
	if (!parsed) return null;
	return require_identity_file.identityHasValues(parsed) ? parsed : null;
}
/** Build config-derived summaries for text/JSON agent listing. */
function buildAgentSummaries(cfg) {
	const defaultAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const configuredAgents = require_agent_scope_config.listAgentEntries(cfg);
	const orderedIds = configuredAgents.length > 0 ? configuredAgents.map((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id)) : [defaultAgentId];
	const bindingCounts = /* @__PURE__ */ new Map();
	for (const binding of require_bindings.listRouteBindings(cfg)) {
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(binding.agentId);
		bindingCounts.set(agentId, (bindingCounts.get(agentId) ?? 0) + 1);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(orderedIds).map((id) => {
		const workspace = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, id);
		const identity = loadAgentIdentity(workspace);
		const configIdentity = configuredAgents.find((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id) === id)?.identity;
		const identityName = identity?.name ?? configIdentity?.name?.trim();
		const identityEmoji = identity?.emoji ?? configIdentity?.emoji?.trim();
		const identitySource = identity ? "identity" : configIdentity && (identityName || identityEmoji) ? "config" : void 0;
		return {
			id,
			name: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredAgents.find((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id) === id)?.name),
			identityName,
			identityEmoji,
			identitySource,
			workspace,
			agentDir: require_agent_scope_config.resolveAgentDir(cfg, id),
			model: resolveAgentModel(cfg, id),
			bindings: bindingCounts.get(id) ?? 0,
			isDefault: id === defaultAgentId
		};
	});
}
/** Add or update one agent entry while preserving the default-agent placeholder when needed. */
function applyAgentConfig(cfg, params) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	const name = params.name?.trim();
	const list = require_agent_scope_config.listAgentEntries(cfg);
	const index = findAgentEntryIndex(list, agentId);
	const base = (index >= 0 ? list[index] : void 0) ?? { id: agentId };
	const mergedIdentity = params.identity ? {
		...base.identity,
		...params.identity
	} : void 0;
	const nextEntry = {
		...base,
		...name ? { name } : {},
		...params.workspace ? { workspace: params.workspace } : {},
		...params.agentDir ? { agentDir: params.agentDir } : {},
		...params.model ? { model: params.model } : {},
		...mergedIdentity ? { identity: mergedIdentity } : {}
	};
	const nextList = [...list];
	if (index >= 0) nextList[index] = nextEntry;
	else {
		if (nextList.length === 0 && agentId !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg))) nextList.push({ id: require_agent_scope_config.resolveDefaultAgentId(cfg) });
		nextList.push(nextEntry);
	}
	return {
		...cfg,
		agents: {
			...cfg.agents,
			list: nextList
		}
	};
}
/** Remove an agent and any config references that route or allow traffic to it. */
function pruneAgentConfig(cfg, agentId) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const nextAgentsList = require_agent_scope_config.listAgentEntries(cfg).filter((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) !== id);
	const nextAgents = nextAgentsList.length > 0 ? nextAgentsList : void 0;
	const bindings = cfg.bindings ?? [];
	const filteredBindings = bindings.filter((binding) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(binding.agentId) !== id);
	const allow = cfg.tools?.agentToAgent?.allow ?? [];
	const filteredAllow = allow.filter((entry) => entry !== id);
	const nextAgentsConfig = cfg.agents ? {
		...cfg.agents,
		list: nextAgents
	} : nextAgents ? { list: nextAgents } : void 0;
	const nextTools = cfg.tools?.agentToAgent ? {
		...cfg.tools,
		agentToAgent: {
			...cfg.tools.agentToAgent,
			allow: filteredAllow.length > 0 ? filteredAllow : void 0
		}
	} : cfg.tools;
	return {
		config: {
			...cfg,
			agents: nextAgentsConfig,
			bindings: filteredBindings.length > 0 ? filteredBindings : void 0,
			tools: nextTools
		},
		removedBindings: bindings.length - filteredBindings.length,
		removedAllow: allow.length - filteredAllow.length
	};
}
//#endregion
Object.defineProperty(exports, "agents_config_exports", {
	enumerable: true,
	get: function() {
		return agents_config_exports;
	}
});
Object.defineProperty(exports, "applyAgentConfig", {
	enumerable: true,
	get: function() {
		return applyAgentConfig;
	}
});
Object.defineProperty(exports, "findAgentEntryIndex", {
	enumerable: true,
	get: function() {
		return findAgentEntryIndex;
	}
});
Object.defineProperty(exports, "loadAgentIdentity", {
	enumerable: true,
	get: function() {
		return loadAgentIdentity;
	}
});
Object.defineProperty(exports, "pruneAgentConfig", {
	enumerable: true,
	get: function() {
		return pruneAgentConfig;
	}
});
