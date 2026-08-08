const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_channel_meta = require("./channel-meta-Bapt3Qtj.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_channel_catalog_registry = require("./channel-catalog-registry-D1BOYOpe.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/channels/plugins/catalog.ts
/**
* Channel plugin catalog builder.
*
* Combines bundled, installed, and official external channel metadata for UI/setup surfaces.
*/
const ORIGIN_PRIORITY = {
	config: 0,
	workspace: 1,
	global: 2,
	bundled: 3
};
function shouldExcludeCatalogOrigin(options, origin) {
	if (options.excludeWorkspace && origin === "workspace") return true;
	return options.excludeOrigins?.includes(origin) ?? false;
}
function shouldExcludeCatalogPlugin(options, pluginId, origin) {
	const normalizedPluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(pluginId);
	if (!normalizedPluginId) return false;
	return options.excludePluginRefs?.some((entry) => entry.pluginId === normalizedPluginId && (entry.origin === void 0 || entry.origin === origin)) ?? false;
}
const EXTERNAL_CATALOG_PRIORITY = ORIGIN_PRIORITY.bundled + 1;
const FALLBACK_CATALOG_PRIORITY = EXTERNAL_CATALOG_PRIORITY + 1;
const ENV_CATALOG_PATHS = ["OPERATOR_PLUGIN_CATALOG_PATHS", "OPERATOR_MPM_CATALOG_PATHS"];
const OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH = node_path.default.join("dist", "channel-catalog.json");
const officialCatalogEntriesByPath = /* @__PURE__ */ new Map();
const externalCatalogEntriesByPath = /* @__PURE__ */ new Map();
function parseCatalogEntries(raw) {
	if (Array.isArray(raw)) return raw.filter((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return [];
	const list = raw.entries ?? raw.packages ?? raw.plugins;
	if (!Array.isArray(list)) return [];
	return list.filter((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry));
}
function splitEnvPaths(value) {
	const trimmed = value.trim();
	if (!trimmed) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(trimmed.split(/[;,]/g).flatMap((chunk) => chunk.split(node_path.default.delimiter)));
}
function resolveDefaultCatalogPaths(env) {
	const configDir = require_utils.resolveConfigDir(env);
	return [
		node_path.default.join(configDir, "mpm", "plugins.json"),
		node_path.default.join(configDir, "mpm", "catalog.json"),
		node_path.default.join(configDir, "plugins", "catalog.json")
	];
}
function resolveExternalCatalogPaths(options) {
	if (options.catalogPaths && options.catalogPaths.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(options.catalogPaths);
	const env = options.env ?? process.env;
	for (const key of ENV_CATALOG_PATHS) {
		const raw = env[key];
		if (raw?.trim()) return splitEnvPaths(raw);
	}
	return resolveDefaultCatalogPaths(env);
}
function loadExternalCatalogEntries(options) {
	return loadCatalogEntriesFromPaths(resolveExternalCatalogPaths(options).map((rawPath) => require_home_dir.resolveUserPath(rawPath, options.env ?? process.env)), externalCatalogEntriesByPath);
}
function readCatalogEntriesFromPath(resolvedPath) {
	const payload = (0, _openclaw_fs_safe_json.tryReadJsonSync)(resolvedPath);
	return payload === null ? null : parseCatalogEntries(payload);
}
function loadCatalogEntriesFromPaths(paths, cache) {
	const entries = [];
	for (const resolvedPath of paths) {
		if (cache?.has(resolvedPath)) {
			const cached = cache.get(resolvedPath);
			if (cached) entries.push(...cached);
			continue;
		}
		const parsed = readCatalogEntriesFromPath(resolvedPath);
		cache?.set(resolvedPath, parsed);
		if (parsed === null) continue;
		entries.push(...parsed);
	}
	return entries;
}
function loadOfficialCatalogEntriesFromPaths(paths) {
	const entries = [];
	for (const resolvedPath of paths) {
		const cached = officialCatalogEntriesByPath.get(resolvedPath);
		if (cached !== void 0) {
			if (cached) entries.push(...cached);
			continue;
		}
		const payload = (0, _openclaw_fs_safe_json.tryReadJsonSync)(resolvedPath);
		if (payload === null) {
			officialCatalogEntriesByPath.set(resolvedPath, null);
			continue;
		}
		const parsed = parseCatalogEntries(payload);
		officialCatalogEntriesByPath.set(resolvedPath, parsed);
		entries.push(...parsed);
	}
	return entries;
}
function resolveOfficialCatalogPaths(options) {
	if (options.officialCatalogPaths && options.officialCatalogPaths.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(options.officialCatalogPaths);
	const candidates = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([require_openclaw_root.resolveOperatorPackageRootSync({ cwd: process.cwd() }), require_openclaw_root.resolveOperatorPackageRootSync({ moduleUrl: require("url").pathToFileURL(__filename).href })].filter((entry) => Boolean(entry))).map((packageRoot) => node_path.default.join(packageRoot, OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH));
	if (process.execPath) {
		const execDir = node_path.default.dirname(process.execPath);
		candidates.push(node_path.default.join(execDir, OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH));
		candidates.push(node_path.default.join(execDir, "channel-catalog.json"));
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(candidates);
}
function loadOfficialCatalogEntries(options) {
	const builtInEntries = require_official_external_plugin_catalog.listOfficialExternalChannelCatalogEntries();
	const officialPaths = resolveOfficialCatalogPaths(options);
	const fileEntries = options.officialCatalogPaths && options.officialCatalogPaths.length > 0 ? loadCatalogEntriesFromPaths(officialPaths) : loadOfficialCatalogEntriesFromPaths(officialPaths);
	return [...builtInEntries, ...fileEntries].map((entry) => buildExternalCatalogEntry(entry, { trustedSourceLinkedOfficialInstall: true })).filter((entry) => Boolean(entry));
}
function toChannelMeta(params) {
	const label = params.channel.label?.trim();
	if (!label) return null;
	const selectionLabel = params.channel.selectionLabel?.trim() || label;
	const detailLabel = params.channel.detailLabel?.trim();
	const docsPath = params.channel.docsPath?.trim() || `/channels/${params.id}`;
	const blurb = params.channel.blurb?.trim() || "";
	const systemImage = params.channel.systemImage?.trim();
	return require_channel_meta.buildManifestChannelMeta({
		id: params.id,
		channel: params.channel,
		label,
		selectionLabel,
		docsPath,
		docsLabel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel.docsLabel),
		blurb,
		detailLabel,
		...systemImage ? { systemImage } : {},
		arrayFieldMode: "defined",
		selectionDocsPrefixMode: "truthy"
	});
}
function resolveInstallInfo(params) {
	const clawhubSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.install?.clawhubSpec);
	let npmSpec = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.install?.npmSpec) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.packageName);
	const packageVersion = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.packageVersion);
	const parsedNpmSpec = npmSpec ? require_npm_registry_spec.parseRegistryNpmSpec(npmSpec) : null;
	const expectedPackageName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.packageName);
	const parsedPackageName = expectedPackageName ? require_npm_registry_spec.parseRegistryNpmSpec(expectedPackageName) : null;
	if (npmSpec && packageVersion && require_npm_registry_spec.isPrereleaseSemverVersion(packageVersion) && parsedNpmSpec?.selectorKind === "none" && (!parsedPackageName || parsedNpmSpec.name === parsedPackageName.name)) npmSpec = `${parsedNpmSpec.name}@${packageVersion}`;
	if (!clawhubSpec && !npmSpec) return null;
	let localPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.install?.localPath);
	if (!localPath && params.workspaceDir && params.packageDir) localPath = node_path.default.relative(params.workspaceDir, params.packageDir) || void 0;
	const requestedDefaultChoice = params.install?.defaultChoice;
	const defaultChoice = requestedDefaultChoice === "clawhub" && clawhubSpec ? "clawhub" : requestedDefaultChoice === "npm" && npmSpec ? "npm" : requestedDefaultChoice === "local" && localPath ? "local" : clawhubSpec ? "clawhub" : localPath ? "local" : "npm";
	const install = {
		...localPath ? { localPath } : {},
		defaultChoice,
		...params.install?.minHostVersion ? { minHostVersion: params.install.minHostVersion } : {},
		...params.install?.expectedIntegrity ? { expectedIntegrity: params.install.expectedIntegrity } : {},
		...params.install?.allowInvalidConfigRecovery === true ? { allowInvalidConfigRecovery: true } : {}
	};
	if (clawhubSpec) return {
		clawhubSpec,
		...npmSpec ? { npmSpec } : {},
		...install
	};
	if (!npmSpec) return null;
	return {
		npmSpec,
		...install
	};
}
function buildCatalogEntryFromManifest(params) {
	if (!params.channel) return null;
	const id = params.channel.id?.trim();
	if (!id) return null;
	const meta = toChannelMeta({
		channel: params.channel,
		id
	});
	if (!meta) return null;
	const install = resolveInstallInfo({
		install: params.install,
		packageName: params.packageName,
		packageVersion: params.packageVersion,
		packageDir: params.packageDir,
		workspaceDir: params.workspaceDir
	});
	if (!install) return null;
	const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.pluginId);
	return {
		id,
		...pluginId ? { pluginId } : {},
		...params.origin ? { origin: params.origin } : {},
		...params.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {},
		meta,
		install,
		installSource: require_installed_plugin_index.describePluginInstallSource(install, { expectedPackageName: params.packageName })
	};
}
function buildExternalCatalogEntry(entry, options) {
	const manifest = entry[require_legacy_names.MANIFEST_KEY];
	return buildCatalogEntryFromManifest({
		pluginId: manifest?.plugin?.id,
		packageName: entry.name,
		packageVersion: entry.version,
		trustedSourceLinkedOfficialInstall: options?.trustedSourceLinkedOfficialInstall,
		channel: manifest?.channel,
		install: manifest?.install
	});
}
function buildChannelUiCatalog(plugins) {
	const entries = plugins.map((plugin) => {
		const detailLabel = plugin.meta.detailLabel ?? plugin.meta.selectionLabel ?? plugin.meta.label;
		return {
			id: plugin.id,
			label: plugin.meta.label,
			detailLabel,
			...plugin.meta.systemImage ? { systemImage: plugin.meta.systemImage } : {}
		};
	});
	const order = entries.map((entry) => entry.id);
	const labels = {};
	const detailLabels = {};
	const systemImages = {};
	const byId = {};
	for (const entry of entries) {
		labels[entry.id] = entry.label;
		detailLabels[entry.id] = entry.detailLabel;
		if (entry.systemImage) systemImages[entry.id] = entry.systemImage;
		byId[entry.id] = entry;
	}
	return {
		entries,
		order,
		labels,
		detailLabels,
		systemImages,
		byId
	};
}
/**
* Raw catalog primitive. This may include untrusted workspace entries and
* workspace shadows. Security-sensitive or execution-facing callers should
* prefer `listTrustedChannelPluginCatalogEntries`; use this primitive only when
* the caller immediately applies trust filtering or explicitly excludes
* workspace entries.
*
* @internal
*/
function listRawChannelPluginCatalogEntries(options = {}) {
	const manifestEntries = require_channel_catalog_registry.listChannelCatalogEntries({
		workspaceDir: options.workspaceDir,
		env: options.env,
		extraPaths: options.extraPaths,
		installRecords: options.installRecords,
		discovery: options.discovery
	});
	const resolved = /* @__PURE__ */ new Map();
	for (const candidate of manifestEntries) {
		if (shouldExcludeCatalogOrigin(options, candidate.origin) || shouldExcludeCatalogPlugin(options, candidate.pluginId, candidate.origin)) continue;
		const entry = buildCatalogEntryFromManifest({
			pluginId: candidate.pluginId,
			packageName: candidate.packageName,
			packageDir: candidate.rootDir,
			origin: candidate.origin,
			workspaceDir: candidate.workspaceDir ?? options.workspaceDir,
			channel: candidate.channel,
			install: candidate.install
		});
		if (!entry) continue;
		const priority = ORIGIN_PRIORITY[candidate.origin] ?? 99;
		const existing = resolved.get(entry.id);
		if (!existing || priority < existing.priority) resolved.set(entry.id, {
			entry,
			priority
		});
	}
	for (const entry of loadOfficialCatalogEntries(options)) {
		const priority = FALLBACK_CATALOG_PRIORITY;
		const existing = resolved.get(entry.id);
		if (!existing || priority < existing.priority) resolved.set(entry.id, {
			entry,
			priority
		});
	}
	const externalEntries = loadExternalCatalogEntries(options).map((entry) => buildExternalCatalogEntry(entry)).filter((entry) => Boolean(entry));
	for (const entry of externalEntries) {
		const priority = EXTERNAL_CATALOG_PRIORITY;
		const existing = resolved.get(entry.id);
		if (!existing || priority < existing.priority) resolved.set(entry.id, {
			entry,
			priority
		});
	}
	return Array.from(resolved.values()).map(({ entry }) => entry).toSorted((a, b) => {
		const orderA = a.meta.order ?? 999;
		const orderB = b.meta.order ?? 999;
		if (orderA !== orderB) return orderA - orderB;
		return a.meta.label.localeCompare(b.meta.label);
	});
}
function getChannelPluginCatalogEntry(id, options = {}) {
	const trimmed = id.trim();
	if (!trimmed) return;
	return listRawChannelPluginCatalogEntries(options).find((entry) => entry.id === trimmed);
}
//#endregion
Object.defineProperty(exports, "buildChannelUiCatalog", {
	enumerable: true,
	get: function() {
		return buildChannelUiCatalog;
	}
});
Object.defineProperty(exports, "getChannelPluginCatalogEntry", {
	enumerable: true,
	get: function() {
		return getChannelPluginCatalogEntry;
	}
});
Object.defineProperty(exports, "listRawChannelPluginCatalogEntries", {
	enumerable: true,
	get: function() {
		return listRawChannelPluginCatalogEntries;
	}
});
