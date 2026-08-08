const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_paths$1 = require("./paths-amwIgX1d.cjs");
require("./systemd-BxVKNLOg.cjs");
const require_runtime_hints = require("./runtime-hints--ik248YA.cjs");
require("./parse-port-Bpmz65Aw.cjs");
let node_stream = require("node:stream");
//#region src/cli/daemon-cli/response.ts
function emitDaemonActionJson(payload) {
	require_runtime.defaultRuntime.writeJson(payload);
}
function classifyDaemonHintText(text) {
	if (text.includes("operator gateway install") || text.startsWith("Service not installed. Run:")) return "install";
	if (text.startsWith("Restart the container or the service that manages it for ")) return "container-restart";
	if (text.startsWith("systemd user services are unavailable;")) return "systemd-unavailable";
	if (text.startsWith("On a headless server (SSH/no desktop session):") || text.startsWith("Also ensure XDG_RUNTIME_DIR is set:")) return "systemd-headless";
	if (text.startsWith("If you're in a container, run the gateway in the foreground instead of")) return "container-foreground";
	if (text.startsWith("WSL2 needs systemd enabled:") || text.startsWith("Then run: wsl --shutdown") || text.startsWith("Verify: systemctl --user status")) return "wsl-systemd";
	return "generic";
}
/** Classify plain-text hints for JSON daemon responses. */
function buildDaemonHintItems(hints) {
	if (!hints?.length) return;
	return hints.map((text) => ({
		kind: classifyDaemonHintText(text),
		text
	}));
}
/** Build the service metadata snapshot embedded in JSON action responses. */
function buildDaemonServiceSnapshot(service, loaded) {
	return {
		label: service.label,
		loaded,
		loadedText: service.loadedText,
		notLoadedText: service.notLoadedText
	};
}
/** Writable sink used when JSON output should suppress service command stdout. */
function createNullWriter() {
	return new node_stream.Writable({ write(_chunk, _encoding, callback) {
		callback();
	} });
}
/** Create stdout/warning/emit/fail helpers for one daemon lifecycle action. */
function createDaemonActionContext(params) {
	const warnings = [];
	const stdout = params.json ? createNullWriter() : process.stdout;
	const emit = (payload) => {
		if (!params.json) return;
		emitDaemonActionJson({
			action: params.action,
			...payload,
			hintItems: payload.hintItems ?? buildDaemonHintItems(payload.hints),
			warnings: payload.warnings ?? (warnings.length ? warnings : void 0)
		});
	};
	const fail = (message, hints) => {
		if (params.json) emit({
			ok: false,
			error: message,
			hints
		});
		else {
			require_runtime.defaultRuntime.error(message);
			if (hints?.length) for (const hint of hints) require_runtime.defaultRuntime.log(`Tip: ${hint}`);
		}
		require_runtime.defaultRuntime.exit(1);
	};
	return {
		stdout,
		warnings,
		emit,
		fail
	};
}
//#endregion
//#region src/cli/daemon-cli/shared.ts
/** Extract `--port` from service ProgramArguments. */
function parsePortFromArgs(programArguments) {
	return require_paths.parseTcpPortFromArgs(programArguments);
}
/** Pick the best local probe host for a configured Gateway bind mode. */
function pickProbeHostForBind(bindMode, tailnetIPv4, customBindHost) {
	if (bindMode === "custom" && customBindHost?.trim()) return customBindHost.trim();
	if (bindMode === "tailnet") return tailnetIPv4 ?? "127.0.0.1";
	if (bindMode === "lan") return "127.0.0.1";
	return "127.0.0.1";
}
/** Render install/start hints for the current service platform/container context. */
function renderGatewayServiceStartHints(env = process.env) {
	const profile = env.OPERATOR_PROFILE;
	const container = require_runtime_hints.resolveDaemonContainerContext(env);
	const hints = require_runtime_hints.buildPlatformServiceStartHints({
		installCommand: require_command_format.formatCliCommand("operator gateway install", env),
		startCommand: require_command_format.formatCliCommand("operator gateway", env),
		launchAgentPlistPath: `~/Library/LaunchAgents/${require_paths$1.resolveGatewayLaunchAgentLabel(profile)}.plist`,
		systemdServiceName: require_paths$1.resolveGatewaySystemdServiceName(profile),
		windowsTaskName: require_paths$1.resolveGatewayWindowsTaskName(profile)
	});
	if (!container) return hints;
	return [`Restart the container or the service that manages it for ${container}.`];
}
/** Drop generic systemd hints when a container-specific hint is clearer. */
function filterContainerGenericHints(hints, env = process.env) {
	if (!require_runtime_hints.resolveDaemonContainerContext(env)) return hints;
	return hints.filter((hint) => !hint.includes("If you're in a container, run the gateway in the foreground instead of") && !hint.includes("systemd user services are unavailable; install/enable systemd"));
}
//#endregion
Object.defineProperty(exports, "buildDaemonServiceSnapshot", {
	enumerable: true,
	get: function() {
		return buildDaemonServiceSnapshot;
	}
});
Object.defineProperty(exports, "createDaemonActionContext", {
	enumerable: true,
	get: function() {
		return createDaemonActionContext;
	}
});
Object.defineProperty(exports, "createNullWriter", {
	enumerable: true,
	get: function() {
		return createNullWriter;
	}
});
Object.defineProperty(exports, "filterContainerGenericHints", {
	enumerable: true,
	get: function() {
		return filterContainerGenericHints;
	}
});
Object.defineProperty(exports, "parsePortFromArgs", {
	enumerable: true,
	get: function() {
		return parsePortFromArgs;
	}
});
Object.defineProperty(exports, "pickProbeHostForBind", {
	enumerable: true,
	get: function() {
		return pickProbeHostForBind;
	}
});
Object.defineProperty(exports, "renderGatewayServiceStartHints", {
	enumerable: true,
	get: function() {
		return renderGatewayServiceStartHints;
	}
});
