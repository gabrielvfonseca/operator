const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/plugins/stale-local-bundled-plugin-install-records.ts
function normalizePathForCompare(rawPath, env) {
	return node_path.default.resolve(require_discovery.normalizeBundledLookupPath(require_home_dir.resolveUserPath(rawPath, env)));
}
function primaryInstallRecordPath(record) {
	if (typeof record.installPath === "string" && record.installPath.trim()) return {
		field: "installPath",
		path: record.installPath
	};
	if (typeof record.sourcePath === "string" && record.sourcePath.trim()) return {
		field: "sourcePath",
		path: record.sourcePath
	};
	return null;
}
function looksLikeCompiledBundledPluginPath(targetPath, pluginId) {
	const segments = require_discovery.normalizeBundledLookupPath(targetPath).split(/[\\/]+/u);
	return segments.some((segment, index) => {
		return (segment === "dist" || segment === "dist-runtime") && segments[index + 1] === "extensions" && segments[index + 2] === pluginId;
	});
}
function hasStaleBundledVersion(record, bundledSource) {
	const recordVersion = record.version?.trim();
	const bundledVersion = bundledSource.version?.trim();
	return Boolean(recordVersion && bundledVersion && recordVersion !== bundledVersion);
}
/** Lists path install records that still point at stale compiled bundled plugin output. */
function listStaleLocalBundledPluginInstallRecords(params) {
	const bundled = params.bundled ?? require_bundled_sources.resolveBundledPluginSources({
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const stale = [];
	for (const [pluginId, record] of Object.entries(params.installRecords).toSorted(([left], [right]) => left.localeCompare(right))) {
		if (record.source !== "path") continue;
		const bundledSource = bundled.get(pluginId);
		if (!bundledSource?.localPath) continue;
		if (!hasStaleBundledVersion(record, bundledSource)) continue;
		const recordPath = primaryInstallRecordPath(record);
		if (!recordPath) continue;
		const stalePath = normalizePathForCompare(recordPath.path, params.env);
		const bundledPath = normalizePathForCompare(bundledSource.localPath, params.env);
		if (stalePath === bundledPath) continue;
		if (!looksLikeCompiledBundledPluginPath(stalePath, pluginId)) continue;
		stale.push({
			pluginId,
			record,
			recordPathField: recordPath.field,
			stalePath,
			bundledPath
		});
	}
	return stale;
}
/** Removes stale compiled bundled plugin path records from an install record map. */
function pruneStaleLocalBundledPluginInstallRecords(params) {
	const stale = listStaleLocalBundledPluginInstallRecords(params);
	if (stale.length === 0) return {
		records: params.installRecords,
		stale
	};
	const staleIds = new Set(stale.map((record) => record.pluginId));
	return {
		records: Object.fromEntries(Object.entries(params.installRecords).filter(([pluginId]) => !staleIds.has(pluginId))),
		stale
	};
}
//#endregion
Object.defineProperty(exports, "listStaleLocalBundledPluginInstallRecords", {
	enumerable: true,
	get: function() {
		return listStaleLocalBundledPluginInstallRecords;
	}
});
Object.defineProperty(exports, "pruneStaleLocalBundledPluginInstallRecords", {
	enumerable: true,
	get: function() {
		return pruneStaleLocalBundledPluginInstallRecords;
	}
});
