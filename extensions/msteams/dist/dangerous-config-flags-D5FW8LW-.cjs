const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config_contract_matches = require("./config-contract-matches-BOy7ZHza.cjs");
const require_config_contracts = require("./config-contracts-DUBBUbeG.cjs");
const require_dangerous_config_flags_current = require("./dangerous-config-flags-current-Dat6f_wf.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/security/dangerous-config-flags.ts
var dangerous_config_flags_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ collectEnabledInsecureOrDangerousFlags: () => collectEnabledInsecureOrDangerousFlags });
/**
* Collect enabled insecure/dangerous config flags for audit and startup warnings.
* Plugin flags use current metadata when requested, then fall back to resolving manifest contracts.
*/
function collectEnabledInsecureOrDangerousFlags(cfg, options = {}) {
	const pluginEntries = cfg.plugins?.entries;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginEntries)) return require_dangerous_config_flags_current.collectEnabledInsecureOrDangerousFlagsFromContracts(cfg);
	const pluginIds = Object.keys(pluginEntries);
	if (options.preferCurrentPluginMetadataSnapshot) {
		const currentSnapshotFlags = require_dangerous_config_flags_current.collectEnabledInsecureOrDangerousFlagsFromCurrentSnapshot(cfg);
		if (currentSnapshotFlags) return currentSnapshotFlags;
	}
	return require_dangerous_config_flags_current.collectEnabledInsecureOrDangerousFlagsFromContracts(cfg, {
		collectPluginConfigContractMatches: require_config_contract_matches.collectPluginConfigContractMatches,
		configContractsById: require_config_contracts.resolvePluginConfigContractsById({
			config: cfg,
			workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg)),
			env: process.env,
			pluginIds
		})
	});
}
//#endregion
Object.defineProperty(exports, "collectEnabledInsecureOrDangerousFlags", {
	enumerable: true,
	get: function() {
		return collectEnabledInsecureOrDangerousFlags;
	}
});
Object.defineProperty(exports, "dangerous_config_flags_exports", {
	enumerable: true,
	get: function() {
		return dangerous_config_flags_exports;
	}
});
