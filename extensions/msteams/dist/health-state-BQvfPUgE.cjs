const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
require("./auth-DnGY7_cY.cjs");
const require_health = require("./health-oi6Ab5R5.cjs");
const require_system_presence = require("./system-presence-B9QPXvl5.cjs");
const require_update_startup = require("./update-startup-Becfqb4n.cjs");
//#region src/gateway/server/health-state.ts
let presenceVersion = 1;
let healthVersion = 1;
let healthCache = null;
let healthRefresh = null;
let sensitiveHealthRefresh = null;
let broadcastHealthUpdate = null;
function buildGatewaySnapshot(opts) {
	const cfg = require_io.getRuntimeConfig();
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const mainKey = require_session_key.normalizeMainKey(cfg.session?.mainKey);
	const mainSessionKey = require_main_session.resolveMainSessionKey(cfg);
	const scope = cfg.session?.scope ?? "per-sender";
	const presence = require_system_presence.listSystemPresence();
	const uptimeMs = Math.round(process.uptime() * 1e3);
	const updateAvailable = require_update_startup.getUpdateAvailable() ?? void 0;
	const snapshot = {
		presence,
		health: {},
		stateVersion: {
			presence: presenceVersion,
			health: healthVersion
		},
		uptimeMs,
		appliedConfigHash: require_runtime_snapshot.getRuntimeConfigAppliedHash(),
		sessionDefaults: {
			defaultAgentId,
			mainKey,
			mainSessionKey,
			scope
		},
		updateAvailable
	};
	if (opts?.includeSensitive === true) {
		const auth = require_auth_resolve.resolveGatewayAuth({
			authConfig: cfg.gateway?.auth,
			env: process.env
		});
		snapshot.configPath = require_io.createConfigIO().configPath;
		snapshot.stateDir = require_paths.STATE_DIR;
		snapshot.authMode = auth.mode;
	}
	return snapshot;
}
function getHealthCache() {
	return healthCache;
}
function getHealthVersion() {
	return healthVersion;
}
function incrementPresenceVersion() {
	presenceVersion += 1;
	return presenceVersion;
}
function getPresenceVersion() {
	return presenceVersion;
}
function setBroadcastHealthUpdate(fn) {
	broadcastHealthUpdate = fn;
}
async function refreshGatewayHealthSnapshot(opts) {
	const includeSensitive = opts?.includeSensitive === true;
	let refresh = includeSensitive ? sensitiveHealthRefresh : healthRefresh;
	if (!refresh) {
		refresh = (async () => {
			let runtimeSnapshot;
			try {
				runtimeSnapshot = opts?.getRuntimeSnapshot?.();
			} catch {
				runtimeSnapshot = void 0;
			}
			const eventLoop = opts?.getEventLoopHealth?.();
			const configReloadHotReloadStatus = opts?.getConfigReloaderHotReloadStatus?.();
			const snap = await require_health.getHealthSnapshot({
				probe: opts?.probe,
				includeSensitive,
				runtimeSnapshot,
				...eventLoop ? { eventLoop } : {},
				...configReloadHotReloadStatus ? { configReloadHotReloadStatus } : {}
			});
			if (!includeSensitive) {
				healthCache = snap;
				healthVersion += 1;
				if (broadcastHealthUpdate) broadcastHealthUpdate(snap);
			}
			return snap;
		})().finally(() => {
			if (includeSensitive) sensitiveHealthRefresh = null;
			else healthRefresh = null;
		});
		if (includeSensitive) sensitiveHealthRefresh = refresh;
		else healthRefresh = refresh;
	}
	return refresh;
}
//#endregion
Object.defineProperty(exports, "buildGatewaySnapshot", {
	enumerable: true,
	get: function() {
		return buildGatewaySnapshot;
	}
});
Object.defineProperty(exports, "getHealthCache", {
	enumerable: true,
	get: function() {
		return getHealthCache;
	}
});
Object.defineProperty(exports, "getHealthVersion", {
	enumerable: true,
	get: function() {
		return getHealthVersion;
	}
});
Object.defineProperty(exports, "getPresenceVersion", {
	enumerable: true,
	get: function() {
		return getPresenceVersion;
	}
});
Object.defineProperty(exports, "incrementPresenceVersion", {
	enumerable: true,
	get: function() {
		return incrementPresenceVersion;
	}
});
Object.defineProperty(exports, "refreshGatewayHealthSnapshot", {
	enumerable: true,
	get: function() {
		return refreshGatewayHealthSnapshot;
	}
});
Object.defineProperty(exports, "setBroadcastHealthUpdate", {
	enumerable: true,
	get: function() {
		return setBroadcastHealthUpdate;
	}
});
