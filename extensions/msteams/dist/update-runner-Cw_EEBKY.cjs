const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_replace_file = require("./replace-file-D77oDPOz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_runtime_guard = require("./runtime-guard-DYLYBrMu.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
require("./env-C7Oxn-fY.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_path_prepend = require("./path-prepend-CrHzSLEG.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
const require_stable_node_path = require("./stable-node-path-CycXK8Qa.cjs");
const require_gateway_entrypoint = require("./gateway-entrypoint-BSWI2mN9.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
require("./update-phase-noJPNQLY.cjs");
const require_control_ui_assets = require("./control-ui-assets-CAB0clox.cjs");
const require_package_json = require("./package-json-B6KtcVRf.cjs");
const require_package_dist_inventory = require("./package-dist-inventory-Cj9ttdZA.cjs");
const require_update_check = require("./update-check-yvbRd7TR.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/commands/doctor-invocation.ts
const DOCTOR_DISABLE_CROSS_STATE_DIR_IMPORTS_ENV = "OPERATOR_DOCTOR_DISABLE_CROSS_STATE_DIR_IMPORTS";
//#endregion
//#region src/infra/package-tag.ts
/** Normalizes a package tag input, stripping known package-name prefixes when present. */
function normalizePackageTagInput(value, packageNames) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return null;
	for (const packageName of packageNames) {
		if (trimmed === packageName) return null;
		const prefix = `${packageName}@`;
		if (trimmed.startsWith(prefix)) {
			const tag = trimmed.slice(prefix.length).trim();
			return tag ? tag : null;
		}
	}
	return trimmed;
}
//#endregion
//#region scripts/lib/bundled-runtime-sidecar-paths.json
var bundled_runtime_sidecar_paths_default = [
	"dist/extensions/browser/runtime-api.js",
	"dist/extensions/canvas/runtime-api.js",
	"dist/extensions/copilot-proxy/runtime-api.js",
	"dist/extensions/google/runtime-api.js",
	"dist/extensions/imessage/runtime-api.js",
	"dist/extensions/lmstudio/runtime-api.js",
	"dist/extensions/memory-core/runtime-api.js",
	"dist/extensions/ollama/runtime-api.js",
	"dist/extensions/open-prose/runtime-api.js",
	"dist/extensions/reef/runtime-api.js",
	"dist/extensions/telegram/runtime-api.js",
	"dist/extensions/telegram/runtime-setter-api.js",
	"dist/extensions/webhooks/runtime-api.js",
	"dist/extensions/workboard/runtime-api.js"
];
//#endregion
//#region src/plugins/runtime-sidecar-paths.ts
function assertUniqueValues(values, label) {
	const seen = /* @__PURE__ */ new Set();
	const duplicates = /* @__PURE__ */ new Set();
	for (const value of values) {
		if (seen.has(value)) {
			duplicates.add(value);
			continue;
		}
		seen.add(value);
	}
	if (duplicates.size > 0) throw new Error(`Duplicate ${label}: ${Array.from(duplicates).join(", ")}`);
	return values;
}
const BUNDLED_RUNTIME_SIDECAR_PATHS = assertUniqueValues(bundled_runtime_sidecar_paths_default, "bundled runtime sidecar path");
//#endregion
//#region src/infra/update-global.ts
const PRIMARY_PACKAGE_NAME = "@gabrielvfonseca/operator";
const ALL_PACKAGE_NAMES = [PRIMARY_PACKAGE_NAME];
const GLOBAL_RENAME_PREFIX = ".";
/** npm-compatible spec used when the user asks to install the moving main branch. */
const OPERATOR_MAIN_PACKAGE_SPEC = "github:openclaw/openclaw#main";
const COREPACK_ENABLE_DOWNLOAD_PROMPT_DEFAULT = "0";
const NPM_GLOBAL_INSTALL_QUIET_FLAGS = [
	"--no-fund",
	"--no-audit",
	"--loglevel=error"
];
const PNPM_OPERATOR_BUILD_ALLOWLIST_FLAG = `--allow-build=${PRIMARY_PACKAGE_NAME}`;
const BUN_OPERATOR_TRUST_FLAG = "--trust";
const FIRST_PACKAGED_DIST_INVENTORY_VERSION = {
	major: 2026,
	minor: 4,
	patch: 15
};
const OMITTED_PRIVATE_QA_BUNDLED_PLUGIN_ROOTS = /* @__PURE__ */ new Set(["dist/extensions/qa-channel", "dist/extensions/qa-lab"]);
function normalizePackageTarget(value) {
	return value.trim();
}
/** Reads the command value after package-manager warnings printed on stdout. */
function readPackageManagerProbeValue(stdout) {
	const lines = stdout.split(/\r?\n/u);
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const value = lines[index]?.trim();
		if (value) return value;
	}
	return "";
}
function normalizePackageVersionForComparison(value) {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	return trimmed.replace(/^[vV](?=\d)/, "");
}
/** Returns true when a user target requests the moving main-branch package spec. */
function isMainPackageTarget(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizePackageTarget(value)) === "main";
}
/**
* Returns true for targets that should pass through as package-manager specs
* rather than being treated as registry dist-tags.
*/
function isExplicitPackageInstallSpec(value) {
	const trimmed = normalizePackageTarget(value);
	if (!trimmed) return false;
	return /\.(?:tgz|tar\.gz)$/iu.test(trimmed) || trimmed.includes("://") || trimmed.includes("#") || /^(?:file|github|git\+ssh|git\+https|git\+http|git\+file|npm):/i.test(trimmed);
}
function isRelativePackageInstallPath(value) {
	return /^(?:\.{1,2})(?:[\\/]|$)/u.test(value);
}
function resolveNpmInstallScriptsAllowFlag(spec, installCwd) {
	const normalized = normalizePackageTarget(spec);
	const unaliased = stripPrimaryPackageAlias(normalized);
	let identity = isExplicitPackageInstallSpec(normalized) || isExplicitPackageInstallSpec(unaliased) || isRelativePackageInstallPath(unaliased) || node_path.default.isAbsolute(normalized) || node_path.default.isAbsolute(unaliased) ? unaliased : PRIMARY_PACKAGE_NAME;
	identity = resolveNpmAliasPackageName(identity) ?? identity;
	if (installCwd && node_path.default.isAbsolute(identity)) {
		const relativeIdentity = node_path.default.relative(installCwd, identity) || ".";
		identity = node_path.default.isAbsolute(relativeIdentity) || relativeIdentity === "." || relativeIdentity === ".." || relativeIdentity.startsWith(`..${node_path.default.sep}`) ? relativeIdentity : `./${relativeIdentity}`;
	}
	if (identity.includes(",")) throw new Error("npm cannot allow lifecycle scripts for an install target containing a comma; rename the package or source path");
	return `--allow-scripts=${identity || PRIMARY_PACKAGE_NAME}`;
}
function resolveNpmAliasPackageName(spec) {
	if (!/^npm:/i.test(spec)) return null;
	const target = spec.slice(spec.indexOf(":") + 1).trim();
	if (target.startsWith("@")) {
		const scopeSeparator = target.indexOf("/");
		if (scopeSeparator <= 1) return null;
		const versionSeparator = target.indexOf("@", scopeSeparator + 1);
		return versionSeparator === -1 ? target : target.slice(0, versionSeparator);
	}
	const versionSeparator = target.indexOf("@");
	return (versionSeparator === -1 ? target : target.slice(0, versionSeparator)) || null;
}
function stripPrimaryPackageAlias(spec) {
	const normalized = normalizePackageTarget(spec);
	const prefix = `${PRIMARY_PACKAGE_NAME}@`;
	return normalized.toLowerCase().startsWith(prefix) ? normalized.slice(prefix.length).trim() : normalized;
}
/**
* Extracts a pinned installed version from package specs like `openclaw@1.2.3`.
* Moving tags, URLs, git refs, and aliases return null because they cannot be
* compared reliably after install.
*/
function resolveExpectedInstalledVersionFromSpec(packageName, spec) {
	const normalizedPackageName = packageName.trim();
	const normalizedSpec = normalizePackageTarget(spec);
	if (!normalizedPackageName || !normalizedSpec.startsWith(`${normalizedPackageName}@`)) return null;
	const rawVersion = normalizedSpec.slice(normalizedPackageName.length + 1).trim();
	if (!rawVersion || rawVersion.includes("/") || rawVersion.includes(":") || rawVersion.includes("#") || /^(latest|beta|next|main)$/i.test(rawVersion)) return null;
	return normalizePackageVersionForComparison(rawVersion);
}
/**
* Verifies that a global package root looks like a packaged Operator install
* and, when supplied, matches the expected concrete version.
*/
async function collectInstalledGlobalPackageErrors(params) {
	const errors = [];
	errors.push(...await collectSourceCheckoutInstallErrors(params.packageRoot));
	const installedVersion = await require_package_json.readPackageVersion(params.packageRoot);
	const expectedComparable = normalizePackageVersionForComparison(params.expectedVersion);
	const installedComparable = normalizePackageVersionForComparison(installedVersion);
	if (expectedComparable && installedComparable !== expectedComparable) errors.push(`expected installed version ${expectedComparable}, found ${installedComparable ?? "<missing>"}`);
	errors.push(...await collectInstalledPackageDistErrors({
		packageRoot: params.packageRoot,
		installedVersion,
		expectedVersion: params.expectedVersion
	}));
	return errors;
}
async function collectSourceCheckoutInstallErrors(packageRoot) {
	const realPackageRoot = await tryRealpath(packageRoot);
	return (await require_utils.pathExists(node_path.default.join(realPackageRoot, ".git")) || await require_utils.pathExists(node_path.default.join(realPackageRoot, "pnpm-workspace.yaml"))) && await require_utils.pathExists(node_path.default.join(realPackageRoot, "src")) && await require_utils.pathExists(node_path.default.join(realPackageRoot, "extensions")) ? [`global package root resolves to source checkout: ${realPackageRoot}`] : [];
}
function shouldRequirePackagedDistInventory(version) {
	const parsed = require_runtime_guard.parseSemver(version ?? null);
	if (!parsed) return false;
	if (parsed.major !== FIRST_PACKAGED_DIST_INVENTORY_VERSION.major) return parsed.major > FIRST_PACKAGED_DIST_INVENTORY_VERSION.major;
	if (parsed.minor !== FIRST_PACKAGED_DIST_INVENTORY_VERSION.minor) return parsed.minor > FIRST_PACKAGED_DIST_INVENTORY_VERSION.minor;
	return parsed.patch >= FIRST_PACKAGED_DIST_INVENTORY_VERSION.patch;
}
async function collectInstalledPackageDistErrors(params) {
	const criticalPaths = await collectCriticalInstalledPackageDistPaths(params.packageRoot);
	let inventoryFiles = null;
	let inventoryError = null;
	try {
		inventoryFiles = await require_package_dist_inventory.readPackageDistInventoryIfPresent(params.packageRoot);
	} catch {
		inventoryError = `invalid package dist inventory ${require_package_dist_inventory.PACKAGE_DIST_INVENTORY_RELATIVE_PATH}`;
	}
	if (inventoryFiles !== null) {
		const actualFiles = await require_package_dist_inventory.collectPackageDistInventory(params.packageRoot);
		const inventoryErrors = await collectInstalledPathErrors({
			packageRoot: params.packageRoot,
			expectedFiles: inventoryFiles,
			actualFiles,
			missingMessage: (relativePath) => `missing packaged dist file ${relativePath}`,
			unexpectedMessage: (relativePath) => `unexpected packaged dist file ${relativePath}`
		});
		const inventorySet = new Set(inventoryFiles);
		const supplementalCriticalPaths = criticalPaths.filter((relativePath) => !inventorySet.has(relativePath));
		if (supplementalCriticalPaths.length === 0) return inventoryErrors;
		return [...inventoryErrors, ...await collectInstalledPathErrors({
			packageRoot: params.packageRoot,
			expectedFiles: supplementalCriticalPaths,
			actualFiles,
			missingMessage: (relativePath) => `missing bundled runtime sidecar ${relativePath}`
		})];
	}
	const criticalErrors = await collectInstalledPathErrors({
		packageRoot: params.packageRoot,
		expectedFiles: await collectLegacyInstalledPackageDistPaths(params.packageRoot),
		actualFiles: null,
		missingMessage: (relativePath) => `missing bundled runtime sidecar ${relativePath}`
	});
	if (inventoryError) return [inventoryError, ...criticalErrors];
	if (shouldRequirePackagedDistInventory(params.installedVersion) || shouldRequirePackagedDistInventory(params.expectedVersion)) return [`missing package dist inventory ${require_package_dist_inventory.PACKAGE_DIST_INVENTORY_RELATIVE_PATH}`, ...criticalErrors];
	return criticalErrors;
}
async function collectLegacyInstalledPackageDistPaths(packageRoot) {
	return await collectCriticalInstalledPackageDistPaths(packageRoot);
}
async function collectCriticalInstalledPackageDistPaths(packageRoot) {
	const expectedFiles = /* @__PURE__ */ new Set();
	await Promise.all(BUNDLED_RUNTIME_SIDECAR_PATHS.map(async (relativePath) => {
		const pluginRoot = resolveBundledPluginRoot(relativePath);
		if (pluginRoot === null) return;
		if (OMITTED_PRIVATE_QA_BUNDLED_PLUGIN_ROOTS.has(pluginRoot)) return;
		if (await require_utils.pathExists(node_path.default.join(packageRoot, pluginRoot, "package.json")) || await require_utils.pathExists(node_path.default.join(packageRoot, pluginRoot, "operator.plugin.json"))) expectedFiles.add(relativePath);
	}));
	return [...expectedFiles].toSorted((left, right) => left.localeCompare(right));
}
function resolveBundledPluginRoot(relativePath) {
	const match = /^dist\/extensions\/[^/]+/u.exec(relativePath);
	return match ? match[0] : null;
}
async function collectInstalledPathErrors(params) {
	const errors = [];
	const actualSet = params.actualFiles ? new Set(params.actualFiles) : null;
	for (const relativePath of params.expectedFiles) if (!(actualSet !== null ? actualSet.has(relativePath) : await require_utils.pathExists(node_path.default.join(params.packageRoot, relativePath)))) errors.push(params.missingMessage(relativePath));
	if (actualSet !== null && params.unexpectedMessage) {
		const expectedSet = new Set(params.expectedFiles);
		for (const relativePath of params.actualFiles ?? []) if (!expectedSet.has(relativePath)) errors.push(params.unexpectedMessage(relativePath));
	}
	return errors;
}
async function resolvePortableGitPathPrepend() {
	if (process.platform !== "win32") return [];
	const localAppData = process.env.LOCALAPPDATA?.trim();
	if (!localAppData) return [];
	const portableGitRoot = node_path.default.join(localAppData, "Operator", "deps", "portable-git");
	const candidates = [
		node_path.default.join(portableGitRoot, "mingw64", "bin"),
		node_path.default.join(portableGitRoot, "usr", "bin"),
		node_path.default.join(portableGitRoot, "cmd"),
		node_path.default.join(portableGitRoot, "bin")
	];
	const existing = [];
	for (const candidate of candidates) if (await require_utils.pathExists(candidate)) existing.push(candidate);
	return existing;
}
function applyWindowsPackageInstallEnv(env) {
	if (process.platform !== "win32") return;
	env.NPM_CONFIG_UPDATE_NOTIFIER = "false";
	env.NPM_CONFIG_FUND = "false";
	env.NPM_CONFIG_AUDIT = "false";
	env.NODE_LLAMA_CPP_SKIP_DOWNLOAD = "1";
}
function applyCorepackDownloadPromptEnv(env) {
	if (!env.COREPACK_ENABLE_DOWNLOAD_PROMPT?.trim()) env.COREPACK_ENABLE_DOWNLOAD_PROMPT = COREPACK_ENABLE_DOWNLOAD_PROMPT_DEFAULT;
}
/**
* Converts a user tag or explicit package target into the package-manager spec
* used by global install commands.
*/
function resolveGlobalInstallSpec(params) {
	const override = params.env?.OPERATOR_UPDATE_PACKAGE_SPEC?.trim() || process.env.OPERATOR_UPDATE_PACKAGE_SPEC?.trim();
	if (override) return override;
	const target = normalizePackageTarget(params.tag);
	if (isMainPackageTarget(target)) return OPERATOR_MAIN_PACKAGE_SPEC;
	if (isExplicitPackageInstallSpec(target)) return target;
	return `${params.packageName}@${target}`;
}
/**
* Builds the package-manager environment used for global installs.
* It keeps caller env values, adds platform-specific install defaults, and
* disables npm/corepack prompts that would otherwise hang unattended updates.
*/
async function createGlobalInstallEnv(env) {
	const pathPrepend = await resolvePortableGitPathPrepend();
	const sourceEnv = env ?? process.env;
	const merged = Object.fromEntries(Object.entries(sourceEnv).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
	require_path_prepend.applyPathPrepend(merged, pathPrepend);
	applyWindowsPackageInstallEnv(merged);
	applyCorepackDownloadPromptEnv(merged);
	require_install_source_utils.applyNpmFreshnessBypassEnv(merged);
	require_install_source_utils.applyPosixNpmScriptShellEnv(merged);
	return merged;
}
async function tryRealpath(targetPath) {
	try {
		return await node_fs_promises.default.realpath(targetPath);
	} catch {
		return node_path.default.resolve(targetPath);
	}
}
function resolveBunGlobalRoot() {
	const bunInstall = process.env.BUN_INSTALL?.trim() || node_path.default.join(node_os.default.homedir(), ".bun");
	return node_path.default.join(bunInstall, "install", "global", "node_modules");
}
function inferNpmPrefixFromPackageRoot(pkgRoot) {
	const nodeModulesDir = inferGlobalRootFromPackageRoot(pkgRoot);
	if (!nodeModulesDir) return null;
	const parentDir = node_path.default.dirname(nodeModulesDir);
	if (node_path.default.basename(parentDir) === "lib") return node_path.default.dirname(parentDir);
	if (process.platform === "win32" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(parentDir)) === "npm") return parentDir;
	return null;
}
/**
* Infers npm prefix, package root, and bin paths from an npm global root.
* Direct `node_modules` roots are accepted only when the caller opts into them.
*/
function resolveNpmGlobalPrefixLayoutFromGlobalRoot(globalRoot, options = {}) {
	const trimmed = globalRoot?.trim();
	if (!trimmed) return null;
	const normalized = node_path.default.resolve(trimmed);
	if (node_path.default.basename(normalized) !== "node_modules") return null;
	const parentDir = node_path.default.dirname(normalized);
	if (node_path.default.basename(parentDir) === "lib") {
		const prefix = node_path.default.dirname(parentDir);
		return {
			prefix,
			globalRoot: normalized,
			binDir: node_path.default.join(prefix, "bin")
		};
	}
	if (process.platform === "win32") return {
		prefix: parentDir,
		globalRoot: normalized,
		binDir: parentDir
	};
	if (options.allowDirectNodeModulesRoot) return {
		prefix: parentDir,
		globalRoot: normalized,
		binDir: node_path.default.join(normalized, ".bin")
	};
	return null;
}
/**
* Derives npm's global package and bin directories from a prefix root.
* Used for staged installs where Operator creates the prefix itself.
*/
function resolveNpmGlobalPrefixLayoutFromPrefix(prefix) {
	const resolvedPrefix = node_path.default.resolve(prefix);
	if (process.platform === "win32") return {
		prefix: resolvedPrefix,
		globalRoot: node_path.default.join(resolvedPrefix, "node_modules"),
		binDir: resolvedPrefix
	};
	return {
		prefix: resolvedPrefix,
		globalRoot: node_path.default.join(resolvedPrefix, "lib", "node_modules"),
		binDir: node_path.default.join(resolvedPrefix, "bin")
	};
}
function splitNormalizedPathParts(value) {
	return node_path.default.resolve(value).split(node_path.default.sep).filter(Boolean).map((part) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(part));
}
function isNodeVersionPathPart(value) {
	return value !== void 0 && /^v?\d+(?:\.\d+){0,3}(?:[-+][0-9a-z.-]+)?$/u.test(value);
}
function hasPathSequence(parts, sequence) {
	const lastStart = parts.length - sequence.length;
	for (let index = 0; index <= lastStart; index += 1) if (sequence.every((part, offset) => parts[index + offset] === part)) return true;
	return false;
}
function isEphemeralNodeManagedNpmPrefix(prefix) {
	const parts = splitNormalizedPathParts(prefix);
	const basename = parts.at(-1);
	const parent = parts.at(-2);
	const grandparent = parts.at(-3);
	if (isNodeVersionPathPart(basename) && grandparent === "cellar") return true;
	if (isNodeVersionPathPart(basename) && (hasPathSequence(parts, [
		".nvm",
		"versions",
		"node"
	]) || hasPathSequence(parts, [
		"n",
		"versions",
		"node"
	]) || hasPathSequence(parts, [
		".asdf",
		"installs",
		"nodejs"
	]) || hasPathSequence(parts, [
		".volta",
		"tools",
		"image",
		"node"
	]))) return true;
	return basename === "installation" && isNodeVersionPathPart(parent) && grandparent === "node-versions";
}
function resolveNpmCommandBesidePackageRoot(pkgRoot) {
	const prefix = inferNpmPrefixFromPackageRoot(pkgRoot);
	if (!prefix) return null;
	const candidate = process.platform === "win32" ? node_path.default.join(prefix, "npm.cmd") : node_path.default.join(prefix, "bin", "npm");
	return node_fs.default.existsSync(candidate) ? candidate : null;
}
function resolvePreferredNpmCommand(pkgRoot) {
	const prefix = inferNpmPrefixFromPackageRoot(pkgRoot);
	if (prefix && isEphemeralNodeManagedNpmPrefix(prefix)) return null;
	return resolveNpmCommandBesidePackageRoot(pkgRoot);
}
function inferGlobalRootFromPackageRoot(pkgRoot) {
	const trimmed = pkgRoot?.trim();
	if (!trimmed) return null;
	const normalized = node_path.default.resolve(trimmed);
	let globalRoot = node_path.default.dirname(normalized);
	if (node_path.default.basename(globalRoot).startsWith("@")) globalRoot = node_path.default.dirname(globalRoot);
	return node_path.default.basename(globalRoot) === "node_modules" ? globalRoot : null;
}
function resolvePackageRootFromGlobalRoot(params) {
	const parts = (params.packageName?.trim() || PRIMARY_PACKAGE_NAME).split("/");
	const hasSafeSegments = parts.length > 0 && parts.length <= 2 && parts.every((part) => part.length > 0 && part !== "." && part !== ".." && !part.includes("\\")) && (parts.length === 1 || parts[0]?.startsWith("@"));
	return node_path.default.join(params.globalRoot, ...hasSafeSegments ? parts : [PRIMARY_PACKAGE_NAME]);
}
function isDirectNpmNodeModulesRoot(globalRoot) {
	return globalRoot !== null && resolveNpmGlobalPrefixLayoutFromGlobalRoot(globalRoot) === null && resolveNpmGlobalPrefixLayoutFromGlobalRoot(globalRoot, { allowDirectNodeModulesRoot: true }) !== null;
}
function inferBunGlobalRootFromPackageRoot(pkgRoot) {
	const directGlobalRoot = inferGlobalRootFromPackageRoot(pkgRoot);
	if (!directGlobalRoot) return null;
	return node_path.default.resolve(directGlobalRoot) === node_path.default.resolve(resolveBunGlobalRoot()) ? directGlobalRoot : null;
}
function inferPnpmGlobalRootFromPackageRoot(pkgRoot) {
	const isolatedGlobalRoot = inferPnpmIsolatedGlobalRootFromPackageRoot(pkgRoot);
	if (isolatedGlobalRoot) return isolatedGlobalRoot;
	const directGlobalRoot = inferGlobalRootFromPackageRoot(pkgRoot);
	if (resolvePnpmGlobalDirFromGlobalRoot(directGlobalRoot)) return directGlobalRoot;
	const trimmed = pkgRoot?.trim();
	if (!trimmed) return null;
	const parts = node_path.default.resolve(trimmed).split(node_path.default.sep);
	const pnpmIndex = parts.lastIndexOf(".pnpm");
	if (pnpmIndex <= 0) return null;
	if (parts[pnpmIndex + 2] !== "node_modules") return null;
	const layoutDir = parts.slice(0, pnpmIndex).join(node_path.default.sep) || node_path.default.sep;
	const globalRoot = node_path.default.basename(layoutDir) === "node_modules" ? layoutDir : node_path.default.join(layoutDir, "node_modules");
	return resolvePnpmGlobalDirFromGlobalRoot(globalRoot) ? globalRoot : null;
}
function resolvePnpmIsolatedLayoutVersion(globalRoot) {
	const trimmed = globalRoot?.trim();
	const match = trimmed ? /^v(\d+)$/u.exec(node_path.default.basename(node_path.default.resolve(trimmed))) : null;
	return match ? Number.parseInt(match[1] ?? "", 10) : null;
}
function inferPnpmIsolatedGlobalRootFromPackageRoot(pkgRoot) {
	const nodeModulesRoot = inferGlobalRootFromPackageRoot(pkgRoot);
	if (!nodeModulesRoot) return null;
	const globalRoot = node_path.default.dirname(node_path.default.dirname(nodeModulesRoot));
	return resolvePnpmIsolatedLayoutVersion(globalRoot) === null ? null : globalRoot;
}
async function hasPnpmIsolatedProjectMetadata(pkgRoot, packageName = PRIMARY_PACKAGE_NAME) {
	if (!inferPnpmIsolatedGlobalRootFromPackageRoot(pkgRoot)) return false;
	const nodeModulesRoot = inferGlobalRootFromPackageRoot(pkgRoot);
	if (!nodeModulesRoot) return false;
	const installDir = node_path.default.dirname(nodeModulesRoot);
	const manifest = await node_fs_promises.default.readFile(node_path.default.join(installDir, "package.json"), "utf8").then((raw) => JSON.parse(raw)).catch(() => null);
	return Boolean(manifest?.dependencies && packageName in manifest.dependencies && await require_utils.pathExists(node_path.default.join(installDir, "pnpm-lock.yaml")));
}
/** Resolves the pnpm project owner without following its shared-store package symlink. */
async function resolvePnpmIsolatedInstallOwner(pkgRoot) {
	const nodeModulesRoot = inferGlobalRootFromPackageRoot(pkgRoot);
	if (!nodeModulesRoot) return null;
	return node_path.default.resolve(await tryRealpath(node_path.default.dirname(nodeModulesRoot)));
}
async function listPnpmIsolatedGlobalPackages(params) {
	const globalRoot = params.globalRoot?.trim();
	const layoutVersion = resolvePnpmIsolatedLayoutVersion(globalRoot);
	if (!globalRoot || layoutVersion === null) return [];
	const packageName = params.packageName?.trim() || PRIMARY_PACKAGE_NAME;
	const entries = await node_fs_promises.default.readdir(globalRoot, { withFileTypes: true }).catch(() => []);
	const packages = [];
	for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
		if (!entry.isSymbolicLink()) continue;
		const installDir = await node_fs_promises.default.realpath(node_path.default.join(globalRoot, entry.name)).catch(() => null);
		if (!installDir) continue;
		const manifest = await node_fs_promises.default.readFile(node_path.default.join(installDir, "package.json"), "utf8").then((raw) => JSON.parse(raw)).catch(() => null);
		if (!manifest?.dependencies || !(packageName in manifest.dependencies)) continue;
		const packageRoot = resolvePackageRootFromGlobalRoot({
			globalRoot: node_path.default.join(installDir, "node_modules"),
			packageName
		});
		if (await require_utils.pathExists(packageRoot)) packages.push({
			globalRoot: node_path.default.resolve(globalRoot),
			packageRoot,
			layoutVersion,
			packageNames: Object.keys(manifest.dependencies).toSorted((a, b) => a.localeCompare(b))
		});
	}
	return packages;
}
async function listActivePnpmIsolatedGlobalPackages(params) {
	return (await listPnpmIsolatedGlobalPackages(params)).map((entry) => ({
		packageRoot: entry.packageRoot,
		packageNames: entry.packageNames
	}));
}
async function resolvePnpmIsolatedGlobalPackage(params) {
	const packages = await listPnpmIsolatedGlobalPackages(params);
	const requestedPackageRoot = params.pkgRoot ? node_path.default.resolve(params.pkgRoot) : null;
	const requestedOwnerRoot = inferPnpmIsolatedGlobalRootFromPackageRoot(params.pkgRoot);
	const globalRoot = params.globalRoot?.trim();
	const canonicalRequestedOwnerRoot = requestedOwnerRoot ? node_path.default.resolve(await tryRealpath(requestedOwnerRoot)) : null;
	const canonicalGlobalRoot = globalRoot ? node_path.default.resolve(await tryRealpath(globalRoot)) : null;
	const requestedInstallOwner = requestedPackageRoot && canonicalRequestedOwnerRoot !== null && canonicalRequestedOwnerRoot === canonicalGlobalRoot ? await resolvePnpmIsolatedInstallOwner(requestedPackageRoot) : null;
	for (const entry of packages) {
		const packageRoot = entry.packageRoot;
		if (requestedPackageRoot) {
			const installOwner = await resolvePnpmIsolatedInstallOwner(packageRoot);
			if (requestedInstallOwner === null || installOwner !== requestedInstallOwner) continue;
		}
		return entry;
	}
	return null;
}
async function isPnpmIsolatedGlobalPackageRoot(pkgRoot) {
	const globalRoot = inferPnpmIsolatedGlobalRootFromPackageRoot(pkgRoot);
	if (!globalRoot) return false;
	return Boolean(await resolvePnpmIsolatedGlobalPackage({
		globalRoot,
		pkgRoot
	}));
}
/**
* Resolves pnpm's global-dir from its active global package root.
* pnpm 10 used `<globalDir>/<version>/node_modules`; pnpm 11 uses
* `<globalDir>/v<version>` with isolated package projects below it.
*/
function resolvePnpmGlobalDirFromGlobalRoot(globalRoot) {
	const trimmed = globalRoot?.trim();
	if (!trimmed) return null;
	const normalized = node_path.default.resolve(trimmed);
	if (/^v\d+$/u.test(node_path.default.basename(normalized))) return node_path.default.dirname(normalized);
	if (node_path.default.basename(normalized) !== "node_modules") return null;
	const layoutDir = node_path.default.dirname(normalized);
	return /^\d+$/u.test(node_path.default.basename(layoutDir)) ? node_path.default.dirname(layoutDir) : null;
}
async function isPnpmGlobalPackageRoot(pkgRoot) {
	if (await isPnpmIsolatedGlobalPackageRoot(pkgRoot)) return true;
	if (await hasPnpmIsolatedProjectMetadata(pkgRoot)) return true;
	const globalRoot = inferPnpmGlobalRootFromPackageRoot(pkgRoot);
	if (!globalRoot) return false;
	const layoutDir = node_path.default.dirname(globalRoot);
	if (!await require_utils.pathExists(node_path.default.join(globalRoot, ".modules.yaml"))) return false;
	return await require_utils.pathExists(node_path.default.join(layoutDir, "pnpm-lock.yaml")) || await require_utils.pathExists(node_path.default.join(layoutDir, "package.json"));
}
function resolvePreferredGlobalManagerCommand(manager, pkgRoot) {
	if (manager !== "npm") return manager;
	return resolvePreferredNpmCommand(pkgRoot) ?? manager;
}
/**
* Resolves the package-manager command to execute for a global install.
* npm may use the npm binary beside an existing package root when available.
*/
function resolveGlobalInstallCommand(manager, pkgRoot) {
	return {
		manager,
		command: resolvePreferredGlobalManagerCommand(manager, pkgRoot)
	};
}
function normalizeGlobalInstallCommand(managerOrCommand, pkgRoot) {
	return typeof managerOrCommand === "string" ? resolveGlobalInstallCommand(managerOrCommand, pkgRoot) : managerOrCommand;
}
function resolveBunGlobalInstallSpec(spec) {
	const trimmed = normalizePackageTarget(spec);
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed).startsWith(`${PRIMARY_PACKAGE_NAME}@`)) return trimmed;
	const isWindowsAbsolutePath = /^[a-z]:[\\/]/iu.test(trimmed);
	const hasScheme = /^[a-z][a-z0-9+.-]*:/iu.test(trimmed) && !isWindowsAbsolutePath;
	const target = /\.(?:tgz|tar\.gz)$/iu.test(trimmed) && !hasScheme ? `file:${trimmed}` : trimmed;
	return `${PRIMARY_PACKAGE_NAME}@${target}`;
}
function resolveInstallCommandForManager(managerOrCommand, manager, pkgRoot) {
	const normalized = normalizeGlobalInstallCommand(managerOrCommand, pkgRoot);
	return normalized.manager === manager ? normalized : resolveGlobalInstallCommand(manager, pkgRoot);
}
/**
* Reads the global `node_modules` root for a package manager command.
* Bun uses its deterministic install root because it has no `root -g` command.
*/
async function resolveGlobalRoot(managerOrCommand, runCommand, timeoutMs, pkgRoot) {
	const resolved = normalizeGlobalInstallCommand(managerOrCommand, pkgRoot);
	if (resolved.manager === "bun") return resolveBunGlobalRoot();
	const res = await runCommand([
		resolved.command,
		"root",
		"-g"
	], { timeoutMs }).catch(() => null);
	if (res?.code !== 0) return null;
	return readPackageManagerProbeValue(res.stdout) || null;
}
/**
* Resolves the effective global install target, honoring an existing package
* root when requested and detecting pnpm or bun layouts before command probes.
*/
async function resolveGlobalInstallTarget(params) {
	const requestedCommand = normalizeGlobalInstallCommand(params.manager, params.pkgRoot);
	const requestedPnpmGlobalRoot = requestedCommand.manager === "pnpm" ? await resolveGlobalRoot(requestedCommand, params.runCommand, params.timeoutMs, params.pkgRoot) : null;
	const inferredPnpmIsolatedGlobalRoot = inferPnpmIsolatedGlobalRootFromPackageRoot(params.pkgRoot);
	const pnpmIsolatedPackage = inferredPnpmIsolatedGlobalRoot ? await resolvePnpmIsolatedGlobalPackage({
		globalRoot: inferredPnpmIsolatedGlobalRoot,
		packageName: params.packageName,
		pkgRoot: params.pkgRoot
	}) : await resolvePnpmIsolatedGlobalPackage({
		globalRoot: requestedPnpmGlobalRoot,
		packageName: params.packageName,
		pkgRoot: params.pkgRoot
	});
	const hasPnpmIsolatedMetadata = pnpmIsolatedPackage ? true : await hasPnpmIsolatedProjectMetadata(params.pkgRoot, params.packageName);
	const verifiedPnpmIsolatedGlobalRoot = pnpmIsolatedPackage?.globalRoot ?? (hasPnpmIsolatedMetadata ? inferredPnpmIsolatedGlobalRoot : null);
	const honoredPackageRootGlobalRoot = params.honorPackageRoot ? inferGlobalRootFromPackageRoot(params.pkgRoot) : null;
	const pnpmPackageRootGlobalRoot = verifiedPnpmIsolatedGlobalRoot || await isPnpmGlobalPackageRoot(params.pkgRoot) ? inferPnpmGlobalRootFromPackageRoot(params.pkgRoot) : null;
	const bunPackageRootGlobalRoot = inferBunGlobalRootFromPackageRoot(params.pkgRoot);
	const honoredDirectNpmRoot = verifiedPnpmIsolatedGlobalRoot === null && pnpmIsolatedPackage === null && pnpmPackageRootGlobalRoot === null && bunPackageRootGlobalRoot === null && isDirectNpmNodeModulesRoot(honoredPackageRootGlobalRoot);
	const command = bunPackageRootGlobalRoot ? resolveInstallCommandForManager(params.manager, "bun", params.pkgRoot) : verifiedPnpmIsolatedGlobalRoot || pnpmPackageRootGlobalRoot ? resolveInstallCommandForManager(params.manager, "pnpm", params.pkgRoot) : honoredDirectNpmRoot ? resolveInstallCommandForManager(params.manager, "npm", params.pkgRoot) : normalizeGlobalInstallCommand(params.manager, params.pkgRoot);
	const globalRoot = requestedCommand.manager === "pnpm" && command.manager === requestedCommand.manager && command.command === requestedCommand.command ? requestedPnpmGlobalRoot : await resolveGlobalRoot(command, params.runCommand, params.timeoutMs, params.pkgRoot);
	const pkgRootGlobalRoot = command.manager === "pnpm" ? pnpmPackageRootGlobalRoot : null;
	const npmPackageRootGlobalRoot = command.manager === "npm" && inferNpmPrefixFromPackageRoot(params.pkgRoot) ? inferGlobalRootFromPackageRoot(params.pkgRoot) : null;
	const targetGlobalRoot = (command.manager === "bun" ? bunPackageRootGlobalRoot : null) ?? (command.manager === "pnpm" ? verifiedPnpmIsolatedGlobalRoot : null) ?? pkgRootGlobalRoot ?? (command.manager === "npm" ? honoredPackageRootGlobalRoot : null) ?? npmPackageRootGlobalRoot ?? globalRoot;
	const pnpmIsolatedLayoutVersion = pnpmIsolatedPackage?.layoutVersion ?? resolvePnpmIsolatedLayoutVersion(verifiedPnpmIsolatedGlobalRoot);
	const fallbackPackageRoot = targetGlobalRoot ? resolvePackageRootFromGlobalRoot({
		globalRoot: targetGlobalRoot,
		packageName: params.packageName
	}) : null;
	const packageRoot = command.manager === "pnpm" ? pnpmIsolatedPackage?.packageRoot ?? (verifiedPnpmIsolatedGlobalRoot && params.pkgRoot ? params.pkgRoot : fallbackPackageRoot) : fallbackPackageRoot;
	return {
		...command,
		...command.manager === "pnpm" && pnpmIsolatedLayoutVersion !== null ? { pnpmIsolated: { layoutVersion: pnpmIsolatedLayoutVersion } } : {},
		globalRoot: targetGlobalRoot,
		packageRoot,
		...honoredPackageRootGlobalRoot && targetGlobalRoot === honoredPackageRootGlobalRoot && honoredDirectNpmRoot ? { directNodeModulesRoot: true } : {}
	};
}
/**
* Identifies which global package manager owns an existing package root.
* Command probes are checked first, then pnpm/bun layout fingerprints.
*/
async function detectGlobalInstallManagerForRoot(runCommand, pkgRoot, timeoutMs) {
	const pkgReal = await tryRealpath(pkgRoot);
	for (const { manager, argv } of [{
		manager: "npm",
		argv: [
			"npm",
			"root",
			"-g"
		]
	}, {
		manager: "pnpm",
		argv: [
			"pnpm",
			"root",
			"-g"
		]
	}]) {
		const res = await runCommand(argv, { timeoutMs }).catch(() => null);
		if (res?.code !== 0) continue;
		const globalRoot = readPackageManagerProbeValue(res.stdout);
		if (!globalRoot) continue;
		const globalReal = await tryRealpath(globalRoot);
		if (manager === "pnpm") {
			for (const name of ALL_PACKAGE_NAMES) if (await resolvePnpmIsolatedGlobalPackage({
				globalRoot,
				packageName: name,
				pkgRoot
			})) return "pnpm";
		}
		for (const name of ALL_PACKAGE_NAMES) {
			const expectedReal = await tryRealpath(node_path.default.join(globalReal, name));
			if (node_path.default.resolve(expectedReal) === node_path.default.resolve(pkgReal)) return manager;
		}
	}
	if (await isPnpmGlobalPackageRoot(pkgRoot)) return "pnpm";
	const bunGlobalReal = await tryRealpath(resolveBunGlobalRoot());
	for (const name of ALL_PACKAGE_NAMES) {
		const bunExpectedReal = await tryRealpath(node_path.default.join(bunGlobalReal, name));
		if (node_path.default.resolve(bunExpectedReal) === node_path.default.resolve(pkgReal)) return "bun";
	}
	if (resolveNpmCommandBesidePackageRoot(pkgRoot)) return "npm";
	return null;
}
/**
* Builds the primary package-manager argv for a global Operator install.
* npm receives quiet/freshness-bypass flags; pnpm and Bun approve Operator's lifecycle.
*/
function globalInstallArgs(managerOrCommand, spec, pkgRoot, installPrefix, installCwd) {
	const resolved = normalizeGlobalInstallCommand(managerOrCommand, pkgRoot);
	if (resolved.manager === "pnpm") return [
		resolved.command,
		"add",
		"-g",
		...installPrefix ? ["--global-dir", installPrefix] : [],
		...resolved.pnpmIsolated?.globalBinDir ? ["--global-bin-dir", resolved.pnpmIsolated.globalBinDir] : [],
		PNPM_OPERATOR_BUILD_ALLOWLIST_FLAG,
		spec
	];
	if (resolved.manager === "bun") return [
		resolved.command,
		"add",
		"-g",
		BUN_OPERATOR_TRUST_FLAG,
		resolveBunGlobalInstallSpec(spec)
	];
	return [
		resolved.command,
		"i",
		"-g",
		resolveNpmInstallScriptsAllowFlag(spec, installCwd),
		...installPrefix ? ["--prefix", installPrefix] : [],
		spec,
		...NPM_GLOBAL_INSTALL_QUIET_FLAGS,
		...require_install_source_utils.createNpmFreshnessBypassArgs(process.env, /* @__PURE__ */ new Date(), { npmConfigPrefix: installPrefix })
	];
}
/**
* Builds npm's retry argv without optional dependencies.
* Non-npm managers have no equivalent fallback and return null.
*/
function globalInstallFallbackArgs(managerOrCommand, spec, pkgRoot, installPrefix, installCwd) {
	const resolved = normalizeGlobalInstallCommand(managerOrCommand, pkgRoot);
	if (resolved.manager !== "npm") return null;
	return [
		resolved.command,
		"i",
		"-g",
		resolveNpmInstallScriptsAllowFlag(spec, installCwd),
		...installPrefix ? ["--prefix", installPrefix] : [],
		spec,
		"--omit=optional",
		...NPM_GLOBAL_INSTALL_QUIET_FLAGS,
		...require_install_source_utils.createNpmFreshnessBypassArgs(process.env, /* @__PURE__ */ new Date(), { npmConfigPrefix: installPrefix })
	];
}
/** Removes leftover hidden global package directories from interrupted renames. */
async function cleanupGlobalRenameDirs(params) {
	const removed = [];
	const root = params.globalRoot.trim();
	const name = params.packageName.trim();
	if (!root || !name) return { removed };
	const prefix = `${GLOBAL_RENAME_PREFIX}${name}-`;
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(root);
	} catch {
		return { removed };
	}
	for (const entry of entries) {
		if (!entry.startsWith(prefix)) continue;
		const target = node_path.default.join(root, entry);
		try {
			if (!(await node_fs_promises.default.lstat(target)).isDirectory()) continue;
			await node_fs_promises.default.rm(target, {
				recursive: true,
				force: true
			});
			removed.push(entry);
		} catch {}
	}
	return { removed };
}
//#endregion
//#region src/infra/package-update-steps.ts
const PACKAGE_MANAGER_SWAP_SOURCE_HARDLINKS = "allow";
const NPM_PACK_QUIET_FLAGS = ["--json", "--loglevel=error"];
const PACKAGE_INSTALL_GUARD_PATH = node_path.default.join("dist", "operator-install-guard");
const PACKAGE_LIFECYCLE_PENDING_PATH = ".operator-lifecycle-pending";
const PACKAGE_PREINSTALL_SCRIPT_PATH = node_path.default.join("scripts", "preinstall-package-manager-warning.mjs");
async function resolveCanonicalPath(filePath) {
	return node_path.default.resolve(await node_fs_promises.default.realpath(filePath).catch(() => filePath));
}
async function runPnpmPreflightProbe(params) {
	const startedAt = Date.now();
	const argv = [params.installTarget.command, ...params.args];
	const probeCwd = params.installTarget.globalRoot ?? void 0;
	try {
		const result = await params.runCommand(argv, {
			timeoutMs: params.timeoutMs,
			env: params.env,
			...probeCwd ? { cwd: probeCwd } : {}
		});
		if (result.code === 0) return {
			result,
			failedStep: null
		};
		return {
			result: null,
			failedStep: {
				name: "pnpm isolated install preflight",
				command: argv.join(" "),
				cwd: probeCwd ?? process.cwd(),
				durationMs: Date.now() - startedAt,
				exitCode: result.code ?? 1,
				stdoutTail: result.stdout || null,
				stderrTail: result.stderr || `Unable to run ${argv.join(" ")}.`
			}
		};
	} catch (error) {
		return {
			result: null,
			failedStep: {
				name: "pnpm isolated install preflight",
				command: argv.join(" "),
				cwd: probeCwd ?? process.cwd(),
				durationMs: Date.now() - startedAt,
				exitCode: 1,
				stdoutTail: null,
				stderrTail: require_errors.formatErrorMessage(error)
			}
		};
	}
}
async function validatePnpmIsolatedUpdate(params) {
	const owner = params.installTarget.pnpmIsolated;
	if (!owner) return {
		globalBinDir: null,
		failedStep: null
	};
	const activePackages = await listActivePnpmIsolatedGlobalPackages({
		globalRoot: params.installTarget.globalRoot,
		packageName: params.packageName
	});
	const activePackageRoots = activePackages.map((entry) => entry.packageRoot);
	const siblingPackages = [...new Set(activePackages.flatMap((entry) => entry.packageNames.filter((name) => name !== params.packageName)))].toSorted((a, b) => a.localeCompare(b));
	if (siblingPackages.length > 0) return {
		globalBinDir: null,
		failedStep: {
			name: "pnpm isolated install preflight",
			command: `inspect ${params.installTarget.globalRoot ?? "pnpm install"}`,
			cwd: params.installTarget.globalRoot ?? process.cwd(),
			durationMs: 0,
			exitCode: 1,
			stdoutTail: null,
			stderrTail: `Operator shares a pnpm ${owner.layoutVersion} global install group with ${siblingPackages.join(", ")}. Automatic update stopped before mutation; update the group manually to preserve its sibling packages.`
		}
	};
	const invokingPackageRoot = params.installTarget.packageRoot;
	const invokingInstallOwner = await resolvePnpmIsolatedInstallOwner(invokingPackageRoot);
	const activeInstallOwners = await Promise.all(activePackageRoots.map((packageRoot) => resolvePnpmIsolatedInstallOwner(packageRoot)));
	const ownerMatchCount = invokingInstallOwner ? activeInstallOwners.filter((installOwner) => installOwner === invokingInstallOwner).length : 0;
	if (!invokingPackageRoot || activePackageRoots.length !== 1 || ownerMatchCount !== 1) return {
		globalBinDir: null,
		failedStep: {
			name: "pnpm isolated install preflight",
			command: `inspect ${params.installTarget.globalRoot ?? "pnpm install"}`,
			cwd: params.installTarget.globalRoot ?? process.cwd(),
			durationMs: 0,
			exitCode: 1,
			stdoutTail: null,
			stderrTail: `Expected exactly one active pnpm ${owner.layoutVersion} Operator install owned by the invoking project; found ${activePackageRoots.length} active installs and ${ownerMatchCount} owner matches. Automatic update stopped before mutation.`
		}
	};
	const rootProbe = await runPnpmPreflightProbe({
		...params,
		args: ["root", "-g"]
	});
	if (rootProbe.failedStep || !rootProbe.result) return {
		globalBinDir: null,
		failedStep: rootProbe.failedStep
	};
	const reportedGlobalRoot = readPackageManagerProbeValue(rootProbe.result.stdout);
	const expectedGlobalRoot = params.installTarget.globalRoot;
	if (!reportedGlobalRoot || !expectedGlobalRoot || await resolveCanonicalPath(reportedGlobalRoot) !== await resolveCanonicalPath(expectedGlobalRoot)) return {
		globalBinDir: null,
		failedStep: {
			name: "pnpm isolated install preflight",
			command: `${params.installTarget.command} root -g`,
			cwd: expectedGlobalRoot ?? process.cwd(),
			durationMs: 0,
			exitCode: 1,
			stdoutTail: rootProbe.result.stdout || null,
			stderrTail: `The active pnpm command owns ${reportedGlobalRoot || "an unknown global root"}, not the invoking Operator install at ${expectedGlobalRoot ?? "an unknown root"}. Automatic update stopped before mutation.`
		}
	};
	const binProbe = await runPnpmPreflightProbe({
		...params,
		args: ["bin", "-g"]
	});
	const globalBinDir = binProbe.result ? readPackageManagerProbeValue(binProbe.result.stdout) || null : null;
	if (binProbe.failedStep || !globalBinDir) return {
		globalBinDir: null,
		failedStep: binProbe.failedStep ?? {
			name: "pnpm isolated install preflight",
			command: `${params.installTarget.command} bin -g`,
			cwd: expectedGlobalRoot,
			durationMs: 0,
			exitCode: 1,
			stdoutTail: null,
			stderrTail: "The owning pnpm command did not report its global bin directory."
		}
	};
	const versionProbe = await runPnpmPreflightProbe({
		...params,
		args: ["--version"]
	});
	if (versionProbe.failedStep || !versionProbe.result) return {
		globalBinDir: null,
		failedStep: versionProbe.failedStep
	};
	const reportedVersion = readPackageManagerProbeValue(versionProbe.result.stdout);
	if (require_runtime_guard.parseSemver(reportedVersion)?.major !== owner.layoutVersion) return {
		globalBinDir: null,
		failedStep: {
			name: "pnpm isolated install preflight",
			command: `${params.installTarget.command} --version`,
			cwd: expectedGlobalRoot,
			durationMs: 0,
			exitCode: 1,
			stdoutTail: versionProbe.result.stdout || null,
			stderrTail: `Operator belongs to pnpm isolated layout v${owner.layoutVersion}, but the update command reports pnpm ${reportedVersion || "unknown"}. Use pnpm ${owner.layoutVersion} for this install or update it manually.`
		}
	};
	return {
		globalBinDir,
		failedStep: null
	};
}
const PACKAGE_POSTINSTALL_SCRIPT_PATH = node_path.default.join("scripts", "postinstall-bundled-plugins.mjs");
function isBlockingPackageUpdateStep(step) {
	return step.exitCode !== 0 && step.advisory === void 0;
}
async function removePathBestEffort(targetPath) {
	try {
		await node_fs_promises.default.rm(targetPath, {
			recursive: true,
			force: true,
			maxRetries: process.platform === "win32" ? 5 : 2,
			retryDelay: 100
		});
		return true;
	} catch {
		return false;
	}
}
async function readPackageVersionIfPresent(packageRoot) {
	if (!packageRoot) return null;
	try {
		return await require_package_json.readPackageVersion(packageRoot);
	} catch {
		return null;
	}
}
function isUnambiguousNpmPrefixGlobalRoot(globalRoot) {
	const trimmed = globalRoot?.trim();
	if (!trimmed) return false;
	const normalized = node_path.default.resolve(trimmed);
	if (node_path.default.basename(normalized) !== "node_modules") return false;
	const parentDir = node_path.default.dirname(normalized);
	if (node_path.default.basename(parentDir) === "lib") return true;
	return process.platform === "win32" && node_path.default.basename(parentDir).toLowerCase() === "npm";
}
function resolveStagedNpmTargetLayout(installTarget) {
	const targetLayout = resolveNpmGlobalPrefixLayoutFromGlobalRoot(installTarget.globalRoot, { allowDirectNodeModulesRoot: installTarget.directNodeModulesRoot === true });
	if (!targetLayout) return null;
	if (installTarget.manager === "npm" || isUnambiguousNpmPrefixGlobalRoot(installTarget.globalRoot)) return targetLayout;
	return null;
}
function stripPackageAlias(spec, packageName) {
	const trimmed = spec.trim();
	const prefix = `${packageName.trim()}@`;
	return trimmed.toLowerCase().startsWith(prefix.toLowerCase()) ? trimmed.slice(prefix.length).trim() : trimmed;
}
function isHttpGitUrlSpec(spec) {
	try {
		const url = new URL(spec);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const pathname = url.pathname.replace(/\/+$/u, "");
		if (pathname.endsWith(".git")) return true;
		const parts = pathname.split("/").filter(Boolean);
		return url.hostname.toLowerCase() === "github.com" && parts.length === 2;
	} catch {
		return false;
	}
}
function isGitHubShorthandSpec(spec) {
	const [repo] = spec.split("#", 1);
	if (!repo || repo.startsWith(".") || repo.startsWith("/") || repo.startsWith("@")) return false;
	const parts = repo.split("/");
	return parts.length === 2 && parts.every((part) => /^[^\s/:@]+$/u.test(part));
}
function isNpmGitSourceInstallSpec(spec, packageName) {
	const target = stripPackageAlias(spec, packageName);
	return /^github:/i.test(target) || /^git\+(?:ssh|https|http|file):/i.test(target) || /^git:/i.test(target) || /^ssh:\/\//i.test(target) || /^[^@\s]+@[^:\s]+:[^#\s]+(?:#.*)?$/u.test(target) || isHttpGitUrlSpec(target) || isGitHubShorthandSpec(target);
}
function resolvePnpmInstallSpecFromCwd(spec, packageName, sourceCwd) {
	const trimmed = spec.trim();
	const aliasPrefix = `${packageName.trim()}@`;
	const hasAlias = trimmed.toLowerCase().startsWith(aliasPrefix.toLowerCase());
	const targetSpec = hasAlias ? trimmed.slice(aliasPrefix.length).trim() : trimmed;
	const restoreAlias = (target) => hasAlias ? `${aliasPrefix}${target}` : target;
	if (/^~[\\/]/u.test(targetSpec)) return spec;
	const localProtocol = /^(file:|git\+file:|link:)(.*)$/iu.exec(targetSpec);
	if (localProtocol) {
		const protocol = localProtocol[1] ?? "";
		const target = localProtocol[2]?.trim() ?? "";
		const fragmentIndex = protocol.toLowerCase() === "git+file:" ? target.indexOf("#") : -1;
		const targetPath = fragmentIndex >= 0 ? target.slice(0, fragmentIndex) : target;
		const fragment = fragmentIndex >= 0 ? target.slice(fragmentIndex) : "";
		if (targetPath && !/^~[\\/]/u.test(targetPath) && !node_path.default.isAbsolute(targetPath) && !node_path.default.win32.isAbsolute(targetPath)) {
			const windowsPath = /^[a-z]:[\\/]/iu.test(sourceCwd) || sourceCwd.startsWith("\\\\");
			const resolvedTarget = (windowsPath ? node_path.default.win32 : node_path.default).resolve(sourceCwd, targetPath);
			if (protocol.toLowerCase() === "git+file:") return restoreAlias(`git+${(0, node_url.pathToFileURL)(resolvedTarget, { windows: windowsPath }).href}${fragment}`);
			return restoreAlias(`${protocol}${resolvedTarget}`);
		}
		return spec;
	}
	return /^\.{1,2}(?:[\\/]|$)/u.test(targetSpec) ? restoreAlias(node_path.default.resolve(sourceCwd, targetSpec)) : spec;
}
async function createStagedNpmInstall(installTarget, packageName) {
	const targetLayout = resolveStagedNpmTargetLayout(installTarget);
	if (!targetLayout) return null;
	await node_fs_promises.default.mkdir(targetLayout.globalRoot, { recursive: true });
	const prefix = await node_fs_promises.default.mkdtemp(node_path.default.join(targetLayout.globalRoot, ".operator-update-stage-"));
	const layout = resolveNpmGlobalPrefixLayoutFromPrefix(prefix);
	const command = installTarget.manager === "npm" ? installTarget.command : "npm";
	return {
		prefix,
		layout,
		packageRoot: node_path.default.join(layout.globalRoot, packageName),
		installTarget: {
			manager: "npm",
			command,
			globalRoot: layout.globalRoot,
			packageRoot: node_path.default.join(layout.globalRoot, packageName)
		}
	};
}
async function findPackedTarball(packDir) {
	const tarballs = (await node_fs_promises.default.readdir(packDir).catch(() => [])).filter((entry) => entry.endsWith(".tgz"));
	if (tarballs.length !== 1) return null;
	return node_path.default.join(packDir, tarballs[0] ?? "");
}
async function prepareNpmGitSourceInstallSpec(params) {
	if (params.installTarget.manager !== "npm" || !isNpmGitSourceInstallSpec(params.installSpec, params.packageName)) return {
		installSpec: params.installSpec,
		installCwd: params.installCwd ?? null,
		packDir: null,
		steps: [],
		failedStep: null
	};
	const packDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-update-pack-"));
	const packStep = await params.runStep({
		name: "global update pack",
		argv: [
			params.installTarget.command,
			"pack",
			params.installSpec,
			"--pack-destination",
			packDir,
			...NPM_PACK_QUIET_FLAGS
		],
		cwd: params.installCwd,
		env: params.env,
		timeoutMs: params.timeoutMs
	});
	if (packStep.exitCode !== 0) return {
		installSpec: params.installSpec,
		installCwd: params.installCwd ?? null,
		packDir,
		steps: [packStep],
		failedStep: packStep
	};
	const tarball = await findPackedTarball(packDir);
	if (!tarball) {
		const failedStep = {
			name: "global update pack verify",
			command: `find packed tarball in ${packDir}`,
			cwd: packDir,
			durationMs: 0,
			exitCode: 1,
			stdoutTail: null,
			stderrTail: `expected exactly one .tgz from npm pack ${params.installSpec}`
		};
		return {
			installSpec: params.installSpec,
			installCwd: params.installCwd ?? null,
			packDir,
			steps: [packStep, failedStep],
			failedStep
		};
	}
	return {
		installSpec: tarball,
		installCwd: packDir,
		packDir,
		steps: [packStep],
		failedStep: null
	};
}
async function prepareStagedNpmInstall(installTarget, packageName) {
	const startedAt = Date.now();
	try {
		return {
			stagedInstall: await createStagedNpmInstall(installTarget, packageName),
			failedStep: null
		};
	} catch (err) {
		return {
			stagedInstall: null,
			failedStep: {
				name: "global install stage",
				command: "prepare staged npm install",
				cwd: (installTarget.manager === "npm" ? resolveNpmGlobalPrefixLayoutFromGlobalRoot(installTarget.globalRoot, { allowDirectNodeModulesRoot: installTarget.directNodeModulesRoot === true }) : null)?.prefix ?? installTarget.globalRoot ?? process.cwd(),
				durationMs: Date.now() - startedAt,
				exitCode: 1,
				stdoutTail: null,
				stderrTail: require_errors.formatErrorMessage(err)
			}
		};
	}
}
async function cleanupStagedNpmInstall(stage) {
	if (!stage) return;
	await removePathBestEffort(stage.prefix);
}
async function copyPathEntry(source, destination) {
	const stat = await node_fs_promises.default.lstat(source);
	await removePathBestEffort(destination);
	if (stat.isSymbolicLink()) {
		await node_fs_promises.default.symlink(await node_fs_promises.default.readlink(source), destination);
		return;
	}
	if (stat.isDirectory()) {
		await node_fs_promises.default.cp(source, destination, {
			recursive: true,
			force: true,
			preserveTimestamps: false
		});
		return;
	}
	await node_fs_promises.default.copyFile(source, destination);
	await node_fs_promises.default.chmod(destination, stat.mode).catch(() => void 0);
}
async function replaceNpmBinShims(params) {
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(params.stageLayout.binDir);
	} catch {
		return;
	}
	const names = /* @__PURE__ */ new Set([params.packageName, "@gabrielvfonseca/operator"]);
	const shimEntries = entries.filter((entry) => {
		const parsed = node_path.default.parse(entry);
		return names.has(entry) || names.has(parsed.name);
	});
	if (shimEntries.length === 0) return;
	const backup = {
		backupDir: await node_fs_promises.default.mkdtemp(node_path.default.join(params.targetLayout.globalRoot, ".operator-shim-backup-")),
		targetBinDir: params.targetLayout.binDir,
		entries: []
	};
	try {
		await node_fs_promises.default.mkdir(params.targetLayout.binDir, { recursive: true });
		for (const entry of shimEntries) {
			const destination = node_path.default.join(params.targetLayout.binDir, entry);
			const hadExisting = await (0, _openclaw_fs_safe_advanced.pathExists)(destination);
			backup.entries.push({
				name: entry,
				hadExisting
			});
			if (hadExisting) await copyPathEntry(destination, node_path.default.join(backup.backupDir, entry));
		}
		for (const entry of shimEntries) await copyPathEntry(node_path.default.join(params.stageLayout.binDir, entry), node_path.default.join(params.targetLayout.binDir, entry));
	} catch (err) {
		await restoreNpmBinShimBackup(backup);
		throw err;
	} finally {
		await removePathBestEffort(backup.backupDir);
	}
}
async function restoreNpmBinShimBackup(backup) {
	await node_fs_promises.default.mkdir(backup.targetBinDir, { recursive: true });
	for (const entry of backup.entries) {
		const destination = node_path.default.join(backup.targetBinDir, entry.name);
		await removePathBestEffort(destination);
		if (entry.hadExisting) await copyPathEntry(node_path.default.join(backup.backupDir, entry.name), destination);
	}
}
async function swapStagedNpmInstall(params) {
	const startedAt = Date.now();
	const targetLayout = resolveNpmGlobalPrefixLayoutFromGlobalRoot(params.installTarget.globalRoot, { allowDirectNodeModulesRoot: params.installTarget.directNodeModulesRoot === true });
	const targetPackageRoot = params.installTarget.packageRoot;
	if (!targetLayout || !targetPackageRoot) return {
		name: "global install swap",
		command: "swap staged npm install",
		cwd: params.stage.prefix,
		durationMs: Date.now() - startedAt,
		exitCode: 1,
		stdoutTail: null,
		stderrTail: "cannot resolve npm global prefix layout"
	};
	const backupRoot = node_path.default.join(targetLayout.globalRoot, `.operator-${process.pid}-${Date.now()}`);
	let movedExisting = false;
	let movedStaged = false;
	let removedBackup = true;
	try {
		await node_fs_promises.default.mkdir(targetLayout.globalRoot, { recursive: true });
		if (await (0, _openclaw_fs_safe_advanced.pathExists)(targetPackageRoot)) {
			await require_replace_file.movePathWithCopyFallback({
				from: targetPackageRoot,
				sourceHardlinks: PACKAGE_MANAGER_SWAP_SOURCE_HARDLINKS,
				to: backupRoot
			});
			movedExisting = true;
		}
		await require_replace_file.movePathWithCopyFallback({
			from: params.stage.packageRoot,
			sourceHardlinks: PACKAGE_MANAGER_SWAP_SOURCE_HARDLINKS,
			to: targetPackageRoot
		});
		movedStaged = true;
		if (params.installTarget.directNodeModulesRoot !== true) await replaceNpmBinShims({
			stageLayout: params.stage.layout,
			targetLayout,
			packageName: params.packageName
		});
		if (movedExisting) removedBackup = await removePathBestEffort(backupRoot);
		return {
			name: "global install swap",
			command: `swap ${params.stage.packageRoot} -> ${targetPackageRoot}`,
			cwd: targetLayout.globalRoot,
			durationMs: Date.now() - startedAt,
			exitCode: 0,
			stdoutTail: movedExisting ? removedBackup ? `replaced ${params.packageName}` : `replaced ${params.packageName}; preserved old package at ${backupRoot} for delayed cleanup` : `installed ${params.packageName}`,
			stderrTail: null
		};
	} catch (err) {
		if (movedStaged) await removePathBestEffort(targetPackageRoot);
		if (movedExisting) await require_replace_file.movePathWithCopyFallback({
			from: backupRoot,
			sourceHardlinks: PACKAGE_MANAGER_SWAP_SOURCE_HARDLINKS,
			to: targetPackageRoot
		}).catch(() => void 0);
		return {
			name: "global install swap",
			command: `swap ${params.stage.packageRoot} -> ${targetPackageRoot}`,
			cwd: targetLayout.globalRoot,
			durationMs: Date.now() - startedAt,
			exitCode: 1,
			stdoutTail: null,
			stderrTail: require_errors.formatErrorMessage(err)
		};
	}
}
/**
* Runs the global package update flow, including npm staging when possible,
* package verification, optional post-verification, and cleanup.
*/
async function runGlobalPackageUpdateSteps(params) {
	let stagedInstall;
	let packedInstallDir = null;
	try {
		const pnpmPreflight = await validatePnpmIsolatedUpdate({
			installTarget: params.installTarget,
			packageName: params.packageName,
			runCommand: params.runCommand,
			timeoutMs: params.timeoutMs,
			env: params.env
		});
		if (pnpmPreflight.failedStep) return {
			steps: [pnpmPreflight.failedStep],
			verifiedPackageRoot: params.packageRoot ?? params.installTarget.packageRoot,
			afterVersion: null,
			failedStep: pnpmPreflight.failedStep
		};
		const effectiveInstallEnv = params.env;
		const installEnv = effectiveInstallEnv === void 0 ? {} : { env: effectiveInstallEnv };
		const resolvedInstallTarget = params.installTarget.pnpmIsolated && pnpmPreflight.globalBinDir ? {
			...params.installTarget,
			pnpmIsolated: {
				...params.installTarget.pnpmIsolated,
				globalBinDir: pnpmPreflight.globalBinDir
			}
		} : params.installTarget;
		const preparedInstall = await prepareStagedNpmInstall(resolvedInstallTarget, params.packageName);
		stagedInstall = preparedInstall.stagedInstall;
		if (preparedInstall.failedStep) return {
			steps: [preparedInstall.failedStep],
			verifiedPackageRoot: params.packageRoot ?? null,
			afterVersion: null,
			failedStep: preparedInstall.failedStep
		};
		const steps = [];
		const installCommandTarget = stagedInstall?.installTarget ?? resolvedInstallTarget;
		const preparedSpec = await prepareNpmGitSourceInstallSpec({
			installTarget: installCommandTarget,
			installSpec: params.installSpec,
			packageName: params.packageName,
			runStep: params.runStep,
			timeoutMs: params.timeoutMs,
			env: params.env,
			installCwd: params.installCwd
		});
		packedInstallDir = preparedSpec.packDir;
		steps.push(...preparedSpec.steps);
		if (preparedSpec.failedStep) return {
			steps,
			verifiedPackageRoot: params.packageRoot ?? null,
			afterVersion: null,
			failedStep: preparedSpec.failedStep
		};
		const installLocation = stagedInstall?.prefix ?? (installCommandTarget.manager === "pnpm" ? resolvePnpmGlobalDirFromGlobalRoot(installCommandTarget.globalRoot) : null);
		const pnpmMutationCwd = installCommandTarget.manager === "pnpm" ? installCommandTarget.globalRoot : null;
		const updateCwd = pnpmMutationCwd ?? preparedSpec.installCwd;
		const updateInstallSpec = pnpmMutationCwd ? resolvePnpmInstallSpecFromCwd(preparedSpec.installSpec, params.packageName, preparedSpec.installCwd ?? process.cwd()) : preparedSpec.installSpec;
		const updateStep = await params.runStep({
			name: "global update",
			argv: globalInstallArgs(installCommandTarget, updateInstallSpec, void 0, installLocation, preparedSpec.installCwd),
			...updateCwd ? { cwd: updateCwd } : {},
			...installEnv,
			timeoutMs: params.timeoutMs
		});
		steps.push(updateStep);
		let finalInstallStep = updateStep;
		if (updateStep.exitCode !== 0) {
			await cleanupStagedNpmInstall(stagedInstall);
			stagedInstall = null;
			const preparedFallbackInstall = await prepareStagedNpmInstall(params.installTarget, params.packageName);
			stagedInstall = preparedFallbackInstall.stagedInstall;
			if (preparedFallbackInstall.failedStep) {
				steps.push(preparedFallbackInstall.failedStep);
				return {
					steps,
					verifiedPackageRoot: params.packageRoot ?? null,
					afterVersion: null,
					failedStep: preparedFallbackInstall.failedStep
				};
			}
			const fallbackArgv = globalInstallFallbackArgs(stagedInstall?.installTarget ?? params.installTarget, preparedSpec.installSpec, void 0, stagedInstall?.prefix, preparedSpec.installCwd);
			if (fallbackArgv) {
				const fallbackStep = await params.runStep({
					name: "global update (omit optional)",
					argv: fallbackArgv,
					...preparedSpec.installCwd ? { cwd: preparedSpec.installCwd } : {},
					...installEnv,
					timeoutMs: params.timeoutMs
				});
				steps.push(fallbackStep);
				finalInstallStep = fallbackStep;
			} else {
				await cleanupStagedNpmInstall(stagedInstall);
				stagedInstall = null;
			}
		}
		const refreshedPnpmPackageRoot = finalInstallStep.exitCode === 0 && !stagedInstall && params.installTarget.pnpmIsolated ? await (async () => {
			const activeRoots = (await listActivePnpmIsolatedGlobalPackages({
				globalRoot: params.installTarget.globalRoot,
				packageName: params.packageName
			})).map((entry) => entry.packageRoot);
			if (activeRoots.length !== 1 || !params.installTarget.packageRoot) return null;
			const replacementRoot = activeRoots[0];
			if (!replacementRoot) return null;
			const [replacementOwner, previousOwner] = await Promise.all([resolvePnpmIsolatedInstallOwner(replacementRoot), resolvePnpmIsolatedInstallOwner(params.installTarget.packageRoot)]);
			return replacementOwner && previousOwner && replacementOwner !== previousOwner ? replacementRoot : null;
		})() : null;
		if (finalInstallStep.exitCode === 0 && !stagedInstall && params.installTarget.manager === "pnpm" && params.installTarget.pnpmIsolated !== void 0 && params.installTarget.packageRoot !== null && refreshedPnpmPackageRoot === null) {
			const replacementStep = {
				name: "global install verify",
				command: `resolve pnpm replacement in ${params.installTarget.globalRoot ?? "unknown root"}`,
				cwd: params.installTarget.globalRoot ?? process.cwd(),
				durationMs: 0,
				exitCode: 1,
				stderrTail: "could not identify a unique active pnpm replacement package"
			};
			steps.push(replacementStep);
			return {
				steps,
				verifiedPackageRoot: params.packageRoot ?? null,
				afterVersion: null,
				failedStep: replacementStep
			};
		}
		const livePackageRoot = refreshedPnpmPackageRoot ?? params.installTarget.packageRoot ?? params.packageRoot ?? (await resolveGlobalInstallTarget({
			manager: params.installTarget,
			runCommand: params.runCommand,
			timeoutMs: params.timeoutMs,
			packageName: params.packageName
		})).packageRoot ?? null;
		const verificationPackageRoot = stagedInstall?.packageRoot ?? livePackageRoot;
		let verifiedPackageRoot = livePackageRoot ?? verificationPackageRoot;
		if (finalInstallStep.exitCode === 0 && !stagedInstall && params.installTarget.manager === "pnpm" && verificationPackageRoot) {
			const installGuardPath = node_path.default.join(verificationPackageRoot, PACKAGE_INSTALL_GUARD_PATH);
			const lifecyclePendingPath = node_path.default.join(verificationPackageRoot, PACKAGE_LIFECYCLE_PENDING_PATH);
			const hasInstallGuard = await (0, _openclaw_fs_safe_advanced.pathExists)(installGuardPath);
			const hasPendingLifecycle = await (0, _openclaw_fs_safe_advanced.pathExists)(lifecyclePendingPath);
			if (hasInstallGuard || hasPendingLifecycle) {
				if (!hasPendingLifecycle) try {
					await node_fs_promises.default.writeFile(lifecyclePendingPath, "pending\n", "utf8");
				} catch (error) {
					const markerStep = {
						name: "pnpm package lifecycle marker",
						command: `write ${lifecyclePendingPath}`,
						cwd: verificationPackageRoot,
						durationMs: 0,
						exitCode: 1,
						stderrTail: require_errors.formatErrorMessage(error)
					};
					steps.push(markerStep);
					return {
						steps,
						verifiedPackageRoot,
						afterVersion: null,
						failedStep: markerStep
					};
				}
				const lifecycleScripts = [...hasInstallGuard ? [["pnpm package preinstall", PACKAGE_PREINSTALL_SCRIPT_PATH]] : [], ["pnpm package postinstall", PACKAGE_POSTINSTALL_SCRIPT_PATH]];
				for (const [name, relativeScript] of lifecycleScripts) {
					const lifecycleStep = await params.runStep({
						name,
						argv: [process.execPath, node_path.default.join(verificationPackageRoot, relativeScript)],
						cwd: verificationPackageRoot,
						env: effectiveInstallEnv,
						timeoutMs: params.timeoutMs
					});
					steps.push(lifecycleStep);
					if (lifecycleStep.exitCode !== 0) return {
						steps,
						verifiedPackageRoot,
						afterVersion: null,
						failedStep: lifecycleStep
					};
				}
				try {
					await node_fs_promises.default.rm(lifecyclePendingPath);
				} catch (error) {
					const finalizeStep = {
						name: "pnpm package lifecycle finalize",
						command: `remove ${lifecyclePendingPath}`,
						cwd: verificationPackageRoot,
						durationMs: 0,
						exitCode: 1,
						stderrTail: require_errors.formatErrorMessage(error)
					};
					steps.push(finalizeStep);
					return {
						steps,
						verifiedPackageRoot,
						afterVersion: null,
						failedStep: finalizeStep
					};
				}
			}
		}
		let afterVersion = null;
		if (finalInstallStep.exitCode === 0 && verificationPackageRoot) {
			const candidateVersion = await require_package_json.readPackageVersion(verificationPackageRoot);
			if (!stagedInstall) afterVersion = candidateVersion;
			const verificationErrors = await collectInstalledGlobalPackageErrors({
				packageRoot: verificationPackageRoot,
				expectedVersion: resolveExpectedInstalledVersionFromSpec(params.packageName, params.installSpec)
			});
			if (verificationErrors.length > 0) steps.push({
				name: "global install verify",
				command: `verify ${verificationPackageRoot}`,
				cwd: verificationPackageRoot,
				durationMs: 0,
				exitCode: 1,
				stderrTail: verificationErrors.join("\n"),
				stdoutTail: null
			});
			if (stagedInstall && verificationErrors.length === 0) {
				const swapStep = await swapStagedNpmInstall({
					stage: stagedInstall,
					installTarget: params.installTarget,
					packageName: params.packageName
				});
				steps.push(swapStep);
				if (swapStep.exitCode === 0) {
					verifiedPackageRoot = params.installTarget.packageRoot ?? verifiedPackageRoot;
					afterVersion = candidateVersion;
				}
			}
			const failedVerifyOrSwap = steps.find((step) => (step.name === "global install verify" || step.name === "global install swap") && step.exitCode !== 0);
			const postVerifyStep = failedVerifyOrSwap ? null : verifiedPackageRoot ? await params.postVerifyStep?.(verifiedPackageRoot) : null;
			if (postVerifyStep) steps.push(postVerifyStep);
			if (failedVerifyOrSwap && stagedInstall) afterVersion = await readPackageVersionIfPresent(livePackageRoot);
		}
		const failedStep = isBlockingPackageUpdateStep(finalInstallStep) ? finalInstallStep : steps.find((step) => step !== updateStep && isBlockingPackageUpdateStep(step)) ?? null;
		return {
			steps,
			verifiedPackageRoot,
			afterVersion,
			failedStep
		};
	} finally {
		await cleanupStagedNpmInstall(stagedInstall ?? null);
		if (packedInstallDir) await removePathBestEffort(packedInstallDir);
	}
}
//#endregion
//#region src/infra/update-package-manager.ts
const PNPM_NPM_FALLBACK_SPEC = "pnpm@11";
async function detectBuildManager(root) {
	return await require_update_check.detectPackageManager(root) ?? "npm";
}
function managerPreferenceOrder(preferred) {
	if (preferred === "pnpm") return [
		"pnpm",
		"npm",
		"bun"
	];
	if (preferred === "bun") return [
		"bun",
		"npm",
		"pnpm"
	];
	return [
		"npm",
		"pnpm",
		"bun"
	];
}
function managerVersionArgs(manager) {
	if (manager === "pnpm") return ["pnpm", "--version"];
	if (manager === "bun") return ["bun", "--version"];
	return ["npm", "--version"];
}
async function isManagerAvailable(runCommand, manager, timeoutMs, env) {
	try {
		return (await runCommand(managerVersionArgs(manager), {
			timeoutMs,
			env
		})).code === 0;
	} catch {
		return false;
	}
}
async function isCommandAvailable(runCommand, argv, timeoutMs, env) {
	try {
		return (await runCommand(argv, {
			timeoutMs,
			env
		})).code === 0;
	} catch {
		return false;
	}
}
function cloneCommandEnv(env) {
	return Object.fromEntries(Object.entries(env ?? process.env).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)]));
}
async function enablePnpmViaCorepack(runCommand, timeoutMs, env) {
	if (!await isCommandAvailable(runCommand, ["corepack", "--version"], timeoutMs, env)) return "missing";
	try {
		if ((await runCommand(["corepack", "enable"], {
			timeoutMs,
			env
		})).code !== 0) return "failed";
	} catch {
		return "failed";
	}
	return await isManagerAvailable(runCommand, "pnpm", timeoutMs, env) ? "enabled" : "failed";
}
async function bootstrapPnpmViaNpm(params) {
	const tempRoot = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-update-pnpm-"));
	const cleanup = async () => {
		await node_fs_promises.default.rm(tempRoot, {
			recursive: true,
			force: true
		}).catch(() => {});
	};
	try {
		if ((await params.runCommand([
			"npm",
			"install",
			"--prefix",
			tempRoot,
			PNPM_NPM_FALLBACK_SPEC
		], {
			timeoutMs: params.timeoutMs,
			env: params.baseEnv
		})).code !== 0) {
			await cleanup();
			return null;
		}
		const env = cloneCommandEnv(params.baseEnv);
		require_path_prepend.applyPathPrepend(env, [node_path.default.join(tempRoot, "node_modules", ".bin")]);
		if (!await isManagerAvailable(params.runCommand, "pnpm", params.timeoutMs, env)) {
			await cleanup();
			return null;
		}
		return {
			env,
			cleanup
		};
	} catch {
		await cleanup();
		return null;
	}
}
/** Resolve the package manager and environment to use for an update build. */
async function resolveUpdateBuildManager(runCommand, root, timeoutMs, baseEnv, requirement = "allow-fallback") {
	const preferred = await detectBuildManager(root);
	if (preferred === "pnpm") {
		if (await isManagerAvailable(runCommand, "pnpm", timeoutMs, baseEnv)) return {
			kind: "resolved",
			manager: "pnpm",
			preferred,
			fallback: false
		};
		const corepackStatus = await enablePnpmViaCorepack(runCommand, timeoutMs, baseEnv);
		if (corepackStatus === "enabled") return {
			kind: "resolved",
			manager: "pnpm",
			preferred,
			fallback: false
		};
		if (await isManagerAvailable(runCommand, "npm", timeoutMs, baseEnv)) {
			const pnpmBootstrap = await bootstrapPnpmViaNpm({
				runCommand,
				timeoutMs,
				baseEnv
			});
			if (pnpmBootstrap) return {
				kind: "resolved",
				manager: "pnpm",
				preferred,
				fallback: false,
				env: pnpmBootstrap.env,
				cleanup: pnpmBootstrap.cleanup
			};
			if (requirement === "require-preferred") return {
				kind: "missing-required",
				preferred,
				reason: "pnpm-npm-bootstrap-failed"
			};
		}
		if (requirement === "require-preferred") {
			if (corepackStatus === "missing") return {
				kind: "missing-required",
				preferred,
				reason: "pnpm-corepack-missing"
			};
			if (corepackStatus === "failed") return {
				kind: "missing-required",
				preferred,
				reason: "pnpm-corepack-enable-failed"
			};
			return {
				kind: "missing-required",
				preferred,
				reason: "preferred-manager-unavailable"
			};
		}
	}
	for (const manager of managerPreferenceOrder(preferred)) if (await isManagerAvailable(runCommand, manager, timeoutMs, baseEnv)) return {
		kind: "resolved",
		manager,
		preferred,
		fallback: manager !== preferred
	};
	if (requirement === "require-preferred") return {
		kind: "missing-required",
		preferred,
		reason: "preferred-manager-unavailable"
	};
	return {
		kind: "resolved",
		manager: "npm",
		preferred,
		fallback: preferred !== "npm"
	};
}
/** Build argv for running a package-manager script. */
function managerScriptArgs(manager, script, args = []) {
	if (manager === "pnpm") return [
		"pnpm",
		script,
		...args
	];
	if (manager === "bun") return [
		"bun",
		"run",
		script,
		...args
	];
	if (args.length > 0) return [
		"npm",
		"run",
		script,
		"--",
		...args
	];
	return [
		"npm",
		"run",
		script
	];
}
/** Build argv for installing dependencies with a package manager. */
function managerInstallArgs(manager, opts) {
	if (manager === "pnpm") return ["pnpm", "install"];
	if (manager === "bun") return ["bun", "install"];
	if (opts?.compatFallback) return [
		"npm",
		"install",
		"--no-package-lock",
		"--legacy-peer-deps"
	];
	return ["npm", "install"];
}
/** Build argv for installing dependencies while skipping lifecycle scripts. */
function managerInstallIgnoreScriptsArgs(manager) {
	if (manager === "pnpm") return [
		"pnpm",
		"install",
		"--ignore-scripts"
	];
	if (manager === "bun") return [
		"bun",
		"install",
		"--ignore-scripts"
	];
	return [
		"npm",
		"install",
		"--ignore-scripts"
	];
}
//#endregion
//#region src/infra/update-runner.ts
function mapManagerResolutionFailure(reason) {
	return reason;
}
const DEFAULT_TIMEOUT_MS = 20 * 6e4;
const MAX_LOG_CHARS = 8e3;
const PREFLIGHT_MAX_COMMITS = 10;
const DEFAULT_PACKAGE_NAME = "@gabrielvfonseca/operator";
const CORE_PACKAGE_NAMES = /* @__PURE__ */ new Set([DEFAULT_PACKAGE_NAME]);
const UPDATE_DEFER_CONFIGURED_PLUGIN_INSTALL_REPAIR_ENV = "OPERATOR_UPDATE_DEFER_CONFIGURED_PLUGIN_INSTALL_REPAIR";
const UPDATE_PARENT_SUPPORTS_DOCTOR_CONFIG_WRITE_ENV = "OPERATOR_UPDATE_PARENT_SUPPORTS_DOCTOR_CONFIG_WRITE";
const UPDATE_PARENT_SUPPORTS_GATEWAY_RESTART_ENV = "OPERATOR_UPDATE_PARENT_SUPPORTS_GATEWAY_RESTART";
const UPDATE_PARENT_ALLOWS_GATEWAY_SERVICE_REPAIR_ENV = "OPERATOR_UPDATE_PARENT_ALLOWS_GATEWAY_SERVICE_REPAIR";
const UPDATE_PARENT_ALLOWS_GATEWAY_ACTIVATION_ENV = "OPERATOR_UPDATE_PARENT_ALLOWS_GATEWAY_ACTIVATION";
const UPDATE_DOCTOR_SERVICE_REPAIR_POLICY_ENV = "OPERATOR_SERVICE_REPAIR_POLICY";
const EXTERNAL_SERVICE_REPAIR_POLICY_MIN_VERSION = "2026.4.25-beta.1";
const PREFLIGHT_TEMP_PREFIX = process.platform === "win32" ? "ocu-pf-" : "operator-update-preflight-";
const PREFLIGHT_WORKTREE_DIRNAME = process.platform === "win32" ? "wt" : "worktree";
const PREFLIGHT_CLEANUP_TIMEOUT_MS = 6e4;
const WINDOWS_PREFLIGHT_BASE_DIR = "ocu";
const BUILD_MAX_OLD_SPACE_MB = 8192;
const DEV_PREFLIGHT_LINT_ENV = {
	OPERATOR_LOCAL_CHECK: "1",
	OPERATOR_LOCAL_CHECK_MODE: "throttled"
};
const DEV_PREFLIGHT_LINT_OPT_IN_ENV = "OPERATOR_UPDATE_PREFLIGHT_LINT";
function resolveUpdateDoctorExecutionPolicy(params) {
	if (params.allowGatewayServiceRepair) return { fix: true };
	const externalPolicySupport = require_update_check.compareSemverStrings(params.targetVersion, EXTERNAL_SERVICE_REPAIR_POLICY_MIN_VERSION);
	if (externalPolicySupport !== null && externalPolicySupport >= 0) return {
		fix: true,
		serviceRepairPolicy: "external"
	};
	return { fix: false };
}
function normalizeDir(value) {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return node_path.default.resolve(trimmed);
}
function resolveNodeModulesBinPackageRoot(argv1) {
	const normalized = node_path.default.resolve(argv1);
	const parts = normalized.split(node_path.default.sep);
	const binIndex = parts.lastIndexOf(".bin");
	if (binIndex <= 0) return null;
	if (parts[binIndex - 1] !== "node_modules") return null;
	const binName = node_path.default.basename(normalized);
	const nodeModulesDir = parts.slice(0, binIndex).join(node_path.default.sep);
	return node_path.default.join(nodeModulesDir, binName);
}
function buildStartDirs(opts) {
	const dirs = [];
	const argv1 = normalizeDir(opts.argv1);
	if (argv1) {
		dirs.push(node_path.default.dirname(argv1));
		const packageRoot = resolveNodeModulesBinPackageRoot(argv1);
		if (packageRoot) dirs.push(packageRoot);
	}
	const cwd = normalizeDir(opts.cwd);
	if (cwd) dirs.push(cwd);
	let proc;
	try {
		proc = normalizeDir(process.cwd());
	} catch {
		proc = null;
	}
	if (proc) dirs.push(proc);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(dirs);
}
function resolvePreflightTempRootPrefix() {
	return node_path.default.join(node_os.default.tmpdir(), PREFLIGHT_TEMP_PREFIX);
}
function resolvePreflightWorktreeDir(preflightRoot) {
	return node_path.default.join(preflightRoot, PREFLIGHT_WORKTREE_DIRNAME);
}
function shouldUseNativeWindowsTempRoot() {
	return process.platform === "win32" && node_path.default.sep === "\\";
}
async function createPreflightRoot() {
	if (shouldUseNativeWindowsTempRoot()) {
		const baseDir = node_path.default.win32.join(process.env.SystemDrive ?? "C:", WINDOWS_PREFLIGHT_BASE_DIR);
		await node_fs_promises.default.mkdir(baseDir, { recursive: true });
		return node_fs_promises.default.mkdtemp(node_path.default.win32.join(baseDir, PREFLIGHT_TEMP_PREFIX));
	}
	return node_fs_promises.default.mkdtemp(resolvePreflightTempRootPrefix());
}
async function removePathRecursive(target) {
	await node_fs_promises.default.rm(target, {
		recursive: true,
		force: true,
		maxRetries: 3,
		retryDelay: 200
	}).catch(() => {});
}
async function repairPreflightCleanup(worktreeDir, preflightRoot) {
	try {
		await node_fs_promises.default.rm(worktreeDir, {
			recursive: true,
			force: true,
			maxRetries: 3,
			retryDelay: 200
		});
		await node_fs_promises.default.rm(preflightRoot, {
			recursive: true,
			force: true,
			maxRetries: 3,
			retryDelay: 200
		});
		return true;
	} catch {
		return false;
	}
}
async function readBranchName(runCommand, root, timeoutMs) {
	const res = await runCommand([
		"git",
		"-C",
		root,
		"rev-parse",
		"--abbrev-ref",
		"HEAD"
	], { timeoutMs }).catch(() => null);
	if (res?.code !== 0) return null;
	return res.stdout.trim() || null;
}
async function listGitTags(runCommand, root, timeoutMs, pattern = "v*") {
	const res = await runCommand([
		"git",
		"-C",
		root,
		"tag",
		"--list",
		pattern,
		"--sort=-v:refname"
	], { timeoutMs }).catch(() => null);
	if (res?.code !== 0) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(res.stdout.split("\n"));
}
async function resolveChannelTag(runCommand, root, timeoutMs, channel) {
	const tags = await listGitTags(runCommand, root, timeoutMs);
	if (channel === "beta") {
		const betaTag = tags.find((tag) => require_update_channels.isBetaTag(tag)) ?? null;
		const stableTag = tags.find((tag) => require_update_channels.isStableTag(tag)) ?? null;
		if (!betaTag) return stableTag;
		if (!stableTag) return betaTag;
		const cmp = require_update_check.compareSemverStrings(betaTag, stableTag);
		if (cmp != null && cmp < 0) return stableTag;
		return betaTag;
	}
	return tags.find((tag) => require_update_channels.isStableTag(tag)) ?? null;
}
async function resolveGitRoot(runCommand, candidates, timeoutMs) {
	for (const dir of candidates) {
		const res = await runCommand([
			"git",
			"-C",
			dir,
			"rev-parse",
			"--show-toplevel"
		], { timeoutMs }).catch(() => null);
		if (!res) continue;
		if (res.code === 0) {
			const root = res.stdout.trim();
			if (root) return root;
		}
	}
	return null;
}
async function findPackageRoot(candidates) {
	for (const dir of candidates) {
		let current = dir;
		for (let i = 0; i < 12; i += 1) {
			const pkgPath = node_path.default.join(current, "package.json");
			try {
				const raw = await node_fs_promises.default.readFile(pkgPath, "utf-8");
				const name = JSON.parse(raw)?.name?.trim();
				if (name && CORE_PACKAGE_NAMES.has(name)) return current;
			} catch {}
			const parent = node_path.default.dirname(current);
			if (parent === current) break;
			current = parent;
		}
	}
	return null;
}
async function runStep(opts) {
	const { runCommand, name, argv, cwd, timeoutMs, env, progress, stepIndex, totalSteps } = opts;
	const command = argv.join(" ");
	const stepInfo = {
		name,
		command,
		index: stepIndex,
		total: totalSteps
	};
	progress?.onStepStart?.(stepInfo);
	const started = Date.now();
	const result = await runCommand(argv, {
		cwd,
		timeoutMs,
		env
	});
	const durationMs = Date.now() - started;
	const stderrTail = require_restart_sentinel.trimLogTail(result.stderr, MAX_LOG_CHARS);
	progress?.onStepComplete?.({
		...stepInfo,
		durationMs,
		exitCode: result.code,
		stderrTail,
		signal: result.signal,
		killed: result.killed,
		termination: result.termination
	});
	return {
		name,
		command,
		cwd,
		durationMs,
		exitCode: result.code,
		stdoutTail: require_restart_sentinel.trimLogTail(result.stdout, MAX_LOG_CHARS),
		stderrTail: require_restart_sentinel.trimLogTail(result.stderr, MAX_LOG_CHARS),
		signal: result.signal,
		killed: result.killed,
		termination: result.termination
	};
}
function normalizeTag(tag) {
	return normalizePackageTagInput(tag, ["@gabrielvfonseca/operator", DEFAULT_PACKAGE_NAME]) ?? "latest";
}
function normalizeDevTargetRef(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}
function looksLikeFullCommitSha(value) {
	return /^[0-9a-f]{40}$/i.test(value.trim());
}
function resolveTagFetchRef(candidate) {
	const ref = candidate.endsWith("^{}") ? candidate.slice(0, -3) : candidate;
	return ref.startsWith("refs/tags/") ? ref : null;
}
function buildDevTargetRefResolutionCandidates(devTargetRef) {
	const trimmed = devTargetRef.trim();
	const candidates = [];
	const addCandidate = (candidate) => {
		if (!candidate || candidates.includes(candidate)) return;
		candidates.push(candidate);
	};
	if (looksLikeFullCommitSha(trimmed)) {
		addCandidate(trimmed);
		return candidates;
	}
	if (trimmed.startsWith("refs/remotes/")) {
		addCandidate(trimmed);
		return candidates;
	}
	if (trimmed.startsWith("refs/heads/")) {
		addCandidate(`refs/remotes/origin/${trimmed.slice(11)}`);
		return candidates;
	}
	if (trimmed.startsWith("origin/")) {
		addCandidate(`refs/remotes/${trimmed}`);
		return candidates;
	}
	if (trimmed.startsWith("refs/tags/")) {
		addCandidate(`${trimmed}^{}`);
		addCandidate(trimmed);
		return candidates;
	}
	addCandidate(`refs/remotes/origin/${trimmed}`);
	addCandidate(`refs/tags/${trimmed}^{}`);
	addCandidate(`refs/tags/${trimmed}`);
	return candidates;
}
async function resolveComparablePath(target) {
	return await node_fs_promises.default.realpath(target).catch(() => node_path.default.resolve(target));
}
async function pathsReferToSameLocation(left, right) {
	return await resolveComparablePath(left) === await resolveComparablePath(right);
}
async function looksLikeGitCheckout(root) {
	try {
		await node_fs_promises.default.access(node_path.default.join(root, ".git"));
		return true;
	} catch {
		return false;
	}
}
function shouldRetryWindowsInstallIgnoringScripts(manager) {
	return process.platform === "win32" && manager === "pnpm";
}
function shouldPreferIgnoreScriptsForWindowsPreflight(manager) {
	return process.platform === "win32" && manager === "pnpm";
}
function resolveBuildNodeOptions(baseOptions) {
	const current = baseOptions?.trim() ?? "";
	const desired = `--max-old-space-size=${BUILD_MAX_OLD_SPACE_MB}`;
	const existingMatch = /(?:^|\s)--max-old-space-size=(\d+)(?=\s|$)/.exec(current);
	if (!existingMatch) return current ? `${current} ${desired}` : desired;
	const existingValue = Number(existingMatch[1]);
	if (Number.isFinite(existingValue) && existingValue >= BUILD_MAX_OLD_SPACE_MB) return current;
	return current.replace(/(?:^|\s)--max-old-space-size=\d+(?=\s|$)/, ` ${desired}`).trim();
}
function resolveBuildEnv(env) {
	const currentNodeOptions = env?.NODE_OPTIONS ?? process.env.NODE_OPTIONS;
	const nextNodeOptions = resolveBuildNodeOptions(currentNodeOptions);
	if (nextNodeOptions === currentNodeOptions) return env;
	return {
		...env,
		NODE_OPTIONS: nextNodeOptions
	};
}
function resolveInstallEnv(manager, env) {
	if (manager !== "pnpm") return env;
	return {
		...env,
		PNPM_CONFIG_RESOLUTION_MODE: env?.PNPM_CONFIG_RESOLUTION_MODE ?? "highest",
		npm_config_resolution_mode: env?.npm_config_resolution_mode ?? "highest",
		pnpm_config_resolution_mode: env?.pnpm_config_resolution_mode ?? "highest"
	};
}
function isSupersededInstallFailure(step, steps) {
	if (step.exitCode === 0) return false;
	if (step.name === "deps install") return steps.some((candidate) => candidate.name === "deps install (ignore scripts)" && candidate.exitCode === 0);
	const preflightMatch = /^preflight deps install \((.+)\)$/.exec(step.name);
	if (!preflightMatch) return false;
	const retryName = `preflight deps install (ignore scripts) (${preflightMatch[1]})`;
	return steps.some((candidate) => candidate.name === retryName && candidate.exitCode === 0);
}
function isPreflightCandidateFailure(step) {
	return /^preflight (?:checkout|package manager|deps install(?: \(ignore scripts\))?|build|lint) \(.+\)$/u.test(step.name);
}
function findBlockingGitFailure(steps) {
	return steps.find((step, index) => step.exitCode !== 0 && !isPreflightCandidateFailure(step) && !isSupersededInstallFailure(step, steps) && !isSupersededTargetRefFailure(step, steps.slice(index + 1)));
}
function isSupersededTargetRefFailure(step, followingSteps) {
	const isTargetRefProbe = step.name.startsWith("git rev-parse ");
	const isTargetTagFetch = step.name.startsWith("git fetch ") && step.name.includes(" refs/tags/");
	const isUpstreamProbe = step.name === "upstream check";
	const isLocalDevBranchProbe = step.name === `git show-ref ${require_update_channels.DEV_BRANCH}`;
	if (!isTargetRefProbe && !isTargetTagFetch && !isUpstreamProbe && !isLocalDevBranchProbe) return false;
	if (isLocalDevBranchProbe) return followingSteps.some((candidate) => candidate.name.startsWith(`git checkout -B main `) && candidate.exitCode === 0);
	return followingSteps.some((candidate) => candidate.name.startsWith("git rev-parse ") && candidate.exitCode === 0);
}
function mergeCommandEnvironments(baseEnv, overrideEnv) {
	if (!baseEnv) return overrideEnv;
	if (!overrideEnv) return baseEnv;
	return {
		...baseEnv,
		...overrideEnv
	};
}
function shouldRunDevPreflightLint(env = process.env) {
	const value = env[DEV_PREFLIGHT_LINT_OPT_IN_ENV]?.trim().toLowerCase();
	return value === "1" || value === "true";
}
function resolveDevPreflightLintEnv(env) {
	return {
		...env,
		...DEV_PREFLIGHT_LINT_ENV
	};
}
function normalizeFallbackFailureReason(stepName) {
	switch (stepName) {
		case "global update":
		case "global update (omit optional)":
		case "global install stage":
		case "global install verify":
		case "global install swap": return "global-install-failed";
		case "openclaw doctor": return "doctor-failed";
		case "ui:build (post-doctor repair)": return "ui-build-failed";
		default: return "unexpected-error";
	}
}
async function buildUpdateCommandRunner(runCommand) {
	const defaultCommandEnv = await createGlobalInstallEnv();
	if (runCommand) return {
		defaultCommandEnv,
		runCommand
	};
	return {
		defaultCommandEnv,
		runCommand: async (argv, options) => {
			return await require_exec.runCommandWithTimeout(argv, {
				...options,
				env: mergeCommandEnvironments(defaultCommandEnv, options.env),
				killProcessTree: true
			});
		}
	};
}
async function resolveUpdateInstallSurface(opts = {}) {
	const { runCommand } = await buildUpdateCommandRunner(opts.runCommand);
	const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const candidates = buildStartDirs(opts);
	const pkgRoot = await findPackageRoot(candidates);
	let gitRoot = await resolveGitRoot(runCommand, candidates, timeoutMs);
	if (gitRoot && pkgRoot && node_path.default.resolve(gitRoot) !== node_path.default.resolve(pkgRoot)) gitRoot = null;
	if (gitRoot && !pkgRoot) return {
		kind: "missing",
		mode: "unknown",
		root: gitRoot
	};
	if (gitRoot && pkgRoot && node_path.default.resolve(gitRoot) === node_path.default.resolve(pkgRoot)) return {
		kind: "git",
		mode: "git",
		root: gitRoot,
		packageRoot: pkgRoot
	};
	if (!pkgRoot) return {
		kind: "missing",
		mode: "unknown"
	};
	const globalManager = await detectGlobalInstallManagerForRoot(runCommand, pkgRoot, timeoutMs);
	if (globalManager) return {
		kind: "global",
		mode: globalManager,
		root: pkgRoot,
		packageRoot: pkgRoot
	};
	return {
		kind: "package-root",
		mode: "unknown",
		root: pkgRoot,
		packageRoot: pkgRoot
	};
}
async function runGatewayUpdate(opts = {}) {
	const startedAt = Date.now();
	const { defaultCommandEnv, runCommand } = await buildUpdateCommandRunner(opts.runCommand);
	const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const progress = opts.progress;
	const steps = [];
	const candidates = buildStartDirs(opts);
	let allowGatewayServiceRepair = opts.allowGatewayServiceRepair !== false;
	let allowGatewayActivation = opts.allowGatewayActivation === true;
	let stepIndex = 0;
	let gitTotalSteps = 0;
	const step = (name, argv, cwd, env) => {
		const currentIndex = stepIndex;
		stepIndex += 1;
		return {
			runCommand,
			name,
			argv,
			cwd,
			timeoutMs,
			env,
			progress,
			stepIndex: currentIndex,
			totalSteps: gitTotalSteps
		};
	};
	const pkgRoot = await findPackageRoot(candidates);
	let gitRoot = await resolveGitRoot(runCommand, candidates, timeoutMs);
	if (!gitRoot && pkgRoot) {
		const cwdRoot = normalizeDir(opts.cwd);
		if (cwdRoot && await pathsReferToSameLocation(cwdRoot, pkgRoot) && await looksLikeGitCheckout(cwdRoot)) gitRoot = await resolveComparablePath(cwdRoot);
	}
	if (gitRoot && pkgRoot && !await pathsReferToSameLocation(gitRoot, pkgRoot)) gitRoot = null;
	if (gitRoot && !pkgRoot) return {
		status: "error",
		mode: "unknown",
		root: gitRoot,
		reason: "not-openclaw-root",
		steps: [],
		durationMs: Date.now() - startedAt
	};
	if (gitRoot && pkgRoot && await pathsReferToSameLocation(gitRoot, pkgRoot)) {
		const channel = opts.channel ?? "dev";
		if (channel === "extended-stable") return {
			status: "error",
			mode: "git",
			root: gitRoot,
			reason: "unsupported_git_channel",
			steps: [],
			durationMs: Date.now() - startedAt
		};
		const beforeSha = (await runCommand([
			"git",
			"-C",
			gitRoot,
			"rev-parse",
			"HEAD"
		], {
			cwd: gitRoot,
			timeoutMs
		})).stdout.trim() || null;
		const beforeVersion = await require_package_json.readPackageVersion(gitRoot);
		const devTargetRef = channel === "dev" ? normalizeDevTargetRef(opts.devTargetRef) : null;
		const branch = await readBranchName(runCommand, gitRoot, timeoutMs);
		const needsCheckoutMain = channel === "dev" && !devTargetRef && branch !== "main";
		gitTotalSteps = channel === "dev" ? needsCheckoutMain ? 11 : 10 : 9;
		let gitMutationPrepared = false;
		let createdDevBranchDuringUpdate = false;
		let localDevBranchExists = null;
		const prepareGitMutation = async () => {
			if (gitMutationPrepared) return;
			const preparation = await opts.beforeGitMutation?.();
			if (typeof preparation?.allowGatewayServiceRepair === "boolean") allowGatewayServiceRepair = preparation.allowGatewayServiceRepair;
			if (typeof preparation?.allowGatewayActivation === "boolean") allowGatewayActivation = preparation.allowGatewayActivation;
			gitMutationPrepared = true;
		};
		const buildGitErrorResult = (reason) => ({
			status: "error",
			mode: "git",
			root: gitRoot,
			reason,
			before: {
				sha: beforeSha,
				version: beforeVersion
			},
			steps,
			durationMs: Date.now() - startedAt
		});
		const runRequiredGitStep = async (name, argv, reason) => {
			const gitStep = await runStep(step(name, argv, gitRoot));
			steps.push(gitStep);
			if (gitStep.exitCode !== 0) return buildGitErrorResult(reason);
			return null;
		};
		const appendRecoveryStep = async (name, argv) => {
			const started = Date.now();
			const result = await runCommand(argv, {
				cwd: gitRoot,
				timeoutMs
			});
			const recoveryStep = {
				name,
				command: argv.join(" "),
				cwd: gitRoot,
				durationMs: Date.now() - started,
				exitCode: result.code,
				stdoutTail: require_restart_sentinel.trimLogTail(result.stdout, MAX_LOG_CHARS),
				stderrTail: require_restart_sentinel.trimLogTail(result.stderr, MAX_LOG_CHARS)
			};
			steps.push(recoveryStep);
			return recoveryStep.exitCode === 0;
		};
		const rollbackGitCheckout = async () => {
			if (!beforeSha) return;
			await appendRecoveryStep("git rollback clean", [
				"git",
				"-C",
				gitRoot,
				"reset",
				"--hard"
			]);
			if (branch && branch !== "HEAD") {
				if (await appendRecoveryStep("git rollback checkout", [
					"git",
					"-C",
					gitRoot,
					"checkout",
					"--force",
					branch
				])) {
					await appendRecoveryStep("git rollback reset", [
						"git",
						"-C",
						gitRoot,
						"reset",
						"--hard",
						beforeSha
					]);
					if (createdDevBranchDuringUpdate) await appendRecoveryStep(`git rollback delete ${require_update_channels.DEV_BRANCH}`, [
						"git",
						"-C",
						gitRoot,
						"branch",
						"-D",
						require_update_channels.DEV_BRANCH
					]);
				}
				return;
			}
			await appendRecoveryStep("git rollback checkout", [
				"git",
				"-C",
				gitRoot,
				"checkout",
				"--detach",
				beforeSha
			]);
			if (createdDevBranchDuringUpdate) await appendRecoveryStep(`git rollback delete ${require_update_channels.DEV_BRANCH}`, [
				"git",
				"-C",
				gitRoot,
				"branch",
				"-D",
				require_update_channels.DEV_BRANCH
			]);
		};
		const buildGitErrorResultWithRollback = async (reason) => {
			await rollbackGitCheckout();
			return buildGitErrorResult(reason);
		};
		const statusCheck = await runStep(step("clean check", [
			"git",
			"-C",
			gitRoot,
			"status",
			"--porcelain",
			"--",
			":!dist/control-ui/"
		], gitRoot));
		steps.push(statusCheck);
		if (statusCheck.stdoutTail && statusCheck.stdoutTail.trim().length > 0) return {
			status: "skipped",
			mode: "git",
			root: gitRoot,
			reason: "dirty",
			before: {
				sha: beforeSha,
				version: beforeVersion
			},
			steps,
			durationMs: Date.now() - startedAt
		};
		if (channel === "dev") {
			const fetchFailure = await runRequiredGitStep("git fetch", [
				"git",
				"-C",
				gitRoot,
				"fetch",
				"--all",
				"--prune",
				"--no-tags"
			], "fetch-failed");
			if (fetchFailure) return fetchFailure;
			let preflightBaseSha;
			let candidatesLocal;
			let selectedDevUpstream = null;
			if (devTargetRef) {
				let targetSha = null;
				for (const targetRefCandidate of buildDevTargetRefResolutionCandidates(devTargetRef)) {
					const tagFetchRef = resolveTagFetchRef(targetRefCandidate);
					if (tagFetchRef) {
						const remoteListStep = await runStep(step("git remote", [
							"git",
							"-C",
							gitRoot,
							"remote"
						], gitRoot));
						steps.push(remoteListStep);
						const remotes = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)((remoteListStep.stdoutTail ?? "").split("\n"));
						let fetchedTag = false;
						for (const remote of remotes) {
							const targetTagFetchStep = await runStep(step(`git fetch ${remote} ${tagFetchRef}`, [
								"git",
								"-C",
								gitRoot,
								"fetch",
								remote,
								`+${tagFetchRef}:${tagFetchRef}`
							], gitRoot));
							steps.push(targetTagFetchStep);
							if (targetTagFetchStep.exitCode === 0) {
								fetchedTag = true;
								break;
							}
						}
						if (remotes.length > 0 && !fetchedTag) continue;
					}
					const targetShaStep = await runStep(step(`git rev-parse ${targetRefCandidate}`, [
						"git",
						"-C",
						gitRoot,
						"rev-parse",
						targetRefCandidate
					], gitRoot));
					steps.push(targetShaStep);
					const resolvedTargetSha = targetShaStep.stdoutTail?.trim();
					if (targetShaStep.exitCode === 0 && resolvedTargetSha) {
						targetSha = resolvedTargetSha;
						break;
					}
				}
				if (!targetSha) return {
					status: "error",
					mode: "git",
					root: gitRoot,
					reason: "no-target-sha",
					before: {
						sha: beforeSha,
						version: beforeVersion
					},
					steps,
					durationMs: Date.now() - startedAt
				};
				preflightBaseSha = targetSha;
				candidatesLocal = [targetSha];
			} else {
				if (needsCheckoutMain) {
					const localMainStep = await runStep(step(`git show-ref ${require_update_channels.DEV_BRANCH}`, [
						"git",
						"-C",
						gitRoot,
						"show-ref",
						"--verify",
						`refs/heads/${require_update_channels.DEV_BRANCH}`
					], gitRoot));
					steps.push(localMainStep);
					localDevBranchExists = localMainStep.exitCode === 0;
				}
				let remoteBranchRefs = [];
				if (needsCheckoutMain && localDevBranchExists === false) {
					const remoteStep = await runStep(step("git remote", [
						"git",
						"-C",
						gitRoot,
						"remote"
					], gitRoot));
					steps.push(remoteStep);
					if (remoteStep.exitCode === 0) remoteBranchRefs = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)((remoteStep.stdoutTail ?? "").split("\n")).map((remote) => `refs/remotes/${remote}/${require_update_channels.DEV_BRANCH}`);
				}
				const upstreamRefs = needsCheckoutMain ? [`${require_update_channels.DEV_BRANCH}@{upstream}`, ...remoteBranchRefs] : ["@{upstream}"];
				let upstreamSha = null;
				let sawResolvableUpstreamRef = false;
				for (const upstreamRef of upstreamRefs) {
					if (upstreamRef.endsWith("@{upstream}")) {
						const upstreamStep = await runStep(step("upstream check", [
							"git",
							"-C",
							gitRoot,
							"rev-parse",
							"--abbrev-ref",
							"--symbolic-full-name",
							upstreamRef
						], gitRoot));
						steps.push(upstreamStep);
						if (upstreamStep.exitCode !== 0) continue;
						sawResolvableUpstreamRef = true;
					}
					const upstreamShaStep = await runStep(step(`git rev-parse ${upstreamRef}`, [
						"git",
						"-C",
						gitRoot,
						"rev-parse",
						upstreamRef
					], gitRoot));
					steps.push(upstreamShaStep);
					const candidateSha = upstreamShaStep.stdoutTail?.trim();
					if (upstreamShaStep.exitCode === 0 && candidateSha) {
						upstreamSha = candidateSha;
						selectedDevUpstream = /^refs\/remotes\/(.+)$/u.exec(upstreamRef)?.[1] ?? null;
						break;
					}
					if (upstreamShaStep.exitCode === 0) sawResolvableUpstreamRef = true;
				}
				if (!upstreamSha && !sawResolvableUpstreamRef) return {
					status: "skipped",
					mode: "git",
					root: gitRoot,
					reason: "no-upstream",
					before: {
						sha: beforeSha,
						version: beforeVersion
					},
					steps,
					durationMs: Date.now() - startedAt
				};
				if (!upstreamSha) return {
					status: "error",
					mode: "git",
					root: gitRoot,
					reason: "no-upstream-sha",
					before: {
						sha: beforeSha,
						version: beforeVersion
					},
					steps,
					durationMs: Date.now() - startedAt
				};
				const revListStep = await runStep(step("git rev-list", [
					"git",
					"-C",
					gitRoot,
					"rev-list",
					`--max-count=${PREFLIGHT_MAX_COMMITS}`,
					upstreamSha
				], gitRoot));
				steps.push(revListStep);
				if (revListStep.exitCode !== 0) return {
					status: "error",
					mode: "git",
					root: gitRoot,
					reason: "preflight-revlist-failed",
					before: {
						sha: beforeSha,
						version: beforeVersion
					},
					steps,
					durationMs: Date.now() - startedAt
				};
				candidatesLocal = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)((revListStep.stdoutTail ?? "").split("\n"));
				if (candidatesLocal.length === 0) return {
					status: "error",
					mode: "git",
					root: gitRoot,
					reason: "preflight-no-candidates",
					before: {
						sha: beforeSha,
						version: beforeVersion
					},
					steps,
					durationMs: Date.now() - startedAt
				};
				preflightBaseSha = upstreamSha;
			}
			if (!preflightBaseSha) return {
				status: "error",
				mode: "git",
				root: gitRoot,
				reason: "preflight-base-missing",
				before: {
					sha: beforeSha,
					version: beforeVersion
				},
				steps,
				durationMs: Date.now() - startedAt
			};
			const preflightRoot = await createPreflightRoot();
			const worktreeDir = resolvePreflightWorktreeDir(preflightRoot);
			const worktreeStep = await runStep(step("preflight worktree", [
				"git",
				"-C",
				gitRoot,
				"worktree",
				"add",
				"--detach",
				worktreeDir,
				preflightBaseSha
			], gitRoot));
			steps.push(worktreeStep);
			if (worktreeStep.exitCode !== 0) {
				await removePathRecursive(preflightRoot);
				return {
					status: "error",
					mode: "git",
					root: gitRoot,
					reason: "preflight-worktree-failed",
					before: {
						sha: beforeSha,
						version: beforeVersion
					},
					steps,
					durationMs: Date.now() - startedAt
				};
			}
			let selectedSha = null;
			let preflightManagerFailureReason = null;
			let sawNonManagerPreflightFailure = false;
			try {
				for (const sha of candidatesLocal) {
					const shortSha = sha.slice(0, 8);
					const checkoutStep = await runStep(step(`preflight checkout (${shortSha})`, [
						"git",
						"-C",
						worktreeDir,
						"checkout",
						"--detach",
						sha
					], worktreeDir));
					steps.push(checkoutStep);
					if (checkoutStep.exitCode !== 0) {
						sawNonManagerPreflightFailure = true;
						continue;
					}
					const manager = await resolveUpdateBuildManager((argv, options) => runCommand(argv, {
						timeoutMs: options.timeoutMs,
						env: options.env
					}), worktreeDir, timeoutMs, defaultCommandEnv, "require-preferred");
					if (manager.kind === "missing-required") {
						preflightManagerFailureReason = mapManagerResolutionFailure(manager.reason);
						steps.push({
							name: `preflight package manager (${shortSha})`,
							command: `resolve ${manager.preferred} package manager`,
							cwd: worktreeDir,
							durationMs: 0,
							exitCode: 1,
							stderrTail: preflightManagerFailureReason
						});
						continue;
					}
					try {
						const preflightIgnoreScripts = shouldPreferIgnoreScriptsForWindowsPreflight(manager.manager);
						const preflightIgnoreScriptsArgv = managerInstallIgnoreScriptsArgs(manager.manager);
						const depsStepArgv = preflightIgnoreScripts && preflightIgnoreScriptsArgv ? preflightIgnoreScriptsArgv : managerInstallArgs(manager.manager, { compatFallback: manager.fallback && manager.manager === "npm" });
						const depsStepName = preflightIgnoreScripts ? `preflight deps install (ignore scripts) (${shortSha})` : `preflight deps install (${shortSha})`;
						const installEnv = resolveInstallEnv(manager.manager, manager.env);
						const depsStep = await runStep(step(depsStepName, depsStepArgv, worktreeDir, installEnv));
						steps.push(depsStep);
						let finalDepsStep = depsStep;
						if (depsStep.exitCode !== 0 && !preflightIgnoreScripts && shouldRetryWindowsInstallIgnoringScripts(manager.manager)) {
							const retryArgv = managerInstallIgnoreScriptsArgs(manager.manager);
							if (retryArgv) {
								const retryStep = await runStep(step(`preflight deps install (ignore scripts) (${shortSha})`, retryArgv, worktreeDir, installEnv));
								steps.push(retryStep);
								finalDepsStep = retryStep;
							}
						}
						if (finalDepsStep.exitCode !== 0) {
							sawNonManagerPreflightFailure = true;
							continue;
						}
						const buildStep = await runStep(step(`preflight build (${shortSha})`, managerScriptArgs(manager.manager, "build"), worktreeDir, resolveBuildEnv(manager.env)));
						steps.push(buildStep);
						if (buildStep.exitCode !== 0) {
							sawNonManagerPreflightFailure = true;
							continue;
						}
						if (shouldRunDevPreflightLint()) {
							const lintStep = await runStep(step(`preflight lint (${shortSha})`, managerScriptArgs(manager.manager, "lint"), worktreeDir, resolveDevPreflightLintEnv(manager.env)));
							steps.push(lintStep);
							if (lintStep.exitCode !== 0) {
								sawNonManagerPreflightFailure = true;
								continue;
							}
						}
						selectedSha = sha;
						break;
					} finally {
						await manager.cleanup?.();
					}
				}
			} finally {
				const removeStep = await runStep({
					...step("preflight cleanup", [
						"git",
						"-C",
						gitRoot,
						"worktree",
						"remove",
						"--force",
						worktreeDir
					], gitRoot),
					timeoutMs: Math.min(timeoutMs, PREFLIGHT_CLEANUP_TIMEOUT_MS)
				});
				if (removeStep.exitCode !== 0 && await repairPreflightCleanup(worktreeDir, preflightRoot)) {
					removeStep.exitCode = 0;
					const fallbackMessage = process.platform === "win32" ? "windows fallback cleanup removed preflight tree" : "fallback cleanup removed preflight tree";
					removeStep.stderrTail = require_restart_sentinel.trimLogTail([removeStep.stderrTail, fallbackMessage].filter(Boolean).join("\n"), MAX_LOG_CHARS);
				}
				steps.push(removeStep);
				await runCommand([
					"git",
					"-C",
					gitRoot,
					"worktree",
					"prune"
				], {
					cwd: gitRoot,
					timeoutMs
				}).catch(() => null);
				await removePathRecursive(preflightRoot);
			}
			if (!selectedSha) return {
				status: "error",
				mode: "git",
				root: gitRoot,
				reason: preflightManagerFailureReason && !sawNonManagerPreflightFailure ? preflightManagerFailureReason : "preflight-no-good-commit",
				before: {
					sha: beforeSha,
					version: beforeVersion
				},
				steps,
				durationMs: Date.now() - startedAt
			};
			if (devTargetRef) {
				await prepareGitMutation();
				const failure = await runRequiredGitStep(`git checkout ${selectedSha}`, [
					"git",
					"-C",
					gitRoot,
					"checkout",
					"--detach",
					selectedSha
				], "checkout-failed");
				if (failure) return failure;
			} else {
				await prepareGitMutation();
				let checkedOutSelectedSha = false;
				if (needsCheckoutMain) {
					const hasLocalDevBranch = localDevBranchExists !== false;
					const failure = await runRequiredGitStep(hasLocalDevBranch ? `git checkout ${require_update_channels.DEV_BRANCH}` : `git checkout -B ${require_update_channels.DEV_BRANCH} ${selectedSha}`, hasLocalDevBranch ? [
						"git",
						"-C",
						gitRoot,
						"checkout",
						require_update_channels.DEV_BRANCH
					] : [
						"git",
						"-C",
						gitRoot,
						"checkout",
						"-B",
						require_update_channels.DEV_BRANCH,
						selectedSha
					], "checkout-failed");
					if (failure) return failure;
					checkedOutSelectedSha = !hasLocalDevBranch;
					createdDevBranchDuringUpdate = checkedOutSelectedSha;
					if (checkedOutSelectedSha && selectedDevUpstream) {
						if (await runRequiredGitStep(`git branch --set-upstream-to ${selectedDevUpstream} main`, [
							"git",
							"-C",
							gitRoot,
							"branch",
							"--set-upstream-to",
							selectedDevUpstream,
							"main"
						], "checkout-failed")) return await buildGitErrorResultWithRollback("checkout-failed");
					}
				}
				if (checkedOutSelectedSha) steps.push({
					name: "git rebase",
					command: `git rebase ${selectedSha}`,
					cwd: gitRoot,
					durationMs: 0,
					exitCode: 0,
					stdoutTail: `skipped; ${require_update_channels.DEV_BRANCH} was created at selected preflight SHA`
				});
				else {
					const rebaseStep = await runStep(step("git rebase", [
						"git",
						"-C",
						gitRoot,
						"rebase",
						selectedSha
					], gitRoot));
					steps.push(rebaseStep);
					if (rebaseStep.exitCode !== 0) {
						const abortResult = await runCommand([
							"git",
							"-C",
							gitRoot,
							"rebase",
							"--abort"
						], {
							cwd: gitRoot,
							timeoutMs
						});
						steps.push({
							name: "git rebase --abort",
							command: "git rebase --abort",
							cwd: gitRoot,
							durationMs: 0,
							exitCode: abortResult.code,
							stdoutTail: require_restart_sentinel.trimLogTail(abortResult.stdout, MAX_LOG_CHARS),
							stderrTail: require_restart_sentinel.trimLogTail(abortResult.stderr, MAX_LOG_CHARS)
						});
						return {
							status: "error",
							mode: "git",
							root: gitRoot,
							reason: "rebase-failed",
							before: {
								sha: beforeSha,
								version: beforeVersion
							},
							steps,
							durationMs: Date.now() - startedAt
						};
					}
				}
			}
		} else {
			const fetchFailure = await runRequiredGitStep("git fetch", [
				"git",
				"-C",
				gitRoot,
				"fetch",
				"--all",
				"--prune",
				"--tags"
			], "fetch-failed");
			if (fetchFailure) return fetchFailure;
			const tag = await resolveChannelTag(runCommand, gitRoot, timeoutMs, channel);
			if (!tag) return {
				status: "error",
				mode: "git",
				root: gitRoot,
				reason: "no-release-tag",
				before: {
					sha: beforeSha,
					version: beforeVersion
				},
				steps,
				durationMs: Date.now() - startedAt
			};
			await prepareGitMutation();
			const failure = await runRequiredGitStep(`git checkout ${tag}`, [
				"git",
				"-C",
				gitRoot,
				"checkout",
				"--detach",
				tag
			], "checkout-failed");
			if (failure) return failure;
		}
		const manager = await resolveUpdateBuildManager((argv, options) => runCommand(argv, {
			timeoutMs: options.timeoutMs,
			env: options.env
		}), gitRoot, timeoutMs, defaultCommandEnv, "require-preferred");
		if (manager.kind === "missing-required") return await buildGitErrorResultWithRollback(mapManagerResolutionFailure(manager.reason));
		try {
			const installEnv = resolveInstallEnv(manager.manager, manager.env);
			const depsStep = await runStep(step("deps install", managerInstallArgs(manager.manager, { compatFallback: manager.fallback && manager.manager === "npm" }), gitRoot, installEnv));
			steps.push(depsStep);
			let finalDepsStep = depsStep;
			if (depsStep.exitCode !== 0 && shouldRetryWindowsInstallIgnoringScripts(manager.manager)) {
				const retryArgv = managerInstallIgnoreScriptsArgs(manager.manager);
				if (retryArgv) {
					const retryStep = await runStep(step("deps install (ignore scripts)", retryArgv, gitRoot, installEnv));
					steps.push(retryStep);
					finalDepsStep = retryStep;
				}
			}
			if (finalDepsStep.exitCode !== 0) return await buildGitErrorResultWithRollback("deps-install-failed");
			const buildStep = await runStep(step("build", managerScriptArgs(manager.manager, "build"), gitRoot, resolveBuildEnv(manager.env)));
			steps.push(buildStep);
			if (buildStep.exitCode !== 0) return await buildGitErrorResultWithRollback("build-failed");
			const uiBuildStep = await runStep(step("ui:build", managerScriptArgs(manager.manager, "ui:build"), gitRoot, manager.env));
			steps.push(uiBuildStep);
			if (uiBuildStep.exitCode !== 0) return await buildGitErrorResultWithRollback("ui-build-failed");
			const doctorEntry = node_path.default.join(gitRoot, "operator.mjs");
			if (!await node_fs_promises.default.stat(doctorEntry).then(() => true).catch(() => false)) {
				steps.push({
					name: "openclaw doctor entry",
					command: `verify ${doctorEntry}`,
					cwd: gitRoot,
					durationMs: 0,
					exitCode: 1,
					stderrTail: `missing ${doctorEntry}`
				});
				return await buildGitErrorResultWithRollback("doctor-entry-missing");
			}
			const doctorNodePath = await require_stable_node_path.resolveStableNodePath(process.execPath);
			const doctorPolicy = resolveUpdateDoctorExecutionPolicy({
				targetVersion: await require_package_json.readPackageVersion(gitRoot),
				allowGatewayServiceRepair
			});
			const doctorStep = await runStep(step("openclaw doctor", [
				doctorNodePath,
				doctorEntry,
				"doctor",
				"--non-interactive",
				...doctorPolicy.fix ? ["--fix"] : []
			], gitRoot, {
				OPERATOR_UPDATE_IN_PROGRESS: "1",
				[DOCTOR_DISABLE_CROSS_STATE_DIR_IMPORTS_ENV]: "1",
				...opts.deferConfiguredPluginInstallRepair ? { [UPDATE_DEFER_CONFIGURED_PLUGIN_INSTALL_REPAIR_ENV]: "1" } : {},
				[UPDATE_PARENT_SUPPORTS_DOCTOR_CONFIG_WRITE_ENV]: "1",
				[UPDATE_PARENT_SUPPORTS_GATEWAY_RESTART_ENV]: "1",
				[UPDATE_PARENT_ALLOWS_GATEWAY_SERVICE_REPAIR_ENV]: allowGatewayServiceRepair ? "1" : "0",
				[UPDATE_PARENT_ALLOWS_GATEWAY_ACTIVATION_ENV]: allowGatewayActivation ? "1" : "0",
				...doctorPolicy.serviceRepairPolicy ? { [UPDATE_DOCTOR_SERVICE_REPAIR_POLICY_ENV]: doctorPolicy.serviceRepairPolicy } : {}
			}));
			steps.push(doctorStep);
			if (doctorStep.exitCode !== 0) return await buildGitErrorResultWithRollback("doctor-failed");
			if (!(await require_control_ui_assets.resolveControlUiDistIndexHealth({ root: gitRoot })).exists) {
				const repairArgv = managerScriptArgs(manager.manager, "ui:build");
				const started = Date.now();
				const repairResult = await runCommand(repairArgv, {
					cwd: gitRoot,
					timeoutMs,
					env: manager.env
				});
				const repairStep = {
					name: "ui:build (post-doctor repair)",
					command: repairArgv.join(" "),
					cwd: gitRoot,
					durationMs: Date.now() - started,
					exitCode: repairResult.code,
					stdoutTail: require_restart_sentinel.trimLogTail(repairResult.stdout, MAX_LOG_CHARS),
					stderrTail: require_restart_sentinel.trimLogTail(repairResult.stderr, MAX_LOG_CHARS)
				};
				steps.push(repairStep);
				if (repairResult.code !== 0) return await buildGitErrorResultWithRollback("ui-build-failed");
				const repairedUiIndexHealth = await require_control_ui_assets.resolveControlUiDistIndexHealth({ root: gitRoot });
				if (!repairedUiIndexHealth.exists) {
					const uiIndexPath = repairedUiIndexHealth.indexPath ?? require_control_ui_assets.resolveControlUiDistIndexPathForRoot(gitRoot);
					steps.push({
						name: "ui assets verify",
						command: `verify ${uiIndexPath}`,
						cwd: gitRoot,
						durationMs: 0,
						exitCode: 1,
						stderrTail: `missing ${uiIndexPath}`
					});
					return await buildGitErrorResultWithRollback("ui-assets-missing");
				}
			}
			const failedStep = findBlockingGitFailure(steps);
			const afterShaStep = await runStep(step("git rev-parse HEAD (after)", [
				"git",
				"-C",
				gitRoot,
				"rev-parse",
				"HEAD"
			], gitRoot));
			steps.push(afterShaStep);
			const afterVersion = await require_package_json.readPackageVersion(gitRoot);
			return {
				status: failedStep ? "error" : "ok",
				mode: "git",
				root: gitRoot,
				reason: failedStep ? normalizeFallbackFailureReason(failedStep.name) : void 0,
				before: {
					sha: beforeSha,
					version: beforeVersion
				},
				after: {
					sha: afterShaStep.stdoutTail?.trim() ?? null,
					version: afterVersion
				},
				steps,
				durationMs: Date.now() - startedAt
			};
		} finally {
			await manager.cleanup?.();
		}
	}
	if (!pkgRoot) return {
		status: "error",
		mode: "unknown",
		reason: "not-openclaw-root",
		steps: [],
		durationMs: Date.now() - startedAt
	};
	const beforeVersion = await require_package_json.readPackageVersion(pkgRoot);
	const globalManager = await detectGlobalInstallManagerForRoot(runCommand, pkgRoot, timeoutMs);
	if (globalManager) {
		const channel = opts.channel ?? "stable";
		if (channel === "extended-stable" && opts.tag !== void 0) return {
			status: "error",
			mode: globalManager,
			root: pkgRoot,
			reason: require_update_channels.EXTENDED_STABLE_TAG_UNSUPPORTED_REASON,
			before: { version: beforeVersion },
			steps: [],
			durationMs: Date.now() - startedAt
		};
		const packageName = await require_package_json.readPackageName(pkgRoot) ?? DEFAULT_PACKAGE_NAME;
		const installTarget = await resolveGlobalInstallTarget({
			manager: globalManager,
			runCommand,
			timeoutMs,
			pkgRoot,
			packageName
		});
		await cleanupGlobalRenameDirs({
			globalRoot: node_path.default.dirname(pkgRoot),
			packageName
		});
		const extendedStable = channel === "extended-stable" ? await require_update_check.resolveExtendedStablePackage({
			installKind: "package",
			timeoutMs,
			packageName
		}) : null;
		if (extendedStable?.status === "failed") return {
			status: "error",
			mode: globalManager,
			root: pkgRoot,
			reason: extendedStable.reason,
			before: { version: beforeVersion },
			steps: [],
			durationMs: Date.now() - startedAt
		};
		const tag = normalizeTag(extendedStable?.status === "resolved" ? extendedStable.version : opts.tag ?? require_update_channels.channelToNpmTag(channel));
		const globalInstallEnv = await createGlobalInstallEnv();
		const packageUpdate = await runGlobalPackageUpdateSteps({
			installTarget,
			installSpec: extendedStable?.status === "resolved" ? extendedStable.packageSpec : resolveGlobalInstallSpec({
				packageName,
				tag,
				env: globalInstallEnv
			}),
			packageName,
			packageRoot: pkgRoot,
			runCommand,
			timeoutMs,
			...globalInstallEnv === void 0 ? {} : { env: globalInstallEnv },
			installCwd: pkgRoot,
			runStep: (stepParams) => runStep({
				runCommand,
				...stepParams,
				cwd: stepParams.cwd ?? pkgRoot,
				progress,
				stepIndex: 0,
				totalSteps: 1
			}),
			postVerifyStep: async (verifiedPackageRoot) => {
				const doctorEntry = await require_gateway_entrypoint.resolveGatewayInstallEntrypoint(verifiedPackageRoot);
				if (!doctorEntry) return null;
				const doctorNodePath = await require_stable_node_path.resolveStableNodePath(process.execPath);
				const candidateHostVersion = await require_package_json.readPackageVersion(verifiedPackageRoot);
				const doctorPolicy = resolveUpdateDoctorExecutionPolicy({
					targetVersion: candidateHostVersion,
					allowGatewayServiceRepair
				});
				return await runStep({
					runCommand,
					name: "openclaw doctor",
					argv: [
						doctorNodePath,
						doctorEntry,
						"doctor",
						"--non-interactive",
						...doctorPolicy.fix ? ["--fix"] : []
					],
					cwd: verifiedPackageRoot,
					timeoutMs,
					env: {
						OPERATOR_UPDATE_IN_PROGRESS: "1",
						[DOCTOR_DISABLE_CROSS_STATE_DIR_IMPORTS_ENV]: "1",
						[UPDATE_PARENT_SUPPORTS_DOCTOR_CONFIG_WRITE_ENV]: "1",
						[UPDATE_PARENT_SUPPORTS_GATEWAY_RESTART_ENV]: "1",
						[UPDATE_PARENT_ALLOWS_GATEWAY_SERVICE_REPAIR_ENV]: allowGatewayServiceRepair ? "1" : "0",
						[UPDATE_PARENT_ALLOWS_GATEWAY_ACTIVATION_ENV]: allowGatewayActivation ? "1" : "0",
						...doctorPolicy.serviceRepairPolicy ? { [UPDATE_DOCTOR_SERVICE_REPAIR_POLICY_ENV]: doctorPolicy.serviceRepairPolicy } : {},
						...candidateHostVersion === null ? {} : { OPERATOR_COMPATIBILITY_HOST_VERSION: candidateHostVersion }
					},
					progress,
					stepIndex: 0,
					totalSteps: 1
				});
			}
		});
		return {
			status: packageUpdate.failedStep ? "error" : "ok",
			mode: globalManager,
			root: packageUpdate.verifiedPackageRoot ?? pkgRoot,
			reason: packageUpdate.failedStep ? normalizeFallbackFailureReason(packageUpdate.failedStep.name) : void 0,
			before: { version: beforeVersion },
			after: { version: packageUpdate.afterVersion },
			steps: packageUpdate.steps,
			durationMs: Date.now() - startedAt
		};
	}
	return {
		status: "skipped",
		mode: "unknown",
		root: pkgRoot,
		reason: "not-git-install",
		before: { version: beforeVersion },
		steps: [],
		durationMs: Date.now() - startedAt
	};
}
//#endregion
Object.defineProperty(exports, "resolveUpdateInstallSurface", {
	enumerable: true,
	get: function() {
		return resolveUpdateInstallSurface;
	}
});
Object.defineProperty(exports, "runGatewayUpdate", {
	enumerable: true,
	get: function() {
		return runGatewayUpdate;
	}
});
