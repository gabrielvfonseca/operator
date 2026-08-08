const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
require("./errors-BqS4bzom.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_fetch_timeout = require("./fetch-timeout-C6HLIptD.cjs");
const require_active_proxy_state = require("./active-proxy-state-IFfwIaiY.cjs");
const require_hostname = require("./hostname-C4OpmN1p.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
let node_dns = require("node:dns");
let node_dns_promises = require("node:dns/promises");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/infra/fetch-headers.ts
function isHeadersLike(value) {
	if (typeof Headers !== "undefined" && value instanceof Headers) return true;
	const candidate = value;
	return typeof candidate.entries === "function" && typeof candidate.get === "function" && typeof candidate[Symbol.iterator] === "function";
}
/** Normalizes HeadersInit records so fetch receives only string-keyed header properties. */
function normalizeHeadersInitForFetch(headers) {
	if (!headers || typeof headers !== "object" || Array.isArray(headers) || isHeadersLike(headers)) return headers;
	if (Object.getOwnPropertySymbols(headers).length === 0) return headers;
	const normalized = Object.create(null);
	const headerRecord = headers;
	for (const key of Object.getOwnPropertyNames(headerRecord)) normalized[key] = String(headerRecord[key]);
	return normalized;
}
/** Normalizes request init headers without cloning the init object when no change is needed. */
function normalizeRequestInitHeadersForFetch(init) {
	if (!init?.headers) return init;
	const headers = normalizeHeadersInitForFetch(init.headers);
	if (headers === init.headers) return init;
	return {
		...init,
		headers
	};
}
//#endregion
//#region src/infra/net/ssrf.ts
const DISPATCHER_CLOSE_TIMEOUT_MS = 100;
var SsrFBlockedError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "SsrFBlockedError";
	}
};
function normalizeSsrFPolicyHostnames(values) {
	return normalizePolicyHostnames(values).toSorted();
}
function normalizePolicyHostnames(values) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(values?.map((value) => require_hostname.normalizeHostname(value)));
}
function normalizeSsrFPolicyForComparison(policy) {
	if (!policy) return null;
	return {
		allowPrivateNetwork: policy.allowPrivateNetwork === true,
		dangerouslyAllowPrivateNetwork: policy.dangerouslyAllowPrivateNetwork === true,
		allowRfc2544BenchmarkRange: policy.allowRfc2544BenchmarkRange === true,
		allowIpv6UniqueLocalRange: policy.allowIpv6UniqueLocalRange === true,
		allowedHostnames: normalizeSsrFPolicyHostnames(policy.allowedHostnames),
		allowedOrigins: normalizeSsrFPolicyOrigins(policy.allowedOrigins),
		hostnameAllowlist: [...normalizeHostnameAllowlist(policy.hostnameAllowlist)].toSorted()
	};
}
function isSameSsrFPolicy(a, b) {
	return JSON.stringify(normalizeSsrFPolicyForComparison(a)) === JSON.stringify(normalizeSsrFPolicyForComparison(b));
}
function mergeSsrFPolicies(...policies) {
	const merged = {};
	for (const policy of policies) {
		if (!policy) continue;
		if (policy.allowPrivateNetwork) merged.allowPrivateNetwork = true;
		if (policy.dangerouslyAllowPrivateNetwork) merged.dangerouslyAllowPrivateNetwork = true;
		if (policy.allowRfc2544BenchmarkRange) merged.allowRfc2544BenchmarkRange = true;
		if (policy.allowIpv6UniqueLocalRange) merged.allowIpv6UniqueLocalRange = true;
		if (policy.allowedHostnames?.length) merged.allowedHostnames = Array.from(/* @__PURE__ */ new Set([...merged.allowedHostnames ?? [], ...policy.allowedHostnames]));
		if (policy.allowedOrigins?.length) merged.allowedOrigins = Array.from(/* @__PURE__ */ new Set([...merged.allowedOrigins ?? [], ...policy.allowedOrigins]));
		if (policy.hostnameAllowlist?.length) merged.hostnameAllowlist = Array.from(/* @__PURE__ */ new Set([...merged.hostnameAllowlist ?? [], ...policy.hostnameAllowlist]));
	}
	return Object.keys(merged).length > 0 ? merged : void 0;
}
function ssrfPolicyFromHttpBaseUrlAllowedHostname(baseUrl) {
	const trimmed = baseUrl.trim();
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		return { allowedHostnames: [parsed.hostname] };
	} catch {
		return;
	}
}
function normalizeSsrFPolicyOrigin(value) {
	const trimmed = value.trim();
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		parsed.hostname = parsed.hostname.replace(/\.+$/, "");
		return parsed.origin.toLowerCase();
	} catch {
		return;
	}
}
function normalizeSsrFPolicyOrigins(values) {
	if (!values || values.length === 0) return [];
	return Array.from(new Set(values.map((value) => normalizeSsrFPolicyOrigin(value)).filter((value) => Boolean(value)))).toSorted();
}
function ssrfPolicyFromHttpBaseUrlAllowedOrigin(baseUrl) {
	const origin = normalizeSsrFPolicyOrigin(baseUrl);
	return origin ? { allowedOrigins: [origin] } : void 0;
}
function ssrfPolicyFromHttpBaseUrlFakeIpHostnameAllowlist(baseUrl) {
	const trimmed = baseUrl.trim();
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		return {
			allowRfc2544BenchmarkRange: true,
			allowIpv6UniqueLocalRange: true,
			hostnameAllowlist: [parsed.hostname]
		};
	} catch {
		return;
	}
}
const BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
	"localhost",
	"localhost.localdomain",
	"metadata.google.internal"
]);
function normalizeHostnameSet(values) {
	return new Set(normalizePolicyHostnames(values));
}
function normalizeHostnameAllowlist(values) {
	return normalizePolicyHostnames(values).filter((value) => value !== "*" && value !== "*.");
}
function isPrivateNetworkAllowedByPolicy(policy) {
	return policy?.dangerouslyAllowPrivateNetwork === true || policy?.allowPrivateNetwork === true;
}
function shouldSkipPrivateNetworkChecks(hostname, policy) {
	return isPrivateNetworkAllowedByPolicy(policy) || normalizeHostnameSet(policy?.allowedHostnames).has(hostname);
}
function resolveSsrFPolicyForUrl(url, policy) {
	if (!policy?.allowedOrigins?.length) return policy;
	const requestOrigin = normalizeSsrFPolicyOrigin(url.toString());
	if (!requestOrigin || !normalizeSsrFPolicyOrigins(policy.allowedOrigins).includes(requestOrigin)) return policy;
	return {
		...policy,
		allowedHostnames: Array.from(/* @__PURE__ */ new Set([...policy.allowedHostnames ?? [], require_hostname.normalizeHostname(url.hostname)]))
	};
}
function resolveIpv4SpecialUseBlockOptions(policy) {
	return { allowRfc2544BenchmarkRange: policy?.allowRfc2544BenchmarkRange === true };
}
function resolveIpv6SpecialUseBlockOptions(policy) {
	return { allowUniqueLocalRange: policy?.allowIpv6UniqueLocalRange === true };
}
function isHostnameAllowedByPattern(hostname, pattern) {
	if (pattern.startsWith("*.")) {
		const suffix = pattern.slice(2);
		if (!suffix || hostname === suffix) return false;
		return hostname.endsWith(`.${suffix}`);
	}
	return hostname === pattern;
}
function matchesHostnameAllowlist(hostname, allowlist) {
	if (allowlist.length === 0) return true;
	return allowlist.some((pattern) => isHostnameAllowedByPattern(hostname, pattern));
}
function looksLikeUnsupportedIpv4Literal(address) {
	const parts = address.split(".");
	if (parts.length === 0 || parts.length > 4) return false;
	if (parts.some((part) => part.length === 0)) return true;
	return parts.every((part) => /^[0-9]+$/.test(part) || /^0x/i.test(part));
}
function isPrivateIpAddress(address, policy) {
	const normalized = require_hostname.normalizeHostname(address);
	if (!normalized) return false;
	const blockOptions = resolveIpv4SpecialUseBlockOptions(policy);
	const ipv6BlockOptions = resolveIpv6SpecialUseBlockOptions(policy);
	const strictIp = (0, _gabrielvfonseca_net_policy_ip.parseCanonicalIpAddress)(normalized);
	if (strictIp) {
		if ((0, _gabrielvfonseca_net_policy_ip.isIpv4Address)(strictIp)) return (0, _gabrielvfonseca_net_policy_ip.isBlockedSpecialUseIpv4Address)(strictIp, blockOptions);
		if ((0, _gabrielvfonseca_net_policy_ip.isBlockedSpecialUseIpv6Address)(strictIp, ipv6BlockOptions)) return true;
		const embeddedIpv4 = (0, _gabrielvfonseca_net_policy_ip.extractEmbeddedIpv4FromIpv6)(strictIp);
		if (embeddedIpv4) return (0, _gabrielvfonseca_net_policy_ip.isBlockedSpecialUseIpv4Address)(embeddedIpv4, blockOptions);
		return false;
	}
	if (normalized.includes(":") && !(0, _gabrielvfonseca_net_policy_ip.parseLooseIpAddress)(normalized)) return true;
	if (!(0, _gabrielvfonseca_net_policy_ip.isCanonicalDottedDecimalIPv4)(normalized) && (0, _gabrielvfonseca_net_policy_ip.isLegacyIpv4Literal)(normalized)) return true;
	if (looksLikeUnsupportedIpv4Literal(normalized)) return true;
	return false;
}
function isBlockedHostnameNormalized(normalized) {
	if (BLOCKED_HOSTNAMES.has(normalized)) return true;
	return normalized.endsWith(".localhost") || normalized.endsWith(".local") || normalized.endsWith(".internal");
}
function isBlockedHostnameOrIp(hostname, policy) {
	const normalized = require_hostname.normalizeHostname(hostname);
	if (!normalized) return false;
	return isBlockedHostnameNormalized(normalized) || isPrivateIpAddress(normalized, policy);
}
const BLOCKED_HOST_OR_IP_MESSAGE = "Blocked hostname or private/internal/special-use IP address";
const BLOCKED_RESOLVED_IP_MESSAGE = "Blocked: resolves to private/internal/special-use IP address";
function assertAllowedHostOrIpOrThrow(hostnameOrIp, policy) {
	if (isBlockedHostnameOrIp(hostnameOrIp, policy)) throw new SsrFBlockedError(BLOCKED_HOST_OR_IP_MESSAGE);
}
function resolveHostnamePolicyChecks(hostname, policy) {
	const normalized = require_hostname.normalizeHostname(hostname);
	if (!normalized) throw new Error("Invalid hostname");
	const hostnameAllowlist = normalizeHostnameAllowlist(policy?.hostnameAllowlist);
	const skipPrivateNetworkChecks = shouldSkipPrivateNetworkChecks(normalized, policy);
	if (!matchesHostnameAllowlist(normalized, hostnameAllowlist)) throw new SsrFBlockedError(`Blocked hostname (not in allowlist): ${hostname}`);
	if (!skipPrivateNetworkChecks) assertAllowedHostOrIpOrThrow(normalized, policy);
	return {
		normalized,
		skipPrivateNetworkChecks
	};
}
function assertAllowedResolvedAddressesOrThrow(results, policy) {
	for (const entry of results) if (isBlockedHostnameOrIp(entry.address, policy)) throw new SsrFBlockedError(BLOCKED_RESOLVED_IP_MESSAGE);
}
function isLoopbackIpAddressIncludingEmbeddedIpv4(address) {
	if ((0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(address)) return true;
	const parsed = (0, _gabrielvfonseca_net_policy_ip.parseCanonicalIpAddress)(address);
	if (!parsed || (0, _gabrielvfonseca_net_policy_ip.isIpv4Address)(parsed)) return false;
	return (0, _gabrielvfonseca_net_policy_ip.extractEmbeddedIpv4FromIpv6)(parsed)?.range() === "loopback";
}
function isUnspecifiedIpAddressIncludingEmbeddedIpv4(address) {
	const parsed = (0, _gabrielvfonseca_net_policy_ip.parseCanonicalIpAddress)(address);
	if (!parsed) return false;
	if ((0, _gabrielvfonseca_net_policy_ip.isIpv4Address)(parsed)) return parsed.range() === "unspecified";
	if (parsed.range() === "unspecified") return true;
	if (parsed.range() === "loopback") return false;
	return (0, _gabrielvfonseca_net_policy_ip.extractEmbeddedIpv4FromIpv6)(parsed)?.range() === "unspecified";
}
function isExplicitLoopbackHostname(hostname) {
	return hostname === "localhost" || hostname === "localhost.localdomain" || hostname.endsWith(".localhost") || isLoopbackIpAddressIncludingEmbeddedIpv4(hostname);
}
function assertAllowedTrustedHostnameResolvedAddressesOrThrow(results, hostname) {
	const isLoopbackAllowed = isExplicitLoopbackHostname(hostname);
	for (const entry of results) if (isUnspecifiedIpAddressIncludingEmbeddedIpv4(entry.address) || !isLoopbackAllowed && isLoopbackIpAddressIncludingEmbeddedIpv4(entry.address) || (0, _gabrielvfonseca_net_policy_ip.isLinkLocalIpAddress)(entry.address) || (0, _gabrielvfonseca_net_policy_ip.isCloudMetadataIpAddress)(entry.address)) throw new SsrFBlockedError(BLOCKED_RESOLVED_IP_MESSAGE);
}
function normalizeLookupResults(results) {
	if (Array.isArray(results)) return results;
	return [results];
}
function createPinnedLookup(params) {
	const normalizedHost = require_hostname.normalizeHostname(params.hostname);
	if (params.addresses.length === 0) throw new Error(`Pinned lookup requires at least one address for ${params.hostname}`);
	const fallback = params.fallback ?? node_dns.lookup;
	const fallbackLookup = fallback;
	const fallbackWithOptions = fallback;
	const records = params.addresses.map((address) => ({
		address,
		family: address.includes(":") ? 6 : 4
	}));
	const ipv4Records = records.filter((entry) => entry.family === 4);
	const automaticRecords = ipv4Records.length > 0 ? ipv4Records : records;
	let index = 0;
	return ((host, options, callback) => {
		const cb = typeof options === "function" ? options : callback;
		if (!cb) return;
		const normalized = require_hostname.normalizeHostname(host);
		if (!normalized || normalized !== normalizedHost) {
			if (typeof options === "function" || options === void 0) return fallbackLookup(host, cb);
			return fallbackWithOptions(host, options, cb);
		}
		const opts = typeof options === "object" && options !== null ? options : {};
		const requestedFamily = typeof options === "number" ? options : typeof opts.family === "number" ? opts.family : 0;
		const candidates = requestedFamily === 4 || requestedFamily === 6 ? records.filter((entry) => entry.family === requestedFamily) : automaticRecords;
		const usable = candidates.length > 0 ? candidates : automaticRecords;
		if (opts.all) {
			cb(null, usable);
			return;
		}
		const chosen = (0, _gabrielvfonseca_normalization_core.expectDefined)(usable[index % usable.length], "usable entry at index % usable.length");
		index += 1;
		cb(null, chosen.address, chosen.family);
	});
}
function dedupeAndPreferIpv4(results) {
	const seen = /* @__PURE__ */ new Set();
	const ipv4 = [];
	const otherFamilies = [];
	for (const entry of results) {
		if (seen.has(entry.address)) continue;
		seen.add(entry.address);
		if (entry.family === 4) {
			ipv4.push(entry.address);
			continue;
		}
		otherFamilies.push(entry.address);
	}
	return [...ipv4, ...otherFamilies];
}
async function resolvePinnedHostnameWithPolicy(hostname, params = {}) {
	const { normalized, skipPrivateNetworkChecks } = resolveHostnamePolicyChecks(hostname, params.policy);
	const results = normalizeLookupResults(await (params.lookupFn ?? node_dns_promises.lookup)(normalized, { all: true }));
	if (results.length === 0) throw new Error(`Unable to resolve hostname: ${hostname}`);
	if (!skipPrivateNetworkChecks) assertAllowedResolvedAddressesOrThrow(results, params.policy);
	else if (!isPrivateNetworkAllowedByPolicy(params.policy)) assertAllowedTrustedHostnameResolvedAddressesOrThrow(results, normalized);
	const addresses = dedupeAndPreferIpv4(results);
	if (addresses.length === 0) throw new Error(`Unable to resolve hostname: ${hostname}`);
	return {
		hostname: normalized,
		addresses,
		lookup: createPinnedLookup({
			hostname: normalized,
			addresses
		})
	};
}
function assertHostnameAllowedWithPolicy(hostname, policy) {
	return resolveHostnamePolicyChecks(hostname, policy).normalized;
}
async function resolvePinnedHostname(hostname, lookupFn = node_dns_promises.lookup) {
	return await resolvePinnedHostnameWithPolicy(hostname, { lookupFn });
}
function withPinnedLookup(lookup, connect) {
	return connect ? {
		...connect,
		lookup
	} : { lookup };
}
function resolvePinnedDispatcherLookup(pinned, override, policy) {
	if (!override) return pinned.lookup;
	const normalizedOverrideHost = require_hostname.normalizeHostname(override.hostname);
	if (!normalizedOverrideHost || normalizedOverrideHost !== pinned.hostname) throw new Error(`Pinned dispatcher override hostname mismatch: expected ${pinned.hostname}, got ${override.hostname}`);
	const records = override.addresses.map((address) => ({
		address,
		family: address.includes(":") ? 6 : 4
	}));
	if (!shouldSkipPrivateNetworkChecks(pinned.hostname, policy)) assertAllowedResolvedAddressesOrThrow(records, policy);
	else if (!isPrivateNetworkAllowedByPolicy(policy)) assertAllowedTrustedHostnameResolvedAddressesOrThrow(records, pinned.hostname);
	return createPinnedLookup({
		hostname: pinned.hostname,
		addresses: [...override.addresses],
		fallback: pinned.lookup
	});
}
function createPinnedDispatcher(pinned, policy, ssrfPolicy, timeoutMs) {
	const lookup = resolvePinnedDispatcherLookup(pinned, policy?.pinnedHostname, ssrfPolicy);
	if (!policy || policy.mode === "direct") return require_undici_global_dispatcher.createHttp1Agent({ connect: withPinnedLookup(lookup, policy?.connect) }, timeoutMs);
	if (policy.mode === "env-proxy") return require_undici_global_dispatcher.createHttp1EnvHttpProxyAgent({
		connect: withPinnedLookup(lookup, policy.connect),
		...policy.proxyTls ? { proxyTls: { ...policy.proxyTls } } : {}
	}, timeoutMs);
	const proxyUrl = policy.proxyUrl.trim();
	const requestTls = withPinnedLookup(lookup, policy.proxyTls);
	if (!requestTls) return require_undici_global_dispatcher.createHttp1ProxyAgent({ uri: proxyUrl }, timeoutMs);
	return require_undici_global_dispatcher.createHttp1ProxyAgent({
		uri: proxyUrl,
		requestTls
	}, timeoutMs);
}
function destroyDispatcher(candidate) {
	try {
		candidate.destroy?.();
	} catch {}
}
async function waitForDispatcherClose(candidate) {
	const close = candidate.close;
	if (typeof close !== "function") {
		destroyDispatcher(candidate);
		return;
	}
	let timeout;
	try {
		await Promise.race([Promise.resolve(close.call(candidate)), new Promise((resolve) => {
			timeout = setTimeout(() => {
				timeout = void 0;
				destroyDispatcher(candidate);
				resolve();
			}, DISPATCHER_CLOSE_TIMEOUT_MS);
			timeout.unref?.();
		})]);
	} catch (err) {
		destroyDispatcher(candidate);
		throw err;
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
async function closeDispatcher(dispatcher) {
	if (!dispatcher) return;
	const candidate = dispatcher;
	try {
		await waitForDispatcherClose(candidate);
	} catch {}
}
//#endregion
//#region src/infra/net/configured-local-origin-bypass.ts
function resolveHttpOrigin(value) {
	try {
		const parsed = new URL(value.trim());
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		parsed.hostname = parsed.hostname.replace(/\.+$/, "");
		return parsed.origin.toLowerCase();
	} catch {
		return;
	}
}
function isLoopbackManagedProxyBypassHost(hostname) {
	const normalized = hostname.trim().toLowerCase().replace(/\.+$/, "").replace(/^\[(.*)\]$/, "$1");
	return normalized === "localhost" || (0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(normalized);
}
function isExactConfiguredLocalOriginBypass(params) {
	if (params.managedProxyBypass?.kind !== "configured-local-origin") return false;
	const baseOrigin = resolveHttpOrigin(params.managedProxyBypass.baseUrl);
	if (!baseOrigin) return false;
	let baseHostname;
	try {
		baseHostname = new URL(params.managedProxyBypass.baseUrl.trim()).hostname;
	} catch {
		return false;
	}
	if (!isLoopbackManagedProxyBypassHost(baseHostname)) return false;
	return resolveHttpOrigin(params.url.toString()) === baseOrigin;
}
function isPinnedLoopbackTarget(addresses) {
	return addresses.length > 0 && addresses.every((address) => (0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(address));
}
/** Return whether proving a configured local-origin bypass requires target DNS. */
function shouldResolveConfiguredLocalOriginManagedProxyBypass(params) {
	return isExactConfiguredLocalOriginBypass(params);
}
/** Return whether a configured local provider origin may bypass the managed proxy. */
function shouldUseConfiguredLocalOriginManagedProxyBypass(params) {
	if (!isExactConfiguredLocalOriginBypass(params)) return false;
	const loopbackMode = require_active_proxy_state.getActiveManagedProxyLoopbackMode();
	if (loopbackMode === "proxy") return false;
	if (loopbackMode === "block" && isLoopbackManagedProxyBypassHost(params.url.hostname)) throw new SsrFBlockedError("proxy: configured local provider loopback connections are blocked by proxy.loopbackMode");
	return isPinnedLoopbackTarget(params.resolvedAddresses);
}
//#endregion
//#region src/infra/net/redirect-headers.ts
const CROSS_ORIGIN_REDIRECT_SAFE_HEADERS = /* @__PURE__ */ new Set([
	"accept",
	"accept-encoding",
	"accept-language",
	"cache-control",
	"content-language",
	"content-type",
	"if-match",
	"if-modified-since",
	"if-none-match",
	"if-unmodified-since",
	"pragma",
	"range",
	"user-agent"
]);
/**
* Keeps only headers that are safe to replay after a redirect crosses origins.
* Authorization/cookie-like metadata must be dropped before the follow-up fetch.
*/
function retainSafeHeadersForCrossOriginRedirect$1(headers) {
	if (!headers) return headers;
	const incoming = new Headers(normalizeHeadersInitForFetch(headers));
	const safeHeaders = {};
	for (const [key, value] of incoming.entries()) if (CROSS_ORIGIN_REDIRECT_SAFE_HEADERS.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key))) safeHeaders[key] = value;
	return safeHeaders;
}
//#endregion
//#region src/infra/net/form-data.ts
function isFormDataLike(value) {
	return typeof value === "object" && value !== null && typeof value.entries === "function" && value[Symbol.toStringTag] === "FormData";
}
//#endregion
//#region src/infra/net/runtime-fetch.ts
function normalizeRuntimeFormData(body, RuntimeFormData) {
	if (!isFormDataLike(body) || typeof RuntimeFormData !== "function") return body;
	if (body instanceof RuntimeFormData) return body;
	const next = new RuntimeFormData();
	for (const [key, value] of body.entries()) {
		const namedValue = value;
		const fileName = typeof namedValue.name === "string" && namedValue.name.trim() ? namedValue.name : void 0;
		if (fileName) next.append(key, value, fileName);
		else next.append(key, value);
	}
	return next;
}
function normalizeRuntimeRequestInit(init, RuntimeFormData) {
	if (!init) return init;
	const normalizedHeaders = normalizeHeadersInitForFetch(init.headers);
	const initWithNormalizedHeaders = normalizedHeaders === init.headers ? init : {
		...init,
		headers: normalizedHeaders
	};
	if (!init.body) return initWithNormalizedHeaders;
	const body = normalizeRuntimeFormData(init.body, RuntimeFormData);
	if (body === init.body) return initWithNormalizedHeaders;
	const headers = new Headers(normalizedHeaders);
	headers.delete("content-length");
	headers.delete("content-type");
	return {
		...initWithNormalizedHeaders,
		headers,
		body
	};
}
/** Returns true for Vitest-style mocked fetch functions that should stay injectable. */
function isMockedFetch(fetchImpl) {
	if (typeof fetchImpl !== "function") return false;
	return typeof fetchImpl.mock === "object";
}
/** Uses the undici runtime fetch so callers can pass dispatcher-aware options. */
async function fetchWithRuntimeDispatcher(input, init) {
	return await fetchWithPreparedRuntimeDispatcher(require_undici_global_dispatcher.loadUndiciRuntimeDeps(), input, init);
}
/** Uses one prepared Undici snapshot so reusable fetch wrappers stay stable. */
function fetchWithPreparedRuntimeDispatcher(runtimeDeps, input, init) {
	const runtimeFetch = runtimeDeps.fetch;
	return runtimeFetch(input, normalizeRuntimeRequestInit(init, runtimeDeps.FormData));
}
//#endregion
//#region src/infra/net/fetch-guard.ts
var fetch_guard_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	GUARDED_FETCH_MODE: () => GUARDED_FETCH_MODE,
	fetchWithSsrFGuard: () => fetchWithSsrFGuard,
	withStrictGuardedFetchMode: () => withStrictGuardedFetchMode,
	withTrustedEnvProxyGuardedFetchMode: () => withTrustedEnvProxyGuardedFetchMode,
	withTrustedExplicitProxyGuardedFetchMode: () => withTrustedExplicitProxyGuardedFetchMode
});
function resolveDispatcherTimeoutMs(fromParams) {
	if (fromParams !== void 0) return fromParams;
	if (require_undici_global_dispatcher.globalUndiciStreamTimeoutMs !== void 0) return require_undici_global_dispatcher.globalUndiciStreamTimeoutMs;
}
const GUARDED_FETCH_MODE = {
	STRICT: "strict",
	TRUSTED_ENV_PROXY: "trusted_env_proxy",
	TRUSTED_EXPLICIT_PROXY: "trusted_explicit_proxy"
};
const DEFAULT_MAX_REDIRECTS = 3;
const OPERATOR_DEBUG_PROXY_ENABLED = "OPERATOR_DEBUG_PROXY_ENABLED";
async function runAbortablePreflight(run, signal) {
	if (!signal) return await run();
	if (signal.aborted) throw signal.reason ?? require_abort_signal.createAbortError("Guarded fetch aborted during network preflight");
	return await new Promise((resolve, reject) => {
		let settled = false;
		const settle = (complete) => {
			if (settled) return;
			settled = true;
			signal.removeEventListener("abort", onAbort);
			complete();
		};
		const onAbort = () => settle(() => reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(signal.reason ?? require_abort_signal.createAbortError("Guarded fetch aborted during network preflight"), "Guarded fetch aborted during network preflight")));
		signal.addEventListener("abort", onAbort, { once: true });
		if (signal.aborted) {
			onAbort();
			return;
		}
		run().then((value) => settle(() => resolve(value)), (error) => settle(() => reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Network preflight failed"))));
	});
}
function getRedirectVisitKey(url, init) {
	return `${init?.method?.toUpperCase() ?? "GET"} ${url}`;
}
function isTruthyEnvValue(value) {
	return value === "1" || value === "true" || value === "yes" || value === "on";
}
function withStrictGuardedFetchMode(params) {
	return {
		...params,
		mode: GUARDED_FETCH_MODE.STRICT
	};
}
function withTrustedEnvProxyGuardedFetchMode(params) {
	return {
		...params,
		mode: GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY
	};
}
function withTrustedExplicitProxyGuardedFetchMode(params) {
	return {
		...params,
		mode: GUARDED_FETCH_MODE.TRUSTED_EXPLICIT_PROXY
	};
}
function resolveGuardedFetchMode(params) {
	if (params.mode) return params.mode;
	if (params.proxy === "env" && params.dangerouslyAllowEnvProxyWithoutPinnedDns === true) return GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY;
	return GUARDED_FETCH_MODE.STRICT;
}
function isManagedProxyActive() {
	return process.env["OPERATOR_PROXY_ACTIVE"] === "1";
}
function assertExplicitProxySupportsPinnedDns(url, dispatcherPolicy, pinDns) {
	if (pinDns !== false && dispatcherPolicy?.mode === "explicit-proxy" && url.protocol !== "https:") throw new Error("Explicit proxy SSRF pinning requires HTTPS targets; plain HTTP targets are not supported");
}
function createPolicyDispatcherWithoutPinnedDns(dispatcherPolicy, timeoutMs) {
	if (!dispatcherPolicy) return null;
	if (dispatcherPolicy.mode === "direct") return require_undici_global_dispatcher.createHttp1Agent(dispatcherPolicy.connect ? { connect: { ...dispatcherPolicy.connect } } : void 0, timeoutMs);
	if (dispatcherPolicy.mode === "env-proxy") return require_undici_global_dispatcher.createHttp1EnvHttpProxyAgent({
		...dispatcherPolicy.connect ? { connect: { ...dispatcherPolicy.connect } } : {},
		...dispatcherPolicy.proxyTls ? { proxyTls: { ...dispatcherPolicy.proxyTls } } : {}
	}, timeoutMs);
	const proxyUrl = dispatcherPolicy.proxyUrl.trim();
	if (dispatcherPolicy.proxyTls) return require_undici_global_dispatcher.createHttp1ProxyAgent({
		uri: proxyUrl,
		requestTls: { ...dispatcherPolicy.proxyTls }
	}, timeoutMs);
	return require_undici_global_dispatcher.createHttp1ProxyAgent({ uri: proxyUrl }, timeoutMs);
}
async function assertExplicitProxyAllowed(dispatcherPolicy, lookupFn, policy, signal) {
	if (dispatcherPolicy?.mode !== "explicit-proxy") return;
	let parsedProxyUrl;
	try {
		parsedProxyUrl = new URL(dispatcherPolicy.proxyUrl);
	} catch {
		throw new Error("Invalid explicit proxy URL");
	}
	if (!["http:", "https:"].includes(parsedProxyUrl.protocol)) throw new Error("Explicit proxy URL must use http or https");
	const proxyPolicy = policy || dispatcherPolicy.allowPrivateProxy === true ? {
		...policy,
		hostnameAllowlist: void 0,
		...dispatcherPolicy.allowPrivateProxy === true ? { allowPrivateNetwork: true } : {}
	} : void 0;
	await runAbortablePreflight(async () => await resolvePinnedHostnameWithPolicy(parsedProxyUrl.hostname, {
		lookupFn,
		policy: proxyPolicy
	}), signal);
}
function isRedirectStatus(status) {
	return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}
function isAmbientGlobalFetch(params) {
	return typeof params.fetchImpl === "function" && typeof params.globalFetch === "function" && params.fetchImpl === params.globalFetch;
}
async function captureGuardedFetchExchange(params) {
	if (params.capture === false || !isTruthyEnvValue(process.env[OPERATOR_DEBUG_PROXY_ENABLED])) return;
	const { captureHttpExchange, isDebugProxyGlobalFetchPatchInstalled } = await Promise.resolve().then(() => require("./runtime-DN_O7exH.cjs"));
	if (params.capturedByGlobalFetchPatch && isDebugProxyGlobalFetchPatchInstalled()) return;
	captureHttpExchange({
		url: params.url,
		method: params.method,
		requestHeaders: params.requestHeaders,
		requestBody: params.requestBody,
		response: params.response,
		transport: params.transport,
		flowId: params.capture?.flowId,
		meta: {
			captureOrigin: "guarded-fetch",
			...params.auditContext ? { auditContext: params.auditContext } : {},
			...params.capture?.meta
		}
	});
}
function retainSafeHeadersForCrossOriginRedirect(init) {
	if (!init?.headers) return init;
	return {
		...init,
		headers: retainSafeHeadersForCrossOriginRedirect$1(init.headers)
	};
}
function resolveRetainedAuthorizationForRedirect(params) {
	const init = params.init;
	if (!init?.headers || !params.hostnameAllowlist?.length) return;
	if (params.nextUrl.protocol !== "https:") return;
	if (!params.hostnameAllowlist.includes("*") && !matchesHostnameAllowlist(params.nextUrl.hostname, params.hostnameAllowlist)) return;
	const normalizedInit = normalizeRequestInitHeadersForFetch(init);
	if (!normalizedInit?.headers) return;
	return new Headers(normalizedInit.headers).get("authorization") ?? void 0;
}
function restoreRedirectAuthorization(params) {
	if (!params.authorization) return params.init;
	const headers = new Headers(params.init?.headers);
	headers.set("Authorization", params.authorization);
	return {
		...params.init,
		headers
	};
}
function dropBodyHeaders(headers) {
	if (!headers) return headers;
	const nextHeaders = new Headers(normalizeHeadersInitForFetch(headers));
	nextHeaders.delete("content-encoding");
	nextHeaders.delete("content-language");
	nextHeaders.delete("content-length");
	nextHeaders.delete("content-location");
	nextHeaders.delete("content-type");
	nextHeaders.delete("transfer-encoding");
	return nextHeaders;
}
function rewriteRedirectInitForMethod(params) {
	const { init, status } = params;
	if (!init) return init;
	const currentMethod = init.method?.toUpperCase() ?? "GET";
	if (!(status === 303 ? currentMethod !== "GET" && currentMethod !== "HEAD" : (status === 301 || status === 302) && currentMethod === "POST")) return init;
	return {
		...init,
		method: "GET",
		body: void 0,
		headers: dropBodyHeaders(init.headers)
	};
}
function rewriteRedirectInitForCrossOrigin(params) {
	const { init, allowUnsafeReplay } = params;
	if (!init || allowUnsafeReplay) return init;
	const currentMethod = init.method?.toUpperCase() ?? "GET";
	if (currentMethod === "GET" || currentMethod === "HEAD") return init;
	return {
		...init,
		body: void 0,
		headers: dropBodyHeaders(init.headers)
	};
}
async function fetchWithSsrFGuard(params) {
	const { managedProxyBypass: _ignoredManagedProxyBypass, ...publicParams } = params;
	return await fetchWithSsrFGuardInternal(publicParams);
}
async function fetchWithSsrFGuardInternal(params) {
	const defaultFetch = params.fetchImpl ?? globalThis.fetch;
	if (!defaultFetch) throw new Error("fetch is not available");
	const isUsingMockedFetch = isMockedFetch(defaultFetch);
	const maxRedirects = typeof params.maxRedirects === "number" && Number.isFinite(params.maxRedirects) ? Math.max(0, Math.floor(params.maxRedirects)) : DEFAULT_MAX_REDIRECTS;
	const mode = resolveGuardedFetchMode(params);
	const { signal, cleanup, refresh } = require_fetch_timeout.buildTimeoutAbortSignal({
		timeoutMs: params.timeoutMs,
		signal: params.signal,
		operation: "fetchWithSsrFGuard",
		url: params.url
	});
	let released = false;
	const release = async (dispatcher) => {
		if (released) return;
		released = true;
		cleanup();
		await closeDispatcher(dispatcher ?? void 0);
	};
	let currentUrl = params.url;
	let currentInit = normalizeRequestInitHeadersForFetch(params.init ? { ...params.init } : void 0);
	const visited = /* @__PURE__ */ new Set([getRedirectVisitKey(currentUrl, currentInit)]);
	let redirectCount = 0;
	while (true) {
		let parsedUrl;
		try {
			parsedUrl = new URL(currentUrl);
		} catch {
			await release();
			throw new Error("Invalid URL: must be http or https");
		}
		if (!["http:", "https:"].includes(parsedUrl.protocol)) {
			await release();
			throw new Error("Invalid URL: must be http or https");
		}
		if (params.requireHttps === true && parsedUrl.protocol !== "https:") {
			await release();
			throw new Error("URL must use https");
		}
		let dispatcher = null;
		const policyForUrl = resolveSsrFPolicyForUrl(parsedUrl, params.policy);
		const dispatcherPolicy = params.resolveDispatcherPolicy?.(parsedUrl) ?? params.dispatcherPolicy;
		const resolvePinnedHostname = async () => await runAbortablePreflight(async () => await resolvePinnedHostnameWithPolicy(parsedUrl.hostname, {
			lookupFn: params.lookupFn,
			policy: policyForUrl
		}), signal);
		try {
			const usesTrustedExplicitProxyMode = mode === GUARDED_FETCH_MODE.TRUSTED_EXPLICIT_PROXY && dispatcherPolicy?.mode === "explicit-proxy";
			assertExplicitProxySupportsPinnedDns(parsedUrl, dispatcherPolicy, usesTrustedExplicitProxyMode ? false : params.pinDns);
			await assertExplicitProxyAllowed(dispatcherPolicy, params.lookupFn, params.policy, signal);
			const isStrictManagedProxyActive = mode === GUARDED_FETCH_MODE.STRICT && isManagedProxyActive();
			const shouldCheckManagedProxyBypass = isStrictManagedProxyActive && shouldResolveConfiguredLocalOriginManagedProxyBypass({
				url: parsedUrl,
				managedProxyBypass: params.managedProxyBypass
			});
			const canUseManagedProxy = isStrictManagedProxyActive && (require_undici_global_dispatcher.shouldUseEnvHttpProxyForUrl(parsedUrl.toString()) || shouldCheckManagedProxyBypass);
			const canUseTrustedEnvProxy = (mode === GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY || params.useEnvProxyForEligibleUrls === true && !canUseManagedProxy) && !dispatcherPolicy && require_undici_global_dispatcher.shouldUseEnvHttpProxyForUrl(parsedUrl.toString());
			const canUseMockedFetchWithoutDns = isUsingMockedFetch && params.lookupFn === void 0 && !canUseTrustedEnvProxy && !canUseManagedProxy && !usesTrustedExplicitProxyMode && params.pinDns !== false;
			const timeoutMs = resolveDispatcherTimeoutMs(params.timeoutMs);
			if (canUseTrustedEnvProxy || canUseManagedProxy || params.pinDns === false) assertHostnameAllowedWithPolicy(parsedUrl.hostname, policyForUrl);
			if (canUseTrustedEnvProxy) dispatcher = require_undici_global_dispatcher.createHttp1EnvHttpProxyAgent(void 0, timeoutMs);
			else if (canUseManagedProxy) if (shouldCheckManagedProxyBypass) {
				const pinned = await resolvePinnedHostname();
				dispatcher = shouldUseConfiguredLocalOriginManagedProxyBypass({
					url: parsedUrl,
					managedProxyBypass: params.managedProxyBypass,
					resolvedAddresses: pinned.addresses
				}) ? createPinnedDispatcher(pinned, dispatcherPolicy, policyForUrl, timeoutMs) : require_undici_global_dispatcher.createHttp1EnvHttpProxyAgent(void 0, timeoutMs);
			} else dispatcher = require_undici_global_dispatcher.createHttp1EnvHttpProxyAgent(void 0, timeoutMs);
			else if (usesTrustedExplicitProxyMode) {
				assertHostnameAllowedWithPolicy(parsedUrl.hostname, policyForUrl);
				dispatcher = createPolicyDispatcherWithoutPinnedDns(dispatcherPolicy, timeoutMs);
			} else if (canUseMockedFetchWithoutDns) assertHostnameAllowedWithPolicy(parsedUrl.hostname, policyForUrl);
			else if (params.pinDns === false) {
				await resolvePinnedHostname();
				dispatcher = createPolicyDispatcherWithoutPinnedDns(dispatcherPolicy, timeoutMs);
			} else dispatcher = createPinnedDispatcher(await resolvePinnedHostname(), dispatcherPolicy, policyForUrl, timeoutMs);
			const init = {
				...currentInit ? { ...currentInit } : {},
				redirect: "manual",
				...dispatcher ? { dispatcher } : {},
				...signal ? { signal } : {}
			};
			const supportsDispatcherInit = params.fetchImpl !== void 0 && !isAmbientGlobalFetch({
				fetchImpl: params.fetchImpl,
				globalFetch: globalThis.fetch
			}) || isUsingMockedFetch;
			const shouldUseRuntimeFetch = Boolean(dispatcher) && !supportsDispatcherInit;
			const response = shouldUseRuntimeFetch ? await fetchWithRuntimeDispatcher(parsedUrl.toString(), init) : await defaultFetch(parsedUrl.toString(), init);
			const capturedByGlobalFetchPatch = !shouldUseRuntimeFetch && isAmbientGlobalFetch({
				fetchImpl: defaultFetch,
				globalFetch: globalThis.fetch
			});
			await captureGuardedFetchExchange({
				url: parsedUrl.toString(),
				method: currentInit?.method ?? "GET",
				requestHeaders: currentInit?.headers,
				requestBody: currentInit?.body ?? null,
				response,
				transport: "http",
				capture: params.capture,
				auditContext: params.auditContext,
				capturedByGlobalFetchPatch
			});
			if (isRedirectStatus(response.status)) {
				const location = response.headers.get("location");
				if (!location) {
					await release(dispatcher);
					throw new Error(`Redirect missing location header (${response.status})`);
				}
				redirectCount += 1;
				if (redirectCount > maxRedirects) {
					await release(dispatcher);
					throw new Error(`Too many redirects (limit: ${maxRedirects})`);
				}
				const nextParsedUrl = new URL(location, parsedUrl);
				const nextUrl = nextParsedUrl.toString();
				const retainedAuthorization = resolveRetainedAuthorizationForRedirect({
					init: currentInit,
					nextUrl: nextParsedUrl,
					hostnameAllowlist: params.retainAuthorizationRedirectHostnameAllowlist
				});
				currentInit = rewriteRedirectInitForMethod({
					init: currentInit,
					status: response.status
				});
				if (nextParsedUrl.origin !== parsedUrl.origin) {
					currentInit = rewriteRedirectInitForCrossOrigin({
						init: currentInit,
						allowUnsafeReplay: params.allowCrossOriginUnsafeRedirectReplay === true
					});
					currentInit = retainSafeHeadersForCrossOriginRedirect(currentInit);
					currentInit = restoreRedirectAuthorization({
						init: currentInit,
						authorization: retainedAuthorization
					});
				}
				const nextVisitKey = getRedirectVisitKey(nextUrl, currentInit);
				if (visited.has(nextVisitKey)) {
					await release(dispatcher);
					throw new Error("Redirect loop detected");
				}
				visited.add(nextVisitKey);
				response.body?.cancel();
				await closeDispatcher(dispatcher);
				currentUrl = nextUrl;
				continue;
			}
			return {
				response,
				finalUrl: currentUrl,
				release: async () => release(dispatcher),
				refreshTimeout: refresh
			};
		} catch (err) {
			if (err instanceof SsrFBlockedError) require_logger.logWarn(`security: blocked URL fetch (${params.auditContext ?? "url-fetch"}) targetOrigin=${parsedUrl.origin} reason=${err.message}`);
			await release(dispatcher);
			throw err;
		}
	}
}
//#endregion
Object.defineProperty(exports, "GUARDED_FETCH_MODE", {
	enumerable: true,
	get: function() {
		return GUARDED_FETCH_MODE;
	}
});
Object.defineProperty(exports, "SsrFBlockedError", {
	enumerable: true,
	get: function() {
		return SsrFBlockedError;
	}
});
Object.defineProperty(exports, "fetchWithPreparedRuntimeDispatcher", {
	enumerable: true,
	get: function() {
		return fetchWithPreparedRuntimeDispatcher;
	}
});
Object.defineProperty(exports, "fetchWithSsrFGuard", {
	enumerable: true,
	get: function() {
		return fetchWithSsrFGuard;
	}
});
Object.defineProperty(exports, "fetch_guard_exports", {
	enumerable: true,
	get: function() {
		return fetch_guard_exports;
	}
});
Object.defineProperty(exports, "isBlockedHostnameOrIp", {
	enumerable: true,
	get: function() {
		return isBlockedHostnameOrIp;
	}
});
Object.defineProperty(exports, "isPrivateIpAddress", {
	enumerable: true,
	get: function() {
		return isPrivateIpAddress;
	}
});
Object.defineProperty(exports, "isSameSsrFPolicy", {
	enumerable: true,
	get: function() {
		return isSameSsrFPolicy;
	}
});
Object.defineProperty(exports, "mergeSsrFPolicies", {
	enumerable: true,
	get: function() {
		return mergeSsrFPolicies;
	}
});
Object.defineProperty(exports, "normalizeRequestInitHeadersForFetch", {
	enumerable: true,
	get: function() {
		return normalizeRequestInitHeadersForFetch;
	}
});
Object.defineProperty(exports, "resolvePinnedHostname", {
	enumerable: true,
	get: function() {
		return resolvePinnedHostname;
	}
});
Object.defineProperty(exports, "retainSafeHeadersForCrossOriginRedirect", {
	enumerable: true,
	get: function() {
		return retainSafeHeadersForCrossOriginRedirect$1;
	}
});
Object.defineProperty(exports, "ssrfPolicyFromHttpBaseUrlAllowedHostname", {
	enumerable: true,
	get: function() {
		return ssrfPolicyFromHttpBaseUrlAllowedHostname;
	}
});
Object.defineProperty(exports, "ssrfPolicyFromHttpBaseUrlAllowedOrigin", {
	enumerable: true,
	get: function() {
		return ssrfPolicyFromHttpBaseUrlAllowedOrigin;
	}
});
Object.defineProperty(exports, "ssrfPolicyFromHttpBaseUrlFakeIpHostnameAllowlist", {
	enumerable: true,
	get: function() {
		return ssrfPolicyFromHttpBaseUrlFakeIpHostnameAllowlist;
	}
});
Object.defineProperty(exports, "withStrictGuardedFetchMode", {
	enumerable: true,
	get: function() {
		return withStrictGuardedFetchMode;
	}
});
Object.defineProperty(exports, "withTrustedEnvProxyGuardedFetchMode", {
	enumerable: true,
	get: function() {
		return withTrustedEnvProxyGuardedFetchMode;
	}
});
Object.defineProperty(exports, "withTrustedExplicitProxyGuardedFetchMode", {
	enumerable: true,
	get: function() {
		return withTrustedExplicitProxyGuardedFetchMode;
	}
});
