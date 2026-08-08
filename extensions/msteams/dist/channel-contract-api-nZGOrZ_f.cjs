const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_hardlink_policy = require("./hardlink-policy-6OYvPgP1.cjs");
const require_public_surface_loader = require("./public-surface-loader-CK-Iot2Y.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/secrets/channel-contract-api.ts
/** Loads channel secret contract APIs from bundled and external plugin artifacts. */
const CONTRACT_API_EXTENSIONS = [
	".js",
	".mjs",
	".cjs",
	".ts",
	".mts",
	".cts"
];
const CURRENT_MODULE_PATH = (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
const RUNNING_FROM_BUILT_ARTIFACT = CURRENT_MODULE_PATH.includes(`${node_path.default.sep}dist${node_path.default.sep}`) || CURRENT_MODULE_PATH.includes(`${node_path.default.sep}dist-runtime${node_path.default.sep}`);
const moduleLoaders = require_plugin_module_loader_cache.createPluginModuleLoaderCache();
function loadBundledChannelPublicArtifact(channelId, artifactBasename) {
	try {
		return require_public_surface_loader.loadBundledPluginPublicArtifactModuleSync({
			dirName: channelId,
			artifactBasename
		});
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Unable to resolve bundled plugin public surface ")) return;
		throw error;
	}
}
/** Loads a bundled channel secret contract from its public artifact bundle. */
function loadBundledChannelSecretContractApi(channelId) {
	return loadBundledChannelPublicArtifact(channelId, "secret-contract-api.js");
}
function orderedContractApiExtensions() {
	return RUNNING_FROM_BUILT_ARTIFACT ? CONTRACT_API_EXTENSIONS : [...CONTRACT_API_EXTENSIONS.slice(3), ...CONTRACT_API_EXTENSIONS.slice(0, 3)];
}
function resolvePluginContractApiPath(rootDir) {
	const searchDirs = RUNNING_FROM_BUILT_ARTIFACT ? [node_path.default.join(rootDir, "dist"), rootDir] : [rootDir, node_path.default.join(rootDir, "dist")];
	for (const basename of ["secret-contract-api", "contract-api"]) for (const dir of searchDirs) for (const extension of orderedContractApiExtensions()) {
		const candidate = node_path.default.join(dir, `${basename}${extension}`);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return null;
}
function loadPluginContractModule(modulePath) {
	return require_plugin_module_loader_cache.getCachedPluginModuleLoader({
		cache: moduleLoaders,
		modulePath,
		importerUrl: require("url").pathToFileURL(__filename).href
	})(modulePath);
}
function loadExternalChannelSecretContractFromRecord(record, env = process.env) {
	const contractPath = resolvePluginContractApiPath(record.rootDir);
	if (!contractPath) return;
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: contractPath,
		rootPath: record.rootDir,
		boundaryLabel: "plugin root",
		rejectHardlinks: require_hardlink_policy.shouldRejectHardlinkedPluginFiles({
			origin: record.origin,
			rootDir: record.rootDir,
			env
		}),
		skipLexicalRootCheck: true
	});
	if (!opened.ok) return;
	const safePath = opened.path;
	node_fs.default.closeSync(opened.fd);
	try {
		const mod = loadPluginContractModule(safePath);
		if (mod.collectRuntimeConfigAssignments || mod.secretTargetRegistryEntries) return mod;
	} catch (error) {
		if (process.env.OPERATOR_DEBUG_CHANNEL_CONTRACT_API === "1") {
			const detail = error instanceof Error ? error.message : String(error);
			process.stderr.write(`[channel-contract-api] failed to load ${record.id} contract ${safePath}: ${detail}\n`);
		}
	}
}
function recordOwnsChannel(record, channelId) {
	return record.channels.includes(channelId) || Object.hasOwn(record.channelConfigs ?? {}, channelId) || record.channelCatalogMeta?.id === channelId || record.packageChannel?.id === channelId;
}
function listChannelSecretContractRecords(params) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, require_agent_scope_config.resolveDefaultAgentId(params.config), params.env);
	return require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.config,
		workspaceDir,
		env: params.env
	}).plugins.filter((record) => record.origin !== "bundled").filter((record) => recordOwnsChannel(record, params.channelId)).filter((record) => !params.loadablePluginOrigins || params.loadablePluginOrigins.has(record.id)).toSorted((left, right) => {
		if (left.id === params.channelId && right.id !== params.channelId) return -1;
		if (right.id === params.channelId && left.id !== params.channelId) return 1;
		return left.id.localeCompare(right.id);
	});
}
/** Loads the first channel secret contract for a channel, preferring bundled metadata. */
/** Loads a channel secret contract API for a channel id and current plugin origin policy. */
function loadChannelSecretContractApi(params) {
	const bundled = loadBundledChannelSecretContractApi(params.channelId);
	if (bundled) return bundled;
	const env = params.env ?? process.env;
	for (const record of listChannelSecretContractRecords({
		channelId: params.channelId,
		config: params.config,
		env,
		loadablePluginOrigins: params.loadablePluginOrigins
	})) {
		const contract = loadExternalChannelSecretContractFromRecord(record, env);
		if (contract) return contract;
	}
}
/** Loads a channel secret contract directly from a manifest record. */
function loadChannelSecretContractApiForRecord(record) {
	if (record.origin === "bundled") return loadBundledChannelSecretContractApi(record.id);
	return loadExternalChannelSecretContractFromRecord(record);
}
//#endregion
Object.defineProperty(exports, "loadChannelSecretContractApi", {
	enumerable: true,
	get: function() {
		return loadChannelSecretContractApi;
	}
});
Object.defineProperty(exports, "loadChannelSecretContractApiForRecord", {
	enumerable: true,
	get: function() {
		return loadChannelSecretContractApiForRecord;
	}
});
