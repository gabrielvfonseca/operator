const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
//#region src/plugin-sdk/agent-dir-compat.ts
/**
* @deprecated Prefer resolveAgentDir(cfg, agentId) or resolveDefaultAgentDir(cfg).
* Kept for third-party plugin SDK compatibility.
*/
function resolveOperatorAgentDir(env = process.env) {
	const override = env.OPERATOR_AGENT_DIR?.trim() || env.PI_CODING_AGENT_DIR?.trim();
	return override ? require_home_dir.resolveUserPath(override, env) : require_agent_scope_config.resolveDefaultAgentDir({}, env);
}
//#endregion
Object.defineProperty(exports, "resolveOperatorAgentDir", {
	enumerable: true,
	get: function() {
		return resolveOperatorAgentDir;
	}
});
