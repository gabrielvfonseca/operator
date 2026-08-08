const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/gateway/mcp-grant-store.ts
const DEFAULT_TTL_MS = 3600 * 1e3;
const MAX_TTL_MS = 720 * 60 * 1e3;
const grantsByToken = /* @__PURE__ */ new Map();
const clientGrantsByToken = /* @__PURE__ */ new Map();
function clampTtlMs(ttlMs) {
	if (!Number.isFinite(ttlMs) || ttlMs <= 0) return DEFAULT_TTL_MS;
	return Math.min(ttlMs, MAX_TTL_MS);
}
function mintAttachGrant(params) {
	const sessionKey = params.sessionKey?.trim() ?? "";
	if (!sessionKey) throw new Error("mintAttachGrant: sessionKey is required");
	const nowMs = params.nowMs ?? Date.now();
	sweepExpiredAttachGrants(nowMs);
	const grant = {
		token: node_crypto.default.randomBytes(32).toString("hex"),
		sessionKey,
		issuedAtMs: nowMs,
		expiresAtMs: nowMs + clampTtlMs(params.ttlMs)
	};
	grantsByToken.set(grant.token, grant);
	return grant;
}
function resolveAttachGrant(token, nowMs = Date.now()) {
	const grant = grantsByToken.get(token);
	if (!grant) return;
	if (nowMs >= grant.expiresAtMs) {
		grantsByToken.delete(token);
		return;
	}
	return grant;
}
function revokeAttachGrant(token) {
	return grantsByToken.delete(token);
}
/** Revokes every attach grant minted for one session. Returns the count removed. */
function revokeAttachGrantsForSession(sessionKey) {
	const key = sessionKey.trim();
	let removed = 0;
	for (const [token, grant] of grantsByToken) if (grant.sessionKey === key) {
		grantsByToken.delete(token);
		removed += 1;
	}
	return removed;
}
function sweepExpiredAttachGrants(nowMs = Date.now()) {
	let removed = 0;
	for (const [token, grant] of grantsByToken) if (nowMs >= grant.expiresAtMs) {
		grantsByToken.delete(token);
		removed += 1;
	}
	return removed;
}
function mintMcpLoopbackClientGrant(params) {
	const sessionKey = params.context.sessionKey.trim();
	if (!sessionKey) throw new Error("mintMcpLoopbackClientGrant: context.sessionKey is required");
	const runtimeOwnerToken = params.runtimeOwnerToken.trim();
	if (!runtimeOwnerToken) throw new Error("mintMcpLoopbackClientGrant: runtimeOwnerToken is required");
	const grant = {
		token: node_crypto.default.randomBytes(32).toString("hex"),
		context: structuredClone({
			...params.context,
			sessionKey
		}),
		runtimeOwnerToken
	};
	clientGrantsByToken.set(grant.token, grant);
	return structuredClone({
		token: grant.token,
		context: grant.context
	});
}
/** Bind the active execution attempt's capture before its child process starts. */
function activateMcpLoopbackClientGrantCapture(params) {
	const captureKey = params.captureKey.trim();
	if (!captureKey) throw new Error("activateMcpLoopbackClientGrantCapture: captureKey is required");
	const grant = clientGrantsByToken.get(params.token);
	if (!grant || grant.runtimeOwnerToken !== params.runtimeOwnerToken) return false;
	clientGrantsByToken.set(params.token, {
		...grant,
		activeCaptureKey: captureKey
	});
	return true;
}
/** Release only the attempt that still owns this grant's active capture. */
function deactivateMcpLoopbackClientGrantCapture(params) {
	const grant = clientGrantsByToken.get(params.token);
	if (!grant || grant.runtimeOwnerToken !== params.runtimeOwnerToken || grant.activeCaptureKey !== params.captureKey) return false;
	const { activeCaptureKey: _activeCaptureKey, ...inactiveGrant } = grant;
	clientGrantsByToken.set(params.token, inactiveGrant);
	return true;
}
function resolveMcpLoopbackClientGrant(params) {
	const grant = clientGrantsByToken.get(params.token);
	if (!grant || grant.runtimeOwnerToken !== params.runtimeOwnerToken || !grant.activeCaptureKey || grant.activeCaptureKey !== params.captureKey) return;
	return structuredClone({
		context: grant.context,
		captureKey: grant.activeCaptureKey
	});
}
function revokeMcpLoopbackClientGrant(token) {
	return clientGrantsByToken.delete(token);
}
function revokeMcpLoopbackClientGrantsForRuntime(runtimeOwnerToken) {
	let removed = 0;
	for (const [token, grant] of clientGrantsByToken) if (grant.runtimeOwnerToken === runtimeOwnerToken) {
		clientGrantsByToken.delete(token);
		removed += 1;
	}
	return removed;
}
//#endregion
Object.defineProperty(exports, "activateMcpLoopbackClientGrantCapture", {
	enumerable: true,
	get: function() {
		return activateMcpLoopbackClientGrantCapture;
	}
});
Object.defineProperty(exports, "deactivateMcpLoopbackClientGrantCapture", {
	enumerable: true,
	get: function() {
		return deactivateMcpLoopbackClientGrantCapture;
	}
});
Object.defineProperty(exports, "mintAttachGrant", {
	enumerable: true,
	get: function() {
		return mintAttachGrant;
	}
});
Object.defineProperty(exports, "mintMcpLoopbackClientGrant", {
	enumerable: true,
	get: function() {
		return mintMcpLoopbackClientGrant;
	}
});
Object.defineProperty(exports, "resolveAttachGrant", {
	enumerable: true,
	get: function() {
		return resolveAttachGrant;
	}
});
Object.defineProperty(exports, "resolveMcpLoopbackClientGrant", {
	enumerable: true,
	get: function() {
		return resolveMcpLoopbackClientGrant;
	}
});
Object.defineProperty(exports, "revokeAttachGrant", {
	enumerable: true,
	get: function() {
		return revokeAttachGrant;
	}
});
Object.defineProperty(exports, "revokeAttachGrantsForSession", {
	enumerable: true,
	get: function() {
		return revokeAttachGrantsForSession;
	}
});
Object.defineProperty(exports, "revokeMcpLoopbackClientGrant", {
	enumerable: true,
	get: function() {
		return revokeMcpLoopbackClientGrant;
	}
});
Object.defineProperty(exports, "revokeMcpLoopbackClientGrantsForRuntime", {
	enumerable: true,
	get: function() {
		return revokeMcpLoopbackClientGrantsForRuntime;
	}
});
