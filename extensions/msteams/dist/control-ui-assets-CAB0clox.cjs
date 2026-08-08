const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_operator_root = require("./operator-root-D_zS4PlX.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/infra/control-ui-assets.fs.runtime.ts
const existsSync = node_fs.default.existsSync.bind(node_fs.default);
const readFileSync = node_fs.default.readFileSync.bind(node_fs.default);
const statSync = node_fs.default.statSync.bind(node_fs.default);
const realpathSync = node_fs.default.realpathSync.bind(node_fs.default);
//#endregion
//#region src/infra/control-ui-assets.ts
const CONTROL_UI_DIST_PATH_SEGMENTS = [
	"dist",
	"control-ui",
	"index.html"
];
function resolveControlUiDistIndexPathForRoot(root) {
	return node_path.default.join(root, ...CONTROL_UI_DIST_PATH_SEGMENTS);
}
async function resolveControlUiDistIndexHealth(opts = {}) {
	const indexPath = opts.root ? resolveControlUiDistIndexPathForRoot(opts.root) : await resolveControlUiDistIndexPath({
		argv1: opts.argv1 ?? process.argv[1],
		moduleUrl: opts.moduleUrl
	});
	return {
		indexPath,
		exists: Boolean(indexPath && existsSync(indexPath))
	};
}
function resolveControlUiRepoRoot(argv1 = process.argv[1]) {
	if (!argv1) return null;
	const normalized = node_path.default.resolve(argv1);
	const parts = normalized.split(node_path.default.sep);
	const srcIndex = parts.lastIndexOf("src");
	if (srcIndex !== -1) {
		const root = parts.slice(0, srcIndex).join(node_path.default.sep);
		if (existsSync(node_path.default.join(root, "ui", "vite.config.ts"))) return root;
	}
	let dir = node_path.default.dirname(normalized);
	for (let i = 0; i < 8; i++) {
		if (existsSync(node_path.default.join(dir, "package.json")) && existsSync(node_path.default.join(dir, "ui", "vite.config.ts"))) return dir;
		const parent = node_path.default.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}
async function resolveControlUiDistIndexPath(argv1OrOpts) {
	const argv1 = typeof argv1OrOpts === "string" ? argv1OrOpts : argv1OrOpts?.argv1 ?? process.argv[1];
	const moduleUrl = typeof argv1OrOpts === "object" ? argv1OrOpts?.moduleUrl : void 0;
	if (!argv1) return null;
	const normalized = node_path.default.resolve(argv1);
	const entrypointCandidates = [normalized];
	try {
		const realpathEntrypoint = realpathSync(normalized);
		if (realpathEntrypoint !== normalized) entrypointCandidates.push(realpathEntrypoint);
	} catch {}
	for (const entrypoint of entrypointCandidates) {
		const distDir = node_path.default.dirname(entrypoint);
		if (node_path.default.basename(distDir) === "dist") return node_path.default.join(distDir, "control-ui", "index.html");
	}
	const packageRoot = await require_operator_root.resolveOperatorPackageRoot({
		argv1: normalized,
		moduleUrl
	});
	if (packageRoot) return node_path.default.join(packageRoot, "dist", "control-ui", "index.html");
	const fallbackStartDirs = new Set(entrypointCandidates.map((candidate) => node_path.default.dirname(candidate)));
	for (const startDir of fallbackStartDirs) {
		let dir = startDir;
		for (let i = 0; i < 8; i++) {
			const pkgJsonPath = node_path.default.join(dir, "package.json");
			const indexPath = node_path.default.join(dir, "dist", "control-ui", "index.html");
			if (existsSync(pkgJsonPath)) try {
				const raw = readFileSync(pkgJsonPath, "utf-8");
				if (JSON.parse(raw).name === "@gabrielvfonseca/operator") return existsSync(indexPath) ? indexPath : null;
				break;
			} catch {
				break;
			}
			const parent = node_path.default.dirname(dir);
			if (parent === dir) break;
			dir = parent;
		}
	}
	return null;
}
function pathsMatchByRealpathOrResolve(left, right) {
	let realLeft;
	let realRight;
	try {
		realLeft = realpathSync(left);
	} catch {
		realLeft = node_path.default.resolve(left);
	}
	try {
		realRight = realpathSync(right);
	} catch {
		realRight = node_path.default.resolve(right);
	}
	return realLeft === realRight;
}
function addCandidate(candidates, value) {
	if (!value) return;
	candidates.add(node_path.default.resolve(value));
}
function resolveControlUiRootOverrideSync(rootOverride) {
	const resolved = node_path.default.resolve(rootOverride);
	try {
		const stats = statSync(resolved);
		if (stats.isFile()) return node_path.default.basename(resolved) === "index.html" ? node_path.default.dirname(resolved) : null;
		if (stats.isDirectory()) {
			const indexPath = node_path.default.join(resolved, "index.html");
			return existsSync(indexPath) ? resolved : null;
		}
	} catch {
		return null;
	}
	return null;
}
function resolveControlUiRootSync(opts = {}) {
	const candidates = /* @__PURE__ */ new Set();
	const argv1 = opts.argv1 ?? process.argv[1];
	const cwd = opts.cwd ?? process.cwd();
	const moduleDir = opts.moduleUrl ? node_path.default.dirname((0, node_url.fileURLToPath)(opts.moduleUrl)) : null;
	const argv1Dir = argv1 ? node_path.default.dirname(node_path.default.resolve(argv1)) : null;
	const argv1RealpathDir = (() => {
		if (!argv1) return null;
		try {
			return node_path.default.dirname(realpathSync(node_path.default.resolve(argv1)));
		} catch {
			return null;
		}
	})();
	const execDir = (() => {
		try {
			const execPath = opts.execPath ?? process.execPath;
			return node_path.default.dirname(realpathSync(execPath));
		} catch {
			return null;
		}
	})();
	const packageRoot = require_operator_root.resolveOperatorPackageRootSync({
		argv1,
		moduleUrl: opts.moduleUrl,
		cwd
	});
	addCandidate(candidates, execDir ? node_path.default.join(execDir, "../Resources/control-ui") : null);
	addCandidate(candidates, execDir ? node_path.default.join(execDir, "control-ui") : null);
	if (moduleDir) {
		addCandidate(candidates, node_path.default.join(moduleDir, "control-ui"));
		addCandidate(candidates, node_path.default.join(moduleDir, "../control-ui"));
		addCandidate(candidates, node_path.default.join(moduleDir, "../../dist/control-ui"));
	}
	if (argv1Dir) {
		addCandidate(candidates, node_path.default.join(argv1Dir, "dist", "control-ui"));
		addCandidate(candidates, node_path.default.join(argv1Dir, "control-ui"));
	}
	if (argv1RealpathDir && argv1RealpathDir !== argv1Dir) {
		addCandidate(candidates, node_path.default.join(argv1RealpathDir, "dist", "control-ui"));
		addCandidate(candidates, node_path.default.join(argv1RealpathDir, "control-ui"));
	}
	if (packageRoot) addCandidate(candidates, node_path.default.join(packageRoot, "dist", "control-ui"));
	addCandidate(candidates, node_path.default.join(cwd, "dist", "control-ui"));
	for (const dir of candidates) {
		const indexPath = node_path.default.join(dir, "index.html");
		if (existsSync(indexPath)) return dir;
	}
	return null;
}
function isPackageProvenControlUiRootSync(root, opts = {}) {
	const argv1 = opts.argv1 ?? process.argv[1];
	const cwd = opts.cwd ?? process.cwd();
	const packageRoot = require_operator_root.resolveOperatorPackageRootSync({
		argv1,
		moduleUrl: opts.moduleUrl,
		cwd
	});
	if (!packageRoot) return false;
	return pathsMatchByRealpathOrResolve(root, node_path.default.join(packageRoot, "dist", "control-ui"));
}
function summarizeCommandOutput(text) {
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(text.split(/\r?\n/g));
	if (!lines.length) return;
	const last = lines.at(-1);
	if (!last) return;
	return last.length > 240 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(last, 239)}…` : last;
}
async function ensureControlUiAssetsBuilt(runtime = require_runtime.defaultRuntime, opts) {
	const health = await resolveControlUiDistIndexHealth({ argv1: process.argv[1] });
	const indexFromDist = health.indexPath;
	if (health.exists) return {
		ok: true,
		built: false
	};
	const repoRoot = resolveControlUiRepoRoot(process.argv[1]);
	if (!repoRoot) return {
		ok: false,
		built: false,
		message: `${indexFromDist ? `Missing Control UI assets at ${indexFromDist}` : "Missing Control UI assets"}. Build them with \`pnpm ui:build\` (auto-installs UI deps).`
	};
	const indexPath = resolveControlUiDistIndexPathForRoot(repoRoot);
	if (existsSync(indexPath)) return {
		ok: true,
		built: false
	};
	const uiScript = node_path.default.join(repoRoot, "scripts", "ui.js");
	if (!existsSync(uiScript)) return {
		ok: false,
		built: false,
		message: `Control UI assets missing but ${uiScript} is unavailable.`
	};
	runtime.log("Control UI assets missing; building them now (rerun `pnpm ui:build` after UI changes, or use `pnpm ui:dev` while developing the Control UI)…");
	const build = await require_exec.runCommandWithTimeout([
		process.execPath,
		uiScript,
		"build"
	], {
		cwd: repoRoot,
		timeoutMs: opts?.timeoutMs ?? 10 * 6e4
	});
	if (build.code !== 0) return {
		ok: false,
		built: false,
		message: `Control UI build failed: ${summarizeCommandOutput(build.stderr) ?? `exit ${build.code}`}`
	};
	if (!existsSync(indexPath)) return {
		ok: false,
		built: true,
		message: `Control UI build completed but ${indexPath} is still missing.`
	};
	return {
		ok: true,
		built: true
	};
}
//#endregion
Object.defineProperty(exports, "ensureControlUiAssetsBuilt", {
	enumerable: true,
	get: function() {
		return ensureControlUiAssetsBuilt;
	}
});
Object.defineProperty(exports, "isPackageProvenControlUiRootSync", {
	enumerable: true,
	get: function() {
		return isPackageProvenControlUiRootSync;
	}
});
Object.defineProperty(exports, "resolveControlUiDistIndexHealth", {
	enumerable: true,
	get: function() {
		return resolveControlUiDistIndexHealth;
	}
});
Object.defineProperty(exports, "resolveControlUiDistIndexPathForRoot", {
	enumerable: true,
	get: function() {
		return resolveControlUiDistIndexPathForRoot;
	}
});
Object.defineProperty(exports, "resolveControlUiRootOverrideSync", {
	enumerable: true,
	get: function() {
		return resolveControlUiRootOverrideSync;
	}
});
Object.defineProperty(exports, "resolveControlUiRootSync", {
	enumerable: true,
	get: function() {
		return resolveControlUiRootSync;
	}
});
