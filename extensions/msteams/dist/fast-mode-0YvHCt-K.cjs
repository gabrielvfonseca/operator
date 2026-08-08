const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_fast_mode = require("./fast-mode-BD9s0nxq.cjs");
require("./thinking-BQb9GAe7.cjs");
//#region src/agents/fast-mode.ts
function resolveConfiguredFastModeRaw(params) {
	const modelParams = require_fast_mode.resolveFastModeModelParams(params);
	return modelParams?.fastMode ?? modelParams?.fast_mode;
}
/** Resolve the effective fast-mode setting and its source. */
function resolveFastModeState(params) {
	const fastAutoOnSeconds = require_fast_mode.resolveFastModeModelAutoOnSeconds(params);
	const sessionOverride = require_string_coerce.normalizeFastMode(params.sessionEntry?.fastMode);
	if (sessionOverride !== void 0) return {
		mode: sessionOverride,
		enabled: sessionOverride === "auto" ? true : sessionOverride,
		source: "session",
		fastAutoOnSeconds
	};
	const normalizedAgentDefault = require_string_coerce.normalizeFastMode(params.agentId && params.cfg ? require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId)?.fastModeDefault : void 0);
	if (normalizedAgentDefault !== void 0) return {
		mode: normalizedAgentDefault,
		enabled: normalizedAgentDefault === "auto" ? true : normalizedAgentDefault,
		source: "agent",
		fastAutoOnSeconds
	};
	const configured = require_string_coerce.normalizeFastMode(resolveConfiguredFastModeRaw(params));
	if (configured !== void 0) return {
		mode: configured,
		enabled: configured === "auto" ? true : configured,
		source: "config",
		fastAutoOnSeconds
	};
	return {
		mode: false,
		enabled: false,
		source: "default",
		fastAutoOnSeconds
	};
}
//#endregion
Object.defineProperty(exports, "resolveFastModeState", {
	enumerable: true,
	get: function() {
		return resolveFastModeState;
	}
});
