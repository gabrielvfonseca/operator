const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_exec_policy = require("./exec-policy-BFFO-cIX.cjs");
const require_bash_tools_exec_runtime = require("./bash-tools.exec-runtime-Bs5anBBF.cjs");
//#region src/agents/exec-defaults.ts
var exec_defaults_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveExecDefaults: () => resolveExecDefaults,
	resolveNodeExecEligibility: () => resolveNodeExecEligibility
});
function applySessionLegacyExecPolicyLayer(base, sessionEntry) {
	const security = require_exec_approvals.normalizeExecSecurity(sessionEntry?.execSecurity);
	const ask = require_exec_approvals.normalizeExecAsk(sessionEntry?.execAsk);
	if (security !== null || ask !== null) return {
		security: security ?? base.security,
		ask: ask ?? base.ask
	};
	return base;
}
function resolveExecConfigState(params) {
	const cfg = params.cfg ?? {};
	const resolvedAgentId = params.agentId ?? require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: cfg
	});
	const globalExec = cfg.tools?.exec;
	const agentExec = resolvedAgentId ? require_agent_scope_config.resolveAgentConfig(cfg, resolvedAgentId)?.tools?.exec : void 0;
	return {
		cfg,
		host: params.execOverrides?.host ?? require_exec_approvals.normalizeExecTarget(params.sessionEntry?.execHost) ?? agentExec?.host ?? globalExec?.host ?? "auto",
		agentId: resolvedAgentId,
		agentExec,
		globalExec
	};
}
/** Resolves whether node exec is usable and any effective node binding. */
function resolveNodeExecEligibility(params) {
	const defaults = resolveExecDefaults(params);
	const systemRunDenied = params.cfg?.gateway?.nodes?.denyCommands?.some((command) => command.trim() === "system.run");
	return {
		canExec: defaults.canRequestNode && defaults.security !== "deny" && !systemRunDenied,
		...defaults.node ? { node: defaults.node } : {}
	};
}
/** Resolves effective exec host, mode, approval policy, and node availability. */
function resolveExecDefaults(params) {
	const { cfg, host, agentId: resolvedAgentId, agentExec, globalExec } = resolveExecConfigState(params);
	const sandboxAvailable = params.sandboxAvailable ?? (params.sessionKey ? require_runtime_status.resolveSandboxRuntimeStatus({
		cfg,
		sessionKey: params.sessionKey
	}).sandboxed : false);
	const resolved = require_bash_tools_exec_runtime.resolveExecTarget({
		configuredTarget: host,
		elevatedRequested: params.elevatedRequested === true,
		sandboxAvailable
	});
	const defaultSecurity = resolved.effectiveHost === "sandbox" ? "deny" : "full";
	const approvalDefaults = resolved.effectiveHost === "sandbox" ? void 0 : require_exec_approvals.resolveExecApprovalsFromFile({
		file: require_exec_approvals.loadExecApprovals(),
		agentId: resolvedAgentId,
		overrides: {
			security: defaultSecurity,
			ask: "off"
		}
	}).agent;
	const modePolicy = require_exec_approvals.resolveExecModePolicy(require_exec_policy.applyExecPolicyLayer(applySessionLegacyExecPolicyLayer(require_exec_policy.applyExecPolicyLayer(require_exec_policy.applyExecPolicyLayer({
		security: approvalDefaults?.security ?? defaultSecurity,
		ask: approvalDefaults?.ask ?? "off"
	}, globalExec), agentExec), params.sessionEntry), params.execOverrides));
	const security = approvalDefaults?.security !== void 0 ? require_exec_approvals.minSecurity(modePolicy.security, approvalDefaults.security) : modePolicy.security;
	const ask = approvalDefaults?.ask !== void 0 ? require_exec_approvals.maxAsk(modePolicy.ask, approvalDefaults.ask) : modePolicy.ask;
	const mode = security === modePolicy.security && ask === modePolicy.ask ? modePolicy.mode : require_exec_approvals.resolveExecModeFromPolicy({
		security,
		ask
	});
	return {
		host,
		effectiveHost: resolved.effectiveHost,
		mode,
		security,
		ask,
		node: params.execOverrides?.node ?? params.sessionEntry?.execNode ?? agentExec?.node ?? globalExec?.node,
		canRequestNode: require_bash_tools_exec_runtime.isRequestedExecTargetAllowed({
			configuredTarget: host,
			requestedTarget: "node",
			sandboxAvailable
		})
	};
}
//#endregion
Object.defineProperty(exports, "exec_defaults_exports", {
	enumerable: true,
	get: function() {
		return exec_defaults_exports;
	}
});
Object.defineProperty(exports, "resolveExecDefaults", {
	enumerable: true,
	get: function() {
		return resolveExecDefaults;
	}
});
Object.defineProperty(exports, "resolveNodeExecEligibility", {
	enumerable: true,
	get: function() {
		return resolveNodeExecEligibility;
	}
});
