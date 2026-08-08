//#region src/gateway/server-constants.ts
const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024;
const MAX_BUFFERED_BYTES = 50 * 1024 * 1024;
const MAX_PREAUTH_PAYLOAD_BYTES = 64 * 1024;
const maxChatHistoryMessagesBytes = 6 * 1024 * 1024;
const getMaxChatHistoryMessagesBytes = () => maxChatHistoryMessagesBytes;
const TICK_INTERVAL_MS = 3e4;
const HEALTH_REFRESH_INTERVAL_MS = 6e4;
const DEDUPE_TTL_MS = 5 * 6e4;
const DEDUPE_MAX = 1e3;
//#endregion
Object.defineProperty(exports, "DEDUPE_MAX", {
	enumerable: true,
	get: function() {
		return DEDUPE_MAX;
	}
});
Object.defineProperty(exports, "DEDUPE_TTL_MS", {
	enumerable: true,
	get: function() {
		return DEDUPE_TTL_MS;
	}
});
Object.defineProperty(exports, "HEALTH_REFRESH_INTERVAL_MS", {
	enumerable: true,
	get: function() {
		return HEALTH_REFRESH_INTERVAL_MS;
	}
});
Object.defineProperty(exports, "MAX_BUFFERED_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_BUFFERED_BYTES;
	}
});
Object.defineProperty(exports, "MAX_PAYLOAD_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_PAYLOAD_BYTES;
	}
});
Object.defineProperty(exports, "MAX_PREAUTH_PAYLOAD_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_PREAUTH_PAYLOAD_BYTES;
	}
});
Object.defineProperty(exports, "TICK_INTERVAL_MS", {
	enumerable: true,
	get: function() {
		return TICK_INTERVAL_MS;
	}
});
Object.defineProperty(exports, "getMaxChatHistoryMessagesBytes", {
	enumerable: true,
	get: function() {
		return getMaxChatHistoryMessagesBytes;
	}
});
