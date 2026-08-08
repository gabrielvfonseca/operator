require("./rolldown-runtime-u92d-OFm.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_public_surface_loader = require("./public-surface-loader-CK-Iot2Y.cjs");
const require_health_check_registry = require("./health-check-registry-D8Fw0oHu.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/flows/bundled-health-checks.ts
/** Registers bundled health checks that are explicitly enabled by config and owner policy. */
function registerBundledHealthChecks(params) {
	if (!shouldRegisterPolicyHealth(params)) return;
	require_public_surface_loader.loadBundledPluginPublicArtifactModuleSync({
		dirName: "policy",
		artifactBasename: "api.js"
	}).registerPolicyDoctorChecks?.({ registerHealthCheck: require_health_check_registry.registerHealthCheck });
}
function shouldRegisterPolicyHealth(params) {
	const entry = params.cfg.plugins?.entries?.policy;
	const config = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalObjectRecord)(entry?.config) ?? {};
	if (entry === void 0 || entry.enabled === false || config.enabled === false) return false;
	if (!require_manifest_owner_policy.passesManifestOwnerBasePolicy({
		plugin: { id: "policy" },
		normalizedConfig: require_config_state.normalizePluginsConfig(params.cfg.plugins)
	})) return false;
	return entry.enabled === true || config.enabled === true;
}
//#endregion
exports.registerBundledHealthChecks = registerBundledHealthChecks;
