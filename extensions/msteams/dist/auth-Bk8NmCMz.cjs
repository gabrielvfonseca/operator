const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
//#region src/agents/runtime-plan/auth.ts
const CODEX_HARNESS_AUTH_PROVIDER = "openai";
const EMPTY_PROVIDER_AUTH_ALIAS_METADATA = { plugins: [] };
function resolveHarnessAuthProvider(params) {
	const harnessId = require_openai_routing.normalizeOptionalAgentRuntimeId(params.harnessId);
	const runtime = require_openai_routing.normalizeOptionalAgentRuntimeId(params.harnessRuntime);
	return harnessId === "codex" || runtime === "codex" ? CODEX_HARNESS_AUTH_PROVIDER : void 0;
}
/** Builds the auth forwarding plan for one resolved agent runtime. */
function buildAgentRuntimeAuthPlan(params) {
	const providerAuthAliasesEnabled = params.providerAuthAliasesEnabled ?? (params.config ? require_config_state.normalizePluginsConfig(params.config.plugins).enabled : true);
	const metadataSnapshot = params.metadataSnapshot ?? (providerAuthAliasesEnabled ? void 0 : EMPTY_PROVIDER_AUTH_ALIAS_METADATA);
	const aliasLookupParams = {
		config: params.config,
		workspaceDir: params.workspaceDir,
		...metadataSnapshot ? { metadataSnapshot } : {}
	};
	const providerForAuth = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider, aliasLookupParams);
	const authProfileProviderForAuth = require_provider_auth_aliases.resolveProviderIdForAuth(params.authProfileProvider ?? params.provider, aliasLookupParams);
	const harnessAuthProvider = resolveHarnessAuthProvider(params);
	const harnessProviderForAuth = harnessAuthProvider ? require_provider_auth_aliases.resolveProviderIdForAuth(harnessAuthProvider, aliasLookupParams) : void 0;
	const harnessCanForwardProfile = params.allowHarnessAuthProfileForwarding !== false && harnessProviderForAuth && harnessProviderForAuth === authProfileProviderForAuth;
	const canForwardProfile = !harnessProviderForAuth && providerForAuth === authProfileProviderForAuth || harnessCanForwardProfile;
	const forwardedAuthProfileId = canForwardProfile ? params.sessionAuthProfileId : void 0;
	return {
		providerForAuth,
		...params.modelId ? { modelId: params.modelId } : {},
		authProfileProviderForAuth,
		...harnessProviderForAuth ? { harnessAuthProvider: harnessProviderForAuth } : {},
		...canForwardProfile ? { forwardedAuthProfileId } : {},
		...canForwardProfile && params.sessionAuthProfileId && params.sessionAuthProfileSource ? { forwardedAuthProfileSource: params.sessionAuthProfileSource } : {},
		...canForwardProfile && params.sessionAuthProfileCandidateIds?.length ? { forwardedAuthProfileCandidateIds: params.sessionAuthProfileCandidateIds } : {},
		...canForwardProfile && params.authProfileMode ? { selectedAuthMode: params.authProfileMode } : {},
		...params.modelRoute ? { modelRoute: params.modelRoute } : {},
		...params.deferredRouteSupport ? { deferredRouteSupport: params.deferredRouteSupport } : {}
	};
}
//#endregion
Object.defineProperty(exports, "buildAgentRuntimeAuthPlan", {
	enumerable: true,
	get: function() {
		return buildAgentRuntimeAuthPlan;
	}
});
