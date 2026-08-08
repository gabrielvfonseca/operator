require("./rolldown-runtime-u92d-OFm.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_approval_native_route_coordinator = require("./approval-native-route-coordinator-MGwpludK.cjs");
require("./method-scopes-Dz-dMiDm.cjs");
const require_server_plugin_runtime_client = require("./server-plugin-runtime-client-Dnm81hBY.cjs");
const require_server_recovery_runtime_context = require("./server-recovery-runtime-context-CleW0EIO.cjs");
const require_approval_gateway_runtime_methods = require("./approval-gateway-runtime-methods-BX4yQO-2.cjs");
//#region src/gateway/server-instance-runtime.ts
/** Creates closed internal principals bound to one concrete Gateway lifecycle. */
function createGatewayInstanceRuntime(options) {
	const approvalSubscribers = /* @__PURE__ */ new Set();
	const routeCoordinator = require_approval_native_route_coordinator.createApprovalNativeRouteCoordinator();
	let closed = false;
	const dispatch = async (params) => {
		if (closed || !options.isDispatchAvailable()) throw new Error(`Gateway instance dispatch unavailable for ${params.method}`);
		if (!params.allowedMethods.has(params.method)) throw new Error(`Gateway internal principal cannot dispatch ${params.method}`);
		return await require_server_plugin_runtime_client.dispatchGatewayRequestInProcess(params.method, params.payload, {
			client: params.client,
			context: options.getContext(),
			methodRegistry: options.getMethodRegistry(),
			requestIdPrefix: "gateway-internal",
			timeoutMs: params.timeoutMs
		});
	};
	const recoveryClient = require_server_plugin_runtime_client.createSyntheticPluginRuntimeClient({ scopes: [require_operator_scopes.WRITE_SCOPE] });
	const recoveryMethods = /* @__PURE__ */ new Set(["agent", "agent.wait"]);
	const recoveryNoticeMethods = /* @__PURE__ */ new Set(["message.action"]);
	const approvalClient = require_server_plugin_runtime_client.createSyntheticPluginRuntimeClient({ scopes: [require_operator_scopes.APPROVALS_SCOPE] });
	const approvalMethods = new Set(require_approval_gateway_runtime_methods.GATEWAY_NATIVE_APPROVAL_METHODS);
	const approvalRouteClient = require_server_plugin_runtime_client.createSyntheticPluginRuntimeClient({ scopes: [require_operator_scopes.WRITE_SCOPE] });
	const approvalRouteMethods = /* @__PURE__ */ new Set(["send"]);
	const recovery = {
		dispatchAgent: async (payload, timeoutMs) => await dispatch({
			allowedMethods: recoveryMethods,
			client: recoveryClient,
			method: "agent",
			payload,
			timeoutMs
		}),
		waitForAgent: async (payload, timeoutMs) => await dispatch({
			allowedMethods: recoveryMethods,
			client: recoveryClient,
			method: "agent.wait",
			payload,
			timeoutMs
		}),
		sendRecoveryNotice: async (payload, timeoutMs) => await dispatch({
			allowedMethods: recoveryNoticeMethods,
			client: recoveryClient,
			method: "message.action",
			payload,
			timeoutMs
		})
	};
	const releaseRecoveryRuntime = require_server_recovery_runtime_context.registerGatewayRecoveryRuntime(recovery);
	const publish = (kind, callback, shouldDeliver) => {
		if (closed) return 0;
		let delivered = 0;
		for (const subscriber of approvalSubscribers) {
			if (!subscriber.eventKinds.has(kind)) continue;
			try {
				if (shouldDeliver && !shouldDeliver(subscriber)) continue;
				callback(subscriber);
				delivered += 1;
			} catch (error) {
				options.logError?.(`internal approval subscriber failed: ${String(error)}`);
			}
		}
		return delivered;
	};
	return {
		approvalEvents: {
			publishRequested: (kind, request) => publish(kind, (subscriber) => subscriber.onRequested(request), (subscriber) => subscriber.shouldHandle(request)),
			publishResolved: (kind, resolved) => {
				publish(kind, (subscriber) => subscriber.onResolved(resolved));
			}
		},
		nativeApprovals: {
			request: async (method, payload, requestOptions) => await dispatch({
				allowedMethods: approvalMethods,
				client: requestOptions?.clientDisplayName ? {
					...approvalClient,
					connect: {
						...approvalClient.connect,
						client: {
							...approvalClient.connect.client,
							displayName: requestOptions.clientDisplayName
						}
					}
				} : approvalClient,
				method,
				payload,
				timeoutMs: require_timeouts.DEFAULT_GATEWAY_REQUEST_TIMEOUT_MS
			}),
			requestRoute: async (method, payload) => await dispatch({
				allowedMethods: approvalRouteMethods,
				client: approvalRouteClient,
				method,
				payload,
				timeoutMs: require_timeouts.DEFAULT_GATEWAY_REQUEST_TIMEOUT_MS
			}),
			routeCoordinator,
			subscribe: (subscriber) => {
				if (closed) throw new Error("Gateway instance approval runtime is closed");
				approvalSubscribers.add(subscriber);
				let subscribed = true;
				return () => {
					if (!subscribed) return;
					subscribed = false;
					approvalSubscribers.delete(subscriber);
				};
			}
		},
		recovery,
		close: () => {
			closed = true;
			releaseRecoveryRuntime();
			approvalSubscribers.clear();
			routeCoordinator.close();
		}
	};
}
//#endregion
exports.createGatewayInstanceRuntime = createGatewayInstanceRuntime;
