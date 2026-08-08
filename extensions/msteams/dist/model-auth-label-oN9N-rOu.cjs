const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
const require_auth_profiles = require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/agents/model-auth-label.ts
/**
* Formats user-facing auth labels for resolved provider/model credentials.
*/
/** Resolve the display label that describes how a provider is authenticated. */
function resolveModelAuthLabel(params) {
	const resolvedProvider = params.provider?.trim();
	if (!resolvedProvider) return;
	const providerKey = require_model_selection_normalize.normalizeProviderId(resolvedProvider);
	const store = params.includeExternalProfiles === false ? require_store.loadAuthProfileStoreWithoutExternalProfiles(params.agentDir) : require_store.ensureAuthProfileStore(params.agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({
		cfg: params.cfg,
		provider: providerKey,
		preferredProfile: params.sessionEntry?.authProfileOverride
	}) });
	const profileOverride = params.sessionEntry?.authProfileOverride?.trim();
	const acceptedProviderKeys = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...(params.acceptedProviderIds ?? []).map(require_model_selection_normalize.normalizeProviderId), providerKey].filter(Boolean));
	const candidates = [profileOverride, ...(0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(acceptedProviderKeys.flatMap((acceptedProvider) => require_order.resolveAuthProfileOrder({
		cfg: params.cfg,
		store,
		provider: acceptedProvider,
		preferredProfile: profileOverride
	})))].filter(Boolean);
	for (const profileId of candidates) {
		const profile = store.profiles[profileId];
		if (!profile || !acceptedProviderKeys.some((acceptedProvider) => require_order.isStoredCredentialCompatibleWithAuthProvider({
			cfg: params.cfg,
			provider: acceptedProvider,
			credential: profile
		}))) continue;
		const label = require_auth_profiles.resolveAuthProfileDisplayLabel({
			cfg: params.cfg,
			store,
			profileId
		});
		if (profile.type === "oauth") return `oauth${label ? ` (${label})` : ""}`;
		if (profile.type === "token") return `token${label ? ` (${label})` : ""}`;
		return `api-key${label ? ` (${label})` : ""}`;
	}
	const providerEntryProfileRef = require_model_auth.resolveProviderEntryApiKeyProfileReference({
		cfg: params.cfg,
		provider: providerKey,
		store
	});
	if (providerEntryProfileRef.kind === "profile") {
		const label = require_auth_profiles.resolveAuthProfileDisplayLabel({
			cfg: params.cfg,
			store,
			profileId: providerEntryProfileRef.profileId
		});
		if (providerEntryProfileRef.mode === "token") return `token${label ? ` (${label})` : ""}`;
		return `api-key${label ? ` (${label})` : ""}`;
	}
	if (providerEntryProfileRef.kind === "profile-incompatible") return "unknown";
	if (params.codexCliCredentialsHome && (providerKey === "openai" || providerKey === "codex") && require_external_auth.readCodexCliCredentialsCached({
		codexHome: params.codexCliCredentialsHome,
		ttlMs: 5e3,
		allowKeychainPrompt: false
	})) return "oauth (codex-cli)";
	const envKey = require_model_auth_env.resolveEnvApiKey(providerKey, process.env, {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	});
	if (envKey?.apiKey) {
		if (envKey.source.includes("OAUTH_TOKEN")) return `oauth (${envKey.source})`;
		return `api-key (${envKey.source})`;
	}
	if (providerKey === "codex" && require_external_auth.readCodexCliCredentialsCached({
		ttlMs: 5e3,
		allowKeychainPrompt: false
	})) return "oauth (codex-cli)";
	if (providerKey === "claude-cli" && require_external_auth.readClaudeCliCredentialsCached({
		ttlMs: 5e3,
		allowKeychainPrompt: false
	})) return "oauth (claude-cli)";
	if (require_model_auth.resolveUsableCustomProviderApiKey({
		cfg: params.cfg,
		provider: providerKey
	})) return `api-key (models.json)`;
	return "unknown";
}
//#endregion
Object.defineProperty(exports, "resolveModelAuthLabel", {
	enumerable: true,
	get: function() {
		return resolveModelAuthLabel;
	}
});
