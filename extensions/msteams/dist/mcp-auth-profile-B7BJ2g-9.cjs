const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_readers = require("./string-readers-DjRuUveR.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_agent_bundle_mcp_names = require("./agent-bundle-mcp-names-DiSt2aZy.cjs");
const require_file_lock = require("./file-lock-BhHrzsWW.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_mcp_stdio = require("./mcp-stdio-o-OVj7D4.cjs");
const require_mcp_config_normalize = require("./mcp-config-normalize-BK5qrIxl.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_store$1 = require("./store-BgTrp0qP.cjs");
const require_guarded_body_stream = require("./guarded-body-stream-DhRdFzIG.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
let _modelcontextprotocol_sdk_client_auth_js = require("@modelcontextprotocol/sdk/client/auth.js");
//#region src/agents/bundle-mcp-config.ts
/**
* Merges bundled plugin MCP servers with user-configured MCP servers for agent
* runtimes.
*/
const OPERATOR_TRANSPORT_TO_CLI_BUNDLE_TYPE = {
	"streamable-http": "http",
	http: "http",
	sse: "sse",
	stdio: "stdio"
};
/**
* User config stores Operator MCP transport names, while CLI backends such as
* Claude Code and Gemini expect a downstream `type` field. Keep this adapter
* out of the generic merge path because embedded Operator still consumes the raw
* Operator `transport` shape directly.
*/
function toCliBundleMcpServerConfig(server) {
	const next = { ...server };
	const rawTransport = next.transport;
	delete next.transport;
	if (typeof next.type === "string") return next;
	if (typeof rawTransport === "string") {
		const mapped = OPERATOR_TRANSPORT_TO_CLI_BUNDLE_TYPE[rawTransport];
		if (mapped) next.type = mapped;
	}
	return next;
}
/** Loads enabled bundled MCP servers and overlays user config by server name. */
function loadMergedBundleMcpConfig(params) {
	const bundleMcp = require_loader.loadEnabledBundleMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		manifestRegistry: params.manifestRegistry
	});
	const configuredMcp = require_mcp_config_normalize.normalizeConfiguredMcpServers(params.cfg?.mcp?.servers);
	const disabledConfiguredNames = new Set(Object.entries(configuredMcp).filter(([, server]) => server.enabled === false).map(([name]) => name));
	const enabledConfiguredMcp = Object.fromEntries(Object.entries(configuredMcp).filter(([, server]) => server.enabled !== false));
	const enabledBundleMcp = Object.fromEntries(Object.entries(bundleMcp.config.mcpServers).filter(([name]) => !disabledConfiguredNames.has(name)));
	const mapConfiguredServer = params.mapConfiguredServer ?? ((server) => server);
	return {
		config: { mcpServers: {
			...enabledBundleMcp,
			...Object.fromEntries(Object.entries(enabledConfiguredMcp).map(([name, server]) => [name, mapConfiguredServer(server, name)]))
		} },
		diagnostics: bundleMcp.diagnostics
	};
}
//#endregion
//#region src/agents/mcp-connection-resolver.ts
/**
* Plugin-registered MCP connection resolvers: lookup and per-requester resolve.
* Resolved url/headers are credentials — never log, fingerprint, or persist them.
*/
/** Per-server bound on plugin resolve(); stalled providers must not hang getOrCreate. */
const MCP_CONNECTION_RESOLVER_TIMEOUT_MS = 1e4;
/**
* How long a full-set requester runtime may skip re-resolve while active.
* Revocation/rotation takes effect within this window even for continuously active requesters.
*/
const MCP_CONNECTION_REVALIDATE_MS = 300 * 1e3;
const MCP_CONNECTION_RESOLVER_TEST_STATE_KEY = Symbol.for("operator.mcpServerConnectionResolverTestState");
function getTestState() {
	const globalStore = globalThis;
	const existing = globalStore[MCP_CONNECTION_RESOLVER_TEST_STATE_KEY];
	if (existing) return existing;
	const state = {};
	globalStore[MCP_CONNECTION_RESOLVER_TEST_STATE_KEY] = state;
	return state;
}
function resolveConnectionResolverTimeoutMs() {
	const override = getTestState().resolveTimeoutMs;
	if (typeof override === "number" && Number.isFinite(override) && override > 0) return Math.floor(override);
	return MCP_CONNECTION_RESOLVER_TIMEOUT_MS;
}
function resolveMcpConnectionRevalidateMs() {
	const override = getTestState().revalidateMs;
	if (typeof override === "number" && Number.isFinite(override) && override > 0) return Math.floor(override);
	return MCP_CONNECTION_REVALIDATE_MS;
}
/**
* Ephemeral per-process HMAC key for connection digests. Never exported, logged,
* or persisted — dies with the process so digests are not offline-guessable.
*/
let connectionDigestKey;
function getConnectionDigestKey() {
	connectionDigestKey ??= node_crypto.default.randomBytes(32);
	return connectionDigestKey;
}
/**
* Ephemeral keyed digest of resolved connection material for rotation detection.
* HMAC-SHA256 with a process-local random key — not a plain hash of credentials.
* Never log or persist the preimage (urls/headers) or the key.
*/
function hashMcpResolvedConnections(connections) {
	const tuples = [...connections.entries()].toSorted(([a], [b]) => a.localeCompare(b)).map(([serverName, connection]) => {
		const headers = connection.headers ? Object.entries(connection.headers).toSorted(([a], [b]) => a.localeCompare(b)) : [];
		return [
			serverName,
			connection.url,
			headers
		];
	});
	return node_crypto.default.createHmac("sha256", getConnectionDigestKey()).update(JSON.stringify(tuples)).digest("hex");
}
var McpResolverTimeoutError = class extends Error {
	constructor() {
		super("mcp connection resolver timed out");
		this.name = "McpResolverTimeoutError";
	}
};
function raceWithTimeout(promise, timeoutMs) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new McpResolverTimeoutError());
		}, timeoutMs);
		timer.unref?.();
		promise.then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (error) => {
			clearTimeout(timer);
			reject(error instanceof Error ? error : new Error(String(error)));
		});
	});
}
/** Returns registered connection resolvers keyed by server name (deterministic order). */
function listMcpServerConnectionResolversByServerName() {
	const testOverrides = getTestState().resolversByServerName;
	if (testOverrides) return new Map([...testOverrides.entries()].toSorted(([a], [b]) => a.localeCompare(b)));
	const registry = require_runtime.getActivePluginRegistry();
	const byName = /* @__PURE__ */ new Map();
	for (const entry of registry?.mcpServerConnectionResolvers ?? []) {
		const serverName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.resolver.serverName);
		if (!serverName || typeof entry.resolver.resolve !== "function") continue;
		byName.set(serverName, {
			pluginId: entry.pluginId,
			serverName,
			resolve: entry.resolver.resolve
		});
	}
	return new Map([...byName.entries()].toSorted(([a], [b]) => a.localeCompare(b)));
}
/** Partition loaded MCP servers into static vs requester-scoped by registered resolvers. */
function partitionMcpServersByConnectionScope(mcpServers) {
	const resolvers = listMcpServerConnectionResolversByServerName();
	const staticServers = {};
	const requesterScopedServerNames = [];
	for (const [serverName, rawServer] of Object.entries(mcpServers).toSorted(([a], [b]) => a.localeCompare(b))) {
		if (resolvers.has(serverName)) {
			requesterScopedServerNames.push(serverName);
			continue;
		}
		staticServers[serverName] = rawServer;
	}
	return {
		staticServers,
		requesterScopedServerNames
	};
}
/**
* Debug-proxy capture and log redaction match registered exact values, not
* header names alone. Resolver output is credential material (auth headers,
* signed-URL query tokens), so register it before it can reach any transport.
*/
function registerResolvedConnectionSecrets(connection) {
	for (const value of Object.values(connection.headers ?? {})) {
		require_redact.registerSecretValueForRedaction(value);
		const bareToken = value.trim().split(/\s+/).at(-1);
		if (bareToken && bareToken !== value) require_redact.registerSecretValueForRedaction(bareToken);
	}
	require_redact.registerSecretValueForRedaction(connection.url);
	try {
		const url = new URL(connection.url);
		for (const queryValue of url.searchParams.values()) require_redact.registerSecretValueForRedaction(queryValue);
		if (url.password) require_redact.registerSecretValueForRedaction(url.password);
	} catch {}
}
/**
* Resolve requester-scoped server connections. Fail closed without requesterSenderId:
* returns an empty map (no shared-connection fallback). Per-server resolve errors and
* timeouts are logged generically and omitted so one plugin cannot block static MCP.
* Servers resolve concurrently (each individually bounded).
*/
async function resolveRequesterScopedMcpConnections(params) {
	const requesterSenderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderId);
	const resolved = /* @__PURE__ */ new Map();
	if (!requesterSenderId || params.serverNames.length === 0) return resolved;
	const resolvers = listMcpServerConnectionResolversByServerName();
	const ctx = {
		requesterSenderId,
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) ? { agentAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) ? { messageChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) } : {}
	};
	const timeoutMs = resolveConnectionResolverTimeoutMs();
	const sortedNames = [...params.serverNames].toSorted((a, b) => a.localeCompare(b));
	const settled = await Promise.all(sortedNames.map(async (serverName) => {
		const entry = resolvers.get(serverName);
		if (!entry) return null;
		try {
			const result = await raceWithTimeout(Promise.resolve(entry.resolve(ctx)), timeoutMs);
			if (!result || typeof result.url !== "string" || result.url.trim().length === 0) return null;
			const headers = result.headers && require_mcp_stdio.isMcpConfigRecord(result.headers) ? Object.fromEntries(Object.entries(result.headers).filter((headerEntry) => typeof headerEntry[1] === "string").toSorted(([a], [b]) => a.localeCompare(b))) : void 0;
			const connection = {
				url: result.url.trim(),
				...headers && Object.keys(headers).length > 0 ? { headers } : {}
			};
			registerResolvedConnectionSecrets(connection);
			return {
				serverName,
				connection
			};
		} catch (error) {
			const kind = error instanceof McpResolverTimeoutError ? "resolver timeout" : "resolver error";
			require_logger.logWarn(`bundle-mcp: connection resolver for server "${serverName}" (plugin "${entry.pluginId}") failed with ${kind}`);
			return null;
		}
	}));
	for (const entry of settled) if (entry) resolved.set(entry.serverName, entry.connection);
	return resolved;
}
/**
* Apply resolved connection fields for transport construction only.
* Does not mutate the original static config object.
*/
function applyMcpConnectionOverride(rawServer, override) {
	const base = require_mcp_stdio.isMcpConfigRecord(rawServer) ? { ...rawServer } : {};
	base.url = override.url;
	if (override.headers) base.headers = { ...override.headers };
	else delete base.headers;
	const fromTransport = typeof base.transport === "string" ? require_mcp_config_normalize.resolveOperatorMcpTransportAlias(base.transport) : void 0;
	const fromType = require_mcp_config_normalize.resolveOperatorMcpTransportAlias(base.type);
	base.transport = fromTransport ?? fromType ?? "streamable-http";
	delete base.auth;
	delete base.oauth;
	delete base.type;
	delete base.command;
	delete base.args;
	return base;
}
/**
* Fingerprint shape for requester-scoped servers: identity + filters only.
* Never includes resolved or static url/headers credentials.
*/
function redactMcpServersForFingerprint(mcpServers, requesterScopedServerNames) {
	const redacted = {};
	for (const [serverName, rawServer] of Object.entries(mcpServers).toSorted(([a], [b]) => a.localeCompare(b))) {
		if (!requesterScopedServerNames.has(serverName)) {
			redacted[serverName] = rawServer;
			continue;
		}
		if (!require_mcp_stdio.isMcpConfigRecord(rawServer)) {
			redacted[serverName] = { connection: "requester-scoped" };
			continue;
		}
		const { url: _url, headers: _headers, command: _command, args: _args, env: _env, ...rest } = rawServer;
		redacted[serverName] = {
			...rest,
			connection: "requester-scoped"
		};
	}
	return redacted;
}
function buildMcpRequesterRuntimeCacheKey(params) {
	return JSON.stringify({
		sessionId: params.sessionId,
		messageChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) ?? "",
		agentAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) ?? "",
		requesterSenderId: params.requesterSenderId
	});
}
//#endregion
//#region src/agents/mcp-http-fetch.ts
/**
* MCP HTTP fetch wrappers.
* Adds SSRF protection, scoped TLS/client-cert dispatchers, response cleanup,
* and same-origin header handling around the MCP SDK fetch contract.
*/
/** Default MCP HTTP fetch backed by lazy-loaded undici runtime deps. */
const fetchWithUndici = async (url, init) => await require_undici_global_dispatcher.loadUndiciRuntimeDeps().fetch(url, init);
const fetchWithUndiciGuard = async (input, init) => await fetchWithUndici(input instanceof Request ? input.url : input, init);
const MCP_HTTP_MAX_REDIRECTS = 20;
function resolveFetchRequest(input, init) {
	if (input instanceof Request) {
		const request = new Request(input, init);
		const body = request.body ?? void 0;
		return {
			url: request.url,
			signal: request.signal,
			init: {
				method: request.method,
				headers: request.headers,
				body,
				redirect: request.redirect,
				...body ? { duplex: "half" } : {}
			}
		};
	}
	const { signal, ...requestInit } = init ?? {};
	return {
		url: input instanceof URL ? input.toString() : input,
		signal: signal ?? void 0,
		init: init ? requestInit : void 0
	};
}
async function ensureGlobalFetchResponse(response) {
	const init = {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	};
	if (response.body != null) return new Response(response.body, init);
	if (response.status === 204 || response.status === 205 || response.status === 304) return new Response(null, init);
	return new Response(null, init);
}
async function buildManagedMcpResponse(response, release, refreshTimeout) {
	if (!response.body) {
		release();
		return await ensureGlobalFetchResponse(response);
	}
	const wrappedBody = require_guarded_body_stream.wrapGuardedBodyStream({
		body: response.body,
		cleanup: release,
		refreshTimeout
	});
	return await ensureGlobalFetchResponse(new Response(wrappedBody, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	}));
}
/** Builds an MCP fetch function with optional TLS/client-cert dispatcher support. */
function buildMcpHttpFetch(params) {
	const needsCustomDispatcher = params.sslVerify === false || Boolean(params.clientCert || params.clientKey);
	const scopedOrigin = params.resourceUrl ? new URL(params.resourceUrl).origin : void 0;
	const policy = params.resourceUrl ? require_fetch_guard.ssrfPolicyFromHttpBaseUrlAllowedOrigin(params.resourceUrl) : void 0;
	let customConnect;
	const resolveCustomDispatcherPolicy = (url) => {
		if (!needsCustomDispatcher || !scopedOrigin || url.origin !== scopedOrigin) return;
		customConnect ??= {
			...params.sslVerify === false ? { rejectUnauthorized: false } : {},
			...params.clientCert ? { cert: node_fs.default.readFileSync(params.clientCert, "utf-8") } : {},
			...params.clientKey ? { key: node_fs.default.readFileSync(params.clientKey, "utf-8") } : {}
		};
		return {
			mode: "direct",
			connect: customConnect
		};
	};
	return async (url, init) => {
		const request = resolveFetchRequest(url, init);
		const guarded = await require_fetch_guard.fetchWithSsrFGuard({
			url: request.url,
			init: request.init,
			fetchImpl: fetchWithUndiciGuard,
			maxRedirects: MCP_HTTP_MAX_REDIRECTS,
			allowCrossOriginUnsafeRedirectReplay: true,
			auditContext: "mcp-http",
			useEnvProxyForEligibleUrls: true,
			...request.signal ? { signal: request.signal } : {},
			...params.timeoutMs !== void 0 ? { timeoutMs: params.timeoutMs } : {},
			...policy ? { policy } : {},
			...needsCustomDispatcher ? { resolveDispatcherPolicy: resolveCustomDispatcherPolicy } : {}
		});
		return await buildManagedMcpResponse(guarded.response, guarded.release, guarded.refreshTimeout);
	};
}
/** Removes Authorization from MCP headers before forwarding to non-authorized paths. */
function withoutMcpAuthorizationHeader(headers) {
	if (!headers) return;
	const entries = Object.entries(headers).filter(([key]) => key.toLowerCase() !== "authorization");
	return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
/** Wraps MCP fetch so configured headers are applied only to the resource origin. */
function withSameOriginMcpHttpHeaders(params) {
	if (!params.headers || Object.keys(params.headers).length === 0) return params.fetchFn;
	const resourceOrigin = new URL(params.resourceUrl).origin;
	return (url, init) => {
		if (new URL(url).origin !== resourceOrigin) return params.fetchFn(url, init);
		const headers = new Headers(params.headers);
		for (const [key, value] of new Headers(init?.headers)) headers.set(key, value);
		return params.fetchFn(url, {
			...init,
			headers
		});
	};
}
//#endregion
//#region src/agents/mcp-oauth.ts
/**
* MCP OAuth credential store and login helpers. Credentials are stored in the
* private Operator state directory with one hashed file per MCP server URL.
*/
const LEGACY_DEFAULT_REDIRECT_URL = "http://127.0.0.1:8989/oauth/callback";
const TOKEN_EXPIRY_SKEW_MS = 3e4;
const MCP_OAUTH_LOCK_OPTIONS = {
	retries: {
		retries: 20,
		factor: 1.3,
		minTimeout: 25,
		maxTimeout: 500,
		randomize: true
	},
	stale: 6e4,
	staleRecovery: "fail-closed"
};
const MCP_OAUTH_STORE_QUEUES = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.mcp-oauth.store-writer-queues"), () => /* @__PURE__ */ new Map());
function resolveTokenExpiresAt(tokens) {
	const expiresIn = tokens.expires_in;
	return typeof expiresIn === "number" && Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1e3 : void 0;
}
function oauthStorePath(serverName, serverUrl) {
	const safeServerName = require_agent_bundle_mcp_names.sanitizeServerName(serverName, /* @__PURE__ */ new Set());
	const key = (0, node_crypto.createHash)("sha256").update(serverName).update("\0").update(serverUrl).digest("hex");
	return node_path.default.join(require_paths.resolveStateDir(), "mcp-oauth", `${safeServerName}-${key.slice(0, 16)}.json`);
}
async function readStore(filePath) {
	try {
		return JSON.parse(await node_fs_promises.default.readFile(filePath, "utf-8"));
	} catch {
		return {};
	}
}
function readStoreSync(filePath) {
	try {
		return JSON.parse(node_fs.default.readFileSync(filePath, "utf-8"));
	} catch {
		return {};
	}
}
async function writeStore(filePath, store) {
	await node_fs_promises.default.mkdir(node_path.default.dirname(filePath), {
		recursive: true,
		mode: 448
	});
	await node_fs_promises.default.writeFile(filePath, JSON.stringify(store, null, 2), {
		encoding: "utf-8",
		mode: 384
	});
	await node_fs_promises.default.chmod(filePath, 384).catch(() => {});
}
async function withMcpOAuthStoreLock(filePath, fn) {
	return await require_store.runQueuedStoreWrite({
		queues: MCP_OAUTH_STORE_QUEUES,
		storePath: filePath,
		label: "withMcpOAuthStoreLock",
		fn: async () => {
			await node_fs_promises.default.mkdir(node_path.default.dirname(filePath), {
				recursive: true,
				mode: 448
			});
			return await require_file_lock.withFileLock(filePath, MCP_OAUTH_LOCK_OPTIONS, fn);
		}
	});
}
function resolveOAuthRedirectUrl(config, store = {}) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(config.redirectUrl) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(store.redirectUrl) ?? LEGACY_DEFAULT_REDIRECT_URL;
}
function buildOAuthClientMetadata(config, store = {}) {
	return {
		client_name: "Operator MCP",
		redirect_uris: [resolveOAuthRedirectUrl(config, store)],
		grant_types: ["authorization_code", "refresh_token"],
		response_types: ["code"],
		token_endpoint_auth_method: "none",
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(config.scope) ? { scope: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(config.scope) } : {}
	};
}
/** Creates the MCP SDK OAuth provider backed by Operator's private store. */
function createMcpOAuthClientProvider(params) {
	const config = params.config ?? {};
	const filePath = oauthStorePath(params.serverName, params.serverUrl);
	const allowAuthorizationRedirect = params.allowAuthorizationRedirect ?? Boolean(params.onAuthorizationUrl);
	const assertAuthorizationRedirectAllowed = () => {
		if (!allowAuthorizationRedirect) throw new Error(`MCP server "${params.serverName}" requires OAuth authorization. Run openclaw mcp login ${params.serverName}.`);
	};
	return {
		get redirectUrl() {
			return resolveOAuthRedirectUrl(config, readStoreSync(filePath));
		},
		clientMetadataUrl: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(config.clientMetadataUrl),
		get clientMetadata() {
			return buildOAuthClientMetadata(config, readStoreSync(filePath));
		},
		async state() {
			assertAuthorizationRedirectAllowed();
			const store = await readStore(filePath);
			const state = (0, node_crypto.randomUUID)();
			await writeStore(filePath, {
				...store,
				state
			});
			return state;
		},
		async clientInformation() {
			return (await readStore(filePath)).clientInformation;
		},
		async saveClientInformation(clientInformation) {
			const store = await readStore(filePath);
			await writeStore(filePath, {
				...store,
				clientInformation
			});
		},
		async tokens() {
			return (await readStore(filePath)).tokens;
		},
		async saveTokens(tokens) {
			const store = await readStore(filePath);
			const tokenExpiresAt = resolveTokenExpiresAt(tokens);
			const nextStore = {
				...store,
				tokens
			};
			if (tokenExpiresAt === void 0) delete nextStore.tokenExpiresAt;
			else nextStore.tokenExpiresAt = tokenExpiresAt;
			await writeStore(filePath, nextStore);
		},
		async redirectToAuthorization(authorizationUrl) {
			assertAuthorizationRedirectAllowed();
			const store = await readStore(filePath);
			await writeStore(filePath, {
				...store,
				lastAuthorizationUrl: authorizationUrl.toString()
			});
			await params.onAuthorizationUrl?.(authorizationUrl);
		},
		async saveCodeVerifier(codeVerifier) {
			assertAuthorizationRedirectAllowed();
			const store = await readStore(filePath);
			await writeStore(filePath, {
				...store,
				codeVerifier
			});
		},
		async codeVerifier() {
			const codeVerifier = (await readStore(filePath)).codeVerifier;
			if (!codeVerifier) throw new Error("Missing MCP OAuth code verifier. Run the login flow again.");
			return codeVerifier;
		},
		async invalidateCredentials(scope) {
			const next = { ...await readStore(filePath) };
			if (scope === "all" || scope === "client") delete next.clientInformation;
			if (scope === "all" || scope === "tokens") delete next.tokens;
			if (scope === "all" || scope === "verifier") delete next.codeVerifier;
			if (scope === "all" || scope === "discovery") delete next.discoveryState;
			await writeStore(filePath, next);
		},
		async saveDiscoveryState(discoveryState) {
			const store = await readStore(filePath);
			await writeStore(filePath, {
				...store,
				discoveryState
			});
		},
		async discoveryState() {
			return (await readStore(filePath)).discoveryState;
		}
	};
}
/** Returns a current MCP-native OAuth access token for external runtime projection. */
async function resolveMcpOAuthAccessToken(params) {
	const filePath = oauthStorePath(params.serverName, params.serverUrl);
	return await withMcpOAuthStoreLock(filePath, async () => {
		return await resolveMcpOAuthAccessTokenLocked(params, filePath);
	});
}
async function resolveMcpOAuthAccessTokenLocked(params, filePath) {
	const store = await readStore(filePath);
	const tokens = store.tokens;
	if (!tokens?.access_token) throw new Error(`MCP server "${params.serverName}" requires OAuth authorization. Run openclaw mcp login ${params.serverName}.`);
	if (store.tokenExpiresAt !== void 0 && store.tokenExpiresAt > Date.now() + TOKEN_EXPIRY_SKEW_MS || store.tokenExpiresAt === void 0 && !tokens.refresh_token) return tokens.access_token;
	if (!tokens.refresh_token) throw new Error(`MCP server "${params.serverName}" has expired OAuth credentials. Run openclaw mcp login ${params.serverName}.`);
	const provider = createMcpOAuthClientProvider(params);
	const result = await (0, _modelcontextprotocol_sdk_client_auth_js.auth)(provider, {
		serverUrl: params.serverUrl,
		scope: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.config?.scope),
		fetchFn: params.fetchFn
	});
	const refreshedTokens = await provider.tokens();
	if (result !== "AUTHORIZED" || !refreshedTokens?.access_token) throw new Error(`MCP server "${params.serverName}" could not refresh OAuth credentials. Run openclaw mcp login ${params.serverName}.`);
	return refreshedTokens.access_token;
}
//#endregion
//#region src/agents/mcp-http.ts
/**
* HTTP MCP launch config normalization.
*
* MCP server setup uses this to validate SSE/streamable HTTP server records,
* sanitize headers, and redact sensitive URLs in diagnostics.
*/
/** Normalizes an HTTP MCP server config record into a launchable transport config. */
function resolveHttpMcpServerLaunchConfig(raw, options) {
	if (!require_mcp_stdio.isMcpConfigRecord(raw)) return {
		ok: false,
		reason: "server config must be an object"
	};
	if (typeof raw.url !== "string" || raw.url.trim().length === 0) return {
		ok: false,
		reason: "its url is missing"
	};
	const url = raw.url.trim();
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return {
			ok: false,
			reason: `its url is not a valid URL: ${(0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(url)}`
		};
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return {
		ok: false,
		reason: `only http and https URLs are supported, got ${parsed.protocol}`
	};
	let headers;
	if (raw.headers !== void 0 && raw.headers !== null) if (!require_mcp_stdio.isMcpConfigRecord(raw.headers)) options?.onMalformedHeaders?.(raw.headers);
	else headers = require_mcp_stdio.toMcpStringRecord(raw.headers, { onDroppedEntry: options?.onDroppedHeader });
	return {
		ok: true,
		config: {
			transportType: options?.transportType ?? "sse",
			url,
			headers
		}
	};
}
/** Describes an HTTP MCP server launch config without leaking URL credentials. */
function describeHttpMcpServerLaunchConfig(config) {
	return (0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrl)(config.url);
}
//#endregion
//#region src/agents/mcp-transport-config.ts
/**
* Resolves MCP transport command, environment, and timeout configuration.
*/
const DEFAULT_CONNECTION_TIMEOUT_MS = 3e4;
const DEFAULT_REQUEST_TIMEOUT_MS = 6e4;
function getPositiveNumber(rawServer, keys) {
	if (!rawServer || typeof rawServer !== "object") return;
	const record = rawServer;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
	}
}
function getConnectionTimeoutMs(rawServer) {
	const milliseconds = getPositiveNumber(rawServer, ["connectionTimeoutMs"]);
	if (milliseconds) return Math.floor(milliseconds);
	const seconds = getPositiveNumber(rawServer, ["connectTimeout", "connect_timeout"]);
	if (seconds) return Math.floor(seconds * 1e3);
	return DEFAULT_CONNECTION_TIMEOUT_MS;
}
function getRequestTimeoutMs(rawServer) {
	const milliseconds = getPositiveNumber(rawServer, ["requestTimeoutMs"]);
	if (milliseconds) return Math.floor(milliseconds);
	const seconds = getPositiveNumber(rawServer, ["timeout"]);
	if (seconds) return Math.floor(seconds * 1e3);
	return DEFAULT_REQUEST_TIMEOUT_MS;
}
function getBooleanField(rawServer, keys) {
	if (!rawServer || typeof rawServer !== "object") return;
	const record = rawServer;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "boolean") return value;
	}
}
function getStringField(rawServer, keys) {
	if (!rawServer || typeof rawServer !== "object") return;
	return require_string_readers.readTrimmedStringAlias(rawServer, keys);
}
function getRequestedTransport(rawServer) {
	if (!rawServer || typeof rawServer !== "object" || typeof rawServer.transport !== "string") return "";
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawServer.transport);
}
function getRequestedTransportAlias(rawServer) {
	if (!rawServer || typeof rawServer !== "object" || typeof rawServer.type !== "string") return "";
	return require_mcp_config_normalize.resolveOperatorMcpTransportAlias(rawServer.type) ?? "";
}
function resolveHttpTransportConfig(serverName, rawServer, transportType) {
	const launch = resolveHttpMcpServerLaunchConfig(rawServer, {
		transportType,
		onDroppedHeader: (key) => {
			require_logger.logWarn(`bundle-mcp: server "${serverName}": header "${key}" has an unsupported value type and was ignored.`);
		},
		onMalformedHeaders: () => {
			require_logger.logWarn(`bundle-mcp: server "${serverName}": "headers" must be a JSON object; the value was ignored.`);
		}
	});
	if (!launch.ok) return null;
	return {
		kind: "http",
		transportType: launch.config.transportType,
		url: launch.config.url,
		headers: launch.config.headers,
		...rawServer && typeof rawServer === "object" && rawServer.auth === "oauth" ? { auth: "oauth" } : {},
		...rawServer && typeof rawServer === "object" && rawServer.oauth && typeof rawServer.oauth === "object" && !Array.isArray(rawServer.oauth) ? { oauth: rawServer.oauth } : {},
		...getBooleanField(rawServer, ["sslVerify", "ssl_verify"]) !== void 0 ? { sslVerify: getBooleanField(rawServer, ["sslVerify", "ssl_verify"]) } : {},
		...getStringField(rawServer, ["clientCert", "client_cert"]) ? { clientCert: getStringField(rawServer, ["clientCert", "client_cert"]) } : {},
		...getStringField(rawServer, ["clientKey", "client_key"]) ? { clientKey: getStringField(rawServer, ["clientKey", "client_key"]) } : {},
		description: describeHttpMcpServerLaunchConfig(launch.config),
		connectionTimeoutMs: getConnectionTimeoutMs(rawServer),
		requestTimeoutMs: getRequestTimeoutMs(rawServer),
		supportsParallelToolCalls: getBooleanField(rawServer, ["supportsParallelToolCalls", "supports_parallel_tool_calls"]) ?? false
	};
}
/** Resolve one MCP server's launch transport config, or null when unsupported. */
function resolveMcpTransportConfig(serverName, rawServer) {
	const logServerName = require_ansi.sanitizeForLog(serverName);
	const requestedTransport = getRequestedTransport(rawServer);
	const requestedTransportAlias = requestedTransport ? "" : getRequestedTransportAlias(rawServer);
	const effectiveTransport = requestedTransport || requestedTransportAlias;
	const stdioLaunch = require_mcp_stdio.resolveStdioMcpServerLaunchConfig(rawServer, { onDroppedEnv: (key) => {
		require_logger.logWarn(`bundle-mcp: server "${logServerName}": env "${require_ansi.sanitizeForLog(key)}" is blocked for stdio startup safety and was ignored.`);
	} });
	if (stdioLaunch.ok) return {
		kind: "stdio",
		transportType: "stdio",
		command: stdioLaunch.config.command,
		args: stdioLaunch.config.args,
		env: stdioLaunch.config.env,
		cwd: stdioLaunch.config.cwd,
		description: require_mcp_stdio.describeStdioMcpServerLaunchConfig(stdioLaunch.config),
		connectionTimeoutMs: getConnectionTimeoutMs(rawServer),
		requestTimeoutMs: getRequestTimeoutMs(rawServer),
		supportsParallelToolCalls: getBooleanField(rawServer, ["supportsParallelToolCalls", "supports_parallel_tool_calls"]) ?? false
	};
	if (effectiveTransport && effectiveTransport !== "sse" && effectiveTransport !== "streamable-http") {
		require_logger.logWarn(`bundle-mcp: skipped server "${logServerName}" because transport "${require_ansi.sanitizeForLog(effectiveTransport)}" is not supported.`);
		return null;
	}
	if (effectiveTransport === "streamable-http") {
		const httpTransport = resolveHttpTransportConfig(serverName, rawServer, "streamable-http");
		if (httpTransport) return httpTransport;
	}
	const sseTransport = resolveHttpTransportConfig(serverName, rawServer, "sse");
	if (sseTransport) return sseTransport;
	const httpLaunch = resolveHttpMcpServerLaunchConfig(rawServer);
	const httpReason = httpLaunch.ok ? "not an HTTP MCP server" : httpLaunch.reason;
	require_logger.logWarn(`bundle-mcp: skipped server "${logServerName}" because ${stdioLaunch.reason} and ${httpReason}.`);
	return null;
}
//#endregion
//#region src/agents/mcp-auth-profile.ts
/**
* Auth-profile backed bearer injection for remote MCP servers.
*/
function isRecord(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function normalizeStringHeaders(value) {
	if (!isRecord(value)) return;
	const entries = Object.entries(value).filter((entry) => typeof entry[1] === "string");
	return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
/** Returns the refresh-capable auth profile selected for one MCP server. */
function resolveMcpAuthProfileId(rawServer) {
	if (!isRecord(rawServer) || rawServer.auth !== "oauth" || !isRecord(rawServer.oauth)) return;
	const authProfileId = rawServer.oauth.authProfileId;
	return typeof authProfileId === "string" && authProfileId.trim().length > 0 ? authProfileId.trim() : void 0;
}
/** Returns whether a server needs an Operator-managed bearer projected externally. */
function requiresMcpBearerProjection(rawServer) {
	if (!isRecord(rawServer) || rawServer.auth !== "oauth") return false;
	return Boolean(resolveMcpAuthProfileId(rawServer) || typeof rawServer.url === "string");
}
async function resolveMcpAuthProfileBearerToken(params) {
	const store = require_store$1.loadAuthProfileStoreForSecretsRuntime(params.agentDir, {
		config: params.cfg,
		externalCliProfileIds: [params.profileId]
	});
	const credential = store.profiles[params.profileId];
	if (!credential) throw new Error(`MCP server "${params.serverName}" references auth profile "${params.profileId}", but that profile was not found.`);
	if (credential.type !== "oauth") throw new Error(`MCP server "${params.serverName}" references auth profile "${params.profileId}", but ${credential.type} profiles are not refreshable. Use a refresh-capable OAuth profile.`);
	const resolved = await require_oauth.resolveApiKeyForProfile({
		cfg: params.cfg,
		store,
		profileId: params.profileId,
		agentDir: params.agentDir
	});
	if (resolved?.profileType !== "oauth" || !resolved.apiKey) throw new Error(`MCP server "${params.serverName}" could not resolve refreshable OAuth auth profile "${params.profileId}". Re-authenticate the profile and retry.`);
	if (resolved.credential?.type !== "oauth" || typeof resolved.credential.access !== "string" || resolved.credential.access.trim().length === 0) throw new Error(`MCP server "${params.serverName}" resolved OAuth auth profile "${params.profileId}", but no raw access token was available for bearer projection.`);
	return resolved.credential.access;
}
async function resolveMcpBearerToken(params) {
	const authProfileId = resolveMcpAuthProfileId(params.server);
	if (authProfileId) return await resolveMcpAuthProfileBearerToken({
		serverName: params.serverName,
		profileId: authProfileId,
		cfg: params.cfg,
		agentDir: params.agentDir
	});
	if (params.server.auth !== "oauth") return;
	const resolved = resolveMcpTransportConfig(params.serverName, params.server);
	if (resolved?.kind !== "http") return;
	const fetchFn = withSameOriginMcpHttpHeaders({
		fetchFn: buildMcpHttpFetch({
			sslVerify: resolved.sslVerify,
			clientCert: resolved.clientCert,
			clientKey: resolved.clientKey,
			resourceUrl: resolved.url,
			timeoutMs: resolved.requestTimeoutMs
		}),
		headers: withoutMcpAuthorizationHeader(resolved.headers),
		resourceUrl: resolved.url
	});
	return await resolveMcpOAuthAccessToken({
		serverName: params.serverName,
		serverUrl: resolved.url,
		config: resolved.oauth,
		fetchFn
	});
}
/** Wraps HTTP MCP fetch with same-origin, refreshed bearer injection. */
function withMcpAuthProfileBearer(params) {
	const resourceOrigin = new URL(params.resourceUrl).origin;
	const configuredHeaders = withoutMcpAuthorizationHeader(params.headers);
	return async (url, init) => {
		if (new URL(url).origin !== resourceOrigin) return params.fetchFn(url, init);
		const headers = new Headers(configuredHeaders);
		for (const [key, value] of new Headers(init?.headers)) if (key.toLowerCase() !== "authorization") headers.set(key, value);
		const token = await resolveMcpAuthProfileBearerToken({
			serverName: params.serverName,
			profileId: params.authProfileId,
			cfg: params.cfg,
			agentDir: params.agentDir
		});
		headers.set("authorization", `Bearer ${token}`);
		return params.fetchFn(url, {
			...init,
			headers
		});
	};
}
function buildTokenEnvVarName(serverName) {
	return `OPERATOR_MCP_AUTH_${node_crypto.default.createHash("sha256").update(serverName).digest("hex").slice(0, 12).toUpperCase()}_TOKEN`;
}
function stripOperatorOnlyOAuthConfig(server) {
	const next = { ...server };
	delete next.auth;
	delete next.oauth;
	return next;
}
/** Resolves OAuth-backed MCP servers into bearer headers for external runtimes. */
async function resolveMcpBearerBundleConfig(params) {
	let nextServers;
	let nextEnv = params.env;
	const tokenProjection = params.tokenProjection ?? "env";
	for (const [serverName, server] of Object.entries(params.config.mcpServers)) {
		let token;
		try {
			token = await resolveMcpBearerToken({
				serverName,
				server,
				cfg: params.cfg,
				agentDir: params.agentDir
			});
		} catch (error) {
			if (!params.omitUnavailableOAuthServers || !requiresMcpBearerProjection(server)) throw error;
			nextServers ??= { ...params.config.mcpServers };
			delete nextServers[serverName];
			params.onServerUnavailable?.(serverName, error);
			continue;
		}
		if (!token) continue;
		let authorization;
		if (tokenProjection === "literal") authorization = `Bearer ${token}`;
		else {
			const envVar = buildTokenEnvVarName(serverName);
			if (!nextEnv || nextEnv === params.env) nextEnv = { ...params.env };
			nextEnv[envVar] = token;
			authorization = `Bearer \${${envVar}}`;
		}
		const headers = withoutMcpAuthorizationHeader(normalizeStringHeaders(server.headers));
		nextServers ??= { ...params.config.mcpServers };
		nextServers[serverName] = stripOperatorOnlyOAuthConfig({
			...server,
			headers: {
				...headers,
				Authorization: authorization
			}
		});
	}
	return {
		config: nextServers ? { mcpServers: nextServers } : params.config,
		env: nextEnv
	};
}
//#endregion
Object.defineProperty(exports, "applyMcpConnectionOverride", {
	enumerable: true,
	get: function() {
		return applyMcpConnectionOverride;
	}
});
Object.defineProperty(exports, "buildMcpHttpFetch", {
	enumerable: true,
	get: function() {
		return buildMcpHttpFetch;
	}
});
Object.defineProperty(exports, "buildMcpRequesterRuntimeCacheKey", {
	enumerable: true,
	get: function() {
		return buildMcpRequesterRuntimeCacheKey;
	}
});
Object.defineProperty(exports, "createMcpOAuthClientProvider", {
	enumerable: true,
	get: function() {
		return createMcpOAuthClientProvider;
	}
});
Object.defineProperty(exports, "hashMcpResolvedConnections", {
	enumerable: true,
	get: function() {
		return hashMcpResolvedConnections;
	}
});
Object.defineProperty(exports, "loadMergedBundleMcpConfig", {
	enumerable: true,
	get: function() {
		return loadMergedBundleMcpConfig;
	}
});
Object.defineProperty(exports, "partitionMcpServersByConnectionScope", {
	enumerable: true,
	get: function() {
		return partitionMcpServersByConnectionScope;
	}
});
Object.defineProperty(exports, "redactMcpServersForFingerprint", {
	enumerable: true,
	get: function() {
		return redactMcpServersForFingerprint;
	}
});
Object.defineProperty(exports, "resolveMcpAuthProfileId", {
	enumerable: true,
	get: function() {
		return resolveMcpAuthProfileId;
	}
});
Object.defineProperty(exports, "resolveMcpBearerBundleConfig", {
	enumerable: true,
	get: function() {
		return resolveMcpBearerBundleConfig;
	}
});
Object.defineProperty(exports, "resolveMcpConnectionRevalidateMs", {
	enumerable: true,
	get: function() {
		return resolveMcpConnectionRevalidateMs;
	}
});
Object.defineProperty(exports, "resolveMcpTransportConfig", {
	enumerable: true,
	get: function() {
		return resolveMcpTransportConfig;
	}
});
Object.defineProperty(exports, "resolveRequesterScopedMcpConnections", {
	enumerable: true,
	get: function() {
		return resolveRequesterScopedMcpConnections;
	}
});
Object.defineProperty(exports, "toCliBundleMcpServerConfig", {
	enumerable: true,
	get: function() {
		return toCliBundleMcpServerConfig;
	}
});
Object.defineProperty(exports, "withMcpAuthProfileBearer", {
	enumerable: true,
	get: function() {
		return withMcpAuthProfileBearer;
	}
});
Object.defineProperty(exports, "withSameOriginMcpHttpHeaders", {
	enumerable: true,
	get: function() {
		return withSameOriginMcpHttpHeaders;
	}
});
Object.defineProperty(exports, "withoutMcpAuthorizationHeader", {
	enumerable: true,
	get: function() {
		return withoutMcpAuthorizationHeader;
	}
});
