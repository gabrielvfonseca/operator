const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config = require("./config-DEJMoJiT.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/terminal/launch.ts
/** Picks the interactive shell: explicit config, then the host login shell. */
function resolveTerminalShell(params) {
	const configured = params.configuredShell?.trim();
	if (configured) return {
		shell: configured,
		args: []
	};
	const platform = params.platform ?? process.platform;
	const env = params.env ?? process.env;
	if (platform === "win32") return {
		shell: env.ComSpec?.trim() || "cmd.exe",
		args: []
	};
	const loginShell = env.SHELL?.trim();
	if (loginShell) return {
		shell: loginShell,
		args: ["-l"]
	};
	return {
		shell: "/bin/bash",
		args: ["-l"]
	};
}
/**
* Resolves the terminal launch plan for one agent.
*
* The terminal always starts in the agent workspace. When the agent runs fully
* sandboxed (`sandbox.mode: "all"`), a host shell would escape the isolation the
* agent itself is under, so this returns a `sandboxed` block rather than silently
* handing back an unconfined shell — fail-closed. `"non-main"` keeps the agent's
* main session on the host, so a host terminal is allowed there.
*/
function resolveTerminalLaunch(params) {
	if (!params.enabled) return {
		ok: false,
		block: { kind: "disabled" }
	};
	const env = params.env ?? process.env;
	const requested = params.agentId?.trim();
	const agentId = requested ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requested) : require_agent_scope_config.resolveDefaultAgentId(params.config);
	if (requested && !require_agent_scope_config.listAgentIds(params.config).includes(agentId)) return {
		ok: false,
		block: {
			kind: "unknown-agent",
			agentId
		}
	};
	if (require_config.resolveSandboxConfigForAgent(params.config, agentId).mode === "all") return {
		ok: false,
		block: {
			kind: "sandboxed",
			agentId,
			mode: "all"
		}
	};
	const cwd = existingDirOrHome(require_agent_scope_config.resolveAgentWorkspaceDir(params.config, agentId, env), env);
	const { shell, args } = resolveTerminalShell({
		configuredShell: params.configuredShell,
		platform: params.platform,
		env
	});
	return {
		ok: true,
		plan: {
			agentId,
			cwd,
			shell,
			args
		}
	};
}
/** Maintains fail-closed terminal admission across deferred config restarts. */
function createTerminalLaunchPolicy(initialConfig) {
	let activeConfig = initialConfig;
	let hasPendingRestart = false;
	let terminalDisabledUntilRestart = false;
	let preparedConfig = null;
	let appliedConfigWhileRestartPending = null;
	let terminalDisabledUntilCommit = false;
	const blockedAgentsUntilRestart = /* @__PURE__ */ new Map();
	const blockedAgentsUntilCommit = /* @__PURE__ */ new Map();
	const preserveTerminalConfig = (config, owner) => {
		const { terminal: _ignored, ...gateway } = config.gateway ?? {};
		const terminal = owner.gateway?.terminal;
		return {
			...config,
			gateway: {
				...gateway,
				...terminal === void 0 ? {} : { terminal }
			}
		};
	};
	const resolveForConfig = (config, agentId) => {
		const terminalConfig = config.gateway?.terminal;
		return resolveTerminalLaunch({
			config,
			enabled: terminalConfig?.enabled === true,
			agentId,
			configuredShell: terminalConfig?.shell
		});
	};
	const accumulateRestartRestrictions = (config) => {
		if (config.gateway?.terminal?.enabled !== true) {
			terminalDisabledUntilRestart = true;
			return;
		}
		const activeAgentIds = /* @__PURE__ */ new Set([...require_agent_scope_config.listAgentIds(activeConfig), require_agent_scope_config.resolveDefaultAgentId(activeConfig)]);
		for (const agentId of activeAgentIds) {
			const candidate = resolveForConfig(config, agentId);
			if (!candidate.ok) blockedAgentsUntilRestart.set(agentId, candidate.block);
		}
	};
	const accumulateCommitRestrictions = (config) => {
		if (config.gateway?.terminal?.enabled !== true) {
			terminalDisabledUntilCommit = true;
			return;
		}
		const activeAgentIds = /* @__PURE__ */ new Set([...require_agent_scope_config.listAgentIds(activeConfig), require_agent_scope_config.resolveDefaultAgentId(activeConfig)]);
		for (const agentId of activeAgentIds) {
			const candidate = resolveForConfig(config, agentId);
			if (!candidate.ok) blockedAgentsUntilCommit.set(agentId, candidate.block);
		}
	};
	return {
		resolve: (agentId) => {
			const active = resolveForConfig(activeConfig, agentId);
			if (!active.ok) return active;
			if (terminalDisabledUntilRestart) return {
				ok: false,
				block: { kind: "disabled" }
			};
			const pendingBlock = blockedAgentsUntilRestart.get(active.plan.agentId);
			if (pendingBlock) return {
				ok: false,
				block: pendingBlock
			};
			const preparedBlock = blockedAgentsUntilCommit.get(active.plan.agentId);
			if (preparedBlock) return {
				ok: false,
				block: preparedBlock
			};
			const candidateConfig = preparedConfig ?? appliedConfigWhileRestartPending;
			if (candidateConfig) {
				const prepared = resolveForConfig(candidateConfig, active.plan.agentId);
				if (!prepared.ok) return prepared;
			}
			return active;
		},
		isEnabled: () => activeConfig.gateway?.terminal?.enabled === true && !terminalDisabledUntilRestart && !terminalDisabledUntilCommit && (preparedConfig === null || preparedConfig.gateway?.terminal?.enabled === true),
		prepareConfig: (config, options) => {
			if (options.restartPending) {
				hasPendingRestart = true;
				preparedConfig = null;
				accumulateRestartRestrictions(config);
				return;
			}
			if (hasPendingRestart) {
				preparedConfig = preserveTerminalConfig(config, activeConfig);
				accumulateCommitRestrictions(preparedConfig);
				return;
			}
			preparedConfig = preserveTerminalConfig(config, activeConfig);
			accumulateCommitRestrictions(preparedConfig);
		},
		commitConfig: () => {
			if (hasPendingRestart) {
				if (preparedConfig) appliedConfigWhileRestartPending = preparedConfig;
				preparedConfig = null;
				terminalDisabledUntilCommit = false;
				blockedAgentsUntilCommit.clear();
				if (appliedConfigWhileRestartPending) accumulateCommitRestrictions(appliedConfigWhileRestartPending);
				return;
			}
			if (preparedConfig) activeConfig = preparedConfig;
			preparedConfig = null;
			terminalDisabledUntilCommit = false;
			blockedAgentsUntilCommit.clear();
		},
		acceptConfig: (options) => {
			preparedConfig = null;
			terminalDisabledUntilCommit = false;
			blockedAgentsUntilCommit.clear();
			if (options.retireRejectedRestart) {
				hasPendingRestart = false;
				terminalDisabledUntilRestart = false;
				blockedAgentsUntilRestart.clear();
				if (appliedConfigWhileRestartPending) activeConfig = appliedConfigWhileRestartPending;
				appliedConfigWhileRestartPending = null;
				return;
			}
			if (appliedConfigWhileRestartPending) accumulateCommitRestrictions(appliedConfigWhileRestartPending);
		}
	};
}
/** Builds the child environment for a host terminal from the gateway env. */
function buildTerminalEnv(baseEnv) {
	const env = {};
	for (const [key, value] of Object.entries(baseEnv)) if (typeof value === "string") env[key] = value;
	env.TERM = env.TERM ?? "xterm-256color";
	env.OPERATOR_TERMINAL = "1";
	return env;
}
function shellQuote(value) {
	return `'${value.replaceAll("'", `'"'"'`)}'`;
}
/** Converts a policy-approved plan into the exact local PTY spawn. */
function resolveTerminalSpawnPlan(plan, options = {}) {
	const env = options.env ?? process.env;
	const cwd = existingDirOrHome(plan.cwdOverride ?? plan.cwd, env);
	const command = plan.initialCommand;
	if (!command || command.length === 0) return {
		agentId: plan.agentId,
		shell: plan.shell,
		args: plan.args,
		cwd
	};
	if ((options.platform ?? process.platform) === "win32") return {
		agentId: plan.agentId,
		shell: command[0] ?? plan.shell,
		args: command.slice(1),
		cwd
	};
	return {
		agentId: plan.agentId,
		shell: plan.shell,
		args: [
			"-il",
			"-c",
			command.map(shellQuote).join(" ")
		],
		cwd
	};
}
function existingDirOrHome(dir, env) {
	const trimmed = dir.trim();
	const home = env.HOME?.trim() || node_os.default.homedir();
	if (!trimmed || !node_path.default.isAbsolute(trimmed)) return home;
	try {
		if ((0, node_fs.existsSync)(trimmed) && (0, node_fs.statSync)(trimmed).isDirectory()) return trimmed;
	} catch {}
	return home;
}
//#endregion
exports.buildTerminalEnv = buildTerminalEnv;
exports.createTerminalLaunchPolicy = createTerminalLaunchPolicy;
exports.resolveTerminalSpawnPlan = resolveTerminalSpawnPlan;
