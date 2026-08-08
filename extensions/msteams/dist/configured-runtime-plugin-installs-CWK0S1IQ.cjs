const require_harness_runtimes = require("./harness-runtimes-bhXUB0Pb.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/commands/doctor/shared/configured-runtime-plugin-installs.ts
const CONFIGURED_RUNTIME_PLUGIN_INSTALL_CANDIDATES = [{
	pluginId: "acpx",
	label: "ACPX Runtime",
	npmSpec: "@gabrielvfonseca/acpx",
	trustedSourceLinkedOfficialInstall: true
}, {
	pluginId: "codex",
	label: "Codex",
	npmSpec: "@gabrielvfonseca/codex",
	trustedSourceLinkedOfficialInstall: true,
	versionBoundToOperator: true
}];
const VERSION_BOUND_RUNTIME_PLUGIN_IDS = new Set(CONFIGURED_RUNTIME_PLUGIN_INSTALL_CANDIDATES.filter((candidate) => candidate.versionBoundToOperator).map((candidate) => candidate.pluginId));
const VERSION_BOUND_RUNTIME_PLUGIN_POLICY_IDS_BY_SURFACE = {
	allow: VERSION_BOUND_RUNTIME_PLUGIN_IDS,
	deny: VERSION_BOUND_RUNTIME_PLUGIN_IDS,
	entries: VERSION_BOUND_RUNTIME_PLUGIN_IDS
};
function acpxRuntimeIsConfigured(cfg) {
	const acp = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(cfg.acp);
	const backend = typeof acp?.backend === "string" ? acp.backend.trim().toLowerCase() : "";
	return (backend === "acpx" || acp?.enabled === true || (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(acp?.dispatch)?.enabled === true) && (!backend || backend === "acpx");
}
/** Collect runtime plugin ids implied by configured harness runtimes and ACPX settings. */
function collectConfiguredRuntimePluginIds(cfg, options) {
	const ids = new Set(require_harness_runtimes.collectConfiguredAgentHarnessRuntimes(cfg, options));
	if (acpxRuntimeIsConfigured(cfg)) ids.add("acpx");
	return [...ids].toSorted((left, right) => left.localeCompare(right));
}
//#endregion
Object.defineProperty(exports, "CONFIGURED_RUNTIME_PLUGIN_INSTALL_CANDIDATES", {
	enumerable: true,
	get: function() {
		return CONFIGURED_RUNTIME_PLUGIN_INSTALL_CANDIDATES;
	}
});
Object.defineProperty(exports, "VERSION_BOUND_RUNTIME_PLUGIN_IDS", {
	enumerable: true,
	get: function() {
		return VERSION_BOUND_RUNTIME_PLUGIN_IDS;
	}
});
Object.defineProperty(exports, "VERSION_BOUND_RUNTIME_PLUGIN_POLICY_IDS_BY_SURFACE", {
	enumerable: true,
	get: function() {
		return VERSION_BOUND_RUNTIME_PLUGIN_POLICY_IDS_BY_SURFACE;
	}
});
Object.defineProperty(exports, "collectConfiguredRuntimePluginIds", {
	enumerable: true,
	get: function() {
		return collectConfiguredRuntimePluginIds;
	}
});
