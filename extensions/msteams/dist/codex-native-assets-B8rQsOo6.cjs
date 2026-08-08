const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_harness_runtimes = require("./harness-runtimes-bhXUB0Pb.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor/shared/codex-native-assets.ts
const MAX_SCAN_DEPTH = 6;
const MAX_DISCOVERED_DIRS = 2e3;
function resolveUserHome(env) {
	return env.HOME?.trim() || node_os.default.homedir();
}
function resolveHomePath(value, env) {
	if (value === "~") return resolveUserHome(env);
	if (value.startsWith("~/")) return node_path.default.join(resolveUserHome(env), value.slice(2));
	return node_path.default.resolve(value);
}
function resolveCodexHome(env) {
	return resolveHomePath(env.CODEX_HOME?.trim() || "~/.codex", env);
}
function resolvePersonalAgentSkillsDir(env) {
	return node_path.default.join(resolveUserHome(env), ".agents", "skills");
}
async function exists(filePath) {
	try {
		await node_fs_promises.default.access(filePath);
		return true;
	} catch {
		return false;
	}
}
async function isDirectory(filePath) {
	try {
		return (await node_fs_promises.default.stat(filePath)).isDirectory();
	} catch {
		return false;
	}
}
async function safeReadDir(dir) {
	return await node_fs_promises.default.readdir(dir, { withFileTypes: true }).catch(() => []);
}
async function discoverSkillHits(root) {
	if (!await isDirectory(root)) return [];
	const hits = [];
	async function visit(dir, depth) {
		if (hits.length >= MAX_DISCOVERED_DIRS || depth > MAX_SCAN_DEPTH) return;
		if (depth === 1 && node_path.default.basename(dir) === ".system") return;
		if (await exists(node_path.default.join(dir, "SKILL.md"))) {
			hits.push({
				kind: "skill",
				path: dir
			});
			return;
		}
		for (const entry of await safeReadDir(dir)) if (entry.isDirectory()) await visit(node_path.default.join(dir, entry.name), depth + 1);
	}
	await visit(root, 0);
	return hits;
}
async function discoverPluginHits(root) {
	if (!await isDirectory(root)) return [];
	const hits = /* @__PURE__ */ new Map();
	async function visit(dir, depth) {
		if (hits.size >= MAX_DISCOVERED_DIRS || depth > MAX_SCAN_DEPTH) return;
		if (await exists(node_path.default.join(dir, ".codex-plugin", "plugin.json"))) {
			hits.set(dir, {
				kind: "plugin",
				path: dir
			});
			return;
		}
		for (const entry of await safeReadDir(dir)) if (entry.isDirectory()) await visit(node_path.default.join(dir, entry.name), depth + 1);
	}
	await visit(root, 0);
	return [...hits.values()];
}
function isCodexRuntimeConfigured(cfg, _env) {
	return require_harness_runtimes.collectConfiguredAgentHarnessRuntimes(cfg).includes("codex");
}
function isCodexPluginConfigured(cfg) {
	const plugins = cfg.plugins;
	if (plugins?.enabled === false) return false;
	const allow = plugins?.allow;
	const allowList = Array.isArray(allow) ? allow.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry)) : void 0;
	if (allowList && !allowList.includes("codex")) return false;
	if (allowList?.includes("codex")) return true;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(plugins?.entries?.codex) && plugins.entries.codex.enabled !== false;
}
function shouldScanCodexNativeAssets(cfg, env) {
	return isCodexRuntimeConfigured(cfg, env) || isCodexPluginConfigured(cfg);
}
/** Discover personal Codex skills, plugins, config, and hooks relevant to Codex-mode agents. */
async function scanCodexNativeAssets(params) {
	const env = params.env ?? process.env;
	if (!shouldScanCodexNativeAssets(params.cfg, env)) return [];
	const codexHome = resolveCodexHome(env);
	const hits = /* @__PURE__ */ new Map();
	function record(hit) {
		hits.set(`${hit.kind}:${hit.path}`, hit);
	}
	for (const hit of await discoverSkillHits(node_path.default.join(codexHome, "skills"))) record(hit);
	for (const hit of await discoverSkillHits(resolvePersonalAgentSkillsDir(env))) record(hit);
	for (const hit of await discoverPluginHits(node_path.default.join(codexHome, "plugins", "cache"))) record(hit);
	const configPath = node_path.default.join(codexHome, "config.toml");
	if (await exists(configPath)) record({
		kind: "config",
		path: configPath
	});
	const hooksPath = node_path.default.join(codexHome, "hooks", "hooks.json");
	if (await exists(hooksPath)) record({
		kind: "hooks",
		path: hooksPath
	});
	return [...hits.values()].toSorted((a, b) => a.path.localeCompare(b.path));
}
function countKind(hits, kind) {
	return hits.filter((hit) => hit.kind === kind).length;
}
function plural(count, singular) {
	return `${count} ${singular}${count === 1 ? "" : "s"}`;
}
/** Build an informational doctor note when personal Codex CLI assets need migration review. */
async function collectCodexNativeAssetInfoNotes(params) {
	const env = params.env ?? process.env;
	const hits = await scanCodexNativeAssets({
		cfg: params.cfg,
		env
	});
	if (hits.length === 0) return [];
	return [[`- Personal Codex CLI assets found (${[
		plural(countKind(hits, "skill"), "skill"),
		plural(countKind(hits, "plugin"), "plugin"),
		plural(countKind(hits, "config"), "config file"),
		plural(countKind(hits, "hooks"), "hook file")
	].join(", ")}) in ${resolveCodexHome(env)} and ${resolvePersonalAgentSkillsDir(env)}; native Codex-mode agents use isolated per-agent homes and will not load them.`, "- To review or promote them: install the Codex plugin (openclaw plugins install npm:@gabrielvfonseca/codex), then run openclaw migrate plan codex."].join("\n")];
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.codexNativeAssetsTestApi")] = { scanCodexNativeAssets };
//#endregion
exports.collectCodexNativeAssetInfoNotes = collectCodexNativeAssetInfoNotes;
