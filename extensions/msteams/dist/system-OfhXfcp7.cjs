const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_schema = require("./schema-DpZMt4ud.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_os_summary = require("./os-summary-DapJiOfZ.cjs");
const require_machine_name = require("./machine-name-DYpOVD5W.cjs");
const require_advertised_lan_host = require("./advertised-lan-host-CqXdPyiB.cjs");
const require_disk_space = require("./disk-space-GXKgBULz.cjs");
require("./heartbeat-runner-CDeHE7DV.cjs");
const require_heartbeat_events = require("./heartbeat-events-DGL6ZKoG.cjs");
const require_system_presence = require("./system-presence-B9QPXvl5.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_process_instance = require("./process-instance-DEuU_kN-.cjs");
const require_presence_events = require("./presence-events-D_eQAngq.cjs");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/server-methods/system.ts
let advertisedLanHostPromise = null;
function resolveCachedAdvertisedLanHost() {
	advertisedLanHostPromise ??= require_advertised_lan_host.resolveAdvertisedLanHost().catch(() => null);
	return advertisedLanHostPromise;
}
async function collectSystemInfo(context) {
	const cpus = node_os.default.cpus();
	const cpuModel = cpus[0]?.model.trim() || void 0;
	const [oneMinute = 0, fiveMinutes = 0, fifteenMinutes = 0] = node_os.default.loadavg();
	const loadAverage = [
		oneMinute,
		fiveMinutes,
		fifteenMinutes
	];
	const stateDir = require_paths.resolveStateDir();
	const disk = require_disk_space.tryReadDiskSpace(stateDir);
	const port = require_paths.resolveGatewayPort(context.getRuntimeConfig());
	const lanAddress = await resolveCachedAdvertisedLanHost() ?? void 0;
	return {
		machineName: await require_machine_name.getMachineDisplayName(),
		hostname: node_os.default.hostname(),
		platform: node_os.default.platform(),
		release: node_os.default.release(),
		arch: node_os.default.arch(),
		osLabel: require_os_summary.resolveRuntimeOsLabel(),
		...lanAddress ? { lanAddress } : {},
		port,
		nodeVersion: process.version,
		pid: process.pid,
		processInstanceId: require_process_instance.getGatewayProcessInstanceId(),
		uptimeMs: Math.round(process.uptime() * 1e3),
		cpuCount: cpus.length,
		...cpuModel ? { cpuModel } : {},
		...loadAverage.some((value) => value !== 0) ? { loadAverage } : {},
		memoryTotalBytes: node_os.default.totalmem(),
		memoryFreeBytes: node_os.default.freemem(),
		...disk?.totalBytes != null ? {
			diskTotalBytes: disk.totalBytes,
			diskAvailableBytes: disk.availableBytes,
			diskPath: stateDir
		} : {}
	};
}
/** Gateway handlers for identity, host information, heartbeat toggles, and presence events. */
const systemHandlers = {
	"gateway.identity.get": ({ respond }) => {
		const identity = require_device_identity.loadOrCreateProcessDeviceIdentity();
		respond(true, {
			deviceId: identity.deviceId,
			publicKey: require_device_identity.publicKeyRawBase64UrlFromPem(identity.publicKeyPem)
		}, void 0);
	},
	"last-heartbeat": ({ respond }) => {
		respond(true, require_heartbeat_events.getLastHeartbeatEvent(), void 0);
	},
	"set-heartbeats": ({ params, respond }) => {
		const enabled = params.enabled;
		if (typeof enabled !== "boolean") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid set-heartbeats params: enabled (boolean) required"));
			return;
		}
		require_heartbeat_wake.setHeartbeatsEnabled(enabled);
		respond(true, {
			ok: true,
			enabled
		}, void 0);
	},
	"system-presence": ({ respond }) => {
		respond(true, require_system_presence.listSystemPresence(), void 0);
	},
	"system.info": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSystemInfoParams, "system.info", respond)) return;
		respond(true, await collectSystemInfo(context), void 0);
	},
	"system-event": ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_schema.validateSystemEventParams, "system-event", respond)) return;
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.text) ?? "";
		if (!text) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "text required"));
			return;
		}
		const requestedSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
		const sessionKey = requestedSessionKey ?? require_sessions.resolveMainSessionKeyFromConfig();
		const wake = params.wake === true;
		const isNodePresenceLine = text.startsWith("Node:");
		if (wake && isNodePresenceLine) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "wake is not supported for node presence events"));
			return;
		}
		if (wake && requestedSessionKey) {
			const targetAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_session_key.resolveAgentIdFromSessionKey(requestedSessionKey));
			if (!require_agent_scope_config.listAgentIds(context.getRuntimeConfig()).map(_gabrielvfonseca_normalization_core_agent_id.normalizeAgentId).includes(targetAgentId)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Unknown agent id "${targetAgentId}"`));
				return;
			}
			const targetSession = require_session_utils.loadGatewaySessionRow(requestedSessionKey, { agentId: targetAgentId });
			if (!targetSession || targetSession.archived) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Unknown or archived session "${requestedSessionKey}"`));
				return;
			}
		}
		const deviceId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.deviceId);
		const instanceId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.instanceId);
		const host = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.host);
		const ip = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.ip);
		const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.mode);
		const version = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.version);
		const platform = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.platform);
		const deviceFamily = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.deviceFamily);
		const modelIdentifier = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.modelIdentifier);
		const lastInputSeconds = typeof params.lastInputSeconds === "number" && Number.isFinite(params.lastInputSeconds) ? params.lastInputSeconds : void 0;
		const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(params.reason);
		const presenceUpdate = require_system_presence.updateSystemPresence({
			text,
			deviceId,
			instanceId,
			host,
			ip,
			mode,
			version,
			platform,
			deviceFamily,
			modelIdentifier,
			lastInputSeconds,
			reason,
			roles: Array.isArray(params.roles) && params.roles.every((t) => typeof t === "string") ? params.roles : void 0,
			scopes: Array.isArray(params.scopes) && params.scopes.every((t) => typeof t === "string") ? params.scopes : void 0,
			tags: Array.isArray(params.tags) && params.tags.every((t) => typeof t === "string") ? params.tags : void 0
		});
		if (isNodePresenceLine) {
			const next = presenceUpdate.next;
			const changed = new Set(presenceUpdate.changedKeys);
			const reasonValue = next.reason ?? reason;
			const normalizedReason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(reasonValue);
			const ignoreReason = normalizedReason.startsWith("periodic") || normalizedReason === "heartbeat" || normalizedReason === "connect" || normalizedReason === "launch" || normalizedReason === "instances-refresh";
			const hostChanged = changed.has("host");
			const ipChanged = changed.has("ip");
			const versionChanged = changed.has("version");
			const modeChanged = changed.has("mode");
			const reasonChanged = changed.has("reason") && !ignoreReason;
			if (hostChanged || ipChanged || versionChanged || modeChanged || reasonChanged) {
				const contextChanged = require_system_events.isSystemEventContextChanged(sessionKey, presenceUpdate.key);
				const parts = [];
				if (contextChanged || hostChanged || ipChanged) {
					const hostLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.host) ?? "Unknown";
					const ipLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.ip);
					parts.push(`Node: ${hostLabel}${ipLabel ? ` (${ipLabel})` : ""}`);
				}
				if (versionChanged) parts.push(`app ${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.version) ?? "unknown"}`);
				if (modeChanged) parts.push(`mode ${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.mode) ?? "unknown"}`);
				if (reasonChanged) parts.push(`reason ${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(reasonValue) ?? "event"}`);
				const deltaText = parts.join(" · ");
				if (deltaText) require_system_events.enqueueSystemEvent(deltaText, {
					sessionKey,
					contextKey: presenceUpdate.key
				});
			}
		} else {
			require_system_events.enqueueSystemEvent(text, { sessionKey });
			if (wake) require_heartbeat_wake.requestHeartbeat({
				source: "notifications-event",
				intent: "immediate",
				reason: "wake",
				sessionKey,
				heartbeat: { target: "last" }
			});
		}
		require_presence_events.broadcastPresenceSnapshot({
			broadcast: context.broadcast,
			incrementPresenceVersion: context.incrementPresenceVersion,
			getHealthVersion: context.getHealthVersion
		});
		respond(true, { ok: true }, void 0);
	}
};
//#endregion
exports.systemHandlers = systemHandlers;
