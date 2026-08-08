require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_worker_admission = require("./worker-admission-DNxVcwiA.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_worker_inference = require("./worker-inference-Dfl4hXJC.cjs");
const require_handshake_auth_log_limiter = require("./handshake-auth-log-limiter-CtNayawM.cjs");
const require_diagnostic_payload = require("./diagnostic-payload-D1efA3wp.cjs");
const require_server_constants = require("./server-constants-CESgKlPt.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
const require_ws_shared_generation = require("./ws-shared-generation-Bcwr1LuX.cjs");
require("./server-utils-Cs8RsB0Z.cjs");
const require_system_presence = require("./system-presence-B9QPXvl5.cjs");
const require_health_state = require("./health-state-BQvfPUgE.cjs");
const require_startup_unavailable = require("./startup-unavailable-CFwHGTa9.cjs");
const require_nodes_wake_state = require("./nodes-wake-state-hWzDuFh6.cjs");
const require_presence_events = require("./presence-events-D_eQAngq.cjs");
const require_ws_types = require("./ws-types-CNyp8v1S.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/gateway/hosted-plugin-surface-url.ts
const normalizeHost = (value, rejectLoopback) => {
	if (!value) return "";
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (rejectLoopback && require_net.isLoopbackHost(trimmed)) return "";
	return trimmed;
};
const parseHostHeader = (value) => {
	if (!value) return { host: "" };
	try {
		const parsed = new URL(`http://${value.trim()}`);
		const port = require_parse_finite_number.parseStrictPositiveInteger(parsed.port.trim());
		return {
			host: parsed.hostname,
			port: Number.isFinite(port) ? port : void 0
		};
	} catch {
		return { host: "" };
	}
};
const parseForwardedProto = (value) => {
	if (Array.isArray(value)) return value[0];
	return value;
};
const parseForwardedHost = (value) => {
	return (Array.isArray(value) ? value[0] : value)?.split(",")[0]?.trim();
};
/** Resolve the URL that plugins should advertise for hosted node surfaces. */
function resolveHostedPluginSurfaceUrl(params) {
	const port = params.port;
	if (!port) return;
	const scheme = parseForwardedProto(params.forwardedProto)?.trim() === "https" ? "https" : params.scheme ?? "http";
	const override = normalizeHost(params.hostOverride, true);
	const forwardedHostRaw = parseForwardedHost(params.forwardedHost);
	const parsedForwardedHost = parseHostHeader(forwardedHostRaw);
	const parsedRequestHost = parseHostHeader(params.requestHost);
	const requestHost = normalizeHost(parsedRequestHost.host, Boolean(override));
	const forwardedHost = normalizeHost(parsedForwardedHost.host, Boolean(override));
	const advertisedHost = forwardedHost ? parsedForwardedHost : parsedRequestHost;
	const localAddress = normalizeHost(params.localAddress, Boolean(override || forwardedHost || requestHost));
	const host = override || forwardedHost || requestHost || localAddress;
	if (!host) return;
	let exposedPort = port;
	if (!override && (forwardedHost || requestHost) && port === 18789) {
		if (advertisedHost.port && advertisedHost.port > 0) exposedPort = advertisedHost.port;
		else if (scheme === "https") exposedPort = 443;
		else if (scheme === "http") exposedPort = 80;
	}
	return `${scheme}://${host.includes(":") ? `[${host}]` : host}:${exposedPort}`;
}
//#endregion
//#region src/gateway/server/ws-connection/worker-connection.ts
const MAX_QUEUED_WORKER_FRAMES = 16;
const MAX_QUEUED_WORKER_BYTES = 32 * 1024 * 1024;
function workerProtocolError(reason, options = {}) {
	return {
		code: options.code ?? require_error_codes.ErrorCodes.INVALID_REQUEST,
		message: options.message ?? "worker protocol request rejected",
		details: { reason },
		...options.retryable === void 0 ? {} : { retryable: options.retryable },
		...options.retryAfterMs === void 0 ? {} : { retryAfterMs: options.retryAfterMs }
	};
}
function workerMaxPayload(identity) {
	return identity.protocolFeatures.includes("worker-inference-v1") ? require_worker_inference.WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES : require_worker_admission.WORKER_PROTOCOL_MAX_PAYLOAD_BYTES;
}
function buildWorkerHello(identity) {
	return {
		type: "worker-hello-ok",
		environmentId: identity.environmentId,
		sessionId: identity.sessionId,
		ownerEpoch: identity.ownerEpoch,
		rpcSetVersion: identity.rpcSetVersion,
		protocolFeatures: [...identity.protocolFeatures],
		credentialExpiresAtMs: identity.credentialExpiresAtMs,
		policy: {
			heartbeatIntervalMs: require_worker_admission.WORKER_HEARTBEAT_INTERVAL_MS,
			maxPayload: workerMaxPayload(identity)
		}
	};
}
function rejectWorkerRequest(params) {
	params.warn(`worker protocol request rejected reason=${params.reason}`);
	params.respond(false, void 0, workerProtocolError(params.reason));
	queueMicrotask(() => params.close(1008, params.reason));
}
function workerTranscriptCommitError(reason) {
	return {
		code: require_error_codes.ErrorCodes.INVALID_REQUEST,
		message: "worker transcript commit rejected",
		details: { reason }
	};
}
function workerLiveEventError(details) {
	return {
		code: require_error_codes.ErrorCodes.INVALID_REQUEST,
		message: "worker live event rejected",
		details
	};
}
function workerInferenceError(reason) {
	return {
		code: reason === "provider-error" ? require_error_codes.ErrorCodes.UNAVAILABLE : require_error_codes.ErrorCodes.INVALID_REQUEST,
		message: "worker inference request rejected",
		details: { reason }
	};
}
function setSocketMaxPayload(socket, maxPayload) {
	const receiver = socket["_receiver"];
	if (receiver) receiver["_maxPayload"] = maxPayload;
}
/** Closed worker dispatcher. It never calls the generic gateway method registry. */
async function dispatchWorkerRequest(params) {
	const service = params.service;
	if (!service) {
		rejectWorkerRequest({
			...params,
			reason: "environment-unavailable"
		});
		return;
	}
	const ownershipFailure = service.validateWorkerConnection(params.identity);
	if (ownershipFailure) {
		rejectWorkerRequest({
			...params,
			reason: ownershipFailure
		});
		return;
	}
	if (params.request.method === require_worker_inference.WORKER_INFERENCE_METHODS[0]) {
		if (!params.identity.protocolFeatures.includes("worker-inference-v1")) {
			rejectWorkerRequest({
				...params,
				reason: "method-not-allowed"
			});
			return;
		}
		if (!require_worker_inference.validateWorkerInferenceStartParams(params.request.params)) {
			params.respond(false, void 0, workerInferenceError("invalid-context"));
			return;
		}
		if (!service.startInference) {
			rejectWorkerRequest({
				...params,
				reason: "method-not-allowed"
			});
			return;
		}
		const outcome = service.startInference(params.identity, params.request.params, {
			connectionId: params.connectionId,
			send: (frame) => params.send(frame)
		});
		if (outcome.ok) {
			params.respond(true, outcome.result);
			outcome.launch();
			return;
		}
		if ("closeReason" in outcome) {
			rejectWorkerRequest({
				...params,
				reason: outcome.closeReason
			});
			return;
		}
		params.respond(false, void 0, workerInferenceError(outcome.reason));
		return;
	}
	if (params.request.method === require_worker_inference.WORKER_INFERENCE_METHODS[1]) {
		if (!params.identity.protocolFeatures.includes("worker-inference-v1")) {
			rejectWorkerRequest({
				...params,
				reason: "method-not-allowed"
			});
			return;
		}
		if (!require_worker_inference.validateWorkerInferenceCancelParams(params.request.params)) {
			params.respond(false, void 0, workerInferenceError("invalid-context"));
			return;
		}
		if (!service.cancelInference) {
			rejectWorkerRequest({
				...params,
				reason: "method-not-allowed"
			});
			return;
		}
		const outcome = service.cancelInference(params.identity, params.request.params);
		if (outcome.ok) {
			params.respond(true, outcome.result);
			return;
		}
		if ("closeReason" in outcome) {
			rejectWorkerRequest({
				...params,
				reason: outcome.closeReason
			});
			return;
		}
		params.respond(false, void 0, workerInferenceError(outcome.reason));
		return;
	}
	if (params.request.method === require_worker_admission.WORKER_PROTOCOL_METHODS[1]) {
		if (!params.identity.protocolFeatures.includes("worker-transcript-commit-v1")) {
			rejectWorkerRequest({
				...params,
				reason: "method-not-allowed"
			});
			return;
		}
		if (!require_src.validateWorkerTranscriptCommitParams(params.request.params)) {
			params.respond(false, void 0, workerTranscriptCommitError("invalid-batch"));
			return;
		}
		const outcome = await service.commitTranscript(params.identity, params.request.params);
		if (outcome.ok) {
			params.respond(true, outcome.result);
			return;
		}
		if ("closeReason" in outcome) {
			rejectWorkerRequest({
				...params,
				reason: outcome.closeReason
			});
			return;
		}
		params.respond(false, void 0, workerTranscriptCommitError(outcome.reason));
		return;
	}
	if (params.request.method === require_worker_admission.WORKER_PROTOCOL_METHODS[2]) {
		if (!params.identity.protocolFeatures.includes("worker-live-event-v1")) {
			rejectWorkerRequest({
				...params,
				reason: "method-not-allowed"
			});
			return;
		}
		if (!require_src.validateWorkerLiveEventParams(params.request.params)) {
			params.respond(false, void 0, workerLiveEventError({ reason: "invalid-event" }));
			return;
		}
		const outcome = await service.pushLiveEvent(params.identity, params.request.params);
		if (outcome.ok) {
			params.respond(true, outcome.result);
			return;
		}
		if ("closeReason" in outcome) {
			rejectWorkerRequest({
				...params,
				reason: outcome.closeReason
			});
			return;
		}
		params.respond(false, void 0, workerLiveEventError(outcome.details));
		return;
	}
	if (params.request.method !== require_worker_admission.WORKER_PROTOCOL_METHODS[0]) {
		rejectWorkerRequest({
			...params,
			reason: "method-not-allowed"
		});
		return;
	}
	if (!require_src.validateWorkerHeartbeatParams(params.request.params)) {
		rejectWorkerRequest({
			...params,
			reason: "invalid-heartbeat"
		});
		return;
	}
	const result = {
		receivedAtMs: Date.now(),
		status: "ok",
		ownerEpoch: params.identity.ownerEpoch
	};
	params.respond(true, result);
}
/** Dedicated ingress handler: worker frames never enter the generic message handler. */
function attachWorkerWsMessageHandler(params) {
	let expiryTimer;
	let disposed = false;
	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		clearTimeout(expiryTimer);
		params.socket.off("message", onMessage);
	};
	const closeWorker = (code, reason) => {
		cleanup();
		params.close(code, reason);
	};
	const failHandshake = (code, reason) => {
		params.setHandshakeState("failed");
		params.setCloseCause(reason);
		params.logWsControl.warn(`worker admission rejected reason=${reason}`);
		closeWorker(code, reason);
	};
	const failFrame = (code, reason) => {
		params.setCloseCause(reason);
		params.logGateway.warn(`worker protocol request rejected reason=${reason}`);
		closeWorker(code, reason);
	};
	const sendError = (id, reason, error = workerProtocolError(reason), code = 1008) => {
		params.send({
			type: "res",
			id,
			ok: false,
			error
		});
		queueMicrotask(() => closeWorker(code, reason));
	};
	const rejectAdmission = (id, reason, error = workerProtocolError(reason, { message: "worker admission rejected" }), code = 1008) => {
		params.setHandshakeState("failed");
		params.setCloseCause(reason);
		params.logWsControl.warn(`worker admission rejected reason=${reason}`);
		sendError(id, reason, error, code);
	};
	const handleConnect = async (connect, id, admissionOpen) => {
		if (!admissionOpen || params.isStartupPending?.()) {
			rejectAdmission(id, "gateway-unavailable", workerProtocolError("gateway-unavailable", {
				code: require_error_codes.ErrorCodes.UNAVAILABLE,
				message: "worker gateway unavailable",
				retryable: true,
				retryAfterMs: 500
			}), 1013);
			return;
		}
		if (connect.minProtocol > 4 || connect.maxProtocol < 4) {
			rejectAdmission(id, "protocol-mismatch");
			return;
		}
		const admission = await params.service?.admitWorker(connect.admission) ?? {
			ok: false,
			reason: "environment-unavailable"
		};
		if (!admission.ok) {
			rejectAdmission(id, admission.reason);
			return;
		}
		const ownershipFailure = params.service?.validateWorkerConnection(admission.identity);
		if (ownershipFailure) {
			rejectAdmission(id, ownershipFailure);
			return;
		}
		const client = {
			socket: params.socket,
			connect: {
				minProtocol: connect.minProtocol,
				maxProtocol: connect.maxProtocol,
				client: connect.client,
				role: "worker",
				scopes: []
			},
			connId: params.connId,
			connectionKind: "worker",
			worker: admission.identity,
			usesSharedGatewayAuth: false
		};
		params.clearHandshakeTimer();
		params.advanceHandshakePhase("auth_validated");
		if (!params.setClient(client)) {
			params.setHandshakeState("failed");
			return;
		}
		params.setHandshakeState("connected");
		params.advanceHandshakePhase("session_attached");
		setSocketMaxPayload(params.socket, workerMaxPayload(admission.identity));
		params.advanceHandshakePhase("hello_payload_prepared");
		params.send({
			type: "res",
			id,
			ok: true,
			payload: buildWorkerHello(admission.identity)
		});
		params.advanceHandshakePhase("ready");
		expiryTimer = setTimeout(() => closeWorker(1008, "credential-expired"), Math.max(0, admission.identity.credentialExpiresAtMs - Date.now()));
		expiryTimer.unref?.();
	};
	const handleMessage = async (data, admissionOpen) => {
		const client = params.getClient();
		if (client?.invalidated) {
			failFrame(1008, "credential-replaced");
			return;
		}
		if (client && !admissionOpen) {
			failFrame(1013, "gateway-unavailable");
			return;
		}
		const frameBytes = require_handshake_auth_log_limiter.rawDataByteLength(data);
		if (frameBytes > (client?.worker ? workerMaxPayload(client.worker) : 65536)) {
			if (client) failFrame(1009, "invalid-frame");
			else failHandshake(1009, "invalid-handshake");
			return;
		}
		let parsed;
		try {
			parsed = JSON.parse(require_handshake_auth_log_limiter.rawDataToString(data));
		} catch {
			if (client) failFrame(1008, "invalid-frame");
			else failHandshake(1008, "invalid-handshake");
			return;
		}
		if (!client) {
			if (!require_src.validateWorkerConnectRequestFrame(parsed)) {
				failHandshake(1008, "invalid-handshake");
				return;
			}
			params.setLastFrameMeta({
				type: "req",
				method: "connect"
			});
			await handleConnect(parsed.params, parsed.id, admissionOpen);
			return;
		}
		if (!require_src.validateRequestFrame(parsed) || parsed.id.length > 128 || parsed.method.length > 64) {
			params.logGateway.warn("worker protocol request rejected reason=invalid-frame");
			closeWorker(1008, "invalid-frame");
			return;
		}
		if (frameBytes > 65536 && parsed.method !== require_worker_inference.WORKER_INFERENCE_METHODS[0]) {
			failFrame(1009, "invalid-frame");
			return;
		}
		if (parsed.method === require_worker_admission.WORKER_PROTOCOL_METHODS[0] || parsed.method === require_worker_admission.WORKER_PROTOCOL_METHODS[1] || parsed.method === require_worker_admission.WORKER_PROTOCOL_METHODS[2] || parsed.method === require_worker_inference.WORKER_INFERENCE_METHODS[0] || parsed.method === require_worker_inference.WORKER_INFERENCE_METHODS[1]) params.setLastFrameMeta({
			type: "req",
			method: parsed.method
		});
		if (!client.worker) {
			closeWorker(1008, "environment-unavailable");
			return;
		}
		await dispatchWorkerRequest({
			request: parsed,
			identity: client.worker,
			connectionId: params.connId,
			service: params.service,
			send: (frame) => params.send(frame),
			respond: (ok, payload, error) => params.send(ok ? {
				type: "res",
				id: parsed.id,
				ok,
				payload
			} : {
				type: "res",
				id: parsed.id,
				ok,
				error
			}),
			close: closeWorker,
			warn: (message) => params.logGateway.warn(message)
		});
	};
	let queue = Promise.resolve();
	let pendingFrames = 0;
	let pendingBytes = 0;
	function onMessage(data) {
		if (disposed) return;
		const frameBytes = require_handshake_auth_log_limiter.rawDataByteLength(data);
		if (pendingFrames >= MAX_QUEUED_WORKER_FRAMES || pendingBytes + frameBytes > MAX_QUEUED_WORKER_BYTES) {
			if (params.getClient()) failFrame(1008, "invalid-frame");
			else failHandshake(1008, "invalid-handshake");
			return;
		}
		pendingFrames += 1;
		pendingBytes += frameBytes;
		queue = queue.then(async () => {
			if (disposed || params.isClosed()) return;
			const admission = require_gateway_work_admission.tryBeginGatewayRootWorkAdmission();
			if (!admission) {
				await handleMessage(data, false);
				return;
			}
			try {
				await admission.run(() => handleMessage(data, true));
			} finally {
				admission.release();
			}
		}).catch(() => {
			if (disposed) return;
			if (params.getClient()) failFrame(1011, "gateway-unavailable");
			else failHandshake(1011, "gateway-unavailable");
		}).finally(() => {
			pendingFrames -= 1;
			pendingBytes -= frameBytes;
		});
	}
	params.socket.on("message", onMessage);
	return cleanup;
}
//#endregion
//#region src/gateway/server/ws-connection.ts
const LOG_HEADER_MAX_LEN = 300;
const LOG_HEADER_FORMAT_REGEX = /\p{Cf}/gu;
const MAX_QUEUED_MESSAGE_HANDLER_FRAMES = 16;
const unauthorizedCloseBeforeConnectLogLimiter = new require_handshake_auth_log_limiter.HandshakeAuthLogLimiter();
function replaceControlChars(value) {
	let cleaned = "";
	for (const char of value) {
		const codePoint = char.codePointAt(0);
		if (codePoint !== void 0 && (codePoint <= 31 || codePoint >= 127 && codePoint <= 159)) {
			cleaned += " ";
			continue;
		}
		cleaned += char;
	}
	return cleaned;
}
function stringMetaValue(meta, key) {
	const value = meta[key];
	return typeof value === "string" && value.trim().length > 0 ? value : void 0;
}
const sanitizeLogValue = (value) => {
	if (!value) return;
	const cleaned = replaceControlChars(value).replace(LOG_HEADER_FORMAT_REGEX, " ").replace(/\s+/g, " ").trim();
	if (!cleaned) return;
	if (cleaned.length <= LOG_HEADER_MAX_LEN) return cleaned;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, LOG_HEADER_MAX_LEN);
};
function formatSocketEndpoint(address, port) {
	if (!address) return;
	if (port === void 0) return address;
	return address.includes(":") ? `[${address}]:${port}` : `${address}:${port}`;
}
function resolveSocketAddress(socket) {
	const rawSocket = socket["_socket"];
	const remoteAddr = rawSocket?.remoteAddress;
	const remotePort = rawSocket?.remotePort;
	const localAddr = rawSocket?.localAddress;
	const localPort = rawSocket?.localPort;
	const remoteEndpoint = formatSocketEndpoint(remoteAddr, remotePort);
	const localEndpoint = formatSocketEndpoint(localAddr, localPort);
	return {
		remoteAddr,
		remotePort,
		localAddr,
		localPort,
		endpoint: remoteEndpoint && localEndpoint ? `${remoteEndpoint}->${localEndpoint}` : remoteEndpoint ?? localEndpoint
	};
}
function isWsPayloadLimitError(err) {
	if (!err || typeof err !== "object") return false;
	if (err.code === "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH") return true;
	const message = err.message;
	return typeof message === "string" && /max payload size exceeded/i.test(message);
}
function attachGatewayWsMessageHandlerOnDemand(params) {
	const queued = [];
	const queueMessage = (data) => {
		if (queued.length >= MAX_QUEUED_MESSAGE_HANDLER_FRAMES) {
			params.setCloseCause("message-handler-loading-overflow", { queuedFrames: queued.length });
			params.close(1008, "gateway message handler loading");
			return;
		}
		queued.push(data);
	};
	params.socket.on("message", queueMessage);
	Promise.resolve().then(() => require("./message-handler-Dd8gzPWd.cjs")).then(({ attachGatewayWsMessageHandler }) => {
		params.socket.off("message", queueMessage);
		if (params.isClosed()) return;
		attachGatewayWsMessageHandler(params);
		for (const data of queued) params.socket.emit("message", data);
	}).catch((error) => {
		params.socket.off("message", queueMessage);
		params.setCloseCause("message-handler-load-failed", { error: require_errors.formatErrorMessage(error) });
		params.logWsControl.warn(`failed to load ws message handler conn=${params.connId}: ${require_errors.formatErrorMessage(error)}`);
		params.close(1011, "gateway message handler unavailable");
	});
}
function attachGatewayWsConnectionHandler(params) {
	const { wss, clients, preauthConnectionBudget, port, pluginSurfaceScheme, getPluginNodeCapabilities, resolvedAuth, getResolvedAuth = () => resolvedAuth, getRequiredSharedGatewaySessionGeneration = () => require_ws_shared_generation.resolveSharedGatewaySessionGeneration(getResolvedAuth(), require_io.getRuntimeConfig().gateway?.trustedProxies), rateLimiter, browserRateLimiter, nodeReapprovalCoordinator, isStartupPending, gatewayMethods, events, refreshHealthSnapshot, logGateway, logHealth, logWsControl, extraHandlers, getMethodRegistry, broadcast, buildRequestContext, workerConnectionService } = params;
	const originCheckMetrics = { hostHeaderFallbackAccepted: 0 };
	wss.on("connection", (socket, upgradeReq) => {
		let client = null;
		let closed = false;
		const openedAt = Date.now();
		const connId = (0, node_crypto.randomUUID)();
		const connectionKind = socket["__operatorConnectionKind"] ?? "gateway";
		const connectionPreauthBudget = socket["__operatorPreauthBudget"] ?? preauthConnectionBudget;
		const { remoteAddr, remotePort, localAddr, localPort, endpoint } = resolveSocketAddress(socket);
		const preauthBudgetKey = socket["__openclawPreauthBudgetKey"];
		socket["__openclawPreauthBudgetClaimed"] = true;
		const headerValue = (value) => Array.isArray(value) ? value[0] : value;
		const requestHost = headerValue(upgradeReq.headers.host);
		const requestOrigin = headerValue(upgradeReq.headers.origin);
		const requestUserAgent = headerValue(upgradeReq.headers["user-agent"]);
		const forwardedFor = headerValue(upgradeReq.headers["x-forwarded-for"]);
		const realIp = headerValue(upgradeReq.headers["x-real-ip"]);
		const openedDuringStartup = isStartupPending?.() === true;
		const pluginNodeCapabilities = connectionKind === "gateway" ? getPluginNodeCapabilities?.() ?? [] : [];
		const pluginSurfaceBaseUrl = pluginNodeCapabilities.length > 0 ? resolveHostedPluginSurfaceUrl({
			port,
			forwardedHost: upgradeReq.headers["x-forwarded-host"],
			requestHost: upgradeReq.headers.host,
			forwardedProto: upgradeReq.headers["x-forwarded-proto"],
			localAddress: upgradeReq.socket?.localAddress,
			scheme: pluginSurfaceScheme
		}) : void 0;
		require_ws_log.logWs("in", "open", {
			connId,
			remoteAddr,
			remotePort,
			localAddr,
			localPort,
			endpoint
		});
		let handshakeState = "pending";
		let lastHandshakePhase = "tcp_accepted";
		let holdsPreauthBudget = true;
		let closeCause;
		let closeMeta = {};
		let lastFrameType;
		let lastFrameMethod;
		let lastFrameId;
		let hasReceivedPreauthFrame = false;
		socket.once("message", () => {
			hasReceivedPreauthFrame = true;
		});
		const advanceHandshakePhase = (next) => {
			if (require_ws_types.WS_HANDSHAKE_PHASES.indexOf(next) > require_ws_types.WS_HANDSHAKE_PHASES.indexOf(lastHandshakePhase)) lastHandshakePhase = next;
		};
		const setCloseCause = (cause, meta) => {
			if (!closeCause) closeCause = cause;
			if (meta && Object.keys(meta).length > 0) closeMeta = {
				...closeMeta,
				...meta
			};
		};
		const releasePreauthBudget = () => {
			if (!holdsPreauthBudget) return;
			holdsPreauthBudget = false;
			connectionPreauthBudget.release(preauthBudgetKey);
		};
		const setLastFrameMeta = (meta) => {
			if (meta.type || meta.method || meta.id) {
				lastFrameType = meta.type ?? lastFrameType;
				lastFrameMethod = meta.method ?? lastFrameMethod;
				lastFrameId = meta.id ?? lastFrameId;
			}
		};
		let pingTimer;
		let cleanupWorkerConnection;
		let awaitingPong = false;
		const handshakeTimeoutMs = require_timeouts.resolvePreauthHandshakeTimeoutMs({ configuredTimeoutMs: params.preauthHandshakeTimeoutMs });
		const handshakeTimer = setTimeout(() => {
			if (!client) {
				handshakeState = "failed";
				setCloseCause("handshake-timeout", {
					handshakeMs: Date.now() - openedAt,
					endpoint,
					phase: lastHandshakePhase
				});
				logWsControl.warn(`handshake timeout conn=${connId} peer=${endpoint ?? "n/a"} remote=${remoteAddr ?? "?"} phase=${lastHandshakePhase}`);
				if (connectionKind === "worker") close(1008, "invalid-handshake");
				else close();
			}
		}, handshakeTimeoutMs);
		const close = (code = 1e3, reason) => {
			if (closed) return;
			closed = true;
			clearTimeout(handshakeTimer);
			if (pingTimer !== void 0) clearInterval(pingTimer);
			cleanupWorkerConnection?.();
			releasePreauthBudget();
			if (client) clients.delete(client);
			try {
				socket.close(code, reason);
			} catch {}
		};
		const send = (obj) => {
			if (closed) return;
			if (socket.bufferedAmount > 52428800) {
				require_diagnostic_payload.logRejectedLargePayload({
					surface: "gateway.ws.outbound_buffer",
					bytes: socket.bufferedAmount,
					limitBytes: require_server_constants.MAX_BUFFERED_BYTES,
					reason: "ws_send_buffer_close"
				});
				setCloseCause("outbound-buffer-exceeded", {
					bytes: socket.bufferedAmount,
					limitBytes: require_server_constants.MAX_BUFFERED_BYTES
				});
				close(1008, connectionKind === "worker" ? "slow-consumer" : "slow consumer");
				return;
			}
			try {
				socket.send(JSON.stringify(obj));
			} catch {}
		};
		const connectNonce = (0, node_crypto.randomUUID)();
		if (connectionKind === "gateway") send({
			type: "event",
			event: "connect.challenge",
			payload: {
				nonce: connectNonce,
				ts: Date.now()
			}
		});
		advanceHandshakePhase("ws_upgrade_started");
		socket.once("error", (err) => {
			if (isWsPayloadLimitError(err)) require_diagnostic_payload.logRejectedLargePayload({
				surface: client ? "gateway.ws.frame" : "gateway.ws.preauth",
				limitBytes: connectionKind === "worker" ? require_worker_admission.WORKER_PROTOCOL_MAX_PAYLOAD_BYTES : client ? require_server_constants.MAX_PAYLOAD_BYTES : require_server_constants.MAX_PREAUTH_PAYLOAD_BYTES,
				reason: client ? "ws_frame_limit" : "preauth_frame_limit"
			});
			logWsControl.warn(`error conn=${connId} remote=${remoteAddr ?? "?"}: ${require_errors.formatErrorMessage(err)}`);
			if (connectionKind === "worker") close(1008, client ? "invalid-frame" : "invalid-handshake");
			else close();
		});
		socket.on("pong", () => {
			awaitingPong = false;
		});
		const isNoisySwiftPmHelperClose = (userAgent, remote) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(userAgent).includes("swiftpm-testing-helper") && require_net.isLoopbackAddress(remote);
		const isExpectedLocalAppStartupAbort = (code) => openedDuringStartup && (code === 1001 || code === 1006) && lastHandshakePhase === "ws_upgrade_started" && !hasReceivedPreauthFrame && lastFrameType === void 0 && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(requestUserAgent).startsWith("openclaw/") && require_net.isLoopbackAddress(remoteAddr);
		socket.once("close", (code, reason) => {
			const durationMs = Date.now() - openedAt;
			const logForwardedFor = sanitizeLogValue(forwardedFor);
			const logOrigin = sanitizeLogValue(requestOrigin);
			const logHost = sanitizeLogValue(requestHost);
			const logUserAgent = sanitizeLogValue(requestUserAgent);
			const logReason = sanitizeLogValue(reason?.toString());
			const handshakeIncomplete = lastHandshakePhase !== "ready";
			const closeContext = {
				cause: closeCause,
				handshake: handshakeState,
				...handshakeIncomplete ? { phase: lastHandshakePhase } : {},
				durationMs,
				lastFrameType,
				lastFrameMethod,
				lastFrameId,
				host: logHost,
				origin: logOrigin,
				userAgent: logUserAgent,
				forwardedFor: logForwardedFor,
				remoteAddr,
				remotePort,
				localAddr,
				localPort,
				endpoint,
				...closeMeta
			};
			if (!client) {
				const isExpectedStartupRetryClose = closeCause === require_startup_unavailable.GATEWAY_STARTUP_PENDING_CLOSE_CAUSE;
				const logFn = isNoisySwiftPmHelperClose(requestUserAgent, remoteAddr) || isExpectedStartupRetryClose || isExpectedLocalAppStartupAbort(code) ? logWsControl.debug : logWsControl.warn;
				const authReason = stringMetaValue(closeMeta, "authReason");
				const closeLogDecision = closeCause === "unauthorized" && require_handshake_auth_log_limiter.shouldLimitMissingCredentialAuthLog({
					reason: authReason,
					authProvided: "none"
				}) ? unauthorizedCloseBeforeConnectLogLimiter.register(require_handshake_auth_log_limiter.buildHandshakeAuthLogKey({
					reason: authReason,
					remoteAddr,
					client: stringMetaValue(closeMeta, "clientDisplayName") ?? stringMetaValue(closeMeta, "client"),
					mode: stringMetaValue(closeMeta, "mode"),
					authProvided: "none"
				})) : {
					shouldLog: true,
					suppressedSinceLastLog: 0
				};
				if (closeLogDecision.shouldLog) {
					const suppressedText = closeLogDecision.suppressedSinceLastLog > 0 ? ` suppressed=${closeLogDecision.suppressedSinceLastLog}` : "";
					logFn(`closed before connect conn=${connId} peer=${endpoint ?? "n/a"} remote=${remoteAddr ?? "?"} fwd=${logForwardedFor || "n/a"} origin=${logOrigin || "n/a"} host=${logHost || "n/a"} ua=${logUserAgent || "n/a"} code=${code ?? "n/a"} reason=${logReason || "n/a"} phase=${lastHandshakePhase}${suppressedText}`, closeContext);
				}
			}
			if (client && require_message_channel.isWebchatClient(client.connect.client)) logWsControl.info(`webchat disconnected code=${code} reason=${logReason || "n/a"} conn=${connId}`);
			if (connectionKind === "gateway") {
				const context = buildRequestContext();
				context.unsubscribeAllSessionEvents(connId);
				context.terminalSessions?.handleDisconnect(connId);
				let currentDisconnectedNodeId = null;
				if (client?.connect?.role === "node") currentDisconnectedNodeId = context.nodeRegistry.unregister(connId);
				if (client?.presenceKey && (client.connect.role !== "node" || currentDisconnectedNodeId !== null)) {
					require_system_presence.upsertPresence(client.presenceKey, { reason: "disconnect" });
					require_presence_events.broadcastPresenceSnapshot({
						broadcast,
						incrementPresenceVersion: require_health_state.incrementPresenceVersion,
						getHealthVersion: require_health_state.getHealthVersion
					});
				}
				if (currentDisconnectedNodeId) {
					require_remote.removeRemoteNodeInfo(currentDisconnectedNodeId);
					context.nodeUnsubscribeAll(currentDisconnectedNodeId);
					require_nodes_wake_state.clearNodeWakeState(currentDisconnectedNodeId);
				}
			}
			require_ws_log.logWs("out", "close", {
				connId,
				code,
				reason: logReason,
				durationMs,
				cause: closeCause,
				handshake: handshakeState,
				...handshakeIncomplete ? { phase: lastHandshakePhase } : {},
				lastFrameType,
				lastFrameMethod,
				lastFrameId,
				endpoint
			});
			close();
		});
		const setClient = (next) => {
			if (closed) return false;
			if (next.worker) {
				for (const existing of clients) if (existing.worker?.environmentId === next.worker.environmentId) {
					existing.invalidated = true;
					clients.delete(existing);
					try {
						existing.socket.terminate();
					} catch {
						existing.socket.close(1008, "credential-replaced");
					}
				}
			}
			releasePreauthBudget();
			client = next;
			clients.add(next);
			pingTimer = setInterval(() => {
				if (awaitingPong) {
					setCloseCause("heartbeat-timeout");
					try {
						socket.terminate();
					} catch {
						close();
					}
					return;
				}
				awaitingPong = true;
				try {
					socket.ping();
				} catch {}
			}, 25e3);
			return true;
		};
		if (connectionKind === "worker") {
			cleanupWorkerConnection = attachWorkerWsMessageHandler({
				socket,
				connId,
				service: workerConnectionService,
				isStartupPending,
				send,
				close,
				isClosed: () => closed,
				clearHandshakeTimer: () => clearTimeout(handshakeTimer),
				getClient: () => client,
				setClient,
				setHandshakeState: (next) => {
					handshakeState = next;
				},
				advanceHandshakePhase,
				setCloseCause,
				setLastFrameMeta,
				logGateway,
				logWsControl
			});
			return;
		}
		attachGatewayWsMessageHandlerOnDemand({
			socket,
			upgradeReq,
			connId,
			remoteAddr,
			remotePort,
			localAddr,
			localPort,
			endpoint,
			forwardedFor,
			realIp,
			requestHost,
			requestOrigin,
			requestUserAgent,
			pluginSurfaceBaseUrl,
			pluginNodeCapabilities,
			connectNonce,
			getResolvedAuth,
			getRequiredSharedGatewaySessionGeneration,
			rateLimiter,
			browserRateLimiter,
			nodeReapprovalCoordinator,
			isStartupPending,
			gatewayMethods,
			events,
			extraHandlers,
			getMethodRegistry,
			buildRequestContext,
			refreshHealthSnapshot,
			send,
			close,
			isClosed: () => closed,
			clearHandshakeTimer: () => clearTimeout(handshakeTimer),
			getClient: () => client,
			setClient,
			setHandshakeState: (next) => {
				handshakeState = next;
			},
			advanceHandshakePhase,
			setCloseCause,
			setLastFrameMeta,
			originCheckMetrics,
			logGateway,
			logHealth,
			logWsControl
		});
	});
}
//#endregion
//#region src/gateway/server-ws-runtime.ts
/** Attaches websocket handlers for an already-created gateway request context. */
function attachGatewayWsHandlers(params) {
	attachGatewayWsConnectionHandler({
		wss: params.wss,
		clients: params.clients,
		preauthConnectionBudget: params.preauthConnectionBudget,
		port: params.port,
		gatewayHost: params.gatewayHost,
		pluginSurfaceScheme: params.pluginSurfaceScheme,
		getPluginNodeCapabilities: params.getPluginNodeCapabilities,
		resolvedAuth: params.resolvedAuth,
		getResolvedAuth: params.getResolvedAuth,
		getRequiredSharedGatewaySessionGeneration: params.getRequiredSharedGatewaySessionGeneration,
		rateLimiter: params.rateLimiter,
		browserRateLimiter: params.browserRateLimiter,
		nodeReapprovalCoordinator: params.nodeReapprovalCoordinator,
		preauthHandshakeTimeoutMs: params.preauthHandshakeTimeoutMs,
		isStartupPending: params.isStartupPending,
		gatewayMethods: params.gatewayMethods,
		events: params.events,
		refreshHealthSnapshot: params.context.refreshHealthSnapshot,
		logGateway: params.logGateway,
		logHealth: params.logHealth,
		logWsControl: params.logWsControl,
		extraHandlers: params.extraHandlers,
		getMethodRegistry: params.getMethodRegistry,
		...params.workerConnectionService ? { workerConnectionService: params.workerConnectionService } : {},
		broadcast: params.broadcast,
		buildRequestContext: () => params.context
	});
}
//#endregion
exports.attachGatewayWsHandlers = attachGatewayWsHandlers;
