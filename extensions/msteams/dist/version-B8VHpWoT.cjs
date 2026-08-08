const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
//#region src/version.ts
var version_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	RUNTIME_SERVICE_VERSION_FALLBACK: () => RUNTIME_SERVICE_VERSION_FALLBACK,
	VERSION: () => VERSION,
	readVersionFromBuildInfoForModuleUrl: () => readVersionFromBuildInfoForModuleUrl,
	readVersionFromPackageJsonForModuleUrl: () => readVersionFromPackageJsonForModuleUrl,
	resolveBinaryVersion: () => resolveBinaryVersion,
	resolveCompatibilityHostVersion: () => resolveCompatibilityHostVersion,
	resolveRuntimeServiceVersion: () => resolveRuntimeServiceVersion,
	resolveUsableRuntimeVersion: () => resolveUsableRuntimeVersion,
	resolveVersionFromModuleUrl: () => resolveVersionFromModuleUrl
});
const CORE_PACKAGE_NAME = "@gabrielvfonseca/operator";
const PACKAGE_JSON_CANDIDATES = [
	"../package.json",
	"../../package.json",
	"../../../package.json",
	"./package.json"
];
const BUILD_INFO_CANDIDATES = [
	"../build-info.json",
	"../../build-info.json",
	"./build-info.json"
];
function readVersionFromJsonCandidates(moduleUrl, candidates, opts = {}) {
	try {
		const require = (0, node_module.createRequire)(moduleUrl);
		for (const candidate of candidates) try {
			const parsed = require(candidate);
			const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parsed.version);
			if (!version) continue;
			if (opts.requirePackageName && parsed.name !== CORE_PACKAGE_NAME) continue;
			return version;
		} catch {}
		return null;
	} catch {
		return null;
	}
}
function firstNonEmpty(...values) {
	for (const value of values) {
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
		if (trimmed && trimmed.toLowerCase() !== "undefined" && trimmed.toLowerCase() !== "null") return trimmed;
	}
}
function readInjectedVersion() {
	return typeof __OPERATOR_VERSION__ === "string" ? __OPERATOR_VERSION__ : void 0;
}
function readVersionFromPackageJsonForModuleUrl(moduleUrl) {
	return readVersionFromJsonCandidates(moduleUrl, PACKAGE_JSON_CANDIDATES, { requirePackageName: true });
}
function readVersionFromBuildInfoForModuleUrl(moduleUrl) {
	return readVersionFromJsonCandidates(moduleUrl, BUILD_INFO_CANDIDATES);
}
function resolveVersionFromModuleUrl(moduleUrl) {
	return readVersionFromPackageJsonForModuleUrl(moduleUrl) || readVersionFromBuildInfoForModuleUrl(moduleUrl);
}
function resolveBinaryVersion(params) {
	return firstNonEmpty(params.injectedVersion) || resolveVersionFromModuleUrl(params.moduleUrl) || firstNonEmpty(params.bundledVersion) || params.fallback || "0.0.0";
}
const RUNTIME_SERVICE_VERSION_FALLBACK = "unknown";
function resolveUsableRuntimeVersion(version) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(version);
	if (!trimmed || trimmed === "0.0.0") return;
	return trimmed;
}
function resolveVersionFromRuntimeSources(params) {
	return firstNonEmpty(...params.preference === "env-first" ? [params.env["OPERATOR_VERSION"], params.runtimeVersion] : [params.runtimeVersion, params.env["OPERATOR_VERSION"]], params.env["OPERATOR_SERVICE_VERSION"], params.env["npm_package_version"]) ?? params.fallback;
}
function resolveRuntimeServiceVersion(env = process.env, fallback = RUNTIME_SERVICE_VERSION_FALLBACK) {
	return resolveVersionFromRuntimeSources({
		env,
		runtimeVersion: resolveUsableRuntimeVersion(VERSION),
		fallback,
		preference: "env-first"
	});
}
function resolveCompatibilityHostVersion(env = process.env, fallback = RUNTIME_SERVICE_VERSION_FALLBACK) {
	const explicitCompatibilityVersion = firstNonEmpty(env.OPERATOR_COMPATIBILITY_HOST_VERSION);
	if (explicitCompatibilityVersion) return explicitCompatibilityVersion;
	return resolveVersionFromRuntimeSources({
		env,
		runtimeVersion: resolveUsableRuntimeVersion(VERSION),
		fallback,
		preference: env === process.env ? "runtime-first" : "env-first"
	});
}
const VERSION = resolveBinaryVersion({
	moduleUrl: require("url").pathToFileURL(__filename).href,
	injectedVersion: readInjectedVersion(),
	bundledVersion: process.env.OPERATOR_BUNDLED_VERSION
});
//#endregion
Object.defineProperty(exports, "VERSION", {
	enumerable: true,
	get: function() {
		return VERSION;
	}
});
Object.defineProperty(exports, "resolveCompatibilityHostVersion", {
	enumerable: true,
	get: function() {
		return resolveCompatibilityHostVersion;
	}
});
Object.defineProperty(exports, "resolveRuntimeServiceVersion", {
	enumerable: true,
	get: function() {
		return resolveRuntimeServiceVersion;
	}
});
Object.defineProperty(exports, "version_exports", {
	enumerable: true,
	get: function() {
		return version_exports;
	}
});
