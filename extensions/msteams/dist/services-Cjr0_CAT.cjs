require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_host_hook_json = require("./host-hook-json-BhDT-UAu.cjs");
const require_startup_trace_segment = require("./startup-trace-segment-Cm0tAaEk.cjs");
const require_http_registry = require("./http-registry-CuAISLrz.cjs");
//#region src/plugins/services.ts
/** Starts, stops, and inspects plugin service registrations. */
const log = require_subsystem.createSubsystemLogger("plugins");
function createPluginLogger() {
	return {
		info: (msg) => log.info(msg),
		warn: (msg) => log.warn(msg),
		error: (msg) => log.error(msg),
		debug: (msg) => log.debug(msg)
	};
}
function createServiceContext(params) {
	const grantsInternalDiagnostics = params.service?.pluginId === params.service?.service.id && (params.service?.service.id === "diagnostics-otel" || params.service?.service.id === "diagnostics-prometheus") && (params.service?.origin === "bundled" || params.service?.trustedOfficialInstall === true);
	return {
		config: params.config,
		workspaceDir: params.workspaceDir,
		stateDir: require_paths.STATE_DIR,
		logger: createPluginLogger(),
		...params.gatewayEvents ? { gatewayEvents: params.gatewayEvents } : {},
		...params.startupTrace ? { startupTrace: createScopedPluginServiceStartupTrace(params.startupTrace, createPluginServiceTraceName(params.service)) } : {},
		...grantsInternalDiagnostics ? { internalDiagnostics: {
			emit: require_diagnostic_events.emitTrustedDiagnosticEventWithPrivateData,
			onEvent: require_diagnostic_events.onTrustedInternalDiagnosticEvent
		} } : {}
	};
}
function createScopedGatewayEvents(params) {
	if (!params.broadcast) return { revoke: () => void 0 };
	let active = true;
	return {
		gatewayEvents: { emit: (event, payload, opts) => {
			if (!active) throw new Error("plugin service gateway event emitter is no longer active");
			if (!/^[a-z][a-z0-9_-]*$/u.test(event)) throw new Error(`invalid plugin gateway event name: ${event}`);
			if (!require_host_hook_json.isPluginJsonValue(payload)) throw new Error("plugin gateway event payload must be bounded JSON");
			if (opts?.scope !== "operator.read" && opts?.scope !== "operator.write" && opts?.scope !== "operator.admin") throw new Error("plugin gateway event scope must be an operator scope");
			params.broadcast?.(`plugin.${params.pluginId}.${event}`, payload, opts.scope);
		} },
		revoke: () => {
			active = false;
		}
	};
}
function createPluginServiceTraceName(entry) {
	return `sidecars.plugin-services.${require_startup_trace_segment.encodeStartupTraceSegment(entry.pluginId)}.${require_startup_trace_segment.encodeStartupTraceSegment(entry.service.id)}`;
}
function createScopedPluginServiceStartupTrace(startupTrace, prefix) {
	const scopeName = (name) => `${prefix}.${name.split(".").map((segment) => require_startup_trace_segment.encodeStartupTraceSegment(segment)).join(".")}`;
	return {
		measure: (name, run) => startupTrace.measure(scopeName(name), run),
		...startupTrace.detail ? { detail: (name, metrics) => startupTrace.detail?.(scopeName(name), metrics) } : {}
	};
}
async function startPluginServices(params) {
	const running = [];
	let failedCount = 0;
	for (const entry of params.registry.services) {
		const service = entry.service;
		const traceName = createPluginServiceTraceName(entry);
		const scopedGatewayEvents = createScopedGatewayEvents({
			pluginId: entry.pluginId,
			broadcast: params.broadcastPluginEvent
		});
		const serviceContext = createServiceContext({
			config: params.config,
			startupTrace: params.startupTrace,
			workspaceDir: params.workspaceDir,
			service: entry,
			gatewayEvents: scopedGatewayEvents.gatewayEvents
		});
		try {
			const startService = () => require_http_registry.withPluginHttpRouteRegistry(params.registry, () => service.start(serviceContext));
			if (params.startupTrace) await params.startupTrace.measure(traceName, startService);
			else await startService();
			running.push({
				id: service.id,
				stop: service.stop ? () => service.stop?.(serviceContext) : void 0,
				revokeGatewayEvents: scopedGatewayEvents.revoke
			});
		} catch (err) {
			scopedGatewayEvents.revoke();
			failedCount += 1;
			const error = err;
			log.error(`plugin service failed (${service.id}, plugin=${entry.pluginId}, root=${entry.rootDir ?? "unknown"}): ${error?.message ?? String(err)}`);
		}
	}
	params.startupTrace?.detail?.("sidecars.plugin-services.summary", [
		["serviceCount", params.registry.services.length],
		["startedCount", running.length],
		["failedCount", failedCount]
	]);
	return { stop: async () => {
		for (const entry of running.toReversed()) try {
			if (entry.stop) await require_http_registry.withPluginHttpRouteRegistry(params.registry, () => entry.stop?.());
		} catch (err) {
			log.warn(`plugin service stop failed (${entry.id}): ${String(err)}`);
		} finally {
			entry.revokeGatewayEvents();
		}
	} };
}
//#endregion
exports.startPluginServices = startPluginServices;
