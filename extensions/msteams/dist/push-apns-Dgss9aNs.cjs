const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_active_proxy_state = require("./active-proxy-state-IFfwIaiY.cjs");
const require_push_apns_store = require("./push-apns-store-THiqtBab.cjs");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _openclaw_proxyline = require("@openclaw/proxyline");
let node_tls = require("node:tls");
node_tls = require_rolldown_runtime.__toESM(node_tls, 1);
let node_events = require("node:events");
let node_http2 = require("node:http2");
node_http2 = require_rolldown_runtime.__toESM(node_http2, 1);
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/infra/push-apns-http2.ts
const APNS_DEFAULT_PORT = "443";
const APNS_AUTHORITIES = /* @__PURE__ */ new Set(["https://api.push.apple.com", "https://api.sandbox.push.apple.com"]);
const APNS_HTTP2_CANCEL_CODE = node_http2.default.constants.NGHTTP2_CANCEL;
const APNS_RESPONSE_BODY_MAX_BYTES = 8192;
const APNS_HTTP2_MIN_TIMEOUT_MS = 1e3;
function assertApnsAuthority(authority) {
	let parsed;
	try {
		parsed = new URL(authority);
	} catch {
		throw new Error(`Unsupported APNs authority: ${authority}`);
	}
	if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error(`Unsupported APNs authority: ${authority}`);
	const port = parsed.port && parsed.port !== APNS_DEFAULT_PORT ? `:${parsed.port}` : "";
	const normalized = `${parsed.protocol}//${parsed.hostname}${port}`;
	if (!APNS_AUTHORITIES.has(normalized)) throw new Error(`Unsupported APNs authority: ${authority}`);
	return normalized;
}
function normalizeConnectProxyUrl(proxyUrl) {
	const normalized = new URL(proxyUrl);
	normalized.pathname = "/";
	normalized.search = "";
	normalized.hash = "";
	try {
		decodeURIComponent(normalized.username);
		decodeURIComponent(normalized.password);
	} catch (err) {
		throw new Error(`Proxy CONNECT failed via ${normalized.origin}: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
	}
	return normalized;
}
async function openApnsTlsTunnel(params) {
	const proxyUrl = normalizeConnectProxyUrl(params.proxyUrl);
	const deadline = Date.now() + params.timeoutMs;
	const proxySocket = await (0, _openclaw_proxyline.openProxyConnectTunnel)({
		proxyUrl,
		...params.proxyTls ? { proxyTls: params.proxyTls } : {},
		targetHost: params.targetHost,
		targetPort: params.targetPort,
		timeoutMs: params.timeoutMs
	});
	const abortController = new AbortController();
	let targetTlsSocket;
	let timeout;
	try {
		targetTlsSocket = node_tls.default.connect({
			socket: proxySocket,
			servername: params.targetHost,
			ALPNProtocols: ["h2"]
		});
		timeout = setTimeout(() => abortController.abort(/* @__PURE__ */ new Error(`Proxy CONNECT timed out after ${params.timeoutMs}ms`)), Math.max(1, deadline - Date.now()));
		timeout.unref?.();
		await Promise.race([(0, node_events.once)(targetTlsSocket, "secureConnect", { signal: abortController.signal }), (0, node_events.once)(targetTlsSocket, "close", { signal: abortController.signal }).then(() => {
			throw new Error("APNs TLS tunnel closed before secureConnect");
		})]);
		if (targetTlsSocket.alpnProtocol !== "h2") throw new Error(`APNs TLS tunnel negotiated ${targetTlsSocket.alpnProtocol || "no ALPN protocol"} instead of h2`);
		return targetTlsSocket;
	} catch (err) {
		targetTlsSocket?.destroy();
		proxySocket.destroy();
		const failure = abortController.signal.aborted ? abortController.signal.reason : err;
		throw new Error(`Proxy CONNECT failed via ${proxyUrl.origin}: ${failure instanceof Error ? failure.message : String(failure)}`, { cause: err });
	} finally {
		if (timeout) clearTimeout(timeout);
		abortController.abort();
	}
}
async function openProxiedApnsHttp2Session(params) {
	const apnsHost = new URL(params.authority).hostname;
	const tlsSocket = await openApnsTlsTunnel({
		proxyUrl: params.proxyUrl,
		...params.proxyTls ? { proxyTls: params.proxyTls } : {},
		targetHost: apnsHost,
		targetPort: 443,
		timeoutMs: params.timeoutMs
	});
	return node_http2.default.connect(params.authority, { createConnection: () => tlsSocket });
}
/** Connects to APNs directly, or through the active managed proxy when present. */
async function connectApnsHttp2Session(params) {
	const authority = assertApnsAuthority(params.authority);
	const timeoutMs = resolveApnsHttp2TimeoutMs(params.timeoutMs);
	const proxyUrl = require_active_proxy_state.getActiveManagedProxyUrl();
	if (!proxyUrl) return node_http2.default.connect(authority);
	return await openProxiedApnsHttp2Session({
		authority,
		proxyUrl,
		proxyTls: require_active_proxy_state.getActiveManagedProxyTlsOptions(),
		timeoutMs
	});
}
function resolveApnsHttp2TimeoutMs(timeoutMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(timeoutMs, APNS_HTTP2_MIN_TIMEOUT_MS, APNS_HTTP2_MIN_TIMEOUT_MS);
}
function createApnsResponseBodyCapture() {
	return {
		text: "",
		bytes: 0,
		truncated: false
	};
}
function appendApnsResponseBodyCapture(capture, chunk, maxBytes = APNS_RESPONSE_BODY_MAX_BYTES) {
	const buffer = Buffer.from(String(chunk));
	capture.bytes += buffer.byteLength;
	const remaining = maxBytes - Buffer.byteLength(capture.text);
	if (remaining <= 0) {
		capture.truncated = capture.truncated || buffer.byteLength > 0;
		return;
	}
	const slice = buffer.byteLength > remaining ? buffer.subarray(0, remaining) : buffer;
	capture.text += slice.toString("utf8");
	if (slice.byteLength < buffer.byteLength) capture.truncated = true;
}
//#endregion
//#region src/infra/push-apns-payloads.ts
const EXEC_APPROVAL_GENERIC_ALERT_BODY = "Open Operator to review this request.";
const PLUGIN_APPROVAL_ALERT_BODY_MAX_LENGTH = 256;
function toPushMetadata(params) {
	return {
		kind: params.kind,
		nodeId: params.nodeId,
		ts: Date.now(),
		...params.reason ? { reason: params.reason } : {}
	};
}
function createApnsAlertPayload(params) {
	return {
		aps: {
			alert: {
				title: params.title,
				body: params.body
			},
			sound: "default"
		},
		operator: toPushMetadata({
			kind: "push.test",
			nodeId: params.nodeId
		})
	};
}
function createApnsBackgroundPayload(params) {
	return {
		aps: { "content-available": 1 },
		operator: toPushMetadata({
			kind: "node.wake",
			reason: params.wakeReason ?? "node.invoke",
			nodeId: params.nodeId
		})
	};
}
function resolveExecApprovalAlertBody() {
	return EXEC_APPROVAL_GENERIC_ALERT_BODY;
}
function createApnsApprovalAlertPayload(params) {
	return {
		aps: {
			alert: {
				title: params.title,
				body: params.body
			},
			sound: "default",
			category: params.category,
			"content-available": 1
		},
		operator: {
			kind: `${params.kind}.approval.requested`,
			approvalId: params.approvalId,
			gatewayDeviceId: params.gatewayDeviceId,
			ts: Date.now()
		}
	};
}
function resolvePluginApprovalAlertBody(description) {
	const body = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(description) ?? "";
	if (body.length <= PLUGIN_APPROVAL_ALERT_BODY_MAX_LENGTH) return body;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(body, PLUGIN_APPROVAL_ALERT_BODY_MAX_LENGTH - 1).trimEnd()}…`;
}
function createApnsApprovalResolvedPayload(params) {
	return {
		aps: { "content-available": 1 },
		operator: {
			kind: `${params.kind}.approval.resolved`,
			approvalId: params.approvalId,
			gatewayDeviceId: params.gatewayDeviceId,
			ts: Date.now()
		}
	};
}
//#endregion
//#region src/infra/push-apns.ts
const EXEC_APPROVAL_NOTIFICATION_CATEGORY = "operator.exec-approval";
const PLUGIN_APPROVAL_NOTIFICATION_CATEGORY = "operator.plugin-approval";
const APNS_JWT_TTL_MS = 3e3 * 1e3;
const DEFAULT_APNS_TIMEOUT_MS = 1e4;
let cachedJwt = null;
function parseReason(body) {
	const trimmed = body.trim();
	if (!trimmed) return;
	try {
		const parsed = JSON.parse(trimmed);
		return typeof parsed.reason === "string" && parsed.reason.trim().length > 0 ? parsed.reason.trim() : (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, 200);
	} catch {
		return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, 200);
	}
}
function toBase64UrlBytes(value) {
	return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function toBase64UrlJson(value) {
	return toBase64UrlBytes(Buffer.from(JSON.stringify(value)));
}
function getJwtCacheKey(auth) {
	const keyHash = (0, node_crypto.createHash)("sha256").update(auth.privateKey).digest("hex");
	return `${auth.teamId}:${auth.keyId}:${keyHash}`;
}
function getApnsBearerToken(auth, nowMs = Date.now()) {
	const cacheKey = getJwtCacheKey(auth);
	if (cachedJwt && cachedJwt.cacheKey === cacheKey && nowMs < cachedJwt.expiresAtMs) return cachedJwt.token;
	const iat = Math.floor(nowMs / 1e3);
	const signingInput = `${toBase64UrlJson({
		alg: "ES256",
		kid: auth.keyId,
		typ: "JWT"
	})}.${toBase64UrlJson({
		iss: auth.teamId,
		iat
	})}`;
	const token = `${signingInput}.${toBase64UrlBytes((0, node_crypto.sign)("sha256", Buffer.from(signingInput, "utf8"), {
		key: (0, node_crypto.createPrivateKey)(auth.privateKey),
		dsaEncoding: "ieee-p1363"
	}))}`;
	cachedJwt = {
		cacheKey,
		token,
		expiresAtMs: nowMs + APNS_JWT_TTL_MS
	};
	return token;
}
function normalizePrivateKey(value) {
	return value.trim().replace(/\\n/g, "\n");
}
function normalizeNonEmptyString(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
	return trimmed.length > 0 ? trimmed : null;
}
/** Returns true for APNs responses that mean the direct device token is no longer usable. */
function shouldInvalidateApnsRegistration(result) {
	if (result.status === 410) return true;
	return result.status === 400 && result.reason?.trim() === "BadDeviceToken";
}
/** Decides whether a failed direct push should clear the persisted registration. */
function shouldClearStoredApnsRegistration(params) {
	if (params.registration.transport !== "direct") return false;
	if (params.overrideEnvironment && params.overrideEnvironment !== params.registration.environment) return false;
	return shouldInvalidateApnsRegistration(params.result);
}
/** Resolves direct APNs provider auth from env, accepting inline or file-backed keys. */
async function resolveApnsAuthConfigFromEnv(env = process.env) {
	const teamId = normalizeNonEmptyString(env.OPERATOR_APNS_TEAM_ID);
	const keyId = normalizeNonEmptyString(env.OPERATOR_APNS_KEY_ID);
	if (!teamId || !keyId) return {
		ok: false,
		error: "APNs auth missing: set OPERATOR_APNS_TEAM_ID and OPERATOR_APNS_KEY_ID"
	};
	const inlineKeyRaw = normalizeNonEmptyString(env.OPERATOR_APNS_PRIVATE_KEY_P8) ?? normalizeNonEmptyString(env.OPERATOR_APNS_PRIVATE_KEY);
	if (inlineKeyRaw) return {
		ok: true,
		value: {
			teamId,
			keyId,
			privateKey: normalizePrivateKey(inlineKeyRaw)
		}
	};
	const keyPath = normalizeNonEmptyString(env.OPERATOR_APNS_PRIVATE_KEY_PATH);
	if (!keyPath) return {
		ok: false,
		error: "APNs private key missing: set OPERATOR_APNS_PRIVATE_KEY_P8 or OPERATOR_APNS_PRIVATE_KEY_PATH"
	};
	try {
		return {
			ok: true,
			value: {
				teamId,
				keyId,
				privateKey: normalizePrivateKey(await node_fs_promises.default.readFile(keyPath, "utf8"))
			}
		};
	} catch (err) {
		return {
			ok: false,
			error: `failed reading OPERATOR_APNS_PRIVATE_KEY_PATH (${keyPath}): ${require_errors.formatErrorMessage(err)}`
		};
	}
}
async function sendApnsRequest(params) {
	const authority = params.environment === "production" ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
	const body = JSON.stringify(params.payload);
	const requestPath = `/3/device/${params.token}`;
	const client = await connectApnsHttp2Session({
		authority,
		timeoutMs: params.timeoutMs
	});
	return await new Promise((resolve, reject) => {
		let settled = false;
		const fail = (err) => {
			if (settled) return;
			settled = true;
			client.destroy();
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(err, "Non-Error rejection"));
		};
		const finish = (result) => {
			if (settled) return;
			settled = true;
			client.close();
			resolve(result);
		};
		client.once("error", (err) => fail(err));
		const req = client.request({
			":method": "POST",
			":path": requestPath,
			authorization: `bearer ${params.bearerToken}`,
			"apns-topic": params.topic,
			"apns-push-type": params.pushType,
			"apns-priority": params.priority,
			"apns-expiration": "0",
			"content-type": "application/json",
			"content-length": Buffer.byteLength(body).toString()
		});
		let statusCode = 0;
		let apnsId;
		const responseBody = createApnsResponseBodyCapture();
		req.setEncoding("utf8");
		req.setTimeout(params.timeoutMs, () => {
			req.close(APNS_HTTP2_CANCEL_CODE);
			fail(/* @__PURE__ */ new Error(`APNs request timed out after ${params.timeoutMs}ms`));
		});
		req.on("response", (headers) => {
			statusCode = headers[":status"] ?? 0;
			const idHeader = headers["apns-id"];
			if (typeof idHeader === "string" && idHeader.trim().length > 0) apnsId = idHeader.trim();
		});
		req.on("data", (chunk) => {
			if (typeof chunk === "string") appendApnsResponseBodyCapture(responseBody, chunk);
		});
		req.on("end", () => {
			finish({
				status: statusCode,
				apnsId,
				body: responseBody.text
			});
		});
		req.on("error", (err) => fail(err));
		req.end(body);
	});
}
function resolveApnsTimeoutMs(timeoutMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(timeoutMs, DEFAULT_APNS_TIMEOUT_MS, 1e3);
}
function resolveDirectSendContext(params) {
	const token = require_push_apns_store.normalizeApnsToken(params.registration.token);
	if (!require_push_apns_store.isLikelyApnsToken(token)) throw new Error("invalid APNs token");
	const topic = require_push_apns_store.normalizeApnsTopic(params.registration.topic);
	if (!require_push_apns_store.isValidApnsTopic(topic)) throw new Error("topic required");
	return {
		token,
		topic,
		environment: params.registration.environment,
		bearerToken: getApnsBearerToken(params.auth)
	};
}
function resolveRegistrationDebugSuffix(registration, relayResult) {
	if (registration.transport === "direct") return registration.token.slice(-8);
	return relayResult?.tokenSuffix ?? registration.tokenDebugSuffix ?? registration.relayHandle.slice(-8);
}
function toPushResult(params) {
	const response = "body" in params.response ? {
		ok: params.response.status === 200,
		status: params.response.status,
		apnsId: params.response.apnsId,
		reason: parseReason(params.response.body),
		environment: params.registration.environment,
		tokenSuffix: params.tokenSuffix
	} : params.response;
	return {
		ok: response.ok,
		status: response.status,
		apnsId: response.apnsId,
		reason: response.reason,
		tokenSuffix: params.tokenSuffix ?? resolveRegistrationDebugSuffix(params.registration, "tokenSuffix" in response ? response : void 0),
		topic: params.registration.topic,
		environment: response.environment ?? params.registration.environment,
		transport: params.registration.transport
	};
}
async function sendDirectApnsPush(params) {
	const { token, topic, environment, bearerToken } = resolveDirectSendContext({
		auth: params.auth,
		registration: params.registration
	});
	const response = await (params.requestSender ?? sendApnsRequest)({
		token,
		topic,
		environment,
		bearerToken,
		payload: params.payload,
		timeoutMs: resolveApnsTimeoutMs(params.timeoutMs),
		pushType: params.pushType,
		priority: params.priority
	});
	return toPushResult({
		registration: params.registration,
		response,
		tokenSuffix: token.slice(-8)
	});
}
async function sendRelayApnsPush(params) {
	const response = await require_push_apns_store.sendApnsRelayPush({
		relayConfig: params.relayConfig,
		sendGrant: params.registration.sendGrant,
		relayHandle: params.registration.relayHandle,
		payload: params.payload,
		pushType: params.pushType,
		priority: params.priority,
		gatewayIdentity: params.gatewayIdentity,
		requestSender: params.requestSender
	});
	return toPushResult({
		registration: params.registration,
		response
	});
}
/** Sends a visible APNs alert via direct APNs token or relay registration. */
async function sendApnsAlert(params) {
	const payload = createApnsAlertPayload({
		nodeId: params.nodeId,
		title: params.title,
		body: params.body
	});
	if (params.registration.transport === "relay") {
		const relayParams = params;
		return await sendRelayApnsPush({
			relayConfig: relayParams.relayConfig,
			registration: relayParams.registration,
			payload,
			pushType: "alert",
			priority: "10",
			gatewayIdentity: relayParams.relayGatewayIdentity,
			requestSender: relayParams.relayRequestSender
		});
	}
	const directParams = params;
	return await sendDirectApnsPush({
		auth: directParams.auth,
		registration: directParams.registration,
		payload,
		timeoutMs: directParams.timeoutMs,
		requestSender: directParams.requestSender,
		pushType: "alert",
		priority: "10"
	});
}
/** Sends a silent background wake via direct APNs token or relay registration. */
async function sendApnsBackgroundWake(params) {
	const payload = createApnsBackgroundPayload({
		nodeId: params.nodeId,
		wakeReason: params.wakeReason
	});
	if (params.registration.transport === "relay") {
		const relayParams = params;
		return await sendRelayApnsPush({
			relayConfig: relayParams.relayConfig,
			registration: relayParams.registration,
			payload,
			pushType: "background",
			priority: "5",
			gatewayIdentity: relayParams.relayGatewayIdentity,
			requestSender: relayParams.relayRequestSender
		});
	}
	const directParams = params;
	return await sendDirectApnsPush({
		auth: directParams.auth,
		registration: directParams.registration,
		payload,
		timeoutMs: directParams.timeoutMs,
		requestSender: directParams.requestSender,
		pushType: "background",
		priority: "5"
	});
}
async function sendApnsApprovalPush(params) {
	const transport = params.transport;
	if (transport.registration.transport === "relay") {
		const relayParams = transport;
		return await sendRelayApnsPush({
			relayConfig: relayParams.relayConfig,
			registration: relayParams.registration,
			payload: params.payload,
			pushType: params.pushType,
			priority: params.priority,
			gatewayIdentity: relayParams.relayGatewayIdentity,
			requestSender: relayParams.relayRequestSender
		});
	}
	const directParams = transport;
	return await sendDirectApnsPush({
		auth: directParams.auth,
		registration: directParams.registration,
		payload: params.payload,
		timeoutMs: directParams.timeoutMs,
		requestSender: directParams.requestSender,
		pushType: params.pushType,
		priority: params.priority
	});
}
/** Sends an exec-approval alert notification via direct APNs or relay. */
async function sendApnsExecApprovalAlert(params) {
	return await sendApnsApprovalPush({
		transport: params,
		payload: createApnsApprovalAlertPayload({
			kind: "exec",
			approvalId: params.approvalId,
			gatewayDeviceId: params.gatewayDeviceId,
			title: "Exec approval required",
			body: resolveExecApprovalAlertBody(),
			category: EXEC_APPROVAL_NOTIFICATION_CATEGORY
		}),
		pushType: "alert",
		priority: "10"
	});
}
/** Sends a plugin-approval alert notification via direct APNs or relay. */
async function sendApnsPluginApprovalAlert(params) {
	return await sendApnsApprovalPush({
		transport: params,
		payload: createApnsApprovalAlertPayload({
			kind: "plugin",
			approvalId: params.approvalId,
			gatewayDeviceId: params.gatewayDeviceId,
			title: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.title) ?? "Approval required",
			body: resolvePluginApprovalAlertBody(params.description),
			category: PLUGIN_APPROVAL_NOTIFICATION_CATEGORY
		}),
		pushType: "alert",
		priority: "10"
	});
}
async function sendApnsApprovalResolvedWake(params) {
	return await sendApnsApprovalPush({
		transport: params.transport,
		payload: createApnsApprovalResolvedPayload({
			kind: params.kind,
			approvalId: params.transport.approvalId,
			gatewayDeviceId: params.transport.gatewayDeviceId
		}),
		pushType: "background",
		priority: "5"
	});
}
/** Sends a silent wake telling the app an exec approval changed state. */
async function sendApnsExecApprovalResolvedWake(params) {
	return await sendApnsApprovalResolvedWake({
		transport: params,
		kind: "exec"
	});
}
/** Sends a silent wake telling the app a plugin approval changed state. */
async function sendApnsPluginApprovalResolvedWake(params) {
	return await sendApnsApprovalResolvedWake({
		transport: params,
		kind: "plugin"
	});
}
//#endregion
Object.defineProperty(exports, "resolveApnsAuthConfigFromEnv", {
	enumerable: true,
	get: function() {
		return resolveApnsAuthConfigFromEnv;
	}
});
Object.defineProperty(exports, "sendApnsAlert", {
	enumerable: true,
	get: function() {
		return sendApnsAlert;
	}
});
Object.defineProperty(exports, "sendApnsBackgroundWake", {
	enumerable: true,
	get: function() {
		return sendApnsBackgroundWake;
	}
});
Object.defineProperty(exports, "sendApnsExecApprovalAlert", {
	enumerable: true,
	get: function() {
		return sendApnsExecApprovalAlert;
	}
});
Object.defineProperty(exports, "sendApnsExecApprovalResolvedWake", {
	enumerable: true,
	get: function() {
		return sendApnsExecApprovalResolvedWake;
	}
});
Object.defineProperty(exports, "sendApnsPluginApprovalAlert", {
	enumerable: true,
	get: function() {
		return sendApnsPluginApprovalAlert;
	}
});
Object.defineProperty(exports, "sendApnsPluginApprovalResolvedWake", {
	enumerable: true,
	get: function() {
		return sendApnsPluginApprovalResolvedWake;
	}
});
Object.defineProperty(exports, "shouldClearStoredApnsRegistration", {
	enumerable: true,
	get: function() {
		return shouldClearStoredApnsRegistration;
	}
});
