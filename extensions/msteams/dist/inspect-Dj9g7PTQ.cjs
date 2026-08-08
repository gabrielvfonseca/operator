const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_schtasks_exec = require("./schtasks-exec-BXzOXN3j.cjs");
const require_systemd_unit = require("./systemd-unit-Vug9Zr2z.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/daemon/inspect.ts
/** Inspects installed platform services for extra Operator or legacy gateway jobs. */
const EXTRA_MARKERS = ["@gabrielvfonseca/operator", "clawdbot"];
const SYSTEMD_REFERENCE_ONLY_KEYS = /* @__PURE__ */ new Set([
	"after",
	"before",
	"bindsto",
	"conflicts",
	"partof",
	"propagatesreloadto",
	"reloadpropagatedfrom",
	"requisite",
	"requires",
	"upholds",
	"wants"
]);
function renderGatewayServiceCleanupHints(env = process.env) {
	const profile = env.OPERATOR_PROFILE;
	switch (process.platform) {
		case "darwin": {
			const label = require_paths.resolveGatewayLaunchAgentLabel(profile);
			return [`launchctl bootout gui/$UID/${label}`, `rm ~/Library/LaunchAgents/${label}.plist`];
		}
		case "linux": {
			const unit = require_paths.resolveGatewaySystemdServiceName(profile);
			return [`systemctl --user disable --now ${unit}.service`, `rm ~/.config/systemd/user/${unit}.service`];
		}
		case "win32": return [`schtasks /Delete /TN "${require_paths.resolveGatewayWindowsTaskName(profile)}" /F`];
		default: return [];
	}
}
function hasGatewaySubcommandArg(args) {
	return args.some((arg) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(arg);
		return normalized === "gateway" || /(^|\s)gateway(\s|$)/.test(normalized);
	});
}
function detectMarkerLineWithGateway(contents) {
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(contents.replace(/\\\r?\n\s*/g, " "));
	for (const line of lower.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
		const assignment = trimmed.indexOf("=");
		if (assignment > 0) {
			const key = trimmed.slice(0, assignment).trim();
			if (SYSTEMD_REFERENCE_ONLY_KEYS.has(key)) continue;
			if (key === "execstart" && !hasGatewaySubcommandArg(require_systemd_unit.parseSystemdExecStart(trimmed.slice(assignment + 1).trim()))) continue;
			if (key !== "execstart") continue;
		}
		if (!trimmed.includes("gateway")) continue;
		for (const marker of EXTRA_MARKERS) if (trimmed.includes(marker)) return marker;
	}
	return null;
}
function hasGatewayServiceMarker(content) {
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(content);
	const markerKeys = ["operator_service_marker"];
	const kindKeys = ["operator_service_kind"];
	const markerValues = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_paths.GATEWAY_SERVICE_MARKER)];
	const hasMarkerKey = markerKeys.some((key) => lower.includes(key));
	const hasKindKey = kindKeys.some((key) => lower.includes(key));
	const hasMarkerValue = markerValues.some((value) => lower.includes(value));
	return hasMarkerKey && hasKindKey && hasMarkerValue && lower.includes((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)("gateway"));
}
function extractPlistKeyBlock(contents, key, tag) {
	const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`<key>${escapedKey}<\\/key>\\s*<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
	return contents.match(pattern)?.[1]?.trim() || null;
}
function extractPlistStringValues(contents, key, tag) {
	const block = extractPlistKeyBlock(contents, key, tag);
	if (!block) return [];
	if (tag === "string") return [block];
	return Array.from(block.matchAll(/<string>([\s\S]*?)<\/string>/gi)).map((match) => match[1]?.trim() ?? "").filter(Boolean);
}
function detectLaunchdGatewayExecutionMarker(contents) {
	const program = extractPlistStringValues(contents, "Program", "string");
	const programArguments = extractPlistStringValues(contents, "ProgramArguments", "array");
	if (!hasGatewaySubcommandArg(programArguments)) return null;
	const launchCommand = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)([...program, ...programArguments].filter(Boolean).join("\n"));
	for (const marker of EXTRA_MARKERS) if (launchCommand.includes(marker)) return marker;
	return null;
}
function isOperatorGatewayLaunchdService(label, contents) {
	if (hasGatewayServiceMarker(contents)) return true;
	if (detectLaunchdGatewayExecutionMarker(contents) !== "@gabrielvfonseca/operator") return false;
	return label.startsWith("ai.operator.");
}
function isOperatorGatewaySystemdService(name, contents) {
	if (hasGatewayServiceMarker(contents)) return true;
	if (!name.startsWith("operator-gateway")) return false;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(contents).includes("gateway");
}
function isOperatorGatewayTaskName(name) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name);
	if (!normalized) return false;
	const stripped = normalized.replace(/^\\+/, "");
	return stripped === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_paths.resolveGatewayWindowsTaskName()) || /^openclaw gateway \(.+\)$/.test(stripped);
}
function tryExtractPlistLabel(contents) {
	const match = contents.match(/<key>Label<\/key>\s*<string>([\s\S]*?)<\/string>/i);
	if (!match) return null;
	return match[1]?.trim() || null;
}
function isIgnoredLaunchdLabel(label) {
	return label === require_paths.resolveGatewayLaunchAgentLabel();
}
function isIgnoredSystemdName(name) {
	return name === require_paths.resolveGatewaySystemdServiceName();
}
function isLegacyLabel(label) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(label).includes("clawdbot");
}
async function readDirEntries(dir) {
	try {
		return await node_fs_promises.default.readdir(dir);
	} catch {
		return [];
	}
}
async function readUtf8File(filePath) {
	try {
		return await node_fs_promises.default.readFile(filePath, "utf8");
	} catch {
		return null;
	}
}
async function collectServiceFiles(params) {
	const out = [];
	const entries = await readDirEntries(params.dir);
	for (const entry of entries) {
		if (!entry.endsWith(params.extension)) continue;
		const name = entry.slice(0, -params.extension.length);
		if (params.isIgnoredName(name)) continue;
		const fullPath = node_path.default.join(params.dir, entry);
		const contents = await readUtf8File(fullPath);
		if (contents === null) continue;
		out.push({
			entry,
			name,
			fullPath,
			contents
		});
	}
	return out;
}
async function scanLaunchdDir(params) {
	const results = [];
	const candidates = await collectServiceFiles({
		dir: params.dir,
		extension: ".plist",
		isIgnoredName: isIgnoredLaunchdLabel
	});
	for (const { name: labelFromName, fullPath, contents } of candidates) {
		const label = tryExtractPlistLabel(contents) ?? labelFromName;
		const legacyLabel = isLegacyLabel(labelFromName) || isLegacyLabel(label);
		const executionMarker = detectLaunchdGatewayExecutionMarker(contents);
		const marker = hasGatewayServiceMarker(contents) || executionMarker === "@gabrielvfonseca/operator" ? "@gabrielvfonseca/operator" : executionMarker === "clawdbot" || legacyLabel ? "clawdbot" : null;
		if (!marker) continue;
		if (isIgnoredLaunchdLabel(label)) continue;
		if (marker === "@gabrielvfonseca/operator" && isOperatorGatewayLaunchdService(label, contents)) continue;
		results.push({
			platform: "darwin",
			label,
			detail: `plist: ${fullPath}`,
			scope: params.scope,
			marker,
			legacy: marker !== "@gabrielvfonseca/operator" || isLegacyLabel(label)
		});
	}
	return results;
}
async function scanSystemdDir(params) {
	const results = [];
	const candidates = await collectServiceFiles({
		dir: params.dir,
		extension: ".service",
		isIgnoredName: params.includeManagedOperator ? () => false : isIgnoredSystemdName
	});
	for (const { entry, name, fullPath, contents } of candidates) {
		const marker = hasGatewayServiceMarker(contents) ? "@gabrielvfonseca/operator" : detectMarkerLineWithGateway(contents);
		if (!marker) continue;
		if (!params.includeManagedOperator && marker === "@gabrielvfonseca/operator" && isOperatorGatewaySystemdService(name, contents)) continue;
		results.push({
			platform: "linux",
			label: entry,
			detail: `unit: ${fullPath}`,
			scope: params.scope,
			marker,
			legacy: marker !== "@gabrielvfonseca/operator"
		});
	}
	return results;
}
async function findSystemGatewayServices() {
	if (process.platform !== "linux") return [];
	const results = [];
	try {
		for (const dir of [
			"/etc/systemd/system",
			"/usr/lib/systemd/system",
			"/lib/systemd/system"
		]) results.push(...await scanSystemdDir({
			dir,
			scope: "system",
			includeManagedOperator: true
		}));
	} catch {
		return [];
	}
	return results;
}
function parseSchtasksList(output) {
	const tasks = [];
	let current = null;
	for (const rawLine of output.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) {
			if (current) {
				tasks.push(current);
				current = null;
			}
			continue;
		}
		const idx = line.indexOf(":");
		if (idx <= 0) continue;
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(line.slice(0, idx));
		const value = line.slice(idx + 1).trim();
		if (!value) continue;
		if (key === "taskname") {
			if (current) tasks.push(current);
			current = { name: value };
			continue;
		}
		if (!current) continue;
		if (key === "task to run") current.taskToRun = value;
	}
	if (current) tasks.push(current);
	return tasks;
}
async function findExtraGatewayServices(env, opts = {}) {
	const results = [];
	const seen = /* @__PURE__ */ new Set();
	const push = (svc) => {
		const key = `${svc.platform}:${svc.label}:${svc.detail}:${svc.scope}`;
		if (seen.has(key)) return;
		seen.add(key);
		results.push(svc);
	};
	if (process.platform === "darwin") {
		try {
			const home = require_paths.resolveHomeDir(env);
			const userDir = node_path.default.join(home, "Library", "LaunchAgents");
			for (const svc of await scanLaunchdDir({
				dir: userDir,
				scope: "user"
			})) push(svc);
			if (opts.deep) {
				for (const svc of await scanLaunchdDir({
					dir: node_path.default.join(node_path.default.sep, "Library", "LaunchAgents"),
					scope: "system"
				})) push(svc);
				for (const svc of await scanLaunchdDir({
					dir: node_path.default.join(node_path.default.sep, "Library", "LaunchDaemons"),
					scope: "system"
				})) push(svc);
			}
		} catch {
			return results;
		}
		return results;
	}
	if (process.platform === "linux") {
		try {
			const home = require_paths.resolveHomeDir(env);
			const userDir = node_path.default.join(home, ".config", "systemd", "user");
			for (const svc of await scanSystemdDir({
				dir: userDir,
				scope: "user"
			})) push(svc);
			if (opts.deep) for (const dir of [
				"/etc/systemd/system",
				"/usr/lib/systemd/system",
				"/lib/systemd/system"
			]) for (const svc of await scanSystemdDir({
				dir,
				scope: "system"
			})) push(svc);
		} catch {
			return results;
		}
		return results;
	}
	if (process.platform === "win32") {
		if (!opts.deep) return results;
		const res = await require_schtasks_exec.execSchtasks([
			"/Query",
			"/FO",
			"LIST",
			"/V"
		]);
		if (res.code !== 0) return results;
		const tasks = parseSchtasksList(res.stdout);
		for (const task of tasks) {
			const name = task.name.trim();
			if (!name) continue;
			if (isOperatorGatewayTaskName(name)) continue;
			const lowerName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name);
			const lowerCommand = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(task.taskToRun ?? "");
			let marker = null;
			for (const candidate of EXTRA_MARKERS) if (lowerName.includes(candidate) || lowerCommand.includes(candidate)) {
				marker = candidate;
				break;
			}
			if (!marker) continue;
			push({
				platform: "win32",
				label: name,
				detail: task.taskToRun ? `task: ${name}, run: ${task.taskToRun}` : name,
				scope: "system",
				marker,
				legacy: marker !== "@gabrielvfonseca/operator"
			});
		}
		return results;
	}
	return results;
}
//#endregion
exports.detectMarkerLineWithGateway = detectMarkerLineWithGateway;
exports.findExtraGatewayServices = findExtraGatewayServices;
exports.findSystemGatewayServices = findSystemGatewayServices;
exports.renderGatewayServiceCleanupHints = renderGatewayServiceCleanupHints;
