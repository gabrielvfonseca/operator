const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
const require_sensitive_paths = require("./sensitive-paths-JusECImi.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_agent_id = require("./agent-id-nux9kTGp.cjs");
const require_helpers = require("./helpers-D33_rP9K.cjs");
const require_operations = require("./operations-DJFq4EMx.cjs");
const require_system_agent_tool = require("./system-agent-tool-Bu6ZtBRg.cjs");
const require_system_agent_approvals = require("./system-agent-approvals-BRf7F37M.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_approval_shared = require("./approval-shared-D5AOJ_EJ.cjs");
const require_session = require("./session-CJIg2dUE.cjs");
const require_inference_error = require("./inference-error-BEoKlbh6.cjs");
const require_verified_inference = require("./verified-inference-DA_zZ9Fy.cjs");
const require_approval_intent = require("./approval-intent-BJO_PmMk.cjs");
const require_overview = require("./overview-BUkXf7FH.cjs");
const require_onboarding_welcome = require("./onboarding-welcome-9QvBdO8z.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
//#region src/system-agent/agent-turn.ts
/**
* Operator is a real agent: same loop, session transcript, and tool pipeline
* as regular agents — restricted to the single ring-zero `openclaw` tool.
* Embedded runtimes enforce that restriction with toolsAllow. CLI harnesses
* must explicitly support per-run native-tool selection, then receive the tool
* over a dedicated stdio MCP server that replaces the normal bundle surface.
* Turns share one persistent session so the conversation has genuine
* multi-turn memory. Inference setup must succeed before this runner is entered.
*/
const AGENT_TURN_TIMEOUT_MS = 12e4;
const SYSTEM_AGENT_MCP_TOOL_NAME = "mcp__operator__openclaw";
function createSystemAgentSession(verifiedInference) {
	if (!verifiedInference) throw new require_inference_error.SystemAgentInferenceUnavailableError("agent-turn");
	return {
		sessionId: `operator-${(0, node_crypto.randomUUID)()}`,
		verifiedInference,
		proposalRef: {}
	};
}
function extractRunText(result) {
	return result.meta?.finalAssistantVisibleText ?? result.meta?.finalAssistantRawText ?? result.payloads?.map((payload) => payload.text?.trim()).filter(Boolean).join("\n");
}
async function ensureSystemAgentDirs(sessionId) {
	const base = node_path.default.join(require_paths.resolveStateDir(), "@gabrielvfonseca/operator");
	const workspaceDir = node_path.default.join(base, "workspace");
	await node_fs_promises.default.mkdir(workspaceDir, { recursive: true });
	await node_fs_promises.default.mkdir(node_path.default.join(base, "sessions"), { recursive: true });
	return {
		workspaceDir,
		sessionFile: node_path.default.join(base, "sessions", `${sessionId}.jsonl`)
	};
}
async function cleanupSystemAgentSession(session) {
	const sessionFile = node_path.default.join(require_paths.resolveStateDir(), "@gabrielvfonseca/operator", "sessions", `${session.sessionId}.jsonl`);
	delete session.cliSession;
	await node_fs_promises.default.rm(sessionFile, { force: true });
}
function clearSystemAgentCliSession(session) {
	delete session.cliSession;
}
function clearFailedSystemAgentSessionState(session) {
	session.proposalRef.current = void 0;
	session.proposalRef.operation = void 0;
	clearSystemAgentCliSession(session);
}
function throwSystemAgentInferenceUnavailable(params) {
	clearFailedSystemAgentSessionState(params.session);
	throw new require_inference_error.SystemAgentInferenceUnavailableError("agent-turn", params.failures);
}
function cliRouteKey(route, backend) {
	return JSON.stringify({
		provider: route.provider,
		backendId: backend?.id ?? route.provider,
		modelLabel: route.modelLabel,
		configuredModel: route.model,
		model: backend ? require_helpers.normalizeCliModel(route.model, backend.config) : route.model,
		authProfileId: route.authProfileId ?? "",
		agentDir: node_path.default.resolve(route.agentDir),
		backend: backend ? {
			pluginId: backend.pluginId,
			modelProvider: backend.modelProvider,
			config: backend.config,
			bundleMcp: backend.bundleMcp,
			bundleMcpMode: backend.bundleMcpMode,
			authEpochMode: backend.authEpochMode,
			nativeToolMode: backend.nativeToolMode,
			sideQuestionToolMode: backend.sideQuestionToolMode
		} : null
	});
}
function resolveSystemAgentCliBackend(route) {
	const backend = require_cli_backends.resolveCliBackendConfig(route.provider, route.runConfig, { agentId: require_agent_id.SYSTEM_AGENT_ID });
	if (!backend) return null;
	const { liveSession: _liveSession, ...config } = backend.config;
	return {
		...backend,
		config
	};
}
function resolveSystemAgentCliToolAvailability(backend) {
	if (backend?.nativeToolMode === "none") return;
	if (backend?.nativeToolMode === "selectable" && backend.resolveExecutionArgs) return {
		native: [],
		mcp: [SYSTEM_AGENT_MCP_TOOL_NAME]
	};
	const backendId = backend?.id ?? "unknown";
	throw new Error(`CLI backend ${backendId} cannot enforce Operator's exact tool availability`);
}
/**
* CLI harnesses run the openclaw tool in a stdio MCP subprocess, so the
* in-process proposalRef/directiveRef cannot be shared with the host. Mirror
* the tool's transitions from the harness tool events instead: a denial
* registers the exact-operation hash, a mismatch voids it, an executed
* mutation consumes it, and directive actions replay the interactive handoff —
* same lifecycle as system-agent-tool.ts enforces.
*/
async function mirrorSystemAgentToolStateFromEvents(params) {
	const [{ onAgentEvent }, { extractToolResultText }, { resolveSystemAgentProposalTransition, resolveSystemAgentDirectiveTransition }] = await Promise.all([
		Promise.resolve().then(() => require("./agent-events-r-aTyyWf.cjs")).then((n) => n.agent_events_exports),
		Promise.resolve().then(() => require("./embedded-agent-subscribe.tools-uz-J6wM0.cjs")).then((n) => n.embedded_agent_subscribe_tools_exports),
		Promise.resolve().then(() => require("./system-agent-tool-Bu6ZtBRg.cjs")).then((n) => n.system_agent_tool_exports)
	]);
	return onAgentEvent((evt) => {
		if (evt.runId !== params.runId || evt.stream !== "tool" || evt.data.phase !== "result") return;
		const name = typeof evt.data.name === "string" ? evt.data.name : "";
		if (name !== "@gabrielvfonseca/operator" && !name.endsWith("__openclaw")) return;
		const args = typeof evt.data.args === "object" && evt.data.args !== null ? evt.data.args : {};
		const resultText = extractToolResultText(evt.data.result) ?? "";
		const transition = resolveSystemAgentProposalTransition({
			args,
			resultText
		});
		if (transition) {
			params.proposalRef.current = transition.proposal;
			params.proposalRef.operation = transition.operation;
		}
		const directive = resolveSystemAgentDirectiveTransition({
			args,
			resultText
		});
		if (directive && params.directiveRef.current?.kind !== "approved-operation") params.directiveRef.current = directive;
	});
}
/**
* Run one Operator turn through the embedded agent loop. Route, runner, and
* output failures are typed so callers may try another inference path without
* mistaking the failure for deterministic setup authority.
*/
async function runSystemAgentTurnWithDeps(params, deps = {}) {
	const binding = params.session.verifiedInference;
	if (!binding) return throwSystemAgentInferenceUnavailable({ session: params.session });
	let plan;
	try {
		plan = await require_verified_inference.resolveSystemAgentVerifiedInferenceRoute(binding, deps);
	} catch (error) {
		return throwSystemAgentInferenceUnavailable({
			session: params.session,
			failures: [error]
		});
	}
	if (!plan) return throwSystemAgentInferenceUnavailable({ session: params.session });
	let expectedAgentHarnessRuntimeArtifact;
	try {
		expectedAgentHarnessRuntimeArtifact = require_verified_inference.resolveSystemAgentExpectedAgentHarnessRuntimeArtifact(binding);
	} catch (error) {
		return throwSystemAgentInferenceUnavailable({
			session: params.session,
			failures: [error]
		});
	}
	let workspaceDir;
	let sessionFile;
	try {
		({workspaceDir, sessionFile} = await ensureSystemAgentDirs(params.session.sessionId));
	} catch (error) {
		return throwSystemAgentInferenceUnavailable({
			session: params.session,
			failures: [error]
		});
	}
	const runId = `operator-turn-${(0, node_crypto.randomUUID)()}`;
	const shared = {
		sessionId: params.session.sessionId,
		sessionKey: require_session_key.buildAgentMainSessionKey({ agentId: require_agent_id.SYSTEM_AGENT_ID }),
		agentId: require_agent_id.SYSTEM_AGENT_ID,
		trigger: "manual",
		sessionFile,
		workspaceDir,
		config: plan.runConfig,
		prompt: params.input,
		timeoutMs: AGENT_TURN_TIMEOUT_MS,
		runId,
		messageChannel: "@gabrielvfonseca/operator",
		messageProvider: "@gabrielvfonseca/operator"
	};
	const directiveRef = {};
	const systemAgentTool = {
		surface: params.surface,
		approvalArmed: params.approvalArmed,
		proposalRef: params.session.proposalRef,
		directiveRef
	};
	try {
		let result;
		if (plan.runner === "cli") {
			const backend = resolveSystemAgentCliBackend(plan);
			const cliToolAvailability = resolveSystemAgentCliToolAvailability(backend);
			const routeKey = cliRouteKey(plan, backend);
			const previousBinding = params.session.cliSession?.routeKey === routeKey ? params.session.cliSession.binding : void 0;
			if (!previousBinding) clearSystemAgentCliSession(params.session);
			const runCli = deps.runCliAgent ?? (await Promise.resolve().then(() => require("./cli-runner-ZSZWExo3.cjs")).then((n) => n.cli_runner_exports)).runCliAgent;
			const stopToolStateMirror = await mirrorSystemAgentToolStateFromEvents({
				runId,
				proposalRef: params.session.proposalRef,
				directiveRef
			});
			try {
				result = await runCli({
					...shared,
					provider: plan.provider,
					model: plan.model,
					agentDir: plan.agentDir,
					...plan.authProfileId ? { authProfileId: plan.authProfileId } : {},
					extraSystemPrompt: require_inference_error.SYSTEM_AGENT_SYSTEM_PROMPT,
					extraSystemPromptStatic: require_inference_error.SYSTEM_AGENT_SYSTEM_PROMPT,
					systemAgentTool,
					...cliToolAvailability ? { cliToolAvailability } : {},
					...previousBinding ? { cliSessionBinding: previousBinding } : {},
					disableCliLiveSession: true,
					cleanupCliLiveSessionOnRunEnd: true
				});
			} finally {
				stopToolStateMirror();
			}
			const agentMeta = result.meta?.agentMeta;
			if (agentMeta?.clearCliSessionBinding || !agentMeta?.cliSessionBinding?.sessionId) clearSystemAgentCliSession(params.session);
			else if (agentMeta?.cliSessionBinding?.sessionId) params.session.cliSession = {
				routeKey,
				binding: agentMeta.cliSessionBinding
			};
		} else {
			clearSystemAgentCliSession(params.session);
			result = await (deps.runEmbeddedAgent ?? (await Promise.resolve().then(() => require("./embedded-agent-C44j1_Yh.cjs")).then((n) => n.embedded_agent_exports)).runEmbeddedAgent)({
				...shared,
				extraSystemPrompt: require_inference_error.SYSTEM_AGENT_SYSTEM_PROMPT,
				toolsAllow: ["@gabrielvfonseca/operator"],
				systemAgentTool,
				disableMessageTool: true,
				provider: plan.provider,
				model: plan.model,
				agentDir: plan.agentDir,
				agentHarnessRuntimeOverride: plan.agentHarnessRuntimeOverride,
				...expectedAgentHarnessRuntimeArtifact ? { expectedAgentHarnessRuntimeArtifact } : {},
				...plan.authProfileId ? {
					authProfileId: plan.authProfileId,
					authProfileIdSource: "user"
				} : {}
			});
		}
		if (params.session.verifiedInference !== binding) throw new require_inference_error.SystemAgentInferenceUnavailableError("agent-turn");
		if (!await require_verified_inference.resolveSystemAgentVerifiedInferenceRoute(binding, deps)) throw new require_inference_error.SystemAgentInferenceUnavailableError("agent-turn");
		const text = extractRunText(result)?.trim();
		if (!text) throw new require_inference_error.SystemAgentInferenceUnavailableError("agent-turn");
		return {
			text,
			modelLabel: plan.modelLabel,
			...directiveRef.current ? { directive: directiveRef.current } : {}
		};
	} catch (error) {
		const failures = error instanceof require_inference_error.SystemAgentInferenceUnavailableError ? [...error.failures] : [error];
		return throwSystemAgentInferenceUnavailable({
			session: params.session,
			failures
		});
	}
}
const runSystemAgentTurn = (params) => runSystemAgentTurnWithDeps(params);
if (process.env.VITEST || false) globalThis[Symbol.for("operator.systemAgentTurnTestApi")] = { runSystemAgentTurnWithDeps };
//#endregion
//#region src/system-agent/dialogue.ts
/** Format the interactive approval prompt for a persistent operation. */
function approvalQuestion(operation) {
	return `Apply this operation: ${require_operations.describeSystemAgentPersistentOperation(operation)}?`;
}
//#endregion
//#region src/system-agent/operator-approval.ts
function resolvePendingOperatorProposal(pending, proposalRef) {
	const operation = pending ?? proposalRef.operation;
	if (!operation || !require_operations.isPersistentSystemAgentOperation(operation)) return null;
	const hash = require_system_agent_tool.hashSystemAgentOperation(operation);
	if (proposalRef.current && proposalRef.current !== hash) return null;
	proposalRef.current = hash;
	proposalRef.operation = operation;
	return {
		operation,
		hash
	};
}
async function resolveOperatorApprovalDecision(params) {
	const proposal = params.getProposal();
	if (!proposal || proposal.hash !== params.proposalHash) return null;
	if (params.decision !== "allow-once") {
		params.clear();
		return params.denied();
	}
	return await params.apply(`[operator-approved] Human approved ${params.proposalHash}. Apply exact proposal; approved=true.`);
}
//#endregion
//#region src/system-agent/post-write-verification.ts
function unavailable(reason) {
	return [`⚠ The write was applied, but post-write verification is unavailable: ${reason}.`, "Run `openclaw doctor --fix`, then verify the configuration before continuing."].join("\n");
}
async function verifyConfigAfterSystemAgentWrite(resolveRepair) {
	let issuesText;
	try {
		const { readConfigFileSnapshot } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
		const snapshot = await readConfigFileSnapshot();
		if (!snapshot.exists) return unavailable("operator.json was not found");
		if (snapshot.valid) return null;
		const issues = (snapshot.issues ?? []).map((issue) => `${issue.path ? `${issue.path}: ` : ""}${issue.message}`);
		issuesText = issues.length > 0 ? issues.join("\n") : "unknown validation failure";
	} catch {
		return unavailable("operator.json could not be read");
	}
	const notice = `⚠ operator.json failed validation after that write:\n${issuesText}`;
	let recovery;
	try {
		recovery = await resolveRepair(`[config-verify] The config file is now invalid:\n${issuesText}\nPropose one corrective command from the allowed list.`);
	} catch (error) {
		if (!require_inference_error.isSystemAgentInferenceUnavailableError(error)) throw error;
		return `${notice}\nThe write was applied, but inference could not propose a repair. Run \`openclaw doctor --fix\`, then try again.`;
	}
	return recovery.text ? `${notice}\n\n${recovery.text}` : `${notice}\nExit Operator and run \`openclaw doctor --fix\`, or use \`config schema <path>\` to check the expected shape before leaving.`;
}
//#endregion
//#region src/system-agent/chat-engine.ts
function createHostedWizardRuntime(runtime) {
	return {
		...runtime,
		exit: (code) => {
			throw new Error(`hosted wizard exited with code ${String(code)}`);
		}
	};
}
function createCaptureRuntime() {
	const lines = [];
	return {
		log: (...args) => lines.push(args.join(" ")),
		error: (...args) => lines.push(args.join(" ")),
		exit: (code) => {
			throw new Error(`Operator operation exited with code ${String(code)}`);
		},
		read: () => lines.join("\n").trim()
	};
}
function defaultChannelSetupWizardRunner(channel, beforePersistentApply) {
	return async (prompter) => {
		const [{ readSetupConfigFileSnapshot, writeWizardConfigFile }, { createChannelOnboardingPostWriteHookCollector, runCollectedChannelOnboardingPostWriteHooks, setupChannels }] = await Promise.all([Promise.resolve().then(() => require("./setup.shared-DaBRSpRV.cjs")), Promise.resolve().then(() => require("./onboard-channels-BgLQ52s3.cjs"))]);
		const snapshot = await readSetupConfigFileSnapshot();
		if (!snapshot.exists || !snapshot.valid || !snapshot.hash) throw new Error("Channel setup requires a valid saved config snapshot. Run `openclaw doctor --fix`, then retry.");
		const baseConfig = snapshot.sourceConfig ?? snapshot.config;
		const baseHash = snapshot.hash;
		const { defaultRuntime } = await Promise.resolve().then(() => require("./runtime-BOSfFY3R.cjs")).then((n) => n.runtime_exports);
		const runtime = createHostedWizardRuntime(defaultRuntime);
		const postWriteHooks = createChannelOnboardingPostWriteHookCollector();
		const nextConfig = await setupChannels(baseConfig, runtime, prompter, {
			initialSelection: [channel],
			forceAllowFromChannels: [channel],
			allowIMessageInstall: true,
			allowSignalInstall: true,
			deferStatusUntilSelection: true,
			quickstartDefaults: true,
			skipDmPolicyPrompt: true,
			skipConfirm: true,
			beforePersistentEffect: async () => await beforePersistentApply(runtime),
			onPostWriteHook: (hook) => postWriteHooks.collect(hook)
		});
		await beforePersistentApply(runtime);
		const committedConfig = await writeWizardConfigFile(nextConfig, {
			allowConfigSizeDrop: false,
			baseHash,
			migrationBaseConfig: baseConfig
		});
		await runCollectedChannelOnboardingPostWriteHooks({
			hooks: postWriteHooks.drain(),
			cfg: committedConfig,
			runtime,
			beforePersistentEffect: async () => await beforePersistentApply(runtime)
		});
	};
}
function formatWizardOptions(step) {
	return (step.options ?? []).map((option, index) => {
		const hint = option.hint ? ` — ${option.hint}` : "";
		return `${index + 1}. ${option.label}${hint}`;
	});
}
function renderWizardStep(step) {
	const lines = [];
	if (step.title) lines.push(`**${step.title}**`);
	if (step.message) lines.push(step.message);
	switch (step.type) {
		case "select":
			lines.push(...formatWizardOptions(step), "Reply with a number.");
			break;
		case "multiselect":
			lines.push(...formatWizardOptions(step), "Reply with numbers (e.g. 1,3) or `none`.");
			break;
		case "confirm":
			lines.push("Reply yes or no.");
			break;
		case "text":
			if (step.placeholder) lines.push(`(e.g. ${step.placeholder})`);
			lines.push("Type your answer.");
			break;
		default: break;
	}
	lines.push("Say `cancel` to stop this setup.");
	return lines.filter(Boolean).join("\n");
}
/** Map a chat reply to a wizard step answer; null means "could not parse". */
function parseWizardAnswer(step, text) {
	const trimmed = text.trim();
	if (step.type === "confirm") {
		const intent = require_approval_intent.classifySystemAgentApprovalText(trimmed);
		if (intent === "approve") return { value: true };
		if (intent === "decline") return { value: false };
		return null;
	}
	if (step.type === "text") return { value: trimmed };
	const options = step.options ?? [];
	const matchOption = (token) => {
		const index = Number(token);
		if (Number.isInteger(index) && index >= 1 && index <= options.length) return options[index - 1];
		const lower = token.toLowerCase();
		return options.find((option) => option.label.toLowerCase() === lower || typeof option.value === "string" && option.value.toLowerCase() === lower);
	};
	if (step.type === "select") {
		const option = matchOption(trimmed);
		return option ? { value: option.value } : null;
	}
	if (step.type === "multiselect") {
		if (/^none$/i.test(trimmed)) return { value: [] };
		const tokens = trimmed.split(/[\s,]+/).map((token) => token.trim()).filter(Boolean);
		const values = [];
		for (const token of tokens) {
			const option = matchOption(token);
			if (!option) return null;
			values.push(option.value);
		}
		return { value: values };
	}
	return { value: step.type === "action" ? true : void 0 };
}
function formatOperationError(error) {
	return `That did not go through: ${error instanceof Error ? error.message : String(error)}`;
}
/**
* A typed `config set` against a sensitive path carries a raw secret; the
* stored history feeds future planner prompts (and CLI-harness transcripts),
* so the value is masked the same way hosted-wizard secrets are.
*/
function redactSensitiveCommandText(text) {
	const operation = require_operations.parseSystemAgentOperation(text);
	if (operation.kind === "config-set" && require_sensitive_paths.isSensitiveConfigPath(operation.path)) return `config set ${operation.path} <redacted secret>`;
	return text;
}
function formatPendingOperationForAssistant(operation) {
	const description = require_operations.describeSystemAgentPersistentOperation(operation);
	return operation.kind === "setup" ? `${description}. Exact setup JSON: ${JSON.stringify(operation)}. Keep the verified model unless the user explicitly asks to leave Operator and reconfigure inference.` : description;
}
function preservePendingSetupModel(pending, operation) {
	if (pending?.kind !== "setup" || operation.kind !== "setup") return operation;
	const pendingModel = pending.model?.trim();
	const requestedModel = operation.model?.trim();
	if (requestedModel && requestedModel !== pendingModel) return operation;
	return {
		...operation,
		...requestedModel ? {} : pendingModel ? { model: pendingModel } : {}
	};
}
var SystemAgentChatEngine = class {
	constructor(opts) {
		this.opts = opts;
		this.pending = null;
		this.wizardBridge = null;
		this.awaitingSetupChannel = false;
		this.history = [];
		this.turnQueue = Promise.resolve();
		const binding = opts?.verifiedInference;
		if (!binding) throw new require_inference_error.SystemAgentInferenceUnavailableError("conversation");
		this.verifiedInference = binding;
		this.agentSession = createSystemAgentSession(binding);
	}
	/**
	* Seed a proposed operation that the user's next approval will apply. Used
	* by first-run onboarding: the welcome message states the plan, the user
	* just agrees.
	*/
	propose(operation) {
		this.clearPendingProposals();
		this.pending = operation;
		return require_operations.describeSystemAgentPersistentOperation(operation);
	}
	hasPendingProposal() {
		return this.pending !== null;
	}
	getPendingOperatorProposal() {
		return resolvePendingOperatorProposal(this.pending, this.agentSession.proposalRef);
	}
	async resolveOperatorApproval(decision, proposalHash) {
		const turn = this.turnQueue.then(async () => {
			const reply = await resolveOperatorApprovalDecision({
				decision,
				proposalHash,
				getProposal: () => this.getPendingOperatorProposal(),
				clear: () => this.clearPendingProposals(),
				apply: (message) => this.pending ? this.applyPendingProposal() : this.resolveAssistantTurn(message, true),
				denied: () => ({
					text: "Denied. No change.",
					action: "none"
				})
			});
			if (reply?.text) this.history.push({
				role: "assistant",
				text: reply.text
			});
			return reply;
		});
		this.turnQueue = turn.catch(() => void 0);
		return await turn;
	}
	/** Record a host-rendered assistant message (welcome) so AI turns see it. */
	noteAssistantMessage(text) {
		this.history.push({
			role: "assistant",
			text
		});
	}
	async dispose() {
		this.wizardBridge?.session.cancel();
		this.wizardBridge = null;
		this.lastSensitiveChannel = void 0;
		this.awaitingSetupChannel = false;
		await cleanupSystemAgentSession(this.agentSession);
	}
	async handle(text) {
		const turn = this.turnQueue.then(() => this.handleSerialized(text));
		this.turnQueue = turn.catch(() => void 0);
		return await turn;
	}
	async handleSerialized(text) {
		await this.requireVerifiedInference();
		const sensitiveTurn = this.wizardBridge?.step?.sensitive === true;
		const reply = await this.resolveTurn(text);
		this.history.push({
			role: "user",
			text: sensitiveTurn ? "<redacted secret>" : redactSensitiveCommandText(text)
		});
		if (reply.text) this.history.push({
			role: "assistant",
			text: reply.text
		});
		return {
			...reply,
			...this.wizardBridge?.step?.sensitive === true ? { sensitive: true } : {}
		};
	}
	async resolveTurn(text) {
		if (this.wizardBridge) return {
			text: await this.resolveWizardBridgeReply(text),
			action: "none"
		};
		const trimmed = text.trim();
		if (!trimmed) return {
			text: "Tiny claw tap: tell me what you want — setup, repair, channels, anything config.",
			action: "none"
		};
		if (/^(quit|exit)$/i.test(trimmed)) return {
			text: "Operator retracts into shell. Bye.",
			action: "exit"
		};
		if (this.awaitingSetupChannel) {
			if (/^(cancel|abort|stop)$/i.test(trimmed)) {
				this.awaitingSetupChannel = false;
				return {
					text: "Channel wizard handoff cancelled.",
					action: "none"
				};
			}
			if (!/^[a-z0-9_-]+$/i.test(trimmed)) return {
				text: "Reply with one channel id, such as `slack` or `telegram`, or say `cancel`.",
				action: "none"
			};
			this.awaitingSetupChannel = false;
			return await this.runOperation({
				kind: "open-setup",
				target: "channels",
				channel: trimmed.toLowerCase()
			}, void 0);
		}
		if (this.opts.operatorApprovalOnly && this.getPendingOperatorProposal()) return {
			text: "Approval pending. Human must decide in Operator UI.",
			action: "none"
		};
		const typed = require_operations.parseSystemAgentOperation(text);
		if (typed.kind === "config-set" && require_sensitive_paths.isSensitiveConfigPath(typed.path)) return await this.runOperation(typed, void 0);
		const typedRefusal = this.refuseDelegatedNavigationDirective(typed.kind);
		if (typedRefusal) return {
			text: typedRefusal,
			action: "none"
		};
		if (typed.kind === "open-tui") {
			this.clearPendingProposals();
			return await this.runOperation(typed, void 0);
		}
		if (typed.kind === "open-setup" || typed.kind === "channel-setup" || typed.kind === "model-setup") return await this.runOperation(typed, void 0);
		const intent = this.opts.operatorApprovalOnly ? "other" : await this.classifyApprovalIntent(text);
		if (this.pending) {
			if (intent === "approve") {
				await this.requireVerifiedInference();
				return await this.applyPendingProposal();
			}
			if (intent === "decline") {
				const skippedModelSetup = this.pending.kind === "model-setup";
				this.clearPendingProposals();
				this.hostProposalResolution = "declined";
				return {
					text: skippedModelSetup ? "Skipped. The current inference route is unchanged." : "Skipped. No barnacles on config today.",
					action: "none"
				};
			}
		}
		if (intent === "decline") {
			this.agentSession.proposalRef.current = void 0;
			this.agentSession.proposalRef.operation = void 0;
		}
		return await this.resolveAssistantTurn(text, this.opts.operatorApprovalOnly ? false : intent === "approve");
	}
	async classifyApprovalIntent(text) {
		if (!(this.pending !== null || this.agentSession.proposalRef.current !== void 0)) return "other";
		return await (this.opts.classifyApproval ?? (await Promise.resolve().then(() => require("./approval-intent-BJO_PmMk.cjs")).then((n) => n.approval_intent_exports)).classifySystemAgentApprovalIntent)({
			message: text,
			...this.pending ? { proposal: require_operations.describeSystemAgentPersistentOperation(this.pending) } : {},
			verifiedInference: this.verifiedInference
		});
	}
	async applyPendingProposal() {
		const pending = this.pending;
		this.clearPendingProposals();
		this.hostProposalResolution = "approved";
		if (!pending) return {
			text: "",
			action: "none"
		};
		if (pending.kind === "channel-setup") return {
			text: await this.startChannelSetupWizard(pending.channel),
			action: "none"
		};
		if (pending.kind === "model-setup") return await this.startModelSetup(pending.workspace);
		if (!require_operations.isPersistentSystemAgentOperation(pending)) return await this.runOperation(pending, void 0);
		return await this.applyApprovedPersistentOperation(pending);
	}
	async applyApprovedPersistentOperation(operation) {
		if (!require_operations.isPersistentSystemAgentOperation(operation)) throw new Error(`Operator host received a non-persistent approved operation.`);
		const capture = createCaptureRuntime();
		let result;
		try {
			result = await require_operations.executeSystemAgentOperation(operation, capture, {
				approved: true,
				deps: this.commandDeps(),
				beforePersistentApply: async () => {
					await this.requirePersistentApplyInference(capture);
				}
			});
		} catch (error) {
			if (require_inference_error.isSystemAgentInferenceUnavailableError(error)) throw error;
			capture.error(formatOperationError(error));
		}
		const verify = result?.applied ? await this.verifyConfigAfterWrite() : null;
		const followUp = this.armFollowUp(result?.followUp);
		return {
			text: [
				capture.read() || "Applied. Audit entry written.",
				verify,
				followUp
			].filter(Boolean).join("\n\n"),
			action: "none"
		};
	}
	/**
	* AI turn: the Operator persona answers and acts through the ring-zero
	* tool. The single-turn planner is a second inference path; if neither path
	* answers, the turn fails closed instead of executing model-free guesses.
	*/
	async resolveAssistantTurn(text, approvalArmed) {
		const overview = await this.loadOverview();
		const agentTurn = this.opts.runAgentTurn ?? runSystemAgentTurn;
		const resolutionMarker = this.hostProposalResolution ? `[host-proposal-resolved] The previously host-seeded proposal was ${this.hostProposalResolution}. Do not present it as pending.\n` : "";
		let agentFailure;
		let loopReply;
		try {
			loopReply = await agentTurn({
				input: `${resolutionMarker}${this.pending ? `[pending-proposal] Awaiting the user's approval: ${formatPendingOperationForAssistant(this.pending)}. It is already host-seeded; if they want it (or a variant), drive it through the openclaw tool yourself.\n${text}` : text}`,
				overview,
				surface: this.opts.surface ?? "cli",
				approvalArmed,
				session: this.agentSession
			});
		} catch (error) {
			agentFailure = error;
			loopReply = null;
		}
		if (loopReply?.text) {
			this.hostProposalResolution = void 0;
			if (loopReply.directive) this.clearPendingProposals();
			else if (this.agentSession.proposalRef.current !== void 0) this.pending = null;
			return await this.applyAgentTurnReply(loopReply);
		}
		const planner = this.opts.planWithAssistant ?? (await Promise.resolve().then(() => require("./assistant-Lrf851yK.cjs"))).planSystemAgentCommand;
		let plannerFailure;
		let plan;
		try {
			plan = await planner({
				input: text,
				overview,
				history: this.history,
				...this.pending ? { pendingOperation: formatPendingOperationForAssistant(this.pending) } : {},
				verifiedInference: this.verifiedInference
			});
			if (plan) await this.requireVerifiedInference();
		} catch (error) {
			plannerFailure = error;
			plan = null;
		}
		if (!plan) throw new require_inference_error.SystemAgentInferenceUnavailableError("conversation", [agentFailure, plannerFailure].filter((failure) => failure !== void 0));
		const replyText = plan.reply ?? "";
		if (!plan.command) {
			if (!replyText.trim()) throw new require_inference_error.SystemAgentInferenceUnavailableError("planner", [agentFailure]);
			return {
				text: replyText,
				action: "none"
			};
		}
		const operation = preservePendingSetupModel(this.pending, require_operations.parseSystemAgentOperation(plan.command));
		if (operation.kind === "none") {
			if (!replyText.trim()) throw new require_inference_error.SystemAgentInferenceUnavailableError("planner", [agentFailure]);
			return {
				text: replyText,
				action: "none"
			};
		}
		const provenance = `(${plan.modelLabel ?? "model"} → \`${plan.command}\`)`;
		const executed = await this.runOperation(operation, provenance);
		return {
			...executed,
			text: [replyText, executed.text].filter(Boolean).join("\n\n")
		};
	}
	async applyAgentTurnReply(loopReply) {
		await this.requireVerifiedInference();
		const refusal = this.refuseDelegatedNavigationDirective(loopReply.directive?.kind);
		if (refusal) return {
			text: [loopReply.text, refusal].filter(Boolean).join("\n\n"),
			action: "none"
		};
		if (loopReply.directive?.kind === "approved-operation") {
			const applied = await this.applyApprovedPersistentOperation(loopReply.directive.operation);
			return {
				...applied,
				text: [loopReply.text, applied.text].filter(Boolean).join("\n\n")
			};
		}
		if (loopReply.directive?.kind === "channel-setup") {
			const wizardIntro = await this.startChannelSetupWizard(loopReply.directive.channel);
			return {
				text: [loopReply.text, wizardIntro].filter(Boolean).join("\n\n"),
				action: "none"
			};
		}
		if (loopReply.directive?.kind === "model-setup") {
			const setup = await this.startModelSetup(loopReply.directive.workspace);
			return {
				...setup,
				text: [loopReply.text, setup.text].filter(Boolean).join("\n\n")
			};
		}
		if (loopReply.directive?.kind === "open-tui") {
			this.clearPendingProposals();
			return {
				text: loopReply.text,
				action: "open-tui",
				handoff: loopReply.directive
			};
		}
		if (loopReply.directive?.kind === "open-setup") {
			const handoff = await this.runOperation(loopReply.directive, void 0);
			return {
				...handoff,
				text: [loopReply.text, handoff.text].filter(Boolean).join("\n\n")
			};
		}
		return {
			text: loopReply.text,
			action: "none"
		};
	}
	refuseDelegatedNavigationDirective(kind) {
		if (!this.opts.operatorApprovalOnly) return;
		if (kind === "channel-setup" || kind === "model-setup" || kind === "open-setup" || kind === "open-tui") return "Channel, model, and setup flows need a human operator in the Operator app; they cannot run from a delegated agent request.";
	}
	async runOperation(operation, provenance) {
		await this.requireVerifiedInference();
		if (operation.kind === "open-tui") {
			this.clearPendingProposals();
			return {
				text: "Opening your normal agent TUI. Use /openclaw there to come back.",
				action: "open-tui",
				handoff: operation
			};
		}
		if (operation.kind === "open-setup") {
			this.clearPendingProposals();
			if (this.opts.surface === "gateway") return {
				text: "The app owns the setup screens here — use Settings, or run `openclaw onboard` in a terminal.",
				action: "none"
			};
			if (operation.target !== "channels") return {
				text: "Setup can replace the inference route powering this session. Exit Operator and run `openclaw onboard`; it saves only a route that passes a live test. Then start Operator again.",
				action: "none"
			};
			let handoff = operation;
			if (handoff.target === "channels" && !handoff.channel) {
				const channel = this.lastSensitiveChannel;
				if (!channel) {
					this.awaitingSetupChannel = true;
					return {
						text: "Which channel should I open in the masked terminal wizard?",
						action: "none"
					};
				}
				this.lastSensitiveChannel = void 0;
				handoff = {
					...handoff,
					channel
				};
			}
			this.awaitingSetupChannel = false;
			return {
				text: `Opening the ${handoff.target === "channels" ? `${handoff.channel ?? "channel"} setup` : "setup"} wizard.`,
				action: "open-setup",
				handoff
			};
		}
		if (operation.kind === "channel-setup") return {
			text: await this.startChannelSetupWizard(operation.channel),
			action: "none"
		};
		if (operation.kind === "model-setup") return await this.startModelSetup(operation.workspace);
		const capture = createCaptureRuntime();
		if (require_operations.isPersistentSystemAgentOperation(operation) && !this.opts.yes) {
			this.clearPendingProposals();
			this.pending = operation;
			await require_operations.executeSystemAgentOperation(operation, capture, {
				approved: false,
				deps: this.commandDeps()
			});
			return {
				text: [
					provenance,
					capture.read(),
					approvalQuestion(operation)
				].filter(Boolean).join("\n\n"),
				action: "none"
			};
		}
		let result;
		try {
			result = await require_operations.executeSystemAgentOperation(operation, capture, {
				approved: this.opts.yes === true || !require_operations.isPersistentSystemAgentOperation(operation),
				deps: this.commandDeps(),
				beforePersistentApply: async () => {
					await this.requirePersistentApplyInference(capture);
				}
			});
		} catch (error) {
			if (require_inference_error.isSystemAgentInferenceUnavailableError(error)) throw error;
			capture.error(formatOperationError(error));
		}
		const verify = result?.applied ? await this.verifyConfigAfterWrite() : null;
		const followUp = this.armFollowUp(result?.followUp);
		const reply = [
			provenance,
			capture.read(),
			verify,
			followUp
		].filter(Boolean).join("\n\n");
		if (operation.kind === "none" && reply.includes("Bye.")) return {
			text: reply,
			action: "exit"
		};
		return {
			text: reply,
			action: "none"
		};
	}
	async loadOverview() {
		const verifiedRoute = await this.requireVerifiedInference();
		return {
			...this.opts.deps?.loadOverview ? await this.opts.deps.loadOverview() : await require_overview.loadSystemAgentOverview(),
			defaultModel: verifiedRoute.modelLabel
		};
	}
	async requireVerifiedInference() {
		const binding = this.opts?.verifiedInference;
		if (!binding || binding !== this.verifiedInference || this.agentSession.verifiedInference !== this.verifiedInference) return this.throwInferenceUnavailable();
		try {
			const route = await require_verified_inference.resolveSystemAgentVerifiedInferenceRoute(binding, this.opts.deps);
			if (route) return route;
		} catch (error) {
			return this.throwInferenceUnavailable([error]);
		}
		return this.throwInferenceUnavailable();
	}
	async requirePersistentApplyInference(runtime) {
		const binding = this.opts?.verifiedInference;
		if (!binding || binding !== this.verifiedInference || this.agentSession.verifiedInference !== this.verifiedInference) return this.throwInferenceUnavailable();
		try {
			const { resolvePersistentApplyInference } = await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs"));
			const route = await resolvePersistentApplyInference({
				binding,
				runtime,
				deps: this.opts.deps
			});
			if (route) return route;
		} catch (error) {
			if (require_inference_error.isSystemAgentInferenceUnavailableError(error)) return this.throwInferenceUnavailable(error.failures, false);
			return this.throwInferenceUnavailable([error], false);
		}
		return this.throwInferenceUnavailable([], false);
	}
	throwInferenceUnavailable(failures = [], cancelWizard = true) {
		this.pending = null;
		this.hostProposalResolution = void 0;
		this.agentSession.proposalRef.current = void 0;
		this.agentSession.proposalRef.operation = void 0;
		delete this.agentSession.cliSession;
		if (cancelWizard) this.wizardBridge?.session.cancel();
		this.wizardBridge = null;
		this.lastSensitiveChannel = void 0;
		this.awaitingSetupChannel = false;
		this.history.splice(0);
		throw new require_inference_error.SystemAgentInferenceUnavailableError("conversation", failures);
	}
	/**
	* Post-write hook: re-validate operator.json after every applied operation.
	* On failure the exact schema issues go straight back into the conversation
	* (and to the AI, which proposes one corrective command) so a bad write is
	* caught and fixed in the same chat instead of surfacing at gateway start.
	*/
	async verifyConfigAfterWrite() {
		return await verifyConfigAfterSystemAgentWrite((message) => this.resolveAssistantTurn(message, false));
	}
	commandDeps() {
		if (!this.opts.deps && !this.opts.surface) return;
		return {
			...this.opts.deps,
			...this.opts.surface ? { setupSurface: this.opts.surface } : {}
		};
	}
	clearPendingProposals() {
		this.pending = null;
		this.agentSession.proposalRef.current = void 0;
		this.agentSession.proposalRef.operation = void 0;
	}
	armFollowUp(operation) {
		if (operation?.kind !== "model-setup") return null;
		return ["No usable inference route is configured, so Operator cannot continue.", "Exit and run `openclaw onboard`; it saves only a route that passes a live test."].join("\n");
	}
	async startChannelSetupWizard(channel) {
		this.clearPendingProposals();
		this.lastSensitiveChannel = void 0;
		const beforePersistentApply = async (runtime) => {
			await this.requirePersistentApplyInference(runtime);
		};
		const runWizard = this.opts.runChannelSetupWizard ?? ((ch, prompter, guard) => defaultChannelSetupWizardRunner(ch, guard)(prompter));
		const session = new require_session.WizardSession((prompter) => runWizard(channel, prompter, beforePersistentApply));
		this.wizardBridge = {
			session,
			step: null,
			label: channel,
			autoSelectChannel: channel
		};
		return await this.pumpWizardBridge();
	}
	async startModelSetup(_workspace) {
		this.clearPendingProposals();
		return {
			text: ["Changing provider credentials would replace the inference route powering this session.", "Exit Operator and run `openclaw onboard`; it stages credentials, live-tests the new route, and saves only a passing setup. Then start Operator again."].join("\n"),
			action: "none"
		};
	}
	/**
	* "connect telegram" already names the channel; answer the wizard's channel
	* selection step automatically instead of echoing the full channel wall.
	*/
	tryAutoSelectChannel(step) {
		const bridge = this.wizardBridge;
		const channel = bridge?.autoSelectChannel;
		if (!bridge || !channel) return null;
		if (step.type !== "select" && step.type !== "multiselect") return null;
		const match = (step.options ?? []).find((option) => typeof option.value === "string" && option.value.toLowerCase() === channel);
		if (!match) return null;
		bridge.autoSelectChannel = void 0;
		return { value: step.type === "multiselect" ? [match.value] : match.value };
	}
	/** Advance the hosted wizard to the next interactive step (or completion). */
	async pumpWizardBridge() {
		const bridge = this.wizardBridge;
		if (!bridge) return "";
		const result = await bridge.session.next();
		if (result.done) {
			this.wizardBridge = null;
			const label = bridge.label;
			if (result.status === "done") {
				const { appendSystemAgentAuditEntry } = await Promise.resolve().then(() => require("./audit-yL76l99a.cjs")).then((n) => n.audit_exports);
				await appendSystemAgentAuditEntry({
					operation: "channels.setup",
					summary: `Configured channel ${label} via chat setup`,
					details: { channel: label }
				});
				const verify = await this.verifyConfigAfterWrite();
				return [
					`Done — ${label} is configured.`,
					"Say `restart gateway` to apply channel changes, or `channels` to review.",
					verify ?? ""
				].filter(Boolean).join("\n");
			}
			if (result.status === "cancelled") return "Channel setup cancelled. Nothing was changed beyond completed steps.";
			return `Channel setup stopped: ${result.error ?? "unknown error"}`;
		}
		bridge.step = result.step ?? null;
		if (bridge.step) {
			const auto = this.tryAutoSelectChannel(bridge.step);
			if (auto) {
				const step = bridge.step;
				bridge.step = null;
				await bridge.session.answer(step.id, auto.value);
				return await this.pumpWizardBridge();
			}
			if (this.opts.surface === "cli" && bridge.step.sensitive === true) {
				bridge.session.cancel();
				this.wizardBridge = null;
				this.lastSensitiveChannel = bridge.label;
				return ["Sensitive input is not accepted in the Operator chat because terminal input is visible.", `Say \`open channel wizard\` and I'll hand you to the masked terminal wizard for ${bridge.label}, or run \`openclaw channels add --channel ${bridge.label}\` yourself later.`].join("\n");
			}
			if (bridge.step.type === "note" || bridge.step.type === "progress") {
				const step = bridge.step;
				bridge.step = null;
				await bridge.session.answer(step.id, void 0);
				const next = await this.pumpWizardBridge();
				return [renderWizardStep(step), next].filter(Boolean).join("\n\n");
			}
			if (bridge.step.type === "action" && bridge.step.executor !== "client") {
				const step = bridge.step;
				bridge.step = null;
				await bridge.session.answer(step.id, true);
				return await this.pumpWizardBridge();
			}
		}
		return bridge.step ? renderWizardStep(bridge.step) : "";
	}
	async resolveWizardBridgeReply(text) {
		const bridge = this.wizardBridge;
		if (!bridge) return "";
		if (/^(cancel|abort|stop|quit|exit)$/i.test(text.trim())) {
			bridge.session.cancel();
			return await this.pumpWizardBridge();
		}
		const step = bridge.step;
		if (!step) return await this.pumpWizardBridge();
		const answer = parseWizardAnswer(step, text);
		if (!answer) return ["I could not match that answer.", renderWizardStep(step)].join("\n");
		const validationError = await bridge.session.answer(step.id, answer.value);
		if (validationError) return [validationError, renderWizardStep(step)].join("\n\n");
		return await this.pumpWizardBridge();
	}
};
//#endregion
//#region src/system-agent/delegation-session.ts
function resolveSystemAgentDelegationKey(delegation) {
	return delegation ? JSON.stringify([delegation.agentId ?? null, delegation.sessionKey ?? null]) : void 0;
}
//#endregion
//#region src/gateway/server-methods/system-agent.ts
const MAX_SYSTEM_AGENT_SESSIONS = 8;
const PROVIDER_AUTH_SESSION_TIMEOUT_MS = 1500 * 1e3;
const SYSTEM_AGENT_GATEWAY_EXECUTION_KEY = "gateway";
const systemAgentGatewayExecutionQueue = new require_keyed_async_queue.KeyedAsyncQueue();
const systemAgentSessionQueues = /* @__PURE__ */ new WeakMap();
function getSystemAgentSessionQueue(sessions) {
	let queue = systemAgentSessionQueues.get(sessions);
	if (!queue) {
		queue = new require_keyed_async_queue.KeyedAsyncQueue();
		systemAgentSessionQueues.set(sessions, queue);
	}
	return queue;
}
async function runSystemAgentGatewayTask(task) {
	require_command_queue.setCommandLaneConcurrency("system-agent", Number.MAX_SAFE_INTEGER);
	return await require_command_queue.enqueueCommandInLane("system-agent", () => systemAgentGatewayExecutionQueue.enqueue(SYSTEM_AGENT_GATEWAY_EXECUTION_KEY, task));
}
let systemAgentSetupActivationInProgress = false;
var SystemAgentSetupActivationBusyError = class extends Error {};
/** Admit one setup mutation without queueing work past a caller timeout. */
async function runExclusiveSystemAgentSetupActivation(task) {
	if (systemAgentSetupActivationInProgress) throw new SystemAgentSetupActivationBusyError("Operator setup is already in progress; try again when it finishes.");
	systemAgentSetupActivationInProgress = true;
	try {
		return await task();
	} finally {
		systemAgentSetupActivationInProgress = false;
	}
}
async function evictOldestSession(sessions, context) {
	if (sessions.size < MAX_SYSTEM_AGENT_SESSIONS) return;
	let oldestKey;
	let oldestAt = Number.POSITIVE_INFINITY;
	for (const [key, session] of sessions) if (session.lastUsedAt < oldestAt) {
		oldestAt = session.lastUsedAt;
		oldestKey = key;
	}
	if (oldestKey !== void 0) {
		const oldest = sessions.get(oldestKey);
		if (oldest?.pendingApproval) context.systemAgentApprovalManager?.expire(oldest.pendingApproval.id, "session-evicted");
		await oldest?.engine.dispose();
		sessions.delete(oldestKey);
	}
}
function queueDelegatedApproval(params) {
	if (params.session.pendingApproval?.proposalHash === params.proposal.hash) return params.session.pendingApproval.id;
	const manager = params.context.systemAgentApprovalManager;
	if (!manager) throw new Error("Operator approval registry unavailable");
	const description = require_operations.describeSystemAgentPersistentOperation(params.proposal.operation);
	const request = {
		title: "Operator change",
		description,
		command: description,
		proposalHash: params.proposal.hash,
		allowedDecisions: require_system_agent_approvals.SYSTEM_AGENT_APPROVAL_DECISIONS,
		agentId: params.delegation?.agentId ?? null,
		sessionKey: params.delegation?.sessionKey ?? null,
		sessionId: params.sessionId,
		turnSourceChannel: null,
		turnSourceAccountId: null
	};
	const record = manager.create(request, require_system_agent_approvals.SYSTEM_AGENT_APPROVAL_TIMEOUT_MS, `system-agent:${(0, node_crypto.randomUUID)()}`);
	const decisionPromise = manager.register(record, require_system_agent_approvals.SYSTEM_AGENT_APPROVAL_TIMEOUT_MS);
	params.session.pendingApproval = {
		id: record.id,
		proposalHash: params.proposal.hash
	};
	const requestEvent = require_approval_shared.buildRequestedApprovalEvent(record);
	require_approval_shared.handlePendingApprovalRequest({
		manager,
		record,
		decisionPromise,
		respond: () => void 0,
		context: params.context,
		requestEventName: "operator.approval.requested",
		requestEvent,
		twoPhase: true,
		deliverRequest: () => false,
		keepPendingWithoutRoute: true,
		requireDeliveryRoute: false,
		afterDecision: async (decision) => {
			if (params.sessions.get(params.sessionId) !== params.session) return;
			if (params.session.pendingApproval?.id === record.id) params.session.pendingApproval = void 0;
			await params.session.engine.resolveOperatorApproval(decision, params.proposal.hash);
		},
		afterDecisionErrorLabel: "Operator approval apply failed"
	});
	return record.id;
}
const systemAgentHandlers = {
	"operator.approval.list": async ({ respond, client, context }) => {
		const manager = context.systemAgentApprovalManager;
		respond(true, manager ? require_approval_shared.listVisiblePendingApprovalRequests({
			manager,
			client
		}) : [], void 0);
	},
	/** Structured onboarding: list reusable AI access on this host. */
	"operator.setup.detect": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSystemAgentSetupDetectParams, "operator.setup.detect", respond)) return;
		await runSystemAgentGatewayTask(async () => {
			const { detectSetupInference } = await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs"));
			respond(true, await detectSetupInference(), void 0);
		});
	},
	/** Re-run the exact current default-agent inference route without mutating setup. */
	"operator.setup.verify": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSystemAgentSetupVerifyParams, "operator.setup.verify", respond)) return;
		await runSystemAgentGatewayTask(async () => {
			const { verifySetupInference } = await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs"));
			respond(true, await verifySetupInference({ runtime: require_runtime.defaultRuntime }), void 0);
		});
	},
	/** Start one provider-owned OAuth/device-code login over the shared wizard transport. */
	"operator.setup.auth.start": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSystemAgentSetupAuthStartParams, "operator.setup.auth.start", respond)) return;
		if (context.findRunningWizard()) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "wizard already running"));
			return;
		}
		const sessionId = params.sessionId;
		const session = new require_session.WizardSession(async (prompter, signal) => {
			const result = await runExclusiveSystemAgentSetupActivation(async () => runSystemAgentGatewayTask(async () => {
				const { activateSetupInference } = await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs"));
				return await activateSetupInference({
					kind: "provider-auth",
					authChoice: params.authChoice,
					...params.workspace !== void 0 ? { workspace: params.workspace } : {},
					surface: "gateway",
					runtime: {
						...require_runtime.defaultRuntime,
						exit: (code) => {
							throw new Error(`setup step exited with code ${String(code)}`);
						}
					},
					prompter,
					signal,
					isCancelled: () => signal.aborted,
					onCommitStarted: () => session.lockCancellation()
				});
			}));
			if (!result.ok) throw new Error(result.error);
		}, { timeoutMs: PROVIDER_AUTH_SESSION_TIMEOUT_MS });
		context.wizardSessions.set(sessionId, session);
		respond(true, {
			sessionId,
			done: false,
			status: "running"
		}, void 0);
	},
	/**
	* Structured onboarding: live-test one candidate and persist it on success.
	* Single-flight per gateway process because testing and persistence span
	* multiple config/plugin mutations. Concurrent callers fail fast instead of
	* queueing work that could outlive their RPC timeout. A failed attempt never
	* commits a broken model, managed plugin install, or setup state.
	*/
	"operator.setup.activate": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSystemAgentSetupActivateParams, "operator.setup.activate", respond)) return;
		try {
			await runExclusiveSystemAgentSetupActivation(async () => {
				await runSystemAgentGatewayTask(async () => {
					const { activateSetupInference } = await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs"));
					const runtime = {
						...require_runtime.defaultRuntime,
						exit: (code) => {
							throw new Error(`setup step exited with code ${String(code)}`);
						}
					};
					respond(true, await activateSetupInference({
						kind: params.kind,
						...params.modelRef !== void 0 ? { modelRef: params.modelRef } : {},
						...params.authChoice !== void 0 ? { authChoice: params.authChoice } : {},
						...params.apiKey !== void 0 ? { apiKey: params.apiKey } : {},
						...params.workspace !== void 0 ? { workspace: params.workspace } : {},
						surface: "gateway",
						runtime
					}), void 0);
				});
			});
		} catch (error) {
			if (!(error instanceof SystemAgentSetupActivationBusyError)) throw error;
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, error.message, { retryable: true }));
		}
	},
	"operator.chat": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateSystemAgentChatParams, "operator.chat", respond)) return;
		await runSystemAgentGatewayTask(async () => {
			const sessions = context.systemAgentSessions;
			const sessionId = params.sessionId;
			await getSystemAgentSessionQueue(sessions).enqueue(sessionId, async () => {
				const delegationKey = resolveSystemAgentDelegationKey(params.delegation);
				const boundSession = sessions.get(sessionId);
				if (boundSession && boundSession.delegationKey !== delegationKey) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "Operator session belongs to another caller."));
					return;
				}
				if (params.reset) {
					const existing = sessions.get(sessionId);
					sessions.delete(sessionId);
					if (existing?.pendingApproval) context.systemAgentApprovalManager?.expire(existing.pendingApproval.id, "session-reset");
					await existing?.engine.dispose();
				}
				let session = sessions.get(sessionId);
				if (!session) {
					const inference = params.delegation ? await Promise.resolve().then(() => require("./inference-fallback-D5oq7em3.cjs")).then(({ verifySystemAgentInferenceWithFallback }) => verifySystemAgentInferenceWithFallback({
						requestingAgentId: params.delegation?.agentId,
						runtime: require_runtime.defaultRuntime
					})) : await Promise.resolve().then(() => require("./setup-inference-BpDIKr54.cjs")).then(({ verifySetupInference }) => verifySetupInference({
						runtime: require_runtime.defaultRuntime,
						bindSession: true
					}));
					if (!inference.ok) {
						respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Operator requires working inference: ${inference.error}`));
						return;
					}
					const engine = new SystemAgentChatEngine({
						surface: "gateway",
						verifiedInference: inference.binding,
						operatorApprovalOnly: params.delegation !== void 0
					});
					let welcome;
					try {
						if (params.welcomeVariant === "onboarding") welcome = await require_onboarding_welcome.buildOnboardingWelcome({ engine });
						else {
							welcome = require_overview.formatSystemAgentStartupMessage(await engine.loadOverview());
							engine.noteAssistantMessage(welcome);
						}
					} catch (error) {
						await engine.dispose().catch(() => void 0);
						if (!require_inference_error.isSystemAgentInferenceUnavailableError(error)) throw error;
						respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, error.message));
						return;
					}
					await evictOldestSession(sessions, context);
					session = {
						engine,
						welcome,
						lastUsedAt: Date.now(),
						delegationKey
					};
					sessions.set(sessionId, session);
					if (params.message === void 0 || !params.message.trim()) {
						respond(true, {
							sessionId,
							reply: session.welcome,
							action: "none"
						}, void 0);
						return;
					}
				}
				session.lastUsedAt = Date.now();
				if (params.message === void 0 || !params.message.trim()) {
					respond(true, {
						sessionId,
						reply: session.welcome,
						action: "none"
					}, void 0);
					return;
				}
				let reply;
				try {
					reply = await session.engine.handle(params.message);
				} catch (error) {
					if (!require_inference_error.isSystemAgentInferenceUnavailableError(error)) throw error;
					if (sessions.get(sessionId)?.engine === session.engine) sessions.delete(sessionId);
					try {
						await session.engine.dispose();
					} catch {}
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, error.message));
					return;
				}
				const action = reply.action === "open-tui" ? "open-agent" : reply.action === "open-setup" ? "none" : reply.action;
				const delegation = params.delegation;
				let proposalId;
				if (delegation) {
					const proposal = session.engine.getPendingOperatorProposal();
					if (proposal) proposalId = queueDelegatedApproval({
						context,
						sessions,
						session,
						sessionId,
						delegation,
						proposal
					});
				}
				respond(true, {
					sessionId,
					reply: reply.text || (action === "open-agent" ? "Setup here is done — continue with your agent." : "Nothing to change."),
					action,
					...reply.sensitive === true ? { sensitive: true } : {},
					...proposalId ? {
						needsApproval: true,
						proposalId
					} : {}
				}, void 0);
			});
		});
	}
};
//#endregion
exports.runExclusiveSystemAgentSetupActivation = runExclusiveSystemAgentSetupActivation;
exports.systemAgentHandlers = systemAgentHandlers;
