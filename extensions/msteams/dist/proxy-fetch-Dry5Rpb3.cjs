const require_logger = require("./logger-DFfd_p65.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
//#region src/infra/net/proxy-fetch.ts
/**
* Resolve a proxy-aware fetch from standard environment variables.
* Respects NO_PROXY / no_proxy exclusions via undici's EnvHttpProxyAgent.
* Returns undefined when no proxy is configured.
* Gracefully returns undefined if the proxy URL is malformed.
*/
function resolveProxyFetchFromEnv(env = process.env) {
	const proxyOptions = require_undici_global_dispatcher.resolveManagedEnvHttpProxyAgentOptions(env);
	if (!proxyOptions) return;
	try {
		const runtimeDeps = require_undici_global_dispatcher.loadUndiciRuntimeDeps();
		const { EnvHttpProxyAgent } = runtimeDeps;
		const agent = new EnvHttpProxyAgent(proxyOptions);
		return ((input, init) => require_fetch_guard.fetchWithPreparedRuntimeDispatcher(runtimeDeps, input, {
			...init,
			dispatcher: agent
		}));
	} catch (err) {
		require_logger.logWarn(`Proxy env var set but agent creation failed — falling back to direct fetch: ${require_errors.formatErrorMessage(err)}`);
		return;
	}
}
//#endregion
Object.defineProperty(exports, "resolveProxyFetchFromEnv", {
	enumerable: true,
	get: function() {
		return resolveProxyFetchFromEnv;
	}
});
