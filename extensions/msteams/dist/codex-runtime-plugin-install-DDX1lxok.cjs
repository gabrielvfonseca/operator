require("./rolldown-runtime-u92d-OFm.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_runtime_plugin_install = require("./runtime-plugin-install-CDzbuVgU.cjs");
//#region src/commands/codex-runtime-plugin-install.ts
const CODEX_RUNTIME_PLUGIN_ID = "codex";
const CODEX_RUNTIME_PLUGIN_LABEL = "Codex";
const CODEX_RUNTIME_PLUGIN_DESCRIPTOR = {
	pluginId: CODEX_RUNTIME_PLUGIN_ID,
	label: CODEX_RUNTIME_PLUGIN_LABEL,
	npmSpec: "@gabrielvfonseca/codex",
	warningLabel: CODEX_RUNTIME_PLUGIN_LABEL
};
const codexRuntimePluginInstall = require_runtime_plugin_install.createRuntimePluginModelSelectionHelpers({
	descriptor: CODEX_RUNTIME_PLUGIN_DESCRIPTOR,
	shouldEnsure: ({ cfg, model, agentId }) => require_openai_routing.modelSelectionShouldEnsureCodexPlugin({
		config: cfg,
		model,
		agentId
	})
});
const codexSupervisionPluginInstall = require_runtime_plugin_install.createRuntimePluginModelSelectionHelpers({
	descriptor: CODEX_RUNTIME_PLUGIN_DESCRIPTOR,
	shouldEnsure: () => true
});
const ensureCodexRuntimePluginForModelSelection = codexRuntimePluginInstall.ensure;
const repairCodexRuntimePluginInstallForModelSelection = codexRuntimePluginInstall.repair;
codexSupervisionPluginInstall.ensure;
//#endregion
exports.CODEX_RUNTIME_PLUGIN_ID = CODEX_RUNTIME_PLUGIN_ID;
exports.ensureCodexRuntimePluginForModelSelection = ensureCodexRuntimePluginForModelSelection;
exports.repairCodexRuntimePluginInstallForModelSelection = repairCodexRuntimePluginInstallForModelSelection;
