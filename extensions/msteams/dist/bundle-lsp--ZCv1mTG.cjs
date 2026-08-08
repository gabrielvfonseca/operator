const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_bundle_manifest = require("./bundle-manifest-DNijUZc1.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/plugins/bundle-lsp.ts
const MANIFEST_PATH_BY_FORMAT = { claude: require_bundle_manifest.CLAUDE_BUNDLE_MANIFEST_RELATIVE_PATH };
function extractLspServerMap(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return {};
	const nested = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.lspServers) ? raw.lspServers : raw;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(nested)) return {};
	const result = {};
	for (const [serverName, serverRaw] of Object.entries(nested)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(serverRaw)) continue;
		result[serverName] = { ...serverRaw };
	}
	return result;
}
function resolveBundleLspConfigPaths(params) {
	const declared = require_bundle_manifest.normalizeBundlePathList(params.raw.lspServers);
	return require_bundle_manifest.mergeBundlePathLists(node_fs.default.existsSync(node_path.default.join(params.rootDir, ".lsp.json")) ? [".lsp.json"] : [], declared);
}
function loadBundleLspConfigFile(params) {
	const result = (0, _openclaw_fs_safe_json.readRootJsonObjectSync)({
		rootDir: params.rootDir,
		relativePath: params.relativePath,
		boundaryLabel: "plugin root",
		rejectHardlinks: true
	});
	if (!result.ok) {
		if (result.reason === "open") return {
			config: { lspServers: {} },
			diagnostics: result.failure.reason === "path" ? [] : [`unable to read ${params.relativePath}: ${result.failure.reason}`]
		};
		return {
			config: { lspServers: {} },
			diagnostics: [`unable to read ${params.relativePath}: ${result.error}`]
		};
	}
	return {
		config: { lspServers: extractLspServerMap(result.value) },
		diagnostics: []
	};
}
function loadBundleLspConfig(params) {
	const manifestRelativePath = MANIFEST_PATH_BY_FORMAT[params.bundleFormat];
	if (!manifestRelativePath) return {
		config: { lspServers: {} },
		diagnostics: []
	};
	const manifestLoaded = require_loader.readBundleJsonObject({
		rootDir: params.rootDir,
		relativePath: manifestRelativePath
	});
	if (!manifestLoaded.ok) return {
		config: { lspServers: {} },
		diagnostics: [manifestLoaded.error]
	};
	let merged = { lspServers: {} };
	const filePaths = resolveBundleLspConfigPaths({
		raw: manifestLoaded.raw,
		rootDir: params.rootDir
	});
	const diagnostics = [];
	for (const relativePath of filePaths) {
		const loaded = loadBundleLspConfigFile({
			rootDir: params.rootDir,
			relativePath
		});
		diagnostics.push(...loaded.diagnostics);
		merged = require_io.applyMergePatch(merged, loaded.config);
	}
	return {
		config: merged,
		diagnostics
	};
}
/** Inspects whether one plugin bundle has supported LSP runtime servers. */
function inspectBundleLspRuntimeSupport(params) {
	const support = require_loader.inspectBundleServerRuntimeSupport({
		loaded: loadBundleLspConfig(params),
		resolveServers: (config) => config.lspServers
	});
	return {
		hasStdioServer: support.hasSupportedServer,
		supportedServerNames: support.supportedServerNames,
		unsupportedServerNames: support.unsupportedServerNames,
		diagnostics: support.diagnostics
	};
}
/** Loads and merges enabled bundle LSP config across plugin manifests. */
function loadEnabledBundleLspConfig(params) {
	return require_loader.loadEnabledBundleConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		manifestRegistry: params.manifestRegistry,
		createEmptyConfig: () => ({ lspServers: {} }),
		loadBundleConfig: loadBundleLspConfig,
		createDiagnostic: (pluginId, message) => ({
			pluginId,
			message
		})
	});
}
//#endregion
Object.defineProperty(exports, "inspectBundleLspRuntimeSupport", {
	enumerable: true,
	get: function() {
		return inspectBundleLspRuntimeSupport;
	}
});
Object.defineProperty(exports, "loadEnabledBundleLspConfig", {
	enumerable: true,
	get: function() {
		return loadEnabledBundleLspConfig;
	}
});
