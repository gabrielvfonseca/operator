require("./rolldown-runtime-u92d-OFm.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_system_tags = require("./system-tags-DnXAcM7s.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
const require_external_content_source = require("./external-content-source-YSVwjm1I.cjs");
require("./external-content-CaAq9ND8.cjs");
const require_auth_rate_limit = require("./auth-rate-limit-BjLy1S3-.cjs");
const require_hooks = require("./hooks-Dd_4unef.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_server_constants = require("./server-constants-CESgKlPt.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/gateway/server/hooks-request-handler.ts
const HOOK_AUTH_FAILURE_LIMIT = 20;
const HOOK_AUTH_FAILURE_WINDOW_MS = 6e4;
function resolveMappedHookExternalContentSource(params) {
	if (params.subPath === "gmail") return "gmail";
	return require_external_content_source.resolveHookExternalContentSource(params.sessionKey) ?? "webhook";
}
function createHooksRequestHandler(opts) {
	const { getHooksConfig, logHooks, dispatchAgentHook, dispatchWakeHook, getClientIpConfig } = opts;
	const hookReplayCache = /* @__PURE__ */ new Map();
	const hookAuthLimiter = require_auth_rate_limit.createAuthRateLimiter({
		maxAttempts: HOOK_AUTH_FAILURE_LIMIT,
		windowMs: HOOK_AUTH_FAILURE_WINDOW_MS,
		lockoutMs: HOOK_AUTH_FAILURE_WINDOW_MS,
		exemptLoopback: false,
		pruneIntervalMs: 0
	});
	const resolveHookClientKey = (req) => {
		const clientIpConfig = getClientIpConfig?.();
		return require_auth_rate_limit.normalizeRateLimitClientIp(require_net.resolveRequestClientIp(req, clientIpConfig?.trustedProxies, clientIpConfig?.allowRealIpFallback === true) ?? req.socket?.remoteAddress);
	};
	const pruneHookReplayCache = (now) => {
		const cutoff = now - require_server_constants.DEDUPE_TTL_MS;
		for (const [key, entry] of hookReplayCache) if (entry.ts < cutoff) hookReplayCache.delete(key);
		while (hookReplayCache.size > require_server_constants.DEDUPE_MAX) {
			const oldestKey = hookReplayCache.keys().next().value;
			if (!oldestKey) break;
			hookReplayCache.delete(oldestKey);
		}
	};
	const buildHookReplayCacheKey = (params) => {
		const idem = params.idempotencyKey?.trim();
		if (!idem) return;
		const tokenFingerprint = (0, node_crypto.createHash)("sha256").update(params.token ?? "", "utf8").digest("hex");
		const idempotencyFingerprint = (0, node_crypto.createHash)("sha256").update(idem, "utf8").digest("hex");
		return `${tokenFingerprint}:${(0, node_crypto.createHash)("sha256").update(JSON.stringify({
			pathKey: params.pathKey,
			dispatchScope: params.dispatchScope
		}), "utf8").digest("hex")}:${idempotencyFingerprint}`;
	};
	const resolveCachedHookRunId = (key, now) => {
		if (!key) return;
		pruneHookReplayCache(now);
		const cached = hookReplayCache.get(key);
		if (!cached) return;
		hookReplayCache.delete(key);
		hookReplayCache.set(key, cached);
		return cached.runId;
	};
	const rememberHookRunId = (key, runId, now) => {
		if (!key) return;
		hookReplayCache.delete(key);
		hookReplayCache.set(key, {
			ts: now,
			runId
		});
		pruneHookReplayCache(now);
	};
	return async (req, res) => {
		const hooksConfig = getHooksConfig();
		if (!hooksConfig) return false;
		const url = new URL(req.url ?? "/", "http://localhost");
		const basePath = hooksConfig.basePath;
		if (url.pathname !== basePath && !url.pathname.startsWith(`${basePath}/`)) return false;
		if (url.searchParams.has("token")) {
			res.statusCode = 400;
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.end("Hook token must be provided via Authorization: Bearer <token> or X-Operator-Token header (query parameters are not allowed).");
			return true;
		}
		if (req.method !== "POST") {
			res.statusCode = 405;
			res.setHeader("Allow", "POST");
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.end("Method Not Allowed");
			return true;
		}
		const token = require_hooks.extractHookToken(req);
		const clientKey = resolveHookClientKey(req);
		if (!require_secret_equal.safeEqualSecret(token, hooksConfig.token)) {
			const throttle = hookAuthLimiter.check(clientKey, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_HOOK_AUTH);
			if (!throttle.allowed) {
				const retryAfter = throttle.retryAfterMs > 0 ? Math.ceil(throttle.retryAfterMs / 1e3) : 1;
				res.statusCode = 429;
				res.setHeader("Retry-After", String(retryAfter));
				res.setHeader("Content-Type", "text/plain; charset=utf-8");
				res.end("Too Many Requests");
				logHooks.warn(`hook auth throttled for ${clientKey}; retry-after=${retryAfter}s`);
				return true;
			}
			hookAuthLimiter.recordFailure(clientKey, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_HOOK_AUTH);
			res.statusCode = 401;
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.end("Unauthorized");
			return true;
		}
		hookAuthLimiter.reset(clientKey, require_auth_rate_limit.AUTH_RATE_LIMIT_SCOPE_HOOK_AUTH);
		const subPath = url.pathname.slice(basePath.length).replace(/^\/+/, "");
		if (!subPath) {
			res.statusCode = 404;
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.end("Not Found");
			return true;
		}
		const body = await require_hooks.readJsonBody(req, hooksConfig.maxBodyBytes);
		if (!body.ok) {
			require_http_common.sendJson(res, body.error === "payload too large" ? 413 : body.error === "request body timeout" ? 408 : 400, {
				ok: false,
				error: body.error
			});
			return true;
		}
		const payload = typeof body.value === "object" && body.value !== null ? body.value : {};
		const headers = require_hooks.normalizeHookHeaders(req);
		const idempotencyKey = require_hooks.resolveHookIdempotencyKey({
			payload,
			headers
		});
		const now = Date.now();
		const resolveDispatchSessionKeyOrRespond = (sessionKeyValue, targetAgentId) => {
			const dispatchSessionKey = require_hooks.normalizeHookDispatchSessionKey({
				sessionKey: sessionKeyValue,
				targetAgentId
			});
			const allowedPrefixes = hooksConfig.sessionPolicy.allowedSessionKeyPrefixes;
			if (allowedPrefixes && !require_hooks.isSessionKeyAllowedByPrefix(dispatchSessionKey, allowedPrefixes)) {
				require_http_common.sendJson(res, 400, {
					ok: false,
					error: require_hooks.getHookSessionKeyPrefixError(allowedPrefixes)
				});
				return null;
			}
			return dispatchSessionKey;
		};
		if (subPath === "wake") {
			const normalized = require_hooks.normalizeWakePayload(payload);
			if (!normalized.ok) {
				require_http_common.sendJson(res, 400, {
					ok: false,
					error: normalized.error
				});
				return true;
			}
			dispatchWakeHook(normalized.value);
			require_http_common.sendJson(res, 200, {
				ok: true,
				mode: normalized.value.mode
			});
			return true;
		}
		if (subPath === "agent") {
			const normalized = require_hooks.normalizeAgentPayload(payload);
			if (!normalized.ok) {
				require_http_common.sendJson(res, 400, {
					ok: false,
					error: normalized.error
				});
				return true;
			}
			if (!require_hooks.isHookAgentAllowed(hooksConfig, normalized.value.agentId)) {
				require_http_common.sendJson(res, 400, {
					ok: false,
					error: require_hooks.getHookAgentPolicyError()
				});
				return true;
			}
			const sessionKey = require_hooks.resolveHookSessionKey({
				hooksConfig,
				source: "request",
				sessionKey: normalized.value.sessionKey
			});
			if (!sessionKey.ok) {
				require_http_common.sendJson(res, 400, {
					ok: false,
					error: sessionKey.error
				});
				return true;
			}
			const targetAgentId = require_hooks.resolveHookTargetAgentId(hooksConfig, normalized.value.agentId);
			const effectiveTargetAgentId = require_hooks.resolveEffectiveHookTargetAgentId(hooksConfig, normalized.value.agentId);
			const replayKey = buildHookReplayCacheKey({
				pathKey: "agent",
				token,
				idempotencyKey,
				dispatchScope: {
					agentId: effectiveTargetAgentId,
					sessionKey: normalized.value.sessionKey ?? hooksConfig.sessionPolicy.defaultSessionKey ?? null,
					message: normalized.value.message,
					name: normalized.value.name,
					wakeMode: normalized.value.wakeMode,
					deliver: normalized.value.deliver,
					channel: normalized.value.channel,
					to: normalized.value.to ?? null,
					model: normalized.value.model ?? null,
					thinking: normalized.value.thinking ?? null,
					timeoutSeconds: normalized.value.timeoutSeconds ?? null
				}
			});
			const cachedRunId = resolveCachedHookRunId(replayKey, now);
			if (cachedRunId) {
				require_http_common.sendJson(res, 200, {
					ok: true,
					runId: cachedRunId
				});
				return true;
			}
			const dispatchSessionKey = resolveDispatchSessionKeyOrRespond(sessionKey.value, effectiveTargetAgentId);
			if (dispatchSessionKey === null) return true;
			const runId = dispatchAgentHook({
				...normalized.value,
				idempotencyKey,
				sessionKey: dispatchSessionKey,
				sourcePath: `${basePath}/agent`,
				agentId: targetAgentId,
				externalContentSource: "webhook"
			});
			rememberHookRunId(replayKey, runId, now);
			require_http_common.sendJson(res, 200, {
				ok: true,
				runId
			});
			return true;
		}
		if (hooksConfig.mappings.length > 0) try {
			const mapped = await require_hooks.applyHookMappings(hooksConfig.mappings, {
				payload,
				headers,
				url,
				path: subPath
			});
			if (mapped) {
				if (!mapped.ok) {
					require_http_common.sendJson(res, 400, {
						ok: false,
						error: mapped.error
					});
					return true;
				}
				if (mapped.action === null) {
					res.statusCode = 204;
					res.end();
					return true;
				}
				if (mapped.action.kind === "wake") {
					dispatchWakeHook({
						text: mapped.action.text,
						mode: mapped.action.mode
					});
					require_http_common.sendJson(res, 200, {
						ok: true,
						mode: mapped.action.mode
					});
					return true;
				}
				const channel = require_hooks.resolveHookChannel(mapped.action.channel);
				if (!channel) {
					require_http_common.sendJson(res, 400, {
						ok: false,
						error: require_hooks.getHookChannelError()
					});
					return true;
				}
				if (!require_hooks.isHookAgentAllowed(hooksConfig, mapped.action.agentId)) {
					require_http_common.sendJson(res, 400, {
						ok: false,
						error: require_hooks.getHookAgentPolicyError()
					});
					return true;
				}
				const sessionKey = require_hooks.resolveHookSessionKey({
					hooksConfig,
					source: mapped.action.sessionKeySource === "static" ? "mapping-static" : "mapping-templated",
					sessionKey: mapped.action.sessionKey
				});
				if (!sessionKey.ok) {
					require_http_common.sendJson(res, 400, {
						ok: false,
						error: sessionKey.error
					});
					return true;
				}
				const targetAgentId = require_hooks.resolveHookTargetAgentId(hooksConfig, mapped.action.agentId);
				const effectiveTargetAgentId = require_hooks.resolveEffectiveHookTargetAgentId(hooksConfig, mapped.action.agentId);
				const dispatchSessionKey = resolveDispatchSessionKeyOrRespond(sessionKey.value, effectiveTargetAgentId);
				if (dispatchSessionKey === null) return true;
				const replayKey = buildHookReplayCacheKey({
					pathKey: subPath || "mapping",
					token,
					idempotencyKey,
					dispatchScope: {
						agentId: effectiveTargetAgentId,
						sessionKey: mapped.action.sessionKey ?? hooksConfig.sessionPolicy.defaultSessionKey ?? null,
						message: mapped.action.message,
						name: mapped.action.name ?? "Hook",
						wakeMode: mapped.action.wakeMode,
						deliver: require_hooks.resolveHookDeliver(mapped.action.deliver),
						channel,
						to: mapped.action.to ?? null,
						model: mapped.action.model ?? null,
						thinking: mapped.action.thinking ?? null,
						timeoutSeconds: mapped.action.timeoutSeconds ?? null
					}
				});
				const cachedRunId = resolveCachedHookRunId(replayKey, now);
				if (cachedRunId) {
					require_http_common.sendJson(res, 200, {
						ok: true,
						runId: cachedRunId
					});
					return true;
				}
				const runId = dispatchAgentHook({
					message: mapped.action.message,
					name: mapped.action.name ?? "Hook",
					idempotencyKey,
					agentId: targetAgentId,
					wakeMode: mapped.action.wakeMode,
					sessionKey: dispatchSessionKey,
					sourcePath: `${basePath}/${subPath}`,
					deliver: require_hooks.resolveHookDeliver(mapped.action.deliver),
					channel,
					to: mapped.action.to,
					model: mapped.action.model,
					thinking: mapped.action.thinking,
					timeoutSeconds: mapped.action.timeoutSeconds,
					allowUnsafeExternalContent: mapped.action.allowUnsafeExternalContent,
					externalContentSource: resolveMappedHookExternalContentSource({
						subPath,
						sessionKey: sessionKey.value
					})
				});
				rememberHookRunId(replayKey, runId, now);
				require_http_common.sendJson(res, 200, {
					ok: true,
					runId
				});
				return true;
			}
		} catch (err) {
			logHooks.warn(`hook mapping failed: ${String(err)}`);
			require_http_common.sendJson(res, 500, {
				ok: false,
				error: "hook mapping failed"
			});
			return true;
		}
		res.statusCode = 404;
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.end("Not Found");
		return true;
	};
}
//#endregion
//#region src/gateway/server/hooks.ts
function resolveHookEventSessionKey(params) {
	return params.agentId ? require_main_session.resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: params.agentId
	}) : require_main_session.resolveMainSessionKey(params.cfg);
}
function shouldAnnounceHookRunResult(params) {
	if (params.result.status !== "ok") return true;
	return params.deliver && params.result.delivered !== true && params.result.deliveryAttempted !== true;
}
function resolveHookRunSummary(result) {
	return (result.status !== "ok" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.diagnostics?.summary) : void 0) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.summary) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.error) || result.status;
}
function sanitizeHookConsoleValue(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!normalized) return;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(Array.from(normalized, (char) => {
		const code = char.charCodeAt(0);
		return code < 32 || code === 127 ? " " : char;
	}).join("").replace(/\s+/gu, " ").trim(), 500);
}
function formatHookRunWarningConsoleMessage(params) {
	const parts = ["hook agent run returned non-ok status", `status=${sanitizeHookConsoleValue(params.status) ?? "unknown"}`];
	const model = sanitizeHookConsoleValue(params.model);
	if (model) parts.push(`model=${model}`);
	const summary = sanitizeHookConsoleValue(params.summary);
	if (summary) parts.push(`summary=${summary}`);
	return parts.join(" ");
}
/** Creates the HTTP handler used by gateway hook endpoints. */
function createGatewayHooksRequestHandler(params) {
	const { deps, getHooksConfig, getClientIpConfig, bindHost, port, logHooks } = params;
	const dispatchWakeHook = (value) => {
		const sessionKey = require_sessions.resolveMainSessionKeyFromConfig();
		require_system_events.enqueueSystemEvent(value.text, { sessionKey });
		if (value.mode === "now") require_heartbeat_wake.requestHeartbeat({
			source: "hook",
			intent: "immediate",
			reason: "hook:wake"
		});
	};
	const dispatchAgentHook = (value) => {
		const sessionKey = value.sessionKey;
		const safeName = require_system_tags.sanitizeInboundSystemTags(value.name);
		const jobId = (0, node_crypto.randomUUID)();
		const runId = (0, node_crypto.randomUUID)();
		const nowMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(Date.now());
		const delivery = value.deliver ? {
			mode: "announce",
			channel: value.channel,
			to: value.to
		} : { mode: "none" };
		const job = {
			id: jobId,
			agentId: value.agentId,
			name: safeName,
			enabled: true,
			createdAtMs: nowMs,
			updatedAtMs: nowMs,
			schedule: {
				kind: "at",
				at: (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimestampMsToIsoString)(nowMs)
			},
			sessionTarget: "isolated",
			wakeMode: value.wakeMode,
			payload: {
				kind: "agentTurn",
				message: value.message,
				model: value.model,
				thinking: value.thinking,
				timeoutSeconds: value.timeoutSeconds,
				allowUnsafeExternalContent: value.allowUnsafeExternalContent,
				externalContentSource: value.externalContentSource
			},
			delivery,
			state: { nextRunAtMs: nowMs }
		};
		let hookEventSessionKey;
		require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(async () => {
			try {
				const cfg = require_io.getRuntimeConfig();
				hookEventSessionKey = resolveHookEventSessionKey({
					cfg,
					agentId: value.agentId
				});
				const { runCronIsolatedAgentTurn } = await Promise.resolve().then(() => require("./isolated-agent-axWoal_r.cjs")).then((n) => n.isolated_agent_exports);
				const result = await runCronIsolatedAgentTurn({
					cfg,
					deps,
					job,
					message: value.message,
					sessionKey,
					lane: "cron"
				});
				const summary = resolveHookRunSummary(result);
				const prefix = result.status === "ok" ? `Hook ${safeName}` : `Hook ${safeName} (${result.status})`;
				const shouldAnnounce = shouldAnnounceHookRunResult({
					deliver: value.deliver,
					result
				});
				if (result.status !== "ok") logHooks.warn("hook agent run returned non-ok status", {
					sourcePath: value.sourcePath,
					name: safeName,
					runId,
					jobId,
					agentId: value.agentId,
					sessionKey,
					status: result.status,
					model: value.model,
					summary,
					consoleMessage: formatHookRunWarningConsoleMessage({
						status: result.status,
						model: value.model,
						summary
					})
				});
				if (shouldAnnounce) {
					const eventSessionKey = hookEventSessionKey ?? require_sessions.resolveMainSessionKeyFromConfig();
					require_system_events.enqueueSystemEvent(`${prefix}: ${summary}`.trim(), { sessionKey: eventSessionKey });
					if (value.wakeMode === "now") require_heartbeat_wake.requestHeartbeat({
						source: "hook",
						intent: "immediate",
						reason: `hook:${jobId}`
					});
				} else if (result.status === "ok" && !value.deliver) logHooks.info("hook agent run completed without announcement", {
					sourcePath: value.sourcePath,
					name: safeName,
					runId,
					jobId,
					agentId: value.agentId,
					sessionKey,
					completedAt: (/* @__PURE__ */ new Date()).toISOString()
				});
			} catch (err) {
				logHooks.warn(`hook agent failed: ${String(err)}`);
				require_system_events.enqueueSystemEvent(`Hook ${safeName} (error): ${String(err)}`, { sessionKey: hookEventSessionKey ?? require_sessions.resolveMainSessionKeyFromConfig() });
				if (value.wakeMode === "now") require_heartbeat_wake.requestHeartbeat({
					source: "hook",
					intent: "immediate",
					reason: `hook:${jobId}:error`
				});
			}
		});
		return runId;
	};
	return createHooksRequestHandler({
		getHooksConfig,
		bindHost,
		port,
		logHooks,
		getClientIpConfig,
		dispatchAgentHook,
		dispatchWakeHook
	});
}
//#endregion
exports.createGatewayHooksRequestHandler = createGatewayHooksRequestHandler;
