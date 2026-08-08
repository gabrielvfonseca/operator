require("./rolldown-runtime-u92d-OFm.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/agents/tools/web-guarded-fetch.ts
/**
* Guarded fetch wrappers for web tools.
*
* Applies SSRF policy, timeout normalization, and trusted/self-hosted endpoint modes.
*/
const WEB_TOOLS_SELF_HOSTED_NETWORK_SSRF_POLICY = {
	dangerouslyAllowPrivateNetwork: true,
	allowRfc2544BenchmarkRange: true,
	allowIpv6UniqueLocalRange: true
};
function resolveTimeoutMs(params) {
	const timeoutMs = require_common.readPositiveIntegerParam(params, "timeoutMs");
	if (timeoutMs !== void 0) return timeoutMs;
	const timeoutSeconds = require_common.readPositiveIntegerParam(params, "timeoutSeconds");
	if (timeoutSeconds !== void 0) return (0, _gabrielvfonseca_normalization_core_number_coercion.finiteSecondsToTimerSafeMilliseconds)(timeoutSeconds, { floorSeconds: true });
}
/** Runs a guarded fetch with strict or trusted-env-proxy web tool policy. */
async function fetchWithWebToolsNetworkGuard(params) {
	const { timeoutSeconds, useEnvProxy, ...rest } = params;
	const resolved = {
		...rest,
		timeoutMs: resolveTimeoutMs({
			timeoutMs: rest.timeoutMs,
			timeoutSeconds
		})
	};
	return require_fetch_guard.fetchWithSsrFGuard(useEnvProxy ? require_fetch_guard.withTrustedEnvProxyGuardedFetchMode(resolved) : require_fetch_guard.withStrictGuardedFetchMode(resolved));
}
async function withWebToolsNetworkGuard(params, run) {
	const { response, finalUrl, release } = await fetchWithWebToolsNetworkGuard(params);
	try {
		return await run({
			response,
			finalUrl
		});
	} finally {
		await release();
	}
}
/** Runs a fetch for trusted endpoints, allowing env proxy with pinned-host policy. */
async function withTrustedWebToolsEndpoint(params, run) {
	const trustedPolicy = require_fetch_guard.ssrfPolicyFromHttpBaseUrlFakeIpHostnameAllowlist(params.url) ?? {};
	return await withWebToolsNetworkGuard({
		...params,
		policy: trustedPolicy,
		useEnvProxy: true
	}, run);
}
/** Runs a fetch for configured self-hosted endpoints with private-network access allowed. */
async function withSelfHostedWebToolsEndpoint(params, run) {
	return await withWebToolsNetworkGuard({
		...params,
		policy: WEB_TOOLS_SELF_HOSTED_NETWORK_SSRF_POLICY,
		useEnvProxy: true
	}, run);
}
/** Runs a fetch under strict SSRF protection without env proxy trust. */
async function withStrictWebToolsEndpoint(params, run) {
	return await withWebToolsNetworkGuard(params, run);
}
//#endregion
exports.fetchWithWebToolsNetworkGuard = fetchWithWebToolsNetworkGuard;
exports.withSelfHostedWebToolsEndpoint = withSelfHostedWebToolsEndpoint;
exports.withStrictWebToolsEndpoint = withStrictWebToolsEndpoint;
exports.withTrustedWebToolsEndpoint = withTrustedWebToolsEndpoint;
