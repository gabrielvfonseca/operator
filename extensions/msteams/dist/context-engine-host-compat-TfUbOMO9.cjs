require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_init = require("./init-PqhbtEQA.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_host_compat = require("./host-compat-Dv3sKwAS.cjs");
const require_runtime_registry_loader = require("./runtime-registry-loader-Bm5Oi--4.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/commands/doctor/shared/context-engine-host-compat.ts
function normalizeRuntimeId(value) {
	if (typeof value !== "string") return;
	return require_openai_routing.normalizeEmbeddedAgentRuntime(value.trim().toLowerCase()) || void 0;
}
function parseModelRef(value) {
	return typeof value === "string" ? (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(value) ?? void 0 : void 0;
}
function listModelRefs(value) {
	if (typeof value === "string" && value.trim()) return [value.trim()];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return [];
	const refs = [];
	if (typeof value.primary === "string" && value.primary.trim()) refs.push(value.primary.trim());
	if (Array.isArray(value.fallbacks)) {
		for (const fallback of value.fallbacks) if (typeof fallback === "string" && fallback.trim()) refs.push(fallback.trim());
	}
	return refs;
}
function collectExplicitRuntimeRefs(cfg) {
	const refs = [];
	const push = (runtime, path) => {
		const runtimeId = normalizeRuntimeId(runtime);
		if (runtimeId && runtimeId !== "default") refs.push({
			runtimeId,
			path
		});
	};
	for (const [providerId, providerConfig] of Object.entries(cfg.models?.providers ?? {})) {
		push(providerConfig?.agentRuntime?.id, `models.providers.${providerId}.agentRuntime.id`);
		providerConfig?.models?.forEach((modelConfig, index) => {
			push(modelConfig?.agentRuntime?.id, `models.providers.${providerId}.models[${index}].agentRuntime.id`);
		});
	}
	for (const [modelRef, modelConfig] of Object.entries(cfg.agents?.defaults?.models ?? {})) push(modelConfig?.agentRuntime?.id, `agents.defaults.models.${modelRef}.agentRuntime.id`);
	cfg.agents?.list?.forEach((agent, index) => {
		const agentId = typeof agent.id === "string" && agent.id.trim() ? agent.id.trim() : `${index}`;
		for (const [modelRef, modelConfig] of Object.entries(agent.models ?? {})) push(modelConfig?.agentRuntime?.id, `agents.list.${agentId}.models.${modelRef}.agentRuntime.id`);
	});
	return refs;
}
function collectSelectedModelRefs(cfg) {
	const refs = [];
	const pushModel = (value, path, agentId) => {
		for (const modelRef of listModelRefs(value)) refs.push({
			modelRef,
			path,
			...agentId ? { agentId } : {}
		});
	};
	const pushModelMap = (models, path, agentId) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(models)) return;
		for (const modelRef of Object.keys(models)) refs.push({
			modelRef,
			path: `${path}.${modelRef}`,
			...agentId ? { agentId } : {}
		});
	};
	if (cfg.agents?.defaults?.model !== void 0) pushModel(cfg.agents.defaults.model, "agents.defaults.model");
	else refs.push({
		modelRef: `${require_defaults.DEFAULT_PROVIDER}/${require_defaults.DEFAULT_MODEL}`,
		path: "agents.defaults.model (default)"
	});
	pushModelMap(cfg.agents?.defaults?.models, "agents.defaults.models");
	cfg.agents?.list?.forEach((agent, index) => {
		const agentId = typeof agent.id === "string" && agent.id.trim() ? agent.id.trim() : void 0;
		const label = agentId ?? `${index}`;
		pushModel(agent.model ?? cfg.agents?.defaults?.model, `agents.list.${label}.model`, agentId);
		pushModelMap(agent.models, `agents.list.${label}.models`, agentId);
	});
	return refs;
}
function runtimeHostCandidate(params) {
	const runtimeId = normalizeRuntimeId(params.runtimeId) ?? params.runtimeId;
	if (runtimeId === "@gabrielvfonseca/operator" || runtimeId === "auto") return {
		runtimeId,
		host: require_host_compat.OPERATOR_EMBEDDED_CONTEXT_ENGINE_HOST,
		paths: params.paths
	};
	if (runtimeId === "codex") return {
		runtimeId,
		host: require_host_compat.CODEX_APP_SERVER_CONTEXT_ENGINE_HOST,
		paths: params.paths
	};
	const harness = require_registry.getRegisteredAgentHarness(runtimeId)?.harness;
	if (harness) return {
		runtimeId,
		host: {
			id: `harness:${harness.id}`,
			label: `${harness.label} harness`,
			capabilities: harness.contextEngineHostCapabilities ?? []
		},
		paths: params.paths
	};
	const cliBackend = require_cli_backends.resolveCliBackendConfig(runtimeId, params.cfg);
	return {
		runtimeId,
		host: require_host_compat.buildGenericCliContextEngineHostSupport({
			backendId: cliBackend?.id ?? runtimeId,
			capabilities: cliBackend?.contextEngineHostCapabilities
		}),
		paths: params.paths
	};
}
/** Collect effective agent-run host candidates from provider/model runtime policy. */
function collectConfiguredContextEngineAgentRunHosts(params) {
	const runtimePaths = /* @__PURE__ */ new Map();
	const push = (runtimeId, path) => {
		if (!runtimeId) return;
		const normalized = normalizeRuntimeId(runtimeId) ?? runtimeId;
		const paths = runtimePaths.get(normalized) ?? [];
		paths.push(path);
		runtimePaths.set(normalized, paths);
	};
	for (const ref of collectExplicitRuntimeRefs(params.cfg)) push(ref.runtimeId, ref.path);
	for (const model of collectSelectedModelRefs(params.cfg)) {
		const parsed = parseModelRef(model.modelRef);
		if (!parsed) continue;
		push(require_policy.resolveAgentHarnessPolicy({
			config: params.cfg,
			provider: parsed.provider,
			modelId: parsed.modelId,
			agentId: model.agentId
		}).runtime, model.path);
	}
	return [...runtimePaths.entries()].map(([runtimeId, paths]) => runtimeHostCandidate({
		cfg: params.cfg,
		runtimeId,
		paths
	}));
}
function selectedContextEngineSlotId(cfg) {
	const slotValue = cfg.plugins?.slots?.contextEngine;
	return typeof slotValue === "string" && slotValue.trim() ? slotValue.trim() : require_config_activation_shared.defaultSlotIdForKey("contextEngine");
}
async function resolveSelectedContextEngineInfo(params) {
	const engineId = selectedContextEngineSlotId(params.cfg);
	if (engineId === require_config_activation_shared.defaultSlotIdForKey("contextEngine") || engineId === "none") return {
		info: {
			id: engineId,
			name: engineId
		},
		warnings: []
	};
	require_init.ensureContextEnginesInitialized();
	if (require_registry.getContextEngineRegistration(engineId)?.lifecycle !== "runtime") {
		try {
			require_runtime_registry_loader.ensurePluginRegistryLoaded({
				scope: "all",
				config: params.cfg,
				env: params.env,
				onlyPluginIds: [engineId]
			});
		} catch (error) {
			if (require_registry.getContextEngineRegistration(engineId)?.lifecycle !== "runtime") return { warnings: [`- plugins.slots.contextEngine: could not inspect context engine "${engineId}" host requirements because its plugin failed to load: ${error instanceof Error ? error.message : String(error)}`] };
		}
		if (require_registry.getContextEngineRegistration(engineId)?.lifecycle !== "runtime") return { warnings: [`- plugins.slots.contextEngine: could not inspect context engine "${engineId}" host requirements because it is not registered.`] };
	}
	try {
		return {
			info: (await require_registry.resolveContextEngine(params.cfg, {
				agentDir: require_agent_scope_config.resolveDefaultAgentDir(params.cfg, params.env),
				workspaceDir: params.cfg.agents?.defaults?.workspace ? require_home_dir.resolveUserPath(params.cfg.agents.defaults.workspace, params.env) : void 0
			})).info,
			warnings: []
		};
	} catch (error) {
		return { warnings: [`- plugins.slots.contextEngine: could not inspect context engine "${engineId}" host requirements: ${error instanceof Error ? error.message : String(error)}`] };
	}
}
function collectHostCompatibilityIssues(params) {
	return params.hosts.flatMap((candidate) => {
		const evaluation = require_host_compat.evaluateContextEngineHostSupport({
			contextEngineInfo: params.info,
			operation: "agent-run",
			host: candidate.host
		});
		if (evaluation.ok) return [];
		return [{
			candidate,
			missingCapabilities: evaluation.missingCapabilities,
			requiredCapabilities: evaluation.requirements.requiredCapabilities
		}];
	});
}
function formatPaths(paths) {
	const unique = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(paths);
	if (unique.length <= 2) return unique.join(", ");
	return `${unique.slice(0, 2).join(", ")}, and ${unique.length - 2} more`;
}
function formatHostCapabilities(capabilities) {
	return capabilities.length > 0 ? capabilities.join(", ") : "(none)";
}
function formatCompatibilityWarnings(params) {
	if (params.issues.length === 0) return [];
	const lines = params.issues.map((issue) => {
		const paths = formatPaths(issue.candidate.paths);
		return `- plugins.slots.contextEngine: context engine "${params.info.id}" is incompatible with ${issue.candidate.host.label} (${paths}). Missing host capabilities: ${issue.missingCapabilities.join(", ")}. Required capabilities: ${issue.requiredCapabilities.join(", ")}. Host capabilities: ${formatHostCapabilities(issue.candidate.host.capabilities)}.`;
	});
	const incompatibleAllHosts = params.issues.length === params.hostCount;
	lines.push(incompatibleAllHosts ? `- Run "${params.doctorFixCommand}" to switch plugins.slots.contextEngine to "legacy", or configure a compatible runtime/harness for agent runs.` : `- Some configured runtimes support context engine "${params.info.id}" and others do not; doctor will not rewrite the global contextEngine slot automatically. Configure unsupported models to use a compatible runtime/harness or set plugins.slots.contextEngine to "legacy".`);
	return [lines.join("\n")];
}
/** Collect doctor warnings for context engines that cannot run under configured hosts. */
async function collectContextEngineHostCompatibilityWarnings(params) {
	const resolved = await resolveSelectedContextEngineInfo(params);
	if (!resolved.info) return resolved.warnings;
	const hosts = collectConfiguredContextEngineAgentRunHosts(params);
	const issues = collectHostCompatibilityIssues({
		info: resolved.info,
		hosts
	});
	return [...resolved.warnings, ...formatCompatibilityWarnings({
		info: resolved.info,
		issues,
		hostCount: hosts.length,
		doctorFixCommand: params.doctorFixCommand
	})];
}
/** Repair a globally incompatible context engine by falling back to legacy. */
async function maybeRepairContextEngineHostCompatibility(params) {
	const resolved = await resolveSelectedContextEngineInfo(params);
	if (!resolved.info) return {
		config: params.cfg,
		changes: [],
		warnings: resolved.warnings
	};
	const hosts = collectConfiguredContextEngineAgentRunHosts(params);
	const issues = collectHostCompatibilityIssues({
		info: resolved.info,
		hosts
	});
	if (issues.length === 0) return {
		config: params.cfg,
		changes: [],
		warnings: resolved.warnings
	};
	const warnings = formatCompatibilityWarnings({
		info: resolved.info,
		issues,
		hostCount: hosts.length,
		doctorFixCommand: params.doctorFixCommand
	});
	if (issues.length !== hosts.length) return {
		config: params.cfg,
		changes: [],
		warnings: [...resolved.warnings, ...warnings]
	};
	const next = structuredClone(params.cfg);
	next.plugins ??= {};
	next.plugins.slots ??= {};
	next.plugins.slots.contextEngine = require_config_activation_shared.defaultSlotIdForKey("contextEngine");
	return {
		config: next,
		changes: [`Set plugins.slots.contextEngine to "legacy" because context engine "${resolved.info.id}" is incompatible with every configured agent-run host.`],
		warnings: resolved.warnings
	};
}
//#endregion
exports.collectContextEngineHostCompatibilityWarnings = collectContextEngineHostCompatibilityWarnings;
exports.maybeRepairContextEngineHostCompatibility = maybeRepairContextEngineHostCompatibility;
