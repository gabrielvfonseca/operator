const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./path-safety-m1VY3jod.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_bundle_manifest = require("./bundle-manifest-DNijUZc1.cjs");
const require_hardlink_policy = require("./hardlink-policy-6OYvPgP1.cjs");
const require_package_entry_resolution = require("./package-entry-resolution-VwWE-qTF.cjs");
const require_roots = require("./roots-5HJCnp4q.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/bundled-load-path-aliases.ts
const PACKAGED_BUNDLED_ROOTS = [node_path.default.join("dist", "extensions"), node_path.default.join("dist-runtime", "extensions")];
/** Normalizes bundled lookup paths without preserving trailing separators. */
function normalizeBundledLookupPath(targetPath) {
	const normalized = node_path.default.normalize(targetPath);
	const root = node_path.default.parse(normalized).root;
	let trimmed = normalized;
	while (trimmed.length > root.length && (trimmed.endsWith(node_path.default.sep) || trimmed.endsWith("/"))) trimmed = trimmed.slice(0, -1);
	return trimmed;
}
function findPackagedBundledRoot(localPath) {
	const normalized = normalizeBundledLookupPath(localPath);
	for (const packagedRoot of PACKAGED_BUNDLED_ROOTS) {
		const marker = `${node_path.default.sep}${packagedRoot}`;
		const markerIndex = normalized.lastIndexOf(marker);
		if (markerIndex === -1) continue;
		const markerEnd = markerIndex + marker.length;
		if (normalized.length !== markerEnd && normalized[markerEnd] !== node_path.default.sep) continue;
		return {
			packageRoot: normalized.slice(0, markerIndex),
			bundledRoot: normalized.slice(0, markerEnd)
		};
	}
	return null;
}
/** Parses a path under a packaged bundled plugin root. */
function parsePackagedBundledPluginPath(localPath) {
	const packaged = findPackagedBundledRoot(localPath);
	if (!packaged) return null;
	const normalized = normalizeBundledLookupPath(localPath);
	if (normalized === packaged.bundledRoot) return null;
	return {
		...packaged,
		bundledLeaf: normalized.slice(packaged.bundledRoot.length + node_path.default.sep.length)
	};
}
/** Builds the legacy extensions-root alias for a packaged bundled plugin path. */
function buildLegacyBundledPath(localPath) {
	const packaged = parsePackagedBundledPluginPath(localPath);
	if (!packaged) return null;
	return node_path.default.join(packaged.packageRoot, "extensions", packaged.bundledLeaf);
}
/** Builds the legacy extensions root for a packaged bundled plugin root. */
function buildLegacyBundledRootPath(localPath) {
	const packaged = findPackagedBundledRoot(localPath);
	return packaged ? node_path.default.join(packaged.packageRoot, "extensions") : null;
}
/** Parses a path under the legacy bundled extensions root. */
function parseLegacyBundledPluginPath(localPath) {
	const normalized = normalizeBundledLookupPath(localPath);
	const marker = `${node_path.default.sep}extensions`;
	const markerIndex = normalized.lastIndexOf(marker);
	if (markerIndex === -1) return null;
	const markerEnd = markerIndex + marker.length;
	if (normalized.length === markerEnd || normalized[markerEnd] !== node_path.default.sep) return null;
	return {
		packageRoot: normalized.slice(0, markerIndex),
		legacyRoot: normalized.slice(0, markerEnd),
		bundledLeaf: normalized.slice(markerEnd + node_path.default.sep.length)
	};
}
/** Builds current and legacy aliases for a packaged bundled plugin path. */
function buildBundledPluginLoadPathAliases(localPath) {
	const legacyPath = buildLegacyBundledPath(localPath);
	if (!legacyPath) return [];
	return [{
		kind: "current",
		path: localPath
	}, {
		kind: "legacy",
		path: legacyPath
	}];
}
function isSameOrInside(baseDir, targetPath) {
	const base = node_path.default.resolve(normalizeBundledLookupPath(baseDir));
	const target = node_path.default.resolve(normalizeBundledLookupPath(targetPath));
	return target === base || (0, _openclaw_fs_safe_path.isPathInside)(base, target);
}
/** Classifies a load path as current or legacy for a packaged bundled plugin root. */
function resolvePackagedBundledLoadPathAlias(params) {
	if (!params.bundledRoot) return null;
	const packaged = findPackagedBundledRoot(params.bundledRoot);
	if (!packaged) return null;
	const legacyRoot = node_path.default.join(packaged.packageRoot, "extensions");
	if (isSameOrInside(params.bundledRoot, params.loadPath)) return {
		kind: "current",
		path: params.loadPath
	};
	if (isSameOrInside(legacyRoot, params.loadPath)) return {
		kind: "legacy",
		path: params.loadPath
	};
	return null;
}
//#endregion
//#region src/plugins/bundled-source-overlays.ts
function decodeMountInfoPath(value) {
	return value.replace(/\\([0-7]{3})/g, (_match, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}
/** Parses Linux mountinfo content into absolute mount points. */
function parseLinuxMountInfoMountPoints(mountInfo) {
	const mountPoints = /* @__PURE__ */ new Set();
	for (const line of mountInfo.split(/\r?\n/u)) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const mountPoint = trimmed.split(" ")[4];
		if (!mountPoint) continue;
		mountPoints.add(node_path.default.resolve(decodeMountInfoPath(mountPoint)));
	}
	return mountPoints;
}
function readLinuxMountPoints() {
	try {
		return parseLinuxMountInfoMountPoints(node_fs.default.readFileSync("/proc/self/mountinfo", "utf8"));
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function isFilesystemMountPoint(targetPath) {
	try {
		const target = node_fs.default.statSync(targetPath);
		const parent = node_fs.default.statSync(node_path.default.dirname(targetPath));
		return target.dev !== parent.dev || target.ino === parent.ino;
	} catch {
		return false;
	}
}
function sourceOverlaysDisabled(env) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(env.OPERATOR_DISABLE_BUNDLED_SOURCE_OVERLAYS);
	return raw === "1" || raw === "true";
}
/** True when a path appears to be a mounted bundled source overlay. */
function isBundledSourceOverlayPath(params) {
	const resolved = node_path.default.resolve(params.sourcePath);
	return (params.mountPoints ?? readLinuxMountPoints()).has(resolved) || isFilesystemMountPoint(resolved);
}
/** Lists source overlay directories that shadow packaged bundled plugin dirs. */
function listBundledSourceOverlayDirs(params) {
	if (sourceOverlaysDisabled(params.env ?? process.env) || !params.bundledRoot) return [];
	const legacyRoot = buildLegacyBundledRootPath(params.bundledRoot);
	if (!legacyRoot || !node_fs.default.existsSync(legacyRoot)) return [];
	let entries;
	try {
		entries = node_fs.default.readdirSync(legacyRoot, { withFileTypes: true });
	} catch {
		return [];
	}
	const mountPoints = params.mountPoints ?? readLinuxMountPoints();
	const legacyRootMounted = isBundledSourceOverlayPath({
		sourcePath: legacyRoot,
		mountPoints
	});
	const overlayDirs = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const sourceDir = node_path.default.join(legacyRoot, entry.name);
		const bundledPeer = node_path.default.join(params.bundledRoot, entry.name);
		if (!node_fs.default.existsSync(bundledPeer)) continue;
		if (!legacyRootMounted && !isBundledSourceOverlayPath({
			sourcePath: sourceDir,
			mountPoints
		})) continue;
		overlayDirs.push(sourceDir);
	}
	return overlayDirs.toSorted((left, right) => left.localeCompare(right));
}
//#endregion
//#region src/plugins/legacy-npm-declaration.ts
/** Reads legacy npm plugin declaration files left by early plugin installs. */
/** Legacy declaration filename used by early npm-backed plugin installs. */
const LEGACY_NPM_DECLARATION_FILE = "operator.extension.json";
/** Reads a legacy npm plugin declaration when a plugin directory still has one. */
function readLegacyNpmPluginDeclaration(pluginDir) {
	const source = node_path.default.join(pluginDir, LEGACY_NPM_DECLARATION_FILE);
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(source);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || parsed.type !== "npm") return null;
	const pluginId = typeof parsed.name === "string" ? parsed.name.trim() : "";
	const npmSpec = typeof parsed.npmSpec === "string" ? parsed.npmSpec.trim() : "";
	if (!pluginId || require_install_paths.validatePluginId(pluginId) || !require_npm_registry_spec.parseRegistryNpmSpec(npmSpec)) return null;
	return {
		pluginId,
		npmSpec,
		source
	};
}
//#endregion
//#region src/plugins/plugin-lifecycle-trace.ts
/** Checks the opt-in plugin lifecycle tracing environment flag. */
function isPluginLifecycleTraceEnabled() {
	const raw = process.env.OPERATOR_PLUGIN_LIFECYCLE_TRACE?.trim().toLowerCase();
	return raw === "1" || raw === "true" || raw === "yes";
}
function formatTraceValue(value) {
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return JSON.stringify(value);
}
function emitPluginLifecycleTrace(params) {
	const elapsedMs = Number(process.hrtime.bigint() - params.start) / 1e6;
	const detailText = Object.entries(params.details ?? {}).filter((entry) => entry[1] !== void 0).map(([key, value]) => `${key}=${formatTraceValue(value)}`).join(" ");
	const suffix = detailText ? ` ${detailText}` : "";
	console.error(`[plugins:lifecycle] phase=${JSON.stringify(params.phase)} ms=${elapsedMs.toFixed(2)} status=${params.status}${suffix}`);
}
/** Traces a synchronous plugin lifecycle phase when tracing is enabled. */
function tracePluginLifecyclePhase(phase, fn, details) {
	if (!isPluginLifecycleTraceEnabled()) return fn();
	const start = process.hrtime.bigint();
	let status;
	try {
		const result = fn();
		status = "ok";
		return result;
	} catch (error) {
		status = "error";
		throw error;
	} finally {
		emitPluginLifecycleTrace({
			phase,
			start,
			status: status ?? "error",
			details
		});
	}
}
/** Traces an async plugin lifecycle phase when tracing is enabled. */
async function tracePluginLifecyclePhaseAsync(phase, fn, details) {
	if (!isPluginLifecycleTraceEnabled()) return fn();
	const start = process.hrtime.bigint();
	let status;
	try {
		const result = await fn();
		status = "ok";
		return result;
	} catch (error) {
		status = "error";
		throw error;
	} finally {
		emitPluginLifecycleTrace({
			phase,
			start,
			status: status ?? "error",
			details
		});
	}
}
//#endregion
//#region src/plugins/status-dependencies-core.ts
function normalizeDependencyMap(raw) {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	const normalized = {};
	for (const [name, spec] of Object.entries(raw)) {
		const normalizedName = name.trim();
		if (!normalizedName || typeof spec !== "string" || !spec.trim()) continue;
		normalized[normalizedName] = spec.trim();
	}
	return normalized;
}
/** Normalizes raw package dependency maps into sorted plugin dependency specs. */
function normalizePluginDependencySpecs(params) {
	return {
		dependencies: normalizeDependencyMap(params.dependencies),
		optionalDependencies: normalizeDependencyMap(params.optionalDependencies)
	};
}
function dependencyPathSegments(name) {
	const segments = name.split("/");
	if (segments.length === 1 && segments[0]) return [segments[0]];
	if (segments.length === 2 && segments[0]?.startsWith("@") && segments[1]) return segments;
	return null;
}
function findDependencyPackageDir(params) {
	const segments = dependencyPathSegments(params.name);
	if (!segments) return;
	let current = node_path.default.resolve(params.fromDir);
	while (true) {
		const candidate = node_path.default.join(current, "node_modules", ...segments);
		if (node_fs.default.existsSync(candidate)) return candidate;
		const parent = node_path.default.dirname(current);
		if (parent === current) return;
		current = parent;
	}
}
function buildDependencyEntries(params) {
	return Object.entries(params.dependencies).toSorted(([left], [right]) => left.localeCompare(right)).map(([name, spec]) => {
		const resolvedPath = params.rootDir ? findDependencyPackageDir({
			fromDir: params.rootDir,
			name
		}) : void 0;
		const entry = {
			name,
			spec,
			installed: resolvedPath !== void 0,
			optional: params.optional
		};
		if (resolvedPath) entry.resolvedPath = resolvedPath;
		return entry;
	});
}
/** Builds dependency installation status for a plugin package root. */
function buildPluginDependencyStatus(params) {
	const dependencies = buildDependencyEntries({
		rootDir: params.rootDir,
		dependencies: params.dependencies ?? {},
		optional: false
	});
	const optionalDependencies = buildDependencyEntries({
		rootDir: params.rootDir,
		dependencies: params.optionalDependencies ?? {},
		optional: true
	});
	const missing = dependencies.filter((entry) => !entry.installed).map((entry) => entry.name);
	const missingOptional = optionalDependencies.filter((entry) => !entry.installed).map((entry) => entry.name);
	const requiredInstalled = missing.length === 0;
	const optionalInstalled = missingOptional.length === 0;
	return {
		hasDependencies: dependencies.length > 0 || optionalDependencies.length > 0,
		installed: requiredInstalled,
		requiredInstalled,
		optionalInstalled,
		missing,
		missingOptional,
		dependencies,
		optionalDependencies
	};
}
//#endregion
//#region src/plugins/discovery.ts
/** Discovers plugin candidates from bundled, workspace, global, package, and bundle roots. */
const EXTENSION_EXTS = /* @__PURE__ */ new Set([
	".ts",
	".js",
	".mts",
	".cts",
	".mjs",
	".cjs"
]);
const SCANNED_DIRECTORY_IGNORE_NAMES = /* @__PURE__ */ new Set([
	".git",
	".hg",
	".svn",
	".turbo",
	".yarn",
	".yarn-cache",
	"build",
	"coverage",
	"dist",
	"node_modules"
]);
const PACKAGE_MANIFEST_CACHE_MAX_ENTRIES = 512;
const packageManifestProcessCache = /* @__PURE__ */ new Map();
function currentUid(overrideUid) {
	if (overrideUid !== void 0) return overrideUid;
	if (process.platform === "win32") return null;
	if (typeof process.getuid !== "function") return null;
	return process.getuid();
}
function checkSourceEscapesRoot(params) {
	const sourceRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(params.source, params.realpathCache);
	const rootRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(params.rootDir, params.realpathCache);
	if (!sourceRealPath || !rootRealPath) return null;
	if ((0, _openclaw_fs_safe_path.isPathInside)(rootRealPath, sourceRealPath)) return null;
	return {
		reason: "source_escapes_root",
		sourcePath: params.source,
		rootPath: params.rootDir,
		targetPath: params.source,
		sourceRealPath,
		rootRealPath
	};
}
function checkPathStatAndPermissions(params) {
	if (process.platform === "win32") return null;
	const pathsToCheck = [params.rootDir, params.source];
	const seen = /* @__PURE__ */ new Set();
	for (const targetPath of pathsToCheck) {
		const normalized = node_path.default.resolve(targetPath);
		if (seen.has(normalized)) continue;
		seen.add(normalized);
		let stat = (0, _openclaw_fs_safe_path.safeStatSync)(targetPath);
		if (!stat) return {
			reason: "path_stat_failed",
			sourcePath: params.source,
			rootPath: params.rootDir,
			targetPath
		};
		let modeBits = stat.mode & 511;
		if ((modeBits & 2) !== 0 && params.origin === "bundled") try {
			node_fs.default.chmodSync(targetPath, modeBits & -19);
			const repairedStat = (0, _openclaw_fs_safe_path.safeStatSync)(targetPath);
			if (!repairedStat) return {
				reason: "path_stat_failed",
				sourcePath: params.source,
				rootPath: params.rootDir,
				targetPath
			};
			stat = repairedStat;
			modeBits = repairedStat.mode & 511;
		} catch {}
		if ((modeBits & 2) !== 0) return {
			reason: "path_world_writable",
			sourcePath: params.source,
			rootPath: params.rootDir,
			targetPath,
			modeBits
		};
		if (params.origin !== "bundled" && params.uid !== null && typeof stat.uid === "number" && stat.uid !== params.uid && stat.uid !== 0) return {
			reason: "path_suspicious_ownership",
			sourcePath: params.source,
			rootPath: params.rootDir,
			targetPath,
			foundUid: stat.uid,
			expectedUid: params.uid
		};
	}
	return null;
}
function findCandidateBlockIssue(params) {
	const escaped = checkSourceEscapesRoot({
		source: params.source,
		rootDir: params.rootDir,
		realpathCache: params.realpathCache
	});
	if (escaped) return escaped;
	return checkPathStatAndPermissions({
		source: params.source,
		rootDir: params.rootDir,
		origin: params.origin,
		uid: currentUid(params.ownershipUid)
	});
}
function formatCandidateBlockMessage(issue) {
	if (issue.reason === "source_escapes_root") return `blocked plugin candidate: source escapes plugin root (${issue.sourcePath} -> ${issue.sourceRealPath}; root=${issue.rootRealPath})`;
	if (issue.reason === "path_stat_failed") return `blocked plugin candidate: cannot stat path (${issue.targetPath})`;
	if (issue.reason === "path_world_writable") return `blocked plugin candidate: world-writable path (${issue.targetPath}, mode=${(0, _openclaw_fs_safe_advanced.formatPosixMode)(issue.modeBits ?? 0)})`;
	return `blocked plugin candidate: suspicious ownership (${issue.targetPath}, uid=${issue.foundUid}, expected uid=${issue.expectedUid} or root)`;
}
function isUnsafePluginCandidate(params) {
	const issue = findCandidateBlockIssue({
		source: params.source,
		rootDir: params.rootDir,
		origin: params.origin,
		ownershipUid: params.ownershipUid,
		realpathCache: params.realpathCache
	});
	if (!issue) return false;
	params.diagnostics.push({
		level: "warn",
		...params.pluginId ? { pluginId: params.pluginId } : {},
		source: issue.targetPath,
		message: formatCandidateBlockMessage(issue)
	});
	return true;
}
function isExtensionFile(filePath) {
	const ext = node_path.default.extname(filePath);
	if (!EXTENSION_EXTS.has(ext)) return false;
	if (filePath.endsWith(".d.ts")) return false;
	const baseName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(filePath));
	return !baseName.includes(".test.") && !baseName.includes(".live.test.") && !baseName.includes(".e2e.test.");
}
function shouldIgnoreScannedDirectory(dirName) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(dirName);
	if (!normalized) return true;
	if (SCANNED_DIRECTORY_IGNORE_NAMES.has(normalized)) return true;
	if (normalized.endsWith(".bak")) return true;
	if (normalized.includes(".backup-")) return true;
	if (normalized.includes(".disabled")) return true;
	return false;
}
function resolveScannedEntryType(entry, fullPath) {
	if (entry.isFile()) return "file";
	if (entry.isDirectory()) return "directory";
	if (!entry.isSymbolicLink()) return null;
	const stat = (0, _openclaw_fs_safe_path.safeStatSync)(fullPath);
	if (!stat) return null;
	if (stat.isFile()) return "file";
	if (stat.isDirectory()) return "directory";
	return null;
}
function resolvesToSameDirectory(left, right, realpathCache) {
	if (!left || !right) return false;
	const leftRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(left, realpathCache);
	const rightRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(right, realpathCache);
	if (leftRealPath && rightRealPath) return leftRealPath === rightRealPath;
	return node_path.default.resolve(left) === node_path.default.resolve(right);
}
function createDiscoveryResult() {
	return {
		candidates: [],
		diagnostics: []
	};
}
function mergeDiscoveryResult(target, source, seenSources, seenDiagnostics) {
	for (const candidate of source.candidates) {
		const key = candidate.source;
		if (seenSources.has(key)) continue;
		seenSources.add(key);
		target.candidates.push(candidate);
	}
	for (const diagnostic of source.diagnostics) {
		const key = [
			diagnostic.level,
			diagnostic.pluginId ?? "",
			diagnostic.source ?? "",
			diagnostic.message
		].join("\0");
		if (seenDiagnostics.has(key)) continue;
		seenDiagnostics.add(key);
		target.diagnostics.push(diagnostic);
	}
}
function addMissingRequiredPluginDiagnostics(result) {
	const candidateIds = new Set(result.candidates.map((candidate) => candidate.idHint));
	const seen = /* @__PURE__ */ new Set();
	for (const candidate of result.candidates) for (const requiredPluginId of candidate.requiredPluginIds ?? []) {
		if (candidateIds.has(requiredPluginId) || requiredPluginId === candidate.idHint) continue;
		const key = `${candidate.idHint}\0${requiredPluginId}`;
		if (seen.has(key)) continue;
		seen.add(key);
		result.diagnostics.push({
			level: "warn",
			pluginId: candidate.idHint,
			source: candidate.requiredPluginSource ?? candidate.source,
			message: `plugin "${candidate.idHint}" requires plugin "${requiredPluginId}"; install "${requiredPluginId}" to use it`
		});
	}
}
function isLinkedLocalPluginRecord(params) {
	if (params.record.source !== "path") return false;
	if (typeof params.record.sourcePath !== "string" || !params.record.sourcePath.trim() || typeof params.record.installPath !== "string" || !params.record.installPath.trim()) return false;
	return resolvesToSameDirectory(require_home_dir.resolveUserPath(params.record.sourcePath, params.env), require_home_dir.resolveUserPath(params.record.installPath, params.env), params.realpathCache);
}
function collectInstalledPluginRecordPaths(installRecords, env, realpathCache) {
	const paths = [];
	const seen = /* @__PURE__ */ new Set();
	for (const record of Object.values(installRecords ?? {})) {
		const rawPath = typeof record.installPath === "string" && record.installPath.trim() ? record.installPath : typeof record.sourcePath === "string" && record.sourcePath.trim() ? record.sourcePath : void 0;
		if (!rawPath) continue;
		const resolved = require_home_dir.resolveUserPath(rawPath, env);
		if (seen.has(resolved) || !node_fs.default.existsSync(resolved)) continue;
		seen.add(resolved);
		paths.push({
			path: resolved,
			requireBuiltRuntimeEntry: !isLinkedLocalPluginRecord({
				record,
				env,
				realpathCache
			})
		});
	}
	return paths;
}
function collectManagedPluginRecordPaths(installRecords, env) {
	const paths = [];
	const seen = /* @__PURE__ */ new Set();
	for (const record of Object.values(installRecords ?? {})) for (const rawPath of [record.installPath, record.sourcePath]) {
		if (typeof rawPath !== "string" || !rawPath.trim()) continue;
		const resolved = require_home_dir.resolveUserPath(rawPath, env);
		if (seen.has(resolved) || !node_fs.default.existsSync(resolved)) continue;
		seen.add(resolved);
		paths.push(resolved);
	}
	return paths;
}
function resolveManagedPluginDirKey(installedPath, realpathCache) {
	const stat = (0, _openclaw_fs_safe_path.safeStatSync)(installedPath);
	if (!stat) return null;
	const pluginDir = stat.isFile() ? node_path.default.dirname(installedPath) : installedPath;
	return (0, _openclaw_fs_safe_path.safeRealpathSync)(pluginDir, realpathCache) ?? node_path.default.resolve(pluginDir);
}
function collectManagedPluginDirKeys(installedPaths, realpathCache) {
	const dirs = /* @__PURE__ */ new Set();
	for (const installedPath of installedPaths) {
		const key = resolveManagedPluginDirKey(installedPath, realpathCache);
		if (key) dirs.add(key);
	}
	return dirs;
}
function isManagedPluginDir(params) {
	if (!params.managedPluginDirs || params.managedPluginDirs.size === 0) return false;
	const key = params.realpath ?? (0, _openclaw_fs_safe_path.safeRealpathSync)(params.dir, params.realpathCache) ?? node_path.default.resolve(params.dir);
	return params.managedPluginDirs.has(key);
}
function readPackageManifest(dir, rejectHardlinks = true, rootRealPath) {
	const result = (0, _openclaw_fs_safe_json.readRootJsonObjectSync)({
		rootDir: dir,
		...rootRealPath !== void 0 ? { rootRealPath } : {},
		relativePath: "package.json",
		boundaryLabel: "plugin package directory",
		rejectHardlinks
	});
	return result.ok ? result.value : null;
}
function readTrustedPackageManifest(dir) {
	return (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(dir, "package.json"));
}
function readPackageManifestStat(dir) {
	try {
		const stat = node_fs.default.statSync(node_path.default.join(dir, "package.json"));
		return stat.isFile() ? {
			mtimeMs: stat.mtimeMs,
			size: stat.size
		} : null;
	} catch {
		return null;
	}
}
function prunePackageManifestProcessCache() {
	while (packageManifestProcessCache.size > PACKAGE_MANIFEST_CACHE_MAX_ENTRIES) {
		const oldest = packageManifestProcessCache.keys().next().value;
		if (oldest === void 0) return;
		packageManifestProcessCache.delete(oldest);
	}
}
function readCandidatePackageManifest(params) {
	const cacheKey = `${params.origin === "bundled" ? "trusted" : params.rejectHardlinks ? "external-reject" : "external-allow"}:${params.rootRealPath ?? node_path.default.resolve(params.dir)}`;
	const cached = params.packageManifestCache?.get(cacheKey);
	if (cached !== void 0) return cached;
	const canUseProcessCache = params.origin === "bundled" || !params.rejectHardlinks;
	const manifestStat = readPackageManifestStat(params.dir);
	if (canUseProcessCache && manifestStat !== null) {
		const processCached = packageManifestProcessCache.get(cacheKey);
		if (processCached?.mtimeMs === manifestStat.mtimeMs && processCached.size === manifestStat.size) {
			params.packageManifestCache?.set(cacheKey, processCached.manifest);
			return processCached.manifest;
		}
	}
	const manifest = params.origin === "bundled" ? readTrustedPackageManifest(params.dir) : readPackageManifest(params.dir, params.rejectHardlinks, params.rootRealPath);
	params.packageManifestCache?.set(cacheKey, manifest);
	if (canUseProcessCache && manifestStat !== null) {
		packageManifestProcessCache.set(cacheKey, {
			...manifestStat,
			manifest
		});
		prunePackageManifestProcessCache();
	}
	return manifest;
}
function deriveIdHint(params) {
	const base = node_path.default.basename(params.filePath, node_path.default.extname(params.filePath));
	const rawManifestId = params.manifestId?.trim();
	if (rawManifestId) return params.hasMultipleExtensions ? `${rawManifestId}/${base}` : rawManifestId;
	const rawPackageName = params.packageName?.trim();
	if (!rawPackageName) return base;
	const unscoped = rawPackageName.includes("/") ? rawPackageName.split("/").pop() ?? rawPackageName : rawPackageName;
	const normalizedPackageId = unscoped.endsWith("-provider") && unscoped.length > 9 ? unscoped.slice(0, -9) : unscoped.endsWith("-plugin") && unscoped.length > 7 ? unscoped.slice(0, -7) : unscoped;
	if (!params.hasMultipleExtensions) return normalizedPackageId;
	return `${normalizedPackageId}/${base}`;
}
function derivePackagePluginIdHint(params) {
	const rawManifestId = params.manifestId?.trim();
	if (rawManifestId) return rawManifestId;
	const rawPackageName = params.packageName?.trim();
	if (!rawPackageName) return;
	const unscoped = rawPackageName.includes("/") ? rawPackageName.split("/").pop() ?? rawPackageName : rawPackageName;
	return unscoped.endsWith("-provider") && unscoped.length > 9 ? unscoped.slice(0, -9) : unscoped;
}
function pushInvalidPackageExtensionDiagnostic(params) {
	if (params.resolution.status === "invalid") {
		params.diagnostics.push({
			level: "error",
			source: params.source,
			message: params.resolution.error
		});
		return true;
	}
	if (params.resolution.status === "empty") {
		params.diagnostics.push({
			level: "error",
			source: params.source,
			message: "package.json operator.extensions is empty"
		});
		return true;
	}
	return false;
}
function resolveCandidateManifest(rootDir, rejectHardlinks, rootRealPath) {
	const manifest = require_manifest.loadPluginManifest(rootDir, rejectHardlinks, rootRealPath);
	return manifest.ok ? {
		manifest: manifest.manifest,
		manifestPath: manifest.manifestPath
	} : void 0;
}
function addCandidate(params) {
	const resolved = node_path.default.resolve(params.source);
	if (params.seen.has(resolved)) return;
	const resolvedRoot = (0, _openclaw_fs_safe_path.safeRealpathSync)(params.rootDir, params.realpathCache) ?? node_path.default.resolve(params.rootDir);
	if (isUnsafePluginCandidate({
		source: resolved,
		rootDir: resolvedRoot,
		origin: params.origin,
		pluginId: params.idHint,
		diagnostics: params.diagnostics,
		ownershipUid: params.ownershipUid,
		realpathCache: params.realpathCache
	})) {
		params.seen.add(resolved);
		return;
	}
	params.seen.add(resolved);
	const manifest = params.manifest ?? null;
	const packageManifest = require_manifest.getPackageManifestMetadata(manifest ?? void 0);
	const packageDependencies = normalizePluginDependencySpecs({
		dependencies: manifest?.dependencies,
		optionalDependencies: manifest?.optionalDependencies
	});
	params.candidates.push({
		idHint: params.idHint,
		source: resolved,
		setupSource: params.setupSource,
		rootDir: resolvedRoot,
		origin: params.origin,
		format: params.format ?? "@gabrielvfonseca/operator",
		bundleFormat: params.bundleFormat,
		workspaceDir: params.workspaceDir,
		packageName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.name),
		packageVersion: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.version),
		packageDescription: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.description),
		packageDir: params.packageDir,
		packageManifest,
		packageDependencies: packageDependencies.dependencies,
		packageOptionalDependencies: packageDependencies.optionalDependencies,
		rawPackageManifest: manifest ?? void 0,
		bundledManifestId: params.bundledManifestId,
		bundledManifest: params.bundledManifest,
		bundledManifestPath: params.bundledManifestPath,
		...params.requiredPluginIds && params.requiredPluginIds.length > 0 ? { requiredPluginIds: params.requiredPluginIds } : {},
		...params.requiredPluginSource ? { requiredPluginSource: params.requiredPluginSource } : {}
	});
}
function discoverBundleInRoot(params) {
	return require_bundle_manifest.withPluginScanExistenceCache(() => {
		const bundleFormat = require_bundle_manifest.detectBundleManifestFormat(params.rootDir);
		if (!bundleFormat) return "none";
		const rootRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(params.rootDir, params.realpathCache) ?? void 0;
		const rejectHardlinks = require_hardlink_policy.shouldRejectHardlinkedPluginFiles({
			origin: params.origin,
			rootDir: params.rootDir,
			env: params.env,
			realpathCache: params.realpathCache
		});
		const bundleManifest = require_bundle_manifest.loadBundleManifest({
			rootDir: params.rootDir,
			...rootRealPath !== void 0 ? { rootRealPath } : {},
			bundleFormat,
			rejectHardlinks
		});
		if (!bundleManifest.ok) {
			params.diagnostics.push({
				level: "error",
				message: bundleManifest.error,
				source: bundleManifest.manifestPath
			});
			return "invalid";
		}
		addCandidate({
			candidates: params.candidates,
			diagnostics: params.diagnostics,
			seen: params.seen,
			idHint: bundleManifest.manifest.id,
			source: params.rootDir,
			rootDir: params.rootDir,
			origin: params.origin,
			format: "bundle",
			bundleFormat,
			ownershipUid: params.ownershipUid,
			workspaceDir: params.workspaceDir,
			manifest: params.manifest,
			packageDir: params.rootDir,
			bundledManifestId: bundleManifest.manifest.id,
			bundledManifestPath: bundleManifest.manifestPath,
			realpathCache: params.realpathCache
		});
		return "added";
	});
}
function addLegacyNpmDeclarationDiagnostic(params) {
	const declaration = readLegacyNpmPluginDeclaration(params.pluginDir);
	if (!declaration) return false;
	params.diagnostics.push({
		level: "warn",
		pluginId: declaration.pluginId,
		source: declaration.source,
		message: `legacy npm plugin declaration ignored for "${declaration.pluginId}"; run "openclaw doctor --fix" to install ${declaration.npmSpec} into the managed plugin root`
	});
	return true;
}
function shouldSkipIncompatiblePackagePluginApi(params) {
	if (params.origin === "bundled") return false;
	const packageManifest = require_manifest.getPackageManifestMetadata(params.manifest ?? void 0);
	const packagePluginApiRangeCheck = require_package_entry_resolution.resolvePackagePluginApiRange(packageManifest);
	if (!packagePluginApiRangeCheck.ok) {
		const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(packageManifest?.plugin?.id) ?? derivePackagePluginIdHint({ packageName: params.manifest?.name });
		params.diagnostics.push({
			level: "warn",
			source: node_path.default.join(params.packageDir, "package.json"),
			message: `invalid package plugin API metadata: ${packagePluginApiRangeCheck.error}; skipping discovery`,
			...pluginId ? { pluginId } : {}
		});
		return true;
	}
	const packagePluginApiRange = packagePluginApiRangeCheck.range;
	if (!packagePluginApiRange) return false;
	const compatibilityHostVersion = require_version.resolveCompatibilityHostVersion(params.env);
	if (require_clawhub.satisfiesPluginApiRange(compatibilityHostVersion, packagePluginApiRange)) return false;
	const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(packageManifest?.plugin?.id) ?? derivePackagePluginIdHint({ packageName: params.manifest?.name });
	params.diagnostics.push({
		level: "warn",
		source: node_path.default.join(params.packageDir, "package.json"),
		message: `plugin requires plugin API ${packagePluginApiRange}, but this host is ${compatibilityHostVersion}; skipping discovery`,
		...pluginId ? { pluginId } : {}
	});
	return true;
}
function discoverInDirectory(params) {
	if (!node_fs.default.existsSync(params.dir)) return;
	const resolvedDir = (0, _openclaw_fs_safe_path.safeRealpathSync)(params.dir, params.realpathCache) ?? node_path.default.resolve(params.dir);
	if (params.recurseDirectories) {
		if (params.visitedDirectories?.has(resolvedDir)) return;
		params.visitedDirectories?.add(resolvedDir);
	}
	let entries;
	try {
		entries = node_fs.default.readdirSync(params.dir, { withFileTypes: true });
	} catch (err) {
		params.diagnostics.push({
			level: "warn",
			message: `failed to read extensions dir: ${params.dir} (${String(err)})`,
			source: params.dir
		});
		return;
	}
	for (const entry of entries) {
		const fullPath = node_path.default.join(params.dir, entry.name);
		const entryType = resolveScannedEntryType(entry, fullPath);
		if (entryType === "file") {
			if (!(params.scanFiles ?? params.origin === "bundled") || !isExtensionFile(fullPath)) continue;
			addCandidate({
				candidates: params.candidates,
				diagnostics: params.diagnostics,
				seen: params.seen,
				idHint: node_path.default.basename(entry.name, node_path.default.extname(entry.name)),
				source: fullPath,
				rootDir: node_path.default.dirname(fullPath),
				origin: params.origin,
				ownershipUid: params.ownershipUid,
				workspaceDir: params.workspaceDir,
				realpathCache: params.realpathCache
			});
			continue;
		}
		if (entryType !== "directory") continue;
		if (params.skipDirectories?.has(entry.name)) continue;
		if (shouldIgnoreScannedDirectory(entry.name)) continue;
		const fullPathRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(fullPath, params.realpathCache) ?? void 0;
		const fullPathDirKey = fullPathRealPath ?? node_path.default.resolve(fullPath);
		if (params.skipRootDirKeys?.has(fullPathDirKey)) continue;
		const requireBuiltRuntimeEntry = params.requireBuiltRuntimeEntry ?? isManagedPluginDir({
			dir: fullPath,
			realpath: fullPathRealPath,
			managedPluginDirs: params.managedPluginDirs,
			realpathCache: params.realpathCache
		});
		const rejectHardlinks = require_hardlink_policy.shouldRejectHardlinkedPluginFiles({
			origin: params.origin,
			rootDir: fullPath,
			env: params.env,
			realpathCache: params.realpathCache
		});
		const manifest = readCandidatePackageManifest({
			dir: fullPath,
			origin: params.origin,
			rejectHardlinks,
			...fullPathRealPath !== void 0 ? { rootRealPath: fullPathRealPath } : {},
			packageManifestCache: params.packageManifestCache
		});
		if (shouldSkipIncompatiblePackagePluginApi({
			origin: params.origin,
			manifest,
			packageDir: fullPath,
			env: params.env,
			diagnostics: params.diagnostics
		})) continue;
		const extensionResolution = require_manifest.resolvePackageExtensionEntries(manifest ?? void 0);
		if (pushInvalidPackageExtensionDiagnostic({
			resolution: extensionResolution,
			source: fullPath,
			diagnostics: params.diagnostics
		})) continue;
		const extensions = extensionResolution.status === "ok" ? extensionResolution.entries : [];
		const candidateManifest = resolveCandidateManifest(fullPath, rejectHardlinks, fullPathRealPath);
		const manifestId = candidateManifest?.manifest.id;
		const setupSource = require_package_entry_resolution.resolvePackageSetupSource({
			packageDir: fullPath,
			...fullPathRealPath !== void 0 ? { packageRootRealPath: fullPathRealPath } : {},
			manifest,
			origin: params.origin,
			requireBuiltRuntimeEntry,
			sourceLabel: fullPath,
			diagnostics: params.diagnostics,
			rejectHardlinks
		});
		if (extensions.length > 0) {
			const resolvedRuntimeSources = require_package_entry_resolution.resolvePackageRuntimeExtensionSources({
				packageDir: fullPath,
				...fullPathRealPath !== void 0 ? { packageRootRealPath: fullPathRealPath } : {},
				manifest,
				extensions,
				origin: params.origin,
				pluginIdHint: derivePackagePluginIdHint({
					manifestId,
					packageName: manifest?.name
				}),
				requireBuiltRuntimeEntry,
				sourceLabel: fullPath,
				diagnostics: params.diagnostics,
				rejectHardlinks
			});
			for (const resolved of resolvedRuntimeSources) addCandidate({
				candidates: params.candidates,
				diagnostics: params.diagnostics,
				seen: params.seen,
				idHint: deriveIdHint({
					filePath: resolved,
					manifestId,
					packageName: manifest?.name,
					hasMultipleExtensions: extensions.length > 1
				}),
				source: resolved,
				...setupSource ? { setupSource } : {},
				rootDir: fullPath,
				origin: params.origin,
				ownershipUid: params.ownershipUid,
				workspaceDir: params.workspaceDir,
				manifest,
				packageDir: fullPath,
				requiredPluginIds: candidateManifest?.manifest.requiresPlugins,
				requiredPluginSource: candidateManifest?.manifestPath,
				realpathCache: params.realpathCache
			});
			continue;
		}
		if (discoverBundleInRoot({
			rootDir: fullPath,
			origin: params.origin,
			env: params.env,
			ownershipUid: params.ownershipUid,
			workspaceDir: params.workspaceDir,
			manifest,
			candidates: params.candidates,
			diagnostics: params.diagnostics,
			seen: params.seen,
			realpathCache: params.realpathCache
		}) === "added") continue;
		const indexFile = [...require_manifest.DEFAULT_PLUGIN_ENTRY_CANDIDATES].map((candidate) => node_path.default.join(fullPath, candidate)).find((candidate) => node_fs.default.existsSync(candidate));
		if (indexFile && isExtensionFile(indexFile)) {
			addCandidate({
				candidates: params.candidates,
				diagnostics: params.diagnostics,
				seen: params.seen,
				idHint: manifestId ?? entry.name,
				source: indexFile,
				...setupSource ? { setupSource } : {},
				rootDir: fullPath,
				origin: params.origin,
				ownershipUid: params.ownershipUid,
				workspaceDir: params.workspaceDir,
				manifest,
				packageDir: fullPath,
				requiredPluginIds: candidateManifest?.manifest.requiresPlugins,
				requiredPluginSource: candidateManifest?.manifestPath,
				realpathCache: params.realpathCache
			});
			continue;
		}
		if (addLegacyNpmDeclarationDiagnostic({
			pluginDir: fullPath,
			diagnostics: params.diagnostics
		})) continue;
		if (params.recurseDirectories) discoverInDirectory({
			...params,
			dir: fullPath
		});
	}
}
function hasDiscoverablePluginTree(pluginsDir) {
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
function isSourceCheckoutExtensionsDir(extensionsDir) {
	const packageRoot = node_path.default.dirname(extensionsDir);
	return node_fs.default.existsSync(node_path.default.join(packageRoot, ".git")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "pnpm-workspace.yaml")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "src")) && node_fs.default.existsSync(extensionsDir) && hasDiscoverablePluginTree(extensionsDir);
}
function resolveBundledSourceCheckoutExtensionsDir(bundledRoot) {
	if (!bundledRoot) return;
	const legacyRoot = buildLegacyBundledRootPath(bundledRoot);
	if (!legacyRoot || !isSourceCheckoutExtensionsDir(legacyRoot)) return;
	return legacyRoot;
}
function readChildDirectoryNames(dir) {
	if (!dir || !node_fs.default.existsSync(dir)) return /* @__PURE__ */ new Set();
	try {
		return new Set(node_fs.default.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name));
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function readBundledDistOptOutDirectoryNames(sourceExtensionsDir) {
	const names = /* @__PURE__ */ new Set();
	if (!sourceExtensionsDir) return names;
	for (const name of readChildDirectoryNames(sourceExtensionsDir)) if (require_manifest.getPackageManifestMetadata(readTrustedPackageManifest(node_path.default.join(sourceExtensionsDir, name)) ?? void 0)?.build?.bundledDist === false) names.add(name);
	return names;
}
function discoverFromPath(params) {
	const resolved = require_home_dir.resolveUserPath(params.rawPath, params.env);
	if (!node_fs.default.existsSync(resolved)) {
		params.diagnostics.push({
			level: "error",
			message: `plugin path not found: ${resolved}`,
			source: resolved
		});
		return;
	}
	const stat = node_fs.default.statSync(resolved);
	if (stat.isFile()) {
		if (!isExtensionFile(resolved)) {
			params.diagnostics.push({
				level: "error",
				message: `plugin path is not a supported file: ${resolved}`,
				source: resolved
			});
			return;
		}
		addCandidate({
			candidates: params.candidates,
			diagnostics: params.diagnostics,
			seen: params.seen,
			idHint: node_path.default.basename(resolved, node_path.default.extname(resolved)),
			source: resolved,
			rootDir: node_path.default.dirname(resolved),
			origin: params.origin,
			ownershipUid: params.ownershipUid,
			workspaceDir: params.workspaceDir,
			realpathCache: params.realpathCache
		});
		return;
	}
	if (stat.isDirectory()) {
		const resolvedRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(resolved, params.realpathCache) ?? void 0;
		const requireBuiltRuntimeEntry = params.requireBuiltRuntimeEntry ?? isManagedPluginDir({
			dir: resolved,
			realpath: resolvedRealPath,
			managedPluginDirs: params.managedPluginDirs,
			realpathCache: params.realpathCache
		});
		const rejectHardlinks = require_hardlink_policy.shouldRejectHardlinkedPluginFiles({
			origin: params.origin,
			rootDir: resolved,
			env: params.env,
			realpathCache: params.realpathCache
		});
		const manifest = readCandidatePackageManifest({
			dir: resolved,
			origin: params.origin,
			rejectHardlinks,
			...resolvedRealPath !== void 0 ? { rootRealPath: resolvedRealPath } : {},
			packageManifestCache: params.packageManifestCache
		});
		if (shouldSkipIncompatiblePackagePluginApi({
			origin: params.origin,
			manifest,
			packageDir: resolved,
			env: params.env,
			diagnostics: params.diagnostics
		})) return;
		const extensionResolution = require_manifest.resolvePackageExtensionEntries(manifest ?? void 0);
		if (pushInvalidPackageExtensionDiagnostic({
			resolution: extensionResolution,
			source: resolved,
			diagnostics: params.diagnostics
		})) return;
		const extensions = extensionResolution.status === "ok" ? extensionResolution.entries : [];
		const candidateManifest = resolveCandidateManifest(resolved, rejectHardlinks, resolvedRealPath);
		const manifestId = candidateManifest?.manifest.id;
		const setupSource = require_package_entry_resolution.resolvePackageSetupSource({
			packageDir: resolved,
			...resolvedRealPath !== void 0 ? { packageRootRealPath: resolvedRealPath } : {},
			manifest,
			origin: params.origin,
			requireBuiltRuntimeEntry,
			sourceLabel: resolved,
			diagnostics: params.diagnostics,
			rejectHardlinks
		});
		if (extensions.length > 0) {
			const resolvedRuntimeSources = require_package_entry_resolution.resolvePackageRuntimeExtensionSources({
				packageDir: resolved,
				...resolvedRealPath !== void 0 ? { packageRootRealPath: resolvedRealPath } : {},
				manifest,
				extensions,
				origin: params.origin,
				pluginIdHint: derivePackagePluginIdHint({
					manifestId,
					packageName: manifest?.name
				}),
				requireBuiltRuntimeEntry,
				sourceLabel: resolved,
				diagnostics: params.diagnostics,
				rejectHardlinks
			});
			for (const source of resolvedRuntimeSources) addCandidate({
				candidates: params.candidates,
				diagnostics: params.diagnostics,
				seen: params.seen,
				idHint: deriveIdHint({
					filePath: source,
					manifestId,
					packageName: manifest?.name,
					hasMultipleExtensions: extensions.length > 1
				}),
				source,
				...setupSource ? { setupSource } : {},
				rootDir: resolved,
				origin: params.origin,
				ownershipUid: params.ownershipUid,
				workspaceDir: params.workspaceDir,
				manifest,
				packageDir: resolved,
				requiredPluginIds: candidateManifest?.manifest.requiresPlugins,
				requiredPluginSource: candidateManifest?.manifestPath,
				realpathCache: params.realpathCache
			});
			return;
		}
		if (discoverBundleInRoot({
			rootDir: resolved,
			origin: params.origin,
			env: params.env,
			ownershipUid: params.ownershipUid,
			workspaceDir: params.workspaceDir,
			manifest,
			candidates: params.candidates,
			diagnostics: params.diagnostics,
			seen: params.seen,
			realpathCache: params.realpathCache
		}) === "added") return;
		const indexFile = [...require_manifest.DEFAULT_PLUGIN_ENTRY_CANDIDATES].map((candidate) => node_path.default.join(resolved, candidate)).find((candidate) => node_fs.default.existsSync(candidate));
		if (indexFile && isExtensionFile(indexFile)) {
			addCandidate({
				candidates: params.candidates,
				diagnostics: params.diagnostics,
				seen: params.seen,
				idHint: manifestId ?? node_path.default.basename(resolved),
				source: indexFile,
				...setupSource ? { setupSource } : {},
				rootDir: resolved,
				origin: params.origin,
				ownershipUid: params.ownershipUid,
				workspaceDir: params.workspaceDir,
				manifest,
				packageDir: resolved,
				requiredPluginIds: candidateManifest?.manifest.requiresPlugins,
				requiredPluginSource: candidateManifest?.manifestPath,
				realpathCache: params.realpathCache
			});
			return;
		}
		if (addLegacyNpmDeclarationDiagnostic({
			pluginDir: resolved,
			diagnostics: params.diagnostics
		})) return;
		discoverInDirectory({
			dir: resolved,
			origin: params.origin,
			env: params.env,
			ownershipUid: params.ownershipUid,
			workspaceDir: params.workspaceDir,
			candidates: params.candidates,
			diagnostics: params.diagnostics,
			seen: params.seen,
			realpathCache: params.realpathCache,
			packageManifestCache: params.packageManifestCache,
			...params.scanFiles !== void 0 || params.origin === "config" ? { scanFiles: params.scanFiles ?? true } : {},
			...params.requireBuiltRuntimeEntry !== void 0 ? { requireBuiltRuntimeEntry: params.requireBuiltRuntimeEntry } : {},
			...params.managedPluginDirs ? { managedPluginDirs: params.managedPluginDirs } : {},
			...params.skipRootDirKeys ? { skipRootDirKeys: params.skipRootDirKeys } : {}
		});
	}
}
function discoverConfiguredPluginLoadPathsInto(params) {
	for (const loadPath of params.loadPaths) {
		if (typeof loadPath !== "string") continue;
		const trimmed = loadPath.trim();
		if (!trimmed) continue;
		const bundledAlias = resolvePackagedBundledLoadPathAlias({
			bundledRoot: params.bundledRoot,
			loadPath: require_home_dir.resolveUserPath(trimmed, params.env)
		});
		if (bundledAlias) {
			params.result.diagnostics.push({
				level: "warn",
				source: trimmed,
				message: `ignored plugins.load.paths entry that points at Operator's ${bundledAlias.kind} bundled plugin directory; remove this redundant path or run openclaw doctor --fix`
			});
			continue;
		}
		discoverFromPath({
			rawPath: trimmed,
			origin: "config",
			ownershipUid: params.ownershipUid,
			workspaceDir: params.workspaceDir,
			env: params.env,
			candidates: params.result.candidates,
			diagnostics: params.result.diagnostics,
			seen: params.seen,
			realpathCache: params.realpathCache,
			packageManifestCache: params.packageManifestCache
		});
	}
}
/** Discovers only explicit plugins.load.paths candidates without scanning shared roots. */
function discoverConfiguredPluginLoadPaths(params) {
	const env = params.env ?? process.env;
	const workspaceDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.workspaceDir);
	const roots = require_roots.resolvePluginSourceRoots({
		workspaceDir: workspaceDir ? require_home_dir.resolveUserPath(workspaceDir, env) : void 0,
		env
	});
	const result = createDiscoveryResult();
	discoverConfiguredPluginLoadPathsInto({
		loadPaths: params.loadPaths,
		bundledRoot: roots.stock,
		ownershipUid: params.ownershipUid,
		workspaceDir,
		env,
		result,
		seen: /* @__PURE__ */ new Set(),
		realpathCache: /* @__PURE__ */ new Map(),
		packageManifestCache: /* @__PURE__ */ new Map()
	});
	return result;
}
function discoverOperatorPlugins(params) {
	const env = params.env ?? process.env;
	const workspaceDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.workspaceDir);
	const workspaceRoot = workspaceDir ? require_home_dir.resolveUserPath(workspaceDir, env) : void 0;
	const roots = require_roots.resolvePluginSourceRoots({
		workspaceDir: workspaceRoot,
		env
	});
	const realpathCache = /* @__PURE__ */ new Map();
	const packageManifestCache = /* @__PURE__ */ new Map();
	const scopedResult = tracePluginLifecyclePhase("discovery scan", () => {
		const result = createDiscoveryResult();
		const seen = /* @__PURE__ */ new Set();
		discoverConfiguredPluginLoadPathsInto({
			loadPaths: params.extraPaths ?? [],
			bundledRoot: roots.stock,
			ownershipUid: params.ownershipUid,
			workspaceDir,
			env,
			result,
			seen,
			realpathCache,
			packageManifestCache
		});
		const workspaceMatchesBundledRoot = resolvesToSameDirectory(workspaceRoot, roots.stock, realpathCache);
		if (roots.workspace && workspaceRoot && !workspaceMatchesBundledRoot) discoverInDirectory({
			dir: roots.workspace,
			origin: "workspace",
			env,
			ownershipUid: params.ownershipUid,
			workspaceDir: workspaceRoot,
			candidates: result.candidates,
			diagnostics: result.diagnostics,
			seen,
			realpathCache,
			packageManifestCache
		});
		return result;
	}, {
		scope: "scoped",
		extraPathCount: params.extraPaths?.length ?? 0
	});
	const sharedResult = tracePluginLifecyclePhase("discovery scan", () => {
		const result = createDiscoveryResult();
		const seen = /* @__PURE__ */ new Set();
		for (const sourceOverlayDir of listBundledSourceOverlayDirs({
			bundledRoot: roots.stock,
			env
		})) {
			discoverFromPath({
				rawPath: sourceOverlayDir,
				origin: "bundled",
				ownershipUid: params.ownershipUid,
				workspaceDir,
				env,
				candidates: result.candidates,
				diagnostics: result.diagnostics,
				seen,
				realpathCache,
				packageManifestCache
			});
			result.diagnostics.push({
				level: "warn",
				source: sourceOverlayDir,
				message: "using bind-mounted bundled plugin source overlay; this source overrides the packaged dist bundle for the same plugin id"
			});
		}
		const sourceCheckoutDependencyDiagnostic = require_bundled_dir.resolveSourceCheckoutDependencyDiagnostic(env);
		if (sourceCheckoutDependencyDiagnostic) result.diagnostics.push({
			level: "warn",
			source: sourceCheckoutDependencyDiagnostic.source,
			message: sourceCheckoutDependencyDiagnostic.message
		});
		const sourceCheckoutExtensionsDir = resolveBundledSourceCheckoutExtensionsDir(roots.stock);
		const bundledDistOptOutDirectories = readBundledDistOptOutDirectoryNames(sourceCheckoutExtensionsDir);
		if (sourceCheckoutExtensionsDir) for (const dirName of bundledDistOptOutDirectories) discoverFromPath({
			rawPath: node_path.default.join(sourceCheckoutExtensionsDir, dirName),
			origin: "bundled",
			ownershipUid: params.ownershipUid,
			workspaceDir,
			env,
			candidates: result.candidates,
			diagnostics: result.diagnostics,
			seen,
			realpathCache,
			packageManifestCache
		});
		if (roots.stock) discoverInDirectory({
			dir: roots.stock,
			origin: "bundled",
			env,
			ownershipUid: params.ownershipUid,
			candidates: result.candidates,
			diagnostics: result.diagnostics,
			seen,
			realpathCache,
			packageManifestCache,
			skipDirectories: bundledDistOptOutDirectories
		});
		const sourceCheckoutMatchesBundledRoot = resolvesToSameDirectory(sourceCheckoutExtensionsDir, roots.stock, realpathCache);
		if (sourceCheckoutExtensionsDir && !sourceCheckoutMatchesBundledRoot) discoverInDirectory({
			dir: sourceCheckoutExtensionsDir,
			origin: "bundled",
			env,
			ownershipUid: params.ownershipUid,
			candidates: result.candidates,
			diagnostics: result.diagnostics,
			seen,
			realpathCache,
			packageManifestCache,
			skipDirectories: readChildDirectoryNames(roots.stock)
		});
		const installedPaths = collectInstalledPluginRecordPaths(params.installRecords, env, realpathCache);
		const installedPluginDirKeys = collectManagedPluginDirKeys(installedPaths.map((installedPath) => installedPath.path), realpathCache);
		const managedPluginDirs = collectManagedPluginDirKeys(collectManagedPluginRecordPaths(params.installRecords, env), realpathCache);
		for (const installedPath of installedPaths) discoverFromPath({
			rawPath: installedPath.path,
			origin: "global",
			ownershipUid: params.ownershipUid,
			workspaceDir,
			requireBuiltRuntimeEntry: installedPath.requireBuiltRuntimeEntry,
			managedPluginDirs,
			scanFiles: true,
			env,
			candidates: result.candidates,
			diagnostics: result.diagnostics,
			seen,
			realpathCache,
			packageManifestCache
		});
		discoverInDirectory({
			dir: roots.global,
			origin: "global",
			env,
			ownershipUid: params.ownershipUid,
			managedPluginDirs,
			skipRootDirKeys: installedPluginDirKeys,
			candidates: result.candidates,
			diagnostics: result.diagnostics,
			seen,
			realpathCache,
			packageManifestCache
		});
		return result;
	}, { scope: "shared" });
	const result = createDiscoveryResult();
	const seenSources = /* @__PURE__ */ new Set();
	const seenDiagnostics = /* @__PURE__ */ new Set();
	mergeDiscoveryResult(result, scopedResult, seenSources, seenDiagnostics);
	mergeDiscoveryResult(result, sharedResult, seenSources, seenDiagnostics);
	addMissingRequiredPluginDiagnostics(result);
	return result;
}
//#endregion
Object.defineProperty(exports, "buildBundledPluginLoadPathAliases", {
	enumerable: true,
	get: function() {
		return buildBundledPluginLoadPathAliases;
	}
});
Object.defineProperty(exports, "buildLegacyBundledRootPath", {
	enumerable: true,
	get: function() {
		return buildLegacyBundledRootPath;
	}
});
Object.defineProperty(exports, "buildPluginDependencyStatus", {
	enumerable: true,
	get: function() {
		return buildPluginDependencyStatus;
	}
});
Object.defineProperty(exports, "discoverConfiguredPluginLoadPaths", {
	enumerable: true,
	get: function() {
		return discoverConfiguredPluginLoadPaths;
	}
});
Object.defineProperty(exports, "discoverOperatorPlugins", {
	enumerable: true,
	get: function() {
		return discoverOperatorPlugins;
	}
});
Object.defineProperty(exports, "isBundledSourceOverlayPath", {
	enumerable: true,
	get: function() {
		return isBundledSourceOverlayPath;
	}
});
Object.defineProperty(exports, "listBundledSourceOverlayDirs", {
	enumerable: true,
	get: function() {
		return listBundledSourceOverlayDirs;
	}
});
Object.defineProperty(exports, "normalizeBundledLookupPath", {
	enumerable: true,
	get: function() {
		return normalizeBundledLookupPath;
	}
});
Object.defineProperty(exports, "normalizePluginDependencySpecs", {
	enumerable: true,
	get: function() {
		return normalizePluginDependencySpecs;
	}
});
Object.defineProperty(exports, "parseLegacyBundledPluginPath", {
	enumerable: true,
	get: function() {
		return parseLegacyBundledPluginPath;
	}
});
Object.defineProperty(exports, "parsePackagedBundledPluginPath", {
	enumerable: true,
	get: function() {
		return parsePackagedBundledPluginPath;
	}
});
Object.defineProperty(exports, "readLegacyNpmPluginDeclaration", {
	enumerable: true,
	get: function() {
		return readLegacyNpmPluginDeclaration;
	}
});
Object.defineProperty(exports, "tracePluginLifecyclePhase", {
	enumerable: true,
	get: function() {
		return tracePluginLifecyclePhase;
	}
});
Object.defineProperty(exports, "tracePluginLifecyclePhaseAsync", {
	enumerable: true,
	get: function() {
		return tracePluginLifecyclePhaseAsync;
	}
});
