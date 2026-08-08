const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
const require_core_descriptors = require("./core-descriptors-DnvIcTik.cjs");
const require_events = require("./events-OAhTaz_u.cjs");
//#region src/gateway/server-aux-methods.ts
/** Gateway method ids handled by auxiliary approval/secret surfaces. */
const GATEWAY_AUX_METHODS = [
	"exec.approval.get",
	"exec.approval.list",
	"exec.approval.request",
	"exec.approval.waitDecision",
	"exec.approval.resolve",
	"plugin.approval.list",
	"plugin.approval.request",
	"plugin.approval.waitDecision",
	"plugin.approval.resolve",
	"approval.get",
	"approval.resolve",
	"secrets.reload",
	"secrets.resolve"
];
//#endregion
//#region src/gateway/server-methods-list.ts
/** Lists core methods intentionally advertised to gateway clients. */
function listCoreGatewayMethods() {
	return require_core_descriptors.listCoreAdvertisedGatewayMethodNames();
}
function listChannelGatewayMethods() {
	const methods = [];
	for (const plugin of require_registry_loaded.listLoadedChannelPlugins()) {
		methods.push(...plugin.gatewayMethods ?? []);
		for (const descriptor of plugin.gatewayMethodDescriptors ?? []) methods.push(descriptor.name);
	}
	return methods;
}
/** Returns the de-duplicated gateway method catalog advertised through method-list APIs. */
function listGatewayMethods() {
	return Array.from(/* @__PURE__ */ new Set([
		...listCoreGatewayMethods(),
		...GATEWAY_AUX_METHODS,
		...listChannelGatewayMethods()
	]));
}
/** Gateway event names that clients can subscribe to or receive over the wire. */
const GATEWAY_EVENTS = [
	"connect.challenge",
	"agent",
	"chat",
	"session.approval",
	"session.message",
	"session.operation",
	"session.tool",
	"sessions.changed",
	"presence",
	"tick",
	"talk.mode",
	"talk.event",
	"shutdown",
	"health",
	"heartbeat",
	"cron",
	"task",
	"task.suggestion",
	"node.pair.requested",
	"node.pair.resolved",
	"node.presence",
	"node.invoke.cancel",
	"node.invoke.input",
	"node.invoke.request",
	"device.pair.requested",
	"device.pair.resolved",
	"voicewake.changed",
	"voicewake.routing.changed",
	"exec.approval.requested",
	"exec.approval.resolved",
	"plugin.approval.requested",
	"plugin.approval.resolved",
	"operator.approval.requested",
	"operator.approval.resolved",
	"terminal.data",
	"terminal.exit",
	require_events.GATEWAY_EVENT_UPDATE_AVAILABLE
];
//#endregion
Object.defineProperty(exports, "GATEWAY_EVENTS", {
	enumerable: true,
	get: function() {
		return GATEWAY_EVENTS;
	}
});
Object.defineProperty(exports, "listGatewayMethods", {
	enumerable: true,
	get: function() {
		return listGatewayMethods;
	}
});
