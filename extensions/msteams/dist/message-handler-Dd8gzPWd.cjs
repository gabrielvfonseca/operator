const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_utf8_truncate = require("./utf8-truncate-CThlmb6d.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_device_auth = require("./device-auth-C5hHJDgK.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_agent_runtime_identity_token = require("./agent-runtime-identity-token-BGKguIG_.cjs");
const require_operator_scope_compat = require("./operator-scope-compat-C_XF682D.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_operator_approval_runtime_token = require("./operator-approval-runtime-token-BZxnDPVJ.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_schema = require("./schema-DpZMt4ud.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_connect_error_details = require("./connect-error-details-lz40g7i9.cjs");
const require_auth_rate_limit = require("./auth-rate-limit-BjLy1S3-.cjs");
const require_handshake_auth_log_limiter = require("./handshake-auth-log-limiter-CtNayawM.cjs");
const require_auth = require("./auth-DnGY7_cY.cjs");
const require_diagnostic_payload = require("./diagnostic-payload-D1efA3wp.cjs");
const require_server_constants = require("./server-constants-CESgKlPt.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_device_bootstrap = require("./device-bootstrap-CBBl1PUE.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
const require_node_pairing = require("./node-pairing-B0aSCGFJ.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
const require_config = require("./config-BkcSsRJm.cjs");
const require_voicewake_routing = require("./voicewake-routing-DDiTCBkT.cjs");
const require_ws_shared_generation = require("./ws-shared-generation-Bcwr1LuX.cjs");
const require_server_utils = require("./server-utils-Cs8RsB0Z.cjs");
const require_system_presence = require("./system-presence-B9QPXvl5.cjs");
const require_health_state = require("./health-state-BQvfPUgE.cjs");
const require_startup_unavailable = require("./startup-unavailable-CFwHGTa9.cjs");
const require_role_policy = require("./role-policy-DpxCs0_d.cjs");
const require_plugin_node_capability = require("./plugin-node-capability-BqUNVkTg.cjs");
const require_node_connection_notifications = require("./node-connection-notifications-CDTqZXlT.cjs");
const require_node_connect_reconcile = require("./node-connect-reconcile-nSGckbpT.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_net = require("node:net");
node_net = require_rolldown_runtime.__toESM(node_net, 1);
//#region src/gateway/server/close-reason.ts
/**
* WebSocket close reason utilities.
*/
const CLOSE_REASON_MAX_BYTES = 120;
/** Truncates close reasons to the RFC-safe byte limit used during handshake failures. */
function truncateCloseReason(reason, maxBytes = CLOSE_REASON_MAX_BYTES) {
	if (!reason) return "invalid handshake";
	return require_utf8_truncate.truncateUtf8Prefix(reason, maxBytes);
}
//#endregion
//#region src/gateway/node-pairing-auto-approve.ts
/** Classifies how the gateway learned the client IP for node auto-approval. */
function resolveNodePairingClientIpSource(params) {
	if (!params.reportedClientIp) return "none";
	if (!params.hasProxyHeaders || !params.remoteIsTrustedProxy) return "direct";
	return params.remoteIsLoopback ? "loopback-trusted-proxy" : "trusted-proxy";
}
/**
* Shared floor for every non-interactive node pairing approval (trusted-CIDR,
* SSH-verified): only a fresh, scopeless, non-browser `role: node` request
* with a directly attributable client IP qualifies. Upgrades and spoofable
* loopback trusted-proxy header paths always stay on the manual prompt.
*/
function isEligibleFreshNodePairingRequest(params) {
	if (params.existingPairedDevice) return false;
	if (params.role !== "node") return false;
	if (params.reason !== "not-paired") return false;
	if (params.scopes.length > 0) return false;
	if (params.hasBrowserOriginHeader || params.isControlUi || params.isWebchat) return false;
	if (params.reportedClientIpSource === "none" || params.reportedClientIpSource === "loopback-trusted-proxy") return false;
	return Boolean(params.reportedClientIp);
}
/** Returns true when a node pairing request can be auto-approved by trusted CIDR policy. */
function shouldAutoApproveNodePairingFromTrustedCidrs(params) {
	if (!isEligibleFreshNodePairingRequest(params) || !params.reportedClientIp) return false;
	const autoApproveCidrs = params.autoApproveCidrs?.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
	if (!autoApproveCidrs || autoApproveCidrs.length === 0) return false;
	return require_net.isTrustedProxyAddress(params.reportedClientIp, autoApproveCidrs);
}
//#endregion
//#region src/gateway/server/ws-connection/unauthorized-flood-guard.ts
const DEFAULT_CLOSE_AFTER = 10;
const DEFAULT_LOG_EVERY = 100;
/** Counts unauthorized failures and decides when to log or close the socket. */
var UnauthorizedFloodGuard = class {
	constructor(options) {
		this.count = 0;
		this.suppressedSinceLastLog = 0;
		this.closeAfter = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveIntegerOption)(options?.closeAfter, DEFAULT_CLOSE_AFTER, { min: 1 });
		this.logEvery = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveIntegerOption)(options?.logEvery, DEFAULT_LOG_EVERY, { min: 1 });
	}
	registerUnauthorized() {
		this.count += 1;
		const shouldClose = this.count > this.closeAfter;
		if (!(this.count === 1 || this.count % this.logEvery === 0 || shouldClose)) {
			this.suppressedSinceLastLog += 1;
			return {
				shouldClose,
				shouldLog: false,
				count: this.count,
				suppressedSinceLastLog: 0
			};
		}
		const suppressedSinceLastLog = this.suppressedSinceLastLog;
		this.suppressedSinceLastLog = 0;
		return {
			shouldClose,
			shouldLog: true,
			count: this.count,
			suppressedSinceLastLog
		};
	}
	reset() {
		this.count = 0;
		this.suppressedSinceLastLog = 0;
	}
};
/** Identifies role-auth failures that should feed the flood guard. */
function isUnauthorizedRoleError(error) {
	if (!error) return false;
	return error.code === require_error_codes.ErrorCodes.INVALID_REQUEST && typeof error.message === "string" && error.message.startsWith("unauthorized role:");
}
//#endregion
//#region src/gateway/server/ws-connection/authenticated-request-dispatch.ts
const DEVICE_CREDENTIAL_INVALIDATING_METHODS = /* @__PURE__ */ new Set([
	"device.pair.remove",
	"device.token.rotate",
	"device.token.revoke",
	"node.pair.remove"
]);
function createGatewayAuthenticatedRequestDispatcher(params) {
	const { connId, getRequiredSharedGatewaySessionGeneration, extraHandlers, getMethodRegistry, buildRequestContext, send, close, isClosed, setCloseCause, logGateway } = params.handler;
	const unauthorizedFloodGuard = new UnauthorizedFloodGuard();
	let deviceCredentialMutationBarrier;
	const closeInvalidatedClient = (client, method) => {
		if (!client.invalidated) return false;
		const reason = client.invalidatedReason ?? "invalidated";
		setCloseCause("client-invalidated", {
			reason,
			method
		});
		close(4001, `client invalidated: ${reason}`);
		return true;
	};
	const dispatch = async (parsed, client) => {
		if (!require_src.validateRequestFrame(parsed)) {
			send({
				type: "res",
				id: parsed?.id ?? "invalid",
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid request frame: ${require_validation_errors.formatValidationErrors(require_src.validateRequestFrame.errors)}`)
			});
			return;
		}
		const req = parsed;
		require_ws_log.logWs("in", "req", {
			connId,
			id: req.id,
			method: req.method
		});
		for (;;) {
			const barrier = deviceCredentialMutationBarrier;
			if (!barrier) break;
			await barrier.catch(() => void 0);
			if (isClosed()) return;
		}
		if (closeInvalidatedClient(client, req.method)) return;
		if (client.usesSharedGatewayAuth) {
			const requiredSharedGatewaySessionGeneration = getRequiredSharedGatewaySessionGeneration?.();
			if (requiredSharedGatewaySessionGeneration !== void 0 && client.sharedGatewaySessionGeneration !== requiredSharedGatewaySessionGeneration) {
				setCloseCause("gateway-auth-rotated", {
					authGenerationStale: true,
					method: req.method
				});
				close(4001, "gateway auth changed");
				return;
			}
		}
		const respond = (ok, payload, error, meta) => {
			send({
				type: "res",
				id: req.id,
				ok,
				payload,
				error
			});
			const unauthorizedRoleError = isUnauthorizedRoleError(error);
			let logMeta = meta;
			if (unauthorizedRoleError) {
				const unauthorizedDecision = unauthorizedFloodGuard.registerUnauthorized();
				if (unauthorizedDecision.suppressedSinceLastLog > 0) logMeta = {
					...logMeta,
					suppressedUnauthorizedResponses: unauthorizedDecision.suppressedSinceLastLog
				};
				if (!unauthorizedDecision.shouldLog) return;
				if (unauthorizedDecision.shouldClose) {
					setCloseCause("repeated-unauthorized-requests", {
						unauthorizedCount: unauthorizedDecision.count,
						method: req.method
					});
					queueMicrotask(() => close(1008, "repeated unauthorized calls"));
				}
				logMeta = {
					...logMeta,
					unauthorizedCount: unauthorizedDecision.count
				};
			} else unauthorizedFloodGuard.reset();
			require_ws_log.logWs("out", "res", {
				connId,
				id: req.id,
				ok,
				method: req.method,
				errorCode: error?.code,
				errorMessage: error?.message,
				...logMeta
			});
		};
		const requestDispatch = (async () => {
			const { handleGatewayRequest } = await Promise.resolve().then(() => require("./server-methods-CYO3KugS.cjs"));
			await handleGatewayRequest({
				req,
				respond,
				client,
				isWebchatConnect: params.isWebchatConnect,
				extraHandlers,
				methodRegistry: getMethodRegistry?.(),
				context: buildRequestContext()
			});
		})().catch((err) => {
			logGateway.error(`request handler failed: ${require_ws_log.formatForLog(err)}`);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		});
		if (DEVICE_CREDENTIAL_INVALIDATING_METHODS.has(req.method)) {
			const barrier = requestDispatch.finally(() => {
				if (deviceCredentialMutationBarrier === barrier) deviceCredentialMutationBarrier = void 0;
			});
			deviceCredentialMutationBarrier = barrier;
		}
	};
	return { dispatch };
}
//#endregion
//#region src/gateway/server/ws-connection/auth-messages.ts
/** Formats a client-specific auth failure message without exposing secret values. */
function formatGatewayAuthFailureMessage(params) {
	const { authMode, authProvided, reason, client } = params;
	const isCli = require_message_channel.isGatewayCliClient(client);
	const isControlUi = require_message_channel.isOperatorUiClient(client);
	const isWebchat = require_message_channel.isWebchatClient(client);
	const tokenHint = isCli ? "set gateway.remote.token to match gateway.auth.token" : isControlUi || isWebchat ? "open the dashboard URL and paste the token in Control UI settings" : "provide gateway auth token";
	const passwordHint = isCli ? "set gateway.remote.password to match gateway.auth.password" : isControlUi || isWebchat ? "enter the password in Control UI settings" : "provide gateway auth password";
	switch (reason) {
		case "token_missing": return `unauthorized: gateway token missing (${tokenHint})`;
		case "token_mismatch": return `unauthorized: gateway token mismatch (${tokenHint})`;
		case "token_missing_config": return "unauthorized: gateway token not configured on gateway (set gateway.auth.token)";
		case "password_missing": return `unauthorized: gateway password missing (${passwordHint})`;
		case "password_mismatch": return `unauthorized: gateway password mismatch (${passwordHint})`;
		case "password_missing_config": return "unauthorized: gateway password not configured on gateway (set gateway.auth.password)";
		case "bootstrap_token_invalid": return "unauthorized: bootstrap token invalid or expired (scan a fresh setup code)";
		case "tailscale_user_missing": return "unauthorized: tailscale identity missing (use Tailscale Serve auth or gateway token/password)";
		case "tailscale_proxy_missing": return "unauthorized: tailscale proxy headers missing (use Tailscale Serve or gateway token/password)";
		case "tailscale_whois_failed": return "unauthorized: tailscale identity check failed (use Tailscale Serve auth or gateway token/password)";
		case "tailscale_user_mismatch": return "unauthorized: tailscale identity mismatch (use Tailscale Serve auth or gateway token/password)";
		case "rate_limited": return "unauthorized: too many failed authentication attempts (retry later)";
		case "device_token_mismatch": return "unauthorized: device token mismatch (rotate/reissue device token)";
		case "scope_mismatch": return "unauthorized: device token scope mismatch (re-pair or approve scope upgrade)";
		default: break;
	}
	if (authMode === "token" && authProvided === "none") return `unauthorized: gateway token missing (${tokenHint})`;
	if (authMode === "token" && authProvided === "device-token") return "unauthorized: device token rejected (pair/repair this device, or provide gateway token)";
	if (authProvided === "bootstrap-token") return "unauthorized: bootstrap token invalid or expired (scan a fresh setup code)";
	if (authMode === "password" && authProvided === "none") return `unauthorized: gateway password missing (${passwordHint})`;
	return "unauthorized";
}
//#endregion
//#region src/gateway/server/ws-connection/connect-admission.ts
function resolveTrustedProxyControlUiScopes(params) {
	const header = params.upgradeReq.headers["x-operator-scopes"];
	const rawHeader = Array.isArray(header) ? header[0] : header;
	if (rawHeader === void 0) return params.requestedScopes;
	const declaredScopes = new Set(rawHeader.split(",").map((scope) => scope.trim()).filter((scope) => scope.length > 0));
	return declaredScopes.size === 0 ? [] : params.requestedScopes.filter((scope) => declaredScopes.has(scope));
}
async function admitGatewayConnect(context) {
	const { connId, remoteAddr, remotePort, requestHost, requestOrigin, close, isStartupPending, logGateway, logWsControl, originCheckMetrics } = context.handler;
	const { connectParams, configSnapshot, peerLabel, isLocalClient, enforceOriginCheckForAnyClient, clientLabel, markHandshakeFailure, sendHandshakeErrorResponse, isWebchatConnect, frame, sendFrame } = context;
	if (isStartupPending?.()) {
		markHandshakeFailure(require_startup_unavailable.GATEWAY_STARTUP_PENDING_CLOSE_CAUSE);
		await sendFrame({
			type: "res",
			id: frame.id,
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "gateway starting; retry shortly", {
				retryable: true,
				retryAfterMs: 500,
				details: require_startup_unavailable.gatewayStartupUnavailableDetails()
			})
		}).catch(() => {});
		queueMicrotask(() => close(require_startup_unavailable.GATEWAY_STARTUP_CLOSE_CODE, require_startup_unavailable.GATEWAY_STARTUP_CLOSE_REASON));
		return;
	}
	const { minProtocol, maxProtocol } = connectParams;
	const supportsCurrentProtocol = maxProtocol >= 4 && minProtocol <= 4;
	const supportsProbeRestartProtocol = connectParams.client.mode === require_client_info.GATEWAY_CLIENT_MODES.PROBE && maxProtocol >= 3 && minProtocol <= 4;
	const supportsPreviousNodeProtocol = connectParams.role === "node" && connectParams.client.mode === require_client_info.GATEWAY_CLIENT_MODES.NODE && maxProtocol >= 3 && minProtocol <= 3;
	const usesLegacyNodeProtocol = !supportsCurrentProtocol && supportsPreviousNodeProtocol;
	if (!supportsCurrentProtocol && !supportsProbeRestartProtocol && !supportsPreviousNodeProtocol) {
		markHandshakeFailure("protocol-mismatch", {
			minProtocol,
			maxProtocol,
			expectedProtocol: 4,
			minimumProbeProtocol: 3
		});
		logWsControl.warn(`protocol mismatch conn=${connId} peer=${require_ws_log.formatForLog(peerLabel)} remote=${remoteAddr ?? "?"} remotePort=${remotePort ?? "?"} client=${require_ws_log.formatForLog(clientLabel)} ${connectParams.client.mode} v${require_ws_log.formatForLog(connectParams.client.version)} min=${minProtocol} max=${maxProtocol} expected=4 probeMin=3 instance=${require_ws_log.formatForLog(connectParams.client.instanceId ?? "n/a")}`);
		sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, "protocol mismatch", { details: {
			code: require_connect_error_details.ConnectErrorDetailCodes.PROTOCOL_MISMATCH,
			clientMinProtocol: minProtocol,
			clientMaxProtocol: maxProtocol,
			expectedProtocol: 4,
			minimumProbeProtocol: 3
		} });
		close(1002, "protocol mismatch");
		return;
	}
	const roleRaw = connectParams.role ?? "operator";
	const role = require_role_policy.parseGatewayRole(roleRaw);
	if (!role) {
		markHandshakeFailure("invalid-role", { role: roleRaw });
		sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid role");
		close(1008, "invalid role");
		return;
	}
	const scopes = Array.isArray(connectParams.scopes) ? connectParams.scopes : [];
	connectParams.role = role;
	connectParams.scopes = scopes;
	const isControlUi = require_message_channel.isOperatorUiClient(connectParams.client);
	const isBrowserOperatorUi = require_message_channel.isBrowserOperatorUiClient(connectParams.client);
	const isWebchat = isWebchatConnect(connectParams);
	const isNativeAppUi = connectParams.client.mode === require_client_info.GATEWAY_CLIENT_MODES.UI && (connectParams.client.id === require_client_info.GATEWAY_CLIENT_IDS.MACOS_APP || connectParams.client.id === require_client_info.GATEWAY_CLIENT_IDS.IOS_APP || connectParams.client.id === require_client_info.GATEWAY_CLIENT_IDS.ANDROID_APP);
	if (enforceOriginCheckForAnyClient || isBrowserOperatorUi || isWebchat) {
		const hostHeaderOriginFallbackEnabled = configSnapshot.gateway?.controlUi?.dangerouslyAllowHostHeaderOriginFallback === true;
		const originCheck = require_auth.checkBrowserOrigin({
			requestHost,
			origin: requestOrigin,
			allowedOrigins: configSnapshot.gateway?.controlUi?.allowedOrigins,
			allowHostHeaderOriginFallback: hostHeaderOriginFallbackEnabled,
			isLocalClient
		});
		if (!originCheck.ok) {
			const errorMessage = "origin not allowed (open the Control UI from the gateway host or allow it in gateway.controlUi.allowedOrigins)";
			markHandshakeFailure("origin-mismatch", {
				origin: requestOrigin ?? "n/a",
				host: requestHost ?? "n/a",
				reason: originCheck.reason
			});
			sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, errorMessage, { details: {
				code: require_connect_error_details.ConnectErrorDetailCodes.CONTROL_UI_ORIGIN_NOT_ALLOWED,
				reason: originCheck.reason
			} });
			close(1008, truncateCloseReason(errorMessage));
			return;
		}
		if (originCheck.matchedBy === "host-header-fallback") {
			originCheckMetrics.hostHeaderFallbackAccepted += 1;
			logWsControl.warn(`security warning: websocket origin accepted via Host-header fallback conn=${connId} count=${originCheckMetrics.hostHeaderFallbackAccepted} host=${requestHost ?? "n/a"} origin=${requestOrigin ?? "n/a"}`);
			if (hostHeaderOriginFallbackEnabled) logGateway.warn("security metric: gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback accepted a websocket connect request");
		}
	}
	return {
		minProtocol,
		maxProtocol,
		usesLegacyNodeProtocol,
		role,
		scopes,
		isControlUi,
		isBrowserOperatorUi,
		isWebchat,
		isNativeAppUi
	};
}
//#endregion
//#region src/gateway/server/ws-connection/connect-auth-security.ts
function hashGatewaySecurityId(value) {
	const normalized = value?.trim();
	if (!normalized) return;
	return `sha256:${require_crypto_digest.sha256HexPrefix(normalized, 12)}`;
}
function emitGatewayAuthSecurityEvent(params) {
	require_diagnostic_events.emitTrustedSecurityEvent({
		category: "auth",
		action: params.action,
		outcome: params.outcome,
		severity: params.severity,
		actor: {
			kind: params.role === "node" ? "node" : "operator",
			...params.deviceId ? { deviceIdHash: hashGatewaySecurityId(params.deviceId) } : {},
			role: params.role
		},
		target: {
			kind: "gateway",
			name: "websocket"
		},
		policy: {
			id: "gateway.websocket-auth",
			decision: params.outcome === "success" ? "allow" : "deny",
			...params.reason ? { reason: params.reason } : {}
		},
		control: {
			id: "gateway.ws.connect",
			family: "auth"
		},
		...params.reason ? { reason: params.reason } : {},
		attributes: {
			auth_mode: params.authMode,
			auth_method: params.authMethod ?? "unknown",
			auth_provided: params.authProvided ?? "unknown",
			client_mode: params.clientMode ?? "unknown",
			has_device_identity: Boolean(params.deviceId),
			scope_count: params.scopes.length,
			...params.rateLimited !== void 0 ? { rate_limited: params.rateLimited } : {}
		}
	});
}
//#endregion
//#region src/gateway/server/ws-connection/connect-device-proof.ts
const DEVICE_SIGNATURE_SKEW_MS = 120 * 1e3;
function verifyGatewayConnectDeviceProof(context, params) {
	const { device, resolvedAuth, authMethod, role, scopes } = params;
	if (!device) return {
		ok: true,
		devicePublicKey: null,
		deviceAuthPayloadVersion: null
	};
	const { frame, connectParams } = context;
	const { send, close, setHandshakeState, setCloseCause } = context.handler;
	const rejectDeviceAuthInvalid = (reason, message) => {
		emitGatewayAuthSecurityEvent({
			action: "gateway.auth.failed",
			outcome: "denied",
			severity: "medium",
			authMode: resolvedAuth.mode,
			authMethod,
			authProvided: "device-signature",
			role,
			scopes,
			clientMode: connectParams.client.mode,
			deviceId: device.id,
			reason
		});
		setHandshakeState("failed");
		setCloseCause("device-auth-invalid", {
			reason,
			client: connectParams.client.id,
			deviceId: device.id
		});
		send({
			type: "res",
			id: frame.id,
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, message, { details: {
				code: require_connect_error_details.resolveDeviceAuthConnectErrorDetailCode(reason),
				reason
			} })
		});
		close(1008, message);
	};
	const derivedId = require_device_identity.deriveDeviceIdFromPublicKey(device.publicKey);
	if (!derivedId || derivedId !== device.id) {
		rejectDeviceAuthInvalid("device-id-mismatch", "device identity mismatch");
		return { ok: false };
	}
	const signedAt = device.signedAt;
	if (typeof signedAt !== "number" || Math.abs(Date.now() - signedAt) > DEVICE_SIGNATURE_SKEW_MS) {
		rejectDeviceAuthInvalid("device-signature-stale", "device signature expired");
		return { ok: false };
	}
	const providedNonce = typeof device.nonce === "string" ? device.nonce.trim() : "";
	if (!providedNonce) {
		rejectDeviceAuthInvalid("device-nonce-missing", "device nonce required");
		return { ok: false };
	}
	if (providedNonce !== context.handler.connectNonce) {
		rejectDeviceAuthInvalid("device-nonce-mismatch", "device nonce mismatch");
		return { ok: false };
	}
	const payloadVersion = require_node_connect_reconcile.resolveDeviceSignaturePayloadVersion({
		device,
		connectParams,
		role,
		scopes,
		signedAtMs: signedAt,
		nonce: providedNonce
	});
	if (!payloadVersion) {
		rejectDeviceAuthInvalid("device-signature", "device signature invalid");
		return { ok: false };
	}
	const devicePublicKey = require_device_identity.normalizeDevicePublicKeyBase64Url(device.publicKey);
	if (!devicePublicKey) {
		rejectDeviceAuthInvalid("device-public-key", "device public key invalid");
		return { ok: false };
	}
	return {
		ok: true,
		devicePublicKey,
		deviceAuthPayloadVersion: payloadVersion
	};
}
//#endregion
//#region src/gateway/server/ws-connection/connect-policy.ts
function resolveControlUiAuthPolicy(params) {
	const allowInsecureAuthConfigured = params.isControlUi && params.controlUiConfig?.allowInsecureAuth === true;
	const dangerouslyDisableDeviceAuth = params.isControlUi && params.controlUiConfig?.dangerouslyDisableDeviceAuth === true;
	return {
		isControlUi: params.isControlUi,
		allowInsecureAuthConfigured,
		dangerouslyDisableDeviceAuth,
		allowBypass: dangerouslyDisableDeviceAuth,
		device: dangerouslyDisableDeviceAuth ? null : params.deviceRaw
	};
}
function shouldSkipControlUiPairing(policy, role, _trustedProxyAuthOk = false, authMode, authMethod) {
	if (policy.isControlUi && role === "operator" && authMethod === "tailscale" && policy.device) return true;
	if (policy.isControlUi && role === "operator" && authMode === "none") return true;
	return role === "operator" && policy.allowBypass;
}
function isTrustedProxyControlUiOperatorAuth(params) {
	return params.isControlUi && params.role === "operator" && params.authMode === "trusted-proxy" && params.authOk && params.authMethod === "trusted-proxy";
}
function shouldClearUnboundScopesForMissingDeviceIdentity(params) {
	return params.decision.kind !== "allow" || !params.controlUiAuthPolicy.allowBypass && !params.preserveInsecureLocalControlUiScopes && (params.authMethod === "token" || params.authMethod === "password" || params.authMethod === "trusted-proxy");
}
function evaluateMissingDeviceIdentity(params) {
	if (params.hasDeviceIdentity) return { kind: "allow" };
	if (params.isControlUi && params.trustedProxyAuthOk) return { kind: "allow" };
	if (params.isControlUi && params.controlUiAuthPolicy.allowBypass && params.role === "operator") return { kind: "allow" };
	if (params.localBackendSelfPairingOk && params.role === "operator") return { kind: "allow" };
	if (params.isControlUi && !params.controlUiAuthPolicy.allowBypass) {
		if (!params.controlUiAuthPolicy.allowInsecureAuthConfigured || !params.isLocalClient) return { kind: "reject-control-ui-insecure-auth" };
	}
	if (require_role_policy.roleCanSkipDeviceIdentity(params.role, params.sharedAuthOk)) return { kind: "allow" };
	if (!params.authOk && params.hasSharedAuth) return { kind: "reject-unauthorized" };
	return { kind: "reject-device-required" };
}
//#endregion
//#region src/gateway/server/ws-connection/connect-auth.ts
const unauthorizedHandshakeLogLimiter = new require_handshake_auth_log_limiter.HandshakeAuthLogLimiter();
async function authenticateGatewayConnect(context) {
	const { upgradeReq, connId, remoteAddr, remotePort, localAddr, localPort, requestHost, requestOrigin, requestUserAgent, getResolvedAuth, getRequiredSharedGatewaySessionGeneration, advanceHandshakePhase, setCloseCause, close, logWsControl } = context.handler;
	const { connectParams, configSnapshot, trustedProxies, allowRealIpFallback, peerLabel, hasProxyHeaders, isLocalClient, hasBrowserOriginHeader, browserRateLimitClientIp, authRateLimiter, clientLabel, markHandshakeFailure, sendHandshakeErrorResponse } = context;
	const resolvedAuth = getResolvedAuth();
	const admission = await admitGatewayConnect(context);
	if (!admission) return;
	let { scopes } = admission;
	const { minProtocol, maxProtocol, usesLegacyNodeProtocol, role, isControlUi, isBrowserOperatorUi, isWebchat, isNativeAppUi } = admission;
	const deviceRaw = connectParams.device;
	const hasTokenAuth = Boolean(connectParams.auth?.token);
	const hasPasswordAuth = Boolean(connectParams.auth?.password);
	const hasSharedAuth = hasTokenAuth || hasPasswordAuth;
	const controlUiAuthPolicy = resolveControlUiAuthPolicy({
		isControlUi,
		controlUiConfig: configSnapshot.gateway?.controlUi,
		deviceRaw
	});
	const device = controlUiAuthPolicy.device;
	const hasBootstrapProof = Boolean(connectParams.auth?.bootstrapToken);
	const hasDeviceTokenProof = Boolean(connectParams.auth?.deviceToken);
	if (hasSharedAuth || hasBootstrapProof || hasDeviceTokenProof || Boolean(device)) advanceHandshakePhase("auth_credentials_received");
	const connectAuthState = await require_node_connect_reconcile.resolveConnectAuthState({
		resolvedAuth,
		connectAuth: connectParams.auth,
		hasDeviceIdentity: Boolean(device),
		req: upgradeReq,
		trustedProxies,
		allowRealIpFallback,
		rateLimiter: authRateLimiter,
		clientIp: browserRateLimitClientIp
	});
	const { sharedAuthOk, bootstrapTokenCandidate, deviceTokenCandidate, deviceTokenCandidateSource } = connectAuthState;
	let { authResult, authOk, authMethod } = connectAuthState;
	const rejectUnauthorized = (failedAuth) => {
		const { authProvided, canRetryWithDeviceToken, recommendedNextStep } = require_node_connect_reconcile.resolveUnauthorizedHandshakeContext({
			connectAuth: connectParams.auth,
			failedAuth,
			hasDeviceIdentity: Boolean(device)
		});
		emitGatewayAuthSecurityEvent({
			action: "gateway.auth.failed",
			outcome: "denied",
			severity: failedAuth.rateLimited ? "high" : "medium",
			authMode: resolvedAuth.mode,
			authMethod: failedAuth.method ?? authMethod,
			authProvided,
			role,
			scopes,
			clientMode: connectParams.client.mode,
			deviceId: device?.id,
			reason: failedAuth.reason ?? "unknown",
			rateLimited: failedAuth.rateLimited === true
		});
		markHandshakeFailure("unauthorized", {
			authMode: resolvedAuth.mode,
			authProvided,
			authReason: failedAuth.reason,
			allowTailscale: resolvedAuth.allowTailscale,
			peer: peerLabel,
			remoteAddr,
			remotePort,
			localAddr,
			localPort,
			role,
			scopeCount: scopes.length,
			hasDeviceIdentity: Boolean(device)
		});
		const authLogDecision = require_handshake_auth_log_limiter.shouldLimitMissingCredentialAuthLog({
			reason: failedAuth.reason,
			authProvided
		}) ? unauthorizedHandshakeLogLimiter.register(require_handshake_auth_log_limiter.buildHandshakeAuthLogKey({
			reason: failedAuth.reason,
			remoteAddr,
			client: clientLabel,
			mode: connectParams.client.mode,
			authProvided
		})) : {
			shouldLog: true,
			suppressedSinceLastLog: 0
		};
		if (authLogDecision.shouldLog) {
			const suppressedText = authLogDecision.suppressedSinceLastLog > 0 ? ` suppressed=${authLogDecision.suppressedSinceLastLog}` : "";
			logWsControl.warn(`unauthorized conn=${connId} peer=${require_ws_log.formatForLog(peerLabel)} remote=${remoteAddr ?? "?"} client=${require_ws_log.formatForLog(clientLabel)} ${connectParams.client.mode} v${require_ws_log.formatForLog(connectParams.client.version)} role=${role} scopes=${scopes.length} auth=${authProvided} device=${device ? "yes" : "no"} platform=${require_ws_log.formatForLog(connectParams.client.platform)} instance=${require_ws_log.formatForLog(connectParams.client.instanceId ?? "n/a")} host=${require_ws_log.formatForLog(requestHost ?? "n/a")} origin=${require_ws_log.formatForLog(requestOrigin ?? "n/a")} ua=${require_ws_log.formatForLog(requestUserAgent ?? "n/a")} reason=${failedAuth.reason ?? "unknown"}${suppressedText}`);
		}
		const authMessage = formatGatewayAuthFailureMessage({
			authMode: resolvedAuth.mode,
			authProvided,
			reason: failedAuth.reason,
			client: connectParams.client
		});
		sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, authMessage, { details: {
			code: require_connect_error_details.resolveAuthConnectErrorDetailCode(failedAuth.reason),
			authReason: failedAuth.reason,
			canRetryWithDeviceToken,
			recommendedNextStep
		} });
		close(1008, truncateCloseReason(authMessage));
	};
	const clearUnboundScopes = () => {
		if (scopes.length > 0) {
			scopes = [];
			connectParams.scopes = scopes;
		}
	};
	let pairingLocality = require_node_connect_reconcile.resolvePairingLocality({
		connectParams,
		isLocalClient,
		requestHost,
		requestOrigin,
		remoteAddress: remoteAddr,
		hasProxyHeaders,
		hasBrowserOriginHeader,
		sharedAuthOk,
		authMethod
	});
	let skipLocalBackendSelfPairing = require_node_connect_reconcile.shouldSkipLocalBackendSelfPairing({
		connectParams,
		locality: pairingLocality,
		hasBrowserOriginHeader,
		sharedAuthOk,
		authMethod
	});
	let preserveLocalCliSharedAuthScopes = require_node_connect_reconcile.shouldPreserveLocalCliSharedAuthScopes({
		connectParams,
		locality: pairingLocality,
		hasBrowserOriginHeader,
		sharedAuthOk,
		authMethod
	});
	const handleMissingDeviceIdentity = () => {
		const trustedProxyAuthOk = isTrustedProxyControlUiOperatorAuth({
			isControlUi,
			role,
			authMode: resolvedAuth.mode,
			authOk,
			authMethod
		});
		const preserveInsecureLocalControlUiScopes = isControlUi && controlUiAuthPolicy.allowInsecureAuthConfigured && isLocalClient && (authMethod === "token" || authMethod === "password");
		const decision = evaluateMissingDeviceIdentity({
			hasDeviceIdentity: Boolean(device),
			role,
			isControlUi,
			controlUiAuthPolicy,
			trustedProxyAuthOk,
			localBackendSelfPairingOk: skipLocalBackendSelfPairing,
			sharedAuthOk,
			authOk,
			hasSharedAuth,
			isLocalClient
		});
		if (!device && !skipLocalBackendSelfPairing && !preserveLocalCliSharedAuthScopes && shouldClearUnboundScopesForMissingDeviceIdentity({
			decision,
			controlUiAuthPolicy,
			preserveInsecureLocalControlUiScopes,
			authMethod,
			trustedProxyAuthOk
		})) clearUnboundScopes();
		if (decision.kind === "allow") return true;
		if (decision.kind === "reject-control-ui-insecure-auth") {
			const errorMessage = "control ui requires device identity (use HTTPS or localhost secure context)";
			markHandshakeFailure("control-ui-insecure-auth", { insecureAuthConfigured: controlUiAuthPolicy.allowInsecureAuthConfigured });
			sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, errorMessage, { details: { code: require_connect_error_details.ConnectErrorDetailCodes.CONTROL_UI_DEVICE_IDENTITY_REQUIRED } });
			close(1008, errorMessage);
			return false;
		}
		if (decision.kind === "reject-unauthorized") {
			rejectUnauthorized(authResult);
			return false;
		}
		markHandshakeFailure("device-required");
		sendHandshakeErrorResponse(require_error_codes.ErrorCodes.NOT_PAIRED, "device identity required", { details: { code: require_connect_error_details.ConnectErrorDetailCodes.DEVICE_IDENTITY_REQUIRED } });
		close(1008, "device identity required");
		return false;
	};
	if (!handleMissingDeviceIdentity()) return;
	const deviceProof = verifyGatewayConnectDeviceProof(context, {
		device,
		resolvedAuth,
		authMethod,
		role,
		scopes
	});
	if (!deviceProof.ok) return;
	const authDecision = await require_node_connect_reconcile.resolveConnectAuthDecision({
		state: {
			authResult,
			authOk,
			authMethod,
			sharedAuthOk,
			sharedAuthProvided: hasSharedAuth,
			bootstrapTokenCandidate,
			deviceTokenCandidate,
			deviceTokenCandidateSource
		},
		hasDeviceIdentity: Boolean(device),
		deviceId: device?.id,
		publicKey: device?.publicKey,
		role,
		scopes,
		rateLimiter: authRateLimiter,
		clientIp: browserRateLimitClientIp,
		async verifyBootstrapToken({ deviceId, publicKey, token, role: roleLocal, scopes: scopesLocal }) {
			return await require_device_bootstrap.verifyDeviceBootstrapToken({
				deviceId,
				publicKey,
				token,
				role: roleLocal,
				scopes: scopesLocal
			});
		},
		async verifyDeviceToken(paramsLocal) {
			return await require_device_pairing.verifyDeviceToken({
				...paramsLocal,
				requiredSharedGatewaySessionGeneration: getRequiredSharedGatewaySessionGeneration?.()
			});
		}
	});
	({authResult, authOk, authMethod} = authDecision);
	const deviceTokenSharedGatewaySessionGeneration = authDecision.deviceTokenSharedGatewaySessionGeneration;
	pairingLocality = require_node_connect_reconcile.resolvePairingLocality({
		connectParams,
		isLocalClient,
		requestHost,
		requestOrigin,
		remoteAddress: remoteAddr,
		hasProxyHeaders,
		hasBrowserOriginHeader,
		sharedAuthOk,
		authMethod
	});
	skipLocalBackendSelfPairing = require_node_connect_reconcile.shouldSkipLocalBackendSelfPairing({
		connectParams,
		locality: pairingLocality,
		hasBrowserOriginHeader,
		sharedAuthOk,
		authMethod
	});
	preserveLocalCliSharedAuthScopes = require_node_connect_reconcile.shouldPreserveLocalCliSharedAuthScopes({
		connectParams,
		locality: pairingLocality,
		hasBrowserOriginHeader,
		sharedAuthOk,
		authMethod
	});
	if (!authOk) {
		rejectUnauthorized(authResult);
		return;
	}
	advanceHandshakePhase("auth_validated");
	const usesSharedGatewayAuth = authMethod === "token" || authMethod === "password" || authMethod === "trusted-proxy";
	const sharedGatewaySessionGeneration = usesSharedGatewayAuth ? require_ws_shared_generation.resolveSharedGatewaySessionGeneration(resolvedAuth, trustedProxies) : void 0;
	const sessionUsesSharedGatewayAuth = usesSharedGatewayAuth || deviceTokenSharedGatewaySessionGeneration !== void 0;
	const sessionSharedGatewaySessionGeneration = sharedGatewaySessionGeneration ?? deviceTokenSharedGatewaySessionGeneration;
	if (sessionUsesSharedGatewayAuth) {
		const requiredSharedGatewaySessionGeneration = getRequiredSharedGatewaySessionGeneration?.();
		if (requiredSharedGatewaySessionGeneration !== void 0 && sessionSharedGatewaySessionGeneration !== requiredSharedGatewaySessionGeneration) {
			setCloseCause("gateway-auth-rotated", { authGenerationStale: true });
			close(4001, "gateway auth changed");
			return;
		}
	}
	const issuedBootstrapProfile = authMethod === "bootstrap-token" && bootstrapTokenCandidate ? await require_device_bootstrap.getDeviceBootstrapTokenProfile({ token: bootstrapTokenCandidate }) : null;
	const handoffBootstrapProfile = null;
	const trustedProxyAuthOk = isTrustedProxyControlUiOperatorAuth({
		isControlUi,
		role,
		authMode: resolvedAuth.mode,
		authOk,
		authMethod
	});
	if (trustedProxyAuthOk) {
		scopes = resolveTrustedProxyControlUiScopes({
			requestedScopes: scopes,
			upgradeReq
		});
		connectParams.scopes = scopes;
	}
	const skipControlUiPairingForDevice = shouldSkipControlUiPairing(controlUiAuthPolicy, role, trustedProxyAuthOk, resolvedAuth.mode, authMethod);
	return {
		resolvedAuth,
		minProtocol,
		maxProtocol,
		usesLegacyNodeProtocol,
		role,
		scopes,
		isControlUi,
		isBrowserOperatorUi,
		isWebchat,
		isNativeAppUi,
		controlUiAuthPolicy,
		device,
		devicePublicKey: deviceProof.devicePublicKey,
		deviceAuthPayloadVersion: deviceProof.deviceAuthPayloadVersion,
		hasTokenAuth,
		hasPasswordAuth,
		bootstrapTokenCandidate,
		deviceTokenSharedGatewaySessionGeneration,
		authResult,
		authOk,
		authMethod,
		pairingLocality,
		usesSharedGatewayAuth,
		sessionUsesSharedGatewayAuth,
		sessionSharedGatewaySessionGeneration,
		issuedBootstrapProfile,
		handoffBootstrapProfile,
		trustedProxyAuthOk,
		skipControlUiPairingForDevice,
		skipLocalBackendSelfPairing,
		rejectUnauthorized
	};
}
//#endregion
//#region src/gateway/server/ws-connection/connect-device-metadata.ts
function resolvePairedAccessScopes(device) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueTrimmedStringList)(Array.isArray(device?.approvedScopes) ? device.approvedScopes : Array.isArray(device?.scopes) ? device.scopes : []);
}
function isSetupCodeMobileBootstrapClient(client) {
	const platform = require_device_auth.normalizeDeviceMetadataForAuth(client.platform);
	const deviceFamily = require_device_auth.normalizeDeviceMetadataForAuth(client.deviceFamily);
	if (client.id === require_client_info.GATEWAY_CLIENT_IDS.ANDROID_APP) return /^android(?:\s|$)/u.test(platform) && deviceFamily === "android";
	if (client.id === require_client_info.GATEWAY_CLIENT_IDS.IOS_APP) return /^(?:ios|ipados)(?:\s|$)/u.test(platform) && /^(?:iphone|ipad|ios)$/u.test(deviceFamily);
	return false;
}
function isControlUiOperatorBootstrapProfile(params) {
	const { profile, requestedScopes } = params;
	if (profile?.purpose !== "control-ui") return false;
	if (profile.roles.length !== 1 || profile.roles[0] !== "operator") return false;
	if (!profile.scopes.every((scope) => require_device_bootstrap.BOOTSTRAP_HANDOFF_OPERATOR_SCOPES.includes(scope))) return false;
	return require_operator_scope_compat.roleScopesAllow({
		role: "operator",
		requestedScopes,
		allowedScopes: profile.scopes
	});
}
function isMobileNodeBootstrapConnect(params) {
	return params.role === "node" && params.scopes.length === 0 && !params.isControlUi && !params.isBrowserOperatorUi && !params.isWebchat && params.clientMode === require_client_info.GATEWAY_CLIENT_MODES.NODE;
}
function pairedDeviceAllowsBootstrapRole(params) {
	return require_device_pairing.hasEffectivePairedDeviceRole(params.device, params.role) && require_operator_scope_compat.roleScopesAllow({
		role: params.role,
		requestedScopes: require_device_bootstrap.resolveBootstrapProfileScopesForRole(params.role, params.profile.scopes, params.profile.purpose),
		allowedScopes: resolvePairedAccessScopes(params.device)
	});
}
function pairedDeviceAllowsBootstrapProfile(params) {
	const device = params.device;
	return Boolean(device && device.publicKey === params.devicePublicKey && params.profile.roles.every((role) => pairedDeviceAllowsBootstrapRole({
		device,
		profile: params.profile,
		role
	})));
}
function pairedDeviceAllowsBootstrapOperator(params) {
	const device = params.device;
	return Boolean(device && device.publicKey === params.devicePublicKey && pairedDeviceAllowsBootstrapRole({
		device,
		profile: params.profile,
		role: "operator"
	}));
}
function resolvePinnedClientMetadata(params) {
	function normalizeLegacyNodeHostPlatformPin(value) {
		switch (value) {
			case "darwin":
			case "macos": return "macos";
			case "win32":
			case "windows": return "windows";
			default: return value;
		}
	}
	function resolveNativeAppPlatformFamily(clientId, value) {
		if (clientId === require_client_info.GATEWAY_CLIENT_IDS.IOS_APP && /^(?:ios|ipados)(?:\s|$)/.test(value)) return "ios-family";
		if (clientId === require_client_info.GATEWAY_CLIENT_IDS.ANDROID_APP && /^android(?:\s|$)/.test(value)) return "android";
		if (clientId === require_client_info.GATEWAY_CLIENT_IDS.MACOS_APP && /^macos \d+(?:\.\d+){0,2}$/.test(value)) return "macos";
	}
	const claimedPlatform = require_device_auth.normalizeDeviceMetadataForAuth(params.claimedPlatform);
	const claimedDeviceFamily = require_device_auth.normalizeDeviceMetadataForAuth(params.claimedDeviceFamily);
	const pairedPlatform = require_device_auth.normalizeDeviceMetadataForAuth(params.pairedPlatform);
	const pairedDeviceFamily = require_device_auth.normalizeDeviceMetadataForAuth(params.pairedDeviceFamily);
	const hasPinnedPlatform = pairedPlatform !== "";
	const hasPinnedDeviceFamily = pairedDeviceFamily !== "";
	const isLegacyNodeHostPlatformPin = params.clientId === require_client_info.GATEWAY_CLIENT_IDS.NODE_HOST && params.clientMode === require_client_info.GATEWAY_CLIENT_MODES.NODE && hasPinnedPlatform && claimedPlatform !== "" && normalizeLegacyNodeHostPlatformPin(claimedPlatform) === normalizeLegacyNodeHostPlatformPin(pairedPlatform);
	const isNodeHostUsingMacAppPlatformPin = params.clientId === require_client_info.GATEWAY_CLIENT_IDS.NODE_HOST && params.clientMode === require_client_info.GATEWAY_CLIENT_MODES.NODE && (claimedPlatform === "darwin" || claimedPlatform === "macos") && /^macos \d+(?:\.\d+){0,2}$/.test(pairedPlatform);
	const claimedNativeAppPlatformFamily = resolveNativeAppPlatformFamily(params.clientId, claimedPlatform);
	const pairedNativeAppPlatformFamily = resolveNativeAppPlatformFamily(params.clientId, pairedPlatform);
	const isNativeAppPlatformVersionRefresh = hasPinnedPlatform && claimedPlatform !== "" && claimedPlatform !== pairedPlatform && (claimedNativeAppPlatformFamily !== void 0 && claimedNativeAppPlatformFamily === pairedNativeAppPlatformFamily || params.clientId === require_client_info.GATEWAY_CLIENT_IDS.MACOS_APP && claimedNativeAppPlatformFamily === "macos" && (pairedPlatform === "darwin" || pairedPlatform === "macos"));
	const platformMismatch = hasPinnedPlatform && claimedPlatform !== pairedPlatform && !isLegacyNodeHostPlatformPin && !isNodeHostUsingMacAppPlatformPin && !isNativeAppPlatformVersionRefresh;
	const deviceFamilyMismatch = hasPinnedDeviceFamily && claimedDeviceFamily !== pairedDeviceFamily;
	const pinnedPlatform = claimedPlatform === pairedPlatform ? params.pairedPlatform : isLegacyNodeHostPlatformPin ? normalizeLegacyNodeHostPlatformPin(pairedPlatform) : isNodeHostUsingMacAppPlatformPin ? params.pairedPlatform : isNativeAppPlatformVersionRefresh ? params.claimedPlatform : void 0;
	return {
		platformMismatch,
		deviceFamilyMismatch,
		pinnedPlatform: hasPinnedPlatform ? pinnedPlatform : void 0,
		pinnedDeviceFamily: hasPinnedDeviceFamily ? params.pairedDeviceFamily : void 0,
		...isNativeAppPlatformVersionRefresh ? { refreshPairedPlatform: params.claimedPlatform } : {}
	};
}
//#endregion
//#region src/gateway/device-pairing-prune.ts
/**
* After a silent auto-approval, retire older silent pairings of the same client
* cluster. Ephemeral state dirs mint a fresh deviceId per run and every run
* re-pairs silently, so without this the paired-device list grows without bound
* (dozens of stale operator/node records per host).
*/
async function pruneSupersededSilentPairingsAfterApproval(params) {
	const { context } = params;
	const pruned = await require_device_pairing.pruneSupersededSilentPairedDevices({
		deviceId: params.deviceId,
		baseDir: params.baseDir,
		nowMs: params.nowMs,
		isDeviceConnected: (deviceId) => context.hasConnectedClientsForDevice?.(deviceId) ?? false
	});
	for (const entry of pruned) {
		context.logGateway.info(`device pairing pruned superseded silent pairing device=${entry.deviceId} roles=${entry.roles.join(",") || "none"}`);
		context.invalidateClientsForDevice?.(entry.deviceId, { reason: "device-pair-removed" });
		if (entry.roles.includes("node")) context.broadcast("node.pair.resolved", {
			requestId: "",
			nodeId: entry.deviceId,
			decision: "removed",
			ts: Date.now()
		}, { dropIfSlow: true });
		context.disconnectClientsForDevice?.(entry.deviceId);
	}
	return pruned;
}
//#endregion
//#region src/gateway/server/ws-connection/connect-device-tokens.ts
async function issueGatewayConnectDeviceTokens(params) {
	const { state, scopes, hasApprovedDeviceBaseline } = params;
	const { role, device, isBrowserOperatorUi, isWebchat, trustedProxyAuthOk, usesSharedGatewayAuth, sessionSharedGatewaySessionGeneration, deviceTokenSharedGatewaySessionGeneration, handoffBootstrapProfile } = state;
	const sharedGatewayAuthIssuer = sessionSharedGatewaySessionGeneration && (deviceTokenSharedGatewaySessionGeneration !== void 0 || usesSharedGatewayAuth && (isBrowserOperatorUi || isWebchat)) ? {
		kind: "shared-gateway-auth",
		generation: sessionSharedGatewaySessionGeneration
	} : void 0;
	const issuedDeviceGrant = !trustedProxyAuthOk && device && hasApprovedDeviceBaseline ? await require_device_pairing.ensureDeviceToken({
		deviceId: device.id,
		role,
		scopes,
		issuer: sharedGatewayAuthIssuer
	}) : null;
	const bootstrapDeviceTokens = [];
	if (issuedDeviceGrant) bootstrapDeviceTokens.push({
		deviceToken: issuedDeviceGrant.token,
		role: issuedDeviceGrant.role,
		scopes: issuedDeviceGrant.scopes,
		issuedAtMs: issuedDeviceGrant.rotatedAtMs ?? issuedDeviceGrant.createdAtMs
	});
	if (device && handoffBootstrapProfile) for (const bootstrapRole of handoffBootstrapProfile.roles) {
		if (bootstrapDeviceTokens.some((entry) => entry.role === bootstrapRole)) continue;
		const bootstrapRoleScopes = bootstrapRole === "operator" ? require_device_bootstrap.resolveBootstrapProfileScopesForRole(bootstrapRole, handoffBootstrapProfile.scopes, handoffBootstrapProfile.purpose) : [];
		const extraToken = await require_device_pairing.ensureDeviceToken({
			deviceId: device.id,
			role: bootstrapRole,
			scopes: bootstrapRoleScopes
		});
		if (!extraToken) continue;
		bootstrapDeviceTokens.push({
			deviceToken: extraToken.token,
			role: extraToken.role,
			scopes: extraToken.scopes,
			issuedAtMs: extraToken.rotatedAtMs ?? extraToken.createdAtMs
		});
	}
	return {
		deviceToken: issuedDeviceGrant,
		bootstrapDeviceTokens
	};
}
//#endregion
//#region src/gateway/server/ws-connection/connect-existing-device.ts
async function authorizeExistingGatewayDevice(params) {
	const { context, state, paired, devicePublicKey, clientAccessMetadata, requirePairing } = params;
	const { connectParams, hasBrowserOriginHeader, reportedClientIp } = context;
	const { connId, logGateway } = context.handler;
	const { role, scopes, device, deviceAuthPayloadVersion, authMethod, bootstrapTokenCandidate, pairingLocality, isControlUi, isBrowserOperatorUi, isWebchat, isNativeAppUi } = state;
	let { handoffBootstrapProfile } = params;
	const claimedPlatform = connectParams.client.platform;
	const pairedPlatform = paired.platform;
	const claimedDeviceFamily = connectParams.client.deviceFamily;
	const pairedDeviceFamily = paired.deviceFamily;
	const metadataPinning = resolvePinnedClientMetadata({
		clientId: connectParams.client.id,
		clientMode: connectParams.client.mode,
		claimedPlatform,
		claimedDeviceFamily,
		pairedPlatform,
		pairedDeviceFamily
	});
	const { platformMismatch, deviceFamilyMismatch } = metadataPinning;
	if (platformMismatch || deviceFamilyMismatch) {
		if (!require_node_connect_reconcile.shouldAllowSilentLocalPairing({
			locality: pairingLocality,
			hasBrowserOriginHeader,
			isControlUi,
			isWebchat,
			isNativeAppUi,
			reason: "metadata-upgrade"
		})) logGateway.warn(`security audit: device metadata upgrade requested reason=metadata-upgrade device=${device?.id} ip=${reportedClientIp ?? "unknown-ip"} auth=${authMethod} payload=${deviceAuthPayloadVersion ?? "unknown"} claimedPlatform=${claimedPlatform ?? "<none>"} pinnedPlatform=${pairedPlatform ?? "<none>"} claimedDeviceFamily=${claimedDeviceFamily ?? "<none>"} pinnedDeviceFamily=${pairedDeviceFamily ?? "<none>"} client=${connectParams.client.id} conn=${connId}`);
		if (!await requirePairing("metadata-upgrade", paired)) return {
			ok: false,
			handoffBootstrapProfile
		};
	} else {
		if (metadataPinning.pinnedPlatform) connectParams.client.platform = metadataPinning.pinnedPlatform;
		if (metadataPinning.pinnedDeviceFamily) connectParams.client.deviceFamily = metadataPinning.pinnedDeviceFamily;
	}
	const pairedRoles = require_device_pairing.listEffectivePairedDeviceRoles(paired);
	const pairedScopes = resolvePairedAccessScopes(paired);
	const allowedRoles = new Set(pairedRoles);
	if (allowedRoles.size === 0 || !allowedRoles.has(role)) {
		params.logUpgradeAudit("role-upgrade", pairedRoles, pairedScopes);
		if (!await requirePairing("role-upgrade", paired)) return {
			ok: false,
			handoffBootstrapProfile
		};
	}
	if (scopes.length > 0) {
		if (!(pairedScopes.length > 0 && require_operator_scope_compat.roleScopesAllow({
			role,
			requestedScopes: scopes,
			allowedScopes: pairedScopes
		}))) {
			params.logUpgradeAudit("scope-upgrade", pairedRoles, pairedScopes);
			if (!await requirePairing("scope-upgrade", paired)) return {
				ok: false,
				handoffBootstrapProfile
			};
		}
	}
	const retryBootstrapHandoffProfile = authMethod === "bootstrap-token" && bootstrapTokenCandidate && isMobileNodeBootstrapConnect({
		role,
		scopes,
		isControlUi,
		isBrowserOperatorUi,
		isWebchat,
		clientMode: connectParams.client.mode
	}) && device ? await require_device_bootstrap.getBoundDeviceBootstrapProfile({
		token: bootstrapTokenCandidate,
		deviceId: device.id,
		publicKey: devicePublicKey
	}) : null;
	if (retryBootstrapHandoffProfile) {
		const retryBootstrapOperatorScopes = require_device_bootstrap.resolveBootstrapProfileScopesForRole("operator", retryBootstrapHandoffProfile.scopes, retryBootstrapHandoffProfile.purpose);
		if (require_device_bootstrap.isMobilePairingSetupBootstrapProfile(retryBootstrapHandoffProfile) && isSetupCodeMobileBootstrapClient(connectParams.client)) {
			if (!(pairedRoles.includes("operator") && require_operator_scope_compat.roleScopesAllow({
				role: "operator",
				requestedScopes: retryBootstrapOperatorScopes,
				allowedScopes: pairedScopes
			}))) {
				params.logUpgradeAudit("scope-upgrade", pairedRoles, pairedScopes);
				if (!await requirePairing("scope-upgrade", paired)) return {
					ok: false,
					handoffBootstrapProfile
				};
			}
			if (pairedDeviceAllowsBootstrapOperator({
				device: device ? await require_device_pairing.getPairedDevice(device.id) : null,
				devicePublicKey,
				profile: retryBootstrapHandoffProfile
			})) handoffBootstrapProfile = retryBootstrapHandoffProfile;
		}
	}
	if (device) await require_device_pairing.updatePairedDeviceMetadata(device.id, {
		...clientAccessMetadata,
		...metadataPinning.refreshPairedPlatform ? { platform: metadataPinning.refreshPairedPlatform } : {}
	});
	return {
		ok: true,
		handoffBootstrapProfile
	};
}
//#endregion
//#region src/gateway/node-pairing-ssh-verify.runtime.ts
const MAX_PROBE_OUTPUT_BYTES = 64 * 1024;
const REMOTE_IDENTITY_COMMAND = "sh -lc 'operator node identity --json'";
/** Read the node device identity back from the pairing host over SSH. */
async function runNodeIdentityProbe(params) {
	const args = [
		"-o",
		"BatchMode=yes",
		"-o",
		"ConnectTimeout=5",
		"-o",
		"NumberOfPasswordPrompts=0",
		"-o",
		"PreferredAuthentications=publickey",
		"-o",
		"StrictHostKeyChecking=yes",
		"-o",
		"UpdateHostKeys=no",
		"-a",
		"-x",
		"-o",
		"ForwardAgent=no",
		"-o",
		"ForwardX11=no",
		"-o",
		"ForwardX11Trusted=no",
		"-o",
		"ClearAllForwardings=yes",
		"-o",
		"ExitOnForwardFailure=yes",
		"-p",
		String(params.port ?? 22)
	];
	if (params.identity?.trim()) args.push("-i", params.identity.trim(), "-o", "IdentitiesOnly=yes");
	args.push("--", `${params.user}@${params.host}`, REMOTE_IDENTITY_COMMAND);
	try {
		const result = await require_exec.runCommandWithTimeout(["ssh", ...args], {
			maxOutputBytes: MAX_PROBE_OUTPUT_BYTES,
			outputCapture: "head",
			timeoutMs: Math.max(250, params.timeoutMs)
		});
		if (result.termination === "timeout") return { status: "timeout" };
		if (result.code === 0) return {
			status: "ok",
			stdout: result.stdout
		};
		return {
			status: "failed",
			code: result.code,
			stderr: result.stderr
		};
	} catch (error) {
		return {
			status: "spawn-error",
			message: error instanceof Error ? error.message : String(error)
		};
	}
}
//#endregion
//#region src/gateway/node-pairing-ssh-verify.ts
const DEFAULT_TIMEOUT_MS = 7e3;
const FAILURE_COOLDOWN_MS = 6e4;
const MISMATCH_COOLDOWN_MS = 5 * 6e4;
const MAX_CONCURRENT_PROBES = 4;
const MAX_COOLDOWN_ENTRIES = 512;
function resolveProcessUser() {
	try {
		const user = node_os.default.userInfo().username.trim();
		if (user) return user;
	} catch {}
	return (process.env.USER ?? process.env.USERNAME)?.trim() || void 0;
}
/** Normalize the enabled-by-default config union into a probe policy, or null when off. */
function resolveNodePairingSshVerifyPolicy(raw) {
	if (raw === false) return null;
	const cfg = typeof raw === "object" && raw !== null ? raw : {};
	const user = cfg.user?.trim() || resolveProcessUser();
	if (!user) return null;
	const cidrs = cfg.cidrs?.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
	return {
		user,
		identity: cfg.identity?.trim() || void 0,
		timeoutMs: typeof cfg.timeoutMs === "number" && Number.isFinite(cfg.timeoutMs) && cfg.timeoutMs > 0 ? cfg.timeoutMs : DEFAULT_TIMEOUT_MS,
		cidrs: cidrs && cidrs.length > 0 ? cidrs : void 0
	};
}
function normalizeProbeHost(reportedClientIp) {
	const trimmed = reportedClientIp.trim();
	const host = trimmed.toLowerCase().startsWith("::ffff:") ? trimmed.slice(7) : trimmed;
	if (host.includes("%") || node_net.default.isIP(host) === 0) return null;
	return host;
}
/**
* Resolve whether this pairing request qualifies for an SSH verification probe.
* Shares the fresh-node eligibility floor with trusted-CIDR auto-approval and
* additionally bounds the probe target: default private/CGNAT ranges only, so
* a token holder cannot use the gateway as an SSH probe primitive against
* arbitrary public addresses.
*/
function planNodePairingSshVerify(params) {
	const policy = resolveNodePairingSshVerifyPolicy(params.config);
	if (!policy) return null;
	if (!isEligibleFreshNodePairingRequest(params.eligibility) || !params.eligibility.reportedClientIp) return null;
	if (!(policy.cidrs ? require_net.isTrustedProxyAddress(params.eligibility.reportedClientIp, policy.cidrs) : require_net.isPrivateOrLoopbackAddress(params.eligibility.reportedClientIp) && !require_net.isLoopbackAddress(params.eligibility.reportedClientIp))) return null;
	const host = normalizeProbeHost(params.eligibility.reportedClientIp);
	return host ? {
		policy,
		host
	} : null;
}
function parseRemoteIdentity(stdout) {
	for (const line of stdout.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("{")) continue;
		try {
			const parsed = JSON.parse(trimmed);
			if (typeof parsed.deviceId === "string" && typeof parsed.publicKey === "string") return {
				deviceId: parsed.deviceId.trim(),
				publicKey: parsed.publicKey.trim()
			};
		} catch {}
	}
	return null;
}
const inFlightByKey = /* @__PURE__ */ new Map();
const cooldownExpiryByKey = /* @__PURE__ */ new Map();
function probeKey(host, deviceId) {
	return `${host}\0${deviceId}`;
}
function pruneCooldowns(nowMs) {
	for (const [key, expiry] of cooldownExpiryByKey) if (expiry <= nowMs) cooldownExpiryByKey.delete(key);
	while (cooldownExpiryByKey.size > MAX_COOLDOWN_ENTRIES) {
		const oldest = cooldownExpiryByKey.keys().next().value;
		if (oldest === void 0) break;
		cooldownExpiryByKey.delete(oldest);
	}
}
/**
* Start an SSH verification for one pending pairing request. Returns null when
* the probe should not run right now (cooldown or concurrency cap) so callers
* keep the default manual-approval reconnect behavior. A reconnect that lands
* while the probe is still running gets `alreadyInFlight: true`: the client
* must keep its retry hint, but only the connection that started the probe
* owns the approval work.
*/
function startNodePairingSshVerify(params) {
	const nowMs = params.nowMs ?? Date.now();
	pruneCooldowns(nowMs);
	const key = probeKey(params.plan.host, params.expectedDeviceId);
	const inFlight = inFlightByKey.get(key);
	if (inFlight) return {
		done: inFlight,
		alreadyInFlight: true
	};
	if ((cooldownExpiryByKey.get(key) ?? 0) > nowMs) return null;
	if (inFlightByKey.size >= MAX_CONCURRENT_PROBES) return null;
	const probe = params.probe ?? runNodeIdentityProbe;
	const tracked = (async () => {
		const result = await probe({
			user: params.plan.policy.user,
			host: params.plan.host,
			identity: params.plan.policy.identity,
			timeoutMs: params.plan.policy.timeoutMs
		});
		if (result.status !== "ok") {
			cooldownExpiryByKey.set(key, Date.now() + FAILURE_COOLDOWN_MS);
			return {
				ok: false,
				reason: "probe-failed"
			};
		}
		const remote = parseRemoteIdentity(result.stdout);
		if (!remote) {
			cooldownExpiryByKey.set(key, Date.now() + FAILURE_COOLDOWN_MS);
			return {
				ok: false,
				reason: "identity-unreadable"
			};
		}
		const expectedKey = require_device_identity.normalizeDevicePublicKeyBase64Url(params.expectedPublicKey);
		const remoteKey = require_device_identity.normalizeDevicePublicKeyBase64Url(remote.publicKey);
		if (!(Boolean(expectedKey) && expectedKey === remoteKey && remote.deviceId === params.expectedDeviceId)) {
			cooldownExpiryByKey.set(key, Date.now() + MISMATCH_COOLDOWN_MS);
			return {
				ok: false,
				reason: "identity-mismatch"
			};
		}
		return {
			ok: true,
			user: params.plan.policy.user,
			host: params.plan.host
		};
	})().finally(() => {
		inFlightByKey.delete(key);
	});
	inFlightByKey.set(key, tracked);
	return {
		done: tracked,
		alreadyInFlight: false
	};
}
//#endregion
//#region src/gateway/server/ws-connection/connect-node-pairing-ssh.ts
function startGatewayNodePairingSshApproval(params) {
	const { context, state, pairing, existingPairedDevice, devicePublicKey, clientAccessMetadata } = params;
	const { connectParams, configSnapshot, reportedClientIp, reportedClientIpSource, hasBrowserOriginHeader, runDetachedConnectWork } = context;
	const { connId, buildRequestContext, logGateway } = context.handler;
	const { device, role, scopes, isControlUi, isWebchat } = state;
	if (!device || pairing.request.silent === true) return false;
	const pendingReq = pairing.request;
	if (!((pendingReq.scopes ?? []).length === 0 && (pendingReq.role === void 0 || pendingReq.role === "node") && (pendingReq.roles ?? []).every((pendingRole) => pendingRole === "node"))) return false;
	const sshVerifyPlan = planNodePairingSshVerify({
		config: configSnapshot.gateway?.nodes?.pairing?.sshVerify,
		eligibility: {
			existingPairedDevice: Boolean(existingPairedDevice),
			role,
			reason: params.reason,
			scopes,
			hasBrowserOriginHeader,
			isControlUi,
			isWebchat,
			reportedClientIpSource,
			reportedClientIp
		}
	});
	const sshVerify = sshVerifyPlan ? startNodePairingSshVerify({
		plan: sshVerifyPlan,
		expectedDeviceId: device.id,
		expectedPublicKey: devicePublicKey
	}) : null;
	if (sshVerifyPlan && sshVerify && !sshVerify.alreadyInFlight) {
		const pendingRequestId = pairing.request.requestId;
		runDetachedConnectWork(async () => {
			const outcome = await sshVerify.done;
			if (!outcome.ok) {
				logGateway.info(`node pairing ssh-verify did not approve device=${device.id} host=${sshVerifyPlan.host} reason=${outcome.reason}`);
				return;
			}
			if ((await require_device_pairing.approveDevicePairing(pendingRequestId, {
				callerScopes: scopes,
				accessMetadata: clientAccessMetadata,
				approvedVia: "ssh-verified"
			}))?.status !== "approved") {
				logGateway.info(`node pairing ssh-verify approval skipped device=${device.id} (request superseded or already resolved)`);
				return;
			}
			logGateway.info(`security audit: device pairing ssh-verified auto-approve device=${device.id} ip=${reportedClientIp ?? "unknown-ip"} sshUser=${outcome.user} client=${connectParams.client.id} conn=${connId}`);
			buildRequestContext().broadcast("device.pair.resolved", {
				requestId: pendingRequestId,
				deviceId: device.id,
				decision: "approved",
				ts: Date.now()
			}, { dropIfSlow: true });
		}, (error) => {
			logGateway.warn(`node pairing ssh-verify failed device=${device.id}: ${String(error)}`);
		});
	}
	return Boolean(sshVerifyPlan && sshVerify);
}
//#endregion
//#region src/gateway/server/ws-connection/connect-device-pairing.ts
async function authorizeGatewayConnectDevice(context, state) {
	const { connId, buildRequestContext, close, send, setHandshakeState, setCloseCause, logGateway } = context.handler;
	const { frame, connectParams, configSnapshot, reportedClientIp, reportedClientIpSource, hasBrowserOriginHeader } = context;
	const { scopes } = state;
	let { handoffBootstrapProfile } = state;
	const { role, isControlUi, isBrowserOperatorUi, isWebchat, isNativeAppUi, device, devicePublicKey, authMethod, bootstrapTokenCandidate, pairingLocality, skipLocalBackendSelfPairing, skipControlUiPairingForDevice } = state;
	let hasServerApprovedDeviceTokenBaseline = false;
	if (device && devicePublicKey) {
		const formatAuditList = (items) => {
			const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueTrimmedStringList)(items);
			return normalized.length > 0 ? normalized.join(",") : "<none>";
		};
		const logUpgradeAudit = (reason, currentRoles, currentScopes) => {
			logGateway.warn(`security audit: device access upgrade requested reason=${reason} device=${device.id} ip=${reportedClientIp ?? "unknown-ip"} auth=${authMethod} roleFrom=${formatAuditList(currentRoles)} roleTo=${role} scopesFrom=${formatAuditList(currentScopes)} scopesTo=${formatAuditList(scopes)} client=${connectParams.client.id} conn=${connId}`);
		};
		const clientPairingMetadata = {
			displayName: connectParams.client.displayName,
			platform: connectParams.client.platform,
			deviceFamily: connectParams.client.deviceFamily,
			clientId: connectParams.client.id,
			clientMode: connectParams.client.mode,
			role,
			scopes,
			remoteIp: reportedClientIp
		};
		const clientAccessMetadata = {
			displayName: connectParams.client.displayName,
			remoteIp: reportedClientIp,
			lastSeenAtMs: Date.now(),
			lastSeenReason: "connect"
		};
		const requirePairing = async (reason, existingPairedDevice = null) => {
			const pairingStateAllowsRequestedAccess = (pairedCandidate) => {
				if (!pairedCandidate || pairedCandidate.publicKey !== devicePublicKey) return false;
				if (!require_device_pairing.hasEffectivePairedDeviceRole(pairedCandidate, role)) return false;
				if (scopes.length === 0) return true;
				const pairedScopes = resolvePairedAccessScopes(pairedCandidate);
				if (pairedScopes.length === 0) return false;
				return require_operator_scope_compat.roleScopesAllow({
					role,
					requestedScopes: scopes,
					allowedScopes: pairedScopes
				});
			};
			const allowSilentLocalPairing = !(existingPairedDevice && role !== "operator") && require_node_connect_reconcile.shouldAllowSilentLocalPairing({
				locality: pairingLocality,
				hasBrowserOriginHeader,
				isControlUi,
				isWebchat,
				isNativeAppUi,
				reason
			});
			const allowSilentTrustedCidrsNodePairing = shouldAutoApproveNodePairingFromTrustedCidrs({
				existingPairedDevice: Boolean(existingPairedDevice),
				role,
				reason,
				scopes,
				hasBrowserOriginHeader,
				isControlUi,
				isWebchat,
				reportedClientIpSource,
				reportedClientIp,
				autoApproveCidrs: configSnapshot.gateway?.nodes?.pairing?.autoApproveCidrs
			});
			const isSetupCodeMobileNodeConnect = isMobileNodeBootstrapConnect({
				role,
				scopes,
				isControlUi,
				isBrowserOperatorUi,
				isWebchat,
				clientMode: connectParams.client.mode
			});
			const boundBootstrapProfile = authMethod === "bootstrap-token" && bootstrapTokenCandidate && (reason === "not-paired" && !existingPairedDevice && (isSetupCodeMobileNodeConnect || isControlUi && role === "operator") || reason === "scope-upgrade" && Boolean(existingPairedDevice) && isSetupCodeMobileNodeConnect) ? await require_device_bootstrap.getBoundDeviceBootstrapProfile({
				token: bootstrapTokenCandidate,
				deviceId: device.id,
				publicKey: devicePublicKey
			}) : null;
			const allowSetupCodeMobileBootstrapPairing = boundBootstrapProfile !== null && require_device_bootstrap.isMobilePairingSetupBootstrapProfile(boundBootstrapProfile) && isSetupCodeMobileNodeConnect && isSetupCodeMobileBootstrapClient(connectParams.client);
			const setupCodeMobileBootstrapProfile = allowSetupCodeMobileBootstrapPairing ? boundBootstrapProfile : null;
			const allowControlUiOperatorBootstrapPairing = isControlUiOperatorBootstrapProfile({
				profile: boundBootstrapProfile,
				requestedScopes: scopes
			});
			const controlUiOperatorBootstrapProfile = allowControlUiOperatorBootstrapPairing ? boundBootstrapProfile : null;
			const bootstrapPairingRoles = setupCodeMobileBootstrapProfile ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([role, ...setupCodeMobileBootstrapProfile.roles]) : controlUiOperatorBootstrapProfile ? ["operator"] : void 0;
			const bootstrapPairingScopes = setupCodeMobileBootstrapProfile ? require_device_bootstrap.resolveBootstrapProfileScopesForRoles(bootstrapPairingRoles ?? [], setupCodeMobileBootstrapProfile.scopes, setupCodeMobileBootstrapProfile.purpose) : controlUiOperatorBootstrapProfile ? require_device_bootstrap.resolveBootstrapProfileScopesForRole("operator", controlUiOperatorBootstrapProfile.scopes, controlUiOperatorBootstrapProfile.purpose) : void 0;
			const bootstrapApprovalProfile = setupCodeMobileBootstrapProfile ?? controlUiOperatorBootstrapProfile;
			const pairing = await require_device_pairing.requestDevicePairing({
				deviceId: device.id,
				publicKey: devicePublicKey,
				...clientPairingMetadata,
				...bootstrapPairingRoles ? {
					roles: bootstrapPairingRoles,
					scopes: bootstrapPairingScopes ?? []
				} : {},
				silent: reason === "scope-upgrade" && !allowSetupCodeMobileBootstrapPairing ? false : allowSilentLocalPairing || allowSilentTrustedCidrsNodePairing || allowSetupCodeMobileBootstrapPairing || allowControlUiOperatorBootstrapPairing
			});
			const requestContext = buildRequestContext();
			const supersededResolvedAt = Date.now();
			for (const superseded of pairing.superseded ?? []) requestContext.broadcast("device.pair.resolved", {
				requestId: superseded.requestId,
				deviceId: superseded.deviceId,
				decision: "rejected",
				ts: supersededResolvedAt
			}, { dropIfSlow: true });
			let approved;
			let resolvedByConcurrentApproval = false;
			let recoveryRequestId;
			const resolveLivePendingRequestId = async () => {
				const pendingList = await require_device_pairing.listDevicePairing();
				const exactPending = pendingList.pending.find((pending) => pending.requestId === pairing.request.requestId);
				if (exactPending) return exactPending.requestId;
				return pendingList.pending.find((pending) => pending.deviceId === device.id && pending.publicKey === devicePublicKey)?.requestId;
			};
			if (pairing.request.silent === true) {
				approved = bootstrapApprovalProfile ? await require_device_pairing.approveBootstrapDevicePairing(pairing.request.requestId, bootstrapApprovalProfile, { accessMetadata: clientAccessMetadata }) : await require_device_pairing.approveDevicePairing(pairing.request.requestId, {
					callerScopes: scopes,
					accessMetadata: clientAccessMetadata,
					approvedVia: allowSilentLocalPairing ? "silent" : "trusted-cidr"
				});
				if (approved?.status === "approved") {
					if (bootstrapApprovalProfile) handoffBootstrapProfile = bootstrapApprovalProfile;
					logGateway.info(`device pairing auto-approved device=${approved.device.deviceId} role=${approved.device.role ?? "unknown"}`);
					requestContext.broadcast("device.pair.resolved", {
						requestId: pairing.request.requestId,
						deviceId: approved.device.deviceId,
						decision: "approved",
						ts: Date.now()
					}, { dropIfSlow: true });
					if (!(allowSetupCodeMobileBootstrapPairing && boundBootstrapProfile)) try {
						await pruneSupersededSilentPairingsAfterApproval({
							deviceId: approved.device.deviceId,
							context: requestContext
						});
					} catch (error) {
						logGateway.warn(`device pairing prune failed device=${approved.device.deviceId} error=${String(error)}`);
					}
				} else {
					const pairedAfterConcurrentApproval = await require_device_pairing.getPairedDevice(device.id);
					resolvedByConcurrentApproval = bootstrapApprovalProfile ? pairedDeviceAllowsBootstrapProfile({
						device: pairedAfterConcurrentApproval,
						devicePublicKey,
						profile: bootstrapApprovalProfile
					}) : pairingStateAllowsRequestedAccess(pairedAfterConcurrentApproval);
					let requestStillPending = false;
					if (!resolvedByConcurrentApproval) {
						recoveryRequestId = await resolveLivePendingRequestId();
						requestStillPending = recoveryRequestId === pairing.request.requestId;
					}
					if (requestStillPending) requestContext.broadcast("device.pair.requested", pairing.request, { dropIfSlow: true });
				}
			} else if (pairing.created) requestContext.broadcast("device.pair.requested", pairing.request, { dropIfSlow: true });
			const sshVerifyStarted = startGatewayNodePairingSshApproval({
				context,
				state: {
					...state,
					scopes,
					handoffBootstrapProfile
				},
				pairing,
				existingPairedDevice,
				devicePublicKey,
				clientAccessMetadata,
				reason
			});
			recoveryRequestId = await resolveLivePendingRequestId();
			if (!(pairing.request.silent === true && (approved?.status === "approved" || resolvedByConcurrentApproval))) {
				const exposeApprovedAccess = existingPairedDevice?.publicKey === devicePublicKey;
				const approvedRoles = exposeApprovedAccess ? require_device_pairing.listApprovedPairedDeviceRoles(existingPairedDevice) : [];
				const approvedScopes = exposeApprovedAccess ? resolvePairedAccessScopes(existingPairedDevice) : [];
				const retryWhileDetachedApprovalPending = authMethod === "bootstrap-token" && reason === "not-paired" && role === "node" && scopes.length === 0 && !existingPairedDevice || sshVerifyStarted;
				const pairingErrorDetails = require_connect_error_details.buildPairingConnectErrorDetails({
					reason,
					requestId: recoveryRequestId,
					...retryWhileDetachedApprovalPending ? {
						recommendedNextStep: "wait_then_retry",
						retryable: true,
						pauseReconnect: false
					} : {},
					deviceId: device.id,
					requestedRole: role,
					requestedScopes: scopes,
					...approvedRoles.length > 0 ? { approvedRoles } : {},
					...approvedScopes.length > 0 ? { approvedScopes } : {}
				});
				const pairingErrorMessage = require_connect_error_details.buildPairingConnectErrorMessage(reason);
				setHandshakeState("failed");
				setCloseCause("pairing-required", {
					deviceId: device.id,
					...recoveryRequestId ? { requestId: recoveryRequestId } : {},
					reason
				});
				send({
					type: "res",
					id: frame.id,
					ok: false,
					error: require_error_codes.errorShape(require_error_codes.ErrorCodes.NOT_PAIRED, pairingErrorMessage, { details: pairingErrorDetails })
				});
				close(1008, truncateCloseReason(require_connect_error_details.buildPairingConnectCloseReason({
					reason,
					requestId: recoveryRequestId
				})));
				return false;
			}
			return true;
		};
		const paired = await require_device_pairing.getPairedDevice(device.id);
		if (!(paired?.publicKey === devicePublicKey)) {
			if (!(skipLocalBackendSelfPairing || skipControlUiPairingForDevice)) {
				if (!await requirePairing("not-paired", paired)) return;
				hasServerApprovedDeviceTokenBaseline = true;
			} else if (skipControlUiPairingForDevice || skipLocalBackendSelfPairing && authMethod !== "device-token") hasServerApprovedDeviceTokenBaseline = true;
		} else {
			hasServerApprovedDeviceTokenBaseline = true;
			const existingDevice = await authorizeExistingGatewayDevice({
				context,
				state: {
					...state,
					scopes,
					handoffBootstrapProfile
				},
				paired,
				devicePublicKey,
				clientAccessMetadata,
				handoffBootstrapProfile,
				requirePairing,
				logUpgradeAudit
			});
			if (!existingDevice.ok) return;
			handoffBootstrapProfile = existingDevice.handoffBootstrapProfile;
		}
	}
	const { deviceToken, bootstrapDeviceTokens } = await issueGatewayConnectDeviceTokens({
		state: {
			...state,
			scopes,
			handoffBootstrapProfile
		},
		scopes,
		hasApprovedDeviceBaseline: hasServerApprovedDeviceTokenBaseline
	});
	return {
		...state,
		scopes,
		handoffBootstrapProfile,
		deviceToken,
		bootstrapDeviceTokens
	};
}
//#endregion
//#region src/gateway/control-ui-plugin-tabs.ts
/** Pure projection of tab descriptors visible to the presented scopes. */
function projectControlUiPluginTabs(entries, scopes) {
	const tabs = [];
	for (const entry of entries) {
		const descriptor = entry.descriptor;
		if (descriptor.surface !== "tab") continue;
		if (!(descriptor.requiredScopes ?? []).every((scope) => require_method_scopes.authorizeOperatorScopesForRequiredScope(scope, scopes).allowed)) continue;
		tabs.push({
			pluginId: entry.pluginId,
			id: descriptor.id,
			label: descriptor.label,
			description: descriptor.description,
			icon: descriptor.icon,
			path: descriptor.path,
			group: descriptor.group,
			order: descriptor.order
		});
	}
	return tabs.toSorted((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
}
/** Lists active plugins' tab descriptors visible to the presented scopes. */
function listControlUiPluginTabs(scopes) {
	return projectControlUiPluginTabs(require_runtime.getActivePluginRegistry()?.controlUiDescriptors ?? [], scopes);
}
//#endregion
//#region src/gateway/server/ws-connection/connect-hello.ts
async function sendGatewayHello(context, state, pluginSurfaceUrls) {
	const { connId, nodeReapprovalCoordinator, gatewayMethods, events, buildRequestContext, refreshHealthSnapshot, close, advanceHandshakePhase, setCloseCause, logGateway, logHealth } = context.handler;
	const { frame, connectParams, sendFrame, pendingNodePairingCleanup, releasePendingNodePairingCleanup } = context;
	const { resolvedAuth, role, scopes, device, hasTokenAuth, hasPasswordAuth, bootstrapTokenCandidate, authMethod, issuedBootstrapProfile, handoffBootstrapProfile, deviceToken, bootstrapDeviceTokens } = state;
	const snapshot = require_health_state.buildGatewaySnapshot({ includeSensitive: scopes.includes(require_operator_scopes.ADMIN_SCOPE) });
	const cachedHealth = require_health_state.getHealthCache();
	if (cachedHealth) {
		snapshot.health = cachedHealth;
		snapshot.stateVersion.health = require_health_state.getHealthVersion();
	}
	const helloOkAuthScopes = deviceToken ? deviceToken.scopes : scopes;
	const controlUiTabs = listControlUiPluginTabs(helloOkAuthScopes);
	const helloOk = {
		type: "hello-ok",
		protocol: 4,
		server: {
			version: require_version.resolveRuntimeServiceVersion(process.env),
			connId
		},
		features: {
			methods: gatewayMethods,
			events,
			capabilities: [require_schema.GATEWAY_SERVER_CAPS.CHAT_SEND_ROUTING_CONTRACT, require_schema.GATEWAY_SERVER_CAPS.SYSTEM_AGENT_SETUP_MODEL_REF]
		},
		snapshot,
		...controlUiTabs.length > 0 ? { controlUiTabs } : {},
		...Object.keys(pluginSurfaceUrls).length > 0 ? { pluginSurfaceUrls } : {},
		auth: {
			role,
			scopes: helloOkAuthScopes,
			...deviceToken ? {
				deviceToken: deviceToken.token,
				issuedAtMs: deviceToken.rotatedAtMs ?? deviceToken.createdAtMs,
				...bootstrapDeviceTokens.length > 1 ? { deviceTokens: bootstrapDeviceTokens.slice(1) } : {}
			} : {}
		},
		policy: {
			maxPayload: require_server_constants.MAX_PAYLOAD_BYTES,
			maxBufferedBytes: require_server_constants.MAX_BUFFERED_BYTES,
			tickIntervalMs: require_server_constants.TICK_INTERVAL_MS
		}
	};
	advanceHandshakePhase("hello_payload_prepared");
	let revokedBootstrapTokenRecord;
	if (authMethod === "bootstrap-token" && bootstrapTokenCandidate && device) try {
		if (handoffBootstrapProfile || issuedBootstrapProfile) {
			const redemption = await require_device_bootstrap.redeemDeviceBootstrapTokenProfile({
				token: bootstrapTokenCandidate,
				role,
				scopes
			});
			if (handoffBootstrapProfile || redemption.fullyRedeemed) {
				const revoked = await require_device_bootstrap.revokeDeviceBootstrapToken({ token: bootstrapTokenCandidate });
				if (!revoked.removed) logGateway.warn(`bootstrap token revoke skipped after profile redemption device=${device.id}`);
				else revokedBootstrapTokenRecord = revoked.record;
			}
		}
	} catch (err) {
		logGateway.warn(`bootstrap token post-connect bookkeeping failed device=${device.id}: ${require_ws_log.formatForLog(err)}`);
	}
	try {
		await sendFrame({
			type: "res",
			id: frame.id,
			ok: true,
			payload: helloOk
		});
	} catch (err) {
		if (revokedBootstrapTokenRecord) try {
			await require_device_bootstrap.restoreDeviceBootstrapToken({ record: revokedBootstrapTokenRecord });
		} catch (restoreErr) {
			logGateway.warn(`bootstrap token restore after hello-send failure failed device=${device?.id ?? "unknown"}: ${require_ws_log.formatForLog(restoreErr)}`);
		}
		await releasePendingNodePairingCleanup();
		setCloseCause("hello-send-failed", { error: require_ws_log.formatForLog(err) });
		close();
		return;
	}
	let authProvided = authMethod;
	if (authMethod !== "device-token" && authMethod !== "bootstrap-token") {
		if (hasPasswordAuth) authProvided = "password";
		else if (hasTokenAuth) authProvided = "token";
	}
	emitGatewayAuthSecurityEvent({
		action: "gateway.auth.succeeded",
		outcome: "success",
		severity: "low",
		authMode: resolvedAuth.mode,
		authMethod,
		authProvided,
		role,
		scopes: helloOkAuthScopes,
		clientMode: connectParams.client.mode,
		deviceId: device?.id
	});
	advanceHandshakePhase("ready");
	if (role === "node") {
		const requestContext = buildRequestContext();
		const nodeId = connectParams.device?.id ?? connectParams.client.id;
		const nodeSession = requestContext.nodeRegistry.get(nodeId);
		if (nodeSession?.connId === connId) require_node_connection_notifications.scheduleNodeConnectionNotification(requestContext.nodeRegistry, nodeSession);
	}
	if (pendingNodePairingCleanup.value) {
		const requestContext = buildRequestContext();
		const cleanupClaim = pendingNodePairingCleanup.value;
		pendingNodePairingCleanup.value = void 0;
		try {
			const resolvedPairings = nodeReapprovalCoordinator ? await nodeReapprovalCoordinator.finalizeCleanup(cleanupClaim) : await require_node_pairing.finalizeNodePairingCleanupClaim(cleanupClaim);
			const resolvedAt = Date.now();
			for (const resolved of resolvedPairings) requestContext.broadcast("node.pair.resolved", {
				requestId: resolved.requestId,
				nodeId: resolved.nodeId,
				decision: "rejected",
				ts: resolvedAt
			}, { dropIfSlow: true });
		} catch (error) {
			logGateway.warn(`failed to clear stale pending pairings for ${cleanupClaim.nodeId}: ${require_ws_log.formatForLog(error)}`);
		}
	}
	require_ws_log.logWs("out", "hello-ok", {
		connId,
		methods: gatewayMethods.length,
		events: events.length,
		presence: snapshot.presence.length,
		stateVersion: snapshot.stateVersion.presence
	});
	refreshHealthSnapshot({ probe: false }).catch((err) => logHealth.error(`post-connect health refresh failed: ${require_errors.formatErrorMessage(err)}`));
}
//#endregion
//#region src/gateway/node-legacy-protocol-filter.ts
const BUILT_IN_NODE_COMMANDS = /* @__PURE__ */ new Set([
	...Object.values(require_node_command_policy.PLATFORM_DEFAULTS).flat(),
	...require_node_command_policy.DEFAULT_DANGEROUS_NODE_COMMANDS,
	...require_node_command_policy.TALK_PTT_COMMANDS,
	...require_node_command_policy.IOS_WATCH_RELAY_COMMANDS
]);
function filterLegacyNodeProtocolFeatures(params) {
	const registry = require_runtime.getActivePluginGatewayNodePolicyRegistry();
	if (!registry) return {
		caps: [...params.caps],
		commands: [...params.commands]
	};
	const pluginIds = /* @__PURE__ */ new Set([...registry.nodeHostCommands.map((entry) => entry.pluginId), ...registry.nodeInvokePolicies.map((entry) => entry.pluginId)]);
	const pluginCaps = /* @__PURE__ */ new Set([...params.pluginSurfaces, ...pluginIds]);
	const isPluginOnly = (command) => !BUILT_IN_NODE_COMMANDS.has(command);
	const pluginCommands = /* @__PURE__ */ new Set([...registry.nodeHostCommands.map((entry) => entry.command.command).filter(isPluginOnly), ...registry.nodeInvokePolicies.flatMap((entry) => entry.policy.commands).filter(isPluginOnly)]);
	return {
		caps: params.caps.filter((cap) => !pluginCaps.has(cap)),
		commands: params.commands.filter((command) => !pluginCommands.has(command))
	};
}
//#endregion
//#region src/gateway/server/ws-connection/connect-node-session.ts
var NodePairingRateLimitError = class extends Error {
	constructor(retryAfterMs) {
		super("node pairing rate limited");
		this.retryAfterMs = retryAfterMs;
	}
};
async function requestNodePairingFromConnect(params) {
	if (params.pairedReconnect) return params.reapprovalCoordinator ? await params.reapprovalCoordinator.request({
		input: params.input,
		cleanupClaim: params.cleanupClaim
	}) : await require_node_pairing.requestNodePairing(params.input);
	if (!params.rateLimiter) return await require_node_pairing.requestNodePairing(params.input);
	return await require_auth.withSerializedRateLimitAttempt({
		ip: params.clientIp,
		scope: require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_NODE_PAIRING,
		run: async () => {
			const rateCheck = params.rateLimiter?.check(params.clientIp, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_NODE_PAIRING);
			if (rateCheck && !rateCheck.allowed) throw new NodePairingRateLimitError(rateCheck.retryAfterMs);
			const result = await require_node_pairing.requestNodePairing(params.input);
			params.rateLimiter?.recordFailure(params.clientIp, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_NODE_PAIRING);
			return result;
		}
	});
}
async function prepareGatewayNodeConnect(context, state) {
	if (state.role !== "node") return true;
	const { pluginNodeCapabilities = [], nodeReapprovalCoordinator, buildRequestContext, logGateway } = context.handler;
	const { connectParams, reportedClientIp, authRateLimiter, browserRateLimitClientIp, pendingNodePairingCleanup, releasePendingNodePairingCleanup, broadcastNodePairingResult } = context;
	const { device, devicePublicKey, usesLegacyNodeProtocol, rejectUnauthorized } = state;
	const nodePairingSnapshot = await require_node_pairing.beginNodePairingConnect(connectParams.device?.id ?? connectParams.client.id);
	const pairedNode = nodePairingSnapshot.pairedNode;
	pendingNodePairingCleanup.value = nodePairingSnapshot.cleanupClaim;
	const pairedDeviceForSurface = device && devicePublicKey ? await require_device_pairing.getPairedDevice(device.id) : null;
	const deviceApprovedVia = pairedDeviceForSurface?.publicKey === devicePublicKey ? pairedDeviceForSurface?.approvedVia : void 0;
	const deviceApprovedNonInteractively = deviceApprovedVia === "silent" || deviceApprovedVia === "ssh-verified" || deviceApprovedVia === "bootstrap";
	let reconciliation;
	try {
		reconciliation = await require_node_connect_reconcile.reconcileNodePairingOnConnect({
			cfg: require_io.getRuntimeConfig(),
			connectParams,
			pairedNode,
			reportedClientIp,
			initialSurfaceSilent: deviceApprovedNonInteractively,
			requestPairing: async (input) => {
				return await requestNodePairingFromConnect({
					input,
					rateLimiter: authRateLimiter,
					clientIp: browserRateLimitClientIp,
					pairedReconnect: pairedNode !== null,
					cleanupClaim: pendingNodePairingCleanup.value,
					reapprovalCoordinator: nodeReapprovalCoordinator
				});
			}
		});
	} catch (error) {
		await releasePendingNodePairingCleanup();
		if (error instanceof NodePairingRateLimitError) {
			rejectUnauthorized({
				ok: false,
				reason: "rate_limited",
				rateLimited: true,
				retryAfterMs: error.retryAfterMs
			});
			return false;
		}
		throw error;
	}
	if (deviceApprovedVia === "ssh-verified" && !pairedNode && reconciliation.pendingPairing) {
		const surfaceRequestId = reconciliation.pendingPairing.request.requestId;
		const approvedSurface = await require_node_pairing.approveNodePairing(surfaceRequestId, { callerScopes: [
			require_operator_scopes.ADMIN_SCOPE,
			require_operator_scopes.PAIRING_SCOPE,
			require_operator_scopes.WRITE_SCOPE
		] });
		if (approvedSurface && "node" in approvedSurface) {
			logGateway.info(`security audit: node capability surface ssh-verified auto-approve node=${reconciliation.nodeId} commands=${reconciliation.declaredCommands.join(",") || "<none>"}`);
			buildRequestContext().broadcast("node.pair.resolved", {
				requestId: surfaceRequestId,
				nodeId: reconciliation.nodeId,
				decision: "approved",
				ts: Date.now()
			}, { dropIfSlow: true });
			reconciliation = {
				...reconciliation,
				effectiveCaps: reconciliation.declaredCaps,
				effectiveCommands: reconciliation.declaredCommands,
				effectivePermissions: reconciliation.declaredPermissions,
				pendingPairing: void 0,
				shouldClearPendingPairings: true
			};
		}
	}
	if (!reconciliation.shouldClearPendingPairings) await releasePendingNodePairingCleanup();
	if (reconciliation.pendingPairing) broadcastNodePairingResult(reconciliation.pendingPairing);
	const nodeConnectParams = connectParams;
	nodeConnectParams.declaredCaps = reconciliation.declaredCaps;
	nodeConnectParams.declaredCommands = reconciliation.declaredCommands;
	nodeConnectParams.declaredPermissions = reconciliation.declaredPermissions;
	const pluginSurfaces = pluginNodeCapabilities.map((surface) => surface.surface);
	if (usesLegacyNodeProtocol) {
		const sessionCeiling = filterLegacyNodeProtocolFeatures({
			caps: reconciliation.declaredCaps,
			commands: reconciliation.declaredCommands,
			pluginSurfaces
		});
		nodeConnectParams.sessionCapsCeiling = sessionCeiling.caps;
		nodeConnectParams.sessionCommandsCeiling = sessionCeiling.commands;
	}
	const effectiveFeatures = usesLegacyNodeProtocol ? filterLegacyNodeProtocolFeatures({
		caps: reconciliation.effectiveCaps,
		commands: reconciliation.effectiveCommands,
		pluginSurfaces
	}) : {
		caps: reconciliation.effectiveCaps,
		commands: reconciliation.effectiveCommands
	};
	connectParams.caps = effectiveFeatures.caps;
	connectParams.commands = effectiveFeatures.commands;
	connectParams.permissions = reconciliation.effectivePermissions;
	return true;
}
//#endregion
//#region src/gateway/server/ws-connection/connect-session.ts
/** Match production release versions (YYYY.M.PATCH or YYYY.M.PATCH-beta.N). */
const RELEASED_VERSION_RE = /^\d{4}\.\d+\.\d+/;
function isReleasedVersion(version) {
	return RELEASED_VERSION_RE.test(version);
}
/**
* Lazily resolve the local node host's nodeId from canonical shared SQLite state.
* Process-stable: only changes on `operator node install`, which requires restart.
*/
let cachedLocalNodeId;
async function resolveLocalNodeId() {
	cachedLocalNodeId ??= require_config.loadNodeHostConfig().then((config) => config?.nodeId ?? null);
	return await cachedLocalNodeId;
}
function setSocketMaxPayload(socket, maxPayload) {
	const receiver = socket["_receiver"];
	if (receiver) receiver["_maxPayload"] = maxPayload;
}
async function attachAuthenticatedGatewayConnect(context, state) {
	const { socket, connId, remoteAddr, pluginSurfaceBaseUrl, pluginNodeCapabilities = [], buildRequestContext, close, isClosed, clearHandshakeTimer, setClient, setHandshakeState, advanceHandshakePhase, setCloseCause, logGateway, logWsControl } = context.handler;
	const { connectParams, isLocalClient, reportedClientIp, runDetachedConnectWork, isWebchatConnect, clientLabel, clientMeta, markHandshakeFailure, sendHandshakeErrorResponse, releasePendingNodePairingCleanup } = context;
	const { minProtocol, maxProtocol, usesLegacyNodeProtocol, role, scopes, device, authMethod, pairingLocality, sessionUsesSharedGatewayAuth, sessionSharedGatewaySessionGeneration } = state;
	if (!await prepareGatewayNodeConnect(context, state)) return;
	const shouldTrackPresence = !require_message_channel.isEphemeralGatewayClient(connectParams.client);
	const clientId = connectParams.client.id;
	const instanceId = connectParams.client.instanceId;
	const presenceKey = shouldTrackPresence ? device?.id ?? instanceId ?? connId : void 0;
	if (isClosed()) {
		await releasePendingNodePairingCleanup();
		setCloseCause("connect-aborted-before-register", {
			...clientMeta,
			auth: authMethod
		});
		return;
	}
	const pluginSurfaceUrls = {};
	const pluginNodeCapabilitySurfaces = require_plugin_node_capability.indexPluginNodeCapabilitySurfaces(pluginNodeCapabilities);
	const pendingPluginNodeCapabilities = [];
	if (pluginSurfaceBaseUrl && !usesLegacyNodeProtocol) for (const pluginCapabilitySurface of Object.values(pluginNodeCapabilitySurfaces)) {
		const capability = require_plugin_node_capability.mintPluginNodeCapabilityToken();
		const expiresAtMs = require_plugin_node_capability.resolvePluginNodeCapabilityExpiresAtMs(pluginCapabilitySurface);
		if (expiresAtMs === void 0) continue;
		const scopedUrl = require_plugin_node_capability.buildPluginNodeCapabilityScopedHostUrl(pluginSurfaceBaseUrl, capability) ?? pluginSurfaceBaseUrl;
		pluginSurfaceUrls[pluginCapabilitySurface.surface] = scopedUrl;
		pendingPluginNodeCapabilities.push({
			surface: pluginCapabilitySurface,
			capability,
			expiresAtMs
		});
	}
	const isTrustedApprovalRuntime = pairingLocality !== "remote" && scopes.includes("operator.approvals") && connectParams.client.id === require_client_info.GATEWAY_CLIENT_IDS.GATEWAY_CLIENT && connectParams.client.mode === require_client_info.GATEWAY_CLIENT_MODES.BACKEND && require_operator_approval_runtime_token.isOperatorApprovalRuntimeToken(connectParams.auth?.approvalRuntimeToken);
	const agentRuntimeIdentityProof = connectParams.auth?.agentRuntimeIdentityToken;
	const canAcceptAgentRuntimeIdentity = pairingLocality !== "remote" && connectParams.client.id === require_client_info.GATEWAY_CLIENT_IDS.GATEWAY_CLIENT && connectParams.client.mode === require_client_info.GATEWAY_CLIENT_MODES.BACKEND;
	let trustedAgentRuntimeIdentity;
	if (typeof agentRuntimeIdentityProof === "string") {
		if (!canAcceptAgentRuntimeIdentity) {
			const message = "agent runtime identity token is only accepted from local backend gateway clients";
			markHandshakeFailure("agent-runtime-identity-untrusted-client", {
				client: connectParams.client.id,
				mode: connectParams.client.mode,
				pairingLocality
			});
			sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, message);
			close(1008, truncateCloseReason(message));
			return;
		}
		trustedAgentRuntimeIdentity = await require_agent_runtime_identity_token.verifyAgentRuntimeIdentityToken(agentRuntimeIdentityProof);
		if (!trustedAgentRuntimeIdentity) {
			const message = "invalid agent runtime identity token";
			markHandshakeFailure("agent-runtime-identity-invalid", {
				client: connectParams.client.id,
				mode: connectParams.client.mode,
				pairingLocality
			});
			sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, message);
			close(1008, message);
			return;
		}
	}
	const internal = isTrustedApprovalRuntime || trustedAgentRuntimeIdentity ? {
		...isTrustedApprovalRuntime ? { approvalRuntime: true } : {},
		...trustedAgentRuntimeIdentity ? { agentRuntimeIdentity: trustedAgentRuntimeIdentity } : {}
	} : void 0;
	if (usesLegacyNodeProtocol) logWsControl.warn(`legacy node protocol accepted conn=${connId} client=${require_ws_log.formatForLog(clientLabel)} v${require_ws_log.formatForLog(connectParams.client.version)} min=${minProtocol} max=${maxProtocol} current=4; upgrade recommended`);
	clearHandshakeTimer();
	const nextClient = {
		socket,
		connect: connectParams,
		connId,
		connectionKind: "gateway",
		isDeviceTokenAuth: authMethod === "device-token",
		usesSharedGatewayAuth: sessionUsesSharedGatewayAuth,
		sharedGatewaySessionGeneration: sessionSharedGatewaySessionGeneration,
		presenceKey,
		clientIp: reportedClientIp,
		...internal ? { internal } : {},
		...Object.keys(pluginSurfaceUrls).length > 0 ? { pluginSurfaceUrls } : {},
		...Object.keys(pluginNodeCapabilitySurfaces).length > 0 ? { pluginNodeCapabilitySurfaces } : {}
	};
	for (const entry of pendingPluginNodeCapabilities) require_plugin_node_capability.setClientPluginNodeCapability({
		client: nextClient,
		surface: entry.surface,
		capability: entry.capability,
		expiresAtMs: entry.expiresAtMs
	});
	setSocketMaxPayload(socket, require_server_constants.MAX_PAYLOAD_BYTES);
	if (role === "node" && isLocalClient) {
		const localNodeId = await resolveLocalNodeId();
		const clientInstanceId = connectParams.client.instanceId?.trim();
		if (localNodeId && clientInstanceId && clientInstanceId === localNodeId) {
			const gatewayVersion = require_version.resolveRuntimeServiceVersion(process.env);
			const clientVersion = connectParams.client.version;
			if (clientVersion && gatewayVersion && clientVersion !== gatewayVersion && isReleasedVersion(gatewayVersion) && isReleasedVersion(clientVersion)) {
				logWsControl.info(`node version mismatch conn=${connId} client=${require_ws_log.formatForLog(clientLabel)} clientVersion=${require_ws_log.formatForLog(clientVersion)} gatewayVersion=${gatewayVersion}; closing for supervisor restart`);
				sendHandshakeErrorResponse(require_error_codes.ErrorCodes.INVALID_REQUEST, "client version mismatch", { details: {
					code: require_connect_error_details.ConnectErrorDetailCodes.CLIENT_VERSION_MISMATCH,
					clientVersion,
					gatewayVersion
				} });
				await releasePendingNodePairingCleanup();
				close(1008, "client version mismatch");
				return;
			}
		}
	}
	if (!setClient(nextClient)) {
		await releasePendingNodePairingCleanup();
		setCloseCause("connect-aborted-before-register", {
			...clientMeta,
			auth: authMethod
		});
		return;
	}
	setHandshakeState("connected");
	advanceHandshakePhase("session_attached");
	require_ws_log.logWs("in", "connect", {
		connId,
		client: connectParams.client.id,
		clientDisplayName: connectParams.client.displayName,
		version: connectParams.client.version,
		mode: connectParams.client.mode,
		clientId,
		platform: connectParams.client.platform,
		auth: authMethod
	});
	if (isWebchatConnect(connectParams)) logWsControl.info(`webchat connected conn=${connId} remote=${remoteAddr ?? "?"} client=${clientLabel} ${connectParams.client.mode} v${connectParams.client.version}`);
	if (presenceKey) {
		require_system_presence.upsertPresence(presenceKey, {
			host: connectParams.client.displayName ?? connectParams.client.id ?? node_os.default.hostname(),
			ip: isLocalClient ? void 0 : reportedClientIp,
			version: connectParams.client.version,
			platform: connectParams.client.platform,
			deviceFamily: connectParams.client.deviceFamily,
			modelIdentifier: connectParams.client.modelIdentifier,
			mode: connectParams.client.mode,
			deviceId: device?.id,
			roles: [role],
			scopes,
			instanceId: device?.id ?? instanceId,
			reason: "connect"
		});
		require_health_state.incrementPresenceVersion();
	}
	if (role === "node") {
		const requestContext = buildRequestContext();
		const nodeSession = requestContext.nodeRegistry.register(nextClient, { remoteIp: reportedClientIp });
		const instanceIdRaw = connectParams.client.instanceId;
		const instanceIdLocal = typeof instanceIdRaw === "string" ? instanceIdRaw.trim() : "";
		const nodeIdsForPairing = /* @__PURE__ */ new Set([nodeSession.nodeId]);
		if (instanceIdLocal) nodeIdsForPairing.add(instanceIdLocal);
		for (const nodeId of nodeIdsForPairing) runDetachedConnectWork(async () => {
			await require_node_pairing.updatePairedNodeMetadata(nodeId, { lastConnectedAtMs: nodeSession.connectedAtMs });
		}, (err) => logGateway.warn(`failed to record last connect for ${nodeId}: ${require_ws_log.formatForLog(err)}`));
		require_remote.recordRemoteNodeInfo({
			nodeId: nodeSession.nodeId,
			connId: nodeSession.connId,
			displayName: nodeSession.displayName,
			platform: nodeSession.platform,
			deviceFamily: nodeSession.deviceFamily,
			commands: nodeSession.commands,
			remoteIp: nodeSession.remoteIp
		});
		runDetachedConnectWork(async () => {
			await require_remote.refreshRemoteNodeBins({
				nodeId: nodeSession.nodeId,
				platform: nodeSession.platform,
				deviceFamily: nodeSession.deviceFamily,
				commands: nodeSession.commands,
				cfg: require_io.getRuntimeConfig(),
				readinessDelayMs: 5e3
			});
		}, (err) => logGateway.warn(`remote bin probe failed for ${nodeSession.nodeId}: ${require_ws_log.formatForLog(err)}`));
		runDetachedConnectWork(async () => {
			const cfg = await require_server_utils.loadVoiceWakeConfig();
			requestContext.nodeRegistry.sendEvent(nodeSession.nodeId, "voicewake.changed", { triggers: cfg.triggers });
		}, (err) => logGateway.warn(`voicewake snapshot failed for ${nodeSession.nodeId}: ${require_ws_log.formatForLog(err)}`));
		runDetachedConnectWork(async () => {
			const routing = await require_voicewake_routing.loadVoiceWakeRoutingConfig();
			requestContext.nodeRegistry.sendEvent(nodeSession.nodeId, "voicewake.routing.changed", { config: routing });
		}, (err) => logGateway.warn(`voicewake routing snapshot failed for ${nodeSession.nodeId}: ${require_ws_log.formatForLog(err)}`));
	}
	await sendGatewayHello(context, state, pluginSurfaceUrls);
}
//#endregion
//#region src/gateway/server/ws-connection/message-handler.ts
const GATEWAY_WORK_ADMISSION_RETRY_AFTER_MS = 1e3;
const GATEWAY_WORK_ADMISSION_CLOSE_CODE = 1013;
function claimsWorkerConnectionIdentity(value) {
	if (!value || typeof value !== "object") return false;
	const connect = value;
	if (connect.role === "worker") return true;
	if (!connect.client || typeof connect.client !== "object") return false;
	const client = connect.client;
	return client.id === require_client_info.GATEWAY_CLIENT_IDS.WORKER || client.mode === require_client_info.GATEWAY_CLIENT_MODES.WORKER;
}
function attachGatewayWsMessageHandler(params) {
	const { socket, upgradeReq, connId, remoteAddr, endpoint, forwardedFor, realIp, requestHost, requestOrigin, requestUserAgent, rateLimiter, browserRateLimiter, buildRequestContext, send, close, isClosed, getClient, setHandshakeState, setCloseCause, setLastFrameMeta, logGateway, logWsControl } = params;
	const sendFrame = async (obj) => await new Promise((resolve, reject) => {
		socket.send(JSON.stringify(obj), (err) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
	const configSnapshot = require_io.getRuntimeConfig();
	const trustedProxies = configSnapshot.gateway?.trustedProxies ?? [];
	const allowRealIpFallback = configSnapshot.gateway?.allowRealIpFallback === true;
	const clientIp = require_net.resolveClientIp({
		remoteAddr,
		forwardedFor,
		realIp,
		trustedProxies,
		allowRealIpFallback
	});
	const peerLabel = endpoint ?? remoteAddr ?? "n/a";
	const hasProxyHeaders = require_auth.hasForwardedRequestHeaders(upgradeReq);
	const remoteIsTrustedProxy = require_net.isTrustedProxyAddress(remoteAddr, trustedProxies);
	const hasUntrustedProxyHeaders = hasProxyHeaders && !remoteIsTrustedProxy;
	const hostIsLocalish = require_net.isLocalishHost(requestHost);
	const isLocalClient = require_auth.isLocalDirectRequest(upgradeReq, trustedProxies, allowRealIpFallback);
	const reportedClientIp = isLocalClient || hasUntrustedProxyHeaders ? void 0 : clientIp && !require_net.isLoopbackAddress(clientIp) ? clientIp : void 0;
	const reportedClientIpSource = resolveNodePairingClientIpSource({
		reportedClientIp,
		hasProxyHeaders,
		remoteIsTrustedProxy,
		remoteIsLoopback: require_net.isLoopbackAddress(remoteAddr)
	});
	if (hasUntrustedProxyHeaders) logWsControl.warn("Proxy headers detected from untrusted address. Connection will not be treated as local. Configure gateway.trustedProxies to restore local client detection behind your proxy.");
	if (!hostIsLocalish && require_net.isLoopbackAddress(remoteAddr) && !hasProxyHeaders) logWsControl.warn("Loopback connection with non-local Host header. Treating it as remote. If you're behind a reverse proxy, set gateway.trustedProxies and forward X-Forwarded-For/X-Real-IP.");
	const isWebchatConnect = (p) => require_message_channel.isWebchatClient(p?.client);
	const authenticatedRequestDispatcher = createGatewayAuthenticatedRequestDispatcher({
		handler: params,
		isWebchatConnect
	});
	const { hasBrowserOriginHeader, enforceOriginCheckForAnyClient, rateLimitClientIp: browserRateLimitClientIp, authRateLimiter } = require_node_connect_reconcile.resolveHandshakeBrowserSecurityContext({
		requestOrigin,
		clientIp,
		rateLimiter,
		browserRateLimiter
	});
	const runDetachedConnectWork = (run, onError) => {
		require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(run).catch(onError);
	};
	const handleMessage = async (data) => {
		if (isClosed()) return;
		const preauthPayloadBytes = !getClient() ? require_handshake_auth_log_limiter.rawDataByteLength(data) : void 0;
		if (preauthPayloadBytes !== void 0 && preauthPayloadBytes > 65536) {
			require_diagnostic_payload.logRejectedLargePayload({
				surface: "gateway.ws.preauth",
				bytes: preauthPayloadBytes,
				limitBytes: require_server_constants.MAX_PREAUTH_PAYLOAD_BYTES,
				reason: "preauth_frame_limit"
			});
			setHandshakeState("failed");
			setCloseCause("preauth-payload-too-large", {
				payloadBytes: preauthPayloadBytes,
				limitBytes: require_server_constants.MAX_PREAUTH_PAYLOAD_BYTES
			});
			close(1009, "preauth payload too large");
			return;
		}
		const text = require_handshake_auth_log_limiter.rawDataToString(data);
		const pendingNodePairingCleanup = {};
		const broadcastNodePairingResult = (result) => {
			const context = buildRequestContext();
			const resolvedAt = Date.now();
			for (const superseded of result.created ? result.superseded ?? [] : []) context.broadcast("node.pair.resolved", {
				requestId: superseded.requestId,
				nodeId: superseded.nodeId,
				decision: "rejected",
				ts: resolvedAt
			}, { dropIfSlow: true });
			if (result.created) context.broadcast("node.pair.requested", result.request, { dropIfSlow: true });
		};
		const releasePendingNodePairingCleanup = async () => {
			const claim = pendingNodePairingCleanup.value;
			pendingNodePairingCleanup.value = void 0;
			if (!claim) return;
			try {
				await require_node_pairing.releaseNodePairingCleanupClaim(claim);
			} catch (error) {
				logGateway.warn(`failed to release pending pairing cleanup for ${claim.nodeId}: ${require_ws_log.formatForLog(error)}`);
			}
		};
		try {
			const parsed = JSON.parse(text);
			const client = getClient();
			if (!client && parsed !== null && typeof parsed === "object" && "params" in parsed && claimsWorkerConnectionIdentity(parsed.params)) {
				setHandshakeState("failed");
				setCloseCause("invalid-handshake", { handshakeError: "invalid worker handshake" });
				logWsControl.warn("worker admission rejected reason=invalid-handshake");
				close(1008, "invalid-handshake");
				return;
			}
			const frameType = parsed && typeof parsed === "object" && "type" in parsed ? typeof parsed.type === "string" ? String(parsed.type) : void 0 : void 0;
			const frameMethod = parsed && typeof parsed === "object" && "method" in parsed ? typeof parsed.method === "string" ? String(parsed.method) : void 0 : void 0;
			const frameId = parsed && typeof parsed === "object" && "id" in parsed ? typeof parsed.id === "string" ? String(parsed.id) : void 0 : void 0;
			if (frameType || frameMethod || frameId) setLastFrameMeta({
				type: frameType,
				method: frameMethod,
				id: frameId
			});
			if (!client) {
				const isRequestFrame = require_src.validateRequestFrame(parsed);
				if (!isRequestFrame || parsed.method !== "connect" || !require_src.validateConnectParams(parsed.params)) {
					const handshakeError = isRequestFrame ? parsed.method === "connect" ? `invalid connect params: ${require_validation_errors.formatValidationErrors(require_src.validateConnectParams.errors)}` : "invalid handshake: first request must be connect" : "invalid request frame";
					setHandshakeState("failed");
					setCloseCause("invalid-handshake", {
						frameType,
						frameMethod,
						frameId,
						handshakeError
					});
					if (isRequestFrame) send({
						type: "res",
						id: parsed.id,
						ok: false,
						error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, handshakeError)
					});
					else logWsControl.warn(`invalid handshake conn=${connId} peer=${require_ws_log.formatForLog(peerLabel)} remote=${remoteAddr ?? "?"} fwd=${require_ws_log.formatForLog(forwardedFor ?? "n/a")} origin=${require_ws_log.formatForLog(requestOrigin ?? "n/a")} host=${require_ws_log.formatForLog(requestHost ?? "n/a")} ua=${require_ws_log.formatForLog(requestUserAgent ?? "n/a")}`);
					const closeReason = truncateCloseReason(handshakeError || "invalid handshake");
					if (isRequestFrame) queueMicrotask(() => close(1008, closeReason));
					else close(1008, closeReason);
					return;
				}
				const frame = parsed;
				const connectParams = frame.params;
				const clientLabel = connectParams.client.displayName ?? connectParams.client.id;
				const clientMeta = {
					client: connectParams.client.id,
					clientDisplayName: connectParams.client.displayName,
					mode: connectParams.client.mode,
					version: connectParams.client.version,
					platform: connectParams.client.platform,
					deviceFamily: connectParams.client.deviceFamily,
					modelIdentifier: connectParams.client.modelIdentifier,
					instanceId: connectParams.client.instanceId
				};
				const markHandshakeFailure = (cause, meta) => {
					setHandshakeState("failed");
					setCloseCause(cause, {
						...meta,
						...clientMeta
					});
				};
				const sendHandshakeErrorResponse = (code, message, options) => {
					send({
						type: "res",
						id: frame.id,
						ok: false,
						error: require_error_codes.errorShape(code, message, options)
					});
				};
				const phaseContext = {
					handler: params,
					frame,
					connectParams,
					configSnapshot,
					trustedProxies,
					allowRealIpFallback,
					peerLabel,
					hasProxyHeaders,
					isLocalClient,
					reportedClientIp,
					reportedClientIpSource,
					hasBrowserOriginHeader,
					enforceOriginCheckForAnyClient,
					browserRateLimitClientIp,
					authRateLimiter,
					clientLabel,
					clientMeta,
					markHandshakeFailure,
					sendHandshakeErrorResponse,
					sendFrame,
					isWebchatConnect,
					runDetachedConnectWork,
					pendingNodePairingCleanup,
					broadcastNodePairingResult,
					releasePendingNodePairingCleanup
				};
				const authenticated = await authenticateGatewayConnect(phaseContext);
				if (!authenticated) return;
				const deviceAuthorized = await authorizeGatewayConnectDevice(phaseContext, authenticated);
				if (!deviceAuthorized) return;
				await attachAuthenticatedGatewayConnect(phaseContext, deviceAuthorized);
				return;
			}
			await authenticatedRequestDispatcher.dispatch(parsed, client);
		} catch (err) {
			await releasePendingNodePairingCleanup();
			logGateway.error(`parse/handle error: ${String(err)}`);
			require_ws_log.logWs("out", "parse-error", {
				connId,
				error: require_ws_log.formatForLog(err)
			});
			if (!getClient()) close();
		}
	};
	const rejectConnectForClosedAdmission = async (data) => {
		if (isClosed() || require_handshake_auth_log_limiter.rawDataByteLength(data) > 65536) return false;
		let parsed;
		try {
			parsed = JSON.parse(require_handshake_auth_log_limiter.rawDataToString(data));
		} catch {
			return false;
		}
		if (!require_src.validateRequestFrame(parsed) || parsed.method !== "connect" || !require_src.validateConnectParams(parsed.params)) return false;
		const restartDraining = require_gateway_work_admission.isGatewayRestartDraining();
		const reason = restartDraining ? "gateway-restarting" : "gateway-suspending";
		const operation = restartDraining ? "restart" : "suspension";
		const phase = require_gateway_work_admission.getGatewaySuspendAdmissionPhase();
		setLastFrameMeta({
			type: "req",
			method: "connect",
			id: parsed.id
		});
		setHandshakeState("failed");
		setCloseCause(reason, {
			method: "connect",
			phase
		});
		await sendFrame({
			type: "res",
			id: parsed.id,
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `connect unavailable during gateway ${operation}`, {
				retryable: true,
				retryAfterMs: GATEWAY_WORK_ADMISSION_RETRY_AFTER_MS,
				details: {
					method: "connect",
					reason,
					phase
				}
			})
		}).catch(() => {});
		queueMicrotask(() => close(GATEWAY_WORK_ADMISSION_CLOSE_CODE, `gateway ${operation} in progress`));
		return true;
	};
	const handleIncomingMessage = async (data) => {
		if (getClient()) {
			await handleMessage(data);
			return;
		}
		const admission = require_gateway_work_admission.tryBeginGatewayRootWorkAdmission();
		if (!admission) {
			if (await rejectConnectForClosedAdmission(data)) return;
			await handleMessage(data);
			return;
		}
		try {
			await admission.run(() => handleMessage(data));
		} finally {
			admission.release();
		}
	};
	socket.on("message", (data) => {
		require_diagnostic_events.runWithDiagnosticTraceContext(require_diagnostic_events.createDiagnosticTraceContext(), () => handleIncomingMessage(data));
	});
}
//#endregion
exports.attachGatewayWsMessageHandler = attachGatewayWsMessageHandler;
exports.truncateCloseReason = truncateCloseReason;
