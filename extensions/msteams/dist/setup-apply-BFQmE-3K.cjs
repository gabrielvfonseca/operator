const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_agent_id = require("./agent-id-nux9kTGp.cjs");
const require_inference_route = require("./inference-route-2IwhuIcI.cjs");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/system-agent/setup-config-snapshot.ts
function requireValidSystemAgentSetupSnapshot(snapshot) {
	if (snapshot.exists && !snapshot.valid) {
		const issue = snapshot.issues?.[0];
		const detail = issue ? ` (${issue.path ? `${issue.path}: ` : ""}${issue.message})` : "";
		throw new Error(`Operator config ${require_utils.shortenHomePath(snapshot.path)} is invalid${detail}. Fix it before running setup.`);
	}
	const sourceConfig = snapshot.exists ? snapshot.sourceConfig ?? snapshot.config : {};
	const runtimeConfig = snapshot.exists ? snapshot.runtimeConfig ?? snapshot.config : {};
	const reservedAgent = runtimeConfig.agents?.list?.find((entry) => require_agent_id.isReservedSystemAgentId(entry.id));
	if (reservedAgent) throw new Error(`Agent id "${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(reservedAgent.id)}" is reserved for the system agent. Rename that configured agent, then retry setup.`);
	return {
		sourceConfig,
		runtimeConfig
	};
}
//#endregion
//#region src/system-agent/setup-apply.ts
var setup_apply_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	applySystemAgentModelSelection: () => applySystemAgentModelSelection,
	applySystemAgentSetup: () => applySystemAgentSetup,
	createQuickstartNotePrompter: () => createQuickstartNotePrompter,
	createSystemAgentModelSelectionUpdater: () => createSystemAgentModelSelectionUpdater
});
/** Prompter for quickstart-only flows: notes go to the log, prompts fail loud. */
function createQuickstartNotePrompter(runtime) {
	const unexpected = (kind) => {
		throw new Error(`operator setup hit an interactive ${kind} prompt; quickstart must not ask`);
	};
	return {
		intro: async () => {},
		outro: async () => {},
		note: async (message, title) => {
			runtime.log(title ? `${title}: ${message}` : message);
		},
		select: async (params) => {
			if (params.initialValue !== void 0) return params.initialValue;
			return unexpected("select");
		},
		multiselect: async () => unexpected("multiselect"),
		text: async () => unexpected("text"),
		confirm: async (params) => params.initialValue ?? true,
		progress: (label) => {
			runtime.log(label);
			return {
				update: (message) => runtime.log(message),
				stop: (message) => {
					if (message) runtime.log(message);
				}
			};
		}
	};
}
function applySecurityAcknowledgement(config) {
	if (config.wizard?.securityAcknowledgedAt) return config;
	return {
		...config,
		wizard: {
			...config.wizard,
			securityAcknowledgedAt: (/* @__PURE__ */ new Date()).toISOString()
		}
	};
}
function applySystemAgentModelSelectionWithModules(params, modules) {
	const { agentScope, modelConfig, runtimePolicy } = modules;
	const nextConfig = structuredClone(params.config);
	const agentId = agentScope.resolveDefaultAgentId(nextConfig);
	const writesAgent = Boolean(agentScope.resolveAgentExplicitModelPrimary(nextConfig, agentId));
	nextConfig.agents ??= {};
	nextConfig.agents.defaults ??= {};
	const target = modelConfig.resolveModelTarget({
		raw: params.model,
		cfg: nextConfig
	});
	const key = modelConfig.upsertCanonicalModelConfigEntry({}, target);
	const configuredVisibleModels = nextConfig.agents.defaults.models;
	if (configuredVisibleModels && Object.keys(configuredVisibleModels).length > 0) {
		const defaultModels = { ...configuredVisibleModels };
		modelConfig.upsertCanonicalModelConfigEntry(defaultModels, target);
		nextConfig.agents.defaults.models = defaultModels;
	}
	let agent = nextConfig.agents.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === agentId);
	if (writesAgent) {
		if (!agent) throw new Error(`Could not resolve configured default agent "${agentId}".`);
		const agentModels = { ...agent.models };
		agent.models = agentModels;
		modelConfig.upsertCanonicalModelConfigEntry(agentModels, target);
	}
	if (params.agentRuntimeId) {
		if (!agent) {
			agent = {
				id: agentId,
				default: true
			};
			nextConfig.agents.list = [...nextConfig.agents.list ?? [], agent];
		}
		const agentModels = { ...agent.models };
		const agentKey = modelConfig.upsertCanonicalModelConfigEntry(agentModels, target);
		agentModels[agentKey] = {
			...agentModels[agentKey],
			agentRuntime: { id: params.agentRuntimeId }
		};
		agent.models = agentModels;
	} else {
		const clearRuntimePin = (models) => {
			const nextModels = { ...models };
			const modelKey = modelConfig.upsertCanonicalModelConfigEntry(nextModels, target);
			const entry = { ...nextModels[modelKey] };
			delete entry.agentRuntime;
			nextModels[modelKey] = entry;
			return nextModels;
		};
		const defaultModels = nextConfig.agents.defaults.models;
		if (defaultModels && Object.keys(defaultModels).length > 0) nextConfig.agents.defaults.models = clearRuntimePin(defaultModels);
		if (agent?.models && Object.keys(agent.models).length > 0) agent.models = clearRuntimePin(agent.models);
	}
	const selectedModel = params.authProfileId ? `${key}@${params.authProfileId}` : key;
	agentScope.setAgentEffectiveModelPrimary(nextConfig, agentId, selectedModel);
	if (params.agentRuntimeId) {
		if (runtimePolicy.resolveModelRuntimePolicy({
			config: nextConfig,
			provider: target.provider,
			modelId: target.model,
			agentId
		}).policy?.id !== params.agentRuntimeId) throw new Error(`Could not pin ${key} to the ${params.agentRuntimeId} runtime.`);
	}
	return nextConfig;
}
async function createSystemAgentModelSelectionUpdater(params) {
	const [agentScope, modelConfig, runtimePolicy] = await Promise.all([
		Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports),
		Promise.resolve().then(() => require("./shared-DHbcE08y.cjs")).then((n) => n.shared_exports),
		Promise.resolve().then(() => require("./model-runtime-policy-CHKLCuJi.cjs")).then((n) => n.model_runtime_policy_exports)
	]);
	const modules = {
		agentScope,
		modelConfig,
		runtimePolicy
	};
	return (config) => applySystemAgentModelSelectionWithModules({
		...params,
		config
	}, modules);
}
async function applySystemAgentModelSelection(params) {
	return (await createSystemAgentModelSelectionUpdater(params))(params.config);
}
async function applySystemAgentSetup(params, hooks) {
	const { workspace, model, agentRuntimeId, authProfileId, expectedAgentId, expectedAgentDir, expectedModelRef, expectedConfigHash, configPatch, finalizeConfig, enablePluginId, refreshPluginRegistry, assertCommitPreconditions, surface, runtime } = params;
	const hasExpectedConfigHash = Object.hasOwn(params, "expectedConfigHash");
	const commit = hooks ? async (effect) => await hooks.commit(effect) : async (effect) => await effect();
	const [{ readSetupConfigFileSnapshot, resolveQuickstartGatewayDefaults }, onboardHelpers, { applyLocalSetupWorkspaceConfig }, { transformConfigWithPendingPluginInstalls }] = await Promise.all([
		Promise.resolve().then(() => require("./setup.shared-DaBRSpRV.cjs")),
		Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs")),
		Promise.resolve().then(() => require("./onboard-config-COaJmNhR.cjs")),
		Promise.resolve().then(() => require("./install-record-commit-BUsKCeHe.cjs")).then((n) => n.install_record_commit_exports)
	]);
	const snapshot = await readSetupConfigFileSnapshot();
	const snapshotConfig = requireValidSystemAgentSetupSnapshot(snapshot);
	if (hasExpectedConfigHash && require_io.resolveConfigSnapshotHash(snapshot) !== expectedConfigHash) throw new Error("Operator config changed while AI access was being tested. Try setup again.");
	const guardModules = expectedAgentId || expectedAgentDir || expectedModelRef ? await Promise.all([Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports), Promise.resolve().then(() => require("./model-selection-BvFurMxy.cjs")).then((n) => n.model_selection_exports)]) : void 0;
	const assertExpectedTarget = (config) => {
		if (!guardModules) return;
		const [{ resolveAgentDir, resolveDefaultAgentId }, { resolveDefaultModelForAgent }] = guardModules;
		const currentAgentId = resolveDefaultAgentId(config);
		if (expectedAgentId && currentAgentId !== expectedAgentId) throw new Error("The default agent changed while AI access was being tested. Try setup again.");
		if (expectedAgentDir && resolveAgentDir(config, currentAgentId) !== expectedAgentDir) throw new Error("The agent credential location changed while AI access was being tested. Try setup again.");
		if (expectedModelRef) {
			const current = resolveDefaultModelForAgent({
				cfg: config,
				agentId: currentAgentId
			});
			if (`${current.provider}/${current.model}` !== expectedModelRef) throw new Error("The default model changed while AI access was being tested. Try setup again.");
		}
	};
	assertExpectedTarget(snapshotConfig.runtimeConfig);
	const assertVerifiedRoute = async (setupSnapshot, expectedRoute = params.expectedInferenceRoute, phase = "before") => {
		if (!expectedRoute) return;
		const verifiedSnapshot = await require_io.readConfigFileSnapshot();
		const setupSource = setupSnapshot.exists ? setupSnapshot.sourceConfig ?? setupSnapshot.config : {};
		const verifiedSource = verifiedSnapshot.exists ? verifiedSnapshot.sourceConfig ?? verifiedSnapshot.config : {};
		const currentRoute = verifiedSnapshot.exists && verifiedSnapshot.valid && verifiedSnapshot.path === setupSnapshot.path && verifiedSnapshot.hash === setupSnapshot.hash && (0, node_util.isDeepStrictEqual)(verifiedSource, setupSource) ? await require_inference_route.projectDefaultInferenceRoute(verifiedSnapshot.runtimeConfig ?? verifiedSnapshot.config) : null;
		if (!currentRoute || !require_inference_route.sameDefaultInferenceRoute(currentRoute, expectedRoute)) throw new Error(phase === "before" ? "The default-agent inference route changed before setup could start, so no workspace or Gateway settings were changed. Retry setup from the current Operator session." : "The default-agent inference route changed after the config write, so no further setup effects were applied. Retry setup from the current Operator session.");
	};
	await assertVerifiedRoute(snapshot);
	const prompter = createQuickstartNotePrompter(runtime);
	const { configureGatewayForSetup } = await Promise.resolve().then(() => require("./setup.gateway-config-BnBdL7j5.cjs"));
	const buildSetupCandidate = async (currentBaseConfig) => {
		let setupBaseConfig = currentBaseConfig;
		if (enablePluginId) {
			const enabled = require_enable.enablePluginInConfig(setupBaseConfig, enablePluginId);
			if (!enabled.enabled) throw new Error(`Provider plugin ${enablePluginId} is ${enabled.reason}.`);
			setupBaseConfig = enabled.config;
		}
		if (configPatch !== void 0) setupBaseConfig = require_io.applyMergePatch(setupBaseConfig, configPatch);
		let candidate = applyLocalSetupWorkspaceConfig(setupBaseConfig, workspace);
		if (model) candidate = await applySystemAgentModelSelection({
			config: candidate,
			model,
			...agentRuntimeId ? { agentRuntimeId } : {},
			...authProfileId ? { authProfileId } : {}
		});
		candidate = applySecurityAcknowledgement(candidate);
		const gateway = await configureGatewayForSetup({
			flow: "quickstart",
			baseConfig: currentBaseConfig,
			nextConfig: candidate,
			localPort: require_paths.resolveGatewayPort(currentBaseConfig),
			quickstartGateway: resolveQuickstartGatewayDefaults(currentBaseConfig),
			prompter,
			runtime
		});
		return {
			nextConfig: onboardHelpers.applyWizardMetadata(gateway.nextConfig, {
				command: "onboard",
				mode: "local"
			}),
			settings: gateway.settings
		};
	};
	const committed = await commit(async () => await transformConfigWithPendingPluginInstalls({
		afterWrite: { mode: "auto" },
		writeOptions: { allowConfigSizeDrop: false },
		transform: async (currentConfig, context) => {
			const currentSnapshot = requireValidSystemAgentSetupSnapshot(context.snapshot);
			if (hasExpectedConfigHash && context.previousHash !== expectedConfigHash) throw new Error("Operator config changed while AI access was being tested. Try setup again.");
			await assertVerifiedRoute(context.snapshot);
			assertExpectedTarget(currentSnapshot.runtimeConfig);
			const setupCandidate = await buildSetupCandidate(currentConfig);
			const finalizedConfig = finalizeConfig ? finalizeConfig(setupCandidate.nextConfig, currentSnapshot.sourceConfig) : setupCandidate.nextConfig;
			const expectedSourceRoute = params.expectedInferenceRoute ? await require_inference_route.projectDefaultInferenceRoute(finalizedConfig) : void 0;
			if (params.expectedInferenceRoute && (!params.expectedInferenceRoute.route || !expectedSourceRoute?.route || !(0, node_util.isDeepStrictEqual)(expectedSourceRoute.route, params.expectedInferenceRoute.route))) throw new Error("The setup candidate no longer preserves the exact verified inference route, so it was not saved. Retry setup from the current Operator session.");
			assertCommitPreconditions?.();
			return {
				nextConfig: finalizedConfig,
				result: { settings: setupCandidate.settings }
			};
		}
	}));
	const nextConfig = committed.nextConfig;
	const settings = committed.result?.settings;
	if (!settings) throw new Error("Operator setup committed without resolved Gateway settings.");
	if (params.expectedInferenceRoute) {
		const afterRead = await require_io.readConfigFileSnapshotWithPluginMetadata();
		const afterSnapshot = afterRead.snapshot;
		requireValidSystemAgentSetupSnapshot(afterSnapshot);
		const expectedRuntime = require_io.validateConfigObjectWithPlugins(committed.nextConfig, {
			env: process.env,
			pluginMetadataSnapshot: afterRead.pluginMetadataSnapshot
		});
		if (!expectedRuntime.ok) {
			const issue = expectedRuntime.issues[0];
			const detail = issue ? ` (${issue.path ? `${issue.path}: ` : ""}${issue.message})` : "";
			throw new Error(`Operator could not validate the setup route after its config write${detail}. No further setup effects were applied. Retry setup from the current Operator session.`);
		}
		const expectedPersistedRoute = await require_inference_route.projectDefaultInferenceRoute(expectedRuntime.config);
		await assertVerifiedRoute(afterSnapshot, expectedPersistedRoute, "after");
		if (!(0, node_util.isDeepStrictEqual)(expectedPersistedRoute.route, params.expectedInferenceRoute.route)) throw new Error("The materialized inference route no longer matches the exact verified route, so no further setup effects were applied. Retry setup from the current Operator session.");
	}
	const lines = [`Workspace: ${require_utils.shortenHomePath(workspace)}`, model ? `Default model: ${model}` : void 0].filter((line) => line !== void 0);
	const runCommittedFollowUp = async (effect, onFailure) => {
		let effectStarted = false;
		try {
			return await commit(async () => {
				effectStarted = true;
				return await effect();
			});
		} catch (error) {
			if (!effectStarted) throw error;
			onFailure(error);
			return;
		}
	};
	await runCommittedFollowUp(async () => await onboardHelpers.ensureWorkspaceAndSessions(workspace, runtime, {
		skipBootstrap: Boolean(nextConfig.agents?.defaults?.skipBootstrap),
		skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles
	}), (error) => lines.push(`Workspace files: ${require_errors.formatErrorMessage(error)}`));
	await runCommittedFollowUp(async () => {
		const { updateExecApprovals } = await Promise.resolve().then(() => require("./exec-approvals-CwmCCSdE.cjs")).then((n) => n.exec_approvals_exports);
		await updateExecApprovals({ update: (approvals) => approvals.agents?.operator ? null : {
			...approvals,
			agents: {
				...approvals.agents,
				operator: {
					security: "full",
					ask: "off"
				}
			}
		} });
	}, (error) => lines.push(`Operator exec approval: ${require_errors.formatErrorMessage(error)}; local model harnesses may ask again.`));
	if (refreshPluginRegistry && enablePluginId) await runCommittedFollowUp(async () => {
		const { refreshPluginRegistryAfterConfigMutation } = await Promise.resolve().then(() => require("./registry-refresh-B3eSyFEy.cjs")).then((n) => n.registry_refresh_exports);
		await refreshPluginRegistryAfterConfigMutation({
			config: nextConfig,
			reason: "source-changed",
			workspaceDir: workspace,
			traceCommand: "operator-setup",
			logger: { warn: (message) => lines.push(message) }
		});
	}, (error) => lines.push(`Plugin registry refresh failed: ${require_errors.formatErrorMessage(error)}`));
	if (surface === "cli") await runCommittedFollowUp(async () => {
		const { ensureGatewayServiceForOnboarding } = await Promise.resolve().then(() => require("./setup.finalize-CDDo1Ofs.cjs"));
		const { installDaemon } = await ensureGatewayServiceForOnboarding({
			flow: "quickstart",
			opts: {},
			nextConfig,
			settings,
			prompter,
			runtime,
			loadedAction: "restart"
		});
		if (installDaemon) {
			const probeLinks = onboardHelpers.resolveLocalControlUiProbeLinks({
				bind: settings.bind,
				port: settings.port,
				customBindHost: settings.customBindHost,
				basePath: void 0,
				tlsEnabled: nextConfig.gateway?.tls?.enabled === true
			});
			const probe = await onboardHelpers.waitForGatewayReachable({
				url: probeLinks.wsUrl,
				token: settings.authMode === "token" ? settings.gatewayToken : void 0,
				deadlineMs: 15e3
			});
			lines.push(probe.ok ? `Gateway: running at ${probeLinks.wsUrl}` : `Gateway: not reachable yet (${probe.detail ?? "still starting"}) — say \`gateway status\` to check`);
		} else lines.push("Gateway: service install skipped — say `start gateway` when you want it running.");
	}, (error) => lines.push(`Gateway service: ${require_errors.formatErrorMessage(error)}`));
	else lines.push("Gateway: running (managed by this app).");
	return {
		configPath: committed.path,
		configHashBefore: committed.previousHash,
		configHashAfter: committed.persistedHash,
		lines
	};
}
//#endregion
Object.defineProperty(exports, "applySystemAgentModelSelection", {
	enumerable: true,
	get: function() {
		return applySystemAgentModelSelection;
	}
});
Object.defineProperty(exports, "createQuickstartNotePrompter", {
	enumerable: true,
	get: function() {
		return createQuickstartNotePrompter;
	}
});
Object.defineProperty(exports, "createSystemAgentModelSelectionUpdater", {
	enumerable: true,
	get: function() {
		return createSystemAgentModelSelectionUpdater;
	}
});
Object.defineProperty(exports, "setup_apply_exports", {
	enumerable: true,
	get: function() {
		return setup_apply_exports;
	}
});
