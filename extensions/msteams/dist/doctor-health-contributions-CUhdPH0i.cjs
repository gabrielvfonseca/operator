const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_update_phase = require("./update-phase-noJPNQLY.cjs");
const require_health_check_adapter = require("./health-check-adapter-0mFM8vvz.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/flows/doctor-health-contributions.ts
const loadAgentDefaultsModule = async () => await Promise.resolve().then(() => require("./defaults-BplP0QgT.cjs")).then((n) => n.defaults_exports);
const loadAgentScopeModule = async () => await Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports);
const loadCommandFormatModule = async () => await Promise.resolve().then(() => require("./command-format-C4ZW2nwK.cjs")).then((n) => n.command_format_exports);
const loadConfigModule = async () => await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
const loadDoctorCoreChecksModule = async () => await Promise.resolve().then(() => require("./doctor-core-checks-BpX1elWt.cjs"));
const loadDoctorStateIntegrityModule = async () => await Promise.resolve().then(() => require("./doctor-state-integrity-D_kYYYAD.cjs"));
const loadHealthCheckRegistryModule = async () => await Promise.resolve().then(() => require("./health-check-registry-D8Fw0oHu.cjs"));
const loadModelCatalogModule = async () => await Promise.resolve().then(() => require("./model-catalog-BFgB2-Jk.cjs")).then((n) => n.model_catalog_exports);
const loadModelSelectionModule = async () => await Promise.resolve().then(() => require("./model-selection-BvFurMxy.cjs")).then((n) => n.model_selection_exports);
const loadNoteModule = async () => await Promise.resolve().then(() => require("./note-DKh-wVkx.cjs")).then((n) => n.note_exports);
const loadOnboardHelpersModule = async () => await Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs"));
const loadSecretTypesModule = async () => await Promise.resolve().then(() => require("./types.secrets-2BFwbY6H.cjs")).then((n) => n.types_secrets_exports);
function isUpdateDoctorRun(env) {
	const value = env.OPERATOR_UPDATE_IN_PROGRESS;
	return value === "1" || value === "true";
}
function resolveDoctorMode(cfg) {
	return cfg.gateway?.mode === "remote" ? "remote" : "local";
}
function isTruthyEnvValue(value) {
	if (!value) return false;
	const normalized = value.trim().toLowerCase();
	return normalized !== "" && normalized !== "0" && normalized !== "false" && normalized !== "no";
}
function shouldSkipLegacyUpdateDoctorConfigWrite(params) {
	if (!isTruthyEnvValue(params.env.OPERATOR_UPDATE_IN_PROGRESS)) return false;
	if (isTruthyEnvValue(params.env["OPERATOR_UPDATE_PARENT_SUPPORTS_DOCTOR_CONFIG_WRITE"])) return false;
	return true;
}
function createDoctorHealthContribution(params) {
	const healthChecks = normalizeHealthChecks({
		contributionId: params.id,
		healthChecks: params.healthChecks
	});
	const healthCheckIds = params.healthCheckIds ?? healthChecks.map((check) => check.id);
	if (params.run === void 0 && healthChecks.length === 0) throw new Error(`doctor contribution ${params.id} must define run or healthChecks`);
	return {
		id: params.id,
		kind: "core",
		surface: "health",
		option: {
			value: params.id,
			label: params.label,
			...params.hint ? { hint: params.hint } : {}
		},
		source: "doctor",
		healthChecks,
		healthCheckIds,
		run: params.run ?? ((ctx) => runStructuredDoctorHealthContribution({
			contributionId: params.id,
			ctx,
			checks: healthChecks
		}))
	};
}
function normalizeHealthChecks(params) {
	if (params.healthChecks === void 0) return [];
	const checks = Array.isArray(params.healthChecks) ? params.healthChecks : [params.healthChecks];
	return checks.map((check) => normalizeContributionHealthCheck({
		check,
		contributionId: params.contributionId,
		count: checks.length
	}));
}
function normalizeContributionHealthCheck(params) {
	const id = params.check.id ?? (params.count === 1 ? deriveCoreHealthCheckId(params.contributionId) : void 0);
	if (id === void 0) throw new Error(`doctor contribution ${params.contributionId} must specify health check ids when it declares multiple healthChecks`);
	return {
		...params.check,
		id,
		kind: params.check.kind ?? "core",
		source: params.check.source ?? "doctor"
	};
}
function deriveCoreHealthCheckId(contributionId) {
	if (contributionId.startsWith("doctor:")) return `core/doctor/${contributionId.slice(7)}`;
	return `core/doctor/${contributionId}`;
}
async function runStructuredDoctorHealthContribution(params) {
	if (params.checks.length === 0) throw new Error(`doctor contribution ${params.contributionId} has no structured health`);
	const { runDoctorHealthRepairs } = await Promise.resolve().then(() => require("./doctor-repair-flow-BwSQUxya.cjs"));
	const { resolveAgentWorkspaceDir, resolveDefaultAgentId } = await Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports);
	const workspaceDir = resolveAgentWorkspaceDir(params.ctx.cfg, resolveDefaultAgentId(params.ctx.cfg));
	const result = await runDoctorHealthRepairs({
		mode: "fix",
		runtime: params.ctx.runtime,
		cfg: params.ctx.cfg,
		cwd: workspaceDir,
		configPath: params.ctx.configPath,
		dryRun: !params.ctx.prompter.shouldRepair,
		allowExecSecretRefs: params.ctx.options.allowExec === true
	}, {
		checks: params.checks,
		dryRun: !params.ctx.prompter.shouldRepair
	});
	params.ctx.cfg = result.config;
	renderStructuredHealthFindings(params.ctx, result.findings);
	for (const warning of result.warnings) params.ctx.runtime.error(warning);
	for (const change of result.changes) params.ctx.runtime.log(change);
}
function renderStructuredHealthFindings(ctx, findings) {
	for (const finding of findings) {
		(finding.severity === "error" ? ctx.runtime.error : ctx.runtime.log)(formatStructuredHealthFinding(finding));
		if (finding.fixHint !== void 0) ctx.runtime.log(`  fix: ${finding.fixHint}`);
	}
}
function formatStructuredHealthFinding(finding) {
	const where = finding.path !== void 0 ? ` ${finding.path}` : "";
	const line = finding.line !== void 0 ? `:${finding.line}` : "";
	return `[${finding.severity}] ${finding.checkId}${where}${line} - ${finding.message}`;
}
async function runGatewayConfigHealth(ctx) {
	const { formatCliCommand } = await loadCommandFormatModule();
	const { hasAmbiguousGatewayAuthModeConfig } = await Promise.resolve().then(() => require("./auth-mode-policy-DbgAYq72.cjs")).then((n) => n.auth_mode_policy_exports);
	const { note } = await loadNoteModule();
	if (!ctx.cfg.gateway?.mode) {
		const lines = [
			"gateway.mode is unset; gateway start will be blocked.",
			`Fix: run ${formatCliCommand("operator configure")} and set Gateway mode (local/remote).`,
			`Or set directly: ${formatCliCommand("operator config set gateway.mode local")}`
		];
		if (!node_fs.default.existsSync(ctx.configPath)) lines.push(`Missing config: run ${formatCliCommand("operator setup")} first.`);
		note(lines.join("\n"), "Gateway");
	}
	if (resolveDoctorMode(ctx.cfg) === "local" && hasAmbiguousGatewayAuthModeConfig(ctx.cfg)) note([
		"gateway.auth.token and gateway.auth.password are both configured while gateway.auth.mode is unset.",
		"Set an explicit mode to avoid ambiguous auth selection and startup/runtime failures.",
		`Set token mode: ${formatCliCommand("operator config set gateway.auth.mode token")}`,
		`Set password mode: ${formatCliCommand("operator config set gateway.auth.mode password")}`
	].join("\n"), "Gateway auth");
}
async function runAuthProfileHealth(ctx) {
	const { maybeRepairLegacyFlatAuthProfileStores, maybeRepairCanonicalApiKeyFieldAlias } = await Promise.resolve().then(() => require("./doctor-auth-flat-profiles-DHG-0EU-.cjs"));
	const { maybeRepairLegacyOAuthProfileIds } = await Promise.resolve().then(() => require("./doctor-auth-legacy-oauth-3mEZee_P.cjs"));
	const { maybeRepairLegacyOAuthSidecarProfiles } = await Promise.resolve().then(() => require("./doctor-auth-oauth-sidecar-B7L0y89u.cjs"));
	const { noteAuthProfileHealth, noteLegacyCodexProviderOverride } = await Promise.resolve().then(() => require("./doctor-auth-C0MKdiHh.cjs"));
	const { buildGatewayConnectionDetails } = await Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports);
	const { note } = await loadNoteModule();
	await maybeRepairLegacyFlatAuthProfileStores({
		cfg: ctx.cfg,
		prompter: ctx.prompter
	});
	await maybeRepairCanonicalApiKeyFieldAlias({
		cfg: ctx.cfg,
		prompter: ctx.prompter
	});
	await maybeRepairLegacyOAuthSidecarProfiles({
		cfg: ctx.cfg,
		prompter: ctx.prompter
	});
	ctx.cfg = await maybeRepairLegacyOAuthProfileIds(ctx.cfg, ctx.prompter);
	await noteAuthProfileHealth({
		cfg: ctx.cfg,
		prompter: ctx.prompter,
		allowKeychainPrompt: ctx.options.nonInteractive !== true && process.stdin.isTTY
	});
	noteLegacyCodexProviderOverride(ctx.cfg);
	ctx.gatewayDetails = buildGatewayConnectionDetails({ config: ctx.cfg });
	if (ctx.gatewayDetails.remoteFallbackNote) note(ctx.gatewayDetails.remoteFallbackNote, "Gateway");
}
async function runGatewayAuthHealth(ctx) {
	const { resolveSecretInputRef } = await loadSecretTypesModule();
	const { buildGatewayTokenSecretRefFixHint, buildGatewayTokenSecretRefUnavailableMessage } = await loadDoctorCoreChecksModule();
	const { resolveGatewayAuth } = await Promise.resolve().then(() => require("./auth-DnGY7_cY.cjs")).then((n) => n.auth_exports);
	const { resolveGatewayAuthToken } = await Promise.resolve().then(() => require("./auth-token-resolution-CC5kmaAu.cjs")).then((n) => n.auth_token_resolution_exports);
	const { note } = await loadNoteModule();
	const { randomToken } = await loadOnboardHelpersModule();
	if (resolveDoctorMode(ctx.cfg) !== "local" || !ctx.sourceConfigValid) return;
	const gatewayTokenRef = resolveSecretInputRef({
		value: ctx.cfg.gateway?.auth?.token,
		defaults: ctx.cfg.secrets?.defaults
	}).ref;
	const auth = resolveGatewayAuth({
		authConfig: ctx.cfg.gateway?.auth,
		tailscaleMode: ctx.cfg.gateway?.tailscale?.mode ?? "off"
	});
	const hasInlineToken = typeof auth.token === "string" && auth.token.trim() !== "";
	if (!(auth.mode !== "password" && auth.mode !== "none" && auth.mode !== "trusted-proxy" && (auth.mode !== "token" || !hasInlineToken || Boolean(gatewayTokenRef)))) return;
	let unresolvedRefReason;
	if (gatewayTokenRef && gatewayTokenRef.source === "exec") {
		const { getSkippedExecRefStaticError } = await Promise.resolve().then(() => require("./exec-resolution-policy-mrNb6tkm.cjs"));
		if (getSkippedExecRefStaticError({
			ref: gatewayTokenRef,
			config: ctx.cfg
		})) unresolvedRefReason = void 0;
		else if (ctx.options.allowExec !== true) return;
		else {
			const resolvedToken = await resolveGatewayAuthToken({
				cfg: ctx.cfg,
				env: ctx.env ?? process.env,
				unresolvedReasonStyle: "detailed",
				envFallback: "never"
			});
			if (resolvedToken.source === "secretRef") return;
			unresolvedRefReason = resolvedToken.unresolvedRefReason;
		}
	} else {
		const resolvedToken = await resolveGatewayAuthToken({
			cfg: ctx.cfg,
			env: ctx.env ?? process.env,
			unresolvedReasonStyle: "detailed",
			envFallback: gatewayTokenRef ? "never" : "always"
		});
		if (gatewayTokenRef ? resolvedToken.source === "secretRef" : resolvedToken.token) return;
		unresolvedRefReason = resolvedToken.unresolvedRefReason;
	}
	if (gatewayTokenRef) {
		note([
			buildGatewayTokenSecretRefUnavailableMessage({
				cfg: ctx.cfg,
				ref: gatewayTokenRef,
				unresolvedRefReason
			}),
			"Doctor will not overwrite gateway.auth.token with a plaintext value.",
			buildGatewayTokenSecretRefFixHint(gatewayTokenRef)
		].join("\n"), "Gateway auth");
		return;
	}
	note("Gateway auth is off or missing a token. Token auth is now the recommended default (including loopback).", "Gateway auth");
	if (!(ctx.options.generateGatewayToken === true ? true : ctx.options.nonInteractive === true ? false : await ctx.prompter.confirmAutoFix({
		message: "Generate and configure a gateway token now?",
		initialValue: true
	}))) return;
	const nextToken = randomToken();
	ctx.cfg = {
		...ctx.cfg,
		gateway: {
			...ctx.cfg.gateway,
			auth: {
				...ctx.cfg.gateway?.auth,
				mode: "token",
				token: nextToken
			}
		}
	};
	note("Gateway token configured.", "Gateway auth");
}
async function runCommandOwnerHealth(ctx) {
	const { noteCommandOwnerHealth } = await Promise.resolve().then(() => require("./doctor-command-owner-Dayex2zB.cjs"));
	noteCommandOwnerHealth(ctx.cfg);
}
async function runStructuredHealthRepairs(ctx) {
	if (!ctx.prompter.shouldRepair) return;
	const { registerBundledHealthChecks } = await Promise.resolve().then(() => require("./bundled-health-checks-DOdhU2zS.cjs"));
	const { listExtensionHealthChecksForDoctor } = await loadHealthCheckRegistryModule();
	const { runDoctorHealthRepairs } = await Promise.resolve().then(() => require("./doctor-repair-flow-BwSQUxya.cjs"));
	const { resolveAgentWorkspaceDir, resolveDefaultAgentId } = await loadAgentScopeModule();
	const { note } = await loadNoteModule();
	const workspaceDir = resolveAgentWorkspaceDir(ctx.cfg, resolveDefaultAgentId(ctx.cfg));
	registerBundledHealthChecks({
		cfg: ctx.cfg,
		cwd: workspaceDir
	});
	const checks = listExtensionHealthChecksForDoctor(await resolveDoctorContributionHealthChecks());
	const result = await runDoctorHealthRepairs({
		mode: "fix",
		runtime: ctx.runtime,
		cfg: ctx.cfg,
		cwd: workspaceDir,
		configPath: ctx.configPath
	}, { checks });
	ctx.cfg = result.config;
	if (result.changes.length > 0) note(result.changes.join("\n"), "Doctor changes");
	if (result.warnings.length > 0) note(result.warnings.join("\n"), "Doctor warnings");
}
async function runClaudeCliHealth(ctx) {
	const { noteClaudeCliHealth } = await Promise.resolve().then(() => require("./doctor-claude-cli-Ca2ZKJ3y.cjs"));
	noteClaudeCliHealth(ctx.cfg);
}
async function runCoreContributionHealthRepair(ctx, checkIds) {
	if (!ctx.prompter.shouldRepair || checkIds.length === 0) return;
	const { CORE_HEALTH_CHECKS } = await Promise.resolve().then(() => require("./doctor-core-checks-BpX1elWt.cjs"));
	const { runDoctorHealthRepairs } = await Promise.resolve().then(() => require("./doctor-repair-flow-BwSQUxya.cjs"));
	const { resolveAgentWorkspaceDir, resolveDefaultAgentId } = await Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports);
	const { note } = await Promise.resolve().then(() => require("./note-DKh-wVkx.cjs")).then((n) => n.note_exports);
	const selectedIds = new Set(checkIds);
	const checks = CORE_HEALTH_CHECKS.filter((check) => selectedIds.has(check.id));
	if (checks.length === 0) return;
	const workspaceDir = resolveAgentWorkspaceDir(ctx.cfg, resolveDefaultAgentId(ctx.cfg));
	const result = await runDoctorHealthRepairs({
		mode: "fix",
		runtime: ctx.runtime,
		cfg: ctx.cfg,
		cwd: workspaceDir,
		configPath: ctx.configPath
	}, { checks });
	ctx.cfg = result.config;
	if (result.changes.length > 0) note(result.changes.join("\n"), "Doctor changes");
	if (result.warnings.length > 0) note(result.warnings.join("\n"), "Doctor warnings");
}
async function runLegacyStateHealth(ctx) {
	const { detectLegacyStateMigrations, runLegacyStateMigrations } = await Promise.resolve().then(() => require("./doctor-state-migrations-DQ16Flpu.cjs"));
	const { note } = await loadNoteModule();
	const operatorCanApproveCrossStateDirImports = ctx.prompter.repairMode.canPrompt || ctx.prompter.shouldRepair;
	const legacyState = await detectLegacyStateMigrations({
		cfg: ctx.cfg,
		doctorOnlyStateMigrations: true,
		crossStateDirImports: ctx.options.crossStateDirImports === true && operatorCanApproveCrossStateDirImports
	});
	if (legacyState.warnings.length > 0) note(legacyState.warnings.join("\n"), "Doctor warnings");
	if (legacyState.notices.length > 0) note(legacyState.notices.join("\n"), "Doctor notices");
	if (legacyState.preview.length === 0) return;
	note(legacyState.preview.join("\n"), "Legacy state detected");
	if (!(ctx.options.nonInteractive === true ? true : await ctx.prompter.confirm({
		message: "Migrate legacy state (sessions/agent/WhatsApp auth) now?",
		initialValue: true
	}))) return;
	const migrated = await runLegacyStateMigrations({
		detected: legacyState,
		config: ctx.cfg,
		recoverCorruptTargetStore: ctx.options.repair === true || ctx.options.yes === true
	});
	if (migrated.changes.length > 0) note(migrated.changes.join("\n"), "Doctor changes");
	const notices = migrated.notices ?? [];
	if (notices.length > 0) note(notices.join("\n"), "Doctor notices");
	if (migrated.warnings.length > 0) note(migrated.warnings.join("\n"), "Doctor warnings");
}
async function runLegacyPluginManifestHealth(ctx) {
	const { maybeRepairLegacyPluginManifestContracts } = await Promise.resolve().then(() => require("./doctor-plugin-manifests-DkGc9YxC.cjs"));
	await maybeRepairLegacyPluginManifestContracts({
		config: ctx.cfg,
		env: process.env,
		runtime: ctx.runtime,
		prompter: ctx.prompter
	});
}
async function runPluginRegistryHealth(ctx) {
	const { maybeRepairPluginRegistryState } = await Promise.resolve().then(() => require("./doctor-plugin-registry-D6vxCw0T.cjs"));
	ctx.cfg = await maybeRepairPluginRegistryState({
		config: ctx.cfg,
		env: process.env,
		prompter: ctx.prompter
	});
}
async function runReleaseConfiguredPluginInstallsHealth(ctx) {
	if (!ctx.sourceConfigValid) return;
	if (!ctx.prompter.shouldRepair) return;
	const { maybeRunConfiguredPluginInstallReleaseStep } = await Promise.resolve().then(() => require("./release-configured-plugin-installs-Bsm8oaaG.cjs"));
	const { note } = await loadNoteModule();
	const { VERSION } = await Promise.resolve().then(() => require("./version-B8VHpWoT.cjs")).then((n) => n.version_exports);
	const result = await maybeRunConfiguredPluginInstallReleaseStep({
		cfg: ctx.cfg,
		env: ctx.env ?? process.env,
		touchedVersion: ctx.configResult.sourceLastTouchedVersion ?? ctx.cfg.meta?.lastTouchedVersion
	});
	if (result.postInstallDoctorResult) ctx.postInstallDoctorResult = result.postInstallDoctorResult;
	if (result.changes.length > 0) note(result.changes.join("\n"), "Doctor changes");
	if (result.warnings.length > 0) note(result.warnings.join("\n"), "Doctor warnings");
	if (!result.touchedConfig) return;
	const lastTouchedVersion = require_update_phase.isLegacyParentWritableUpdateDoctorPass(ctx.env ?? process.env) ? ctx.configResult.sourceLastTouchedVersion?.trim() || ctx.cfg.meta?.lastTouchedVersion || VERSION : VERSION;
	ctx.cfg = {
		...ctx.cfg,
		meta: {
			...ctx.cfg.meta,
			lastTouchedVersion,
			lastTouchedAt: (/* @__PURE__ */ new Date()).toISOString()
		}
	};
}
async function runDiskSpaceHealth(ctx) {
	const { noteDiskSpace } = await Promise.resolve().then(() => require("./doctor-disk-space-Bh101fzt.cjs"));
	noteDiskSpace(ctx.cfg);
}
async function runDatabaseBloatHealth(ctx) {
	const { noteSqliteDatabaseBloat } = await Promise.resolve().then(() => require("./doctor-db-bloat-DR89UNrd.cjs"));
	noteSqliteDatabaseBloat(ctx.cfg);
}
async function runStateIntegrityHealth(ctx) {
	const { noteStateIntegrity } = await loadDoctorStateIntegrityModule();
	await noteStateIntegrity(ctx.cfg, ctx.prompter, ctx.configPath);
}
async function runCodexSessionRouteHealth(ctx) {
	const { maybeRepairCodexSessionRoutes } = await Promise.resolve().then(() => require("./codex-route-warnings-DZiR4oAu.cjs"));
	const { note } = await loadNoteModule();
	const result = await maybeRepairCodexSessionRoutes({
		cfg: ctx.cfg,
		env: ctx.env ?? process.env,
		shouldRepair: ctx.prompter.shouldRepair,
		...ctx.configResult.blockedCodexModelIdentities?.length ? { blockedModelIdentities: new Set(ctx.configResult.blockedCodexModelIdentities) } : {}
	});
	if (result.changes.length > 0) note(result.changes.join("\n"), "Doctor changes");
	if (result.warnings.length > 0) note(result.warnings.join("\n"), "Doctor warnings");
}
async function runSessionLocksHealth(ctx) {
	const { noteSessionLockHealth } = await Promise.resolve().then(() => require("./doctor-session-locks-DfTK10FP.cjs"));
	await noteSessionLockHealth({
		shouldRepair: ctx.prompter.shouldRepair,
		config: ctx.cfg,
		env: ctx.env
	});
}
async function runSessionTranscriptsHealth(ctx) {
	const { noteSessionTranscriptHealth } = await Promise.resolve().then(() => require("./doctor-session-transcripts-DIcDqQHA.cjs"));
	await noteSessionTranscriptHealth({
		cfg: ctx.cfg,
		env: ctx.env ?? process.env,
		shouldRepair: ctx.prompter.shouldRepair
	});
}
async function runSessionSnapshotsHealth(ctx) {
	const { noteSessionSnapshotHealth } = await Promise.resolve().then(() => require("./doctor-session-snapshots-BoYNg-Kg.cjs"));
	await noteSessionSnapshotHealth({
		cfg: ctx.cfg,
		env: ctx.env ?? process.env,
		shouldRepair: ctx.prompter.shouldRepair
	});
}
async function runConfigAuditScrubHealth(ctx) {
	await (await Promise.resolve().then(() => require("./doctor-usage-cost-cache-BIyTHZYG.cjs"))).maybeRepairLegacyRuntimeFiles(ctx.prompter.shouldRepair, ctx.env);
}
async function runLegacyCronHealth(ctx) {
	const { maybeRepairLegacyCronStore, noteLegacyWhatsAppCrontabHealthCheck } = await Promise.resolve().then(() => require("./cron-BWC6J93W.cjs"));
	await noteLegacyWhatsAppCrontabHealthCheck();
	await maybeRepairLegacyCronStore({
		cfg: ctx.cfg,
		options: ctx.options,
		prompter: ctx.prompter
	});
}
async function runSandboxHealth(ctx) {
	const { maybeRepairSandboxImages, maybeRepairSandboxRegistryFiles, noteSandboxScopeWarnings } = await Promise.resolve().then(() => require("./doctor-sandbox-BQDFn5pQ.cjs"));
	await maybeRepairSandboxRegistryFiles(ctx.prompter);
	ctx.cfg = await maybeRepairSandboxImages(ctx.cfg, ctx.runtime, ctx.prompter);
	noteSandboxScopeWarnings(ctx.cfg);
}
async function runGatewayServicesHealth(ctx) {
	const { maybeRepairGatewayServiceConfig, maybeScanExtraGatewayServices } = await Promise.resolve().then(() => require("./doctor-gateway-services-BOIqIIVv.cjs"));
	const { noteMacLaunchAgentOverrides, noteMacLaunchctlGatewayEnvOverrides, noteMacStaleOperatorUpdateLaunchdJobs } = await Promise.resolve().then(() => require("./doctor-platform-notes-ROt7Bp6B.cjs"));
	await maybeScanExtraGatewayServices(ctx.options, ctx.runtime, ctx.prompter);
	const updateDoctorRun = isUpdateDoctorRun(ctx.env ?? process.env);
	ctx.cfg = await maybeRepairGatewayServiceConfig(ctx.cfg, resolveDoctorMode(ctx.cfg), ctx.runtime, ctx.prompter, {
		allowExecSecretRefs: ctx.options.allowExec === true,
		allowConfigSizeDrop: ctx.configResult.shouldWriteConfig === true || updateDoctorRun,
		skipPluginValidation: ctx.configResult.skipPluginValidationOnWrite === true || updateDoctorRun,
		preservedLegacyRootKeys: ctx.configResult.preservedLegacyRootKeys,
		...resolveLegacyParentVersionOverride(ctx)
	});
	await noteMacLaunchAgentOverrides();
	await noteMacStaleOperatorUpdateLaunchdJobs();
	await noteMacLaunchctlGatewayEnvOverrides(ctx.cfg);
}
async function runStartupChannelMaintenanceHealth(ctx) {
	const { maybeRunDoctorStartupChannelMaintenance } = await Promise.resolve().then(() => require("./doctor-startup-channel-maintenance-B4VeSz5H.cjs"));
	await maybeRunDoctorStartupChannelMaintenance({
		cfg: ctx.cfg,
		env: process.env,
		runtime: ctx.runtime,
		shouldRepair: ctx.prompter.shouldRepair
	});
}
async function runSecurityHealth(ctx) {
	const { noteInstallPolicyHealth } = await Promise.resolve().then(() => require("./doctor-install-policy-fPBoQaMd.cjs"));
	const { noteSecurityWarnings } = await Promise.resolve().then(() => require("./doctor-security-_8aW4_jw.cjs"));
	await noteSecurityWarnings(ctx.cfg);
	await noteInstallPolicyHealth(ctx.cfg, {
		deep: ctx.options.deep === true,
		env: ctx.env
	});
}
async function runBrowserHealth(ctx) {
	const { noteChromeMcpBrowserReadiness } = await Promise.resolve().then(() => require("./doctor-browser-DdClXygv.cjs"));
	await runCoreContributionHealthRepair(ctx, ["core/doctor/browser-clawd-profile-residue"]);
	await noteChromeMcpBrowserReadiness(ctx.cfg);
}
async function runOpenAIOAuthTlsHealth(ctx) {
	const { noteOpenAIOAuthTlsPrerequisites } = await Promise.resolve().then(() => require("./provider-openai-chatgpt-oauth-tls-CgEwMtGK.cjs"));
	await noteOpenAIOAuthTlsPrerequisites({
		cfg: ctx.cfg,
		deep: ctx.options.deep === true
	});
}
async function runHooksModelHealth(ctx) {
	if (!ctx.cfg.hooks?.gmail?.model?.trim()) return;
	const { DEFAULT_MODEL, DEFAULT_PROVIDER } = await loadAgentDefaultsModule();
	const { loadModelCatalog } = await loadModelCatalogModule();
	const { getModelRefStatus, resolveConfiguredModelRef, resolveHooksGmailModel } = await loadModelSelectionModule();
	const { note } = await loadNoteModule();
	const hooksModelRef = resolveHooksGmailModel({
		cfg: ctx.cfg,
		defaultProvider: DEFAULT_PROVIDER
	});
	if (!hooksModelRef) {
		note(`- hooks.gmail.model "${ctx.cfg.hooks.gmail.model}" could not be resolved`, "Hooks");
		return;
	}
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
	const warnings = [];
	if (!status.allowed) warnings.push(`- hooks.gmail.model "${status.key}" not in agents.defaults.models allowlist (will use primary instead)`);
	if (!status.inCatalog) warnings.push(`- hooks.gmail.model "${status.key}" not in the model catalog (may fail at runtime)`);
	if (warnings.length > 0) note(warnings.join("\n"), "Hooks");
}
async function collectToolResultCapFindings(cfg) {
	const { resolveAgentContextLimits } = await loadAgentScopeModule();
	const { normalizeAgentId } = await Promise.resolve().then(() => require("./session-key-BQFkCTNx.cjs")).then((n) => n.session_key_exports);
	const targets = [];
	const defaultsConfiguredCap = cfg.agents?.defaults?.contextLimits?.toolResultMaxChars;
	if (defaultsConfiguredCap !== void 0) targets.push({
		configuredCap: defaultsConfiguredCap,
		path: "agents.defaults.contextLimits.toolResultMaxChars",
		scopeLabel: "defaults",
		target: "agents.defaults"
	});
	for (const entry of cfg.agents?.list ?? []) {
		const normalizedAgentId = normalizeAgentId(entry.id);
		if (!normalizedAgentId || defaultsConfiguredCap === void 0 && entry.contextLimits?.toolResultMaxChars === void 0) continue;
		targets.push({
			agentId: normalizedAgentId,
			configuredCap: resolveAgentContextLimits(cfg, normalizedAgentId)?.toolResultMaxChars,
			path: entry.contextLimits?.toolResultMaxChars === void 0 ? "agents.defaults.contextLimits.toolResultMaxChars" : `agents.list.${normalizedAgentId}.contextLimits.toolResultMaxChars`,
			scopeLabel: `agent "${normalizedAgentId}"`,
			target: `agents.list.${normalizedAgentId}`
		});
	}
	if (targets.length === 0) return [];
	const { collectToolResultCapDoctorIssues, toolResultCapDoctorIssueToHealthFinding } = await Promise.resolve().then(() => require("./doctor-tool-result-cap-advice-CEetqQND.cjs"));
	return collectToolResultCapTargetAdvice({
		cfg,
		readOnlyCatalog: true,
		targets
	}).then((entries) => entries.flatMap((entry) => collectToolResultCapDoctorIssues(entry).map(toolResultCapDoctorIssueToHealthFinding)));
}
async function collectToolResultCapTargetAdvice(params) {
	const { DEFAULT_CONTEXT_TOKENS } = await loadAgentDefaultsModule();
	const { loadModelCatalog, findModelCatalogEntry } = await loadModelCatalogModule();
	const { resolveContextWindowInfo } = await Promise.resolve().then(() => require("./context-window-guard-1fyXlp_c.cjs")).then((n) => n.context_window_guard_exports);
	const { resolveDefaultModelForAgent, modelKey } = await loadModelSelectionModule();
	const catalog = await loadModelCatalog({
		config: params.cfg,
		...params.readOnlyCatalog ? { readOnly: true } : {}
	});
	return params.targets.map((target) => {
		const modelRef = resolveDefaultModelForAgent({
			cfg: params.cfg,
			agentId: target.agentId
		});
		const entry = findModelCatalogEntry(catalog, {
			provider: modelRef.provider,
			modelId: modelRef.model
		});
		return {
			contextWindowTokens: resolveContextWindowInfo({
				cfg: params.cfg,
				provider: modelRef.provider,
				modelId: modelRef.model,
				modelContextTokens: entry?.contextTokens,
				modelContextWindow: entry?.contextWindow,
				defaultTokens: DEFAULT_CONTEXT_TOKENS
			}).tokens,
			modelKey: modelKey(modelRef.provider, modelRef.model),
			configuredCap: target.configuredCap,
			path: target.path,
			scopeLabel: target.scopeLabel,
			target: target.target
		};
	});
}
async function runToolResultCapHealth(ctx) {
	const { resolveAgentContextLimits } = await loadAgentScopeModule();
	const { normalizeAgentId } = await Promise.resolve().then(() => require("./session-key-BQFkCTNx.cjs")).then((n) => n.session_key_exports);
	const targets = [];
	const defaultsConfiguredCap = ctx.cfg.agents?.defaults?.contextLimits?.toolResultMaxChars;
	if (ctx.options.deep === true || defaultsConfiguredCap !== void 0) targets.push({
		configuredCap: defaultsConfiguredCap,
		scopeLabel: "defaults"
	});
	for (const entry of ctx.cfg.agents?.list ?? []) {
		const normalizedAgentId = normalizeAgentId(entry.id);
		if (!normalizedAgentId || ctx.options.deep !== true && defaultsConfiguredCap === void 0 && entry.contextLimits?.toolResultMaxChars === void 0) continue;
		targets.push({
			agentId: normalizedAgentId,
			configuredCap: resolveAgentContextLimits(ctx.cfg, normalizedAgentId)?.toolResultMaxChars,
			scopeLabel: `agent "${normalizedAgentId}"`
		});
	}
	if (targets.length === 0) return;
	const { buildToolResultCapDoctorAdvice } = await Promise.resolve().then(() => require("./doctor-tool-result-cap-advice-CEetqQND.cjs"));
	const { note } = await loadNoteModule();
	const lines = (await collectToolResultCapTargetAdvice({
		cfg: ctx.cfg,
		targets
	})).flatMap((entry) => buildToolResultCapDoctorAdvice({
		...entry,
		deep: ctx.options.deep === true
	}));
	if (lines.length > 0) note(lines.join("\n"), "Tool result cap");
}
async function runSystemdLingerHealth(ctx) {
	if (ctx.options.nonInteractive === true || process.platform !== "linux" || resolveDoctorMode(ctx.cfg) !== "local") return;
	const { resolveGatewayService } = await Promise.resolve().then(() => require("./service-BJLcDrM4.cjs")).then((n) => n.service_exports);
	const { ensureSystemdUserLingerInteractive } = await Promise.resolve().then(() => require("./systemd-linger-Bd9aHAev.cjs"));
	const { note } = await loadNoteModule();
	const service = resolveGatewayService();
	let loaded;
	try {
		loaded = await service.isLoaded({ env: process.env });
	} catch {
		loaded = false;
	}
	if (!loaded) return;
	await ensureSystemdUserLingerInteractive({
		runtime: ctx.runtime,
		prompter: {
			confirm: async (p) => ctx.prompter.confirm(p),
			note
		},
		reason: "Gateway runs as a systemd user service. Without lingering, systemd stops the user session on logout/idle and kills the Gateway.",
		requireConfirm: true
	});
}
async function detectSystemdLingerFindings(ctx) {
	if (process.platform !== "linux" || resolveDoctorMode(ctx.cfg) !== "local") return [];
	const { resolveGatewayService } = await Promise.resolve().then(() => require("./service-BJLcDrM4.cjs")).then((n) => n.service_exports);
	const service = resolveGatewayService();
	let loaded;
	try {
		loaded = await service.isLoaded({ env: process.env });
	} catch {
		loaded = false;
	}
	if (!loaded) return [];
	const { isSystemdUserServiceAvailable, readSystemdUserLingerStatus } = await Promise.resolve().then(() => require("./systemd-BxVKNLOg.cjs")).then((n) => n.systemd_exports);
	if (!await isSystemdUserServiceAvailable(process.env)) return [];
	const status = await readSystemdUserLingerStatus(process.env);
	if (!status || status.linger === "yes") return [];
	return [{
		checkId: "core/doctor/systemd-linger",
		severity: "warning",
		source: "doctor",
		message: `Systemd lingering is disabled for ${status.user}.`,
		target: `systemd.user.${status.user}`,
		requirement: "systemd user lingering enabled",
		fixHint: `Run: sudo loginctl enable-linger ${status.user}`
	}];
}
async function hasActiveGatewayExecCredential(ctx, mode = resolveDoctorMode(ctx.cfg)) {
	const { resolveSecretInputRef } = await loadSecretTypesModule();
	const { gatewaySecretInputPathCanWin } = await Promise.resolve().then(() => require("./credentials-secret-inputs-WHVXyyR_.cjs")).then((n) => n.credentials_secret_inputs_exports);
	const { ALL_GATEWAY_SECRET_INPUT_PATHS, readGatewaySecretInputValue } = await Promise.resolve().then(() => require("./secret-input-paths-DhtBjpGq.cjs")).then((n) => n.secret_input_paths_exports);
	return ALL_GATEWAY_SECRET_INPUT_PATHS.some((path) => {
		if (!gatewaySecretInputPathCanWin({
			config: ctx.cfg,
			env: process.env,
			modeOverride: mode,
			path
		})) return false;
		return resolveSecretInputRef({
			value: readGatewaySecretInputValue(ctx.cfg, path),
			defaults: ctx.cfg.secrets?.defaults
		}).ref?.source === "exec";
	});
}
async function collectWorkspaceStatusPluginVersionDrift(params) {
	if (params.cfg.gateway?.mode !== "remote") try {
		const { gatherDaemonStatus } = await Promise.resolve().then(() => require("./status.gather-ClUMCRVk.cjs"));
		const allowExecSecretRefs = params.options?.allowExec === true;
		const status = await gatherDaemonStatus({
			rpc: {
				timeout: params.options?.nonInteractive === true ? "3000" : "10000",
				json: true
			},
			probe: true,
			requireRpc: false,
			deep: params.options?.deep === true,
			allowExecSecretRefs
		});
		const hasProbedGatewayVersion = typeof status.gateway?.version === "string" && status.gateway.version.trim() !== "";
		if (status.pluginVersionDrift && hasProbedGatewayVersion && !status.rpc?.authWarning) return status.pluginVersionDrift;
	} catch {}
}
async function runWorkspaceStatusHealth(ctx) {
	const pluginVersionDrift = await collectWorkspaceStatusPluginVersionDrift({
		cfg: ctx.cfg,
		options: ctx.options
	});
	const { noteWorkspaceStatus } = await Promise.resolve().then(() => require("./doctor-workspace-status-DL8PqCxi.cjs"));
	noteWorkspaceStatus(ctx.cfg, { pluginVersionDrift });
}
async function runSkillsHealth(ctx) {
	const { maybeRepairSkillReadiness } = await Promise.resolve().then(() => require("./doctor-skills-BkpqYnWx.cjs"));
	ctx.cfg = await maybeRepairSkillReadiness({
		cfg: ctx.cfg,
		prompter: ctx.prompter
	});
}
async function runBootstrapSizeHealth(ctx) {
	const { noteBootstrapFileSize } = await Promise.resolve().then(() => require("./doctor-bootstrap-size-BBkPmzLq.cjs"));
	await noteBootstrapFileSize(ctx.cfg);
}
async function runHeartbeatTemplateRepairHealth(ctx) {
	const { maybeRepairHeartbeatTemplate } = await Promise.resolve().then(() => require("./doctor-heartbeat-template-repair-DUc7JPlN.cjs"));
	await maybeRepairHeartbeatTemplate({
		cfg: ctx.cfg,
		shouldRepair: ctx.prompter.shouldRepair
	});
}
async function runShellCompletionHealth(ctx) {
	const { doctorShellCompletion } = await Promise.resolve().then(() => require("./doctor-completion-D7jrsVvS.cjs")).then((n) => n.doctor_completion_exports);
	await doctorShellCompletion(ctx.runtime, ctx.prompter, { nonInteractive: ctx.options.nonInteractive });
}
async function runGatewayHealthChecks(ctx) {
	const { note } = await loadNoteModule();
	if (await hasActiveGatewayExecCredential(ctx) && ctx.options.allowExec !== true) {
		note("Gateway health probes skipped because gateway credentials use an exec SecretRef. Run `operator doctor --allow-exec` to verify Gateway health with exec SecretRefs.", "Gateway");
		ctx.gatewayHealthSkipped = true;
		ctx.gatewayMemoryProbe = {
			checked: false,
			ready: false,
			skipped: true
		};
		return;
	}
	const { checkGatewayHealth, probeGatewayMemoryStatus } = await Promise.resolve().then(() => require("./doctor-gateway-health--iNDeMPU.cjs"));
	const { healthOk, authenticated, status } = await checkGatewayHealth({
		runtime: ctx.runtime,
		cfg: ctx.cfg,
		timeoutMs: ctx.options.nonInteractive === true ? 3e3 : 1e4
	});
	ctx.gatewayHealthSkipped = false;
	ctx.healthOk = healthOk;
	ctx.gatewayHealthAuthenticated = authenticated;
	ctx.gatewayStatus = status;
	ctx.gatewayMemoryProbe = authenticated ? await probeGatewayMemoryStatus({
		cfg: ctx.cfg,
		timeoutMs: ctx.options.nonInteractive === true ? 3e3 : 1e4
	}) : {
		checked: false,
		ready: false,
		skipped: healthOk
	};
}
async function runWhatsappResponsivenessHealth(ctx) {
	const { noteWhatsappResponsivenessHealth } = await Promise.resolve().then(() => require("./doctor-whatsapp-responsiveness-BJ-wTbpm.cjs"));
	await noteWhatsappResponsivenessHealth({
		cfg: ctx.cfg,
		status: ctx.gatewayStatus,
		shouldRepair: ctx.prompter.shouldRepair
	});
}
async function runMemorySearchHealthContribution(ctx) {
	const { maybeRepairMemoryRecallHealth, noteMemoryRecallHealth, noteMemorySearchHealth } = await Promise.resolve().then(() => require("./doctor-memory-search-BpQ_fi1w.cjs"));
	if (ctx.prompter.shouldRepair) await maybeRepairMemoryRecallHealth({
		cfg: ctx.cfg,
		prompter: ctx.prompter
	});
	await noteMemorySearchHealth(ctx.cfg, { gatewayMemoryProbe: ctx.gatewayMemoryProbe ?? {
		checked: false,
		ready: false,
		skipped: false
	} });
	if (ctx.options.deep === true) await noteMemoryRecallHealth(ctx.cfg);
}
function memorySearchNoteToFinding(message) {
	const lines = message.split("\n");
	const firstLine = (lines[0] ?? message).trim();
	if (firstLine === "Memory search is explicitly disabled (enabled: false).") return null;
	const fixHint = lines.slice(1).map((line) => line.trimEnd()).join("\n").trim();
	return {
		checkId: "core/doctor/memory-search",
		severity: "warning",
		message: firstLine,
		path: inferMemorySearchFindingPath(firstLine),
		...fixHint ? { fixHint } : {}
	};
}
function inferMemorySearchFindingPath(message) {
	if (message.includes("No active memory plugin")) return "plugins.slots.memory";
	if (message.includes("QMD memory backend")) return "memory.backend";
	if (message.includes("OpenAI-compatible embeddings endpoint")) return "agents.defaults.memorySearch.remote.baseUrl";
	if (message.includes("OpenAI-compatible embedding model")) return "agents.defaults.memorySearch.model";
	return "agents.defaults.memorySearch.provider";
}
async function collectMemorySearchHealthFindings(ctx) {
	const { noteMemorySearchHealth } = await Promise.resolve().then(() => require("./doctor-memory-search-BpQ_fi1w.cjs"));
	const notes = [];
	await noteMemorySearchHealth(ctx.cfg, {
		includeWorkspaceMemoryHealth: false,
		skipQmdBinaryProbe: true,
		skipAuthProfileResolution: true,
		gatewayMemoryProbe: {
			checked: false,
			ready: false,
			skipped: true
		},
		noteFn: (message) => {
			notes.push(String(message));
		}
	});
	return notes.flatMap((message) => {
		const finding = memorySearchNoteToFinding(message);
		return finding ? [finding] : [];
	});
}
async function runDevicePairingHealth(ctx) {
	const { noteDevicePairingHealth } = await Promise.resolve().then(() => require("./doctor-device-pairing-BcdQ2Iar.cjs"));
	await noteDevicePairingHealth({
		cfg: ctx.cfg,
		healthOk: ctx.healthOk ?? false
	});
}
async function runGatewayDaemonHealth(ctx) {
	const { maybeRepairGatewayDaemon } = await Promise.resolve().then(() => require("./doctor-gateway-daemon-flow-B5pGK4p3.cjs"));
	await maybeRepairGatewayDaemon({
		cfg: ctx.cfg,
		runtime: ctx.runtime,
		prompter: ctx.prompter,
		options: ctx.options,
		gatewayDetailsMessage: ctx.gatewayDetails?.message ?? "",
		healthOk: ctx.healthOk ?? false,
		healthSkipped: ctx.gatewayHealthSkipped === true
	});
}
async function runWriteConfigHealth(ctx) {
	const { applyWizardMetadata } = await loadOnboardHelpersModule();
	const { replaceConfigFile } = await loadConfigModule();
	const { logConfigUpdated } = await Promise.resolve().then(() => require("./logging-r9lZv9sT.cjs"));
	const { shortenHomePath } = await Promise.resolve().then(() => require("./utils-CXqBhRFw.cjs")).then((n) => n.utils_exports);
	if (ctx.configResult.shouldWriteConfig || JSON.stringify(ctx.cfg) !== JSON.stringify(ctx.cfgForPersistence)) {
		const updateDoctorRun = isUpdateDoctorRun(ctx.env ?? process.env);
		ctx.cfg = applyWizardMetadata(ctx.cfg, {
			command: "doctor",
			mode: resolveDoctorMode(ctx.cfg)
		});
		if (shouldSkipLegacyUpdateDoctorConfigWrite({ env: ctx.env ?? process.env })) {
			ctx.runtime.log("Skipping doctor config write during legacy update handoff.");
			return;
		}
		const legacyParentVersionOverride = resolveLegacyParentVersionOverride(ctx).lastTouchedVersionOverride;
		await replaceConfigFile({
			nextConfig: ctx.cfg,
			afterWrite: { mode: "auto" },
			writeOptions: {
				allowConfigSizeDrop: ctx.configResult.shouldWriteConfig === true || updateDoctorRun,
				skipPluginValidation: ctx.configResult.skipPluginValidationOnWrite === true || updateDoctorRun,
				preservedLegacyRootKeys: ctx.configResult.preservedLegacyRootKeys,
				...legacyParentVersionOverride ? { lastTouchedVersionOverride: legacyParentVersionOverride } : {}
			}
		});
		logConfigUpdated(ctx.runtime);
		const preUpdateSnapshotPath = `${ctx.configPath}.pre-update`;
		if (updateDoctorRun && node_fs.default.existsSync(preUpdateSnapshotPath)) ctx.runtime.log(`Update changed config; pre-update backup: ${shortenHomePath(preUpdateSnapshotPath)}`);
	}
	if (ctx.configResult.shouldRepairCronCodexModelRefsAfterConfigWrite === true) {
		const { repairCronCodexModelRefsAfterConfigWrite } = await Promise.resolve().then(() => require("./legacy-repair-DUScBn70.cjs"));
		const result = await repairCronCodexModelRefsAfterConfigWrite({
			cfg: ctx.cfg,
			...ctx.configResult.blockedCodexModelIdentities?.length ? { blockedModelIdentities: new Set(ctx.configResult.blockedCodexModelIdentities) } : {}
		});
		const { note } = await loadNoteModule();
		if (result.changes.length > 0) note(result.changes.join("\n"), "Doctor changes");
		if (result.warnings.length > 0) note(result.warnings.join("\n"), "Doctor warnings");
	}
}
async function collectWriteConfigHealthFindings(ctx) {
	const findings = [];
	const configPath = ctx.configPath;
	if (require_paths.resolveIsNixMode(process.env)) findings.push({
		checkId: "core/doctor/write-config",
		severity: "warning",
		message: "Doctor config writes are disabled because Operator is running in Nix mode.",
		...configPath ? { path: configPath } : {},
		requirement: "mutable-config-write-path",
		fixHint: "Edit the Nix source for this install and rebuild; do not run doctor --fix against this config file."
	});
	if (!configPath) return findings;
	const configDirectory = node_path.default.dirname(configPath);
	const configPathExists = node_fs.default.existsSync(configPath);
	const existingParent = configPathExists ? configDirectory : findNearestExistingParent(configDirectory);
	if (!isDirectoryPath(existingParent)) {
		findings.push({
			checkId: "core/doctor/write-config",
			severity: "warning",
			message: "Doctor cannot create the config directory because a path component is a file.",
			path: existingParent,
			target: configDirectory,
			requirement: "config-directory-path",
			fixHint: "Move the file blocking the config directory path before running doctor --fix."
		});
		return findings;
	}
	try {
		node_fs.default.accessSync(existingParent, node_fs.default.constants.W_OK | node_fs.default.constants.X_OK);
	} catch {
		findings.push({
			checkId: "core/doctor/write-config",
			severity: "warning",
			message: configPathExists ? "Doctor cannot write config because the config directory is not writable." : "Doctor cannot create the config directory because the nearest existing parent is not writable.",
			path: existingParent,
			target: configPathExists ? configPath : configDirectory,
			requirement: "writable-config-directory",
			fixHint: "Make the existing config directory or parent directory writable before running doctor --fix."
		});
	}
	return findings;
}
function findNearestExistingParent(path) {
	let candidate = path;
	while (!pathEntryExists(candidate)) {
		const parent = node_path.default.dirname(candidate);
		if (parent === candidate) return candidate;
		candidate = parent;
	}
	return candidate;
}
function pathEntryExists(path) {
	if (node_fs.default.existsSync(path)) return true;
	try {
		node_fs.default.lstatSync(path);
		return true;
	} catch {
		return false;
	}
}
function isDirectoryPath(path) {
	try {
		return node_fs.default.statSync(path).isDirectory();
	} catch {
		return false;
	}
}
function resolveLegacyParentVersionOverride(ctx) {
	if (!require_update_phase.isLegacyParentWritableUpdateDoctorPass(ctx.env ?? process.env)) return {};
	const version = ctx.configResult.sourceLastTouchedVersion?.trim() || ctx.cfg.meta?.lastTouchedVersion;
	return version ? { lastTouchedVersionOverride: version } : {};
}
async function runWorkspaceSuggestionsHealth(ctx) {
	if (ctx.options.workspaceSuggestions === false) return;
	const { resolveAgentWorkspaceDir, resolveDefaultAgentId } = await loadAgentScopeModule();
	const { noteWorkspaceBackupTip } = await loadDoctorStateIntegrityModule();
	const { MEMORY_SYSTEM_PROMPT, shouldSuggestMemorySystem } = await Promise.resolve().then(() => require("./doctor-workspace-BL9MDwGb.cjs"));
	const { note } = await loadNoteModule();
	const workspaceDir = resolveAgentWorkspaceDir(ctx.cfg, resolveDefaultAgentId(ctx.cfg));
	noteWorkspaceBackupTip(workspaceDir);
	if (await shouldSuggestMemorySystem(workspaceDir)) note(MEMORY_SYSTEM_PROMPT, "Workspace");
}
async function runFinalConfigValidationHealth(ctx) {
	const { readConfigFileSnapshot } = await loadConfigModule();
	const finalSnapshot = await readConfigFileSnapshot({
		skipPluginValidation: isUpdateDoctorRun(ctx.env ?? process.env),
		preservedLegacyRootKeys: ctx.configResult.preservedLegacyRootKeys
	});
	if (finalSnapshot.exists && !finalSnapshot.valid) {
		ctx.runtime.error("Invalid config:");
		for (const issue of finalSnapshot.issues) {
			const path = issue.path || "<root>";
			ctx.runtime.error(`- ${path}: ${issue.message}`);
		}
	}
}
function formatHealthFindings(findings) {
	return findings.map((finding) => {
		const lines = [`- ${finding.message}`];
		if (finding.path) lines.push(`  path: ${finding.path}`);
		if (finding.requirement) lines.push(`  issue: ${finding.requirement}`);
		if (finding.fixHint) lines.push(`  fix: ${finding.fixHint}`);
		return lines.join("\n");
	}).join("\n");
}
async function runCoreHealthFindingNote(ctx, checkId) {
	const { registerCoreHealthChecks } = await loadDoctorCoreChecksModule();
	const { getHealthCheck } = await loadHealthCheckRegistryModule();
	const { resolveAgentWorkspaceDir, resolveDefaultAgentId } = await loadAgentScopeModule();
	const { note } = await loadNoteModule();
	registerCoreHealthChecks();
	const check = getHealthCheck(checkId);
	if (!check) return;
	const findings = await check.detect({
		mode: "doctor",
		runtime: ctx.runtime,
		cfg: ctx.cfg,
		cwd: resolveAgentWorkspaceDir(ctx.cfg, resolveDefaultAgentId(ctx.cfg)),
		configPath: ctx.configPath
	});
	if (findings.length === 0) return;
	const information = findings.filter((finding) => finding.severity === "info");
	const warnings = findings.filter((finding) => finding.severity !== "info");
	if (information.length > 0) note(formatHealthFindings(information), "Doctor information");
	if (warnings.length > 0) {
		ctx.healthOk = false;
		note(formatHealthFindings(warnings), "Doctor warnings");
	}
}
async function runProviderCatalogProjectionHealth(ctx) {
	await runCoreHealthFindingNote(ctx, "core/doctor/provider-catalog-projection");
}
async function runLocalAudioAccelerationHealth(ctx) {
	await runCoreHealthFindingNote(ctx, "core/doctor/local-audio-acceleration");
}
async function runRuntimeToolSchemasHealth(ctx) {
	await runCoreHealthFindingNote(ctx, "core/doctor/runtime-tool-schemas");
}
async function runSkillWorkshopToolPolicyHealth(ctx) {
	await runCoreHealthFindingNote(ctx, "core/doctor/skill-workshop-tool-policy");
}
function resolveDoctorHealthContributions() {
	return [
		createDoctorHealthContribution({
			id: "doctor:gateway-config",
			label: "Gateway config",
			healthCheckIds: ["core/doctor/gateway-config"],
			run: runGatewayConfigHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:auth-profiles",
			label: "Auth profiles",
			healthChecks: {
				id: "core/doctor/auth-profiles",
				kind: "core",
				description: "Auth profile cooldown, expiry, missing credential, and legacy override state",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectAuthProfileHealthFindings } = await Promise.resolve().then(() => require("./doctor-auth-C0MKdiHh.cjs"));
					return collectAuthProfileHealthFindings({
						cfg: ctx.cfg,
						allowKeychainPrompt: false
					});
				}
			},
			run: runAuthProfileHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:claude-cli",
			label: "Claude CLI",
			healthCheckIds: ["core/doctor/claude-cli"],
			run: runClaudeCliHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:gateway-auth",
			label: "Gateway auth",
			healthCheckIds: ["core/doctor/gateway-auth"],
			run: runGatewayAuthHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:command-owner",
			label: "Command owner",
			healthCheckIds: ["core/doctor/command-owner"],
			run: runCommandOwnerHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:structured-health-repairs",
			label: "Structured health repairs",
			run: runStructuredHealthRepairs
		}),
		createDoctorHealthContribution({
			id: "doctor:legacy-state",
			label: "Legacy state",
			healthCheckIds: ["core/doctor/legacy-state"],
			run: runLegacyStateHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:legacy-plugin-manifests",
			label: "Legacy plugin manifests",
			healthChecks: {
				id: "core/doctor/legacy-plugin-manifests",
				description: "Legacy plugin manifest capability keys are reported as findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectLegacyPluginManifestContractMigrations, legacyPluginManifestContractMigrationToHealthFinding } = await Promise.resolve().then(() => require("./doctor-plugin-manifests-DkGc9YxC.cjs"));
					return collectLegacyPluginManifestContractMigrations({
						config: ctx.cfg,
						env: process.env
					}).map(legacyPluginManifestContractMigrationToHealthFinding);
				}
			},
			run: runLegacyPluginManifestHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:legacy-plugin-dependencies",
			label: "Legacy plugin dependencies",
			healthChecks: {
				id: "core/doctor/legacy-plugin-dependencies",
				description: "Legacy plugin dependency state roots are represented as findings.",
				defaultEnabled: false,
				async detect() {
					const { detectLegacyPluginDependencyStateIssues, legacyPluginDependencyStateIssueToHealthFinding } = await Promise.resolve().then(() => require("./plugin-dependency-cleanup-CMo92LUY.cjs"));
					return (await detectLegacyPluginDependencyStateIssues({ env: process.env })).map(legacyPluginDependencyStateIssueToHealthFinding);
				}
			},
			run: async () => {}
		}),
		createDoctorHealthContribution({
			id: "doctor:stale-plugin-runtime-symlinks",
			label: "Stale plugin runtime symlinks",
			healthChecks: {
				id: "core/doctor/stale-plugin-runtime-symlinks",
				description: "Stale plugin-runtime symlinks are represented as findings.",
				defaultEnabled: false,
				async detect() {
					const { collectStalePluginRuntimeSymlinkHealthFindings } = await Promise.resolve().then(() => require("./plugin-runtime-symlinks-OHgSPFG5.cjs")).then((n) => n.plugin_runtime_symlinks_exports);
					return await collectStalePluginRuntimeSymlinkHealthFindings();
				}
			},
			run: async () => {}
		}),
		createDoctorHealthContribution({
			id: "doctor:release-configured-plugin-installs",
			label: "Configured plugin repair",
			healthChecks: {
				id: "core/doctor/configured-plugin-installs",
				description: "Configured plugin install records and package payloads are repairable.",
				defaultEnabled: false,
				async detect(ctx) {
					const { detectConfiguredPluginInstallHealthIssues, configuredPluginInstallIssueToHealthFinding } = await Promise.resolve().then(() => require("./missing-configured-plugin-install-BXc1994T.cjs"));
					return (await detectConfiguredPluginInstallHealthIssues({
						cfg: ctx.cfg,
						env: process.env
					})).map(configuredPluginInstallIssueToHealthFinding);
				},
				async repair(ctx) {
					const { detectConfiguredPluginInstallHealthIssues, configuredPluginInstallIssueToRepairEffect } = await Promise.resolve().then(() => require("./missing-configured-plugin-install-BXc1994T.cjs"));
					const effects = (await detectConfiguredPluginInstallHealthIssues({
						cfg: ctx.cfg,
						env: process.env
					})).map(configuredPluginInstallIssueToRepairEffect);
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor configured plugin install repair owns package mutation",
						changes: [],
						effects
					};
				}
			},
			run: runReleaseConfiguredPluginInstallsHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:plugin-registry",
			label: "Plugin registry",
			healthChecks: {
				id: "core/doctor/plugin-registry",
				description: "Plugin registry migration, stale shadow, and peer-link issues are findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { detectPluginRegistryHealthIssues, pluginRegistryIssueToHealthFinding } = await Promise.resolve().then(() => require("./doctor-plugin-registry-D6vxCw0T.cjs"));
					return (await detectPluginRegistryHealthIssues({
						config: ctx.cfg,
						env: process.env,
						prompter: { shouldRepair: false }
					})).map(pluginRegistryIssueToHealthFinding);
				},
				async repair(ctx) {
					const { detectPluginRegistryHealthIssues, pluginRegistryIssueToRepairEffect } = await Promise.resolve().then(() => require("./doctor-plugin-registry-D6vxCw0T.cjs"));
					const effects = (await detectPluginRegistryHealthIssues({
						config: ctx.cfg,
						env: process.env,
						prompter: { shouldRepair: false }
					})).map(pluginRegistryIssueToRepairEffect);
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor plugin registry contribution owns registry repairs",
						changes: [],
						effects
					};
				}
			},
			run: runPluginRegistryHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:ui-protocol-freshness",
			label: "UI protocol freshness",
			healthCheckIds: ["core/doctor/ui-protocol-freshness"],
			run: async () => {}
		}),
		createDoctorHealthContribution({
			id: "doctor:disk-space",
			label: "Disk space",
			healthChecks: {
				id: "core/doctor/disk-space",
				description: "Low disk space around the Operator state directory is a finding.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectDiskSpaceHealthFindings } = await Promise.resolve().then(() => require("./doctor-disk-space-Bh101fzt.cjs"));
					return collectDiskSpaceHealthFindings(ctx.cfg);
				}
			},
			run: runDiskSpaceHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:db-bloat",
			label: "SQLite database size",
			run: runDatabaseBloatHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:state-integrity",
			label: "State integrity",
			healthChecks: {
				id: "core/doctor/state-integrity",
				description: "State directory, config permission, and runtime state issues are findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { detectStateIntegrityHealthIssues, stateIntegrityIssueToHealthFinding } = await Promise.resolve().then(() => require("./doctor-state-integrity-D_kYYYAD.cjs"));
					return detectStateIntegrityHealthIssues(ctx.cfg, {
						configPath: ctx.configPath,
						env: process.env
					}).map(stateIntegrityIssueToHealthFinding);
				},
				async repair(ctx) {
					const { detectStateIntegrityHealthIssues, stateIntegrityIssueToRepairEffect } = await Promise.resolve().then(() => require("./doctor-state-integrity-D_kYYYAD.cjs"));
					const effects = detectStateIntegrityHealthIssues(ctx.cfg, {
						configPath: ctx.configPath,
						env: process.env
					}).map(stateIntegrityIssueToRepairEffect);
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor state integrity contribution owns state repairs",
						changes: [],
						effects
					};
				}
			},
			run: runStateIntegrityHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:codex-session-routes",
			label: "Codex session routes",
			healthCheckIds: ["core/doctor/codex-session-routes"],
			run: runCodexSessionRouteHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:session-locks",
			label: "Session locks",
			healthCheckIds: ["core/doctor/session-locks"],
			run: runSessionLocksHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:session-transcripts",
			label: "Session transcripts",
			healthChecks: {
				id: "core/doctor/session-transcripts",
				description: "Legacy or branchy session transcript files are represented as findings.",
				defaultEnabled: false,
				async detect() {
					const { detectSessionTranscriptHealthIssues, sessionTranscriptIssueToHealthFinding } = await Promise.resolve().then(() => require("./doctor-session-transcripts-DIcDqQHA.cjs"));
					return (await detectSessionTranscriptHealthIssues()).map(sessionTranscriptIssueToHealthFinding);
				},
				async repair(ctx) {
					const { detectSessionTranscriptHealthIssues, sessionTranscriptIssueToRepairEffect } = await Promise.resolve().then(() => require("./doctor-session-transcripts-DIcDqQHA.cjs"));
					const effects = (await detectSessionTranscriptHealthIssues()).map(sessionTranscriptIssueToRepairEffect);
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor session transcript contribution owns transcript rewrites",
						changes: [],
						effects
					};
				}
			},
			run: runSessionTranscriptsHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:session-snapshots",
			label: "Session snapshots",
			healthChecks: {
				id: "core/doctor/session-snapshots",
				description: "Stale cached session snapshot paths are represented as findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { detectSessionSnapshotHealthIssues, sessionSnapshotIssueToHealthFinding } = await Promise.resolve().then(() => require("./doctor-session-snapshots-BoYNg-Kg.cjs"));
					return (await detectSessionSnapshotHealthIssues({
						cfg: ctx.cfg,
						env: process.env
					})).map(sessionSnapshotIssueToHealthFinding);
				},
				async repair(ctx) {
					const { detectSessionSnapshotHealthIssues, sessionSnapshotIssueToRepairEffect } = await Promise.resolve().then(() => require("./doctor-session-snapshots-BoYNg-Kg.cjs"));
					const effects = (await detectSessionSnapshotHealthIssues({
						cfg: ctx.cfg,
						env: process.env
					})).map(sessionSnapshotIssueToRepairEffect);
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor session snapshot contribution owns snapshot rewrites",
						changes: [],
						effects
					};
				}
			},
			run: runSessionSnapshotsHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:config-audit-scrub",
			label: "Config audit",
			healthChecks: {
				description: "Historical config-audit argv redaction gaps are represented as structured findings.",
				defaultEnabled: false,
				async detect() {
					const { configAuditScrubToHealthFinding, detectConfigAuditScrubIssue } = await Promise.resolve().then(() => require("./doctor-config-audit-scrub-BfYkq68H.cjs"));
					const result = await detectConfigAuditScrubIssue();
					return result.rewritten > 0 ? [configAuditScrubToHealthFinding(result)] : [];
				},
				async repair(ctx) {
					const { configAuditScrubToRepairEffect, detectConfigAuditScrubIssue } = await Promise.resolve().then(() => require("./doctor-config-audit-scrub-BfYkq68H.cjs"));
					const result = await detectConfigAuditScrubIssue();
					const effects = result.rewritten > 0 ? [configAuditScrubToRepairEffect(result)] : [];
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor config audit contribution owns cleanup",
						changes: [],
						effects
					};
				}
			},
			run: runConfigAuditScrubHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:legacy-cron",
			label: "Legacy cron",
			healthCheckIds: ["core/doctor/legacy-whatsapp-crontab", "core/doctor/legacy-cron-store"],
			run: runLegacyCronHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:sandbox",
			label: "Sandbox",
			healthChecks: {
				id: "core/doctor/sandbox/registry-files",
				description: "Legacy sandbox registry files are represented in SQLite registry storage.",
				async detect() {
					const { detectLegacySandboxRegistryFileIssues, legacySandboxRegistryInspectionToHealthFinding } = await Promise.resolve().then(() => require("./doctor-sandbox-BQDFn5pQ.cjs"));
					return (await detectLegacySandboxRegistryFileIssues()).map(legacySandboxRegistryInspectionToHealthFinding);
				},
				async repair(ctx) {
					const { detectLegacySandboxRegistryFileIssues, legacySandboxRegistryInspectionToRepairEffect } = await Promise.resolve().then(() => require("./doctor-sandbox-BQDFn5pQ.cjs"));
					const effects = (await detectLegacySandboxRegistryFileIssues()).map(legacySandboxRegistryInspectionToRepairEffect);
					if (ctx.dryRun === true) return {
						status: "repaired",
						changes: [],
						effects
					};
					return {
						status: "skipped",
						reason: "legacy doctor sandbox contribution owns registry migration",
						changes: [],
						effects
					};
				}
			},
			run: runSandboxHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:gateway-services",
			label: "Gateway services",
			healthCheckIds: ["core/doctor/gateway-services/extra", "core/doctor/gateway-services/platform-notes"],
			run: runGatewayServicesHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:default-account-routing",
			label: "Default account routing",
			healthChecks: {
				id: "core/doctor/default-account-routing",
				description: "Multi-account channels have explicit default routing or complete bindings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectMissingDefaultAccountBindingWarnings, collectMissingExplicitDefaultAccountWarnings } = await Promise.resolve().then(() => require("./default-account-warnings-H8cIIRCK.cjs"));
					return [...collectMissingDefaultAccountBindingWarnings(ctx.cfg), ...collectMissingExplicitDefaultAccountWarnings(ctx.cfg)].map((message) => ({
						checkId: "core/doctor/default-account-routing",
						severity: "warning",
						message: message.replace(/^- /, "").trim()
					}));
				}
			}
		}),
		createDoctorHealthContribution({
			id: "doctor:startup-channel-maintenance",
			label: "Startup channel maintenance",
			healthCheckIds: ["core/doctor/channel-plugin-blockers", "core/doctor/channel-preview-warnings"],
			healthChecks: [{
				id: "core/doctor/channel-plugin-blockers",
				description: "Configured channels must have loadable backing channel plugins.",
				defaultEnabled: false,
				async detect(ctx) {
					const { channelPluginBlockerHitToHealthFinding, scanConfiguredChannelPluginBlockers } = await Promise.resolve().then(() => require("./channel-plugin-blockers-CFkxs2GQ.cjs"));
					return scanConfiguredChannelPluginBlockers(ctx.cfg, process.env).map(channelPluginBlockerHitToHealthFinding);
				}
			}, {
				id: "core/doctor/channel-preview-warnings",
				description: "Channel doctor preview warnings are captured as structured findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectChannelPreviewWarningHealthFindings } = await Promise.resolve().then(() => require("./doctor-startup-channel-maintenance-B4VeSz5H.cjs"));
					return collectChannelPreviewWarningHealthFindings({
						cfg: ctx.cfg,
						allowExec: ctx.allowExecSecretRefs === true
					});
				}
			}],
			run: runStartupChannelMaintenanceHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:security",
			label: "Security",
			healthCheckIds: ["core/doctor/security"],
			run: runSecurityHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:browser",
			label: "Browser",
			healthCheckIds: ["core/doctor/browser", "core/doctor/browser-clawd-profile-residue"],
			run: runBrowserHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:oauth-tls",
			label: "OAuth TLS",
			healthCheckIds: ["core/doctor/oauth-tls"],
			run: runOpenAIOAuthTlsHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:hooks-model",
			label: "Hooks model",
			healthCheckIds: ["core/doctor/hooks-model"],
			run: runHooksModelHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:tool-result-cap",
			label: "Tool result cap",
			healthChecks: {
				id: "core/doctor/tool-result-cap",
				description: "Detect explicit toolResultMaxChars settings that fight model-window defaults.",
				defaultEnabled: false,
				detect: async (ctx) => collectToolResultCapFindings(ctx.cfg)
			},
			run: runToolResultCapHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:provider-catalog-projection",
			label: "Provider catalog projection",
			healthCheckIds: ["core/doctor/provider-catalog-projection"],
			run: runProviderCatalogProjectionHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:local-audio-acceleration",
			label: "Local audio acceleration",
			healthCheckIds: ["core/doctor/local-audio-acceleration"],
			run: runLocalAudioAccelerationHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:runtime-tool-schemas",
			label: "Runtime tool schemas",
			healthCheckIds: ["core/doctor/runtime-tool-schemas"],
			run: runRuntimeToolSchemasHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:skill-workshop-tool-policy",
			label: "Skill Workshop tool policy",
			healthCheckIds: ["core/doctor/skill-workshop-tool-policy"],
			run: runSkillWorkshopToolPolicyHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:systemd-linger",
			label: "systemd linger",
			healthChecks: {
				id: "core/doctor/systemd-linger",
				description: "Disabled systemd user lingering is reported as a finding.",
				defaultEnabled: false,
				detect: detectSystemdLingerFindings
			},
			run: runSystemdLingerHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:workspace-status",
			label: "Workspace status",
			healthChecks: {
				id: "core/doctor/workspace-status",
				description: "Workspace plugin/status diagnostics are exposed as findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectWorkspaceStatusHealthFindings } = await Promise.resolve().then(() => require("./doctor-workspace-status-DL8PqCxi.cjs"));
					const pluginVersionDrift = await collectWorkspaceStatusPluginVersionDrift({
						cfg: ctx.cfg,
						options: {
							nonInteractive: true,
							allowExec: ctx.allowExecSecretRefs === true
						}
					});
					return collectWorkspaceStatusHealthFindings(ctx.cfg, { pluginVersionDrift });
				}
			},
			run: runWorkspaceStatusHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:skill-curator",
			label: "Skill curator",
			healthChecks: {
				id: "core/doctor/skill-curator",
				description: "Stalled skill lifecycle curation is reported as a warning.",
				defaultEnabled: false,
				async detect() {
					const { getSkillCuratorDoctorWarning } = await Promise.resolve().then(() => require("./curator-D3crpveo.cjs")).then((n) => n.curator_exports);
					const warning = getSkillCuratorDoctorWarning();
					return warning ? [{
						checkId: "core/doctor/skill-curator",
						severity: "warning",
						source: "doctor",
						message: warning,
						target: "skill-curator",
						requirement: "latest sweep succeeds and attempts do not trail success by seven days"
					}] : [];
				}
			}
		}),
		createDoctorHealthContribution({
			id: "doctor:skills",
			label: "Skills",
			healthCheckIds: ["core/doctor/skills-readiness"],
			run: runSkillsHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:bootstrap-size",
			label: "Bootstrap size",
			healthCheckIds: ["core/doctor/bootstrap-size"],
			run: runBootstrapSizeHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:heartbeat-template-repair",
			label: "Heartbeat template repair",
			healthChecks: {
				id: "core/doctor/heartbeat-template",
				description: "Legacy HEARTBEAT.md documentation templates are findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectHeartbeatTemplateHealthFindings } = await Promise.resolve().then(() => require("./doctor-heartbeat-template-repair-DUc7JPlN.cjs"));
					return await collectHeartbeatTemplateHealthFindings(ctx.cfg);
				}
			},
			run: runHeartbeatTemplateRepairHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:shell-completion",
			label: "Shell completion",
			healthCheckIds: ["core/doctor/shell-completion"],
			run: runShellCompletionHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:gateway-health",
			label: "Gateway health",
			healthCheckIds: ["core/doctor/gateway-health"],
			run: runGatewayHealthChecks
		}),
		createDoctorHealthContribution({
			id: "doctor:whatsapp-responsiveness",
			label: "WhatsApp responsiveness",
			healthChecks: {
				id: "core/doctor/whatsapp-responsiveness",
				description: "WhatsApp responsiveness pressure from degraded Gateway and local TUI clients.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectWhatsappResponsivenessHealthFindings } = await Promise.resolve().then(() => require("./doctor-whatsapp-responsiveness-BJ-wTbpm.cjs"));
					let status;
					if (!(await hasActiveGatewayExecCredential({ cfg: ctx.cfg }) && ctx.allowExecSecretRefs !== true)) {
						const { callGateway } = await Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports);
						status = await callGateway({
							method: "status",
							params: { includeChannelSummary: false },
							timeoutMs: 3e3,
							config: ctx.cfg,
							deviceIdentity: null
						}).catch(() => void 0);
					}
					return collectWhatsappResponsivenessHealthFindings({
						cfg: ctx.cfg,
						status
					});
				}
			},
			run: runWhatsappResponsivenessHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:memory-search",
			label: "Memory search",
			healthChecks: {
				description: "Memory search provider and backend readiness are captured as findings.",
				defaultEnabled: false,
				detect: collectMemorySearchHealthFindings
			},
			run: runMemorySearchHealthContribution
		}),
		createDoctorHealthContribution({
			id: "doctor:device-pairing",
			label: "Device pairing",
			healthChecks: {
				id: "core/doctor/device-pairing",
				description: "Device pairing requests and stale device-auth records are findings.",
				defaultEnabled: false,
				async detect(ctx) {
					const { collectDevicePairingHealthFindings } = await Promise.resolve().then(() => require("./doctor-device-pairing-BcdQ2Iar.cjs"));
					return await collectDevicePairingHealthFindings({
						cfg: ctx.cfg,
						healthOk: false
					});
				}
			},
			run: runDevicePairingHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:gateway-daemon",
			label: "Gateway daemon",
			healthCheckIds: ["core/doctor/gateway-daemon"],
			run: runGatewayDaemonHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:write-config",
			label: "Write config",
			healthChecks: {
				id: "core/doctor/write-config",
				description: "Config write blockers are findings before doctor repair writes.",
				defaultEnabled: false,
				detect: collectWriteConfigHealthFindings
			},
			run: runWriteConfigHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:workspace-suggestions",
			label: "Workspace suggestions",
			healthCheckIds: ["core/doctor/workspace-suggestions"],
			run: runWorkspaceSuggestionsHealth
		}),
		createDoctorHealthContribution({
			id: "doctor:final-config-validation",
			label: "Final config validation",
			healthCheckIds: ["core/doctor/final-config-validation"],
			run: runFinalConfigValidationHealth
		})
	];
}
async function resolveDoctorContributionHealthChecks() {
	const { CORE_HEALTH_CHECKS } = await Promise.resolve().then(() => require("./doctor-core-checks-BpX1elWt.cjs"));
	const checksById = new Map(CORE_HEALTH_CHECKS.map((check) => [check.id, check]));
	const checks = [];
	for (const contribution of resolveDoctorHealthContributions()) {
		if (contribution.healthChecks.length > 0) {
			checks.push(...contribution.healthChecks.map(require_health_check_adapter.normalizeHealthCheck));
			continue;
		}
		for (const id of contribution.healthCheckIds) {
			const check = checksById.get(id);
			if (check === void 0) throw new Error(`doctor contribution ${contribution.id} references unknown core health check ${id}`);
			checks.push(check);
		}
	}
	return checks;
}
async function runDoctorHealthContributions(ctx) {
	for (const contribution of resolveDoctorHealthContributions()) await contribution.run(ctx);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.doctorHealthContributionsTestApi")] = {
	createDoctorHealthContribution,
	resolveDoctorHealthContributions
};
//#endregion
exports.runDoctorHealthContributions = runDoctorHealthContributions;
