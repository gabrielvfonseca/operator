let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_buffer = require("node:buffer");
//#region src/infra/ws.ts
function rawDataToString(data, encoding = "utf8") {
	if (Array.isArray(data)) return node_buffer.Buffer.concat(data).toString(encoding);
	return data instanceof ArrayBuffer ? node_buffer.Buffer.from(data).toString(encoding) : data.toString(encoding);
}
function rawDataByteLength(data) {
	return Array.isArray(data) ? data.reduce((total, chunk) => total + chunk.byteLength, 0) : data.byteLength;
}
//#endregion
//#region src/gateway/server/ws-connection/handshake-auth-log-limiter.ts
/** Per-key log limiter that reports suppressed auth attempts on the next emitted log. */
var HandshakeAuthLogLimiter = class {
	constructor(options) {
		this.entries = /* @__PURE__ */ new Map();
		this.intervalMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveIntegerOption)(options?.intervalMs, 3e4, { min: 1 });
		this.maxEntries = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveIntegerOption)(options?.maxEntries, 256, { min: 1 });
	}
	/** Register one auth event key and decide whether it should be logged now. */
	register(key, nowMs = Date.now()) {
		const entry = this.entries.get(key);
		if (!entry) {
			this.pruneIfNeeded();
			this.entries.set(key, {
				lastLoggedAtMs: nowMs,
				suppressedSinceLastLog: 0
			});
			return {
				shouldLog: true,
				suppressedSinceLastLog: 0
			};
		}
		if (nowMs - entry.lastLoggedAtMs < this.intervalMs) {
			entry.suppressedSinceLastLog += 1;
			return {
				shouldLog: false,
				suppressedSinceLastLog: 0
			};
		}
		const suppressedSinceLastLog = entry.suppressedSinceLastLog;
		entry.lastLoggedAtMs = nowMs;
		entry.suppressedSinceLastLog = 0;
		return {
			shouldLog: true,
			suppressedSinceLastLog
		};
	}
	pruneIfNeeded() {
		if (this.entries.size < this.maxEntries) return;
		const oldestKey = this.entries.keys().next().value;
		if (oldestKey !== void 0) this.entries.delete(oldestKey);
	}
};
/** Build the limiter key from auth failure context. */
function buildHandshakeAuthLogKey(params) {
	return [
		params.reason ?? "unknown",
		params.remoteAddr ?? "?",
		params.client ?? "?",
		params.mode ?? "?",
		params.authProvided ?? "?"
	].join("|");
}
/** Return whether a missing-credential failure should use log rate limiting. */
function shouldLimitMissingCredentialAuthLog(params) {
	return params.authProvided === "none" && (params.reason === "token_missing" || params.reason === "password_missing");
}
//#endregion
Object.defineProperty(exports, "HandshakeAuthLogLimiter", {
	enumerable: true,
	get: function() {
		return HandshakeAuthLogLimiter;
	}
});
Object.defineProperty(exports, "buildHandshakeAuthLogKey", {
	enumerable: true,
	get: function() {
		return buildHandshakeAuthLogKey;
	}
});
Object.defineProperty(exports, "rawDataByteLength", {
	enumerable: true,
	get: function() {
		return rawDataByteLength;
	}
});
Object.defineProperty(exports, "rawDataToString", {
	enumerable: true,
	get: function() {
		return rawDataToString;
	}
});
Object.defineProperty(exports, "shouldLimitMissingCredentialAuthLog", {
	enumerable: true,
	get: function() {
		return shouldLimitMissingCredentialAuthLog;
	}
});
