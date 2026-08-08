require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_plugins = require("./plugins-_-82JYfc.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_markdown_code = require("./markdown-code-XePB7Ipf.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
const require_plugin_approvals = require("./plugin-approvals-D_TcNjGk.cjs");
const require_plugin_approval_canonical_decisions = require("./plugin-approval-canonical-decisions-Bgs1VXWI.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_operator_scope_compat = require("./operator-scope-compat-C_XF682D.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_path_utils = require("./path-utils-B5Jty5Fz.cjs");
const require_secret_value = require("./secret-value-BpdByGIA.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
const require_command_config = require("./command-config-DYH4NzHI.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
const require_web_provider_public_artifacts_explicit = require("./web-provider-public-artifacts.explicit-BBLa7tXl.cjs");
const require_runtime_web_tools = require("./runtime-web-tools-DVYet9PT.cjs");
const require_exec_approval_reply = require("./exec-approval-reply-DwQg90Rf.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
const require_config_diff = require("./config-diff-H8SBw0bH.cjs");
const require_config_reload_plan = require("./config-reload-plan-Br2Lvuc3.cjs");
const require_push_apns_store = require("./push-apns-store-THiqtBab.cjs");
const require_operator_approval_store = require("./operator-approval-store-CfqdT13-.cjs");
const require_approval_session_audience = require("./approval-session-audience-SIW4zA2H.cjs");
const require_exec_approval_command_display = require("./exec-approval-command-display-C2k3m9ob.cjs");
const require_system_agent_approvals = require("./system-agent-approvals-BRf7F37M.cjs");
const require_push_apns = require("./push-apns-Dgss9aNs.cjs");
const require_exec_approval_manager = require("./exec-approval-manager-bD7WDZkA.cjs");
const require_server_shared_auth_generation = require("./server-shared-auth-generation-D-jPWnb1.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/plugin-sdk/approval-renderers.ts
const DEFAULT_ALLOWED_DECISIONS = [
	"allow-once",
	"allow-always",
	"deny"
];
/** Build a shipped command-backed approval payload. */
function buildApprovalPendingReplyPayload(params) {
	const allowedDecisions = params.allowedDecisions ?? DEFAULT_ALLOWED_DECISIONS;
	return {
		text: params.text,
		presentation: require_exec_approval_reply.buildApprovalPresentation({
			approvalId: params.approvalId,
			allowedDecisions
		}),
		channelData: {
			execApproval: {
				approvalId: params.approvalId,
				approvalSlug: params.approvalSlug,
				approvalKind: params.approvalKind ?? "exec",
				agentId: require_string_coerce.normalizeOptionalString(params.agentId),
				allowedDecisions,
				sessionKey: require_string_coerce.normalizeOptionalString(params.sessionKey),
				state: "pending"
			},
			...params.channelData
		}
	};
}
/** Build a pending approval payload with canonical typed decision actions. */
function buildTypedApprovalPendingReplyPayload(params) {
	return {
		...buildApprovalPendingReplyPayload(params),
		presentation: require_exec_approval_reply.buildTypedApprovalPresentation({
			approvalId: params.approvalId,
			approvalKind: params.approvalKind,
			allowedDecisions: params.allowedDecisions ?? DEFAULT_ALLOWED_DECISIONS
		})
	};
}
/** Build a resolved approval reply payload with approval metadata but no controls. */
function buildApprovalResolvedReplyPayload(params) {
	return {
		text: params.text,
		channelData: {
			execApproval: {
				approvalId: params.approvalId,
				approvalSlug: params.approvalSlug,
				state: "resolved"
			},
			...params.channelData
		}
	};
}
/** Build a plugin approval prompt with canonical typed decision actions. */
function buildTypedPluginApprovalPendingReplyPayload(params) {
	return buildTypedApprovalPendingReplyPayload({
		approvalKind: "plugin",
		approvalId: params.request.id,
		approvalSlug: params.approvalSlug ?? params.request.id.slice(0, 8),
		text: params.text ?? require_plugin_approvals.buildPluginApprovalRequestMessage(params.request, params.nowMs),
		allowedDecisions: require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions({ allowedDecisions: params.allowedDecisions ?? params.request.request.allowedDecisions }),
		channelData: params.channelData
	});
}
/** Build resolved plugin approval copy and metadata from a plugin approval event. */
function buildPluginApprovalResolvedReplyPayload(params) {
	return buildApprovalResolvedReplyPayload({
		approvalId: params.resolved.id,
		approvalSlug: params.approvalSlug ?? params.resolved.id.slice(0, 8),
		text: params.text ?? require_plugin_approvals.buildPluginApprovalResolvedMessage(params.resolved),
		channelData: params.channelData
	});
}
//#endregion
//#region src/infra/approval-request-filters.ts
/** Matches session filters as literal substrings first, then bounded safe regexes. */
function matchesApprovalRequestSessionFilter(sessionKey, patterns) {
	return patterns.some((pattern) => {
		if (sessionKey.includes(pattern)) return true;
		const regex = require_redact.compileSafeRegex(pattern);
		return regex ? require_redact.testRegexWithBoundedInput(regex, sessionKey) : false;
	});
}
/**
* Applies optional approval request filters for agent ids and session keys.
* Agent id can be parsed from the session key only when the caller opts in.
*/
function matchesApprovalRequestFilters(params) {
	if (params.agentFilter?.length) {
		const explicitAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.agentId);
		const sessionAgentId = params.fallbackAgentIdFromSessionKey ? require_session_key.parseAgentSessionKey(params.request.sessionKey)?.agentId ?? void 0 : void 0;
		const agentId = explicitAgentId ?? sessionAgentId;
		if (!agentId || !params.agentFilter.includes(agentId)) return false;
	}
	if (params.sessionFilter?.length) {
		const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.sessionKey);
		if (!sessionKey || !matchesApprovalRequestSessionFilter(sessionKey, params.sessionFilter)) return false;
	}
	return true;
}
//#endregion
//#region src/infra/exec-approval-forwarder.ts
const log = require_subsystem.createSubsystemLogger("gateway/exec-approvals");
const DEFAULT_MODE = "session";
const SYNTHETIC_APPROVAL_REQUEST_ID = "__approval-routing__";
const loadExecApprovalForwarderRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./exec-approval-forwarder.runtime-BIN2F2AV.cjs")));
function normalizeMode(mode) {
	return mode ?? DEFAULT_MODE;
}
function shouldForwardRoute(params) {
	const config = params.config;
	if (!config?.enabled) return false;
	return matchesApprovalRequestFilters({
		request: params.routeRequest,
		agentFilter: config.agentFilter,
		sessionFilter: config.sessionFilter,
		fallbackAgentIdFromSessionKey: true
	});
}
function buildTargetKey(target) {
	return require_channel_route.channelRouteDedupeKey({
		channel: require_message_channel.normalizeMessageChannel(target.channel) ?? target.channel,
		to: target.to,
		accountId: target.accountId,
		threadId: target.threadId
	});
}
function buildSyntheticApprovalRequest(routeRequest) {
	return {
		id: SYNTHETIC_APPROVAL_REQUEST_ID,
		request: {
			command: "",
			agentId: routeRequest.agentId ?? null,
			sessionKey: routeRequest.sessionKey ?? null,
			turnSourceChannel: routeRequest.turnSourceChannel ?? null,
			turnSourceTo: routeRequest.turnSourceTo ?? null,
			turnSourceAccountId: routeRequest.turnSourceAccountId ?? null,
			turnSourceThreadId: routeRequest.turnSourceThreadId ?? null
		},
		createdAtMs: 0,
		expiresAtMs: 0
	};
}
function shouldSkipForwardingFallback(params) {
	const channel = require_message_channel.normalizeMessageChannel(params.target.channel) ?? params.target.channel;
	if (!channel) return false;
	return require_plugins.resolveChannelApprovalAdapter(require_registry.getLoadedChannelPlugin(channel))?.delivery?.shouldSuppressForwardingFallback?.({
		cfg: params.cfg,
		approvalKind: params.approvalKind,
		target: params.target,
		request: buildSyntheticApprovalRequest(params.routeRequest)
	}) ?? false;
}
function formatApprovalCommand(command) {
	if (!command.includes("\n") && !command.includes("`")) return {
		inline: true,
		text: `\`${command}\``
	};
	return {
		inline: false,
		text: require_markdown_code.formatFencedCodeBlock(command)
	};
}
function buildExecApprovalRequestMessage(request, nowMs) {
	const allowedDecisions = require_exec_approvals.resolveExecApprovalRequestAllowedDecisions(request.request);
	const decisionText = allowedDecisions.join("|");
	const lines = ["🔒 Exec approval required", `ID: ${request.id}`];
	const warningText = request.request.warningText?.trim();
	if (warningText) lines.push("", warningText);
	const analysisWarningLines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(request.request.commandAnalysis?.warningLines.map(require_exec_approval_command_display.sanitizeExecApprovalWarningText)).slice(0, 5);
	if (analysisWarningLines && analysisWarningLines.length > 0) {
		lines.push("", "Command analysis:");
		for (const line of analysisWarningLines) lines.push(`- ${line}`);
	}
	const command = formatApprovalCommand(require_exec_approval_command_display.resolveExecApprovalCommandDisplay(request.request).commandText);
	if (command.inline) lines.push(`Command: ${command.text}`);
	else {
		lines.push("Command:");
		lines.push(command.text);
	}
	if (request.request.cwd) lines.push(`CWD: ${request.request.cwd}`);
	if (request.request.nodeId) lines.push(`Node: ${request.request.nodeId}`);
	if (Array.isArray(request.request.envKeys) && request.request.envKeys.length > 0) lines.push(`Env overrides: ${request.request.envKeys.join(", ")}`);
	if (request.request.host) lines.push(`Host: ${request.request.host}`);
	if (request.request.agentId) lines.push(`Agent: ${request.request.agentId}`);
	if (request.request.security) lines.push(`Security: ${request.request.security}`);
	if (request.request.ask) lines.push(`Ask: ${request.request.ask}`);
	lines.push(`Expires in: ${require_exec_approval_reply.formatExecApprovalExpiresIn(request.expiresAtMs, nowMs)}`);
	lines.push("Mode: foreground (interactive approvals available in this chat).");
	lines.push(allowedDecisions.includes("allow-always") ? "Background mode note: non-interactive runs cannot wait for chat approvals; use pre-approved policy (allow-always or ask=off)." : "Background mode note: non-interactive runs cannot wait for chat approvals; the effective policy still requires per-run approval unless ask=off.");
	lines.push(`Reply with: /approve ${request.id} ${decisionText}`);
	if (!allowedDecisions.includes("allow-always")) lines.push("Allow Always is unavailable for this command.");
	return lines.join("\n");
}
const decisionLabel = require_plugin_approvals.approvalDecisionLabel;
function buildResolvedMessage(resolved) {
	return `${`✅ Exec approval ${decisionLabel(resolved.decision)}.`}${resolved.resolvedBy ? ` Resolved by ${resolved.resolvedBy}.` : ""} ID: ${resolved.id}`;
}
function buildExpiredMessage(request) {
	return `⏱️ Exec approval expired. ID: ${request.id}`;
}
function normalizeTurnSourceChannel(value) {
	const normalized = value ? require_message_channel.normalizeMessageChannel(value) : void 0;
	if (!normalized || !require_message_channel.isDeliverableMessageChannel(normalized) && normalized !== "webchat" && normalized !== "tui") return;
	return normalized;
}
function normalizeForwardingTurnSourceChannel(value, approvalKind) {
	const normalized = normalizeTurnSourceChannel(value);
	if (approvalKind === "exec" && normalized && !require_message_channel.isDeliverableMessageChannel(normalized)) return;
	return normalized;
}
function extractApprovalRouteRequest(request) {
	if (!request) return null;
	return {
		agentId: request.agentId ?? null,
		sessionKey: request.sessionKey ?? null,
		turnSourceChannel: request.turnSourceChannel ?? null,
		turnSourceTo: request.turnSourceTo ?? null,
		turnSourceAccountId: request.turnSourceAccountId ?? null,
		turnSourceThreadId: request.turnSourceThreadId ?? null
	};
}
function defaultResolveSessionTarget(params) {
	return loadExecApprovalForwarderRuntime().then(({ resolveExecApprovalSessionTarget }) => {
		const resolvedTarget = resolveExecApprovalSessionTarget({
			cfg: params.cfg,
			request: params.request,
			turnSourceChannel: normalizeTurnSourceChannel(params.request.request.turnSourceChannel),
			turnSourceTo: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.request.turnSourceTo),
			turnSourceAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.request.request.turnSourceAccountId),
			turnSourceThreadId: params.request.request.turnSourceThreadId ?? void 0
		});
		if (!resolvedTarget?.channel || !resolvedTarget.to) return null;
		const channel = resolvedTarget.channel;
		if (!require_message_channel.isDeliverableMessageChannel(channel)) return null;
		return {
			channel,
			to: resolvedTarget.to,
			accountId: resolvedTarget.accountId,
			threadId: resolvedTarget.threadId
		};
	});
}
async function deliverToTargets(params) {
	const deliveries = params.targets.map(async (target) => {
		if (params.shouldSend && !params.shouldSend()) return;
		const channel = require_message_channel.normalizeMessageChannel(target.channel) ?? target.channel;
		if (!require_message_channel.isDeliverableMessageChannel(channel)) return;
		try {
			const payload = params.buildPayload(target);
			await params.beforeDeliver?.(target, payload);
			const send = await params.deliver({
				cfg: params.cfg,
				channel,
				to: target.to,
				accountId: target.accountId,
				threadId: target.threadId,
				payloads: [payload]
			});
			if (send.status === "failed" || send.status === "partial_failed") throw send.error;
		} catch (err) {
			log.error(`exec approvals: failed to deliver to ${channel}:${target.to}: ${String(err)}`);
		}
	});
	await Promise.allSettled(deliveries);
}
function buildApprovalRenderPayload(params) {
	const channel = require_message_channel.normalizeMessageChannel(params.target.channel) ?? params.target.channel;
	return (channel ? params.resolveRenderer(require_plugins.resolveChannelApprovalAdapter(require_registry.getLoadedChannelPlugin(channel)))?.(params.renderParams) : null) ?? params.buildFallback();
}
function buildExecPendingPayload(params) {
	return buildApprovalRenderPayload({
		target: params.target,
		renderParams: params,
		resolveRenderer: (adapter) => adapter?.render?.exec?.buildPendingPayload,
		buildFallback: () => buildTypedApprovalPendingReplyPayload({
			approvalKind: "exec",
			approvalId: params.request.id,
			approvalSlug: params.request.id.slice(0, 8),
			text: buildExecApprovalRequestMessage(params.request, params.nowMs),
			agentId: params.request.request.agentId ?? null,
			allowedDecisions: require_exec_approvals.resolveExecApprovalRequestAllowedDecisions(params.request.request),
			sessionKey: params.request.request.sessionKey ?? null
		})
	});
}
function buildExecResolvedPayload(params) {
	return buildApprovalRenderPayload({
		target: params.target,
		renderParams: params,
		resolveRenderer: (adapter) => adapter?.render?.exec?.buildResolvedPayload,
		buildFallback: () => buildApprovalResolvedReplyPayload({
			approvalId: params.resolved.id,
			approvalSlug: params.resolved.id.slice(0, 8),
			text: buildResolvedMessage(params.resolved)
		})
	});
}
function buildPluginPendingPayload(params) {
	return buildApprovalRenderPayload({
		target: params.target,
		renderParams: params,
		resolveRenderer: (adapter) => adapter?.render?.plugin?.buildPendingPayload,
		buildFallback: () => buildTypedPluginApprovalPendingReplyPayload({
			request: params.request,
			nowMs: params.nowMs,
			text: require_plugin_approvals.buildPluginApprovalRequestMessage(params.request, params.nowMs),
			allowedDecisions: require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions(params.request.request)
		})
	});
}
function buildPluginResolvedPayload(params) {
	return buildApprovalRenderPayload({
		target: params.target,
		renderParams: params,
		resolveRenderer: (adapter) => adapter?.render?.plugin?.buildResolvedPayload,
		buildFallback: () => buildPluginApprovalResolvedReplyPayload({ resolved: params.resolved })
	});
}
async function resolveForwardTargets(params) {
	const mode = normalizeMode(params.config?.mode);
	const targets = [];
	const seen = /* @__PURE__ */ new Set();
	if (mode === "session" || mode === "both") {
		const sessionRouteRequest = {
			...params.routeRequest,
			turnSourceChannel: normalizeForwardingTurnSourceChannel(params.routeRequest.turnSourceChannel, params.approvalKind)
		};
		const sessionTarget = await params.resolveSessionTarget({
			cfg: params.cfg,
			request: buildSyntheticApprovalRequest(sessionRouteRequest)
		});
		if (sessionTarget) {
			const key = buildTargetKey(sessionTarget);
			if (!seen.has(key)) {
				seen.add(key);
				targets.push({
					...sessionTarget,
					source: "session"
				});
			}
		}
	}
	if (mode === "targets" || mode === "both") {
		const explicitTargets = params.config?.targets ?? [];
		for (const target of explicitTargets) {
			const key = buildTargetKey(target);
			if (seen.has(key)) continue;
			seen.add(key);
			targets.push({
				...target,
				source: "target"
			});
		}
	}
	return targets;
}
function createApprovalHandlers(params) {
	const pending = /* @__PURE__ */ new Map();
	const handleRequested = async (request) => {
		const cfg = params.getConfig();
		const config = params.strategy.config(cfg);
		const requestId = params.strategy.getRequestId(request);
		const routeRequest = params.strategy.getRouteRequestFromRequest(request);
		const filteredTargets = [...shouldForwardRoute({
			config,
			routeRequest
		}) ? await resolveForwardTargets({
			cfg,
			config,
			approvalKind: params.strategy.kind,
			routeRequest,
			resolveSessionTarget: params.resolveSessionTarget
		}) : []].filter((target) => !shouldSkipForwardingFallback({
			approvalKind: params.strategy.kind,
			target,
			cfg,
			routeRequest
		}));
		if (filteredTargets.length === 0) return false;
		const expiresInMs = Math.max(0, params.strategy.getExpiresAtMs(request) - params.nowMs());
		const timeoutId = setTimeout(() => {
			(async () => {
				const entry = pending.get(requestId);
				if (!entry) return;
				pending.delete(requestId);
				await deliverToTargets({
					cfg,
					targets: entry.targets,
					buildPayload: () => ({ text: params.strategy.buildExpiredText(request) }),
					deliver: params.deliver
				});
			})().catch((err) => {
				log.error(`${params.strategy.kind} approvals: failed to deliver expiry notification for ${requestId}: ${String(err)}`);
			});
		}, expiresInMs);
		timeoutId.unref?.();
		const pendingEntry = {
			routeRequest,
			targets: filteredTargets,
			timeoutId
		};
		pending.set(requestId, pendingEntry);
		if (pending.get(requestId) !== pendingEntry) return false;
		deliverToTargets({
			cfg,
			targets: filteredTargets,
			buildPayload: (target) => params.strategy.buildPendingPayload({
				cfg,
				request,
				target,
				routeRequest,
				nowMs: params.nowMs()
			}),
			beforeDeliver: async (target, payload) => {
				const channel = require_message_channel.normalizeMessageChannel(target.channel) ?? target.channel;
				if (!channel) return;
				await require_registry.getLoadedChannelPlugin(channel)?.outbound?.beforeDeliverPayload?.({
					cfg,
					target,
					payload,
					hint: {
						kind: "approval-pending",
						approvalKind: params.strategy.kind
					}
				});
			},
			deliver: params.deliver,
			shouldSend: () => pending.get(requestId) === pendingEntry
		}).catch((err) => {
			log.error(`${params.strategy.kind} approvals: failed to deliver request ${requestId}: ${String(err)}`);
		});
		return true;
	};
	const handleResolved = async (resolved) => {
		const resolvedId = params.strategy.getResolvedId(resolved);
		const entry = pending.get(resolvedId);
		if (entry?.timeoutId) clearTimeout(entry.timeoutId);
		if (entry) pending.delete(resolvedId);
		const cfg = params.getConfig();
		let targets = entry?.targets;
		if (!targets) {
			const routeRequest = params.strategy.getRouteRequestFromResolved(resolved);
			if (routeRequest) {
				const config = params.strategy.config(cfg);
				targets = [...shouldForwardRoute({
					config,
					routeRequest
				}) ? await resolveForwardTargets({
					cfg,
					config,
					approvalKind: params.strategy.kind,
					routeRequest,
					resolveSessionTarget: params.resolveSessionTarget
				}) : []].filter((target) => !shouldSkipForwardingFallback({
					approvalKind: params.strategy.kind,
					target,
					cfg,
					routeRequest
				}));
			}
		}
		if (!targets?.length) return;
		await deliverToTargets({
			cfg,
			targets,
			buildPayload: (target) => params.strategy.buildResolvedPayload({
				cfg,
				resolved,
				target,
				routeRequest: entry?.routeRequest ?? params.strategy.getRouteRequestFromResolved(resolved) ?? {}
			}),
			deliver: params.deliver
		});
	};
	const stop = () => {
		for (const entry of pending.values()) if (entry.timeoutId) clearTimeout(entry.timeoutId);
		pending.clear();
	};
	return {
		handleRequested,
		handleResolved,
		stop
	};
}
function createApprovalStrategy(params) {
	return {
		kind: params.kind,
		config: params.config,
		getRequestId: (request) => request.id,
		getResolvedId: (resolved) => resolved.id,
		getExpiresAtMs: (request) => request.expiresAtMs,
		getRouteRequestFromRequest: (request) => extractApprovalRouteRequest(request.request) ?? {},
		getRouteRequestFromResolved: (resolved) => extractApprovalRouteRequest(resolved.request),
		buildExpiredText: params.buildExpiredText,
		buildPendingPayload: params.buildPendingPayload,
		buildResolvedPayload: params.buildResolvedPayload
	};
}
const execApprovalStrategy = createApprovalStrategy({
	kind: "exec",
	config: (cfg) => cfg.approvals?.exec,
	buildExpiredText: buildExpiredMessage,
	buildPendingPayload: ({ cfg, request, target, nowMs }) => buildExecPendingPayload({
		cfg,
		request,
		target,
		nowMs
	}),
	buildResolvedPayload: ({ cfg, resolved, target }) => buildExecResolvedPayload({
		cfg,
		resolved,
		target
	})
});
const pluginApprovalStrategy = createApprovalStrategy({
	kind: "plugin",
	config: (cfg) => cfg.approvals?.plugin,
	buildExpiredText: require_plugin_approvals.buildPluginApprovalExpiredMessage,
	buildPendingPayload: ({ cfg, request, target, nowMs }) => buildPluginPendingPayload({
		cfg,
		request,
		target,
		nowMs
	}),
	buildResolvedPayload: ({ cfg, resolved, target }) => buildPluginResolvedPayload({
		cfg,
		resolved,
		target
	})
});
function createExecApprovalForwarder(deps = {}) {
	const getConfig = deps.getConfig ?? require_io.getRuntimeConfig;
	const deliver = deps.deliver ?? (async (params) => {
		const { sendDurableMessageBatch } = await loadExecApprovalForwarderRuntime();
		return sendDurableMessageBatch(params);
	});
	const nowMs = deps.nowMs ?? Date.now;
	const resolveSessionTarget = deps.resolveSessionTarget ?? defaultResolveSessionTarget;
	const execHandlers = createApprovalHandlers({
		strategy: execApprovalStrategy,
		getConfig,
		deliver,
		nowMs,
		resolveSessionTarget
	});
	const pluginHandlers = createApprovalHandlers({
		strategy: pluginApprovalStrategy,
		getConfig,
		deliver,
		nowMs,
		resolveSessionTarget
	});
	return {
		handleRequested: execHandlers.handleRequested,
		handleResolved: execHandlers.handleResolved,
		handlePluginApprovalRequested: pluginHandlers.handleRequested,
		handlePluginApprovalResolved: pluginHandlers.handleResolved,
		stop: () => {
			execHandlers.stop();
			pluginHandlers.stop();
		}
	};
}
//#endregion
//#region src/secrets/runtime-command-secrets.ts
/** Resolves command-scoped secrets, including web provider override credentials. */
function hasProviderOverrides(overrides) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(overrides?.webSearch) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(overrides?.webFetch) !== void 0;
}
function applyProviderOverridesToConfig(config, overrides) {
	if (!hasProviderOverrides(overrides)) return config;
	const next = structuredClone(config);
	const tools = next.tools ??= {};
	const web = tools.web ??= {};
	const webSearch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(overrides?.webSearch);
	if (webSearch) {
		const search = web.search ??= {};
		search.provider = webSearch;
	}
	const webFetch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(overrides?.webFetch);
	if (webFetch) {
		const fetch = web.fetch ??= {};
		fetch.provider = webFetch;
	}
	return next;
}
function pluginIdFromRuntimeWebPath(path) {
	return /^plugins\.entries\.([^.]+)\.config\.(webSearch|webFetch)\.apiKey$/.exec(path)?.[1];
}
function searchProviderFromDirectWebPath(path) {
	return /^tools\.web\.search\.([^.]+)\.apiKey$/.exec(path)?.[1];
}
function fetchProviderFromDirectWebPath(path) {
	return /^tools\.web\.fetch\.([^.]+)\.apiKey$/.exec(path)?.[1];
}
function isWebCommandSecretPath(path) {
	return path === "tools.web.search.apiKey" || /^tools\.web\.(search|fetch)\.[^.]+\.apiKey$/.test(path) || /^plugins\.entries\.[^.]+\.config\.(webSearch|webFetch)\.apiKey$/.test(path);
}
function webSearchProviderUsesSharedSearchCredential(params) {
	const sentinel = "__operator_shared_web_search_probe__";
	const pluginId = require_plugin_registry.resolveManifestContractOwnerPluginId({
		contract: "webSearchProviders",
		value: params.provider,
		origin: "bundled",
		config: params.config
	});
	if (!pluginId) return false;
	const provider = require_web_provider_public_artifacts_explicit.resolveBundledExplicitWebSearchProvidersFromPublicArtifacts({ onlyPluginIds: [pluginId] })?.find((entry) => entry.id === params.provider);
	return provider?.credentialPath === "tools.web.search.apiKey" || provider?.getCredentialValue({ apiKey: sentinel }) === sentinel || provider?.getConfiguredCredentialFallback?.(params.config)?.path === "tools.web.search.apiKey";
}
function isProviderOverridePath(params) {
	const webSearch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerOverrides?.webSearch);
	if (webSearch) {
		if (params.config.tools?.web?.search?.enabled === false) return false;
		if (params.path === "tools.web.search.apiKey") return webSearchProviderUsesSharedSearchCredential({
			config: params.config,
			provider: webSearch
		});
		const directProvider = searchProviderFromDirectWebPath(params.path);
		if (directProvider) return directProvider === webSearch;
		const pluginId = pluginIdFromRuntimeWebPath(params.path);
		if (pluginId && params.path.endsWith(".config.webSearch.apiKey")) return require_plugin_registry.resolveManifestContractOwnerPluginId({
			contract: "webSearchProviders",
			value: webSearch,
			origin: "bundled",
			config: params.config
		}) === pluginId;
	}
	const webFetch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerOverrides?.webFetch);
	if (webFetch) {
		if (params.config.tools?.web?.fetch?.enabled === false) return false;
		const directProvider = fetchProviderFromDirectWebPath(params.path);
		if (directProvider) return directProvider === webFetch;
		const pluginId = pluginIdFromRuntimeWebPath(params.path);
		if (pluginId && params.path.endsWith(".config.webFetch.apiKey")) return require_plugin_registry.resolveManifestContractOwnerPluginId({
			contract: "webFetchProviders",
			value: webFetch,
			origin: "bundled",
			config: params.config
		}) === pluginId;
	}
	return false;
}
function restoreInactiveWebCommandSecretTargets(params) {
	if (!hasProviderOverrides(params.providerOverrides)) return params.inactiveRefPaths;
	const inactive = new Set(params.inactiveRefPaths);
	const defaults = params.sourceConfig.secrets?.defaults;
	for (const target of require_target_registry.discoverConfigSecretTargetsByIds(params.sourceConfig, params.targetIds)) {
		if (params.allowedPaths && !params.allowedPaths.has(target.path)) continue;
		if (!isWebCommandSecretPath(target.path)) continue;
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults
		});
		if (!ref) continue;
		if (params.forcedActivePaths?.has(target.path) || params.optionalActivePaths?.has(target.path)) continue;
		if (isProviderOverridePath({
			config: params.sourceConfig,
			path: target.path,
			providerOverrides: params.providerOverrides
		})) continue;
		inactive.add(target.path);
		require_path_utils.setPathExistingStrict(params.resolvedConfig, target.pathSegments, target.value);
	}
	return [...inactive];
}
function filterInactiveRefPaths(params) {
	return params.inactiveRefPaths.filter((path) => {
		if (params.allowedPaths && !params.allowedPaths.has(path)) return false;
		if (params.forcedActivePaths?.has(path) || params.optionalActivePaths?.has(path)) return false;
		if (!hasProviderOverrides(params.providerOverrides)) return true;
		return !isProviderOverridePath({
			config: params.config,
			path,
			providerOverrides: params.providerOverrides
		});
	});
}
function mirrorResolvedProviderCredentialToDirectPath(params) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	if (!provider) return;
	const pluginId = require_plugin_registry.resolveManifestContractOwnerPluginId({
		contract: params.contract,
		value: provider,
		origin: "bundled",
		config: params.config
	});
	if (!pluginId) return;
	const directSegments = [
		...params.directPathPrefix.split("."),
		provider,
		"apiKey"
	];
	if (require_path_utils.getPath(params.config, directSegments) === void 0) return;
	const resolvedValue = require_path_utils.getPath(params.resolvedConfig, [
		"plugins",
		"entries",
		pluginId,
		"config",
		params.pluginConfigKey,
		"apiKey"
	]);
	if (typeof resolvedValue !== "string" || resolvedValue.length === 0) return;
	require_path_utils.setPathExistingStrict(params.resolvedConfig, directSegments, resolvedValue);
}
function mirrorResolvedProviderCredentialToDirectPaths(params) {
	const configuredSearchProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerOverrides?.webSearch) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.config.tools?.web?.search?.provider);
	const configuredFetchProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerOverrides?.webFetch) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.config.tools?.web?.fetch?.provider);
	mirrorResolvedProviderCredentialToDirectPath({
		config: params.config,
		resolvedConfig: params.resolvedConfig,
		contract: "webSearchProviders",
		provider: configuredSearchProvider,
		directPathPrefix: "tools.web.search",
		pluginConfigKey: "webSearch"
	});
	mirrorResolvedProviderCredentialToDirectPath({
		config: params.config,
		resolvedConfig: params.resolvedConfig,
		contract: "webFetchProviders",
		provider: configuredFetchProvider,
		directPathPrefix: "tools.web.fetch",
		pluginConfigKey: "webFetch"
	});
	const webSearch = configuredSearchProvider;
	if (webSearch && webSearchProviderUsesSharedSearchCredential({
		config: params.config,
		provider: webSearch
	}) && require_path_utils.getPath(params.config, [
		"tools",
		"web",
		"search",
		"apiKey"
	]) !== void 0) {
		const pluginId = require_plugin_registry.resolveManifestContractOwnerPluginId({
			contract: "webSearchProviders",
			value: webSearch,
			origin: "bundled",
			config: params.config
		});
		const resolvedValue = pluginId ? require_path_utils.getPath(params.resolvedConfig, [
			"plugins",
			"entries",
			pluginId,
			"config",
			"webSearch",
			"apiKey"
		]) : void 0;
		if (typeof resolvedValue === "string" && resolvedValue.length > 0) require_path_utils.setPathExistingStrict(params.resolvedConfig, [
			"tools",
			"web",
			"search",
			"apiKey"
		], resolvedValue);
	}
}
async function resolveForcedActiveCommandSecretTargets(params) {
	const activePaths = /* @__PURE__ */ new Set([...params.forcedActivePaths ?? [], ...params.optionalActivePaths ?? []]);
	if (activePaths.size === 0) return;
	const context = require_runtime_shared.createResolverContext({
		sourceConfig: params.sourceConfig,
		env: require_runtime_state.getActiveSecretsRuntimeEnv()
	});
	const defaults = params.sourceConfig.secrets?.defaults;
	for (const target of require_target_registry.discoverConfigSecretTargetsByIds(params.sourceConfig, params.targetIds)) {
		if (params.allowedPaths && !params.allowedPaths.has(target.path)) continue;
		if (!activePaths.has(target.path)) continue;
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults
		});
		if (!ref) continue;
		try {
			const resolved = await require_resolve.resolveSecretRefValue(ref, {
				config: params.sourceConfig,
				env: context.env,
				cache: context.cache
			});
			require_secret_value.assertExpectedResolvedSecretValue({
				value: resolved,
				expected: target.entry.expectedResolvedValue,
				errorMessage: target.entry.expectedResolvedValue === "string" ? `${target.path} resolved to a non-string or empty value.` : `${target.path} resolved to an unsupported value type.`
			});
			require_path_utils.setPathExistingStrict(params.resolvedConfig, target.pathSegments, resolved);
		} catch {}
	}
}
/**
* Resolves command-scoped SecretRef assignments from the active runtime snapshot.
* Provider overrides are evaluated against cloned snapshot config.
*/
/** Resolves command secret assignments from the active prepared runtime snapshot. */
function resolveCommandSecretsFromActiveRuntimeSnapshot(params) {
	const activeSnapshot = require_runtime_state.getActiveSecretsRuntimeSnapshot();
	if (!activeSnapshot) throw new Error("Secrets runtime snapshot is not active.");
	if (params.targetIds.size === 0) return Promise.resolve({
		assignments: [],
		diagnostics: [],
		inactiveRefPaths: []
	});
	return resolveCommandSecretsFromSnapshot({
		activeSnapshot,
		commandName: params.commandName,
		targetIds: params.targetIds,
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths,
		providerOverrides: params.providerOverrides
	});
}
async function resolveCommandSecretsFromSnapshot(params) {
	const hasOverrides = hasProviderOverrides(params.providerOverrides);
	const sourceConfig = applyProviderOverridesToConfig(params.activeSnapshot.sourceConfig, params.providerOverrides);
	const resolvedConfig = applyProviderOverridesToConfig(params.activeSnapshot.config, params.providerOverrides);
	const context = hasOverrides ? require_runtime_shared.createResolverContext({
		sourceConfig,
		env: require_runtime_state.getActiveSecretsRuntimeEnv()
	}) : void 0;
	if (context) await require_runtime_web_tools.resolveRuntimeWebTools({
		sourceConfig,
		resolvedConfig,
		context
	});
	mirrorResolvedProviderCredentialToDirectPaths({
		config: sourceConfig,
		resolvedConfig,
		providerOverrides: params.providerOverrides
	});
	await resolveForcedActiveCommandSecretTargets({
		sourceConfig,
		resolvedConfig,
		targetIds: params.targetIds,
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths
	});
	const warningSource = context?.warnings ?? params.activeSnapshot.warnings;
	let inactiveRefPaths = filterInactiveRefPaths({
		config: sourceConfig,
		providerOverrides: params.providerOverrides,
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths,
		inactiveRefPaths: [...new Set(warningSource.filter((warning) => warning.code === "SECRETS_REF_IGNORED_INACTIVE_SURFACE").map((warning) => warning.path))]
	});
	inactiveRefPaths = restoreInactiveWebCommandSecretTargets({
		sourceConfig,
		resolvedConfig,
		targetIds: params.targetIds,
		inactiveRefPaths,
		providerOverrides: params.providerOverrides,
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths
	});
	let analyzed = require_command_config.analyzeCommandSecretAssignmentsFromSnapshot({
		sourceConfig,
		resolvedConfig,
		targetIds: params.targetIds,
		inactiveRefPaths: new Set(inactiveRefPaths),
		...params.allowedPaths ? { allowedPaths: params.allowedPaths } : {}
	});
	if (hasOverrides) {
		const impliedInactivePaths = analyzed.unresolved.filter((entry) => isWebCommandSecretPath(entry.path)).filter((entry) => !isProviderOverridePath({
			config: sourceConfig,
			path: entry.path,
			providerOverrides: params.providerOverrides
		})).map((entry) => entry.path);
		if (impliedInactivePaths.length > 0) {
			inactiveRefPaths = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...inactiveRefPaths, ...impliedInactivePaths]);
			analyzed = require_command_config.analyzeCommandSecretAssignmentsFromSnapshot({
				sourceConfig,
				resolvedConfig,
				targetIds: params.targetIds,
				inactiveRefPaths: new Set(inactiveRefPaths),
				...params.allowedPaths ? { allowedPaths: params.allowedPaths } : {}
			});
		}
	}
	const optionalActiveUnresolvedPaths = analyzed.unresolved.filter((entry) => params.optionalActivePaths?.has(entry.path)).map((entry) => entry.path);
	if (optionalActiveUnresolvedPaths.length > 0) {
		inactiveRefPaths = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...inactiveRefPaths, ...optionalActiveUnresolvedPaths]);
		analyzed = require_command_config.analyzeCommandSecretAssignmentsFromSnapshot({
			sourceConfig,
			resolvedConfig,
			targetIds: params.targetIds,
			inactiveRefPaths: new Set(inactiveRefPaths),
			...params.allowedPaths ? { allowedPaths: params.allowedPaths } : {}
		});
	}
	return {
		assignments: analyzed.assignments,
		diagnostics: analyzed.diagnostics,
		inactiveRefPaths
	};
}
//#endregion
//#region src/gateway/exec-approval-ios-push.ts
const APPROVALS_SCOPE = "operator.approvals";
const READ_SCOPE = "operator.read";
const OPERATOR_ROLE = "operator";
function isIosPlatform(platform) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(platform) ?? "";
	return normalized.startsWith("ios") || normalized.startsWith("ipados");
}
function resolveActiveOperatorToken(device) {
	const operatorToken = device.tokens?.[OPERATOR_ROLE];
	if (!operatorToken || operatorToken.revokedAtMs) return null;
	return operatorToken;
}
function canReceiveApprovalRequests(device) {
	const operatorToken = resolveActiveOperatorToken(device);
	if (!operatorToken) return false;
	return require_operator_scope_compat.roleScopesAllow({
		role: OPERATOR_ROLE,
		requestedScopes: [APPROVALS_SCOPE, READ_SCOPE],
		allowedScopes: operatorToken.scopes
	});
}
function shouldTargetDevice(params) {
	if (!isIosPlatform(params.device.platform)) return false;
	if (!require_device_pairing.hasEffectivePairedDeviceRole(params.device, OPERATOR_ROLE)) return false;
	if (!params.requireApprovalScope) return true;
	return canReceiveApprovalRequests(params.device);
}
async function loadRegisteredTargets(params) {
	if (params.deviceIds.length === 0) return [];
	return await require_push_apns_store.loadApnsRegistrations(params.deviceIds);
}
async function resolvePairedTargets(params) {
	return await loadRegisteredTargets({ deviceIds: (await require_device_pairing.listDevicePairing()).paired.filter((device) => {
		if (!shouldTargetDevice({
			device,
			requireApprovalScope: params.requireApprovalScope
		})) return false;
		const operatorToken = resolveActiveOperatorToken(device);
		if (params.isTargetVisible && !params.isTargetVisible({
			deviceId: device.deviceId,
			scopes: operatorToken?.scopes ?? []
		})) return false;
		return true;
	}).map((device) => device.deviceId) });
}
async function resolveDeliveryPlan(params) {
	const targets = params.explicitNodeIds?.length ? await loadRegisteredTargets({ deviceIds: params.explicitNodeIds }) : await resolvePairedTargets({
		requireApprovalScope: params.requireApprovalScope,
		isTargetVisible: params.isTargetVisible
	});
	if (targets.length === 0) return { targets: [] };
	const needsDirect = targets.some((target) => target.registration.transport === "direct");
	const needsRelay = targets.some((target) => target.registration.transport === "relay");
	let directAuth;
	if (needsDirect) {
		const auth = await require_push_apns.resolveApnsAuthConfigFromEnv(process.env);
		if (auth.ok) directAuth = auth.value;
		else params.log.warn?.(`${params.approvalKind} approvals: iOS direct APNs auth unavailable: ${auth.error}`);
	}
	const relayConfigByNodeId = /* @__PURE__ */ new Map();
	if (needsRelay) for (const target of targets) {
		if (target.registration.transport !== "relay") continue;
		const relay = require_push_apns_store.resolveApnsRelayConfigFromEnv(process.env, require_io.getRuntimeConfig().gateway, { registrationRelayOrigin: target.registration.relayOrigin });
		if (relay.ok) relayConfigByNodeId.set(target.nodeId, relay.value);
		else params.log.warn?.(`${params.approvalKind} approvals: iOS relay APNs config unavailable: ${relay.error}`);
	}
	const relayConfig = relayConfigByNodeId.values().next().value;
	return {
		targets: targets.filter((target) => target.registration.transport === "direct" ? Boolean(directAuth) : relayConfigByNodeId.has(target.nodeId) && relayConfigByNodeId.get(target.nodeId)?.baseUrl === relayConfig?.baseUrl),
		directAuth,
		relayConfig
	};
}
async function clearStaleApnsRegistrationIfNeeded(params) {
	if (require_push_apns.shouldClearStoredApnsRegistration({
		registration: params.registration,
		result: params.result
	})) await require_push_apns_store.clearApnsRegistrationIfCurrent({
		nodeId: params.nodeId,
		registration: params.registration
	});
}
async function sendRequestedPushes(params) {
	const gatewayDeviceId = require_device_identity.loadOrCreateProcessDeviceIdentity().deviceId;
	return await sendApprovalPushes({
		approvalId: params.request.id,
		plan: params.plan,
		log: params.log,
		approvalKind: params.driver.approvalKind,
		label: "request",
		logThrown: true,
		send: async ({ target, plan }) => await params.driver.sendRequested({
			request: params.request,
			target,
			plan,
			gatewayDeviceId
		})
	});
}
async function sendApprovalPushes(params) {
	const results = await Promise.allSettled(params.plan.targets.map(async (target) => {
		const result = await params.send({
			target,
			approvalId: params.approvalId,
			plan: params.plan
		});
		await clearStaleApnsRegistrationIfNeeded({
			nodeId: target.nodeId,
			registration: target.registration,
			result
		});
		if (!result.ok) params.log.warn?.(`${params.approvalKind} approvals: iOS ${params.label} push failed node=${target.nodeId} status=${result.status} reason=${result.reason ?? "unknown"}`);
		return {
			nodeId: target.nodeId,
			ok: result.ok
		};
	}));
	for (const result of results) if (params.logThrown && result.status === "rejected") {
		const message = require_errors.formatErrorMessage(result.reason);
		params.log.warn?.(`${params.approvalKind} approvals: iOS ${params.label} push threw error: ${message}`);
	}
	return {
		attempted: params.plan.targets.length,
		delivered: results.filter((result) => result.status === "fulfilled" && result.value.ok).length
	};
}
async function sendResolvedPushes(params) {
	const gatewayDeviceId = require_device_identity.loadOrCreateProcessDeviceIdentity().deviceId;
	await sendApprovalPushes({
		approvalId: params.approvalId,
		plan: params.plan,
		log: params.log,
		approvalKind: params.driver.approvalKind,
		label: "cleanup",
		logThrown: false,
		send: async ({ target, approvalId, plan }) => await params.driver.sendResolved({
			approvalId,
			target,
			plan,
			gatewayDeviceId
		})
	});
}
function createApprovalIosPushDelivery(params) {
	const approvalDeliveriesById = /* @__PURE__ */ new Map();
	const pendingDeliveryStateById = /* @__PURE__ */ new Map();
	const sendCleanupPushForApproval = async (approvalId) => {
		const deliveryState = approvalDeliveriesById.get(approvalId) ?? await pendingDeliveryStateById.get(approvalId);
		approvalDeliveriesById.delete(approvalId);
		pendingDeliveryStateById.delete(approvalId);
		if (!deliveryState?.nodeIds.length) {
			params.log.debug?.(`${params.driver.approvalKind} approvals: iOS cleanup push skipped approvalId=${approvalId} reason=missing-targets`);
			return;
		}
		await deliveryState.requestPushPromise;
		const plan = await resolveDeliveryPlan({
			approvalKind: params.driver.approvalKind,
			requireApprovalScope: false,
			explicitNodeIds: deliveryState.nodeIds,
			log: params.log
		});
		if (plan.targets.length === 0) return;
		await sendResolvedPushes({
			approvalId,
			plan,
			log: params.log,
			driver: params.driver
		});
	};
	return {
		/** Sends the initial approval notification to visible iOS operator devices. */
		async handleRequested(request, opts) {
			const deliveryStatePromise = (async () => {
				const plan = await resolveDeliveryPlan({
					approvalKind: params.driver.approvalKind,
					requireApprovalScope: true,
					isTargetVisible: opts?.isTargetVisible,
					log: params.log
				});
				if (plan.targets.length === 0) {
					approvalDeliveriesById.delete(request.id);
					return null;
				}
				const deliveryState = {
					nodeIds: plan.targets.map((target) => target.nodeId),
					requestPushPromise: sendRequestedPushes({
						request,
						plan,
						log: params.log,
						driver: params.driver
					}).catch((err) => {
						const message = require_errors.formatErrorMessage(err);
						params.log.error?.(`${params.driver.approvalKind} approvals: iOS request push failed: ${message}`);
						return {
							attempted: plan.targets.length,
							delivered: 0
						};
					})
				};
				approvalDeliveriesById.set(request.id, deliveryState);
				return deliveryState;
			})();
			pendingDeliveryStateById.set(request.id, deliveryStatePromise);
			const deliveryState = await deliveryStatePromise;
			if (pendingDeliveryStateById.get(request.id) === deliveryStatePromise) pendingDeliveryStateById.delete(request.id);
			if (!deliveryState) return false;
			const { attempted, delivered } = await deliveryState.requestPushPromise;
			if (attempted > 0 && delivered === 0) {
				params.log.warn?.(`${params.driver.approvalKind} approvals: iOS request push reached no devices approvalId=${request.id} attempted=${attempted}`);
				if (approvalDeliveriesById.get(request.id)?.requestPushPromise === deliveryState.requestPushPromise) approvalDeliveriesById.delete(request.id);
				return false;
			}
			return true;
		},
		/** Sends cleanup wakes for resolved approval requests. */
		async handleResolved(resolved) {
			await sendCleanupPushForApproval(resolved.id);
		},
		/** Sends cleanup wakes for expired approval requests. */
		async handleExpired(request) {
			await sendCleanupPushForApproval(request.id);
		}
	};
}
/** Creates iOS push delivery for exec approval requests. */
function createExecApprovalIosPushDelivery(params) {
	return createApprovalIosPushDelivery({
		log: params.log,
		driver: {
			approvalKind: "exec",
			sendRequested: async ({ request, target, plan, gatewayDeviceId }) => target.registration.transport === "direct" ? await require_push_apns.sendApnsExecApprovalAlert({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId: request.id,
				gatewayDeviceId,
				auth: plan.directAuth
			}) : await require_push_apns.sendApnsExecApprovalAlert({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId: request.id,
				gatewayDeviceId,
				relayConfig: plan.relayConfig
			}),
			sendResolved: async ({ approvalId, target, plan, gatewayDeviceId }) => target.registration.transport === "direct" ? await require_push_apns.sendApnsExecApprovalResolvedWake({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId,
				gatewayDeviceId,
				auth: plan.directAuth
			}) : await require_push_apns.sendApnsExecApprovalResolvedWake({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId,
				gatewayDeviceId,
				relayConfig: plan.relayConfig
			})
		}
	});
}
/** Creates iOS push delivery for plugin approval requests. */
function createPluginApprovalIosPushDelivery(params) {
	return createApprovalIosPushDelivery({
		log: params.log,
		driver: {
			approvalKind: "plugin",
			sendRequested: async ({ request, target, plan, gatewayDeviceId }) => target.registration.transport === "direct" ? await require_push_apns.sendApnsPluginApprovalAlert({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId: request.id,
				gatewayDeviceId,
				title: request.request.title,
				description: request.request.description,
				auth: plan.directAuth
			}) : await require_push_apns.sendApnsPluginApprovalAlert({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId: request.id,
				gatewayDeviceId,
				title: request.request.title,
				description: request.request.description,
				relayConfig: plan.relayConfig
			}),
			sendResolved: async ({ approvalId, target, plan, gatewayDeviceId }) => target.registration.transport === "direct" ? await require_push_apns.sendApnsPluginApprovalResolvedWake({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId,
				gatewayDeviceId,
				auth: plan.directAuth
			}) : await require_push_apns.sendApnsPluginApprovalResolvedWake({
				registration: target.registration,
				nodeId: target.nodeId,
				approvalId,
				gatewayDeviceId,
				relayConfig: plan.relayConfig
			})
		}
	});
}
//#endregion
//#region src/gateway/lazy-handler.ts
function createLazyHandler(method, loadHandlers) {
	return async (opts) => {
		const handler = (await loadHandlers())[method];
		if (!handler) throw new Error(`lazy gateway handler not found: ${method}`);
		await handler(opts);
	};
}
//#endregion
//#region src/gateway/server-aux-handlers.ts
async function activateSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, options) {
	const runtime = await Promise.resolve().then(() => require("./runtime-Cmn4mgbi.cjs"));
	if (options?.canActivate && !options.canActivate()) return null;
	if (!runtime.activateSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision)) return null;
	options?.onActivated?.();
	return runtime.getActiveSecretsRuntimeSnapshotRevision();
}
async function restoreSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, ownedSnapshot, options) {
	const runtime = await Promise.resolve().then(() => require("./runtime-Cmn4mgbi.cjs"));
	if (!runtime.restoreSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, ownedSnapshot)) return null;
	options?.onActivated?.();
	return runtime.getActiveSecretsRuntimeSnapshotRevision();
}
/** Create auxiliary gateway handlers that are not part of the core descriptor set. */
function createGatewayAuxHandlers(params) {
	const approvalPersistence = { runtimeEpoch: (0, node_crypto.randomUUID)() };
	const approvalStartupNowMs = Date.now();
	require_operator_approval_store.closeOrphanedOperatorApprovals({
		runtimeEpoch: approvalPersistence.runtimeEpoch,
		nowMs: approvalStartupNowMs
	});
	require_operator_approval_store.pruneTerminalOperatorApprovals({ nowMs: approvalStartupNowMs });
	const createApprovalManager = (approvalKind, resolveAllowedDecisions) => new require_exec_approval_manager.ExecApprovalManager({
		approvalKind,
		persistence: approvalPersistence,
		resolveAudienceSessionKeys: require_approval_session_audience.resolveApprovalSessionAudienceWithFallback,
		resolveAllowedDecisions,
		onLifecycle: params.onApprovalLifecycle,
		onError: (error, context) => params.log.error?.(`${context.approvalKind} approval ${context.operation} failed for ${context.approvalId}: ${String(error)}`)
	});
	const execApprovalManager = createApprovalManager("exec", require_exec_approvals.resolveExecApprovalRequestAllowedDecisions);
	const execApprovalForwarder = createExecApprovalForwarder();
	const execApprovalIosPushDelivery = createExecApprovalIosPushDelivery({ log: params.log });
	const loadExecApprovalHandlers = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./exec-approval-DCCWTOJD.cjs")).then(({ createExecApprovalHandlers }) => createExecApprovalHandlers(execApprovalManager, {
		forwarder: execApprovalForwarder,
		iosPushDelivery: execApprovalIosPushDelivery
	})), { cacheRejections: true });
	const buildReloadPlan = params.buildReloadPlan ?? require_config_reload_plan.buildGatewayReloadPlan;
	const pluginApprovalManager = createApprovalManager("plugin", require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions);
	const pluginApprovalIosPushDelivery = createPluginApprovalIosPushDelivery({ log: params.log });
	const systemAgentApprovalManager = createApprovalManager("system-agent", () => require_system_agent_approvals.SYSTEM_AGENT_APPROVAL_DECISIONS);
	const loadPluginApprovalHandlers = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./plugin-approval-DDpjqTdg.cjs")).then(({ createPluginApprovalHandlers }) => createPluginApprovalHandlers(pluginApprovalManager, {
		forwarder: execApprovalForwarder,
		iosPushDelivery: pluginApprovalIosPushDelivery
	})), { cacheRejections: true });
	const loadApprovalHandlers = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./approval-BozSirWS.cjs")).then(({ createApprovalHandlers }) => createApprovalHandlers({
		execApprovalManager,
		pluginApprovalManager,
		systemAgentApprovalManager,
		forwarder: execApprovalForwarder,
		iosPushDelivery: execApprovalIosPushDelivery,
		pluginIosPushDelivery: pluginApprovalIosPushDelivery
	})), { cacheRejections: true });
	let reloadInFlight = null;
	const runExclusiveReload = (fn) => {
		if (reloadInFlight) return reloadInFlight;
		const run = (async () => {
			try {
				return await fn();
			} finally {
				reloadInFlight = null;
			}
		})();
		reloadInFlight = run;
		return run;
	};
	const loadSecretsHandlers = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./secrets-CyVDySGH.cjs")).then(({ createSecretsHandlers }) => createSecretsHandlers({
		reloadSecrets: () => runExclusiveReload(async () => {
			let transaction;
			const stoppedChannels = [];
			const restartedChannels = /* @__PURE__ */ new Set();
			try {
				for (;;) {
					const previousSnapshot = require_runtime_state.getActiveSecretsRuntimeSnapshot();
					if (!previousSnapshot) throw new Error("Secrets runtime snapshot is not active.");
					const previousSnapshotRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
					const previousGenerationOwnership = require_server_shared_auth_generation.captureSharedGatewaySessionGenerationOwnership(params.sharedGatewaySessionGenerationState);
					const previousSharedGatewaySessionGeneration = previousGenerationOwnership.generation;
					const previousSharedGatewaySessionGenerationRequired = params.sharedGatewaySessionGenerationState.required;
					const prepared = await params.activateRuntimeSecrets(previousSnapshot.sourceConfig, {
						reason: "reload",
						activate: false
					});
					const plan = buildReloadPlan(require_config_diff.diffConfigPaths(previousSnapshot.config, prepared.config));
					const nextSharedGatewaySessionGeneration = params.resolveSharedGatewaySessionGenerationForConfig(prepared.config);
					let publishedSnapshotRevision = null;
					let generationOwnership = null;
					const activateIfCurrent = params.activateRuntimeSecrets.activatePreparedSnapshotIfCurrent;
					if (activateIfCurrent) {
						if (!await activateIfCurrent(prepared, previousSnapshotRevision, {
							reason: "reload",
							activate: true
						}, async () => {
							publishedSnapshotRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
							generationOwnership = require_server_shared_auth_generation.claimSharedGatewaySessionGenerationIfOwned(params.sharedGatewaySessionGenerationState, previousGenerationOwnership, nextSharedGatewaySessionGeneration);
						}, () => require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, previousGenerationOwnership))) continue;
					} else {
						publishedSnapshotRevision = await activateSecretsRuntimeSnapshotIfCurrent(prepared, previousSnapshotRevision, {
							canActivate: () => require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, previousGenerationOwnership),
							onActivated: () => {
								generationOwnership = require_server_shared_auth_generation.claimSharedGatewaySessionGenerationIfOwned(params.sharedGatewaySessionGenerationState, previousGenerationOwnership, nextSharedGatewaySessionGeneration);
							}
						});
						if (publishedSnapshotRevision === null) continue;
					}
					if (publishedSnapshotRevision === null || generationOwnership === null) throw new Error("Secrets runtime activation did not publish ownership.");
					transaction = {
						previousSnapshot,
						previousSharedGatewaySessionGeneration,
						previousSharedGatewaySessionGenerationRequired,
						prepared,
						plan,
						nextSharedGatewaySessionGeneration,
						sharedGatewaySessionGenerationChanged: previousSharedGatewaySessionGeneration !== nextSharedGatewaySessionGeneration,
						generationOwnership,
						publishedSnapshotRevision
					};
					if (!require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, generationOwnership)) throw new Error("secrets.reload was superseded by a newer config write");
					break;
				}
				const { prepared, plan, generationOwnership, nextSharedGatewaySessionGeneration, sharedGatewaySessionGenerationChanged } = transaction;
				if (sharedGatewaySessionGenerationChanged) require_server_shared_auth_generation.disconnectStaleSharedGatewayAuthClients({
					clients: params.clients,
					expectedGeneration: nextSharedGatewaySessionGeneration
				});
				if (plan.restartChannels.size > 0) {
					const restartChannels = [...plan.restartChannels];
					if (require_env.isTruthyEnvValue(process.env.OPERATOR_SKIP_CHANNELS) || require_env.isTruthyEnvValue(process.env.OPERATOR_SKIP_PROVIDERS)) throw new Error(`secrets.reload requires restarting channels: ${restartChannels.join(", ")}`);
					if (params.getChannelAutostartSuppression?.()) throw new Error(`secrets.reload requires restarting channels but channel autostart is suppressed by crash-loop breaker: ${restartChannels.join(", ")}`);
					const restartFailures = [];
					for (const channel of restartChannels) {
						if (!require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, generationOwnership)) throw new Error("secrets.reload was superseded by a newer config write");
						params.logChannels.info(`restarting ${channel} channel after secrets reload`);
						stoppedChannels.push(channel);
						try {
							await params.stopChannel(channel);
							if (!require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, generationOwnership)) throw new Error("secrets.reload was superseded by a newer config write");
							await params.startChannel(channel);
							restartedChannels.add(channel);
							if (!require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, generationOwnership)) throw new Error("secrets.reload was superseded by a newer config write");
						} catch {
							params.logChannels.info(`failed to restart ${channel} channel after secrets reload`);
							restartFailures.push(channel);
						}
					}
					if (restartFailures.length > 0) throw new Error(`failed to restart channels after secrets reload: ${restartFailures.join(", ")}`);
				}
				if (!require_server_shared_auth_generation.finalizeOwnedSharedGatewaySessionGeneration(params.sharedGatewaySessionGenerationState, generationOwnership)) throw new Error("secrets.reload was superseded by a newer config write");
				return { warningCount: prepared.warnings.length };
			} catch (err) {
				let generationRestored = false;
				if (transaction) {
					const failedTransaction = transaction;
					await restoreSecretsRuntimeSnapshotIfCurrent(failedTransaction.previousSnapshot, failedTransaction.publishedSnapshotRevision, failedTransaction.prepared, { onActivated: () => {
						generationRestored = require_server_shared_auth_generation.replaceOwnedSharedGatewaySessionGenerationState(params.sharedGatewaySessionGenerationState, failedTransaction.generationOwnership, {
							current: failedTransaction.previousSharedGatewaySessionGeneration,
							required: failedTransaction.previousSharedGatewaySessionGenerationRequired
						});
					} });
				}
				if (generationRestored && transaction) {
					if (transaction.sharedGatewaySessionGenerationChanged) require_server_shared_auth_generation.disconnectStaleSharedGatewayAuthClients({
						clients: params.clients,
						expectedGeneration: transaction.previousSharedGatewaySessionGeneration
					});
				}
				for (const channel of stoppedChannels) {
					params.logChannels.info(`rolling back ${channel} channel after secrets reload failure`);
					try {
						if (restartedChannels.has(channel)) await params.stopChannel(channel);
						await params.startChannel(channel);
					} catch {
						params.logChannels.info(`failed to roll back ${channel} channel after secrets reload`);
					}
				}
				throw err;
			}
		}),
		log: params.log,
		resolveSecrets: async ({ allowedPaths, commandName, forcedActivePaths, optionalActivePaths, providerOverrides, targetIds }) => {
			const { assignments, diagnostics, inactiveRefPaths } = await resolveCommandSecretsFromActiveRuntimeSnapshot({
				commandName,
				targetIds: new Set(targetIds),
				...allowedPaths ? { allowedPaths: new Set(allowedPaths) } : {},
				...forcedActivePaths ? { forcedActivePaths: new Set(forcedActivePaths) } : {},
				...optionalActivePaths ? { optionalActivePaths: new Set(optionalActivePaths) } : {},
				...providerOverrides ? { providerOverrides } : {}
			});
			if (assignments.length === 0) return {
				assignments: [],
				diagnostics,
				inactiveRefPaths
			};
			return {
				assignments,
				diagnostics,
				inactiveRefPaths
			};
		}
	})), { cacheRejections: true });
	return {
		execApprovalManager,
		forwardPluginApprovalRequest: execApprovalForwarder.handlePluginApprovalRequested,
		pluginApprovalIosPushDelivery,
		pluginApprovalManager,
		systemAgentApprovalManager,
		extraHandlers: {
			"exec.approval.get": createLazyHandler("exec.approval.get", loadExecApprovalHandlers),
			"exec.approval.list": createLazyHandler("exec.approval.list", loadExecApprovalHandlers),
			"exec.approval.request": createLazyHandler("exec.approval.request", loadExecApprovalHandlers),
			"exec.approval.waitDecision": createLazyHandler("exec.approval.waitDecision", loadExecApprovalHandlers),
			"exec.approval.resolve": createLazyHandler("exec.approval.resolve", loadExecApprovalHandlers),
			"plugin.approval.list": createLazyHandler("plugin.approval.list", loadPluginApprovalHandlers),
			"plugin.approval.request": createLazyHandler("plugin.approval.request", loadPluginApprovalHandlers),
			"plugin.approval.waitDecision": createLazyHandler("plugin.approval.waitDecision", loadPluginApprovalHandlers),
			"plugin.approval.resolve": createLazyHandler("plugin.approval.resolve", loadPluginApprovalHandlers),
			"approval.get": createLazyHandler("approval.get", loadApprovalHandlers),
			"approval.resolve": createLazyHandler("approval.resolve", loadApprovalHandlers),
			"secrets.reload": createLazyHandler("secrets.reload", loadSecretsHandlers),
			"secrets.resolve": createLazyHandler("secrets.resolve", loadSecretsHandlers)
		}
	};
}
//#endregion
exports.createGatewayAuxHandlers = createGatewayAuxHandlers;
