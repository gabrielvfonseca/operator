const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_command_registration = require("./command-registration-COcka0py.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_agent_tools = require("./agent-tools-C4N0fa5t.cjs");
const require_workspace = require("./workspace-BaJ9ukou.cjs");
const require_availability = require("./availability-BtRDBgBn.cjs");
const require_bootstrap_files = require("./bootstrap-files-DNCXmTWO.cjs");
const require_system_prompt_params = require("./system-prompt-params-Bvd3P1G7.cjs");
const require_sandbox = require("./sandbox-CjshBxRn.cjs");
const require_sandbox_skills = require("./sandbox-skills-P4Y-NAVT.cjs");
const require_exec_defaults = require("./exec-defaults-DvQXwpzS.cjs");
const require_sandbox_info = require("./sandbox-info-f5KIZ_13.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
const require_session_snapshot = require("./session-snapshot-BR4feGxF.cjs");
const require_runtime_policy_session_key = require("./runtime-policy-session-key-B2t93Xcz.cjs");
//#region src/auto-reply/reply/commands-system-prompt.ts
var commands_system_prompt_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveCommandsSystemPromptBundle: () => resolveCommandsSystemPromptBundle });
function resolveCommandSkillsEligibility(params) {
	try {
		const nodeSkills = require_exec_defaults.resolveNodeExecEligibility({
			cfg: params.config,
			sessionEntry: params.sessionEntry,
			sessionKey: params.sessionKey,
			agentId: params.agentId
		});
		return {
			nodeSkills,
			remote: require_remote.getRemoteSkillEligibility({ advertiseExecNode: nodeSkills.canExec })
		};
	} catch {
		try {
			return {
				nodeSkills: { canExec: false },
				remote: require_remote.getRemoteSkillEligibility({ advertiseExecNode: false })
			};
		} catch {
			return { nodeSkills: { canExec: false } };
		}
	}
}
async function resolveCommandSkillsPrompt(params) {
	if (params.sandboxed) try {
		const sandboxWorkspace = await require_sandbox.ensureSandboxWorkspaceForSession({
			config: params.config,
			sessionKey: params.sessionKey,
			workspaceDir: params.workspaceDir
		});
		if (!sandboxWorkspace) return "";
		if (sandboxWorkspace.containerWorkdir) {
			const { skillsEligibility, skillsPromptWorkspaceDir, skillsSnapshot: skillsSnapshotForRun, skillsWorkspaceDir, workspaceOnly } = require_sandbox_skills.resolveSandboxSkillRuntimeInputs({
				sandbox: {
					enabled: true,
					containerWorkdir: sandboxWorkspace.containerWorkdir,
					...sandboxWorkspace.skillsEligibility ? { skillsEligibility: sandboxWorkspace.skillsEligibility } : {},
					...sandboxWorkspace.skillsWorkspaceDir ? { skillsWorkspaceDir: sandboxWorkspace.skillsWorkspaceDir } : {},
					...sandboxWorkspace.workspaceAccess ? { workspaceAccess: sandboxWorkspace.workspaceAccess } : {}
				},
				effectiveWorkspace: sandboxWorkspace.workspaceDir
			});
			const { shouldLoadSkillEntries, skillEntries } = require_sandbox_skills.resolveEmbeddedRunSkillEntries({
				workspaceDir: skillsWorkspaceDir,
				config: params.config,
				agentId: params.agentId,
				eligibility: skillsEligibility,
				skillsSnapshot: skillsSnapshotForRun,
				workspaceOnly
			});
			return require_workspace.resolveSkillsPromptForRun({
				skillsSnapshot: skillsSnapshotForRun,
				entries: require_sandbox_skills.mapSandboxSkillEntriesForPrompt({
					entries: shouldLoadSkillEntries ? skillEntries : void 0,
					skillsWorkspaceDir,
					skillsPromptWorkspaceDir
				}),
				config: params.config,
				workspaceDir: skillsPromptWorkspaceDir,
				agentId: params.agentId,
				eligibility: skillsEligibility
			});
		}
	} catch {
		return "";
	}
	try {
		return require_session_snapshot.resolveReusableWorkspaceSkillSnapshot({
			workspaceDir: params.workspaceDir,
			config: params.config,
			agentId: params.agentId,
			eligibility: params.eligibility,
			watch: false
		}).snapshot.prompt ?? "";
	} catch {
		return "";
	}
}
async function resolveCommandsSystemPromptBundle(params) {
	const workspaceDir = params.workspaceDir;
	const targetSessionEntry = params.sessionStore?.[params.sessionKey] ?? params.sessionEntry;
	const { sessionAgentId } = require_agent_scope.resolveSessionAgentIds({
		sessionKey: params.sessionKey,
		config: params.cfg,
		agentId: params.agentId
	});
	const { bootstrapFiles, contextFiles: injectedFiles } = await require_bootstrap_files.resolveBootstrapContextForRun({
		workspaceDir,
		config: params.cfg,
		sessionKey: params.sessionKey,
		sessionId: targetSessionEntry?.sessionId,
		agentId: sessionAgentId
	});
	const toolPolicySessionKey = require_runtime_policy_session_key.resolveRuntimePolicySessionKey({
		cfg: params.cfg,
		ctx: params.ctx,
		sessionKey: params.sessionKey
	});
	const sandboxRuntime = require_runtime_status.resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: toolPolicySessionKey
	});
	const skillsEligibility = resolveCommandSkillsEligibility({
		agentId: sessionAgentId,
		config: params.cfg,
		sessionEntry: targetSessionEntry,
		sessionKey: params.sessionKey
	});
	const skillsPrompt = await resolveCommandSkillsPrompt({
		agentId: sessionAgentId,
		config: params.cfg,
		eligibility: skillsEligibility,
		sandboxed: sandboxRuntime.sandboxed,
		sessionKey: toolPolicySessionKey,
		workspaceDir
	});
	const tools = (() => {
		try {
			return require_agent_tools.createOperatorCodingTools({
				config: params.cfg,
				agentId: sessionAgentId,
				workspaceDir,
				sessionKey: toolPolicySessionKey,
				allowGatewaySubagentBinding: true,
				messageProvider: params.command.channel,
				groupId: targetSessionEntry?.groupId ?? void 0,
				groupChannel: targetSessionEntry?.groupChannel ?? void 0,
				groupSpace: targetSessionEntry?.space ?? void 0,
				spawnedBy: targetSessionEntry?.spawnedBy ?? void 0,
				senderId: params.command.senderId,
				senderName: params.ctx.SenderName,
				senderUsername: params.ctx.SenderUsername,
				senderE164: params.ctx.SenderE164,
				modelProvider: params.provider,
				modelId: params.model
			});
		} catch {
			return [];
		}
	})();
	const toolNames = tools.map((t) => t.name);
	const promptSurface = require_system_prompt_params.resolveAgentPromptSurfaceForSessionKey(params.sessionKey);
	const defaultModelRef = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: sessionAgentId
	});
	const defaultModelLabel = `${defaultModelRef.provider}/${defaultModelRef.model}`;
	const { runtimeInfo, userTimezone, userTime, userTimeFormat } = require_system_prompt_params.buildSystemPromptParams({
		config: params.cfg,
		agentId: sessionAgentId,
		workspaceDir,
		cwd: process.cwd(),
		runtime: {
			sessionKey: params.sessionKey,
			sessionId: targetSessionEntry?.sessionId,
			host: "unknown",
			os: "unknown",
			arch: "unknown",
			node: process.version,
			model: `${params.provider}/${params.model}`,
			defaultModel: defaultModelLabel
		}
	});
	const fullAccessState = require_sandbox_info.resolveEmbeddedFullAccessState({ execElevated: {
		enabled: params.elevated.enabled,
		allowed: params.elevated.allowed,
		defaultLevel: params.resolvedElevatedLevel ?? "off"
	} });
	const sandboxInfo = sandboxRuntime.sandboxed ? {
		enabled: true,
		workspaceDir,
		workspaceAccess: "rw",
		elevated: {
			allowed: params.elevated.allowed,
			defaultLevel: params.resolvedElevatedLevel ?? "off",
			fullAccessAvailable: fullAccessState.available,
			...fullAccessState.blockedReason ? { fullAccessBlockedReason: fullAccessState.blockedReason } : {}
		}
	} : { enabled: false };
	return {
		systemPrompt: require_system_prompt_params.buildConfiguredAgentSystemPrompt({
			config: params.cfg,
			agentId: sessionAgentId,
			workspaceDir,
			defaultThinkLevel: params.resolvedThinkLevel,
			reasoningLevel: params.resolvedReasoningLevel,
			extraSystemPrompt: void 0,
			ownerNumbers: void 0,
			reasoningTagHint: false,
			toolNames,
			userTimezone,
			userTime,
			userTimeFormat,
			contextFiles: injectedFiles,
			skillsPrompt,
			heartbeatPrompt: void 0,
			acpEnabled: require_availability.isAcpRuntimeSpawnAvailable({
				config: params.cfg,
				sandboxed: sandboxRuntime.sandboxed
			}),
			promptSurface,
			nativeCommandGuidanceLines: require_command_registration.listRegisteredPluginAgentPromptGuidance({ surface: promptSurface }),
			runtimeInfo,
			sandboxInfo
		}),
		tools,
		skillsPrompt,
		bootstrapFiles,
		injectedFiles,
		sandboxRuntime
	};
}
//#endregion
Object.defineProperty(exports, "commands_system_prompt_exports", {
	enumerable: true,
	get: function() {
		return commands_system_prompt_exports;
	}
});
Object.defineProperty(exports, "resolveCommandsSystemPromptBundle", {
	enumerable: true,
	get: function() {
		return resolveCommandsSystemPromptBundle;
	}
});
