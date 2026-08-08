require("./boundary-path-r6xSCXfB.cjs");
let node_path = require("node:path");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/agents/sandbox/bind-spec.ts
/** Splits a bind spec while preserving Windows drive-letter prefixes in host paths. */
function splitSandboxBindSpec(spec) {
	const separator = getHostContainerSeparatorIndex(spec);
	if (separator === -1) return null;
	const host = spec.slice(0, separator);
	const rest = spec.slice(separator + 1);
	const optionsStart = rest.indexOf(":");
	if (optionsStart === -1) return {
		host,
		container: rest,
		options: ""
	};
	return {
		host,
		container: rest.slice(0, optionsStart),
		options: rest.slice(optionsStart + 1)
	};
}
function getHostContainerSeparatorIndex(spec) {
	const hasDriveLetterPrefix = /^[A-Za-z]:[\\/]/.test(spec);
	for (let i = hasDriveLetterPrefix ? 2 : 0; i < spec.length; i += 1) if (spec[i] === ":") return i;
	return -1;
}
//#endregion
//#region src/agents/sandbox/host-paths.ts
/**
* Host path normalization for sandbox mount policy.
*
* Handles POSIX, Windows drive, and namespace-prefixed paths before policy-key comparison.
*/
function stripWindowsNamespacePrefix(input) {
	if (input.startsWith("\\\\?\\")) {
		const withoutPrefix = input.slice(4);
		if (withoutPrefix.toUpperCase().startsWith("UNC\\")) return `\\\\${withoutPrefix.slice(4)}`;
		return withoutPrefix;
	}
	if (input.startsWith("//?/")) {
		const withoutPrefix = input.slice(4);
		if (withoutPrefix.toUpperCase().startsWith("UNC/")) return `//${withoutPrefix.slice(4)}`;
		return withoutPrefix;
	}
	return input;
}
function isWindowsDriveAbsolutePath(raw) {
	return /^[A-Za-z]:[\\/]/.test(stripWindowsNamespacePrefix(raw.trim()));
}
function isSandboxHostPathAbsolute(raw) {
	const trimmed = stripWindowsNamespacePrefix(raw.trim());
	return trimmed.startsWith("/") || isWindowsDriveAbsolutePath(trimmed);
}
/**
* Normalize a host path: resolve `.`, `..`, collapse `//`, strip trailing `/`.
* Windows drive-letter paths preserve the drive root and uppercase the drive letter.
*/
function normalizeSandboxHostPath(raw) {
	const trimmed = stripWindowsNamespacePrefix(raw.trim());
	if (!trimmed) return "/";
	let normalTrimmed = trimmed.replaceAll("\\", "/");
	if (isWindowsDriveAbsolutePath(normalTrimmed)) normalTrimmed = normalTrimmed.charAt(0).toUpperCase() + normalTrimmed.slice(1);
	const withoutTrailingSlash = node_path.posix.normalize(normalTrimmed).replace(/\/+$/, "") || "/";
	if (/^[A-Z]:$/.test(withoutTrailingSlash)) return `${withoutTrailingSlash}/`;
	return withoutTrailingSlash;
}
function getSandboxHostPathPolicyKey(raw) {
	const normalized = normalizeSandboxHostPath(raw);
	if (isWindowsDriveAbsolutePath(normalized)) return normalized.toLowerCase();
	return normalized;
}
/**
* Resolve a path through the deepest existing ancestor so parent symlinks are honored
* even when the final source leaf does not exist yet.
*/
function resolveSandboxHostPathViaExistingAncestor(sourcePath) {
	if (!isSandboxHostPathAbsolute(sourcePath)) return sourcePath;
	if (isWindowsDriveAbsolutePath(sourcePath) && process.platform !== "win32") return normalizeSandboxHostPath(sourcePath);
	return normalizeSandboxHostPath((0, _openclaw_fs_safe_advanced.resolvePathViaExistingAncestorSync)(sourcePath));
}
//#endregion
//#region src/agents/sandbox/network-mode.ts
/**
* Docker network mode safety helpers.
*
* Flags host networking and container namespace joins because they bypass normal sandbox network isolation.
*/
/** Normalizes optional Docker network mode strings for policy checks. */
function normalizeNetworkMode(network) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(network) || void 0;
}
/** Returns the concrete block reason for dangerous network modes, if blocked. */
function getBlockedNetworkModeReason(params) {
	const normalized = normalizeNetworkMode(params.network);
	if (!normalized) return null;
	if (normalized === "host") return "host";
	if (normalized.startsWith("container:") && params.allowContainerNamespaceJoin !== true) return "container_namespace_join";
	return null;
}
/** Returns whether a network mode weakens sandbox network isolation. */
function isDangerousNetworkMode(network) {
	const normalized = normalizeNetworkMode(network);
	return normalized === "host" || normalized?.startsWith("container:") === true;
}
//#endregion
Object.defineProperty(exports, "getBlockedNetworkModeReason", {
	enumerable: true,
	get: function() {
		return getBlockedNetworkModeReason;
	}
});
Object.defineProperty(exports, "getSandboxHostPathPolicyKey", {
	enumerable: true,
	get: function() {
		return getSandboxHostPathPolicyKey;
	}
});
Object.defineProperty(exports, "isDangerousNetworkMode", {
	enumerable: true,
	get: function() {
		return isDangerousNetworkMode;
	}
});
Object.defineProperty(exports, "isSandboxHostPathAbsolute", {
	enumerable: true,
	get: function() {
		return isSandboxHostPathAbsolute;
	}
});
Object.defineProperty(exports, "normalizeNetworkMode", {
	enumerable: true,
	get: function() {
		return normalizeNetworkMode;
	}
});
Object.defineProperty(exports, "normalizeSandboxHostPath", {
	enumerable: true,
	get: function() {
		return normalizeSandboxHostPath;
	}
});
Object.defineProperty(exports, "resolveSandboxHostPathViaExistingAncestor", {
	enumerable: true,
	get: function() {
		return resolveSandboxHostPathViaExistingAncestor;
	}
});
Object.defineProperty(exports, "splitSandboxBindSpec", {
	enumerable: true,
	get: function() {
		return splitSandboxBindSpec;
	}
});
