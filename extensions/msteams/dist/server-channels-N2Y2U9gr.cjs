require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_plugins = require("./plugins-_-82JYfc.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_src = require("./src-BcOJL8NE.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
require("./backoff-Dw8FZM0b.cjs");
const require_approval_gateway_runtime_context = require("./approval-gateway-runtime-context-BcSfhnH6.cjs");
const require_approval_native_route_coordinator = require("./approval-native-route-coordinator-MGwpludK.cjs");
const require_client_start_readiness = require("./client-start-readiness-CjzVtlBH.cjs");
const require_plugin_approval_canonical_decisions = require("./plugin-approval-canonical-decisions-Bgs1VXWI.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_target_resolver = require("./target-resolver-Bn46QRpp.cjs");
const require_account_enabled = require("./account-enabled-DY_zjQ1k.cjs");
const require_connect_error_details = require("./connect-error-details-lz40g7i9.cjs");
const require_http_registry = require("./http-registry-CuAISLrz.cjs");
const require_exec_approval_reply = require("./exec-approval-reply-DwQg90Rf.cjs");
const require_operator_approvals_client = require("./operator-approvals-client-B0bTIIPL.cjs");
const require_exec_approval_command_display = require("./exec-approval-command-display-C2k3m9ob.cjs");
const require_approval_gateway_runtime_methods = require("./approval-gateway-runtime-methods-BX4yQO-2.cjs");
//#region src/infra/approval-handler-adapter-runtime.ts
/** Runtime-context capability key used by channels to register native approval resources. */
const CHANNEL_APPROVAL_NATIVE_RUNTIME_CONTEXT_CAPABILITY = "approval.native";
//#endregion
//#region src/infra/approval-native-delivery.ts
function dedupeTargets(targets) {
	const seen = /* @__PURE__ */ new Set();
	const deduped = [];
	for (const target of targets) {
		const key = require_approval_native_route_coordinator.buildChannelApprovalNativeTargetKey(target.target);
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(target);
	}
	return deduped;
}
/** Resolves the origin and approver-DM targets a channel should use for native approvals. */
async function resolveChannelNativeApprovalDeliveryPlan(params) {
	const adapter = params.adapter;
	if (!adapter) return {
		targets: [],
		originTarget: null,
		notifyOriginWhenDmOnly: false
	};
	const capabilities = adapter.describeDeliveryCapabilities({
		cfg: params.cfg,
		accountId: params.accountId,
		approvalKind: params.approvalKind,
		request: params.request
	});
	if (!capabilities.enabled) return {
		targets: [],
		originTarget: null,
		notifyOriginWhenDmOnly: false
	};
	const originTarget = capabilities.supportsOriginSurface && adapter.resolveOriginTarget ? await adapter.resolveOriginTarget({
		cfg: params.cfg,
		accountId: params.accountId,
		approvalKind: params.approvalKind,
		request: params.request
	}) ?? null : null;
	const approverDmTargets = capabilities.supportsApproverDmSurface && adapter.resolveApproverDmTargets ? await adapter.resolveApproverDmTargets({
		cfg: params.cfg,
		accountId: params.accountId,
		approvalKind: params.approvalKind,
		request: params.request
	}) : [];
	const plannedTargets = [];
	const preferOrigin = capabilities.preferredSurface === "origin" || capabilities.preferredSurface === "both";
	const preferApproverDm = capabilities.preferredSurface === "approver-dm" || capabilities.preferredSurface === "both";
	if (preferOrigin && originTarget) plannedTargets.push({
		surface: "origin",
		target: originTarget,
		reason: "preferred"
	});
	if (preferApproverDm) for (const target of approverDmTargets) plannedTargets.push({
		surface: "approver-dm",
		target,
		reason: "preferred"
	});
	else if (!originTarget) for (const target of approverDmTargets) plannedTargets.push({
		surface: "approver-dm",
		target,
		reason: "fallback"
	});
	return {
		targets: dedupeTargets(plannedTargets),
		originTarget,
		notifyOriginWhenDmOnly: capabilities.preferredSurface === "approver-dm" && capabilities.notifyOriginWhenDmOnly === true && originTarget !== null
	};
}
//#endregion
//#region src/infra/approval-types.ts
/** Resolve approval ownership from the typed request payload, never from id spelling. */
function resolveApprovalRequestKind(request) {
	const isExec = "command" in request.request;
	if (isExec === ("title" in request.request && "description" in request.request)) throw new Error("approval request payload does not identify exactly one owner");
	if (isExec) return "exec";
	return "plugin";
}
//#endregion
//#region src/infra/exec-approval-channel-runtime.ts
/** Error raised when the gateway pauses approval reconnects after a terminal startup failure. */
var ExecApprovalChannelRuntimeTerminalStartError = class extends Error {
	constructor(info, cause) {
		super(`native approval gateway client paused reconnect after startup auth failure (${info.detailCode ?? "unknown"}): gateway closed (${info.code}): ${info.reason}`, cause === void 0 ? void 0 : { cause });
		this.name = "ExecApprovalChannelRuntimeTerminalStartError";
		this.detailCode = info.detailCode;
	}
};
/** Narrows terminal approval runtime startup failures for bootstrap retry policy. */
function isExecApprovalChannelRuntimeTerminalStartError(error) {
	return error instanceof ExecApprovalChannelRuntimeTerminalStartError;
}
function resolveApprovalReplayMethods(eventKinds) {
	const methods = [];
	if (eventKinds.has("exec")) methods.push("exec.approval.list");
	if (eventKinds.has("plugin")) methods.push("plugin.approval.list");
	return methods;
}
function readGatewayConnectErrorDetailCode(error) {
	if (!error || typeof error !== "object") return null;
	return require_connect_error_details.readConnectErrorDetailCode(error.details);
}
/** Creates the gateway-backed approval runtime that tracks pending requests and finalization. */
function createExecApprovalChannelRuntime(adapter) {
	const log = require_subsystem.createSubsystemLogger(adapter.label);
	const nowMs = adapter.nowMs ?? Date.now;
	const eventKinds = new Set(adapter.eventKinds ?? ["exec"]);
	const configuredGatewayRuntime = require_approval_gateway_runtime_context.getGatewayNativeApprovalRuntime();
	const pending = /* @__PURE__ */ new Map();
	let gatewayClient = null;
	let gatewayRuntime;
	let unsubscribeGatewayRuntime = null;
	let started = false;
	let shouldRun = false;
	let startPromise = null;
	let replayPromise = null;
	const shouldKeepRunning = () => shouldRun;
	const spawn = (label, promise) => {
		promise.catch((err) => {
			const message = require_errors.formatErrorMessage(err);
			log.error(`${label}: ${message}`);
		});
	};
	const stopClientIfInactive = (client) => {
		if (shouldKeepRunning()) return false;
		gatewayClient = null;
		client.stop();
		return true;
	};
	const clearPendingEntry = (approvalId) => {
		const entry = pending.get(approvalId);
		if (!entry) return null;
		pending.delete(approvalId);
		if (entry.timeoutId) clearTimeout(entry.timeoutId);
		return entry;
	};
	const handleExpired = async (approvalId) => {
		const entry = clearPendingEntry(approvalId);
		if (!entry) return;
		log.debug(`expired ${approvalId}`);
		await adapter.finalizeExpired?.({
			request: entry.request,
			entries: entry.entries
		});
	};
	const handleRequested = async (request, opts) => {
		if (opts?.ignoreIfInactive && !shouldKeepRunning()) return;
		if (pending.has(request.id)) {
			log.debug(`ignored duplicate request ${request.id}`);
			return;
		}
		if (opts?.alreadyAccepted !== true && !adapter.shouldHandle(request)) return;
		log.debug(`received request ${request.id}`);
		const entry = {
			request,
			entries: [],
			timeoutId: null,
			delivering: true,
			pendingResolution: null
		};
		pending.set(request.id, entry);
		let entries;
		try {
			entries = await adapter.deliverRequested(request);
		} catch (err) {
			if (pending.get(request.id) === entry) clearPendingEntry(request.id);
			throw err;
		}
		if (pending.get(request.id) !== entry) return;
		if (!entries.length) {
			pending.delete(request.id);
			return;
		}
		entry.entries = entries;
		entry.delivering = false;
		if (entry.pendingResolution) {
			pending.delete(request.id);
			log.debug(`resolved ${entry.pendingResolution.id} with ${entry.pendingResolution.decision}`);
			await adapter.finalizeResolved({
				request: entry.request,
				resolved: entry.pendingResolution,
				entries: entry.entries
			});
			return;
		}
		const timeoutMs = Math.max(0, request.expiresAtMs - nowMs());
		const timeoutId = setTimeout(() => {
			spawn("error handling approval expiration", handleExpired(request.id));
		}, timeoutMs);
		timeoutId.unref?.();
		entry.timeoutId = timeoutId;
	};
	const handleResolved = async (resolved) => {
		const entry = pending.get(resolved.id);
		if (!entry) return;
		if (entry.delivering) {
			entry.pendingResolution = resolved;
			return;
		}
		const finalizedEntry = clearPendingEntry(resolved.id);
		if (!finalizedEntry) return;
		log.debug(`resolved ${resolved.id} with ${resolved.decision}`);
		await adapter.finalizeResolved({
			request: finalizedEntry.request,
			resolved,
			entries: finalizedEntry.entries
		});
	};
	const handleGatewayEvent = (evt) => {
		if (evt.event === "exec.approval.requested" && eventKinds.has("exec")) {
			spawn("error handling approval request", handleRequested(evt.payload, { ignoreIfInactive: true }));
			return;
		}
		if (evt.event === "plugin.approval.requested" && eventKinds.has("plugin")) {
			spawn("error handling approval request", handleRequested(evt.payload, { ignoreIfInactive: true }));
			return;
		}
		if (evt.event === "exec.approval.resolved" && eventKinds.has("exec")) {
			spawn("error handling approval resolved", handleResolved(evt.payload));
			return;
		}
		if (evt.event === "plugin.approval.resolved" && eventKinds.has("plugin")) spawn("error handling approval resolved", handleResolved(evt.payload));
	};
	const replayPendingApprovals = async (client, externalClient) => {
		try {
			for (const method of resolveApprovalReplayMethods(eventKinds)) {
				if (externalClient && stopClientIfInactive(externalClient)) return;
				const pendingRequests = await client.request(method, {});
				if (externalClient && stopClientIfInactive(externalClient)) return;
				for (const request of pendingRequests) {
					if (externalClient && stopClientIfInactive(externalClient)) return;
					await handleRequested(request, { ignoreIfInactive: true });
				}
			}
		} catch (error) {
			if (!shouldKeepRunning()) return;
			throw error;
		}
	};
	const startPendingApprovalReplay = (client, externalClient) => {
		const promise = replayPendingApprovals(client, externalClient).catch((err) => {
			const message = require_errors.formatErrorMessage(err);
			log.error(`error replaying pending approvals: ${message}`);
		}).finally(() => {
			if (replayPromise === promise) replayPromise = null;
		});
		replayPromise = promise;
	};
	const waitForPendingApprovalReplay = async () => {
		const replay = replayPromise;
		if (!replay) return;
		await replay.catch(() => {});
	};
	return {
		async start() {
			if (started) return;
			if (startPromise) {
				await startPromise;
				return;
			}
			shouldRun = true;
			startPromise = (async () => {
				if (!adapter.isConfigured()) {
					log.debug("disabled");
					return;
				}
				if (configuredGatewayRuntime) {
					await adapter.beforeGatewayClientStart?.();
					gatewayRuntime = configuredGatewayRuntime;
					unsubscribeGatewayRuntime = gatewayRuntime.subscribe({
						eventKinds,
						shouldHandle: (request) => shouldKeepRunning() && adapter.shouldHandle(request),
						onRequested: (request) => {
							spawn("error handling approval request", handleRequested(request, {
								ignoreIfInactive: true,
								alreadyAccepted: true
							}));
						},
						onResolved: (resolved) => {
							spawn("error handling approval resolved", handleResolved(resolved));
						}
					});
					if (!shouldRun) {
						unsubscribeGatewayRuntime();
						unsubscribeGatewayRuntime = null;
						gatewayRuntime = void 0;
						return;
					}
					started = true;
					startPendingApprovalReplay({ request: gatewayRuntime.request });
					return;
				}
				let readySettled = false;
				let resolveReady;
				let rejectReady;
				const ready = new Promise((resolve, reject) => {
					resolveReady = resolve;
					rejectReady = reject;
				});
				let lastConnectError = null;
				const settleReady = (fn) => {
					if (readySettled) return;
					readySettled = true;
					fn();
				};
				const client = await require_operator_approvals_client.createOperatorApprovalsGatewayClient({
					config: adapter.cfg,
					gatewayUrl: adapter.gatewayUrl,
					clientDisplayName: adapter.clientDisplayName,
					onEvent: handleGatewayEvent,
					onHelloOk: () => {
						log.debug("connected to gateway");
						settleReady(resolveReady);
					},
					onConnectError: (err) => {
						log.error(`connect error: ${err.message}`);
						lastConnectError = err;
						if (readGatewayConnectErrorDetailCode(err)) return;
						settleReady(() => rejectReady(err));
					},
					onReconnectPaused: (info) => {
						settleReady(() => rejectReady(new ExecApprovalChannelRuntimeTerminalStartError(info, lastConnectError)));
					},
					onClose: (code, reason) => {
						log.debug(`gateway closed: ${code} ${reason}`);
						settleReady(() => rejectReady(lastConnectError ?? /* @__PURE__ */ new Error(`gateway closed: ${code} ${reason}`)));
					}
				});
				if (!shouldRun) {
					client.stop();
					return;
				}
				await adapter.beforeGatewayClientStart?.();
				gatewayClient = client;
				try {
					const readiness = await require_client_start_readiness.startGatewayClientWhenEventLoopReady(client, { clientOptions: { preauthHandshakeTimeoutMs: adapter.cfg.gateway?.handshakeTimeoutMs } });
					if (!readiness.ready) throw new Error(readiness.aborted ? "gateway approval runtime start aborted before readiness" : "gateway readiness unavailable before exec approval runtime start");
					await ready;
					if (stopClientIfInactive(client)) return;
					started = true;
					startPendingApprovalReplay(client, client);
				} catch (error) {
					gatewayClient = null;
					started = false;
					client.stop();
					throw error;
				}
			})().finally(() => {
				startPromise = null;
			});
			await startPromise;
		},
		async stop() {
			shouldRun = false;
			if (startPromise) await startPromise.catch(() => {});
			const wasActive = started || gatewayClient !== null || replayPromise !== null;
			started = false;
			unsubscribeGatewayRuntime?.();
			unsubscribeGatewayRuntime = null;
			gatewayRuntime = void 0;
			gatewayClient?.stop();
			gatewayClient = null;
			await waitForPendingApprovalReplay();
			if (!wasActive) {
				await adapter.onStopped?.();
				return;
			}
			for (const entry of pending.values()) if (entry.timeoutId) clearTimeout(entry.timeoutId);
			pending.clear();
			await adapter.onStopped?.();
			log.debug("stopped");
		},
		handleRequested,
		handleResolved,
		handleExpired,
		async request(method, params) {
			if (!require_method_scopes.isApprovalMethod(method)) throw new Error(`${adapter.label}: operator approvals runtime cannot dispatch ${method}; use a write-capable gateway client`);
			if (gatewayRuntime) {
				if (!require_approval_gateway_runtime_methods.isGatewayNativeApprovalMethod(method)) throw new Error(`${adapter.label}: Gateway-owned approval runtime cannot dispatch ${method}`);
				return await gatewayRuntime.request(method, params, { clientDisplayName: adapter.clientDisplayName });
			}
			if (!gatewayClient) throw new Error(`${adapter.label}: gateway client not connected`);
			return await gatewayClient.request(method, params);
		}
	};
}
//#endregion
//#region src/infra/approval-native-runtime.ts
/** Delivers an approval request to the adapter-planned native targets and returns pending entries. */
async function deliverApprovalRequestViaChannelNativePlan(params) {
	const deliveryPlan = await resolveChannelNativeApprovalDeliveryPlan({
		cfg: params.cfg,
		accountId: params.accountId,
		approvalKind: params.approvalKind,
		request: params.request,
		adapter: params.adapter
	});
	const deliveredKeys = /* @__PURE__ */ new Set();
	const pendingEntries = [];
	const deliveredTargets = [];
	for (const plannedTarget of deliveryPlan.targets) try {
		const preparedTarget = await params.prepareTarget({
			plannedTarget,
			request: params.request
		});
		if (!preparedTarget) continue;
		if (deliveredKeys.has(preparedTarget.dedupeKey)) {
			params.onDuplicateSkipped?.({
				plannedTarget,
				preparedTarget,
				request: params.request
			});
			continue;
		}
		const entry = await params.deliverTarget({
			plannedTarget,
			preparedTarget: preparedTarget.target,
			request: params.request
		});
		if (!entry) continue;
		deliveredKeys.add(preparedTarget.dedupeKey);
		pendingEntries.push(entry);
		deliveredTargets.push(plannedTarget);
		params.onDelivered?.({
			plannedTarget,
			preparedTarget,
			request: params.request,
			entry
		});
	} catch (error) {
		params.onDeliveryError?.({
			error,
			plannedTarget,
			request: params.request
		});
	}
	return {
		entries: pendingEntries,
		deliveryPlan,
		deliveredTargets
	};
}
/** Creates the shared gateway approval runtime backed by channel-native delivery hooks. */
function createChannelNativeApprovalRuntime(adapter) {
	const nowMs = adapter.nowMs ?? Date.now;
	const resolveApprovalKind = adapter.resolveApprovalKind ?? ((request) => resolveApprovalRequestKind(request));
	const handledEventKinds = new Set(adapter.eventKinds ?? ["exec"]);
	const gatewayRuntime = require_approval_gateway_runtime_context.getGatewayNativeApprovalRuntime();
	const routeReporter = (gatewayRuntime?.routeCoordinator.createReporter ?? require_approval_native_route_coordinator.createApprovalNativeRouteReporter)({
		handledKinds: handledEventKinds,
		channel: adapter.channel,
		channelLabel: adapter.channelLabel,
		accountId: adapter.accountId,
		requestGateway: async (method, params) => {
			if (gatewayRuntime) {
				if (method !== "send") throw new Error(`native approval route cannot dispatch ${method}`);
				return await gatewayRuntime.requestRoute(method, params);
			}
			const { callGatewayLeastPrivilege } = await Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports);
			return await callGatewayLeastPrivilege({
				config: adapter.cfg,
				...adapter.gatewayUrl ? { url: adapter.gatewayUrl } : {},
				method,
				params,
				clientName: require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT,
				mode: require_client_info.GATEWAY_CLIENT_MODES.BACKEND
			});
		}
	});
	const runtime = createExecApprovalChannelRuntime({
		label: adapter.label,
		clientDisplayName: adapter.clientDisplayName,
		cfg: adapter.cfg,
		gatewayUrl: adapter.gatewayUrl,
		eventKinds: adapter.eventKinds,
		isConfigured: adapter.isConfigured,
		shouldHandle: (request) => {
			const approvalKind = resolveApprovalKind(request);
			routeReporter.observeRequest({
				approvalKind,
				request
			});
			let shouldHandle;
			try {
				shouldHandle = adapter.shouldHandle(request);
			} catch (error) {
				routeReporter.reportSkipped({
					approvalKind,
					request
				});
				throw error;
			}
			if (shouldHandle) return shouldHandle;
			routeReporter.reportSkipped({
				approvalKind,
				request
			});
			return false;
		},
		finalizeResolved: adapter.finalizeResolved,
		finalizeExpired: adapter.finalizeExpired,
		onStopped: adapter.onStopped,
		beforeGatewayClientStart: () => {
			routeReporter.start();
		},
		nowMs,
		deliverRequested: async (request) => {
			const approvalKind = resolveApprovalKind(request);
			let deliveryPlan = {
				targets: [],
				originTarget: null,
				notifyOriginWhenDmOnly: false
			};
			let deliveredTargets = [];
			try {
				const pendingContent = await adapter.buildPendingContent({
					request,
					approvalKind,
					nowMs: nowMs()
				});
				const deliveryResult = await deliverApprovalRequestViaChannelNativePlan({
					cfg: adapter.cfg,
					accountId: adapter.accountId,
					approvalKind,
					request,
					adapter: adapter.nativeAdapter,
					prepareTarget: async ({ plannedTarget, request: requestCandidate }) => await adapter.prepareTarget({
						plannedTarget,
						request: requestCandidate,
						approvalKind,
						pendingContent
					}),
					deliverTarget: async ({ plannedTarget, preparedTarget, request: requestEntry }) => await adapter.deliverTarget({
						plannedTarget,
						preparedTarget,
						request: requestEntry,
						approvalKind,
						pendingContent
					}),
					onDeliveryError: adapter.onDeliveryError ? ({ error, plannedTarget, request: requestResult }) => {
						adapter.onDeliveryError?.({
							error,
							plannedTarget,
							request: requestResult,
							approvalKind,
							pendingContent
						});
					} : void 0,
					onDuplicateSkipped: adapter.onDuplicateSkipped ? ({ plannedTarget, preparedTarget, request: requestValue }) => {
						adapter.onDuplicateSkipped?.({
							plannedTarget,
							preparedTarget,
							request: requestValue,
							approvalKind,
							pendingContent
						});
					} : void 0,
					onDelivered: adapter.onDelivered ? ({ plannedTarget, preparedTarget, request: requestLocal, entry }) => {
						adapter.onDelivered?.({
							plannedTarget,
							preparedTarget,
							request: requestLocal,
							approvalKind,
							pendingContent,
							entry
						});
					} : void 0
				});
				deliveryPlan = deliveryResult.deliveryPlan;
				deliveredTargets = deliveryResult.deliveredTargets;
				return deliveryResult.entries;
			} finally {
				await routeReporter.reportDelivery({
					approvalKind,
					request,
					deliveryPlan,
					deliveredTargets
				});
			}
		}
	});
	return {
		...runtime,
		async start() {
			try {
				await runtime.start();
			} catch (error) {
				await routeReporter.stop();
				throw error;
			}
		},
		async stop() {
			await routeReporter.stop();
			await runtime.stop();
		}
	};
}
//#endregion
//#region src/infra/approval-view-model.ts
function buildExecMetadata(request) {
	const metadata = [];
	if (request.request.agentId) metadata.push({
		label: "Agent",
		value: request.request.agentId
	});
	if (request.request.cwd) metadata.push({
		label: "CWD",
		value: request.request.cwd
	});
	if (request.request.host) metadata.push({
		label: "Host",
		value: request.request.host
	});
	if (Array.isArray(request.request.envKeys) && request.request.envKeys.length > 0) metadata.push({
		label: "Env Overrides",
		value: request.request.envKeys.join(", ")
	});
	return metadata;
}
function buildPluginMetadata(request) {
	const metadata = [];
	const severity = request.request.severity ?? "warning";
	metadata.push({
		label: "Severity",
		value: severity === "critical" ? "Critical" : severity === "info" ? "Info" : "Warning"
	});
	if (request.request.toolName) metadata.push({
		label: "Tool",
		value: request.request.toolName
	});
	if (request.request.pluginId) metadata.push({
		label: "Plugin",
		value: request.request.pluginId
	});
	if (request.request.agentId) metadata.push({
		label: "Agent",
		value: request.request.agentId
	});
	return metadata;
}
function buildExecViewBase(request, phase) {
	const { commandText, commandPreview } = require_exec_approval_command_display.resolveExecApprovalCommandDisplay(request.request);
	return {
		approvalId: request.id,
		approvalKind: "exec",
		phase,
		title: phase === "pending" ? "Exec Approval Required" : "Exec Approval",
		description: phase === "pending" ? "A command needs your approval." : null,
		metadata: buildExecMetadata(request),
		ask: request.request.ask ?? null,
		agentId: request.request.agentId ?? null,
		warningText: request.request.warningText ?? null,
		commandAnalysis: request.request.commandAnalysis ?? null,
		commandText,
		commandPreview,
		cwd: request.request.cwd ?? null,
		envKeys: request.request.envKeys ?? void 0,
		host: request.request.host ?? null,
		nodeId: request.request.nodeId ?? null,
		sessionKey: request.request.sessionKey ?? null
	};
}
function buildPluginViewBase(request, phase) {
	return {
		approvalId: request.id,
		approvalKind: "plugin",
		phase,
		title: request.request.title,
		description: request.request.description ?? null,
		metadata: buildPluginMetadata(request),
		agentId: request.request.agentId ?? null,
		pluginId: request.request.pluginId ?? null,
		toolName: request.request.toolName ?? null,
		severity: request.request.severity ?? "warning"
	};
}
/** Builds the presentation model for an unresolved exec or plugin approval. */
function buildPendingApprovalView(request) {
	const approvalKind = resolveApprovalRequestKind(request);
	if (approvalKind === "plugin") {
		const pluginRequest = request;
		return {
			...buildPluginViewBase(pluginRequest, "pending"),
			actions: require_exec_approval_reply.buildTypedApprovalActionDescriptors({
				approvalCommandId: pluginRequest.id,
				approvalKind,
				allowedDecisions: require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions(pluginRequest.request)
			}),
			expiresAtMs: pluginRequest.expiresAtMs
		};
	}
	const execRequest = request;
	return {
		...buildExecViewBase(execRequest, "pending"),
		actions: require_exec_approval_reply.buildTypedApprovalActionDescriptors({
			approvalCommandId: execRequest.id,
			approvalKind,
			ask: execRequest.request.ask,
			allowedDecisions: require_exec_approvals.resolveExecApprovalRequestAllowedDecisions(execRequest.request)
		}),
		expiresAtMs: execRequest.expiresAtMs
	};
}
/** Builds the presentation model for an approval after a decision was recorded. */
function buildResolvedApprovalView(request, resolved) {
	if (resolveApprovalRequestKind(request) === "plugin") return {
		...buildPluginViewBase(request, "resolved"),
		decision: resolved.decision,
		resolvedBy: resolved.resolvedBy
	};
	return {
		...buildExecViewBase(request, "resolved"),
		decision: resolved.decision,
		resolvedBy: resolved.resolvedBy
	};
}
/** Builds the presentation model shown when an approval can no longer be acted on. */
function buildExpiredApprovalView(request) {
	if (resolveApprovalRequestKind(request) === "plugin") return buildPluginViewBase(request, "expired");
	return buildExecViewBase(request, "expired");
}
//#endregion
//#region src/infra/approval-handler-runtime.ts
function consumeActiveWrappedEntries(activeEntries, requestId, fallbackEntries) {
	const entries = activeEntries.get(requestId)?.entries ?? fallbackEntries;
	activeEntries.delete(requestId);
	return entries;
}
async function finalizeWrappedEntries(params) {
	for (const wrapped of params.entries) try {
		await params.runEntry(wrapped);
	} catch (error) {
		params.log.error(`failed to finalize ${params.phase} native approval entry approval=${params.request.id}: ${String(error)}`);
	}
}
async function unbindWrappedEntries(params) {
	if (!params.nativeRuntime.interactions?.unbindPending) return;
	for (const wrapped of params.entries) {
		if (wrapped.binding === void 0) continue;
		try {
			await params.nativeRuntime.interactions.unbindPending({
				...params.baseContext,
				entry: wrapped.entry,
				binding: wrapped.binding,
				request: params.request,
				approvalKind: params.approvalKind
			});
		} catch (error) {
			params.log.error(`failed to unbind stopped native approval entry approval=${params.request.id}: ${String(error)}`);
		}
	}
}
async function applyApprovalFinalAction(params) {
	switch (params.result.kind) {
		case "update":
			await params.nativeRuntime.transport.updateEntry?.({
				...params.baseContext,
				entry: params.wrapped.entry,
				payload: params.result.payload,
				phase: params.phase
			});
			return;
		case "delete":
			await params.nativeRuntime.transport.deleteEntry?.({
				...params.baseContext,
				entry: params.wrapped.entry,
				phase: params.phase
			});
			return;
		case "clear-actions": await params.nativeRuntime.interactions?.clearPendingActions?.({
			...params.baseContext,
			entry: params.wrapped.entry,
			phase: params.phase
		});
		case "leave":
	}
}
/** Creates the shared approval handler runtime from channel-specific content and transport hooks. */
function createChannelApprovalHandler(adapter) {
	return createChannelNativeApprovalRuntime({
		label: adapter.runtime.label,
		clientDisplayName: adapter.runtime.clientDisplayName,
		cfg: adapter.runtime.cfg,
		gatewayUrl: adapter.runtime.gatewayUrl,
		eventKinds: adapter.runtime.eventKinds,
		channel: adapter.runtime.channel,
		channelLabel: adapter.runtime.channelLabel,
		accountId: adapter.runtime.accountId,
		nativeAdapter: adapter.runtime.nativeAdapter,
		...adapter.runtime.resolveApprovalKind ? { resolveApprovalKind: adapter.runtime.resolveApprovalKind } : {},
		isConfigured: adapter.runtime.isConfigured,
		shouldHandle: adapter.runtime.shouldHandle,
		nowMs: adapter.runtime.nowMs,
		buildPendingContent: adapter.content.buildPendingContent,
		prepareTarget: adapter.transport.prepareTarget,
		deliverTarget: adapter.transport.deliverTarget,
		onDeliveryError: adapter.lifecycle.onDeliveryError,
		onDuplicateSkipped: adapter.lifecycle.onDuplicateSkipped,
		onDelivered: adapter.lifecycle.onDelivered,
		finalizeResolved: adapter.lifecycle.finalizeResolved,
		finalizeExpired: adapter.lifecycle.finalizeExpired,
		onStopped: adapter.lifecycle.onStopped
	});
}
/** Builds a shared approval handler from a plugin approval capability, or null when unsupported. */
async function createChannelApprovalHandlerFromCapability(params) {
	const nativeRuntime = params.capability?.nativeRuntime;
	if (!nativeRuntime) return null;
	const log = require_subsystem.createSubsystemLogger(params.label);
	const activeEntries = /* @__PURE__ */ new Map();
	let stopped = false;
	const resolveApprovalKind = nativeRuntime.resolveApprovalKind ?? resolveApprovalRequestKind;
	const baseContext = {
		cfg: params.cfg,
		accountId: params.accountId,
		gatewayUrl: params.gatewayUrl,
		context: params.context
	};
	return createChannelApprovalHandler({
		runtime: {
			label: params.label,
			clientDisplayName: params.clientDisplayName,
			channel: params.channel,
			channelLabel: params.channelLabel,
			cfg: params.cfg,
			accountId: params.accountId,
			gatewayUrl: params.gatewayUrl,
			eventKinds: nativeRuntime.eventKinds,
			nativeAdapter: params.capability?.native,
			...nativeRuntime.resolveApprovalKind ? { resolveApprovalKind: nativeRuntime.resolveApprovalKind } : {},
			isConfigured: () => nativeRuntime.availability.isConfigured(baseContext),
			shouldHandle: (request) => {
				const approvalKind = resolveApprovalKind(request);
				return nativeRuntime.availability.shouldHandle({
					...baseContext,
					request,
					approvalKind
				});
			},
			nowMs: params.nowMs
		},
		content: { buildPendingContent: async ({ request, approvalKind, nowMs }) => {
			const view = buildPendingApprovalView(request);
			return {
				view,
				payload: await nativeRuntime.presentation.buildPendingPayload({
					...baseContext,
					request,
					approvalKind,
					nowMs,
					view
				})
			};
		} },
		transport: {
			prepareTarget: async ({ plannedTarget, request, approvalKind, pendingContent }) => {
				return await nativeRuntime.transport.prepareTarget({
					...baseContext,
					plannedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
			},
			deliverTarget: async ({ plannedTarget, preparedTarget, request, approvalKind, pendingContent }) => {
				const entry = await nativeRuntime.transport.deliverPending({
					...baseContext,
					plannedTarget,
					preparedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
				if (!entry) return null;
				if (stopped) {
					await nativeRuntime.interactions?.cancelDelivered?.({
						...baseContext,
						entry,
						request,
						approvalKind
					});
					return null;
				}
				const binding = await nativeRuntime.interactions?.bindPending?.({
					...baseContext,
					entry,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
				if (stopped) {
					if (binding !== void 0 && binding !== null) await nativeRuntime.interactions?.unbindPending?.({
						...baseContext,
						entry,
						binding,
						request,
						approvalKind
					});
					else await nativeRuntime.interactions?.cancelDelivered?.({
						...baseContext,
						entry,
						request,
						approvalKind
					});
					return null;
				}
				const wrapped = {
					entry,
					...binding === void 0 || binding === null ? {} : { binding }
				};
				const activeRequest = activeEntries.get(request.id) ?? {
					request,
					approvalKind,
					entries: []
				};
				activeRequest.entries.push(wrapped);
				activeEntries.set(request.id, activeRequest);
				return wrapped;
			}
		},
		lifecycle: {
			onDeliveryError: ({ error, plannedTarget, request, approvalKind, pendingContent }) => {
				nativeRuntime.observe?.onDeliveryError?.({
					...baseContext,
					error,
					plannedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
			},
			onDuplicateSkipped: ({ plannedTarget, preparedTarget, request, approvalKind, pendingContent }) => {
				nativeRuntime.observe?.onDuplicateSkipped?.({
					...baseContext,
					plannedTarget,
					preparedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
			},
			onDelivered: ({ plannedTarget, preparedTarget, request, approvalKind, pendingContent, entry }) => {
				nativeRuntime.observe?.onDelivered?.({
					...baseContext,
					plannedTarget,
					preparedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload,
					entry: entry.entry
				});
			},
			finalizeResolved: async ({ request, resolved, entries }) => {
				const resolvedEntries = consumeActiveWrappedEntries(activeEntries, request.id, entries);
				const approvalKind = resolveApprovalKind(request);
				const view = buildResolvedApprovalView(request, resolved);
				await finalizeWrappedEntries({
					entries: resolvedEntries,
					phase: "resolved",
					request,
					log,
					runEntry: async (wrapped) => {
						if (wrapped.binding !== void 0) await nativeRuntime.interactions?.unbindPending?.({
							...baseContext,
							entry: wrapped.entry,
							binding: wrapped.binding,
							request,
							approvalKind
						});
						const result = await nativeRuntime.presentation.buildResolvedResult({
							...baseContext,
							request,
							resolved,
							view,
							entry: wrapped.entry
						});
						await applyApprovalFinalAction({
							nativeRuntime,
							baseContext,
							wrapped,
							result,
							phase: "resolved"
						});
					}
				});
			},
			finalizeExpired: async ({ request, entries }) => {
				const expiredEntries = consumeActiveWrappedEntries(activeEntries, request.id, entries);
				const approvalKind = resolveApprovalKind(request);
				const view = buildExpiredApprovalView(request);
				await finalizeWrappedEntries({
					entries: expiredEntries,
					phase: "expired",
					request,
					log,
					runEntry: async (wrapped) => {
						if (wrapped.binding !== void 0) await nativeRuntime.interactions?.unbindPending?.({
							...baseContext,
							entry: wrapped.entry,
							binding: wrapped.binding,
							request,
							approvalKind
						});
						const result = await nativeRuntime.presentation.buildExpiredResult({
							...baseContext,
							request,
							view,
							entry: wrapped.entry
						});
						await applyApprovalFinalAction({
							nativeRuntime,
							baseContext,
							wrapped,
							result,
							phase: "expired"
						});
					}
				});
			},
			onStopped: async () => {
				stopped = true;
				if (activeEntries.size === 0) {
					activeEntries.clear();
					return;
				}
				for (const activeRequest of activeEntries.values()) await unbindWrappedEntries({
					entries: activeRequest.entries,
					request: activeRequest.request,
					approvalKind: activeRequest.approvalKind,
					baseContext,
					nativeRuntime,
					log
				});
				activeEntries.clear();
			}
		}
	});
}
//#endregion
//#region src/infra/channel-runtime-context.ts
const NOOP_DISPOSE = () => {};
function resolveScopedRuntimeContextRegistry(params) {
	const runtimeContexts = resolveRuntimeContextRegistry(params);
	if (runtimeContexts && typeof runtimeContexts.register === "function" && typeof runtimeContexts.get === "function" && typeof runtimeContexts.watch === "function") return runtimeContexts;
	throw new Error("channelRuntime must provide runtimeContexts.register/get/watch; pass createPluginRuntime().channel or omit channelRuntime.");
}
function resolveRuntimeContextRegistry(params) {
	return params.channelRuntime?.runtimeContexts ?? null;
}
/** Reads a channel-scoped runtime context from the current runtime registry. */
function getChannelRuntimeContext(params) {
	const runtimeContexts = resolveRuntimeContextRegistry(params);
	if (!runtimeContexts) return;
	return runtimeContexts.get({
		channelId: params.channelId,
		accountId: params.accountId,
		capability: params.capability
	});
}
/** Watches context registration changes for one channel/account/capability key. */
function watchChannelRuntimeContexts(params) {
	const runtimeContexts = resolveRuntimeContextRegistry(params);
	if (!runtimeContexts) return null;
	return runtimeContexts.watch({
		channelId: params.channelId,
		accountId: params.accountId,
		capability: params.capability,
		onEvent: params.onEvent
	});
}
/** Wraps a channel runtime so contexts registered during a task are disposed together. */
function createTaskScopedChannelRuntime(params) {
	const baseRuntime = params.channelRuntime;
	if (!baseRuntime) return {
		channelRuntime: void 0,
		dispose: NOOP_DISPOSE
	};
	const runtimeContexts = resolveScopedRuntimeContextRegistry({ channelRuntime: baseRuntime });
	const trackedLeases = /* @__PURE__ */ new Set();
	const trackLease = (lease) => {
		trackedLeases.add(lease);
		let disposed = false;
		return { dispose: () => {
			if (disposed) return;
			disposed = true;
			trackedLeases.delete(lease);
			lease.dispose();
		} };
	};
	return {
		channelRuntime: {
			...baseRuntime,
			runtimeContexts: {
				...runtimeContexts,
				register: (registerParams) => {
					const lease = runtimeContexts.register(registerParams);
					return trackLease(lease);
				}
			}
		},
		dispose: () => {
			for (const lease of Array.from(trackedLeases)) lease.dispose();
		}
	};
}
//#endregion
//#region src/infra/approval-handler-bootstrap.ts
const APPROVAL_HANDLER_BOOTSTRAP_RETRY_MS = 1e3;
function isRetryableApprovalBootstrapStartError(error) {
	const message = String(error);
	return message.includes("gateway readiness unavailable before approval client start") || message.includes("gateway approval client start aborted before readiness") || message.includes("gateway readiness unavailable before exec approval runtime start") || message.includes("gateway approval runtime start aborted before readiness") || message.includes("gateway event loop readiness timeout") || message.includes("gateway starting") || message.includes("code=1013") || message.includes("close code 1013");
}
function formatRetryableApprovalBootstrapStartError(error) {
	const message = String(error);
	if (message.includes("gateway event loop readiness timeout")) return "gateway readiness unavailable before approval handler start";
	return message;
}
/** Starts the native approval handler for a channel runtime context and returns its cleanup hook. */
async function startChannelApprovalHandlerBootstrap(params) {
	const capability = require_plugins.resolveChannelApprovalCapability(params.plugin);
	if (!capability?.nativeRuntime || !params.channelRuntime) return async () => {};
	const channelLabel = params.plugin.meta.label || params.plugin.id;
	const logger = params.logger ?? require_subsystem.createSubsystemLogger(`${params.plugin.id}/approval-bootstrap`);
	let activeGeneration = 0;
	let activeHandler = null;
	let retryTimer = null;
	const invalidateActiveHandler = () => {
		activeGeneration += 1;
	};
	const clearRetryTimer = () => {
		if (!retryTimer) return;
		clearTimeout(retryTimer);
		retryTimer = null;
	};
	const stopHandler = async () => {
		const handler = activeHandler;
		activeHandler = null;
		if (!handler) return;
		await handler.stop();
	};
	const startHandlerForContext = async (context, generation) => {
		if (generation !== activeGeneration) return;
		await stopHandler();
		if (generation !== activeGeneration) return;
		const handler = await require_approval_gateway_runtime_context.withGatewayNativeApprovalRuntime(params.gatewayRuntime, () => createChannelApprovalHandlerFromCapability({
			capability,
			label: `${params.plugin.id}/native-approvals`,
			clientDisplayName: `${channelLabel} Native Approvals (${params.accountId})`,
			channel: params.plugin.id,
			channelLabel,
			cfg: params.cfg,
			accountId: params.accountId,
			context
		}));
		if (!handler) return;
		if (generation !== activeGeneration) {
			await handler.stop().catch(() => {});
			return;
		}
		activeHandler = handler;
		try {
			await require_approval_gateway_runtime_context.withGatewayNativeApprovalRuntime(params.gatewayRuntime, () => handler.start());
		} catch (error) {
			if (activeHandler === handler) activeHandler = null;
			await handler.stop().catch(() => {});
			throw error;
		}
	};
	const spawn = (label, promise) => {
		promise.catch((error) => {
			logger.error(`${label}: ${String(error)}`);
		});
	};
	const scheduleRetryForContext = (context, generation) => {
		if (generation !== activeGeneration) return;
		clearRetryTimer();
		retryTimer = setTimeout(() => {
			retryTimer = null;
			if (generation !== activeGeneration) return;
			spawn("failed to retry native approval handler", startHandlerForRegisteredContext(context, generation));
		}, APPROVAL_HANDLER_BOOTSTRAP_RETRY_MS);
		retryTimer.unref?.();
	};
	const startHandlerForRegisteredContext = async (context, generation) => {
		try {
			await startHandlerForContext(context, generation);
		} catch (error) {
			if (generation === activeGeneration) {
				if (isExecApprovalChannelRuntimeTerminalStartError(error)) {
					logger.error(`native approval handler disabled: ${String(error)}`);
					return;
				}
				if (isRetryableApprovalBootstrapStartError(error)) {
					logger.warn(`native approval handler deferred until gateway readiness recovers: ${formatRetryableApprovalBootstrapStartError(error)}`);
					scheduleRetryForContext(context, generation);
					return;
				}
				logger.error(`failed to start native approval handler: ${String(error)}`);
				scheduleRetryForContext(context, generation);
			}
		}
	};
	const unsubscribe = watchChannelRuntimeContexts({
		channelRuntime: params.channelRuntime,
		channelId: params.plugin.id,
		accountId: params.accountId,
		capability: "approval.native",
		onEvent: (event) => {
			if (event.type === "registered") {
				clearRetryTimer();
				invalidateActiveHandler();
				const generation = activeGeneration;
				spawn("failed to start native approval handler", startHandlerForRegisteredContext(event.context, generation));
				return;
			}
			clearRetryTimer();
			invalidateActiveHandler();
			spawn("failed to stop native approval handler", stopHandler());
		}
	}) ?? (() => {});
	const existingContext = getChannelRuntimeContext({
		channelRuntime: params.channelRuntime,
		channelId: params.plugin.id,
		accountId: params.accountId,
		capability: CHANNEL_APPROVAL_NATIVE_RUNTIME_CONTEXT_CAPABILITY
	});
	if (existingContext !== void 0) {
		clearRetryTimer();
		invalidateActiveHandler();
		spawn("failed to start native approval handler", startHandlerForRegisteredContext(existingContext, activeGeneration));
	}
	return async () => {
		unsubscribe();
		clearRetryTimer();
		invalidateActiveHandler();
		await stopHandler();
	};
}
//#endregion
//#region src/gateway/server-channels.ts
const RESTART_POLICY = {
	initialMs: 5e3,
	maxMs: 5 * 6e4,
	factor: 2,
	jitter: .1
};
const MAX_RESTARTS = 10;
const CHANNEL_STABLE_RUN_MS = RESTART_POLICY.maxMs;
const CHANNEL_STOP_ABORT_TIMEOUT_MS = 5e3;
const CHANNEL_STARTUP_CONCURRENCY = 4;
function waitForChannelStartupHandoff() {
	return new Promise((resolve) => {
		setImmediate(resolve).unref?.();
	});
}
function sanitizeAbortedTaskStatusPatch(patch, current) {
	const next = { ...patch };
	delete next.running;
	delete next.restartPending;
	delete next.reconnectAttempts;
	delete next.lastStartAt;
	delete next.lastStopAt;
	if (next.connected === true) {
		delete next.connected;
		delete next.lastConnectedAt;
		delete next.lastEventAt;
		delete next.lastTransportActivityAt;
	}
	if (next.lastError === null && current.lastError) delete next.lastError;
	return next;
}
function createRuntimeStore() {
	return {
		aborts: /* @__PURE__ */ new Map(),
		starting: /* @__PURE__ */ new Map(),
		tasks: /* @__PURE__ */ new Map(),
		runtimes: /* @__PURE__ */ new Map()
	};
}
function resolveDefaultRuntime(channelId) {
	return require_registry.getChannelPlugin(channelId)?.status?.defaultRuntime ?? { accountId: "default" };
}
function cloneDefaultRuntime(channelId, accountId) {
	return {
		...resolveDefaultRuntime(channelId),
		accountId
	};
}
async function waitForChannelStopGracefully(task, timeoutMs) {
	if (!task) return true;
	return await new Promise((resolve) => {
		let settled = false;
		const timer = setTimeout(() => {
			if (!settled) {
				settled = true;
				resolve(false);
			}
		}, timeoutMs);
		timer.unref?.();
		const resolveSettled = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(true);
		};
		task.then(resolveSettled, resolveSettled);
	});
}
function applyDescribedAccountFields(next, described) {
	if (!described) {
		next.configured ??= true;
		return next;
	}
	if (typeof described.configured === "boolean") next.configured = described.configured;
	else next.configured ??= true;
	if (described.mode !== void 0) next.mode = described.mode;
	return next;
}
async function waitForDeferredAccountStart(deferred, abortSignal) {
	if (abortSignal.aborted) return;
	await Promise.race([deferred, new Promise((resolve) => {
		abortSignal.addEventListener("abort", () => resolve(), { once: true });
	})]);
}
function createChannelManager(opts) {
	const { getRuntimeConfig, channelLogs, channelRuntimeEnvs, channelRuntime, resolveChannelRuntime, getPluginHttpRouteRegistry, startupTrace } = opts;
	const channelStores = /* @__PURE__ */ new Map();
	const restarts = /* @__PURE__ */ new Map();
	const manuallyStopped = /* @__PURE__ */ new Set();
	const recoveryStopTimedOut = /* @__PURE__ */ new Set();
	const recoveryStartRequested = /* @__PURE__ */ new Set();
	let autostartSuppression = null;
	const restartKey = (channelId, accountId) => `${channelId}:${accountId}`;
	const ensureChannelLog = (channelId) => {
		channelLogs[channelId] ??= require_subsystem.createSubsystemLogger("channels").child(channelId);
		return channelLogs[channelId];
	};
	const ensureChannelRuntime = (channelId) => {
		channelRuntimeEnvs[channelId] ??= require_subsystem.runtimeForLogger(ensureChannelLog(channelId));
		return channelRuntimeEnvs[channelId];
	};
	const resolveAccountHealthMonitorOverride = (channelConfig, accountId) => {
		if (!channelConfig?.accounts) return;
		const direct = require_account_lookup.resolveAccountEntry(channelConfig.accounts, accountId);
		if (typeof direct?.healthMonitor?.enabled === "boolean") return direct.healthMonitor.enabled;
		const normalizedAccountId = require_account_id.normalizeOptionalAccountId(accountId);
		if (!normalizedAccountId) return;
		const match = require_account_lookup.resolveNormalizedAccountEntry(channelConfig.accounts, normalizedAccountId, require_account_id.normalizeAccountId);
		if (typeof match?.healthMonitor?.enabled !== "boolean") return;
		return match.healthMonitor.enabled;
	};
	const isHealthMonitorEnabled = (channelId, accountId) => {
		const cfg = getRuntimeConfig();
		const channelConfig = cfg.channels?.[channelId];
		const accountOverride = resolveAccountHealthMonitorOverride(channelConfig, accountId);
		const channelOverride = channelConfig?.healthMonitor?.enabled;
		if (typeof accountOverride === "boolean") return accountOverride;
		if (typeof channelOverride === "boolean") return channelOverride;
		const plugin = require_registry.getChannelPlugin(channelId);
		if (!plugin) return true;
		try {
			plugin.config.resolveAccount(cfg, accountId);
		} catch (err) {
			ensureChannelLog(channelId).warn?.(`[${channelId}:${accountId}] health-monitor: failed to resolve account; skipping monitor (${require_errors.formatErrorMessage(err)})`);
			return false;
		}
		return true;
	};
	const getStore = (channelId) => {
		const existing = channelStores.get(channelId);
		if (existing) return existing;
		const next = createRuntimeStore();
		channelStores.set(channelId, next);
		return next;
	};
	const getRuntime = (channelId, accountId) => {
		return getStore(channelId).runtimes.get(accountId) ?? cloneDefaultRuntime(channelId, accountId);
	};
	const setRuntime = (channelId, accountId, patch) => {
		const store = getStore(channelId);
		const next = {
			...getRuntime(channelId, accountId),
			...patch,
			accountId
		};
		store.runtimes.set(accountId, next);
		return next;
	};
	const setRuntimeFromTaskStatus = (channelId, accountId, patch, abortSignal) => {
		const safePatch = abortSignal?.aborted ? sanitizeAbortedTaskStatusPatch(patch, getRuntime(channelId, accountId)) : patch;
		return setRuntime(channelId, accountId, safePatch);
	};
	const setStoppedRuntime = (channelId, accountId, patch = {}) => {
		const current = getRuntime(channelId, accountId);
		return setRuntime(channelId, accountId, {
			accountId,
			running: false,
			...typeof current.connected === "boolean" ? { connected: false } : {},
			...patch
		});
	};
	const getChannelRuntime = async () => {
		if (channelRuntime) return channelRuntime;
		return await resolveChannelRuntime?.();
	};
	const measureStartup = async (name, run) => {
		return startupTrace ? startupTrace.measure(name, run) : await run();
	};
	const evictStaleChannelAccountState = (channelId, store, accountIds) => {
		const activeAccountIds = new Set(accountIds);
		for (const id of store.runtimes.keys()) {
			if (activeAccountIds.has(id) || store.aborts.has(id) || store.starting.has(id) || store.tasks.has(id)) continue;
			store.runtimes.delete(id);
			restarts.delete(restartKey(channelId, id));
			manuallyStopped.delete(restartKey(channelId, id));
			recoveryStartRequested.delete(restartKey(channelId, id));
		}
	};
	const startChannelInternal = async (channelId, accountId, optsValue = {}) => {
		const plugin = require_registry.getChannelPlugin(channelId);
		const startAccount = plugin?.gateway?.startAccount;
		if (!startAccount) return;
		const { preserveRestartAttempts = false, preserveManualStop = false } = optsValue;
		const cfg = getRuntimeConfig();
		require_target_resolver.resetDirectoryCache({
			channel: channelId,
			accountId
		});
		const store = getStore(channelId);
		const accountIds = accountId ? [accountId] : await measureStartup(`channels.${channelId}.list-accounts`, () => plugin.config.listAccountIds(cfg));
		if (!accountId) evictStaleChannelAccountState(channelId, store, accountIds);
		if (accountIds.length === 0) return;
		if (autostartSuppression && optsValue.manual !== true) {
			const suffix = accountId ? ` account ${accountId}` : "";
			ensureChannelLog(channelId).warn?.(`channel autostart suppressed by crash-loop breaker; refusing automatic start for ${channelId}${suffix}. Use channels.start to override.`);
			for (const id of accountIds) setStoppedRuntime(channelId, id, {
				restartPending: false,
				lastError: autostartSuppression.message
			});
			return;
		}
		const startup = await require_resolve.runTasksWithConcurrency({
			limit: CHANNEL_STARTUP_CONCURRENCY,
			tasks: accountIds.map((id) => async () => {
				const rKey = restartKey(channelId, id);
				if (store.tasks.has(id)) {
					let clearedTimedOutRecoveryTask = false;
					if (recoveryStopTimedOut.has(rKey)) {
						if (!preserveManualStop) manuallyStopped.delete(rKey);
						if (manuallyStopped.has(rKey)) return;
						if (recoveryStartRequested.has(rKey)) {
							recoveryStopTimedOut.delete(rKey);
							recoveryStartRequested.delete(rKey);
							restarts.delete(rKey);
							store.aborts.delete(id);
							store.tasks.delete(id);
							clearedTimedOutRecoveryTask = true;
							setRuntime(channelId, id, {
								accountId: id,
								restartPending: false,
								reconnectAttempts: 0
							});
						} else {
							recoveryStartRequested.add(rKey);
							setRuntime(channelId, id, {
								accountId: id,
								restartPending: true
							});
							return;
						}
					}
					if (!clearedTimedOutRecoveryTask) return;
				}
				const existingStart = store.starting.get(id);
				if (existingStart) {
					await existingStart;
					return;
				}
				let resolveStart;
				const startGate = new Promise((resolve) => {
					resolveStart = resolve;
				});
				store.starting.set(id, startGate);
				const abort = new AbortController();
				store.aborts.set(id, abort);
				let handedOffTask = false;
				const log = ensureChannelLog(channelId);
				const runtime = ensureChannelRuntime(channelId);
				let scopedChannelRuntime = null;
				let channelRuntimeForTask;
				let stopApprovalBootstrap = async () => {};
				const stopTaskScopedApprovalRuntime = async () => {
					const scopedRuntime = scopedChannelRuntime;
					scopedChannelRuntime = null;
					const stopBootstrap = stopApprovalBootstrap;
					stopApprovalBootstrap = async () => {};
					scopedRuntime?.dispose();
					await stopBootstrap();
				};
				const cleanupTaskScopedApprovalRuntime = async (label) => {
					try {
						await stopTaskScopedApprovalRuntime();
					} catch (error) {
						log.error?.(`[${id}] ${label}: ${require_errors.formatErrorMessage(error)}`);
					}
				};
				try {
					const account = plugin.config.resolveAccount(cfg, id);
					if (!(plugin.config.isEnabled ? plugin.config.isEnabled(account, cfg) : require_account_enabled.isAccountEnabled(account))) {
						setRuntime(channelId, id, {
							accountId: id,
							enabled: false,
							configured: true,
							running: false,
							restartPending: false,
							lastError: plugin.config.disabledReason?.(account, cfg) ?? "disabled"
						});
						return;
					}
					let configured = true;
					if (plugin.config.isConfigured) configured = await measureStartup(`channels.${channelId}.is-configured`, () => plugin.config.isConfigured(account, cfg));
					if (!configured) {
						setRuntime(channelId, id, {
							accountId: id,
							enabled: true,
							configured: false,
							running: false,
							restartPending: false,
							lastError: plugin.config.unconfiguredReason?.(account, cfg) ?? "not configured"
						});
						return;
					}
					if (!preserveManualStop) manuallyStopped.delete(rKey);
					if (abort.signal.aborted || manuallyStopped.has(rKey)) {
						setStoppedRuntime(channelId, id, {
							restartPending: false,
							lastStopAt: Date.now()
						});
						return;
					}
					scopedChannelRuntime = await measureStartup(`channels.${channelId}.runtime`, async () => createTaskScopedChannelRuntime({ channelRuntime: await getChannelRuntime() }));
					channelRuntimeForTask = scopedChannelRuntime.channelRuntime;
					if (!preserveRestartAttempts) restarts.delete(rKey);
					try {
						stopApprovalBootstrap = await measureStartup(`channels.${channelId}.approval-bootstrap`, () => startChannelApprovalHandlerBootstrap({
							plugin,
							cfg,
							accountId: id,
							channelRuntime: channelRuntimeForTask,
							gatewayRuntime: opts.getNativeApprovalRuntime?.(),
							logger: log
						}));
					} catch (error) {
						log.error?.(`[${id}] native approval bootstrap failed: ${require_errors.formatErrorMessage(error)}`);
					}
					let channelRunDurationMs;
					setRuntime(channelId, id, {
						accountId: id,
						enabled: true,
						configured: true,
						running: true,
						restartPending: false,
						lastStartAt: Date.now(),
						lastError: null,
						reconnectAttempts: preserveRestartAttempts ? restarts.get(rKey)?.attempts ?? 0 : 0
					});
					const trackedPromise = Promise.resolve().then(async () => {
						if (optsValue.deferAccountStartUntil) await waitForDeferredAccountStart(optsValue.deferAccountStartUntil, abort.signal);
						else if (startupTrace) await waitForChannelStartupHandoff();
						if (abort.signal.aborted || manuallyStopped.has(rKey)) return;
						let startAccountTask;
						await measureStartup(`channels.${channelId}.start-account-handoff`, () => {
							if (abort.signal.aborted || manuallyStopped.has(rKey)) return;
							const runStartAccount = () => {
								const startedAt = Date.now();
								const recordDuration = () => {
									channelRunDurationMs = Date.now() - startedAt;
								};
								try {
									return require_approval_gateway_runtime_context.withGatewayNativeApprovalRuntime(opts.getNativeApprovalRuntime?.(), () => startAccount({
										cfg,
										accountId: id,
										account,
										runtime,
										abortSignal: abort.signal,
										log,
										getStatus: () => getRuntime(channelId, id),
										setStatus: (next) => isCurrentTask() ? setRuntimeFromTaskStatus(channelId, id, next, abort.signal) : getRuntime(channelId, id),
										...channelRuntimeForTask ? { channelRuntime: channelRuntimeForTask } : {}
									})).finally(recordDuration);
								} catch (error) {
									recordDuration();
									throw error;
								}
							};
							const routeRegistry = getPluginHttpRouteRegistry?.();
							startAccountTask = routeRegistry ? require_http_registry.withPluginHttpRouteRegistry(routeRegistry, runStartAccount) : runStartAccount();
						});
						if (!startAccountTask) return;
						await startAccountTask;
					}).then(() => {
						if (abort.signal.aborted || manuallyStopped.has(rKey) || !isCurrentTask()) return;
						const message = "channel exited without an error";
						setRuntime(channelId, id, {
							accountId: id,
							lastError: message
						});
						log.error?.(`[${id}] ${message}`);
					}).catch((err) => {
						if (!isCurrentTask()) return;
						const message = require_errors.formatErrorMessage(err);
						setRuntime(channelId, id, {
							accountId: id,
							lastError: message
						});
						log.error?.(`[${id}] channel exited: ${message}`);
					}).then(async () => {
						await cleanupTaskScopedApprovalRuntime("channel cleanup failed");
						if (!isCurrentTask()) return;
						setStoppedRuntime(channelId, id, { lastStopAt: Date.now() });
					}).then(async () => {
						if (!isCurrentTask()) return;
						if (manuallyStopped.has(rKey)) {
							recoveryStopTimedOut.delete(rKey);
							recoveryStartRequested.delete(rKey);
							return;
						}
						if (getRuntime(channelId, id).terminalDisconnect) {
							recoveryStopTimedOut.delete(rKey);
							recoveryStartRequested.delete(rKey);
							restarts.delete(rKey);
							setRuntime(channelId, id, {
								accountId: id,
								restartPending: false,
								reconnectAttempts: 0
							});
							log.info?.(`[${id}] auto-restart skipped, terminal disconnect`);
							return;
						}
						if (recoveryStopTimedOut.has(rKey)) {
							recoveryStopTimedOut.delete(rKey);
							if (!recoveryStartRequested.delete(rKey)) {
								setRuntime(channelId, id, {
									accountId: id,
									restartPending: false,
									reconnectAttempts: 0
								});
								if (store.tasks.get(id) === trackedPromise) store.tasks.delete(id);
								if (store.aborts.get(id) === abort) store.aborts.delete(id);
								return;
							}
							restarts.delete(rKey);
							log.info?.(`[${id}] restarting after timed-out channel stop completed`);
							setRuntime(channelId, id, {
								accountId: id,
								restartPending: true,
								reconnectAttempts: 0
							});
							if (store.tasks.get(id) === trackedPromise) store.tasks.delete(id);
							if (store.aborts.get(id) === abort) store.aborts.delete(id);
							try {
								await startChannelInternal(channelId, id, { preserveManualStop: true });
							} catch {}
							return;
						}
						if (channelRunDurationMs !== void 0 && channelRunDurationMs >= CHANNEL_STABLE_RUN_MS) restarts.delete(rKey);
						const restart = restarts.get(rKey) ?? new require_src.RetrySupervisor(RESTART_POLICY, MAX_RESTARTS);
						restarts.set(rKey, restart);
						const retry = restart.next(abort.signal);
						if (!retry) {
							setRuntime(channelId, id, {
								accountId: id,
								restartPending: false,
								reconnectAttempts: restart.attempts
							});
							log.error?.(`[${id}] giving up after ${MAX_RESTARTS} restart attempts`);
							return;
						}
						log.info?.(`[${id}] auto-restart attempt ${restart.attempts}/${MAX_RESTARTS} in ${Math.round(retry.delayMs / 1e3)}s`);
						setRuntime(channelId, id, {
							accountId: id,
							restartPending: true,
							reconnectAttempts: restart.attempts
						});
						try {
							await require_src.sleepWithAbort(retry.delayMs, retry.signal);
							if (manuallyStopped.has(rKey)) return;
							if (store.tasks.get(id) === trackedPromise) store.tasks.delete(id);
							if (store.aborts.get(id) === abort) store.aborts.delete(id);
							await startChannelInternal(channelId, id, {
								preserveRestartAttempts: true,
								preserveManualStop: true
							});
						} catch {}
					}).finally(() => {
						if (store.tasks.get(id) === trackedPromise) store.tasks.delete(id);
						if (store.aborts.get(id) === abort) store.aborts.delete(id);
					});
					function isCurrentTask() {
						return store.tasks.get(id) === trackedPromise;
					}
					handedOffTask = true;
					store.tasks.set(id, trackedPromise);
				} catch (error) {
					if (!handedOffTask) setStoppedRuntime(channelId, id, {
						restartPending: false,
						lastError: require_errors.formatErrorMessage(error)
					});
					throw error;
				} finally {
					resolveStart?.();
					if (store.starting.get(id) === startGate) store.starting.delete(id);
					if (!handedOffTask) await cleanupTaskScopedApprovalRuntime("channel startup cleanup failed");
					if (!handedOffTask && store.aborts.get(id) === abort) store.aborts.delete(id);
				}
			})
		});
		if (startup.hasError) throw startup.firstError;
	};
	const startChannel = async (channelId, accountId, optsValue = {}) => {
		await startChannelInternal(channelId, accountId, optsValue);
	};
	const stopChannel = async (channelId, accountId, optsLocal = {}) => {
		const manual = optsLocal.manual ?? true;
		const plugin = require_registry.getChannelPlugin(channelId);
		const store = getStore(channelId);
		const lifecycleIds = /* @__PURE__ */ new Set([
			...store.aborts.keys(),
			...store.starting.keys(),
			...store.tasks.keys()
		]);
		if (!accountId && lifecycleIds.size === 0) return;
		if (!plugin?.gateway?.stopAccount && lifecycleIds.size === 0) return;
		const cfg = getRuntimeConfig();
		const knownIds = /* @__PURE__ */ new Set([...lifecycleIds, ...plugin ? plugin.config.listAccountIds(cfg) : []]);
		if (accountId) {
			knownIds.clear();
			knownIds.add(accountId);
		}
		await Promise.all(Array.from(knownIds.values()).map(async (id) => {
			const abort = store.aborts.get(id);
			const task = store.tasks.get(id);
			if (!abort && !task && !plugin?.gateway?.stopAccount) return;
			const rKey = restartKey(channelId, id);
			if (manual) manuallyStopped.add(rKey);
			abort?.abort();
			const log = ensureChannelLog(channelId);
			const runtime = ensureChannelRuntime(channelId);
			if (plugin?.gateway?.stopAccount) {
				const account = plugin.config.resolveAccount(cfg, id);
				await plugin.gateway.stopAccount({
					cfg,
					accountId: id,
					account,
					runtime,
					abortSignal: abort?.signal ?? new AbortController().signal,
					log,
					getStatus: () => getRuntime(channelId, id),
					setStatus: (next) => setRuntime(channelId, id, next)
				});
			}
			if (!await waitForChannelStopGracefully(task, CHANNEL_STOP_ABORT_TIMEOUT_MS)) {
				log.warn?.(`[${id}] channel stop exceeded ${CHANNEL_STOP_ABORT_TIMEOUT_MS}ms after abort; continuing shutdown`);
				const stoppedPatch = {
					restartPending: !manual,
					lastError: `channel stop timed out after ${CHANNEL_STOP_ABORT_TIMEOUT_MS}ms`
				};
				if (manual) setRuntime(channelId, id, {
					accountId: id,
					running: true,
					...stoppedPatch
				});
				else setStoppedRuntime(channelId, id, stoppedPatch);
				if (!manual) recoveryStopTimedOut.add(rKey);
				return;
			}
			recoveryStopTimedOut.delete(rKey);
			recoveryStartRequested.delete(rKey);
			store.aborts.delete(id);
			store.tasks.delete(id);
			setStoppedRuntime(channelId, id, {
				restartPending: false,
				lastStopAt: Date.now()
			});
		}));
	};
	const startChannels = async () => {
		let releaseAccountStarts;
		const deferAccountStartUntil = opts.deferStartupAccountStartsUntil ?? (startupTrace ? new Promise((resolve) => {
			releaseAccountStarts = () => {
				setImmediate(resolve).unref?.();
			};
		}) : void 0);
		try {
			await require_resolve.runTasksWithConcurrency({
				limit: CHANNEL_STARTUP_CONCURRENCY,
				tasks: [...require_registry.listChannelPlugins()].map((plugin) => async () => {
					try {
						await measureStartup(`channels.${plugin.id}.start`, () => startChannelInternal(plugin.id, void 0, deferAccountStartUntil ? { deferAccountStartUntil } : {}));
					} catch (err) {
						ensureChannelLog(plugin.id).error?.(`[${plugin.id}] channel startup failed: ${require_errors.formatErrorMessage(err)}`);
					}
				})
			});
		} finally {
			releaseAccountStarts?.();
		}
	};
	const markChannelLoggedOut = (channelId, cleared, accountId) => {
		const plugin = require_registry.getChannelPlugin(channelId);
		if (!plugin) return;
		const cfg = getRuntimeConfig();
		const resolvedId = accountId ?? require_helpers.resolveChannelDefaultAccountId({
			plugin,
			cfg
		});
		const current = getRuntime(channelId, resolvedId);
		const next = {
			accountId: resolvedId,
			running: false,
			restartPending: false,
			lastError: cleared ? "logged out" : current.lastError
		};
		if (typeof current.connected === "boolean") next.connected = false;
		setRuntime(channelId, resolvedId, next);
	};
	const getRuntimeSnapshot = () => {
		const cfg = getRuntimeConfig();
		const channels = {};
		const channelAccounts = {};
		for (const plugin of require_registry.listChannelPlugins()) {
			const store = getStore(plugin.id);
			const accountIds = plugin.config.listAccountIds(cfg);
			const defaultAccountId = require_helpers.resolveChannelDefaultAccountId({
				plugin,
				cfg,
				accountIds
			});
			const accounts = {};
			for (const id of accountIds) {
				const account = plugin.config.resolveAccount(cfg, id);
				const enabled = plugin.config.isEnabled ? plugin.config.isEnabled(account, cfg) : require_account_enabled.isAccountEnabled(account);
				const described = plugin.config.describeAccount?.(account, cfg);
				const next = {
					...store.runtimes.get(id) ?? cloneDefaultRuntime(plugin.id, id),
					accountId: id
				};
				next.enabled = enabled;
				applyDescribedAccountFields(next, described);
				const configured = described?.configured;
				if (!next.running) {
					if (!enabled) next.lastError ??= plugin.config.disabledReason?.(account, cfg) ?? "disabled";
					else if (configured === false) next.lastError ??= plugin.config.unconfiguredReason?.(account, cfg) ?? "not configured";
				}
				accounts[id] = next;
			}
			const defaultAccount = accounts[defaultAccountId] ?? cloneDefaultRuntime(plugin.id, defaultAccountId);
			channels[plugin.id] = defaultAccount;
			channelAccounts[plugin.id] = accounts;
		}
		return {
			channels,
			channelAccounts
		};
	};
	const isManuallyStoppedFlag = (channelId, accountId) => {
		return manuallyStopped.has(restartKey(channelId, accountId));
	};
	const resetRestartAttemptsForTest = (channelId, accountId) => {
		restarts.delete(restartKey(channelId, accountId));
	};
	return {
		getRuntimeSnapshot,
		startChannels,
		startChannel,
		stopChannel,
		setAutostartSuppression: (suppression) => {
			autostartSuppression = suppression;
		},
		getAutostartSuppression: () => autostartSuppression,
		markChannelLoggedOut,
		isManuallyStopped: isManuallyStoppedFlag,
		resetRestartAttempts: resetRestartAttemptsForTest,
		isHealthMonitorEnabled
	};
}
//#endregion
exports.createChannelManager = createChannelManager;
