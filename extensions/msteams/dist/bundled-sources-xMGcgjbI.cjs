const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/bundled-sources.ts
function findBundledPluginSourceInMap(params) {
	const targetValue = params.lookup.value.trim();
	if (!targetValue) return;
	if (params.lookup.kind === "pluginId") return params.bundled.get(targetValue);
	for (const source of params.bundled.values()) if (params.lookup.kind === "npmSpec" && source.npmSpec === targetValue || params.lookup.kind === "localPath" && node_path.default.resolve(source.localPath) === node_path.default.resolve(targetValue)) return source;
}
function resolveBundledPluginSources(params) {
	const discovery = params.discovery ?? require_discovery.discoverOperatorPlugins({
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const bundled = /* @__PURE__ */ new Map();
	for (const candidate of discovery.candidates) {
		if (candidate.origin !== "bundled") continue;
		const manifest = require_manifest.loadPluginManifest(candidate.rootDir, false);
		if (!manifest.ok) continue;
		const pluginId = manifest.manifest.id;
		if (bundled.has(pluginId)) continue;
		const npmSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.packageManifest?.install?.npmSpec) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.packageName) || void 0;
		const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.packageVersion) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest.manifest.version) || void 0;
		bundled.set(pluginId, {
			pluginId,
			localPath: candidate.rootDir,
			npmSpec,
			version,
			...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest.manifest.configSchema) ? { configSchema: manifest.manifest.configSchema } : {},
			requiresConfig: pluginConfigSchemaHasRequiredFields(manifest.manifest.configSchema)
		});
	}
	return bundled;
}
let processBundledPluginSources;
/** Bundled manifests are process-stable; installs and metadata changes require restart. */
function getProcessBundledPluginSources() {
	processBundledPluginSources ??= resolveBundledPluginSources({});
	return processBundledPluginSources;
}
function pluginConfigSchemaHasRequiredFields(schema) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(schema)) return false;
	const required = schema.required;
	return Array.isArray(required) && required.some((entry) => typeof entry === "string");
}
function findBundledPluginSource(params) {
	return findBundledPluginSourceInMap({
		bundled: resolveBundledPluginSources({
			workspaceDir: params.workspaceDir,
			env: params.env
		}),
		lookup: params.lookup
	});
}
function resolveBundledPluginInstallCommandHint(params) {
	const bundledSource = findBundledPluginSource({
		lookup: {
			kind: "pluginId",
			value: params.pluginId
		},
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	if (!bundledSource?.localPath) return null;
	return `openclaw plugins install ${bundledSource.localPath}`;
}
//#endregion
Object.defineProperty(exports, "findBundledPluginSource", {
	enumerable: true,
	get: function() {
		return findBundledPluginSource;
	}
});
Object.defineProperty(exports, "findBundledPluginSourceInMap", {
	enumerable: true,
	get: function() {
		return findBundledPluginSourceInMap;
	}
});
Object.defineProperty(exports, "getProcessBundledPluginSources", {
	enumerable: true,
	get: function() {
		return getProcessBundledPluginSources;
	}
});
Object.defineProperty(exports, "resolveBundledPluginInstallCommandHint", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginInstallCommandHint;
	}
});
Object.defineProperty(exports, "resolveBundledPluginSources", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginSources;
	}
});
