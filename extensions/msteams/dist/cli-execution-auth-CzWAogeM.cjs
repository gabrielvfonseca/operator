const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
//#region src/agents/cli-execution-auth.ts
const GOOGLE_GEMINI_CLI_PROVIDER_ID = "google-gemini-cli";
const GOOGLE_PROVIDER_ID = "google";
function cliBackendAcceptsAuthProfileForwarding(params) {
	return require_cli_backends.resolveCliBackendConfig(params.provider, params.config, { agentId: params.agentId })?.id === GOOGLE_GEMINI_CLI_PROVIDER_ID;
}
/**
* Resolve the profile a CLI backend may consume. Gemini CLI prefers its own
* OAuth identity, then bridges a canonical Google API key when that model is
* explicitly routed through the CLI runtime. A user-locked profile must fail
* closed here; falling through would silently run the request as another user.
*/
function resolveCliExecutionAuthProfileId(params) {
	const store = require_store.loadAuthProfileStoreForRuntime(params.agentDir, {
		readOnly: true,
		allowKeychainPrompt: false,
		externalCliProviderIds: [params.cliExecutionProvider]
	});
	const selectedAuthProfileId = params.selected?.authProfileId?.trim();
	if (selectedAuthProfileId) {
		const credential = store.profiles[selectedAuthProfileId];
		if (credential?.provider === params.cliExecutionProvider) return selectedAuthProfileId;
		if (params.cliExecutionProvider === GOOGLE_GEMINI_CLI_PROVIDER_ID && credential?.provider === GOOGLE_PROVIDER_ID && credential.type === "api_key" && params.selected?.authProfileIdSource !== "auto") return selectedAuthProfileId;
		if (params.selected?.authProfileIdSource !== "auto") {
			if (!credential) throw new Error(`No credentials found for profile "${selectedAuthProfileId}".`);
			throw new Error(`CLI backend "${params.cliExecutionProvider}" cannot use auth profile "${selectedAuthProfileId}" owned by "${credential.provider}".`);
		}
	}
	const cliProfileId = require_order.resolveAuthProfileOrder({
		cfg: params.config,
		store,
		provider: params.cliExecutionProvider
	})[0];
	if (cliProfileId) return cliProfileId;
	if (params.cliExecutionProvider !== GOOGLE_GEMINI_CLI_PROVIDER_ID || params.authProfileProvider !== GOOGLE_PROVIDER_ID) return;
	return require_order.resolveAuthProfileOrder({
		cfg: params.config,
		store,
		provider: GOOGLE_PROVIDER_ID
	}).find((profileId) => {
		const credential = store.profiles[profileId];
		return credential?.provider === GOOGLE_PROVIDER_ID && credential.type === "api_key";
	});
}
//#endregion
Object.defineProperty(exports, "cliBackendAcceptsAuthProfileForwarding", {
	enumerable: true,
	get: function() {
		return cliBackendAcceptsAuthProfileForwarding;
	}
});
Object.defineProperty(exports, "resolveCliExecutionAuthProfileId", {
	enumerable: true,
	get: function() {
		return resolveCliExecutionAuthProfileId;
	}
});
