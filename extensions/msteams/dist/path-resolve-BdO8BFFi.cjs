const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/auth-profiles/clone.ts
/** Deep-clones an auth profile store and rejects non-JSON values. */
function cloneAuthProfileStore(store) {
	return JSON.parse(JSON.stringify(store, (_key, value) => {
		if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") throw new TypeError(`AuthProfileStore contains non-JSON value: ${typeof value}`);
		return value;
	}));
}
//#endregion
//#region src/agents/auth-profiles/path-constants.ts
/** Canonical JSON auth profile filename retained for direct file compatibility. */
const AUTH_PROFILE_FILENAME = "auth-profiles.json";
/** Canonical JSON auth runtime state filename retained for direct file compatibility. */
const AUTH_STATE_FILENAME = "auth-state.json";
/** Legacy auth filename migrated into the auth profile store. */
const LEGACY_AUTH_FILENAME = "auth.json";
//#endregion
//#region src/agents/auth-profiles/path-resolve.ts
/**
* Auth profile path resolution.
* Centralizes JSON store paths, display paths, legacy store paths, auth-state
* paths, and cross-agent OAuth refresh lock paths.
*/
/** Resolve the persisted auth profile store path for an agent dir. */
function resolveAuthStorePath(agentDir) {
	const resolved = require_home_dir.resolveUserPath(agentDir ?? require_agent_scope_config.resolveDefaultAgentDir({}));
	return node_path.default.join(resolved, AUTH_PROFILE_FILENAME);
}
/** Resolve the legacy auth store path used by migration code. */
function resolveLegacyAuthStorePath(agentDir) {
	const resolved = require_home_dir.resolveUserPath(agentDir ?? require_agent_scope_config.resolveDefaultAgentDir({}));
	return node_path.default.join(resolved, LEGACY_AUTH_FILENAME);
}
/** Resolve the auth-state sidecar path for usage/cooldown metadata. */
function resolveAuthStatePath(agentDir) {
	const resolved = require_home_dir.resolveUserPath(agentDir ?? require_agent_scope_config.resolveDefaultAgentDir({}));
	return node_path.default.join(resolved, AUTH_STATE_FILENAME);
}
/** Resolve the user-facing auth profile database path. */
function resolveAuthStorePathForDisplay(agentDir) {
	const pathname = require_sqlite.resolveAuthProfileDatabasePath(agentDir);
	return pathname.startsWith("~") ? pathname : require_home_dir.resolveUserPath(pathname);
}
/** Resolve the user-facing auth state database path. */
function resolveAuthStatePathForDisplay(agentDir) {
	const pathname = require_sqlite.resolveAuthProfileDatabasePath(agentDir);
	return pathname.startsWith("~") ? pathname : require_home_dir.resolveUserPath(pathname);
}
/**
* Resolve the path of the cross-agent, per-profile OAuth refresh coordination
* lock. The filename digests a JSON tuple of `[provider, profileId]` so it is
* filesystem-safe for arbitrary unicode/control-character inputs and always
* bounded in length. Tuple encoding makes it impossible to collide two distinct
* `(provider, profileId)` pairs by separator-sensitive string concatenation.
*
* This lock is the serialization point that prevents the `refresh_token_reused`
* storm when N agents share one OAuth profile (see issue #26322): every agent
* that attempts a refresh acquires this same file lock, so only one HTTP
* refresh is in-flight at a time and peers can adopt the resulting fresh
* credentials instead of racing against a single-use refresh token.
*
* The key intentionally includes `provider` so that two profiles that
* happen to share a `profileId` across providers (operator-renamed profile,
* test fixture, etc.) do not needlessly serialize against each other.
*/
function resolveOAuthRefreshLockPath(provider, profileId) {
	const safeId = `lock-${oauthLockPathDigest(JSON.stringify([provider, profileId]))}`;
	return node_path.default.join(require_paths.resolveStateDir(), "locks", "oauth-refresh", safeId);
}
function oauthLockPathDigest(value) {
	let left = 14695981039346656037n;
	let right = 11160318154034397263n;
	const prime = 1099511628211n;
	const mask = 18446744073709551615n;
	for (const byte of Buffer.from(value, "utf8")) {
		const octet = BigInt(byte);
		left = (left ^ octet) * prime & mask;
		right = (right ^ octet + 11400714819323198485n) * prime & mask;
	}
	return `${left.toString(16).padStart(16, "0")}${right.toString(16).padStart(16, "0")}`;
}
//#endregion
Object.defineProperty(exports, "AUTH_PROFILE_FILENAME", {
	enumerable: true,
	get: function() {
		return AUTH_PROFILE_FILENAME;
	}
});
Object.defineProperty(exports, "AUTH_STATE_FILENAME", {
	enumerable: true,
	get: function() {
		return AUTH_STATE_FILENAME;
	}
});
Object.defineProperty(exports, "LEGACY_AUTH_FILENAME", {
	enumerable: true,
	get: function() {
		return LEGACY_AUTH_FILENAME;
	}
});
Object.defineProperty(exports, "cloneAuthProfileStore", {
	enumerable: true,
	get: function() {
		return cloneAuthProfileStore;
	}
});
Object.defineProperty(exports, "resolveAuthStatePath", {
	enumerable: true,
	get: function() {
		return resolveAuthStatePath;
	}
});
Object.defineProperty(exports, "resolveAuthStatePathForDisplay", {
	enumerable: true,
	get: function() {
		return resolveAuthStatePathForDisplay;
	}
});
Object.defineProperty(exports, "resolveAuthStorePath", {
	enumerable: true,
	get: function() {
		return resolveAuthStorePath;
	}
});
Object.defineProperty(exports, "resolveAuthStorePathForDisplay", {
	enumerable: true,
	get: function() {
		return resolveAuthStorePathForDisplay;
	}
});
Object.defineProperty(exports, "resolveLegacyAuthStorePath", {
	enumerable: true,
	get: function() {
		return resolveLegacyAuthStorePath;
	}
});
Object.defineProperty(exports, "resolveOAuthRefreshLockPath", {
	enumerable: true,
	get: function() {
		return resolveOAuthRefreshLockPath;
	}
});
