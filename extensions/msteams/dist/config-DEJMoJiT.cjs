const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_constants = require("./constants-DD-eOR3_.cjs");
const require_tool_policy = require("./tool-policy-DWNs5HaX.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/sandbox/config.ts
/**
* Sandbox configuration resolver.
*
* Merges global and agent settings into normalized Docker, SSH, browser, prune, scope, and tool-policy config.
*/
var config_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DANGEROUS_SANDBOX_DOCKER_BOOLEAN_KEYS: () => DANGEROUS_SANDBOX_DOCKER_BOOLEAN_KEYS,
	resolveSandboxBrowserConfig: () => resolveSandboxBrowserConfig,
	resolveSandboxBrowserDockerCreateConfig: () => resolveSandboxBrowserDockerCreateConfig,
	resolveSandboxConfigForAgent: () => resolveSandboxConfigForAgent,
	resolveSandboxDockerConfig: () => resolveSandboxDockerConfig,
	resolveSandboxPruneConfig: () => resolveSandboxPruneConfig,
	resolveSandboxScope: () => resolveSandboxScope,
	resolveSandboxSshConfig: () => resolveSandboxSshConfig
});
const DANGEROUS_SANDBOX_DOCKER_BOOLEAN_KEYS = [
	"dangerouslyAllowReservedContainerTargets",
	"dangerouslyAllowExternalBindSources",
	"dangerouslyAllowContainerNamespaceJoin"
];
const DEFAULT_SANDBOX_SSH_COMMAND = "ssh";
const DEFAULT_SANDBOX_SSH_WORKSPACE_ROOT = "/tmp/operator-sandboxes";
function resolveSandboxBrowserAutoStartTimeoutMs(value) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(value, require_constants.DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS);
}
function resolveDangerousSandboxDockerBooleans(agentDocker, globalDocker) {
	const resolved = {};
	for (const key of DANGEROUS_SANDBOX_DOCKER_BOOLEAN_KEYS) resolved[key] = agentDocker?.[key] ?? globalDocker?.[key];
	return resolved;
}
function resolveSandboxBrowserDockerCreateConfig(params) {
	const browserNetwork = params.browser.network.trim();
	const base = {
		...params.docker,
		network: browserNetwork || "operator-sandbox-browser",
		image: params.browser.image
	};
	return params.browser.binds !== void 0 ? {
		...base,
		binds: params.browser.binds
	} : base;
}
function resolveSandboxScope(params) {
	if (params.scope) return params.scope;
	if (typeof params.perSession === "boolean") return params.perSession ? "session" : "shared";
	return "agent";
}
function resolveSandboxDockerConfig(params) {
	const agentDocker = params.scope === "shared" ? void 0 : params.agentDocker;
	const globalDocker = params.globalDocker;
	const env = agentDocker?.env ? {
		...globalDocker?.env ?? { LANG: "C.UTF-8" },
		...agentDocker.env
	} : globalDocker?.env ?? { LANG: "C.UTF-8" };
	const ulimits = agentDocker?.ulimits ? {
		...globalDocker?.ulimits,
		...agentDocker.ulimits
	} : globalDocker?.ulimits;
	const binds = [...globalDocker?.binds ?? [], ...agentDocker?.binds ?? []];
	return {
		image: agentDocker?.image ?? globalDocker?.image ?? "operator-sandbox:bookworm-slim",
		containerPrefix: agentDocker?.containerPrefix ?? globalDocker?.containerPrefix ?? "operator-sbx-",
		workdir: agentDocker?.workdir ?? globalDocker?.workdir ?? "/workspace",
		readOnlyRoot: agentDocker?.readOnlyRoot ?? globalDocker?.readOnlyRoot ?? true,
		tmpfs: agentDocker?.tmpfs ?? globalDocker?.tmpfs ?? [
			"/tmp",
			"/var/tmp",
			"/run"
		],
		network: agentDocker?.network ?? globalDocker?.network ?? "none",
		user: agentDocker?.user ?? globalDocker?.user,
		capDrop: agentDocker?.capDrop ?? globalDocker?.capDrop ?? ["ALL"],
		env,
		setupCommand: agentDocker?.setupCommand ?? globalDocker?.setupCommand,
		pidsLimit: agentDocker?.pidsLimit ?? globalDocker?.pidsLimit,
		memory: agentDocker?.memory ?? globalDocker?.memory,
		memorySwap: agentDocker?.memorySwap ?? globalDocker?.memorySwap,
		cpus: agentDocker?.cpus ?? globalDocker?.cpus,
		gpus: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentDocker?.gpus ?? globalDocker?.gpus),
		ulimits,
		seccompProfile: agentDocker?.seccompProfile ?? globalDocker?.seccompProfile,
		apparmorProfile: agentDocker?.apparmorProfile ?? globalDocker?.apparmorProfile,
		dns: agentDocker?.dns ?? globalDocker?.dns,
		extraHosts: agentDocker?.extraHosts ?? globalDocker?.extraHosts,
		binds: binds.length ? binds : void 0,
		...resolveDangerousSandboxDockerBooleans(agentDocker, globalDocker)
	};
}
function resolveSandboxBrowserConfig(params) {
	const agentBrowser = params.scope === "shared" ? void 0 : params.agentBrowser;
	const globalBrowser = params.globalBrowser;
	const binds = [...globalBrowser?.binds ?? [], ...agentBrowser?.binds ?? []];
	const bindsConfigured = globalBrowser?.binds !== void 0 || agentBrowser?.binds !== void 0;
	return {
		enabled: agentBrowser?.enabled ?? globalBrowser?.enabled ?? false,
		image: agentBrowser?.image ?? globalBrowser?.image ?? "operator-sandbox-browser:bookworm-slim",
		containerPrefix: agentBrowser?.containerPrefix ?? globalBrowser?.containerPrefix ?? "operator-sbx-browser-",
		network: agentBrowser?.network ?? globalBrowser?.network ?? "operator-sandbox-browser",
		cdpPort: agentBrowser?.cdpPort ?? globalBrowser?.cdpPort ?? 9222,
		cdpSourceRange: agentBrowser?.cdpSourceRange ?? globalBrowser?.cdpSourceRange,
		vncPort: agentBrowser?.vncPort ?? globalBrowser?.vncPort ?? 5900,
		noVncPort: agentBrowser?.noVncPort ?? globalBrowser?.noVncPort ?? 6080,
		headless: agentBrowser?.headless ?? globalBrowser?.headless ?? false,
		enableNoVnc: agentBrowser?.enableNoVnc ?? globalBrowser?.enableNoVnc ?? true,
		allowHostControl: agentBrowser?.allowHostControl ?? globalBrowser?.allowHostControl ?? false,
		autoStart: agentBrowser?.autoStart ?? globalBrowser?.autoStart ?? true,
		autoStartTimeoutMs: resolveSandboxBrowserAutoStartTimeoutMs(agentBrowser?.autoStartTimeoutMs ?? globalBrowser?.autoStartTimeoutMs),
		binds: bindsConfigured ? binds : void 0
	};
}
function resolveSandboxPruneConfig(params) {
	const agentPrune = params.scope === "shared" ? void 0 : params.agentPrune;
	const globalPrune = params.globalPrune;
	return {
		idleHours: agentPrune?.idleHours ?? globalPrune?.idleHours ?? 24,
		maxAgeDays: agentPrune?.maxAgeDays ?? globalPrune?.maxAgeDays ?? 7
	};
}
function normalizeRemoteRoot(value, fallback) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? fallback;
	const posix = normalized.replaceAll("\\", "/");
	if (!posix.startsWith("/")) throw new Error(`Sandbox SSH workspaceRoot must be an absolute POSIX path: ${normalized}`);
	return posix.replace(/\/+$/g, "") || "/";
}
function resolveSandboxSshConfig(params) {
	const agentSsh = params.scope === "shared" ? void 0 : params.agentSsh;
	const globalSsh = params.globalSsh;
	return {
		target: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentSsh?.target ?? globalSsh?.target),
		command: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentSsh?.command ?? globalSsh?.command) ?? DEFAULT_SANDBOX_SSH_COMMAND,
		workspaceRoot: normalizeRemoteRoot(agentSsh?.workspaceRoot ?? globalSsh?.workspaceRoot, DEFAULT_SANDBOX_SSH_WORKSPACE_ROOT),
		strictHostKeyChecking: agentSsh?.strictHostKeyChecking ?? globalSsh?.strictHostKeyChecking ?? true,
		updateHostKeys: agentSsh?.updateHostKeys ?? globalSsh?.updateHostKeys ?? true,
		identityFile: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentSsh?.identityFile ?? globalSsh?.identityFile),
		certificateFile: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentSsh?.certificateFile ?? globalSsh?.certificateFile),
		knownHostsFile: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentSsh?.knownHostsFile ?? globalSsh?.knownHostsFile),
		identityData: require_types_secrets.normalizeSecretInputString(agentSsh?.identityData ?? globalSsh?.identityData),
		certificateData: require_types_secrets.normalizeSecretInputString(agentSsh?.certificateData ?? globalSsh?.certificateData),
		knownHostsData: require_types_secrets.normalizeSecretInputString(agentSsh?.knownHostsData ?? globalSsh?.knownHostsData)
	};
}
function resolveSandboxConfigForAgent(cfg, agentId) {
	const agent = cfg?.agents?.defaults?.sandbox;
	let agentSandbox;
	const agentConfig = cfg && agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId) : void 0;
	if (agentConfig?.sandbox) agentSandbox = agentConfig.sandbox;
	const legacyAgentSandbox = agentSandbox;
	const legacyDefaultSandbox = agent;
	const scope = resolveSandboxScope({
		scope: agentSandbox?.scope ?? agent?.scope,
		perSession: legacyAgentSandbox?.perSession ?? legacyDefaultSandbox?.perSession
	});
	const toolPolicy = require_tool_policy.resolveSandboxToolPolicyForAgent(cfg, agentId);
	return {
		mode: agentSandbox?.mode ?? agent?.mode ?? "off",
		backend: agentSandbox?.backend?.trim() || agent?.backend?.trim() || "docker",
		scope,
		workspaceAccess: agentSandbox?.workspaceAccess ?? agent?.workspaceAccess ?? "none",
		workspaceRoot: agentSandbox?.workspaceRoot ?? agent?.workspaceRoot ?? require_constants.DEFAULT_SANDBOX_WORKSPACE_ROOT,
		docker: resolveSandboxDockerConfig({
			scope,
			globalDocker: agent?.docker,
			agentDocker: agentSandbox?.docker
		}),
		ssh: resolveSandboxSshConfig({
			scope,
			globalSsh: agent?.ssh,
			agentSsh: agentSandbox?.ssh
		}),
		browser: resolveSandboxBrowserConfig({
			scope,
			globalBrowser: agent?.browser,
			agentBrowser: agentSandbox?.browser
		}),
		tools: {
			allow: toolPolicy.allow,
			deny: toolPolicy.deny
		},
		prune: resolveSandboxPruneConfig({
			scope,
			globalPrune: agent?.prune,
			agentPrune: agentSandbox?.prune
		})
	};
}
//#endregion
Object.defineProperty(exports, "DANGEROUS_SANDBOX_DOCKER_BOOLEAN_KEYS", {
	enumerable: true,
	get: function() {
		return DANGEROUS_SANDBOX_DOCKER_BOOLEAN_KEYS;
	}
});
Object.defineProperty(exports, "config_exports", {
	enumerable: true,
	get: function() {
		return config_exports;
	}
});
Object.defineProperty(exports, "resolveSandboxBrowserDockerCreateConfig", {
	enumerable: true,
	get: function() {
		return resolveSandboxBrowserDockerCreateConfig;
	}
});
Object.defineProperty(exports, "resolveSandboxConfigForAgent", {
	enumerable: true,
	get: function() {
		return resolveSandboxConfigForAgent;
	}
});
Object.defineProperty(exports, "resolveSandboxScope", {
	enumerable: true,
	get: function() {
		return resolveSandboxScope;
	}
});
