const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_facade_loader = require("./facade-loader-CNps1O4t.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/commands/doctor-browser.ts
/** Facade-backed doctor checks and cleanup for bundled browser plugin state. */
function loadBrowserDoctorSurface() {
	return require_facade_loader.loadBundledPluginPublicSurfaceModuleSync({
		dirName: "browser",
		artifactBasename: "browser-doctor.js"
	});
}
function mayHaveLegacyClawdBrowserProfileResidue(deps) {
	const configDir = deps?.configDir ?? require_utils.resolveConfigDir(deps?.env ?? process.env);
	const legacyProfileDir = node_path.default.join(configDir, "browser", "clawd");
	const legacyUserDataDir = node_path.default.join(legacyProfileDir, "user-data");
	const pathExists = deps?.pathExists ?? node_fs.default.existsSync;
	try {
		return pathExists(legacyProfileDir) || pathExists(legacyUserDataDir);
	} catch {
		return true;
	}
}
/** Emits browser readiness notes through the bundled browser plugin doctor surface. */
async function noteChromeMcpBrowserReadiness(cfg, deps) {
	try {
		await loadBrowserDoctorSurface().noteChromeMcpBrowserReadiness(cfg, deps);
	} catch (error) {
		(deps?.noteFn ?? require_note.note)(`- Browser health check is unavailable: ${error instanceof Error ? error.message : String(error)}`, "Browser");
	}
}
/** Detects old clawd browser profile residue without loading plugin cleanup when paths are absent. */
async function detectLegacyClawdBrowserProfileResidue(cfg, deps) {
	if (!mayHaveLegacyClawdBrowserProfileResidue(deps)) return null;
	const detect = loadBrowserDoctorSurface().detectLegacyClawdBrowserProfileResidue;
	if (!detect) return null;
	return detect(cfg, deps);
}
/** Archives legacy clawd browser profile residue through the browser plugin repair hook. */
async function maybeArchiveLegacyClawdBrowserProfileResidue(cfg, deps) {
	if (!mayHaveLegacyClawdBrowserProfileResidue(deps)) return {
		changes: [],
		warnings: []
	};
	try {
		const repair = loadBrowserDoctorSurface().maybeArchiveLegacyClawdBrowserProfileResidue;
		if (!repair) return {
			changes: [],
			warnings: []
		};
		return await repair(cfg, deps);
	} catch (error) {
		return {
			changes: [],
			warnings: [`Browser profile cleanup is unavailable: ${error instanceof Error ? error.message : String(error)}`]
		};
	}
}
//#endregion
exports.detectLegacyClawdBrowserProfileResidue = detectLegacyClawdBrowserProfileResidue;
exports.maybeArchiveLegacyClawdBrowserProfileResidue = maybeArchiveLegacyClawdBrowserProfileResidue;
exports.noteChromeMcpBrowserReadiness = noteChromeMcpBrowserReadiness;
