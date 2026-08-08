const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
require("./sleep-BVpvBXin.cjs");
require("./globals-D7PiAd5y.cjs");
require("./runtime-BOSfFY3R.cjs");
require("./subsystem-DVRgVNGQ.cjs");
require("./retry-DXZi6qkk.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
require("./unhandled-rejections-BM-J7NGE.cjs");
require("./env-C7Oxn-fY.cjs");
require("./model-selection-BvFurMxy.cjs");
require("./backoff-Dw8FZM0b.cjs");
require("./api-key-rotation-CuaS0TdR.cjs");
require("./model-auth-markers-CW9eHIop.cjs");
require("./logging-CPL2M9DX.cjs");
require("./store-BgTrp0qP.cjs");
require("./format-duration-BV8edXFT.cjs");
require("./model-auth-env-C9t8YSK1.cjs");
require("./model-auth-D9ZnqE0T.cjs");
const require_oauth_token = require("./oauth.token-CfaE5UGx.cjs");
require("./provider-auth-PPVVNb8y.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
require("node:url");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_http = require("node:http");
//#region src/plugin-sdk/oauth-utils.ts
/** Generate a PKCE verifier/challenge pair with a 64-character hex verifier. */
function generateHexPkceVerifierChallenge() {
	const verifier = (0, node_crypto.randomBytes)(32).toString("hex");
	return {
		verifier,
		challenge: (0, node_crypto.createHash)("sha256").update(verifier).digest("base64url")
	};
}
//#endregion
//#region src/plugin-sdk/provider-auth-runtime.ts
function buildOAuthCallbackOriginResolver(allowedHosts) {
	if (!allowedHosts || allowedHosts.length === 0) return () => void 0;
	const normalized = new Set(allowedHosts.map((host) => host.trim().toLowerCase()).filter((host) => host.length > 0));
	if (normalized.size === 0) return () => void 0;
	return (originHeader) => {
		const value = Array.isArray(originHeader) ? originHeader[0] : originHeader;
		if (!value) return;
		try {
			const parsed = new URL(value);
			if (parsed.protocol !== "https:") return;
			return normalized.has(parsed.host.toLowerCase()) ? parsed.origin : void 0;
		} catch {
			return;
		}
	};
}
/**
* Generates a high-entropy OAuth state token for local callback validation.
*/
function generateOAuthState() {
	return node_crypto.default.randomBytes(32).toString("hex");
}
/**
* Parses a pasted OAuth redirect URL into callback code/state fields.
*/
function parseOAuthCallbackInput(input, messages = {}) {
	const trimmed = input.trim();
	if (!trimmed) return { error: "No input provided" };
	try {
		const url = new URL(trimmed);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		if (!code) return { error: "Missing 'code' parameter in URL" };
		if (!state) return { error: messages.missingState ?? "Missing 'state' parameter in URL" };
		return {
			code,
			state
		};
	} catch {
		return { error: messages.invalidInput ?? "Paste the full redirect URL, not just the code." };
	}
}
/**
* Starts a temporary loopback HTTP listener and waits for a validated OAuth callback.
*/
async function waitForLocalOAuthCallback(params) {
	const hostname = params.hostname ?? "localhost";
	const timeoutMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(params.timeoutMs, 1);
	const escapedSuccessTitle = escapeHtmlText(params.successTitle);
	const resolveOAuthCallbackOrigin = buildOAuthCallbackOriginResolver(params.corsOriginAllowlist);
	const hasCorsOriginAllowlist = params.corsOriginAllowlist?.some((host) => host.trim().length > 0) ?? false;
	return new Promise((resolve, reject) => {
		let settled = false;
		let timeout = null;
		const server = (0, node_http.createServer)((req, res) => {
			try {
				applyOAuthCallbackCorsHeaders(req, res, hasCorsOriginAllowlist ? resolveOAuthCallbackOrigin : void 0);
				const requestUrl = new URL(req.url ?? "/", `http://${hostname}:${params.port}`);
				if (req.method === "OPTIONS") {
					res.statusCode = 204;
					res.end();
					return;
				}
				if (requestUrl.pathname !== params.callbackPath) {
					res.statusCode = 404;
					res.setHeader("Content-Type", "text/plain");
					res.end("Not found");
					return;
				}
				if (req.method !== "GET") {
					res.statusCode = 405;
					res.setHeader("Allow", "GET, OPTIONS");
					res.setHeader("Content-Type", "text/plain");
					res.end("Method not allowed");
					return;
				}
				const error = requestUrl.searchParams.get("error");
				const code = requestUrl.searchParams.get("code")?.trim();
				const state = requestUrl.searchParams.get("state")?.trim();
				if (error) {
					res.statusCode = 400;
					res.setHeader("Content-Type", "text/plain");
					res.end(`Authentication failed: ${error}`);
					finish(/* @__PURE__ */ new Error(`OAuth error: ${error}`));
					return;
				}
				if (!code || !state) {
					res.statusCode = 400;
					res.setHeader("Content-Type", "text/plain");
					res.end("Missing code or state");
					finish(/* @__PURE__ */ new Error("Missing OAuth code or state"));
					return;
				}
				if (state !== params.expectedState) {
					res.statusCode = 400;
					res.setHeader("Content-Type", "text/plain");
					res.end("Invalid state");
					finish(/* @__PURE__ */ new Error("OAuth state mismatch"));
					return;
				}
				res.statusCode = 200;
				res.setHeader("Content-Type", "text/html; charset=utf-8");
				res.end(`<!doctype html><html><head><meta charset='utf-8'/></head><body><h2>${escapedSuccessTitle}</h2><p>You can close this window and return to Operator.</p></body></html>`);
				finish(void 0, {
					code,
					state
				});
			} catch (err) {
				finish(err instanceof Error ? err : /* @__PURE__ */ new Error("OAuth callback failed"));
			}
		});
		const finish = (err, result) => {
			if (settled) return;
			settled = true;
			if (timeout) clearTimeout(timeout);
			params.signal?.removeEventListener("abort", onAbort);
			try {
				server.close();
			} catch {}
			if (err) reject(err);
			else if (result) resolve(result);
		};
		const onAbort = () => finish(/* @__PURE__ */ new Error("OAuth callback cancelled"));
		params.signal?.addEventListener("abort", onAbort, { once: true });
		if (params.signal?.aborted) {
			onAbort();
			return;
		}
		server.once("error", (err) => {
			finish(err instanceof Error ? err : /* @__PURE__ */ new Error("OAuth callback server error"));
		});
		server.listen(params.port, hostname, () => {
			params.onProgress?.(params.progressMessage ?? `Waiting for OAuth callback on ${params.redirectUri}...`);
		});
		timeout = setTimeout(() => {
			finish(/* @__PURE__ */ new Error("OAuth callback timeout"));
		}, timeoutMs);
	});
}
function applyOAuthCallbackCorsHeaders(req, res, resolveOrigin) {
	const origin = resolveOrigin === void 0 ? typeof req.headers.origin === "string" && isHttpOrigin(req.headers.origin) ? req.headers.origin : void 0 : resolveOrigin(req.headers.origin);
	if (origin) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
	}
	if (resolveOrigin !== void 0 && !origin) return;
	const requestedHeaders = req.headers["access-control-request-headers"];
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", typeof requestedHeaders === "string" && requestedHeaders.trim().length > 0 ? requestedHeaders : "content-type");
	res.setHeader("Access-Control-Allow-Private-Network", "true");
	res.setHeader("Access-Control-Max-Age", "600");
}
function isHttpOrigin(value) {
	try {
		const url = new URL(value);
		return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
	} catch {
		return false;
	}
}
function escapeHtmlText(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
//#endregion
//#region extensions/msteams/src/oauth.flow.ts
function shouldUseManualOAuthFlow(isRemote) {
	return isRemote || require_undici_global_dispatcher.isWSL2Sync();
}
function generatePkce() {
	return generateHexPkceVerifierChallenge();
}
function buildMSTeamsAuthUrl(params) {
	const scopes = params.scopes ?? require_oauth_token.MSTEAMS_DEFAULT_DELEGATED_SCOPES;
	return `${require_oauth_token.buildMSTeamsAuthEndpoint(params.tenantId)}?${new URLSearchParams({
		client_id: params.clientId,
		response_type: "code",
		redirect_uri: require_oauth_token.MSTEAMS_OAUTH_REDIRECT_URI,
		scope: scopes.join(" "),
		code_challenge: params.challenge,
		code_challenge_method: "S256",
		state: params.state,
		prompt: "consent"
	}).toString()}`;
}
function parseCallbackInput(input, _expectedState) {
	return parseOAuthCallbackInput(input, {
		missingState: "Missing 'state' parameter in URL. Paste the full redirect URL.",
		invalidInput: "Paste the full redirect URL (including code and state parameters), not just the authorization code."
	});
}
async function waitForLocalCallback(params) {
	return await waitForLocalOAuthCallback({
		expectedState: params.expectedState,
		timeoutMs: params.timeoutMs,
		port: require_oauth_token.MSTEAMS_OAUTH_CALLBACK_PORT,
		callbackPath: require_oauth_token.MSTEAMS_OAUTH_CALLBACK_PATH,
		redirectUri: require_oauth_token.MSTEAMS_OAUTH_REDIRECT_URI,
		successTitle: "MSTeams Delegated OAuth complete",
		progressMessage: `Waiting for OAuth callback on ${require_oauth_token.MSTEAMS_OAUTH_REDIRECT_URI}...`,
		onProgress: params.onProgress
	});
}
//#endregion
//#region extensions/msteams/src/oauth.ts
async function loginMSTeamsDelegated(ctx, params) {
	const scopes = params.scopes ?? require_oauth_token.MSTEAMS_DEFAULT_DELEGATED_SCOPES;
	const needsManual = shouldUseManualOAuthFlow(ctx.isRemote);
	await ctx.note(needsManual ? [
		"You are running in a remote/VPS environment.",
		"A URL will be shown for you to open in your LOCAL browser.",
		"After signing in, copy the redirect URL and paste it back here."
	].join("\n") : [
		"Browser will open for Microsoft authentication.",
		`Sign in to grant delegated permissions for MSTeams.`,
		`The callback will be captured automatically on localhost:${require_oauth_token.MSTEAMS_OAUTH_CALLBACK_PORT}.`
	].join("\n"), "MSTeams Delegated OAuth");
	const { verifier, challenge } = generatePkce();
	const state = generateOAuthState();
	const authUrl = buildMSTeamsAuthUrl({
		tenantId: params.tenantId,
		clientId: params.clientId,
		challenge,
		state,
		scopes
	});
	if (needsManual) return manualFlow(ctx, authUrl, state, verifier, params);
	ctx.progress.update("Complete sign-in in browser...");
	try {
		await ctx.openUrl(authUrl);
	} catch {
		ctx.log(`\nOpen this URL in your browser:\n\n${authUrl}\n`);
	}
	try {
		const { code } = await waitForLocalCallback({
			expectedState: state,
			timeoutMs: 300 * 1e3,
			onProgress: (msg) => ctx.progress.update(msg)
		});
		ctx.progress.update("Exchanging authorization code for tokens...");
		return await require_oauth_token.exchangeMSTeamsCodeForTokens({
			tenantId: params.tenantId,
			clientId: params.clientId,
			clientSecret: params.clientSecret,
			code,
			verifier,
			scopes
		});
	} catch (err) {
		if (err instanceof Error && (err.message.includes("EADDRINUSE") || err.message.includes("port") || err.message.includes("listen"))) {
			ctx.progress.update("Local callback server failed. Switching to manual mode...");
			return manualFlow(ctx, authUrl, state, verifier, params, err);
		}
		throw err;
	}
}
async function manualFlow(ctx, authUrl, state, verifier, params, cause) {
	ctx.progress.update("OAuth URL ready");
	ctx.log(`\nOpen this URL in your LOCAL browser:\n\n${authUrl}\n`);
	ctx.progress.update("Waiting for you to paste the callback URL...");
	const parsed = parseCallbackInput(await ctx.prompt("Paste the redirect URL here: "), state);
	if ("error" in parsed) throw new Error(parsed.error, cause ? { cause } : void 0);
	if (parsed.state !== state) throw new Error("OAuth state mismatch - please try again", cause ? { cause } : void 0);
	ctx.progress.update("Exchanging authorization code for tokens...");
	return require_oauth_token.exchangeMSTeamsCodeForTokens({
		tenantId: params.tenantId,
		clientId: params.clientId,
		clientSecret: params.clientSecret,
		code: parsed.code,
		verifier,
		scopes: params.scopes
	});
}
//#endregion
exports.loginMSTeamsDelegated = loginMSTeamsDelegated;
