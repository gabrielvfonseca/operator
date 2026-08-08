const require_utils = require("./utils-CXqBhRFw.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
//#region src/cli/plugin-install-plan.ts
function isBareNpmPackageName(spec) {
	const trimmed = spec.trim();
	return /^[a-z0-9][a-z0-9-._~]*$/.test(trimmed);
}
function resolveBundledInstallPlanForCatalogEntry(params) {
	const pluginId = params.pluginId.trim();
	const npmSpec = params.npmSpec.trim();
	if (!pluginId || !npmSpec) return null;
	const bundledBySpec = params.findBundledSource({
		kind: "npmSpec",
		value: npmSpec
	});
	if (bundledBySpec?.pluginId === pluginId) return { bundledSource: bundledBySpec };
	const bundledById = params.findBundledSource({
		kind: "pluginId",
		value: pluginId
	});
	if (bundledById?.pluginId !== pluginId) return null;
	if (bundledById.npmSpec && bundledById.npmSpec !== npmSpec) return null;
	return { bundledSource: bundledById };
}
function resolveBundledInstallPlanBeforeNpm(params) {
	const rawSpec = params.rawSpec.trim();
	if (!rawSpec) return null;
	if (isBareNpmPackageName(rawSpec)) {
		const bundledSource = params.findBundledSource({
			kind: "pluginId",
			value: rawSpec
		});
		if (!bundledSource) return null;
		return {
			bundledSource,
			warning: `Using bundled plugin "${bundledSource.pluginId}" from ${require_utils.shortenHomePath(bundledSource.localPath)} for bare install spec "${rawSpec}". To install an npm package with the same name, use a scoped package name (for example @scope/${rawSpec}).`
		};
	}
	const parsedNpmSpec = require_npm_registry_spec.parseRegistryNpmSpec(rawSpec);
	if (!parsedNpmSpec) return null;
	const bundledSource = params.findBundledSource({
		kind: "npmSpec",
		value: rawSpec
	}) ?? params.findBundledSource({
		kind: "npmSpec",
		value: parsedNpmSpec.name
	});
	if (!bundledSource) return null;
	return {
		bundledSource,
		warning: `Using bundled plugin "${bundledSource.pluginId}" from ${require_utils.shortenHomePath(bundledSource.localPath)} for npm install spec "${rawSpec}" because this plugin ships with the current Operator build. To force an external npm override, use npm:${rawSpec}.`
	};
}
function resolveBundledInstallPlanForNpmFailure(params) {
	if (params.code !== require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.NPM_PACKAGE_NOT_FOUND) return null;
	const bundledSource = params.findBundledSource({
		kind: "npmSpec",
		value: params.rawSpec
	});
	if (!bundledSource) return null;
	return {
		bundledSource,
		warning: `npm package unavailable for ${params.rawSpec}; using bundled plugin at ${require_utils.shortenHomePath(bundledSource.localPath)}.`
	};
}
//#endregion
Object.defineProperty(exports, "resolveBundledInstallPlanBeforeNpm", {
	enumerable: true,
	get: function() {
		return resolveBundledInstallPlanBeforeNpm;
	}
});
Object.defineProperty(exports, "resolveBundledInstallPlanForCatalogEntry", {
	enumerable: true,
	get: function() {
		return resolveBundledInstallPlanForCatalogEntry;
	}
});
Object.defineProperty(exports, "resolveBundledInstallPlanForNpmFailure", {
	enumerable: true,
	get: function() {
		return resolveBundledInstallPlanForNpmFailure;
	}
});
