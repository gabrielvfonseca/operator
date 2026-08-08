require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_agent_tools = require("./agent-tools-C4N0fa5t.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_agent_model_discovery = require("./agent-model-discovery-k4IOdehL.cjs");
const require_tools$1 = require("./tools-cldx6uki.cjs");
const require_model = require("./model-Don1-Go6.cjs");
const require_tools_effective_inventory_build = require("./tools-effective-inventory-build-DoIwuwqv.cjs");
const require_primary_model_ref = require("./primary-model-ref-DOhCLZw0.cjs");
//#region src/commands/doctor/shared/active-tool-schema-warnings.ts
function resolveRuntimeModelContext(params) {
	const model = require_model.resolveModel(params.provider, params.modelId, params.agentDir, params.cfg, { workspaceDir: params.workspaceDir }).model;
	if (!model) return {};
	return {
		modelApi: model.api,
		model,
		modelCompat: require_agent_model_discovery.extractModelCompat(model),
		...typeof model.contextWindow === "number" ? { modelContextWindowTokens: model.contextWindow } : {}
	};
}
function formatDiagnostic(params) {
	const plugin = params.pluginId ? ` from plugin "${params.pluginId}"` : "";
	return require_ansi.sanitizeForLog(`- agents.${params.agentId}: active tool "${params.diagnostic.toolName}"${plugin} has unsupported runtime input schema (${params.diagnostic.violations.join(", ")}). Operator will quarantine this tool at runtime; fix or disable the plugin, or remove the tool from active allowlists.`);
}
function readToolByIndex(tools, index) {
	try {
		return tools[index];
	} catch {
		return;
	}
}
function readPluginId(tool) {
	try {
		return tool ? require_tools.getPluginToolMeta(tool)?.pluginId : void 0;
	} catch {
		return;
	}
}
/** Collect per-agent warnings for active plugin tools rejected by runtime schema projection. */
function collectActiveToolSchemaProjectionWarnings(params) {
	if (params.cfg.plugins?.enabled === false) return [];
	const env = params.env ?? process.env;
	const warnings = [];
	for (const agentId of require_agent_scope_config.listAgentIds(params.cfg)) {
		const agentConfig = require_agent_scope_config.resolveAgentConfig(params.cfg, agentId);
		const modelRef = require_primary_model_ref.resolveDoctorPrimaryModelRef(params.cfg, agentConfig?.model);
		const agentDir = require_agent_scope_config.resolveAgentDir(params.cfg, agentId, env);
		const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId, env);
		let runtimeModelContext = {};
		try {
			runtimeModelContext = resolveRuntimeModelContext({
				cfg: params.cfg,
				agentDir,
				workspaceDir,
				provider: modelRef.provider,
				modelId: modelRef.model
			});
		} catch (error) {
			warnings.push(require_ansi.sanitizeForLog(`- agents.${agentId}: active tool schema validation could not resolve the runtime model context (${require_errors.formatErrorMessage(error)}). Fix provider/model loading errors before relying on assistant tool startup.`));
		}
		let tools;
		try {
			tools = require_agent_tools.createOperatorCodingTools({
				agentId,
				agentDir,
				workspaceDir,
				config: params.cfg,
				modelProvider: modelRef.provider,
				modelId: modelRef.model,
				modelApi: runtimeModelContext.modelApi,
				modelCompat: runtimeModelContext.modelCompat,
				modelContextWindowTokens: runtimeModelContext.modelContextWindowTokens,
				allowGatewaySubagentBinding: true,
				toolPolicyAuditLogLevel: "debug"
			});
		} catch (error) {
			warnings.push(require_ansi.sanitizeForLog(`- agents.${agentId}: active tool schema validation could not load the runtime tool set (${require_errors.formatErrorMessage(error)}). Fix plugin loading errors before relying on assistant tool startup.`));
			continue;
		}
		const rawToolsByName = require_tools_effective_inventory_build.buildReadableToolsByName(tools);
		const preNormalizationDiagnostics = [];
		let normalizedTools;
		try {
			normalizedTools = require_tools$1.normalizeAgentRuntimeTools({
				tools,
				provider: modelRef.provider,
				config: params.cfg,
				workspaceDir,
				env,
				modelId: modelRef.model,
				modelApi: runtimeModelContext.modelApi,
				model: runtimeModelContext.model,
				onPreNormalizationSchemaDiagnostics: (diagnostics) => preNormalizationDiagnostics.push(...diagnostics)
			});
		} catch (error) {
			warnings.push(require_ansi.sanitizeForLog(`- agents.${agentId}: active tool schema validation could not normalize the runtime tool set (${require_errors.formatErrorMessage(error)}). Fix provider/plugin loading errors before relying on assistant tool startup.`));
			continue;
		}
		for (const diagnostic of preNormalizationDiagnostics) {
			const pluginId = readPluginId(rawToolsByName.get(diagnostic.toolName));
			warnings.push(formatDiagnostic({
				agentId,
				diagnostic,
				...pluginId ? { pluginId } : {}
			}));
		}
		const projection = require_tools$1.filterRuntimeCompatibleTools(normalizedTools);
		for (const diagnostic of projection.diagnostics) {
			const tool = readToolByIndex(normalizedTools, diagnostic.toolIndex);
			const rawTool = rawToolsByName.get(diagnostic.toolName);
			const pluginId = readPluginId(tool) ?? readPluginId(rawTool);
			warnings.push(formatDiagnostic({
				agentId,
				diagnostic,
				...pluginId ? { pluginId } : {}
			}));
		}
	}
	return warnings;
}
//#endregion
exports.collectActiveToolSchemaProjectionWarnings = collectActiveToolSchemaProjectionWarnings;
