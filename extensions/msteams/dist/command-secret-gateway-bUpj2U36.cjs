const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_credentials_secret_inputs = require("./credentials-secret-inputs-WHVXyyR_.cjs");
const require_secret_input_paths = require("./secret-input-paths-DhtBjpGq.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_path_utils = require("./path-utils-B5Jty5Fz.cjs");
const require_secret_value = require("./secret-value-BpdByGIA.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
const require_command_config = require("./command-config-DYH4NzHI.cjs");
const require_runtime_config_collectors = require("./runtime-config-collectors-DvYfLIlw.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
const require_runtime_web_tools = require("./runtime-web-tools-DVYet9PT.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cli/command-secret-gateway.ts
var command_secret_gateway_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveCommandSecretRefsViaGateway: () => resolveCommandSecretRefsViaGateway });
const WEB_RUNTIME_SECRET_TARGET_ID_PREFIXES = [
	"tools.web.search",
	"tools.web.fetch",
	"plugins.entries."
];
const WEB_RUNTIME_SECRET_PATH_PREFIXES = [
	"tools.web.search.",
	"tools.web.fetch.",
	"plugins.entries."
];
const commandSecretGatewayDeps = {
	analyzeCommandSecretAssignmentsFromSnapshot: require_command_config.analyzeCommandSecretAssignmentsFromSnapshot,
	collectConfigAssignments: require_runtime_config_collectors.collectConfigAssignments,
	discoverConfigSecretTargetsByIds: require_target_registry.discoverConfigSecretTargetsByIds,
	resolveManifestContractOwnerPluginId: require_plugin_registry.resolveManifestContractOwnerPluginId,
	resolveRuntimeWebTools: require_runtime_web_tools.resolveRuntimeWebTools
};
const testing = {
	setDepsForTest(overrides) {
		const previous = { ...commandSecretGatewayDeps };
		Object.assign(commandSecretGatewayDeps, overrides);
		return () => {
			Object.assign(commandSecretGatewayDeps, previous);
		};
	},
	resetDepsForTest() {
		Object.assign(commandSecretGatewayDeps, {
			analyzeCommandSecretAssignmentsFromSnapshot: require_command_config.analyzeCommandSecretAssignmentsFromSnapshot,
			collectConfigAssignments: require_runtime_config_collectors.collectConfigAssignments,
			discoverConfigSecretTargetsByIds: require_target_registry.discoverConfigSecretTargetsByIds,
			resolveManifestContractOwnerPluginId: require_plugin_registry.resolveManifestContractOwnerPluginId,
			resolveRuntimeWebTools: require_runtime_web_tools.resolveRuntimeWebTools
		});
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.commandSecretGatewayTestApi")] = testing;
function pluginIdFromRuntimeWebPath(path) {
	return /^plugins\.entries\.([^.]+)\.config\.(webSearch|webFetch)\.apiKey$/.exec(path)?.[1];
}
function normalizeCommandSecretResolutionMode(mode) {
	if (!mode || mode === "enforce_resolved" || mode === "strict") return "enforce_resolved";
	if (mode === "read_only_status" || mode === "summary") return "read_only_status";
	return "read_only_operational";
}
function enforcesResolvedSecrets(mode) {
	return mode === "enforce_resolved";
}
function dedupeDiagnostics(entries) {
	const seen = /* @__PURE__ */ new Set();
	const ordered = [];
	for (const entry of entries) {
		const trimmed = entry.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		ordered.push(trimmed);
	}
	return ordered;
}
function targetsRuntimeWebPath(path) {
	return WEB_RUNTIME_SECRET_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
function classifyRuntimeWebTargetPathState(params) {
	if (params.path === "tools.web.search.apiKey") return params.config.tools?.web?.search?.enabled !== false ? "active" : "inactive";
	const fetchMatch = /^tools\.web\.fetch\.([^.]+)\.apiKey$/.exec(params.path);
	if (fetchMatch) {
		const fetch = params.config.tools?.web?.fetch;
		if (fetch?.enabled === false) return "inactive";
		const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(fetch?.provider);
		if (!configuredProvider) return "active";
		return configuredProvider === fetchMatch[1] ? "active" : "inactive";
	}
	const pluginId = pluginIdFromRuntimeWebPath(params.path);
	if (pluginId) {
		if (params.path.endsWith(".config.webFetch.apiKey")) {
			const fetch = params.config.tools?.web?.fetch;
			if (fetch?.enabled === false) return "inactive";
			const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(fetch?.provider);
			if (!configuredProvider) return "active";
			return commandSecretGatewayDeps.resolveManifestContractOwnerPluginId({
				contract: "webFetchProviders",
				value: configuredProvider,
				origin: "bundled",
				config: params.config
			}) === pluginId ? "active" : "inactive";
		}
		const search = params.config.tools?.web?.search;
		if (search?.enabled === false) return "inactive";
		const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(search?.provider);
		if (!configuredProvider) return "active";
		return commandSecretGatewayDeps.resolveManifestContractOwnerPluginId({
			contract: "webSearchProviders",
			value: configuredProvider,
			origin: "bundled",
			config: params.config
		}) === pluginId ? "active" : "inactive";
	}
	const match = /^tools\.web\.search\.([^.]+)\.apiKey$/.exec(params.path);
	if (!match) return "unknown";
	const search = params.config.tools?.web?.search;
	if (search?.enabled === false) return "inactive";
	const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(search?.provider);
	if (!configuredProvider) return "active";
	return configuredProvider === match[1] ? "active" : "inactive";
}
function describeInactiveRuntimeWebTargetPath(params) {
	if (params.path === "tools.web.search.apiKey") return params.config.tools?.web?.search?.enabled === false ? "tools.web.search is disabled." : void 0;
	const fetchMatch = /^tools\.web\.fetch\.([^.]+)\.apiKey$/.exec(params.path);
	if (fetchMatch) {
		const fetch = params.config.tools?.web?.fetch;
		if (fetch?.enabled === false) return "tools.web.fetch is disabled.";
		const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(fetch?.provider);
		if (configuredProvider && configuredProvider !== fetchMatch[1]) return `tools.web.fetch.provider is "${configuredProvider}".`;
		return;
	}
	const pluginId = pluginIdFromRuntimeWebPath(params.path);
	if (pluginId) {
		if (params.path.endsWith(".config.webFetch.apiKey")) {
			const fetch = params.config.tools?.web?.fetch;
			if (fetch?.enabled === false) return "tools.web.fetch is disabled.";
			const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(fetch?.provider);
			if (configuredProvider) return `tools.web.fetch.provider is "${configuredProvider}".`;
			return;
		}
		const search = params.config.tools?.web?.search;
		if (search?.enabled === false) return "tools.web.search is disabled.";
		const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(search?.provider);
		const configuredPluginId = configuredProvider ? commandSecretGatewayDeps.resolveManifestContractOwnerPluginId({
			contract: "webSearchProviders",
			value: configuredProvider,
			origin: "bundled",
			config: params.config
		}) : void 0;
		if (configuredPluginId && configuredPluginId !== pluginId) return `tools.web.search.provider is "${configuredProvider}".`;
		return;
	}
	const match = /^tools\.web\.search\.([^.]+)\.apiKey$/.exec(params.path);
	if (!match) return;
	const search = params.config.tools?.web?.search;
	if (search?.enabled === false) return "tools.web.search is disabled.";
	const configuredProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(search?.provider);
	if (configuredProvider && configuredProvider !== match[1]) return `tools.web.search.provider is "${configuredProvider}".`;
}
function targetsRuntimeWebResolution(params) {
	if (params.allowedPaths) {
		for (const path of params.allowedPaths) if (targetsRuntimeWebPath(path)) return true;
		return false;
	}
	for (const targetId of params.targetIds) if (WEB_RUNTIME_SECRET_TARGET_ID_PREFIXES.some((prefix) => targetId.startsWith(prefix))) return true;
	return false;
}
function collectConfiguredTargetRefPaths(params) {
	const defaults = params.config.secrets?.defaults;
	const configuredTargetRefPaths = /* @__PURE__ */ new Set();
	for (const target of commandSecretGatewayDeps.discoverConfigSecretTargetsByIds(params.config, params.targetIds)) {
		if (params.allowedPaths && !params.allowedPaths.has(target.path)) continue;
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults
		});
		if (ref) configuredTargetRefPaths.add(target.path);
	}
	return configuredTargetRefPaths;
}
function classifyConfiguredTargetRefs(params) {
	if (params.configuredTargetRefPaths.size === 0) return {
		hasActiveConfiguredRef: false,
		hasUnknownConfiguredRef: false,
		diagnostics: []
	};
	const context = require_runtime_shared.createResolverContext({
		sourceConfig: params.config,
		env: process.env
	});
	commandSecretGatewayDeps.collectConfigAssignments({
		config: structuredClone(params.config),
		context
	});
	const activePaths = new Set(context.assignments.map((assignment) => assignment.path));
	const inactiveWarningsByPath = /* @__PURE__ */ new Map();
	for (const warning of context.warnings) {
		if (warning.code !== "SECRETS_REF_IGNORED_INACTIVE_SURFACE") continue;
		inactiveWarningsByPath.set(warning.path, warning.message);
	}
	const diagnostics = /* @__PURE__ */ new Set();
	let hasActiveConfiguredRef = false;
	let hasUnknownConfiguredRef = false;
	for (const path of params.configuredTargetRefPaths) {
		if (activePaths.has(path) || params.forcedActivePaths?.has(path) || params.optionalActivePaths?.has(path)) {
			hasActiveConfiguredRef = true;
			continue;
		}
		const inactiveWarning = inactiveWarningsByPath.get(path);
		if (inactiveWarning) {
			diagnostics.add(inactiveWarning);
			continue;
		}
		hasUnknownConfiguredRef = true;
	}
	return {
		hasActiveConfiguredRef,
		hasUnknownConfiguredRef,
		diagnostics: [...diagnostics]
	};
}
function parseGatewaySecretsResolveResult(payload) {
	if (!require_src.validateSecretsResolveResult(payload)) throw new Error("gateway returned invalid secrets.resolve payload.");
	const parsed = payload;
	return {
		assignments: parsed.assignments ?? [],
		diagnostics: (parsed.diagnostics ?? []).filter((entry) => entry.trim().length > 0),
		inactiveRefPaths: (parsed.inactiveRefPaths ?? []).filter((entry) => entry.trim().length > 0)
	};
}
function collectInactiveSurfacePathsFromDiagnostics(diagnostics) {
	const paths = /* @__PURE__ */ new Set();
	for (const entry of diagnostics) {
		const markerIndex = entry.indexOf(": secret ref is configured on an inactive surface;");
		if (markerIndex <= 0) continue;
		const path = entry.slice(0, markerIndex).trim();
		if (path.length > 0) paths.add(path);
	}
	return paths;
}
function filterAllowedGatewayDiagnostics(params) {
	return params.diagnostics.filter((diagnostic) => {
		const markerIndex = diagnostic.indexOf(":");
		if (markerIndex <= 0) return true;
		const path = diagnostic.slice(0, markerIndex).trim();
		if (!path.includes(".")) return true;
		if (params.forcedActivePaths?.has(path) || params.optionalActivePaths?.has(path)) return false;
		return !params.allowedPaths || params.allowedPaths.has(path);
	});
}
function isUnsupportedSecretsResolveError(err) {
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_errors.formatErrorMessage(err));
	if (!message.includes("secrets.resolve")) return false;
	return message.includes("does not support required method") || message.includes("unknown method") || message.includes("method not found") || message.includes("invalid request");
}
function isAllowedPathsSecretsResolveCompatError(err) {
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_errors.formatErrorMessage(err));
	if (!message.includes("secrets.resolve")) return false;
	return message.includes("invalid request") || message.includes("invalid secrets.resolve params");
}
function hasForcedActivePaths(paths) {
	return paths !== void 0 && paths.size > 0;
}
function resolveLocalResolutionPolicy(params) {
	return {
		allowExecSecretRefs: params.allowLocalExecSecretRefs !== false,
		scrubUnresolvedSecretRefs: params.scrubUnresolvedSecretRefs !== false
	};
}
function collectActiveGatewayExecSecretRefCredentialPaths(config) {
	const defaults = config.secrets?.defaults;
	return require_secret_input_paths.ALL_GATEWAY_SECRET_INPUT_PATHS.filter((path) => {
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: require_secret_input_paths.readGatewaySecretInputValue(config, path),
			defaults
		});
		return ref?.source === "exec" && require_credentials_secret_inputs.gatewaySecretInputPathCanWin({
			config,
			path,
			env: process.env
		});
	});
}
async function resolveCommandSecretRefsWithoutGateway(params) {
	const fallback = await resolveCommandSecretRefsLocally({
		config: params.config,
		commandName: params.commandName,
		targetIds: params.targetIds,
		preflightDiagnostics: params.preflightDiagnostics,
		mode: params.mode,
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths,
		resolutionPolicy: params.resolutionPolicy
	});
	return {
		...fallback,
		diagnostics: dedupeDiagnostics([...fallback.diagnostics, params.reasonDiagnostic])
	};
}
async function callGatewaySecretsResolve(params) {
	const request = {
		config: params.config,
		method: "secrets.resolve",
		requiredMethods: ["secrets.resolve"],
		params: {
			commandName: params.commandName,
			targetIds: [...params.targetIds],
			...params.allowedPaths ? { allowedPaths: [...params.allowedPaths] } : {},
			...params.forcedActivePaths ? { forcedActivePaths: [...params.forcedActivePaths] } : {},
			...params.optionalActivePaths ? { optionalActivePaths: [...params.optionalActivePaths] } : {}
		},
		timeoutMs: 3e4,
		clientName: require_client_info.GATEWAY_CLIENT_NAMES.CLI,
		mode: require_client_info.GATEWAY_CLIENT_MODES.CLI
	};
	try {
		return await require_call.callGateway(request);
	} catch (err) {
		if (!params.allowedPaths && !params.forcedActivePaths && !params.optionalActivePaths || hasForcedActivePaths(params.forcedActivePaths) || !isAllowedPathsSecretsResolveCompatError(err)) throw err;
		return require_call.callGateway({
			...request,
			params: {
				commandName: params.commandName,
				targetIds: [...params.targetIds]
			}
		});
	}
}
function isDirectRuntimeWebTargetPath(path) {
	return path === "tools.web.search.apiKey" || /^plugins\.entries\.[^.]+\.config\.(webSearch|webFetch)\.apiKey$/.test(path) || /^tools\.web\.search\.[^.]+\.apiKey$/.test(path) || /^tools\.web\.fetch\.[^.]+\.apiKey$/.test(path);
}
async function resolveCommandSecretRefsLocally(params) {
	const sourceConfig = params.config;
	const resolvedConfig = structuredClone(params.config);
	const context = require_runtime_shared.createResolverContext({
		sourceConfig,
		env: process.env
	});
	const localResolutionDiagnostics = [];
	const discoveredTargets = commandSecretGatewayDeps.discoverConfigSecretTargetsByIds(sourceConfig, params.targetIds).filter((target) => !params.allowedPaths || params.allowedPaths.has(target.path));
	const runtimeWebTargets = discoveredTargets.filter((target) => targetsRuntimeWebPath(target.path));
	commandSecretGatewayDeps.collectConfigAssignments({
		config: structuredClone(params.config),
		context
	});
	if (targetsRuntimeWebResolution({
		targetIds: params.targetIds,
		allowedPaths: params.allowedPaths
	}) && !runtimeWebTargets.every((target) => isDirectRuntimeWebTargetPath(target.path))) try {
		await commandSecretGatewayDeps.resolveRuntimeWebTools({
			sourceConfig,
			resolvedConfig,
			context
		});
	} catch (error) {
		if (enforcesResolvedSecrets(params.mode)) throw error;
		localResolutionDiagnostics.push(`${params.commandName}: failed to resolve web tool secrets locally (${require_errors.formatErrorMessage(error)}).`);
	}
	const inactiveRefPaths = new Set(context.warnings.filter((warning) => warning.code === "SECRETS_REF_IGNORED_INACTIVE_SURFACE").filter((warning) => !params.allowedPaths || params.allowedPaths.has(warning.path)).filter((warning) => !params.forcedActivePaths?.has(warning.path)).filter((warning) => !params.optionalActivePaths?.has(warning.path)).map((warning) => warning.path));
	const runtimeWebActivePaths = /* @__PURE__ */ new Set();
	const runtimeWebInactiveDiagnostics = [];
	for (const target of runtimeWebTargets) {
		if (params.forcedActivePaths?.has(target.path) || params.optionalActivePaths?.has(target.path)) {
			runtimeWebActivePaths.add(target.path);
			continue;
		}
		const runtimeState = classifyRuntimeWebTargetPathState({
			config: sourceConfig,
			path: target.path
		});
		if (runtimeState === "inactive") {
			inactiveRefPaths.add(target.path);
			const inactiveDetail = describeInactiveRuntimeWebTargetPath({
				config: sourceConfig,
				path: target.path
			});
			if (inactiveDetail) runtimeWebInactiveDiagnostics.push(`${target.path}: ${inactiveDetail}`);
			continue;
		}
		if (runtimeState === "active") runtimeWebActivePaths.add(target.path);
	}
	const inactiveWarningDiagnostics = context.warnings.filter((warning) => warning.code === "SECRETS_REF_IGNORED_INACTIVE_SURFACE").filter((warning) => !params.allowedPaths || params.allowedPaths.has(warning.path)).filter((warning) => !params.forcedActivePaths?.has(warning.path)).filter((warning) => !params.optionalActivePaths?.has(warning.path)).map((warning) => warning.message);
	const activePaths = new Set(context.assignments.map((assignment) => assignment.path));
	for (const target of discoveredTargets) await resolveTargetSecretLocally({
		target,
		sourceConfig,
		resolvedConfig,
		env: context.env,
		cache: context.cache,
		activePaths,
		runtimeWebActivePaths,
		inactiveRefPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths,
		mode: params.mode,
		commandName: params.commandName,
		localResolutionDiagnostics,
		resolutionPolicy: params.resolutionPolicy
	});
	let analyzed = commandSecretGatewayDeps.analyzeCommandSecretAssignmentsFromSnapshot({
		sourceConfig,
		resolvedConfig,
		targetIds: params.targetIds,
		inactiveRefPaths,
		...params.allowedPaths ? { allowedPaths: params.allowedPaths } : {}
	});
	const optionalUnresolvedPaths = analyzed.unresolved.filter((entry) => params.optionalActivePaths?.has(entry.path)).map((entry) => entry.path);
	if (optionalUnresolvedPaths.length > 0) {
		for (const path of optionalUnresolvedPaths) inactiveRefPaths.add(path);
		analyzed = commandSecretGatewayDeps.analyzeCommandSecretAssignmentsFromSnapshot({
			sourceConfig,
			resolvedConfig,
			targetIds: params.targetIds,
			inactiveRefPaths,
			...params.allowedPaths ? { allowedPaths: params.allowedPaths } : {}
		});
	}
	const targetStatesByPath = buildTargetStatesByPath({
		analyzed,
		resolvedState: "resolved_local"
	});
	if (analyzed.unresolved.length > 0) {
		if (enforcesResolvedSecrets(params.mode)) throw new Error(`${params.commandName}: ${analyzed.unresolved[0]?.path ?? "target"} is unresolved in the active runtime snapshot.`);
		if (params.resolutionPolicy.scrubUnresolvedSecretRefs) scrubUnresolvedAssignments(resolvedConfig, analyzed.unresolved);
	}
	return {
		resolvedConfig,
		diagnostics: dedupeDiagnostics([
			...params.preflightDiagnostics,
			...runtimeWebInactiveDiagnostics,
			...inactiveWarningDiagnostics,
			...filterInactiveSurfaceDiagnostics({
				diagnostics: analyzed.diagnostics,
				inactiveRefPaths
			}),
			...localResolutionDiagnostics,
			...buildUnresolvedDiagnostics(params.commandName, analyzed.unresolved, params.mode)
		]),
		targetStatesByPath,
		hadUnresolvedTargets: analyzed.unresolved.length > 0
	};
}
function buildTargetStatesByPath(params) {
	const states = {};
	for (const assignment of params.analyzed.assignments) states[assignment.path] = params.resolvedState;
	for (const entry of params.analyzed.inactive) states[entry.path] = "inactive_surface";
	for (const entry of params.analyzed.unresolved) states[entry.path] = "unresolved";
	return states;
}
function buildUnresolvedDiagnostics(commandName, unresolved, mode) {
	if (enforcesResolvedSecrets(mode)) return [];
	return unresolved.map((entry) => `${commandName}: ${entry.path} is unavailable in this command path; continuing with degraded read-only config.`);
}
function scrubUnresolvedAssignments(config, unresolved) {
	for (const entry of unresolved) require_path_utils.setPathExistingStrict(config, entry.pathSegments, void 0);
}
function filterInactiveSurfaceDiagnostics(params) {
	return params.diagnostics.filter((entry) => {
		const markerIndex = entry.indexOf(": secret ref is configured on an inactive surface;");
		if (markerIndex <= 0) return true;
		const path = entry.slice(0, markerIndex).trim();
		return !params.inactiveRefPaths.has(path);
	});
}
async function resolveTargetSecretLocally(params) {
	const defaults = params.sourceConfig.secrets?.defaults;
	const { ref } = require_types_secrets.resolveSecretInputRef({
		value: params.target.value,
		refValue: params.target.refValue,
		defaults
	});
	if (!ref || params.inactiveRefPaths.has(params.target.path) || !params.activePaths.has(params.target.path) && !params.runtimeWebActivePaths.has(params.target.path) && !params.forcedActivePaths?.has(params.target.path) && !params.optionalActivePaths?.has(params.target.path)) return;
	if (ref.source === "exec" && !params.resolutionPolicy.allowExecSecretRefs) {
		if (!enforcesResolvedSecrets(params.mode)) params.localResolutionDiagnostics.push(`${params.commandName}: skipped local exec SecretRef resolution for ${params.target.path}; rerun with --allow-exec to execute configured exec providers.`);
		return;
	}
	try {
		const resolved = await require_resolve.resolveSecretRefValue(ref, {
			config: params.sourceConfig,
			env: params.env,
			cache: params.cache
		});
		require_secret_value.assertExpectedResolvedSecretValue({
			value: resolved,
			expected: params.target.entry.expectedResolvedValue,
			errorMessage: params.target.entry.expectedResolvedValue === "string" ? `${params.target.path} resolved to a non-string or empty value.` : `${params.target.path} resolved to an unsupported value type.`
		});
		require_path_utils.setPathExistingStrict(params.resolvedConfig, params.target.pathSegments, resolved);
	} catch (error) {
		if (!enforcesResolvedSecrets(params.mode)) params.localResolutionDiagnostics.push(`${params.commandName}: failed to resolve ${params.target.path} locally (${require_errors.formatErrorMessage(error)}).`);
	}
}
async function resolveCommandSecretRefsViaGateway(params) {
	const mode = normalizeCommandSecretResolutionMode(params.mode);
	const resolutionPolicy = resolveLocalResolutionPolicy({
		allowLocalExecSecretRefs: params.allowLocalExecSecretRefs,
		scrubUnresolvedSecretRefs: params.scrubUnresolvedSecretRefs
	});
	const configuredTargetRefPaths = collectConfiguredTargetRefPaths({
		config: params.config,
		targetIds: params.targetIds,
		allowedPaths: params.allowedPaths
	});
	if (configuredTargetRefPaths.size === 0) return {
		resolvedConfig: params.config,
		diagnostics: [],
		targetStatesByPath: {},
		hadUnresolvedTargets: false
	};
	const preflight = classifyConfiguredTargetRefs({
		config: params.config,
		configuredTargetRefPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths
	});
	if (!preflight.hasActiveConfiguredRef && !preflight.hasUnknownConfiguredRef) return {
		resolvedConfig: params.config,
		diagnostics: preflight.diagnostics,
		targetStatesByPath: {},
		hadUnresolvedTargets: false
	};
	const gatewayExecSecretRefCredentialPaths = resolutionPolicy.allowExecSecretRefs ? [] : collectActiveGatewayExecSecretRefCredentialPaths(params.config);
	if (gatewayExecSecretRefCredentialPaths.length > 0) return await resolveCommandSecretRefsWithoutGateway({
		config: params.config,
		commandName: params.commandName,
		targetIds: params.targetIds,
		preflightDiagnostics: preflight.diagnostics,
		mode,
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths,
		resolutionPolicy,
		reasonDiagnostic: `${params.commandName}: skipped gateway secrets.resolve because gateway credentials use exec SecretRefs at ${gatewayExecSecretRefCredentialPaths.join(", ")}; rerun with --allow-exec to execute configured exec providers.`
	});
	let payload;
	try {
		payload = await callGatewaySecretsResolve({
			config: params.config,
			commandName: params.commandName,
			targetIds: params.targetIds,
			allowedPaths: params.allowedPaths,
			forcedActivePaths: params.forcedActivePaths,
			optionalActivePaths: params.optionalActivePaths
		});
	} catch (err) {
		let forcedActiveCompatFailure;
		try {
			const fallback = await resolveCommandSecretRefsLocally({
				config: params.config,
				commandName: params.commandName,
				targetIds: params.targetIds,
				preflightDiagnostics: preflight.diagnostics,
				mode,
				allowedPaths: params.allowedPaths,
				forcedActivePaths: params.forcedActivePaths,
				optionalActivePaths: params.optionalActivePaths,
				resolutionPolicy
			});
			const recoveredLocally = Object.values(fallback.targetStatesByPath).some((state) => state === "resolved_local");
			if (hasForcedActivePaths(params.forcedActivePaths) && isAllowedPathsSecretsResolveCompatError(err) && (!recoveredLocally || fallback.hadUnresolvedTargets)) forcedActiveCompatFailure = new Error(`${params.commandName}: active gateway does not support command-scoped secret resolution (${require_errors.formatErrorMessage(err)}). Update the gateway or run this command where the configured SecretRefs can be resolved locally.`, { cause: err });
			else {
				const fallbackMessage = recoveredLocally && !fallback.hadUnresolvedTargets ? "resolved command secrets locally." : "attempted local command-secret resolution.";
				return {
					resolvedConfig: fallback.resolvedConfig,
					diagnostics: dedupeDiagnostics([...fallback.diagnostics, `${params.commandName}: gateway secrets.resolve unavailable (${require_errors.formatErrorMessage(err)}); ${fallbackMessage}`]),
					targetStatesByPath: fallback.targetStatesByPath,
					hadUnresolvedTargets: fallback.hadUnresolvedTargets
				};
			}
		} catch {}
		if (forcedActiveCompatFailure) throw forcedActiveCompatFailure;
		if (hasForcedActivePaths(params.forcedActivePaths) && isAllowedPathsSecretsResolveCompatError(err)) throw new Error(`${params.commandName}: active gateway does not support command-scoped secret resolution (${require_errors.formatErrorMessage(err)}). Update the gateway or run this command where the configured SecretRefs can be resolved locally.`, { cause: err });
		if (isUnsupportedSecretsResolveError(err)) throw new Error(`${params.commandName}: active gateway does not support secrets.resolve (${require_errors.formatErrorMessage(err)}). Update the gateway or run without SecretRefs.`, { cause: err });
		throw new Error(`${params.commandName}: failed to resolve secrets from the active gateway snapshot (${require_errors.formatErrorMessage(err)}). Start the gateway and retry.`, { cause: err });
	}
	const parsed = parseGatewaySecretsResolveResult(payload);
	const gatewayDiagnostics = filterAllowedGatewayDiagnostics({
		allowedPaths: params.allowedPaths,
		forcedActivePaths: params.forcedActivePaths,
		optionalActivePaths: params.optionalActivePaths,
		diagnostics: parsed.diagnostics
	});
	const gatewayInactiveRefPaths = params.allowedPaths ? parsed.inactiveRefPaths.filter((path) => params.allowedPaths?.has(path)) : parsed.inactiveRefPaths;
	const resolvedConfig = structuredClone(params.config);
	const assignments = params.allowedPaths ? parsed.assignments.filter((assignment) => {
		const path = assignment.path ?? assignment.pathSegments.join(".");
		return params.allowedPaths?.has(path);
	}) : parsed.assignments;
	for (const assignment of assignments) {
		const pathSegments = assignment.pathSegments.filter((segment) => segment.length > 0);
		if (pathSegments.length === 0) continue;
		try {
			require_path_utils.setPathExistingStrict(resolvedConfig, pathSegments, assignment.value);
		} catch (err) {
			const path = pathSegments.join(".");
			throw new Error(`${params.commandName}: failed to apply resolved secret assignment at ${path} (${require_errors.formatErrorMessage(err)}).`, { cause: err });
		}
	}
	const inactiveRefPaths = new Set(gatewayInactiveRefPaths.length > 0 ? gatewayInactiveRefPaths : collectInactiveSurfacePathsFromDiagnostics(gatewayDiagnostics));
	for (const path of params.forcedActivePaths ?? []) inactiveRefPaths.delete(path);
	for (const path of params.optionalActivePaths ?? []) inactiveRefPaths.delete(path);
	let analyzed = commandSecretGatewayDeps.analyzeCommandSecretAssignmentsFromSnapshot({
		sourceConfig: params.config,
		resolvedConfig,
		targetIds: params.targetIds,
		inactiveRefPaths,
		allowedPaths: params.allowedPaths
	});
	const optionalUnresolvedPaths = analyzed.unresolved.filter((entry) => params.optionalActivePaths?.has(entry.path)).map((entry) => entry.path);
	if (optionalUnresolvedPaths.length > 0) {
		for (const path of optionalUnresolvedPaths) inactiveRefPaths.add(path);
		analyzed = commandSecretGatewayDeps.analyzeCommandSecretAssignmentsFromSnapshot({
			sourceConfig: params.config,
			resolvedConfig,
			targetIds: params.targetIds,
			inactiveRefPaths,
			allowedPaths: params.allowedPaths
		});
	}
	let diagnostics = dedupeDiagnostics(gatewayDiagnostics);
	const targetStatesByPath = buildTargetStatesByPath({
		analyzed,
		resolvedState: "resolved_gateway"
	});
	if (analyzed.unresolved.length > 0) try {
		const localFallback = await resolveCommandSecretRefsLocally({
			config: params.config,
			commandName: params.commandName,
			targetIds: params.targetIds,
			preflightDiagnostics: [],
			mode,
			allowedPaths: new Set(analyzed.unresolved.map((entry) => entry.path)),
			forcedActivePaths: params.forcedActivePaths,
			optionalActivePaths: params.optionalActivePaths,
			resolutionPolicy
		});
		for (const unresolved of analyzed.unresolved) {
			if (localFallback.targetStatesByPath[unresolved.path] !== "resolved_local") continue;
			require_path_utils.setPathExistingStrict(resolvedConfig, unresolved.pathSegments, require_path_utils.getPath(localFallback.resolvedConfig, unresolved.pathSegments));
			targetStatesByPath[unresolved.path] = "resolved_local";
		}
		const recoveredPaths = new Set(Object.entries(localFallback.targetStatesByPath).filter(([, state]) => state === "resolved_local").map(([path]) => path));
		const stillUnresolved = analyzed.unresolved.filter((entry) => !recoveredPaths.has(entry.path));
		if (stillUnresolved.length > 0) {
			if (enforcesResolvedSecrets(mode)) throw new Error(`${params.commandName}: ${stillUnresolved[0]?.path ?? "target"} is unresolved in the active runtime snapshot.`);
			if (resolutionPolicy.scrubUnresolvedSecretRefs) scrubUnresolvedAssignments(resolvedConfig, stillUnresolved);
			diagnostics = dedupeDiagnostics([
				...diagnostics,
				...localFallback.diagnostics,
				...buildUnresolvedDiagnostics(params.commandName, stillUnresolved, mode)
			]);
			for (const unresolved of stillUnresolved) targetStatesByPath[unresolved.path] = "unresolved";
		} else if (recoveredPaths.size > 0) diagnostics = dedupeDiagnostics([...diagnostics, `${params.commandName}: resolved ${recoveredPaths.size} secret ${recoveredPaths.size === 1 ? "path" : "paths"} locally after the gateway snapshot was incomplete.`]);
	} catch (error) {
		if (enforcesResolvedSecrets(mode)) throw error;
		if (resolutionPolicy.scrubUnresolvedSecretRefs) scrubUnresolvedAssignments(resolvedConfig, analyzed.unresolved);
		diagnostics = dedupeDiagnostics([
			...diagnostics,
			`${params.commandName}: local fallback after incomplete gateway snapshot failed (${require_errors.formatErrorMessage(error)}).`,
			...buildUnresolvedDiagnostics(params.commandName, analyzed.unresolved, mode)
		]);
	}
	return {
		resolvedConfig,
		diagnostics,
		targetStatesByPath,
		hadUnresolvedTargets: Object.values(targetStatesByPath).includes("unresolved")
	};
}
//#endregion
Object.defineProperty(exports, "command_secret_gateway_exports", {
	enumerable: true,
	get: function() {
		return command_secret_gateway_exports;
	}
});
Object.defineProperty(exports, "resolveCommandSecretRefsViaGateway", {
	enumerable: true,
	get: function() {
		return resolveCommandSecretRefsViaGateway;
	}
});
