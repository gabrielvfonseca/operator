require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_heartbeat = require("./heartbeat-B6M3DHWg.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/infra/heartbeat-summary.ts
const DEFAULT_HEARTBEAT_TARGET = "none";
function hasExplicitHeartbeatAgents(cfg) {
	return (cfg.agents?.list ?? []).some((entry) => Boolean(entry?.heartbeat));
}
/** Return whether heartbeat scheduling applies to an agent. */
function isHeartbeatEnabledForAgent(cfg, agentId) {
	const resolvedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
	const list = cfg.agents?.list ?? [];
	if (hasExplicitHeartbeatAgents(cfg)) return list.some((entry) => Boolean(entry?.heartbeat) && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry?.id) === resolvedAgentId);
	if (cfg.agents?.defaults?.heartbeat) return true;
	return resolvedAgentId === require_agent_scope_config.resolveDefaultAgentId(cfg);
}
/** Resolve a heartbeat interval string to milliseconds. */
function resolveHeartbeatIntervalMs(cfg, overrideEvery, heartbeat) {
	const raw = overrideEvery ?? heartbeat?.every ?? cfg.agents?.defaults?.heartbeat?.every ?? "30m";
	if (!raw) return null;
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
	if (!trimmed) return null;
	let ms;
	try {
		ms = require_parse_duration.parseDurationMs(trimmed, { defaultUnit: "m" });
	} catch {
		return null;
	}
	if (ms <= 0) return null;
	return ms;
}
/** Resolve display-ready heartbeat settings for an agent. */
function resolveHeartbeatSummaryForAgent(cfg, agentId) {
	const defaults = cfg.agents?.defaults?.heartbeat;
	const overrides = agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.heartbeat : void 0;
	if (!isHeartbeatEnabledForAgent(cfg, agentId)) return {
		enabled: false,
		every: "disabled",
		everyMs: null,
		prompt: require_heartbeat.resolveHeartbeatPrompt(defaults?.prompt),
		target: defaults?.target ?? DEFAULT_HEARTBEAT_TARGET,
		model: defaults?.model,
		ackMaxChars: Math.max(0, defaults?.ackMaxChars ?? 300)
	};
	const merged = defaults || overrides ? {
		...defaults,
		...overrides
	} : void 0;
	return {
		enabled: true,
		every: merged?.every ?? defaults?.every ?? overrides?.every ?? "30m",
		everyMs: resolveHeartbeatIntervalMs(cfg, void 0, merged),
		prompt: require_heartbeat.resolveHeartbeatPrompt(merged?.prompt ?? defaults?.prompt ?? overrides?.prompt),
		target: merged?.target ?? defaults?.target ?? overrides?.target ?? DEFAULT_HEARTBEAT_TARGET,
		model: merged?.model ?? defaults?.model ?? overrides?.model,
		ackMaxChars: Math.max(0, merged?.ackMaxChars ?? defaults?.ackMaxChars ?? overrides?.ackMaxChars ?? 300)
	};
}
//#endregion
Object.defineProperty(exports, "isHeartbeatEnabledForAgent", {
	enumerable: true,
	get: function() {
		return isHeartbeatEnabledForAgent;
	}
});
Object.defineProperty(exports, "resolveHeartbeatIntervalMs", {
	enumerable: true,
	get: function() {
		return resolveHeartbeatIntervalMs;
	}
});
Object.defineProperty(exports, "resolveHeartbeatSummaryForAgent", {
	enumerable: true,
	get: function() {
		return resolveHeartbeatSummaryForAgent;
	}
});
