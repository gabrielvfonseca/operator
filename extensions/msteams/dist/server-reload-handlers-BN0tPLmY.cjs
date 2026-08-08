const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_commands_flags = require("./commands.flags-BZYis-vI.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_config_paths = require("./config-paths-B36-sz1b.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_agent_bundle_mcp_runtime = require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs");
require("./agent-bundle-mcp-tools-e1AmWJ1L.cjs");
const require_plugin_skills = require("./plugin-skills-ajAxY2PH.cjs");
const require_target_resolver = require("./target-resolver-Bn46QRpp.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_model_catalog = require("./model-catalog-BFgB2-Jk.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_bash_process_registry = require("./bash-process-registry-CmxCXwAs.cjs");
const require_dispatcher_registry = require("./dispatcher-registry-oozhjSwY.cjs");
const require_hooks = require("./hooks-Dd_4unef.cjs");
const require_server_model_catalog = require("./server-model-catalog-DBGLKoRk.cjs");
const require_model_provider_auth_state = require("./model-provider-auth-state-CivFEPZo.cjs");
const require_model_provider_auth = require("./model-provider-auth-Bk7aSJ7D.cjs");
const require_restart = require("./restart-sBMxYOWJ.cjs");
const require_config_diff = require("./config-diff-H8SBw0bH.cjs");
const require_config_reload_plan = require("./config-reload-plan-Br2Lvuc3.cjs");
const require_config_reload_settings = require("./config-reload-settings-DfutOn_X.cjs");
const require_server_shared_auth_generation = require("./server-shared-auth-generation-D-jPWnb1.cjs");
const require_server_cron = require("./server-cron-DeaqeoW9.cjs");
const require_task_registry_maintenance = require("./task-registry.maintenance-CxAm7DpZ.cjs");
const require_task_restart_blocker = require("./task-restart-blocker-CeiTA6uB.cjs");
const require_hook_client_ip_config = require("./hook-client-ip-config-D1aDREap.cjs");
const require_server_runtime_startup_services = require("./server-runtime-startup-services-DE9gBt6G.cjs");
const require_server_runtime_services = require("./server-runtime-services-B_TW3c4c.cjs");
let node_util = require("node:util");
let chokidar = require("chokidar");
chokidar = require_rolldown_runtime.__toESM(chokidar, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/gateway/applied-config-hash-publisher.ts
function createAppliedConfigHashPublisher(options) {
	let deferredHash = null;
	return {
		hasOutstandingGatewayRestart: options.hasPendingRestart,
		publishAppliedConfigHash: (hash) => {
			if (options.hasPendingRestart()) {
				deferredHash = hash;
				return;
			}
			deferredHash = null;
			options.publish(hash);
		},
		publishDeferredAppliedConfigHash: () => {
			if (deferredHash === null || options.hasPendingRestart()) return;
			const hash = deferredHash;
			deferredHash = null;
			options.publish(hash);
		}
	};
}
//#endregion
//#region src/gateway/config-reload-recovery.ts
function shouldRefreshContextWindowCache(plan) {
	return plan.reloadPlugins || plan.changedPaths.some((path) => path === "models" || path.startsWith("models.") || path === "agents" || path === "agents.defaults" || path === "agents.list" || path.startsWith("agents.list.") || path === "agents.defaults.workspace" || path.startsWith("agents.defaults.workspace."));
}
function reloadPlanNeedsRecovery(plan) {
	return plan.restartCron || plan.restartHealthMonitor || plan.restartGmailWatcher || plan.reloadPlugins || plan.restartChannels.size > 0 || shouldRefreshContextWindowCache(plan);
}
//#endregion
//#region src/gateway/config-applied-revision.ts
function createConfigAppliedRevisionTracker(options) {
	let pending = null;
	const flush = async (currentConfig) => {
		const owner = pending;
		if (!owner) return;
		await options.onConfigApplied?.(owner.plan, currentConfig);
		options.onRevisionApplied?.(owner.hash);
		if (pending === owner) pending = null;
	};
	return {
		defer: (plan, hash) => {
			pending = {
				plan,
				hash
			};
		},
		flush,
		apply: async (plan, config, hash) => {
			if (pending?.plan === plan) {
				await flush(config);
				return;
			}
			await options.onConfigApplied?.(plan, config);
			options.onRevisionApplied?.(hash);
		}
	};
}
//#endregion
//#region src/gateway/config-reload.ts
const MISSING_CONFIG_RETRY_DELAY_MS = 150;
const MISSING_CONFIG_MAX_RETRIES = 2;
const WATCHER_RECREATE_MAX_RETRIES = 3;
const WATCHER_RECREATE_BACKOFF_MS = [
	500,
	2e3,
	5e3
];
function resolveChokidarUsePolling(degradedToPolling) {
	const envPoll = process.env.CHOKIDAR_USEPOLLING;
	if (envPoll !== void 0) {
		const envLower = envPoll.toLowerCase();
		if (envLower === "false" || envLower === "0") return false;
		if (envLower === "true" || envLower === "1") return true;
		return Boolean(envLower);
	}
	return Boolean(process.env.VITEST) || degradedToPolling;
}
/**
* Paths under `skills.*` always change the snapshot that sessions cache in
* sessions.json. Any prefix match here (for example `skills.allowBundled`,
* `skills.entries.X.enabled`, `skills.profile`) forces sessions to rebuild
* their snapshot on the next turn rather than silently advertising stale
* tools to the model.
*/
const SKILLS_INVALIDATION_PREFIXES = ["skills"];
function matchesSkillsInvalidationPrefix(path) {
	return SKILLS_INVALIDATION_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}.`));
}
function firstSkillsChangedPath(changedPaths) {
	return changedPaths.find(matchesSkillsInvalidationPrefix);
}
function isNoopReloadPlan(plan) {
	return !plan.restartGateway && plan.hotReasons.length === 0 && !plan.reloadHooks && !plan.restartGmailWatcher && !plan.restartCron && !plan.restartHeartbeat && !plan.restartHealthMonitor && !plan.reloadPlugins && !plan.disposeMcpRuntimes && plan.restartChannels.size === 0;
}
var GatewayConfigReloadSupersededError$1 = class extends Error {
	constructor() {
		super("config reload superseded by a newer config write");
		this.name = "GatewayConfigReloadSupersededError";
	}
};
function isGatewayConfigReloadSupersededError(error) {
	return error instanceof Error && error.name === "GatewayConfigReloadSupersededError";
}
function asPluginInstallConfig(records) {
	return { plugins: { installs: records } };
}
function startGatewayConfigReloader(opts) {
	const initialSourceConfig = opts.initialCompareConfig ?? opts.initialConfig;
	const initialCandidate = opts.prepareConfigCandidate?.({
		runtimeConfig: opts.initialConfig,
		sourceConfig: initialSourceConfig,
		previousSourceConfig: initialSourceConfig
	});
	let currentConfig = initialCandidate?.runtimeConfig ?? opts.initialConfig;
	let currentCompareConfig = initialCandidate?.compareConfig ?? initialSourceConfig;
	let currentSourceConfig = initialSourceConfig;
	let currentRuntimeEnvSourceConfig = initialSourceConfig;
	let currentReapplyRuntimeOverlays = initialCandidate?.reapplyRuntimeOverlays ?? ((config) => config);
	let currentRuntimeRefresh;
	let settings = require_config_reload_settings.resolveGatewayReloadSettings(currentConfig);
	let debounceTimer = null;
	let pending = false;
	let running = false;
	let stopped = false;
	const activeReloads = /* @__PURE__ */ new Set();
	let missingConfigRetries = 0;
	let configWriteEpoch = 0;
	let pendingInProcessConfig = null;
	let activeInProcessConfig = null;
	let watcherIntentCandidate = null;
	let startupInternalWriteHash = opts.initialInternalWriteHash ?? null;
	let lastAppliedWriteHash = null;
	let lastSourceOnlyWriteHash = null;
	let lastSourceOnlyReapplyRuntimeOverlays = null;
	let lastSourceOnlyRuntimeRefresh;
	let lastSourceOnlyRuntimeConfig = null;
	let lastSourceOnlySourceConfig = null;
	let currentPluginInstallRecords = opts.initialPluginInstallRecords ?? require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync();
	const readPluginInstallRecords = opts.readPluginInstallRecords ?? require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords;
	const appliedRevision = createConfigAppliedRevisionTracker({
		onConfigApplied: opts.onConfigApplied,
		onRevisionApplied: opts.onConfigRevisionApplied
	});
	const scheduleAfter = (wait) => {
		if (stopped) return;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			startTrackedReload();
		}, wait);
	};
	const schedule = () => {
		scheduleAfter(settings.debounceMs);
	};
	const prepareRestart = async (plan, nextConfig, ownership, sourceConfig) => {
		try {
			await opts.onRestart(plan, nextConfig, ownership, sourceConfig);
		} catch (err) {
			if (isGatewayConfigReloadSupersededError(err)) opts.log.info(`config restart superseded: ${String(err)}`);
			else opts.log.error(`config restart failed: ${String(err)}`);
			throw err;
		}
	};
	const handleMissingSnapshot = (snapshot) => {
		if (snapshot.exists) {
			missingConfigRetries = 0;
			return false;
		}
		if (missingConfigRetries < MISSING_CONFIG_MAX_RETRIES) {
			missingConfigRetries += 1;
			opts.log.info(`config reload retry (${missingConfigRetries}/${MISSING_CONFIG_MAX_RETRIES}): config file not found`);
			scheduleAfter(MISSING_CONFIG_RETRY_DELAY_MS);
			return true;
		}
		opts.log.warn("config reload skipped (config file not found)");
		return true;
	};
	const handleInvalidSnapshot = (snapshot) => {
		if (snapshot.valid) return false;
		const issues = require_io.formatConfigIssueLines(snapshot.issues, "").join(", ");
		opts.log.warn(`config reload skipped (invalid config): ${issues}`);
		return true;
	};
	const applySnapshot = async (candidateRuntimeConfig, nextSourceConfig, afterWrite, transactionEpoch = configWriteEpoch, persistedHash, preflightCandidate, runtimeRefresh) => {
		const preparedCandidate = opts.prepareConfigCandidate?.({
			runtimeConfig: candidateRuntimeConfig,
			sourceConfig: nextSourceConfig,
			previousSourceConfig: currentRuntimeEnvSourceConfig
		}) ?? preflightCandidate;
		const nextConfig = preparedCandidate?.runtimeConfig ?? candidateRuntimeConfig;
		const nextCompareConfig = preparedCandidate?.compareConfig ?? nextSourceConfig;
		const nextConfigRevisionHash = require_runtime_snapshot.hashRuntimeConfigValue(nextSourceConfig);
		let nextPluginInstallRecords = currentPluginInstallRecords;
		let committedRuntimeConfig = null;
		let publishedRuntimeEnv;
		let runtimeEnvCommitted = false;
		const nextSettings = require_config_reload_settings.resolveGatewayReloadSettings(nextConfig);
		const isCurrent = () => configWriteEpoch === transactionEpoch;
		const assertCurrent = () => {
			if (!isCurrent()) throw new GatewayConfigReloadSupersededError$1();
		};
		const commitPublishedRuntimeEnv = () => {
			runtimeEnvCommitted = true;
			publishedRuntimeEnv?.commit();
			publishedRuntimeEnv = void 0;
		};
		const ownership = {
			isCurrent,
			reapplyRuntimeOverlays: preparedCandidate?.reapplyRuntimeOverlays ?? ((config) => config),
			...preparedCandidate?.runtimeEnv ? { runtimeEnv: preparedCandidate.runtimeEnv } : {},
			...runtimeRefresh ? { runtimeRefresh } : {},
			publishRuntimeEnv: () => {
				assertCurrent();
				if (runtimeEnvCommitted) return;
				publishedRuntimeEnv ??= preparedCandidate?.runtimeEnv?.publish();
				assertCurrent();
			},
			rollbackRuntimeEnv: () => {
				if (runtimeEnvCommitted) return;
				publishedRuntimeEnv?.();
				publishedRuntimeEnv = void 0;
			},
			commitRuntimeEnv: commitPublishedRuntimeEnv,
			markRuntimeCommitted: (runtimeConfig, plan) => {
				commitPublishedRuntimeEnv();
				committedRuntimeConfig = runtimeConfig;
				currentConfig = runtimeConfig;
				currentCompareConfig = nextCompareConfig;
				currentSourceConfig = nextSourceConfig;
				currentRuntimeEnvSourceConfig = nextSourceConfig;
				currentReapplyRuntimeOverlays = ownership.reapplyRuntimeOverlays;
				currentRuntimeRefresh = ownership.runtimeRefresh;
				currentPluginInstallRecords = nextPluginInstallRecords;
				settings = require_config_reload_settings.resolveGatewayReloadSettings(runtimeConfig);
				appliedRevision.defer(plan, nextConfigRevisionHash);
			}
		};
		const configChangedPaths = require_config_diff.diffGatewayReloadPaths(currentCompareConfig, nextCompareConfig);
		const configPluginInstallTimestampNoopPaths = require_config_reload_plan.listPluginInstallTimestampMetadataPaths(currentCompareConfig, nextCompareConfig);
		const configPluginInstallWholeRecordPaths = require_config_reload_plan.listPluginInstallWholeRecordPaths(currentCompareConfig, nextCompareConfig);
		try {
			nextPluginInstallRecords = await readPluginInstallRecords();
		} catch (err) {
			opts.log.warn(`config reload plugin install record check failed: ${String(err)}`);
		}
		assertCurrent();
		const previousPluginInstallConfig = asPluginInstallConfig(currentPluginInstallRecords);
		const nextPluginInstallConfig = asPluginInstallConfig(nextPluginInstallRecords);
		const pluginInstallRecordChangedPaths = require_config_diff.diffConfigPaths(previousPluginInstallConfig, nextPluginInstallConfig);
		const pluginInstallRecordTimestampNoopPaths = require_config_reload_plan.listPluginInstallTimestampMetadataPaths(previousPluginInstallConfig, nextPluginInstallConfig);
		const pluginInstallRecordWholeRecordPaths = require_config_reload_plan.listPluginInstallWholeRecordPaths(previousPluginInstallConfig, nextPluginInstallConfig);
		const changedPaths = [...configChangedPaths, ...pluginInstallRecordChangedPaths];
		const pluginInstallTimestampNoopPaths = [...configPluginInstallTimestampNoopPaths, ...pluginInstallRecordTimestampNoopPaths];
		const pluginInstallWholeRecordPaths = [...configPluginInstallWholeRecordPaths, ...pluginInstallRecordWholeRecordPaths];
		await appliedRevision.flush(currentConfig);
		assertCurrent();
		const commitReloadBaseline = async (options = {}) => {
			assertCurrent();
			await appliedRevision.flush(currentConfig);
			assertCurrent();
			let rollbackAcceptedSource;
			try {
				const acceptedSourceRollback = await opts.onConfigAccepted?.(committedRuntimeConfig ?? nextConfig, ownership, nextSourceConfig, {
					runtimeApplied: options.runtimeApplied !== false,
					...options.publishSource ? { publishSource: options.publishSource } : {}
				});
				if (typeof acceptedSourceRollback === "function") rollbackAcceptedSource = acceptedSourceRollback;
				assertCurrent();
				rollbackAcceptedSource ??= await options.publishSource?.();
				assertCurrent();
				currentSourceConfig = nextSourceConfig;
				if (options.runtimeApplied === false) {
					lastSourceOnlyWriteHash = persistedHash ?? null;
					lastSourceOnlyReapplyRuntimeOverlays = ownership.reapplyRuntimeOverlays;
					lastSourceOnlyRuntimeRefresh = ownership.runtimeRefresh;
					lastSourceOnlyRuntimeConfig = nextConfig;
					lastSourceOnlySourceConfig = nextSourceConfig;
					return;
				}
				ownership.publishRuntimeEnv();
				currentRuntimeEnvSourceConfig = nextSourceConfig;
				if (persistedHash === lastSourceOnlyWriteHash) {
					lastSourceOnlyWriteHash = null;
					lastSourceOnlyReapplyRuntimeOverlays = null;
					lastSourceOnlyRuntimeRefresh = void 0;
					lastSourceOnlyRuntimeConfig = null;
					lastSourceOnlySourceConfig = null;
				}
				currentConfig = committedRuntimeConfig ?? nextConfig;
				currentCompareConfig = nextCompareConfig;
				currentReapplyRuntimeOverlays = ownership.reapplyRuntimeOverlays;
				currentRuntimeRefresh = ownership.runtimeRefresh;
				currentPluginInstallRecords = nextPluginInstallRecords;
				settings = committedRuntimeConfig ? require_config_reload_settings.resolveGatewayReloadSettings(committedRuntimeConfig) : nextSettings;
				commitPublishedRuntimeEnv();
			} catch (error) {
				ownership.rollbackRuntimeEnv();
				await rollbackAcceptedSource?.();
				throw error;
			}
		};
		if (changedPaths.length === 0) {
			let publishedSourceRollback;
			const publishSource = opts.onEffectiveConfigUnchanged ? async () => publishedSourceRollback ??= await opts.onEffectiveConfigUnchanged(nextConfig, ownership, nextSourceConfig) : void 0;
			await commitReloadBaseline(publishSource ? { publishSource } : {});
			opts.onConfigRevisionApplied?.(nextConfigRevisionHash);
			return;
		}
		const skillsChangedPath = firstSkillsChangedPath(changedPaths);
		if (skillsChangedPath !== void 0) {
			require_plugin_skills.bumpSkillsSnapshotVersion({
				reason: "config-change",
				changedPath: skillsChangedPath
			});
			opts.log.info(`skills snapshot invalidated by config change (${skillsChangedPath})`);
		}
		const followUp = require_runtime_snapshot.resolveConfigWriteFollowUp(afterWrite);
		opts.log.info(`config change detected; evaluating reload (${changedPaths.join(", ")})`);
		if (followUp.mode === "none") {
			opts.log.info(`config reload skipped by writer intent (${followUp.reason})`);
			await commitReloadBaseline({ runtimeApplied: false });
			return;
		}
		const plan = require_config_reload_plan.buildGatewayReloadPlan(changedPaths, {
			noopPaths: pluginInstallTimestampNoopPaths,
			forceChangedPaths: pluginInstallWholeRecordPaths
		});
		if (nextSettings.mode === "off") {
			opts.log.info("config reload disabled (gateway.reload.mode=off)");
			await commitReloadBaseline({ runtimeApplied: false });
			return;
		}
		if (isNoopReloadPlan(plan) && !followUp.requiresRestart) {
			await opts.onConfigChange?.(plan, nextConfig);
			await opts.onNoopConfigCommit(plan, nextConfig, ownership, nextSourceConfig);
			assertCurrent();
			await appliedRevision.apply(plan, nextConfig, nextConfigRevisionHash);
			await commitReloadBaseline();
			return;
		}
		if (followUp.requiresRestart) {
			const restartPlan = {
				...plan,
				restartGateway: true,
				restartReasons: [...plan.restartReasons, followUp.reason]
			};
			await opts.onConfigChange?.(restartPlan, nextConfig);
			await prepareRestart(restartPlan, nextConfig, ownership, nextSourceConfig);
			await commitReloadBaseline();
			return;
		}
		if (nextSettings.mode === "restart") {
			const restartPlan = {
				...plan,
				restartGateway: true
			};
			await opts.onConfigChange?.(restartPlan, nextConfig);
			await prepareRestart(restartPlan, nextConfig, ownership, nextSourceConfig);
			await commitReloadBaseline();
			return;
		}
		if (plan.restartGateway) {
			if (nextSettings.mode === "hot") {
				opts.log.warn(`config reload requires gateway restart; hot mode ignoring (${plan.restartReasons.join(", ")})`);
				await commitReloadBaseline({ runtimeApplied: false });
				return;
			}
			await opts.onConfigChange?.(plan, nextConfig);
			await prepareRestart(plan, nextConfig, ownership, nextSourceConfig);
			await commitReloadBaseline();
			return;
		}
		await opts.onConfigChange?.(plan, nextConfig);
		try {
			await opts.onHotReload(plan, nextConfig, ownership, nextSourceConfig);
		} catch (error) {
			ownership.rollbackRuntimeEnv();
			throw error;
		}
		assertCurrent();
		await appliedRevision.apply(plan, nextConfig, nextConfigRevisionHash);
		await commitReloadBaseline();
	};
	const promoteAcceptedSnapshot = async (snapshot, reason) => {
		if (!opts.promoteSnapshot || !snapshot.exists || !snapshot.valid) return;
		try {
			await opts.promoteSnapshot(snapshot, reason);
		} catch (err) {
			opts.log.warn(`config reload last-known-good promotion failed: ${String(err)}`);
		}
	};
	const runAcceptedTransaction = async (run) => {
		if (opts.runTransaction) {
			await opts.runTransaction(run);
			return;
		}
		await run();
	};
	const acceptCurrentRuntimeEcho = async (transactionEpoch) => {
		const ownership = {
			isCurrent: () => configWriteEpoch === transactionEpoch,
			reapplyRuntimeOverlays: currentReapplyRuntimeOverlays,
			publishRuntimeEnv: () => {},
			rollbackRuntimeEnv: () => {},
			commitRuntimeEnv: () => {},
			...currentRuntimeRefresh ? { runtimeRefresh: currentRuntimeRefresh } : {},
			markRuntimeCommitted: () => {}
		};
		await runAcceptedTransaction(async () => {
			await appliedRevision.flush(currentConfig);
			if (!ownership.isCurrent()) throw new GatewayConfigReloadSupersededError$1();
			await opts.onConfigAccepted?.(currentConfig, ownership, currentSourceConfig, { runtimeApplied: true });
			if (!ownership.isCurrent()) throw new GatewayConfigReloadSupersededError$1();
		});
	};
	const promoteAcceptedInProcessWrite = async (persistedHash) => {
		if (!opts.promoteSnapshot) return;
		try {
			const snapshot = await opts.readSnapshot(currentRuntimeEnvSourceConfig);
			if (snapshot.hash !== persistedHash || !snapshot.valid) return;
			await promoteAcceptedSnapshot(snapshot, "in-process-write");
		} catch (err) {
			opts.log.warn(`config reload in-process last-known-good promotion failed: ${String(err)}`);
		}
	};
	const runReload = async () => {
		if (stopped) return;
		if (running) {
			pending = true;
			return;
		}
		running = true;
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		try {
			if (pendingInProcessConfig) {
				const pendingWrite = pendingInProcessConfig;
				pendingInProcessConfig = null;
				activeInProcessConfig = pendingWrite;
				missingConfigRetries = 0;
				try {
					await runAcceptedTransaction(async () => {
						await applySnapshot(pendingWrite.config, pendingWrite.compareConfig, pendingWrite.afterWrite, pendingWrite.epoch, pendingWrite.persistedHash, pendingWrite.preparedCandidate, pendingWrite.runtimeRefresh);
						if (activeInProcessConfig === pendingWrite) activeInProcessConfig = null;
						await promoteAcceptedInProcessWrite(pendingWrite.persistedHash);
					});
				} catch (err) {
					if (lastAppliedWriteHash === pendingWrite.persistedHash) lastAppliedWriteHash = null;
					if (configWriteEpoch === pendingWrite.epoch && !pendingInProcessConfig && !watcherIntentCandidate) watcherIntentCandidate = pendingWrite;
					throw err;
				} finally {
					if (activeInProcessConfig === pendingWrite) activeInProcessConfig = null;
				}
				return;
			}
			const transactionEpoch = configWriteEpoch;
			const intentCandidate = watcherIntentCandidate;
			const snapshot = await opts.readSnapshot(currentRuntimeEnvSourceConfig);
			if (configWriteEpoch !== transactionEpoch) throw new GatewayConfigReloadSupersededError$1();
			if (handleMissingSnapshot(snapshot)) {
				await appliedRevision.flush(currentConfig);
				return;
			}
			if (startupInternalWriteHash && typeof snapshot.hash === "string") {
				const matchesStartupWrite = snapshot.valid && snapshot.hash === startupInternalWriteHash && require_config_diff.diffConfigPaths(currentSourceConfig, snapshot.sourceConfig).length === 0;
				startupInternalWriteHash = null;
				if (matchesStartupWrite) {
					await acceptCurrentRuntimeEcho(transactionEpoch);
					return;
				}
			}
			if (intentCandidate && snapshot.valid && snapshot.hash === intentCandidate.persistedHash && require_config_diff.diffConfigPaths(intentCandidate.compareConfig, snapshot.sourceConfig).length === 0) {
				lastAppliedWriteHash = intentCandidate.persistedHash;
				try {
					await runAcceptedTransaction(async () => {
						await applySnapshot(intentCandidate.config, intentCandidate.compareConfig, intentCandidate.afterWrite, transactionEpoch, intentCandidate.persistedHash, intentCandidate.preparedCandidate, intentCandidate.runtimeRefresh);
						if (watcherIntentCandidate === intentCandidate) watcherIntentCandidate = null;
						await promoteAcceptedSnapshot(snapshot, "in-process-write");
					});
				} catch (err) {
					if (lastAppliedWriteHash === intentCandidate.persistedHash) lastAppliedWriteHash = null;
					if (configWriteEpoch === transactionEpoch && !watcherIntentCandidate) watcherIntentCandidate = intentCandidate;
					throw err;
				}
				return;
			}
			if (watcherIntentCandidate === intentCandidate) watcherIntentCandidate = null;
			if (intentCandidate && lastAppliedWriteHash === intentCandidate.persistedHash) lastAppliedWriteHash = null;
			if (lastAppliedWriteHash && typeof snapshot.hash === "string") {
				if (snapshot.valid && snapshot.hash === lastAppliedWriteHash && require_config_diff.diffConfigPaths(currentSourceConfig, snapshot.sourceConfig).length === 0) {
					if (snapshot.hash === lastSourceOnlyWriteHash) {
						const ownership = {
							isCurrent: () => configWriteEpoch === transactionEpoch,
							reapplyRuntimeOverlays: lastSourceOnlyReapplyRuntimeOverlays ?? currentReapplyRuntimeOverlays,
							publishRuntimeEnv: () => {},
							rollbackRuntimeEnv: () => {},
							commitRuntimeEnv: () => {},
							...lastSourceOnlyRuntimeRefresh ? { runtimeRefresh: lastSourceOnlyRuntimeRefresh } : {},
							markRuntimeCommitted: () => {}
						};
						await runAcceptedTransaction(async () => {
							await appliedRevision.flush(currentConfig);
							if (!ownership.isCurrent()) throw new GatewayConfigReloadSupersededError$1();
							await opts.onConfigAccepted?.(lastSourceOnlyRuntimeConfig ?? currentConfig, ownership, lastSourceOnlySourceConfig ?? currentSourceConfig, { runtimeApplied: false });
							if (!ownership.isCurrent()) throw new GatewayConfigReloadSupersededError$1();
						});
						return;
					}
					await acceptCurrentRuntimeEcho(transactionEpoch);
					return;
				}
				lastAppliedWriteHash = null;
			}
			if (!snapshot.valid) {
				handleInvalidSnapshot(snapshot);
				await appliedRevision.flush(currentConfig);
				return;
			}
			await runAcceptedTransaction(async () => {
				await applySnapshot(snapshot.config, snapshot.sourceConfig, void 0, transactionEpoch, snapshot.hash);
				await promoteAcceptedSnapshot(snapshot, "valid-config");
			});
		} catch (err) {
			if (isGatewayConfigReloadSupersededError(err)) opts.log.info(`config reload superseded: ${String(err)}`);
			else opts.log.error(`config reload failed: ${String(err)}`);
		} finally {
			running = false;
			if (pending) {
				pending = false;
				schedule();
			}
		}
	};
	function startTrackedReload() {
		const reload = runReload();
		activeReloads.add(reload);
		reload.then(() => activeReloads.delete(reload), () => activeReloads.delete(reload));
	}
	const scheduleFromWatcher = () => {
		opts.onConfigCandidateObserved?.();
		configWriteEpoch += 1;
		const pendingCandidate = pendingInProcessConfig;
		const activeCandidate = activeInProcessConfig;
		const newestLiveCandidate = pendingCandidate && (!activeCandidate || pendingCandidate.epoch > activeCandidate.epoch) ? pendingCandidate : activeCandidate;
		if (newestLiveCandidate && (!watcherIntentCandidate || newestLiveCandidate.epoch > watcherIntentCandidate.epoch)) watcherIntentCandidate = newestLiveCandidate;
		if (pendingInProcessConfig) pendingInProcessConfig = null;
		schedule();
	};
	const unsubscribeFromWrites = opts.subscribeToWrites?.((event) => {
		if (event.configPath !== opts.watchPath) return;
		startupInternalWriteHash = null;
		opts.onConfigCandidateObserved?.();
		configWriteEpoch += 1;
		watcherIntentCandidate = null;
		pendingInProcessConfig = {
			config: event.runtimeConfig,
			compareConfig: event.sourceConfig,
			persistedHash: event.persistedHash,
			afterWrite: event.afterWrite,
			...event.preparedCandidate ? { preparedCandidate: event.preparedCandidate } : {},
			...event.runtimeRefresh ? { runtimeRefresh: event.runtimeRefresh } : {},
			epoch: configWriteEpoch
		};
		lastAppliedWriteHash = event.persistedHash;
		scheduleAfter(0);
	}) ?? (() => {});
	let watcher = null;
	let watcherRecreateRetries = 0;
	let watcherRecreateTimer = null;
	let hotReloadStatus = "active";
	let degradedToPolling = false;
	let watcherUsesPolling = false;
	const createWatcher = () => {
		if (stopped) return;
		const usePolling = resolveChokidarUsePolling(degradedToPolling);
		const next = chokidar.default.watch(opts.watchPath, {
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 200,
				pollInterval: 50
			},
			usePolling
		});
		next.on("add", scheduleFromWatcher);
		next.on("change", scheduleFromWatcher);
		next.on("unlink", scheduleFromWatcher);
		next.on("error", (err) => {
			handleWatcherError(next, err);
		});
		watcher = next;
		watcherUsesPolling = next.options.usePolling;
		hotReloadStatus = "active";
	};
	const handleWatcherError = (source, err) => {
		if (stopped || source !== watcher) return;
		const failedWatcherUsedPolling = watcherUsesPolling;
		watcher = null;
		watcherUsesPolling = false;
		source?.close().catch(() => {});
		if (watcherRecreateRetries >= WATCHER_RECREATE_MAX_RETRIES) {
			if (!failedWatcherUsedPolling && resolveChokidarUsePolling(true)) {
				degradedToPolling = true;
				watcherRecreateRetries = 0;
				opts.log.warn(`config watcher native retries exhausted; degrading to polling mode: ${String(err)}`);
				watcherRecreateTimer = setTimeout(() => {
					watcherRecreateTimer = null;
					createWatcher();
				}, WATCHER_RECREATE_BACKOFF_MS[0] ?? 500);
				return;
			}
			const mode = failedWatcherUsedPolling ? "polling mode" : "native mode";
			hotReloadStatus = "disabled";
			opts.log.error(`config hot-reload disabled: watcher failed after ${WATCHER_RECREATE_MAX_RETRIES} re-create attempts in ${mode}: ${String(err)}`);
			return;
		}
		const backoff = WATCHER_RECREATE_BACKOFF_MS[watcherRecreateRetries] ?? WATCHER_RECREATE_BACKOFF_MS[WATCHER_RECREATE_BACKOFF_MS.length - 1] ?? 0;
		watcherRecreateRetries += 1;
		opts.log.warn(`config watcher error; re-creating watcher (attempt ${watcherRecreateRetries}/${WATCHER_RECREATE_MAX_RETRIES} in ${backoff}ms): ${String(err)}`);
		watcherRecreateTimer = setTimeout(() => {
			watcherRecreateTimer = null;
			createWatcher();
		}, backoff);
	};
	createWatcher();
	return {
		stop: async () => {
			stopped = true;
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = null;
			if (watcherRecreateTimer) {
				clearTimeout(watcherRecreateTimer);
				watcherRecreateTimer = null;
			}
			unsubscribeFromWrites();
			const active = watcher;
			watcher = null;
			await active?.close().catch(() => {});
			await Promise.all(activeReloads);
		},
		hotReloadStatus: () => hotReloadStatus
	};
}
//#endregion
//#region src/gateway/server-reload-handlers.ts
let currentReloadGeneration = 0;
let abortGeneration;
const RESTART_EMISSION_RETRY_MS = 1e3;
/** Signal any in-progress deferred channel reload to abort immediately. */
function abortPendingChannelReloads() {
	abortGeneration = currentReloadGeneration;
}
async function activateSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, options) {
	const runtime = await Promise.resolve().then(() => require("./runtime-Cmn4mgbi.cjs"));
	if (options?.canActivate && !options.canActivate()) return false;
	if (!runtime.activateSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision)) return false;
	options?.onActivated?.();
	return true;
}
async function restoreSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, ownedSnapshot, options) {
	if (!(await Promise.resolve().then(() => require("./runtime-Cmn4mgbi.cjs"))).restoreSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, ownedSnapshot)) return false;
	options?.onActivated?.();
	return true;
}
var GatewayHotReloadCancelledError = class extends Error {
	constructor() {
		super("config hot reload cancelled by config supersession or in-process restart");
		this.name = "GatewayHotReloadCancelledError";
	}
};
var GatewayHotReloadRecoveryError = class extends Error {
	constructor(surface) {
		super(`config hot reload committed but could not schedule recovery for ${surface}`);
		this.name = "GatewayHotReloadRecoveryError";
	}
};
var GatewayReloadRequiresRecoveryOwnerError = class extends Error {
	constructor(surface) {
		super(`config reload requires a managed gateway restart owner for ${surface}`);
		this.name = "GatewayReloadRequiresRecoveryOwnerError";
	}
};
var GatewayHotReloadStaleSecretsError = class extends Error {
	constructor() {
		super("runtime secrets changed while config hot reload was deferred");
		this.name = "GatewayHotReloadStaleSecretsError";
	}
};
var GatewayConfigReloadSupersededError = class extends Error {
	constructor() {
		super("config reload superseded by a newer runtime config source");
		this.name = "GatewayConfigReloadSupersededError";
	}
};
const MCP_RUNTIME_RELOAD_DISPOSE_TIMEOUT_MS = 5e3;
const CHANNEL_RELOAD_DEFERRAL_POLL_MS = 500;
const CHANNEL_RELOAD_STILL_PENDING_WARN_MS = 3e4;
function projectCanonicalSecretRefsOntoRuntime(sourceValue, runtimeValue) {
	if (require_types_secrets.isSecretRef(sourceValue)) return sourceValue;
	if (Array.isArray(sourceValue)) {
		const runtimeArray = Array.isArray(runtimeValue) ? runtimeValue : [];
		return sourceValue.map((entry, index) => projectCanonicalSecretRefsOntoRuntime(entry, runtimeArray[index]));
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(sourceValue)) {
		const runtimeRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(runtimeValue) ? runtimeValue : {};
		const projected = { ...runtimeRecord };
		for (const [key, entry] of Object.entries(sourceValue)) projected[key] = projectCanonicalSecretRefsOntoRuntime(entry, runtimeRecord[key]);
		return projected;
	}
	return runtimeValue === void 0 ? sourceValue : runtimeValue;
}
function restoreCanonicalSecretRefs(runtimeConfig, sourceConfig) {
	return projectCanonicalSecretRefsOntoRuntime(sourceConfig, runtimeConfig);
}
function resetPreparedModelRuntimeStateForHotReload() {
	require_model_catalog.resetModelCatalogCache();
	require_model_provider_auth_state.clearCurrentProviderAuthState();
	require_server_model_catalog.markGatewayModelCatalogStaleForReload();
}
function assertIrreversibleReloadPlanHasRecoveryOwner(plan, restartRecoveryAvailable) {
	if (restartRecoveryAvailable !== false) return;
	if (plan.restartGateway) throw new GatewayReloadRequiresRecoveryOwnerError("gateway restart");
	if (reloadPlanNeedsRecovery(plan)) throw new GatewayReloadRequiresRecoveryOwnerError("irreversible hot reload");
}
async function disposeMcpRuntimesWithTimeout(params) {
	let timer;
	const disposePromise = Promise.resolve().then(params.dispose).catch((error) => {
		params.onWarn(`${params.label} failed: ${String(error)}`);
	});
	const timeoutPromise = new Promise((resolve) => {
		timer = setTimeout(() => resolve("timeout"), params.timeoutMs);
		timer.unref?.();
	});
	const result = await Promise.race([disposePromise.then(() => "done"), timeoutPromise]);
	if (timer) clearTimeout(timer);
	if (result === "timeout") params.onWarn(`${params.label} exceeded ${params.timeoutMs}ms; continuing`);
}
async function collectChannelOperationFailures(params) {
	const failures = [];
	for (const channel of params.channels) try {
		await params.run(channel);
	} catch (err) {
		failures.push(channel);
		params.onFailure(channel, err);
	}
	return failures;
}
function createGatewayReloadHandlers(params) {
	const myGeneration = ++currentReloadGeneration;
	const restartRecoveryAvailable = params.restartRecoveryAvailable !== false && params.requestRecoveryRestart !== void 0;
	const getActiveCounts = () => {
		const queueSize = require_command_queue.getTotalQueueSize();
		const pendingReplies = require_dispatcher_registry.getTotalPendingReplies();
		const embeddedRuns = require_run_state.getActiveEmbeddedRunCount();
		const backgroundExecSessions = require_bash_process_registry.getActiveBackgroundExecSessionCount();
		const rootRequests = require_gateway_work_admission.getActiveGatewayRootWorkCount({ excludeCurrent: true });
		const activeTasks = require_task_registry_maintenance.getInspectableActiveTaskRestartBlockers().length;
		return {
			queueSize,
			pendingReplies,
			embeddedRuns,
			backgroundExecSessions,
			rootRequests,
			activeTasks,
			totalActive: queueSize + pendingReplies + embeddedRuns + backgroundExecSessions + rootRequests + activeTasks
		};
	};
	const formatActiveDetails = (counts) => {
		const details = [];
		if (counts.queueSize > 0) details.push(`${counts.queueSize} operation(s)`);
		if (counts.pendingReplies > 0) details.push(`${counts.pendingReplies} reply(ies)`);
		if (counts.embeddedRuns > 0) details.push(`${counts.embeddedRuns} embedded run(s)`);
		if (counts.backgroundExecSessions > 0) details.push(`${counts.backgroundExecSessions} background exec session(s)`);
		if (counts.rootRequests > 0) details.push(`${counts.rootRequests} gateway request(s)`);
		if (counts.activeTasks > 0) details.push(`${counts.activeTasks} background task run(s)`);
		return details;
	};
	const formatTaskBlockers = () => {
		const blockers = require_task_registry_maintenance.getInspectableActiveTaskRestartBlockers();
		if (blockers.length === 0) return null;
		const shown = blockers.slice(0, 8).map(require_task_restart_blocker.formatActiveTaskRestartBlocker);
		const omitted = blockers.length - shown.length;
		return omitted > 0 ? `${shown.join("; ")}; +${omitted} more` : shown.join("; ");
	};
	const waitForActiveWorkBeforeChannelReload = async (channels, nextConfig, isTransactionCurrent) => {
		if (!isTransactionCurrent()) return true;
		const initial = getActiveCounts();
		if (initial.totalActive <= 0) return false;
		const channelNames = [...channels].join(", ");
		const initialDetails = formatActiveDetails(initial);
		params.logReload.warn(`config change requires channel reload (${channelNames}) — deferring until ${initialDetails.join(", ")} complete`);
		const timeoutMs = require_restart.resolveGatewayRestartDeferralTimeoutMs(nextConfig.gateway?.reload?.deferralTimeoutMs);
		const startedAt = Date.now();
		let nextStillPendingAt = startedAt + CHANNEL_RELOAD_STILL_PENDING_WARN_MS;
		while (true) {
			if (!isTransactionCurrent() || abortGeneration !== void 0 && myGeneration <= abortGeneration) return true;
			await new Promise((resolve) => {
				setTimeout(resolve, CHANNEL_RELOAD_DEFERRAL_POLL_MS).unref?.();
			});
			if (!isTransactionCurrent() || abortGeneration !== void 0 && myGeneration <= abortGeneration) return true;
			const current = getActiveCounts();
			if (current.totalActive <= 0) return false;
			const elapsedMs = Date.now() - startedAt;
			if (timeoutMs !== void 0 && elapsedMs >= timeoutMs) {
				const remaining = formatActiveDetails(current);
				params.logReload.warn(`channel reload timeout after ${elapsedMs}ms with ${remaining.join(", ")} still active; reloading channels anyway`);
				return false;
			}
			if (Date.now() >= nextStillPendingAt) {
				const remaining = formatActiveDetails(current);
				params.logReload.warn(`channel reload still deferred after ${elapsedMs}ms with ${remaining.join(", ")} active`);
				nextStillPendingAt = Date.now() + CHANNEL_RELOAD_STILL_PENDING_WARN_MS;
			}
		}
	};
	const applyHotReload = async (plan, nextConfig, publication) => {
		assertIrreversibleReloadPlanHasRecoveryOwner(plan, restartRecoveryAvailable);
		const isTransactionCurrent = () => !restartRetryStopped && (publication?.isCurrent?.() ?? true);
		const state = params.getState();
		const nextState = { ...state };
		resetPreparedModelRuntimeStateForHotReload();
		if (plan.reloadHooks) try {
			nextState.hooksConfig = require_hooks.resolveHooksConfig(nextConfig);
		} catch (err) {
			params.logHooks.warn(`hooks config reload failed: ${String(err)}`);
			throw err;
		}
		nextState.hookClientIpConfig = require_hook_client_ip_config.resolveHookClientIpConfig(nextConfig);
		if (plan.restartCron) nextState.cronState = require_server_cron.buildGatewayCronService({
			cfg: nextConfig,
			deps: params.deps,
			broadcast: params.broadcast,
			env: publication?.runtimeEnv ?? process.env
		});
		require_target_resolver.resetDirectoryCache();
		const channelsToRestart = new Set(plan.restartChannels);
		const channelsStoppedBeforePluginReload = /* @__PURE__ */ new Set();
		let activePluginChannelsAfterReload = null;
		let pluginReloadAborted = false;
		const isLifecycleReloadAborted = () => abortGeneration !== void 0 && myGeneration <= abortGeneration;
		const isPluginReloadAborted = () => pluginReloadAborted || !isTransactionCurrent() || isLifecycleReloadAborted();
		let runtimeCommitted = false;
		let recoveryRestartScheduled = false;
		const laneConcurrency = require_hook_client_ip_config.resolveGatewayLaneConcurrency(nextConfig);
		const candidateEnv = publication?.runtimeEnv ?? process.env;
		const shouldSkipChannelRestart = require_env.isTruthyEnvValue(candidateEnv.OPERATOR_SKIP_CHANNELS) || require_env.isTruthyEnvValue(candidateEnv.OPERATOR_SKIP_PROVIDERS);
		const getChannelAutostartSuppression = () => params.getChannelAutostartSuppression?.() ?? null;
		const logSuppressedChannelRestart = (channels, action) => {
			if (!getChannelAutostartSuppression()) return;
			params.logChannels.info(`${action} suppressed by crash-loop breaker for channels: ${[...channels].join(", ")}`);
		};
		const commitRuntime = async () => {
			if (runtimeCommitted) return;
			const commit = async () => {
				if (plan.restartHeartbeat) nextState.heartbeatRunner.updateConfig(nextConfig);
				params.setState(nextState);
				require_hook_client_ip_config.applyGatewayLaneConcurrency(laneConcurrency);
				runtimeCommitted = true;
				require_restart.setGatewaySigusr1RestartPolicy({ allowExternal: require_commands_flags.isRestartEnabled(nextConfig) });
				if (plan.restartCron) {
					params.cronReconciliation.invalidate();
					params.onCronRestart?.();
					state.cronState.cron.stop();
					state.cronState.stopExitWatchers?.();
					require_server_runtime_services.startGatewayCronWithLogging({
						cronState: nextState.cronState,
						cronReconciliation: params.cronReconciliation,
						reason: "reload",
						config: nextConfig,
						afterStart: nextState.cronState.reconcileExitWatchers,
						logCron: params.logCron,
						onStartError: (err) => {
							if (myGeneration !== currentReloadGeneration || params.getState().cronState !== nextState.cronState) return;
							try {
								scheduleRecoveryRestart("cron reload", err);
							} catch (recoveryError) {
								params.logCron.error(require_errors.formatErrorMessage(recoveryError));
							}
						}
					});
				}
			};
			if (publication) await publication.publish(commit, () => runtimeCommitted);
			else await commit();
		};
		const settleRecoveryRestart = (restartTransaction, surface) => {
			if (restartTransaction.status === "recovery-pending" && !restartRecoveryAvailable) {
				restartTransaction.settle("rejected");
				throw new GatewayHotReloadRecoveryError(surface);
			}
			restartTransaction.settle("committed");
			recoveryRestartScheduled = true;
		};
		const scheduleRecoveryRestart = (surface, err) => {
			const detail = err === void 0 ? "" : `: ${require_errors.formatErrorMessage(err)}`;
			if (restartRetryStopped) {
				params.logReload.warn(`${surface} failed during gateway shutdown${detail}`);
				return;
			}
			if (!restartRecoveryAvailable || !params.requestRecoveryRestart) {
				const message = runtimeCommitted ? `config hot reload committed with unrecovered ${surface} failure${detail}; gateway restart recovery is unavailable; runtime may be inconsistent` : `config hot reload failed before commit during ${surface}${detail}; gateway restart recovery is unavailable`;
				if (params.logReload.error) params.logReload.error(message);
				else params.logReload.warn(message);
				if (runtimeCommitted) throw new GatewayHotReloadRecoveryError(surface);
				if (err instanceof Error) throw err;
				throw new Error(`config hot reload failed before commit during ${surface}${detail}`);
			}
			const recoveryPlan = {
				...plan,
				restartGateway: true,
				restartReasons: [`hot reload recovery: ${surface}`]
			};
			if (!isTransactionCurrent()) {
				params.logReload.warn(`${surface} failed after config supersession${detail}; recovery deferred to the newer config`);
				if (!configCandidatePending && !restartRequestTransaction && latestAcceptedRestartTarget) {
					const target = latestAcceptedRestartTarget;
					const restartTransaction = requestGatewayRestart(recoveryPlan, target.runtimeConfig, {
						retainDebtAcrossConfigChanges: true,
						debtConfig: target.sourceConfig,
						prepareRuntimeConfig: target.prepareRuntimeConfig
					});
					settleRecoveryRestart(restartTransaction, surface);
					return;
				}
				deferGatewayRestartDebt(recoveryPlan, nextConfig, {
					retainDebtAcrossConfigChanges: true,
					debtConfig: publication?.sourceConfig ?? nextConfig
				});
				return;
			}
			params.logReload.warn(`${surface} failed after config commit${detail}; restarting gateway`);
			if (recoveryRestartScheduled) return;
			try {
				const restartTransaction = requestGatewayRestart(recoveryPlan, nextConfig, {
					retainDebtAcrossConfigChanges: true,
					debtConfig: publication?.sourceConfig ?? nextConfig,
					...publication?.prepareRestartRuntimeConfig ? { prepareRuntimeConfig: publication.prepareRestartRuntimeConfig } : {}
				});
				settleRecoveryRestart(restartTransaction, surface);
			} catch (restartError) {
				params.logReload.warn(`failed to schedule post-commit gateway restart: ${require_errors.formatErrorMessage(restartError)}`);
				if (restartError instanceof GatewayHotReloadRecoveryError) throw restartError;
				throw new GatewayHotReloadRecoveryError(surface);
			}
		};
		if (plan.reloadPlugins) {
			const restartStoppedPluginChannels = async (reason) => await collectChannelOperationFailures({
				channels: [...channelsStoppedBeforePluginReload],
				run: async (channel) => {
					params.logChannels.info(`restarting ${channel} channel after ${reason}`);
					await require_gateway_work_admission.runOutsideGatewayRootWorkAdmission(() => params.startChannel(channel));
					channelsStoppedBeforePluginReload.delete(channel);
				},
				onFailure: (channel, err) => {
					params.logChannels.error(`failed to restart ${channel} channel after ${reason}: ${require_errors.formatErrorMessage(err)}`);
				}
			});
			const failPluginChannelRollback = (reason, failures) => {
				const error = /* @__PURE__ */ new Error(`plugin reload cancellation rollback failed for: ${failures.join(", ")}`);
				scheduleRecoveryRestart(`plugin channel rollback after ${reason}`, error);
				throw error;
			};
			const stopChannelsBeforePluginReplace = async (channels) => {
				for (const channel of channels) channelsToRestart.add(channel);
				if (channelsToRestart.size === 0 || shouldSkipChannelRestart) return;
				if (await waitForActiveWorkBeforeChannelReload(channelsToRestart, nextConfig, isTransactionCurrent)) {
					params.logChannels.info("channel reload before plugin replace cancelled by config supersession or restart");
					pluginReloadAborted = true;
					return;
				}
				const stopFailures = await collectChannelOperationFailures({
					channels: channelsToRestart,
					run: async (channel) => {
						if (isPluginReloadAborted()) {
							pluginReloadAborted = true;
							return;
						}
						if (channelsStoppedBeforePluginReload.has(channel)) return;
						params.logChannels.info(`stopping ${channel} channel before plugin reload`);
						channelsStoppedBeforePluginReload.add(channel);
						await params.stopChannel(channel, void 0, { manual: false });
						if (isPluginReloadAborted()) pluginReloadAborted = true;
					},
					onFailure: (channel, err) => {
						params.logChannels.error(`failed to stop ${channel} channel before plugin reload: ${require_errors.formatErrorMessage(err)}`);
					}
				});
				if (isPluginReloadAborted()) pluginReloadAborted = true;
				if (pluginReloadAborted) {
					if (isLifecycleReloadAborted()) return;
					const rollbackFailures = await restartStoppedPluginChannels("cancelled plugin reload pre-stop");
					if (rollbackFailures.length > 0) failPluginChannelRollback("cancelled plugin reload pre-stop", rollbackFailures);
					return;
				}
				if (stopFailures.length > 0) {
					const rollbackFailures = await restartStoppedPluginChannels("failed plugin reload pre-stop");
					if (rollbackFailures.length > 0) failPluginChannelRollback("failed plugin reload pre-stop", rollbackFailures);
					throw new Error(`failed to stop channels before plugin reload: ${stopFailures.join(", ")}`);
				}
			};
			if (!pluginReloadAborted) {
				let pluginReloadResult;
				try {
					pluginReloadResult = await params.reloadPlugins({
						nextConfig,
						changedPaths: plan.changedPaths,
						beforeReplace: stopChannelsBeforePluginReplace,
						commitRuntime,
						env: publication?.runtimeEnv ?? process.env,
						isAborted: isPluginReloadAborted
					});
				} catch (err) {
					if (!runtimeCommitted) {
						const rollbackFailures = await restartStoppedPluginChannels("failed plugin runtime publication");
						if (rollbackFailures.length > 0) failPluginChannelRollback("failed plugin runtime publication", rollbackFailures);
						throw err;
					}
					scheduleRecoveryRestart("plugin runtime reload", err);
					return;
				}
				if (pluginReloadResult.cancelled) {
					pluginReloadAborted = true;
					if (!isLifecycleReloadAborted()) {
						const rollbackFailures = await restartStoppedPluginChannels("cancelled plugin runtime publication");
						if (rollbackFailures.length > 0) failPluginChannelRollback("cancelled plugin runtime publication", rollbackFailures);
					}
				}
				if (!pluginReloadAborted) {
					for (const channel of pluginReloadResult.restartChannels) channelsToRestart.add(channel);
					activePluginChannelsAfterReload = pluginReloadResult.activeChannels;
					resetPreparedModelRuntimeStateForHotReload();
				}
			}
		}
		if (!plan.reloadPlugins && channelsToRestart.size > 0 && !shouldSkipChannelRestart) pluginReloadAborted = await waitForActiveWorkBeforeChannelReload(channelsToRestart, nextConfig, isTransactionCurrent);
		if (pluginReloadAborted) {
			params.logChannels.info("channel restart cancelled by config supersession or restart");
			throw new GatewayHotReloadCancelledError();
		}
		try {
			await commitRuntime();
		} catch (err) {
			if (!runtimeCommitted) throw err;
			scheduleRecoveryRestart("runtime commit", err);
			return;
		}
		if (plan.restartHealthMonitor) try {
			state.channelHealthMonitor?.stop();
			await state.channelHealthMonitor?.waitForIdle();
			nextState.channelHealthMonitor = params.createHealthMonitor(nextConfig);
			params.setState(nextState);
		} catch (err) {
			scheduleRecoveryRestart("health monitor reload", err);
		}
		if (plan.disposeMcpRuntimes) await disposeMcpRuntimesWithTimeout({
			dispose: require_agent_bundle_mcp_runtime.disposeAllSessionMcpRuntimes,
			timeoutMs: MCP_RUNTIME_RELOAD_DISPOSE_TIMEOUT_MS,
			onWarn: params.logReload.warn,
			label: "bundle-mcp runtime disposal during config reload"
		});
		if (plan.restartGmailWatcher) {
			const restartAbortController = params.createGmailRestartAbortController?.() ?? new AbortController();
			try {
				await params.stopPostReadySidecars?.();
				if (!restartAbortController.signal.aborted) {
					const [{ stopGmailWatcher }, { startGmailWatcherWithLogs }] = await Promise.all([Promise.resolve().then(() => require("./gmail-watcher-BhEHZ6Qi.cjs")), Promise.resolve().then(() => require("./gmail-watcher-lifecycle-98286_lQ.cjs"))]);
					if (!restartAbortController.signal.aborted) await stopGmailWatcher().catch((err) => {
						params.logHooks.warn(`gmail watcher stop failed during reload: ${String(err)}`);
					});
					if (!restartAbortController.signal.aborted) await startGmailWatcherWithLogs({
						cfg: nextConfig,
						log: params.logHooks,
						isCancelled: () => restartAbortController.signal.aborted,
						signal: restartAbortController.signal,
						onSkipped: () => params.logHooks.info("skipping gmail watcher restart (OPERATOR_SKIP_GMAIL_WATCHER=1)")
					});
				}
			} catch (err) {
				scheduleRecoveryRestart("gmail watcher reload", err);
			} finally {
				params.clearGmailRestartAbortController?.(restartAbortController);
			}
		}
		if (channelsToRestart.size > 0) if (shouldSkipChannelRestart) params.logChannels.info("skipping channel reload (OPERATOR_SKIP_CHANNELS=1 or OPERATOR_SKIP_PROVIDERS=1)");
		else if (getChannelAutostartSuppression()) if (pluginReloadAborted) params.logChannels.info("channel restart cancelled by in-process restart");
		else {
			const stopFailures = await collectChannelOperationFailures({
				channels: channelsToRestart,
				run: async (channel) => {
					if (plan.reloadPlugins && activePluginChannelsAfterReload?.has(channel) === false) return;
					if (channelsStoppedBeforePluginReload.has(channel)) return;
					params.logChannels.info(`stopping ${channel} channel before suppressed hot reload`);
					await params.stopChannel(channel, void 0, { manual: false });
				},
				onFailure: (channel, err) => {
					params.logChannels.error(`failed to stop ${channel} channel during suppressed hot reload: ${require_errors.formatErrorMessage(err)}`);
				}
			});
			if (stopFailures.length > 0) scheduleRecoveryRestart(`channel stop (${stopFailures.join(", ")})`);
			logSuppressedChannelRestart(channelsToRestart, "channel restart during hot reload");
		}
		else if (pluginReloadAborted) params.logChannels.info("channel restart cancelled by in-process restart");
		else {
			const restartChannel = async (name) => {
				if (plan.reloadPlugins && activePluginChannelsAfterReload?.has(name) === false) return;
				params.logChannels.info(`restarting ${name} channel`);
				if (!channelsStoppedBeforePluginReload.has(name)) await params.stopChannel(name, void 0, { manual: false });
				if (abortGeneration !== void 0 && myGeneration <= abortGeneration) return;
				await require_gateway_work_admission.runOutsideGatewayRootWorkAdmission(() => params.startChannel(name));
			};
			const restartFailures = await collectChannelOperationFailures({
				channels: channelsToRestart,
				run: restartChannel,
				onFailure: (channel, err) => {
					params.logChannels.error(`failed to restart ${channel} channel during hot reload: ${require_errors.formatErrorMessage(err)}`);
				}
			});
			if (restartFailures.length > 0) scheduleRecoveryRestart(`channel restart (${restartFailures.join(", ")})`);
		}
		if (shouldRefreshContextWindowCache(plan)) {
			try {
				await require_context.refreshContextWindowCache(nextConfig);
			} catch (err) {
				scheduleRecoveryRestart("context window cache reload", err);
			}
			require_model_catalog.loadModelCatalog({ config: nextConfig }).catch((err) => {
				params.logReload.warn(`model catalog rewarm failed: ${String(err)}`);
			});
		}
		require_model_provider_auth.warmCurrentProviderAuthStateOffMainThread(nextConfig, { isCancelled: () => !isTransactionCurrent() }).catch((err) => {
			if (isTransactionCurrent()) params.logReload.warn(`provider auth state rewarm failed: ${String(err)}`);
		});
		if (plan.hotReasons.length > 0) params.logReload.info(`config hot reload applied (${plan.hotReasons.join(", ")})`);
		else if (plan.noopPaths.length > 0) params.logReload.info(`config change applied (dynamic reads: ${plan.noopPaths.join(", ")})`);
	};
	let restartPending = false;
	let restartRetryStopped = false;
	let restartRetryTimer = null;
	let restartDeferral = null;
	let restartRequestGeneration = 0;
	let restartRequestTransaction = null;
	let restartEmissionSettled = false;
	let restartRequestDetails = null;
	let pausedRestartDebt = null;
	let conservativeRestartDebt = null;
	let latestAcceptedRestartTarget = null;
	let acceptedRestartTargetGeneration = 0;
	let configCandidatePending = false;
	const recordAcceptedRestartTarget = (target) => {
		const generation = ++acceptedRestartTargetGeneration;
		const acceptedTarget = {
			...target,
			prepareRuntimeConfig: async () => {
				if (configCandidatePending || generation !== acceptedRestartTargetGeneration || latestAcceptedRestartTarget !== acceptedTarget) throw new GatewayConfigReloadSupersededError();
				const prepared = await target.prepareRuntimeConfig();
				if (configCandidatePending || generation !== acceptedRestartTargetGeneration || latestAcceptedRestartTarget !== acceptedTarget) throw new GatewayConfigReloadSupersededError();
				return prepared;
			}
		};
		latestAcceptedRestartTarget = acceptedTarget;
		configCandidatePending = false;
		return { reject: () => {
			if (latestAcceptedRestartTarget !== acceptedTarget) return;
			acceptedRestartTargetGeneration += 1;
			latestAcceptedRestartTarget = null;
			configCandidatePending = true;
		} };
	};
	const createRestartRequestDetails = (plan, nextConfig, options) => {
		const explicitRestartPaths = plan.restartReasons.filter((path) => plan.changedPaths.includes(path));
		return {
			plan,
			nextConfig: options?.debtConfig ?? nextConfig,
			restartOwnedPaths: explicitRestartPaths.length > 0 ? explicitRestartPaths : [...plan.changedPaths],
			retainDebtAcrossConfigChanges: options?.retainDebtAcrossConfigChanges === true
		};
	};
	const deferGatewayRestartDebt = (plan, nextConfig, options) => {
		const details = createRestartRequestDetails(plan, nextConfig, options);
		if (details.retainDebtAcrossConfigChanges) conservativeRestartDebt = details;
		else pausedRestartDebt = details;
	};
	const preserveRestartDebt = (details) => {
		if (details.retainDebtAcrossConfigChanges) conservativeRestartDebt = details;
		else pausedRestartDebt = details;
	};
	const takeConservativeRestartDebt = () => {
		const debt = conservativeRestartDebt;
		conservativeRestartDebt = null;
		return debt;
	};
	const restoreConservativeRestartDebt = (debt) => {
		conservativeRestartDebt ??= debt;
	};
	const publishAcceptedRestartTarget = (target) => ({
		ownership: recordAcceptedRestartTarget(target),
		conservativeDebt: takeConservativeRestartDebt()
	});
	const markRestartEmissionSettled = () => {
		restartEmissionSettled = true;
		conservativeRestartDebt = null;
	};
	const isCurrentRestartRetry = (retry) => !restartRetryStopped && retry.requestGeneration === restartRequestGeneration && myGeneration === currentReloadGeneration;
	const supersedeRestartRequest = () => {
		restartRequestGeneration += 1;
		restartPending = false;
		restartDeferral?.cancel();
		restartDeferral = null;
		if (restartRetryTimer) {
			clearTimeout(restartRetryTimer);
			restartRetryTimer = null;
		}
		restartRequestTransaction = null;
		restartRequestDetails = null;
		restartEmissionSettled = false;
	};
	const stopRestartRetries = () => {
		restartRetryStopped = true;
		pausedRestartDebt = null;
		conservativeRestartDebt = null;
		supersedeRestartRequest();
	};
	const appliedConfigHashPublisher = createAppliedConfigHashPublisher({
		hasPendingRestart: () => restartRequestDetails !== null || pausedRestartDebt !== null || conservativeRestartDebt !== null,
		publish: require_runtime_snapshot.setRuntimeConfigAppliedHash
	});
	const scheduleRestartEmissionRetry = (retry) => {
		if (restartRetryTimer || !isCurrentRestartRetry(retry)) return;
		restartPending = true;
		restartRetryTimer = setTimeout(() => {
			restartRetryTimer = null;
			if (!isCurrentRestartRetry(retry)) return;
			require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(async () => {
				if (!isCurrentRestartRetry(retry)) return;
				restartPending = false;
				if (retry.prepareForEmit && !await retry.prepareForEmit()) {
					scheduleRestartEmissionRetry(retry);
					return;
				}
				const emitResult = params.requestRecoveryRestart?.(retry.reason, retry.intent);
				if (emitResult && emitResult.status !== "failed") markRestartEmissionSettled();
				if (!emitResult || emitResult.status === "failed") scheduleRestartEmissionRetry(retry);
			}).catch((err) => {
				if (isCurrentRestartRetry(retry)) params.logReload.warn(`gateway restart recovery retry stopped: ${String(err)}`);
			});
		}, RESTART_EMISSION_RETRY_MS);
		restartRetryTimer.unref?.();
	};
	const acceptRestartConfig = (acceptedConfig) => {
		if (restartRequestTransaction?.state !== "rejected") return { retireRejectedRestart: false };
		const rejectedDebt = !restartEmissionSettled ? restartRequestDetails : null;
		if (rejectedDebt) preserveRestartDebt(rejectedDebt);
		supersedeRestartRequest();
		const configDebt = pausedRestartDebt;
		const retainsConfigDebt = configDebt && acceptedConfig && configDebt.restartOwnedPaths.every((path) => (0, node_util.isDeepStrictEqual)(require_config_paths.getConfigValueAtPath(configDebt.nextConfig, path.split(".")), require_config_paths.getConfigValueAtPath(acceptedConfig, path.split("."))));
		if (!retainsConfigDebt) pausedRestartDebt = null;
		const debt = (retainsConfigDebt ? configDebt : null) ?? conservativeRestartDebt;
		if (debt) return {
			retireRejectedRestart: false,
			debt
		};
		return { retireRejectedRestart: true };
	};
	const retireRejectedRestartRequest = () => acceptRestartConfig().retireRejectedRestart;
	const beginGatewayRestartLifecycle = () => {
		if (!restartEmissionSettled && restartRequestTransaction?.state !== "pending" && restartRequestDetails) preserveRestartDebt(restartRequestDetails);
		supersedeRestartRequest();
		const transaction = { state: "pending" };
		restartRequestTransaction = transaction;
		return { settle: (state) => {
			if (transaction.state === "pending") {
				transaction.state = state;
				if (state === "committed") pausedRestartDebt = null;
			}
		} };
	};
	const pauseGatewayRestartForConfigCandidate = () => {
		configCandidatePending = true;
		beginGatewayRestartLifecycle().settle("rejected");
	};
	const requestGatewayRestartForGeneration = (plan, nextConfig, requestGeneration, options) => {
		const reasons = plan.restartReasons.length ? plan.restartReasons.join(", ") : plan.changedPaths.join(", ");
		const restartReason = `config reload: ${reasons}`;
		if (!restartRecoveryAvailable) {
			params.logReload.warn("gateway restart recovery unavailable; restart-required reload rejected");
			return false;
		}
		if (!params.requestRecoveryRestart) {
			params.logReload.warn("gateway restart recovery handler unavailable; restart skipped");
			return false;
		}
		const requestRecoveryRestart = params.requestRecoveryRestart;
		let emissionPrepared = true;
		const prepareForEmit = async () => {
			try {
				const preparedConfig = options?.prepareRuntimeConfig ? await options.prepareRuntimeConfig() : nextConfig;
				if (requestGeneration !== restartRequestGeneration) return false;
				emissionPrepared = true;
				require_restart.setGatewaySigusr1RestartPolicy({ allowExternal: require_commands_flags.isRestartEnabled(preparedConfig) });
				return requestGeneration === restartRequestGeneration;
			} catch (err) {
				emissionPrepared = false;
				params.logReload.warn(`gateway restart secrets preflight failed: ${String(err)}`);
				return false;
			}
		};
		const active = getActiveCounts();
		if (active.totalActive > 0 || options?.prepareRuntimeConfig) {
			if (restartPending) {
				params.logReload.info(`config change requires gateway restart (${reasons}) — already waiting for operations to complete`);
				return true;
			}
			restartPending = true;
			if (active.totalActive > 0) {
				const initialDetails = formatActiveDetails(active);
				params.logReload.warn(`config change requires gateway restart (${reasons}) — deferring until ${initialDetails.join(", ")} complete`);
				const taskBlockers = formatTaskBlockers();
				if (taskBlockers) params.logReload.warn(`restart blocked by active background task run(s): ${taskBlockers}`);
			} else params.logReload.warn(`config change requires gateway restart (${reasons}) — preparing`);
			let failedEmission;
			restartDeferral = require_restart.deferGatewayRestartUntilIdle({
				getPendingCount: () => getActiveCounts().totalActive,
				maxWaitMs: require_restart.resolveGatewayRestartDeferralTimeoutMs(nextConfig.gateway?.reload?.deferralTimeoutMs),
				timeoutIntent: {
					force: true,
					reason: "config reload forced restart"
				},
				reason: restartReason,
				emitHooks: {
					beforeEmit: async () => {
						emissionPrepared = await prepareForEmit();
					},
					emitRestart: (reason, intent) => {
						if (requestGeneration !== restartRequestGeneration) return { status: "coalesced" };
						const resolvedReason = reason ?? restartReason;
						if (!emissionPrepared) {
							failedEmission = {
								reason: resolvedReason,
								intent
							};
							return { status: "failed" };
						}
						const emitResult = requestRecoveryRestart(resolvedReason, intent);
						if (emitResult.status !== "failed") markRestartEmissionSettled();
						failedEmission = emitResult.status === "failed" ? {
							reason: resolvedReason,
							intent
						} : void 0;
						return emitResult;
					},
					afterEmitFailed: async () => {
						if (requestGeneration !== restartRequestGeneration || !failedEmission) return;
						if (!restartRecoveryAvailable) {
							params.logReload.warn("gateway restart recovery unavailable; retry skipped");
							return;
						}
						params.logReload.warn("gateway restart recovery emission failed; retrying");
						scheduleRestartEmissionRetry({
							...failedEmission,
							requestGeneration,
							prepareForEmit
						});
					}
				},
				hooks: {
					onReady: () => {
						restartPending = false;
						restartDeferral = null;
						params.logReload.info("all operations and replies completed; restarting gateway now");
					},
					onStillPending: (_pending, elapsedMs) => {
						const remaining = formatActiveDetails(getActiveCounts());
						const taskBlockersValue = formatTaskBlockers();
						params.logReload.warn(`restart still deferred after ${elapsedMs}ms with ${remaining.join(", ")} active${taskBlockersValue ? ` (${taskBlockersValue})` : ""}`);
					},
					onTimeout: (_pending, elapsedMs) => {
						const remaining = formatActiveDetails(getActiveCounts());
						const taskBlockersLocal = formatTaskBlockers();
						restartPending = false;
						restartDeferral = null;
						params.logReload.warn(`restart timeout after ${elapsedMs}ms with ${remaining.join(", ")} still active${taskBlockersLocal ? ` (${taskBlockersLocal})` : ""}; forcing restart`);
					},
					onCheckError: (err) => {
						restartPending = false;
						restartDeferral = null;
						params.logReload.warn(`restart deferral check failed (${String(err)}); restarting gateway now`);
					}
				}
			});
			require_restart.setGatewaySigusr1RestartPolicy({ allowExternal: require_commands_flags.isRestartEnabled(nextConfig) });
			return true;
		}
		params.logReload.warn(`config change requires gateway restart (${reasons})`);
		const emitResult = requestRecoveryRestart(restartReason);
		if (emitResult.status !== "failed") markRestartEmissionSettled();
		if (emitResult.status === "failed") {
			params.logReload.warn("gateway restart recovery emission failed");
			if (restartRecoveryAvailable) scheduleRestartEmissionRetry({
				reason: restartReason,
				requestGeneration,
				prepareForEmit
			});
			return false;
		}
		if (emitResult.status === "coalesced") params.logReload.info("gateway restart already scheduled; skipping duplicate signal");
		require_restart.setGatewaySigusr1RestartPolicy({ allowExternal: require_commands_flags.isRestartEnabled(nextConfig) });
		return true;
	};
	const requestGatewayRestart = (plan, nextConfig, options) => {
		if (restartRetryStopped) return {
			status: "recovery-pending",
			settle: () => {}
		};
		supersedeRestartRequest();
		const transaction = { state: "pending" };
		restartRequestTransaction = transaction;
		restartEmissionSettled = false;
		restartRequestDetails = createRestartRequestDetails(plan, nextConfig, options);
		return {
			status: requestGatewayRestartForGeneration(plan, nextConfig, restartRequestGeneration, options) ? "accepted" : "recovery-pending",
			settle: (state) => {
				if (transaction.state === "pending") transaction.state = state;
			}
		};
	};
	return {
		applyHotReload,
		acceptRestartConfig,
		...appliedConfigHashPublisher,
		beginGatewayRestartLifecycle,
		pauseGatewayRestartForConfigCandidate,
		publishAcceptedRestartTarget,
		recordAcceptedRestartTarget,
		requestGatewayRestart,
		restoreConservativeRestartDebt,
		retireRejectedRestartRequest,
		stopRestartRetries
	};
}
function startManagedGatewayConfigReloader(params) {
	if (params.minimalTestGateway) return { stop: async () => {} };
	const prepareRuntimeCandidate = (runtimeConfig, sourceConfig, ownership) => {
		const canonicalConfig = restoreCanonicalSecretRefs(runtimeConfig, sourceConfig);
		const candidateConfig = ownership?.reapplyRuntimeOverlays(canonicalConfig) ?? canonicalConfig;
		return params.applyRuntimeConfigOverrides?.(candidateConfig) ?? candidateConfig;
	};
	const applyRuntimeConfigOverrides = (config) => params.applyRuntimeConfigOverrides?.(config) ?? config;
	const restartRecoveryAvailable = params.restartRecoveryAvailable !== false && params.requestRecoveryRestart !== void 0;
	let stopped = false;
	let activeGmailRestartAbortController = null;
	const abortActiveGmailRestart = () => {
		activeGmailRestartAbortController?.abort();
		activeGmailRestartAbortController = null;
	};
	const createGmailRestartAbortController = () => {
		abortActiveGmailRestart();
		const abortController = new AbortController();
		if (stopped) {
			abortController.abort();
			return abortController;
		}
		activeGmailRestartAbortController = abortController;
		return abortController;
	};
	const { applyHotReload, acceptRestartConfig, beginGatewayRestartLifecycle, pauseGatewayRestartForConfigCandidate, publishAppliedConfigHash, publishAcceptedRestartTarget, publishDeferredAppliedConfigHash, recordAcceptedRestartTarget, requestGatewayRestart, restoreConservativeRestartDebt, stopRestartRetries } = createGatewayReloadHandlers({
		deps: params.deps,
		broadcast: params.broadcast,
		getState: params.getState,
		setState: params.setState,
		startChannel: params.startChannel,
		stopChannel: params.stopChannel,
		getChannelAutostartSuppression: params.getChannelAutostartSuppression,
		stopPostReadySidecars: params.stopPostReadySidecars,
		reloadPlugins: params.reloadPlugins,
		logHooks: params.logHooks,
		logChannels: params.logChannels,
		logCron: params.logCron,
		logReload: params.logReload,
		cronReconciliation: params.cronReconciliation,
		createGmailRestartAbortController,
		clearGmailRestartAbortController: (abortController) => {
			if (activeGmailRestartAbortController === abortController) activeGmailRestartAbortController = null;
		},
		...params.onCronRestart ? { onCronRestart: params.onCronRestart } : {},
		...params.requestRecoveryRestart ? { requestRecoveryRestart: params.requestRecoveryRestart } : {},
		restartRecoveryAvailable,
		createHealthMonitor: (config) => require_server_runtime_startup_services.startGatewayChannelHealthMonitor({
			cfg: config,
			channelManager: params.channelManager
		})
	});
	const runManagedRestart = async (plan, nextConfig, transactionOwnership, sourceConfig, restartOptions, beforeRestartRequest) => {
		const isCurrent = () => !stopped && transactionOwnership.isCurrent();
		const assertCurrent = () => {
			if (!isCurrent()) throw new GatewayConfigReloadSupersededError();
		};
		assertCurrent();
		const restartLifecycle = beginGatewayRestartLifecycle();
		let preparation;
		try {
			for (;;) {
				assertCurrent();
				const previousSnapshotRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
				const ownership = require_server_shared_auth_generation.captureSharedGatewaySessionGenerationOwnership(params.sharedGatewaySessionGenerationState);
				const previousRequired = params.sharedGatewaySessionGenerationState.required;
				const prepared = await params.activateRuntimeSecrets(prepareRuntimeCandidate(nextConfig, sourceConfig, transactionOwnership), {
					reason: "restart-check",
					activate: false,
					...transactionOwnership.runtimeEnv ? { env: transactionOwnership.runtimeEnv.env } : {}
				});
				assertCurrent();
				const snapshotChanged = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision() !== previousSnapshotRevision;
				const generationChanged = !require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, ownership);
				if (snapshotChanged || generationChanged) continue;
				preparation = {
					ownership,
					previousRequired,
					previousCurrent: ownership.generation,
					nextGeneration: params.resolveSharedGatewaySessionGenerationForConfig(prepared.config),
					runtimeConfig: prepared.config
				};
				break;
			}
		} catch (error) {
			restartLifecycle.settle("rejected");
			throw error;
		}
		const { ownership: preparationOwnership, previousRequired: previousRequiredSharedGatewaySessionGeneration, previousCurrent: previousSharedGatewaySessionGeneration, nextGeneration: nextSharedGatewaySessionGeneration, runtimeConfig: preparedRuntimeConfig } = preparation;
		let restartTransaction;
		let requiredOwnership = null;
		try {
			assertCurrent();
			params.reconcileTerminalSessions(plan, preparedRuntimeConfig);
			assertCurrent();
			await beforeRestartRequest?.();
			assertCurrent();
			requiredOwnership = require_server_shared_auth_generation.setRequiredSharedGatewaySessionGenerationIfOwned(params.sharedGatewaySessionGenerationState, preparationOwnership, previousSharedGatewaySessionGeneration !== nextSharedGatewaySessionGeneration ? nextSharedGatewaySessionGeneration : null);
			if (!requiredOwnership) throw new GatewayHotReloadStaleSecretsError();
			transactionOwnership.publishRuntimeEnv();
			restartTransaction = requestGatewayRestart(plan, preparedRuntimeConfig, {
				...restartOptions,
				debtConfig: sourceConfig,
				prepareRuntimeConfig: async () => {
					const prepared = await params.activateRuntimeSecrets(prepareRuntimeCandidate(preparedRuntimeConfig, sourceConfig, transactionOwnership), {
						reason: "restart-check",
						activate: false,
						...transactionOwnership.runtimeEnv ? { env: transactionOwnership.runtimeEnv.env } : {}
					});
					assertCurrent();
					return prepared.config;
				}
			});
			if (restartTransaction.status === "recovery-pending") throw new GatewayHotReloadRecoveryError("config restart");
			if (previousSharedGatewaySessionGeneration !== nextSharedGatewaySessionGeneration) require_server_shared_auth_generation.disconnectStaleSharedGatewayAuthClients({
				clients: params.clients,
				expectedGeneration: nextSharedGatewaySessionGeneration
			});
			restartTransaction.settle("committed");
			transactionOwnership.commitRuntimeEnv();
			restartLifecycle.settle("committed");
		} catch (error) {
			restartTransaction?.settle("rejected");
			restartLifecycle.settle("rejected");
			transactionOwnership.rollbackRuntimeEnv();
			if (requiredOwnership) require_server_shared_auth_generation.setRequiredSharedGatewaySessionGenerationIfOwned(params.sharedGatewaySessionGenerationState, requiredOwnership, previousRequiredSharedGatewaySessionGeneration);
			throw error;
		}
	};
	const configReloader = startGatewayConfigReloader({
		initialConfig: params.initialConfig,
		initialCompareConfig: params.initialCompareConfig,
		...params.prepareConfigCandidate ? { prepareConfigCandidate: params.prepareConfigCandidate } : {},
		initialInternalWriteHash: params.initialInternalWriteHash,
		runTransaction: require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission,
		readSnapshot: params.readSnapshot,
		promoteSnapshot: async (snapshot, _reason) => await params.promoteSnapshot(snapshot),
		subscribeToWrites: params.subscribeToWrites,
		onConfigCandidateObserved: pauseGatewayRestartForConfigCandidate,
		onConfigChange: (plan, nextConfig) => {
			assertIrreversibleReloadPlanHasRecoveryOwner(plan, restartRecoveryAvailable);
			params.prepareTerminalConfig(plan, applyRuntimeConfigOverrides(nextConfig));
		},
		onConfigAccepted: async (nextConfig, transactionOwnership, sourceConfig, acceptance) => {
			const assertCurrent = () => {
				if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
			};
			const createRestartTarget = () => ({
				runtimeConfig: prepareRuntimeCandidate(nextConfig, sourceConfig, transactionOwnership),
				sourceConfig,
				prepareRuntimeConfig: async () => {
					return (await params.activateRuntimeSecrets(prepareRuntimeCandidate(nextConfig, sourceConfig, transactionOwnership), {
						reason: "restart-check",
						activate: false,
						...transactionOwnership.runtimeEnv ? { env: transactionOwnership.runtimeEnv.env } : {}
					})).config;
				}
			});
			let rollbackSource;
			let acceptedTargetOwnership;
			let lateConservativeDebt = null;
			try {
				assertCurrent();
				const acceptedRestart = acceptRestartConfig(sourceConfig);
				if (!acceptance.runtimeApplied) {
					assertCurrent();
					recordAcceptedRestartTarget(createRestartTarget());
					params.acceptTerminalConfig({ retireRejectedRestart: acceptedRestart.retireRejectedRestart });
					publishDeferredAppliedConfigHash();
					return;
				}
				if (acceptedRestart.debt) await runManagedRestart(acceptedRestart.debt.plan, nextConfig, transactionOwnership, sourceConfig, { retainDebtAcrossConfigChanges: acceptedRestart.debt.retainDebtAcrossConfigChanges }, async () => {
					rollbackSource = await acceptance.publishSource?.();
				});
				else rollbackSource = await acceptance.publishSource?.();
				assertCurrent();
				const acceptedTarget = publishAcceptedRestartTarget(createRestartTarget());
				acceptedTargetOwnership = acceptedTarget.ownership;
				lateConservativeDebt = acceptedTarget.conservativeDebt;
				if (lateConservativeDebt && lateConservativeDebt !== acceptedRestart.debt) await runManagedRestart(lateConservativeDebt.plan, nextConfig, transactionOwnership, sourceConfig, { retainDebtAcrossConfigChanges: lateConservativeDebt.retainDebtAcrossConfigChanges });
				assertCurrent();
				params.acceptTerminalConfig({ retireRejectedRestart: acceptedRestart.retireRejectedRestart && !lateConservativeDebt });
				publishDeferredAppliedConfigHash();
				return rollbackSource;
			} catch (error) {
				if (lateConservativeDebt) restoreConservativeRestartDebt(lateConservativeDebt);
				acceptedTargetOwnership?.reject();
				await rollbackSource?.();
				throw error;
			}
		},
		onConfigApplied: (_plan, nextConfig) => params.commitTerminalConfig(nextConfig),
		onConfigRevisionApplied: publishAppliedConfigHash,
		onEffectiveConfigUnchanged: async (nextConfig, transactionOwnership, sourceConfig) => {
			if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
			const metadata = require_runtime_snapshot.getRuntimeConfigSnapshotMetadata();
			const previousRuntimeSourceConfig = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
			const previousSecretsSourceConfig = require_runtime_state.getActiveSecretsRuntimeSnapshot()?.sourceConfig;
			const previousSecretsRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
			if (!metadata || !previousRuntimeSourceConfig || !require_runtime_state.setSecretsRuntimeSourceSnapshotIfCurrent({
				expectedSecretsRevision: previousSecretsRevision,
				expectedRuntimeConfigRevision: metadata.revision,
				runtimeSourceConfig: sourceConfig,
				secretsSourceConfig: prepareRuntimeCandidate(nextConfig, sourceConfig, transactionOwnership)
			}) || !transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
			const committedMetadata = require_runtime_snapshot.getRuntimeConfigSnapshotMetadata();
			const committedSecretsRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
			return async () => {
				if (!committedMetadata || !require_runtime_state.setSecretsRuntimeSourceSnapshotIfCurrent({
					expectedSecretsRevision: committedSecretsRevision,
					expectedRuntimeConfigRevision: committedMetadata.revision,
					runtimeSourceConfig: previousRuntimeSourceConfig,
					secretsSourceConfig: previousSecretsSourceConfig ?? previousRuntimeSourceConfig
				})) throw new GatewayConfigReloadSupersededError();
			};
		},
		onNoopConfigCommit: async (plan, nextConfig, transactionOwnership, sourceConfig) => {
			for (;;) {
				if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
				const previousSnapshotRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
				const prepared = await params.activateRuntimeSecrets(prepareRuntimeCandidate(nextConfig, sourceConfig, transactionOwnership), {
					reason: "reload",
					activate: false,
					...transactionOwnership.runtimeEnv ? { env: transactionOwnership.runtimeEnv.env } : {},
					includeAuthStoreRefs: transactionOwnership.runtimeRefresh?.includeAuthStoreRefs
				});
				if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
				const activateIfCurrent = params.activateRuntimeSecrets.activatePreparedSnapshotIfCurrent;
				const publishTerminalConfig = () => {
					transactionOwnership.publishRuntimeEnv();
					transactionOwnership.markRuntimeCommitted(prepared.config, plan);
					params.reconcileTerminalSessions(plan, prepared.config);
				};
				if (activateIfCurrent ? await activateIfCurrent(prepared, previousSnapshotRevision, {
					reason: "reload",
					activate: true
				}, publishTerminalConfig, transactionOwnership.isCurrent) : await activateSecretsRuntimeSnapshotIfCurrent(prepared, previousSnapshotRevision, {
					canActivate: transactionOwnership.isCurrent,
					onActivated: publishTerminalConfig
				}) ? prepared : null) return;
			}
		},
		onHotReload: async (plan, nextConfig, transactionOwnership, sourceConfig) => {
			for (;;) {
				if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
				const previousSnapshot = require_runtime_state.getActiveSecretsRuntimeSnapshot();
				const previousSnapshotRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
				const previousGenerationOwnership = require_server_shared_auth_generation.captureSharedGatewaySessionGenerationOwnership(params.sharedGatewaySessionGenerationState);
				const previousSharedGatewaySessionGeneration = previousGenerationOwnership.generation;
				const prepared = await params.activateRuntimeSecrets(prepareRuntimeCandidate(nextConfig, sourceConfig, transactionOwnership), {
					reason: "reload",
					activate: false,
					...transactionOwnership.runtimeEnv ? { env: transactionOwnership.runtimeEnv.env } : {},
					includeAuthStoreRefs: transactionOwnership.runtimeRefresh?.includeAuthStoreRefs
				});
				if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
				if (require_runtime_state.getActiveSecretsRuntimeSnapshotRevision() !== previousSnapshotRevision) continue;
				const nextSharedGatewaySessionGeneration = params.resolveSharedGatewaySessionGenerationForConfig(prepared.config);
				const sharedGatewaySessionGenerationChanged = previousSharedGatewaySessionGeneration !== nextSharedGatewaySessionGeneration;
				let runtimeSecretsPublished = false;
				let runtimeCommitted = false;
				let publishedSnapshotRevision = null;
				let publishedSharedGatewaySessionGeneration = null;
				let terminalConfigReconciled = false;
				try {
					await applyHotReload(plan, prepared.config, {
						isCurrent: transactionOwnership.isCurrent,
						...transactionOwnership.runtimeEnv ? { runtimeEnv: transactionOwnership.runtimeEnv.env } : {},
						sourceConfig,
						prepareRestartRuntimeConfig: async () => {
							const restartPrepared = await params.activateRuntimeSecrets(prepareRuntimeCandidate(prepared.config, sourceConfig, transactionOwnership), {
								reason: "restart-check",
								activate: false,
								...transactionOwnership.runtimeEnv ? { env: transactionOwnership.runtimeEnv.env } : {}
							});
							if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
							return restartPrepared.config;
						},
						publish: async (commit, isCommitted) => {
							const claimGenerationOwnership = () => {
								publishedSharedGatewaySessionGeneration ??= require_server_shared_auth_generation.claimSharedGatewaySessionGenerationIfOwned(params.sharedGatewaySessionGenerationState, previousGenerationOwnership, nextSharedGatewaySessionGeneration);
								if (!publishedSharedGatewaySessionGeneration) throw new GatewayHotReloadStaleSecretsError();
							};
							const publishRuntime = async () => {
								runtimeSecretsPublished = true;
								publishedSnapshotRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
								claimGenerationOwnership();
								try {
									transactionOwnership.publishRuntimeEnv();
									await commit();
									if (!terminalConfigReconciled) {
										params.reconcileTerminalSessions(plan, prepared.config);
										terminalConfigReconciled = true;
									}
									if (sharedGatewaySessionGenerationChanged) require_server_shared_auth_generation.disconnectStaleSharedGatewayAuthClients({
										clients: params.clients,
										expectedGeneration: nextSharedGatewaySessionGeneration
									});
								} catch (err) {
									if (!isCommitted()) {
										let generationRestored = false;
										let snapshotRestored = false;
										const generationOwnership = publishedSharedGatewaySessionGeneration;
										if (previousSnapshot && generationOwnership) snapshotRestored = await restoreSecretsRuntimeSnapshotIfCurrent(previousSnapshot, publishedSnapshotRevision ?? -1, prepared, { onActivated: () => {
											generationRestored = require_server_shared_auth_generation.restoreOwnedCurrentSharedGatewaySessionGeneration(params.sharedGatewaySessionGenerationState, generationOwnership, previousSharedGatewaySessionGeneration);
										} });
										else if (publishedSnapshotRevision !== null && require_runtime_state.getActiveSecretsRuntimeSnapshotRevision() === publishedSnapshotRevision) {
											require_runtime_state.clearSecretsRuntimeSnapshot();
											snapshotRestored = true;
											if (generationOwnership) generationRestored = require_server_shared_auth_generation.restoreOwnedCurrentSharedGatewaySessionGeneration(params.sharedGatewaySessionGenerationState, generationOwnership, previousSharedGatewaySessionGeneration);
										}
										if (snapshotRestored) {
											if (previousSnapshot && shouldRefreshContextWindowCache(plan)) await require_context.refreshContextWindowCache(previousSnapshot.config);
											runtimeSecretsPublished = false;
										}
										if (generationRestored && sharedGatewaySessionGenerationChanged) require_server_shared_auth_generation.disconnectStaleSharedGatewayAuthClients({
											clients: params.clients,
											expectedGeneration: previousSharedGatewaySessionGeneration
										});
									}
									throw err;
								} finally {
									if (isCommitted()) {
										runtimeCommitted = true;
										transactionOwnership.markRuntimeCommitted(prepared.config, plan);
									}
								}
							};
							const activateIfCurrent = params.activateRuntimeSecrets.activatePreparedSnapshotIfCurrent;
							if (activateIfCurrent) {
								if (!await activateIfCurrent(prepared, previousSnapshotRevision, {
									reason: "reload",
									activate: true
								}, publishRuntime, () => transactionOwnership.isCurrent() && require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, previousGenerationOwnership))) throw new GatewayHotReloadStaleSecretsError();
							} else {
								if (!await activateSecretsRuntimeSnapshotIfCurrent(prepared, previousSnapshotRevision, {
									canActivate: () => transactionOwnership.isCurrent() && require_server_shared_auth_generation.isSharedGatewaySessionGenerationOwnershipCurrent(params.sharedGatewaySessionGenerationState, previousGenerationOwnership),
									onActivated: claimGenerationOwnership
								})) throw new GatewayHotReloadStaleSecretsError();
								await publishRuntime();
							}
						}
					});
				} catch (err) {
					if (err instanceof GatewayHotReloadStaleSecretsError) {
						if (!transactionOwnership.isCurrent()) throw new GatewayConfigReloadSupersededError();
						continue;
					}
					if (err instanceof GatewayHotReloadRecoveryError) throw err;
					if (runtimeCommitted) throw err;
					if (runtimeSecretsPublished) {
						let generationRestored = false;
						let snapshotRestored = false;
						const generationOwnership = publishedSharedGatewaySessionGeneration;
						if (previousSnapshot && publishedSnapshotRevision !== null && generationOwnership) snapshotRestored = await restoreSecretsRuntimeSnapshotIfCurrent(previousSnapshot, publishedSnapshotRevision, prepared, { onActivated: () => {
							generationRestored = require_server_shared_auth_generation.restoreOwnedCurrentSharedGatewaySessionGeneration(params.sharedGatewaySessionGenerationState, generationOwnership, previousSharedGatewaySessionGeneration);
						} });
						else if (publishedSnapshotRevision !== null && generationOwnership && require_runtime_state.getActiveSecretsRuntimeSnapshotRevision() === publishedSnapshotRevision) {
							require_runtime_state.clearSecretsRuntimeSnapshot();
							snapshotRestored = true;
							generationRestored = require_server_shared_auth_generation.restoreOwnedCurrentSharedGatewaySessionGeneration(params.sharedGatewaySessionGenerationState, generationOwnership, previousSharedGatewaySessionGeneration);
						}
						if (snapshotRestored) {
							if (previousSnapshot && shouldRefreshContextWindowCache(plan)) await require_context.refreshContextWindowCache(previousSnapshot.config);
						}
						if (generationRestored && sharedGatewaySessionGenerationChanged) require_server_shared_auth_generation.disconnectStaleSharedGatewayAuthClients({
							clients: params.clients,
							expectedGeneration: previousSharedGatewaySessionGeneration
						});
					}
					throw err;
				}
				if (publishedSharedGatewaySessionGeneration) require_server_shared_auth_generation.finalizeOwnedSharedGatewaySessionGeneration(params.sharedGatewaySessionGenerationState, publishedSharedGatewaySessionGeneration);
				return;
			}
		},
		onRestart: runManagedRestart,
		log: {
			info: (msg) => params.logReload.info(msg),
			warn: (msg) => params.logReload.warn(msg),
			error: (msg) => params.logReload.error(msg)
		},
		watchPath: params.watchPath
	});
	return {
		stop: async () => {
			stopped = true;
			stopRestartRetries();
			abortPendingChannelReloads();
			abortActiveGmailRestart();
			await configReloader.stop();
		},
		hotReloadStatus: configReloader.hotReloadStatus
	};
}
//#endregion
exports.abortPendingChannelReloads = abortPendingChannelReloads;
exports.startManagedGatewayConfigReloader = startManagedGatewayConfigReloader;
