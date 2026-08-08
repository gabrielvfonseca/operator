const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profiles = require("./profiles-m8TkqupR.cjs");
const require_failover_error = require("./failover-error-voHYvp7k.cjs");
const require_auth = require("./auth-Bk8NmCMz.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
const require_audit = require("./audit-yL76l99a.cjs");
const require_inference_route = require("./inference-route-2IwhuIcI.cjs");
const require_provider_auth_choice_order = require("./provider-auth-choice-order-BIqyryg2.cjs");
const require_provider_auth_choice = require("./provider-auth-choice-BDZeLIQ8.cjs");
const require_verified_inference = require("./verified-inference-DA_zZ9Fy.cjs");
const require_overview = require("./overview-BUkXf7FH.cjs");
const require_onboarding_welcome = require("./onboarding-welcome-9QvBdO8z.cjs");
const require_setup_apply = require("./setup-apply-BFQmE-3K.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/onboard-inference.ts
/**
* Onboarding treats inference as the one required step: reuse whatever the
* machine already has (env API keys, Claude Code login, Codex login) before
* asking the user anything. The ladder order is a documented contract
* (docs/cli/setup.md "Setup bootstrap") — change docs when changing it.
*/
const OPENAI_API_DEFAULT_MODEL_REF = "openai/gpt-5.6";
const ANTHROPIC_API_DEFAULT_MODEL_REF = "anthropic/claude-opus-4-8";
const CLAUDE_CLI_DEFAULT_MODEL_REF = "claude-cli/claude-opus-4-8";
const CODEX_APP_SERVER_DEFAULT_MODEL_REF = "openai/gpt-5.6-sol";
const GEMINI_CLI_DEFAULT_MODEL_REF = "google-gemini-cli/gemini-3.1-pro-preview";
function detectCliCredentialState(params) {
	if (!params.probe.found) return;
	if (params.hasStoredCredentials) return true;
	return params.platform === "darwin" ? void 0 : false;
}
function describeCliDetail(credentials, loginHint) {
	if (credentials === true) return "logged in";
	if (credentials === false) return `installed, not logged in — ${loginHint}, then check again`;
	return "installed";
}
async function detectCodexLoginState(probe, command) {
	if (!(await probe(command, ["login", "status"], { timeoutMs: 3e3 })).error) return true;
}
function randomizeClaudeCodexTie(candidates, pickRandomInt) {
	const claudeIndex = candidates.findIndex((candidate) => candidate.kind === "claude-cli" && candidate.credentials !== false);
	const codexIndex = candidates.findIndex((candidate) => candidate.kind === "codex-cli" && candidate.credentials !== false);
	if (claudeIndex === -1 || codexIndex === -1 || pickRandomInt(2) === 0) return;
	const claudeCandidate = candidates[claudeIndex];
	const codexCandidate = candidates[codexIndex];
	candidates[claudeIndex] = (0, _gabrielvfonseca_normalization_core.expectDefined)(codexCandidate, "Codex onboarding candidate");
	candidates[codexIndex] = (0, _gabrielvfonseca_normalization_core.expectDefined)(claudeCandidate, "Claude onboarding candidate");
}
const CODEX_MACOS_APP_NAMES = [
	"ChatGPT.app",
	"Codex.app",
	"Codex Beta.app"
];
async function probeCodexCommand(params) {
	const pathProbe = await params.probe("codex");
	if (pathProbe.found || params.platform !== "darwin") return pathProbe;
	const home = params.env.HOME?.trim() || node_os.default.homedir();
	const appExecutables = new Set(CODEX_MACOS_APP_NAMES.flatMap((appName) => [node_path.default.join("/Applications", appName, "Contents", "Resources", "codex"), node_path.default.join(home, "Applications", appName, "Contents", "Resources", "codex")]));
	for (const executable of appExecutables) {
		const appProbe = await params.probe(executable);
		if (appProbe.found) return appProbe;
	}
	return pathProbe;
}
/** Detects a native Codex App Server without coupling it to inference selection. */
async function detectNativeCodexAppServer(options = {}) {
	return await probeCodexCommand({
		probe: options.probeLocalCommand ?? require_overview.probeLocalCommand,
		env: options.env ?? process.env,
		platform: options.platform ?? process.platform
	});
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.onboardInferenceTestApi")] = { detectNativeCodexAppServer };
/**
* Detect usable inference backends in ladder order. Returns candidates only
* for backends that exist on this machine; the first entry is the bootstrap
* default. Backends that are definitively logged out sink below logged-in and
* unknown ones so a stale install never outranks a working login.
*/
async function detectInferenceBackends(options = {}) {
	const env = options.env ?? process.env;
	const platform = options.platform ?? process.platform;
	const probe = options.deps?.probeLocalCommand ?? require_overview.probeLocalCommand;
	const readClaude = options.deps?.readClaudeCliCredentials ?? (() => require_external_auth.readClaudeCliCredentialsCached({
		allowKeychainPrompt: false,
		ttlMs: 6e4
	}));
	const readGemini = options.deps?.readGeminiCliCredentials ?? (() => require_external_auth.readGeminiCliCredentialsCached({ ttlMs: 6e4 }));
	const candidates = [];
	const defaultAgentId = options.config ? require_agent_scope_config.resolveDefaultAgentId(options.config) : void 0;
	if (require_model_input.resolveAgentModelPrimaryValue(options.config ? require_agent_scope_config.resolveAgentConfig(options.config, require_agent_scope_config.resolveDefaultAgentId(options.config))?.model : void 0) ?? require_model_input.resolveAgentModelPrimaryValue(options.config?.agents?.defaults?.model)) {
		const resolved = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
			cfg: options.config ?? {},
			...defaultAgentId ? { agentId: defaultAgentId } : {}
		});
		candidates.push({
			kind: "existing-model",
			modelRef: `${resolved.provider}/${resolved.model}`,
			label: "Current model",
			detail: "already configured",
			credentials: true
		});
	}
	if (env.OPENAI_API_KEY?.trim()) candidates.push({
		kind: "openai-api-key",
		modelRef: OPENAI_API_DEFAULT_MODEL_REF,
		label: "OpenAI API key",
		detail: "OPENAI_API_KEY set",
		credentials: true
	});
	if (env.ANTHROPIC_API_KEY?.trim()) candidates.push({
		kind: "anthropic-api-key",
		modelRef: ANTHROPIC_API_DEFAULT_MODEL_REF,
		label: "Anthropic API key",
		detail: "ANTHROPIC_API_KEY set",
		credentials: true
	});
	const [claudeProbe, codexProbe, geminiProbe] = await Promise.all([
		probe("claude"),
		detectNativeCodexAppServer({
			probeLocalCommand: probe,
			env,
			platform
		}),
		probe("gemini")
	]);
	const cliCandidates = [];
	if (claudeProbe.found) {
		const credentials = detectCliCredentialState({
			probe: claudeProbe,
			hasStoredCredentials: readClaude() !== null,
			platform
		});
		cliCandidates.push({
			kind: "claude-cli",
			modelRef: CLAUDE_CLI_DEFAULT_MODEL_REF,
			label: "Claude Code",
			detail: describeCliDetail(credentials, "run `claude auth login`"),
			...credentials === void 0 ? {} : { credentials }
		});
	}
	if (codexProbe.found) {
		const credentials = options.deps?.readCodexCliCredentials ? detectCliCredentialState({
			probe: codexProbe,
			hasStoredCredentials: options.deps.readCodexCliCredentials() !== null,
			platform
		}) : await detectCodexLoginState(probe, codexProbe.command);
		cliCandidates.push({
			kind: "codex-cli",
			modelRef: CODEX_APP_SERVER_DEFAULT_MODEL_REF,
			label: "Codex",
			detail: describeCliDetail(credentials, "run `codex login`"),
			...credentials === void 0 ? {} : { credentials }
		});
	}
	if (geminiProbe.found) {
		const credentials = readGemini() !== null;
		cliCandidates.push({
			kind: "gemini-cli",
			modelRef: GEMINI_CLI_DEFAULT_MODEL_REF,
			label: "Gemini CLI",
			detail: describeCliDetail(credentials, "sign in to Gemini CLI"),
			credentials
		});
	}
	randomizeClaudeCodexTie(cliCandidates, options.deps?.randomInt ?? node_crypto.randomInt);
	candidates.push(...cliCandidates.filter((candidate) => candidate.credentials !== false), ...cliCandidates.filter((candidate) => candidate.credentials === false));
	return candidates;
}
//#endregion
//#region src/system-agent/revalidate-inference-owner.ts
async function revalidateSetupInferenceOwner(params) {
	return await (params.deps.createSystemAgentVerifiedInferenceBinding ?? require_verified_inference.createSystemAgentVerifiedInferenceBinding)({
		configuredRoute: params.route,
		executionRoute: params.route,
		auth: params.auth,
		deps: params.deps
	});
}
//#endregion
//#region src/system-agent/setup-inference-auth-options.ts
function supportsSetupTextInference(scopes) {
	return !scopes || scopes.includes("text-inference");
}
function supportsSetupManualSecret(choice) {
	return supportsSetupTextInference(choice.onboardingScopes) && choice.appGuidedSecret === true;
}
function listSetupInferenceManualProviders(authChoices) {
	const choices = /* @__PURE__ */ new Map();
	for (const choice of authChoices) {
		const id = choice.choiceId.trim();
		if (!id || choices.has(id) || !supportsSetupManualSecret(choice)) continue;
		choices.set(id, {
			id,
			label: choice.choiceLabel,
			...choice.choiceHint?.trim() ? { hint: choice.choiceHint.trim() } : {}
		});
	}
	return [...choices.values()].toSorted((a, b) => a.label.localeCompare(b.label, "en") || a.id.localeCompare(b.id, "en"));
}
function listSetupInferenceAuthOptions(authChoices) {
	const choices = /* @__PURE__ */ new Map();
	for (const choice of authChoices) {
		const id = choice.choiceId.trim();
		if (!id || choices.has(id) || !supportsSetupTextInference(choice.onboardingScopes) || choice.assistantVisibility === "manual-only" || !choice.appGuidedAuth) continue;
		choices.set(id, {
			metadata: choice,
			option: {
				id,
				label: choice.choiceLabel,
				...choice.choiceHint?.trim() ? { hint: choice.choiceHint.trim() } : {},
				...choice.groupLabel?.trim() ? { groupLabel: choice.groupLabel.trim() } : {},
				kind: choice.appGuidedAuth,
				featured: choice.onboardingFeatured === true
			}
		});
	}
	return [...choices.values()].toSorted((a, b) => Number(b.option.featured) - Number(a.option.featured) || require_provider_auth_choice_order.compareProviderAuthChoiceGroups({
		id: a.metadata.groupId ?? a.metadata.providerId,
		label: a.metadata.groupLabel ?? a.metadata.choiceLabel
	}, {
		id: b.metadata.groupId ?? b.metadata.providerId,
		label: b.metadata.groupLabel ?? b.metadata.choiceLabel
	}) || (a.metadata.assistantPriority ?? 0) - (b.metadata.assistantPriority ?? 0) || a.option.label.localeCompare(b.option.label, "en") || a.option.id.localeCompare(b.option.id, "en")).map(({ option }) => option);
}
//#endregion
//#region src/system-agent/setup-inference-probe.ts
const SETUP_INFERENCE_TEST_MAX_TOKENS = 32;
/** Plugin and auto-selected harnesses may not support Operator's request-scoped token cap. */
function resolveSetupInferenceProbeStreamParams(agentHarnessId) {
	return !agentHarnessId || agentHarnessId === "@gabrielvfonseca/operator" ? { streamParams: { maxTokens: SETUP_INFERENCE_TEST_MAX_TOKENS } } : {};
}
//#endregion
//#region src/system-agent/setup-inference.ts
const log = require_subsystem.createSubsystemLogger("system-agent/setup-inference");
const SETUP_INFERENCE_TEST_PROMPT = "Reply with the single word OK. Do not use tools.";
const PROVIDER_AUTO_SETUP_KIND_PREFIX = "provider-auto:";
/**
* The config commit may have happened, so callers must verify current setup
* instead of treating this like a definitive candidate failure and retrying.
*/
var SetupInferenceActivationIndeterminateError = class extends Error {
	constructor(..._args) {
		super(..._args);
		this.name = "SetupInferenceActivationIndeterminateError";
	}
};
var SetupInferenceActivationUnavailableError = class extends Error {
	constructor(..._args2) {
		super(..._args2);
		this.name = "SetupInferenceActivationUnavailableError";
	}
};
var SetupInferenceCancelledError = class extends Error {
	constructor() {
		super("Provider login was cancelled.");
	}
};
function throwIfSetupInferenceCancelled(params) {
	if (params.signal?.aborted || params.isCancelled?.()) throw new SetupInferenceCancelledError();
}
async function waitForProviderAuth(promise, signal) {
	if (!signal) return await promise;
	if (signal.aborted) throw new SetupInferenceCancelledError();
	let rejectAborted;
	const aborted = new Promise((_resolve, reject) => {
		rejectAborted = reject;
	});
	const onAbort = () => rejectAborted?.(new SetupInferenceCancelledError());
	signal.addEventListener("abort", onAbort, { once: true });
	try {
		return await Promise.race([promise, aborted]);
	} finally {
		signal.removeEventListener("abort", onAbort);
	}
}
function toProviderAutoSetupKind(choiceId) {
	return `${PROVIDER_AUTO_SETUP_KIND_PREFIX}${encodeURIComponent(choiceId)}`;
}
function parseProviderAutoSetupChoiceId(kind) {
	if (!kind.startsWith(PROVIDER_AUTO_SETUP_KIND_PREFIX)) return;
	const encoded = kind.slice(14);
	if (!encoded) return;
	try {
		return decodeURIComponent(encoded) || void 0;
	} catch {
		return;
	}
}
function invalidSetupConfigError(snapshot) {
	const issue = snapshot.issues?.[0];
	const detail = issue ? ` (${issue.path ? `${issue.path}: ` : ""}${issue.message})` : "";
	return `Operator config ${snapshot.path} is invalid${detail}. Fix it before running setup.`;
}
async function resolveSetupInferenceWorkspace(params) {
	const { authoredConfig, hasAuthoredSetup } = await require_onboarding_welcome.loadAuthoredSetupConfig(params);
	const { DEFAULT_WORKSPACE } = await Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs"));
	return {
		workspace: require_home_dir.resolveUserPath(authoredConfig?.agents?.defaults?.workspace?.trim() || DEFAULT_WORKSPACE),
		hasAuthoredSetup
	};
}
async function detectSetupInference(deps = {}) {
	const { readConfigFileSnapshot } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
	const snapshot = await readConfigFileSnapshot();
	if (snapshot.exists && !snapshot.valid) throw new Error(invalidSetupConfigError(snapshot));
	const cfg = snapshot.exists && snapshot.valid ? snapshot.runtimeConfig ?? snapshot.config : {};
	const detected = await (deps.detectInferenceBackends ?? detectInferenceBackends)({ config: cfg });
	const unavailableCandidates = detected.filter((candidate) => candidate.kind === "gemini-cli").map((candidate) => ({
		id: candidate.kind,
		label: candidate.label,
		detail: candidate.detail,
		reason: "Can't be auto-tested safely here. Use 'Gemini CLI OAuth' or a Gemini API key instead."
	}));
	if ((await (deps.probeLocalCommand ?? require_overview.probeLocalCommand)("agy")).found) unavailableCandidates.push({
		id: "antigravity-cli",
		label: "Antigravity CLI",
		detail: "installed",
		reason: "Can't be auto-tested safely here. Sign in with a provider or use an API key instead."
	});
	const candidates = detected.filter((candidate) => candidate.kind !== "gemini-cli").map((candidate) => Object.assign(candidate, { recommended: false }));
	const { workspace } = await resolveSetupInferenceWorkspace({
		configExists: snapshot.exists,
		configValid: snapshot.valid
	});
	const configuredModel = candidates.find((candidate) => candidate.kind === "existing-model")?.modelRef;
	const authChoices = (deps.resolveManifestProviderAuthChoices ?? require_provider_auth_choices.resolveManifestProviderAuthChoices)({
		config: cfg,
		workspaceDir: workspace,
		includeUntrustedWorkspacePlugins: false,
		includeWorkspacePlugins: false
	}).filter((choice) => (deps.enablePluginInConfig ?? require_enable.enablePluginInConfig)(cfg, choice.pluginId).enabled);
	const discoveryChoices = authChoices.filter((choice) => choice.appGuidedDiscovery === true && supportsSetupTextInference(choice.onboardingScopes));
	if (discoveryChoices.length > 0) {
		let discoveryConfig = cfg;
		const enabledChoices = [];
		for (const choice of discoveryChoices) {
			const enabled = (deps.enablePluginInConfig ?? require_enable.enablePluginInConfig)(discoveryConfig, choice.pluginId);
			if (!enabled.enabled) continue;
			discoveryConfig = enabled.config;
			enabledChoices.push(choice);
		}
		const providers = (deps.resolvePluginProviders ?? require_providers_runtime.resolvePluginProviders)({
			config: discoveryConfig,
			workspaceDir: workspace,
			mode: "setup",
			includeUntrustedWorkspacePlugins: false,
			onlyPluginIds: [...new Set(enabledChoices.map((choice) => choice.pluginId))]
		});
		const discovered = await Promise.all(enabledChoices.map(async (choice) => {
			const method = providers.find((candidate) => candidate.pluginId === choice.pluginId && require_model_selection_normalize.normalizeProviderId(candidate.id) === require_model_selection_normalize.normalizeProviderId(choice.providerId))?.auth.find((candidate) => candidate.id === choice.methodId);
			if (!method?.appGuidedSetup) return null;
			try {
				const candidate = await method.appGuidedSetup.detect({
					config: discoveryConfig,
					env: process.env,
					workspaceDir: workspace
				});
				if (!candidate) return null;
				const ref = parseRef(candidate.modelRef);
				if (!ref.model || require_model_selection_normalize.normalizeProviderId(ref.provider) !== require_model_selection_normalize.normalizeProviderId(choice.providerId)) {
					log.warn(`Ignoring invalid app-guided model ${candidate.modelRef} from ${choice.choiceId}.`);
					return null;
				}
				return {
					kind: toProviderAutoSetupKind(choice.choiceId),
					label: choice.choiceLabel,
					detail: candidate.detail?.trim() || "available locally",
					modelRef: candidate.modelRef,
					recommended: false,
					credentials: true
				};
			} catch (error) {
				log.debug(`App-guided discovery failed for ${choice.choiceId}: ${require_errors.formatErrorMessage(error)}`);
				return null;
			}
		}));
		candidates.push(...discovered.filter((candidate) => candidate !== null));
	}
	return {
		candidates,
		unavailableCandidates,
		manualProviders: listSetupInferenceManualProviders(authChoices),
		authOptions: listSetupInferenceAuthOptions(authChoices),
		workspace,
		...configuredModel ? { configuredModel } : {},
		setupComplete: Boolean(configuredModel)
	};
}
function configureCodexCliPreparedAuth(cfg) {
	const entry = cfg.plugins?.entries?.codex;
	const pluginConfig = entry?.config ?? {};
	const appServer = pluginConfig.appServer && typeof pluginConfig.appServer === "object" ? pluginConfig.appServer : {};
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			entries: {
				...cfg.plugins?.entries,
				codex: {
					...entry,
					config: {
						...pluginConfig,
						appServer: {
							...appServer,
							transport: "stdio",
							homeScope: "agent"
						}
					}
				}
			}
		}
	};
}
function extractRunText(result) {
	return result.meta?.finalAssistantVisibleText ?? result.meta?.finalAssistantRawText ?? result.payloads?.map((payload) => payload.text?.trim()).filter(Boolean).join("\n");
}
function extractRunTerminalError(result) {
	const errorPayload = result.payloads?.find((payload) => payload.isError === true)?.text?.trim();
	const hasMetaError = result.meta?.error !== void 0;
	const metaError = result.meta?.error?.message?.trim();
	const livenessState = result.meta?.livenessState?.trim().toLowerCase();
	if (!errorPayload && !hasMetaError && livenessState !== "blocked" && livenessState !== "abandoned") return;
	return metaError || errorPayload || (livenessState ? `Inference ended in the ${livenessState} state.` : "Inference failed.");
}
function extractRunWinnerError(plan, result) {
	const winnerProvider = result.meta?.executionTrace?.winnerProvider?.trim();
	const winnerModel = result.meta?.executionTrace?.winnerModel?.trim();
	if (!winnerProvider || !winnerModel) return "The inference run did not report which provider and model produced its reply.";
	if (winnerProvider === plan.provider && winnerModel === plan.model) return;
	return `The inference run answered through ${winnerProvider}/${winnerModel} instead of the requested ${plan.provider}/${plan.model}. Disable model-routing overrides or choose the working route directly, then retry.`;
}
function resolveToolFreeCliSetupError(plan) {
	if (plan.runner !== "cli") return;
	const backend = require_cli_backends.resolveCliBackendConfig(plan.provider, plan.config, plan.agentId ? { agentId: plan.agentId } : {});
	if (backend?.sideQuestionToolMode === "disabled") return;
	const geminiCliProvider = parseRef(GEMINI_CLI_DEFAULT_MODEL_REF).provider;
	if (backend?.nativeToolMode === "none" && plan.provider !== geminiCliProvider) return;
	return plan.provider === geminiCliProvider ? "Gemini CLI cannot be used for inference-gated setup because it has no hard tool-free mode. Choose Claude Code, Codex, or an API-key provider; normal Gemini CLI agent runs remain available after setup." : `CLI backend ${backend?.id ?? plan.provider} cannot be used for inference-gated setup because it has no hard tool-free mode. Choose another inference provider.`;
}
function resolveStrictSetupAuthProfileError(params) {
	const profileId = params.plan.authProfileId?.trim();
	if (!profileId) return;
	const credential = (params.deps.loadAuthProfileStoreForRuntime ?? require_store.loadAuthProfileStoreForRuntime)(params.plan.agentDir, {
		readOnly: true,
		allowKeychainPrompt: false,
		config: params.plan.config,
		externalCliProviderIds: [params.plan.provider]
	}).profiles[profileId];
	if (!credential) return `No credentials found for the configured setup profile "${profileId}".`;
	if (params.plan.runner === "embedded") {
		if (require_auth.buildAgentRuntimeAuthPlan({
			provider: params.plan.provider,
			authProfileProvider: credential.provider,
			authProfileMode: credential.type,
			sessionAuthProfileId: profileId,
			config: params.plan.config,
			workspaceDir: params.workspaceDir,
			harnessId: params.plan.agentHarnessRuntimeOverride,
			harnessRuntime: params.plan.agentHarnessRuntimeOverride,
			allowHarnessAuthProfileForwarding: true
		}).forwardedAuthProfileId === profileId) return;
	} else {
		const aliasContext = {
			config: params.plan.config,
			workspaceDir: params.workspaceDir
		};
		try {
			if (require_provider_auth_aliases.resolveProviderIdForAuth(params.plan.provider, aliasContext) === require_provider_auth_aliases.resolveProviderIdForAuth(credential.provider, aliasContext)) return;
		} catch {
			return `Could not verify that configured setup profile "${profileId}" belongs to the selected ${params.plan.provider} inference route.`;
		}
	}
	return `Configured setup profile "${profileId}" belongs to ${credential.provider}, not the selected ${params.plan.provider} inference route.`;
}
function parseRef(modelRef) {
	const slash = modelRef.indexOf("/");
	return slash === -1 ? {
		provider: modelRef,
		model: ""
	} : {
		provider: modelRef.slice(0, slash),
		model: modelRef.slice(slash + 1)
	};
}
function projectSetupTargetModelMetadata(config, modelRef) {
	const target = parseRef(modelRef);
	const canonicalKey = require_model_selection_normalize.modelKey(target.provider, target.model);
	const keys = new Set([
		canonicalKey,
		require_model_selection_normalize.legacyModelKey(target.provider, target.model),
		`${target.provider}/${canonicalKey}`
	].filter((key) => Boolean(key)));
	const project = (models) => Object.fromEntries([...keys].map((key) => [key, Object.hasOwn(models ?? {}, key) ? {
		exists: true,
		value: structuredClone(models?.[key])
	} : { exists: false }]));
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(config);
	const agent = config.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === defaultAgentId);
	return {
		defaultAgentId,
		defaults: project(config.agents?.defaults?.models),
		agent: project(agent?.models)
	};
}
function resolveSetupAgentRuntimeId(kind) {
	if (kind === "codex-cli") return "codex";
	if (kind === "openai-api-key" || kind === "anthropic-api-key" || kind === "api-key" || kind === "provider-auth" || parseProviderAutoSetupChoiceId(kind) !== void 0) return "@gabrielvfonseca/operator";
}
function mapFailoverReasonToSetupStatus(reason) {
	if (reason === "auth" || reason === "auth_permanent") return "auth";
	if (reason === "rate_limit" || reason === "overloaded") return "rate_limit";
	if (reason === "billing") return "billing";
	if (reason === "timeout") return "timeout";
	if (reason === "format" || reason === "model_not_found") return "format";
	return "unknown";
}
function prepareManualAuthForActivation(params) {
	const selectedProfile = params.profiles.find((profile) => profile.profileId === params.selectedProfileId);
	if (!selectedProfile) throw new Error("The selected setup credential was not returned by its provider.");
	const selectedProfileId = `${require_model_selection_normalize.normalizeProviderId(selectedProfile.credential.provider) || "provider"}:setup-${(0, node_crypto.randomUUID)()}`;
	const profile = {
		...selectedProfile,
		profileId: selectedProfileId
	};
	return {
		config: projectManualInferenceConfig({
			...params,
			selectedProfile,
			selectedProfileId
		}),
		profiles: [profile],
		selectedProfileId
	};
}
function copySelectedModelMetadata(params) {
	const preparedDefaultModels = params.prepared.agents?.defaults?.models;
	if (preparedDefaultModels && Object.hasOwn(preparedDefaultModels, params.modelRef)) params.target.agents = {
		...params.target.agents,
		defaults: {
			...params.target.agents?.defaults,
			models: {
				...params.target.agents?.defaults?.models,
				[params.modelRef]: structuredClone((0, _gabrielvfonseca_normalization_core.expectDefined)(preparedDefaultModels[params.modelRef], "prepared default models entry at params.model ref"))
			}
		}
	};
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(params.target);
	const preparedAgent = params.prepared.agents?.list?.find((agent) => agent.id === defaultAgentId);
	if (!preparedAgent?.models || !Object.hasOwn(preparedAgent.models, params.modelRef)) return;
	const targetAgents = params.target.agents?.list;
	const targetAgentIndex = targetAgents?.findIndex((agent) => agent.id === defaultAgentId) ?? -1;
	if (!targetAgents || targetAgentIndex < 0) return;
	const nextAgents = structuredClone(targetAgents);
	const targetAgent = (0, _gabrielvfonseca_normalization_core.expectDefined)(nextAgents[targetAgentIndex], "next agents entry at target agent index");
	if (!targetAgent) return;
	targetAgent.models = {
		...targetAgent.models,
		[params.modelRef]: structuredClone((0, _gabrielvfonseca_normalization_core.expectDefined)(preparedAgent.models[params.modelRef], "models entry at params.model ref"))
	};
	params.target.agents = {
		...params.target.agents,
		list: nextAgents
	};
}
function findSelectedProviderConfigKey(config, providerId) {
	const providers = config.models?.providers;
	if (!providers) return;
	if (Object.hasOwn(providers, providerId)) return providerId;
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(providerId);
	return Object.keys(providers).find((candidate) => require_model_selection_normalize.normalizeProviderId(candidate) === normalizedProvider);
}
/**
* Provider auth hooks are untrusted setup input. Carry only the selected
* inference route's config into the probe; Operator owns every other setup
* surface after intelligence exists.
*/
function projectManualInferenceConfig(params) {
	const config = structuredClone(params.baseConfig);
	if (params.selectedProfile && params.selectedProfileId) {
		const metadata = params.preparedConfig.auth?.profiles?.[params.selectedProfile.profileId] ?? {
			provider: params.selectedProfile.credential.provider,
			mode: params.selectedProfile.credential.type
		};
		config.auth = {
			...config.auth,
			profiles: {
				...config.auth?.profiles,
				[params.selectedProfileId]: structuredClone(metadata)
			}
		};
	}
	const providerConfigKey = findSelectedProviderConfigKey(params.preparedConfig, params.providerId);
	if (providerConfigKey) {
		const preparedProvider = params.preparedConfig.models?.providers?.[providerConfigKey];
		if (preparedProvider === void 0) throw new Error(`Prepared provider config missing for ${providerConfigKey}`);
		config.models = {
			...config.models,
			providers: {
				...config.models?.providers,
				[providerConfigKey]: structuredClone(preparedProvider)
			}
		};
	}
	if (params.pluginId) {
		const preparedEntry = params.preparedConfig.plugins?.entries?.[params.pluginId];
		if (preparedEntry !== void 0) config.plugins = {
			...config.plugins,
			entries: {
				...config.plugins?.entries,
				[params.pluginId]: structuredClone(preparedEntry)
			}
		};
	}
	copySelectedModelMetadata({
		target: config,
		prepared: params.preparedConfig,
		modelRef: params.modelRef
	});
	return config;
}
function canonicalizeSetupModelRef(params) {
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider
	});
	const resolved = require_model_selection_shared.resolveModelRefFromString({
		cfg: params.cfg,
		raw: params.raw,
		defaultProvider: params.defaultProvider,
		aliasIndex
	});
	return resolved ? `${resolved.ref.provider}/${resolved.ref.model}` : params.raw;
}
async function buildTestPlan(params) {
	const { kind, cfg, workspaceDir } = params;
	const resolveRouteModelRef = (defaultModelRef) => {
		const modelRef = params.modelRef?.trim() || defaultModelRef;
		const selected = parseRef(modelRef);
		const expected = parseRef(defaultModelRef);
		if (!selected.model || require_model_selection_normalize.normalizeProviderId(selected.provider) !== require_model_selection_normalize.normalizeProviderId(expected.provider)) return { error: `${modelRef} is not compatible with the ${kind} inference route.` };
		return modelRef;
	};
	const providerAutoChoiceId = parseProviderAutoSetupChoiceId(kind);
	if (providerAutoChoiceId) {
		const choice = (params.deps.resolveManifestProviderAuthChoice ?? require_provider_auth_choices.resolveManifestProviderAuthChoice)(providerAutoChoiceId, {
			config: cfg,
			workspaceDir: params.pluginWorkspaceDir,
			includeUntrustedWorkspacePlugins: false,
			includeWorkspacePlugins: false
		});
		if (choice?.appGuidedDiscovery !== true || !supportsSetupTextInference(choice.onboardingScopes)) return { error: "That detected provider is no longer available on this Gateway." };
		const enablePlugin = params.deps.enablePluginInConfig ?? require_enable.enablePluginInConfig;
		const enableResult = enablePlugin(cfg, choice.pluginId);
		if (!enableResult.enabled) return { error: `${choice.choiceLabel} is disabled (${enableResult.reason ?? "blocked"}).` };
		const sourceEnableResult = enablePlugin(params.sourceCfg, choice.pluginId);
		if (!sourceEnableResult.enabled) return { error: `${choice.choiceLabel} is disabled (${sourceEnableResult.reason ?? "blocked"}).` };
		const provider = (params.deps.resolvePluginProviders ?? require_providers_runtime.resolvePluginProviders)({
			config: enableResult.config,
			workspaceDir: params.pluginWorkspaceDir,
			mode: "setup",
			includeUntrustedWorkspacePlugins: false,
			onlyPluginIds: [choice.pluginId]
		}).find((candidate) => candidate.pluginId === choice.pluginId && require_model_selection_normalize.normalizeProviderId(candidate.id) === require_model_selection_normalize.normalizeProviderId(choice.providerId));
		const method = provider?.auth.find((candidate) => candidate.id === choice.methodId);
		if (!provider || !method?.appGuidedSetup) return { error: "That detected provider is no longer available on this Gateway." };
		const modelRef = params.modelRef?.trim();
		if (!modelRef) return { error: "The detected provider model is missing. Run detection again." };
		try {
			const result = await method.appGuidedSetup.prepare({
				config: enableResult.config,
				env: process.env,
				workspaceDir: params.pluginWorkspaceDir,
				modelRef,
				...params.signal ? { signal: params.signal } : {}
			});
			const preparedModelRef = result?.defaultModel ? require_model_input.normalizeAgentModelRefForConfig(result.defaultModel) : "";
			if (!result || preparedModelRef !== modelRef) return { error: `${choice.choiceLabel} could not prepare the detected model. Run detection again.` };
			const ref = parseRef(modelRef);
			if (!ref.model || require_model_selection_normalize.normalizeProviderId(ref.provider) !== require_model_selection_normalize.normalizeProviderId(choice.providerId)) return { error: `${choice.choiceLabel} returned an invalid detected model.` };
			const preparedConfig = require_provider_auth_choice.applyProviderPluginAuthMethodResultConfig({
				config: enableResult.config,
				result
			});
			const matchingProfile = result.profiles.find((profile) => require_model_selection_normalize.normalizeProviderId(profile.credential.provider) === require_model_selection_normalize.normalizeProviderId(ref.provider));
			if (result.profiles.length > 0 && !matchingProfile) return { error: `${choice.choiceLabel} did not return credentials for its detected model.` };
			const prepared = matchingProfile ? prepareManualAuthForActivation({
				baseConfig: enableResult.config,
				preparedConfig,
				profiles: result.profiles,
				selectedProfileId: matchingProfile.profileId,
				modelRef,
				providerId: ref.provider,
				pluginId: choice.pluginId
			}) : {
				config: projectManualInferenceConfig({
					baseConfig: enableResult.config,
					preparedConfig,
					modelRef,
					providerId: ref.provider,
					pluginId: choice.pluginId
				}),
				profiles: [],
				selectedProfileId: void 0
			};
			return {
				runner: "embedded",
				...ref,
				modelRef,
				agentDir: params.agentDir,
				config: prepared.config,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(prepared.config),
				...prepared.selectedProfileId ? { authProfileId: prepared.selectedProfileId } : {},
				persistModelRef: modelRef,
				manualAuth: {
					profiles: prepared.profiles,
					runtimeConfigBase: enableResult.config,
					sourceConfigBase: sourceEnableResult.config,
					configPatch: require_io.createMergePatch(enableResult.config, prepared.config),
					pluginId: choice.pluginId
				}
			};
		} catch (error) {
			return { error: `${choice.choiceLabel} could not prepare app-guided setup: ${require_errors.formatErrorMessage(error)}` };
		}
	}
	switch (kind) {
		case "existing-model": {
			const route = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(cfg, params.routeAgentId);
			if (!route) return { error: "No configured default-agent inference route is available." };
			const requestedModelRef = params.modelRef?.trim();
			const requestedTarget = requestedModelRef ? canonicalizeSetupModelRef({
				cfg,
				raw: requestedModelRef,
				defaultProvider: route.provider
			}) : void 0;
			if (requestedModelRef && requestedTarget !== route.modelLabel) return { error: `The configured default model changed from ${requestedModelRef} to ${route.modelLabel}. Try setup again.` };
			return {
				runner: route.runner,
				provider: route.provider,
				model: route.model,
				modelRef: route.modelLabel,
				config: route.runConfig,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: route.agentId,
				agentDir: route.agentDir,
				...route.runner === "embedded" ? { agentHarnessRuntimeOverride: route.agentHarnessRuntimeOverride } : {},
				...route.authProfileId ? { authProfileId: route.authProfileId } : {}
			};
		}
		case "claude-cli": {
			const modelRef = resolveRouteModelRef(CLAUDE_CLI_DEFAULT_MODEL_REF);
			if (typeof modelRef !== "string") return modelRef;
			return {
				runner: "cli",
				...parseRef(modelRef),
				modelRef,
				config: cfg,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(cfg),
				persistModelRef: modelRef
			};
		}
		case "gemini-cli": {
			const modelRef = resolveRouteModelRef(GEMINI_CLI_DEFAULT_MODEL_REF);
			if (typeof modelRef !== "string") return modelRef;
			return {
				runner: "cli",
				...parseRef(modelRef),
				modelRef,
				config: cfg,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(cfg),
				persistModelRef: modelRef
			};
		}
		case "codex-cli": {
			const modelRef = resolveRouteModelRef(CODEX_APP_SERVER_DEFAULT_MODEL_REF);
			if (typeof modelRef !== "string") return modelRef;
			return {
				runner: "embedded",
				...parseRef(modelRef),
				modelRef,
				agentHarnessRuntimeOverride: "codex",
				config: cfg,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(cfg),
				agentDir: params.agentDir,
				cleanupBundleMcpOnRunEnd: true,
				persistModelRef: modelRef
			};
		}
		case "openai-api-key": {
			const modelRef = resolveRouteModelRef(OPENAI_API_DEFAULT_MODEL_REF);
			if (typeof modelRef !== "string") return modelRef;
			return {
				runner: "embedded",
				...parseRef(modelRef),
				modelRef,
				config: cfg,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(cfg),
				persistModelRef: modelRef
			};
		}
		case "anthropic-api-key": {
			const modelRef = resolveRouteModelRef(ANTHROPIC_API_DEFAULT_MODEL_REF);
			if (typeof modelRef !== "string") return modelRef;
			return {
				runner: "embedded",
				...parseRef(modelRef),
				modelRef,
				config: cfg,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(cfg),
				persistModelRef: modelRef
			};
		}
		case "api-key":
		case "provider-auth": {
			const interactive = kind === "provider-auth";
			const apiKey = params.apiKey?.trim();
			if (!interactive && !apiKey) return { error: "Enter an API key or token first." };
			const authChoice = params.authChoice?.trim();
			const choice = authChoice ? (params.deps.resolveManifestProviderAuthChoice ?? require_provider_auth_choices.resolveManifestProviderAuthChoice)(authChoice, {
				config: cfg,
				workspaceDir: params.pluginWorkspaceDir,
				includeUntrustedWorkspacePlugins: false,
				includeWorkspacePlugins: false
			}) : void 0;
			if (!choice || !supportsSetupTextInference(choice.onboardingScopes) || !interactive && !supportsSetupManualSecret(choice) || interactive && (choice.assistantVisibility === "manual-only" || !choice.appGuidedAuth)) return { error: interactive ? "That provider login is not available on this Gateway." : "That key-based provider is not available on this Gateway." };
			const enablePlugin = params.deps.enablePluginInConfig ?? require_enable.enablePluginInConfig;
			const enableResult = enablePlugin(cfg, choice.pluginId);
			if (!enableResult.enabled) return { error: `${choice.choiceLabel} is disabled (${enableResult.reason ?? "blocked"}).` };
			const sourceEnableResult = enablePlugin(params.sourceCfg, choice.pluginId);
			if (!sourceEnableResult.enabled) return { error: `${choice.choiceLabel} is disabled (${sourceEnableResult.reason ?? "blocked"}).` };
			const provider = (params.deps.resolvePluginProviders ?? require_providers_runtime.resolvePluginProviders)({
				config: enableResult.config,
				workspaceDir: params.pluginWorkspaceDir,
				mode: "setup",
				includeUntrustedWorkspacePlugins: false,
				onlyPluginIds: [choice.pluginId]
			}).find((candidate) => candidate.pluginId === choice.pluginId && require_model_selection_normalize.normalizeProviderId(candidate.id) === require_model_selection_normalize.normalizeProviderId(choice.providerId));
			const method = provider?.auth.find((candidate) => candidate.id === choice.methodId);
			const resolved = provider && method ? {
				provider,
				method
			} : null;
			if (!resolved || !supportsSetupTextInference(resolved.method.wizard?.onboardingScopes) || interactive && resolved.method.kind !== "oauth" && resolved.method.kind !== "device_code") return { error: interactive ? "That provider login is not available on this Gateway." : "That key-based provider is not available on this Gateway." };
			let result;
			let preparedConfig;
			try {
				if (interactive) {
					if (!params.prompter) return { error: "This provider login requires an interactive setup session." };
					throwIfSetupInferenceCancelled(params);
					result = await waitForProviderAuth(require_provider_auth_choice.runProviderPluginAuthMethodUnpersisted({
						config: enableResult.config,
						runtime: params.runtime,
						...params.signal ? { signal: params.signal } : {},
						isRemote: params.isRemoteProviderAuth,
						prompter: params.prompter,
						method: resolved.method,
						agentDir: params.agentDir,
						workspaceDir
					}), params.signal);
					throwIfSetupInferenceCancelled(params);
					preparedConfig = require_provider_auth_choice.applyProviderPluginAuthMethodResultConfig({
						config: enableResult.config,
						result
					});
				} else if (resolved.method.kind === "api_key" || resolved.method.kind === "token") {
					result = await require_provider_auth_choice.runProviderPluginAuthMethodUnpersisted({
						config: enableResult.config,
						runtime: params.runtime,
						prompter: require_setup_apply.createQuickstartNotePrompter(params.runtime),
						method: resolved.method,
						agentDir: params.agentDir,
						workspaceDir,
						secretInputMode: "plaintext",
						allowSecretRefPrompt: false,
						opts: {
							token: apiKey,
							tokenProvider: resolved.provider.id
						}
					});
					preparedConfig = require_provider_auth_choice.applyProviderPluginAuthMethodResultConfig({
						config: enableResult.config,
						result
					});
				} else {
					const prepared = await runProviderManualSecretMethod({
						config: enableResult.config,
						baseConfig: cfg,
						choice,
						method: resolved.method,
						apiKey,
						agentDir: params.agentDir,
						workspaceDir
					});
					result = prepared.result;
					preparedConfig = prepared.config;
				}
			} catch (error) {
				if (error instanceof SetupInferenceCancelledError || params.signal?.aborted) return { error: "Provider login was cancelled." };
				const detail = error instanceof Error ? error.message : String(error);
				return { error: `${resolved.provider.label} could not prepare this ${interactive ? "login" : "credential"} for app-guided setup: ${detail}` };
			}
			const modelRef = result.defaultModel ? require_model_input.normalizeAgentModelRefForConfig(result.defaultModel) : "";
			if (!modelRef || result.profiles.length === 0) return { error: `${resolved.provider.label} does not expose a starter model for app-guided setup.` };
			const ref = parseRef(modelRef);
			if (!ref.model) return { error: `${resolved.provider.label} returned an invalid starter model.` };
			const matchingProfile = result.profiles.find((profile) => require_model_selection_normalize.normalizeProviderId(profile.credential.provider) === require_model_selection_normalize.normalizeProviderId(ref.provider));
			if (!matchingProfile) return { error: `${resolved.provider.label} did not return credentials for its starter model.` };
			const preparedAuth = prepareManualAuthForActivation({
				baseConfig: enableResult.config,
				preparedConfig,
				profiles: result.profiles,
				selectedProfileId: matchingProfile.profileId,
				modelRef,
				providerId: ref.provider,
				...resolved.provider.pluginId ? { pluginId: resolved.provider.pluginId } : {}
			});
			return {
				runner: "embedded",
				...ref,
				modelRef,
				agentDir: params.agentDir,
				config: preparedAuth.config,
				agentId: "@gabrielvfonseca/operator",
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(preparedAuth.config),
				authProfileId: preparedAuth.selectedProfileId,
				persistModelRef: modelRef,
				manualAuth: {
					profiles: preparedAuth.profiles,
					runtimeConfigBase: enableResult.config,
					sourceConfigBase: sourceEnableResult.config,
					configPatch: require_io.createMergePatch(enableResult.config, preparedAuth.config),
					...resolved.provider.pluginId ? { pluginId: resolved.provider.pluginId } : {}
				}
			};
		}
		default: return { error: `Unknown inference choice "${kind}".` };
	}
}
async function runProviderManualSecretMethod(params) {
	const optionKey = params.choice.optionKey;
	const runNonInteractive = params.method.runNonInteractive;
	if (!optionKey || !params.choice.cliOption || !runNonInteractive) throw new Error("Provider does not expose app-guided secret setup.");
	let methodError = "";
	const isolatedRuntime = {
		log: () => {},
		error: (...args) => {
			methodError = args.map(String).join(" ");
		},
		exit: (code) => {
			throw new Error(methodError || `Provider setup exited with code ${code}.`);
		}
	};
	const configured = await runNonInteractive({
		authChoice: params.choice.choiceId,
		config: params.config,
		baseConfig: params.baseConfig,
		opts: {
			[optionKey]: params.apiKey,
			secretInputMode: "plaintext"
		},
		runtime: isolatedRuntime,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		resolveApiKey: async (input) => typeof input.flagValue === "string" && input.flagValue.trim() ? {
			key: input.flagValue.trim(),
			source: "flag"
		} : null,
		toApiKeyCredential: ({ provider, resolved, email, metadata }) => ({
			type: "api_key",
			provider,
			key: resolved.key,
			...email ? { email } : {},
			...metadata ? { metadata } : {}
		})
	});
	if (!configured) throw new Error(methodError || "Provider setup did not produce a configuration.");
	const store = require_persisted.loadPersistedAuthProfileStore(params.agentDir);
	const profiles = Object.entries(store?.profiles ?? {}).map(([profileId, credential]) => ({
		profileId,
		credential
	}));
	const previousModel = require_model_input.resolveAgentModelPrimaryValue(params.config.agents?.defaults?.model);
	const configuredModel = require_model_input.resolveAgentModelPrimaryValue(configured.agents?.defaults?.model);
	const configuredProvider = configuredModel ? parseRef(configuredModel).provider : void 0;
	const configuredModelOwnedByProvider = configuredProvider !== void 0 && require_model_selection_normalize.normalizeProviderId(configuredProvider) === require_model_selection_normalize.normalizeProviderId(params.choice.providerId);
	const defaultModel = configuredModel && (configuredModel !== previousModel || configuredModelOwnedByProvider) ? configuredModel : params.method.starterModel;
	if (profiles.length === 0 || !defaultModel) throw new Error("Provider setup did not produce credentials and a starter model.");
	return {
		result: {
			profiles,
			defaultModel
		},
		config: configured
	};
}
/**
* Test one candidate with a real completion, then persist it as the setup
* default. Manual credentials are tested from a temporary auth store and
* copied into the real agent store only after success. A managed Codex install
* record may remain after a failed probe because the installed package already exists.
*/
async function activateSetupInference(params) {
	try {
		const result = await activateSetupInferenceUnredacted(params);
		if (result.ok) return {
			...result,
			lines: await Promise.all(result.lines.map((line) => redactSetupInferenceError(line, params.apiKey)))
		};
		return {
			...result,
			error: await redactSetupInferenceError(result.error, params.apiKey)
		};
	} catch (error) {
		const redacted = await redactSetupInferenceError(error instanceof Error ? error.message : String(error), params.apiKey);
		if (error instanceof SetupInferenceCancelledError || params.signal?.aborted) return {
			ok: false,
			status: "unavailable",
			error: "Provider login was cancelled."
		};
		if (error instanceof SetupInferenceActivationUnavailableError) return {
			ok: false,
			status: "unavailable",
			error: redacted
		};
		if (error instanceof SetupInferenceActivationIndeterminateError) throw new SetupInferenceActivationIndeterminateError(redacted);
		throw new Error(redacted);
	}
}
async function activateSetupInferenceUnredacted(params) {
	const deps = params.deps ?? {};
	const readSnapshot = deps.readConfigFileSnapshot ?? (await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports)).readConfigFileSnapshot;
	const snapshot = await readSnapshot();
	if (snapshot.exists && !snapshot.valid) throw new Error(invalidSetupConfigError(snapshot));
	const cfg = snapshot.exists ? snapshot.runtimeConfig ?? snapshot.config : {};
	const sourceCfg = snapshot.exists ? snapshot.sourceConfig ?? snapshot.config : {};
	const workspace = params.workspace?.trim() ? require_home_dir.resolveUserPath(params.workspace) : (await resolveSetupInferenceWorkspace({
		configExists: snapshot.exists,
		configValid: snapshot.valid
	})).workspace;
	const tempDir = await (deps.createTempDir ?? (() => node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-setup-inference-"))))();
	const testAgentDir = node_path.default.join(tempDir, "agent");
	let pendingCodexInstall;
	let codexInstallOwnership = "unknown";
	let codexRegistryNeedsReload = false;
	let codexRegistryReloaded = false;
	try {
		const plan = await buildTestPlan({
			kind: params.kind,
			...params.modelRef !== void 0 ? { modelRef: params.modelRef } : {},
			...params.authChoice !== void 0 ? { authChoice: params.authChoice } : {},
			...params.apiKey !== void 0 ? { apiKey: params.apiKey } : {},
			cfg,
			sourceCfg,
			workspaceDir: tempDir,
			pluginWorkspaceDir: workspace,
			agentDir: testAgentDir,
			runtime: params.runtime,
			...params.prompter ? { prompter: params.prompter } : {},
			...params.signal ? { signal: params.signal } : {},
			...params.isCancelled ? { isCancelled: params.isCancelled } : {},
			...params.kind === "provider-auth" ? { isRemoteProviderAuth: params.surface === "gateway" } : {},
			deps
		});
		if ("error" in plan) return {
			ok: false,
			status: "unavailable",
			error: plan.error
		};
		const hasPreparedAuthProfiles = (plan.manualAuth?.profiles.length ?? 0) > 0;
		let testPlan = plan;
		if (plan.persistModelRef) {
			const agentRuntimeId = resolveSetupAgentRuntimeId(params.kind);
			const stagedConfig = await require_setup_apply.applySystemAgentModelSelection({
				config: plan.config,
				model: plan.persistModelRef,
				...agentRuntimeId ? { agentRuntimeId } : {},
				...plan.manualAuth && plan.authProfileId ? { authProfileId: plan.authProfileId } : {}
			});
			testPlan = {
				...plan,
				config: stagedConfig,
				routeAgentId: require_agent_scope_config.resolveDefaultAgentId(stagedConfig)
			};
		}
		let codexPluginPatch;
		if (params.kind === "codex-cli") {
			const { stripPendingPluginInstallRecords } = await Promise.resolve().then(() => require("./install-record-commit-BUsKCeHe.cjs")).then((n) => n.install_record_commit_exports);
			const codexInstallBase = stripPendingPluginInstallRecords(testPlan.config);
			const enabledCodexBase = require_enable.enablePluginInConfig(require_config_state.normalizePluginTargetConfig(codexInstallBase, "codex"), "codex");
			if (!enabledCodexBase.enabled) return {
				ok: false,
				status: "unavailable",
				error: `Could not enable the Codex runtime plugin: ${enabledCodexBase.reason ?? "plugin disabled"}.`
			};
			const ensured = await (deps.ensureCodexRuntimePlugin ?? (await Promise.resolve().then(() => require("./codex-runtime-plugin-install-DDX1lxok.cjs"))).ensureCodexRuntimePluginForModelSelection)({
				cfg: enabledCodexBase.config,
				model: plan.modelRef,
				agentId: testPlan.routeAgentId,
				prompter: require_setup_apply.createQuickstartNotePrompter(params.runtime),
				runtime: params.runtime,
				workspaceDir: tempDir
			});
			if (!ensured.installed) return {
				ok: false,
				status: ensured.status === "timed_out" ? "timeout" : "unavailable",
				error: ensured.status === "timed_out" ? "Codex runtime plugin installation timed out. Try again." : ensured.reason ? `Could not enable the Codex runtime plugin: ${ensured.reason}.` : "Could not install the Codex runtime plugin. Try again once the plugin is available."
			};
			codexRegistryNeedsReload = true;
			pendingCodexInstall = ensured.cfg.plugins?.installs?.codex;
			if (pendingCodexInstall) {
				if (!await retainUnownedCodexInstall({
					record: pendingCodexInstall,
					verifyOwnership: false,
					deps
				})) return {
					ok: false,
					status: "unavailable",
					error: "Could not retain the staged Codex runtime safely. No inference route was changed; retry after checking the plugin storage directory."
				};
			}
			const enabledCodex = require_enable.enablePluginInConfig(configureCodexCliPreparedAuth(require_config_state.normalizePluginTargetConfig(ensured.cfg, "codex")), "codex");
			if (!enabledCodex.enabled) return {
				ok: false,
				status: "unavailable",
				error: `Could not enable the Codex runtime plugin: ${enabledCodex.reason ?? "plugin disabled"}.`
			};
			const stagedCodexConfig = enabledCodex.config;
			codexPluginPatch = require_io.createMergePatch(codexInstallBase, stripPendingPluginInstallRecords(stagedCodexConfig));
			testPlan = {
				...testPlan,
				config: stagedCodexConfig
			};
			const refreshPluginRegistry = deps.refreshPluginRegistryAfterConfigMutation ?? (await Promise.resolve().then(() => require("./registry-refresh-B3eSyFEy.cjs")).then((n) => n.registry_refresh_exports)).refreshPluginRegistryAfterConfigMutation;
			let registryRefreshWarning;
			await refreshPluginRegistry({
				config: testPlan.config,
				reason: "source-changed",
				workspaceDir: workspace,
				policyPluginIds: ["codex"],
				traceCommand: "operator-setup-probe",
				logger: { warn: (message) => registryRefreshWarning = message }
			});
			const ensureHarnessPlugin = deps.ensureSelectedAgentHarnessPlugin ?? (await Promise.resolve().then(() => require("./runtime-plugin-9QTLb6UB.cjs")).then((n) => n.runtime_plugin_exports)).ensureSelectedAgentHarnessPlugin;
			try {
				await ensureHarnessPlugin({
					provider: testPlan.provider,
					modelId: testPlan.model,
					config: testPlan.config,
					agentId: testPlan.routeAgentId,
					agentHarnessRuntimeOverride: "codex",
					workspaceDir: tempDir
				});
			} catch (error) {
				const loadError = `Could not load the Codex runtime plugin: ${require_errors.formatErrorMessage(error)}`;
				return {
					ok: false,
					status: "unavailable",
					error: registryRefreshWarning ? `${registryRefreshWarning} ${loadError}` : loadError
				};
			}
		}
		const baselineRoute = await require_inference_route.projectDefaultInferenceRoute(cfg);
		const verifiedRoute = await require_inference_route.projectDefaultInferenceRoute(testPlan.config);
		const stagedRoute = verifiedRoute.route;
		const stagedExecutionRoute = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(testPlan.config);
		if (!stagedRoute || !stagedExecutionRoute || stagedRoute.runner !== testPlan.runner || stagedRoute.provider !== testPlan.provider || stagedRoute.model !== testPlan.model || stagedRoute.modelLabel !== plan.modelRef || plan.authProfileId && stagedRoute.authProfileId !== plan.authProfileId) return {
			ok: false,
			status: "unavailable",
			error: "The staged default-agent route does not match the requested inference candidate. Review model runtime policy and retry."
		};
		const baselineTargetModelMetadata = projectSetupTargetModelMetadata(cfg, stagedRoute.modelLabel);
		const sourceTargetModelMetadata = projectSetupTargetModelMetadata(sourceCfg, stagedRoute.modelLabel);
		if (testPlan.runner === "embedded" && stagedRoute.runner === "embedded") testPlan = {
			...testPlan,
			config: stagedExecutionRoute.runConfig,
			agentDir: hasPreparedAuthProfiles ? testAgentDir : stagedRoute.agentDir,
			agentHarnessRuntimeOverride: stagedRoute.agentHarnessRuntimeOverride
		};
		else testPlan = {
			...testPlan,
			config: stagedExecutionRoute.runConfig,
			...!hasPreparedAuthProfiles ? { agentDir: stagedRoute.agentDir } : {}
		};
		if (hasPreparedAuthProfiles && plan.manualAuth) {
			if ((await persistManualAuthProfiles({
				profiles: plan.manualAuth.profiles,
				agentDir: testAgentDir,
				deps
			})).status !== "persisted") return {
				ok: false,
				status: "unknown",
				error: "Could not stage the credential for its live inference test; try again in a moment."
			};
		}
		let stagedOwnerPluginArtifacts;
		try {
			stagedOwnerPluginArtifacts = (deps.captureSystemAgentOwnerPluginArtifacts ?? require_verified_inference.captureSystemAgentOwnerPluginArtifacts)({
				config: stagedExecutionRoute.runConfig,
				executionRoute: stagedExecutionRoute,
				deps
			});
		} catch {
			return {
				ok: false,
				status: "unavailable",
				error: "Could not bind the staged inference plugin runtime. Refresh or reinstall the plugin and retry."
			};
		}
		if (params.signal?.aborted || params.isCancelled?.()) return {
			ok: false,
			status: "unavailable",
			error: "Provider login was cancelled."
		};
		let test;
		try {
			test = await runSetupInferenceTest({
				plan: testPlan,
				tempDir,
				deps,
				authProfileStateMode: "read-only",
				requireExecutionOwner: true,
				...params.signal ? { signal: params.signal } : {}
			});
			throwIfSetupInferenceCancelled(params);
		} catch (error) {
			if (error instanceof SetupInferenceCancelledError || params.signal?.aborted) return {
				ok: false,
				status: "unavailable",
				error: "Provider login was cancelled."
			};
			throw error;
		}
		if (!test.ok) return test;
		if (plan.authProfileId && test.auth.authProfileId !== plan.authProfileId) return {
			ok: false,
			status: "auth",
			error: `The inference run used profile "${test.auth.authProfileId ?? "unknown"}" instead of the configured profile "${plan.authProfileId}". No model or credential route was saved.`
		};
		const needsPersistence = plan.persistModelRef !== void 0 || plan.manualAuth !== void 0 || codexPluginPatch !== void 0 || pendingCodexInstall !== void 0;
		if (!test.auth.authFingerprint && (!test.auth.runtimeOwnerFingerprint || !test.auth.runtimeOwnerKind || !test.auth.runtimeOwnerId?.trim())) return {
			ok: false,
			status: "unknown",
			error: "Inference succeeded, but its runtime did not report an owner that Operator can safely reuse. No model or credential route was saved."
		};
		if (testPlan.runner === "cli" && (!test.auth.runtimeArtifactFingerprint || !test.auth.runtimeArtifactId?.trim())) return {
			ok: false,
			status: "unknown",
			error: "Inference succeeded, but its CLI executable/package artifact could not be safely reused. No model or credential route was saved."
		};
		if (testPlan.runner === "embedded") {
			const successfulHarnessId = test.auth.agentHarnessId?.trim();
			if (!successfulHarnessId || testPlan.agentHarnessRuntimeOverride !== "auto" && successfulHarnessId !== testPlan.agentHarnessRuntimeOverride) return {
				ok: false,
				status: "unknown",
				error: "Inference succeeded, but its exact agent harness could not be safely reused. No model or credential route was saved."
			};
			if (successfulHarnessId !== "@gabrielvfonseca/operator" && (test.auth.runtimeOwnerKind !== "plugin-harness" || test.auth.runtimeOwnerId?.trim() !== successfulHarnessId || !test.auth.runtimeArtifactFingerprint || !test.auth.runtimeArtifactId?.trim())) return {
				ok: false,
				status: "unknown",
				error: "Inference succeeded, but its agent harness artifact could not be safely reused. No model or credential route was saved."
			};
		}
		let committedConfig;
		if (!needsPersistence) {
			const latestSnapshot = await readSnapshot();
			const latestRuntime = latestSnapshot.exists && latestSnapshot.valid ? latestSnapshot.runtimeConfig ?? latestSnapshot.config : void 0;
			const latestRoute = latestRuntime ? await require_inference_route.projectDefaultInferenceRoute(latestRuntime) : void 0;
			if (!latestRoute || !require_inference_route.sameDefaultInferenceRoute(latestRoute, verifiedRoute)) return {
				ok: false,
				status: "unknown",
				error: "The default-agent inference route changed during its live test. Review the current model/auth/runtime settings and retry."
			};
			const latestResolvedRoute = latestRuntime ? await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(latestRuntime) : null;
			if (!latestResolvedRoute) return {
				ok: false,
				status: "unknown",
				error: "The default-agent inference route could not be resolved after its live test. Review the current model/auth/runtime settings and retry."
			};
			try {
				if (!hasSameOwnerPluginArtifacts(await revalidateSetupInferenceOwner({
					route: latestResolvedRoute,
					auth: test.auth,
					deps
				}), stagedOwnerPluginArtifacts)) throw new Error("inference owner plugin runtime changed during its live test");
			} catch {
				return {
					ok: false,
					status: "auth",
					error: "The verified inference owner changed before activation completed. Retry the inference check."
				};
			}
		}
		if (needsPersistence) {
			const { stripPendingPluginInstallRecords } = await Promise.resolve().then(() => require("./install-record-commit-BUsKCeHe.cjs")).then((n) => n.install_record_commit_exports);
			const agentRuntimeId = resolveSetupAgentRuntimeId(params.kind);
			const selectModel = plan.persistModelRef ? await require_setup_apply.createSystemAgentModelSelectionUpdater({
				model: plan.persistModelRef,
				...agentRuntimeId ? { agentRuntimeId } : {},
				...plan.manualAuth && plan.authProfileId ? { authProfileId: plan.authProfileId } : {}
			}) : void 0;
			const stageCandidate = (current, configKind) => {
				let next = codexPluginPatch === void 0 ? current : stripPendingPluginInstallRecords(current);
				if (plan.manualAuth) next = applyManualAuthConfig(next, plan.manualAuth, configKind, deps.enablePluginInConfig ?? require_enable.enablePluginInConfig);
				if (codexPluginPatch !== void 0) {
					const enabledCodex = require_enable.enablePluginInConfig(require_config_state.normalizePluginTargetConfig(require_io.applyMergePatch(next, codexPluginPatch), "codex"), "codex");
					if (!enabledCodex.enabled) throw new SetupInferenceActivationUnavailableError(`Could not enable the Codex runtime plugin: ${enabledCodex.reason ?? "plugin disabled"}.`);
					next = enabledCodex.config;
				}
				next = selectModel ? selectModel(next) : next;
				if (!pendingCodexInstall) return next;
				return {
					...next,
					plugins: {
						...next.plugins,
						installs: { codex: pendingCodexInstall }
					}
				};
			};
			const persistedRoute = pendingCodexInstall ? await require_inference_route.projectDefaultInferenceRoute(stripPendingPluginInstallRecords(stageCandidate(cfg, "runtime"))) : verifiedRoute;
			const expectedSourceCandidateRoute = await require_inference_route.projectDefaultInferenceRoute(stageCandidate(sourceCfg, "source"));
			const transformConfig = deps.transformConfigWithPendingPluginInstalls ?? (await Promise.resolve().then(() => require("./install-record-commit-BUsKCeHe.cjs")).then((n) => n.install_record_commit_exports)).transformConfigWithPendingPluginInstalls;
			let manualAuthReceipt;
			if (hasPreparedAuthProfiles && plan.manualAuth) {
				throwIfSetupInferenceCancelled(params);
				const initialCandidate = stageCandidate(cfg, "runtime");
				const initialRoute = await require_inference_route.projectDefaultInferenceRoute(initialCandidate);
				const resolvedRoute = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(initialCandidate);
				if (!require_inference_route.sameDefaultInferenceRoute(initialRoute, verifiedRoute) || !resolvedRoute || resolvedRoute.modelLabel !== plan.modelRef || resolvedRoute.authProfileId !== plan.authProfileId) throw new Error("The default-agent inference route changed during its live test, so the verified credential was not saved. Review the current model/auth/runtime settings and retry.");
				const persistedManualAuth = await persistManualAuthProfiles({
					profiles: plan.manualAuth.profiles,
					agentDir: resolvedRoute.agentDir,
					deps
				});
				if (persistedManualAuth.status === "unknown") {
					if (await rollbackManualAuthProfiles(persistedManualAuth.receipt, deps)) return {
						ok: false,
						status: "unknown",
						error: "Could not confirm the credential write, so it was rolled back. Try again in a moment."
					};
					throw new SetupInferenceActivationIndeterminateError("Inference activation could not confirm whether its verified credential was saved or rolled back. No config commit was attempted; run openclaw doctor --fix before retrying.");
				}
				if (persistedManualAuth.status === "not-persisted") return {
					ok: false,
					status: "unknown",
					error: "Could not save the verified credential; try again in a moment."
				};
				manualAuthReceipt = persistedManualAuth.receipt;
			}
			let commitMayHaveStarted = false;
			try {
				throwIfSetupInferenceCancelled(params);
				committedConfig = (await transformConfig({
					base: "source",
					afterWrite: {
						mode: "none",
						reason: "Operator activates verified inference"
					},
					transform: async (current, context) => {
						const latestRuntime = context.snapshot.runtimeConfig ?? context.snapshot.config;
						const stagedRuntime = stageCandidate(latestRuntime, "runtime");
						if (!require_inference_route.sameDefaultInferenceRoute(await require_inference_route.projectDefaultInferenceRoute(latestRuntime), baselineRoute)) throw new Error("The default-agent inference route changed during its live test, so the verified candidate was not saved. Review the current model/auth/runtime settings and retry.");
						if (!(0, node_util.isDeepStrictEqual)(projectSetupTargetModelMetadata(latestRuntime, stagedRoute.modelLabel), baselineTargetModelMetadata)) throw new Error("The target model metadata changed during its live inference test, so the verified candidate was not saved. Review the current model settings and retry.");
						if (!require_inference_route.sameDefaultInferenceRoute(await require_inference_route.projectDefaultInferenceRoute(stagedRuntime), verifiedRoute)) throw new Error("The default-agent inference route changed during its live test, so the verified candidate was not saved. Review the current model/auth/runtime settings and retry.");
						const resolvedRoute = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(stagedRuntime);
						if (!resolvedRoute || resolvedRoute.modelLabel !== plan.modelRef || plan.authProfileId && resolvedRoute.authProfileId !== plan.authProfileId) throw new Error("The latest default-agent route no longer matches the verified candidate, so it was not saved. Review the current config and retry.");
						if (!(0, node_util.isDeepStrictEqual)(projectSetupTargetModelMetadata(current, stagedRoute.modelLabel), sourceTargetModelMetadata)) throw new Error("The authored target model metadata changed during its live inference test, so the verified candidate was not saved. Review the current model settings and retry.");
						const nextConfig = stageCandidate(current, "source");
						const nextRouteProjection = await require_inference_route.projectDefaultInferenceRoute(nextConfig);
						const nextResolvedRoute = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(nextConfig);
						if (!require_inference_route.sameDefaultInferenceRoute(nextRouteProjection, expectedSourceCandidateRoute) || !nextResolvedRoute || nextResolvedRoute.modelLabel !== plan.modelRef || plan.authProfileId && nextResolvedRoute.authProfileId !== plan.authProfileId) throw new Error("The source config no longer matches the verified candidate, so it was not saved. Review the current config and retry.");
						if (!hasSameOwnerPluginArtifacts(await revalidateSetupInferenceOwner({
							route: nextResolvedRoute,
							auth: test.auth,
							deps
						}), stagedOwnerPluginArtifacts)) throw new Error("inference owner plugin runtime changed during its live test");
						throwIfSetupInferenceCancelled(params);
						params.onCommitStarted?.();
						commitMayHaveStarted = true;
						return { nextConfig };
					}
				})).nextConfig;
				if (pendingCodexInstall) codexInstallOwnership = "owned";
			} catch (error) {
				if (!commitMayHaveStarted) {
					if (manualAuthReceipt) {
						if (!await rollbackManualAuthProfiles(manualAuthReceipt, deps)) throw new SetupInferenceActivationIndeterminateError("Inference activation stopped before its config commit, but could not confirm removal of its staged credential. Run openclaw doctor --fix before retrying.");
					}
					throw error;
				}
				const reconciledSnapshot = await readSnapshot().catch(() => null);
				const reconciledRuntime = reconciledSnapshot?.exists && reconciledSnapshot.valid ? reconciledSnapshot.runtimeConfig ?? reconciledSnapshot.config : void 0;
				const reconciledRoute = reconciledRuntime ? await require_inference_route.projectDefaultInferenceRoute(reconciledRuntime) : void 0;
				const codexInstallPersisted = pendingCodexInstall ? await isCodexInstallRecordPersisted(pendingCodexInstall, deps) : true;
				const committedDespiteError = reconciledRoute !== void 0 && require_inference_route.sameDefaultInferenceRoute(reconciledRoute, persistedRoute) && (!manualAuthReceipt || manualAuthProfilesPersisted(manualAuthReceipt, deps)) && codexInstallPersisted;
				if (pendingCodexInstall) codexInstallOwnership = committedDespiteError ? "owned" : "unowned";
				if (!committedDespiteError) {
					if (manualAuthReceipt) {
						if (!reconciledRuntime || configReferencesManualAuthProfiles(reconciledRuntime, manualAuthReceipt)) throw new SetupInferenceActivationIndeterminateError("Inference activation could not confirm its config commit state. The verified credential was retained because the current config may reference it. Run openclaw doctor --fix before retrying.");
						if (!await rollbackManualAuthProfiles(manualAuthReceipt, deps)) throw new SetupInferenceActivationIndeterminateError("Inference activation failed and its staged credential could not be rolled back. Run openclaw doctor --fix before retrying.");
					}
					throw error;
				}
				committedConfig = reconciledSnapshot?.sourceConfig ?? reconciledRuntime;
				log.warn("Inference activation committed successfully despite a post-write cleanup error.");
			}
		}
		if (codexRegistryNeedsReload && committedConfig) {
			codexRegistryReloaded = await reloadCodexRegistryAfterActivation({
				readSnapshot,
				workspaceDir: workspace,
				deps
			});
			if (!codexRegistryReloaded) throw new SetupInferenceActivationIndeterminateError("Inference activation committed, but the active plugin registry could not be reloaded. Restart the Gateway before using Codex inference.");
		}
		let lines = [`Inference verified: ${plan.modelRef}`];
		if (params.surface === "gateway" && params.recordSetupAudit !== false) {
			const after = await readSnapshot().catch(() => null);
			try {
				await require_audit.appendSystemAgentAuditEntry({
					operation: "operator.setup",
					summary: "Verified and configured AI access through Operator setup",
					configPath: after?.path ?? snapshot.path,
					configHashBefore: snapshot.hash ?? null,
					configHashAfter: after?.hash ?? null,
					details: {
						modelRef: plan.modelRef,
						inferenceKind: params.kind
					}
				});
			} catch (error) {
				const warning = `Inference setup completed, but Operator could not record its audit entry: ${require_errors.formatErrorMessage(error)}`;
				params.runtime.error?.(warning);
				lines = [...lines, warning];
			}
		}
		return {
			ok: true,
			modelRef: plan.modelRef,
			latencyMs: test.latencyMs,
			lines
		};
	} finally {
		let codexCleanupError;
		if (pendingCodexInstall && codexInstallOwnership !== "owned") {
			if (!await retainUnownedCodexInstall({
				record: pendingCodexInstall,
				verifyOwnership: false,
				deps
			})) codexCleanupError = new SetupInferenceActivationIndeterminateError("Inference activation stopped before its Codex runtime package could be retained safely. Restart the Gateway before retrying.");
		}
		if (codexRegistryNeedsReload && !codexRegistryReloaded) {
			codexRegistryReloaded = await reloadCodexRegistryAfterActivation({
				readSnapshot,
				workspaceDir: workspace,
				deps
			});
			if (!codexRegistryReloaded) codexCleanupError = new SetupInferenceActivationIndeterminateError("Inference activation could not restore the active plugin registry after its Codex probe. Restart the Gateway before retrying.");
		}
		await cleanupSetupInferenceTempDir({
			tempDir,
			deps,
			runtime: params.runtime
		});
		if (codexCleanupError) throw codexCleanupError;
	}
}
async function redactSetupInferenceError(message, apiKey) {
	const secrets = new Set([apiKey, apiKey?.trim()].filter((value) => Boolean(value)));
	let redacted = message;
	for (const secret of Array.from(secrets).toSorted((a, b) => b.length - a.length)) redacted = redacted.split(secret).join("[redacted]");
	const { redactToolPayloadText } = await Promise.resolve().then(() => require("./redact-Bg-yc44I.cjs")).then((n) => n.redact_exports);
	return redactToolPayloadText(redacted);
}
function hasSameOwnerPluginArtifacts(binding, snapshot) {
	return (0, node_util.isDeepStrictEqual)(binding.ownerPluginIds, snapshot.ownerPluginIds) && (0, node_util.isDeepStrictEqual)(binding.ownerPluginArtifacts, snapshot.ownerPluginArtifacts);
}
async function verifySetupInference(params) {
	const readSnapshot = {
		...params.deps,
		...params.timeoutMs !== void 0 ? { timeoutMs: params.timeoutMs } : {}
	}.readConfigFileSnapshot ?? (await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports)).readConfigFileSnapshot;
	const snapshot = await readSnapshot();
	if (!snapshot.exists) return {
		ok: false,
		status: "unavailable",
		error: "No Operator config exists. Run `openclaw onboard` first."
	};
	if (!snapshot.valid) return {
		ok: false,
		status: "format",
		error: invalidSetupConfigError(snapshot)
	};
	const cfg = snapshot.runtimeConfig ?? snapshot.config;
	const baselineRoute = await require_inference_route.projectInferenceRoute(cfg, params.agentId);
	let verifiedBinding;
	const verification = await verifySetupInferenceConfig({
		config: cfg,
		runtime: params.runtime,
		requireExecutionOwner: params.bindSession === true,
		...params.agentId ? { agentId: params.agentId } : {},
		...params.timeoutMs !== void 0 ? { timeoutMs: params.timeoutMs } : {},
		...params.deps ? { deps: params.deps } : {},
		...params.bindSession ? { onVerifiedExecution: (_auth, binding) => {
			verifiedBinding = binding;
		} } : {}
	});
	if (!verification.ok) return verification;
	const latestSnapshot = await readSnapshot().catch(() => null);
	const latestConfig = latestSnapshot?.exists && latestSnapshot.valid ? latestSnapshot.runtimeConfig ?? latestSnapshot.config : void 0;
	const latestRoute = latestConfig ? await require_inference_route.projectInferenceRoute(latestConfig, params.agentId) : void 0;
	if (!latestRoute || !require_inference_route.sameDefaultInferenceRoute(baselineRoute, latestRoute)) return {
		ok: false,
		status: "unknown",
		error: "The inference route changed during its live test. Review current model/auth/runtime settings and retry."
	};
	if (!params.bindSession) return verification;
	if (!await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(cfg, params.agentId) || !verifiedBinding) return {
		ok: false,
		status: "unknown",
		error: "The successful inference run did not report an exact execution binding. Retry setup before starting Operator."
	};
	return {
		...verification,
		binding: verifiedBinding
	};
}
function executionRouteIdentity(route) {
	const { runConfig: _runConfig, ...identity } = route;
	return identity;
}
/**
* Strict credentials need only the static owner check. Opaque runtimes can
* prove liveness only by completing another exact turn at the side-effect
* boundary; the result must still be the original frozen route.
*/
async function resolvePersistentApplyInference(params) {
	const deps = params.deps ?? {};
	const resolveVerified = deps.resolveVerifiedInferenceRoute ?? require_verified_inference.resolveSystemAgentVerifiedInferenceRoute;
	const initialRoute = await resolveVerified(params.binding, deps);
	if (!initialRoute) return null;
	const hasCurrentOwnerPluginArtifacts = deps.hasCurrentOwnerPluginArtifacts ?? require_verified_inference.hasCurrentSystemAgentOwnerPluginArtifacts;
	if (!await hasCurrentOwnerPluginArtifacts(params.binding, deps)) return null;
	if (params.binding.auth.proofKind !== "runtime-owner") return initialRoute;
	const live = await (deps.verifyBoundInference ?? verifySetupInference)({
		runtime: params.runtime,
		bindSession: true,
		agentId: params.binding.execution.agentId,
		deps
	});
	if (!live.ok || !(0, node_util.isDeepStrictEqual)(live.binding.configuredRoute, params.binding.configuredRoute) || !(0, node_util.isDeepStrictEqual)(executionRouteIdentity(live.binding.execution), executionRouteIdentity(params.binding.execution)) || !(0, node_util.isDeepStrictEqual)(live.binding.executionFingerprint, params.binding.executionFingerprint) || !(0, node_util.isDeepStrictEqual)(live.binding.ownerPluginIds, params.binding.ownerPluginIds) || !(0, node_util.isDeepStrictEqual)(live.binding.ownerPluginArtifacts, params.binding.ownerPluginArtifacts) || !(0, node_util.isDeepStrictEqual)(live.binding.auth, params.binding.auth)) return null;
	const finalRoute = await resolveVerified(params.binding, deps);
	if (!finalRoute || !await hasCurrentOwnerPluginArtifacts(params.binding, deps)) return null;
	return finalRoute;
}
/** Live-test a staged default-agent route before any caller persists it. */
async function verifySetupInferenceConfig(params) {
	const deps = {
		...params.deps,
		...params.timeoutMs !== void 0 ? { timeoutMs: params.timeoutMs } : {}
	};
	const cfg = params.config;
	const routeAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
	if (!require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, routeAgentId)) return {
		ok: false,
		status: "unavailable",
		error: "No agent model is configured. Run `openclaw onboard` first."
	};
	const tempDir = await (deps.createTempDir ?? (() => node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-setup-inference-"))))();
	try {
		const plan = await buildTestPlan({
			kind: "existing-model",
			cfg,
			sourceCfg: cfg,
			workspaceDir: tempDir,
			pluginWorkspaceDir: tempDir,
			agentDir: node_path.default.join(tempDir, "agent"),
			runtime: params.runtime,
			routeAgentId,
			deps
		});
		if ("error" in plan) return {
			ok: false,
			status: "unavailable",
			error: plan.error
		};
		const requiresExecutionOwner = params.requireExecutionOwner === true || params.onVerifiedExecution !== void 0;
		let configuredRoute;
		let stagedOwnerPluginArtifacts;
		if (requiresExecutionOwner) {
			configuredRoute = await require_inference_route.resolveSystemAgentConfiguredRouteFromConfig(cfg, routeAgentId) ?? void 0;
			if (!configuredRoute) return {
				ok: false,
				status: "unknown",
				error: "The verified inference route could not be resolved for owner validation."
			};
			try {
				stagedOwnerPluginArtifacts = (deps.captureSystemAgentOwnerPluginArtifacts ?? require_verified_inference.captureSystemAgentOwnerPluginArtifacts)({
					config: cfg,
					executionRoute: configuredRoute,
					deps
				});
			} catch {
				return {
					ok: false,
					status: "unavailable",
					error: "Could not bind the configured inference plugin runtime. Refresh or reinstall the plugin and retry."
				};
			}
		}
		let test = await runSetupInferenceTest({
			plan,
			tempDir,
			deps,
			authProfileStateMode: "read-only",
			requireExecutionOwner: requiresExecutionOwner
		});
		if (test.ok) {
			const verifiedProfileId = test.auth.authProfileId;
			if (plan.authProfileId && verifiedProfileId !== plan.authProfileId) return {
				ok: false,
				status: "auth",
				error: `The inference run used profile "${verifiedProfileId ?? "unknown"}" instead of the configured profile "${plan.authProfileId}".`
			};
			if (params.onVerifiedExecution && !plan.authProfileId && verifiedProfileId) {
				test = await runSetupInferenceTest({
					plan: {
						...plan,
						authProfileId: verifiedProfileId
					},
					tempDir,
					deps,
					authProfileStateMode: "read-only",
					requireExecutionOwner: true
				});
				if (!test.ok) return {
					...test,
					error: await redactSetupInferenceError(test.error)
				};
				if (test.auth.authProfileId !== verifiedProfileId) return {
					ok: false,
					status: "auth",
					error: "The selected inference credential changed during its locked verification."
				};
			}
			if (params.requireExecutionOwner || params.onVerifiedExecution) try {
				const binding = await revalidateSetupInferenceOwner({
					route: configuredRoute,
					auth: test.auth,
					deps
				});
				if (!stagedOwnerPluginArtifacts || !hasSameOwnerPluginArtifacts(binding, stagedOwnerPluginArtifacts)) throw new Error("inference owner plugin runtime changed during its live test");
				params.onVerifiedExecution?.(test.auth, binding);
			} catch {
				return {
					ok: false,
					status: "auth",
					error: "The verified inference owner changed before validation completed. Retry the inference check."
				};
			}
			return {
				ok: true,
				latencyMs: test.latencyMs,
				modelRef: plan.modelRef
			};
		}
		return {
			...test,
			error: await redactSetupInferenceError(test.error)
		};
	} finally {
		await cleanupSetupInferenceTempDir({
			tempDir,
			deps,
			runtime: params.runtime
		});
	}
}
async function cleanupSetupInferenceTempDir(params) {
	try {
		(params.deps.disposeOperatorAgentDatabaseByPath ?? (await Promise.resolve().then(() => require("./openclaw-agent-db-CMNDs1oU.cjs")).then((n) => n.openclaw_agent_db_exports)).disposeOperatorAgentDatabaseByPath)(node_path.default.join(params.tempDir, "agent", "operator-agent.sqlite"));
	} catch {
		log.warn("Could not dispose the temporary inference auth database.");
	}
	try {
		await (params.deps.removeTempDir ?? ((dir) => node_fs_promises.default.rm(dir, {
			recursive: true,
			force: true
		})))(params.tempDir);
	} catch (error) {
		params.runtime?.error?.(`Could not remove temporary AI setup files: ${require_errors.formatErrorMessage(error)}`);
		log.warn("Could not remove the temporary inference test directory.");
	}
}
async function isCodexInstallRecordPersisted(record, deps) {
	try {
		const currentInstallRecords = await (deps.readPersistedInstalledPluginIndexInstallRecords ?? (await Promise.resolve().then(() => require("./installed-plugin-index-records-2CPyZnZe.cjs")).then((n) => n.installed_plugin_index_records_exports)).readPersistedInstalledPluginIndexInstallRecords)();
		return currentInstallRecords !== null && (0, node_util.isDeepStrictEqual)(currentInstallRecords.codex, record);
	} catch {
		return false;
	}
}
async function retainUnownedCodexInstall(params) {
	if (params.verifyOwnership && await isCodexInstallRecordPersisted(params.record, params.deps)) return true;
	if (params.record.source !== "npm" || !params.record.installPath?.trim()) return true;
	try {
		const marked = await (params.deps.markRetainedManagedNpmInstall ?? (await Promise.resolve().then(() => require("./managed-npm-retention-edlbaFsN.cjs")).then((n) => n.managed_npm_retention_exports)).markRetainedManagedNpmInstall)({
			packageDir: params.record.installPath,
			pluginId: "codex",
			reason: "operator-inference-activation-not-committed"
		});
		if (!marked) log.warn("Could not retain the uncommitted Codex runtime package generation.");
		return marked;
	} catch {
		log.warn("Could not retain the uncommitted Codex runtime package generation.");
		return false;
	} finally {
		await clearUnownedCodexInstallCaches(params.deps);
	}
}
async function clearUnownedCodexInstallCaches(deps) {
	try {
		(deps.clearLoadInstalledPluginIndexInstallRecordsCache ?? (await Promise.resolve().then(() => require("./installed-plugin-index-records-2CPyZnZe.cjs")).then((n) => n.installed_plugin_index_records_exports)).clearLoadInstalledPluginIndexInstallRecordsCache)();
	} catch {
		log.warn("Could not clear the plugin install-record cache after failed Codex activation.");
	}
	try {
		(deps.clearPluginMetadataLifecycleCaches ?? (await Promise.resolve().then(() => require("./plugin-metadata-lifecycle-L5oN3AE5.cjs")).then((n) => n.plugin_metadata_lifecycle_exports)).clearPluginMetadataLifecycleCaches)();
	} catch {
		log.warn("Could not clear plugin metadata caches after failed Codex activation.");
	}
	try {
		await (deps.invalidatePluginRuntimeDiscoveryAfterConfigMutation ?? (await Promise.resolve().then(() => require("./registry-refresh-B3eSyFEy.cjs")).then((n) => n.registry_refresh_exports)).invalidatePluginRuntimeDiscoveryAfterConfigMutation)({ logger: log });
	} catch {
		log.warn("Could not clear plugin runtime discovery after failed Codex activation.");
	}
}
async function reloadCodexRegistryAfterActivation(params) {
	let snapshot;
	try {
		snapshot = await params.readSnapshot();
	} catch {
		log.warn("Could not read config while reloading the plugin registry after Codex activation.");
		return false;
	}
	const runtimeConfig = snapshot.exists && snapshot.valid ? snapshot.runtimeConfig ?? snapshot.config : {};
	const sourceConfig = snapshot.exists && snapshot.valid ? snapshot.sourceConfig ?? snapshot.config : {};
	try {
		await (params.deps.refreshPluginRegistryAfterConfigMutation ?? (await Promise.resolve().then(() => require("./registry-refresh-B3eSyFEy.cjs")).then((n) => n.registry_refresh_exports)).refreshPluginRegistryAfterConfigMutation)({
			config: sourceConfig,
			reason: "source-changed",
			workspaceDir: params.workspaceDir,
			logger: log
		});
	} catch {
		log.warn("Could not refresh persisted plugin registry metadata after Codex activation.");
	}
	try {
		(params.deps.ensurePluginRegistryLoaded ?? (await Promise.resolve().then(() => require("./runtime-registry-loader-Bm5Oi--4.cjs")).then((n) => n.runtime_registry_loader_exports)).ensurePluginRegistryLoaded)({
			scope: "all",
			config: runtimeConfig,
			activationSourceConfig: sourceConfig,
			workspaceDir: params.workspaceDir
		});
		return true;
	} catch {
		log.warn("Could not reload the active plugin registry after Codex inference activation.");
		return false;
	}
}
function isMergePatchObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergePatchConflicts(base, current, patch) {
	if (!isMergePatchObject(patch)) return !(0, node_util.isDeepStrictEqual)(base, current);
	const baseIsObject = isMergePatchObject(base);
	const currentIsObject = isMergePatchObject(current);
	if (baseIsObject !== currentIsObject) return true;
	if (!baseIsObject && !currentIsObject && !(0, node_util.isDeepStrictEqual)(base, current)) return true;
	const baseRecord = baseIsObject ? base : {};
	const currentRecord = currentIsObject ? current : {};
	return Object.entries(patch).some(([key, childPatch]) => mergePatchConflicts(baseRecord[key], currentRecord[key], childPatch));
}
function applyManualAuthConfig(config, manualAuth, configKind, enablePlugin = require_enable.enablePluginInConfig) {
	let enabledConfig = config;
	if (manualAuth.pluginId) {
		const enableResult = enablePlugin(config, manualAuth.pluginId);
		if (!enableResult.enabled) throw new Error(`Provider plugin ${manualAuth.pluginId} is ${enableResult.reason}.`);
		enabledConfig = enableResult.config;
	}
	if (mergePatchConflicts(configKind === "runtime" ? manualAuth.runtimeConfigBase : manualAuth.sourceConfigBase, enabledConfig, manualAuth.configPatch)) throw new Error("Provider configuration changed during the live inference test, so the verified credential was not saved. Review the current provider settings and retry.");
	return require_io.applyMergePatch(enabledConfig, manualAuth.configPatch);
}
function modelSelectionReferencesProfile(value, profileIds) {
	if (typeof value === "string") {
		const profile = require_model_ref_profile.splitTrailingAuthProfile(value).profile;
		return profile !== void 0 && profileIds.has(profile);
	}
	if (!isMergePatchObject(value)) return false;
	if (modelSelectionReferencesProfile(value.primary, profileIds)) return true;
	return Array.isArray(value.fallbacks) && value.fallbacks.some((fallback) => modelSelectionReferencesProfile(fallback, profileIds));
}
function configReferencesManualAuthProfiles(config, receipt) {
	const profileIds = new Set(receipt.profiles.map((profile) => profile.profileId));
	if (Object.keys(config.auth?.profiles ?? {}).some((profileId) => profileIds.has(profileId))) return true;
	if (Object.values(config.auth?.order ?? {}).some((order) => order.some((profileId) => profileIds.has(profileId)))) return true;
	if (modelSelectionReferencesProfile(config.agents?.defaults?.model, profileIds)) return true;
	return (config.agents?.list ?? []).some((agent) => modelSelectionReferencesProfile(agent.model, profileIds));
}
function readManualAuthProfiles(receipt, deps) {
	let store;
	try {
		store = (deps.loadPersistedAuthProfileStore ?? require_persisted.loadPersistedAuthProfileStore)(receipt.agentDir);
	} catch {
		return "unknown";
	}
	if (!store) return "unknown";
	if (receipt.profiles.every((profile) => (0, node_util.isDeepStrictEqual)(store.profiles[profile.profileId], profile.credential))) return "present";
	if (receipt.profiles.every((profile) => store.profiles[profile.profileId] === void 0)) return "absent";
	return "mismatch";
}
function manualAuthProfilesPersisted(receipt, deps) {
	return readManualAuthProfiles(receipt, deps) === "present";
}
async function persistManualAuthProfiles(params) {
	const profiles = params.profiles.map((profile) => ({
		profileId: profile.profileId,
		credential: require_profiles.normalizeAuthProfileCredential(profile.credential)
	}));
	const insertedProfileIds = /* @__PURE__ */ new Set();
	const receipt = {
		agentDir: params.agentDir,
		profiles,
		insertedProfileIds
	};
	let collision = false;
	const updated = await (params.deps.updateAuthProfileStoreWithLock ?? require_store.updateAuthProfileStoreWithLock)({
		agentDir: params.agentDir,
		saveOptions: {
			filterExternalAuthProfiles: false,
			syncExternalCli: false
		},
		updater: (store) => {
			let changed = false;
			for (const profile of profiles) {
				const existing = store.profiles[profile.profileId];
				if (existing && !(0, node_util.isDeepStrictEqual)(existing, profile.credential)) {
					collision = true;
					return false;
				}
				if (!existing) {
					store.profiles[profile.profileId] = profile.credential;
					insertedProfileIds.add(profile.profileId);
					changed = true;
				}
			}
			return changed;
		}
	});
	if (collision) return { status: "not-persisted" };
	const readback = readManualAuthProfiles(receipt, params.deps);
	if (updated !== null || readback === "present") return {
		status: "persisted",
		receipt
	};
	return readback === "absent" ? { status: "not-persisted" } : {
		status: "unknown",
		receipt
	};
}
async function rollbackManualAuthProfiles(receipt, deps) {
	if (receipt.insertedProfileIds.size === 0) return true;
	const update = deps.updateAuthProfileStoreWithLock ?? require_store.updateAuthProfileStoreWithLock;
	for (let attempt = 0; attempt < 3; attempt += 1) {
		let updated = null;
		try {
			updated = await update({
				agentDir: receipt.agentDir,
				saveOptions: {
					filterExternalAuthProfiles: false,
					syncExternalCli: false
				},
				updater: (store) => {
					let changed = false;
					for (const profile of receipt.profiles) {
						if (!receipt.insertedProfileIds.has(profile.profileId)) continue;
						if ((0, node_util.isDeepStrictEqual)(store.profiles[profile.profileId], profile.credential)) {
							delete store.profiles[profile.profileId];
							changed = true;
						}
					}
					return changed;
				}
			});
		} catch {}
		if (updated && receipt.profiles.every((profile) => !receipt.insertedProfileIds.has(profile.profileId) || updated.profiles[profile.profileId] === void 0)) return true;
		let persistedStore;
		try {
			persistedStore = (deps.loadPersistedAuthProfileStore ?? require_persisted.loadPersistedAuthProfileStore)(receipt.agentDir);
		} catch {
			persistedStore = null;
		}
		if (persistedStore && receipt.profiles.every((profile) => !receipt.insertedProfileIds.has(profile.profileId) || persistedStore.profiles[profile.profileId] === void 0)) return true;
	}
	return false;
}
async function runSetupInferenceTest(params) {
	const { plan, tempDir, deps, authProfileStateMode, requireExecutionOwner } = params;
	const runId = `probe-setup-inference-${(0, node_crypto.randomUUID)()}`;
	const sessionId = runId;
	const sessionFile = node_path.default.join(tempDir, "session.jsonl");
	const timeoutMs = deps.timeoutMs ?? 9e4;
	const started = Date.now();
	let successfulAuth;
	try {
		if (plan.runner === "cli") {
			const unsupportedError = resolveToolFreeCliSetupError(plan);
			if (unsupportedError) return {
				ok: false,
				status: "unavailable",
				error: unsupportedError
			};
		}
		const strictProfileError = resolveStrictSetupAuthProfileError({
			plan,
			workspaceDir: tempDir,
			deps
		});
		if (strictProfileError) return {
			ok: false,
			status: "auth",
			error: strictProfileError
		};
		let result;
		if (plan.runner === "cli") result = await (deps.runCliAgent ?? (await Promise.resolve().then(() => require("./cli-runner-ZSZWExo3.cjs")).then((n) => n.cli_runner_exports)).runCliAgent)({
			sessionId,
			sessionKey: `temp:setup-inference:${runId}`,
			agentId: plan.agentId ?? "@gabrielvfonseca/operator",
			trigger: "manual",
			sessionFile,
			workspaceDir: tempDir,
			...plan.agentDir ? { agentDir: plan.agentDir } : {},
			config: plan.config,
			prompt: SETUP_INFERENCE_TEST_PROMPT,
			provider: plan.provider,
			model: plan.model,
			...plan.authProfileId ? { authProfileId: plan.authProfileId } : {},
			timeoutMs,
			runId,
			messageChannel: "@gabrielvfonseca/operator",
			messageProvider: "@gabrielvfonseca/operator",
			executionMode: "side-question",
			disableTools: true,
			cleanupCliLiveSessionOnRunEnd: true,
			onSuccessfulAuthBinding: (binding) => {
				successfulAuth = binding;
			},
			...params.signal ? { abortSignal: params.signal } : {}
		});
		else result = await (deps.runEmbeddedAgent ?? (await Promise.resolve().then(() => require("./embedded-agent-C44j1_Yh.cjs")).then((n) => n.embedded_agent_exports)).runEmbeddedAgent)({
			sessionId,
			sessionKey: `temp:setup-inference:${runId}`,
			agentId: plan.agentId ?? "@gabrielvfonseca/operator",
			trigger: "manual",
			sessionFile,
			workspaceDir: tempDir,
			...plan.agentDir ? { agentDir: plan.agentDir } : {},
			config: plan.config,
			prompt: SETUP_INFERENCE_TEST_PROMPT,
			provider: plan.provider,
			model: plan.model,
			...plan.authProfileId ? {
				authProfileId: plan.authProfileId,
				authProfileIdSource: "user"
			} : {},
			authProfileStateMode,
			...plan.cleanupBundleMcpOnRunEnd ? { cleanupBundleMcpOnRunEnd: true } : {},
			...plan.agentHarnessRuntimeOverride ? { agentHarnessRuntimeOverride: plan.agentHarnessRuntimeOverride } : {},
			timeoutMs,
			runId,
			lane: `session:probe-setup-inference:${plan.provider}`,
			thinkLevel: "off",
			reasoningLevel: "off",
			verboseLevel: "off",
			...resolveSetupInferenceProbeStreamParams(plan.agentHarnessRuntimeOverride),
			disableTools: true,
			modelRun: true,
			messageChannel: "@gabrielvfonseca/operator",
			messageProvider: "@gabrielvfonseca/operator",
			onSuccessfulAuthBinding: (binding) => {
				successfulAuth = binding;
			},
			...params.signal ? { abortSignal: params.signal } : {}
		});
		if (params.signal?.aborted) throw new SetupInferenceCancelledError();
		const terminalError = extractRunTerminalError(result);
		if (terminalError) {
			const described = require_failover_error.describeFailoverError(new Error(terminalError));
			return {
				ok: false,
				status: mapFailoverReasonToSetupStatus(described.reason),
				error: described.message
			};
		}
		if (!extractRunText(result)?.trim()) return {
			ok: false,
			status: "format",
			error: "The model started but did not send a reply. Try again or pick another option."
		};
		const winnerError = extractRunWinnerError(plan, result);
		if (winnerError) return {
			ok: false,
			status: "format",
			error: winnerError
		};
		if (requireExecutionOwner && !successfulAuth) return {
			ok: false,
			status: "unknown",
			error: "Inference succeeded, but its runtime did not report an owner that Operator can safely reuse."
		};
		return {
			ok: true,
			latencyMs: Date.now() - started,
			auth: successfulAuth ?? (!requireExecutionOwner && plan.authProfileId ? { authProfileId: plan.authProfileId } : {})
		};
	} catch (error) {
		const described = require_failover_error.describeFailoverError(error);
		return {
			ok: false,
			status: mapFailoverReasonToSetupStatus(described.reason),
			error: described.message
		};
	}
}
//#endregion
exports.activateSetupInference = activateSetupInference;
exports.detectSetupInference = detectSetupInference;
exports.resolvePersistentApplyInference = resolvePersistentApplyInference;
exports.verifySetupInference = verifySetupInference;
exports.verifySetupInferenceConfig = verifySetupInferenceConfig;
