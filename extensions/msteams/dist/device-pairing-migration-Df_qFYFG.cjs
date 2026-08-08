const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_device_bootstrap = require("./device-bootstrap-CBBl1PUE.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/device-pairing-migration.ts
async function archiveLegacyFile(filePath) {
	try {
		await node_fs_promises.default.rename(filePath, `${filePath}.migrated`);
	} catch {}
}
async function fileExists(filePath) {
	return await node_fs_promises.default.access(filePath).then(() => true, () => false);
}
/** List legacy devices/*.json files the startup import has not archived yet. */
async function listLegacyDevicePairingStoreFiles(baseDir) {
	const { dir, pendingPath, pairedPath } = require_device_bootstrap.resolvePairingPaths(baseDir, "devices");
	const candidates = [
		pairedPath,
		pendingPath,
		node_path.default.join(dir, "bootstrap.json")
	];
	const present = await Promise.all(candidates.map(fileExists));
	return candidates.filter((_, index) => present[index]);
}
/**
* Import legacy devices/paired.json records into the SQLite pairing store,
* then archive the legacy files. Existing SQLite records win over legacy rows
* for the same device id. Idempotent: after the first run the files carry a
* `.migrated` suffix and the function returns null immediately. Throws on an
* unreadable paired.json so a failed import leaves the files for a retry
* instead of silently dropping approved pairings.
*/
async function migrateLegacyDevicePairingStore(params) {
	const { dir, pendingPath, pairedPath } = require_device_bootstrap.resolvePairingPaths(params?.baseDir, "devices");
	const bootstrapPath = node_path.default.join(dir, "bootstrap.json");
	const pairedRaw = await (0, _openclaw_fs_safe_json.readJsonIfExists)(pairedPath);
	const hasTransientFiles = await fileExists(pendingPath) || await fileExists(bootstrapPath);
	if (pairedRaw == null && !hasTransientFiles) return null;
	const legacyPaired = require_device_bootstrap.coercePairingStateRecord(pairedRaw);
	let imported = 0;
	let skippedExisting = 0;
	if (Object.keys(legacyPaired).length > 0) await require_device_pairing.withPairedDeviceRecords(params?.baseDir, (pairedByDeviceId) => {
		for (const [rawDeviceId, record] of Object.entries(legacyPaired)) {
			const deviceId = rawDeviceId.trim();
			if (!deviceId) continue;
			if (pairedByDeviceId[deviceId]) {
				skippedExisting += 1;
				continue;
			}
			pairedByDeviceId[deviceId] = {
				...record,
				deviceId
			};
			imported += 1;
		}
		return {
			value: void 0,
			persist: imported > 0
		};
	});
	await Promise.all([
		archiveLegacyFile(pairedPath),
		archiveLegacyFile(pendingPath),
		archiveLegacyFile(bootstrapPath)
	]);
	const result = {
		imported,
		skippedExisting
	};
	params?.log?.info(`device pairing store migrated to SQLite: imported ${imported} paired device(s), kept ${skippedExisting} existing record(s)`);
	return result;
}
//#endregion
exports.listLegacyDevicePairingStoreFiles = listLegacyDevicePairingStoreFiles;
exports.migrateLegacyDevicePairingStore = migrateLegacyDevicePairingStore;
