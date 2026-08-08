const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
require("./errors-BqS4bzom.cjs");
require("./net-CakPoh2E.cjs");
require("./fetch-guard-D5DTj23w.cjs");
//#region src/plugin-sdk/ssrf-policy.ts
function normalizeHostnameSuffix(value) {
	const trimmed = require_string_coerce.normalizeLowercaseStringOrEmpty(value);
	if (!trimmed) return "";
	if (trimmed === "*" || trimmed === "*.") return "*";
	return trimmed.replace(/^\*\.?/, "").replace(/^\.+/, "").replace(/\.+$/, "");
}
function isHostnameAllowedBySuffixAllowlist(hostname, allowlist) {
	if (allowlist.includes("*")) return true;
	const normalized = require_string_coerce.normalizeLowercaseStringOrEmpty(hostname);
	return allowlist.some((entry) => normalized === entry || normalized.endsWith(`.${entry}`));
}
/** Normalize suffix-style host allowlists into lowercase canonical entries with wildcard collapse. */
function normalizeHostnameSuffixAllowlist(input, defaults) {
	const source = input && input.length > 0 ? input : defaults;
	if (!source || source.length === 0) return [];
	const normalized = require_string_normalization.normalizeUniqueStringEntries(source.map(normalizeHostnameSuffix));
	if (normalized.includes("*")) return ["*"];
	return normalized;
}
/** Check whether a URL is HTTPS and its hostname matches the normalized suffix allowlist. */
function isHttpsUrlAllowedByHostnameSuffixAllowlist(url, allowlist) {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:") return false;
		return isHostnameAllowedBySuffixAllowlist(parsed.hostname, allowlist);
	} catch {
		return false;
	}
}
/**
* Converts suffix-style host allowlists (for example "example.com") into SSRF
* hostname allowlist patterns used by the shared fetch guard.
*
* Suffix semantics:
* - "example.com" allows "example.com" and "*.example.com"
* - "*" disables hostname allowlist restrictions
*/
function buildHostnameAllowlistPolicyFromSuffixAllowlist(allowHosts) {
	const normalizedAllowHosts = normalizeHostnameSuffixAllowlist(allowHosts);
	if (normalizedAllowHosts.length === 0) return;
	const patterns = /* @__PURE__ */ new Set();
	for (const normalized of normalizedAllowHosts) {
		if (normalized === "*") return;
		patterns.add(normalized);
		patterns.add(`*.${normalized}`);
	}
	if (patterns.size === 0) return;
	return { hostnameAllowlist: Array.from(patterns) };
}
//#endregion
Object.defineProperty(exports, "buildHostnameAllowlistPolicyFromSuffixAllowlist", {
	enumerable: true,
	get: function() {
		return buildHostnameAllowlistPolicyFromSuffixAllowlist;
	}
});
Object.defineProperty(exports, "isHttpsUrlAllowedByHostnameSuffixAllowlist", {
	enumerable: true,
	get: function() {
		return isHttpsUrlAllowedByHostnameSuffixAllowlist;
	}
});
Object.defineProperty(exports, "normalizeHostnameSuffixAllowlist", {
	enumerable: true,
	get: function() {
		return normalizeHostnameSuffixAllowlist;
	}
});
