const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
require("./operator-scopes-BT4c3sSd.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_src = require("./src-Bt6t_5vk.cjs");
require("./method-scopes-Dz-dMiDm.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_crypto = require("node:crypto");
//#region src/gateway/server-in-process-dispatch.ts
function unwrapGatewayMethodDispatchResponse(method, response) {
	if (!response.ok) throw new require_src.GatewayClientRequestError({
		code: response.error?.code,
		message: response.error?.message ?? `Gateway method "${method}" failed.`,
		details: response.error?.details,
		retryable: response.error?.retryable,
		retryAfterMs: response.error?.retryAfterMs
	});
	return response.payload;
}
function resolveDispatchDeadlineMs(timeoutMs) {
	if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) return;
	return Date.now() + require_timeouts.resolveSafeTimeoutDelayMs(timeoutMs);
}
function resolveRemainingDispatchTimeoutMs(deadlineMs) {
	return deadlineMs === void 0 ? void 0 : require_timeouts.resolveSafeTimeoutDelayMs(deadlineMs - Date.now(), { minMs: 0 });
}
async function waitForDispatch(method, promise, deadlineMs) {
	const remainingTimeoutMs = resolveRemainingDispatchTimeoutMs(deadlineMs);
	if (remainingTimeoutMs === void 0) return await promise;
	let timeout;
	try {
		return await Promise.race([promise, new Promise((_resolve, reject) => {
			timeout = setTimeout(() => {
				reject(/* @__PURE__ */ new Error(`gateway request timeout for ${method}`));
			}, remainingTimeoutMs);
		})]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
/** Dispatches one request through the ordinary Gateway router without opening a transport. */
async function dispatchGatewayRequestInProcessRaw(method, params, options) {
	let firstResponse;
	let finalResponse;
	let resolveFirstResponse;
	let rejectFirstResponse;
	let resolveFinalResponse;
	let rejectFinalResponse;
	let postFirstResponseError;
	const firstResponsePromise = new Promise((resolve, reject) => {
		resolveFirstResponse = resolve;
		rejectFirstResponse = reject;
	});
	const deadlineMs = resolveDispatchDeadlineMs(options.timeoutMs);
	const { handleGatewayRequest } = await Promise.resolve().then(() => require("./server-methods-CYO3KugS.cjs"));
	handleGatewayRequest({
		req: {
			type: "req",
			id: `${options.requestIdPrefix ?? "in-process"}-${(0, node_crypto.randomUUID)()}`,
			method,
			params
		},
		client: options.client,
		isWebchatConnect: options.isWebchatConnect ?? (() => false),
		respond: (ok, payload, error, meta) => {
			const response = {
				ok,
				payload,
				error,
				...meta ? { meta } : {}
			};
			if (!firstResponse) {
				firstResponse = response;
				resolveFirstResponse?.(response);
				return;
			}
			if (!finalResponse) {
				finalResponse = response;
				resolveFinalResponse?.(response);
			}
		},
		context: options.context,
		methodRegistry: options.methodRegistry
	}).then(() => {
		if (!firstResponse) rejectFirstResponse?.(/* @__PURE__ */ new Error(`Gateway method "${method}" completed without a response.`));
	}).catch((err) => {
		const error = err instanceof Error ? err : new Error(String(err));
		if (!firstResponse) {
			rejectFirstResponse?.(error);
			return;
		}
		postFirstResponseError = error;
		rejectFinalResponse?.(error);
	});
	firstResponse = await waitForDispatch(method, firstResponsePromise, deadlineMs);
	const firstPayload = firstResponse.payload;
	if (options.expectFinal !== true || firstPayload?.status !== "accepted") return firstResponse;
	options.onAccepted?.(firstResponse.payload);
	if (postFirstResponseError) throw postFirstResponseError;
	return finalResponse ?? await new Promise((resolve, reject) => {
		resolveFinalResponse = resolve;
		const timeoutMs = resolveRemainingDispatchTimeoutMs(deadlineMs);
		const timeout = timeoutMs === void 0 ? void 0 : setTimeout(() => reject(/* @__PURE__ */ new Error(`gateway request timeout for ${method}`)), timeoutMs);
		const clearFinalTimeout = () => {
			if (timeout) clearTimeout(timeout);
		};
		rejectFinalResponse = (err) => {
			clearFinalTimeout();
			reject(err);
		};
		if (postFirstResponseError) {
			rejectFinalResponse(postFirstResponseError);
			return;
		}
		if (finalResponse) {
			clearFinalTimeout();
			resolve(finalResponse);
			return;
		}
		resolveFinalResponse = (response) => {
			clearFinalTimeout();
			resolve(response);
		};
	});
}
async function dispatchGatewayRequestInProcess(method, params, options) {
	return unwrapGatewayMethodDispatchResponse(method, await dispatchGatewayRequestInProcessRaw(method, params, options));
}
//#endregion
//#region src/gateway/server-plugin-runtime-client.ts
function createSyntheticPluginRuntimeClient(params) {
	const pluginRuntimeOwnerId = typeof params?.pluginRuntimeOwnerId === "string" && params.pluginRuntimeOwnerId.trim() ? params.pluginRuntimeOwnerId.trim() : void 0;
	return {
		connect: {
			minProtocol: 4,
			maxProtocol: 4,
			client: {
				id: require_client_info.GATEWAY_CLIENT_IDS.GATEWAY_CLIENT,
				version: "internal",
				platform: "node",
				mode: require_client_info.GATEWAY_CLIENT_MODES.BACKEND
			},
			role: "operator",
			scopes: params?.scopes ?? ["operator.write"]
		},
		internal: {
			allowModelOverride: params?.allowModelOverride === true,
			...params?.agentRunTracking ? { agentRunTracking: params.agentRunTracking } : {},
			...params?.cronRunContinuation === true ? { cronRunContinuation: true } : {},
			...params?.internalDeliveryMediaUrls ? { internalDeliveryMediaUrls: [...params.internalDeliveryMediaUrls] } : {},
			...params?.internalDeliverySuppressText === true ? { internalDeliverySuppressText: true } : {},
			...params?.scopes?.includes("operator.approvals") ? { approvalRuntime: true } : {},
			...pluginRuntimeOwnerId ? { pluginRuntimeOwnerId } : {},
			...params?.runtimePluginToolGrant ? { runtimePluginToolGrant: params.runtimePluginToolGrant } : {}
		}
	};
}
function mergePluginRuntimeClientInternal(client, internal) {
	if (!client || !internal) return client ?? null;
	return {
		...client,
		internal: {
			...client.internal,
			...internal
		}
	};
}
function resolvePluginSubagentToolsAlsoAllow(params) {
	const requested = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((params.toolsAlsoAllow ?? []).map((entry) => require_tool_policy.normalizeToolName(entry.trim())).filter(Boolean));
	if (requested.length === 0) return;
	const pluginId = params.pluginId?.trim();
	if (!pluginId) throw new Error("toolsAlsoAllow requires plugin identity for subagent runs.");
	const registry = require_runtime.getActivePluginRegistry();
	for (const toolName of requested) {
		if (require_tool_policy.isKnownCoreToolId(toolName)) throw new Error(`plugin "${pluginId}" may not add core tool "${toolName}" to subagent runs.`);
		const owners = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((registry?.tools ?? []).filter((registration) => [...registration.names, ...registration.declaredNames ?? []].some((registeredName) => require_tool_policy.normalizeToolName(registeredName) === toolName)).map((registration) => registration.pluginId));
		if (owners.length !== 1 || owners[0] !== pluginId) throw new Error(`plugin "${pluginId}" does not uniquely own subagent tool "${toolName}".`);
	}
	return {
		pluginId,
		toolNames: requested
	};
}
//#endregion
Object.defineProperty(exports, "createSyntheticPluginRuntimeClient", {
	enumerable: true,
	get: function() {
		return createSyntheticPluginRuntimeClient;
	}
});
Object.defineProperty(exports, "dispatchGatewayRequestInProcess", {
	enumerable: true,
	get: function() {
		return dispatchGatewayRequestInProcess;
	}
});
Object.defineProperty(exports, "dispatchGatewayRequestInProcessRaw", {
	enumerable: true,
	get: function() {
		return dispatchGatewayRequestInProcessRaw;
	}
});
Object.defineProperty(exports, "mergePluginRuntimeClientInternal", {
	enumerable: true,
	get: function() {
		return mergePluginRuntimeClientInternal;
	}
});
Object.defineProperty(exports, "resolvePluginSubagentToolsAlsoAllow", {
	enumerable: true,
	get: function() {
		return resolvePluginSubagentToolsAlsoAllow;
	}
});
Object.defineProperty(exports, "unwrapGatewayMethodDispatchResponse", {
	enumerable: true,
	get: function() {
		return unwrapGatewayMethodDispatchResponse;
	}
});
