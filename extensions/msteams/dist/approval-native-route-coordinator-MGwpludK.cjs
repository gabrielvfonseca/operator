const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_human_list = require("./human-list-DQq9aDxT.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/approval-native-route-notice.ts
/** Formats the human destination label for where native approval prompts were delivered. */
function describeApprovalDeliveryDestination(params) {
	const surfaces = new Set(params.deliveredTargets.map((target) => target.surface));
	return surfaces.size === 1 && surfaces.has("approver-dm") ? `${params.channelLabel} DMs` : params.channelLabel;
}
/** Builds the notice shown in the current chat when approval was routed elsewhere. */
function resolveApprovalRoutedElsewhereNoticeText(destinations) {
	const uniqueDestinations = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(destinations.map((value) => value.trim())).filter(Boolean);
	if (uniqueDestinations.length === 0) return null;
	return `Approval required. I sent the approval request to ${require_human_list.formatHumanList(uniqueDestinations)}, not this chat.`;
}
/** Builds the fallback slash-command notice when native approval delivery fails. */
function resolveApprovalDeliveryFailedNoticeText(params) {
	return [
		"Approval required. I could not deliver the native approval request.",
		`Reply with: /approve ${params.approvalKind === "exec" && params.approvalId.length > 8 ? params.approvalId.slice(0, 8) : params.approvalId} ${(params.allowedDecisions?.length ? params.allowedDecisions : [
			"allow-once",
			"allow-always",
			"deny"
		]).join("|")}`,
		"If the short code is ambiguous, use the full id in /approve."
	].join("\n");
}
//#endregion
//#region src/infra/approval-native-target-key.ts
/** Builds the stable dedupe key used to compare channel-native approval targets. */
function buildChannelApprovalNativeTargetKey(target) {
	return require_channel_route.channelRouteDedupeKey({
		to: target.to,
		threadId: target.threadId
	});
}
//#endregion
//#region src/infra/approval-native-route-coordinator.ts
function createApprovalNativeRouteCoordinatorState() {
	return {
		activeRuntimes: /* @__PURE__ */ new Map(),
		pendingNotices: /* @__PURE__ */ new Map(),
		runtimeSeq: 0,
		closed: false
	};
}
const defaultCoordinatorState = createApprovalNativeRouteCoordinatorState();
const MAX_APPROVAL_ROUTE_NOTICE_TTL_MS = 5 * 6e4;
function normalizeChannel(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
}
function clearPendingApprovalRouteNotice(state, approvalId) {
	const entry = state.pendingNotices.get(approvalId);
	if (!entry) return;
	state.pendingNotices.delete(approvalId);
	if (entry.cleanupTimeout) clearTimeout(entry.cleanupTimeout);
}
function createPendingApprovalRouteNotice(state, params) {
	const timeoutMs = Math.min(Math.max(0, params.request.expiresAtMs - Date.now()), MAX_APPROVAL_ROUTE_NOTICE_TTL_MS);
	const cleanupTimeout = setTimeout(() => {
		clearPendingApprovalRouteNotice(state, params.request.id);
	}, timeoutMs);
	cleanupTimeout.unref?.();
	return {
		request: params.request,
		approvalKind: params.approvalKind,
		expectedRuntimeIds: new Set(params.expectedRuntimeIds ?? []),
		reports: /* @__PURE__ */ new Map(),
		cleanupTimeout,
		finalized: false
	};
}
function resolveRouteNoticeTargetFromRequest(request) {
	const channel = request.request.turnSourceChannel?.trim();
	const to = request.request.turnSourceTo?.trim();
	if (!channel || !to) return null;
	return {
		channel,
		to,
		accountId: request.request.turnSourceAccountId ?? void 0,
		threadId: request.request.turnSourceThreadId ?? void 0
	};
}
function resolveFallbackRouteNoticeTarget(report) {
	const channel = report.channel?.trim();
	const to = report.deliveryPlan.originTarget?.to?.trim();
	if (!channel || !to) return null;
	return {
		channel,
		to,
		accountId: report.accountId ?? void 0,
		threadId: report.deliveryPlan.originTarget?.threadId ?? void 0
	};
}
function didReportDeliverToOrigin(report, originAccountId) {
	const originTarget = report.deliveryPlan.originTarget;
	if (!originTarget) return false;
	const reportAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(report.accountId);
	if (originAccountId !== void 0 && reportAccountId !== void 0 && reportAccountId !== originAccountId) return false;
	const originKey = buildChannelApprovalNativeTargetKey(originTarget);
	return report.deliveredTargets.some((plannedTarget) => buildChannelApprovalNativeTargetKey(plannedTarget.target) === originKey);
}
function hasPlannedNativeTargets(report) {
	return report.deliveryPlan.targets.length > 0;
}
function readAllowedDecisionStrings(request) {
	const allowedDecisions = "allowedDecisions" in request.request ? request.request.allowedDecisions : void 0;
	if (!Array.isArray(allowedDecisions)) return;
	return allowedDecisions.filter((value) => typeof value === "string");
}
function resolveApprovalRouteNotice(params) {
	const explicitTarget = resolveRouteNoticeTargetFromRequest(params.request);
	const originChannel = normalizeChannel(explicitTarget?.channel ?? params.request.request.turnSourceChannel);
	const fallbackTarget = params.reports.filter((report) => normalizeChannel(report.channel) === originChannel || !originChannel).map(resolveFallbackRouteNoticeTarget).find((target) => target !== null) ?? null;
	const target = explicitTarget ? {
		...fallbackTarget,
		...explicitTarget,
		accountId: explicitTarget.accountId ?? fallbackTarget?.accountId,
		threadId: explicitTarget.threadId ?? fallbackTarget?.threadId
	} : fallbackTarget;
	if (!target) return null;
	const originAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.accountId);
	if (!params.reports.some((report) => report.deliveredTargets.length > 0) && params.reports.some(hasPlannedNativeTargets)) return {
		requestGateway: params.reports.find((report) => params.state.activeRuntimes.has(report.runtimeId))?.requestGateway ?? (0, _gabrielvfonseca_normalization_core.expectDefined)(params.reports[0], "reports entry at 0").requestGateway,
		target,
		text: resolveApprovalDeliveryFailedNoticeText({
			approvalId: params.request.id,
			approvalKind: params.approvalKind,
			allowedDecisions: readAllowedDecisionStrings(params.request)
		})
	};
	if (params.reports.some((report) => {
		if (originChannel && normalizeChannel(report.channel) !== originChannel) return false;
		return didReportDeliverToOrigin(report, originAccountId);
	})) return null;
	const text = resolveApprovalRoutedElsewhereNoticeText(params.reports.flatMap((report) => {
		if (!report.channelLabel || report.deliveredTargets.length === 0) return [];
		const reportChannel = normalizeChannel(report.channel);
		if (originChannel && reportChannel === originChannel && !report.deliveryPlan.notifyOriginWhenDmOnly) return [];
		const reportAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(report.accountId);
		if (originChannel && reportChannel === originChannel && originAccountId !== void 0 && reportAccountId !== void 0 && reportAccountId !== originAccountId) return [];
		return [describeApprovalDeliveryDestination({
			channelLabel: report.channelLabel,
			deliveredTargets: report.deliveredTargets
		})];
	}));
	if (!text) return null;
	const requestGateway = params.reports.find((report) => params.state.activeRuntimes.has(report.runtimeId))?.requestGateway ?? params.reports[0]?.requestGateway;
	if (!requestGateway) return null;
	return {
		requestGateway,
		target,
		text
	};
}
/** Returns whether a native approval runtime is active for the requested channel/account scope. */
function hasActiveApprovalNativeRouteRuntime(params) {
	return hasActiveApprovalNativeRouteRuntimeForState(defaultCoordinatorState, params);
}
function hasActiveApprovalNativeRouteRuntimeForState(state, params) {
	const channel = normalizeChannel(params.channel);
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId);
	return Array.from(state.activeRuntimes.values()).some((runtime) => {
		if (!runtime.handledKinds.has(params.approvalKind)) return false;
		if (channel && normalizeChannel(runtime.channel) !== channel) return false;
		const runtimeAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(runtime.accountId);
		return accountId === void 0 || runtimeAccountId === void 0 || runtimeAccountId === accountId;
	});
}
async function maybeFinalizeApprovalRouteNotice(state, approvalId) {
	const entry = state.pendingNotices.get(approvalId);
	if (!entry || entry.finalized) return;
	for (const runtimeId of entry.expectedRuntimeIds) if (!entry.reports.has(runtimeId)) return;
	entry.finalized = true;
	const reports = Array.from(entry.reports.values());
	const notice = resolveApprovalRouteNotice({
		state,
		approvalKind: entry.approvalKind,
		request: entry.request,
		reports
	});
	clearPendingApprovalRouteNotice(state, approvalId);
	if (!notice) return;
	try {
		await notice.requestGateway("send", {
			channel: notice.target.channel,
			to: notice.target.to,
			accountId: notice.target.accountId ?? void 0,
			threadId: notice.target.threadId ?? void 0,
			message: notice.text,
			idempotencyKey: `approval-route-notice:${approvalId}`
		});
	} catch {}
}
/** Tracks native approval deliveries and sends origin-chat notices after all observed runtimes report. */
function createApprovalNativeRouteReporter(params) {
	return createApprovalNativeRouteReporterForState(defaultCoordinatorState, params);
}
function createApprovalNativeRouteReporterForState(state, params) {
	const runtimeId = `native-approval-route:${++state.runtimeSeq}`;
	let registered = false;
	const report = async (payload) => {
		if (state.closed || !registered || !params.handledKinds.has(payload.approvalKind)) return;
		const entry = state.pendingNotices.get(payload.request.id) ?? createPendingApprovalRouteNotice(state, {
			request: payload.request,
			approvalKind: payload.approvalKind,
			expectedRuntimeIds: [runtimeId]
		});
		entry.expectedRuntimeIds.add(runtimeId);
		entry.reports.set(runtimeId, {
			runtimeId,
			request: payload.request,
			channel: params.channel,
			channelLabel: params.channelLabel,
			accountId: params.accountId,
			deliveryPlan: payload.deliveryPlan,
			deliveredTargets: payload.deliveredTargets,
			requestGateway: params.requestGateway
		});
		state.pendingNotices.set(payload.request.id, entry);
		await maybeFinalizeApprovalRouteNotice(state, payload.request.id);
	};
	return {
		observeRequest(payload) {
			if (state.closed || !registered || !params.handledKinds.has(payload.approvalKind)) return;
			const entry = state.pendingNotices.get(payload.request.id) ?? createPendingApprovalRouteNotice(state, {
				request: payload.request,
				approvalKind: payload.approvalKind,
				expectedRuntimeIds: Array.from(state.activeRuntimes.values()).filter((runtime) => runtime.handledKinds.has(payload.approvalKind)).map((runtime) => runtime.runtimeId)
			});
			entry.expectedRuntimeIds.add(runtimeId);
			state.pendingNotices.set(payload.request.id, entry);
		},
		start() {
			if (state.closed || registered) return;
			state.activeRuntimes.set(runtimeId, {
				runtimeId,
				handledKinds: params.handledKinds,
				channel: params.channel,
				channelLabel: params.channelLabel,
				accountId: params.accountId,
				requestGateway: params.requestGateway
			});
			registered = true;
		},
		async reportSkipped(paramsValue) {
			await report({
				approvalKind: paramsValue.approvalKind,
				request: paramsValue.request,
				deliveryPlan: {
					targets: [],
					originTarget: null,
					notifyOriginWhenDmOnly: false
				},
				deliveredTargets: []
			});
		},
		async reportDelivery(paramsLocal) {
			await report(paramsLocal);
		},
		async stop() {
			if (!registered) return;
			registered = false;
			state.activeRuntimes.delete(runtimeId);
			for (const entry of state.pendingNotices.values()) {
				entry.expectedRuntimeIds.delete(runtimeId);
				if (entry.expectedRuntimeIds.size === 0) {
					clearPendingApprovalRouteNotice(state, entry.request.id);
					continue;
				}
				await maybeFinalizeApprovalRouteNotice(state, entry.request.id);
			}
		}
	};
}
/** Creates an instance-local route coordinator so Gateway runtimes cannot share account state. */
function createApprovalNativeRouteCoordinator() {
	const state = createApprovalNativeRouteCoordinatorState();
	return {
		createReporter: (params) => createApprovalNativeRouteReporterForState(state, params),
		hasActiveRuntime: (params) => hasActiveApprovalNativeRouteRuntimeForState(state, params),
		close: () => {
			state.closed = true;
			for (const approvalId of Array.from(state.pendingNotices.keys())) clearPendingApprovalRouteNotice(state, approvalId);
			state.activeRuntimes.clear();
		}
	};
}
//#endregion
Object.defineProperty(exports, "buildChannelApprovalNativeTargetKey", {
	enumerable: true,
	get: function() {
		return buildChannelApprovalNativeTargetKey;
	}
});
Object.defineProperty(exports, "createApprovalNativeRouteCoordinator", {
	enumerable: true,
	get: function() {
		return createApprovalNativeRouteCoordinator;
	}
});
Object.defineProperty(exports, "createApprovalNativeRouteReporter", {
	enumerable: true,
	get: function() {
		return createApprovalNativeRouteReporter;
	}
});
Object.defineProperty(exports, "hasActiveApprovalNativeRouteRuntime", {
	enumerable: true,
	get: function() {
		return hasActiveApprovalNativeRouteRuntime;
	}
});
