const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/commands/doctor/shared/bundled-plugin-load-paths.ts
function resolveBundledWorkspaceDir(cfg) {
	return require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg)) ?? void 0;
}
function isOperatorNodeModulesPackageRoot(packageRoot) {
	const normalized = require_discovery.normalizeBundledLookupPath(packageRoot);
	const packageDir = node_path.default.basename(normalized);
	const parentDir = node_path.default.basename(node_path.default.dirname(normalized));
	return packageDir === "@gabrielvfonseca/operator" && parentDir === "node_modules";
}
/** Find configured plugin load paths that alias bundled plugins already shipped by Operator. */
function scanBundledPluginLoadPathMigrations(cfg, env = process.env) {
	const load = require_object.asObjectRecord(require_object.asObjectRecord(cfg.plugins)?.load);
	const rawPaths = Array.isArray(load?.paths) ? load.paths : [];
	if (rawPaths.length === 0) return [];
	const bundled = require_bundled_sources.resolveBundledPluginSources({
		workspaceDir: resolveBundledWorkspaceDir(cfg),
		env
	});
	if (bundled.size === 0) return [];
	const bundledPathMap = /* @__PURE__ */ new Map();
	const packagedBundledLeafMap = /* @__PURE__ */ new Map();
	for (const source of bundled.values()) {
		for (const alias of require_discovery.buildBundledPluginLoadPathAliases(source.localPath)) bundledPathMap.set(require_discovery.normalizeBundledLookupPath(alias.path), {
			pluginId: source.pluginId,
			toPath: source.localPath
		});
		const packaged = require_discovery.parsePackagedBundledPluginPath(source.localPath);
		if (packaged) packagedBundledLeafMap.set(require_discovery.normalizeBundledLookupPath(packaged.bundledLeaf), {
			pluginId: source.pluginId,
			toPath: source.localPath
		});
	}
	const hits = [];
	for (const rawPath of rawPaths) {
		if (typeof rawPath !== "string") continue;
		const normalized = require_discovery.normalizeBundledLookupPath(require_home_dir.resolveUserPath(rawPath, env));
		const match = bundledPathMap.get(normalized);
		if (!match) {
			const oldPackaged = require_discovery.parsePackagedBundledPluginPath(normalized);
			const oldLegacy = oldPackaged ? null : require_discovery.parseLegacyBundledPluginPath(normalized);
			const oldPackageRoot = oldPackaged?.packageRoot ?? oldLegacy?.packageRoot;
			const oldBundledLeaf = oldPackaged?.bundledLeaf ?? oldLegacy?.bundledLeaf;
			const oldPackageMatch = oldPackageRoot && oldBundledLeaf && isOperatorNodeModulesPackageRoot(oldPackageRoot) ? packagedBundledLeafMap.get(require_discovery.normalizeBundledLookupPath(oldBundledLeaf)) : void 0;
			if (!oldPackageMatch) continue;
			hits.push({
				pluginId: oldPackageMatch.pluginId,
				fromPath: rawPath,
				toPath: oldPackageMatch.toPath,
				pathLabel: "plugins.load.paths"
			});
			continue;
		}
		hits.push({
			pluginId: match.pluginId,
			fromPath: rawPath,
			toPath: match.toPath,
			pathLabel: "plugins.load.paths"
		});
	}
	return hits;
}
/** Format user-facing warnings for redundant bundled plugin load path aliases. */
function collectBundledPluginLoadPathWarnings(params) {
	if (params.hits.length === 0) return [];
	const lines = params.hits.map((hit) => `- ${hit.pathLabel}: bundled plugin path "${hit.fromPath}" still aliases ${hit.pluginId}; Operator loads the packaged bundled plugin from "${hit.toPath}".`);
	lines.push(`- Run "${params.doctorFixCommand}" to remove these redundant bundled plugin paths.`);
	return lines.map((line) => require_ansi.sanitizeForLog(line));
}
/** Remove redundant bundled plugin load path aliases while preserving unrelated custom paths. */
function maybeRepairBundledPluginLoadPaths(cfg, env = process.env) {
	const hits = scanBundledPluginLoadPathMigrations(cfg, env);
	if (hits.length === 0) return {
		config: cfg,
		changes: []
	};
	const next = structuredClone(cfg);
	const paths = next.plugins?.load?.paths;
	if (!Array.isArray(paths)) return {
		config: cfg,
		changes: []
	};
	const removable = new Set(hits.map((hit) => require_discovery.normalizeBundledLookupPath(require_home_dir.resolveUserPath(hit.fromPath, env))));
	const seen = /* @__PURE__ */ new Set();
	const rewritten = [];
	for (const entry of paths) {
		if (typeof entry !== "string") {
			rewritten.push(entry);
			continue;
		}
		const resolved = require_discovery.normalizeBundledLookupPath(require_home_dir.resolveUserPath(entry, env));
		if (removable.has(resolved)) continue;
		if (seen.has(resolved)) continue;
		seen.add(resolved);
		rewritten.push(entry);
	}
	next.plugins = {
		...next.plugins,
		load: {
			...next.plugins?.load,
			paths: rewritten
		}
	};
	return {
		config: next,
		changes: hits.map((hit) => `- plugins.load.paths: removed bundled ${hit.pluginId} path alias ${hit.fromPath}`)
	};
}
//#endregion
exports.collectBundledPluginLoadPathWarnings = collectBundledPluginLoadPathWarnings;
exports.maybeRepairBundledPluginLoadPaths = maybeRepairBundledPluginLoadPaths;
exports.scanBundledPluginLoadPathMigrations = scanBundledPluginLoadPathMigrations;
