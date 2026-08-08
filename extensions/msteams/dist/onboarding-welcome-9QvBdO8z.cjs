const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_overview = require("./overview-BUkXf7FH.cjs");
//#region src/system-agent/onboarding-welcome.ts
/**
* The basic bootstrap is conversational: the welcome message carries the plan
* and the engine holds it as the pending proposal, so a bare "yes" applies it.
* This path starts only after a live inference turn. Already-configured
* installs get the channels/handoff guide instead.
*/
/**
* "Configured" must match the app onboarding gate (wizard metadata or gateway
* auth), not just a model: a model-only config would otherwise get the
* ready-guide welcome while the gate stays locked, stranding the page.
*/
async function loadAuthoredSetupConfig(params) {
	const authoredConfig = await (async () => {
		if (!params.configExists || !params.configValid) return;
		try {
			const { readConfigFileSnapshot } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
			const snapshot = await readConfigFileSnapshot();
			return snapshot.sourceConfig ?? snapshot.config ?? {};
		} catch {
			return;
		}
	})();
	const auth = authoredConfig?.gateway?.auth;
	const hasAuthMode = require_types_secrets.normalizeSecretInputString(auth?.mode) !== void 0;
	const hasAuthSecret = require_types_secrets.isSecretRef(auth?.token) || require_types_secrets.normalizeSecretInputString(auth?.token) !== void 0 || require_types_secrets.isSecretRef(auth?.password) || require_types_secrets.normalizeSecretInputString(auth?.password) !== void 0;
	const hasAuthoredSetup = authoredConfig?.wizard !== void 0 && Object.keys(authoredConfig.wizard).length > 0 || hasAuthMode || hasAuthSecret;
	return {
		...authoredConfig ? { authoredConfig } : {},
		hasAuthoredSetup
	};
}
async function buildOnboardingWelcome(params) {
	const overview = await params.engine.loadOverview();
	const { authoredConfig, hasAuthoredSetup } = await loadAuthoredSetupConfig({
		configExists: overview.config.exists,
		configValid: overview.config.valid
	});
	const defaultModel = overview.defaultModel?.trim();
	const requestedWorkspace = params.workspace?.trim() ? require_home_dir.resolveUserPath(params.workspace.trim()) : void 0;
	const authoredWorkspace = authoredConfig?.agents?.defaults?.workspace?.trim() ? require_home_dir.resolveUserPath(authoredConfig.agents.defaults.workspace.trim()) : void 0;
	if (hasAuthoredSetup && defaultModel && (!requestedWorkspace || requestedWorkspace === authoredWorkspace)) {
		const welcome = require_overview.formatSystemAgentOnboardingWelcome(overview);
		params.engine.noteAssistantMessage(welcome);
		return welcome;
	}
	if (!defaultModel) throw new Error("Operator onboarding requires working inference first. Run `openclaw onboard` to configure and verify a default model.");
	const { DEFAULT_WORKSPACE } = await Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs"));
	const workspace = require_home_dir.resolveUserPath(requestedWorkspace || authoredWorkspace || DEFAULT_WORKSPACE);
	params.engine.propose({
		kind: "setup",
		workspace
	});
	const welcome = [
		"## Hi, I'm Operator — let's hatch your agent.",
		"",
		"No menus here: tell me what you want and I'll do the configuring. I looked around this machine:",
		"",
		`- AI: ${defaultModel} — already verified with a real reply; switching later is one sentence.`,
		`- Workspace: ${require_utils.shortenHomePath(workspace)}`,
		"- Gateway: runs locally, private to this machine (token auth).",
		"",
		"Say **yes** and I'll set all of that up now.",
		"",
		"Heads up: your agent gets real access to this machine — https://docs.operator.ai/security",
		"Afterwards: `connect discord`, `connect slack`, `connect telegram`, `connect whatsapp` (or `channels` for the full list), then `talk to agent` to meet your agent."
	].join("\n");
	params.engine.noteAssistantMessage(welcome);
	return welcome;
}
//#endregion
Object.defineProperty(exports, "buildOnboardingWelcome", {
	enumerable: true,
	get: function() {
		return buildOnboardingWelcome;
	}
});
Object.defineProperty(exports, "loadAuthoredSetupConfig", {
	enumerable: true,
	get: function() {
		return loadAuthoredSetupConfig;
	}
});
