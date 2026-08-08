require("./rolldown-runtime-u92d-OFm.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/gateway/server-worker-environment-startup.ts
const loadWorkerEnvironmentRuntimeModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./runtime-DYY8qN7E.cjs")));
const loadWorkerInferenceRuntimeModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./inference-runtime-Cg3zIYne.cjs")));
async function loadGatewayWorkerEnvironmentStartupState() {
	const [{ createWorkerEnvironmentStore }, { createWorkerSessionPlacementStore }] = await Promise.all([Promise.resolve().then(() => require("./store-v7u_qN5B.cjs")).then((n) => n.store_exports), Promise.resolve().then(() => require("./placement-store-DsR-xWLb.cjs"))]);
	const store = createWorkerEnvironmentStore();
	const placementStore = createWorkerSessionPlacementStore();
	const records = store.list();
	const durableProviderIds = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(records.flatMap((record) => record.state === "destroyed" || record.state === "failed" || record.state === "orphaned" ? [] : [record.providerId]));
	const listDurableProviderIds = () => (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(store.listForReconcile().map((record) => record.providerId));
	return {
		durableProviderIds,
		listDurableProviderIds,
		records,
		store,
		placementStore,
		hasNonlocalPlacementRecords: placementStore.listForReconcile().length > 0
	};
}
async function createGatewayWorkerEnvironmentRuntime(params) {
	const [{ createWorkerEnvironmentService }, { createWorkerLiveEventReceiver }, { createWorkerSessionPlacementGate }, { createWorkerTranscriptCommitter }, { createWorkerTunnelManager }, { resolveWorkerProvider }] = await Promise.all([
		Promise.resolve().then(() => require("./service-CKbfxdYW.cjs")).then((n) => n.service_exports),
		Promise.resolve().then(() => require("./live-events-CQxmkksS.cjs")),
		Promise.resolve().then(() => require("./placement-worker-gate-K5t2JhCo.cjs")),
		Promise.resolve().then(() => require("./transcript-commit-BmqTf4HH.cjs")),
		Promise.resolve().then(() => require("./tunnel-B17NE8yQ.cjs")),
		Promise.resolve().then(() => require("./worker-provider-registry-CsuKJchR.cjs")).then((n) => n.worker_provider_registry_exports)
	]);
	params.startup.placementStore.clearLocalTurnClaimsAfterRestart();
	const placementGate = createWorkerSessionPlacementGate(params.startup.placementStore);
	let workerBundleProducer;
	let workerNpmArtifact;
	const prepareInstallation = async (install) => {
		const [workerRuntime, { WORKER_PROTOCOL_FEATURES }] = await Promise.all([loadWorkerEnvironmentRuntimeModule(), Promise.resolve().then(() => require("./worker-admission-DNxVcwiA.cjs")).then((n) => n.worker_admission_exports)]);
		workerBundleProducer ??= workerRuntime.createWorkerBundleProducer({ protocolFeatures: WORKER_PROTOCOL_FEATURES });
		const bundle = await workerBundleProducer.prepare();
		if (install === "bundle") return bundle;
		workerNpmArtifact ??= workerRuntime.resolveWorkerNpmInstallationArtifact({ bundle }).catch((error) => {
			workerNpmArtifact = void 0;
			throw error;
		});
		return await workerNpmArtifact;
	};
	const startupBindings = params.startup.records.flatMap((record) => record.state === "attached" && record.attachedSessionIds.length === 1 ? [{
		environmentId: record.environmentId,
		runEpoch: record.ownerEpoch,
		sessionId: record.attachedSessionIds[0]
	}] : []);
	const workerLiveEvents = createWorkerLiveEventReceiver({
		getConfig: require_io.getRuntimeConfig,
		startupBindings,
		startupOwners: new Map(startupBindings.map((binding) => [binding.environmentId, binding.runEpoch]))
	});
	return {
		workerEnvironmentService: createWorkerEnvironmentService({
			store: params.startup.store,
			getConfig: require_io.getRuntimeConfig,
			resolveProvider: (providerId) => resolveWorkerProvider(params.getPluginRegistry(), providerId),
			prepareInstallation,
			tunnelManager: createWorkerTunnelManager(),
			resolveWorkerGateway: params.resolveWorkerGateway,
			applyTranscriptCommit: createWorkerTranscriptCommitter({ getConfig: require_io.getRuntimeConfig }).commit,
			executeInference: async (inferenceParams) => {
				return await (await loadWorkerInferenceRuntimeModule()).executeWorkerInference(inferenceParams);
			},
			placementStore: placementGate,
			liveEvents: workerLiveEvents,
			resolveSshIdentity: async ({ provider, leaseId, profile, keyRef }) => {
				const workerRuntime = await loadWorkerEnvironmentRuntimeModule();
				return await workerRuntime.resolveWorkerSshIdentity({
					provider,
					leaseId,
					profile,
					keyRef,
					resolveGeneric: async (genericKeyRef) => ({
						kind: "material",
						contents: await workerRuntime.resolveSecretRefString(genericKeyRef, {
							config: require_runtime_state.getActiveSecretsRuntimeConfigSnapshot()?.sourceConfig ?? require_io.getRuntimeConfig(),
							env: require_runtime_state.getActiveSecretsRuntimeEnv()
						})
					})
				});
			},
			bootstrapWorker: async ({ sshEndpoint, installation, resolveIdentity, signal }) => {
				return await (await loadWorkerEnvironmentRuntimeModule()).bootstrapWorker({
					ssh: sshEndpoint,
					artifact: installation,
					pinnedHostKey: sshEndpoint.hostKey
				}, {
					signal,
					resolveIdentity
				});
			},
			logger: params.log.child("worker-environments")
		}),
		workerLiveEvents
	};
}
//#endregion
exports.createGatewayWorkerEnvironmentRuntime = createGatewayWorkerEnvironmentRuntime;
exports.loadGatewayWorkerEnvironmentStartupState = loadGatewayWorkerEnvironmentStartupState;
