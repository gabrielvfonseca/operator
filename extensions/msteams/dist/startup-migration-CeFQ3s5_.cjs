const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_state_migrations = require("./state-migrations-Dvj8tU9T.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/config/sessions/store-temp-cleanup.ts
const DELETE_CONCURRENCY = 16;
async function hasValidPrimaryStore(storePath) {
	try {
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(JSON.parse(await node_fs_promises.default.readFile(storePath, "utf8")));
	} catch {
		return false;
	}
}
/** Removes stale atomic-write temps only when the primary store is recoverable. */
async function sweepOrphanSessionStoreTemps(params) {
	const storeDir = node_path.default.dirname(params.storePath);
	const storeBasename = node_path.default.basename(params.storePath);
	const cutoffMs = (params.nowMs ?? Date.now()) - require_paths.SESSION_STORE_TEMP_STALE_MS;
	const entries = await node_fs_promises.default.readdir(storeDir, { withFileTypes: true }).catch(() => []);
	const { results: staleCandidates } = await require_resolve.runTasksWithConcurrency({
		limit: DELETE_CONCURRENCY,
		tasks: entries.filter((entry) => entry.isFile() && require_paths.isSessionStoreTempArtifactName(entry.name, storeBasename)).map((entry) => async () => {
			const candidatePath = node_path.default.join(storeDir, entry.name);
			const stat = await node_fs_promises.default.stat(candidatePath).catch(() => null);
			if (!stat?.isFile() || stat.mtimeMs > cutoffMs) return null;
			return candidatePath;
		})
	});
	const stalePaths = staleCandidates.filter((candidatePath) => typeof candidatePath === "string");
	if (stalePaths.length === 0 || !await hasValidPrimaryStore(params.storePath)) return 0;
	const { results } = await require_resolve.runTasksWithConcurrency({
		limit: DELETE_CONCURRENCY,
		tasks: stalePaths.map((candidatePath) => async () => {
			try {
				await node_fs_promises.default.unlink(candidatePath);
				return 1;
			} catch {
				return 0;
			}
		})
	});
	let removedCount = 0;
	for (const removed of results) removedCount += removed;
	return removedCount;
}
//#endregion
//#region src/config/sessions/startup-migration.ts
/**
* Run session migration and orphan-temp cleanup before runtime store reads.
*
* Both passes are idempotent and failure-isolated: startup continues if either
* fails, but warnings stay visible for operator follow-up.
*/
async function runSessionStartupMigration(params) {
	const migrate = params.deps?.migrateOrphanedSessionKeys ?? require_state_migrations.migrateOrphanedSessionKeys;
	try {
		const result = await migrate({
			cfg: params.cfg,
			env: params.env ?? process.env
		});
		if (result.changes.length > 0) params.log.info(`session: canonicalized orphaned session keys:\n${result.changes.map((c) => `- ${c}`).join("\n")}`);
		if (result.warnings.length > 0) params.log.warn(`session: session key migration warnings:\n${result.warnings.map((w) => `- ${w}`).join("\n")}`);
	} catch (err) {
		params.log.warn(`session: orphaned session key migration failed during startup; continuing: ${String(err)}`);
	}
	const resolveTargets = params.deps?.resolveAllAgentSessionStoreTargetsSync ?? require_targets.resolveAllAgentSessionStoreTargetsSync;
	const sweepTemps = params.deps?.sweepOrphanSessionStoreTemps ?? sweepOrphanSessionStoreTemps;
	try {
		let removedFiles = 0;
		for (const target of resolveTargets(params.cfg, { env: params.env ?? process.env })) removedFiles += await sweepTemps({ storePath: target.storePath });
		if (removedFiles > 0) params.log.info(`session: removed ${removedFiles} stale session store temp file(s)`);
	} catch (err) {
		params.log.warn(`session: stale session store temp cleanup failed during startup; continuing: ${String(err)}`);
	}
}
//#endregion
exports.runSessionStartupMigration = runSessionStartupMigration;
