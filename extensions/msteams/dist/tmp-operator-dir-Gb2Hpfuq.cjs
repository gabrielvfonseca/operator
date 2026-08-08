const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
//#region src/infra/tmp-operator-dir.ts
/** Preferred shared Operator temp root on POSIX systems when ownership and permissions are safe. */
const POSIX_OPERATOR_TMP_DIR = "/tmp/operator";
function isNodeErrorWithCode(err, code) {
	return typeof err === "object" && err !== null && "code" in err && err.code === code;
}
/** Resolves a safe Operator temp root, falling back to user-scoped os.tmpdir paths when needed. */
function resolvePreferredOperatorTmpDir(options = {}) {
	const accessMode = node_fs.default.constants.W_OK | node_fs.default.constants.X_OK;
	const accessSync = options.accessSync ?? node_fs.default.accessSync;
	const chmodSync = options.chmodSync ?? node_fs.default.chmodSync;
	const lstatSync = options.lstatSync ?? node_fs.default.lstatSync;
	const mkdirSync = options.mkdirSync ?? node_fs.default.mkdirSync;
	const warn = options.warn ?? ((message) => console.warn(message));
	const getuid = options.getuid ?? (() => {
		try {
			return typeof process.getuid === "function" ? process.getuid() : void 0;
		} catch {
			return;
		}
	});
	const tmpdir = typeof options.tmpdir === "function" ? options.tmpdir : node_os.tmpdir;
	const platform = options.platform ?? process.platform;
	const uid = getuid();
	const isSecureDirForUser = (st) => {
		if (uid === void 0) return true;
		if (typeof st.uid === "number" && st.uid !== uid) return false;
		return typeof st.mode !== "number" || (st.mode & 18) === 0;
	};
	const fallback = () => {
		const suffix = uid === void 0 ? "@gabrielvfonseca/operator" : `operator-${uid}`;
		return (platform === "win32" ? node_path.default.win32.join : node_path.default.join)(tmpdir(), suffix);
	};
	const isTrustedTmpDir = (st) => st.isDirectory() && !st.isSymbolicLink() && isSecureDirForUser(st);
	const resolveDirState = (candidatePath) => {
		try {
			const candidate = lstatSync(candidatePath);
			if (!isTrustedTmpDir(candidate)) return "invalid";
			accessSync(candidatePath, accessMode);
			return "available";
		} catch (err) {
			return isNodeErrorWithCode(err, "ENOENT") ? "missing" : "invalid";
		}
	};
	const tryRepairWritableBits = (candidatePath) => {
		try {
			const st = lstatSync(candidatePath);
			if (!st.isDirectory() || st.isSymbolicLink()) return false;
			if (uid !== void 0 && typeof st.uid === "number" && st.uid !== uid) return false;
			if (typeof st.mode !== "number") return false;
			if ((st.mode & 18) === 0) return resolveDirState(candidatePath) === "available";
			try {
				chmodSync(candidatePath, 448);
			} catch (chmodErr) {
				if (isNodeErrorWithCode(chmodErr, "EPERM") || isNodeErrorWithCode(chmodErr, "EACCES") || isNodeErrorWithCode(chmodErr, "ENOENT")) return resolveDirState(candidatePath) === "available";
				throw chmodErr;
			}
			warn(`[operator] tightened permissions on temp dir: ${candidatePath}`);
			return resolveDirState(candidatePath) === "available";
		} catch {
			return false;
		}
	};
	const ensureTrustedFallbackDir = () => {
		const fallbackPath = fallback();
		const state = resolveDirState(fallbackPath);
		if (state === "available") return fallbackPath;
		if (state === "invalid") {
			if (tryRepairWritableBits(fallbackPath)) return fallbackPath;
			throw new Error(`Unsafe fallback Operator temp dir: ${fallbackPath}`);
		}
		try {
			mkdirSync(fallbackPath, {
				recursive: true,
				mode: 448
			});
			chmodSync(fallbackPath, 448);
		} catch {
			throw new Error(`Unable to create fallback Operator temp dir: ${fallbackPath}`);
		}
		if (resolveDirState(fallbackPath) !== "available" && !tryRepairWritableBits(fallbackPath)) throw new Error(`Unsafe fallback Operator temp dir: ${fallbackPath}`);
		return fallbackPath;
	};
	if (platform === "win32") return ensureTrustedFallbackDir();
	const preferredDir = POSIX_OPERATOR_TMP_DIR;
	const preferredState = resolveDirState(preferredDir);
	if (preferredState === "available") return preferredDir;
	if (preferredState === "invalid") {
		if (tryRepairWritableBits(preferredDir)) return preferredDir;
		return ensureTrustedFallbackDir();
	}
	try {
		accessSync(node_path.default.dirname(preferredDir), accessMode);
		mkdirSync(preferredDir, {
			recursive: true,
			mode: 448
		});
		chmodSync(preferredDir, 448);
		if (resolveDirState(preferredDir) !== "available" && !tryRepairWritableBits(preferredDir)) return ensureTrustedFallbackDir();
		return preferredDir;
	} catch {
		return ensureTrustedFallbackDir();
	}
}
//#endregion
Object.defineProperty(exports, "POSIX_OPERATOR_TMP_DIR", {
	enumerable: true,
	get: function() {
		return POSIX_OPERATOR_TMP_DIR;
	}
});
Object.defineProperty(exports, "resolvePreferredOperatorTmpDir", {
	enumerable: true,
	get: function() {
		return resolvePreferredOperatorTmpDir;
	}
});
