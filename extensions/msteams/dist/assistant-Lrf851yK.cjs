const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_inference_error = require("./inference-error-BEoKlbh6.cjs");
const require_verified_inference = require("./verified-inference-DA_zZ9Fy.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
//#region src/system-agent/assistant.ts
async function planSystemAgentCommand(params) {
	return await planSystemAgentCommandWithConfiguredModel(params);
}
/** Plan only through the configured default agent's verified route. */
async function planSystemAgentCommandWithConfiguredModel(params) {
	const route = await requireVerifiedPlannerRoute(params.verifiedInference, params.deps);
	const input = params.input.trim();
	if (!input) return null;
	let expectedAgentHarnessRuntimeArtifact;
	try {
		expectedAgentHarnessRuntimeArtifact = require_verified_inference.resolveSystemAgentExpectedAgentHarnessRuntimeArtifact(params.verifiedInference);
	} catch (error) {
		throw new require_inference_error.SystemAgentInferenceUnavailableError("planner", [error]);
	}
	const prompt = require_inference_error.buildSystemAgentAssistantUserPrompt({
		input,
		overview: params.overview,
		...params.history ? { history: params.history } : {},
		...params.pendingOperation ? { pendingOperation: params.pendingOperation } : {}
	});
	const tempDir = await (params.deps?.createTempDir ?? createTempPlannerDir)();
	let plan;
	try {
		const runId = `operator-planner-${(0, node_crypto.randomUUID)()}`;
		const shared = {
			sessionId: `${runId}-session`,
			agentId: "@gabrielvfonseca/operator",
			trigger: "manual",
			sessionFile: node_path.default.join(tempDir, "session.jsonl"),
			workspaceDir: tempDir,
			cwd: tempDir,
			agentDir: route.agentDir,
			config: route.runConfig,
			prompt,
			provider: route.provider,
			model: route.model,
			timeoutMs: require_inference_error.SYSTEM_AGENT_ASSISTANT_TIMEOUT_MS,
			runId,
			extraSystemPrompt: require_inference_error.SYSTEM_AGENT_ASSISTANT_SYSTEM_PROMPT,
			extraSystemPromptStatic: require_inference_error.SYSTEM_AGENT_ASSISTANT_SYSTEM_PROMPT,
			messageChannel: "@gabrielvfonseca/operator",
			messageProvider: "@gabrielvfonseca/operator",
			disableTools: true,
			disableTrajectory: true,
			...route.authProfileId ? { authProfileId: route.authProfileId } : {}
		};
		const parsed = require_inference_error.parseSystemAgentAssistantPlanText(extractPlannerResultText(route.runner === "cli" ? await (params.deps?.runCliAgent ?? (await Promise.resolve().then(() => require("./cli-runner-ZSZWExo3.cjs")).then((n) => n.cli_runner_exports)).runCliAgent)({
			...shared,
			executionMode: "side-question",
			cleanupCliLiveSessionOnRunEnd: true
		}) : await (params.deps?.runEmbeddedAgent ?? (await Promise.resolve().then(() => require("./embedded-agent-C44j1_Yh.cjs")).then((n) => n.embedded_agent_exports)).runEmbeddedAgent)({
			...shared,
			toolsAllow: [],
			agentHarnessRuntimeOverride: route.agentHarnessRuntimeOverride,
			...expectedAgentHarnessRuntimeArtifact ? { expectedAgentHarnessRuntimeArtifact } : {},
			cleanupBundleMcpOnRunEnd: true,
			...route.authProfileId ? { authProfileIdSource: "user" } : {}
		})));
		plan = parsed ? {
			...parsed,
			modelLabel: route.modelLabel
		} : null;
	} catch (error) {
		if (error instanceof require_inference_error.SystemAgentInferenceUnavailableError) throw error;
		plan = null;
	} finally {
		await (params.deps?.removeTempDir ?? removeTempPlannerDir)(tempDir);
	}
	if (plan) await requireVerifiedPlannerRoute(params.verifiedInference, params.deps);
	return plan;
}
async function requireVerifiedPlannerRoute(binding, deps) {
	if (!binding) throw new require_inference_error.SystemAgentInferenceUnavailableError("planner");
	try {
		const route = await require_verified_inference.resolveSystemAgentVerifiedInferenceRoute(binding, deps);
		if (route) return route;
	} catch (error) {
		throw new require_inference_error.SystemAgentInferenceUnavailableError("planner", [error]);
	}
	throw new require_inference_error.SystemAgentInferenceUnavailableError("planner");
}
async function createTempPlannerDir() {
	return await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-planner-"));
}
async function removeTempPlannerDir(dir) {
	await node_fs_promises.default.rm(dir, {
		recursive: true,
		force: true
	});
}
function extractPlannerResultText(result) {
	return result.meta?.finalAssistantVisibleText ?? result.meta?.finalAssistantRawText ?? result.payloads?.map((payload) => payload.text?.trim()).filter(Boolean).join("\n");
}
//#endregion
exports.planSystemAgentCommand = planSystemAgentCommand;
