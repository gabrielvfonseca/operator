const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
require("./persisted-BWJt7718.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/agents/auth-profiles/external-cli-auth-selection.ts
/**
* External CLI auth selection scoping.
* Narrows CLI discovery to the provider/profile selected by model auth routing
* so runtime auth setup avoids broad CLI probing.
*/
const CLAUDE_CLI_PROVIDER_ID = "claude-cli";
/** Resolve external CLI overlay scope from the user's auth/model selection. */
function resolveExternalCliAuthOverlayScopeFromSelection(params) {
	const authScope = resolveExternalCliAuthScopeFromAuthSelection({
		provider: params.provider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		store: params.store,
		userLockedAuthProfileId: params.userLockedAuthProfileId
	});
	const selectedRuntimeProvider = require_model_runtime_aliases.resolveCliRuntimeExecutionProvider({
		provider: params.provider,
		cfg: params.cfg,
		agentId: params.agentId,
		modelId: params.modelId,
		authProfileId: params.userLockedAuthProfileId
	}) || (params.provider === CLAUDE_CLI_PROVIDER_ID ? CLAUDE_CLI_PROVIDER_ID : void 0);
	const selectedProvider = authScope.selectedProviderId ?? (selectedRuntimeProvider === CLAUDE_CLI_PROVIDER_ID ? CLAUDE_CLI_PROVIDER_ID : void 0);
	const providerIds = [.../* @__PURE__ */ new Set([...authScope.providerIds, ...selectedRuntimeProvider === CLAUDE_CLI_PROVIDER_ID ? [CLAUDE_CLI_PROVIDER_ID] : []])];
	return {
		...providerIds.length > 0 ? { providerIds } : {},
		ignoreAutoPreferredProfile: !params.userLockedAuthProfileId && selectedProvider === CLAUDE_CLI_PROVIDER_ID
	};
}
function resolveExternalCliAuthScopeFromAuthSelection(params) {
	if (params.userLockedAuthProfileId) {
		const providerId = resolveExternalCliProviderIdForCompatibleAuthProfile({
			...params,
			profileId: params.userLockedAuthProfileId
		})?.externalCliProviderId;
		return {
			providerIds: providerId ? [providerId] : [],
			...providerId ? { selectedProviderId: providerId } : {}
		};
	}
	const providerIds = [];
	let sawCompatibleOrderedProfile = false;
	let selectedProviderId;
	for (const profileId of resolveConfiguredAuthProfileOrder(params)) {
		const resolved = resolveExternalCliProviderIdForCompatibleAuthProfile({
			...params,
			profileId
		});
		if (!resolved.compatible) continue;
		if (!sawCompatibleOrderedProfile) {
			selectedProviderId = resolved.externalCliProviderId;
			sawCompatibleOrderedProfile = true;
		}
		if (resolved.externalCliProviderId) providerIds.push(resolved.externalCliProviderId);
	}
	if (sawCompatibleOrderedProfile) return {
		providerIds: [...new Set(providerIds)],
		...selectedProviderId ? { selectedProviderId } : {}
	};
	let compatibleProfileCount = 0;
	const profileIds = [.../* @__PURE__ */ new Set([...Object.keys(params.cfg?.auth?.profiles ?? {}), ...Object.keys(params.store?.profiles ?? {})])];
	for (const profileId of profileIds) {
		const resolved = resolveExternalCliProviderIdForCompatibleAuthProfile({
			...params,
			profileId
		});
		if (!resolved.compatible) continue;
		compatibleProfileCount += 1;
		if (resolved.externalCliProviderId) providerIds.push(resolved.externalCliProviderId);
	}
	const uniqueProviderIds = [...new Set(providerIds)];
	return {
		providerIds: uniqueProviderIds,
		...compatibleProfileCount === 1 && uniqueProviderIds[0] ? { selectedProviderId: uniqueProviderIds[0] } : {}
	};
}
function resolveConfiguredAuthProfileOrder(params) {
	const providerAuthKey = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider, {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	});
	const orderedProfileIds = resolveAuthProfileOrderEntries({
		order: params.store?.order,
		provider: params.provider,
		providerAuthKey
	}) ?? resolveAuthProfileOrderEntries({
		order: params.cfg?.auth?.order,
		provider: params.provider,
		providerAuthKey
	}) ?? [];
	return [...new Set(orderedProfileIds.map((profileId) => profileId?.trim()).filter((profileId) => Boolean(profileId)))];
}
function resolveAuthProfileOrderEntries(params) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.order, params.providerAuthKey) ?? ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.providerAuthKey) === (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider) ? void 0 : (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.order, params.provider));
}
function resolveExternalCliProviderIdForCompatibleAuthProfile(params) {
	const profile = params.cfg?.auth?.profiles?.[params.profileId];
	const credential = params.store?.profiles?.[params.profileId];
	const profileProvider = profile?.provider ?? credential?.provider ?? (params.profileId === "anthropic:claude-cli" ? CLAUDE_CLI_PROVIDER_ID : void 0);
	if (!profileProvider) return { compatible: false };
	const authAliasParams = {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	};
	const providerAuthKey = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider, authAliasParams);
	const profileAuthKey = require_provider_auth_aliases.resolveProviderIdForAuth(profileProvider, authAliasParams);
	if (!providerAuthKey || profileAuthKey !== providerAuthKey) return { compatible: false };
	return {
		compatible: true,
		...(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(profileProvider) === CLAUDE_CLI_PROVIDER_ID ? { externalCliProviderId: CLAUDE_CLI_PROVIDER_ID } : {}
	};
}
//#endregion
Object.defineProperty(exports, "resolveExternalCliAuthOverlayScopeFromSelection", {
	enumerable: true,
	get: function() {
		return resolveExternalCliAuthOverlayScopeFromSelection;
	}
});
