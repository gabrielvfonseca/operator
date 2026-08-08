const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
//#region src/cli/daemon-cli/probe.ts
var probe_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ probeGatewayStatus: () => probeGatewayStatus });
const probeGatewayModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./probe-DBcFqNwO.cjs")).then((n) => n.probe_exports));
async function loadProbeGatewayModule() {
	return await probeGatewayModuleLoader.load();
}
function resolveProbeFailureMessage(result) {
	const closeHint = result.close ? `gateway closed (${result.close.code}): ${result.close.reason}` : null;
	if (closeHint && (!result.error || result.error === "timeout")) return closeHint;
	return result.error ?? closeHint ?? "gateway probe failed";
}
function resolveGatewayStatusProbeDetails(result) {
	return "authProbe" in result ? result.authProbe : result;
}
function readRuntimeVersionFromStatusPayload(payload) {
	if (!payload || typeof payload !== "object") return null;
	const runtimeVersion = payload.runtimeVersion;
	return typeof runtimeVersion === "string" && runtimeVersion.trim().length > 0 ? runtimeVersion.trim() : null;
}
/** Probe Gateway connectivity or read-capability status with optional RPC verification. */
async function probeGatewayStatus(opts) {
	const kind = opts.requireRpc ? "read" : "connect";
	try {
		let statusRuntimeVersion = null;
		const result = await require_progress.withProgress({
			label: "Checking gateway status...",
			indeterminate: true,
			enabled: opts.json !== true
		}, async () => {
			const { probeGateway } = await loadProbeGatewayModule();
			const probeOpts = {
				url: opts.url,
				auth: {
					token: opts.token,
					password: opts.password
				},
				tlsFingerprint: opts.tlsFingerprint,
				...opts.preauthHandshakeTimeoutMs !== void 0 ? { preauthHandshakeTimeoutMs: opts.preauthHandshakeTimeoutMs } : {},
				timeoutMs: opts.timeoutMs,
				includeDetails: false
			};
			if (opts.requireRpc) {
				const allowRpcConfigCredentials = opts.allowRpcConfigCredentials !== false;
				if (!allowRpcConfigCredentials && !opts.token && !opts.password) throw new Error("gateway status RPC skipped because configured gateway credentials are disabled for this status request");
				const { callGateway } = await Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports);
				statusRuntimeVersion = readRuntimeVersionFromStatusPayload(await callGateway({
					url: opts.url,
					token: opts.token,
					password: opts.password,
					tlsFingerprint: opts.tlsFingerprint,
					...allowRpcConfigCredentials && opts.config ? { config: opts.config } : {},
					method: "status",
					timeoutMs: opts.timeoutMs,
					...opts.configPath ? { configPath: opts.configPath } : {}
				}));
				return {
					ok: true,
					authProbe: await probeGateway(probeOpts).catch(() => null)
				};
			}
			return await probeGateway(probeOpts);
		});
		const probeDetails = resolveGatewayStatusProbeDetails(result);
		const auth = probeDetails?.auth;
		const server = probeDetails?.server;
		const serverSummary = server ? { server } : {};
		const version = server?.version ?? ("authProbe" in result ? statusRuntimeVersion : null);
		if (result.ok) return {
			ok: true,
			kind,
			capability: kind === "read" ? auth?.capability && auth.capability !== "unknown" ? auth.capability : "read_only" : auth?.capability,
			auth,
			...serverSummary,
			...version != null ? { version } : {}
		};
		return {
			ok: false,
			kind,
			capability: auth?.capability,
			auth,
			...serverSummary,
			...version != null ? { version } : {},
			error: resolveProbeFailureMessage(result)
		};
	} catch (err) {
		return {
			ok: false,
			kind,
			error: require_errors.formatErrorMessage(err)
		};
	}
}
//#endregion
Object.defineProperty(exports, "probeGatewayStatus", {
	enumerable: true,
	get: function() {
		return probeGatewayStatus;
	}
});
Object.defineProperty(exports, "probe_exports", {
	enumerable: true,
	get: function() {
		return probe_exports;
	}
});
