const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_cache_primitives = require("./plugin-cache-primitives-DGHa8Ph9.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_dev_source_root = require("./dev-source-root-Cr9dWf04.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
node_module = require_rolldown_runtime.__toESM(node_module, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/plugins/native-module-require.ts
const nodeRequire = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
const moduleWithResolver$1 = node_module.default;
/** True for file extensions Node can load through the native JS module loader. */
function isJavaScriptModulePath(modulePath) {
	return [
		".js",
		".mjs",
		".cjs"
	].includes(node_path.default.extname(modulePath).toLowerCase());
}
function isMissingTargetModuleError(error, modulePath) {
	if (error.code !== "MODULE_NOT_FOUND" || typeof error.message !== "string") return false;
	const firstLine = error.message.split("\n", 1)[0] ?? "";
	return firstLine.includes(`'${modulePath}'`) || firstLine.includes(`"${modulePath}"`);
}
function isSourceTransformFallbackError(error, modulePath) {
	if (!error || typeof error !== "object") return false;
	const candidate = error;
	const code = candidate.code;
	return code === "ERR_REQUIRE_ESM" || code === "ERR_REQUIRE_ASYNC_MODULE" || isMissingTargetModuleError(candidate, modulePath);
}
/** Attempts native require before falling back to source transform paths. */
function tryNativeRequireJavaScriptModule(modulePath, options = {}) {
	if (process.platform === "win32" && options.allowWindows !== true) return { ok: false };
	if (!isJavaScriptModulePath(modulePath)) return { ok: false };
	try {
		return {
			ok: true,
			moduleExport: requireWithOptionalAliases(modulePath, options.aliasMap)
		};
	} catch (error) {
		const code = error && typeof error === "object" ? error.code : void 0;
		if (isSourceTransformFallbackError(error, modulePath) || options.fallbackOnNativeError || options.fallbackOnMissingDependency === true && (code === "MODULE_NOT_FOUND" || code === "ERR_MODULE_NOT_FOUND")) return { ok: false };
		throw error;
	}
}
/** Clears a native-loaded module and dependency subtree under the plugin dependency root. */
function clearNativeRequireJavaScriptModuleCache(modulePath, options = {}) {
	if (!isJavaScriptModulePath(modulePath)) return;
	try {
		const resolved = nodeRequire.resolve(modulePath);
		clearRequireCacheSubtree(resolved, resolveRequireCachePath(options.dependencyRoot ?? node_path.default.dirname(resolved)), /* @__PURE__ */ new Set());
	} catch {}
}
function resolveRequireCachePath(targetPath) {
	try {
		return node_fs.default.realpathSync.native(targetPath);
	} catch {
		return node_path.default.resolve(targetPath);
	}
}
function clearRequireCacheSubtree(resolvedPath, dependencyRoot, seen) {
	if (seen.has(resolvedPath)) return;
	seen.add(resolvedPath);
	const cached = nodeRequire.cache[resolvedPath];
	if (cached) {
		for (const child of cached.children) if (isPathInsideOrSame(dependencyRoot, child.id)) clearRequireCacheSubtree(child.id, dependencyRoot, seen);
	}
	delete nodeRequire.cache[resolvedPath];
}
function isPathInsideOrSame(root, target) {
	const relative = node_path.default.relative(root, target);
	return relative === "" || !relative.startsWith("..") && !node_path.default.isAbsolute(relative);
}
function requireWithOptionalAliases(modulePath, aliasMap) {
	return withNativeRequireAliases(aliasMap, () => nodeRequire(modulePath));
}
/** Runs a native require block with temporary CJS/ESM alias hooks and restores both afterward. */
function withNativeRequireAliases(aliasMap, run) {
	if (!aliasMap || Object.keys(aliasMap).length === 0 || !moduleWithResolver$1["_resolveFilename"]) return run();
	const originalResolveFilename = moduleWithResolver$1["_resolveFilename"];
	const esmHooks = moduleWithResolver$1.registerHooks?.({ resolve(specifier, context, nextResolve) {
		const aliasTarget = aliasMap[specifier];
		if (aliasTarget) return {
			shortCircuit: true,
			url: (0, node_url.pathToFileURL)(aliasTarget).href
		};
		return nextResolve(specifier, context);
	} });
	moduleWithResolver$1["_resolveFilename"] = ((request, parent, isMain, options) => {
		const aliasTarget = aliasMap[request];
		if (aliasTarget) return aliasTarget;
		return originalResolveFilename(request, parent, isMain, options);
	});
	try {
		return run();
	} finally {
		moduleWithResolver$1["_resolveFilename"] = originalResolveFilename;
		esmHooks?.deregister();
	}
}
//#endregion
//#region src/shared/import-specifier.ts
/**
* On Windows, Node's ESM loader requires absolute paths to be expressed as
* file:// URLs. Raw drive-letter paths like C:\... are parsed as URL schemes.
*/
function toSafeImportPath(specifier) {
	if (process.platform !== "win32") return specifier;
	if (specifier.startsWith("file://")) return specifier;
	if (node_path.default.win32.isAbsolute(specifier)) return (0, node_url.pathToFileURL)(specifier, { windows: true }).href;
	return specifier;
}
//#endregion
//#region src/plugins/sdk-alias.ts
const STARTUP_ARGV1 = process.argv[1];
const pluginSdkPackageJsonByRoot = /* @__PURE__ */ new Map();
function sanitizeJitiCachePathSegment(value) {
	const normalized = value.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
	return normalized.length > 0 ? normalized : "unknown";
}
function resolveJitiFsCacheTmpDir() {
	let tmpDir = node_os.default.tmpdir();
	if (process.env.TMPDIR && tmpDir === process.cwd() && !process.env.JITI_RESPECT_TMPDIR_ENV) {
		const originalTmpDir = process.env.TMPDIR;
		delete process.env.TMPDIR;
		try {
			tmpDir = node_os.default.tmpdir();
		} finally {
			process.env.TMPDIR = originalTmpDir;
		}
	}
	return tmpDir;
}
function readJitiBooleanEnv(name, defaultValue) {
	if (!(name in process.env)) return defaultValue;
	try {
		return Boolean(JSON.parse(process.env[name] ?? ""));
	} catch {
		return defaultValue;
	}
}
function shouldUseJitiFsCache() {
	return readJitiBooleanEnv("JITI_FS_CACHE", readJitiBooleanEnv("JITI_CACHE", true));
}
function resolvePluginLoaderJitiNativeModules() {
	try {
		const configured = JSON.parse(process.env.JITI_NATIVE_MODULES ?? "[]");
		const nativeModules = Array.isArray(configured) ? configured.filter((entry) => typeof entry === "string") : [];
		return [.../* @__PURE__ */ new Set([...nativeModules, "@gabrielvfonseca/operator"])];
	} catch {
		return ["@gabrielvfonseca/operator"];
	}
}
function normalizeJitiAliasTargetPath(targetPath) {
	return process.platform === "win32" ? targetPath.replace(/\\/g, "/") : targetPath;
}
function resolveLoaderModulePath$1(params = {}) {
	return params.modulePath ?? (0, node_url.fileURLToPath)(params.moduleUrl ?? require("url").pathToFileURL(__filename).href);
}
function readPluginSdkPackageJson(packageRoot) {
	const cacheKey = node_path.default.resolve(packageRoot);
	if (pluginSdkPackageJsonByRoot.has(cacheKey)) return pluginSdkPackageJsonByRoot.get(cacheKey) ?? null;
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(packageRoot, "package.json"));
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		pluginSdkPackageJsonByRoot.set(cacheKey, null);
		return null;
	}
	pluginSdkPackageJsonByRoot.set(cacheKey, parsed);
	return parsed;
}
function resolveJitiCacheModulePath(params = {}) {
	if (params.modulePath?.startsWith("file://")) try {
		return (0, node_url.fileURLToPath)(params.modulePath);
	} catch {}
	return resolveLoaderModulePath$1(params);
}
function resolvePluginLoaderJitiFsCacheDir(params = {}) {
	const modulePath = resolveJitiCacheModulePath(params);
	const packageRoot = resolveLoaderPackageRoot({
		...params,
		modulePath
	}) ?? node_path.default.dirname(modulePath);
	const packageJsonPath = node_path.default.join(packageRoot, "package.json");
	const version = sanitizeJitiCachePathSegment(readPluginSdkPackageJson(packageRoot)?.version ?? "unknown");
	let installMarker = "no-package-json";
	try {
		const stat = node_fs.default.statSync(packageJsonPath);
		installMarker = `${Math.trunc(stat.mtimeMs)}-${stat.size}`;
	} catch {}
	return node_path.default.join(resolveJitiFsCacheTmpDir(), "jiti", "@gabrielvfonseca/operator", version, sanitizeJitiCachePathSegment(installMarker));
}
function resolvePluginLoaderJitiFsCacheOption(params = {}) {
	return shouldUseJitiFsCache() ? resolvePluginLoaderJitiFsCacheDir(params) : false;
}
function isSafePluginSdkSubpathSegment(subpath) {
	return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(subpath);
}
function listPluginSdkSubpathsFromPackageJson(pkg) {
	return Object.keys(pkg.exports ?? {}).filter((key) => key.startsWith("./plugin-sdk/")).map((key) => key.slice(13)).filter((subpath) => isSafePluginSdkSubpathSegment(subpath)).toSorted();
}
function hasTrustedOperatorRootIndicator(params) {
	const packageExports = params.packageJson.exports ?? {};
	if (!Object.hasOwn(packageExports, "./plugin-sdk")) return false;
	const hasCliEntryExport = Object.hasOwn(packageExports, "./cli-entry");
	const hasOperatorBin = typeof params.packageJson.bin === "string" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.packageJson.bin).includes("@gabrielvfonseca/operator") || typeof params.packageJson.bin === "object" && params.packageJson.bin !== null && typeof params.packageJson.bin.operator === "string";
	const hasOperatorEntrypoint = node_fs.default.existsSync(node_path.default.join(params.packageRoot, "operator.mjs"));
	return hasCliEntryExport || hasOperatorBin || hasOperatorEntrypoint;
}
function readPluginSdkSubpathsFromPackageRoot(packageRoot) {
	const pkg = readPluginSdkPackageJson(packageRoot);
	if (!pkg) return null;
	if (!hasTrustedOperatorRootIndicator({
		packageRoot,
		packageJson: pkg
	})) return null;
	const subpaths = listPluginSdkSubpathsFromPackageJson(pkg);
	return subpaths.length > 0 ? subpaths : null;
}
function resolveTrustedOperatorRootFromArgvHint(params) {
	if (!params.argv1) return null;
	const packageRoot = require_openclaw_root.resolveOperatorPackageRootSync({
		cwd: params.cwd,
		argv1: params.argv1
	});
	if (!packageRoot) return null;
	const packageJson = readPluginSdkPackageJson(packageRoot);
	if (!packageJson) return null;
	return hasTrustedOperatorRootIndicator({
		packageRoot,
		packageJson
	}) ? packageRoot : null;
}
function findNearestPluginSdkPackageRoot(startDir, maxDepth = 12) {
	let cursor = node_path.default.resolve(startDir);
	for (let i = 0; i < maxDepth; i += 1) {
		if (readPluginSdkSubpathsFromPackageRoot(cursor)) return cursor;
		const parent = node_path.default.dirname(cursor);
		if (parent === cursor) break;
		cursor = parent;
	}
	return null;
}
function resolveLoaderPackageRoot(params) {
	const cwd = params.cwd ?? node_path.default.dirname(params.modulePath);
	const fromModulePath = require_openclaw_root.resolveOperatorPackageRootSync({ cwd });
	if (fromModulePath) return fromModulePath;
	const argv1 = params.argv1 ?? process.argv[1];
	const moduleUrl = params.moduleUrl ?? (params.modulePath ? void 0 : require("url").pathToFileURL(__filename).href);
	return require_openclaw_root.resolveOperatorPackageRootSync({
		cwd,
		...argv1 ? { argv1 } : {},
		...moduleUrl ? { moduleUrl } : {}
	});
}
function createPluginRuntimeModuleCandidateMap(packageRoot) {
	return {
		src: node_path.default.join(packageRoot, "src", "plugins", "runtime", "index.ts"),
		dist: node_path.default.join(packageRoot, "dist", "plugins", "runtime", "index.js")
	};
}
function appendPluginRuntimeModuleCandidates(candidates, packageRoot, orderedKinds) {
	const candidateMap = createPluginRuntimeModuleCandidateMap(packageRoot);
	for (const kind of orderedKinds) candidates.push(candidateMap[kind]);
}
function appendSiblingPluginRuntimeModuleCandidates(candidates, runtimeDir, orderedKinds) {
	const candidateMap = {
		src: node_path.default.join(runtimeDir, "index.ts"),
		dist: node_path.default.join(runtimeDir, "index.js")
	};
	for (const kind of orderedKinds) candidates.push(candidateMap[kind]);
}
function dedupeResolvedPaths(paths) {
	const seen = /* @__PURE__ */ new Set();
	const deduped = [];
	for (const candidate of paths) {
		const resolved = node_path.default.resolve(candidate);
		if (seen.has(resolved)) continue;
		seen.add(resolved);
		deduped.push(resolved);
	}
	return deduped;
}
function listAncestorPluginRuntimeModuleCandidates(params) {
	const candidates = [];
	for (const start of params.starts) {
		if (!start) continue;
		let cursor = node_path.default.resolve(start);
		const maxDepth = params.maxDepth ?? 12;
		for (let i = 0; i < maxDepth; i += 1) {
			appendPluginRuntimeModuleCandidates(candidates, cursor, params.orderedKinds);
			const parent = node_path.default.dirname(cursor);
			if (parent === cursor) break;
			cursor = parent;
		}
	}
	return dedupeResolvedPaths(candidates);
}
function listArgvRuntimeFallbackStartDirs(argv1) {
	if (!argv1) return [];
	const normalized = node_path.default.resolve(argv1);
	const starts = [];
	const parts = normalized.split(node_path.default.sep);
	const binIndex = parts.lastIndexOf(".bin");
	if (binIndex > 0 && parts[binIndex - 1] === "node_modules") {
		const binName = node_path.default.basename(normalized);
		const nodeModulesDir = parts.slice(0, binIndex).join(node_path.default.sep);
		starts.push(node_path.default.join(nodeModulesDir, binName));
	}
	try {
		const resolved = node_fs.default.realpathSync(normalized);
		if (resolved !== normalized) starts.push(node_path.default.dirname(resolved));
	} catch {}
	starts.push(node_path.default.dirname(normalized));
	return dedupeResolvedPaths(starts);
}
function formatResolutionError(error) {
	return error instanceof Error ? error.message : String(error);
}
function resolveDevSourceRootParam(params) {
	return params.devSourceRoot !== void 0 ? params.devSourceRoot : require_dev_source_root.resolveOperatorDevSourceRoot(process.env);
}
function resolveLoaderPluginSdkPackageRoot(params) {
	const devSourceRoot = resolveDevSourceRootParam(params);
	if (devSourceRoot) return devSourceRoot;
	const cwd = params.cwd ?? node_path.default.dirname(params.modulePath);
	const fromCwd = require_openclaw_root.resolveOperatorPackageRootSync({ cwd });
	const fromExplicitHints = resolveTrustedOperatorRootFromArgvHint({
		cwd,
		argv1: params.argv1
	}) ?? (params.moduleUrl ? require_openclaw_root.resolveOperatorPackageRootSync({
		cwd,
		moduleUrl: params.moduleUrl
	}) : null);
	return fromCwd ?? fromExplicitHints ?? findNearestPluginSdkPackageRoot(node_path.default.dirname(params.modulePath)) ?? (params.cwd ? findNearestPluginSdkPackageRoot(params.cwd) : null) ?? findNearestPluginSdkPackageRoot(process.cwd());
}
function resolvePluginSdkAliasCandidateOrder(params) {
	if (params.pluginSdkResolution === "dist") return ["dist", "src"];
	if (params.pluginSdkResolution === "src") return ["src", "dist"];
	return params.modulePath.replace(/\\/g, "/").includes("/dist/") || params.isProduction ? ["dist", "src"] : ["src", "dist"];
}
function listPluginSdkAliasCandidates(params) {
	const orderedKinds = resolvePluginSdkAliasCandidateOrder({
		modulePath: params.modulePath,
		isProduction: true,
		pluginSdkResolution: params.pluginSdkResolution
	});
	const packageRoot = resolveLoaderPluginSdkPackageRoot(params);
	if (packageRoot) {
		const candidateMap = {
			src: node_path.default.join(packageRoot, "src", "plugin-sdk", params.srcFile),
			dist: node_path.default.join(packageRoot, "dist", "plugin-sdk", params.distFile)
		};
		return orderedKinds.map((kind) => candidateMap[kind]);
	}
	let cursor = node_path.default.dirname(params.modulePath);
	const candidates = [];
	for (let i = 0; i < 6; i += 1) {
		const candidateMap = {
			src: node_path.default.join(cursor, "src", "plugin-sdk", params.srcFile),
			dist: node_path.default.join(cursor, "dist", "plugin-sdk", params.distFile)
		};
		for (const kind of orderedKinds) candidates.push(candidateMap[kind]);
		const parent = node_path.default.dirname(cursor);
		if (parent === cursor) break;
		cursor = parent;
	}
	return candidates;
}
function resolvePluginSdkAliasFile(params) {
	try {
		const modulePath = resolveLoaderModulePath$1(params);
		for (const candidate of listPluginSdkAliasCandidates({
			srcFile: params.srcFile,
			distFile: params.distFile,
			modulePath,
			argv1: params.argv1,
			cwd: params.cwd,
			moduleUrl: params.moduleUrl,
			devSourceRoot: params.devSourceRoot,
			pluginSdkResolution: params.pluginSdkResolution
		})) if (node_fs.default.existsSync(candidate)) return candidate;
	} catch {}
	return null;
}
const MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES = 512;
const cachedPluginSdkExportedSubpaths = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES);
const cachedPluginSdkScopedAliasMaps = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES);
const cachedBundledPluginPublicSurfaceAliasMaps = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES);
const PLUGIN_SDK_PACKAGE_NAMES = ["openclaw/plugin-sdk", "@gabrielvfonseca/plugin-sdk"];
const CODEX_NATIVE_TASK_RUNTIME_PLUGIN_SDK_SUBPATH = "codex-native-task-runtime";
const CODEX_MCP_PROJECTION_PLUGIN_SDK_SUBPATH = "codex-mcp-projection";
const OLLAMA_CONFIGURED_LOCAL_ORIGIN_RUNTIME_PLUGIN_SDK_SUBPATH = "ssrf-runtime-internal";
const PRIVATE_PLUGIN_SDK_SUBPATH_OWNERS = [
	{
		bundledPluginId: "codex",
		officialInstalledPackageName: "@gabrielvfonseca/codex",
		allowPrivateQaCli: true,
		subpaths: [CODEX_NATIVE_TASK_RUNTIME_PLUGIN_SDK_SUBPATH, CODEX_MCP_PROJECTION_PLUGIN_SDK_SUBPATH]
	},
	{
		bundledPluginId: "ollama",
		allowPrivateQaCli: false,
		subpaths: [OLLAMA_CONFIGURED_LOCAL_ORIGIN_RUNTIME_PLUGIN_SDK_SUBPATH]
	},
	{
		bundledPluginId: "browser",
		allowPrivateQaCli: false,
		subpaths: [OLLAMA_CONFIGURED_LOCAL_ORIGIN_RUNTIME_PLUGIN_SDK_SUBPATH]
	}
];
const PLUGIN_SDK_SOURCE_CANDIDATE_EXTENSIONS = [
	".ts",
	".mts",
	".js",
	".mjs",
	".cts",
	".cjs"
];
const BUNDLED_PLUGIN_PUBLIC_SURFACE_SOURCE_PATTERN = /^(?:api|runtime-api|test-api|.+-api)$/u;
const JS_STATIC_RELATIVE_DEPENDENCY_PATTERN = /(?:\bfrom\s*["']|\bimport\s*\(\s*["']|\brequire\s*\(\s*["'])(\.{1,2}\/[^"']+)["']/g;
const WORKSPACE_PACKAGE_ALIAS_ENTRIES = [
	{
		packageName: "@gabrielvfonseca/gateway-client",
		packageDir: "gateway-client",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-client",
		packageDir: "gateway-client",
		subpath: "readiness",
		srcFile: "readiness.ts",
		distFile: "readiness.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-client",
		packageDir: "gateway-client",
		subpath: "timeouts",
		srcFile: "timeouts.ts",
		distFile: "timeouts.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "client-info",
		srcFile: "client-info.ts",
		distFile: "client-info.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "connect-error-details",
		srcFile: "connect-error-details.ts",
		distFile: "connect-error-details.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "frame-guards",
		srcFile: "frame-guards.ts",
		distFile: "frame-guards.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "schema",
		srcFile: "schema.ts",
		distFile: "schema.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "startup-unavailable",
		srcFile: "startup-unavailable.ts",
		distFile: "startup-unavailable.mjs"
	},
	{
		packageName: "@gabrielvfonseca/gateway-protocol",
		packageDir: "gateway-protocol",
		subpath: "version",
		srcFile: "version.ts",
		distFile: "version.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "code-spans",
		srcFile: "code-spans.ts",
		distFile: "code-spans.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "fences",
		srcFile: "fences.ts",
		distFile: "fences.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "frontmatter",
		srcFile: "frontmatter.ts",
		distFile: "frontmatter.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "ir",
		srcFile: "ir.ts",
		distFile: "ir.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "render",
		srcFile: "render.ts",
		distFile: "render.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "render-aware-chunking",
		srcFile: "render-aware-chunking.ts",
		distFile: "render-aware-chunking.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "tables",
		srcFile: "tables.ts",
		distFile: "tables.mjs"
	},
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpath: "types",
		srcFile: "types.ts",
		distFile: "types.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-generation-core",
		packageDir: "media-generation-core",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-generation-core",
		packageDir: "media-generation-core",
		subpath: "capability-model-ref",
		srcFile: "capability-model-ref.ts",
		distFile: "capability-model-ref.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-generation-core",
		packageDir: "media-generation-core",
		subpath: "catalog",
		srcFile: "catalog.ts",
		distFile: "catalog.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-generation-core",
		packageDir: "media-generation-core",
		subpath: "model-ref",
		srcFile: "model-ref.ts",
		distFile: "model-ref.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-generation-core",
		packageDir: "media-generation-core",
		subpath: "normalization",
		srcFile: "normalization.ts",
		distFile: "normalization.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "base64",
		srcFile: "base64.ts",
		distFile: "base64.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "constants",
		srcFile: "constants.ts",
		distFile: "constants.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "content-length",
		srcFile: "content-length.ts",
		distFile: "content-length.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "file-name",
		srcFile: "file-name.ts",
		distFile: "file-name.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "inbound-path-policy",
		srcFile: "inbound-path-policy.ts",
		distFile: "inbound-path-policy.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "inline-image-data-url",
		srcFile: "inline-image-data-url.ts",
		distFile: "inline-image-data-url.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "media-source-url",
		srcFile: "media-source-url.ts",
		distFile: "media-source-url.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "mime",
		srcFile: "mime.ts",
		distFile: "mime.mjs"
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpath: "read-byte-stream-with-limit",
		srcFile: "read-byte-stream-with-limit.ts",
		distFile: "read-byte-stream-with-limit.mjs"
	},
	{
		packageName: "@gabrielvfonseca/retry",
		packageDir: "retry",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "ansi",
		srcFile: "ansi.ts",
		distFile: "ansi.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "decorative-emoji",
		srcFile: "decorative-emoji.ts",
		distFile: "decorative-emoji.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "health-style",
		srcFile: "health-style.ts",
		distFile: "health-style.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "links",
		srcFile: "links.ts",
		distFile: "links.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "note",
		srcFile: "note.ts",
		distFile: "note.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "osc-progress",
		srcFile: "osc-progress.ts",
		distFile: "osc-progress.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "palette",
		srcFile: "palette.ts",
		distFile: "palette.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "progress-line",
		srcFile: "progress-line.ts",
		distFile: "progress-line.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "prompt-select-styled",
		srcFile: "prompt-select-styled.ts",
		distFile: "prompt-select-styled.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "prompt-select-styled-params",
		srcFile: "prompt-select-styled-params.ts",
		distFile: "prompt-select-styled-params.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "prompt-style",
		srcFile: "prompt-style.ts",
		distFile: "prompt-style.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "restore",
		srcFile: "restore.ts",
		distFile: "restore.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "safe-text",
		srcFile: "safe-text.ts",
		distFile: "safe-text.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "stream-writer",
		srcFile: "stream-writer.ts",
		distFile: "stream-writer.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "table",
		srcFile: "table.ts",
		distFile: "table.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "terminal-link",
		srcFile: "terminal-link.ts",
		distFile: "terminal-link.mjs"
	},
	{
		packageName: "@gabrielvfonseca/terminal-core",
		packageDir: "terminal-core",
		subpath: "theme",
		srcFile: "theme.ts",
		distFile: "theme.mjs"
	},
	{
		packageName: "@gabrielvfonseca/net-policy",
		packageDir: "net-policy",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/net-policy",
		packageDir: "net-policy",
		subpath: "ip",
		srcFile: "ip.ts",
		distFile: "ip.mjs"
	},
	{
		packageName: "@gabrielvfonseca/net-policy",
		packageDir: "net-policy",
		subpath: "ipv4",
		srcFile: "ipv4.ts",
		distFile: "ipv4.mjs"
	},
	{
		packageName: "@gabrielvfonseca/net-policy",
		packageDir: "net-policy",
		subpath: "redact-sensitive-url",
		srcFile: "redact-sensitive-url.ts",
		distFile: "redact-sensitive-url.mjs"
	},
	{
		packageName: "@gabrielvfonseca/net-policy",
		packageDir: "net-policy",
		subpath: "url-protocol",
		srcFile: "url-protocol.ts",
		distFile: "url-protocol.mjs"
	},
	{
		packageName: "@gabrielvfonseca/net-policy",
		packageDir: "net-policy",
		subpath: "url-userinfo",
		srcFile: "url-userinfo.ts",
		distFile: "url-userinfo.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "",
		srcFile: "index.ts",
		distFile: "index.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "configured-model-refs",
		srcFile: "configured-model-refs.ts",
		distFile: "configured-model-refs.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "model-catalog-refs",
		srcFile: "model-catalog-refs.ts",
		distFile: "model-catalog-refs.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "model-catalog-normalize",
		srcFile: "model-catalog-normalize.ts",
		distFile: "model-catalog-normalize.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "model-catalog-types",
		srcFile: "model-catalog-types.ts",
		distFile: "model-catalog-types.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "provider-id",
		srcFile: "provider-id.ts",
		distFile: "provider-id.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "provider-model-id-normalization",
		srcFile: "provider-model-id-normalization.ts",
		distFile: "provider-model-id-normalization.mjs"
	},
	{
		packageName: "@gabrielvfonseca/model-catalog-core",
		packageDir: "model-catalog-core",
		subpath: "provider-model-id-normalize",
		srcFile: "provider-model-id-normalize.ts",
		distFile: "provider-model-id-normalize.mjs"
	}
];
const ROOT_PACKAGED_WORKSPACE_PACKAGE_DIRS = /* @__PURE__ */ new Set([
	"acp-core",
	"media-core",
	"normalization-core",
	"retry",
	"terminal-core"
]);
function normalizePackageExportSubpath(exportKey) {
	if (exportKey === ".") return "";
	if (!exportKey.startsWith("./")) return null;
	const subpath = exportKey.slice(2);
	return subpath && !subpath.includes("..") ? subpath : null;
}
function resolvePackageExportImportPath(value) {
	if (typeof value === "string") return value;
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const record = value;
	return typeof record.import === "string" ? record.import : typeof record.default === "string" ? record.default : null;
}
function listRootPackagedWorkspacePackageAliasEntries(params) {
	const distRoot = node_path.default.join(params.packageRoot, "dist", params.packageDir);
	if (!node_fs.default.existsSync(distRoot)) return [];
	const entries = [];
	const visit = (dir, prefix = "") => {
		for (const entry of node_fs.default.readdirSync(dir, { withFileTypes: true })) {
			const relativePath = prefix ? node_path.default.join(prefix, entry.name) : entry.name;
			const fullPath = node_path.default.join(dir, entry.name);
			if (entry.isDirectory()) {
				visit(fullPath, relativePath);
				continue;
			}
			if (!entry.isFile() || !relativePath.endsWith(".js")) continue;
			const normalizedRelativePath = relativePath.split(node_path.default.sep).join("/");
			const subpath = normalizedRelativePath === "index.js" ? "" : normalizedRelativePath.slice(0, -3);
			if (subpath.includes("..")) continue;
			entries.push({
				packageName: params.packageName,
				packageDir: params.packageDir,
				subpath,
				srcFile: `${subpath || "index"}.ts`,
				distFile: relativePath
			});
		}
	};
	visit(distRoot);
	return entries.toSorted((a, b) => a.subpath.localeCompare(b.subpath));
}
function listWorkspacePackageExportAliasEntries(params) {
	const packageJsonPath = node_path.default.join(params.packageRoot, "packages", params.packageDir, "package.json");
	const fallbackPackageRoot = require_openclaw_root.resolveOperatorPackageRootSync({ cwd: process.cwd() });
	const exports = ((0, _openclaw_fs_safe_json.tryReadJsonSync)(packageJsonPath) ?? (fallbackPackageRoot ? (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(fallbackPackageRoot, "packages", params.packageDir, "package.json")) : null))?.exports;
	if (!exports || typeof exports !== "object" || Array.isArray(exports)) return listRootPackagedWorkspacePackageAliasEntries(params);
	const entries = [];
	for (const [exportKey, value] of Object.entries(exports)) {
		const subpath = normalizePackageExportSubpath(exportKey);
		const importPath = resolvePackageExportImportPath(value);
		if (subpath === null || !importPath?.startsWith("./dist/") || !importPath.endsWith(".mjs")) continue;
		const distFile = importPath.slice(7);
		const srcFile = distFile.replace(/\.mjs$/u, ".ts");
		entries.push({
			packageName: params.packageName,
			packageDir: params.packageDir,
			subpath,
			srcFile,
			distFile
		});
	}
	return entries.length > 0 ? entries.toSorted((a, b) => a.subpath.localeCompare(b.subpath)) : listRootPackagedWorkspacePackageAliasEntries(params);
}
function isUsableDistPluginSdkArtifact(candidate) {
	if (!node_fs.default.existsSync(candidate)) return false;
	switch ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.extname(candidate))) {
		case ".js":
		case ".mjs":
		case ".cjs": break;
		default: return true;
	}
	try {
		const source = node_fs.default.readFileSync(candidate, "utf-8");
		for (const match of source.matchAll(JS_STATIC_RELATIVE_DEPENDENCY_PATTERN)) {
			const specifier = match[1];
			if (!specifier || node_fs.default.existsSync(node_path.default.resolve(node_path.default.dirname(candidate), specifier))) continue;
			return false;
		}
	} catch {
		return false;
	}
	return true;
}
function readPrivateLocalOnlyPluginSdkSubpaths(packageRoot) {
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(packageRoot, "scripts", "lib", "plugin-sdk-private-local-only-subpaths.json"));
	return [.../* @__PURE__ */ new Set([
		CODEX_NATIVE_TASK_RUNTIME_PLUGIN_SDK_SUBPATH,
		CODEX_MCP_PROJECTION_PLUGIN_SDK_SUBPATH,
		OLLAMA_CONFIGURED_LOCAL_ORIGIN_RUNTIME_PLUGIN_SDK_SUBPATH,
		...Array.isArray(parsed) ? parsed.filter((subpath) => isSafePluginSdkSubpathSegment(subpath)) : []
	])];
}
function readBundledPluginPackageName(packageJsonPath) {
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(packageJsonPath);
	const name = typeof parsed?.name === "string" ? parsed.name.trim() : "";
	return name.startsWith("@gabrielvfonseca/") ? name : null;
}
function isBundledPluginPublicSurfaceSourceBasename(params) {
	if (params.basename === "test-api") return params.includePrivateQa;
	return BUNDLED_PLUGIN_PUBLIC_SURFACE_SOURCE_PATTERN.test(params.basename);
}
function listBundledPluginPublicSurfaceSourceBasenames(params) {
	try {
		return node_fs.default.readdirSync(params.extensionSourceRoot, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name).flatMap((fileName) => {
			const ext = PLUGIN_SDK_SOURCE_CANDIDATE_EXTENSIONS.find((candidateExt) => fileName.endsWith(candidateExt));
			if (!ext) return [];
			const basename = fileName.slice(0, -ext.length);
			return isBundledPluginPublicSurfaceSourceBasename({
				basename,
				includePrivateQa: params.includePrivateQa
			}) ? [basename] : [];
		}).toSorted();
	} catch {
		return [];
	}
}
function resolveBundledPluginPublicSurfaceAliasTarget(params) {
	for (const kind of params.orderedKinds) {
		if (kind === "dist") {
			const candidate = node_path.default.join(params.packageRoot, "dist", "extensions", params.dirName, `${params.basename}.js`);
			if (node_fs.default.existsSync(candidate)) return candidate;
			continue;
		}
		for (const ext of PLUGIN_SDK_SOURCE_CANDIDATE_EXTENSIONS) {
			const candidate = node_path.default.join(params.packageRoot, "extensions", params.dirName, `${params.basename}${ext}`);
			if (node_fs.default.existsSync(candidate)) return candidate;
		}
	}
	return null;
}
function resolveBundledPluginPackagePublicSurfaceAliasMap(params) {
	const packageRoot = resolveLoaderPluginSdkPackageRoot(params);
	if (!packageRoot) return {};
	const orderedKinds = resolvePluginSdkAliasCandidateOrder({
		modulePath: params.modulePath,
		isProduction: true,
		pluginSdkResolution: params.pluginSdkResolution
	});
	const includePrivateQa = shouldIncludePrivateLocalOnlyPluginSdkSubpaths();
	const cacheKey = `${packageRoot}::${orderedKinds.join(",")}::privateQa=${includePrivateQa ? "1" : "0"}`;
	const cached = cachedBundledPluginPublicSurfaceAliasMaps.get(cacheKey);
	if (cached) return cached;
	const extensionsRoot = node_path.default.join(packageRoot, "extensions");
	let extensionDirs;
	try {
		extensionDirs = node_fs.default.readdirSync(extensionsRoot, { withFileTypes: true });
	} catch {
		cachedBundledPluginPublicSurfaceAliasMaps.set(cacheKey, {});
		return {};
	}
	const aliasMap = {};
	for (const entry of extensionDirs) {
		if (!entry.isDirectory()) continue;
		const dirName = entry.name;
		const packageName = readBundledPluginPackageName(node_path.default.join(extensionsRoot, dirName, "package.json"));
		if (!packageName) continue;
		for (const basename of listBundledPluginPublicSurfaceSourceBasenames({
			extensionSourceRoot: node_path.default.join(extensionsRoot, dirName),
			includePrivateQa
		})) {
			const target = resolveBundledPluginPublicSurfaceAliasTarget({
				packageRoot,
				dirName,
				basename,
				orderedKinds
			});
			if (!target) continue;
			aliasMap[`${packageName}/${basename}.js`] = normalizeJitiAliasTargetPath(target);
		}
	}
	cachedBundledPluginPublicSurfaceAliasMaps.set(cacheKey, aliasMap);
	return aliasMap;
}
function resolveWorkspacePackageAliasMap(params) {
	const packageRoot = resolveLoaderPluginSdkPackageRoot(params);
	if (!packageRoot) return {};
	const orderedKinds = resolvePluginSdkAliasCandidateOrder({
		modulePath: params.modulePath,
		isProduction: true,
		pluginSdkResolution: params.pluginSdkResolution
	});
	const aliasMap = {};
	const workspacePackageAliasEntries = [...WORKSPACE_PACKAGE_ALIAS_ENTRIES, ...["normalization-core", "acp-core"].flatMap((packageDir) => listWorkspacePackageExportAliasEntries({
		packageRoot,
		packageName: `@gabrielvfonseca/${packageDir}`,
		packageDir
	}))];
	for (const entry of workspacePackageAliasEntries) {
		const alias = entry.subpath ? `${entry.packageName}/${entry.subpath}` : entry.packageName;
		for (const kind of orderedKinds) {
			const candidate = (kind === "dist" ? [...ROOT_PACKAGED_WORKSPACE_PACKAGE_DIRS.has(entry.packageDir) ? [node_path.default.join(packageRoot, "dist", entry.packageDir, entry.distFile.replace(/\.mjs$/u, ".js"))] : [], node_path.default.join(packageRoot, "packages", entry.packageDir, "dist", entry.distFile)] : [node_path.default.join(packageRoot, "packages", entry.packageDir, "src", entry.srcFile)]).find((candidatePath) => node_fs.default.existsSync(candidatePath));
			if (candidate) {
				aliasMap[alias] = normalizeJitiAliasTargetPath(candidate);
				break;
			}
		}
	}
	return aliasMap;
}
function shouldIncludePrivateLocalOnlyPluginSdkSubpaths() {
	return process.env.OPERATOR_ENABLE_PRIVATE_QA_CLI === "1";
}
function isBundledPluginModulePath(params) {
	const normalizedModulePath = node_path.default.resolve(params.modulePath);
	return [
		node_path.default.join(params.packageRoot, "extensions", params.pluginId),
		node_path.default.join(params.packageRoot, "dist", "extensions", params.pluginId),
		node_path.default.join(params.packageRoot, "dist-runtime", "extensions", params.pluginId)
	].some((root) => normalizedModulePath === root || normalizedModulePath.startsWith(`${root}${node_path.default.sep}`));
}
function isOfficialInstalledPluginPackageRoot(params) {
	const [scope, name] = params.packageName.split("/");
	if (!scope || !name) return false;
	const segments = node_path.default.resolve(params.packageRoot).split(node_path.default.sep).filter(Boolean);
	const last = segments.at(-1);
	const packageScope = segments.at(-2);
	const nodeModules = segments.at(-3);
	return last === name && packageScope === scope && nodeModules === "node_modules";
}
function isOfficialInstalledPluginModulePath(params) {
	let cursor = node_path.default.dirname(node_path.default.resolve(params.modulePath));
	for (let depth = 0; depth < 12; depth += 1) {
		const packageJson = (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(cursor, "package.json"));
		if (packageJson) return packageJson.name === params.packageName && isOfficialInstalledPluginPackageRoot({
			packageRoot: cursor,
			packageName: params.packageName
		});
		const parent = node_path.default.dirname(cursor);
		if (parent === cursor) break;
		cursor = parent;
	}
	return false;
}
function isTrustedPrivatePluginSdkOwnerPath(params) {
	if (isBundledPluginModulePath({
		packageRoot: params.packageRoot,
		modulePath: params.modulePath,
		pluginId: params.owner.bundledPluginId
	})) return true;
	return params.owner.officialInstalledPackageName ? isOfficialInstalledPluginModulePath({
		modulePath: params.modulePath,
		packageName: params.owner.officialInstalledPackageName
	}) : false;
}
function findPrivatePluginSdkSubpathOwners(subpath) {
	return PRIVATE_PLUGIN_SDK_SUBPATH_OWNERS.filter((owner) => owner.subpaths.includes(subpath));
}
function listTrustedPrivatePluginSdkOwnerKeys(params) {
	return PRIVATE_PLUGIN_SDK_SUBPATH_OWNERS.filter((owner) => isTrustedPrivatePluginSdkOwnerPath({
		...params,
		owner
	})).map((owner) => owner.bundledPluginId);
}
function resolvePrivatePluginSdkOwnerPackageRoot(params) {
	return resolveLoaderPackageRoot({
		modulePath: params.modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl
	}) ?? params.aliasPackageRoot;
}
function shouldIncludePrivateLocalOnlyPluginSdkSubpath(params) {
	const owners = findPrivatePluginSdkSubpathOwners(params.subpath);
	if (owners.length === 0) return shouldIncludePrivateLocalOnlyPluginSdkSubpaths();
	return owners.some((owner) => isTrustedPrivatePluginSdkOwnerPath({
		...params,
		owner
	}) || owner.allowPrivateQaCli && shouldIncludePrivateLocalOnlyPluginSdkSubpaths());
}
function hasPluginSdkSubpathArtifact(packageRoot, subpath) {
	if (isUsableDistPluginSdkArtifact(node_path.default.join(packageRoot, "dist", "plugin-sdk", `${subpath}.js`))) return true;
	return PLUGIN_SDK_SOURCE_CANDIDATE_EXTENSIONS.some((ext) => node_fs.default.existsSync(node_path.default.join(packageRoot, "src", "plugin-sdk", `${subpath}${ext}`)));
}
function listDistPluginSdkArtifactSubpaths(packageRoot) {
	try {
		const distPluginSdkDir = node_path.default.join(packageRoot, "dist", "plugin-sdk");
		return new Set(node_fs.default.readdirSync(distPluginSdkDir, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".js")).map((entry) => entry.name.slice(0, -3)).filter((subpath) => isSafePluginSdkSubpathSegment(subpath)));
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function listPrivateLocalOnlyPluginSdkSubpaths(params) {
	return readPrivateLocalOnlyPluginSdkSubpaths(params.packageRoot).filter((subpath) => shouldIncludePrivateLocalOnlyPluginSdkSubpath({
		packageRoot: params.ownerPackageRoot,
		modulePath: params.modulePath,
		subpath
	}) && hasPluginSdkSubpathArtifact(params.packageRoot, subpath));
}
function listPluginSdkExportedSubpaths(params = {}) {
	const modulePath = params.modulePath ?? (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
	const packageRoot = resolveLoaderPluginSdkPackageRoot({
		modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl,
		devSourceRoot: params.devSourceRoot
	});
	if (!packageRoot) return [];
	const ownerPackageRoot = resolvePrivatePluginSdkOwnerPackageRoot({
		modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl,
		aliasPackageRoot: packageRoot
	});
	const trustedPrivateOwners = listTrustedPrivatePluginSdkOwnerKeys({
		packageRoot: ownerPackageRoot,
		modulePath
	});
	const cacheKey = `${packageRoot}::privateQa=${shouldIncludePrivateLocalOnlyPluginSdkSubpaths() ? "1" : "0"}::privateOwners=${trustedPrivateOwners.join(",")}`;
	const cached = cachedPluginSdkExportedSubpaths.get(cacheKey);
	if (cached) return cached;
	const subpaths = [.../* @__PURE__ */ new Set([...readPluginSdkSubpathsFromPackageRoot(packageRoot) ?? [], ...listPrivateLocalOnlyPluginSdkSubpaths({
		packageRoot,
		ownerPackageRoot,
		modulePath
	})])].toSorted();
	cachedPluginSdkExportedSubpaths.set(cacheKey, subpaths);
	return subpaths;
}
function resolvePluginSdkScopedAliasMap(params = {}) {
	const modulePath = params.modulePath ?? (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
	const packageRoot = resolveLoaderPluginSdkPackageRoot({
		modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl,
		devSourceRoot: params.devSourceRoot
	});
	if (!packageRoot) return {};
	const ownerPackageRoot = resolvePrivatePluginSdkOwnerPackageRoot({
		modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl,
		aliasPackageRoot: packageRoot
	});
	const orderedKinds = resolvePluginSdkAliasCandidateOrder({
		modulePath,
		isProduction: true,
		pluginSdkResolution: params.pluginSdkResolution
	});
	const trustedPrivateOwners = listTrustedPrivatePluginSdkOwnerKeys({
		packageRoot: ownerPackageRoot,
		modulePath
	});
	const cacheKey = `${packageRoot}::${orderedKinds.join(",")}::privateQa=${shouldIncludePrivateLocalOnlyPluginSdkSubpaths() ? "1" : "0"}::privateOwners=${trustedPrivateOwners.join(",")}`;
	const cached = cachedPluginSdkScopedAliasMaps.get(cacheKey);
	if (cached) return cached;
	const aliasMap = {};
	const distPluginSdkArtifacts = orderedKinds.includes("dist") ? listDistPluginSdkArtifactSubpaths(packageRoot) : /* @__PURE__ */ new Set();
	for (const subpath of listPluginSdkExportedSubpaths({
		modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl,
		devSourceRoot: params.devSourceRoot,
		pluginSdkResolution: params.pluginSdkResolution
	})) for (const kind of orderedKinds) {
		if (kind === "dist") {
			if (!distPluginSdkArtifacts.has(subpath)) continue;
			const candidate = node_path.default.join(packageRoot, "dist", "plugin-sdk", `${subpath}.js`);
			if (isUsableDistPluginSdkArtifact(candidate)) {
				for (const packageName of PLUGIN_SDK_PACKAGE_NAMES) aliasMap[`${packageName}/${subpath}`] = candidate;
				break;
			}
			continue;
		}
		for (const ext of PLUGIN_SDK_SOURCE_CANDIDATE_EXTENSIONS) {
			const candidate = node_path.default.join(packageRoot, "src", "plugin-sdk", `${subpath}${ext}`);
			if (!node_fs.default.existsSync(candidate)) continue;
			for (const packageName of PLUGIN_SDK_PACKAGE_NAMES) aliasMap[`${packageName}/${subpath}`] = candidate;
			break;
		}
		if (Object.hasOwn(aliasMap, `openclaw/plugin-sdk/${subpath}`)) break;
	}
	cachedPluginSdkScopedAliasMaps.set(cacheKey, aliasMap);
	return aliasMap;
}
function resolveExtensionApiAlias(params = {}) {
	try {
		const modulePath = resolveLoaderModulePath$1(params);
		const packageRoot = resolveDevSourceRootParam(params) ?? resolveLoaderPackageRoot({
			...params,
			modulePath
		});
		if (!packageRoot) return null;
		const orderedKinds = resolvePluginSdkAliasCandidateOrder({
			modulePath,
			isProduction: true,
			pluginSdkResolution: params.pluginSdkResolution
		});
		for (const kind of orderedKinds) {
			if (kind === "dist") {
				const candidate = node_path.default.join(packageRoot, "dist", "extensionAPI.js");
				if (node_fs.default.existsSync(candidate)) return candidate;
				continue;
			}
			for (const ext of PLUGIN_SDK_SOURCE_CANDIDATE_EXTENSIONS) {
				const candidate = node_path.default.join(packageRoot, "src", `extensionAPI${ext}`);
				if (node_fs.default.existsSync(candidate)) return candidate;
			}
		}
	} catch {}
	return null;
}
const JITI_NORMALIZED_ALIAS_SYMBOL = Symbol.for("pathe:normalizedAlias");
const JITI_ALIAS_ROOT_SENTINELS = /* @__PURE__ */ new Set([
	"/",
	"\\",
	void 0
]);
const JITI_CONCRETE_ALIAS_TARGET_PATTERN = /^(?:[A-Za-z]:[/\\]|[/\\])/;
const aliasMapCache = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES);
const normalizedJitiAliasMapCache = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES);
const normalizedJitiAliasMapByInput = /* @__PURE__ */ new WeakMap();
const pluginLoaderModuleCacheKeyByAliasMap = /* @__PURE__ */ new WeakMap();
const pluginLoaderModuleConfigCache = new require_plugin_cache_primitives.PluginLruCache(MAX_PLUGIN_LOADER_ALIAS_CACHE_ENTRIES);
function hasJitiNormalizedAliasMarker(aliasMap) {
	return Boolean(aliasMap[JITI_NORMALIZED_ALIAS_SYMBOL]);
}
function createJitiAliasContentCacheKey(aliasMap) {
	return Object.entries(aliasMap).toSorted(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}\0${value}`).join("\0");
}
function isConcreteJitiAliasTarget(target) {
	return typeof target === "string" && JITI_CONCRETE_ALIAS_TARGET_PATTERN.test(target);
}
function resolveJitiAliasTarget(aliasKey, aliasKeys, aliasMap) {
	let target = aliasMap[aliasKey];
	const seenTargets = /* @__PURE__ */ new Set();
	const seenAliasKeys = /* @__PURE__ */ new Set();
	while (target && !isConcreteJitiAliasTarget(target) && !seenTargets.has(target)) {
		seenTargets.add(target);
		let nextTarget;
		for (const candidateKey of aliasKeys) {
			if (candidateKey === aliasKey || aliasKey.startsWith(candidateKey) || !target.startsWith(candidateKey) || !JITI_ALIAS_ROOT_SENTINELS.has(target[candidateKey.length])) continue;
			if (seenAliasKeys.has(candidateKey)) return target;
			seenAliasKeys.add(candidateKey);
			nextTarget = aliasMap[candidateKey] + target.slice(candidateKey.length);
			break;
		}
		if (!nextTarget || nextTarget === target) break;
		target = nextTarget;
	}
	return target;
}
function normalizePluginLoaderAliasMapForJiti(aliasMap) {
	if (hasJitiNormalizedAliasMarker(aliasMap)) return aliasMap;
	const cachedByInput = normalizedJitiAliasMapByInput.get(aliasMap);
	if (cachedByInput) return cachedByInput;
	const cacheKey = createJitiAliasContentCacheKey(aliasMap);
	const cached = normalizedJitiAliasMapCache.get(cacheKey);
	if (cached) {
		normalizedJitiAliasMapByInput.set(aliasMap, cached);
		return cached;
	}
	const aliasDepth = /* @__PURE__ */ new Map();
	const getAliasDepth = (key) => {
		const cachedDepth = aliasDepth.get(key);
		if (cachedDepth !== void 0) return cachedDepth;
		const depth = key.split("/").length;
		aliasDepth.set(key, depth);
		return depth;
	};
	const normalizedAliasMap = Object.fromEntries(Object.entries(aliasMap).toSorted(([left], [right]) => getAliasDepth(right) - getAliasDepth(left)));
	const aliasKeys = Object.keys(normalizedAliasMap);
	for (const aliasKey of aliasKeys) {
		const target = normalizedAliasMap[aliasKey];
		if (!target || isConcreteJitiAliasTarget(target)) continue;
		const resolvedTarget = resolveJitiAliasTarget(aliasKey, aliasKeys, normalizedAliasMap);
		if (resolvedTarget) normalizedAliasMap[aliasKey] = resolvedTarget;
	}
	Object.defineProperty(normalizedAliasMap, JITI_NORMALIZED_ALIAS_SYMBOL, {
		value: true,
		enumerable: false
	});
	normalizedJitiAliasMapCache.set(cacheKey, normalizedAliasMap);
	normalizedJitiAliasMapByInput.set(aliasMap, normalizedAliasMap);
	return normalizedAliasMap;
}
function buildPluginLoaderAliasMapCacheKey(params) {
	const devSourceRoot = resolveDevSourceRootParam(params);
	return [
		params.modulePath,
		params.argv1 ?? "",
		params.moduleUrl ?? "",
		params.pluginSdkResolution,
		process.cwd(),
		devSourceRoot ?? "",
		"production",
		shouldIncludePrivateLocalOnlyPluginSdkSubpaths() ? "private-qa" : "public"
	].join("\0");
}
function buildPluginLoaderModuleConfigCacheKey(params) {
	return [buildPluginLoaderAliasMapCacheKey({
		modulePath: params.modulePath,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl,
		pluginSdkResolution: params.pluginSdkResolution ?? "auto",
		devSourceRoot: params.devSourceRoot
	}), params.preferBuiltDist === true ? "prefer-built-dist" : "default-dist"].join("\0");
}
function buildPluginLoaderAliasMap(modulePath, argv1 = STARTUP_ARGV1, moduleUrl, pluginSdkResolution = "auto", devSourceRoot) {
	const cacheKey = buildPluginLoaderAliasMapCacheKey({
		modulePath,
		argv1,
		moduleUrl,
		pluginSdkResolution,
		devSourceRoot
	});
	const cached = aliasMapCache.get(cacheKey);
	if (cached) return cached;
	const pluginSdkAlias = resolvePluginSdkAliasFile({
		srcFile: "root-alias.cjs",
		distFile: "root-alias.cjs",
		modulePath,
		argv1,
		moduleUrl,
		pluginSdkResolution,
		devSourceRoot
	});
	const extensionApiAlias = resolveExtensionApiAlias({
		modulePath,
		pluginSdkResolution,
		devSourceRoot
	});
	const result = {
		...extensionApiAlias ? { "openclaw/extension-api": normalizeJitiAliasTargetPath(extensionApiAlias) } : {},
		...resolveBundledPluginPackagePublicSurfaceAliasMap({
			modulePath,
			argv1,
			moduleUrl,
			pluginSdkResolution,
			devSourceRoot
		}),
		...resolveWorkspacePackageAliasMap({
			modulePath,
			argv1,
			moduleUrl,
			pluginSdkResolution,
			devSourceRoot
		}),
		...pluginSdkAlias ? Object.fromEntries(PLUGIN_SDK_PACKAGE_NAMES.map((packageName) => [packageName, normalizeJitiAliasTargetPath(pluginSdkAlias)])) : {},
		...Object.fromEntries(Object.entries(resolvePluginSdkScopedAliasMap({
			modulePath,
			argv1,
			moduleUrl,
			pluginSdkResolution,
			devSourceRoot
		})).map(([key, value]) => [key, normalizeJitiAliasTargetPath(value)]))
	};
	aliasMapCache.set(cacheKey, result);
	return result;
}
function resolvePluginRuntimeModulePathWithDiagnostics(params = {}) {
	let modulePath;
	let packageRoot = null;
	const candidates = [];
	try {
		modulePath = resolveLoaderModulePath$1(params);
		const orderedKinds = resolvePluginSdkAliasCandidateOrder({
			modulePath,
			isProduction: true,
			pluginSdkResolution: params.pluginSdkResolution
		});
		packageRoot = resolveDevSourceRootParam(params) ?? resolveLoaderPackageRoot({
			...params,
			modulePath
		});
		if (packageRoot) appendPluginRuntimeModuleCandidates(candidates, packageRoot, orderedKinds);
		else {
			const argv1 = params.argv1 ?? process.argv[1];
			candidates.push(...listAncestorPluginRuntimeModuleCandidates({
				starts: listArgvRuntimeFallbackStartDirs(argv1),
				orderedKinds
			}));
			appendSiblingPluginRuntimeModuleCandidates(candidates, node_path.default.join(node_path.default.dirname(modulePath), "runtime"), orderedKinds);
		}
		const dedupedCandidates = dedupeResolvedPaths(candidates);
		for (const candidate of dedupedCandidates) if (node_fs.default.existsSync(candidate)) return {
			modulePath,
			packageRoot,
			candidates: dedupedCandidates,
			resolvedPath: candidate
		};
	} catch (error) {
		return {
			modulePath,
			packageRoot,
			candidates: dedupeResolvedPaths(candidates),
			resolvedPath: null,
			error: formatResolutionError(error)
		};
	}
	return {
		modulePath,
		packageRoot,
		candidates: dedupeResolvedPaths(candidates),
		resolvedPath: null
	};
}
function buildPluginLoaderJitiOptions(aliasMap, params = {}) {
	const hasAliases = Object.keys(aliasMap).length > 0;
	const jitiAliasMap = hasAliases ? normalizePluginLoaderAliasMapForJiti(aliasMap) : aliasMap;
	return {
		interopDefault: true,
		fsCache: resolvePluginLoaderJitiFsCacheOption(params),
		tryNative: true,
		nativeModules: resolvePluginLoaderJitiNativeModules(),
		extensions: [
			".ts",
			".tsx",
			".mts",
			".cts",
			".mtsx",
			".ctsx",
			".js",
			".mjs",
			".cjs",
			".json"
		],
		...hasAliases ? { alias: jitiAliasMap } : {}
	};
}
function supportsNativeModuleRuntime() {
	return typeof process.versions.bun !== "string";
}
function isBundledPluginDistModulePath(modulePath) {
	return modulePath.replace(/\\/g, "/").includes("/dist/extensions/");
}
function shouldPreferNativeModuleLoad(modulePath) {
	if (!supportsNativeModuleRuntime()) return false;
	switch ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.extname(modulePath))) {
		case ".js":
		case ".mjs":
		case ".cjs":
		case ".json": return true;
		default: return false;
	}
}
function resolvePluginLoaderTryNative(modulePath, options) {
	if (isBundledPluginDistModulePath(modulePath)) return shouldPreferNativeModuleLoad(modulePath);
	return shouldPreferNativeModuleLoad(modulePath) || supportsNativeModuleRuntime() && options?.preferBuiltDist === true && modulePath.includes(`${node_path.default.sep}dist${node_path.default.sep}`);
}
function createPluginLoaderModuleCacheKey(params) {
	const aliasMapKey = pluginLoaderModuleCacheKeyByAliasMap.get(params.aliasMap) ?? createJitiAliasContentCacheKey(params.aliasMap);
	pluginLoaderModuleCacheKeyByAliasMap.set(params.aliasMap, aliasMapKey);
	return `${params.tryNative ? "native" : "transform"}\0${aliasMapKey}`;
}
function resolvePluginLoaderModuleConfig(params) {
	const configCacheKey = buildPluginLoaderModuleConfigCacheKey(params);
	const cached = pluginLoaderModuleConfigCache.get(configCacheKey);
	if (cached) return cached;
	const tryNative = resolvePluginLoaderTryNative(params.modulePath, params.preferBuiltDist ? { preferBuiltDist: true } : {});
	const aliasMap = buildPluginLoaderAliasMap(params.modulePath, params.argv1, params.moduleUrl, params.pluginSdkResolution, params.devSourceRoot);
	const result = {
		tryNative,
		aliasMap,
		cacheKey: createPluginLoaderModuleCacheKey({
			tryNative,
			aliasMap
		})
	};
	pluginLoaderModuleConfigCache.set(configCacheKey, result);
	return result;
}
//#endregion
//#region src/plugins/plugin-sdk-native-resolver.ts
/** Installs native Node resolution aliases so plugins can import the Operator SDK in dev and tests. */
const moduleWithResolver = node_module.default;
const nodeResolveFilenameProperty = "_resolveFilename";
const PLUGIN_SDK_PACKAGE_PREFIXES = ["openclaw/plugin-sdk", "@gabrielvfonseca/plugin-sdk"];
const INTERNAL_CORE_PACKAGE_ALIASES = [
	{
		packageName: "@gabrielvfonseca/markdown-core",
		packageDir: "markdown-core",
		subpaths: [
			["", "index.ts"],
			["code-spans", "code-spans.ts"],
			["fences", "fences.ts"],
			["frontmatter", "frontmatter.ts"],
			["ir", "ir.ts"],
			["render", "render.ts"],
			["render-aware-chunking", "render-aware-chunking.ts"],
			["tables", "tables.ts"],
			["types", "types.ts"]
		]
	},
	{
		packageName: "@gabrielvfonseca/ai",
		packageDir: "ai",
		subpaths: [
			["", "index.ts"],
			["providers", "providers.ts"],
			["diagnostics", node_path.default.join("utils", "diagnostics.ts")],
			["event-stream", node_path.default.join("utils", "event-stream.ts")],
			["types", "types.ts"],
			["validation", "validation.ts"],
			["internal/anthropic", node_path.default.join("internal", "anthropic.ts")],
			["internal/openai", node_path.default.join("internal", "openai.ts")],
			["internal/retry-after", node_path.default.join("internal", "retry-after.ts")],
			["internal/runtime", node_path.default.join("internal", "runtime.ts")],
			["internal/shared", node_path.default.join("internal", "shared.ts")]
		]
	},
	{
		packageName: "@gabrielvfonseca/media-core",
		packageDir: "media-core",
		subpaths: [
			["", "index.ts"],
			["base64", "base64.ts"],
			["constants", "constants.ts"],
			["content-length", "content-length.ts"],
			["file-name", "file-name.ts"],
			["inbound-path-policy", "inbound-path-policy.ts"],
			["inline-image-data-url", "inline-image-data-url.ts"],
			["media-source-url", "media-source-url.ts"],
			["mime", "mime.ts"],
			["read-byte-stream-with-limit", "read-byte-stream-with-limit.ts"]
		]
	},
	{
		packageName: "@gabrielvfonseca/llm-core",
		packageDir: "llm-core",
		subpaths: [
			["", "index.ts"],
			["diagnostics", node_path.default.join("utils", "diagnostics.ts")],
			["event-stream", node_path.default.join("utils", "event-stream.ts")],
			["types", "types.ts"],
			["validation", "validation.ts"]
		]
	}
];
const pluginSdkNativeAliases = /* @__PURE__ */ new Map();
let installed = false;
let previousResolveFilename;
function resolveLoaderModulePath(options) {
	return options.modulePath ?? (0, node_url.fileURLToPath)(options.moduleUrl ?? require("url").pathToFileURL(__filename).href);
}
function isPluginSdkAliasSpecifier(specifier) {
	return PLUGIN_SDK_PACKAGE_PREFIXES.some((prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`));
}
function isNativeLoadableSdkTarget(targetPath) {
	switch (node_path.default.extname(targetPath)) {
		case ".cjs":
		case ".js":
		case ".mjs": return true;
		default: return false;
	}
}
function normalizePathForBoundary(candidate) {
	try {
		return node_fs.default.realpathSync(candidate);
	} catch {
		return node_path.default.resolve(candidate);
	}
}
function findNearestPackageRoot(modulePath) {
	let cursor = node_path.default.dirname(node_path.default.resolve(modulePath));
	for (let i = 0; i < 12; i += 1) {
		if (node_fs.default.existsSync(node_path.default.join(cursor, "package.json"))) return cursor;
		const parent = node_path.default.dirname(cursor);
		if (parent === cursor) break;
		cursor = parent;
	}
	return node_path.default.dirname(node_path.default.resolve(modulePath));
}
function findBundledPluginRoot(modulePath) {
	const resolvedModulePath = normalizePathForBoundary(modulePath);
	const packageRoot = normalizePathForBoundary(resolveLoaderPackageRootFromModulePath(modulePath));
	for (const relativeRoot of [
		"extensions",
		"dist/extensions",
		"dist-runtime/extensions"
	]) {
		const bundledRoot = node_path.default.join(packageRoot, relativeRoot);
		const relative = node_path.default.relative(bundledRoot, resolvedModulePath);
		if (!relative || relative.startsWith("..") || node_path.default.isAbsolute(relative)) continue;
		const [pluginId] = relative.split(node_path.default.sep);
		if (pluginId) return node_path.default.join(bundledRoot, pluginId);
	}
}
function resolveLoaderPackageRootFromModulePath(modulePath) {
	let cursor = node_path.default.dirname(node_path.default.resolve(modulePath));
	for (let i = 0; i < 12; i += 1) {
		const packageJsonPath = node_path.default.join(cursor, "package.json");
		if (node_fs.default.existsSync(packageJsonPath)) try {
			const packageJson = JSON.parse(node_fs.default.readFileSync(packageJsonPath, "utf8"));
			if (packageJson.name === "@gabrielvfonseca/operator" || typeof packageJson.bin === "object" && packageJson.bin !== null && typeof packageJson.bin.operator === "string") return cursor;
		} catch {}
		const parent = node_path.default.dirname(cursor);
		if (parent === cursor) break;
		cursor = parent;
	}
	return findNearestPackageRoot(modulePath);
}
function resolveAllowedParentRoot(modulePath) {
	return findBundledPluginRoot(modulePath) ?? findNearestPackageRoot(modulePath);
}
function resolveAllowedParentRoots(options) {
	const roots = /* @__PURE__ */ new Set();
	if (options.pluginModulePath) roots.add(normalizePathForBoundary(resolveAllowedParentRoot(options.pluginModulePath)));
	for (const root of options.allowedParentRoots ?? []) roots.add(normalizePathForBoundary(root));
	return [...roots];
}
function isWithinRoot(candidate, root) {
	const relative = node_path.default.relative(root, normalizePathForBoundary(candidate));
	return relative === "" || !relative.startsWith("..") && !node_path.default.isAbsolute(relative);
}
function resolveAliasTargetForParent(request, parent) {
	return resolveAliasTargetForParentPath(request, parent?.filename);
}
function resolveAliasTargetForParentUrl(request, parentUrl) {
	if (!parentUrl?.startsWith("file:")) return;
	try {
		return resolveAliasTargetForParentPath(request, (0, node_url.fileURLToPath)(parentUrl));
	} catch {
		return;
	}
}
function resolveAliasTargetForParentPath(request, parentFilename) {
	const entries = pluginSdkNativeAliases.get(request);
	if (!entries || !parentFilename) return;
	return entries.find((entry) => isWithinRoot(parentFilename, entry.parentRoot))?.target;
}
function listPluginSdkNativeAliases(options) {
	const modulePath = options.pluginModulePath ?? resolveLoaderModulePath(options);
	return Object.entries(buildPluginLoaderAliasMap(modulePath, options.argv1 ?? process.argv[1], options.moduleUrl, "dist", options.devSourceRoot)).filter(([specifier]) => isPluginSdkAliasSpecifier(specifier)).filter(([, target]) => isNativeLoadableSdkTarget(target)).flatMap(([specifier, target]) => {
		if (specifier.endsWith(".js")) return [[specifier, target]];
		return [[specifier, target], [`${specifier}.js`, target]];
	});
}
function listInternalCorePackageNativeAliases(options) {
	const packageRoot = resolveLoaderPackageRootFromModulePath(resolveLoaderModulePath(options));
	const parentRoots = [
		"src",
		"scripts",
		"packages",
		"test"
	].map((segment) => node_path.default.join(packageRoot, segment)).filter((candidate) => node_fs.default.existsSync(candidate)).map(normalizePathForBoundary);
	if (parentRoots.length === 0) return [];
	const aliases = [];
	const internalCorePackageAliases = [...INTERNAL_CORE_PACKAGE_ALIASES, ...["normalization-core", "acp-core"].map((packageDir) => ({
		packageName: `@gabrielvfonseca/${packageDir}`,
		packageDir,
		subpaths: listWorkspacePackageExportAliasEntries({
			packageRoot,
			packageName: `@gabrielvfonseca/${packageDir}`,
			packageDir
		}).map((entry) => [entry.subpath, entry.srcFile])
	}))];
	for (const entry of internalCorePackageAliases) for (const [subpath, srcFile] of entry.subpaths) {
		const request = subpath ? `${entry.packageName}/${subpath}` : entry.packageName;
		const target = node_path.default.join(packageRoot, "packages", entry.packageDir, "src", srcFile);
		if (node_fs.default.existsSync(target)) aliases.push({
			request,
			target,
			parentRoots
		});
	}
	return aliases;
}
function installResolver() {
	if (installed || !moduleWithResolver[nodeResolveFilenameProperty]) return;
	previousResolveFilename = moduleWithResolver[nodeResolveFilenameProperty];
	moduleWithResolver[nodeResolveFilenameProperty] = ((request, parent, isMain, options) => {
		const aliasTarget = resolveAliasTargetForParent(request, parent);
		if (aliasTarget) return aliasTarget;
		return previousResolveFilename?.(request, parent, isMain, options) ?? request;
	});
	moduleWithResolver.registerHooks?.({ resolve(specifier, context, nextResolve) {
		const aliasTarget = resolveAliasTargetForParentUrl(specifier, context.parentURL);
		if (aliasTarget) return {
			shortCircuit: true,
			url: (0, node_url.pathToFileURL)(aliasTarget).href
		};
		return nextResolve(specifier, context);
	} });
	installed = true;
}
function registerNativeAlias(params) {
	const entries = pluginSdkNativeAliases.get(params.request) ?? [];
	for (const parentRoot of params.parentRoots) {
		const existingIndex = entries.findIndex((entry) => entry.parentRoot === parentRoot);
		if (existingIndex !== -1) {
			entries[existingIndex] = {
				parentRoot,
				target: params.target
			};
			continue;
		}
		entries.push({
			parentRoot,
			target: params.target
		});
	}
	if (entries.length > 0) pluginSdkNativeAliases.set(params.request, entries);
}
function clearNativeAliasesForParentRoots(parentRoots) {
	if (parentRoots.length === 0) return;
	const parentRootSet = new Set(parentRoots);
	for (const [request, entries] of pluginSdkNativeAliases) {
		const nextEntries = entries.filter((entry) => !parentRootSet.has(entry.parentRoot));
		if (nextEntries.length === 0) pluginSdkNativeAliases.delete(request);
		else pluginSdkNativeAliases.set(request, nextEntries);
	}
}
function installOperatorPluginSdkNativeResolver(options = {}) {
	const parentRoots = resolveAllowedParentRoots(options);
	clearNativeAliasesForParentRoots(parentRoots);
	for (const [specifier, target] of listPluginSdkNativeAliases(options)) registerNativeAlias({
		request: specifier,
		target,
		parentRoots
	});
	for (const alias of listInternalCorePackageNativeAliases(options)) registerNativeAlias(alias);
	installResolver();
	return [...pluginSdkNativeAliases.keys()].toSorted();
}
function installOperatorInternalCorePackageNativeResolver(options = {}) {
	for (const alias of listInternalCorePackageNativeAliases(options)) registerNativeAlias(alias);
	installResolver();
	return [...pluginSdkNativeAliases.keys()].toSorted();
}
//#endregion
//#region src/plugins/plugin-module-loader-cache.ts
/** Caches plugin module loaders and native-load stats for runtime/source module imports. */
const DEFAULT_PLUGIN_MODULE_LOADER_CACHE_ENTRIES = 128;
const MAX_TRACKED_SOURCE_TRANSFORM_TARGETS = 24;
const requireForJiti = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
let createJitiLoaderFactory;
const pluginModuleLoaderStats = {
	calls: 0,
	nativeHits: 0,
	nativeMisses: 0,
	sourceTransformForced: 0,
	sourceTransformFallbacks: 0,
	sourceTransformTargets: /* @__PURE__ */ new Map()
};
function recordSourceTransformTarget(target) {
	const current = pluginModuleLoaderStats.sourceTransformTargets.get(target) ?? 0;
	pluginModuleLoaderStats.sourceTransformTargets.set(target, current + 1);
	if (pluginModuleLoaderStats.sourceTransformTargets.size <= MAX_TRACKED_SOURCE_TRANSFORM_TARGETS) return;
	let leastUsedTarget;
	let leastUsedCount = Number.POSITIVE_INFINITY;
	for (const [candidate, count] of pluginModuleLoaderStats.sourceTransformTargets) if (count < leastUsedCount) {
		leastUsedTarget = candidate;
		leastUsedCount = count;
	}
	if (leastUsedTarget) pluginModuleLoaderStats.sourceTransformTargets.delete(leastUsedTarget);
}
/** Returns process-local plugin module loader stats for diagnostics and tests. */
function getPluginModuleLoaderStats() {
	return {
		calls: pluginModuleLoaderStats.calls,
		nativeHits: pluginModuleLoaderStats.nativeHits,
		nativeMisses: pluginModuleLoaderStats.nativeMisses,
		sourceTransformForced: pluginModuleLoaderStats.sourceTransformForced,
		sourceTransformFallbacks: pluginModuleLoaderStats.sourceTransformFallbacks,
		topSourceTransformTargets: [...pluginModuleLoaderStats.sourceTransformTargets].toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 8).map(([target, count]) => ({
			target,
			count
		}))
	};
}
function loadCreateJitiLoaderFactory() {
	if (createJitiLoaderFactory) return createJitiLoaderFactory;
	const loaded = requireForJiti("jiti");
	if (typeof loaded.createJiti !== "function") throw new Error("jiti module did not export createJiti");
	createJitiLoaderFactory = loaded.createJiti;
	return createJitiLoaderFactory;
}
function createPluginModuleLoaderCache(maxEntries = DEFAULT_PLUGIN_MODULE_LOADER_CACHE_ENTRIES) {
	return new require_plugin_cache_primitives.PluginLruCache(maxEntries);
}
function toSourceTransformImportPath(specifier) {
	if (process.platform === "win32" && node_path.default.isAbsolute(specifier)) return (0, node_url.pathToFileURL)(specifier).href;
	return toSafeImportPath(specifier);
}
function resolveDefaultPluginModuleLoaderConfig(params) {
	return resolvePluginLoaderModuleConfig({
		modulePath: params.modulePath,
		argv1: params.argvEntry ?? process.argv[1],
		moduleUrl: params.importerUrl,
		devSourceRoot: params.devSourceRoot,
		...params.preferBuiltDist ? { preferBuiltDist: true } : {},
		...params.pluginSdkResolution ? { pluginSdkResolution: params.pluginSdkResolution } : {}
	});
}
function resolvePluginModuleLoaderCacheEntry(params) {
	const loaderFilename = toSafeImportPath(params.loaderFilename ?? params.modulePath);
	const hasAliasOverride = Boolean(params.aliasMap);
	const hasTryNativeOverride = typeof params.tryNative === "boolean";
	const defaultConfig = hasAliasOverride || hasTryNativeOverride ? resolveDefaultPluginModuleLoaderConfig(params) : null;
	const canReuseDefaultCacheKey = defaultConfig !== null && (!hasAliasOverride || params.aliasMap === defaultConfig.aliasMap) && (!hasTryNativeOverride || params.tryNative === defaultConfig.tryNative);
	const resolved = defaultConfig ? {
		tryNative: params.tryNative ?? defaultConfig.tryNative,
		aliasMap: params.aliasMap ?? defaultConfig.aliasMap,
		cacheKey: canReuseDefaultCacheKey ? defaultConfig.cacheKey : void 0
	} : resolveDefaultPluginModuleLoaderConfig(params);
	const { tryNative, aliasMap } = resolved;
	const moduleConfigCacheKey = resolved.cacheKey ?? createPluginLoaderModuleCacheKey({
		tryNative,
		aliasMap
	});
	const transformOperatorDependencies = params.transformOperatorDependencies ?? tryNative;
	const cacheKey = `${moduleConfigCacheKey}\0transform-openclaw=${transformOperatorDependencies ? "1" : "0"}`;
	return {
		loaderFilename,
		aliasMap,
		tryNative,
		transformOperatorDependencies,
		cacheKey,
		scopedCacheKey: `${loaderFilename}::${params.sharedCacheScopeKey ?? (params.cacheScopeKey ? `${params.cacheScopeKey}::${cacheKey}` : cacheKey)}`
	};
}
function createLazySourceTransformLoader(params) {
	let loadWithSourceTransform;
	return () => {
		if (loadWithSourceTransform) return loadWithSourceTransform;
		const jitiOptions = buildPluginLoaderJitiOptions(params.aliasMap, { modulePath: params.loaderFilename });
		const jitiLoader = (params.createLoader ?? loadCreateJitiLoaderFactory())(params.loaderFilename, {
			...jitiOptions,
			nativeModules: params.transformOperatorDependencies ? jitiOptions.nativeModules.filter((moduleName) => moduleName !== "@gabrielvfonseca/operator") : jitiOptions.nativeModules,
			tryNative: false
		});
		loadWithSourceTransform = (target) => jitiLoader(toSourceTransformImportPath(target));
		return loadWithSourceTransform;
	};
}
function createPluginModuleLoader(params) {
	const getLoadWithSourceTransform = createLazySourceTransformLoader({ ...params });
	const loadedTargetExports = /* @__PURE__ */ new Map();
	const loadCachedTarget = (target, load) => {
		if (loadedTargetExports.has(target)) return loadedTargetExports.get(target);
		const loaded = load();
		loadedTargetExports.set(target, loaded);
		return loaded;
	};
	if (!params.tryNative) return (target) => loadCachedTarget(target, () => {
		pluginModuleLoaderStats.calls += 1;
		pluginModuleLoaderStats.sourceTransformForced += 1;
		recordSourceTransformTarget(target);
		return getLoadWithSourceTransform()(target);
	});
	return (target) => loadCachedTarget(target, () => {
		pluginModuleLoaderStats.calls += 1;
		const native = tryNativeRequireJavaScriptModule(target, {
			allowWindows: true,
			aliasMap: params.aliasMap,
			fallbackOnMissingDependency: true,
			fallbackOnNativeError: true
		});
		if (native.ok) {
			pluginModuleLoaderStats.nativeHits += 1;
			return native.moduleExport;
		}
		pluginModuleLoaderStats.nativeMisses += 1;
		pluginModuleLoaderStats.sourceTransformFallbacks += 1;
		recordSourceTransformTarget(target);
		return getLoadWithSourceTransform()(target);
	});
}
function getCachedPluginModuleLoader(params) {
	installOperatorInternalCorePackageNativeResolver({ moduleUrl: params.importerUrl });
	const cacheEntry = resolvePluginModuleLoaderCacheEntry(params);
	const cached = params.cache.get(cacheEntry.scopedCacheKey);
	if (cached) return cached;
	const loader = createPluginModuleLoader({
		loaderFilename: cacheEntry.loaderFilename,
		aliasMap: cacheEntry.aliasMap,
		tryNative: cacheEntry.tryNative,
		transformOperatorDependencies: cacheEntry.transformOperatorDependencies,
		...params.createLoader ? { createLoader: params.createLoader } : {}
	});
	params.cache.set(cacheEntry.scopedCacheKey, loader);
	return loader;
}
function getCachedPluginSourceModuleLoader(params) {
	return getCachedPluginModuleLoader({
		...params,
		tryNative: false
	});
}
//#endregion
Object.defineProperty(exports, "buildPluginLoaderAliasMap", {
	enumerable: true,
	get: function() {
		return buildPluginLoaderAliasMap;
	}
});
Object.defineProperty(exports, "buildPluginLoaderJitiOptions", {
	enumerable: true,
	get: function() {
		return buildPluginLoaderJitiOptions;
	}
});
Object.defineProperty(exports, "clearNativeRequireJavaScriptModuleCache", {
	enumerable: true,
	get: function() {
		return clearNativeRequireJavaScriptModuleCache;
	}
});
Object.defineProperty(exports, "createPluginModuleLoaderCache", {
	enumerable: true,
	get: function() {
		return createPluginModuleLoaderCache;
	}
});
Object.defineProperty(exports, "getCachedPluginModuleLoader", {
	enumerable: true,
	get: function() {
		return getCachedPluginModuleLoader;
	}
});
Object.defineProperty(exports, "getCachedPluginSourceModuleLoader", {
	enumerable: true,
	get: function() {
		return getCachedPluginSourceModuleLoader;
	}
});
Object.defineProperty(exports, "getPluginModuleLoaderStats", {
	enumerable: true,
	get: function() {
		return getPluginModuleLoaderStats;
	}
});
Object.defineProperty(exports, "installOperatorInternalCorePackageNativeResolver", {
	enumerable: true,
	get: function() {
		return installOperatorInternalCorePackageNativeResolver;
	}
});
Object.defineProperty(exports, "installOperatorPluginSdkNativeResolver", {
	enumerable: true,
	get: function() {
		return installOperatorPluginSdkNativeResolver;
	}
});
Object.defineProperty(exports, "isJavaScriptModulePath", {
	enumerable: true,
	get: function() {
		return isJavaScriptModulePath;
	}
});
Object.defineProperty(exports, "resolveLoaderPackageRoot", {
	enumerable: true,
	get: function() {
		return resolveLoaderPackageRoot;
	}
});
Object.defineProperty(exports, "resolvePluginLoaderTryNative", {
	enumerable: true,
	get: function() {
		return resolvePluginLoaderTryNative;
	}
});
Object.defineProperty(exports, "resolvePluginRuntimeModulePathWithDiagnostics", {
	enumerable: true,
	get: function() {
		return resolvePluginRuntimeModulePathWithDiagnostics;
	}
});
Object.defineProperty(exports, "shouldPreferNativeModuleLoad", {
	enumerable: true,
	get: function() {
		return shouldPreferNativeModuleLoad;
	}
});
Object.defineProperty(exports, "toSafeImportPath", {
	enumerable: true,
	get: function() {
		return toSafeImportPath;
	}
});
Object.defineProperty(exports, "tryNativeRequireJavaScriptModule", {
	enumerable: true,
	get: function() {
		return tryNativeRequireJavaScriptModule;
	}
});
