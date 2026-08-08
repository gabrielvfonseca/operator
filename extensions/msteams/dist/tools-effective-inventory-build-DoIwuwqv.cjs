const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_tool_display = require("./tool-display-DDHJnndq.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_tools$1 = require("./tools-cldx6uki.cjs");
const require_tool_description_summary = require("./tool-description-summary-C8K3io6j.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/tools-effective-inventory-shared.ts
function resolveEffectiveToolLabel(tool) {
	const rawLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(tool.label) ?? "";
	if (rawLabel && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawLabel) !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(tool.name)) return rawLabel;
	return require_tool_display.resolveToolDisplay({ name: tool.name }).title;
}
function resolveEffectiveToolRawDescription(tool) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(tool.description) ?? "";
}
function summarizeEffectiveToolDescription(tool) {
	return require_tool_description_summary.summarizeToolDescriptionText({
		rawDescription: resolveEffectiveToolRawDescription(tool),
		displaySummary: tool.displaySummary
	});
}
function disambiguateEffectiveToolLabels(entries, resolveSuffix) {
	const counts = /* @__PURE__ */ new Map();
	for (const entry of entries) counts.set(entry.label, (counts.get(entry.label) ?? 0) + 1);
	return entries.map((entry) => {
		if ((counts.get(entry.label) ?? 0) < 2) return entry;
		return {
			...entry,
			label: `${entry.label} (${resolveSuffix(entry)})`
		};
	});
}
//#endregion
//#region src/agents/tools-effective-inventory-build.ts
/**
* Builds the operator-facing effective inventory for the current tool surface:
* runtime-compatible tools plus warnings for tools quarantined by schema
* policy, with plugin/channel ownership preserved.
*/
function resolveEffectiveToolSource(tool, fallbackTool) {
	const pluginMeta = require_tools.getPluginToolMeta(tool) ?? (fallbackTool ? require_tools.getPluginToolMeta(fallbackTool) : void 0);
	if (pluginMeta) {
		if (pluginMeta.mcp || pluginMeta.pluginId === "bundle-mcp") return {
			source: "mcp",
			pluginId: pluginMeta.pluginId
		};
		return {
			source: "plugin",
			pluginId: pluginMeta.pluginId
		};
	}
	const channelMeta = require_gateway.getChannelAgentToolMeta(tool) ?? (fallbackTool ? require_gateway.getChannelAgentToolMeta(fallbackTool) : void 0);
	if (channelMeta) return {
		source: "channel",
		channelId: channelMeta.channelId
	};
	return { source: "core" };
}
function buildUnsupportedToolSchemaNotice(params) {
	const sourceTool = params.tool ?? params.fallbackTool;
	const source = sourceTool ? resolveEffectiveToolSource(sourceTool, params.fallbackTool) : { source: "core" };
	const owner = source.source === "plugin" && source.pluginId ? ` from plugin "${source.pluginId}"` : source.source === "channel" && source.channelId ? ` from channel "${source.channelId}"` : "";
	return {
		id: `unsupported-tool-schema:${params.diagnostic.toolName}`,
		severity: "warning",
		message: `Tool "${params.diagnostic.toolName}"${owner} has an unsupported runtime input schema (${params.diagnostic.violations.join(", ")}) and was quarantined before model projection. Fix or disable the owner, or remove the tool from active allowlists.`
	};
}
function buildUnsupportedToolSchemaNotices(params) {
	return params.diagnostics.map((diagnostic) => buildUnsupportedToolSchemaNotice({
		diagnostic,
		tool: readMatchingTool(params.tools, diagnostic),
		fallbackTool: params.rawToolsByName.get(diagnostic.toolName)
	}));
}
function readMatchingTool(tools, diagnostic) {
	try {
		const tool = tools[diagnostic.toolIndex];
		return tool?.name === diagnostic.toolName ? tool : void 0;
	} catch {
		return;
	}
}
function buildReadableToolsByName(tools) {
	const toolsByName = /* @__PURE__ */ new Map();
	let toolCount;
	try {
		toolCount = tools.length;
	} catch {
		return toolsByName;
	}
	for (let index = 0; index < toolCount; index += 1) try {
		const tool = tools.at(index);
		if (tool) toolsByName.set(tool.name, tool);
	} catch {}
	return toolsByName;
}
/** Builds effective inventory entries from already runtime-compatible tools. */
function buildEffectiveToolInventoryEntries(tools, rawToolsByName = /* @__PURE__ */ new Map()) {
	const pluginToolMetadata = new Map((require_runtime.getActivePluginRegistry()?.toolMetadata ?? []).map((entry) => [require_tools.buildPluginToolMetadataKey(entry.pluginId, entry.metadata.toolName), entry.metadata]));
	return disambiguateEffectiveToolLabels(tools.map((tool) => {
		const source = resolveEffectiveToolSource(tool, rawToolsByName.get(tool.name));
		const metadata = source.pluginId ? pluginToolMetadata.get(require_tools.buildPluginToolMetadataKey(source.pluginId, tool.name)) : void 0;
		return Object.assign({
			id: tool.name,
			label: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(metadata?.displayName) ?? resolveEffectiveToolLabel(tool),
			description: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(metadata?.description) ?? summarizeEffectiveToolDescription(tool),
			rawDescription: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(metadata?.description) ?? resolveEffectiveToolRawDescription(tool) ?? summarizeEffectiveToolDescription(tool),
			...metadata?.risk ? { risk: metadata.risk } : {},
			...metadata?.tags ? { tags: metadata.tags } : {}
		}, source);
	}).toSorted((a, b) => a.label.localeCompare(b.label)), (entry) => entry.pluginId ?? entry.channelId ?? entry.id);
}
/** Normalizes tools, quarantines incompatible schemas, and returns inventory output. */
function buildRuntimeCompatibleToolInventory(params) {
	const rawToolsByName = buildReadableToolsByName(params.tools);
	const preNormalizationProjection = require_tools$1.filterProviderNormalizableTools(params.tools);
	const preNormalizationDiagnostics = [...preNormalizationProjection.diagnostics];
	const normalizedTools = require_tools$1.normalizeAgentRuntimeTools({
		tools: [...preNormalizationProjection.tools],
		provider: params.modelProvider ?? "",
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		modelId: params.modelId,
		modelApi: params.modelApi ?? void 0,
		model: params.runtimeModel,
		onPreNormalizationSchemaDiagnostics: (diagnostics) => preNormalizationDiagnostics.push(...diagnostics)
	});
	const projection = require_tools$1.filterRuntimeCompatibleTools(normalizedTools);
	const diagnostics = [...preNormalizationDiagnostics, ...projection.diagnostics];
	return {
		entries: buildEffectiveToolInventoryEntries(projection.tools, rawToolsByName),
		notices: buildUnsupportedToolSchemaNotices({
			diagnostics,
			tools: normalizedTools,
			rawToolsByName
		})
	};
}
//#endregion
Object.defineProperty(exports, "buildReadableToolsByName", {
	enumerable: true,
	get: function() {
		return buildReadableToolsByName;
	}
});
Object.defineProperty(exports, "buildRuntimeCompatibleToolInventory", {
	enumerable: true,
	get: function() {
		return buildRuntimeCompatibleToolInventory;
	}
});
Object.defineProperty(exports, "disambiguateEffectiveToolLabels", {
	enumerable: true,
	get: function() {
		return disambiguateEffectiveToolLabels;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolLabel", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolLabel;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolRawDescription", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolRawDescription;
	}
});
Object.defineProperty(exports, "summarizeEffectiveToolDescription", {
	enumerable: true,
	get: function() {
		return summarizeEffectiveToolDescription;
	}
});
