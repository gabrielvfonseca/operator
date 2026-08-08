const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_network_discovery_display = require("./network-discovery-display-CrYyDxeY.cjs");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let node_child_process = require("node:child_process");
//#region src/infra/system-presence.ts
const entries = /* @__PURE__ */ new Map();
const TTL_MS = 300 * 1e3;
const MAX_ENTRIES = 200;
const SELF_INSTANCE_ID = (0, node_crypto.randomUUID)();
function normalizePresenceKey(key) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key);
}
function resolvePrimaryIPv4() {
	return require_network_discovery_display.pickBestEffortPrimaryLanIPv4() ?? node_os.default.hostname();
}
function initSelfPresence() {
	const host = node_os.default.hostname();
	const ip = resolvePrimaryIPv4() ?? void 0;
	const version = require_version.resolveRuntimeServiceVersion(process.env);
	const modelIdentifier = (() => {
		if (node_os.default.platform() === "darwin") {
			const out = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, node_child_process.spawnSync)("sysctl", ["-n", "hw.model"], { encoding: "utf-8" }).stdout) ?? "";
			return out.length > 0 ? out : void 0;
		}
		return node_os.default.arch();
	})();
	const macOSVersion = () => {
		const out = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, node_child_process.spawnSync)("sw_vers", ["-productVersion"], { encoding: "utf-8" }).stdout) ?? "";
		return out.length > 0 ? out : node_os.default.release();
	};
	const platform = (() => {
		const p = node_os.default.platform();
		const rel = node_os.default.release();
		if (p === "darwin") return `macos ${macOSVersion()}`;
		if (p === "win32") return `windows ${rel}`;
		return `${p} ${rel}`;
	})();
	const deviceFamily = (() => {
		const p = node_os.default.platform();
		if (p === "darwin") return "Mac";
		if (p === "win32") return "Windows";
		if (p === "linux") return "Linux";
		return p;
	})();
	const text = `Gateway: ${host}${ip ? ` (${ip})` : ""} · app ${version} · mode gateway · reason self`;
	const selfEntry = {
		host,
		ip,
		version,
		platform,
		deviceFamily,
		modelIdentifier,
		mode: "gateway",
		reason: "self",
		instanceId: SELF_INSTANCE_ID,
		text,
		ts: Date.now()
	};
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(host);
	entries.set(key, selfEntry);
}
function ensureSelfPresence() {
	if (entries.size === 0) initSelfPresence();
}
function touchSelfPresence() {
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_os.default.hostname());
	const existing = entries.get(key);
	if (existing) entries.set(key, {
		...existing,
		ts: Date.now()
	});
	else initSelfPresence();
}
initSelfPresence();
function parsePresence(text) {
	const trimmed = text.trim();
	const match = trimmed.match(/Node:\s*([^ (]+)\s*\(([^)]+)\)\s*·\s*app\s*([^·]+?)\s*·\s*last input\s*([0-9]+)s ago\s*·\s*mode\s*([^·]+?)\s*·\s*reason\s*(.+)$/i);
	if (!match) return {
		text: trimmed,
		ts: Date.now()
	};
	const [, host, ip, version, lastInputStr, mode, reasonRaw] = match;
	if (host === void 0 || ip === void 0 || version === void 0 || lastInputStr === void 0 || mode === void 0 || reasonRaw === void 0) return {
		text: trimmed,
		ts: Date.now()
	};
	const lastInputSeconds = Number.parseInt(lastInputStr, 10);
	const reason = reasonRaw.trim();
	return {
		host: host.trim(),
		ip: ip.trim(),
		version: version.trim(),
		lastInputSeconds: Number.isFinite(lastInputSeconds) ? lastInputSeconds : void 0,
		mode: mode.trim(),
		reason,
		text: trimmed,
		ts: Date.now()
	};
}
function mergeStringList(...values) {
	const out = /* @__PURE__ */ new Set();
	for (const list of values) {
		if (!Array.isArray(list)) continue;
		for (const item of list) {
			const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item) ?? "";
			if (trimmed) out.add(trimmed);
		}
	}
	return out.size > 0 ? [...out] : void 0;
}
function updateSystemPresence(payload) {
	ensureSelfPresence();
	const parsed = parsePresence(payload.text);
	const key = normalizePresenceKey(payload.deviceId) || normalizePresenceKey(payload.instanceId) || normalizePresenceKey(parsed.instanceId) || normalizePresenceKey(parsed.host) || parsed.ip || (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(parsed.text, 64) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_os.default.hostname());
	const hadExisting = entries.has(key);
	const existing = entries.get(key) ?? {};
	const merged = {
		...existing,
		...parsed,
		host: payload.host ?? parsed.host ?? existing.host,
		ip: payload.ip ?? parsed.ip ?? existing.ip,
		version: payload.version ?? parsed.version ?? existing.version,
		platform: payload.platform ?? existing.platform,
		deviceFamily: payload.deviceFamily ?? existing.deviceFamily,
		modelIdentifier: payload.modelIdentifier ?? existing.modelIdentifier,
		mode: payload.mode ?? parsed.mode ?? existing.mode,
		lastInputSeconds: payload.lastInputSeconds ?? parsed.lastInputSeconds ?? existing.lastInputSeconds,
		reason: payload.reason ?? parsed.reason ?? existing.reason,
		deviceId: payload.deviceId ?? existing.deviceId,
		roles: mergeStringList(existing.roles, payload.roles),
		scopes: mergeStringList(existing.scopes, payload.scopes),
		instanceId: payload.instanceId ?? parsed.instanceId ?? existing.instanceId,
		text: payload.text || parsed.text || existing.text,
		ts: Date.now()
	};
	entries.set(key, merged);
	const trackKeys = [
		"host",
		"ip",
		"version",
		"mode",
		"reason"
	];
	const changes = {};
	const changedKeys = [];
	for (const k of trackKeys) {
		const prev = existing[k];
		const next = merged[k];
		if (prev !== next) {
			changes[k] = next;
			changedKeys.push(k);
		}
	}
	return {
		key,
		previous: hadExisting ? existing : void 0,
		next: merged,
		changes,
		changedKeys
	};
}
function upsertPresence(key, presence) {
	ensureSelfPresence();
	const normalizedKey = normalizePresenceKey(key) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_os.default.hostname());
	const existing = entries.get(normalizedKey) ?? {};
	const roles = mergeStringList(existing.roles, presence.roles);
	const scopes = mergeStringList(existing.scopes, presence.scopes);
	const merged = {
		...existing,
		...presence,
		roles,
		scopes,
		ts: Date.now(),
		text: presence.text || existing.text || `Node: ${presence.host ?? existing.host ?? "unknown"} · mode ${presence.mode ?? existing.mode ?? "unknown"}`
	};
	entries.set(normalizedKey, merged);
}
function listSystemPresence() {
	ensureSelfPresence();
	const now = Date.now();
	for (const [k, v] of entries) if (now - v.ts > TTL_MS) entries.delete(k);
	if (entries.size > MAX_ENTRIES) {
		const sorted = [...entries.entries()].toSorted((a, b) => a[1].ts - b[1].ts);
		const toDrop = entries.size - MAX_ENTRIES;
		for (const [key] of sorted.slice(0, toDrop)) entries.delete(key);
	}
	touchSelfPresence();
	return [...entries.values()].toSorted((a, b) => b.ts - a.ts);
}
//#endregion
Object.defineProperty(exports, "listSystemPresence", {
	enumerable: true,
	get: function() {
		return listSystemPresence;
	}
});
Object.defineProperty(exports, "updateSystemPresence", {
	enumerable: true,
	get: function() {
		return updateSystemPresence;
	}
});
Object.defineProperty(exports, "upsertPresence", {
	enumerable: true,
	get: function() {
		return upsertPresence;
	}
});
