require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sandbox_tool_policy = require("./sandbox-tool-policy-DDU5nVeg.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
//#region src/agents/sender-tool-policy.ts
/**
* Sender-scoped sandbox tool policy resolver.
* Applies per-agent toolsBySender matches before global sender policy so
* channel delivery can narrow tool access by sender identity.
*/
/** Resolves sender-scoped sandbox tool policy, preferring agent config over global config. */
function resolveSenderToolPolicy(params) {
	const cfg = params.config;
	if (!cfg) return;
	const sender = {
		messageProvider: params.messageProvider,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	};
	const agentPolicy = require_agent_tools_policy.resolveToolsBySender({
		toolsBySender: (params.agentId?.trim() ? require_agent_scope_config.resolveAgentConfig(cfg, params.agentId)?.tools : void 0)?.toolsBySender,
		...sender
	});
	if (agentPolicy) return require_sandbox_tool_policy.pickSandboxToolPolicy(agentPolicy);
	return require_sandbox_tool_policy.pickSandboxToolPolicy(require_agent_tools_policy.resolveToolsBySender({
		toolsBySender: cfg.tools?.toolsBySender,
		...sender
	}));
}
//#endregion
Object.defineProperty(exports, "resolveSenderToolPolicy", {
	enumerable: true,
	get: function() {
		return resolveSenderToolPolicy;
	}
});
