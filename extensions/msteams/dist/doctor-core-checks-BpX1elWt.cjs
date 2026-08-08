const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config = require("./config-BmhbwvVp.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
require("./auth-DnGY7_cY.cjs");
const require_tool_policy_diagnostic = require("./tool-policy-diagnostic-BS7n67T1.cjs");
const require_auth_token_resolution = require("./auth-token-resolution-CC5kmaAu.cjs");
const require_auth_mode_policy = require("./auth-mode-policy-DbgAYq72.cjs");
const require_doctor_browser = require("./doctor-browser-DdClXygv.cjs");
const require_doctor_command_owner = require("./doctor-command-owner-Dayex2zB.cjs");
const require_doctor_completion = require("./doctor-completion-D7jrsVvS.cjs");
const require_doctor_session_locks = require("./doctor-session-locks-DfTK10FP.cjs");
const require_doctor_skills_core = require("./doctor-skills-core-BRGuSUIM.cjs");
const require_doctor_ui = require("./doctor-ui-DK9srIDw.cjs");
const require_codex_route_warnings = require("./codex-route-warnings-DZiR4oAu.cjs");
const require_health_check_registry = require("./health-check-registry-D8Fw0oHu.cjs");
const require_exec_resolution_policy = require("./exec-resolution-policy-mrNb6tkm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/flows/doctor-core-checks.ts
const BROWSER_CLAWD_PROFILE_RESIDUE_CHECK_ID = "core/doctor/browser-clawd-profile-residue";
const CODEX_SESSION_ROUTES_CHECK_ID = "core/doctor/codex-session-routes";
const FINAL_CONFIG_VALIDATION_CHECK_ID = "core/doctor/final-config-validation";
const GATEWAY_DAEMON_CHECK_ID = "core/doctor/gateway-daemon";
const GATEWAY_HEALTH_CHECK_ID = "core/doctor/gateway-health";
const GATEWAY_SERVICES_EXTRA_CHECK_ID = "core/doctor/gateway-services/extra";
const SESSION_LOCKS_CHECK_ID = "core/doctor/session-locks";
const SKILL_WORKSHOP_TOOL_POLICY_CHECK_ID = "core/doctor/skill-workshop-tool-policy";
const loadDoctorCoreChecksRuntimeModule = async () => await Promise.resolve().then(() => require("./doctor-core-checks.runtime-_ay9eJK7.cjs"));
const loadDoctorWorkspaceModule = async () => await Promise.resolve().then(() => require("./doctor-workspace-BL9MDwGb.cjs"));
async function detectUnavailableSkillsWithRuntime(cfg) {
	return (await loadDoctorCoreChecksRuntimeModule()).detectUnavailableSkills(cfg);
}
async function collectSecurityWarningsWithRuntime(cfg) {
	const { collectSecurityWarnings } = await Promise.resolve().then(() => require("./doctor-security-_8aW4_jw.cjs"));
	return collectSecurityWarnings(cfg);
}
async function collectWorkspaceSuggestionNotesWithRuntime(workspaceDir) {
	const { collectWorkspaceBackupTip } = await Promise.resolve().then(() => require("./doctor-state-integrity-D_kYYYAD.cjs"));
	const { MEMORY_SYSTEM_PROMPT, shouldSuggestMemorySystem } = await loadDoctorWorkspaceModule();
	const notes = [];
	const backupTip = collectWorkspaceBackupTip(workspaceDir);
	if (backupTip) notes.push(backupTip);
	if (await shouldSuggestMemorySystem(workspaceDir)) notes.push(MEMORY_SYSTEM_PROMPT);
	return notes;
}
async function collectRuntimeToolSchemaFindingsWithRuntime(ctx) {
	return (await loadDoctorCoreChecksRuntimeModule()).collectRuntimeToolSchemaFindings(ctx.cfg);
}
async function collectProviderCatalogProjectionFindingsWithRuntime(ctx) {
	return (await loadDoctorCoreChecksRuntimeModule()).collectProviderCatalogProjectionFindings(ctx.cfg);
}
async function collectLocalAudioAccelerationFindingsWithRuntime() {
	return (await loadDoctorCoreChecksRuntimeModule()).collectLocalAudioAccelerationFindings();
}
async function collectGatewayHealthFindingsWithRuntime(ctx) {
	return (await loadDoctorCoreChecksRuntimeModule()).collectGatewayHealthFindings(ctx);
}
async function collectGatewayDaemonFindingsWithRuntime(ctx) {
	return (await loadDoctorCoreChecksRuntimeModule()).collectGatewayDaemonFindings(ctx);
}
const defaultCoreHealthCheckDeps = {
	detectUnavailableSkills: detectUnavailableSkillsWithRuntime,
	collectSecurityWarnings: collectSecurityWarningsWithRuntime,
	collectWorkspaceSuggestionNotes: collectWorkspaceSuggestionNotesWithRuntime,
	collectRuntimeToolSchemaFindings: collectRuntimeToolSchemaFindingsWithRuntime,
	collectProviderCatalogProjectionFindings: collectProviderCatalogProjectionFindingsWithRuntime,
	collectLocalAudioAccelerationFindings: collectLocalAudioAccelerationFindingsWithRuntime,
	collectGatewayHealthFindings: collectGatewayHealthFindingsWithRuntime,
	collectGatewayDaemonFindings: collectGatewayDaemonFindingsWithRuntime
};
function configValidationIssuesToHealthFindings(issues) {
	return issues.map((issue) => ({
		checkId: FINAL_CONFIG_VALIDATION_CHECK_ID,
		severity: "error",
		message: issue.message,
		path: issue.path || "<root>"
	}));
}
const gatewayConfigCheck = {
	id: "core/doctor/gateway-config",
	kind: "core",
	description: "operator.jsonc gateway block is set and unambiguous.",
	source: "doctor",
	async detect(ctx) {
		const findings = [];
		if (!ctx.cfg.gateway?.mode) findings.push({
			checkId: "core/doctor/gateway-config",
			severity: "warning",
			message: "gateway.mode is unset; gateway start will be blocked.",
			path: "gateway.mode",
			fixHint: "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
		});
		if (ctx.cfg.gateway?.mode !== "remote" && require_auth_mode_policy.hasAmbiguousGatewayAuthModeConfig(ctx.cfg)) findings.push({
			checkId: "core/doctor/gateway-config",
			severity: "warning",
			message: "gateway.auth.token and gateway.auth.password are both configured while gateway.auth.mode is unset; auth selection is ambiguous.",
			path: "gateway.auth.mode",
			fixHint: "Set an explicit mode: `openclaw config set gateway.auth.mode token` or `... password`."
		});
		return findings;
	}
};
const commandOwnerCheck = {
	id: "core/doctor/command-owner",
	kind: "core",
	description: "An owner account is configured for owner-only commands.",
	source: "doctor",
	async detect(ctx) {
		if (require_doctor_command_owner.hasConfiguredCommandOwners(ctx.cfg)) return [];
		return [{
			checkId: "core/doctor/command-owner",
			severity: "info",
			message: "No command owner is configured. Owner-only commands (/diagnostics, /export-trajectory, /config, exec approvals) have no allowed sender.",
			path: "commands.ownerAllowFrom",
			fixHint: "Set commands.ownerAllowFrom to your channel user id, e.g. `openclaw config set commands.ownerAllowFrom '[\"telegram:123456789\"]'`."
		}];
	}
};
const skillWorkshopToolPolicyCheck = {
	id: SKILL_WORKSHOP_TOOL_POLICY_CHECK_ID,
	kind: "core",
	description: "Autonomous Skill Workshop capture has a callable review tool.",
	source: "doctor",
	async detect(ctx) {
		const diagnostic = require_tool_policy_diagnostic.detectSkillWorkshopToolPolicyDiagnostic({
			config: ctx.cfg,
			workshopEnabled: require_config.resolveSkillWorkshopConfig(ctx.cfg).autonomous.enabled
		});
		if (!diagnostic) return [];
		return [{
			checkId: SKILL_WORKSHOP_TOOL_POLICY_CHECK_ID,
			severity: "warning",
			message: diagnostic.detail,
			path: diagnostic.source,
			target: diagnostic.agentId,
			requirement: "Autonomous Skill Workshop review requires the skill_workshop tool.",
			fixHint: diagnostic.fix
		}];
	}
};
function resolveDoctorMode(cfg) {
	return cfg.gateway?.mode === "remote" ? "remote" : "local";
}
function buildGatewayTokenSecretRefUnavailableMessage(params) {
	if (params.unresolvedRefReason) return `Gateway token SecretRef could not be resolved: ${params.unresolvedRefReason}`;
	if (params.ref.source === "exec") {
		const staticError = require_exec_resolution_policy.getSkippedExecRefStaticError({
			ref: params.ref,
			config: params.cfg
		});
		if (staticError) return `Gateway token SecretRef could not be verified: ${staticError}`;
		return "Gateway token SecretRef uses an exec provider and did not resolve.";
	}
	return "Gateway token is managed via SecretRef and is currently unavailable.";
}
function buildGatewayTokenSecretRefFixHint(ref) {
	if (ref.source === "exec") return "Run `openclaw doctor --allow-exec` to verify exec SecretRefs during doctor, or `openclaw secrets audit --allow-exec` to audit all exec SecretRefs.";
	return "Resolve or rotate the external secret source, then rerun doctor.";
}
const gatewayAuthCheck = {
	id: "core/doctor/gateway-auth",
	kind: "core",
	description: "Local Gateway auth mode has a usable token or another explicit auth mode.",
	source: "doctor",
	async detect(ctx) {
		if (resolveDoctorMode(ctx.cfg) !== "local") return [];
		const gatewayTokenRef = require_types_secrets.resolveSecretInputRef({
			value: ctx.cfg.gateway?.auth?.token,
			defaults: ctx.cfg.secrets?.defaults
		}).ref;
		const auth = require_auth_resolve.resolveGatewayAuth({
			authConfig: ctx.cfg.gateway?.auth,
			tailscaleMode: ctx.cfg.gateway?.tailscale?.mode ?? "off"
		});
		const hasInlineToken = typeof auth.token === "string" && auth.token.trim() !== "";
		if (!(auth.mode !== "password" && auth.mode !== "none" && auth.mode !== "trusted-proxy" && (auth.mode !== "token" || !hasInlineToken || Boolean(gatewayTokenRef)))) return [];
		let unresolvedRefReason;
		if (gatewayTokenRef && gatewayTokenRef.source === "exec") if (require_exec_resolution_policy.getSkippedExecRefStaticError({
			ref: gatewayTokenRef,
			config: ctx.cfg
		})) unresolvedRefReason = void 0;
		else if (ctx.allowExecSecretRefs !== true) return [];
		else {
			const resolvedToken = await require_auth_token_resolution.resolveGatewayAuthToken({
				cfg: ctx.cfg,
				env: process.env,
				unresolvedReasonStyle: "detailed",
				envFallback: "never"
			});
			if (resolvedToken.source === "secretRef") return [];
			unresolvedRefReason = resolvedToken.unresolvedRefReason;
		}
		else {
			const resolvedToken = await require_auth_token_resolution.resolveGatewayAuthToken({
				cfg: ctx.cfg,
				env: process.env,
				unresolvedReasonStyle: "detailed",
				envFallback: gatewayTokenRef ? "never" : "always"
			});
			if (gatewayTokenRef ? resolvedToken.source === "secretRef" : resolvedToken.token) return [];
			unresolvedRefReason = resolvedToken.unresolvedRefReason;
		}
		if (gatewayTokenRef) return [{
			checkId: "core/doctor/gateway-auth",
			severity: "warning",
			message: buildGatewayTokenSecretRefUnavailableMessage({
				cfg: ctx.cfg,
				ref: gatewayTokenRef,
				unresolvedRefReason
			}),
			path: "gateway.auth.token",
			fixHint: buildGatewayTokenSecretRefFixHint(gatewayTokenRef)
		}];
		return [{
			checkId: "core/doctor/gateway-auth",
			severity: "warning",
			message: "Gateway auth is off or missing a token.",
			path: "gateway.auth",
			fixHint: "Run `openclaw doctor --fix --generate-gateway-token` to generate a token."
		}];
	}
};
const hooksModelCheck = {
	id: "core/doctor/hooks-model",
	kind: "core",
	description: "hooks.gmail.model resolves to an allowed catalog model.",
	source: "doctor",
	async detect(ctx) {
		if (!ctx.cfg.hooks?.gmail?.model?.trim()) return [];
		const { DEFAULT_MODEL, DEFAULT_PROVIDER } = await Promise.resolve().then(() => require("./defaults-BplP0QgT.cjs")).then((n) => n.defaults_exports);
		const { loadModelCatalog } = await Promise.resolve().then(() => require("./model-catalog-BFgB2-Jk.cjs")).then((n) => n.model_catalog_exports);
		const { getModelRefStatus, resolveConfiguredModelRef, resolveHooksGmailModel } = await Promise.resolve().then(() => require("./model-selection-BvFurMxy.cjs")).then((n) => n.model_selection_exports);
		const hooksModelRef = resolveHooksGmailModel({
			cfg: ctx.cfg,
			defaultProvider: DEFAULT_PROVIDER
		});
		if (!hooksModelRef) return [{
			checkId: "core/doctor/hooks-model",
			severity: "warning",
			message: `hooks.gmail.model "${ctx.cfg.hooks.gmail.model}" could not be resolved.`,
			path: "hooks.gmail.model"
		}];
		const { provider: defaultProvider, model: defaultModel } = resolveConfiguredModelRef({
			cfg: ctx.cfg,
			defaultProvider: DEFAULT_PROVIDER,
			defaultModel: DEFAULT_MODEL
		});
		const catalog = await loadModelCatalog({
			config: ctx.cfg,
			readOnly: true
		});
		const status = getModelRefStatus({
			cfg: ctx.cfg,
			catalog,
			ref: hooksModelRef,
			defaultProvider,
			defaultModel
		});
		const findings = [];
		if (!status.allowed) findings.push({
			checkId: "core/doctor/hooks-model",
			severity: "warning",
			message: `hooks.gmail.model "${status.key}" is not in agents.defaults.models allowlist.`,
			path: "hooks.gmail.model",
			fixHint: "Add the model to agents.defaults.models or remove hooks.gmail.model."
		});
		if (!status.inCatalog) findings.push({
			checkId: "core/doctor/hooks-model",
			severity: "warning",
			message: `hooks.gmail.model "${status.key}" is not in the model catalog.`,
			path: "hooks.gmail.model",
			fixHint: "Choose a model from the configured provider catalog."
		});
		return findings;
	}
};
const legacyStateCheck = {
	id: "core/doctor/legacy-state",
	kind: "core",
	description: "Legacy sessions, agent state, and channel auth paths have been migrated.",
	source: "doctor",
	defaultEnabled: false,
	async detect(ctx) {
		const { detectLegacyStateMigrations } = await Promise.resolve().then(() => require("./doctor-state-migrations-DQ16Flpu.cjs"));
		const detected = await detectLegacyStateMigrations({
			cfg: ctx.cfg,
			doctorOnlyStateMigrations: true
		});
		return [...detected.preview.map((line) => ({
			checkId: "core/doctor/legacy-state",
			severity: "warning",
			message: line.replace(/^- /, ""),
			path: detected.stateDir,
			fixHint: "Run `openclaw doctor --fix` to migrate legacy state."
		})), ...detected.warnings.map((warning) => ({
			checkId: "core/doctor/legacy-state",
			severity: "warning",
			message: warning,
			path: detected.stateDir,
			fixHint: "Resolve the warning, then rerun `openclaw doctor --fix`."
		}))];
	}
};
const bootstrapSizeCheck = {
	id: "core/doctor/bootstrap-size",
	kind: "core",
	description: "Workspace bootstrap files fit within configured injection limits.",
	source: "doctor",
	async detect(ctx) {
		const { buildBootstrapInjectionStats, analyzeBootstrapBudget } = await Promise.resolve().then(() => require("./bootstrap-budget-B73ETWvB.cjs")).then((n) => n.bootstrap_budget_exports);
		const { resolveBootstrapContextForRun } = await Promise.resolve().then(() => require("./bootstrap-files-DNCXmTWO.cjs")).then((n) => n.bootstrap_files_exports);
		const { resolveBootstrapMaxChars, resolveBootstrapTotalMaxChars } = await Promise.resolve().then(() => require("./embedded-agent-helpers-DJEcJifp.cjs")).then((n) => n.embedded_agent_helpers_exports);
		const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(ctx.cfg);
		const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(ctx.cfg, defaultAgentId);
		const { bootstrapFiles, contextFiles } = await resolveBootstrapContextForRun({
			workspaceDir,
			config: ctx.cfg,
			agentId: defaultAgentId
		});
		const analysis = analyzeBootstrapBudget({
			files: buildBootstrapInjectionStats({
				bootstrapFiles,
				injectedFiles: contextFiles
			}),
			bootstrapMaxChars: resolveBootstrapMaxChars(ctx.cfg, defaultAgentId),
			bootstrapTotalMaxChars: resolveBootstrapTotalMaxChars(ctx.cfg, defaultAgentId)
		});
		const findings = [];
		for (const file of analysis.truncatedFiles) findings.push({
			checkId: "core/doctor/bootstrap-size",
			severity: "warning",
			message: `${file.name} exceeds bootstrap limits and will be truncated.`,
			path: file.path,
			fixHint: "Reduce the file size or tune `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` for this agent, or the corresponding `agents.defaults.*` fallback."
		});
		for (const file of analysis.nearLimitFiles) {
			if (file.truncated) continue;
			findings.push({
				checkId: "core/doctor/bootstrap-size",
				severity: "info",
				message: `${file.name} is near the configured bootstrap file limit.`,
				path: file.path,
				fixHint: "Reduce the file size or tune `agents.list[].bootstrapMaxChars` for this agent, or `agents.defaults.bootstrapMaxChars` as fallback, for per-file limits."
			});
		}
		if (analysis.totalNearLimit) findings.push({
			checkId: "core/doctor/bootstrap-size",
			severity: analysis.hasTruncation ? "warning" : "info",
			message: "Total bootstrap context is near the configured total limit.",
			path: workspaceDir,
			fixHint: "Reduce bootstrap file sizes or tune `agents.list[].bootstrapTotalMaxChars` for this agent, or `agents.defaults.bootstrapTotalMaxChars` as fallback."
		});
		return findings;
	}
};
function createRuntimeToolSchemaCheck(deps) {
	return {
		id: "core/doctor/runtime-tool-schemas",
		kind: "core",
		description: "Active agent tool schemas project into model/runtime-compatible tool inputs.",
		source: "doctor",
		async detect(ctx) {
			return deps.collectRuntimeToolSchemaFindings(ctx);
		}
	};
}
function createProviderCatalogProjectionCheck(deps) {
	return {
		id: "core/doctor/provider-catalog-projection",
		kind: "core",
		description: "Provider catalog hooks project into unified text model catalog rows.",
		source: "doctor",
		async detect(ctx) {
			return deps.collectProviderCatalogProjectionFindings(ctx);
		}
	};
}
function normalizeDoctorNoteLine(line) {
	return line.replace(/^- /, "").trim();
}
function noteTextToFinding(params) {
	const lines = params.text.split("\n");
	const first = normalizeDoctorNoteLine(lines[0] ?? params.text);
	const rest = lines.slice(1).join("\n");
	return {
		checkId: params.checkId,
		severity: params.severity,
		message: first,
		...rest ? { fixHint: rest } : {}
	};
}
function inferCapturedNoteSeverity(text) {
	if (text.includes("CRITICAL")) return "error";
	if (text.includes("- Fix:") || text.includes("unavailable") || text.includes("not found") || text.includes("missing") || text.includes("not readable") || text.includes("not writable") || text.includes("readonly")) return "warning";
	return "info";
}
function createNoteCollector(checkId) {
	const findings = [];
	const noteFn = (message) => {
		const text = noteMessageToText(message);
		if (!text.trim()) return;
		const severity = inferCapturedNoteSeverity(text);
		if (severity === "info") return;
		findings.push(noteTextToFinding({
			checkId,
			severity,
			text
		}));
	};
	return {
		findings,
		noteFn
	};
}
function noteMessageToText(message) {
	if (message instanceof Error) return message.message;
	if (message == null) return "";
	if (typeof message === "string") return message;
	if (typeof message === "number" || typeof message === "boolean" || typeof message === "bigint") return String(message);
	try {
		return JSON.stringify(message) ?? "";
	} catch {
		return "";
	}
}
const claudeCliCheck = {
	id: "core/doctor/claude-cli",
	kind: "core",
	description: "Claude CLI readiness is captured as structured findings.",
	source: "doctor",
	async detect(ctx) {
		const { noteClaudeCliHealth } = await Promise.resolve().then(() => require("./doctor-claude-cli-Ca2ZKJ3y.cjs"));
		const collector = createNoteCollector("core/doctor/claude-cli");
		noteClaudeCliHealth(ctx.cfg, {
			noteFn: collector.noteFn,
			...ctx.cwd ? { workspaceDir: ctx.cwd } : {}
		});
		return collector.findings;
	}
};
function createSecurityCheck(deps) {
	return {
		id: "core/doctor/security",
		kind: "core",
		description: "Security posture checks produce structured findings.",
		source: "doctor",
		async detect(ctx) {
			return (await deps.collectSecurityWarnings(ctx.cfg)).map((warning) => noteTextToFinding({
				checkId: "core/doctor/security",
				severity: warning.includes("CRITICAL") ? "error" : "warning",
				text: warning
			}));
		}
	};
}
const openAIOAuthTlsCheck = {
	id: "core/doctor/oauth-tls",
	kind: "core",
	description: "OpenAI OAuth TLS prerequisites are satisfied before browser auth.",
	source: "doctor",
	async detect(ctx) {
		const { formatOpenAIOAuthTlsPreflightFix, runOpenAIOAuthTlsPreflight, shouldRunOpenAIOAuthTlsPrerequisites } = await Promise.resolve().then(() => require("./provider-openai-chatgpt-oauth-tls-CgEwMtGK.cjs"));
		if (!shouldRunOpenAIOAuthTlsPrerequisites({
			cfg: ctx.cfg,
			deep: ctx.mode === "doctor"
		})) return [];
		const result = await runOpenAIOAuthTlsPreflight({ timeoutMs: 4e3 });
		if (result.ok || result.kind !== "tls-cert") return [];
		return [noteTextToFinding({
			checkId: "core/doctor/oauth-tls",
			severity: "warning",
			text: formatOpenAIOAuthTlsPreflightFix(result)
		})];
	}
};
const legacyWhatsAppCrontabCheck = {
	id: "core/doctor/legacy-whatsapp-crontab",
	kind: "core",
	description: "Legacy WhatsApp crontab health entries are detected as structured findings.",
	source: "doctor",
	defaultEnabled: false,
	async detect() {
		const { collectLegacyWhatsAppCrontabHealthWarning } = await Promise.resolve().then(() => require("./cron-BWC6J93W.cjs"));
		const warning = await collectLegacyWhatsAppCrontabHealthWarning();
		if (!warning) return [];
		return [noteTextToFinding({
			checkId: "core/doctor/legacy-whatsapp-crontab",
			severity: "warning",
			text: warning
		})];
	}
};
const legacyCronStoreCheck = {
	id: "core/doctor/legacy-cron-store",
	kind: "core",
	description: "Legacy cron store, run-log, and payload state is normalized.",
	source: "doctor",
	defaultEnabled: false,
	async detect(ctx) {
		const { collectLegacyCronStoreHealthFindings } = await Promise.resolve().then(() => require("./cron-BWC6J93W.cjs"));
		return collectLegacyCronStoreHealthFindings({ cfg: ctx.cfg });
	}
};
const codexSessionRoutesCheck = {
	id: CODEX_SESSION_ROUTES_CHECK_ID,
	kind: "core",
	description: "Codex runtime routes have a registered Codex plugin harness before sessions run.",
	source: "doctor",
	async detect(ctx) {
		return require_codex_route_warnings.collectDisabledCodexPluginRouteIssues(ctx.cfg).map((issue) => ({
			checkId: CODEX_SESSION_ROUTES_CHECK_ID,
			severity: "warning",
			message: [`${issue.path} routes ${issue.modelRef} to ${issue.canonicalModel}`, "with Codex runtime, but the Codex plugin is disabled by config."].join(" "),
			path: issue.path,
			target: issue.canonicalModel,
			requirement: "Codex plugin enabled for routes that use the Codex runtime.",
			fixHint: issue.blockedOutsideEntry ? ["Enable plugin loading and remove codex from plugins.deny,", "or set the affected OpenAI models to an Operator runtime policy."].join(" ") : ["Run `openclaw doctor --fix`: it enables plugins.entries.codex,", "or set the affected OpenAI models to an Operator runtime policy."].join(" ")
		}));
	}
};
const gatewayServicesExtraCheck = {
	id: GATEWAY_SERVICES_EXTRA_CHECK_ID,
	kind: "core",
	description: "Extra gateway-like services are represented as structured findings.",
	source: "doctor",
	async detect(ctx) {
		const coreCtx = ctx;
		const { detectExtraGatewayServiceIssues, extraGatewayServiceToHealthFinding } = await Promise.resolve().then(() => require("./doctor-gateway-services-BOIqIIVv.cjs"));
		return (await detectExtraGatewayServiceIssues({ deep: coreCtx.deep === true })).map(extraGatewayServiceToHealthFinding);
	},
	async repair(ctx) {
		const coreCtx = ctx;
		const { detectExtraGatewayServiceIssues, extraGatewayServiceToRepairEffects } = await Promise.resolve().then(() => require("./doctor-gateway-services-BOIqIIVv.cjs"));
		const effects = (await detectExtraGatewayServiceIssues({ deep: coreCtx.deep === true })).flatMap(extraGatewayServiceToRepairEffects);
		if (ctx.dryRun === true) return {
			status: "repaired",
			changes: [],
			effects
		};
		return {
			status: "skipped",
			reason: "legacy doctor gateway service contribution owns cleanup",
			changes: [],
			effects
		};
	}
};
const gatewayPlatformNotesCheck = {
	id: "core/doctor/gateway-services/platform-notes",
	kind: "core",
	description: "Gateway platform notes are captured as structured findings.",
	source: "doctor",
	async detect(ctx) {
		const { collectMacGatewayPlatformWarnings } = await Promise.resolve().then(() => require("./doctor-platform-notes-ROt7Bp6B.cjs"));
		return (await collectMacGatewayPlatformWarnings(ctx.cfg)).map((warning) => noteTextToFinding({
			checkId: "core/doctor/gateway-services/platform-notes",
			severity: "warning",
			text: warning
		}));
	}
};
function createGatewayHealthCheck(deps) {
	return {
		id: GATEWAY_HEALTH_CHECK_ID,
		kind: "core",
		description: "Gateway reachability is represented as structured findings.",
		source: "doctor",
		defaultEnabled: false,
		async detect(ctx) {
			return deps.collectGatewayHealthFindings(ctx);
		}
	};
}
function createGatewayDaemonCheck(deps) {
	return {
		id: GATEWAY_DAEMON_CHECK_ID,
		kind: "core",
		description: "Local Gateway daemon service state is represented as structured findings.",
		source: "doctor",
		defaultEnabled: false,
		async detect(ctx) {
			return deps.collectGatewayDaemonFindings(ctx);
		}
	};
}
const sessionLocksCheck = {
	id: SESSION_LOCKS_CHECK_ID,
	kind: "core",
	description: "Stale session lock files are represented as structured findings.",
	source: "doctor",
	defaultEnabled: false,
	async detect(ctx) {
		return (await require_doctor_session_locks.detectStaleSessionLocks({
			config: ctx.cfg,
			env: process.env
		})).map(require_doctor_session_locks.sessionLockToHealthFinding);
	},
	async repair(ctx) {
		const effects = (await require_doctor_session_locks.detectStaleSessionLocks({
			config: ctx.cfg,
			env: process.env
		})).map(require_doctor_session_locks.sessionLockToRepairEffect);
		if (ctx.dryRun === true) return {
			status: "repaired",
			changes: [],
			effects
		};
		return {
			status: "skipped",
			reason: "legacy doctor session lock contribution owns cleanup",
			changes: [],
			effects
		};
	}
};
const browserCheck = {
	id: "core/doctor/browser",
	kind: "core",
	description: "Browser readiness is captured as structured findings.",
	source: "doctor",
	async detect(ctx) {
		const collector = createNoteCollector("core/doctor/browser");
		await require_doctor_browser.noteChromeMcpBrowserReadiness(ctx.cfg, { noteFn: collector.noteFn });
		return collector.findings;
	}
};
function createSkillsReadinessCheck(deps) {
	return {
		id: "core/doctor/skills-readiness",
		kind: "core",
		description: "Allowed skills are usable in the current runtime environment.",
		source: "doctor",
		defaultEnabled: false,
		async detect(ctx, scope) {
			return filterUnavailableSkillsForScope(await deps.detectUnavailableSkills(ctx.cfg), scope?.paths).map(unavailableSkillToFinding);
		},
		async repair(ctx, findings) {
			const unavailable = filterUnavailableSkillsForScope(await deps.detectUnavailableSkills(ctx.cfg), findings.map((finding) => finding.path));
			if (unavailable.length === 0) return { changes: [] };
			return {
				config: require_doctor_skills_core.disableUnavailableSkillsInConfig(ctx.cfg, unavailable),
				changes: unavailable.map((skill) => `Disabled unavailable skill ${skill.name}.`),
				effects: unavailable.map((skill) => ({
					kind: "config",
					action: ctx.dryRun === true ? "would-disable-skill" : "disable-skill",
					target: skillReadinessPath(skill),
					dryRunSafe: true
				}))
			};
		}
	};
}
function unavailableSkillToFinding(skill) {
	return {
		checkId: "core/doctor/skills-readiness",
		severity: "warning",
		message: `${skill.name} is allowed but unavailable: ${require_doctor_skills_core.formatMissingSkillSummary(skill)}.`,
		path: skillReadinessPath(skill),
		fixHint: "Install/configure the missing requirement, or run `openclaw doctor --fix` to disable unused unavailable skills."
	};
}
function filterUnavailableSkillsForScope(unavailable, paths) {
	const scopedPaths = new Set(paths?.filter((pathLocal) => pathLocal !== void 0) ?? []);
	if (scopedPaths.size === 0) return [...unavailable];
	return unavailable.filter((skill) => scopedPaths.has(skillReadinessPath(skill)));
}
function skillReadinessPath(skill) {
	return `skills.entries.${skill.skillKey}.enabled`;
}
function browserResidueDeps(ctx) {
	return ctx.configPath ? { configDir: node_path.default.dirname(ctx.configPath) } : {};
}
function browserResidueFinding(residue) {
	return {
		checkId: BROWSER_CLAWD_PROFILE_RESIDUE_CHECK_ID,
		severity: "warning",
		message: `Legacy managed browser profile residue was found at ${residue.legacyProfileDir}.`,
		path: residue.legacyProfileDir,
		ocPath: "oc://state/browser/clawd",
		fixHint: "Run `openclaw doctor --fix` to archive the stale clawd profile safely instead of deleting it in place."
	};
}
function formatWouldArchiveBrowserResidue(residue) {
	return [
		"Would archive legacy clawd managed browser profile residue.",
		`- legacy profile: ${residue.legacyProfileDir}`,
		`- canonical profile: ${residue.canonicalUserDataDir}`
	].join("\n");
}
const browserClawdProfileResidueCheck = {
	id: BROWSER_CLAWD_PROFILE_RESIDUE_CHECK_ID,
	kind: "core",
	description: "Legacy clawd managed browser profile residue has been archived after the Operator rename.",
	source: "doctor",
	async detect(ctx, scope) {
		const residue = await require_doctor_browser.detectLegacyClawdBrowserProfileResidue(ctx.cfg, browserResidueDeps(ctx));
		if (!residue) return [];
		const scopedPaths = new Set(scope?.paths ?? []);
		if (scopedPaths.size > 0 && !scopedPaths.has(residue.legacyProfileDir)) return [];
		return [browserResidueFinding(residue)];
	},
	async repair(ctx) {
		const residue = await require_doctor_browser.detectLegacyClawdBrowserProfileResidue(ctx.cfg, browserResidueDeps(ctx));
		if (!residue) return {
			status: "skipped",
			reason: "legacy clawd browser profile residue no longer exists",
			changes: []
		};
		const effect = {
			kind: "state",
			action: ctx.dryRun === true ? "would-archive-legacy-browser-profile-residue" : "archive-legacy-browser-profile-residue",
			target: residue.legacyProfileDir,
			dryRunSafe: false
		};
		if (ctx.dryRun === true) return {
			changes: [formatWouldArchiveBrowserResidue(residue)],
			effects: [effect]
		};
		const result = await require_doctor_browser.maybeArchiveLegacyClawdBrowserProfileResidue(ctx.cfg, browserResidueDeps(ctx));
		if (result.changes.length === 0 && result.warnings.length > 0) return {
			status: "failed",
			reason: result.warnings.join("; "),
			changes: [],
			warnings: result.warnings,
			effects: []
		};
		return {
			changes: result.changes,
			warnings: result.warnings,
			effects: result.changes.length > 0 ? [effect] : []
		};
	}
};
const finalConfigValidationCheck = {
	id: FINAL_CONFIG_VALIDATION_CHECK_ID,
	kind: "core",
	description: "Active operator.jsonc parses and conforms to the config schema.",
	source: "doctor",
	async detect() {
		const { readConfigFileSnapshot } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
		const snap = await readConfigFileSnapshot({ observe: false });
		if (!snap.exists || snap.valid) return [];
		return configValidationIssuesToHealthFindings(snap.issues);
	}
};
const shellCompletionCheck = {
	id: "core/doctor/shell-completion",
	kind: "core",
	description: "Shell completion uses the cached completion path when configured.",
	source: "doctor",
	async detect() {
		return require_doctor_completion.shellCompletionStatusToHealthFindings(await require_doctor_completion.checkShellCompletionStatus());
	},
	async repair(ctx) {
		const effects = require_doctor_completion.shellCompletionStatusToRepairEffects(await require_doctor_completion.checkShellCompletionStatus());
		if (ctx.dryRun === true) return {
			status: "repaired",
			changes: [],
			effects
		};
		return {
			status: "skipped",
			reason: "legacy doctor shell-completion repair owns real mutations",
			changes: [],
			effects
		};
	}
};
const uiProtocolFreshnessCheck = {
	id: "core/doctor/ui-protocol-freshness",
	kind: "core",
	description: "Control UI assets are present and current with the Gateway protocol schema.",
	source: "doctor",
	async detect() {
		return (await require_doctor_ui.detectUiProtocolFreshnessIssues()).map(require_doctor_ui.uiProtocolFreshnessIssueToHealthFinding);
	},
	async repair(ctx) {
		const effects = (await require_doctor_ui.detectUiProtocolFreshnessIssues()).flatMap(require_doctor_ui.uiProtocolFreshnessIssueToRepairEffects);
		if (ctx.dryRun === true) return {
			status: "repaired",
			changes: [],
			effects
		};
		return {
			status: "skipped",
			reason: "legacy doctor UI freshness repair owns real mutations",
			changes: [],
			effects
		};
	}
};
function createWorkspaceSuggestionsCheck(deps) {
	return {
		id: "core/doctor/workspace-suggestions",
		kind: "core",
		description: "Workspace backup and memory-system suggestions are captured as structured findings.",
		defaultEnabled: false,
		source: "doctor",
		async detect(ctx) {
			const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(ctx.cfg, require_agent_scope_config.resolveDefaultAgentId(ctx.cfg));
			return (await deps.collectWorkspaceSuggestionNotes(workspaceDir)).map((text) => noteTextToFinding({
				checkId: "core/doctor/workspace-suggestions",
				severity: "info",
				text
			}));
		}
	};
}
function createConvertedWorkflowChecks(deps) {
	return [
		claudeCliCheck,
		gatewayAuthCheck,
		legacyStateCheck,
		legacyWhatsAppCrontabCheck,
		legacyCronStoreCheck,
		codexSessionRoutesCheck,
		sessionLocksCheck,
		shellCompletionCheck,
		uiProtocolFreshnessCheck,
		gatewayServicesExtraCheck,
		gatewayPlatformNotesCheck,
		createGatewayHealthCheck(deps),
		createGatewayDaemonCheck(deps),
		createSecurityCheck(deps),
		browserCheck,
		openAIOAuthTlsCheck,
		hooksModelCheck,
		bootstrapSizeCheck,
		createProviderCatalogProjectionCheck(deps),
		{
			id: "core/doctor/local-audio-acceleration",
			kind: "core",
			description: "Local STT auto-selection and acceleration evidence are visible.",
			source: "doctor",
			async detect() {
				return await deps.collectLocalAudioAccelerationFindings();
			}
		},
		createRuntimeToolSchemaCheck(deps),
		createWorkspaceSuggestionsCheck(deps),
		skillWorkshopToolPolicyCheck
	];
}
let registered = false;
/** @deprecated Core doctor flows use ordered doctor contributions; keep this only for SDK compatibility. */
function registerCoreHealthChecks() {
	if (registered) return;
	for (const check of CORE_HEALTH_CHECKS) require_health_check_registry.registerHealthCheck(check);
	registered = true;
}
function resetCoreHealthChecksForTest() {
	registered = false;
}
function createCoreHealthChecks(deps = defaultCoreHealthCheckDeps) {
	return [
		gatewayConfigCheck,
		...createConvertedWorkflowChecks(deps),
		commandOwnerCheck,
		createSkillsReadinessCheck(deps),
		browserClawdProfileResidueCheck,
		finalConfigValidationCheck
	];
}
const CORE_HEALTH_CHECKS = createCoreHealthChecks();
//#endregion
exports.CORE_HEALTH_CHECKS = CORE_HEALTH_CHECKS;
exports.buildGatewayTokenSecretRefFixHint = buildGatewayTokenSecretRefFixHint;
exports.buildGatewayTokenSecretRefUnavailableMessage = buildGatewayTokenSecretRefUnavailableMessage;
exports.configValidationIssuesToHealthFindings = configValidationIssuesToHealthFindings;
exports.createCoreHealthChecks = createCoreHealthChecks;
exports.registerCoreHealthChecks = registerCoreHealthChecks;
exports.resetCoreHealthChecksForTest = resetCoreHealthChecksForTest;
