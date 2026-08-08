require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_dm_allow_state = require("./dm-allow-state-C8NDyPNp.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
const require_secret_value = require("./secret-value-BpdByGIA.cjs");
const require_target_registry = require("./target-registry-C5xgrPiJ.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
require("./auth-DnGY7_cY.cjs");
const require_auth_token_source_conflict = require("./auth-token-source-conflict-BlJ44vZc.cjs");
const require_exec_filesystem_policy = require("./exec-filesystem-policy-DLhs4Qgv.cjs");
const require_channel_account_context = require("./channel-account-context-BNMpPvGe.cjs");
require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/exec-approvals-effective.ts
const DEFAULT_REQUESTED_SECURITY = "full";
const DEFAULT_REQUESTED_ASK = "off";
const REQUESTED_DEFAULT_LABEL = {
	security: DEFAULT_REQUESTED_SECURITY,
	ask: DEFAULT_REQUESTED_ASK
};
function resolveRequestedHost(params) {
	const scopeValue = params.scopeExecConfig?.host;
	if (scopeValue !== void 0) return {
		value: scopeValue,
		sourcePath: "scope"
	};
	const globalValue = params.globalExecConfig?.host;
	if (globalValue !== void 0) return {
		value: globalValue,
		sourcePath: "tools.exec"
	};
	return {
		value: "auto",
		sourcePath: "__default__"
	};
}
function formatRequestedSource(params) {
	return params.sourcePath === "__default__" ? `Operator default (${params.defaultValue})` : `${params.sourcePath}.${params.field}`;
}
function formatModeSource(params) {
	if (params.sourcePath === "__default__") return "derived from Operator defaults";
	return `${params.sourcePath === "scope" ? params.configPath : params.sourcePath}.mode`;
}
function resolveRequestedField(params) {
	const scopeValue = params.scopeExecConfig?.[params.field];
	if (scopeValue !== void 0) return {
		value: scopeValue,
		sourcePath: "scope"
	};
	const globalValue = params.globalExecConfig?.[params.field];
	if (globalValue !== void 0) return {
		value: globalValue,
		sourcePath: "tools.exec"
	};
	return {
		value: REQUESTED_DEFAULT_LABEL[params.field],
		sourcePath: "__default__"
	};
}
function hasLegacyExecPolicyOverride(exec) {
	return exec?.security !== void 0 || exec?.ask !== void 0;
}
function resolveRequestedPolicy(params) {
	if (params.scopeExecConfig?.mode) {
		const policy = require_exec_approvals.resolveExecModePolicy({
			mode: params.scopeExecConfig.mode,
			security: DEFAULT_REQUESTED_SECURITY,
			ask: DEFAULT_REQUESTED_ASK
		});
		const source = formatModeSource({
			sourcePath: "scope",
			configPath: params.configPath
		});
		return {
			mode: policy.mode,
			modeSource: source,
			security: policy.security,
			securitySource: source,
			ask: policy.ask,
			askSource: source
		};
	}
	if (!hasLegacyExecPolicyOverride(params.scopeExecConfig) && params.globalExecConfig?.mode) {
		const policy = require_exec_approvals.resolveExecModePolicy({
			mode: params.globalExecConfig.mode,
			security: DEFAULT_REQUESTED_SECURITY,
			ask: DEFAULT_REQUESTED_ASK
		});
		const source = formatModeSource({
			sourcePath: "tools.exec",
			configPath: params.configPath
		});
		return {
			mode: policy.mode,
			modeSource: source,
			security: policy.security,
			securitySource: source,
			ask: policy.ask,
			askSource: source
		};
	}
	if (hasLegacyExecPolicyOverride(params.scopeExecConfig) && params.globalExecConfig?.mode) {
		const inherited = require_exec_approvals.resolveExecModePolicy({
			mode: params.globalExecConfig.mode,
			security: DEFAULT_REQUESTED_SECURITY,
			ask: DEFAULT_REQUESTED_ASK
		});
		const inheritedSource = formatModeSource({
			sourcePath: "tools.exec",
			configPath: params.configPath
		});
		const scopeSecuritySource = formatRequestedSource({
			sourcePath: params.configPath,
			field: "security",
			defaultValue: DEFAULT_REQUESTED_SECURITY
		});
		const scopeAskSource = formatRequestedSource({
			sourcePath: params.configPath,
			field: "ask",
			defaultValue: DEFAULT_REQUESTED_ASK
		});
		const security = params.scopeExecConfig?.security ?? inherited.security;
		const ask = params.scopeExecConfig?.ask ?? inherited.ask;
		const securitySource = params.scopeExecConfig?.security !== void 0 ? scopeSecuritySource : inheritedSource;
		const askSource = params.scopeExecConfig?.ask !== void 0 ? scopeAskSource : inheritedSource;
		return {
			mode: require_exec_approvals.resolveExecModeFromPolicy({
				security,
				ask
			}),
			modeSource: securitySource === askSource ? `derived from ${securitySource}` : `derived from ${securitySource} and ${askSource}`,
			security,
			securitySource,
			ask,
			askSource
		};
	}
	const security = resolveRequestedField({
		field: "security",
		scopeExecConfig: params.scopeExecConfig,
		globalExecConfig: params.globalExecConfig
	});
	const ask = resolveRequestedField({
		field: "ask",
		scopeExecConfig: params.scopeExecConfig,
		globalExecConfig: params.globalExecConfig
	});
	const securitySource = formatRequestedSource({
		sourcePath: security.sourcePath === "scope" ? params.configPath : security.sourcePath,
		field: "security",
		defaultValue: DEFAULT_REQUESTED_SECURITY
	});
	const askSource = formatRequestedSource({
		sourcePath: ask.sourcePath === "scope" ? params.configPath : ask.sourcePath,
		field: "ask",
		defaultValue: DEFAULT_REQUESTED_ASK
	});
	return {
		mode: require_exec_approvals.resolveExecModeFromPolicy({
			security: security.value,
			ask: ask.value
		}),
		modeSource: securitySource === askSource ? `derived from ${securitySource}` : `derived from ${securitySource} and ${askSource}`,
		security: security.value,
		securitySource,
		ask: ask.value,
		askSource
	};
}
function formatHostFieldSource(params) {
	if (params.sourceSuffix) return `${params.hostPath} ${params.sourceSuffix}`;
	if (params.hostDefaultSource) return params.hostDefaultSource;
	if (params.field === "askFallback") return `Operator default (${require_exec_approvals.DEFAULT_EXEC_APPROVAL_ASK_FALLBACK})`;
	return "inherits requested tool policy";
}
function resolveAskNote(params) {
	if (params.effectiveAsk === params.requestedAsk) return "requested ask applies";
	return "more aggressive ask wins";
}
function resolveExecPolicyScopeSnapshot(params) {
	const requestedHost = resolveRequestedHost({
		scopeExecConfig: params.scopeExecConfig,
		globalExecConfig: params.globalExecConfig
	});
	const requestedPolicy = resolveRequestedPolicy({
		scopeExecConfig: params.scopeExecConfig,
		globalExecConfig: params.globalExecConfig,
		configPath: params.configPath
	});
	const resolved = require_exec_approvals.resolveExecApprovalsFromFile({
		file: params.approvals,
		agentId: params.agentId,
		overrides: {
			security: params.hostDefaults?.security ?? requestedPolicy.security,
			ask: params.hostDefaults?.ask ?? requestedPolicy.ask,
			...params.hostDefaults ? { askFallback: params.hostDefaults.askFallback } : {}
		}
	});
	const hostPath = params.hostPath ?? require_exec_approvals.resolveExecApprovalsDisplayPath();
	const effectiveSecurity = require_exec_approvals.minSecurity(requestedPolicy.security, resolved.agent.security);
	const effectiveAsk = require_exec_approvals.maxAsk(requestedPolicy.ask, resolved.agent.ask);
	const effectiveAskFallback = require_exec_approvals.minSecurity(effectiveSecurity, resolved.agent.askFallback);
	const effectiveMode = effectiveSecurity === requestedPolicy.security && effectiveAsk === requestedPolicy.ask ? requestedPolicy.mode : require_exec_approvals.resolveExecModeFromPolicy({
		security: effectiveSecurity,
		ask: effectiveAsk
	});
	return {
		scopeLabel: params.scopeLabel,
		configPath: params.configPath,
		...params.agentId ? { agentId: params.agentId } : {},
		host: {
			requested: requestedHost.value,
			requestedSource: requestedHost.sourcePath === "__default__" ? "Operator default (auto)" : `${requestedHost.sourcePath === "scope" ? params.configPath : requestedHost.sourcePath}.host`
		},
		mode: {
			requested: requestedPolicy.mode,
			requestedSource: requestedPolicy.modeSource,
			effective: effectiveMode,
			note: effectiveMode === requestedPolicy.mode ? "requested mode applies" : "host policy changes effective mode"
		},
		security: {
			requested: requestedPolicy.security,
			requestedSource: requestedPolicy.securitySource,
			host: resolved.agent.security,
			hostSource: formatHostFieldSource({
				hostPath,
				field: "security",
				sourceSuffix: resolved.agentSources.security,
				hostDefaultSource: params.hostDefaultSource
			}),
			effective: effectiveSecurity,
			note: effectiveSecurity === requestedPolicy.security ? "requested security applies" : "stricter host security wins"
		},
		ask: {
			requested: requestedPolicy.ask,
			requestedSource: requestedPolicy.askSource,
			host: resolved.agent.ask,
			hostSource: formatHostFieldSource({
				hostPath,
				field: "ask",
				sourceSuffix: resolved.agentSources.ask,
				hostDefaultSource: params.hostDefaultSource
			}),
			effective: effectiveAsk,
			note: resolveAskNote({
				requestedAsk: requestedPolicy.ask,
				hostAsk: resolved.agent.ask,
				effectiveAsk
			})
		},
		askFallback: {
			effective: effectiveAskFallback,
			source: formatHostFieldSource({
				hostPath,
				field: "askFallback",
				sourceSuffix: resolved.agentSources.askFallback,
				hostDefaultSource: params.hostDefaultSource
			})
		},
		allowedDecisions: require_exec_approvals.resolveExecApprovalAllowedDecisions({ ask: effectiveAsk })
	};
}
//#endregion
//#region src/secrets/model-provider-header-policy.ts
/** Classifies model-provider request headers that should be treated as credential material. */
/** Exact header names that always carry credential material for model provider requests. */
const ALWAYS_SENSITIVE_MODEL_PROVIDER_HEADER_NAMES = /* @__PURE__ */ new Set([
	"authorization",
	"proxy-authorization",
	"x-api-key",
	"api-key",
	"apikey",
	"x-auth-token",
	"auth-token",
	"x-access-token",
	"access-token",
	"x-secret-key",
	"secret-key"
]);
const SENSITIVE_MODEL_PROVIDER_HEADER_NAME_FRAGMENTS = [
	"api-key",
	"apikey",
	"token",
	"secret",
	"password",
	"credential"
];
/**
* Returns whether a model-provider header name should be treated as secret-bearing.
* This is intentionally conservative: false positives are audit noise, false negatives leak keys.
*/
function isLikelySensitiveModelProviderHeaderName(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	if (!normalized) return false;
	if (ALWAYS_SENSITIVE_MODEL_PROVIDER_HEADER_NAMES.has(normalized)) return true;
	return SENSITIVE_MODEL_PROVIDER_HEADER_NAME_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}
//#endregion
//#region src/commands/doctor-security.ts
/** Security warnings for gateway exposure, exec policy drift, channel DMs, and plaintext secrets. */
function collectImplicitHeartbeatDirectPolicyWarnings(cfg) {
	const warnings = [];
	const maybeWarn = (params) => {
		const heartbeat = params.heartbeat;
		if (!heartbeat || heartbeat.target === void 0 || heartbeat.target === "none") return;
		if (heartbeat.directPolicy !== void 0) return;
		warnings.push(`- ${params.label}: heartbeat delivery is configured while ${params.pathHint} is unset.`, "  Heartbeat now allows direct/DM targets by default. Set it explicitly to \"allow\" or \"block\" to pin upgrade behavior.");
	};
	maybeWarn({
		label: "Heartbeat defaults",
		heartbeat: cfg.agents?.defaults?.heartbeat,
		pathHint: "agents.defaults.heartbeat.directPolicy"
	});
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const agent of agents) maybeWarn({
		label: `Heartbeat agent "${agent.id}"`,
		heartbeat: agent.heartbeat,
		pathHint: `heartbeat.directPolicy for agent "${agent.id}"`
	});
	return warnings;
}
function execSecurityRank(value) {
	switch (value) {
		case "deny": return 0;
		case "allowlist": return 1;
		case "full": return 2;
	}
	throw new Error("Unsupported exec security value");
}
function execAskRank(value) {
	switch (value) {
		case "off": return 0;
		case "on-miss": return 1;
		case "always": return 2;
	}
	throw new Error("Unsupported exec ask value");
}
function collectExecPolicyConflictWarnings(cfg) {
	const warnings = [];
	const approvals = require_exec_approvals.loadExecApprovals();
	const defaultRequestedSecuritySource = "Operator default (full)";
	const defaultRequestedAskSource = "Operator default (off)";
	const maybeWarn = (params) => {
		const scopeExecConfig = params.scopeExecConfig;
		const globalExecConfig = params.globalExecConfig;
		if (!scopeExecConfig?.mode && !scopeExecConfig?.security && !scopeExecConfig?.ask && !globalExecConfig?.mode && !globalExecConfig?.security && !globalExecConfig?.ask) return;
		const snapshot = resolveExecPolicyScopeSnapshot({
			approvals,
			scopeExecConfig,
			globalExecConfig,
			configPath: params.scopeLabel === "tools.exec" ? "tools.exec" : `agents.list.${params.agentId}.tools.exec`,
			scopeLabel: params.scopeLabel,
			agentId: params.agentId
		});
		const securityConfigured = snapshot.security.requestedSource !== defaultRequestedSecuritySource;
		const askConfigured = snapshot.ask.requestedSource !== defaultRequestedAskSource;
		const securityConflict = securityConfigured && execSecurityRank(snapshot.security.requested) > execSecurityRank(snapshot.security.effective);
		const askConflict = askConfigured && execAskRank(snapshot.ask.requested) < execAskRank(snapshot.ask.effective);
		if (!securityConflict && !askConflict) return;
		const configParts = [];
		const hostParts = [];
		if (securityConflict) {
			configParts.push(`${snapshot.security.requestedSource}="${snapshot.security.requested}"`);
			hostParts.push(`${snapshot.security.hostSource}="${snapshot.security.host}"`);
		}
		if (askConflict) {
			configParts.push(`${snapshot.ask.requestedSource}="${snapshot.ask.requested}"`);
			hostParts.push(`${snapshot.ask.hostSource}="${snapshot.ask.host}"`);
		}
		warnings.push([
			`- ${params.scopeLabel} is broader than the host exec policy.`,
			`  Config: ${configParts.join(", ")}`,
			`  Host: ${hostParts.join(", ")}`,
			`  Effective host exec stays security="${snapshot.security.effective}" ask="${snapshot.ask.effective}" because the stricter side wins.`,
			"  Headless runs like isolated cron cannot answer approval prompts; align both files or enable Web UI, terminal UI, or chat exec approvals.",
			`  Inspect with: ${require_command_format.formatCliCommand("openclaw approvals get --gateway")}`
		].join("\n"));
	};
	maybeWarn({
		scopeLabel: "tools.exec",
		scopeExecConfig: cfg.tools?.exec
	});
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const agent of agents) maybeWarn({
		scopeLabel: `agents.list.${agent.id}.tools.exec`,
		scopeExecConfig: agent.tools?.exec,
		globalExecConfig: cfg.tools?.exec,
		agentId: agent.id
	});
	return warnings;
}
function collectDurableExecApprovalWarnings(cfg) {
	return [];
}
function collectExecFilesystemPolicyWarnings(cfg) {
	return require_exec_filesystem_policy.collectExecFilesystemPolicyDriftHits(cfg).map((hit) => [
		`- ${hit.scopeLabel}: filesystem write tools are disabled, but exec is still available.`,
		`  Runtime tools: ${hit.runtimeTools.join(", ")}; disabled filesystem tools: ${hit.disabledFilesystemTools.join(", ")}.`,
		`  Effective exec host is "${hit.execHost}" with sandbox.mode="${hit.sandboxMode}" and workspaceAccess="${hit.sandboxWorkspaceAccess}".`,
		"  The exec shell can still write wherever that host or sandbox filesystem permits.",
		"  For read-only agents, also deny exec/process; otherwise use sandbox mode \"all\" with workspaceAccess \"ro\" or \"none\"."
	].join("\n"));
}
function collectPlaintextConfigSecretWarnings(cfg) {
	const plaintextPaths = [];
	const defaults = cfg.secrets?.defaults;
	for (const target of require_target_registry.discoverConfigSecretTargets(cfg)) {
		if (!target.entry.includeInAudit) continue;
		if (target.entry.id === "models.providers.*.headers.*" && !isLikelySensitiveModelProviderHeaderName(target.pathSegments.at(-1) ?? "")) continue;
		const { ref } = require_types_secrets.resolveSecretInputRef({
			value: target.value,
			refValue: target.refValue,
			defaults
		});
		if (ref) continue;
		if (!require_secret_value.hasConfiguredPlaintextSecretValue(target.value, target.entry.expectedResolvedValue)) continue;
		plaintextPaths.push(target.path);
	}
	if (plaintextPaths.length === 0) return [];
	const samplePaths = plaintextPaths.slice(0, 5);
	const extraCount = plaintextPaths.length - samplePaths.length;
	return [
		"- WARNING: operator.json contains plaintext secret-bearing config fields.",
		`  Paths: ${extraCount > 0 ? `${samplePaths.join(", ")} (+${extraCount} more)` : samplePaths.join(", ")}`,
		"  Agents or workspace tools that can read config files may see these API keys/tokens.",
		`  Migrate them to SecretRefs with ${require_command_format.formatCliCommand("openclaw secrets configure")} or ${require_command_format.formatCliCommand("openclaw secrets apply")}, then verify with ${require_command_format.formatCliCommand("openclaw secrets audit --check")}.`
	];
}
/** Collects doctor security warnings without emitting terminal notes. */
async function collectSecurityWarnings(cfg, env = process.env) {
	const warnings = [];
	if (cfg.approvals?.exec?.enabled === false) warnings.push("- Note: approvals.exec.enabled=false disables approval forwarding only.", `  Host exec gating still comes from ${require_exec_approvals.resolveExecApprovalsDisplayPath()}.`, `  Check local policy with: ${require_command_format.formatCliCommand("openclaw approvals get --gateway")}`);
	warnings.push(...collectImplicitHeartbeatDirectPolicyWarnings(cfg));
	warnings.push(...collectExecPolicyConflictWarnings(cfg));
	warnings.push(...collectExecFilesystemPolicyWarnings(cfg));
	warnings.push(...collectPlaintextConfigSecretWarnings(cfg));
	warnings.push(...collectDurableExecApprovalWarnings(cfg));
	const tailscaleMode = cfg.gateway?.tailscale?.mode ?? "off";
	const gatewayBind = cfg.gateway?.bind ?? "loopback";
	const customBindHost = cfg.gateway?.customBindHost?.trim();
	const bindMode = [
		"auto",
		"lan",
		"loopback",
		"custom",
		"tailnet"
	].includes(gatewayBind) ? gatewayBind : void 0;
	const resolvedBindHost = bindMode ? await require_net.resolveGatewayBindHost(bindMode, customBindHost) : "0.0.0.0";
	const isExposed = !require_net.isLoopbackHost(resolvedBindHost);
	const resolvedAuth = require_auth_resolve.resolveGatewayAuth({
		authConfig: cfg.gateway?.auth,
		env,
		tailscaleMode
	});
	const authToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolvedAuth.token) ?? "";
	const authPassword = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolvedAuth.password) ?? "";
	const hasToken = authToken.length > 0 || require_types_secrets.hasConfiguredSecretInput(cfg.gateway?.auth?.token, cfg.secrets?.defaults);
	const hasPassword = authPassword.length > 0 || require_types_secrets.hasConfiguredSecretInput(cfg.gateway?.auth?.password, cfg.secrets?.defaults);
	const hasSharedSecret = resolvedAuth.mode === "token" && hasToken || resolvedAuth.mode === "password" && hasPassword;
	const bindDescriptor = `"${gatewayBind}" (${resolvedBindHost})`;
	const saferRemoteAccessLines = [
		"  Safer remote access: keep bind loopback and use Tailscale Serve/Funnel or an SSH tunnel.",
		"  Example tunnel: ssh -N -L 18789:127.0.0.1:18789 user@gateway-host",
		"  Docs: https://docs.operator.ai/gateway/remote"
	];
	if (isExposed) if (!hasSharedSecret) {
		const authFixLines = resolvedAuth.mode === "password" ? [`  Fix: ${require_command_format.formatCliCommand("openclaw configure")} to set a password`, `  Or switch to token: ${require_command_format.formatCliCommand("openclaw config set gateway.auth.mode token")}`] : [`  Fix: ${require_command_format.formatCliCommand("openclaw doctor --fix")} to generate a token`, `  Or set token directly: ${require_command_format.formatCliCommand("openclaw config set gateway.auth.mode token")}`];
		warnings.push(`- CRITICAL: Gateway bound to ${bindDescriptor} without authentication.`, `  Anyone on your network (or internet if port-forwarded) can fully control your agent.`, `  Fix: ${require_command_format.formatCliCommand("openclaw config set gateway.bind loopback")}`, ...saferRemoteAccessLines, ...authFixLines);
	} else warnings.push(`- WARNING: Gateway bound to ${bindDescriptor} (network-accessible).`, `  Ensure your auth credentials are strong and not exposed.`, ...saferRemoteAccessLines);
	const tokenConflict = require_auth_token_source_conflict.resolveGatewayAuthTokenSourceConflict({
		cfg,
		env
	});
	if (tokenConflict) warnings.push(...tokenConflict.warningLines);
	const warnDmPolicy = async (params) => {
		const dmPolicy = params.dmPolicy;
		const policyPath = params.policyPath ?? `${params.allowFromPath}policy`;
		const { hasWildcard, allowCount, isMultiUserDm } = await require_dm_allow_state.resolveDmAllowAuditState({
			provider: params.provider,
			accountId: params.accountId,
			allowFrom: params.allowFrom,
			dmPolicy,
			normalizeEntry: params.normalizeEntry
		});
		const dmScope = cfg.session?.dmScope ?? "main";
		if (dmPolicy === "open") {
			const allowFromPath = `${params.allowFromPath}allowFrom`;
			warnings.push(`- ${params.label} DMs: OPEN (${policyPath}="open"). Anyone can DM it.`);
			if (!hasWildcard) warnings.push(`- ${params.label} DMs: config invalid — "open" requires ${allowFromPath} to include "*".`);
		}
		if (dmPolicy === "disabled") {
			warnings.push(`- ${params.label} DMs: disabled (${policyPath}="disabled").`);
			return;
		}
		if (dmPolicy !== "open" && allowCount === 0) {
			warnings.push(`- ${params.label} DMs: locked (${policyPath}="${dmPolicy}") with no allowlist; unknown senders will be blocked / get a pairing code.`);
			warnings.push(`  ${params.approveHint}`);
		}
		if (dmScope === "main" && isMultiUserDm) warnings.push(`- ${params.label} DMs: multiple senders share the main session; run: ` + require_command_format.formatCliCommand("openclaw config set session.dmScope \"per-channel-peer\"") + " (or \"per-account-channel-peer\" for multi-account channels) to isolate sessions.");
	};
	for (const plugin of require_read_only.listReadOnlyChannelPluginsForConfig(cfg, {
		includePersistedAuthState: true,
		includeSetupFallbackPlugins: true
	})) {
		if (!plugin.security) continue;
		const { defaultAccountId, account, enabled, configured, diagnostics } = await require_channel_account_context.resolveDefaultChannelAccountContext(plugin, cfg, {
			mode: "read_only",
			commandName: "doctor"
		});
		for (const diagnostic of diagnostics) warnings.push(`- [secrets] ${diagnostic}`);
		if (!enabled) continue;
		if (!configured) continue;
		const dmPolicy = plugin.security.resolveDmPolicy?.({
			cfg,
			accountId: defaultAccountId,
			account
		});
		if (dmPolicy) await warnDmPolicy({
			label: plugin.meta.label ?? plugin.id,
			provider: plugin.id,
			accountId: defaultAccountId,
			dmPolicy: dmPolicy.policy,
			allowFrom: dmPolicy.allowFrom,
			policyPath: dmPolicy.policyPath,
			allowFromPath: dmPolicy.allowFromPath,
			approveHint: dmPolicy.approveHint,
			normalizeEntry: dmPolicy.normalizeEntry
		});
		if (plugin.security.collectWarnings) {
			const extra = await plugin.security.collectWarnings({
				cfg,
				accountId: defaultAccountId,
				account
			});
			if (extra?.length) warnings.push(...extra);
		}
	}
	return warnings;
}
/** Emits security warnings plus the deep audit follow-up command. */
async function noteSecurityWarnings(cfg) {
	const warnings = await collectSecurityWarnings(cfg);
	if (warnings.length > 0) {
		warnings.push(`- Run: ${require_command_format.formatCliCommand("openclaw security audit --deep")}`);
		require_note.note(warnings.join("\n"), "Security");
	}
}
//#endregion
exports.collectSecurityWarnings = collectSecurityWarnings;
exports.noteSecurityWarnings = noteSecurityWarnings;
