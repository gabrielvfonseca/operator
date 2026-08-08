const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
require("@openclaw/proxyline");
//#region src/proxy-capture/paths.ts
function resolveDebugProxyRootDir(env = process.env) {
	return node_path.default.join(require_paths.resolveStateDir(env), "debug-proxy");
}
/** @deprecated Capture storage now lives in the shared state database. */
function resolveDebugProxyDbPath(env = process.env) {
	return node_path.default.join(resolveDebugProxyRootDir(env), "capture.sqlite");
}
/** @deprecated Capture payloads now live in the shared state database. */
function resolveDebugProxyBlobDir(env = process.env) {
	return node_path.default.join(resolveDebugProxyRootDir(env), "blobs");
}
function resolveDebugProxyCertDir(env = process.env) {
	return node_path.default.join(resolveDebugProxyRootDir(env), "certs");
}
//#endregion
//#region src/proxy-capture/env.ts
const OPERATOR_DEBUG_PROXY_ENABLED = "OPERATOR_DEBUG_PROXY_ENABLED";
const OPERATOR_DEBUG_PROXY_URL = "OPERATOR_DEBUG_PROXY_URL";
/** @deprecated Capture storage now lives in the shared state database. */
const OPERATOR_DEBUG_PROXY_DB_PATH = "OPERATOR_DEBUG_PROXY_DB_PATH";
/** @deprecated Capture payloads now live in the shared state database. */
const OPERATOR_DEBUG_PROXY_BLOB_DIR = "OPERATOR_DEBUG_PROXY_BLOB_DIR";
const OPERATOR_DEBUG_PROXY_CERT_DIR = "OPERATOR_DEBUG_PROXY_CERT_DIR";
const OPERATOR_DEBUG_PROXY_SESSION_ID = "OPERATOR_DEBUG_PROXY_SESSION_ID";
const OPERATOR_DEBUG_PROXY_REQUIRE = "OPERATOR_DEBUG_PROXY_REQUIRE";
let cachedImplicitSessionId;
function isTruthy(value) {
	return value === "1" || value === "true" || value === "yes" || value === "on";
}
function resolveDebugProxySettings(env = node_process.default.env) {
	const enabled = isTruthy(env[OPERATOR_DEBUG_PROXY_ENABLED]);
	const sessionId = (env[OPERATOR_DEBUG_PROXY_SESSION_ID]?.trim() || void 0) ?? (cachedImplicitSessionId ??= (0, node_crypto.randomUUID)());
	return {
		enabled,
		required: isTruthy(env[OPERATOR_DEBUG_PROXY_REQUIRE]),
		proxyUrl: env[OPERATOR_DEBUG_PROXY_URL]?.trim() || void 0,
		dbPath: env[OPERATOR_DEBUG_PROXY_DB_PATH]?.trim() || resolveDebugProxyDbPath(env),
		blobDir: env[OPERATOR_DEBUG_PROXY_BLOB_DIR]?.trim() || resolveDebugProxyBlobDir(env),
		certDir: env[OPERATOR_DEBUG_PROXY_CERT_DIR]?.trim() || resolveDebugProxyCertDir(env),
		sessionId,
		sourceProcess: "@gabrielvfonseca/operator"
	};
}
//#endregion
Object.defineProperty(exports, "resolveDebugProxySettings", {
	enumerable: true,
	get: function() {
		return resolveDebugProxySettings;
	}
});
