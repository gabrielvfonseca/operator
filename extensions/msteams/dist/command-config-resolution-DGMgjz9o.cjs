require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_command_secret_gateway = require("./command-secret-gateway-bUpj2U36.cjs");
//#region src/cli/command-config-resolution.ts
/** Resolve command-scoped secrets and return both raw resolved and effective config views. */
async function resolveCommandConfigWithSecrets(params) {
	const { resolvedConfig, diagnostics } = await require_command_secret_gateway.resolveCommandSecretRefsViaGateway({
		config: params.config,
		commandName: params.commandName,
		targetIds: params.targetIds,
		...params.mode ? { mode: params.mode } : {},
		...params.allowedPaths ? { allowedPaths: params.allowedPaths } : {},
		...params.forcedActivePaths ? { forcedActivePaths: params.forcedActivePaths } : {},
		...params.optionalActivePaths ? { optionalActivePaths: params.optionalActivePaths } : {},
		...params.allowLocalExecSecretRefs !== void 0 ? { allowLocalExecSecretRefs: params.allowLocalExecSecretRefs } : {},
		...params.scrubUnresolvedSecretRefs !== void 0 ? { scrubUnresolvedSecretRefs: params.scrubUnresolvedSecretRefs } : {}
	});
	if (params.runtime) for (const entry of diagnostics) params.runtime.error(`[secrets] ${entry}`);
	return {
		resolvedConfig,
		effectiveConfig: params.autoEnable ? require_plugin_auto_enable.applyPluginAutoEnable({
			config: resolvedConfig,
			env: params.env ?? process.env
		}).config : resolvedConfig,
		diagnostics
	};
}
//#endregion
exports.resolveCommandConfigWithSecrets = resolveCommandConfigWithSecrets;
