const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
//#region src/plugins/official-external-install-trust.ts
function isBareNpmPackageName(spec) {
	const trimmed = spec.trim();
	return /^[a-z0-9][a-z0-9-._~]*$/.test(trimmed);
}
function resolveCatalogInstall(value, lookup) {
	const entry = lookup === "package" ? require_official_external_plugin_catalog.getOfficialExternalPluginCatalogEntryForPackage(value) : require_official_external_plugin_catalog.getOfficialExternalPluginCatalogEntry(value);
	if (!entry) return;
	const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry);
	if (!pluginId) return;
	const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
	return {
		pluginId,
		...install?.npmSpec ? { npmSpec: install.npmSpec } : {},
		...install?.expectedIntegrity ? { expectedIntegrity: install.expectedIntegrity } : {}
	};
}
function resolveOfficialExternalInstallPlanBeforeNpm(params) {
	if (!isBareNpmPackageName(params.rawSpec)) return null;
	const entry = params.findOfficialExternalPlugin(params.rawSpec);
	const npmSpec = entry?.npmSpec?.trim();
	if (!entry?.pluginId || !npmSpec) return null;
	return {
		pluginId: entry.pluginId,
		npmSpec,
		...entry.expectedIntegrity ? { expectedIntegrity: entry.expectedIntegrity } : {}
	};
}
function resolveOfficialExternalNpmPackageTrust(params) {
	const parsed = require_npm_registry_spec.parseRegistryNpmSpec(params.npmSpec);
	if (!parsed) return null;
	const entry = params.findOfficialExternalPackage(parsed.name);
	if (!entry?.pluginId) return null;
	const catalogSpec = entry.npmSpec?.trim();
	const catalogPackageName = catalogSpec ? require_npm_registry_spec.parseRegistryNpmSpec(catalogSpec)?.name : void 0;
	if (catalogPackageName && catalogPackageName !== parsed.name) return null;
	return {
		pluginId: entry.pluginId,
		...entry.expectedIntegrity && catalogSpec === params.npmSpec.trim() ? { expectedIntegrity: entry.expectedIntegrity } : {},
		trustedSourceLinkedOfficialInstall: true
	};
}
function resolveCatalogOfficialExternalInstallPlan(rawSpec) {
	return resolveOfficialExternalInstallPlanBeforeNpm({
		rawSpec,
		findOfficialExternalPlugin: (pluginId) => resolveCatalogInstall(pluginId, "plugin")
	});
}
function resolveCatalogOfficialExternalNpmPackageTrust(npmSpec) {
	return resolveOfficialExternalNpmPackageTrust({
		npmSpec,
		findOfficialExternalPackage: (packageName) => resolveCatalogInstall(packageName, "package")
	});
}
//#endregion
//#region src/plugins/install-provenance.ts
const NON_CLAWHUB_INSTALL_FORCE_FLAG = "--force";
function resolveOperatorTrustedNpmPackageInstall(npmSpec, bundledSources = require_bundled_sources.getProcessBundledPluginSources()) {
	const packageName = require_npm_registry_spec.parseRegistryNpmSpec(npmSpec)?.name;
	if (!packageName) return null;
	const bundled = require_bundled_sources.findBundledPluginSourceInMap({
		bundled: bundledSources,
		lookup: {
			kind: "npmSpec",
			value: packageName
		}
	});
	if (bundled) return { pluginId: bundled.pluginId };
	return resolveCatalogOfficialExternalNpmPackageTrust(npmSpec);
}
function isOperatorTrustedPluginInstallSpec(spec, bundledSources = require_bundled_sources.getProcessBundledPluginSources()) {
	const trimmed = spec.trim();
	if (trimmed.toLowerCase().startsWith("clawhub:")) return true;
	const explicitNpm = trimmed.toLowerCase().startsWith("npm:");
	const npmSpec = explicitNpm ? trimmed.slice(4) : trimmed;
	if (explicitNpm) return resolveOperatorTrustedNpmPackageInstall(npmSpec, bundledSources) !== null;
	const parsedPackageName = require_npm_registry_spec.parseRegistryNpmSpec(npmSpec)?.name;
	const bundled = require_bundled_sources.findBundledPluginSourceInMap({
		bundled: bundledSources,
		lookup: {
			kind: "pluginId",
			value: npmSpec
		}
	}) ?? (parsedPackageName ? require_bundled_sources.findBundledPluginSourceInMap({
		bundled: bundledSources,
		lookup: {
			kind: "npmSpec",
			value: parsedPackageName
		}
	}) : void 0) ?? require_bundled_sources.findBundledPluginSourceInMap({
		bundled: bundledSources,
		lookup: {
			kind: "localPath",
			value: npmSpec
		}
	});
	return Boolean(bundled ?? resolveOperatorTrustedNpmPackageInstall(npmSpec, bundledSources) ?? resolveCatalogOfficialExternalInstallPlan(npmSpec));
}
const sourceClassLabels = {
	git: "Git repository",
	"local-archive": "local archive",
	"local-path": "local path",
	marketplace: "marketplace source",
	npm: "npm registry",
	"npm-pack": "local npm-pack archive"
};
function formatNonClawHubInstallWarning(params) {
	return [`WARNING - Installing plugin from ${sourceClassLabels[params.sourceClass]}: ${require_safe_text.sanitizeTerminalText(params.spec)}`, "This source is outside ClawHub review and trust metadata. Only continue if you trust the publisher, package contents, and install source."].join("\n");
}
//#endregion
Object.defineProperty(exports, "NON_CLAWHUB_INSTALL_FORCE_FLAG", {
	enumerable: true,
	get: function() {
		return NON_CLAWHUB_INSTALL_FORCE_FLAG;
	}
});
Object.defineProperty(exports, "formatNonClawHubInstallWarning", {
	enumerable: true,
	get: function() {
		return formatNonClawHubInstallWarning;
	}
});
Object.defineProperty(exports, "isOperatorTrustedPluginInstallSpec", {
	enumerable: true,
	get: function() {
		return isOperatorTrustedPluginInstallSpec;
	}
});
Object.defineProperty(exports, "resolveCatalogOfficialExternalInstallPlan", {
	enumerable: true,
	get: function() {
		return resolveCatalogOfficialExternalInstallPlan;
	}
});
Object.defineProperty(exports, "resolveOperatorTrustedNpmPackageInstall", {
	enumerable: true,
	get: function() {
		return resolveOperatorTrustedNpmPackageInstall;
	}
});
