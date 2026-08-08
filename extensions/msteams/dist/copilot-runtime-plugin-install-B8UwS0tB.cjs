require("./rolldown-runtime-u92d-OFm.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_model_runtime_policy = require("./model-runtime-policy-CHKLCuJi.cjs");
const require_runtime_plugin_install = require("./runtime-plugin-install-CDzbuVgU.cjs");
//#region src/agents/copilot-routing.ts
const GITHUB_COPILOT_PROVIDER_ID = "github-copilot";
/**
* Canonical id of the Copilot agent runtime plugin.
*/
const COPILOT_RUNTIME_ID = "copilot";
function parseModelRefId(model) {
	if (typeof model !== "string") return;
	const trimmed = model.trim();
	const slash = trimmed.indexOf("/");
	if (slash <= 0 || slash === trimmed.length - 1) return;
	return trimmed.slice(slash + 1);
}
/**
* Returns true when the selected model should trigger the external
* `@gabrielvfonseca/copilot` runtime plugin install.
*
* Gating contract (review #2, P1):
*   - Model ref must use the `github-copilot/*` provider prefix.
*   - The user's config must explicitly opt in by setting
*     `agentRuntime.id: "copilot"` at the provider, model, or agent scope
*     (resolved via `resolveModelRuntimePolicy`).
*
* Without the explicit opt-in we fall through to the built-in GitHub
* Copilot provider, which has shipped support for `github-copilot/*`
* models for a long time and must not install the runtime plugin for
* users who never asked for it.
*/
function modelSelectionShouldEnsureCopilotRuntimePlugin(params) {
	if (require_openai_routing.parseModelRefProvider(params.model) !== GITHUB_COPILOT_PROVIDER_ID) return false;
	const modelId = parseModelRefId(params.model);
	return require_model_runtime_policy.resolveModelRuntimePolicy({
		config: params.config,
		provider: GITHUB_COPILOT_PROVIDER_ID,
		modelId
	}).policy?.id?.trim().toLowerCase() === COPILOT_RUNTIME_ID;
}
//#endregion
//#region src/commands/copilot-runtime-plugin-install.ts
const copilotRuntimePluginInstall = require_runtime_plugin_install.createRuntimePluginModelSelectionHelpers({
	descriptor: {
		pluginId: "copilot",
		label: "GitHub Copilot agent runtime",
		npmSpec: "@gabrielvfonseca/copilot",
		warningLabel: "GitHub Copilot"
	},
	shouldEnsure: ({ cfg, model }) => modelSelectionShouldEnsureCopilotRuntimePlugin({
		config: cfg,
		model
	})
});
const ensureCopilotRuntimePluginForModelSelection = copilotRuntimePluginInstall.ensure;
const repairCopilotRuntimePluginInstallForModelSelection = copilotRuntimePluginInstall.repair;
//#endregion
exports.ensureCopilotRuntimePluginForModelSelection = ensureCopilotRuntimePluginForModelSelection;
exports.repairCopilotRuntimePluginInstallForModelSelection = repairCopilotRuntimePluginInstallForModelSelection;
