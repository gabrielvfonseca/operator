const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_device_bootstrap = require("./device-bootstrap-CBBl1PUE.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/node-pairing-migration.ts
async function archiveLegacyFile(path) {
	try {
		await node_fs_promises.default.rename(path, `${path}.migrated`);
	} catch {}
}
/**
* Fold legacy nodes/paired.json rows into device-record node surfaces, then
* archive the legacy files. Idempotent: after the first run the files carry a
* `.migrated` suffix and the function returns null immediately.
*/
async function migrateLegacyNodePairingStore(params) {
	const { pendingPath, pairedPath } = require_device_bootstrap.resolvePairingPaths(params?.baseDir, "nodes");
	const [pairedRaw, pendingRaw] = await Promise.all([(0, _openclaw_fs_safe_json.readJsonIfExists)(pairedPath), (0, _openclaw_fs_safe_json.readJsonIfExists)(pendingPath)]);
	if (pairedRaw == null && pendingRaw == null) return null;
	const legacyRows = require_device_bootstrap.coercePairingStateRecord(pairedRaw);
	let migrated = 0;
	let orphaned = 0;
	if (Object.keys(legacyRows).length > 0) await require_device_pairing.withPairedDeviceRecords(params?.baseDir, (pairedByDeviceId) => {
		const now = Date.now();
		for (const [rawNodeId, row] of Object.entries(legacyRows)) {
			const device = pairedByDeviceId[rawNodeId.trim()];
			if (!device || !require_device_pairing.listApprovedPairedDeviceRoles(device).includes("node")) {
				orphaned += 1;
				continue;
			}
			if (device.nodeSurface) continue;
			device.nodeSurface = {
				displayName: row.displayName,
				version: row.version,
				coreVersion: row.coreVersion,
				uiVersion: row.uiVersion,
				modelIdentifier: row.modelIdentifier,
				caps: Array.isArray(row.caps) ? row.caps : void 0,
				commands: Array.isArray(row.commands) ? row.commands : void 0,
				permissions: row.permissions,
				bins: Array.isArray(row.bins) ? row.bins : void 0,
				createdAtMs: typeof row.createdAtMs === "number" ? row.createdAtMs : now,
				approvedAtMs: typeof row.approvedAtMs === "number" ? row.approvedAtMs : now,
				lastConnectedAtMs: typeof row.lastConnectedAtMs === "number" ? row.lastConnectedAtMs : void 0
			};
			migrated += 1;
		}
		return {
			value: void 0,
			persist: migrated > 0
		};
	});
	await Promise.all([archiveLegacyFile(pairedPath), archiveLegacyFile(pendingPath)]);
	const result = {
		migrated,
		orphaned
	};
	params?.log?.info(`node pairing store migrated: folded ${migrated} node surface(s) into device records, dropped ${orphaned} orphan row(s)`);
	return result;
}
//#endregion
exports.migrateLegacyNodePairingStore = migrateLegacyNodePairingStore;
