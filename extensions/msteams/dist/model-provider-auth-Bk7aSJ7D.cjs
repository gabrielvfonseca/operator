const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
require("./errors-BqS4bzom.cjs");
require("./workspace-oX0zfOZq.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_model_catalog = require("./model-catalog-BFgB2-Jk.cjs");
const require_model_provider_auth_state = require("./model-provider-auth-state-CivFEPZo.cjs");
const require_model_auth_availability = require("./model-auth-availability-CbaVu2uQ.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_worker_threads = require("node:worker_threads");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/model-provider-auth.ts
/**
* Warms and queries provider-auth availability for model catalogs. The module
* keeps per-agent auth snapshots process-current so model listing can avoid
* repeated env/profile/plugin discovery on hot paths.
*/
var model_provider_auth_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildCurrentProviderAuthStateSnapshot: () => buildCurrentProviderAuthStateSnapshot,
	clearCurrentProviderAuthState: () => require_model_provider_auth_state.clearCurrentProviderAuthState,
	createProviderAuthChecker: () => createProviderAuthChecker,
	hasAuthForModelProvider: () => hasAuthForModelProvider,
	warmCurrentProviderAuthStateOffMainThread: () => warmCurrentProviderAuthStateOffMainThread
});
const PROVIDER_AUTH_WARM_WORKER_TIMEOUT_MS = 12e4;
const PROVIDER_AUTH_WARM_CANCEL_POLL_MS = 25;
const configFingerprintCache = /* @__PURE__ */ new WeakMap();
function resolvePreparedStateForCaller(params) {
	if (!params.states) return null;
	if (params.callerAgentId !== void 0) return params.states.get(params.callerAgentId) ?? null;
	if (!params.cfg) return null;
	return params.states.get(require_agent_scope_config.resolveDefaultAgentId(params.cfg)) ?? null;
}
function resolveProviderAuthConfigFingerprint(cfg) {
	if (!cfg) return null;
	const cached = configFingerprintCache.get(cfg);
	if (cached !== void 0) return cached;
	const fingerprint = require_runtime_snapshot.hashRuntimeConfigValue(cfg);
	configFingerprintCache.set(cfg, fingerprint);
	return fingerprint;
}
/** Resolves whether auth is available for a model provider in the caller's runtime scope. */
async function hasAuthForModelProvider(params) {
	const provider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const preparedStates = require_model_provider_auth_state.getCurrentProviderAuthStates();
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const configFingerprint = resolveProviderAuthConfigFingerprint(params.cfg);
	const preparedState = resolvePreparedStateForCaller({
		states: preparedStates,
		cfg: params.cfg,
		callerAgentId: params.agentId
	});
	const expectedWorkspaceDir = preparedState !== null && params.cfg ? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, preparedState.agentId) : null;
	const expectedAgentDir = preparedState !== null && params.cfg ? require_agent_scope_config.resolveAgentDir(params.cfg, preparedState.agentId) : null;
	if (preparedState !== null && configFingerprint === preparedState.configFingerprint && workspaceDir === expectedWorkspaceDir && (params.agentDir === void 0 || params.agentDir === expectedAgentDir) && (params.allowPreparedRuntimeAuth === true || params.discoverExternalCliAuth !== false && params.allowPluginSyntheticAuth !== false) && params.env === void 0 && params.store === void 0 && params.modelApi === void 0) {
		const preparedAnswer = preparedState.providers.get(provider);
		if (preparedAnswer !== void 0) return preparedAnswer;
	}
	await new Promise((resolve) => {
		setImmediate(resolve);
	});
	if (require_model_auth.hasRuntimeAvailableProviderAuth({
		provider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env,
		allowPluginSyntheticAuth: params.allowPluginSyntheticAuth,
		runtimeLookup: params.runtimeAuthLookup ?? params.resolveRuntimeAuthLookup?.(),
		modelApi: params.modelApi
	})) return true;
	const slowPathAgentDir = params.agentDir ?? (params.agentId && params.cfg ? require_agent_scope_config.resolveAgentDir(params.cfg, params.agentId, params.env) : void 0);
	const store = params.store ?? (params.discoverExternalCliAuth === false ? require_store.ensureAuthProfileStoreWithoutExternalProfiles(slowPathAgentDir, { allowKeychainPrompt: false }) : require_store.ensureAuthProfileStore(slowPathAgentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({
		cfg: params.cfg,
		provider
	}) }));
	if (require_profile_list.listProfilesForProvider(store, provider).length > 0) return params.modelApi === void 0 ? true : await require_model_auth.hasAvailableAuthForProvider({
		provider,
		modelApi: params.modelApi,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		agentDir: slowPathAgentDir,
		store
	});
	return false;
}
/** Creates a cached provider-auth evaluator bound to one agent/runtime context. */
function createProviderAuthChecker(params) {
	const authCache = /* @__PURE__ */ new Map();
	let runtimeAuthLookup;
	let modelAuthResolver;
	const resolveModelAuthResolver = () => {
		if (modelAuthResolver) return modelAuthResolver;
		const agentDir = params.agentDir ?? (params.agentId && params.cfg ? require_agent_scope_config.resolveAgentDir(params.cfg, params.agentId, params.env) : void 0);
		const authStore = require_store.ensureAuthProfileStoreWithoutExternalProfiles(agentDir, { allowKeychainPrompt: false });
		runtimeAuthLookup ??= require_model_auth.createRuntimeProviderAuthLookup({
			cfg: params.cfg,
			workspaceDir: params.workspaceDir,
			env: params.env,
			includePluginSyntheticAuth: params.allowPluginSyntheticAuth !== false
		});
		modelAuthResolver = require_model_auth_availability.createModelAuthAvailabilityResolver({
			cfg: params.cfg ?? {},
			authStore,
			agentDir,
			workspaceDir: params.workspaceDir,
			env: params.env,
			skipSetupProviderFallback: true,
			allowPreparedRuntimeAuth: params.allowPreparedRuntimeAuth === true || params.discoverExternalCliAuth !== false && params.allowPluginSyntheticAuth !== false,
			syntheticAuthProviderRefs: runtimeAuthLookup.syntheticAuthProviderRefs,
			...params.discoverExternalCliAuth === false ? {} : { externalCliProviderIds: ["openai"] }
		});
		return modelAuthResolver;
	};
	const evaluateModelAuth = (provider, ref = {}) => {
		const key = require_model_selection_normalize.normalizeProviderId(provider);
		const hasRouteFacts = ref.modelId !== void 0 || ref.api !== void 0 || ref.baseUrl !== void 0 || ref.observedRoutes !== void 0;
		const cacheKey = hasRouteFacts ? `${key}\0${require_runtime_snapshot.hashRuntimeConfigValue(ref)}` : key;
		const cached = authCache.get(cacheKey);
		if (cached) return cached;
		const resolveLegacyProviderAuth = () => hasAuthForModelProvider({
			provider: key,
			modelApi: typeof ref.api === "string" ? ref.api : void 0,
			cfg: params.cfg,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			agentId: params.agentId,
			env: params.env,
			allowPluginSyntheticAuth: params.allowPluginSyntheticAuth,
			discoverExternalCliAuth: params.discoverExternalCliAuth,
			allowPreparedRuntimeAuth: params.allowPreparedRuntimeAuth,
			resolveRuntimeAuthLookup: () => runtimeAuthLookup ??= require_model_auth.createRuntimeProviderAuthLookup({
				cfg: params.cfg,
				workspaceDir: params.workspaceDir,
				env: params.env,
				includePluginSyntheticAuth: params.allowPluginSyntheticAuth !== false
			})
		});
		const evaluation = Promise.resolve().then(async () => {
			if (hasRouteFacts) return resolveModelAuthResolver().evaluateModelAuth(key, ref);
			return {
				availability: await resolveLegacyProviderAuth(),
				routeResolution: null
			};
		});
		authCache.set(cacheKey, evaluation);
		evaluation.catch(() => {
			if (authCache.get(cacheKey) === evaluation) authCache.delete(cacheKey);
		});
		return evaluation;
	};
	return Object.assign(async (provider, ref = {}) => (await evaluateModelAuth(provider, ref)).availability === true, { evaluateModelAuth });
}
function serializeProviderAuthStates(states) {
	return { agents: [...states.values()].map((state) => ({
		agentId: state.agentId,
		configFingerprint: state.configFingerprint,
		providers: [...state.providers.entries()]
	})) };
}
function resolveProviderConfigApi(cfg, provider) {
	const providers = cfg?.models?.providers ?? {};
	const direct = providers[provider];
	if (direct?.api) return direct.api;
	const normalized = require_model_selection_normalize.normalizeProviderId(provider);
	return (Object.entries(providers).find(([key]) => require_model_selection_normalize.normalizeProviderId(key) === normalized)?.[1])?.api;
}
function shouldOmitFalsePreparedAuthForProcessSyntheticProvider(params) {
	const syntheticRefs = params.runtimeAuthLookup.syntheticAuthProviderRefs;
	if (!syntheticRefs?.length) return false;
	const eligibleRefs = new Set(syntheticRefs.map((ref) => require_model_selection_normalize.normalizeProviderId(ref)));
	const providerApi = resolveProviderConfigApi(params.cfg, params.provider);
	return [params.provider, providerApi].filter((ref) => typeof ref === "string" && ref.trim().length > 0).some((ref) => eligibleRefs.has(require_model_selection_normalize.normalizeProviderId(ref)));
}
/** Builds a provider auth snapshot for every configured agent. */
async function buildCurrentProviderAuthStateSnapshot(cfg, options = {}) {
	const isWarmStale = () => options.isCancelled?.() === true;
	const catalog = await require_model_catalog.loadModelCatalog({
		config: cfg,
		readOnly: true
	});
	if (isWarmStale()) return { agents: [] };
	const providers = /* @__PURE__ */ new Set();
	for (const entry of catalog) providers.add(require_model_selection_normalize.normalizeProviderId(entry.provider));
	const providerList = [...providers];
	const configFingerprint = resolveProviderAuthConfigFingerprint(cfg) ?? "";
	const states = /* @__PURE__ */ new Map();
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) {
		if (isWarmStale()) return { agents: [] };
		const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
		const agentDir = require_agent_scope_config.resolveAgentDir(cfg, agentId);
		const runtimeAuthLookup = options.runtimeAuthLookups?.get(agentId) ?? require_model_auth.createRuntimeProviderAuthLookup({
			cfg,
			workspaceDir
		});
		const externalCli = require_external_cli_discovery.externalCliDiscoveryForProviders({
			cfg,
			providers: providerList
		});
		const store = options.readOnlyAuthStore ? require_store.ensureAuthProfileStore(agentDir, {
			config: cfg,
			externalCli,
			readOnly: true,
			syncExternalCli: false
		}) : require_store.ensureAuthProfileStore(agentDir, {
			config: cfg,
			externalCli
		});
		const state = /* @__PURE__ */ new Map();
		for (const provider of providers) {
			if (isWarmStale()) return { agents: [] };
			const value = await hasAuthForModelProvider({
				provider,
				cfg,
				workspaceDir,
				agentId,
				store,
				runtimeAuthLookup
			});
			if (!value && (options.omitFalseProviderAuth || shouldOmitFalsePreparedAuthForProcessSyntheticProvider({
				cfg,
				provider,
				runtimeAuthLookup
			}))) continue;
			state.set(provider, value);
		}
		states.set(agentId, {
			agentId,
			configFingerprint,
			providers: state
		});
	}
	return serializeProviderAuthStates(states);
}
function resolveProviderAuthWarmWorkerUrl(currentModuleUrl) {
	const currentPath = (0, node_url.fileURLToPath)(currentModuleUrl);
	const distMarker = `${node_path.default.sep}dist${node_path.default.sep}`;
	const distIndex = currentPath.lastIndexOf(distMarker);
	if (distIndex >= 0) {
		const distRoot = currentPath.slice(0, distIndex + distMarker.length - 1);
		return (0, node_url.pathToFileURL)(node_path.default.join(distRoot, "agents", "model-provider-auth.worker.js"));
	}
	const extension = node_path.default.extname(currentPath) || ".js";
	return new URL(`./model-provider-auth.worker${extension}`, currentModuleUrl);
}
function isProviderAuthWarmSnapshot(value) {
	if (!value || typeof value !== "object" || !Array.isArray(value.agents)) return false;
	return value.agents.every((agent) => typeof agent.agentId === "string" && typeof agent.configFingerprint === "string" && Array.isArray(agent.providers) && agent.providers.every((entry) => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string" && typeof entry[1] === "boolean"));
}
function isProviderAuthWarmWorkerResult(value) {
	if (!value || typeof value !== "object") return false;
	const result = value;
	if (result.status === "failed") return typeof result.error === "string";
	return result.status === "ok" && isProviderAuthWarmSnapshot(result.snapshot);
}
function createProviderAuthWarmPresenceStore(store) {
	const profiles = {};
	for (const [profileId, credential] of Object.entries(store.profiles)) profiles[profileId] = {
		type: "api_key",
		provider: credential.provider
	};
	return {
		version: store.version,
		profiles
	};
}
function collectProviderAuthWarmRuntimeAuthStores(cfg) {
	const entries = [];
	const seen = /* @__PURE__ */ new Set();
	const addStore = (agentDir) => {
		if (seen.has(agentDir)) return;
		seen.add(agentDir);
		const store = require_store.getRuntimeAuthProfileStoreSnapshot(agentDir);
		if (!store) return;
		entries.push({
			...agentDir === void 0 ? {} : { agentDir },
			store: createProviderAuthWarmPresenceStore(store)
		});
	};
	addStore();
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) addStore(require_agent_scope_config.resolveAgentDir(cfg, agentId));
	return entries;
}
function collectProviderAuthWarmRuntimeAuthLookups(cfg) {
	const entries = [];
	let omitFalseProviderAuth = false;
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) {
		const lookup = require_model_auth.createRuntimeProviderAuthLookup({
			cfg,
			workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId)
		});
		if (lookup.syntheticAuthProviderRefsComplete === false) omitFalseProviderAuth = true;
		entries.push({
			agentId,
			lookup
		});
	}
	return {
		entries,
		omitFalseProviderAuth
	};
}
function runProviderAuthWarmWorker(params) {
	const worker = new node_worker_threads.Worker(params.workerUrl ?? resolveProviderAuthWarmWorkerUrl(require("url").pathToFileURL(__filename).href), { workerData: {
		cfg: params.cfg,
		...params.runtimeAuthStores?.length ? { runtimeAuthStores: params.runtimeAuthStores } : {},
		...params.runtimeAuthLookups?.length ? { runtimeAuthLookups: params.runtimeAuthLookups } : {},
		...params.omitFalseProviderAuth ? { omitFalseProviderAuth: true } : {}
	} });
	worker.unref?.();
	const handle = {
		worker,
		cancelled: false
	};
	require_model_provider_auth_state.setCurrentProviderAuthWarmWorker(handle);
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (complete) => {
			if (settled) return;
			settled = true;
			require_model_provider_auth_state.clearCurrentProviderAuthWarmWorker(handle);
			if (timer) clearTimeout(timer);
			if (cancelTimer) clearInterval(cancelTimer);
			complete();
		};
		const cancelWorker = () => {
			handle.cancelled = true;
			worker.terminate();
			finish(() => resolve({ agents: [] }));
		};
		const timer = setTimeout(() => {
			handle.cancelled = true;
			worker.terminate();
			finish(() => reject(/* @__PURE__ */ new Error("provider auth warm worker timed out")));
		}, params.timeoutMs);
		timer.unref?.();
		const cancelTimer = setInterval(() => {
			if (params.isCancelled()) cancelWorker();
		}, PROVIDER_AUTH_WARM_CANCEL_POLL_MS);
		cancelTimer.unref?.();
		worker.once("message", (message) => {
			worker.terminate();
			finish(() => {
				if (handle.cancelled) {
					resolve({ agents: [] });
					return;
				}
				if (!isProviderAuthWarmWorkerResult(message)) {
					reject(/* @__PURE__ */ new Error("invalid provider auth warm worker response"));
					return;
				}
				if (message.status === "failed") {
					reject(new Error(message.error));
					return;
				}
				resolve(message.snapshot);
			});
		});
		worker.once("error", (error) => {
			finish(() => {
				if (handle.cancelled) {
					resolve({ agents: [] });
					return;
				}
				reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Non-Error rejection"));
			});
		});
		worker.once("exit", (code) => {
			if (settled || code === 0) return;
			finish(() => {
				if (handle.cancelled) {
					resolve({ agents: [] });
					return;
				}
				reject(/* @__PURE__ */ new Error(`provider auth warm worker exited with code ${code}`));
			});
		});
		if (params.isCancelled()) cancelWorker();
	});
}
/** Warms process-current provider auth state in a worker thread. */
async function warmCurrentProviderAuthStateOffMainThread(cfg, options = {}) {
	const ownGeneration = require_model_provider_auth_state.claimCurrentProviderAuthStateGeneration();
	require_model_provider_auth_state.cancelCurrentProviderAuthWarmWorker();
	const isWarmStale = () => options.isCancelled?.() === true || !require_model_provider_auth_state.isCurrentProviderAuthStateGeneration(ownGeneration);
	if (isWarmStale()) return;
	const runtimeAuthStores = collectProviderAuthWarmRuntimeAuthStores(cfg);
	const runtimeAuthLookups = collectProviderAuthWarmRuntimeAuthLookups(cfg);
	const snapshot = await (options.runWorker ?? runProviderAuthWarmWorker)({
		cfg,
		...runtimeAuthStores.length ? { runtimeAuthStores } : {},
		...runtimeAuthLookups.entries.length ? { runtimeAuthLookups: runtimeAuthLookups.entries } : {},
		...runtimeAuthLookups.omitFalseProviderAuth ? { omitFalseProviderAuth: true } : {},
		timeoutMs: options.timeoutMs ?? PROVIDER_AUTH_WARM_WORKER_TIMEOUT_MS,
		isCancelled: isWarmStale,
		workerUrl: options.workerUrl
	});
	if (isWarmStale()) return;
	require_model_provider_auth_state.publishProviderAuthWarmSnapshot(snapshot);
}
//#endregion
Object.defineProperty(exports, "createProviderAuthChecker", {
	enumerable: true,
	get: function() {
		return createProviderAuthChecker;
	}
});
Object.defineProperty(exports, "model_provider_auth_exports", {
	enumerable: true,
	get: function() {
		return model_provider_auth_exports;
	}
});
Object.defineProperty(exports, "warmCurrentProviderAuthStateOffMainThread", {
	enumerable: true,
	get: function() {
		return warmCurrentProviderAuthStateOffMainThread;
	}
});
