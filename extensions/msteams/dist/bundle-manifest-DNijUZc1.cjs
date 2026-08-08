const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let json5 = require("json5");
json5 = require_rolldown_runtime.__toESM(json5, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/plugin-scan-existence-cache.ts
/** Scan-scoped existence cache for plugin discovery hot paths.
*
* Plugin metadata is process-stable: installs, manifests, and catalogs change
* only on restart or an explicit owner reload/install/doctor flow (see
* AGENTS.MD). A single cold-start discovery scan still re-probes the same paths
* many times — `detectBundleManifestFormat` checks `skills/`, `.mcp.json`,
* `settings.json`, ... and `loadBundleManifest`'s capability builders check
* them again. Across bundled plugins that is thousands of synchronous
* `fs.existsSync` calls; the issue reports 25.4s of self-time on Windows cold
* start.
*
* This memoizes existence results for the lifetime of ONE scan pass only. A
* later install/repair pass runs without an active cache (or under a fresh
* cache), so marker files that appear mid-process are never served stale — the
* freshness bug a process-global cache would reintroduce. Outside a scan,
* `pluginScanExistsSync` falls back to plain `fs.existsSync`, so one-off
* callers (install, hooks, doctor) stay correct and uncached. */
const scanExistenceCacheStack = [];
/** Runs `fn` with a scan-scoped existence cache active. Sync-only. */
function withPluginScanExistenceCache(fn) {
	scanExistenceCacheStack.push(/* @__PURE__ */ new Map());
	try {
		return fn();
	} finally {
		scanExistenceCacheStack.pop();
	}
}
/** `fs.existsSync` memoized for the active scan pass, if any.
*
* Outside `withPluginScanExistenceCache` this is plain `fs.existsSync`, so
* callers that are not part of a scan pay no caching cost or staleness. */
function pluginScanExistsSync(targetPath) {
	const cache = scanExistenceCacheStack[scanExistenceCacheStack.length - 1];
	if (!cache) return node_fs.default.existsSync(targetPath);
	const cached = cache.get(targetPath);
	if (cached !== void 0) return cached;
	const result = node_fs.default.existsSync(targetPath);
	cache.set(targetPath, result);
	return result;
}
//#endregion
//#region src/plugins/bundle-manifest.ts
/** Reads Codex/Claude/Cursor bundle manifests into Operator plugin manifest metadata. */
/** Relative manifest path for Codex-style plugin bundles. */
const CODEX_BUNDLE_MANIFEST_RELATIVE_PATH = ".codex-plugin/plugin.json";
const CLAUDE_BUNDLE_MANIFEST_RELATIVE_PATH = ".claude-plugin/plugin.json";
const CURSOR_BUNDLE_MANIFEST_RELATIVE_PATH = ".cursor-plugin/plugin.json";
/** Normalizes string-or-list path fields from bundle manifests. */
function normalizeBundlePathList(value) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(value);
}
function mergeBundlePathLists(...groups) {
	const merged = [];
	const seen = /* @__PURE__ */ new Set();
	for (const group of groups) for (const entry of group) {
		if (seen.has(entry)) continue;
		seen.add(entry);
		merged.push(entry);
	}
	return merged;
}
function hasInlineCapabilityValue(value) {
	if (typeof value === "string") return value.trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return Object.keys(value).length > 0;
	return value === true;
}
function slugifyPluginId(raw, rootDir) {
	const fallback = node_path.default.basename(rootDir);
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(fallback)).replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "bundle-plugin";
}
function loadBundleManifestFile(params) {
	const manifestPath = node_path.default.join(params.rootDir, params.manifestRelativePath);
	const result = (0, _openclaw_fs_safe_json.readRootStructuredFileSync)({
		rootDir: params.rootDir,
		...params.rootRealPath !== void 0 ? { rootRealPath: params.rootRealPath } : {},
		relativePath: params.manifestRelativePath,
		boundaryLabel: "plugin root",
		rejectHardlinks: params.rejectHardlinks,
		parse: (raw) => json5.default.parse(raw),
		validate: _gabrielvfonseca_normalization_core_record_coerce.isRecord
	});
	if (!result.ok && result.reason === "open") return (0, _openclaw_fs_safe_advanced.matchRootFileOpenFailure)(result.failure, {
		path: () => {
			if (params.allowMissing) return {
				ok: true,
				raw: {},
				manifestPath
			};
			return {
				ok: false,
				error: `plugin manifest not found: ${manifestPath}`,
				manifestPath
			};
		},
		fallback: (failure) => ({
			ok: false,
			error: `unsafe plugin manifest path: ${manifestPath} (${failure.reason})`,
			manifestPath
		})
	});
	if (!result.ok) return {
		ok: false,
		error: result.reason === "invalid" ? "plugin manifest must be an object" : `failed to parse plugin manifest: ${result.error}`,
		manifestPath
	};
	return {
		ok: true,
		raw: result.value,
		manifestPath
	};
}
function resolveCodexSkillDirs(raw, rootDir) {
	const declared = normalizeBundlePathList(raw.skills);
	if (declared.length > 0) return declared;
	return pluginScanExistsSync(node_path.default.join(rootDir, "skills")) ? ["skills"] : [];
}
function resolveCodexHookDirs(raw, rootDir) {
	const declared = normalizeBundlePathList(raw.hooks);
	if (declared.length > 0) return declared;
	return pluginScanExistsSync(node_path.default.join(rootDir, "hooks")) ? ["hooks"] : [];
}
function resolveCursorSkillsRootDirs(raw, rootDir) {
	const declared = normalizeBundlePathList(raw.skills);
	return mergeBundlePathLists(pluginScanExistsSync(node_path.default.join(rootDir, "skills")) ? ["skills"] : [], declared);
}
function resolveCursorCommandRootDirs(raw, rootDir) {
	const declared = normalizeBundlePathList(raw.commands);
	return mergeBundlePathLists(pluginScanExistsSync(node_path.default.join(rootDir, ".cursor", "commands")) ? [".cursor/commands"] : [], declared);
}
function resolveCursorSkillDirs(raw, rootDir) {
	return mergeBundlePathLists(resolveCursorSkillsRootDirs(raw, rootDir), resolveCursorCommandRootDirs(raw, rootDir));
}
function resolveCursorAgentDirs(raw, rootDir) {
	const declared = normalizeBundlePathList(raw.subagents ?? raw.agents);
	return mergeBundlePathLists(pluginScanExistsSync(node_path.default.join(rootDir, ".cursor", "agents")) ? [".cursor/agents"] : [], declared);
}
function hasCursorHookCapability(raw, rootDir) {
	return hasInlineCapabilityValue(raw.hooks) || pluginScanExistsSync(node_path.default.join(rootDir, ".cursor", "hooks.json"));
}
function hasCursorRulesCapability(raw, rootDir) {
	return hasInlineCapabilityValue(raw.rules) || pluginScanExistsSync(node_path.default.join(rootDir, ".cursor", "rules"));
}
function hasCursorMcpCapability(raw, rootDir) {
	return hasInlineCapabilityValue(raw.mcpServers) || pluginScanExistsSync(node_path.default.join(rootDir, ".mcp.json"));
}
function resolveClaudeComponentPaths(raw, key, rootDir, defaults) {
	const declared = normalizeBundlePathList(raw[key]);
	return mergeBundlePathLists(defaults.filter((candidate) => pluginScanExistsSync(node_path.default.join(rootDir, candidate))), declared);
}
function resolveClaudeSkillsRootDirs(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "skills", rootDir, ["skills"]);
}
function resolveClaudeCommandRootDirs(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "commands", rootDir, ["commands"]);
}
function resolveClaudeSkillDirs(raw, rootDir) {
	return mergeBundlePathLists(resolveClaudeSkillsRootDirs(raw, rootDir), resolveClaudeCommandRootDirs(raw, rootDir), resolveClaudeAgentDirs(raw, rootDir), resolveClaudeOutputStylePaths(raw, rootDir));
}
function resolveClaudeAgentDirs(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "agents", rootDir, ["agents"]);
}
function resolveClaudeHookPaths(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "hooks", rootDir, ["hooks/hooks.json"]);
}
function resolveClaudeMcpPaths(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "mcpServers", rootDir, [".mcp.json"]);
}
function resolveClaudeLspPaths(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "lspServers", rootDir, [".lsp.json"]);
}
function resolveClaudeOutputStylePaths(raw, rootDir) {
	return resolveClaudeComponentPaths(raw, "outputStyles", rootDir, ["output-styles"]);
}
function resolveClaudeSettingsFiles(_raw, rootDir) {
	return pluginScanExistsSync(node_path.default.join(rootDir, "settings.json")) ? ["settings.json"] : [];
}
function hasClaudeHookCapability(raw, rootDir) {
	return hasInlineCapabilityValue(raw.hooks) || resolveClaudeHookPaths(raw, rootDir).length > 0;
}
function buildCodexCapabilities(raw, rootDir) {
	const capabilities = [];
	if (resolveCodexSkillDirs(raw, rootDir).length > 0) capabilities.push("skills");
	if (resolveCodexHookDirs(raw, rootDir).length > 0) capabilities.push("hooks");
	if (hasInlineCapabilityValue(raw.mcpServers) || pluginScanExistsSync(node_path.default.join(rootDir, ".mcp.json"))) capabilities.push("mcpServers");
	if (hasInlineCapabilityValue(raw.apps) || pluginScanExistsSync(node_path.default.join(rootDir, ".app.json"))) capabilities.push("apps");
	return capabilities;
}
function buildClaudeCapabilities(raw, rootDir) {
	const capabilities = [];
	if (resolveClaudeSkillDirs(raw, rootDir).length > 0) capabilities.push("skills");
	if (resolveClaudeCommandRootDirs(raw, rootDir).length > 0) capabilities.push("commands");
	if (resolveClaudeAgentDirs(raw, rootDir).length > 0) capabilities.push("agents");
	if (hasClaudeHookCapability(raw, rootDir)) capabilities.push("hooks");
	if (hasInlineCapabilityValue(raw.mcpServers) || resolveClaudeMcpPaths(raw, rootDir).length > 0) capabilities.push("mcpServers");
	if (hasInlineCapabilityValue(raw.lspServers) || resolveClaudeLspPaths(raw, rootDir).length > 0) capabilities.push("lspServers");
	if (hasInlineCapabilityValue(raw.outputStyles) || resolveClaudeOutputStylePaths(raw, rootDir).length > 0) capabilities.push("outputStyles");
	if (resolveClaudeSettingsFiles(raw, rootDir).length > 0) capabilities.push("settings");
	return capabilities;
}
function buildCursorCapabilities(raw, rootDir) {
	const capabilities = [];
	if (resolveCursorSkillDirs(raw, rootDir).length > 0) capabilities.push("skills");
	if (resolveCursorCommandRootDirs(raw, rootDir).length > 0) capabilities.push("commands");
	if (resolveCursorAgentDirs(raw, rootDir).length > 0) capabilities.push("agents");
	if (hasCursorHookCapability(raw, rootDir)) capabilities.push("hooks");
	if (hasCursorRulesCapability(raw, rootDir)) capabilities.push("rules");
	if (hasCursorMcpCapability(raw, rootDir)) capabilities.push("mcpServers");
	return capabilities;
}
function loadBundleManifest(params) {
	const rejectHardlinks = params.rejectHardlinks ?? true;
	const manifestRelativePath = params.bundleFormat === "codex" ? CODEX_BUNDLE_MANIFEST_RELATIVE_PATH : params.bundleFormat === "cursor" ? CURSOR_BUNDLE_MANIFEST_RELATIVE_PATH : CLAUDE_BUNDLE_MANIFEST_RELATIVE_PATH;
	const loaded = loadBundleManifestFile({
		rootDir: params.rootDir,
		...params.rootRealPath !== void 0 ? { rootRealPath: params.rootRealPath } : {},
		manifestRelativePath,
		rejectHardlinks,
		allowMissing: params.bundleFormat === "claude"
	});
	if (!loaded.ok) return loaded;
	const raw = loaded.raw;
	const interfaceRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.interface) ? raw.interface : void 0;
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.name);
	const description = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.description) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.shortDescription) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(interfaceRecord?.shortDescription);
	const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.version);
	if (params.bundleFormat === "codex") {
		const skills = resolveCodexSkillDirs(raw, params.rootDir);
		const hooks = resolveCodexHookDirs(raw, params.rootDir);
		return {
			ok: true,
			manifest: {
				id: slugifyPluginId(name, params.rootDir),
				name,
				description,
				version,
				skills,
				settingsFiles: [],
				hooks,
				bundleFormat: "codex",
				activation: require_manifest.normalizeManifestActivation(raw.activation),
				capabilities: buildCodexCapabilities(raw, params.rootDir)
			},
			manifestPath: loaded.manifestPath
		};
	}
	if (params.bundleFormat === "cursor") return {
		ok: true,
		manifest: {
			id: slugifyPluginId(name, params.rootDir),
			name,
			description,
			version,
			skills: resolveCursorSkillDirs(raw, params.rootDir),
			settingsFiles: [],
			hooks: [],
			bundleFormat: "cursor",
			activation: require_manifest.normalizeManifestActivation(raw.activation),
			capabilities: buildCursorCapabilities(raw, params.rootDir)
		},
		manifestPath: loaded.manifestPath
	};
	return {
		ok: true,
		manifest: {
			id: slugifyPluginId(name, params.rootDir),
			name,
			description,
			version,
			skills: resolveClaudeSkillDirs(raw, params.rootDir),
			settingsFiles: resolveClaudeSettingsFiles(raw, params.rootDir),
			hooks: resolveClaudeHookPaths(raw, params.rootDir),
			bundleFormat: "claude",
			activation: require_manifest.normalizeManifestActivation(raw.activation),
			capabilities: buildClaudeCapabilities(raw, params.rootDir)
		},
		manifestPath: loaded.manifestPath
	};
}
function detectBundleManifestFormat(rootDir) {
	if (pluginScanExistsSync(node_path.default.join(rootDir, ".codex-plugin/plugin.json"))) return "codex";
	if (pluginScanExistsSync(node_path.default.join(rootDir, ".cursor-plugin/plugin.json"))) return "cursor";
	if (pluginScanExistsSync(node_path.default.join(rootDir, ".claude-plugin/plugin.json"))) return "claude";
	if (pluginScanExistsSync(node_path.default.join(rootDir, "operator.plugin.json"))) return null;
	if (require_manifest.DEFAULT_PLUGIN_ENTRY_CANDIDATES.some((candidate) => pluginScanExistsSync(node_path.default.join(rootDir, candidate)))) return null;
	if ([
		node_path.default.join(rootDir, "skills"),
		node_path.default.join(rootDir, "commands"),
		node_path.default.join(rootDir, "agents"),
		node_path.default.join(rootDir, "hooks", "hooks.json"),
		node_path.default.join(rootDir, ".mcp.json"),
		node_path.default.join(rootDir, ".lsp.json"),
		node_path.default.join(rootDir, "settings.json")
	].some((candidate) => pluginScanExistsSync(candidate))) return "claude";
	return null;
}
//#endregion
Object.defineProperty(exports, "CLAUDE_BUNDLE_MANIFEST_RELATIVE_PATH", {
	enumerable: true,
	get: function() {
		return CLAUDE_BUNDLE_MANIFEST_RELATIVE_PATH;
	}
});
Object.defineProperty(exports, "CODEX_BUNDLE_MANIFEST_RELATIVE_PATH", {
	enumerable: true,
	get: function() {
		return CODEX_BUNDLE_MANIFEST_RELATIVE_PATH;
	}
});
Object.defineProperty(exports, "CURSOR_BUNDLE_MANIFEST_RELATIVE_PATH", {
	enumerable: true,
	get: function() {
		return CURSOR_BUNDLE_MANIFEST_RELATIVE_PATH;
	}
});
Object.defineProperty(exports, "detectBundleManifestFormat", {
	enumerable: true,
	get: function() {
		return detectBundleManifestFormat;
	}
});
Object.defineProperty(exports, "loadBundleManifest", {
	enumerable: true,
	get: function() {
		return loadBundleManifest;
	}
});
Object.defineProperty(exports, "mergeBundlePathLists", {
	enumerable: true,
	get: function() {
		return mergeBundlePathLists;
	}
});
Object.defineProperty(exports, "normalizeBundlePathList", {
	enumerable: true,
	get: function() {
		return normalizeBundlePathList;
	}
});
Object.defineProperty(exports, "withPluginScanExistenceCache", {
	enumerable: true,
	get: function() {
		return withPluginScanExistenceCache;
	}
});
