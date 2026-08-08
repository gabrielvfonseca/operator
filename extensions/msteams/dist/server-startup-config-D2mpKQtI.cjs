require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_runtime_gateway_auth_surfaces = require("./runtime-gateway-auth-surfaces-Y3SuOzZh.cjs");
require("./auth-DnGY7_cY.cjs");
const require_config_recovery_hints = require("./config-recovery-hints-A_lub-Kc.cjs");
const require_runtime_fast_path = require("./runtime-fast-path-CWKcJ0kW.cjs");
const require_startup_auth = require("./startup-auth-DX_Fnujt.cjs");
let node_util = require("node:util");
//#region src/gateway/server-startup-secret-surfaces.ts
/**
* Keeps the recoverable source config separate from the SecretRef assignment
* surface that is safe to resolve during crash-loop recovery.
*/
function resolveGatewayStartupSecretProjection(params) {
	const sourceConfig = resolveGatewayStartupSourceConfig(params.config, params.env ?? process.env);
	if (params.reason !== "startup" || params.channelAutostartSuppression == null || !sourceConfig.channels) return { sourceConfig };
	return {
		sourceConfig,
		assignmentConfig: {
			...sourceConfig,
			channels: void 0
		}
	};
}
function resolveGatewayStartupSourceConfig(config, env) {
	if (!(require_env.isTruthyEnvValue(env.OPERATOR_SKIP_CHANNELS) || require_env.isTruthyEnvValue(env.OPERATOR_SKIP_PROVIDERS)) || !config.channels) return config;
	return {
		...config,
		channels: void 0
	};
}
//#endregion
//#region src/gateway/server-startup-config.ts
/** Timeline attributes kept small and deterministic for startup secret preparation spans. */
function secretsPrepareTimelineAttributes(config, activationParams) {
	return {
		activate: activationParams.activate,
		gatewayAuthSecretRef: hasActiveGatewayAuthSecretRef(config),
		reason: activationParams.reason
	};
}
/** Load and validate the config snapshot, applying runtime-only plugin auto-enable changes. */
async function loadGatewayStartupConfigSnapshot(params) {
	const measure = params.measure ?? (async (_name, run) => await run());
	const snapshotRead = params.initialSnapshotRead ?? await measure("config.snapshot.read", () => require_io.readConfigFileSnapshotWithPluginMetadata({ measure }));
	const configSnapshot = snapshotRead.snapshot;
	const pluginMetadataSnapshot = snapshotRead.pluginMetadataSnapshot;
	const wroteConfig = false;
	if (configSnapshot.legacyIssues.length > 0 && require_paths.isNixMode) throw require_io.createInvalidConfigError(configSnapshot.path, "Legacy config entries detected while running in Nix mode. Update your Nix config to the latest schema and restart.");
	if (configSnapshot.exists) assertValidGatewayStartupConfigSnapshot(configSnapshot, { includeDoctorHint: true });
	const autoEnable = params.minimalTestGateway ? {
		config: configSnapshot.config,
		changes: []
	} : await measure("config.snapshot.auto-enable", () => require_plugin_auto_enable.applyPluginAutoEnable({
		config: configSnapshot.sourceConfig,
		env: process.env,
		...pluginMetadataSnapshot?.manifestRegistry ? { manifestRegistry: pluginMetadataSnapshot.manifestRegistry } : {},
		discovery: pluginMetadataSnapshot?.discovery
	}));
	if (autoEnable.changes.length === 0) return {
		snapshot: configSnapshot,
		wroteConfig,
		...pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {}
	};
	params.log.info(`gateway: auto-enabled plugins for this runtime without writing config:\n${autoEnable.changes.map((entry) => `- ${entry}`).join("\n")}`);
	return {
		snapshot: withRuntimeConfig(configSnapshot, autoEnable.config),
		wroteConfig,
		...pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {}
	};
}
function withRuntimeConfig(snapshot, runtimeConfig) {
	return {
		...snapshot,
		runtimeConfig,
		config: runtimeConfig
	};
}
/** Create the serialized secrets activation function used by startup and reload paths. */
function createRuntimeSecretsActivator(params) {
	let secretsDegraded = false;
	let secretsActivationTail = Promise.resolve();
	const loadSecretsRuntime = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./runtime-Cmn4mgbi.cjs")), { cacheRejections: true });
	const loadAuthProfiles = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./auth-profiles-DQeiAyJi.cjs")).then((n) => n.auth_profiles_exports), { cacheRejections: true });
	const startupManifestRegistry = params.manifestRegistry ?? params.pluginMetadataSnapshot?.manifestRegistry;
	const runWithSecretsActivationLock = async (operation) => {
		const run = secretsActivationTail.then(operation, operation);
		secretsActivationTail = run.then(() => void 0, () => void 0);
		return await run;
	};
	const loadActivateRuntimeSecretsSnapshot = async () => {
		if (params.activateRuntimeSecretsSnapshot) return params.activateRuntimeSecretsSnapshot;
		return (await loadSecretsRuntime()).activateSecretsRuntimeSnapshot;
	};
	const finishPreparedSnapshot = async (prepared, activationParams, options) => {
		assertRuntimeGatewayAuthNotKnownWeak(prepared.config);
		if (activationParams.activate) {
			(options?.activateRuntimeSecretsSnapshot ?? await loadActivateRuntimeSecretsSnapshot())(prepared);
			options?.onActivated?.();
			logGatewayAuthSurfaceDiagnostics(prepared, params.logSecrets);
		}
		for (const warning of prepared.warnings) params.logSecrets.warn(`[${warning.code}] ${warning.message}`);
		if (secretsDegraded) {
			const recoveredMessage = "Secret resolution recovered; runtime remained on last-known-good during the outage.";
			params.logSecrets.info(`[SECRETS_RELOADER_RECOVERED] ${recoveredMessage}`);
			params.emitStateEvent("SECRETS_RELOADER_RECOVERED", recoveredMessage, prepared.config);
		}
		secretsDegraded = false;
		return prepared;
	};
	const handleSecretsActivationError = (err, activationParams, eventConfig) => {
		const details = String(err);
		if (!secretsDegraded) {
			params.logSecrets.error?.(`[SECRETS_RELOADER_DEGRADED] ${details}`);
			if (activationParams.reason !== "startup") params.emitStateEvent("SECRETS_RELOADER_DEGRADED", `Secret resolution failed; runtime remains on last-known-good snapshot. ${details}`, eventConfig);
		} else params.logSecrets.warn(`[SECRETS_RELOADER_DEGRADED] ${details}`);
		secretsDegraded = true;
		if (activationParams.reason === "startup") throw new Error(`Startup failed: required secrets are unavailable. ${details}`, { cause: err });
		throw err;
	};
	const activateRuntimeSecrets = (async (config, activationParams) => await runWithSecretsActivationLock(async () => {
		try {
			const { sourceConfig, assignmentConfig } = resolveGatewayStartupSecretProjection({
				config,
				reason: activationParams.reason,
				channelAutostartSuppression: params.channelAutostartSuppression,
				...activationParams.env ? { env: activationParams.env } : {}
			});
			const startupPreflight = activationParams.reason === "startup" || activationParams.reason === "restart-check";
			if (activationParams.reason === "startup" && activationParams.activate && !params.prepareRuntimeSecretsSnapshot && !params.activateRuntimeSecretsSnapshot && assignmentConfig === void 0) {
				const fastPath = require_runtime_fast_path.prepareSecretsRuntimeFastPathSnapshot({
					config: sourceConfig,
					...startupManifestRegistry ? { manifestRegistry: startupManifestRegistry } : {}
				});
				if (fastPath) return await finishPreparedSnapshot(fastPath.snapshot, activationParams, { activateRuntimeSecretsSnapshot: (snapshot) => require_runtime_state.activateSecretsRuntimeSnapshotState({
					snapshot,
					refreshContext: fastPath.refreshContext,
					refreshHandler: {
						preflight: async (refreshParams) => await (await loadSecretsRuntime()).preflightActiveSecretsRuntimeSnapshotRefresh(refreshParams),
						refresh: async (refreshParams) => await (await loadSecretsRuntime()).refreshActiveSecretsRuntimeSnapshotForConfig(refreshParams)
					}
				}) });
			}
			const loadAuthStore = startupPreflight ? (await loadAuthProfiles()).loadAuthProfileStoreWithoutExternalProfiles : void 0;
			const secretsRuntime = params.prepareRuntimeSecretsSnapshot && params.activateRuntimeSecretsSnapshot ? null : await loadSecretsRuntime();
			const prepareRuntimeSecretsSnapshot = params.prepareRuntimeSecretsSnapshot ?? secretsRuntime.prepareSecretsRuntimeSnapshot;
			const prepared = await require_plugin_metadata_snapshot.measureDiagnosticsTimelineSpan("secrets.prepare", () => prepareRuntimeSecretsSnapshot({
				config: sourceConfig,
				...assignmentConfig !== void 0 ? { assignmentConfig } : {},
				...activationParams.env ? { env: activationParams.env } : {},
				includeAuthStoreRefs: activationParams.includeAuthStoreRefs,
				...startupManifestRegistry ? { manifestRegistry: startupManifestRegistry } : {},
				...params.pluginMetadataSnapshot ? { pluginMetadataSnapshot: params.pluginMetadataSnapshot } : {},
				...loadAuthStore ? { loadAuthStore } : {}
			}), {
				attributes: secretsPrepareTimelineAttributes(config, activationParams),
				config,
				env: activationParams.env ?? process.env,
				omitErrorMessage: true,
				phase: activationParams.reason
			});
			if (activationParams.includeAuthStoreRefs === false) require_runtime_state.graftActiveSecretsRuntimeAuthState(prepared);
			return await finishPreparedSnapshot(prepared, activationParams);
		} catch (err) {
			return handleSecretsActivationError(err, activationParams, config);
		}
	}));
	activateRuntimeSecrets.activatePreparedSnapshot = async (snapshot, activationParams) => await runWithSecretsActivationLock(async () => {
		try {
			return await finishPreparedSnapshot(snapshot, activationParams);
		} catch (err) {
			return handleSecretsActivationError(err, activationParams, snapshot.sourceConfig);
		}
	});
	activateRuntimeSecrets.activatePreparedSnapshotIfCurrent = async (snapshot, expectedRevision, activationParams, onActivated, canActivate) => {
		const activateRuntimeSecretsSnapshot = activationParams.activate ? await loadActivateRuntimeSecretsSnapshot() : void 0;
		return await runWithSecretsActivationLock(async () => {
			if (require_runtime_state.getActiveSecretsRuntimeSnapshotRevision() !== expectedRevision || !require_runtime_state.hasCurrentAuthStoreCredentialsRevision(snapshot) || canActivate && !canActivate()) return null;
			let activated;
			let publication;
			try {
				activated = await finishPreparedSnapshot(snapshot, activationParams, activateRuntimeSecretsSnapshot ? {
					activateRuntimeSecretsSnapshot,
					...onActivated ? { onActivated: () => {
						publication = Promise.resolve(onActivated());
					} } : {}
				} : void 0);
			} catch (err) {
				return handleSecretsActivationError(err, activationParams, snapshot.sourceConfig);
			}
			await publication;
			return activated;
		});
	};
	return activateRuntimeSecrets;
}
/** Throw a formatted startup error when the loaded config snapshot is invalid. */
function assertValidGatewayStartupConfigSnapshot(snapshot, options = {}) {
	if (snapshot.valid) return;
	const issues = snapshot.issues.length > 0 ? require_io.formatConfigIssueLines(snapshot.issues, "", { normalizeRoot: true }).join("\n") : "Unknown validation issue.";
	const recoveryHint = options.includeDoctorHint && require_io.isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot) ? `\n${require_config_recovery_hints.formatPluginPackagingRuntimeOutputRecoveryHint()}` : options.includeDoctorHint ? `\n${require_config_recovery_hints.formatInvalidConfigRecoveryHint()}` : "";
	throw require_io.createInvalidConfigError(snapshot.path, `${issues}${recoveryHint}`);
}
/** Prepare the effective Gateway startup config after auth, overrides, and secrets activation. */
async function prepareGatewayStartupConfig(params) {
	const measure = params.measure ?? (async (_name, run) => await run());
	await measure("config.auth.snapshot-validate", () => assertValidGatewayStartupConfigSnapshot(params.configSnapshot));
	const runtimeConfig = await measure("config.auth.runtime-overrides", () => require_io.applyConfigOverrides(params.configSnapshot.config));
	const startupPreflightConfig = await measure("config.auth.startup-overrides", () => applyGatewayAuthOverridesForStartupPreflight(runtimeConfig, {
		auth: params.authOverride,
		tailscale: params.tailscaleOverride
	}));
	const needsAuthSecretPreflight = await measure("config.auth.secret-surface", () => hasActiveGatewayAuthSecretRef(startupPreflightConfig));
	let preflightPrepared;
	const preflightConfig = await measure("config.auth.secret-preflight", async () => {
		if (!needsAuthSecretPreflight) return startupPreflightConfig;
		preflightPrepared = await params.activateRuntimeSecrets(startupPreflightConfig, {
			reason: "startup",
			activate: false
		});
		return preflightPrepared.config;
	}, { omitErrorMessage: true });
	const canReusePreflightPreparedSnapshot = (config) => Boolean(preflightPrepared && params.activateRuntimeSecrets.activatePreparedSnapshot && (0, node_util.isDeepStrictEqual)(resolveGatewayStartupSourceConfig(config, process.env), preflightPrepared.sourceConfig));
	const activateStartupSecrets = async (config) => {
		if (preflightPrepared && canReusePreflightPreparedSnapshot(config)) return await params.activateRuntimeSecrets.activatePreparedSnapshot(preflightPrepared, {
			reason: "startup",
			activate: true
		});
		return await params.activateRuntimeSecrets(config, {
			reason: "startup",
			activate: true
		});
	};
	const preflightAuthOverride = await measure("config.auth.preflight-override", () => typeof preflightConfig.gateway?.auth?.token === "string" || typeof preflightConfig.gateway?.auth?.password === "string" ? {
		...params.authOverride,
		...typeof preflightConfig.gateway?.auth?.token === "string" ? { token: preflightConfig.gateway.auth.token } : {},
		...typeof preflightConfig.gateway?.auth?.password === "string" ? { password: preflightConfig.gateway.auth.password } : {}
	} : params.authOverride);
	const authBootstrap = await measure("config.auth.ensure", () => require_startup_auth.ensureGatewayStartupAuth({
		cfg: runtimeConfig,
		env: process.env,
		authOverride: preflightAuthOverride,
		tailscaleOverride: params.tailscaleOverride,
		warn: params.log?.warn,
		persist: params.persistStartupAuth ?? false,
		baseHash: params.configSnapshot.hash
	}));
	const runtimeStartupConfig = await measure("config.auth.runtime-startup-overrides", () => applyGatewayAuthOverridesForStartupPreflight(authBootstrap.cfg, {
		auth: params.authOverride,
		tailscale: params.tailscaleOverride
	}));
	const activatedConfig = (await measure("config.auth.secrets-activate", () => activateStartupSecrets(runtimeStartupConfig), { omitErrorMessage: true })).config;
	return {
		...authBootstrap,
		cfg: activatedConfig
	};
}
function hasActiveGatewayAuthSecretRef(config) {
	const states = require_runtime_gateway_auth_surfaces.evaluateGatewayAuthSurfaceStates({
		config,
		defaults: config.secrets?.defaults,
		env: process.env
	});
	return require_runtime_gateway_auth_surfaces.GATEWAY_AUTH_SURFACE_PATHS.some((path) => {
		const state = states[path];
		return state.hasSecretRef && state.active;
	});
}
function assertRuntimeGatewayAuthNotKnownWeak(config) {
	require_startup_auth.assertGatewayAuthNotKnownWeak(require_auth_resolve.resolveGatewayAuth({
		authConfig: config.gateway?.auth,
		env: process.env,
		tailscaleMode: config.gateway?.tailscale?.mode ?? "off"
	}));
}
function logGatewayAuthSurfaceDiagnostics(prepared, logSecrets) {
	const states = require_runtime_gateway_auth_surfaces.evaluateGatewayAuthSurfaceStates({
		config: prepared.sourceConfig,
		defaults: prepared.sourceConfig.secrets?.defaults,
		env: process.env
	});
	const inactiveWarnings = /* @__PURE__ */ new Map();
	for (const warning of prepared.warnings) {
		if (warning.code !== "SECRETS_REF_IGNORED_INACTIVE_SURFACE") continue;
		inactiveWarnings.set(warning.path, warning.message);
	}
	for (const path of require_runtime_gateway_auth_surfaces.GATEWAY_AUTH_SURFACE_PATHS) {
		const state = states[path];
		if (!state.hasSecretRef) continue;
		const stateLabel = state.active ? "active" : "inactive";
		const details = (!state.active && inactiveWarnings.get(path) ? inactiveWarnings.get(path) : void 0) ?? state.reason;
		logSecrets.info(`[SECRETS_GATEWAY_AUTH_SURFACE] ${path} is ${stateLabel}. ${details}`);
	}
}
function applyGatewayAuthOverridesForStartupPreflight(config, overrides) {
	if (!overrides.auth && !overrides.tailscale) return config;
	return {
		...config,
		gateway: {
			...config.gateway,
			auth: require_startup_auth.mergeGatewayAuthConfig(config.gateway?.auth, overrides.auth),
			tailscale: require_startup_auth.mergeGatewayTailscaleConfig(config.gateway?.tailscale, overrides.tailscale)
		}
	};
}
//#endregion
exports.createRuntimeSecretsActivator = createRuntimeSecretsActivator;
exports.loadGatewayStartupConfigSnapshot = loadGatewayStartupConfigSnapshot;
exports.prepareGatewayStartupConfig = prepareGatewayStartupConfig;
