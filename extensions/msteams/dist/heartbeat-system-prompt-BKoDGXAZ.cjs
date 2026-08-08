require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_heartbeat = require("./heartbeat-B6M3DHWg.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/heartbeat-system-prompt.ts
/**
* Builds heartbeat-specific guidance for agent system prompts.
*/
function resolveHeartbeatConfigForSystemPrompt(config, agentId) {
	const defaults = config?.agents?.defaults?.heartbeat;
	if (!config || !agentId) return defaults;
	const overrides = require_agent_scope_config.resolveAgentConfig(config, agentId)?.heartbeat;
	if (!defaults && !overrides) return overrides;
	return {
		...defaults,
		...overrides
	};
}
function isHeartbeatEnabledByAgentPolicy(config, agentId) {
	const resolvedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const agents = require_agent_scope_config.listAgentEntries(config);
	if (agents.some((entry) => Boolean(entry?.heartbeat))) return agents.some((entry) => Boolean(entry?.heartbeat) && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === resolvedAgentId);
	return resolvedAgentId === require_agent_scope_config.resolveDefaultAgentId(config);
}
function isHeartbeatCadenceEnabled(heartbeat) {
	const trimmedEvery = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(heartbeat?.every ?? "30m") ?? "";
	if (!trimmedEvery) return false;
	try {
		return require_parse_duration.parseDurationMs(trimmedEvery, { defaultUnit: "m" }) > 0;
	} catch {
		return false;
	}
}
/** Returns true when heartbeat guidance should be included in the system prompt. */
function shouldIncludeHeartbeatGuidanceForSystemPrompt(params) {
	const defaultAgentId = params.defaultAgentId ?? require_agent_scope_config.resolveDefaultAgentId(params.config ?? {});
	const agentId = params.agentId ?? defaultAgentId;
	if (!agentId || (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId) !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(defaultAgentId)) return false;
	if (params.config && !isHeartbeatEnabledByAgentPolicy(params.config, agentId)) return false;
	const heartbeat = resolveHeartbeatConfigForSystemPrompt(params.config, agentId);
	if (heartbeat?.includeSystemPromptSection === false) return false;
	return isHeartbeatCadenceEnabled(heartbeat);
}
/** Resolves the heartbeat system prompt section for the selected/default agent. */
function resolveHeartbeatPromptForSystemPrompt(params) {
	const agentId = params.agentId ?? params.defaultAgentId ?? require_agent_scope_config.resolveDefaultAgentId(params.config ?? {});
	const heartbeat = resolveHeartbeatConfigForSystemPrompt(params.config, agentId);
	if (!shouldIncludeHeartbeatGuidanceForSystemPrompt(params)) return;
	return require_heartbeat.resolveHeartbeatPrompt(heartbeat?.prompt);
}
//#endregion
Object.defineProperty(exports, "resolveHeartbeatPromptForSystemPrompt", {
	enumerable: true,
	get: function() {
		return resolveHeartbeatPromptForSystemPrompt;
	}
});
Object.defineProperty(exports, "shouldIncludeHeartbeatGuidanceForSystemPrompt", {
	enumerable: true,
	get: function() {
		return shouldIncludeHeartbeatGuidanceForSystemPrompt;
	}
});
