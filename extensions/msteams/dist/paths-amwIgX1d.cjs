const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/daemon/constants.ts
/** Cross-platform daemon service names, labels, and profile-aware descriptions. */
const GATEWAY_LAUNCH_AGENT_LABEL = "ai.operator.gateway";
const GATEWAY_SYSTEMD_SERVICE_NAME = "operator-gateway";
const GATEWAY_WINDOWS_TASK_NAME = "Operator Gateway";
const GATEWAY_SERVICE_MARKER = "@gabrielvfonseca/operator";
const GATEWAY_SERVICE_KIND = "gateway";
const GATEWAY_SERVICE_RUNTIME_PID_ENV = "OPERATOR_GATEWAY_SERVICE_PID";
const NODE_LAUNCH_AGENT_LABEL = "ai.operator.node";
const NODE_SYSTEMD_SERVICE_NAME = "operator-node";
const NODE_WINDOWS_TASK_NAME = "Operator Node";
const NODE_SERVICE_MARKER = "@gabrielvfonseca/operator";
const NODE_SERVICE_KIND = "node";
const NODE_WINDOWS_TASK_SCRIPT_NAME = "node.cmd";
const LEGACY_GATEWAY_SYSTEMD_SERVICE_NAMES = ["clawdbot-gateway"];
function normalizeGatewayProfile(profile) {
	const trimmed = profile?.trim();
	if (!trimmed || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed) === "default") return null;
	return trimmed;
}
function resolveGatewayProfileSuffix(profile) {
	const normalized = normalizeGatewayProfile(profile);
	return normalized ? `-${normalized}` : "";
}
function resolveGatewayLaunchAgentLabel(profile) {
	const normalized = normalizeGatewayProfile(profile);
	if (!normalized) return GATEWAY_LAUNCH_AGENT_LABEL;
	return `ai.operator.${normalized}`;
}
function resolveLegacyGatewayLaunchAgentLabels(profile) {
	return [];
}
function resolveGatewaySystemdServiceName(profile) {
	const suffix = resolveGatewayProfileSuffix(profile);
	if (!suffix) return GATEWAY_SYSTEMD_SERVICE_NAME;
	return `operator-gateway${suffix}`;
}
function resolveGatewayWindowsTaskName(profile) {
	const normalized = normalizeGatewayProfile(profile);
	if (!normalized) return GATEWAY_WINDOWS_TASK_NAME;
	return `Operator Gateway (${normalized})`;
}
function formatGatewayServiceDescription(params) {
	const profile = normalizeGatewayProfile(params?.profile);
	const version = params?.version?.trim();
	const parts = [];
	if (profile) parts.push(`profile: ${profile}`);
	if (version) parts.push(`v${version}`);
	if (parts.length === 0) return "Operator Gateway";
	return `Operator Gateway (${parts.join(", ")})`;
}
function resolveGatewayServiceDescription(params) {
	return params.description ?? formatGatewayServiceDescription({
		profile: params.env.OPERATOR_PROFILE,
		version: params.environment?.OPERATOR_SERVICE_VERSION ?? params.env.OPERATOR_SERVICE_VERSION
	});
}
function resolveNodeLaunchAgentLabel() {
	return NODE_LAUNCH_AGENT_LABEL;
}
function resolveNodeSystemdServiceName() {
	return NODE_SYSTEMD_SERVICE_NAME;
}
function resolveNodeWindowsTaskName() {
	return NODE_WINDOWS_TASK_NAME;
}
//#endregion
//#region src/daemon/paths.ts
/** Resolves daemon state, home, and generated task-script paths. */
const windowsAbsolutePath = /^[a-zA-Z]:[\\/]/;
const windowsUncPath = /^\\\\/;
/** Resolves the home directory used for daemon state paths. */
function resolveHomeDir(env) {
	const home = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.HOME) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.USERPROFILE);
	if (!home) throw new Error("Missing HOME");
	return home;
}
function resolveUserPathWithHome(input, home) {
	const trimmed = input.trim();
	if (!trimmed) return trimmed;
	if (trimmed.startsWith("~")) {
		if (!home) throw new Error("Missing HOME");
		const expanded = trimmed.replace(/^~(?=$|[\\/])/, home);
		return node_path.default.resolve(expanded);
	}
	if (windowsAbsolutePath.test(trimmed) || windowsUncPath.test(trimmed)) return trimmed;
	return node_path.default.resolve(trimmed);
}
function resolveGatewayStateDir(env) {
	const override = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_STATE_DIR);
	if (override) return resolveUserPathWithHome(override, override.startsWith("~") ? resolveHomeDir(env) : void 0);
	const home = resolveHomeDir(env);
	const suffix = resolveGatewayProfileSuffix(env.OPERATOR_PROFILE);
	return node_path.default.join(home, `.operator${suffix}`);
}
function resolveGatewayTaskScriptPath(env) {
	const override = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_TASK_SCRIPT);
	if (override) return override;
	const scriptName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_TASK_SCRIPT_NAME) || "gateway.cmd";
	if (/[/\\]|\.\./.test(scriptName)) throw new Error(`OPERATOR_TASK_SCRIPT_NAME must be a file name only, not a path: ${scriptName}`);
	return node_path.default.join(resolveGatewayStateDir(env), scriptName);
}
//#endregion
Object.defineProperty(exports, "GATEWAY_LAUNCH_AGENT_LABEL", {
	enumerable: true,
	get: function() {
		return GATEWAY_LAUNCH_AGENT_LABEL;
	}
});
Object.defineProperty(exports, "GATEWAY_SERVICE_KIND", {
	enumerable: true,
	get: function() {
		return GATEWAY_SERVICE_KIND;
	}
});
Object.defineProperty(exports, "GATEWAY_SERVICE_MARKER", {
	enumerable: true,
	get: function() {
		return GATEWAY_SERVICE_MARKER;
	}
});
Object.defineProperty(exports, "GATEWAY_SERVICE_RUNTIME_PID_ENV", {
	enumerable: true,
	get: function() {
		return GATEWAY_SERVICE_RUNTIME_PID_ENV;
	}
});
Object.defineProperty(exports, "LEGACY_GATEWAY_SYSTEMD_SERVICE_NAMES", {
	enumerable: true,
	get: function() {
		return LEGACY_GATEWAY_SYSTEMD_SERVICE_NAMES;
	}
});
Object.defineProperty(exports, "NODE_SERVICE_KIND", {
	enumerable: true,
	get: function() {
		return NODE_SERVICE_KIND;
	}
});
Object.defineProperty(exports, "NODE_SERVICE_MARKER", {
	enumerable: true,
	get: function() {
		return NODE_SERVICE_MARKER;
	}
});
Object.defineProperty(exports, "NODE_WINDOWS_TASK_SCRIPT_NAME", {
	enumerable: true,
	get: function() {
		return NODE_WINDOWS_TASK_SCRIPT_NAME;
	}
});
Object.defineProperty(exports, "resolveGatewayLaunchAgentLabel", {
	enumerable: true,
	get: function() {
		return resolveGatewayLaunchAgentLabel;
	}
});
Object.defineProperty(exports, "resolveGatewayProfileSuffix", {
	enumerable: true,
	get: function() {
		return resolveGatewayProfileSuffix;
	}
});
Object.defineProperty(exports, "resolveGatewayServiceDescription", {
	enumerable: true,
	get: function() {
		return resolveGatewayServiceDescription;
	}
});
Object.defineProperty(exports, "resolveGatewayStateDir", {
	enumerable: true,
	get: function() {
		return resolveGatewayStateDir;
	}
});
Object.defineProperty(exports, "resolveGatewaySystemdServiceName", {
	enumerable: true,
	get: function() {
		return resolveGatewaySystemdServiceName;
	}
});
Object.defineProperty(exports, "resolveGatewayTaskScriptPath", {
	enumerable: true,
	get: function() {
		return resolveGatewayTaskScriptPath;
	}
});
Object.defineProperty(exports, "resolveGatewayWindowsTaskName", {
	enumerable: true,
	get: function() {
		return resolveGatewayWindowsTaskName;
	}
});
Object.defineProperty(exports, "resolveHomeDir", {
	enumerable: true,
	get: function() {
		return resolveHomeDir;
	}
});
Object.defineProperty(exports, "resolveLegacyGatewayLaunchAgentLabels", {
	enumerable: true,
	get: function() {
		return resolveLegacyGatewayLaunchAgentLabels;
	}
});
Object.defineProperty(exports, "resolveNodeLaunchAgentLabel", {
	enumerable: true,
	get: function() {
		return resolveNodeLaunchAgentLabel;
	}
});
Object.defineProperty(exports, "resolveNodeSystemdServiceName", {
	enumerable: true,
	get: function() {
		return resolveNodeSystemdServiceName;
	}
});
Object.defineProperty(exports, "resolveNodeWindowsTaskName", {
	enumerable: true,
	get: function() {
		return resolveNodeWindowsTaskName;
	}
});
