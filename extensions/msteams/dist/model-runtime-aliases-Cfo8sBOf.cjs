const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_runtime_policy = require("./model-runtime-policy-CHKLCuJi.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
//#region src/agents/model-runtime-aliases.ts
/**
* Resolves CLI runtime aliases to provider/model auth labels and execution ids.
*/
var model_runtime_aliases_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	areRuntimeModelRefsEquivalent: () => areRuntimeModelRefsEquivalent,
	isCliRuntimeAlias: () => isCliRuntimeAlias,
	isCliRuntimeAliasForProvider: () => isCliRuntimeAliasForProvider,
	isCliRuntimeProvider: () => isCliRuntimeProvider,
	resolveCliRuntimeExecutionProvider: () => resolveCliRuntimeExecutionProvider,
	shouldPreferActiveRuntimeAliasAuthLabel: () => shouldPreferActiveRuntimeAliasAuthLabel
});
/** True for CLI runtime provider ids such as `claude-cli` and `google-gemini-cli`. */
function isCliRuntimeProvider(provider, params = {}) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	return require_cli_backends.listCliRuntimeProviderIds({
		config: params.config,
		env: params.env,
		includeSetupRegistry: params.includeSetupRegistry ?? (params.config !== void 0 || params.env !== void 0)
	}).includes(normalized);
}
function isCliRuntimeAlias(runtime) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(runtime ?? "");
	return normalized ? require_cli_backends.listCliRuntimeModelBackendBindings().some((binding) => binding.runtime === normalized) : false;
}
function isCliRuntimeAliasForProvider(params) {
	return require_cli_backends.isCliRuntimeModelBackendForProvider({
		provider: params.provider,
		runtime: params.runtime,
		config: params.cfg
	});
}
function canonicalizeRuntimeAliasProvider(provider, options = {}) {
	return require_cli_backends.resolveCliRuntimeCanonicalProvider({
		runtime: provider,
		config: options.config,
		env: options.env,
		includeSetupRegistry: options.includeSetupRegistry ?? (options.config !== void 0 || options.env !== void 0)
	}) ?? provider;
}
function normalizeRuntimeModelRefForComparison(raw, options = {}) {
	const trimmed = raw.trim();
	const parsed = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(trimmed);
	if (!parsed) return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(canonicalizeRuntimeAliasProvider(trimmed, options));
	return `${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(canonicalizeRuntimeAliasProvider(parsed.provider, options))}/${parsed.modelId}`;
}
function normalizeRuntimeModelRefWithoutAlias(raw) {
	const trimmed = raw.trim();
	const parsed = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(trimmed);
	if (!parsed) return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed);
	return `${parsed.provider}/${parsed.modelId}`;
}
function areRuntimeModelRefsEquivalent(left, right, options = {}) {
	if (normalizeRuntimeModelRefWithoutAlias(left) === normalizeRuntimeModelRefWithoutAlias(right)) return true;
	return normalizeRuntimeModelRefForComparison(left, options) === normalizeRuntimeModelRefForComparison(right, options);
}
function shouldPreferActiveRuntimeAliasAuthLabel(params) {
	if (!params.runtimeAliasModelEquivalent) return false;
	const selectedAuth = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.selectedAuthLabel);
	const activeAuth = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.activeAuthLabel);
	if (!activeAuth || activeAuth === "unknown") return false;
	return selectedAuth === "unknown" || Boolean(selectedAuth?.startsWith("api-key")) && (activeAuth.startsWith("oauth") || activeAuth.startsWith("token"));
}
function resolveConfiguredRuntime(params) {
	const policy = require_model_runtime_policy.resolveModelRuntimePolicy({
		config: params.cfg,
		provider: params.provider,
		modelId: params.modelId,
		agentId: params.agentId
	});
	return {
		runtime: policy.policy?.id?.trim() || void 0,
		matchedProvider: policy.matchedProvider
	};
}
function resolveProfileRuntimeAlias(params) {
	const profile = params.cfg?.auth?.profiles?.[params.profileId];
	if (!profile?.provider) return;
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const profileProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(profile.provider);
	if (!provider || !profileProvider) return;
	if (require_provider_auth_aliases.resolveProviderIdForAuth(provider, { config: params.cfg }) !== require_provider_auth_aliases.resolveProviderIdForAuth(profileProvider, { config: params.cfg })) return;
	if (profileProvider === provider) return;
	return require_cli_backends.resolveCliRuntimeModelBackendBinding({
		config: params.cfg,
		provider,
		runtime: profileProvider
	})?.runtime;
}
function resolveCliRuntimeFromAuthProfile(params) {
	if (!params.cfg?.auth?.profiles) return;
	if (params.authProfileId?.trim()) return resolveProfileRuntimeAlias({
		cfg: params.cfg,
		provider: params.provider,
		profileId: params.authProfileId.trim()
	});
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const providerAuthKey = require_provider_auth_aliases.resolveProviderIdForAuth(provider, { config: params.cfg });
	const orderedProfileIds = [...params.cfg.auth.order?.[providerAuthKey] ?? [], ...providerAuthKey === provider ? [] : params.cfg.auth.order?.[provider] ?? []];
	for (const profileId of orderedProfileIds) {
		const profile = params.cfg.auth.profiles[profileId];
		if (!profile?.provider) continue;
		if (require_provider_auth_aliases.resolveProviderIdForAuth(profile.provider, { config: params.cfg }) !== providerAuthKey) continue;
		return resolveProfileRuntimeAlias({
			cfg: params.cfg,
			provider,
			profileId
		});
	}
	const compatibleProfileIds = Object.entries(params.cfg.auth.profiles).filter(([, profile]) => {
		if (!profile?.provider) return false;
		return require_provider_auth_aliases.resolveProviderIdForAuth(profile.provider, { config: params.cfg }) === providerAuthKey;
	}).map(([profileId]) => profileId);
	if (compatibleProfileIds.length !== 1) return;
	const [profileId] = compatibleProfileIds;
	return profileId ? resolveProfileRuntimeAlias({
		cfg: params.cfg,
		provider,
		profileId
	}) : void 0;
}
function resolveCliRuntimeExecutionProvider(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const { runtime, matchedProvider } = resolveConfiguredRuntime({
		...params,
		provider
	});
	if (runtime === "@gabrielvfonseca/operator") return;
	if (!runtime || runtime === "auto") return resolveCliRuntimeFromAuthProfile({
		...params,
		provider
	});
	const effectiveProvider = provider || (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(matchedProvider ?? "");
	if (!effectiveProvider) return;
	return require_cli_backends.resolveCliRuntimeModelBackendBinding({
		config: params.cfg,
		provider: effectiveProvider,
		runtime
	})?.runtime;
}
//#endregion
Object.defineProperty(exports, "areRuntimeModelRefsEquivalent", {
	enumerable: true,
	get: function() {
		return areRuntimeModelRefsEquivalent;
	}
});
Object.defineProperty(exports, "isCliRuntimeAlias", {
	enumerable: true,
	get: function() {
		return isCliRuntimeAlias;
	}
});
Object.defineProperty(exports, "isCliRuntimeAliasForProvider", {
	enumerable: true,
	get: function() {
		return isCliRuntimeAliasForProvider;
	}
});
Object.defineProperty(exports, "isCliRuntimeProvider", {
	enumerable: true,
	get: function() {
		return isCliRuntimeProvider;
	}
});
Object.defineProperty(exports, "model_runtime_aliases_exports", {
	enumerable: true,
	get: function() {
		return model_runtime_aliases_exports;
	}
});
Object.defineProperty(exports, "resolveCliRuntimeExecutionProvider", {
	enumerable: true,
	get: function() {
		return resolveCliRuntimeExecutionProvider;
	}
});
Object.defineProperty(exports, "shouldPreferActiveRuntimeAliasAuthLabel", {
	enumerable: true,
	get: function() {
		return shouldPreferActiveRuntimeAliasAuthLabel;
	}
});
