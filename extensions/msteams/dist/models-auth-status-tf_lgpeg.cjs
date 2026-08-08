require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profiles = require("./profiles-m8TkqupR.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_model_provider_auth_state = require("./model-provider-auth-state-CivFEPZo.cjs");
const require_model_provider_auth = require("./model-provider-auth-Bk7aSJ7D.cjs");
const require_chat_abort = require("./chat-abort-CWaOZDr9.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_provider_usage_load = require("./provider-usage.load-felEzwOj.cjs");
const require_auth_health = require("./auth-health-Cc9z45kH.cjs");
const require_runtime = require("./runtime-Cmn4mgbi.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/gateway/server-methods/models-auth-status.ts
const log = require_subsystem.createSubsystemLogger("models-auth-status");
const apiKeyUsageStatusProviders = /* @__PURE__ */ new Set(["clawrouter", "deepseek"]);
const CACHE_TTL_MS = 6e4;
let cached = null;
let cacheGeneration = 0;
/**
* Invalidate the in-memory cache. Reserved for future gateway-side auth
* mutation handlers (login, logout, token rotation) so the next read returns
* fresh data. Today those mutations happen via the CLI and the 60s TTL plus
* `{refresh: true}` param cover the stale-data window.
*/
function invalidateModelAuthStatusCache() {
	cacheGeneration += 1;
	cached = null;
	require_model_provider_auth_state.clearCurrentProviderAuthState();
}
async function refreshModelAuthStatusRuntimeState() {
	invalidateModelAuthStatusCache();
	try {
		if (await require_runtime.refreshActiveProviderAuthRuntimeSnapshot()) return;
	} catch (err) {
		log.warn(`runtime auth snapshot refresh before auth status failed: ${require_ws_log.formatForLog(err)}`);
		return;
	}
	require_store.clearRuntimeAuthProfileStoreSnapshots();
}
function readProviderParam(params) {
	const raw = params.provider;
	if (typeof raw !== "string") return null;
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(raw) || null;
}
function readLogoutProfileSelection(params) {
	if (!("profileIds" in params)) return { ok: true };
	if (!Array.isArray(params.profileIds) || params.profileIds.length === 0) return {
		ok: false,
		message: "profileIds must be a non-empty string array"
	};
	const profileIds = [];
	for (const value of params.profileIds) {
		if (typeof value !== "string" || !value.trim()) return {
			ok: false,
			message: "profileIds must be a non-empty string array"
		};
		const profileId = value.trim();
		if (!profileIds.includes(profileId)) profileIds.push(profileId);
	}
	return {
		ok: true,
		profileIds
	};
}
function createAuthLogoutAbortOps(context) {
	return {
		chatAbortControllers: context.chatAbortControllers,
		chatRunBuffers: context.chatRunBuffers,
		chatAbortedRuns: context.chatAbortedRuns,
		clearChatRunState: context.clearChatRunState,
		removeChatRun: context.removeChatRun,
		agentRunSeq: context.agentRunSeq,
		broadcast: context.broadcast,
		nodeSendToSession: context.nodeSendToSession
	};
}
async function removeProviderAuthProfilesAcrossOwnerStores(params) {
	const ownerAgentDirs = /* @__PURE__ */ new Set([params.agentDir]);
	for (const profileId of params.profileIds) ownerAgentDirs.add(require_store.resolvePersistedAuthProfileOwnerAgentDir({
		agentDir: params.agentDir,
		profileId
	}));
	for (const ownerAgentDir of ownerAgentDirs) if (!await require_profiles.removeProviderAuthProfilesWithLock({
		provider: params.provider,
		agentDir: ownerAgentDir
	})) return false;
	return true;
}
async function removeAuthProfilesAcrossOwnerStores(params) {
	const profilesByOwner = /* @__PURE__ */ new Map([[params.agentDir, new Set(params.profileIds)]]);
	for (const profileId of params.profileIds) {
		const ownerAgentDir = require_store.resolvePersistedAuthProfileOwnerAgentDir({
			agentDir: params.agentDir,
			profileId
		});
		const ownerProfiles = profilesByOwner.get(ownerAgentDir) ?? /* @__PURE__ */ new Set();
		ownerProfiles.add(profileId);
		profilesByOwner.set(ownerAgentDir, ownerProfiles);
	}
	for (const [ownerAgentDir, profileIds] of profilesByOwner) if (!await require_profiles.removeAuthProfilesWithLock({
		profileIds: [...profileIds],
		agentDir: ownerAgentDir
	})) return false;
	return true;
}
function buildExpiry(remainingMs, expiresAt) {
	const normalizedExpiresAt = (0, require_number_coercion.number_coercion_exports.asDateTimestampMs)(expiresAt);
	if (normalizedExpiresAt === void 0 || typeof remainingMs !== "number") return;
	return {
		at: normalizedExpiresAt,
		remainingMs,
		label: require_auth_health.formatRemainingShort(remainingMs)
	};
}
function providerDisplayName(provider) {
	const usageId = require_provider_usage_load.resolveUsageProviderId(provider);
	const usageLabel = usageId ? require_provider_usage_load.providerUsageLabel(usageId) : void 0;
	if (usageLabel) return usageLabel;
	return provider;
}
function aggregateProfileStatus(profiles, now) {
	const statuses = new Set(profiles.map((profile) => profile.status));
	const status = [
		"expired",
		"missing",
		"expiring",
		"ok",
		"static"
	].find((candidate) => statuses.has(candidate));
	const expirable = profiles.map((p) => p.expiresAt).filter((v) => (0, require_number_coercion.number_coercion_exports.asDateTimestampMs)(v) !== void 0);
	const expiresAt = expirable.length > 0 ? Math.min(...expirable) : void 0;
	const remainingMs = expiresAt !== void 0 ? expiresAt - now : void 0;
	return {
		status: status ?? "static",
		expiresAt,
		remainingMs
	};
}
/**
* Aggregate the effective refreshable credential status for the dashboard.
* OAuth remains authoritative when present; token credentials are the
* supported fallback after an OAuth-to-token migration. Explicit auth-order
* exclusions remain authoritative through `effectiveProfiles`.
*
* `expectsOAuth` keeps an API-key-only provider `missing` after config switches
* to OAuth but login has not completed.
*/
function aggregateRefreshableAuthStatus(prov, now = Date.now(), expectsOAuth = false) {
	const profiles = prov.effectiveProfiles ?? prov.profiles;
	const oauth = profiles.filter((profile) => profile.type === "oauth");
	if (oauth.length > 0) return aggregateProfileStatus(oauth, now);
	const tokens = profiles.filter((profile) => profile.type === "token");
	if (tokens.length > 0) return aggregateProfileStatus(tokens, now);
	if (expectsOAuth) return { status: "missing" };
	return {
		status: prov.status,
		expiresAt: prov.expiresAt,
		remainingMs: prov.remainingMs
	};
}
function mapProvider(prov, usageByProvider, expectsOAuthSet, apiKeys, logoutProfileIds, configBoundProfileIds) {
	const usageProfile = prov.profiles.find((profile) => profile.type === "oauth" || profile.type === "token") ?? prov.profiles.find((profile) => profile.type === "api_key");
	const usageKey = require_provider_usage_load.resolveUsageProviderId(prov.provider, { credentialType: usageProfile?.type });
	const usage = usageKey ? usageByProvider.get(usageKey) : void 0;
	const rollup = aggregateRefreshableAuthStatus(prov, Date.now(), expectsOAuthSet.has(prov.provider));
	const apiKey = apiKeys.get((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(prov.provider));
	const hasRefreshableProfile = prov.profiles.some((profile) => profile.type === "oauth" || profile.type === "token");
	return {
		provider: prov.provider,
		displayName: providerDisplayName(prov.provider),
		status: apiKey && !hasRefreshableProfile && rollup.status === "missing" ? "static" : rollup.status,
		expiry: buildExpiry(rollup.remainingMs, rollup.expiresAt),
		profiles: prov.profiles.map((prof) => ({
			profileId: prof.profileId,
			type: prof.type,
			status: prof.status,
			reasonCode: prof.reasonCode,
			expiry: buildExpiry(prof.remainingMs, prof.expiresAt),
			...(prof.type === "oauth" || prof.type === "token") && logoutProfileIds.has(prof.profileId) && !configBoundProfileIds.has(prof.profileId) ? { logoutSupported: true } : {}
		})),
		...apiKey ? { apiKey } : {},
		usage: usage && usageKey ? {
			providerId: usageKey,
			windows: usage.windows,
			...usage.summary ? { summary: usage.summary } : {},
			...usage.plan ? { plan: usage.plan } : {},
			...usage.billing?.length ? { billing: usage.billing } : {},
			...usage.accountEmail ? { accountEmail: usage.accountEmail } : {}
		} : void 0
	};
}
function resolveEnvVarName(source) {
	return /^(?:shell env|env): ([A-Z][A-Z0-9_]*)$/u.exec(source)?.[1];
}
function resolveProviderApiKeys(cfg, store) {
	const lookupMaps = require_model_auth_markers.resolveProviderEnvAuthLookupMaps({
		config: cfg,
		env: process.env
	});
	const providerIds = /* @__PURE__ */ new Set([
		...Object.keys(cfg.models?.providers ?? {}),
		...Object.values(cfg.auth?.profiles ?? {}).map((profile) => profile?.provider).filter((provider) => typeof provider === "string"),
		...require_model_auth_markers.listProviderEnvAuthLookupKeys(lookupMaps)
	]);
	const apiKeys = /* @__PURE__ */ new Map();
	for (const rawProvider of providerIds) {
		const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(rawProvider);
		if (!provider) continue;
		const providerConfig = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(cfg.models?.providers, provider);
		if (require_types_secrets.hasConfiguredSecretInput(providerConfig?.apiKey, cfg.secrets?.defaults)) {
			const ref = require_types_secrets.coerceSecretRef(providerConfig?.apiKey, cfg.secrets?.defaults);
			const profileReference = require_model_auth.resolveProviderEntryApiKeyProfileReference({
				cfg,
				provider,
				store
			});
			if (profileReference.kind !== "profile" && profileReference.kind !== "profile-incompatible") {
				if (ref && ref.source !== "env") {
					apiKeys.set(provider, { source: "config" });
					continue;
				}
				const available = require_model_auth.resolveUsableCustomProviderApiKey({
					cfg,
					provider,
					env: process.env
				});
				if (available) {
					const rawKey = typeof providerConfig?.apiKey === "string" ? providerConfig.apiKey.trim() : "";
					if (rawKey && require_model_auth_markers.isNonSecretApiKeyMarker(rawKey, { includeEnvVarName: false })) continue;
					const envVar = ref?.source === "env" ? ref.id : profileReference.kind === "marker" && require_model_auth_markers.isKnownEnvApiKeyMarker(rawKey) ? rawKey : resolveEnvVarName(available.source);
					apiKeys.set(provider, envVar ? {
						source: "env",
						envVar
					} : { source: "config" });
					continue;
				}
			}
		}
		const envEvidence = require_model_auth_env.resolveProviderEnvAuthEvidence(provider, process.env, {
			aliasMap: lookupMaps.aliasMap,
			candidateMap: lookupMaps.envCandidateMap,
			authEvidenceMap: lookupMaps.authEvidenceMap
		});
		if (envEvidence?.mode !== "api-key") continue;
		const envVar = resolveEnvVarName(envEvidence.source);
		apiKeys.set(provider, {
			source: "env",
			...envVar ? { envVar } : {}
		});
	}
	return apiKeys;
}
function resolveConfigBoundProfileIds(cfg, store) {
	const profileIds = /* @__PURE__ */ new Set();
	for (const provider of Object.keys(cfg.models?.providers ?? {})) {
		const reference = require_model_auth.resolveProviderEntryApiKeyProfileReference({
			cfg,
			provider,
			store
		});
		if (reference.kind === "profile" || reference.kind === "profile-incompatible") profileIds.add(reference.profileId);
	}
	return profileIds;
}
function resolveConfiguredProviders(cfg, apiKeys) {
	const out = /* @__PURE__ */ new Set();
	const expectsOAuth = /* @__PURE__ */ new Set();
	for (const [id, provider] of Object.entries(cfg.models?.providers ?? {})) {
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(id);
		if (!normalized) continue;
		const rawKey = typeof provider?.apiKey === "string" ? provider.apiKey.trim() : "";
		const hasApiKey = require_types_secrets.hasConfiguredSecretInput(provider?.apiKey, cfg.secrets?.defaults) && (rawKey === "secretref-managed" || !require_model_auth_markers.isNonSecretApiKeyMarker(rawKey, { includeEnvVarName: false }));
		const mode = provider?.auth;
		if (mode !== "oauth" && mode !== "token" && !hasApiKey) continue;
		if (apiKeys.has(normalized)) continue;
		out.add(normalized);
		if (mode === "oauth") expectsOAuth.add(normalized);
	}
	for (const profile of Object.values(cfg.auth?.profiles ?? {})) {
		const provider = profile?.provider;
		const mode = profile?.mode;
		if (typeof provider !== "string" || provider.length === 0 || mode !== "oauth" && mode !== "token") continue;
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
		if (!normalized) continue;
		if (apiKeys.has(normalized)) continue;
		out.add(normalized);
		if (mode === "oauth") expectsOAuth.add(normalized);
	}
	return {
		providers: Array.from(out),
		expectsOAuth
	};
}
const modelsAuthStatusHandlers = {
	"models.authLogout": async ({ params, respond, context }) => {
		const provider = readProviderParam(params);
		if (!provider) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "provider is required"));
			return;
		}
		const selection = readLogoutProfileSelection(params);
		if (!selection.ok) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, selection.message));
			return;
		}
		try {
			const cfg = context.getRuntimeConfig();
			const agentDir = require_agent_scope_config.resolveDefaultAgentDir(cfg);
			const authProvider = require_provider_auth_aliases.resolveProviderIdForAuth(provider, { config: cfg });
			const store = require_store.ensureAuthProfileStoreWithoutExternalProfiles(agentDir);
			const availableProfiles = require_profile_list.listProfilesForProvider(store, provider);
			const removedProfiles = selection.profileIds ?? availableProfiles;
			if (selection.profileIds?.some((profileId) => {
				const profile = store.profiles[profileId];
				return !availableProfiles.includes(profileId) || profile?.type !== "oauth" && profile?.type !== "token";
			})) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "profileIds contain unavailable auth profiles"));
				return;
			}
			const configBoundProfileIds = selection.profileIds ? resolveConfigBoundProfileIds(cfg, store) : null;
			if (selection.profileIds?.some((profileId) => configBoundProfileIds?.has(profileId))) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "profileIds contain config-bound auth profiles"));
				return;
			}
			if (!(selection.profileIds ? await removeAuthProfilesAcrossOwnerStores({
				agentDir,
				profileIds: removedProfiles
			}) : await removeProviderAuthProfilesAcrossOwnerStores({
				provider,
				agentDir,
				profileIds: removedProfiles
			}))) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `failed to remove saved auth profiles for provider ${provider}`));
				return;
			}
			invalidateModelAuthStatusCache();
			await require_runtime.refreshActiveProviderAuthRuntimeSnapshot();
			require_model_provider_auth.warmCurrentProviderAuthStateOffMainThread(context.getRuntimeConfig()).catch((err) => {
				log.warn(`provider auth state rewarm after logout failed: ${require_ws_log.formatForLog(err)}`);
			});
			const { runIds: abortedRunIds } = selection.profileIds ? { runIds: [] } : require_chat_abort.abortChatRunsForProvider(createAuthLogoutAbortOps(context), {
				providerId: authProvider,
				stopReason: "auth-revoked"
			});
			respond(true, {
				provider,
				removedProfiles,
				abortedRunIds
			}, void 0);
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	"models.authStatus": async ({ params, respond, context }) => {
		const now = Date.now();
		const bypassCache = Boolean(params?.refresh);
		if (!bypassCache && cached && now - cached.ts < CACHE_TTL_MS) {
			respond(true, cached.result, void 0, { cached: true });
			return;
		}
		try {
			if (bypassCache) await refreshModelAuthStatusRuntimeState();
			const publishGeneration = cacheGeneration;
			const cfg = context.getRuntimeConfig();
			const agentDir = require_agent_scope_config.resolveDefaultAgentDir(cfg);
			const store = require_store.ensureAuthProfileStore(agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForConfigStatus({ cfg }) });
			const apiKeys = resolveProviderApiKeys(cfg, store);
			const configured = resolveConfiguredProviders(cfg, apiKeys);
			const statusProviderIds = new Set(configured.providers);
			for (const provider of apiKeys.keys()) statusProviderIds.add(provider);
			for (const profile of Object.values(store.profiles)) {
				const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(profile.provider);
				if (provider) statusProviderIds.add(provider);
			}
			const authHealth = require_auth_health.buildAuthHealthSummary({
				store,
				cfg,
				providers: statusProviderIds.size > 0 ? [...statusProviderIds] : void 0,
				allowKeychainPrompt: false
			});
			const usageProviderIds = [...new Set(authHealth.profiles.filter((p) => {
				if (p.type === "oauth" || p.type === "token") return true;
				const usageProvider = require_provider_usage_load.resolveUsageProviderId(p.provider, { credentialType: p.type });
				return usageProvider ? apiKeyUsageStatusProviders.has(usageProvider) : false;
			}).map((p) => require_provider_usage_load.resolveUsageProviderId(p.provider, { credentialType: p.type })).filter((id) => Boolean(id)))];
			const usageByProvider = /* @__PURE__ */ new Map();
			if (usageProviderIds.length > 0) try {
				const usage = await require_provider_usage_load.loadProviderUsageSummary({
					providers: usageProviderIds,
					agentDir,
					timeoutMs: 3500
				});
				for (const snap of usage.providers) usageByProvider.set(snap.provider, {
					windows: snap.windows,
					...snap.summary ? { summary: snap.summary } : {},
					...snap.plan ? { plan: snap.plan } : {},
					...snap.billing?.length ? { billing: snap.billing } : {},
					...snap.accountEmail ? { accountEmail: snap.accountEmail } : {}
				});
			} catch (err) {
				log.debug(`usage enrichment failed (auth status still returned): providers=${usageProviderIds.join(",")} error=${require_ws_log.formatForLog(err)}`);
			}
			const externalProfileIds = new Set(store.runtimeExternalProfileIds ?? []);
			const logoutProfileIds = new Set(Object.entries(store.profiles).filter(([profileId, profile]) => !externalProfileIds.has(profileId) && (profile.type === "oauth" || profile.type === "token")).map(([profileId]) => profileId));
			const configBoundProfileIds = resolveConfigBoundProfileIds(cfg, store);
			const result = {
				ts: now,
				providers: authHealth.providers.map((prov) => mapProvider(prov, usageByProvider, configured.expectsOAuth, apiKeys, logoutProfileIds, configBoundProfileIds))
			};
			if (publishGeneration === cacheGeneration) cached = {
				ts: now,
				result
			};
			respond(true, result, void 0);
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	}
};
//#endregion
exports.aggregateRefreshableAuthStatus = aggregateRefreshableAuthStatus;
exports.invalidateModelAuthStatusCache = invalidateModelAuthStatusCache;
exports.modelsAuthStatusHandlers = modelsAuthStatusHandlers;
