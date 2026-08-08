const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_fast_mode = require("./fast-mode-BD9s0nxq.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_model_thinking_default = require("./model-thinking-default-3L3oHDLO.cjs");
require("./logging-CPL2M9DX.cjs");
const require_fast_mode$1 = require("./fast-mode-0YvHCt-K.cjs");
const require_dangerous_config_flags_current = require("./dangerous-config-flags-current-Dat6f_wf.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let chalk = require("chalk");
chalk = require_rolldown_runtime.__toESM(chalk, 1);
//#region src/gateway/server-startup-log.ts
/** Emit startup summary lines after Gateway bind and plugin loading complete. */
async function logGatewayStartup(params) {
	const { provider: agentProvider, model: agentModel } = require_model_selection_shared.resolveConfiguredModelRef({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL
	});
	const modelRef = `${agentProvider}/${agentModel}`;
	const modelDetails = formatAgentModelStartupDetails({
		cfg: params.cfg,
		provider: agentProvider,
		model: agentModel
	});
	params.log.info(`agent model: ${modelRef} (${modelDetails})`, { consoleMessage: `agent model: ${chalk.default.whiteBright(modelRef)} (${modelDetails})` });
	const startupDurationMs = typeof params.startupStartedAt === "number" ? Date.now() - params.startupStartedAt : null;
	const startupDurationLabel = startupDurationMs == null ? null : `${(startupDurationMs / 1e3).toFixed(1)}s`;
	params.log.info(`http server listening (${formatReadyDetails(params.loadedPluginIds, startupDurationLabel)})`);
	params.log.info(`log file: ${require_logger.getResolvedLoggerSettings().file}`);
	if (params.isNixMode) params.log.info("gateway: running in Nix mode (config managed externally)");
	for (const warning of await collectConfiguredChannelStartupWarnings({
		cfg: params.cfg,
		activationSourceConfig: params.activationSourceConfig
	})) params.log.warn(warning);
	const enabledDangerousFlags = require_dangerous_config_flags_current.collectEnabledInsecureOrDangerousFlagsFromCurrentSnapshot(params.cfg) ?? (await Promise.resolve().then(() => require("./dangerous-config-flags-D5FW8LW-.cjs")).then((n) => n.dangerous_config_flags_exports)).collectEnabledInsecureOrDangerousFlags(params.cfg);
	if (enabledDangerousFlags.length > 0) {
		const warning = `security warning: dangerous config flags enabled: ${enabledDangerousFlags.join(", ")}. Run \`operator security audit\`.`;
		params.log.warn(warning);
	}
}
/** Normalize model thinking values that are useful in the compact startup log. */
function normalizeStartupThinkLevel(value) {
	return value === "off" || value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh" || value === "adaptive" || value === "max" || value === "ultra" ? value : void 0;
}
/** Resolve explicit thinking overrides from agent defaults and per-model config. */
function resolveExplicitStartupThinking(params) {
	const models = params.cfg.agents?.defaults?.models;
	const canonicalKey = require_model_selection_normalize.modelKey(params.provider, params.model);
	const legacyKey = require_model_selection_normalize.legacyModelKey(params.provider, params.model);
	return normalizeStartupThinkLevel(params.defaultAgentThinking) ?? normalizeStartupThinkLevel(models?.[canonicalKey]?.params?.thinking) ?? normalizeStartupThinkLevel(legacyKey ? models?.[legacyKey]?.params?.thinking : void 0) ?? normalizeStartupThinkLevel(params.cfg.agents?.defaults?.thinkingDefault);
}
/** True when a configured catalog entry disables reasoning for the startup model. */
function isConfiguredReasoningDisabled(params) {
	return params.catalog.some((entry) => entry.provider === params.provider && entry.id === params.model && entry.reasoning === false);
}
/** Format model thinking and fast-mode details for the Gateway startup banner. */
function formatAgentModelStartupDetails(params) {
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(params.cfg);
	const defaultAgentConfig = require_agent_scope_config.resolveAgentConfig(params.cfg, defaultAgentId);
	let thinking = resolveExplicitStartupThinking({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		defaultAgentThinking: defaultAgentConfig?.thinkingDefault
	});
	if (thinking === void 0) {
		const configuredCatalog = require_model_selection_shared.buildConfiguredModelCatalog({ cfg: params.cfg });
		if (isConfiguredReasoningDisabled({
			catalog: configuredCatalog,
			provider: params.provider,
			model: params.model
		})) thinking = "off";
		else {
			const resolvedThinking = require_model_thinking_default.resolveThinkingDefault({
				cfg: params.cfg,
				provider: params.provider,
				model: params.model,
				catalog: configuredCatalog
			});
			thinking = resolvedThinking === "off" ? "medium" : resolvedThinking;
		}
	}
	const fast = require_fast_mode$1.resolveFastModeState({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		agentId: defaultAgentId
	});
	return `thinking=${thinking}, fast=${require_fast_mode.formatFastModeValue(fast.mode)}`;
}
async function collectConfiguredChannelStartupWarnings(params) {
	const [blockerModule, presencePolicyModule, pluginRegistryModule] = await Promise.all([
		Promise.resolve().then(() => require("./channel-plugin-blockers-CFkxs2GQ.cjs")),
		Promise.resolve().then(() => require("./channel-presence-policy-Cz0v6MJ2.cjs")).then((n) => n.channel_presence_policy_exports),
		Promise.resolve().then(() => require("./plugin-registry-qeG97tX7.cjs")).then((n) => n.plugin_registry_exports)
	]);
	const manifestRegistry = pluginRegistryModule.loadPluginManifestRegistryForPluginRegistry({
		config: params.cfg,
		env: process.env,
		includeDisabled: true
	});
	const hits = blockerModule.scanConfiguredChannelPluginBlockers(params.cfg, process.env, params.activationSourceConfig, { manifestRecords: manifestRegistry.plugins });
	const blockerWarnings = blockerModule.collectConfiguredChannelPluginBlockerWarnings(hits).map((warning) => `configured channel warning: ${warning.replace(/^[-]\s*/u, "")}`);
	const missingOwnerWarnings = presencePolicyModule.resolveConfiguredChannelPresencePolicy({
		config: params.cfg,
		activationSourceConfig: params.activationSourceConfig,
		includePersistedAuthState: false,
		manifestRecords: manifestRegistry.plugins
	}).filter((entry) => !entry.effective && entry.blockedReasons.includes("no-channel-owner")).map(formatConfiguredChannelMissingOwnerStartupWarning);
	return [...blockerWarnings, ...missingOwnerWarnings];
}
function formatConfiguredChannelMissingOwnerStartupWarning(entry) {
	return `configured channel warning: channels.${require_ansi.sanitizeForLog(entry.channelId)} is configured but no channel plugin is installed or loadable (${(0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(entry.blockedReasons).join(", ")}). Run \`operator doctor --fix\` or install the channel plugin before relying on this channel.`;
}
/** Format plugin count/list and optional startup duration for the ready log line. */
function formatReadyDetails(loadedPluginIds, startupDurationLabel) {
	const pluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(loadedPluginIds);
	const pluginSummary = pluginIds.length === 0 ? "0 plugins" : `${pluginIds.length} ${pluginIds.length === 1 ? "plugin" : "plugins"}: ${pluginIds.join(", ")}`;
	if (!startupDurationLabel) return pluginSummary;
	return pluginIds.length === 0 ? `${pluginSummary}, ${startupDurationLabel}` : `${pluginSummary}; ${startupDurationLabel}`;
}
//#endregion
exports.logGatewayStartup = logGatewayStartup;
