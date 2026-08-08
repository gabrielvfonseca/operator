const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
require("./fs-utils-C3xuebRj.cjs");
require("./read-retry-B36vMBBL.cjs");
require("./backend-config-DX8zPQ4v.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
require("@gabrielvfonseca/normalization-core");
require("node:os");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let p_map = require("p-map");
p_map = require_rolldown_runtime.__toESM(p_map, 1);
//#endregion
//#region packages/memory-host-sdk/src/host/sqlite-vec-platform-variant.ts
const PLATFORM_VARIANTS = {
	"linux-x64": {
		pkg: "sqlite-vec-linux-x64",
		file: "vec0.so"
	},
	"linux-arm64": {
		pkg: "sqlite-vec-linux-arm64",
		file: "vec0.so"
	},
	"darwin-x64": {
		pkg: "sqlite-vec-darwin-x64",
		file: "vec0.dylib"
	},
	"darwin-arm64": {
		pkg: "sqlite-vec-darwin-arm64",
		file: "vec0.dylib"
	},
	"win32-x64": {
		pkg: "sqlite-vec-windows-x64",
		file: "vec0.dll"
	}
};
/** Resolve the installed sqlite-vec native extension for the current platform if present. */
function resolveSqliteVecPlatformVariant() {
	const entry = PLATFORM_VARIANTS[`${process.platform}-${process.arch}`];
	if (!entry) return;
	try {
		const extensionPath = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href).resolve(`${entry.pkg}/${entry.file}`);
		return {
			pkg: entry.pkg,
			extensionPath
		};
	} catch {
		return;
	}
}
//#endregion
//#region packages/memory-host-sdk/src/host/sqlite-vec.ts
const SQLITE_VEC_MODULE_ID = "sqlite-vec";
const SQLITE_VEC_CONFIG_HINT = "Set agents.defaults.memorySearch.store.vector.extensionPath, or an agent-specific memorySearch.store.vector.extensionPath, to a sqlite-vec loadable extension path.";
async function loadSqliteVecModule() {
	return import(SQLITE_VEC_MODULE_ID);
}
function isMissingSqliteVecPackageError(err) {
	const message = require_openclaw_agent_db.formatErrorMessage(err);
	const code = err && typeof err === "object" && "code" in err ? err.code : void 0;
	return /Cannot find (?:package|module) ['"]sqlite-vec['"]/u.test(message) && (code === void 0 || code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND");
}
function assertSqliteVecAvailable(db, source) {
	try {
		const row = db.prepare("SELECT vec_version() AS version").get();
		if (typeof row?.version !== "string" || row.version.trim().length === 0) throw new Error("vec_version() did not return a version");
	} catch (err) {
		throw new Error(`sqlite-vec health check failed after loading ${source}`, { cause: err });
	}
}
function loadExtensionAndVerify(db, extensionPath) {
	db.loadExtension(extensionPath);
	assertSqliteVecAvailable(db, extensionPath);
}
async function loadSqliteVecExtension(params) {
	try {
		const resolvedPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.extensionPath);
		params.db.enableLoadExtension(true);
		if (resolvedPath) {
			loadExtensionAndVerify(params.db, resolvedPath);
			return {
				ok: true,
				extensionPath: resolvedPath
			};
		}
		try {
			const sqliteVec = await loadSqliteVecModule();
			const extensionPath = sqliteVec.getLoadablePath();
			sqliteVec.load(params.db);
			assertSqliteVecAvailable(params.db, extensionPath);
			return {
				ok: true,
				extensionPath
			};
		} catch (err) {
			const variant = resolveSqliteVecPlatformVariant();
			if (!variant) {
				if (!isMissingSqliteVecPackageError(err)) throw err;
				const message = require_openclaw_agent_db.formatErrorMessage(err);
				return {
					ok: false,
					error: `sqlite-vec package is not installed. ${SQLITE_VEC_CONFIG_HINT} Original error: ${message}`
				};
			}
			try {
				loadExtensionAndVerify(params.db, variant.extensionPath);
				return {
					ok: true,
					extensionPath: variant.extensionPath
				};
			} catch (variantErr) {
				const message = require_openclaw_agent_db.formatErrorMessage(variantErr);
				if (!isMissingSqliteVecPackageError(err)) {
					const packageMessage = require_openclaw_agent_db.formatErrorMessage(err);
					return {
						ok: false,
						error: `sqlite-vec package failed to load, and platform variant ${variant.pkg} failed to load from ${variant.extensionPath}. ${SQLITE_VEC_CONFIG_HINT} Package error: ${packageMessage}. Variant error: ${message}`
					};
				}
				return {
					ok: false,
					error: `sqlite-vec platform variant ${variant.pkg} failed to load from ${variant.extensionPath}. ${SQLITE_VEC_CONFIG_HINT} Original error: ${message}`
				};
			}
		}
	} catch (err) {
		return {
			ok: false,
			error: require_openclaw_agent_db.formatErrorMessage(err)
		};
	}
}
(0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
//#endregion
Object.defineProperty(exports, "loadSqliteVecExtension", {
	enumerable: true,
	get: function() {
		return loadSqliteVecExtension;
	}
});
