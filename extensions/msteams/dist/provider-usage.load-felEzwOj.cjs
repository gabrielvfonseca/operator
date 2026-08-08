const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_fetch_timeout = require("./fetch-timeout-C6HLIptD.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_provider_env_vars = require("./provider-env-vars-D_wXMNA1.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_proxy_fetch = require("./proxy-fetch-Dry5Rpb3.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_source_check = require("./source-check-bi20wzmV.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
const PROVIDER_LABELS = {
	anthropic: "Claude",
	clawrouter: "ClawRouter",
	deepseek: "DeepSeek",
	"github-copilot": "Copilot",
	"google-gemini-cli": "Gemini",
	minimax: "MiniMax",
	openai: "OpenAI",
	openrouter: "OpenRouter",
	venice: "Venice",
	xiaomi: "Xiaomi",
	"xiaomi-token-plan": "Xiaomi Token Plan",
	zai: "z.ai"
};
/** Dynamic-key lookup view; closed-key reads should use PROVIDER_LABELS directly. */
function providerUsageLabel(provider) {
	return PROVIDER_LABELS[provider];
}
function resolveProviderUsageDisplayName(provider) {
	return providerUsageLabel(provider) ?? provider;
}
/** Returns true for providers whose usage endpoint is only meaningful with OAuth/token auth. */
function isOAuthOnlyUsageProvider(provider) {
	return provider === "openai";
}
/** Maps model/provider ids and credential type into a normalized usage provider id. */
function resolveUsageProviderId(provider, options) {
	if (!provider) return;
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	if (normalized === "openai" && (options?.credentialType === "oauth" || options?.credentialType === "token")) return "openai";
	if (normalized === "openai") return;
	if (normalized === "claude-cli") return "anthropic";
	if (normalized === "minimax-portal" || normalized === "minimax-cn" || normalized === "minimax-portal-cn") return "minimax";
	return normalized || void 0;
}
const ignoredErrors = /* @__PURE__ */ new Set([
	"No credentials",
	"No token",
	"No API key",
	"Not logged in",
	"No auth"
]);
const clampPercent = (value) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
/** Resolves a promise with a fallback when usage collection exceeds the timeout. */
const withTimeout = async (work, ms, fallback) => {
	let timeout;
	const timeoutMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(ms, 1);
	try {
		return await Promise.race([work, new Promise((resolve) => {
			timeout = setTimeout(() => resolve(fallback), timeoutMs);
		})]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
};
//#endregion
//#region src/infra/fetch.ts
const wrapFetchWithAbortSignalMarker = Symbol.for("operator.fetch.abort-signal-wrapped");
function withDuplex(init, input) {
	const hasInitBody = init?.body != null;
	const hasRequestBody = !hasInitBody && typeof Request !== "undefined" && input instanceof Request && input.body != null;
	if (!hasInitBody && !hasRequestBody) return init;
	if (init && "duplex" in init) return init;
	return init ? {
		...init,
		duplex: "half"
	} : { duplex: "half" };
}
/**
* Wraps fetch so Node-compatible duplex bodies, normalized headers, and foreign
* AbortSignal implementations work against runtimes expecting native signals.
*/
function wrapFetchWithAbortSignal(fetchImpl) {
	if (fetchImpl[wrapFetchWithAbortSignalMarker]) return fetchImpl;
	const wrapped = ((input, init) => {
		const patchedInit = require_fetch_guard.normalizeRequestInitHeadersForFetch(withDuplex(init, input));
		const signal = patchedInit?.signal;
		if (!signal) return fetchImpl(input, patchedInit);
		if (typeof AbortSignal !== "undefined" && signal instanceof AbortSignal) return fetchImpl(input, patchedInit);
		if (typeof AbortController === "undefined") return fetchImpl(input, patchedInit);
		if (typeof signal.addEventListener !== "function") return fetchImpl(input, patchedInit);
		const controller = new AbortController();
		const onAbort = require_fetch_timeout.bindAbortRelay(controller);
		let listenerAttached = false;
		if (signal.aborted) controller.abort();
		else {
			signal.addEventListener("abort", onAbort, { once: true });
			listenerAttached = true;
		}
		const cleanup = () => {
			if (!listenerAttached || typeof signal.removeEventListener !== "function") return;
			listenerAttached = false;
			try {
				signal.removeEventListener("abort", onAbort);
			} catch {}
		};
		try {
			return fetchImpl(input, {
				...patchedInit,
				signal: controller.signal
			}).finally(cleanup);
		} catch (error) {
			cleanup();
			throw error;
		}
	});
	const wrappedFetch = Object.assign(wrapped, fetchImpl);
	const fetchWithPreconnect = fetchImpl;
	wrappedFetch.preconnect = typeof fetchWithPreconnect.preconnect === "function" ? fetchWithPreconnect.preconnect.bind(fetchWithPreconnect) : () => {};
	Object.defineProperty(wrappedFetch, wrapFetchWithAbortSignalMarker, {
		value: true,
		enumerable: false,
		configurable: false,
		writable: false
	});
	return wrappedFetch;
}
/** Resolves an optional fetch implementation, wrapping it when fetch is available. */
function resolveFetch(fetchImpl) {
	const resolved = fetchImpl ?? globalThis.fetch;
	if (!resolved) return;
	return wrapFetchWithAbortSignal(resolved);
}
//#endregion
//#region src/infra/provider-usage.auth.ts
function resolveUsageAuthStore(state) {
	state.store ??= require_store.ensureAuthProfileStore(state.agentDir, { allowKeychainPrompt: false });
	return state.store;
}
function resolveProviderApiKeyFromConfig(params) {
	const envDirect = params.envDirect?.map(require_normalize_secret_input.normalizeSecretInput).find(Boolean);
	if (envDirect) return envDirect;
	for (const providerId of params.providerIds) {
		const envKey = require_model_auth_env.resolveEnvApiKey(providerId, params.state.env)?.apiKey;
		if (envKey) return envKey;
		const key = require_model_auth.resolveUsableCustomProviderApiKey({
			cfg: params.state.cfg,
			provider: providerId,
			env: params.state.env
		})?.apiKey;
		if (key) return key;
	}
}
function hasProviderAuthEnvCredentialSource(params) {
	const candidates = require_provider_env_vars.resolveProviderAuthEnvVarCandidates({
		config: params.state.cfg,
		env: {
			...process.env.VITEST ? process.env : {},
			...params.state.env
		}
	});
	for (const providerId of normalizeProviderIds(params.providerIds)) {
		const envVars = Object.hasOwn(candidates, providerId) ? candidates[providerId] : void 0;
		if (!envVars) continue;
		if (envVars.some((envVar) => Boolean(require_normalize_secret_input.normalizeSecretInput(params.state.env[envVar])))) return true;
	}
	return false;
}
function hasProviderUsageAuthEnvCredentialSource(params) {
	const providerIds = new Set(normalizeProviderIds(params.providerIds));
	try {
		return require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
			config: params.state.cfg,
			env: params.state.env
		}).plugins.some((plugin) => {
			if (!isUsageProviderManifestEligible({
				plugin,
				state: params.state
			})) return false;
			return Object.entries(plugin.providerUsageAuthEnvVars ?? {}).some(([providerId, envVars]) => providerIds.has(require_model_selection_normalize.normalizeProviderId(providerId)) && envVars.some((envVar) => Boolean(require_normalize_secret_input.normalizeSecretInput(params.state.env[envVar]))));
		});
	} catch {
		return false;
	}
}
function resolveProviderApiKeyFromConfigAndStore(params) {
	return resolveProviderApiKeyCandidatesFromConfigAndStoreSync(params)[0];
}
function resolveProviderApiKeyCandidatesFromConfigAndStoreSync(params) {
	const candidates = [];
	const configKey = resolveProviderApiKeyFromConfig(params);
	if (configKey) candidates.push(configKey);
	if (!params.state.allowAuthProfileStore) return candidates;
	const normalizedProviderIds = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(params.providerIds.map((providerId) => require_model_selection_normalize.normalizeProviderId(providerId))));
	const store = resolveUsageAuthStore(params.state);
	const credentials = [...normalizedProviderIds].flatMap((provider) => require_order.resolveAuthProfileOrder({
		cfg: params.state.cfg,
		store,
		provider
	})).map((id) => store.profiles[id]).filter((profile) => profile?.type === "api_key" || profile?.type === "token");
	for (const credential of credentials) {
		const value = require_normalize_secret_input.normalizeSecretInput(credential.type === "api_key" ? credential.key : credential.token);
		if (value && !require_model_auth_markers.isNonSecretApiKeyMarker(value)) candidates.push(value);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(candidates);
}
async function resolveProviderApiKeyCandidatesFromConfigAndStore(params) {
	const candidates = [];
	const configKey = resolveProviderApiKeyFromConfig(params);
	if (configKey) candidates.push(configKey);
	if (!params.state.allowAuthProfileStore) return candidates;
	const store = resolveUsageAuthStore(params.state);
	const profileIds = require_profile_list.dedupeProfileIds(normalizeProviderIds(params.providerIds).flatMap((provider) => require_order.resolveAuthProfileOrder({
		cfg: params.state.cfg,
		store,
		provider
	})));
	for (const profileId of profileIds) {
		const credential = store.profiles[profileId];
		if (!credential || credential.type !== "api_key" && credential.type !== "token") continue;
		let resolved;
		try {
			resolved = await require_oauth.resolveApiKeyForProfile({
				cfg: params.state.cfg,
				store,
				profileId,
				agentDir: params.state.agentDir
			});
		} catch {
			continue;
		}
		const value = require_normalize_secret_input.normalizeSecretInput(resolved?.apiKey);
		if (value && !require_model_auth_markers.isNonSecretApiKeyMarker(value)) candidates.push(value);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(candidates);
}
function normalizeProviderIds(providerIds) {
	return [...new Set([...providerIds].map((providerId) => providerId ? require_model_selection_normalize.normalizeProviderId(providerId) : void 0).filter((providerId) => Boolean(providerId)))];
}
function isUsageProviderManifestEligible(params) {
	const normalizedConfig = require_config_state.normalizePluginsConfig(params.state.cfg.plugins);
	if (!require_manifest_owner_policy.passesManifestOwnerBasePolicy({
		plugin: params.plugin,
		normalizedConfig
	})) return false;
	if (params.plugin.origin !== "workspace") return true;
	return require_manifest_owner_policy.isActivatedManifestOwner({
		plugin: params.plugin,
		normalizedConfig,
		rootConfig: params.state.cfg
	});
}
function resolveUsageCredentialProviderIds(params) {
	const providerIds = new Set(normalizeProviderIds([params.provider]));
	const providerIdSet = new Set(providerIds);
	try {
		const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
			config: params.state.cfg,
			env: params.state.env
		});
		for (const plugin of snapshot.plugins) {
			const pluginProviderIds = normalizeProviderIds(plugin.providers);
			if (!pluginProviderIds.some((providerId) => providerIdSet.has(providerId))) continue;
			if (!isUsageProviderManifestEligible({
				plugin,
				state: params.state
			})) continue;
			for (const providerId of pluginProviderIds) providerIds.add(providerId);
		}
	} catch {}
	return [...providerIds];
}
async function resolveOAuthToken(params) {
	if (!params.state.allowAuthProfileStore) return null;
	const store = resolveUsageAuthStore(params.state);
	const deduped = require_profile_list.dedupeProfileIds(require_order.resolveAuthProfileOrder({
		cfg: params.state.cfg,
		store,
		provider: params.provider
	}));
	for (const profileId of deduped) {
		const cred = store.profiles[profileId];
		if (!cred || cred.type !== "oauth" && cred.type !== "token") continue;
		try {
			const resolved = await require_oauth.resolveApiKeyForProfile({
				cfg: params.state.cfg,
				store,
				profileId,
				agentDir: params.state.agentDir
			});
			if (!resolved) continue;
			return {
				provider: params.provider,
				token: resolved.apiKey,
				accountId: cred.type === "oauth" && "accountId" in cred ? cred.accountId : void 0,
				...cred.type === "oauth" && cred.subscriptionType ? { subscriptionType: cred.subscriptionType } : {},
				...cred.type === "oauth" && cred.rateLimitTier ? { rateLimitTier: cred.rateLimitTier } : {},
				...cred.email ? { email: cred.email } : {}
			};
		} catch {}
	}
	return null;
}
async function resolveProviderUsageAuthViaPlugin(params) {
	const resolved = await require_provider_runtime.resolveProviderUsageAuthWithPlugin({
		provider: params.provider,
		config: params.state.cfg,
		env: params.state.env,
		context: {
			config: params.state.cfg,
			agentDir: params.state.agentDir,
			env: params.state.env,
			provider: params.provider,
			resolveApiKeyFromConfigAndStore: (options) => resolveProviderApiKeyFromConfigAndStore({
				state: params.state,
				providerIds: options?.providerIds ?? [params.provider],
				envDirect: options?.envDirect
			}),
			resolveApiKeyCandidatesFromConfigAndStore: (options) => resolveProviderApiKeyCandidatesFromConfigAndStore({
				state: params.state,
				providerIds: options?.providerIds ?? [params.provider],
				envDirect: options?.envDirect
			}),
			resolveOAuthToken: async (options) => {
				const auth = await resolveOAuthToken({
					state: params.state,
					provider: options?.provider ?? params.provider
				});
				return auth ? {
					token: auth.token,
					...auth.accountId ? { accountId: auth.accountId } : {},
					...auth.subscriptionType ? { subscriptionType: auth.subscriptionType } : {},
					...auth.rateLimitTier ? { rateLimitTier: auth.rateLimitTier } : {},
					...auth.email ? { email: auth.email } : {}
				} : null;
			}
		}
	});
	if (!resolved) return {
		handled: false,
		auth: null
	};
	if ("handled" in resolved) return {
		handled: true,
		auth: null
	};
	return {
		handled: true,
		auth: {
			provider: params.provider,
			token: resolved.token,
			...resolved.accountId ? { accountId: resolved.accountId } : {},
			...resolved.subscriptionType ? { subscriptionType: resolved.subscriptionType } : {},
			...resolved.rateLimitTier ? { rateLimitTier: resolved.rateLimitTier } : {},
			...resolved.email ? { email: resolved.email } : {}
		}
	};
}
async function resolveProviderUsageAuthFallback(params) {
	const oauthToken = await resolveOAuthToken({
		state: params.state,
		provider: params.provider
	});
	if (oauthToken) return oauthToken;
	if (isOAuthOnlyUsageProvider(params.provider)) return null;
	const apiKey = resolveProviderApiKeyFromConfigAndStore({
		state: params.state,
		providerIds: [params.provider]
	});
	if (apiKey) return {
		provider: params.provider,
		token: apiKey
	};
	return null;
}
function hasAuthProfileCredentialSource(params) {
	const store = require_store.ensureAuthProfileStoreWithoutExternalProfiles(params.state.agentDir, { allowKeychainPrompt: false });
	for (const provider of params.providerIds) if (require_profile_list.dedupeProfileIds(require_order.resolveAuthProfileOrder({
		cfg: params.state.cfg,
		store,
		provider
	})).some((profileId) => {
		const cred = store.profiles[profileId];
		return cred?.type === "oauth" || cred?.type === "token" || cred?.type === "api_key";
	})) return true;
	return false;
}
async function resolveProviderAuths(params) {
	if (params.auth) return params.auth;
	const stateBase = {
		cfg: params.config ?? require_io.getRuntimeConfig(),
		env: params.env ?? process.env,
		agentDir: params.agentDir
	};
	const authProfileSourceState = {
		...stateBase,
		allowAuthProfileStore: true
	};
	const hasAuthProfileStoreSource = params.skipPluginAuthWithoutCredentialSource ? require_source_check.hasAnyAuthProfileStoreSource(params.agentDir) : false;
	const auths = [];
	for (const provider of params.providers) {
		if (!params.skipPluginAuthWithoutCredentialSource) {
			const pluginAuth = await resolveProviderUsageAuthViaPlugin({
				state: authProfileSourceState,
				provider
			});
			if (pluginAuth.auth) {
				auths.push(pluginAuth.auth);
				continue;
			}
			if (pluginAuth.handled) continue;
			const fallbackAuth = await resolveProviderUsageAuthFallback({
				state: authProfileSourceState,
				provider
			});
			if (fallbackAuth) auths.push(fallbackAuth);
			continue;
		}
		const directCredentialState = {
			...stateBase,
			allowAuthProfileStore: false
		};
		const credentialProviderIds = resolveUsageCredentialProviderIds({
			state: directCredentialState,
			provider
		});
		const hasDirectCredentialSource = Boolean(resolveProviderApiKeyFromConfig({
			state: directCredentialState,
			providerIds: credentialProviderIds
		})) || hasProviderAuthEnvCredentialSource({
			state: directCredentialState,
			providerIds: credentialProviderIds
		}) || hasProviderUsageAuthEnvCredentialSource({
			state: directCredentialState,
			providerIds: credentialProviderIds
		});
		const allowAuthProfileStore = hasDirectCredentialSource || hasAuthProfileStoreSource && hasAuthProfileCredentialSource({
			state: authProfileSourceState,
			providerIds: credentialProviderIds
		});
		const state = {
			...stateBase,
			allowAuthProfileStore
		};
		if (hasDirectCredentialSource || allowAuthProfileStore) {
			const pluginAuth = await resolveProviderUsageAuthViaPlugin({
				state,
				provider
			});
			if (pluginAuth.auth) {
				auths.push(pluginAuth.auth);
				continue;
			}
			if (pluginAuth.handled) continue;
		}
		const fallbackAuth = await resolveProviderUsageAuthFallback({
			state,
			provider
		});
		if (fallbackAuth) auths.push(fallbackAuth);
	}
	return auths;
}
//#endregion
//#region src/infra/provider-usage.load.ts
async function fetchProviderUsageSnapshotFallback(params) {
	params.timeoutMs;
	params.fetchFn;
	return {
		provider: params.auth.provider,
		displayName: resolveProviderUsageDisplayName(params.auth.provider),
		windows: [],
		error: "Unsupported provider"
	};
}
async function fetchProviderUsageSnapshot(params) {
	const pluginSnapshot = await require_provider_runtime.resolveProviderUsageSnapshotWithPlugin({
		provider: params.auth.hookProvider ?? params.auth.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		context: {
			config: params.config,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			env: params.env,
			provider: params.auth.provider,
			token: params.auth.token,
			accountId: params.auth.accountId,
			authProfileId: params.auth.authProfileId,
			subscriptionType: params.auth.subscriptionType,
			rateLimitTier: params.auth.rateLimitTier,
			email: params.auth.email,
			timeoutMs: params.timeoutMs,
			fetchFn: params.fetchFn
		}
	});
	if (pluginSnapshot) return pluginSnapshot;
	return await fetchProviderUsageSnapshotFallback({
		auth: params.auth,
		timeoutMs: params.timeoutMs,
		fetchFn: params.fetchFn
	});
}
/** Loads usage snapshots from configured provider auth and plugin-backed usage hooks. */
async function loadProviderUsageSummary(opts = {}) {
	const now = opts.now ?? Date.now();
	const timeoutMs = opts.timeoutMs ?? 5e3;
	const config = opts.config ?? require_io.getRuntimeConfig();
	const env = opts.env ?? process.env;
	const fetchFn = opts.fetch ? resolveFetch(opts.fetch) : require_proxy_fetch.resolveProxyFetchFromEnv(env) ?? resolveFetch();
	if (!fetchFn) throw new Error("fetch is not available");
	const descriptors = opts.providers ? opts.providers.map((provider) => ({
		provider,
		displayName: resolveProviderUsageDisplayName(provider)
	})) : opts.auth ? opts.auth.map((auth) => ({
		provider: auth.provider,
		displayName: resolveProviderUsageDisplayName(auth.provider)
	})) : require_provider_runtime.listProviderUsagePluginDescriptors({
		config,
		workspaceDir: opts.workspaceDir,
		env
	});
	const displayNames = new Map(descriptors.map((descriptor) => [descriptor.provider, descriptor.displayName]));
	const auths = await resolveProviderAuths({
		providers: descriptors.map((descriptor) => descriptor.provider),
		auth: opts.auth,
		agentDir: opts.agentDir,
		config,
		env,
		skipPluginAuthWithoutCredentialSource: opts.skipPluginAuthWithoutCredentialSource
	});
	if (auths.length === 0) return {
		updatedAt: now,
		providers: []
	};
	const tasks = auths.map((auth) => {
		const failureSnapshot = (error) => ({
			provider: auth.provider,
			displayName: displayNames.get(auth.provider) ?? resolveProviderUsageDisplayName(auth.provider),
			windows: [],
			error
		});
		return withTimeout(fetchProviderUsageSnapshot({
			auth,
			config,
			env,
			agentDir: opts.agentDir,
			workspaceDir: opts.workspaceDir,
			timeoutMs,
			fetchFn
		}), timeoutMs + 1e3, {
			provider: auth.provider,
			displayName: displayNames.get(auth.provider) ?? resolveProviderUsageDisplayName(auth.provider),
			windows: [],
			error: "Timeout"
		}).catch((error) => {
			const message = error instanceof Error ? error.message : String(error);
			return failureSnapshot(message.trim() || "Fetch failed");
		});
	});
	return {
		updatedAt: now,
		providers: (await Promise.all(tasks)).filter((entry) => {
			if (entry.windows.length > 0) return true;
			if (entry.billing && entry.billing.length > 0) return true;
			if (entry.costHistory?.daily.length) return true;
			if (entry.summary?.trim()) return true;
			if (!entry.error) return true;
			return !ignoredErrors.has(entry.error);
		})
	};
}
//#endregion
Object.defineProperty(exports, "clampPercent", {
	enumerable: true,
	get: function() {
		return clampPercent;
	}
});
Object.defineProperty(exports, "loadProviderUsageSummary", {
	enumerable: true,
	get: function() {
		return loadProviderUsageSummary;
	}
});
Object.defineProperty(exports, "providerUsageLabel", {
	enumerable: true,
	get: function() {
		return providerUsageLabel;
	}
});
Object.defineProperty(exports, "resolveUsageProviderId", {
	enumerable: true,
	get: function() {
		return resolveUsageProviderId;
	}
});
