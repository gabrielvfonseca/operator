require("./rolldown-runtime-u92d-OFm.cjs");
//#region src/gateway/server-startup-early.ts
const loadRemoteSkillsRuntimeModule = async () => await Promise.resolve().then(() => require("./remote-Dds9m5_I.cjs")).then((n) => n.remote_exports);
/** Measure an early-startup step when tracing is enabled, otherwise run it directly. */
async function measureStartup(startupTrace, name, run) {
	return startupTrace ? startupTrace.measure(name, run) : await run();
}
/** Start plugin discovery and return the Bonjour shutdown callback when discovery is active. */
async function startGatewayPluginDiscovery(params) {
	if (params.minimalTestGateway) return null;
	const machineDisplayName = await measureStartup(params.startupTrace, "runtime.early.discovery.machine-name", async () => (await Promise.resolve().then(() => require("./machine-name-DYpOVD5W.cjs")).then((n) => n.machine_name_exports)).getMachineDisplayName());
	return await measureStartup(params.startupTrace, "runtime.early.discovery.start", async () => {
		const { startGatewayDiscovery } = await Promise.resolve().then(() => require("./server-discovery-runtime-D7ZerkwR.cjs"));
		return (await startGatewayDiscovery({
			machineDisplayName,
			port: params.port,
			gatewayTls: params.gatewayTls.enabled ? {
				enabled: true,
				fingerprintSha256: params.gatewayTls.fingerprintSha256
			} : void 0,
			gatewayDirectReachable: params.gatewayDirectReachable,
			wideAreaDiscoveryEnabled: params.cfgAtStart.discovery?.wideArea?.enabled === true,
			wideAreaDiscoveryDomain: params.cfgAtStart.discovery?.wideArea?.domain,
			tailscaleMode: params.tailscaleMode,
			mdnsMode: params.cfgAtStart.discovery?.mdns?.mode,
			gatewayDiscoveryServices: params.pluginRegistry?.gatewayDiscoveryServices,
			logDiscovery: params.logDiscovery
		})).bonjourStop;
	});
}
/** Start early Gateway side runtimes before the main server is fully ready. */
async function startGatewayEarlyRuntime(params) {
	if (!params.minimalTestGateway) await measureStartup(params.startupTrace, "runtime.early.task-state", async () => {
		const { ensureTaskRuntimeStateReady } = await Promise.resolve().then(() => require("./runtime-internal-CNKl6hEH.cjs")).then((n) => n.runtime_internal_exports);
		ensureTaskRuntimeStateReady();
	});
	const bonjourStop = await measureStartup(params.startupTrace, "runtime.early.discovery", () => startGatewayPluginDiscovery(params));
	let getActiveTaskCount = () => 0;
	if (!params.minimalTestGateway) {
		const [{ primeRemoteSkillsCache, setSkillsRemoteRegistry }, taskRegistryMaintenance] = await measureStartup(params.startupTrace, "runtime.early.lazy-runtime-imports", () => Promise.all([loadRemoteSkillsRuntimeModule(), Promise.resolve().then(() => require("./task-registry.maintenance-CxAm7DpZ.cjs")).then((n) => n.task_registry_maintenance_exports)]));
		setSkillsRemoteRegistry(params.nodeRegistry);
		primeRemoteSkillsCache();
		taskRegistryMaintenance.configureTaskRegistryMaintenance({ runtimeAuthoritative: true });
		taskRegistryMaintenance.startTaskRegistryMaintenance();
		getActiveTaskCount = () => taskRegistryMaintenance.getInspectableActiveTaskRestartBlockers().length;
	}
	const skillsChangeUnsub = params.minimalTestGateway ? () => {} : await measureStartup(params.startupTrace, "runtime.early.skills-listener", async () => {
		const [{ registerSkillsChangeListener }, { refreshRemoteBinsForConnectedNodes }] = await Promise.all([Promise.resolve().then(() => require("./refresh-x6Fok_sy.cjs")).then((n) => n.refresh_exports), loadRemoteSkillsRuntimeModule()]);
		return registerSkillsChangeListener((event) => {
			if (event.reason === "remote-node") return;
			const existingTimer = params.getSkillsRefreshTimer();
			if (existingTimer) clearTimeout(existingTimer);
			const nextTimer = setTimeout(() => {
				params.setSkillsRefreshTimer(null);
				refreshRemoteBinsForConnectedNodes(params.getRuntimeConfig());
			}, params.skillsRefreshDelayMs);
			params.setSkillsRefreshTimer(nextTimer);
		});
	});
	const startMaintenance = async () => {
		if (params.minimalTestGateway) return null;
		return await measureStartup(params.startupTrace, "post-ready.maintenance", async () => {
			const { startGatewayMaintenanceTimers } = await Promise.resolve().then(() => require("./server-maintenance-CKi0aBAS.cjs"));
			return startGatewayMaintenanceTimers({
				broadcast: params.broadcast,
				nodeSendToAllSubscribed: params.nodeSendToAllSubscribed,
				getPresenceVersion: params.getPresenceVersion,
				getHealthVersion: params.getHealthVersion,
				refreshGatewayHealthSnapshot: params.refreshGatewayHealthSnapshot,
				logHealth: params.logHealth,
				dedupe: params.dedupe,
				chatAbortControllers: params.chatAbortControllers,
				chatQueuedTurns: params.chatQueuedTurns,
				restartRecoveryCandidates: params.restartRecoveryCandidates,
				chatRunState: params.chatRunState,
				chatRunBuffers: params.chatRunBuffers,
				chatDeltaSentAt: params.chatDeltaSentAt,
				chatDeltaLastBroadcastLen: params.chatDeltaLastBroadcastLen,
				removeChatRun: params.removeChatRun,
				agentRunSeq: params.agentRunSeq,
				nodeSendToSession: params.nodeSendToSession,
				getRuntimeConfig: params.getRuntimeConfig,
				enableSkillCurator: true,
				...typeof params.mediaCleanupTtlMs === "number" ? { mediaCleanupTtlMs: params.mediaCleanupTtlMs } : {}
			});
		});
	};
	return {
		bonjourStop,
		getActiveTaskCount,
		skillsChangeUnsub,
		startMaintenance
	};
}
//#endregion
exports.startGatewayEarlyRuntime = startGatewayEarlyRuntime;
exports.startGatewayPluginDiscovery = startGatewayPluginDiscovery;
