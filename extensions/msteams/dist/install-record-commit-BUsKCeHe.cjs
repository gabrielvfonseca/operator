const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_managed_npm_retention = require("./managed-npm-retention-edlbaFsN.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_installed_plugin_index_records = require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_plugin_install_config_migration = require("./plugin-install-config-migration-BsnyrqD3.cjs");
const require_uninstall = require("./uninstall-C0yddP-R.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_util = require("node:util");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/install-record-commit.ts
var install_record_commit_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	commitConfigWithPendingPluginInstalls: () => commitConfigWithPendingPluginInstalls,
	commitConfigWriteWithPendingPluginInstalls: () => commitConfigWriteWithPendingPluginInstalls,
	commitPluginInstallRecordsWithConfig: () => commitPluginInstallRecordsWithConfig,
	hasPendingPluginInstallRecords: () => hasPendingPluginInstallRecords,
	stripPendingPluginInstallRecords: () => stripPendingPluginInstallRecords,
	transformConfigWithPendingPluginInstalls: () => transformConfigWithPendingPluginInstalls,
	unchangedPendingPluginInstallRecordIds: () => unchangedPendingPluginInstallRecordIds
});
function mergeUnsetPaths(left, right) {
	const merged = [...left ?? [], ...right ?? []];
	return merged.length > 0 ? merged : void 0;
}
/** Return whether config still contains legacy/transient plugin install records. */
function hasPendingPluginInstallRecords(config) {
	return Object.keys(config.plugins?.installs ?? {}).length > 0;
}
/** Find pending install records that match the base config and can be stripped as unchanged. */
function unchangedPendingPluginInstallRecordIds(config, baseConfig) {
	const pendingInstalls = config.plugins?.installs ?? {};
	return Object.entries(baseConfig.plugins?.installs ?? {}).filter(([pluginId, baseInstall]) => (0, node_util.isDeepStrictEqual)(pendingInstalls[pluginId], baseInstall)).map(([pluginId]) => pluginId);
}
/** Remove pending plugin install records from config, optionally only for selected ids. */
function stripPendingPluginInstallRecords(config, pluginIds) {
	if (!pluginIds) return require_installed_plugin_index_records.withoutPluginInstallRecords(config);
	const removeIds = new Set(pluginIds);
	if (removeIds.size === 0 || !config.plugins?.installs) return config;
	const remainingInstalls = Object.fromEntries(Object.entries(config.plugins.installs).filter(([pluginId]) => !removeIds.has(pluginId)));
	if (Object.keys(remainingInstalls).length === 0) return require_installed_plugin_index_records.withoutPluginInstallRecords(config);
	return {
		...config,
		plugins: {
			...config.plugins,
			installs: remainingInstalls
		}
	};
}
const PLUGIN_SOURCE_CHANGED_RESTART_REASON = "plugin source changed";
function mergeAfterWrite(writeOptions, afterWrite) {
	if (afterWrite === void 0) return writeOptions;
	return {
		...writeOptions,
		afterWrite
	};
}
function installPathsOverlap(left, right) {
	const resolvedLeft = node_path.default.resolve(left);
	const resolvedRight = node_path.default.resolve(right);
	return resolvedLeft === resolvedRight || (0, _openclaw_fs_safe_path.isPathInside)(resolvedLeft, resolvedRight) || (0, _openclaw_fs_safe_path.isPathInside)(resolvedRight, resolvedLeft);
}
function resolveRetainedManagedNpmInstallMarkerTarget(params) {
	if (params.previousRecord?.source !== "npm" || params.nextRecord?.source !== "npm") return null;
	const previousInstallPath = params.previousRecord.installPath?.trim();
	const nextInstallPath = params.nextRecord.installPath?.trim();
	if (!previousInstallPath || !nextInstallPath) return null;
	if (installPathsOverlap(previousInstallPath, nextInstallPath)) return null;
	const plan = require_uninstall.planPluginUninstall({
		config: { plugins: { installs: { [params.pluginId]: params.previousRecord } } },
		pluginId: params.pluginId,
		deleteFiles: true
	});
	if (!plan.ok || !plan.directoryRemoval || plan.directoryRemoval.cleanup?.kind !== "npm" || node_path.default.resolve(plan.directoryRemoval.target) !== node_path.default.resolve(previousInstallPath)) return null;
	if (installPathsOverlap(plan.directoryRemoval.target, nextInstallPath)) return null;
	return plan.directoryRemoval.target;
}
function resolveNpmInstallRecordPackageName(record) {
	if (record.source !== "npm" || !record.installPath?.trim()) return null;
	return require_managed_npm_retention.resolveRetainedManagedNpmInstallPackageInfo(record.installPath)?.packageName ?? null;
}
function findReplacementNpmRecordForRemovedRecord(params) {
	const previousPackageName = resolveNpmInstallRecordPackageName(params.previousRecord);
	if (!previousPackageName) return null;
	for (const nextRecord of Object.values(params.nextInstallRecords)) if (resolveNpmInstallRecordPackageName(nextRecord) === previousPackageName) return nextRecord;
	return null;
}
async function markRetainedReplacedManagedNpmInstallRecords(params) {
	const markedPreviousPluginIds = /* @__PURE__ */ new Set();
	const markReplacement = async (pluginId, previousRecord, nextRecord) => {
		const packageDir = resolveRetainedManagedNpmInstallMarkerTarget({
			pluginId,
			previousRecord,
			nextRecord
		});
		if (!packageDir) return;
		const markerPath = require_managed_npm_retention.resolveRetainedManagedNpmInstallMarkerPath(packageDir);
		const markerAlreadyExisted = node_fs.default.existsSync(markerPath);
		if (await require_managed_npm_retention.markRetainedManagedNpmInstall({
			packageDir,
			pluginId,
			reason: "replaced-by-managed-npm-generation-update"
		}) && !markerAlreadyExisted) params.createdMarkerPaths.push(markerPath);
		markedPreviousPluginIds.add(pluginId);
	};
	for (const [pluginId, nextRecord] of Object.entries(params.nextInstallRecords)) await markReplacement(pluginId, params.previousInstallRecords[pluginId], nextRecord);
	for (const [pluginId, previousRecord] of Object.entries(params.previousInstallRecords)) {
		if (markedPreviousPluginIds.has(pluginId) || params.nextInstallRecords[pluginId]) continue;
		await markReplacement(pluginId, previousRecord, findReplacementNpmRecordForRemovedRecord({
			previousRecord,
			nextInstallRecords: params.nextInstallRecords
		}) ?? void 0);
	}
}
async function removeCreatedRetainedManagedNpmInstallMarkers(markerPaths) {
	for (const markerPath of markerPaths) await node_fs.default.promises.rm(markerPath, { force: true });
}
async function clearActiveRetainedManagedNpmInstallMarkers(nextInstallRecords) {
	const clearedMarkers = [];
	for (const record of Object.values(nextInstallRecords)) {
		if (record.source !== "npm" || !record.installPath?.trim()) continue;
		let markerPath;
		try {
			markerPath = require_managed_npm_retention.resolveRetainedManagedNpmInstallMarkerPath(record.installPath);
		} catch {
			continue;
		}
		let contents;
		try {
			contents = await node_fs.default.promises.readFile(markerPath, "utf8");
		} catch (error) {
			if (error.code === "ENOENT") continue;
			throw error;
		}
		if (await require_managed_npm_retention.clearRetainedManagedNpmInstallMarker(record.installPath)) clearedMarkers.push({
			markerPath,
			contents
		});
	}
	return clearedMarkers;
}
async function restoreClearedRetainedManagedNpmInstallMarkers(markerSnapshots) {
	for (const snapshot of markerSnapshots) {
		await node_fs.default.promises.mkdir(node_path.default.dirname(snapshot.markerPath), { recursive: true });
		await node_fs.default.promises.writeFile(snapshot.markerPath, snapshot.contents, "utf8");
	}
}
async function commitPluginInstallRecordsWithWriter(params) {
	const previousInstallRecords = params.previousInstallRecords ?? await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords();
	const retainedMarkerPaths = [];
	const clearedMarkerSnapshots = [];
	try {
		await require_installed_plugin_index_records.writePersistedInstalledPluginIndexInstallRecords(params.nextInstallRecords);
		try {
			await markRetainedReplacedManagedNpmInstallRecords({
				previousInstallRecords,
				nextInstallRecords: params.nextInstallRecords,
				createdMarkerPaths: retainedMarkerPaths
			});
			clearedMarkerSnapshots.push(...await clearActiveRetainedManagedNpmInstallMarkers(params.nextInstallRecords));
			const installRecordsChanged = !(0, node_util.isDeepStrictEqual)(previousInstallRecords, params.nextInstallRecords);
			return await params.commit(params.nextConfig, {
				...params.writeOptions,
				...installRecordsChanged && params.writeOptions?.afterWrite === void 0 ? { afterWrite: {
					mode: "restart",
					reason: PLUGIN_SOURCE_CHANGED_RESTART_REASON
				} } : {},
				unsetPaths: mergeUnsetPaths(params.writeOptions?.unsetPaths, [Array.from(require_installed_plugin_index_records.PLUGIN_INSTALLS_CONFIG_PATH)])
			});
		} catch (error) {
			try {
				await require_installed_plugin_index_records.writePersistedInstalledPluginIndexInstallRecords(previousInstallRecords);
			} catch (rollbackError) {
				throw new Error("Failed to commit plugin install records and could not restore the previous plugin index", { cause: rollbackError });
			}
			throw error;
		}
	} catch (error) {
		await restoreClearedRetainedManagedNpmInstallMarkers(clearedMarkerSnapshots);
		await removeCreatedRetainedManagedNpmInstallMarkers(retainedMarkerPaths);
		throw error;
	}
}
/** Persist plugin install records and commit the matching config update to disk. */
async function commitPluginInstallRecordsWithConfig(params) {
	await commitPluginInstallRecordsWithWriter({
		...params,
		commit: async (nextConfig, writeOptions) => {
			return await require_config.replaceConfigFile({
				nextConfig,
				...params.baseHash !== void 0 ? { baseHash: params.baseHash } : {},
				...writeOptions ? { writeOptions } : {}
			});
		}
	});
}
/** Commit config while migrating any pending install records into the install index. */
async function commitConfigWriteWithPendingPluginInstalls(params) {
	const sourceInstallRecords = require_plugin_install_config_migration.extractShippedPluginInstallConfigRecords(params.sourceConfig);
	const nextPendingConfig = params.sourceConfig ? stripPendingPluginInstallRecords(params.nextConfig, unchangedPendingPluginInstallRecordIds(params.nextConfig, { plugins: { installs: sourceInstallRecords } })) : params.nextConfig;
	if (Object.keys(sourceInstallRecords).length === 0 && !hasPendingPluginInstallRecords(nextPendingConfig)) {
		const committed = params.writeOptions ? await params.commit(params.nextConfig, params.writeOptions) : await params.commit(params.nextConfig);
		return {
			config: params.nextConfig,
			installRecords: {},
			movedInstallRecords: false,
			persistedHash: committed?.persistedHash ?? null
		};
	}
	const pendingInstallRecords = nextPendingConfig.plugins?.installs ?? {};
	const previousInstallRecords = await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords();
	const nextInstallRecords = {
		...sourceInstallRecords,
		...previousInstallRecords,
		...pendingInstallRecords
	};
	const strippedConfig = require_installed_plugin_index_records.withoutPluginInstallRecords(params.nextConfig);
	return {
		config: strippedConfig,
		installRecords: nextInstallRecords,
		movedInstallRecords: true,
		persistedHash: (await commitPluginInstallRecordsWithWriter({
			previousInstallRecords,
			nextInstallRecords,
			nextConfig: strippedConfig,
			...params.writeOptions ? { writeOptions: params.writeOptions } : {},
			commit: params.commit
		}))?.persistedHash ?? null
	};
}
/** Replace the config file after moving pending plugin install records into the install index. */
async function commitConfigWithPendingPluginInstalls(params) {
	return await commitConfigWriteWithPendingPluginInstalls({
		nextConfig: params.nextConfig,
		...params.writeOptions ? { writeOptions: params.writeOptions } : {},
		commit: async (nextConfig, writeOptions) => {
			return await require_config.replaceConfigFile({
				nextConfig,
				...params.baseHash !== void 0 ? { baseHash: params.baseHash } : {},
				...writeOptions ? { writeOptions } : {}
			});
		}
	});
}
/** Transform config with retry support while preserving plugin install index consistency. */
async function transformConfigWithPendingPluginInstalls(params) {
	const commit = async ({ nextConfig, snapshot, baseHash, writeOptions }) => {
		const requestedAfterWrite = params.afterWrite ?? params.writeOptions?.afterWrite;
		const committed = await commitConfigWriteWithPendingPluginInstalls({
			nextConfig,
			sourceConfig: snapshot.sourceConfig,
			...writeOptions ? { writeOptions: mergeAfterWrite(writeOptions, params.afterWrite) } : {},
			commit: async (config, commitWriteOptions) => {
				return await require_config.replaceConfigFile({
					nextConfig: config,
					snapshot,
					writeOptions: commitWriteOptions ?? {},
					...baseHash !== void 0 ? { baseHash } : {}
				});
			}
		});
		const afterWrite = require_runtime_snapshot.resolveConfigWriteAfterWrite(requestedAfterWrite ?? (committed.movedInstallRecords ? {
			mode: "restart",
			reason: PLUGIN_SOURCE_CHANGED_RESTART_REASON
		} : void 0));
		return {
			config: committed.config,
			persistedHash: committed.persistedHash,
			afterWrite
		};
	};
	return await require_config.transformConfigFileWithRetry({
		...params,
		commit
	});
}
//#endregion
Object.defineProperty(exports, "commitConfigWithPendingPluginInstalls", {
	enumerable: true,
	get: function() {
		return commitConfigWithPendingPluginInstalls;
	}
});
Object.defineProperty(exports, "commitConfigWriteWithPendingPluginInstalls", {
	enumerable: true,
	get: function() {
		return commitConfigWriteWithPendingPluginInstalls;
	}
});
Object.defineProperty(exports, "commitPluginInstallRecordsWithConfig", {
	enumerable: true,
	get: function() {
		return commitPluginInstallRecordsWithConfig;
	}
});
Object.defineProperty(exports, "hasPendingPluginInstallRecords", {
	enumerable: true,
	get: function() {
		return hasPendingPluginInstallRecords;
	}
});
Object.defineProperty(exports, "install_record_commit_exports", {
	enumerable: true,
	get: function() {
		return install_record_commit_exports;
	}
});
Object.defineProperty(exports, "stripPendingPluginInstallRecords", {
	enumerable: true,
	get: function() {
		return stripPendingPluginInstallRecords;
	}
});
Object.defineProperty(exports, "transformConfigWithPendingPluginInstalls", {
	enumerable: true,
	get: function() {
		return transformConfigWithPendingPluginInstalls;
	}
});
Object.defineProperty(exports, "unchangedPendingPluginInstallRecordIds", {
	enumerable: true,
	get: function() {
		return unchangedPendingPluginInstallRecordIds;
	}
});
