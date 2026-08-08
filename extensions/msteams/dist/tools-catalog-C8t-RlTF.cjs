require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_tool_description_summary = require("./tool-description-summary-C8K3io6j.cjs");
const require_agent_id_shared = require("./agent-id-shared-D_IljT8b.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/tools-catalog.ts
function buildCoreGroups() {
	return require_tool_policy.listCoreToolSections().map((section) => ({
		id: section.id,
		label: section.label,
		source: "core",
		tools: section.tools.map((tool) => ({
			id: tool.id,
			label: tool.label,
			description: tool.description,
			source: "core",
			defaultProfiles: require_tool_policy.resolveCoreToolProfiles(tool.id)
		}))
	}));
}
function buildPluginGroups(params) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId);
	const agentDir = require_agent_scope_config.resolveAgentDir(params.cfg, params.agentId);
	const toolContext = {
		config: params.cfg,
		workspaceDir,
		agentDir,
		agentId: params.agentId
	};
	const toolRegistry = require_tools.ensureStandalonePluginToolRegistryLoaded({
		context: toolContext,
		toolAllowlist: ["group:plugins"],
		allowGatewaySubagentBinding: true
	});
	const pluginTools = require_tools.resolvePluginTools({
		context: toolContext,
		existingToolNames: params.existingToolNames,
		toolAllowlist: ["group:plugins"],
		suppressNameConflicts: true,
		allowGatewaySubagentBinding: true,
		runtimeRegistry: toolRegistry
	});
	const catalogRegistry = toolRegistry ?? require_runtime.getActivePluginRegistry();
	const groups = /* @__PURE__ */ new Map();
	const pluginToolMetadata = /* @__PURE__ */ new Map();
	if (catalogRegistry) for (const entry of catalogRegistry.toolMetadata) {
		const metadataKey = require_tools.buildPluginToolMetadataKey(entry.pluginId, entry.metadata.toolName);
		pluginToolMetadata.set(metadataKey, entry.metadata);
	}
	const seenToolIds = /* @__PURE__ */ new Set();
	for (const tool of pluginTools) {
		const meta = require_tools.getPluginToolMeta(tool);
		const pluginId = meta?.pluginId ?? "plugin";
		const groupId = `plugin:${pluginId}`;
		const existing = groups.get(groupId) ?? {
			id: groupId,
			label: pluginId,
			source: "plugin",
			pluginId,
			tools: []
		};
		const ownedMetadata = meta?.pluginId ? pluginToolMetadata.get(require_tools.buildPluginToolMetadataKey(meta.pluginId, tool.name)) : void 0;
		existing.tools.push({
			id: tool.name,
			label: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ownedMetadata?.displayName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(tool.label) ?? tool.name,
			description: require_tool_description_summary.summarizeToolDescriptionText({
				rawDescription: ownedMetadata?.description ?? (typeof tool.description === "string" ? tool.description : void 0),
				displaySummary: tool.displaySummary
			}),
			source: "plugin",
			pluginId,
			optional: meta?.optional,
			risk: ownedMetadata?.risk,
			tags: ownedMetadata?.tags,
			defaultProfiles: []
		});
		seenToolIds.add(tool.name);
		groups.set(groupId, existing);
	}
	for (const entry of catalogRegistry?.tools ?? []) {
		const names = entry.names.length > 0 ? entry.names : entry.declaredNames ?? [];
		for (const name of names) {
			if (seenToolIds.has(name) || params.existingToolNames.has(name)) continue;
			const groupId = `plugin:${entry.pluginId}`;
			const existing = groups.get(groupId) ?? {
				id: groupId,
				label: entry.pluginName ?? entry.pluginId,
				source: "plugin",
				pluginId: entry.pluginId,
				tools: []
			};
			const ownedMetadata = pluginToolMetadata.get(require_tools.buildPluginToolMetadataKey(entry.pluginId, name));
			existing.tools.push({
				id: name,
				label: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ownedMetadata?.displayName) ?? name,
				description: require_tool_description_summary.summarizeToolDescriptionText({ rawDescription: ownedMetadata?.description }) || `Plugin tool from ${entry.pluginName ?? entry.pluginId}`,
				source: "plugin",
				pluginId: entry.pluginId,
				optional: entry.optional,
				risk: ownedMetadata?.risk,
				tags: ownedMetadata?.tags,
				defaultProfiles: []
			});
			seenToolIds.add(name);
			groups.set(groupId, existing);
		}
	}
	return [...groups.values()].map((group) => Object.assign({}, group, { tools: group.tools.toSorted((a, b) => a.id.localeCompare(b.id)) })).toSorted((a, b) => a.label.localeCompare(b.label));
}
/** Build the merged core/plugin tool catalog for one agent. */
function buildToolsCatalogResult(params) {
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId) || require_agent_scope_config.resolveDefaultAgentId(params.cfg);
	const includePlugins = params.includePlugins !== false;
	const groups = buildCoreGroups();
	if (includePlugins) {
		const existingToolNames = new Set(groups.flatMap((group) => group.tools.map((tool) => tool.id)));
		groups.push(...buildPluginGroups({
			cfg: params.cfg,
			agentId,
			existingToolNames
		}));
	}
	return {
		agentId,
		profiles: require_tool_policy.PROFILE_OPTIONS.map((profile) => ({
			id: profile.id,
			label: profile.label
		})),
		groups
	};
}
/** Gateway request handlers for tool catalog queries. */
const toolsCatalogHandlers = { "tools.catalog": ({ params, respond, context }) => {
	if (!require_src.validateToolsCatalogParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tools.catalog params: ${require_validation_errors.formatValidationErrors(require_src.validateToolsCatalogParams.errors)}`));
		return;
	}
	const resolved = require_agent_id_shared.resolveAgentIdOrRespondError({
		rawAgentId: params.agentId,
		respond,
		cfg: context.getRuntimeConfig(),
		normalize: _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString
	});
	if (!resolved) return;
	respond(true, buildToolsCatalogResult({
		cfg: resolved.cfg,
		agentId: resolved.agentId,
		includePlugins: params.includePlugins
	}), void 0);
} };
//#endregion
exports.toolsCatalogHandlers = toolsCatalogHandlers;
