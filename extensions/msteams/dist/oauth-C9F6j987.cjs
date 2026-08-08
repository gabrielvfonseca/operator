const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
require("./errors-BqS4bzom.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
const require_facade_runtime = require("./facade-runtime-BM8A5__s.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/plugin-sdk/provider-oauth-runtime.ts
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" aria-hidden="true"><defs><linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff4d4d"/><stop offset="100%" stop-color="#991b1b"/></linearGradient></defs><path fill="url(#lobster-gradient)" d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z"/><path fill="url(#lobster-gradient)" d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z"/><path fill="url(#lobster-gradient)" d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"/><path stroke="#ff4d4d" stroke-width="3" stroke-linecap="round" d="M45 15 Q35 5 30 8"/><path stroke="#ff4d4d" stroke-width="3" stroke-linecap="round" d="M75 15 Q85 5 90 8"/><circle cx="45" cy="35" r="6" fill="#050810"/><circle cx="75" cy="35" r="6" fill="#050810"/><circle cx="46" cy="34" r="2.5" fill="#00e5cc"/><circle cx="76" cy="34" r="2.5" fill="#00e5cc"/></svg>`;
function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
}
function renderOAuthPage(options) {
	const title = escapeHtml(options.title);
	const heading = escapeHtml(options.heading);
	const message = escapeHtml(options.message);
	const details = options.details ? escapeHtml(options.details) : void 0;
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      --text: #fafafa;
      --text-dim: #a1a1aa;
      --page-bg: #09090b;
      --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    * { box-sizing: border-box; }
    html { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: var(--page-bg);
      color: var(--text);
      font-family: var(--font-sans);
      text-align: center;
    }
    main {
      width: 100%;
      max-width: 560px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .logo {
      width: 72px;
      height: 72px;
      display: block;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 28px;
      line-height: 1.15;
      font-weight: 650;
      color: var(--text);
    }
    p {
      margin: 0;
      line-height: 1.7;
      color: var(--text-dim);
      font-size: 15px;
    }
    .details {
      margin-top: 16px;
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text-dim);
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <main>
    <div class="logo">${LOGO_SVG}</div>
    <h1>${heading}</h1>
    <p>${message}</p>
    ${details ? `<div class="details">${details}</div>` : ""}
  </main>
</body>
</html>`;
}
/**
* Renders the local OAuth callback success page after provider authentication completes.
*/
function oauthSuccessHtml(message) {
	return renderOAuthPage({
		title: "Authentication successful",
		heading: "Authentication successful",
		message
	});
}
/**
* Renders the local OAuth callback error page without exposing raw credential material.
*/
function oauthErrorHtml(message, details) {
	return renderOAuthPage({
		title: "Authentication failed",
		heading: "Authentication failed",
		message,
		details
	});
}
function base64urlEncode(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/[=]/g, "");
}
/** Generates an OAuth PKCE verifier and SHA-256 challenge using base64url encoding. */
async function generatePKCE() {
	const verifierBytes = /* @__PURE__ */ new Uint8Array(32);
	crypto.getRandomValues(verifierBytes);
	const verifier = base64urlEncode(verifierBytes);
	const data = new TextEncoder().encode(verifier);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return {
		verifier,
		challenge: base64urlEncode(new Uint8Array(hashBuffer))
	};
}
/** Generates a random base64url OAuth state value for CSRF protection. */
function generateOAuthState() {
	const stateBytes = /* @__PURE__ */ new Uint8Array(32);
	crypto.getRandomValues(stateBytes);
	return base64urlEncode(stateBytes);
}
/**
* Parses callback URLs, raw query strings, `code#state`, or plain pasted codes.
* Empty input returns an empty object so callers can keep prompting.
*/
function parseOAuthAuthorizationInput(input) {
	const value = input.trim();
	if (!value) return {};
	try {
		const url = new URL(value);
		return {
			code: url.searchParams.get("code") ?? void 0,
			state: url.searchParams.get("state") ?? void 0
		};
	} catch {}
	if (value.includes("#")) {
		const [code, state] = value.split("#", 2);
		return {
			code,
			state
		};
	}
	if (value.includes("code=")) {
		const params = new URLSearchParams(value);
		return {
			code: params.get("code") ?? void 0,
			state: params.get("state") ?? void 0
		};
	}
	return { code: value };
}
/** Converts provider `expires_in` seconds into safe positive milliseconds. */
function resolveOAuthTokenLifetimeMs(value) {
	return require_parse_finite_number.positiveSecondsToSafeMilliseconds(value);
}
/** Resolves provider token lifetime into an absolute expiry timestamp with optional refresh skew. */
function resolveOAuthTokenExpiresAt(value, options = {}) {
	const lifetimeMs = resolveOAuthTokenLifetimeMs(value);
	return lifetimeMs === void 0 ? void 0 : require_parse_finite_number.resolveExpiresAtMsFromDurationMs(lifetimeMs, {
		nowMs: options.nowMs,
		bufferMs: options.refreshSkewMs
	});
}
/**
* Creates the shared cancellation error used by abortable OAuth login flows.
*/
function createOAuthLoginCancelledError() {
	return /* @__PURE__ */ new Error("Login cancelled");
}
/** Throws the shared OAuth cancellation error when a login signal is already aborted. */
function throwIfOAuthLoginAborted(signal) {
	if (signal?.aborted) throw createOAuthLoginCancelledError();
}
/** Races a pending OAuth login step against the login abort signal and normalizes rejections. */
function withOAuthLoginAbort(promise, signal, onAbort) {
	if (!signal) return promise;
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			signal.removeEventListener("abort", abort);
		};
		const abort = () => {
			cleanup();
			onAbort?.();
			reject(createOAuthLoginCancelledError());
		};
		if (signal.aborted) {
			abort();
			return;
		}
		signal.addEventListener("abort", abort, { once: true });
		promise.then((value) => {
			cleanup();
			resolve(value);
		}, (error) => {
			cleanup();
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Non-Error rejection"));
		});
	});
}
/** Combines a caller abort signal with a bounded timeout signal for OAuth HTTP requests. */
function buildOAuthRequestSignal(options) {
	const timeoutSignal = AbortSignal.timeout(require_parse_finite_number.resolveTimerTimeoutMs(options.timeoutMs, 0, 0));
	if (!options.signal) return timeoutSignal;
	return AbortSignal.any([options.signal, timeoutSignal]);
}
//#endregion
//#region src/llm/utils/oauth/anthropic.ts
let nodeApis = null;
let nodeApisPromise = null;
const CLIENT_ID$1 = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
const DEFAULT_CALLBACK_HOST = "127.0.0.1";
const LOOPBACK_CALLBACK_HOSTS = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"::1"
]);
const CALLBACK_PORT = 53692;
const CALLBACK_PATH = "/callback";
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;
function resolveCallbackHost(env = process.env) {
	const host = env.OPERATOR_OAUTH_CALLBACK_HOST?.trim() || DEFAULT_CALLBACK_HOST;
	if (!LOOPBACK_CALLBACK_HOSTS.has(host)) throw new Error("Anthropic OAuth callback host must be localhost, 127.0.0.1, or ::1");
	return host;
}
const SCOPES = "org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload";
/** Max response body bytes for Anthropic OAuth token endpoint (16 MiB). */
const OAUTH_RESPONSE_MAX_BYTES = 16 * 1024 * 1024;
async function getNodeApis() {
	if (nodeApis) return nodeApis;
	if (!nodeApisPromise) {
		if (typeof process === "undefined" || !process.versions?.node && !process.versions?.bun) throw new Error("Anthropic OAuth is only available in Node.js environments");
		nodeApisPromise = import("node:http").then((httpModule) => ({ createServer: httpModule.createServer }));
	}
	nodeApis = await nodeApisPromise;
	return nodeApis;
}
function formatErrorDetails(error) {
	if (error instanceof Error) {
		const details = [`${error.name}: ${error.message}`];
		const errorWithCode = error;
		if (errorWithCode.code) details.push(`code=${errorWithCode.code}`);
		if (errorWithCode.errno !== void 0) details.push(`errno=${String(errorWithCode.errno)}`);
		if (error.cause !== void 0) details.push(`cause=${formatErrorDetails(error.cause)}`);
		if (error.stack) details.push(`stack=${error.stack}`);
		return details.join("; ");
	}
	return String(error);
}
function formatTokenResponseParseContext(responseBody) {
	return `bodyBytes=${Buffer.byteLength(responseBody, "utf8")}`;
}
function parseTokenCredentials(responseBody, options) {
	let data;
	try {
		data = JSON.parse(responseBody);
	} catch (error) {
		throw new Error(`${options.invalidJsonMessage} url=${TOKEN_URL}; ${formatTokenResponseParseContext(responseBody)}; details=${formatErrorDetails(error)}`, { cause: error });
	}
	if (!data || typeof data !== "object") throw new Error(`${options.invalidFieldsMessage} url=${TOKEN_URL}; ${formatTokenResponseParseContext(responseBody)}`);
	const record = data;
	const expires = resolveOAuthTokenExpiresAt(record.expires_in, { refreshSkewMs: 300 * 1e3 });
	if (typeof record.access_token !== "string" || !record.access_token || typeof record.refresh_token !== "string" || !record.refresh_token || expires === void 0) throw new Error(`${options.invalidFieldsMessage} url=${TOKEN_URL}; ${formatTokenResponseParseContext(responseBody)}`);
	return {
		refresh: record.refresh_token,
		access: record.access_token,
		expires
	};
}
async function startCallbackServer(expectedState) {
	const { createServer } = await getNodeApis();
	return new Promise((resolve, reject) => {
		let settleWait;
		const waitForCodePromise = new Promise((resolveWait) => {
			let settled = false;
			settleWait = (value) => {
				if (settled) return;
				settled = true;
				resolveWait(value);
			};
		});
		const server = createServer((req, res) => {
			try {
				const url = new URL(req.url || "", "http://localhost");
				if (url.pathname !== CALLBACK_PATH) {
					res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
					res.end(oauthErrorHtml("Callback route not found."));
					return;
				}
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");
				const error = url.searchParams.get("error");
				if (error) {
					res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
					res.end(oauthErrorHtml("Anthropic authentication did not complete.", `Error: ${error}`));
					return;
				}
				if (!code || !state) {
					res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
					res.end(oauthErrorHtml("Missing code or state parameter."));
					return;
				}
				if (state !== expectedState) {
					res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
					res.end(oauthErrorHtml("State mismatch."));
					return;
				}
				res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
				res.end(oauthSuccessHtml("Anthropic authentication completed. You can close this window."));
				settleWait?.({
					code,
					state
				});
			} catch {
				res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
				res.end("Internal error");
			}
		});
		const callbackHost = resolveCallbackHost();
		server.on("error", (err) => {
			reject(err);
		});
		server.listen(CALLBACK_PORT, callbackHost, () => {
			resolve({
				server,
				cancelWait: () => {
					settleWait?.(null);
				},
				waitForCode: () => waitForCodePromise
			});
		});
	});
}
async function postJson(url, body, options = {}) {
	const timeoutMs = options.timeoutMs ?? 3e4;
	throwIfOAuthLoginAborted(options.signal);
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify(body),
		signal: buildOAuthRequestSignal({
			signal: options.signal,
			timeoutMs
		})
	});
	const buffer = await require_http_body.readResponseWithLimit(response, OAUTH_RESPONSE_MAX_BYTES, { onOverflow: ({ size }) => /* @__PURE__ */ new Error(`Anthropic OAuth response too large: ${size} bytes`) });
	const responseBody = new TextDecoder().decode(buffer);
	if (!response.ok) throw new Error(`HTTP request failed. status=${response.status}; url=${url}; body=${responseBody}`);
	return responseBody;
}
async function exchangeAuthorizationCode(code, state, verifier, redirectUri, signal) {
	let responseBody;
	try {
		responseBody = await postJson(TOKEN_URL, {
			grant_type: "authorization_code",
			client_id: CLIENT_ID$1,
			code,
			state,
			redirect_uri: redirectUri,
			code_verifier: verifier
		}, { signal });
	} catch (error) {
		if (signal?.aborted) throw createOAuthLoginCancelledError();
		throw new Error(`Token exchange request failed. url=${TOKEN_URL}; redirect_uri=${redirectUri}; response_type=authorization_code; details=${formatErrorDetails(error)}`, { cause: error });
	}
	return parseTokenCredentials(responseBody, {
		invalidJsonMessage: "Token exchange returned invalid JSON.",
		invalidFieldsMessage: "Token exchange returned invalid token fields."
	});
}
/**
* Login with Anthropic OAuth (authorization code + PKCE)
*/
async function loginAnthropic(options) {
	throwIfOAuthLoginAborted(options.signal);
	const { verifier, challenge } = await generatePKCE();
	const expectedState = generateOAuthState();
	const server = await startCallbackServer(expectedState);
	let code;
	let state;
	try {
		throwIfOAuthLoginAborted(options.signal);
		const authParams = new URLSearchParams({
			code: "true",
			client_id: CLIENT_ID$1,
			response_type: "code",
			redirect_uri: REDIRECT_URI,
			scope: SCOPES,
			code_challenge: challenge,
			code_challenge_method: "S256",
			state: expectedState
		});
		options.onAuth({
			url: `${AUTHORIZE_URL}?${authParams.toString()}`,
			instructions: "Complete login in your browser. If the browser is on another machine, paste the final redirect URL here."
		});
		throwIfOAuthLoginAborted(options.signal);
		if (options.onManualCodeInput) {
			let manualInput;
			let manualError;
			const manualPromise = options.onManualCodeInput().then((input) => {
				manualInput = input;
				server.cancelWait();
			}).catch((err) => {
				manualError = err instanceof Error ? err : new Error(String(err));
				server.cancelWait();
			});
			const result = await withOAuthLoginAbort(server.waitForCode(), options.signal, server.cancelWait);
			if (manualError) throw manualError;
			if (result?.code) {
				code = result.code;
				state = result.state;
			} else if (manualInput) {
				const parsed = parseOAuthAuthorizationInput(manualInput);
				if (parsed.state && parsed.state !== expectedState) throw new Error("OAuth state mismatch");
				code = parsed.code;
				state = parsed.state ?? expectedState;
			}
			if (!code) {
				await withOAuthLoginAbort(manualPromise, options.signal, server.cancelWait);
				if (manualError) throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(manualError, "Non-Error thrown");
				if (manualInput) {
					const parsed = parseOAuthAuthorizationInput(manualInput);
					if (parsed.state && parsed.state !== expectedState) throw new Error("OAuth state mismatch");
					code = parsed.code;
					state = parsed.state ?? expectedState;
				}
			}
		} else {
			const result = await withOAuthLoginAbort(server.waitForCode(), options.signal, server.cancelWait);
			if (result?.code) {
				code = result.code;
				state = result.state;
			}
		}
		if (!code) {
			const parsed = parseOAuthAuthorizationInput(await withOAuthLoginAbort(options.onPrompt({
				message: "Paste the authorization code or full redirect URL:",
				placeholder: REDIRECT_URI
			}), options.signal, server.cancelWait));
			if (parsed.state && parsed.state !== expectedState) throw new Error("OAuth state mismatch");
			code = parsed.code;
			state = parsed.state ?? expectedState;
		}
		if (!code) throw new Error("Missing authorization code");
		if (!state) throw new Error("Missing OAuth state");
		options.onProgress?.("Exchanging authorization code for tokens...");
		return exchangeAuthorizationCode(code, state, verifier, REDIRECT_URI, options.signal);
	} finally {
		server.server.close();
	}
}
/**
* Refresh Anthropic OAuth token
*/
async function refreshAnthropicToken(refreshToken) {
	let responseBody;
	try {
		responseBody = await postJson(TOKEN_URL, {
			grant_type: "refresh_token",
			client_id: CLIENT_ID$1,
			refresh_token: refreshToken
		});
	} catch (error) {
		throw new Error(`Anthropic token refresh request failed. url=${TOKEN_URL}; details=${formatErrorDetails(error)}`, { cause: error });
	}
	return parseTokenCredentials(responseBody, {
		invalidJsonMessage: "Anthropic token refresh returned invalid JSON.",
		invalidFieldsMessage: "Anthropic token refresh returned invalid token fields."
	});
}
const anthropicOAuthProvider = {
	id: "anthropic",
	name: "Anthropic (Claude Pro/Max)",
	usesCallbackServer: true,
	async login(callbacks) {
		return loginAnthropic({
			onAuth: callbacks.onAuth,
			onPrompt: callbacks.onPrompt,
			onProgress: callbacks.onProgress,
			onManualCodeInput: callbacks.onManualCodeInput,
			signal: callbacks.signal
		});
	},
	async refreshToken(credentials) {
		return refreshAnthropicToken(credentials.refresh);
	},
	getApiKey(credentials) {
		return credentials.access;
	}
};
//#endregion
//#region src/plugin-sdk/github-copilot-domain.ts
const DEFAULT_GITHUB_COPILOT_DOMAIN = "github.com";
const GHE_DATA_RESIDENCY_HOST = /^[a-z0-9-]+\.ghe\.com$/;
/**
* Whether a host may be templated into a Copilot endpoint: the public host or a
* data-residency GHE tenant (`*.ghe.com`). An absent value counts as supported
* because callers fall back to the public default. Anything else (a scheme,
* path, credentials, or an off-allowlist host) is not, so a persisted or
* injected origin can be rejected before any token is sent to it.
*/
function isSupportedGithubCopilotDomain(raw) {
	const trimmed = (raw ?? "").trim().toLowerCase();
	if (!trimmed) return true;
	if (!/^[a-z0-9.-]+$/.test(trimmed)) return false;
	return trimmed === "github.com" || GHE_DATA_RESIDENCY_HOST.test(trimmed);
}
/**
* Coerce a user/config-supplied GitHub host to a safe bare lowercase hostname.
*
* Fails closed to public `github.com`: only the public host and data-residency
* GHE tenants (`*.ghe.com`) are trusted. Any other value falls back to the
* default rather than being used verbatim, because the resolved host becomes the
* `api.<host>` endpoint that receives the GitHub OAuth token during exchange — a
* typo or injected value like `evil.com` must never redirect that token.
* (Classic self-hosted GHE Server uses arbitrary hostnames but does not host
* Copilot, so it is deliberately out of scope.) Config-supplied hosts coerce
* rather than throw; persisted credential origins are rejected upstream with
* `isSupportedGithubCopilotDomain` before reaching a token request.
*/
function normalizeGithubCopilotDomain(raw) {
	const trimmed = (raw ?? "").trim().toLowerCase();
	if (trimmed && isSupportedGithubCopilotDomain(trimmed)) return trimmed;
	return DEFAULT_GITHUB_COPILOT_DOMAIN;
}
//#endregion
//#region src/plugin-sdk/github-copilot-token-endpoint.ts
function isSupportedGithubCopilotApiHost(host, enterpriseDomain) {
	if (host === "copilot-proxy.githubusercontent.com" || host.endsWith(".githubcopilot.com")) return true;
	if (!enterpriseDomain || !isSupportedGithubCopilotDomain(enterpriseDomain) || normalizeGithubCopilotDomain(enterpriseDomain) === "github.com") return false;
	const tenant = normalizeGithubCopilotDomain(enterpriseDomain);
	return host === tenant || host.endsWith(`.${tenant}`);
}
/**
* Resolves the optional `proxy-ep` hint embedded in a Copilot API token.
* The hint is untrusted credential data: only GitHub-owned Copilot hosts, or
* service hosts below the credential's validated GHE.com tenant, may receive it.
*/
function resolveGithubCopilotTokenEndpoint(token, enterpriseDomain) {
	const proxyEndpoint = token.trim().match(/(?:^|;)\s*proxy-ep=([^;\s]+)/i)?.[1]?.trim();
	if (!proxyEndpoint) return {
		hasProxyEndpoint: false,
		baseUrl: null
	};
	const urlText = /^https?:\/\//i.test(proxyEndpoint) ? proxyEndpoint : `https://${proxyEndpoint}`;
	try {
		const url = new URL(urlText);
		if (url.protocol !== "http:" && url.protocol !== "https:") return {
			hasProxyEndpoint: true,
			baseUrl: null
		};
		const apiHost = url.hostname.toLowerCase().replace(/^proxy\./, "api.");
		return {
			hasProxyEndpoint: true,
			baseUrl: isSupportedGithubCopilotApiHost(apiHost, enterpriseDomain) ? `https://${apiHost}` : null
		};
	} catch {
		return {
			hasProxyEndpoint: true,
			baseUrl: null
		};
	}
}
//#endregion
//#region src/llm/utils/oauth/github-copilot.ts
/**
* GitHub Copilot OAuth flow
*/
const CLIENT_ID = "Iv1.b507a08c87ecfe98";
const COPILOT_HEADERS = {
	"User-Agent": "GitHubCopilotChat/0.35.0",
	"Editor-Version": "vscode/1.107.0",
	"Editor-Plugin-Version": "copilot-chat/0.35.0",
	"Copilot-Integration-Id": "vscode-chat"
};
const INITIAL_POLL_INTERVAL_MULTIPLIER = 1.2;
const SLOW_DOWN_POLL_INTERVAL_MULTIPLIER = 1.4;
const COPILOT_ROUTER_ID_PREFIX = "accounts/";
const COPILOT_REQUEST_TIMEOUT_MS = 3e4;
function resolveExpiresAtFromDurationSeconds(value) {
	return require_parse_finite_number.resolveExpiresAtMsFromDurationSeconds(value);
}
function resolveExpiresAtFromEpochSeconds(value) {
	return require_parse_finite_number.resolveExpiresAtMsFromEpochSeconds(value, { bufferMs: 300 * 1e3 });
}
function normalizeDomain(input) {
	const trimmed = input.trim();
	if (!trimmed) return null;
	try {
		return (trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`)).hostname;
	} catch {
		return null;
	}
}
function getUrls(domain) {
	const safeDomain = normalizeGithubCopilotDomain(domain);
	return {
		deviceCodeUrl: `https://${safeDomain}/login/device/code`,
		accessTokenUrl: `https://${safeDomain}/login/oauth/access_token`,
		copilotTokenUrl: `https://api.${safeDomain}/copilot_internal/v2/token`
	};
}
function getGitHubCopilotBaseUrl(token, enterpriseDomain) {
	if (enterpriseDomain && !isSupportedGithubCopilotDomain(enterpriseDomain)) throw new Error(`Refusing to route GitHub Copilot requests for unsupported enterprise domain "${enterpriseDomain}". Re-authenticate with a supported host (github.com or a *.ghe.com tenant).`);
	if (token) {
		const tokenEndpoint = resolveGithubCopilotTokenEndpoint(token, enterpriseDomain);
		if (tokenEndpoint.hasProxyEndpoint && !tokenEndpoint.baseUrl) throw new Error("Refusing to route GitHub Copilot requests to an unsupported proxy endpoint.");
		if (tokenEndpoint.baseUrl) return tokenEndpoint.baseUrl;
	}
	if (enterpriseDomain) return `https://copilot-api.${normalizeGithubCopilotDomain(enterpriseDomain)}`;
	return "https://api.individual.githubcopilot.com";
}
function formatCopilotRequestError(operation, error, options) {
	if (options.signal?.aborted) return /* @__PURE__ */ new Error("Login cancelled");
	if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) return /* @__PURE__ */ new Error(`GitHub Copilot ${operation} timed out after ${options.timeoutMs}ms`);
	return error instanceof Error ? error : /* @__PURE__ */ new Error(`GitHub Copilot ${operation} failed: ${String(error)}`);
}
function buildCopilotRequestSignal(options) {
	const timeoutSignal = AbortSignal.timeout((0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(options.timeoutMs, COPILOT_REQUEST_TIMEOUT_MS));
	if (!options.signal) return timeoutSignal;
	return AbortSignal.any([options.signal, timeoutSignal]);
}
async function fetchResponse(url, init, operation, options = {}) {
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(options.timeoutMs, COPILOT_REQUEST_TIMEOUT_MS);
	try {
		return await fetch(url, {
			...init,
			signal: buildCopilotRequestSignal({
				...options,
				timeoutMs
			})
		});
	} catch (error) {
		throw formatCopilotRequestError(operation, error, {
			signal: options.signal,
			timeoutMs
		});
	}
}
async function fetchJson(url, init, operation, options = {}) {
	const response = await fetchResponse(url, init, operation, options);
	const label = `GitHub Copilot ${operation}`;
	await require_provider_http_errors.assertOkOrThrowProviderError(response, label);
	return require_provider_http_errors.readProviderJsonResponse(response, label);
}
async function startDeviceFlow(domain, options = {}) {
	const data = await fetchJson(getUrls(domain).deviceCodeUrl, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
			"User-Agent": "GitHubCopilotChat/0.35.0"
		},
		body: new URLSearchParams({
			client_id: CLIENT_ID,
			scope: "read:user"
		})
	}, "device code request", options);
	if (!data || typeof data !== "object") throw new Error("Invalid device code response");
	const deviceCode = data.device_code;
	const userCode = data.user_code;
	const verificationUri = data.verification_uri;
	const interval = data.interval;
	const intervalMs = require_parse_finite_number.nonNegativeSecondsToSafeMilliseconds(interval);
	const expiresAt = resolveExpiresAtFromDurationSeconds(data.expires_in);
	if (typeof deviceCode !== "string" || typeof userCode !== "string" || typeof verificationUri !== "string" || intervalMs === void 0 || expiresAt === void 0) throw new Error("Invalid device code response fields");
	return {
		device_code: deviceCode,
		user_code: userCode,
		verification_uri: verificationUri,
		intervalMs,
		expiresAt
	};
}
/**
* Sleep that can be interrupted by an AbortSignal
*/
function abortableSleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(/* @__PURE__ */ new Error("Login cancelled"));
			return;
		}
		const timeout = setTimeout(resolve, ms);
		signal?.addEventListener("abort", () => {
			clearTimeout(timeout);
			reject(/* @__PURE__ */ new Error("Login cancelled"));
		}, { once: true });
	});
}
async function pollForGitHubAccessToken(domain, deviceCode, intervalMs, deadline, signal) {
	const urls = getUrls(domain);
	let pollingIntervalMs = Math.max(1e3, intervalMs);
	let intervalMultiplier = INITIAL_POLL_INTERVAL_MULTIPLIER;
	let slowDownResponses = 0;
	while (Date.now() < deadline) {
		if (signal?.aborted) throw new Error("Login cancelled");
		const remainingMs = deadline - Date.now();
		await abortableSleep(Math.min(Math.ceil(pollingIntervalMs * intervalMultiplier), remainingMs), signal);
		const raw = await fetchJson(urls.accessTokenUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
				"User-Agent": "GitHubCopilotChat/0.35.0"
			},
			body: new URLSearchParams({
				client_id: CLIENT_ID,
				device_code: deviceCode,
				grant_type: "urn:ietf:params:oauth:grant-type:device_code"
			})
		}, "device token request", { signal });
		if (raw && typeof raw === "object" && typeof raw.access_token === "string") return raw.access_token;
		if (raw && typeof raw === "object" && typeof raw.error === "string") {
			const { error, error_description: description, interval } = raw;
			if (error === "authorization_pending") continue;
			if (error === "slow_down") {
				slowDownResponses += 1;
				const slowDownIntervalMs = require_parse_finite_number.positiveSecondsToSafeMilliseconds(interval);
				pollingIntervalMs = slowDownIntervalMs === void 0 ? Math.max(1e3, pollingIntervalMs + 5e3) : Math.max(1e3, slowDownIntervalMs);
				intervalMultiplier = SLOW_DOWN_POLL_INTERVAL_MULTIPLIER;
				continue;
			}
			const descriptionSuffix = description ? `: ${description}` : "";
			throw new Error(`Device flow failed: ${error}${descriptionSuffix}`);
		}
	}
	if (slowDownResponses > 0) throw new Error("Device flow timed out after one or more slow_down responses. This is often caused by clock drift in WSL or VM environments. Please sync or restart the VM clock and try again.");
	throw new Error("Device flow timed out");
}
/**
* Refresh GitHub Copilot token
*/
async function refreshGitHubCopilotToken(refreshToken, enterpriseDomain, options = {}) {
	if (enterpriseDomain && !isSupportedGithubCopilotDomain(enterpriseDomain)) throw new Error(`Refusing to refresh GitHub Copilot token for unsupported enterprise domain "${enterpriseDomain}". Re-authenticate with a supported host (github.com or a *.ghe.com tenant).`);
	const raw = await fetchJson(getUrls(enterpriseDomain || "github.com").copilotTokenUrl, { headers: {
		Accept: "application/json",
		Authorization: `Bearer ${refreshToken}`,
		...COPILOT_HEADERS
	} }, "token refresh request", options);
	if (!raw || typeof raw !== "object") throw new Error("Invalid Copilot token response");
	const token = raw.token;
	const expires = resolveExpiresAtFromEpochSeconds(raw.expires_at);
	if (typeof token !== "string" || expires === void 0) throw new Error("Invalid Copilot token response fields");
	return {
		refresh: refreshToken,
		access: token,
		expires,
		enterpriseUrl: enterpriseDomain
	};
}
/**
* Enable a model for the user's GitHub Copilot account.
* This is required for some models (like Claude, Grok) before they can be used.
*/
async function enableGitHubCopilotModel(token, modelId, enterpriseDomain, options = {}) {
	const url = `${getGitHubCopilotBaseUrl(token, enterpriseDomain)}/models/${modelId}/policy`;
	let response;
	try {
		response = await fetchResponse(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				...COPILOT_HEADERS,
				"openai-intent": "chat-policy",
				"x-interaction-type": "chat-policy"
			},
			body: JSON.stringify({ state: "enabled" })
		}, "model policy request", options);
		return response.ok;
	} catch {
		return false;
	} finally {
		await response?.body?.cancel().catch(() => void 0);
	}
}
async function listGitHubCopilotModelIds(token, enterpriseDomain, options = {}) {
	const url = `${getGitHubCopilotBaseUrl(token, enterpriseDomain)}/models`;
	try {
		const raw = await fetchJson(url, { headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
			...COPILOT_HEADERS
		} }, "model list request", options);
		const data = raw && typeof raw === "object" ? raw.data : void 0;
		if (!Array.isArray(data)) return [];
		return data.flatMap((entry) => {
			if (!entry || typeof entry !== "object") return [];
			const model = entry;
			const id = typeof model.id === "string" ? model.id.trim() : "";
			if (!id || id.startsWith(COPILOT_ROUTER_ID_PREFIX)) return [];
			if (model.object && model.object !== "model") return [];
			if (model.capabilities?.type && model.capabilities.type !== "chat") return [];
			return [id];
		});
	} catch {
		return [];
	}
}
/**
* Enable GitHub Copilot models visible to this account.
* Called after successful login to ensure available models are policy-enabled.
*/
async function enableAllGitHubCopilotModels(token, enterpriseDomain, onProgress) {
	const modelIds = await listGitHubCopilotModelIds(token, enterpriseDomain);
	await Promise.all(modelIds.map(async (modelId) => {
		const success = await enableGitHubCopilotModel(token, modelId, enterpriseDomain);
		onProgress?.(modelId, success);
	}));
}
/**
* Login with GitHub Copilot OAuth (device code flow)
*
* @param options.onAuth - Callback with URL and optional instructions (user code)
* @param options.onPrompt - Callback to prompt user for input
* @param options.onProgress - Optional progress callback
* @param options.signal - Optional AbortSignal for cancellation
*/
async function loginGitHubCopilot(options) {
	const input = await options.onPrompt({
		message: "GitHub Enterprise URL/domain (blank for github.com)",
		placeholder: "company.ghe.com",
		allowEmpty: true
	});
	if (options.signal?.aborted) throw new Error("Login cancelled");
	const trimmed = input.trim();
	const enterpriseDomain = normalizeDomain(input);
	if (trimmed && !enterpriseDomain) throw new Error("Invalid GitHub Enterprise URL/domain");
	if (!isSupportedGithubCopilotDomain(enterpriseDomain)) throw new Error(`Unsupported GitHub Enterprise domain "${trimmed}". Use github.com or a *.ghe.com data-residency tenant.`);
	const domain = enterpriseDomain || "github.com";
	const device = await startDeviceFlow(domain, { signal: options.signal });
	options.onAuth(device.verification_uri, `Enter code: ${device.user_code}`);
	const credentials = await refreshGitHubCopilotToken(await pollForGitHubAccessToken(domain, device.device_code, device.intervalMs, device.expiresAt, options.signal), enterpriseDomain ?? void 0);
	options.onProgress?.("Enabling models...");
	await enableAllGitHubCopilotModels(credentials.access, enterpriseDomain ?? void 0);
	return credentials;
}
const githubCopilotOAuthProvider = {
	id: "github-copilot",
	name: "GitHub Copilot",
	async login(callbacks) {
		return loginGitHubCopilot({
			onAuth: (url, instructions) => callbacks.onAuth({
				url,
				instructions
			}),
			onPrompt: callbacks.onPrompt,
			onProgress: callbacks.onProgress,
			signal: callbacks.signal
		});
	},
	async refreshToken(credentials) {
		const creds = credentials;
		return refreshGitHubCopilotToken(creds.refresh, creds.enterpriseUrl);
	},
	getApiKey(credentials) {
		return credentials.access;
	},
	modifyModels(models, credentials) {
		const creds = credentials;
		const domain = creds.enterpriseUrl ? normalizeDomain(creds.enterpriseUrl) ?? void 0 : void 0;
		const tokenEndpoint = resolveGithubCopilotTokenEndpoint(creds.access, domain);
		if (!isSupportedGithubCopilotDomain(creds.enterpriseUrl) || tokenEndpoint.hasProxyEndpoint && !tokenEndpoint.baseUrl) return models.filter((m) => m.provider !== "github-copilot");
		const baseUrl = tokenEndpoint.baseUrl ?? getGitHubCopilotBaseUrl(void 0, domain);
		return models.map((m) => m.provider === "github-copilot" ? {
			...m,
			baseUrl
		} : m);
	}
};
//#endregion
//#region src/llm/utils/oauth/openai-chatgpt.ts
const OPENAI_CODEX_PROVIDER_ID = "openai";
function loadOpenAICodexOAuthFacade() {
	return require_facade_runtime.loadActivatedBundledPluginPublicSurfaceModuleSync({
		dirName: "openai",
		artifactBasename: "api.js"
	});
}
function createLegacyRuntime(callbacks) {
	return {
		log: (message) => callbacks.onProgress?.(String(message)),
		error: (message) => callbacks.onProgress?.(String(message)),
		exit: (code) => {
			throw new Error(`exit:${code}`);
		}
	};
}
function createLegacyPrompter(callbacks) {
	const progress = {
		update: (message) => callbacks.onProgress?.(message),
		stop: (message) => {
			if (message) callbacks.onProgress?.(message);
		}
	};
	return {
		intro: async () => {},
		outro: async () => {},
		note: async (message) => callbacks.onProgress?.(message),
		select: async (params) => params.options[0]?.value,
		multiselect: async (params) => params.initialValues ?? [],
		text: async (prompt) => {
			return await withOAuthLoginAbort(callbacks.onPrompt({
				message: prompt.message,
				placeholder: prompt.placeholder
			}), callbacks.signal);
		},
		confirm: async () => false,
		progress: () => progress
	};
}
async function refreshViaProviderRuntime(refreshToken) {
	const { refreshProviderOAuthCredentialWithPlugin } = await Promise.resolve().then(() => require("./provider-runtime.runtime-BdpKDfCD.cjs")).then((n) => n.provider_runtime_runtime_exports);
	const refreshed = await refreshProviderOAuthCredentialWithPlugin({
		provider: OPENAI_CODEX_PROVIDER_ID,
		context: {
			type: "oauth",
			provider: OPENAI_CODEX_PROVIDER_ID,
			access: "",
			refresh: refreshToken,
			expires: 0
		}
	});
	if (!refreshed) return await loadOpenAICodexOAuthFacade().refreshOpenAICodexToken(refreshToken);
	const credentials = { ...refreshed };
	delete credentials.type;
	delete credentials.provider;
	return credentials;
}
/** Runs the ChatGPT/Codex OAuth login flow and returns normalized credentials. */
async function loginOpenAICodex(callbacks) {
	throwIfOAuthLoginAborted(callbacks.signal);
	const { loginOpenAICodexOAuth } = await Promise.resolve().then(() => require("./provider-openai-chatgpt-oauth-aubMSW-b.cjs"));
	const manualCodeInput = callbacks.onManualCodeInput;
	const onManualCodeInput = manualCodeInput ? async () => await withOAuthLoginAbort(manualCodeInput(), callbacks.signal) : void 0;
	const credentials = await withOAuthLoginAbort(loginOpenAICodexOAuth({
		prompter: createLegacyPrompter(callbacks),
		runtime: createLegacyRuntime(callbacks),
		isRemote: false,
		signal: callbacks.signal,
		onManualCodeInput,
		openUrl: async (url) => {
			throwIfOAuthLoginAborted(callbacks.signal);
			await callbacks.onAuth({ url });
		}
	}), callbacks.signal);
	if (!credentials) throw new Error("OpenAI Codex OAuth login did not return credentials.");
	return credentials;
}
/** Refreshes a ChatGPT/Codex OAuth token through the provider runtime or bundled facade. */
async function refreshOpenAICodexToken(refreshToken) {
	return await refreshViaProviderRuntime(refreshToken);
}
//#endregion
//#region src/llm/utils/oauth/index.ts
const BUILT_IN_OAUTH_PROVIDERS = [
	anthropicOAuthProvider,
	githubCopilotOAuthProvider,
	{
		id: OPENAI_CODEX_PROVIDER_ID,
		name: "ChatGPT Plus/Pro (Codex Subscription)",
		usesCallbackServer: true,
		async login(callbacks) {
			return await loginOpenAICodex(callbacks);
		},
		async refreshToken(credentials) {
			return await refreshOpenAICodexToken(credentials.refresh);
		},
		getApiKey(credentials) {
			return credentials.access;
		}
	}
];
async function resolveOAuthApiKey(provider, credentials) {
	let creds = credentials[provider.id];
	if (!creds) return null;
	if (Date.now() >= creds.expires) try {
		creds = await provider.refreshToken(creds);
	} catch (error) {
		throw new Error(`Failed to refresh OAuth token for ${provider.id}`, { cause: error });
	}
	return {
		newCredentials: creds,
		apiKey: provider.getApiKey(creds)
	};
}
/** Mutable OAuth provider registrations owned by one auth/session runtime. */
var OAuthProviderRegistry = class {
	constructor() {
		this.providers = /* @__PURE__ */ new Map();
		this.reset();
	}
	get(id) {
		return this.providers.get(id);
	}
	register(provider) {
		this.providers.set(provider.id, provider);
	}
	reset() {
		this.providers.clear();
		for (const provider of BUILT_IN_OAUTH_PROVIDERS) this.providers.set(provider.id, provider);
	}
	getAll() {
		return Array.from(this.providers.values());
	}
	async getApiKey(providerId, credentials) {
		const provider = this.get(providerId);
		if (!provider) throw new Error(`Unknown OAuth provider: ${providerId}`);
		return resolveOAuthApiKey(provider, credentials);
	}
};
/**
* Get a built-in OAuth provider by ID.
*/
function getOAuthProvider(id) {
	return BUILT_IN_OAUTH_PROVIDERS.find((provider) => provider.id === id);
}
/**
* Get all built-in OAuth providers.
*/
function getOAuthProviders() {
	return [...BUILT_IN_OAUTH_PROVIDERS];
}
/**
* Get API key for a provider from OAuth credentials.
* Automatically refreshes expired tokens.
*
* @returns API key string and updated credentials, or null if no credentials
* @throws Error if refresh fails
*/
async function getOAuthApiKey(providerId, credentials) {
	const provider = getOAuthProvider(providerId);
	if (!provider) throw new Error(`Unknown OAuth provider: ${providerId}`);
	return resolveOAuthApiKey(provider, credentials);
}
//#endregion
Object.defineProperty(exports, "OAuthProviderRegistry", {
	enumerable: true,
	get: function() {
		return OAuthProviderRegistry;
	}
});
Object.defineProperty(exports, "buildOAuthRequestSignal", {
	enumerable: true,
	get: function() {
		return buildOAuthRequestSignal;
	}
});
Object.defineProperty(exports, "getOAuthApiKey", {
	enumerable: true,
	get: function() {
		return getOAuthApiKey;
	}
});
Object.defineProperty(exports, "getOAuthProviders", {
	enumerable: true,
	get: function() {
		return getOAuthProviders;
	}
});
Object.defineProperty(exports, "isSupportedGithubCopilotDomain", {
	enumerable: true,
	get: function() {
		return isSupportedGithubCopilotDomain;
	}
});
