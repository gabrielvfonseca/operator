const require_tools = require("./tools-DryxNYgu.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_logger = require("./logger-B-gij7u9.cjs");
let _gabrielvfonseca_ai_internal_openai = require("@gabrielvfonseca/ai/internal/openai");
//#region src/agents/embedded-agent-runner/tool-schema-runtime.ts
function buildProviderToolSchemaContext(params, provider) {
	return {
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		provider,
		modelId: params.modelId,
		modelApi: params.modelApi,
		model: params.model,
		tools: params.tools
	};
}
/**
* Runs provider-owned tool-schema normalization without encoding provider
* families in the embedded runner.
*/
function normalizeProviderToolSchemas(params) {
	const provider = params.provider.trim();
	const pluginNormalized = require_provider_runtime.normalizeProviderToolSchemasWithPlugin({
		provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		runtimeHandle: params.runtimeHandle,
		allowRuntimePluginLoad: params.allowRuntimePluginLoad,
		context: buildProviderToolSchemaContext(params, provider)
	});
	return Array.isArray(pluginNormalized) ? pluginNormalized : params.tools;
}
/**
* Logs provider-owned tool-schema diagnostics after normalization.
*/
function logProviderToolSchemaDiagnostics(params) {
	const provider = params.provider.trim();
	const diagnostics = require_provider_runtime.inspectProviderToolSchemasWithPlugin({
		provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		runtimeHandle: params.runtimeHandle,
		allowRuntimePluginLoad: params.allowRuntimePluginLoad,
		context: buildProviderToolSchemaContext(params, provider)
	});
	if (!Array.isArray(diagnostics)) return;
	if (diagnostics.length === 0) return;
	const summary = summarizeProviderToolSchemaDiagnostics(diagnostics);
	require_logger.log.warn(`provider tool schema diagnostics: ${diagnostics.length} ${diagnostics.length === 1 ? "tool" : "tools"} for ${params.provider}: ${summary}`, {
		provider: params.provider,
		toolCount: params.tools.length,
		diagnosticCount: diagnostics.length,
		tools: params.tools.map((tool, index) => `${index}:${tool.name}`),
		diagnostics: diagnostics.map((diagnostic) => ({
			index: diagnostic.toolIndex,
			tool: diagnostic.toolName,
			violations: diagnostic.violations.slice(0, 12),
			violationCount: diagnostic.violations.length
		}))
	});
}
function summarizeProviderToolSchemaDiagnostics(diagnostics) {
	const visible = diagnostics.slice(0, 6).map((diagnostic) => {
		const violationCount = diagnostic.violations.length;
		return `${diagnostic.toolName || "unknown"} (${violationCount} ${violationCount === 1 ? "violation" : "violations"})`;
	});
	const remaining = diagnostics.length - visible.length;
	return remaining > 0 ? `${visible.join(", ")}, +${remaining} more` : visible.join(", ");
}
//#endregion
//#region src/agents/tool-schema-projection.ts
function unreadableRuntimeToolEntry(toolIndex) {
	return {
		ok: false,
		diagnostic: {
			toolName: `tool[${toolIndex}]`,
			toolIndex,
			violations: [`tool[${toolIndex}] is unreadable`]
		}
	};
}
function readRuntimeToolEntries(tools) {
	let length;
	try {
		length = tools.length;
	} catch {
		return [unreadableRuntimeToolEntry(0)];
	}
	const entries = [];
	for (let toolIndex = 0; toolIndex < length; toolIndex += 1) try {
		const tool = tools.at(toolIndex);
		entries.push(tool === void 0 ? unreadableRuntimeToolEntry(toolIndex) : {
			ok: true,
			tool,
			toolIndex
		});
	} catch {
		entries.push(unreadableRuntimeToolEntry(toolIndex));
	}
	return entries;
}
function readToolProjectionField(tool, field) {
	try {
		return {
			readable: true,
			value: tool[field]
		};
	} catch {
		return { readable: false };
	}
}
function inspectToolSchema(tool, toolIndex, mode) {
	const nameRead = readToolProjectionField(tool, "name");
	const toolName = nameRead.readable && typeof nameRead.value === "string" && nameRead.value ? nameRead.value : `tool[${toolIndex}]`;
	const descriptorViolations = nameRead.readable ? [] : [`${toolName}.name is unreadable`];
	const parametersRead = readToolProjectionField(tool, "parameters");
	if (!parametersRead.readable) return {
		toolName,
		toolIndex,
		violations: [...descriptorViolations, `${toolName}.parameters is unreadable`]
	};
	if (mode === "provider-normalizable" && parametersRead.value === void 0) return descriptorViolations.length > 0 ? {
		toolName,
		toolIndex,
		violations: descriptorViolations
	} : void 0;
	const schemaPath = `${toolName}.parameters`;
	const projection = (0, _gabrielvfonseca_ai_internal_openai.projectRuntimeToolInputSchema)(parametersRead.value, schemaPath);
	const projectionViolations = mode === "runtime" ? projection.violations : projection.violations.filter((violation) => violation !== `${schemaPath}.$dynamicRef` && violation !== `${schemaPath}.$dynamicAnchor` && !violation.endsWith(".$dynamicRef") && !violation.endsWith(".$dynamicAnchor"));
	const violations = [...descriptorViolations, ...projectionViolations];
	return violations.length > 0 ? {
		toolName,
		toolIndex,
		violations
	} : void 0;
}
function inspectToolEntries(entries, mode) {
	const diagnostics = [];
	const compatibleTools = [];
	for (const entry of entries) {
		if (!entry.ok) {
			diagnostics.push(entry.diagnostic);
			continue;
		}
		const diagnostic = inspectToolSchema(entry.tool, entry.toolIndex, mode);
		if (diagnostic) {
			diagnostics.push(diagnostic);
			continue;
		}
		compatibleTools.push(entry.tool);
	}
	return {
		tools: compatibleTools,
		diagnostics
	};
}
/** Inspects runtime tool schemas and returns diagnostics without filtering tools. */
function inspectRuntimeToolInputSchemas(tools) {
	return [...inspectToolEntries(readRuntimeToolEntries(tools), "runtime").diagnostics];
}
/** Filters tools to those with schemas accepted by the runtime as-is. */
function filterRuntimeCompatibleTools(tools) {
	return inspectToolEntries(readRuntimeToolEntries(tools), "runtime");
}
/** Filters tools to those that providers can normalize before dispatch. */
function filterProviderNormalizableTools(tools) {
	return inspectToolEntries(readRuntimeToolEntries(tools), "provider-normalizable");
}
//#endregion
//#region src/agents/runtime-plan/tools.ts
/** Builds the provider/runtime context passed into runtime-plan tool hooks. */
function runtimePlanToolContext(params) {
	return {
		workspaceDir: params.workspaceDir,
		modelApi: params.modelApi ?? void 0,
		model: params.model
	};
}
function copyRuntimeToolMetadata(source, target) {
	if (source === target) return;
	const catalogMode = source.catalogMode;
	if (catalogMode) target.catalogMode = catalogMode;
	require_tools.copyPluginToolMeta(source, target);
	require_gateway.copyChannelAgentToolMeta(source, target);
	require_gateway.copyBeforeToolCallHookMarker(source, target);
	require_gateway.copyToolTerminalPresentation(source, target);
}
function preserveRuntimeToolMetadata(sourceTools, normalizedTools) {
	const sourcesByUniqueName = /* @__PURE__ */ new Map();
	const duplicateNames = /* @__PURE__ */ new Set();
	for (const source of sourceTools) {
		const name = source.name;
		if (sourcesByUniqueName.has(name)) {
			duplicateNames.add(name);
			sourcesByUniqueName.delete(name);
			continue;
		}
		if (!duplicateNames.has(name)) sourcesByUniqueName.set(name, source);
	}
	for (const [index, target] of normalizedTools.entries()) {
		const indexedSource = sourceTools[index];
		const source = indexedSource?.name === target.name ? indexedSource : sourcesByUniqueName.get(target.name);
		if (source) copyRuntimeToolMetadata(source, target);
	}
	return normalizedTools;
}
/** Normalizes tool schemas through a runtime plan or provider fallback policy. */
function normalizeAgentRuntimeTools(params) {
	const planContext = runtimePlanToolContext(params);
	const normalizableToolProjection = filterProviderNormalizableTools(params.tools);
	params.onPreNormalizationSchemaDiagnostics?.(normalizableToolProjection.diagnostics, params.tools);
	const normalizableTools = [...normalizableToolProjection.tools];
	const normalized = params.runtimePlan?.tools.normalize(normalizableTools, planContext) ?? normalizeProviderToolSchemas({
		tools: normalizableTools,
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env,
		modelId: params.modelId,
		modelApi: params.modelApi,
		model: params.model,
		runtimeHandle: params.runtimeHandle,
		allowRuntimePluginLoad: params.allowProviderRuntimePluginLoad
	});
	return preserveRuntimeToolMetadata(normalizableTools, Array.isArray(normalized) ? normalized : normalizableTools);
}
/** Emits runtime-plan or provider fallback diagnostics for normalized tools. */
function logAgentRuntimeToolDiagnostics(params) {
	const planContext = runtimePlanToolContext(params);
	if (params.runtimePlan) {
		params.runtimePlan.tools.logDiagnostics(params.tools, planContext);
		return;
	}
	logProviderToolSchemaDiagnostics({
		tools: params.tools,
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env,
		modelId: params.modelId,
		modelApi: params.modelApi,
		model: params.model,
		runtimeHandle: params.runtimeHandle
	});
}
//#endregion
Object.defineProperty(exports, "filterProviderNormalizableTools", {
	enumerable: true,
	get: function() {
		return filterProviderNormalizableTools;
	}
});
Object.defineProperty(exports, "filterRuntimeCompatibleTools", {
	enumerable: true,
	get: function() {
		return filterRuntimeCompatibleTools;
	}
});
Object.defineProperty(exports, "inspectRuntimeToolInputSchemas", {
	enumerable: true,
	get: function() {
		return inspectRuntimeToolInputSchemas;
	}
});
Object.defineProperty(exports, "logAgentRuntimeToolDiagnostics", {
	enumerable: true,
	get: function() {
		return logAgentRuntimeToolDiagnostics;
	}
});
Object.defineProperty(exports, "logProviderToolSchemaDiagnostics", {
	enumerable: true,
	get: function() {
		return logProviderToolSchemaDiagnostics;
	}
});
Object.defineProperty(exports, "normalizeAgentRuntimeTools", {
	enumerable: true,
	get: function() {
		return normalizeAgentRuntimeTools;
	}
});
Object.defineProperty(exports, "normalizeProviderToolSchemas", {
	enumerable: true,
	get: function() {
		return normalizeProviderToolSchemas;
	}
});
