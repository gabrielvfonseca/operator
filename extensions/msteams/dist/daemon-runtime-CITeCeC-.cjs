const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_host_env_security = require("./host-env-security-DTRiezH-.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
const require_runtime_shared = require("./runtime-shared-3TeB-bbT.cjs");
const require_runtime_config_collectors_plugins = require("./runtime-config-collectors-plugins-B1RcVktF.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_systemd = require("./systemd-BxVKNLOg.cjs");
const require_service_path_policy = require("./service-path-policy-BSLgjeec.cjs");
const require_program_args = require("./program-args-YjZGo5sC.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
//#region src/daemon/service-env-plan.ts
/** Builds normalized environment plans for managed daemon service rendering. */
function createMutableServiceEnvPlan() {
	return {
		environment: {},
		environmentValueSources: {}
	};
}
function normalizeServiceEnvPlanKey(rawKey) {
	return require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true })?.toUpperCase();
}
function addServiceEnvPlanEntries(plan, entries, options) {
	for (const [rawKey, rawValue] of Object.entries(entries)) {
		if (typeof rawValue !== "string" || !rawValue.trim()) {
			if (options.includeRawKeys) {
				plan.environment[rawKey] = rawValue;
				plan.environmentValueSources[rawKey] = "inline";
			}
			continue;
		}
		const value = rawValue;
		const normalizedKey = normalizeServiceEnvPlanKey(rawKey);
		if (!normalizedKey) continue;
		plan.environment[rawKey] = value;
		const valueSource = typeof options.valueSource === "function" ? options.valueSource({
			rawKey,
			normalizedKey
		}) : options.valueSource;
		plan.environmentValueSources[rawKey] = valueSource ?? "inline";
	}
}
function compactServiceEnvPlanValueSources(plan) {
	for (const key of Object.keys(plan.environmentValueSources)) if (!Object.hasOwn(plan.environment, key)) delete plan.environmentValueSources[key];
}
//#endregion
//#region src/daemon/service-env-render-policy.ts
/** Applies platform render policy for managed daemon service environment values. */
function isLaunchAgentServiceEnvironment(params) {
	return params.platform === "darwin" && Boolean(params.serviceEnvironment.OPERATOR_LAUNCHD_LABEL?.trim());
}
function addManagedServiceEnvEntries(params) {
	for (const [rawKey, value] of Object.entries(params.entries)) {
		if (typeof value !== "string" || !value.trim()) continue;
		const key = normalizeServiceEnvPlanKey(rawKey);
		if (!key || !params.managedKeys.has(key)) continue;
		params.plan.environment[rawKey] = value;
		params.plan.environmentValueSources[rawKey] = params.valueSource;
	}
}
function applyManagedServiceEnvRenderPolicy(params) {
	const launchAgent = isLaunchAgentServiceEnvironment(params);
	require_systemd.writeManagedServiceEnvKeysToEnvironment(params.plan.environment, params.managedServiceEnvKeys);
	if (params.plan.environment.OPERATOR_SERVICE_MANAGED_ENV_KEYS) params.plan.environmentValueSources.OPERATOR_SERVICE_MANAGED_ENV_KEYS = "inline";
	const managedKeys = require_systemd.readManagedServiceEnvKeysFromEnvironment({ OPERATOR_SERVICE_MANAGED_ENV_KEYS: params.managedServiceEnvKeys });
	if (managedKeys.size === 0) return;
	if (launchAgent) {
		addManagedServiceEnvEntries({
			plan: params.plan,
			entries: params.existingEnvironmentFileEnvironment,
			managedKeys,
			valueSource: "file"
		});
		addManagedServiceEnvEntries({
			plan: params.plan,
			entries: params.stateDirDotEnvEnvironment,
			managedKeys,
			valueSource: "inline"
		});
	}
	addManagedServiceEnvEntries({
		plan: params.plan,
		entries: params.configSecretRefEnvironment,
		managedKeys,
		valueSource: params.platform === "linux" ? "file" : "inline"
	});
}
//#endregion
//#region src/commands/daemon-install-runtime-warning.ts
/** Warn when daemon install will use a system Node path that may be unsuitable. */
async function emitNodeRuntimeWarning(params) {
	const warning = require_service_path_policy.renderSystemNodeWarning(await require_service_path_policy.resolveSystemNodeInfo({ env: params.env }), params.nodeProgram);
	if (warning) params.warn?.(warning, params.title);
}
//#endregion
//#region src/commands/daemon-install-plan.shared.ts
/** Detect source-checkout dev mode from the current CLI entrypoint. */
function resolveGatewayDevMode(argv = process.argv) {
	const normalizedEntry = argv[1]?.replaceAll("\\", "/");
	return !!normalizedEntry?.includes("/src/") && normalizedEntry.endsWith(".ts");
}
/** Resolve dev-mode and Node path inputs for daemon service install planning. */
async function resolveDaemonInstallRuntimeInputs(params) {
	return {
		devMode: params.devMode ?? resolveGatewayDevMode(),
		nodePath: params.nodePath ?? await require_service_path_policy.resolvePreferredNodePath({
			env: params.env,
			runtime: params.runtime
		})
	};
}
/** Emit runtime warnings for daemon install command arguments. */
async function emitDaemonInstallRuntimeWarning(params) {
	await emitNodeRuntimeWarning({
		env: params.env,
		runtime: params.runtime,
		nodeProgram: params.programArguments[0],
		warn: params.warn,
		title: params.title
	});
}
/** Return the Node binary directory that should be added to daemon PATH. */
function resolveDaemonNodeBinDir(nodePath) {
	const trimmed = nodePath?.trim();
	if (!trimmed || !node_path.default.isAbsolute(trimmed)) return;
	return [node_path.default.dirname(trimmed)];
}
function isOperatorCommandBasename(basename, platform) {
	if (basename === "@gabrielvfonseca/operator") return true;
	if (platform === "win32") return basename === "operator.cmd" || basename === "operator.ps1" || basename === "operator.exe";
	return false;
}
function safeRealpathSync(inputPath, realpathSync) {
	if (!inputPath) return;
	try {
		return realpathSync(inputPath);
	} catch {
		return;
	}
}
function addUniquePathDir(dirs, dir) {
	if (!dir || !node_path.default.isAbsolute(dir) || dirs.includes(dir)) return;
	dirs.push(dir);
}
/** Resolve the Operator CLI binary directory from argv/PATH for daemon PATH. */
function resolveDaemonOperatorBinDir(params = {}) {
	const platform = params.platform ?? process.platform;
	const argv = params.argv ?? process.argv;
	const env = params.env ?? process.env;
	const existsSync = params.existsSync ?? node_fs.default.existsSync;
	const realpathSync = params.realpathSync ?? node_fs.default.realpathSync.native;
	const argv1 = argv[1]?.trim();
	const dirs = [];
	if (argv1 && node_path.default.isAbsolute(argv1) && isOperatorCommandBasename(node_path.default.basename(argv1), platform)) addUniquePathDir(dirs, node_path.default.dirname(argv1));
	const argvRealpath = node_path.default.isAbsolute(argv1 ?? "") ? safeRealpathSync(argv1, realpathSync) : void 0;
	for (const rawSegment of (env.PATH ?? "").split(node_path.default.delimiter)) {
		const segment = rawSegment.trim();
		if (!node_path.default.isAbsolute(segment)) continue;
		const candidate = node_path.default.join(segment, platform === "win32" ? "operator.cmd" : "@gabrielvfonseca/operator");
		if (!existsSync(candidate)) continue;
		const candidateRealpath = safeRealpathSync(candidate, realpathSync);
		if (argvRealpath && candidateRealpath && candidateRealpath !== argvRealpath) continue;
		addUniquePathDir(dirs, segment);
	}
	return dirs.length > 0 ? dirs : void 0;
}
/** Merge Node and Operator binary directories for the daemon service PATH. */
function resolveDaemonServicePathDirs(params) {
	const dirs = [];
	for (const dir of resolveDaemonNodeBinDir(params.nodePath) ?? []) addUniquePathDir(dirs, dir);
	for (const dir of resolveDaemonOperatorBinDir(params) ?? []) addUniquePathDir(dirs, dir);
	return dirs.length > 0 ? dirs : void 0;
}
//#endregion
//#region src/commands/daemon-install-helpers.ts
const NON_PERSISTED_CONFIG_SECRET_ENV_TARGET_IDS = /* @__PURE__ */ new Set(["gateway.auth.password", "gateway.auth.token"]);
const EXEC_SECRET_REF_PASS_ENV_ALLOWED_OVERRIDE_ONLY_KEYS = /* @__PURE__ */ new Set(["HOME"]);
function configContainsSecretRef(config) {
	if (!config) return false;
	const pending = [config];
	const seen = /* @__PURE__ */ new Set();
	const defaults = config.secrets?.defaults;
	while (pending.length > 0) {
		const value = pending.pop();
		if (require_types_secrets.coerceSecretRef(value, defaults)) return true;
		if (!value || typeof value !== "object" || seen.has(value)) continue;
		seen.add(value);
		pending.push(...Object.values(value));
	}
	return false;
}
function isBlockedExecSecretRefPassEnvKey(key) {
	if (require_host_env_security.isDangerousHostEnvVarName(key)) return true;
	if (!require_host_env_security.isDangerousHostEnvOverrideVarName(key)) return false;
	return !EXEC_SECRET_REF_PASS_ENV_ALLOWED_OVERRIDE_ONLY_KEYS.has(key.toUpperCase());
}
const loadDaemonInstallAuthProfileSourceRuntime = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./daemon-install-auth-profiles-source.runtime-Bf4Bi1AB.cjs")), { cacheRejections: true });
const loadDaemonInstallAuthProfileStoreRuntime = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./daemon-install-auth-profiles-store.runtime-BeZS3oQx.cjs")), { cacheRejections: true });
async function resolveAuthProfileStoreForServiceEnv(authStore) {
	if (authStore) return authStore;
	const { hasAnyAuthProfileStoreSource } = await loadDaemonInstallAuthProfileSourceRuntime();
	if (!hasAnyAuthProfileStoreSource()) return;
	const { loadAuthProfileStoreForSecretsRuntime } = await loadDaemonInstallAuthProfileStoreRuntime();
	return loadAuthProfileStoreForSecretsRuntime();
}
function collectAuthProfileSecretRefs(authStore) {
	if (!authStore) return [];
	const refs = [];
	for (const credential of Object.values(authStore.profiles)) {
		const ref = credential.type === "api_key" ? credential.keyRef : credential.type === "token" ? credential.tokenRef : void 0;
		if (ref) refs.push(ref);
	}
	return refs;
}
function collectAuthProfileServiceEnvVars(params) {
	const entries = {};
	for (const ref of collectAuthProfileSecretRefs(params.authStore)) {
		if (ref?.source !== "env") continue;
		const key = require_host_env_security.normalizeEnvVarKey(ref.id, { portable: true });
		if (!key) continue;
		if (require_host_env_security.isDangerousHostEnvVarName(key) || require_host_env_security.isDangerousHostEnvOverrideVarName(key)) {
			params.warn?.(`Auth profile env ref "${key}" blocked by host-env security policy`, "Auth profile");
			continue;
		}
		const value = params.env[key]?.trim();
		if (!value) continue;
		entries[key] = value;
	}
	return entries;
}
function collectConfigSecretRefServiceEnvSources(params) {
	const keys = /* @__PURE__ */ new Set();
	const environment = {};
	if (!params.config || !params.configContainsSecretRef) return {
		keys: [],
		environment
	};
	for (const target of require_target_registry.discoverConfigSecretTargets(params.config)) {
		if (!target.entry.includeInPlan) continue;
		if (NON_PERSISTED_CONFIG_SECRET_ENV_TARGET_IDS.has(target.entry.id)) continue;
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults: params.config.secrets?.defaults
		});
		if (ref?.source !== "env") continue;
		const key = require_host_env_security.normalizeEnvVarKey(ref.id, { portable: true });
		if (!key) {
			params.warn?.(`Config SecretRef env id "${ref.id}" is not portable and was not added to the service environment`, "Config SecretRef");
			continue;
		}
		if (require_host_env_security.isDangerousHostEnvVarName(key) || require_host_env_security.isDangerousHostEnvOverrideVarName(key)) {
			params.warn?.(`Config SecretRef env ref "${key}" blocked by host-env security policy`, "Config SecretRef");
			continue;
		}
		keys.add(key.toUpperCase());
		if (Object.hasOwn(params.stateDirDotEnvEnvironment, key)) continue;
		const value = params.env[key]?.trim();
		if (!value) continue;
		environment[key] = value;
	}
	return {
		keys: [...keys],
		environment
	};
}
function collectExecSecretRefPassEnvServiceEnvVars(params) {
	if (!params.config) return {};
	const entries = {};
	let manifestRegistry;
	const sources = [];
	if (params.configContainsSecretRef) for (const target of require_target_registry.discoverConfigSecretTargets(params.config)) {
		if (!target.entry.includeInPlan) continue;
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults: params.config.secrets?.defaults
		});
		if (ref?.source !== "exec") continue;
		sources.push({
			ref,
			warningTitle: "Config SecretRef"
		});
	}
	for (const ref of collectAuthProfileSecretRefs(params.authStore)) if (ref.source === "exec") sources.push({
		ref,
		warningTitle: "Auth profile"
	});
	if (params.configContainsSecretRef) {
		for (const ref of collectPluginConfigSecretRefs({
			env: params.env,
			config: params.config
		})) if (ref.source === "exec") sources.push({
			ref,
			warningTitle: "Plugin config SecretRef"
		});
	}
	for (const { ref, warningTitle } of sources) {
		const provider = params.config.secrets?.providers?.[ref.provider];
		if (provider?.source !== "exec") continue;
		const execProvider = require_resolve.isPluginIntegrationSecretProviderConfig(provider) ? (() => {
			manifestRegistry ??= require_manifest_registry.loadPluginManifestRegistry({
				config: params.config,
				env: params.env
			});
			const resolved = require_resolve.resolveSecretProviderIntegrationConfig({
				manifestRegistry,
				providerAlias: ref.provider,
				providerConfig: provider,
				config: params.config,
				env: params.env
			});
			if (!resolved.ok) {
				params.warn?.(`Exec SecretRef plugin provider "${ref.provider}" could not be resolved for service environment planning: ${resolved.reason}`, warningTitle);
				return;
			}
			return resolved.providerConfig;
		})() : provider;
		if (!execProvider) continue;
		for (const rawKey of execProvider.passEnv ?? []) {
			const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
			if (!key) {
				params.warn?.(`Exec SecretRef passEnv id "${rawKey}" is not portable and was not added to the service environment`, warningTitle);
				continue;
			}
			if (isBlockedExecSecretRefPassEnvKey(key)) {
				params.warn?.(`Exec SecretRef passEnv ref "${key}" blocked by host-env security policy`, warningTitle);
				continue;
			}
			if (Object.hasOwn(params.durableEnvironment, key)) continue;
			const value = params.env[key]?.trim();
			if (!value) continue;
			entries[key] = value;
		}
	}
	return entries;
}
function collectPluginConfigSecretRefs(params) {
	const context = require_runtime_shared.createResolverContext({
		sourceConfig: params.config,
		env: params.env
	});
	require_runtime_config_collectors_plugins.collectPluginConfigAssignments({
		config: params.config,
		defaults: params.config.secrets?.defaults,
		context
	});
	return context.assignments.map((assignment) => assignment.ref);
}
function mergeServicePath(nextPath, existingPath, tmpDir, platform) {
	const segments = [];
	const seen = /* @__PURE__ */ new Set();
	const normalizedTmpDirs = [tmpDir, node_os.default.tmpdir()].map((value) => value?.trim()).filter((value) => Boolean(value)).map((value) => node_path.default.resolve(value));
	const realTmpDirs = normalizedTmpDirs.map((tmpRoot) => {
		try {
			return node_path.default.normalize(node_fs.default.realpathSync.native(tmpRoot));
		} catch {
			return tmpRoot;
		}
	});
	const isSameOrChildPath = (candidate, parent) => candidate === parent || candidate.startsWith(`${parent}${node_path.default.sep}`);
	const isUnsafeProcPath = (candidate) => candidate === `${node_path.default.sep}proc` || candidate.startsWith(`${node_path.default.sep}proc${node_path.default.sep}`);
	const realpathExistingPath = (candidate) => {
		const parts = [];
		let current = candidate;
		while (current && current !== node_path.default.dirname(current)) try {
			const realCurrent = node_path.default.normalize(node_fs.default.realpathSync.native(current));
			return node_path.default.normalize(node_path.default.join(realCurrent, ...parts.toReversed()));
		} catch {
			parts.push(node_path.default.basename(current));
			current = node_path.default.dirname(current);
		}
		try {
			return node_path.default.normalize(node_path.default.join(node_fs.default.realpathSync.native(current), ...parts.toReversed()));
		} catch {
			return;
		}
	};
	const normalizePreservedPathSegment = (segment) => {
		if (!node_path.default.isAbsolute(segment)) return;
		const normalized = node_path.default.normalize(segment);
		if (isUnsafeProcPath(normalized)) return;
		const cwd = node_path.default.resolve(process.cwd());
		if (isSameOrChildPath(normalized, cwd)) return;
		try {
			const realSegment = realpathExistingPath(normalized);
			const realCwd = node_path.default.normalize(node_fs.default.realpathSync.native(cwd));
			if (realSegment && isSameOrChildPath(realSegment, realCwd)) return;
		} catch {}
		return normalized;
	};
	const shouldPreserveNormalizedPathSegment = (segment) => {
		if (require_service_path_policy.isNonMinimalServicePathEntry(segment, platform)) return false;
		const resolved = node_path.default.resolve(segment);
		const realResolved = realpathExistingPath(resolved) ?? resolved;
		return ![...normalizedTmpDirs, ...realTmpDirs].some((tmpRoot) => isSameOrChildPath(resolved, tmpRoot) || isSameOrChildPath(realResolved, tmpRoot));
	};
	const addPath = (value, options) => {
		if (typeof value !== "string" || value.trim().length === 0) return;
		for (const segment of value.split(node_path.default.delimiter)) {
			const trimmed = segment.trim();
			const candidate = options?.preserve ? normalizePreservedPathSegment(trimmed) : trimmed;
			if (options?.preserve && (!candidate || !shouldPreserveNormalizedPathSegment(candidate))) continue;
			if (!candidate || seen.has(candidate)) continue;
			seen.add(candidate);
			segments.push(candidate);
		}
	};
	addPath(nextPath);
	if (platform !== "darwin") addPath(existingPath, { preserve: true });
	return segments.length > 0 ? segments.join(node_path.default.delimiter) : void 0;
}
const PRESERVED_OPERATOR_OPERATOR_OPT_IN_ENV_KEYS = /* @__PURE__ */ new Set(["OPERATOR_CLI_CONTAINER_BYPASS", "OPERATOR_CONTAINER_HINT"]);
/** Preserve safe operator-owned env vars from an existing service definition. */
function collectPreservedExistingServiceEnvVars(existingEnvironment, managedServiceEnvKeys) {
	if (!existingEnvironment) return {};
	const preserved = {};
	for (const [rawKey, rawValue] of Object.entries(existingEnvironment)) {
		const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
		if (!key) continue;
		const upper = key.toUpperCase();
		if (upper === "HOME" || upper === "PATH" || upper === "TMPDIR" || upper.startsWith("OPERATOR_") && !PRESERVED_OPERATOR_OPERATOR_OPT_IN_ENV_KEYS.has(upper)) continue;
		if (managedServiceEnvKeys.has(upper)) continue;
		if (require_host_env_security.isDangerousHostEnvVarName(key) || require_host_env_security.isDangerousHostEnvOverrideVarName(key)) continue;
		const value = rawValue?.trim();
		if (!value) continue;
		preserved[key] = value;
	}
	return preserved;
}
function readExistingEnvironmentValueSource(params) {
	for (const [rawKey, source] of Object.entries(params.existingEnvironmentValueSources ?? {})) if (require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true })?.toUpperCase() === params.normalizedKey) return source;
}
function collectExistingEnvironmentFileManagedServiceEnvVars(params) {
	if (!params.existingEnvironment || params.configSecretRefKeys.size === 0) return {};
	const preserved = {};
	for (const [rawKey, rawValue] of Object.entries(params.existingEnvironment)) {
		const key = require_host_env_security.normalizeEnvVarKey(rawKey, { portable: true });
		if (!key) continue;
		const normalizedKey = key.toUpperCase();
		if (!params.configSecretRefKeys.has(normalizedKey)) continue;
		if (require_host_env_security.isDangerousHostEnvVarName(key) || require_host_env_security.isDangerousHostEnvOverrideVarName(key)) continue;
		if (!require_systemd.hasEnvironmentFileSource(readExistingEnvironmentValueSource({
			existingEnvironmentValueSources: params.existingEnvironmentValueSources,
			normalizedKey
		}))) continue;
		const value = rawValue?.trim();
		if (!value) continue;
		preserved[key] = value;
	}
	return preserved;
}
function omitEnvironmentEntriesShadowedBy(entries, shadowEntries) {
	const shadowKeys = new Set(shadowEntries.flatMap((environment) => Object.keys(environment).flatMap((key) => {
		const normalized = require_host_env_security.normalizeEnvVarKey(key, { portable: true })?.toUpperCase();
		return normalized ? [normalized] : [];
	})));
	return Object.fromEntries(Object.entries(entries).filter(([key]) => {
		const normalized = require_host_env_security.normalizeEnvVarKey(key, { portable: true })?.toUpperCase();
		return !normalized || !shadowKeys.has(normalized);
	}));
}
function resolveGatewayInstallWorkingDirectory(params) {
	if (params.workingDirectory) return params.workingDirectory;
	if (params.platform !== "darwin") return;
	return require_paths.resolveGatewayStateDir(params.env);
}
async function buildGatewayInstallEnvironment(params) {
	const { stateDirDotEnvEnvironment, configEnvironment, durableEnvironment } = require_systemd.collectDurableServiceEnvVarSources({
		env: params.env,
		config: params.config
	});
	const containsConfigSecretRef = configContainsSecretRef(params.config);
	const { keys: configSecretRefKeys, environment: configSecretRefEnvironment } = collectConfigSecretRefServiceEnvSources({
		env: params.env,
		config: params.config,
		configContainsSecretRef: containsConfigSecretRef,
		stateDirDotEnvEnvironment,
		warn: params.warn
	});
	const authStore = await resolveAuthProfileStoreForServiceEnv(params.authStore);
	const execSecretRefPassEnvEnvironment = collectExecSecretRefPassEnvServiceEnvVars({
		env: params.env,
		config: params.config,
		configContainsSecretRef: containsConfigSecretRef,
		authStore,
		durableEnvironment,
		warn: params.warn
	});
	const authProfileEnvironment = collectAuthProfileServiceEnvVars({
		env: params.env,
		authStore,
		warn: params.warn
	});
	const stateDirDotEnvRenderEnvironment = omitEnvironmentEntriesShadowedBy(stateDirDotEnvEnvironment, [
		configEnvironment,
		configSecretRefEnvironment,
		execSecretRefPassEnvEnvironment,
		authProfileEnvironment
	]);
	const preservedExistingEnvironment = collectPreservedExistingServiceEnvVars(params.existingEnvironment, require_systemd.readManagedServiceEnvKeysFromEnvironment(params.existingEnvironment));
	const plan = createMutableServiceEnvPlan();
	addServiceEnvPlanEntries(plan, preservedExistingEnvironment, { valueSource: ({ normalizedKey }) => readExistingEnvironmentValueSource({
		existingEnvironmentValueSources: params.existingEnvironmentValueSources,
		normalizedKey
	}) ?? "inline" });
	addServiceEnvPlanEntries(plan, stateDirDotEnvEnvironment, {});
	addServiceEnvPlanEntries(plan, configEnvironment, {});
	addServiceEnvPlanEntries(plan, configSecretRefEnvironment, {});
	addServiceEnvPlanEntries(plan, execSecretRefPassEnvEnvironment, {});
	addServiceEnvPlanEntries(plan, authProfileEnvironment, {});
	const configSecretRefKeyEnvironment = Object.fromEntries(configSecretRefKeys.map((key) => [key, "1"]));
	const managedServiceEnvKeys = require_systemd.formatManagedServiceEnvKeys({
		...durableEnvironment,
		...configSecretRefKeyEnvironment,
		...configSecretRefEnvironment
	}, { omitKeys: Object.keys(params.serviceEnvironment) });
	const existingEnvironmentFileRenderEnvironment = omitEnvironmentEntriesShadowedBy(collectExistingEnvironmentFileManagedServiceEnvVars({
		existingEnvironment: params.existingEnvironment,
		existingEnvironmentValueSources: params.existingEnvironmentValueSources,
		configSecretRefKeys: new Set(configSecretRefKeys)
	}), [
		stateDirDotEnvRenderEnvironment,
		configSecretRefEnvironment,
		execSecretRefPassEnvEnvironment,
		authProfileEnvironment
	]);
	applyManagedServiceEnvRenderPolicy({
		plan,
		managedServiceEnvKeys,
		serviceEnvironment: params.serviceEnvironment,
		platform: params.platform,
		existingEnvironmentFileEnvironment: existingEnvironmentFileRenderEnvironment,
		stateDirDotEnvEnvironment: stateDirDotEnvRenderEnvironment,
		configSecretRefEnvironment
	});
	addServiceEnvPlanEntries(plan, params.serviceEnvironment, { includeRawKeys: true });
	const mergedPath = mergeServicePath(params.serviceEnvironment.PATH, params.existingEnvironment?.PATH, params.serviceEnvironment.TMPDIR, params.platform);
	if (mergedPath) {
		plan.environment.PATH = mergedPath;
		plan.environmentValueSources.PATH = "inline";
	}
	compactServiceEnvPlanValueSources(plan);
	return {
		environment: plan.environment,
		environmentValueSources: plan.environmentValueSources
	};
}
/** Build command, working directory, and environment for installing the Gateway service. */
async function buildGatewayInstallPlan(params) {
	const platform = params.platform ?? process.platform;
	const { devMode, nodePath } = await resolveDaemonInstallRuntimeInputs({
		env: params.env,
		runtime: params.runtime,
		devMode: params.devMode,
		nodePath: params.nodePath
	});
	const wrapperInput = params.wrapperPath ?? params.env["OPERATOR_WRAPPER"];
	const wrapperPointsAtWindowsTaskScript = Boolean(wrapperInput?.trim()) && platform === "win32" && isSameServicePath(wrapperInput, require_paths.resolveGatewayTaskScriptPath(params.env), platform);
	if (wrapperPointsAtWindowsTaskScript) params.warn?.(`Ignoring ${require_program_args.OPERATOR_WRAPPER_ENV_KEY} because it points to the Windows task script; using the Operator gateway entrypoint directly to avoid a recursive gateway.cmd wrapper.`);
	const wrapperPath = wrapperPointsAtWindowsTaskScript ? void 0 : await require_program_args.resolveOperatorWrapperPath(wrapperInput);
	const serviceInputEnv = wrapperPath ? {
		...params.env,
		[require_program_args.OPERATOR_WRAPPER_ENV_KEY]: wrapperPath
	} : wrapperPointsAtWindowsTaskScript ? omitEnvKey(params.env, require_program_args.OPERATOR_WRAPPER_ENV_KEY) : params.env;
	const { programArguments, workingDirectory } = await require_program_args.resolveGatewayProgramArguments({
		port: params.port,
		dev: devMode,
		runtime: params.runtime,
		nodePath,
		wrapperPath
	});
	await emitDaemonInstallRuntimeWarning({
		env: params.env,
		runtime: params.runtime,
		programArguments,
		warn: params.warn,
		title: "Gateway runtime"
	});
	const serviceEnvironment = require_service_path_policy.buildServiceEnvironment({
		env: serviceInputEnv,
		port: params.port,
		launchdLabel: platform === "darwin" ? require_paths.resolveGatewayLaunchAgentLabel(serviceInputEnv.OPERATOR_PROFILE) : void 0,
		platform,
		extraPathDirs: resolveDaemonServicePathDirs({
			nodePath,
			env: serviceInputEnv,
			platform
		})
	});
	const { environment, environmentValueSources } = await buildGatewayInstallEnvironment({
		env: serviceInputEnv,
		config: params.config,
		authStore: params.authStore,
		warn: params.warn,
		serviceEnvironment,
		existingEnvironment: params.existingEnvironment,
		existingEnvironmentValueSources: params.existingEnvironmentValueSources,
		platform
	});
	return {
		programArguments,
		workingDirectory: resolveGatewayInstallWorkingDirectory({
			env: serviceInputEnv,
			platform,
			workingDirectory
		}),
		environment,
		...Object.keys(environmentValueSources).length > 0 ? { environmentValueSources } : {}
	};
}
function normalizeServicePathForCompare(value, platform) {
	const trimmed = value?.trim();
	if (!trimmed) return;
	return platform === "win32" ? node_path.default.win32.resolve(trimmed).toLowerCase() : node_path.default.resolve(trimmed);
}
function isSameServicePath(left, right, platform) {
	const normalizedLeft = normalizeServicePathForCompare(left, platform);
	const normalizedRight = normalizeServicePathForCompare(right, platform);
	return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}
function omitEnvKey(env, key) {
	const next = { ...env };
	delete next[key];
	return next;
}
/** Return the user-facing recovery hint for failed Gateway service installation. */
function gatewayInstallErrorHint(platform = process.platform) {
	return platform === "win32" ? "Tip: native Windows now falls back to a per-user Startup-folder login item when Scheduled Task creation is denied; if install still fails, rerun from an elevated PowerShell or skip service install." : `Tip: rerun \`${require_command_format.formatCliCommand("operator gateway install")}\` after fixing the error.`;
}
//#endregion
//#region src/commands/daemon-runtime.ts
const DEFAULT_GATEWAY_DAEMON_RUNTIME = "node";
const GATEWAY_DAEMON_RUNTIME_OPTIONS = [{
	value: "node",
	label: "Node",
	hint: "Required for Operator's SQLite-backed runtime state."
}];
//#endregion
Object.defineProperty(exports, "DEFAULT_GATEWAY_DAEMON_RUNTIME", {
	enumerable: true,
	get: function() {
		return DEFAULT_GATEWAY_DAEMON_RUNTIME;
	}
});
Object.defineProperty(exports, "GATEWAY_DAEMON_RUNTIME_OPTIONS", {
	enumerable: true,
	get: function() {
		return GATEWAY_DAEMON_RUNTIME_OPTIONS;
	}
});
Object.defineProperty(exports, "buildGatewayInstallPlan", {
	enumerable: true,
	get: function() {
		return buildGatewayInstallPlan;
	}
});
Object.defineProperty(exports, "gatewayInstallErrorHint", {
	enumerable: true,
	get: function() {
		return gatewayInstallErrorHint;
	}
});
