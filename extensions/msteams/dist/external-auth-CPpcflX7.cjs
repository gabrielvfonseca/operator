const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_json_file = require("./json-file-DCJhM2Bu.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_crypto = require("node:crypto");
let node_child_process = require("node:child_process");
//#region src/agents/cli-credentials.ts
/**
* Reads and refreshes credentials stored by external CLI runtimes such as
* Claude Code, Codex, Gemini, and MiniMax.
*/
const log = require_subsystem.createSubsystemLogger("agents/auth-profiles");
const CLAUDE_CLI_CREDENTIALS_RELATIVE_PATH = ".claude/.credentials.json";
const CODEX_CLI_AUTH_FILENAME = "auth.json";
const MINIMAX_CLI_CREDENTIALS_RELATIVE_PATH = ".minimax/oauth_creds.json";
const GEMINI_CLI_CREDENTIALS_RELATIVE_PATH = ".gemini/oauth_creds.json";
const CODEX_CLI_FALLBACK_EXPIRY_MS = 3600 * 1e3;
const CLAUDE_CLI_KEYCHAIN_SERVICE = "Claude Code-credentials";
let claudeCliCache = null;
let codexCliCache = null;
let minimaxCliCache = null;
let geminiCliCache = null;
/** Clears in-memory CLI credential caches for isolated tests. */
function resetCliCredentialCachesForTest() {
	claudeCliCache = null;
	codexCliCache = null;
	minimaxCliCache = null;
	geminiCliCache = null;
}
function resolveClaudeCliCredentialsPath(homeDir) {
	const baseDir = require_home_dir.resolveOsHomeRelativePath(homeDir ?? "~");
	return node_path.default.join(baseDir, CLAUDE_CLI_CREDENTIALS_RELATIVE_PATH);
}
function parseClaudeCliOauthCredential(claudeOauth) {
	if (!claudeOauth || typeof claudeOauth !== "object") return null;
	const data = claudeOauth;
	const accessToken = data.accessToken;
	const refreshToken = data.refreshToken;
	const expiresAt = data.expiresAt;
	const subscriptionType = typeof data.subscriptionType === "string" && data.subscriptionType.trim() ? data.subscriptionType.trim() : void 0;
	const rateLimitTier = typeof data.rateLimitTier === "string" && data.rateLimitTier.trim() ? data.rateLimitTier.trim() : void 0;
	const planFields = {
		...subscriptionType ? { subscriptionType } : {},
		...rateLimitTier ? { rateLimitTier } : {}
	};
	if (typeof accessToken !== "string" || !accessToken) return null;
	if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || expiresAt <= 0) return null;
	if (typeof refreshToken === "string" && refreshToken) return {
		type: "oauth",
		provider: "anthropic",
		access: accessToken,
		refresh: refreshToken,
		expires: expiresAt,
		...planFields
	};
	return {
		type: "token",
		provider: "anthropic",
		token: accessToken,
		expires: expiresAt,
		...planFields
	};
}
function resolveCodexHomePath(codexHome) {
	const home = require_home_dir.resolveOsHomeRelativePath((codexHome ?? process.env.CODEX_HOME) || "~/.codex");
	try {
		return node_fs.default.realpathSync.native(home);
	} catch {
		return home;
	}
}
function codexAuthJsonUsesChatGptTokens(data) {
	const authMode = typeof data.auth_mode === "string" ? data.auth_mode.toLowerCase() : void 0;
	if (authMode) return authMode === "chatgpt" || authMode === "chatgptauthtokens";
	return typeof data.OPENAI_API_KEY !== "string";
}
function resolveMiniMaxCliCredentialsPath(homeDir) {
	const baseDir = require_home_dir.resolveOsHomeRelativePath(homeDir ?? "~");
	return node_path.default.join(baseDir, MINIMAX_CLI_CREDENTIALS_RELATIVE_PATH);
}
function resolveGeminiCliCredentialsPath(homeDir) {
	const baseDir = require_home_dir.resolveOsHomeRelativePath(homeDir ?? "~");
	return node_path.default.join(baseDir, GEMINI_CLI_CREDENTIALS_RELATIVE_PATH);
}
function readFileMtimeMs(filePath) {
	try {
		return node_fs.default.statSync(filePath).mtimeMs;
	} catch {
		return null;
	}
}
function readCachedCliCredential(options) {
	const { ttlMs, cache, cacheKey, read, setCache, readSourceFingerprint } = options;
	if (ttlMs <= 0) return read();
	const now = Date.now();
	const sourceFingerprint = readSourceFingerprint?.();
	if (cache && cache.cacheKey === cacheKey && cache.sourceFingerprint === sourceFingerprint && now - cache.readAt < ttlMs) return cache.value;
	const value = read();
	const cachedSourceFingerprint = readSourceFingerprint?.();
	if (!readSourceFingerprint || cachedSourceFingerprint === sourceFingerprint) setCache({
		value,
		readAt: now,
		cacheKey,
		sourceFingerprint: cachedSourceFingerprint
	});
	else setCache(null);
	return value;
}
function computeCodexKeychainAccount(codexHome) {
	return `cli|${(0, node_crypto.createHash)("sha256").update(codexHome).digest("hex").slice(0, 16)}`;
}
function resolveCodexKeychainParams(options) {
	return {
		platform: options?.platform ?? process.platform,
		execSyncImpl: options?.execSync ?? node_child_process.execSync,
		codexHome: resolveCodexHomePath(options?.codexHome)
	};
}
function decodeJwtExpiryMs(token) {
	const parts = token.split(".");
	if (parts.length < 2) return null;
	const encodedPayload = parts.at(1);
	if (!encodedPayload) return null;
	try {
		const payloadRaw = Buffer.from(encodedPayload, "base64url").toString("utf8");
		const payload = JSON.parse(payloadRaw);
		if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= 0) return null;
		return (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(payload.exp * 1e3) ?? null;
	} catch {
		return null;
	}
}
function decodeJwtIdentityClaims(token) {
	const parts = token.split(".");
	if (parts.length < 2) return {};
	const encodedPayload = parts.at(1);
	if (!encodedPayload) return {};
	try {
		const payloadRaw = Buffer.from(encodedPayload, "base64url").toString("utf8");
		const payload = JSON.parse(payloadRaw);
		return {
			sub: typeof payload.sub === "string" && payload.sub ? payload.sub : void 0,
			email: typeof payload.email === "string" && payload.email ? payload.email : void 0
		};
	} catch {
		return {};
	}
}
function readCodexKeychainAuthRecord(options) {
	const { platform, execSyncImpl, codexHome } = resolveCodexKeychainParams(options);
	if (platform !== "darwin" || options?.allowKeychainPrompt === false) return null;
	const account = computeCodexKeychainAccount(codexHome);
	try {
		const secret = execSyncImpl(`security find-generic-password -s "Codex Auth" -a "${account}" -w`, {
			encoding: "utf8",
			timeout: 5e3,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		}).trim();
		return JSON.parse(secret);
	} catch {
		return null;
	}
}
function resolveCodexFallbackExpiryMs(nowMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(CODEX_CLI_FALLBACK_EXPIRY_MS, { nowMs: nowMs === void 0 ? void 0 : Math.floor(nowMs) });
}
function readCodexKeychainCredentials(options) {
	const parsed = readCodexKeychainAuthRecord(options);
	if (!parsed) return null;
	const tokens = parsed.tokens;
	try {
		const accessToken = tokens?.access_token;
		const refreshToken = tokens?.refresh_token;
		if (typeof accessToken !== "string" || !accessToken) return null;
		if (typeof refreshToken !== "string" || !refreshToken) return null;
		const lastRefreshRaw = parsed.last_refresh;
		const fallbackExpiry = resolveCodexFallbackExpiryMs(typeof lastRefreshRaw === "string" || typeof lastRefreshRaw === "number" ? new Date(lastRefreshRaw).getTime() : Date.now()) ?? resolveCodexFallbackExpiryMs();
		const expires = decodeJwtExpiryMs(accessToken) ?? fallbackExpiry;
		if (expires === void 0) return null;
		const accountId = typeof tokens?.account_id === "string" ? tokens.account_id : void 0;
		const idToken = typeof tokens?.id_token === "string" ? tokens.id_token : void 0;
		log.info("read codex credentials from keychain", {
			source: "keychain",
			expires: (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(expires)
		});
		return {
			type: "oauth",
			provider: "openai",
			access: accessToken,
			refresh: refreshToken,
			expires,
			accountId,
			idToken
		};
	} catch {
		return null;
	}
}
function readCliOauthTokenFields(data) {
	const accessToken = data.access_token;
	const refreshToken = data.refresh_token;
	const expiresAt = data.expiry_date;
	if (typeof accessToken !== "string" || !accessToken) return null;
	if (typeof refreshToken !== "string" || !refreshToken) return null;
	if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return null;
	return {
		access: accessToken,
		refresh: refreshToken,
		expires: expiresAt
	};
}
function readPortalCliOauthCredentials(credPath, provider) {
	const raw = require_json_file.loadJsonFile(credPath);
	if (!raw || typeof raw !== "object") return null;
	const tokens = readCliOauthTokenFields(raw);
	return tokens ? {
		type: "oauth",
		provider,
		...tokens
	} : null;
}
function readMiniMaxCliCredentials(options) {
	return readPortalCliOauthCredentials(resolveMiniMaxCliCredentialsPath(options?.homeDir), "minimax-portal");
}
function readGeminiCliCredentials(options) {
	const raw = require_json_file.loadJsonFile(resolveGeminiCliCredentialsPath(options?.homeDir));
	if (!raw || typeof raw !== "object") return null;
	const data = raw;
	const tokens = readCliOauthTokenFields(data);
	if (!tokens) return null;
	const idTokenRaw = data.id_token;
	const identity = typeof idTokenRaw === "string" && idTokenRaw ? decodeJwtIdentityClaims(idTokenRaw) : {};
	return {
		type: "oauth",
		provider: "google-gemini-cli",
		...tokens,
		...identity.email ? { email: identity.email } : {},
		...identity.sub ? { accountId: identity.sub } : {}
	};
}
function readClaudeCliKeychainCredentials(execSyncImpl = node_child_process.execSync) {
	try {
		const result = execSyncImpl(`security find-generic-password -s "${CLAUDE_CLI_KEYCHAIN_SERVICE}" -w`, {
			encoding: "utf8",
			timeout: 5e3,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		});
		return parseClaudeCliOauthCredential(JSON.parse(result.trim())?.claudeAiOauth);
	} catch {
		return null;
	}
}
function readClaudeCliAccountEmail(homeDir) {
	const baseDir = require_home_dir.resolveOsHomeRelativePath(homeDir ?? "~");
	const raw = require_json_file.loadJsonFile(node_path.default.join(baseDir, ".claude.json"));
	if (!raw || typeof raw !== "object") return;
	const account = raw.oauthAccount;
	if (!account || typeof account !== "object") return;
	const email = account.emailAddress;
	return typeof email === "string" && email.trim() ? email.trim() : void 0;
}
function withClaudeAccountEmail(cliLogin, homeDir) {
	if (!cliLogin) return null;
	const email = readClaudeCliAccountEmail(homeDir);
	return email ? {
		...cliLogin,
		email
	} : cliLogin;
}
/** Reads Claude CLI credentials from macOS Keychain or the CLI credential file. */
function readClaudeCliCredentials(options) {
	if ((options?.platform ?? process.platform) === "darwin" && options?.allowKeychainPrompt !== false) {
		const keychainCreds = readClaudeCliKeychainCredentials(options?.execSync);
		if (keychainCreds) {
			log.info("read anthropic credentials from claude cli keychain", { type: keychainCreds.type });
			return withClaudeAccountEmail(keychainCreds, options?.homeDir);
		}
	}
	const raw = require_json_file.loadJsonFile(resolveClaudeCliCredentialsPath(options?.homeDir));
	if (!raw || typeof raw !== "object") return null;
	return withClaudeAccountEmail(parseClaudeCliOauthCredential(raw.claudeAiOauth), options?.homeDir);
}
/** @deprecated Anthropic provider-owned CLI credential helper; do not use from third-party plugins. */
function readClaudeCliCredentialsCached(options) {
	const platform = options?.platform ?? process.platform;
	const ttlMs = options?.ttlMs ?? 0;
	const credentialsPath = resolveClaudeCliCredentialsPath(options?.homeDir);
	const keychainIntent = platform === "darwin" && options?.allowKeychainPrompt !== false ? "keychain" : "file";
	return readCachedCliCredential({
		ttlMs,
		cache: claudeCliCache,
		cacheKey: `${credentialsPath}:${keychainIntent}`,
		read: () => readClaudeCliCredentials({
			allowKeychainPrompt: options?.allowKeychainPrompt,
			platform,
			homeDir: options?.homeDir,
			execSync: options?.execSync
		}),
		setCache: (next) => {
			claudeCliCache = next;
		}
	});
}
/** Reads Codex CLI OAuth credentials from Keychain or CODEX_HOME auth.json. */
function readCodexCliCredentials(options) {
	const keychain = readCodexKeychainCredentials({
		codexHome: options?.codexHome,
		allowKeychainPrompt: options?.allowKeychainPrompt,
		platform: options?.platform,
		execSync: options?.execSync
	});
	if (keychain) return keychain;
	const authPath = node_path.default.join(resolveCodexHomePath(options?.codexHome), CODEX_CLI_AUTH_FILENAME);
	const raw = require_json_file.loadJsonFile(authPath);
	if (!raw || typeof raw !== "object") return null;
	const data = raw;
	if (!codexAuthJsonUsesChatGptTokens(data)) return null;
	const tokens = data.tokens;
	if (!tokens || typeof tokens !== "object") return null;
	const accessToken = tokens.access_token;
	const refreshToken = tokens.refresh_token;
	if (typeof accessToken !== "string" || !accessToken) return null;
	if (typeof refreshToken !== "string" || !refreshToken) return null;
	let fallbackExpiry;
	try {
		fallbackExpiry = resolveCodexFallbackExpiryMs(node_fs.default.statSync(authPath).mtimeMs);
	} catch {
		fallbackExpiry = resolveCodexFallbackExpiryMs();
	}
	const expires = decodeJwtExpiryMs(accessToken) ?? fallbackExpiry;
	if (expires === void 0) return null;
	return {
		type: "oauth",
		provider: "openai",
		access: accessToken,
		refresh: refreshToken,
		expires,
		accountId: typeof tokens.account_id === "string" ? tokens.account_id : void 0,
		idToken: typeof tokens.id_token === "string" ? tokens.id_token : void 0
	};
}
/** Reads Codex CLI credentials with optional short-lived cache and file fingerprinting. */
function readCodexCliCredentialsCached(options) {
	const platform = options?.platform ?? process.platform;
	const ttlMs = options?.ttlMs ?? 0;
	const authPath = node_path.default.join(resolveCodexHomePath(options?.codexHome), CODEX_CLI_AUTH_FILENAME);
	const keychainIntent = platform === "darwin" && options?.allowKeychainPrompt !== false ? "keychain" : "file";
	return readCachedCliCredential({
		ttlMs,
		cache: codexCliCache,
		cacheKey: `${platform}|${authPath}:${keychainIntent}`,
		read: () => readCodexCliCredentials({
			codexHome: options?.codexHome,
			allowKeychainPrompt: options?.allowKeychainPrompt,
			platform: options?.platform,
			execSync: options?.execSync
		}),
		setCache: (next) => {
			codexCliCache = next;
		},
		readSourceFingerprint: () => readFileMtimeMs(authPath)
	});
}
/** Reads MiniMax CLI credentials with optional short-lived cache. */
function readMiniMaxCliCredentialsCached(options) {
	const credPath = resolveMiniMaxCliCredentialsPath(options?.homeDir);
	return readCachedCliCredential({
		ttlMs: options?.ttlMs ?? 0,
		cache: minimaxCliCache,
		cacheKey: credPath,
		read: () => readMiniMaxCliCredentials({ homeDir: options?.homeDir }),
		setCache: (next) => {
			minimaxCliCache = next;
		},
		readSourceFingerprint: () => readFileMtimeMs(credPath)
	});
}
/** Reads Gemini CLI credentials with optional short-lived cache. */
function readGeminiCliCredentialsCached(options) {
	const credPath = resolveGeminiCliCredentialsPath(options?.homeDir);
	return readCachedCliCredential({
		ttlMs: options?.ttlMs ?? 0,
		cache: geminiCliCache,
		cacheKey: credPath,
		read: () => readGeminiCliCredentials({ homeDir: options?.homeDir }),
		setCache: (next) => {
			geminiCliCache = next;
		},
		readSourceFingerprint: () => readFileMtimeMs(credPath)
	});
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.cliCredentialsTestApi")] = {
	readCodexAuth: readCodexCliCredentials,
	resetCaches: resetCliCredentialCachesForTest
};
//#endregion
//#region src/agents/auth-profiles/external-cli-sync.ts
/**
* External CLI OAuth synchronization.
* Reads supported CLI credential stores, decides whether those credentials can
* safely bootstrap local auth profiles, and returns runtime/persisted overlays.
*/
/** Return true when imported CLI credentials match an existing profile identity. */
function isSafeToUseExternalCliCredential(existing, imported) {
	if (!existing) return true;
	if (existing.provider !== imported.provider) return false;
	return require_persisted.isSafeToCopyOAuthIdentity(existing, imported);
}
const EXTERNAL_CLI_SYNC_PROVIDERS = [
	{
		profileId: require_persisted.OPENAI_CODEX_DEFAULT_PROFILE_ID,
		profileAliases: ["openai:default"],
		provider: "openai",
		aliases: [
			"openai",
			"codex",
			"codex-cli",
			"codex-app-server"
		],
		readCredentials: (options) => readCodexCliCredentialsCached({
			ttlMs: require_persisted.EXTERNAL_CLI_SYNC_TTL_MS,
			allowKeychainPrompt: options?.allowKeychainPrompt
		}),
		bootstrapOnly: true
	},
	{
		profileId: require_persisted.CLAUDE_CLI_PROFILE_ID,
		provider: "claude-cli",
		readCredentials: (options) => {
			const credential = readClaudeCliCredentialsCached({
				ttlMs: require_persisted.EXTERNAL_CLI_SYNC_TTL_MS,
				allowKeychainPrompt: options?.allowKeychainPrompt
			});
			if (credential?.type !== "oauth") return null;
			return {
				...credential,
				provider: "claude-cli"
			};
		}
	},
	{
		profileId: require_persisted.MINIMAX_CLI_PROFILE_ID,
		provider: "minimax-portal",
		aliases: ["minimax", "minimax-cli"],
		readCredentials: () => readMiniMaxCliCredentialsCached({ ttlMs: require_persisted.EXTERNAL_CLI_SYNC_TTL_MS })
	}
];
function resolveExternalCliSyncProvider(params) {
	const provider = EXTERNAL_CLI_SYNC_PROVIDERS.find((entry) => externalCliProfileIdMatches(entry, params.profileId));
	if (!provider) return null;
	if (params.credential && !listExternalCliProviderIds(provider).includes(params.credential.provider)) return null;
	return provider;
}
function listExternalCliProfileIds(providerConfig) {
	return [providerConfig.profileId, ...providerConfig.profileAliases ?? []];
}
function listExternalCliProviderIds(providerConfig) {
	return [providerConfig.provider, ...providerConfig.aliases ?? []];
}
function normalizeExternalCliCredentialProvider(credential, provider) {
	return credential ? {
		...credential,
		provider
	} : null;
}
function getAuthProfileProviderPrefix(profileId) {
	return profileId.split(":", 1)[0]?.trim() ?? "";
}
function externalCliProfileIdMatches(providerConfig, profileId, options) {
	if (listExternalCliProfileIds(providerConfig).includes(profileId)) return true;
	if (!options?.allowLegacyNamespace || providerConfig.profileId !== "openai:default") return false;
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(getAuthProfileProviderPrefix(profileId)) === "openai";
}
function hasInlineOAuthTokenMaterial(credential) {
	return [
		credential.access,
		credential.refresh,
		credential.idToken
	].some((value) => typeof value === "string" && value.trim().length > 0);
}
function hasManagedProviderOAuth(store, providerConfig) {
	return Object.values(store.profiles).some((credential) => credential?.type === "oauth" && listExternalCliProviderIds(providerConfig).includes(credential.provider) && hasInlineOAuthTokenMaterial(credential));
}
/** Read a CLI credential only for safe bootstrap of an unusable local profile. */
function readExternalCliBootstrapCredential(params) {
	const provider = resolveExternalCliSyncProvider(params);
	if (!provider) return null;
	if (provider.bootstrapOnly && hasManagedProviderOAuth(params.store, provider)) return null;
	if (provider.bootstrapOnly && !params.allowInlineOAuthTokenMaterial && hasInlineOAuthTokenMaterial(params.credential)) return null;
	return normalizeExternalCliCredentialProvider(provider.readCredentials({ allowKeychainPrompt: params.allowKeychainPrompt }), params.credential.provider);
}
function normalizeProviderScope(values) {
	if (values === void 0) return;
	const out = /* @__PURE__ */ new Set();
	for (const value of values) {
		const raw = value.trim();
		if (!raw) continue;
		out.add(raw.toLowerCase());
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(raw);
		if (normalized) out.add(normalized);
	}
	return out;
}
function isExternalCliProviderInScope(params) {
	const { providerConfig, options, store } = params;
	const providerScope = normalizeProviderScope(options?.providerIds);
	if (providerScope === void 0 && options?.profileIds === void 0) return Object.entries(store.profiles).some(([profileId, existing]) => {
		return externalCliProfileIdMatches(providerConfig, profileId) && existing?.type === "oauth" && listExternalCliProviderIds(providerConfig).includes(existing.provider);
	});
	if (Array.from(options?.profileIds ?? []).some((profileId) => externalCliProfileIdMatches(providerConfig, profileId.trim(), { allowLegacyNamespace: true }))) return true;
	if (!providerScope || providerScope.size === 0) return false;
	return listExternalCliProviderIds(providerConfig).some((alias) => {
		const raw = alias.trim().toLowerCase();
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(alias);
		return providerScope.has(raw) || (normalized ? providerScope.has(normalized) : false);
	});
}
function listScopedExternalCliProfileIds(params) {
	const { options, providerConfig, store } = params;
	if (providerConfig.bootstrapOnly && hasManagedProviderOAuth(store, providerConfig)) return [];
	const requestedProfileIds = Array.from(options?.profileIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0);
	if (requestedProfileIds.length > 0) return requestedProfileIds.filter((profileId) => externalCliProfileIdMatches(providerConfig, profileId, { allowLegacyNamespace: true }));
	const existingProfileIds = Object.keys(store.profiles).filter((profileId) => externalCliProfileIdMatches(providerConfig, profileId));
	if (existingProfileIds.length > 0) return existingProfileIds;
	return options?.providerIds ? [providerConfig.profileId] : [];
}
function backfillExternalCliIdentity(params) {
	if (params.existingOAuth.email) return null;
	const creds = params.providerConfig.readCredentials({ allowKeychainPrompt: params.allowKeychainPrompt });
	return creds?.email && (creds.refresh === params.existingOAuth.refresh || creds.access === params.existingOAuth.access) ? {
		...params.existingOAuth,
		email: creds.email
	} : null;
}
/** Resolve scoped external CLI auth profiles available to overlay or persist. */
function resolveExternalCliAuthProfiles(store, options) {
	const profiles = [];
	const now = Date.now();
	for (const providerConfig of EXTERNAL_CLI_SYNC_PROVIDERS) {
		if (!isExternalCliProviderInScope({
			providerConfig,
			store,
			options
		})) continue;
		const scopedProfileIds = listScopedExternalCliProfileIds({
			providerConfig,
			store,
			options
		});
		for (const profileId of scopedProfileIds) {
			const existing = store.profiles[profileId];
			const existingOAuth = existing?.type === "oauth" && listExternalCliProviderIds(providerConfig).includes(existing.provider) ? existing : void 0;
			if (existing && !existingOAuth) {
				require_persisted.log.debug("kept explicit local auth over external cli bootstrap", {
					profileId,
					provider: providerConfig.provider,
					localType: existing.type,
					localProvider: existing.provider
				});
				continue;
			}
			if (providerConfig.bootstrapOnly && existingOAuth && hasInlineOAuthTokenMaterial(existingOAuth)) {
				require_persisted.log.debug("kept local oauth over external cli bootstrap-only provider", {
					profileId,
					provider: providerConfig.provider
				});
				continue;
			}
			if (existingOAuth && !providerConfig.bootstrapOnly && require_persisted.hasUsableOAuthCredential(existingOAuth, now)) {
				const backfilled = backfillExternalCliIdentity({
					providerConfig,
					existingOAuth,
					allowKeychainPrompt: options?.allowKeychainPrompt
				});
				if (backfilled) profiles.push({
					profileId,
					credential: backfilled,
					persistence: "persisted"
				});
				continue;
			}
			const creds = normalizeExternalCliCredentialProvider(providerConfig.readCredentials({ allowKeychainPrompt: options?.allowKeychainPrompt }), existingOAuth?.provider ?? providerConfig.provider);
			if (!creds) continue;
			if (existingOAuth && !isSafeToUseExternalCliCredential(existingOAuth, creds)) {
				require_persisted.log.warn("refused external cli oauth bootstrap: identity mismatch", {
					profileId,
					provider: providerConfig.provider
				});
				continue;
			}
			if (existingOAuth && !require_persisted.isSafeToAdoptBootstrapOAuthIdentity(existingOAuth, creds) && !require_persisted.areOAuthCredentialsEquivalent(existingOAuth, creds)) {
				require_persisted.log.warn("refused external cli oauth bootstrap: identity mismatch or missing binding", {
					profileId,
					provider: providerConfig.provider
				});
				continue;
			}
			if (!require_persisted.shouldBootstrapFromExternalCliCredential({
				existing: existingOAuth,
				imported: creds,
				now
			})) {
				if (existingOAuth) require_persisted.log.debug("kept usable local oauth over external cli bootstrap", {
					profileId,
					provider: providerConfig.provider,
					localExpires: existingOAuth.expires,
					externalExpires: creds.expires
				});
				continue;
			}
			require_persisted.log.debug("used external cli oauth bootstrap because local oauth was missing or unusable", {
				profileId,
				provider: providerConfig.provider,
				localExpires: existingOAuth?.expires,
				externalExpires: creds.expires
			});
			profiles.push({
				profileId,
				credential: creds,
				persistence: providerConfig.bootstrapOnly ? "runtime-only" : "persisted"
			});
		}
	}
	return profiles;
}
//#endregion
//#region src/agents/auth-profiles/external-auth.ts
let resolveExternalAuthProfilesForRuntime;
/** Test-only resolver injection for provider external auth profiles. */
const testing = {
	resetResolveExternalAuthProfilesForTest() {
		resolveExternalAuthProfilesForRuntime = void 0;
	},
	setResolveExternalAuthProfilesForTest(resolver) {
		resolveExternalAuthProfilesForRuntime = resolver;
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.externalAuthTestApi")] = testing;
function normalizeExternalAuthProfile(profile) {
	if (!profile?.profileId || !profile.credential) return null;
	return {
		...profile,
		persistence: profile.persistence ?? "runtime-only"
	};
}
function resolveExternalAuthProfileMap(params) {
	const env = params.env ?? process.env;
	const profiles = (resolveExternalAuthProfilesForRuntime ?? require_provider_runtime.resolveExternalAuthProfilesWithPlugins)({
		env,
		config: params.externalCli?.config,
		context: {
			config: params.externalCli?.config,
			agentDir: params.agentDir,
			workspaceDir: void 0,
			env,
			store: params.store
		}
	});
	const resolved = /* @__PURE__ */ new Map();
	const cliProfiles = resolveExternalCliAuthProfiles?.(params.store, {
		allowKeychainPrompt: params.externalCli?.allowKeychainPrompt,
		providerIds: params.externalCli?.externalCliProviderIds,
		profileIds: params.externalCli?.externalCliProfileIds
	}) ?? [];
	for (const profile of cliProfiles) resolved.set(profile.profileId, {
		profileId: profile.profileId,
		credential: profile.credential,
		persistence: profile.persistence ?? "runtime-only"
	});
	for (const rawProfile of profiles) {
		const profile = normalizeExternalAuthProfile(rawProfile);
		if (!profile) continue;
		resolved.set(profile.profileId, profile);
	}
	return resolved;
}
/** List runtime-only and persisted external auth profiles for this store. */
function listRuntimeExternalAuthProfiles(params) {
	return Array.from(resolveExternalAuthProfileMap({
		store: params.store,
		agentDir: params.agentDir,
		env: params.env,
		externalCli: params.externalCli
	}).values());
}
function hasPersistableExternalCliSyncCandidate(store, params) {
	if (params?.externalCliProviderIds || params?.externalCliProfileIds) return true;
	for (const profileId of [require_persisted.CLAUDE_CLI_PROFILE_ID, require_persisted.MINIMAX_CLI_PROFILE_ID]) if (store.profiles[profileId]?.type === "oauth") return true;
	return false;
}
function hasScopedExternalCliOverlay(params) {
	return Boolean(params?.externalCliProviderIds || params?.externalCliProfileIds);
}
/** Overlay external auth profiles onto a cloned auth store for runtime use. */
function overlayExternalAuthProfiles(store, params) {
	return require_persisted.overlayRuntimeExternalOAuthProfiles(store, listRuntimeExternalAuthProfiles({
		store,
		agentDir: params?.agentDir,
		env: params?.env,
		externalCli: params
	}), { runtimeExternalProfileIdsAuthoritative: !hasScopedExternalCliOverlay(params) });
}
/** Persist safe external CLI OAuth profiles that own their local profile slot. */
function syncPersistedExternalCliAuthProfiles(store, params) {
	if (!hasPersistableExternalCliSyncCandidate(store, params)) return store;
	const persistedProfiles = (resolveExternalCliAuthProfiles?.(store, {
		allowKeychainPrompt: params?.allowKeychainPrompt,
		providerIds: params?.externalCliProviderIds,
		profileIds: params?.externalCliProfileIds
	}) ?? []).filter((profile) => profile.persistence === "persisted");
	if (persistedProfiles.length === 0) return store;
	let next;
	for (const profile of persistedProfiles) {
		const existing = (next ?? store).profiles[profile.profileId];
		if (existing?.type === "oauth" && require_persisted.areOAuthCredentialsEquivalent(existing, profile.credential)) continue;
		next ??= require_path_resolve.cloneAuthProfileStore(store);
		next.profiles[profile.profileId] = profile.credential;
	}
	return next ?? store;
}
//#endregion
Object.defineProperty(exports, "listRuntimeExternalAuthProfiles", {
	enumerable: true,
	get: function() {
		return listRuntimeExternalAuthProfiles;
	}
});
Object.defineProperty(exports, "overlayExternalAuthProfiles", {
	enumerable: true,
	get: function() {
		return overlayExternalAuthProfiles;
	}
});
Object.defineProperty(exports, "readClaudeCliCredentialsCached", {
	enumerable: true,
	get: function() {
		return readClaudeCliCredentialsCached;
	}
});
Object.defineProperty(exports, "readCodexCliCredentialsCached", {
	enumerable: true,
	get: function() {
		return readCodexCliCredentialsCached;
	}
});
Object.defineProperty(exports, "readExternalCliBootstrapCredential", {
	enumerable: true,
	get: function() {
		return readExternalCliBootstrapCredential;
	}
});
Object.defineProperty(exports, "readGeminiCliCredentialsCached", {
	enumerable: true,
	get: function() {
		return readGeminiCliCredentialsCached;
	}
});
Object.defineProperty(exports, "resolveExternalCliAuthProfiles", {
	enumerable: true,
	get: function() {
		return resolveExternalCliAuthProfiles;
	}
});
Object.defineProperty(exports, "syncPersistedExternalCliAuthProfiles", {
	enumerable: true,
	get: function() {
		return syncPersistedExternalCliAuthProfiles;
	}
});
