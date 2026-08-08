require("./rolldown-runtime-u92d-OFm.cjs");
const require_sleep = require("./sleep-BVpvBXin.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_src = require("./src-Bt6t_5vk.cjs");
const require_client_start_readiness = require("./client-start-readiness-CjzVtlBH.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_operator_scope_compat = require("./operator-scope-compat-C_XF682D.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_gateway_lock = require("./gateway-lock-CUpJMYSa.cjs");
const require_auth_mode_policy = require("./auth-mode-policy-DbgAYq72.cjs");
const require_auth_surface_resolution = require("./auth-surface-resolution-YxOHdovx.cjs");
const require_setup_launch_env = require("./setup-launch-env-DptQdIsm.cjs");
let node_crypto = require("node:crypto");
//#region src/tui/gateway-chat.ts
const STARTUP_CHAT_HISTORY_RETRY_TIMEOUT_MS = 6e4;
const STARTUP_CHAT_HISTORY_DEFAULT_RETRY_MS = 500;
const STARTUP_CHAT_HISTORY_MAX_RETRY_MS = 5e3;
function throwGatewayAuthResolutionError(reason) {
	throw new Error([
		reason,
		"Fix: set OPERATOR_GATEWAY_TOKEN/OPERATOR_GATEWAY_PASSWORD, pass --token/--password,",
		"or resolve the configured secret provider for this credential."
	].join("\n"));
}
function isRetryableStartupUnavailable(err, method) {
	if (!(err instanceof require_src.GatewayClientRequestError)) return false;
	if (err.gatewayCode !== "UNAVAILABLE" || !err.retryable) return false;
	const details = err.details;
	if (!details || typeof details !== "object") return true;
	const detailMethod = details.method;
	return typeof detailMethod !== "string" || detailMethod === method;
}
function resolveStartupRetryDelayMs(err) {
	const retryAfterMs = typeof err.retryAfterMs === "number" ? err.retryAfterMs : STARTUP_CHAT_HISTORY_DEFAULT_RETRY_MS;
	return Math.min(Math.max(retryAfterMs, 100), STARTUP_CHAT_HISTORY_MAX_RETRY_MS);
}
function nonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function isLegacyPreserveSideRunsError(err) {
	if (!(err instanceof require_src.GatewayClientRequestError) || err.gatewayCode !== "INVALID_REQUEST") return false;
	const message = err.message.toLowerCase();
	return message.includes("invalid chat.abort params") && message.includes("preservesideruns");
}
var GatewayChatClient = class GatewayChatClient {
	constructor(connection) {
		this.connection = connection;
		this.readyPromise = new Promise((resolve) => {
			this.resolveReady = resolve;
		});
		this.client = new require_client_start_readiness.GatewayClient({
			url: connection.url,
			token: connection.token,
			password: connection.password,
			tlsFingerprint: connection.tlsFingerprint,
			preauthHandshakeTimeoutMs: connection.preauthHandshakeTimeoutMs,
			clientName: require_client_info.GATEWAY_CLIENT_NAMES.TUI,
			clientDisplayName: "operator-tui",
			clientVersion: require_version.VERSION,
			platform: process.platform,
			mode: require_client_info.GATEWAY_CLIENT_MODES.UI,
			deviceIdentity: connection.allowInsecureLocalOperatorUi ? null : void 0,
			caps: [require_client_info.GATEWAY_CLIENT_CAPS.TASK_SUGGESTIONS, require_client_info.GATEWAY_CLIENT_CAPS.TOOL_EVENTS],
			instanceId: (0, node_crypto.randomUUID)(),
			minProtocol: 4,
			maxProtocol: 4,
			onHelloOk: (hello) => {
				this.hello = hello;
				this.resolveReady?.();
				this.onConnected?.();
			},
			onEvent: (evt) => {
				this.onEvent?.({
					event: evt.event,
					payload: evt.payload,
					seq: evt.seq
				});
			},
			onClose: (_code, reason) => {
				this.readyPromise = new Promise((resolve) => {
					this.resolveReady = resolve;
				});
				this.onDisconnected?.(reason);
			},
			onGap: (info) => {
				this.onGap?.(info);
			}
		});
	}
	static async connect(opts) {
		const connection = await resolveGatewayConnection(opts);
		return new GatewayChatClient(connection);
	}
	/** Connect to a target already selected and authenticated by a preceding Gateway probe. */
	static connectBound(opts) {
		return new GatewayChatClient(resolveBoundGatewayConnection(opts));
	}
	start() {
		require_client_start_readiness.startGatewayClientWhenEventLoopReady(this.client, { clientOptions: { preauthHandshakeTimeoutMs: this.connection.preauthHandshakeTimeoutMs } }).then((readiness) => {
			if (!readiness.ready && !readiness.aborted) this.onDisconnected?.("gateway event loop readiness timeout");
		}).catch((err) => {
			this.onDisconnected?.(err instanceof Error ? err.message : String(err));
		});
	}
	stop() {
		this.client.stop();
	}
	async subscribeSessionEvents() {
		return await this.client.request("sessions.subscribe", {});
	}
	async waitForReady() {
		await this.readyPromise;
	}
	async sendChat(opts) {
		const runId = opts.runId ?? (0, node_crypto.randomUUID)();
		const response = await this.client.request("chat.send", {
			sessionKey: opts.sessionKey,
			...opts.agentId ? { agentId: opts.agentId } : {},
			...opts.sessionId ? { sessionId: opts.sessionId } : {},
			message: opts.message,
			thinking: opts.thinking,
			deliver: opts.deliver,
			timeoutMs: opts.timeoutMs,
			idempotencyKey: runId
		});
		const acceptedRunId = nonEmptyString(response?.runId) ?? runId;
		const status = nonEmptyString(response?.status);
		return status ? {
			runId: acceptedRunId,
			status
		} : { runId: acceptedRunId };
	}
	async abortChat(opts) {
		const params = {
			sessionKey: opts.sessionKey,
			...opts.agentId ? { agentId: opts.agentId } : {},
			...opts.runId ? { runId: opts.runId } : {}
		};
		if (opts.runId) return await this.client.request("chat.abort", params);
		try {
			return await this.client.request("chat.abort", {
				...params,
				preserveSideRuns: true
			});
		} catch (err) {
			if (!isLegacyPreserveSideRunsError(err)) throw err;
			return await this.client.request("chat.abort", params);
		}
	}
	async loadHistory(opts) {
		const startedAt = Date.now();
		for (;;) try {
			return await this.client.request("chat.history", {
				sessionKey: opts.sessionKey,
				...opts.agentId ? { agentId: opts.agentId } : {},
				limit: opts.limit
			});
		} catch (err) {
			if (Date.now() - startedAt < STARTUP_CHAT_HISTORY_RETRY_TIMEOUT_MS && isRetryableStartupUnavailable(err, "chat.history")) {
				await require_sleep.sleep(resolveStartupRetryDelayMs(err));
				continue;
			}
			throw err;
		}
	}
	async listSessions(opts) {
		return await this.client.request("sessions.list", opts ?? {});
	}
	async listAgents() {
		return await this.client.request("agents.list", {});
	}
	async patchSession(opts) {
		return await this.client.request("sessions.patch", opts);
	}
	async createSession(opts) {
		return await this.client.request("sessions.create", {
			...opts,
			emitCommandHooks: Boolean(opts.parentSessionKey)
		});
	}
	async resetSession(key, reason, opts) {
		return await this.client.request("sessions.reset", {
			key,
			...opts?.agentId ? { agentId: opts.agentId } : {},
			...reason ? { reason } : {}
		});
	}
	async getGatewayStatus() {
		return await this.client.request("status");
	}
	async listModels() {
		const res = await this.client.request("models.list");
		return Array.isArray(res?.models) ? res.models : [];
	}
	async listCommands(opts) {
		const res = await this.client.request("commands.list", opts ?? {});
		return Array.isArray(res?.commands) ? res.commands : [];
	}
	async listPluginApprovals() {
		return await this.client.request("plugin.approval.list", {});
	}
	async resolvePluginApproval(id, decision) {
		return await this.client.request("plugin.approval.resolve", {
			id,
			decision
		});
	}
	getTaskSuggestionActionCapabilities() {
		const auth = this.hello?.auth;
		const methods = this.hello?.features?.methods;
		const allows = (method, scope) => Array.isArray(methods) && methods.includes(method) && Boolean(auth && require_operator_scope_compat.roleScopesAllow({
			role: auth.role,
			requestedScopes: [scope],
			allowedScopes: auth.scopes
		}));
		return {
			canAccept: allows("taskSuggestions.accept", "operator.admin"),
			canDismiss: allows("taskSuggestions.dismiss", "operator.write")
		};
	}
	async listTaskSuggestions() {
		if (this.hello?.features?.methods?.includes("taskSuggestions.list") !== true) return [];
		const actions = this.getTaskSuggestionActionCapabilities();
		if (!actions.canAccept && !actions.canDismiss) return [];
		return (await this.client.request("taskSuggestions.list", {})).suggestions;
	}
	async acceptTaskSuggestion(taskId) {
		return await this.client.request("taskSuggestions.accept", { taskId });
	}
	async dismissTaskSuggestion(taskId) {
		return await this.client.request("taskSuggestions.dismiss", { taskId });
	}
};
/**
* Preserve a pre-probed Gateway route across an in-process handoff. This path
* deliberately ignores global config and Gateway env overrides, including
* credentials, while still applying the normal remote URL safety policy.
*/
function resolveBoundGatewayConnection(opts) {
	const url = require_call.buildGatewayConnectionDetails({
		config: opts.config,
		url: opts.url,
		ignoreEnvUrlOverride: true
	}).url;
	const explicitAuth = require_call.resolveExplicitGatewayAuth({
		token: opts.token,
		password: opts.password
	});
	return {
		url,
		token: explicitAuth.token,
		password: explicitAuth.password,
		...opts.tlsFingerprint ? { tlsFingerprint: opts.tlsFingerprint } : {},
		preauthHandshakeTimeoutMs: opts.config.gateway?.handshakeTimeoutMs,
		allowInsecureLocalOperatorUi: false
	};
}
async function resolveGatewayConnection(opts) {
	const config = require_io.getRuntimeConfig();
	const env = process.env;
	const gatewayAuthMode = config.gateway?.auth?.mode;
	const isRemoteMode = config.gateway?.mode === "remote";
	const preferConfiguredAuth = env[require_setup_launch_env.TUI_SETUP_AUTH_SOURCE_ENV] === require_setup_launch_env.TUI_SETUP_AUTH_SOURCE_CONFIG;
	const urlOverride = typeof opts.url === "string" && opts.url.trim().length > 0 ? opts.url.trim() : void 0;
	const explicitAuth = require_call.resolveExplicitGatewayAuth({
		token: opts.token,
		password: opts.password
	});
	require_call.ensureExplicitGatewayAuth({
		urlOverride,
		urlOverrideSource: "cli",
		explicitAuth,
		errorHint: "Fix: pass --token or --password when using --url."
	});
	const activeLocalGatewayPort = Boolean(urlOverride || env.OPERATOR_GATEWAY_URL?.trim() || env.OPERATOR_GATEWAY_PORT?.trim() || isRemoteMode) ? void 0 : await require_gateway_lock.readActiveGatewayLockPort();
	const url = require_call.buildGatewayConnectionDetails({
		config,
		...urlOverride ? { url: urlOverride } : {},
		...activeLocalGatewayPort ? { localPortOverride: activeLocalGatewayPort } : {}
	}).url;
	const allowInsecureLocalOperatorUi = (() => {
		if (config.gateway?.controlUi?.allowInsecureAuth !== true) return false;
		try {
			return require_net.isLoopbackHost(new URL(url).hostname);
		} catch {
			return false;
		}
	})();
	if (urlOverride) return {
		url,
		token: explicitAuth.token,
		password: explicitAuth.password,
		...opts.tlsFingerprint ? { tlsFingerprint: opts.tlsFingerprint } : {},
		preauthHandshakeTimeoutMs: config.gateway?.handshakeTimeoutMs,
		allowInsecureLocalOperatorUi
	};
	if (isRemoteMode) {
		const resolved = await require_auth_surface_resolution.resolveGatewayInteractiveSurfaceAuth({
			config,
			env,
			explicitAuth,
			suppressEnvAuthFallback: preferConfiguredAuth,
			surface: "remote"
		});
		if (resolved.failureReason) throwGatewayAuthResolutionError(resolved.failureReason);
		return {
			url,
			token: resolved.token,
			password: resolved.password,
			...opts.tlsFingerprint ?? config.gateway?.remote?.tlsFingerprint ? { tlsFingerprint: opts.tlsFingerprint ?? config.gateway?.remote?.tlsFingerprint } : {},
			preauthHandshakeTimeoutMs: config.gateway?.handshakeTimeoutMs,
			allowInsecureLocalOperatorUi: false
		};
	}
	if (gatewayAuthMode === "none" || gatewayAuthMode === "trusted-proxy") {
		const resolved = await require_auth_surface_resolution.resolveGatewayInteractiveSurfaceAuth({
			config,
			env,
			explicitAuth,
			surface: "local"
		});
		return {
			url,
			token: resolved.token,
			password: resolved.password,
			...opts.tlsFingerprint ? { tlsFingerprint: opts.tlsFingerprint } : {},
			preauthHandshakeTimeoutMs: config.gateway?.handshakeTimeoutMs,
			allowInsecureLocalOperatorUi
		};
	}
	try {
		require_auth_mode_policy.assertExplicitGatewayAuthModeWhenBothConfigured(config);
	} catch (err) {
		throwGatewayAuthResolutionError(require_errors.formatErrorMessage(err));
	}
	const resolved = await require_auth_surface_resolution.resolveGatewayInteractiveSurfaceAuth({
		config,
		env,
		explicitAuth,
		suppressEnvAuthFallback: preferConfiguredAuth,
		surface: "local"
	});
	if (resolved.failureReason) throwGatewayAuthResolutionError(resolved.failureReason);
	return {
		url,
		token: resolved.token,
		password: resolved.password,
		...opts.tlsFingerprint ? { tlsFingerprint: opts.tlsFingerprint } : {},
		preauthHandshakeTimeoutMs: config.gateway?.handshakeTimeoutMs,
		allowInsecureLocalOperatorUi
	};
}
//#endregion
exports.GatewayChatClient = GatewayChatClient;
