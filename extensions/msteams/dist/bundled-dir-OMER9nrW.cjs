const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
require("./path-guards-CMMkJCy0.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/bundled-dir.ts
/** Resolves the bundled plugin directory for source checkouts, dist builds, and tests. */
const DISABLED_BUNDLED_PLUGINS_DIR = node_path.default.join(node_os.default.tmpdir(), "operator-empty-bundled-plugins");
const TEST_TRUST_BUNDLED_PLUGINS_DIR_ENV = "OPERATOR_TEST_TRUST_BUNDLED_PLUGINS_DIR";
const bundledPluginsDirCache = /* @__PURE__ */ new Map();
/** Returns true when env disables bundled plugin discovery. */
function areBundledPluginsDisabled(env = process.env) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(env.OPERATOR_DISABLE_BUNDLED_PLUGINS);
	return raw === "1" || raw === "true";
}
function resolveDisabledBundledPluginsDir() {
	node_fs.default.mkdirSync(DISABLED_BUNDLED_PLUGINS_DIR, { recursive: true });
	return DISABLED_BUNDLED_PLUGINS_DIR;
}
function isSourceCheckoutRoot(packageRoot) {
	return node_fs.default.existsSync(node_path.default.join(packageRoot, "pnpm-workspace.yaml")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "src")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "extensions"));
}
function isTruthyEnvValue(value) {
	const normalized = value?.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
function shouldTrustTestBundledPluginsDirOverride(env) {
	return (Boolean(env.VITEST) || Boolean(process.env.VITEST)) && (isTruthyEnvValue(env[TEST_TRUST_BUNDLED_PLUGINS_DIR_ENV]) || isTruthyEnvValue(process.env[TEST_TRUST_BUNDLED_PLUGINS_DIR_ENV]));
}
function hasUsableBundledPluginTree(pluginsDir) {
	if (!node_fs.default.existsSync(pluginsDir)) return false;
	try {
		return node_fs.default.readdirSync(pluginsDir, { withFileTypes: true }).some((entry) => {
			if (!entry.isDirectory()) return false;
			const pluginDir = node_path.default.join(pluginsDir, entry.name);
			return node_fs.default.existsSync(node_path.default.join(pluginDir, "package.json")) || node_fs.default.existsSync(node_path.default.join(pluginDir, "operator.plugin.json"));
		});
	} catch {
		return false;
	}
}
function safeRealpathSync(targetPath) {
	try {
		return node_fs.default.realpathSync.native(targetPath);
	} catch {
		return null;
	}
}
function pathContains(parentDir, childPath) {
	return (0, _openclaw_fs_safe_path.isPathInside)(parentDir, childPath);
}
function trustedBundledPluginRootsForPackageRoot(packageRoot) {
	const roots = [node_path.default.join(packageRoot, "dist", "extensions"), node_path.default.join(packageRoot, "dist-runtime", "extensions")];
	if (isSourceCheckoutRoot(packageRoot)) roots.push(node_path.default.join(packageRoot, "extensions"));
	return roots;
}
function resolvePackageRootsForBundledPlugins() {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([require_openclaw_root.resolveOperatorPackageRootSync({ argv1: process.argv[1] }), require_openclaw_root.resolveOperatorPackageRootSync({ moduleUrl: require("url").pathToFileURL(__filename).href })].filter((entry) => Boolean(entry)));
}
function resolveSourceCheckoutDependencyDiagnostic(env = process.env) {
	if (areBundledPluginsDisabled(env)) return null;
	for (const packageRoot of resolvePackageRootsForBundledPlugins()) {
		if (!isSourceCheckoutRoot(packageRoot)) continue;
		if (!hasUsableBundledPluginTree(node_path.default.join(packageRoot, "extensions"))) continue;
		if (node_fs.default.existsSync(node_path.default.join(packageRoot, "node_modules", ".pnpm"))) continue;
		return {
			source: packageRoot,
			message: "Operator source checkout detected without pnpm workspace dependencies; run `pnpm install` from the repo root so bundled plugins can load package-local dependencies."
		};
	}
	return null;
}
function resolveTrustedExistingOverride(resolvedOverride) {
	const realOverride = safeRealpathSync(resolvedOverride);
	if (!realOverride) return null;
	const modulePackageRoot = require_openclaw_root.resolveOperatorPackageRootSync({ moduleUrl: require("url").pathToFileURL(__filename).href });
	if (!(modulePackageRoot ? [modulePackageRoot] : []).flatMap((packageRoot) => trustedBundledPluginRootsForPackageRoot(packageRoot)).map((trustedRoot) => safeRealpathSync(trustedRoot)).filter((entry) => Boolean(entry)).some((trustedRoot) => pathContains(trustedRoot, realOverride))) return null;
	if (!hasUsableBundledPluginTree(realOverride)) return null;
	return realOverride;
}
function overrideResolvesUnderPackageBundledRoot(params) {
	const realOverride = safeRealpathSync(params.resolvedOverride);
	if (!realOverride) return false;
	return trustedBundledPluginRootsForPackageRoot(params.packageRoot).map((trustedRoot) => safeRealpathSync(trustedRoot)).filter((entry) => Boolean(entry)).some((trustedRoot) => pathContains(trustedRoot, realOverride));
}
function resolveBundledDirFromPackageRoot(packageRoot) {
	const sourceExtensionsDir = node_path.default.join(packageRoot, "extensions");
	const builtExtensionsDir = node_path.default.join(packageRoot, "dist", "extensions");
	const sourceCheckout = isSourceCheckoutRoot(packageRoot);
	const hasUsableSourceTree = sourceCheckout && hasUsableBundledPluginTree(sourceExtensionsDir);
	const runtimeExtensionsDir = node_path.default.join(packageRoot, "dist-runtime", "extensions");
	const hasUsableRuntimeTree = sourceCheckout ? hasUsableBundledPluginTree(runtimeExtensionsDir) : node_fs.default.existsSync(runtimeExtensionsDir);
	const hasUsableBuiltTree = sourceCheckout ? hasUsableBundledPluginTree(builtExtensionsDir) : node_fs.default.existsSync(builtExtensionsDir);
	if (sourceCheckout && hasUsableBuiltTree) return builtExtensionsDir;
	if (sourceCheckout && hasUsableRuntimeTree) return runtimeExtensionsDir;
	if (hasUsableRuntimeTree && hasUsableBuiltTree) return runtimeExtensionsDir;
	if (hasUsableBuiltTree) return builtExtensionsDir;
	if (hasUsableSourceTree) return sourceExtensionsDir;
}
function createBundledPluginsDirCacheKey(env) {
	return JSON.stringify({
		disabled: env.OPERATOR_DISABLE_BUNDLED_PLUGINS ?? "",
		override: env.OPERATOR_BUNDLED_PLUGINS_DIR ?? "",
		trustOverride: env[TEST_TRUST_BUNDLED_PLUGINS_DIR_ENV] ?? "",
		processTrustOverride: process.env[TEST_TRUST_BUNDLED_PLUGINS_DIR_ENV] ?? "",
		vitest: env.VITEST ?? "",
		processVitest: process.env.VITEST ?? "",
		nodeEnv: "production",
		argv1: process.argv[1] ?? "",
		execPath: process.execPath,
		openClawHome: env.OPERATOR_HOME ?? "",
		home: env.HOME ?? "",
		userProfile: env.USERPROFILE ?? ""
	});
}
function resolveBundledPluginsDirUncached(env) {
	if (areBundledPluginsDisabled(env)) return resolveDisabledBundledPluginsDir();
	const override = env.OPERATOR_BUNDLED_PLUGINS_DIR?.trim();
	let rejectedExistingOverride = null;
	if (override) {
		const resolvedOverride = require_home_dir.resolveUserPath(override, env);
		if (node_fs.default.existsSync(resolvedOverride)) {
			if (shouldTrustTestBundledPluginsDirOverride(env)) return node_path.default.resolve(resolvedOverride);
			const trustedOverride = resolveTrustedExistingOverride(resolvedOverride);
			if (trustedOverride) return trustedOverride;
			rejectedExistingOverride = resolvedOverride;
		}
	}
	try {
		const argvRoot = require_openclaw_root.resolveOperatorPackageRootSync({ argv1: process.argv[1] });
		const packageRoots = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([Boolean(argvRoot && rejectedExistingOverride && overrideResolvesUnderPackageBundledRoot({
			resolvedOverride: rejectedExistingOverride,
			packageRoot: argvRoot
		})) ? null : argvRoot, require_openclaw_root.resolveOperatorPackageRootSync({ moduleUrl: require("url").pathToFileURL(__filename).href })].filter((entry) => Boolean(entry)));
		for (const packageRoot of packageRoots) {
			const bundledDir = resolveBundledDirFromPackageRoot(packageRoot);
			if (bundledDir) return bundledDir;
		}
	} catch {}
	try {
		const execDir = node_path.default.dirname(process.execPath);
		const siblingBuilt = node_path.default.join(execDir, "dist", "extensions");
		if (node_fs.default.existsSync(siblingBuilt)) return siblingBuilt;
		const sibling = node_path.default.join(execDir, "extensions");
		if (node_fs.default.existsSync(sibling)) return sibling;
	} catch {}
	try {
		let cursor = node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
		for (let i = 0; i < 6; i += 1) {
			const candidate = node_path.default.join(cursor, "extensions");
			if (node_fs.default.existsSync(candidate)) return candidate;
			const parent = node_path.default.dirname(cursor);
			if (parent === cursor) break;
			cursor = parent;
		}
	} catch {}
}
function resolveBundledPluginsDir(env = process.env) {
	const cacheKey = createBundledPluginsDirCacheKey(env);
	if (bundledPluginsDirCache.has(cacheKey)) return bundledPluginsDirCache.get(cacheKey);
	const resolved = resolveBundledPluginsDirUncached(env);
	bundledPluginsDirCache.set(cacheKey, resolved);
	return resolved;
}
//#endregion
Object.defineProperty(exports, "areBundledPluginsDisabled", {
	enumerable: true,
	get: function() {
		return areBundledPluginsDisabled;
	}
});
Object.defineProperty(exports, "resolveBundledPluginsDir", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginsDir;
	}
});
Object.defineProperty(exports, "resolveSourceCheckoutDependencyDiagnostic", {
	enumerable: true,
	get: function() {
		return resolveSourceCheckoutDependencyDiagnostic;
	}
});
