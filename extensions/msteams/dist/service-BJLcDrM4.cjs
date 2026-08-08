const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_schtasks = require("./schtasks-Db9a2k8h.cjs");
const require_launchd = require("./launchd-dIaeSQPq.cjs");
const require_systemd = require("./systemd-BxVKNLOg.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/daemon/service-env-merge.ts
function mergeGatewayServiceEnv(baseEnv, command) {
	if (!command?.environment) return baseEnv;
	const merged = {
		...baseEnv,
		...command.environment
	};
	for (const key of [
		"OPERATOR_LAUNCHD_LABEL",
		"OPERATOR_SYSTEMD_UNIT",
		"OPERATOR_WINDOWS_TASK_NAME"
	]) {
		const value = baseEnv[key]?.trim();
		if (value) merged[key] = value;
	}
	return merged;
}
//#endregion
//#region src/daemon/future-config-guard.ts
/** Prevents daemon write actions when the config belongs to a newer Operator. */
async function readFutureConfigActionBlock(action) {
	try {
		return require_config_env_vars.resolveFutureConfigActionBlock({
			action,
			snapshot: await require_io.readConfigFileSnapshot()
		});
	} catch {
		return null;
	}
}
async function assertFutureConfigActionAllowed(action) {
	const block = await readFutureConfigActionBlock(action);
	if (block) throw new Error(require_config_env_vars.formatFutureConfigActionBlock(block));
}
//#endregion
//#region src/daemon/service.ts
/** Platform service registry and shared gateway service start/repair logic. */
var service_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	describeGatewayServiceRestart: () => describeGatewayServiceRestart,
	formatGatewayServiceStartRepairIssues: () => formatGatewayServiceStartRepairIssues,
	inspectGatewayServiceStartRepair: () => inspectGatewayServiceStartRepair,
	readGatewayServiceState: () => readGatewayServiceState,
	resolveGatewayService: () => resolveGatewayService,
	startGatewayService: () => startGatewayService
});
function ignoreServiceWriteResult(write) {
	return async (args) => {
		await write(args);
	};
}
const TEMP_PROGRAM_ROOTS = [
	node_os.default.tmpdir(),
	"/tmp",
	"/private/tmp",
	"/var/tmp"
].map((entry) => node_path.default.resolve(entry));
function pathIsSameOrChild(candidate, parent) {
	return candidate === parent || candidate.startsWith(`${parent}${node_path.default.sep}`);
}
function isTemporaryProgramPath(value) {
	if (!value || !node_path.default.isAbsolute(value)) return false;
	const resolved = node_path.default.resolve(value);
	return TEMP_PROGRAM_ROOTS.some((root) => pathIsSameOrChild(resolved, root));
}
function isMissingProgramPath(value) {
	if (!value || !node_path.default.isAbsolute(value)) return false;
	return !node_fs.default.existsSync(value);
}
function collectGatewayServiceStartRepairIssues(state, expectedPort) {
	const command = state.command;
	if (!state.loaded || !command) return [];
	const issues = [];
	const serviceVersion = command.environment?.OPERATOR_SERVICE_VERSION?.trim();
	if (serviceVersion && serviceVersion !== require_version.VERSION) issues.push({
		code: "version-mismatch",
		message: `service was installed by Operator ${serviceVersion}, current CLI is ${require_version.VERSION}`
	});
	const servicePort = require_paths.parseTcpPortFromArgs(command.programArguments) ?? require_paths.parseTcpPort(command.environment?.OPERATOR_GATEWAY_PORT ?? "");
	if (expectedPort !== void 0 && servicePort !== null && servicePort !== expectedPort) issues.push({
		code: "port-mismatch",
		message: `service port ${servicePort} does not match current gateway config port ${expectedPort}`
	});
	for (const candidate of command.programArguments.slice(0, 2)) {
		if (isTemporaryProgramPath(candidate)) {
			issues.push({
				code: "temporary-program",
				message: `service command points at a temporary path: ${candidate}`
			});
			continue;
		}
		if (isMissingProgramPath(candidate)) issues.push({
			code: "missing-program",
			message: `service command points at a missing path: ${candidate}`
		});
	}
	return issues;
}
/** Reads the installed service and reports definition drift that must be repaired before launch. */
async function inspectGatewayServiceStartRepair(service, args, expectedPort) {
	const state = await readGatewayServiceState(service, args);
	return {
		state,
		issues: collectGatewayServiceStartRepairIssues(state, expectedPort)
	};
}
function formatGatewayServiceStartRepairIssues(issues) {
	return issues.map((issue) => issue.message).join("; ");
}
async function readGatewayServiceState(service, args = {}) {
	const baseEnv = args.env ?? process.env;
	const command = await service.readCommand(baseEnv).catch(() => null);
	const env = mergeGatewayServiceEnv(baseEnv, command);
	const [loaded, runtime] = await Promise.all([service.isLoaded({
		env,
		timeoutMs: args.timeoutMs
	}).catch(() => false), service.readRuntime(env, { timeoutMs: args.timeoutMs }).catch(() => void 0)]);
	return {
		installed: command !== null,
		loaded,
		running: runtime?.status === "running",
		env,
		command,
		runtime
	};
}
async function startGatewayService(service, args, expectedPort) {
	const { state, issues: repairIssues } = await inspectGatewayServiceStartRepair(service, { env: args.env }, expectedPort);
	if (!state.loaded && !state.installed) return {
		outcome: "missing-install",
		state
	};
	if (repairIssues.length > 0) return {
		outcome: "repair-required",
		state,
		issues: repairIssues
	};
	try {
		const restartResult = await service.restart({
			...args,
			env: state.env
		});
		const nextState = await readGatewayServiceState(service, { env: state.env });
		return {
			outcome: restartResult.outcome === "scheduled" ? "scheduled" : "started",
			state: nextState
		};
	} catch (err) {
		const nextState = await readGatewayServiceState(service, { env: state.env });
		if (!nextState.installed) return {
			outcome: "missing-install",
			state: nextState
		};
		throw err;
	}
}
function describeGatewayServiceRestart(serviceNoun, result) {
	if (result.outcome === "scheduled") return {
		scheduled: true,
		daemonActionResult: "scheduled",
		message: `restart scheduled, ${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(serviceNoun)} will restart momentarily`,
		progressMessage: `${serviceNoun} service restart scheduled.`
	};
	return {
		scheduled: false,
		daemonActionResult: "restarted",
		message: `${serviceNoun} service restarted.`,
		progressMessage: `${serviceNoun} service restarted.`
	};
}
function createUnsupportedGatewayServiceError() {
	return /* @__PURE__ */ new Error(`Gateway service install not supported on ${process.platform}`);
}
async function rejectUnsupportedGatewayService() {
	throw createUnsupportedGatewayServiceError();
}
function createUnsupportedGatewayService() {
	return {
		label: "Gateway service",
		loadedText: "available",
		notLoadedText: "not installed",
		stage: rejectUnsupportedGatewayService,
		install: rejectUnsupportedGatewayService,
		uninstall: rejectUnsupportedGatewayService,
		stop: rejectUnsupportedGatewayService,
		restart: rejectUnsupportedGatewayService,
		isLoaded: rejectUnsupportedGatewayService,
		readCommand: async () => null,
		readRuntime: async () => ({
			status: "unknown",
			detail: createUnsupportedGatewayServiceError().message
		})
	};
}
const GATEWAY_SERVICE_REGISTRY = {
	darwin: {
		label: "LaunchAgent",
		loadedText: "loaded",
		notLoadedText: "not loaded",
		stage: ignoreServiceWriteResult(require_launchd.stageLaunchAgent),
		install: ignoreServiceWriteResult(require_launchd.installLaunchAgent),
		uninstall: require_launchd.uninstallLaunchAgent,
		stop: require_launchd.stopLaunchAgent,
		restart: require_launchd.restartLaunchAgent,
		isLoaded: require_launchd.isLaunchAgentLoaded,
		readCommand: require_launchd.readLaunchAgentProgramArguments,
		readRuntime: require_launchd.readLaunchAgentRuntime
	},
	linux: {
		label: "systemd user",
		loadedText: "enabled",
		notLoadedText: "disabled",
		stage: ignoreServiceWriteResult(require_systemd.stageSystemdService),
		install: ignoreServiceWriteResult(require_systemd.installSystemdService),
		uninstall: require_systemd.uninstallSystemdService,
		stop: require_systemd.stopSystemdService,
		restart: require_systemd.restartSystemdService,
		isLoaded: require_systemd.isSystemdServiceEnabled,
		readCommand: require_systemd.readSystemdServiceExecStart,
		readRuntime: require_systemd.readSystemdServiceRuntime
	},
	win32: {
		label: "Scheduled Task",
		loadedText: "registered",
		notLoadedText: "missing",
		stage: ignoreServiceWriteResult(require_schtasks.stageScheduledTask),
		install: ignoreServiceWriteResult(require_schtasks.installScheduledTask),
		uninstall: require_schtasks.uninstallScheduledTask,
		stop: require_schtasks.stopScheduledTask,
		restart: require_schtasks.restartScheduledTask,
		isLoaded: require_schtasks.isScheduledTaskInstalled,
		readCommand: require_schtasks.readScheduledTaskCommand,
		readRuntime: require_schtasks.readScheduledTaskRuntime
	}
};
function withFutureConfigGuard(service) {
	return {
		...service,
		stage: async (args) => {
			await assertFutureConfigActionAllowed("rewrite the gateway service");
			return await service.stage(args);
		},
		install: async (args) => {
			await assertFutureConfigActionAllowed("install or rewrite the gateway service");
			return await service.install(args);
		},
		uninstall: async (args) => {
			await assertFutureConfigActionAllowed("uninstall the gateway service");
			return await service.uninstall(args);
		},
		stop: async (args) => {
			await assertFutureConfigActionAllowed("stop the gateway service");
			return await service.stop(args);
		},
		restart: async (args) => {
			await assertFutureConfigActionAllowed("restart the gateway service");
			return await service.restart(args);
		}
	};
}
function isSupportedGatewayServicePlatform(platform) {
	return Object.hasOwn(GATEWAY_SERVICE_REGISTRY, platform);
}
function resolveGatewayService() {
	if (isSupportedGatewayServicePlatform(process.platform)) return withFutureConfigGuard(GATEWAY_SERVICE_REGISTRY[process.platform]);
	return createUnsupportedGatewayService();
}
//#endregion
Object.defineProperty(exports, "describeGatewayServiceRestart", {
	enumerable: true,
	get: function() {
		return describeGatewayServiceRestart;
	}
});
Object.defineProperty(exports, "formatGatewayServiceStartRepairIssues", {
	enumerable: true,
	get: function() {
		return formatGatewayServiceStartRepairIssues;
	}
});
Object.defineProperty(exports, "inspectGatewayServiceStartRepair", {
	enumerable: true,
	get: function() {
		return inspectGatewayServiceStartRepair;
	}
});
Object.defineProperty(exports, "mergeGatewayServiceEnv", {
	enumerable: true,
	get: function() {
		return mergeGatewayServiceEnv;
	}
});
Object.defineProperty(exports, "readGatewayServiceState", {
	enumerable: true,
	get: function() {
		return readGatewayServiceState;
	}
});
Object.defineProperty(exports, "resolveGatewayService", {
	enumerable: true,
	get: function() {
		return resolveGatewayService;
	}
});
Object.defineProperty(exports, "service_exports", {
	enumerable: true,
	get: function() {
		return service_exports;
	}
});
Object.defineProperty(exports, "startGatewayService", {
	enumerable: true,
	get: function() {
		return startGatewayService;
	}
});
