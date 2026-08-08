const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_account_snapshot_fields = require("./account-snapshot-fields-B_iADxHC.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_official_external_plugin_repair_hints = require("./official-external-plugin-repair-hints-BwPgYT4q.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
const require_redact_identifier = require("./redact-identifier-DrE35Pyt.cjs");
const require_account_inspection = require("./account-inspection-Dw_dnkQD.cjs");
const require_status_state = require("./status-state-DlR_h-bu.cjs");
const require_channels_status_issues = require("./channels-status-issues-hSu-Hv1-.cjs");
require("./format-Y6on_ttU.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/status/read-model.ts
const CREDENTIAL_STATUS_KEYS = [
	"tokenStatus",
	"botTokenStatus",
	"appTokenStatus",
	"signingSecretStatus",
	"userTokenStatus"
];
function readRuntimeAccountsByChannel(payload) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(payload).channelAccounts);
}
/** Reads raw runtime account records for one channel from a gateway payload. */
function getRuntimeChannelAccounts(params) {
	const raw = readRuntimeAccountsByChannel(params.payload)[params.channelId];
	return Array.isArray(raw) ? raw.map(_gabrielvfonseca_normalization_core_record_coerce.asRecord) : [];
}
/** Resolves a stable account id from runtime status record fallbacks. */
function resolveRuntimeChannelAccountId(account) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(account.accountId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(account.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(account.name) ?? "default";
}
/** Finds a runtime account, including singleton default-account fallback. */
function findRuntimeChannelAccount(params) {
	return params.liveAccounts.find((account) => resolveRuntimeChannelAccountId(account) === params.accountId) ?? (params.accountId === "default" && params.liveAccounts.length === 1 ? params.liveAccounts[0] ?? null : null);
}
/** Reports whether a runtime account has usable live credentials. */
function hasRuntimeCredentialAvailable(params) {
	const account = findRuntimeChannelAccount(params);
	if (!account) return false;
	if (require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(account)) return false;
	return account.running === true || account.connected === true;
}
/** Converts configured-but-unavailable credential markers to available. */
function markConfiguredUnavailableCredentialStatusesAvailable(account) {
	const record = { ...(0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(account) };
	for (const key of CREDENTIAL_STATUS_KEYS) if (record[key] === "configured_unavailable") record[key] = "available";
	return record;
}
//#endregion
//#region src/commands/status-all/channels-token-summary.ts
/** Collapses credential sources into a stable count label such as `env×2+file`. */
function summarizeSources(sources) {
	const counts = /* @__PURE__ */ new Map();
	for (const s of sources) {
		const key = s?.trim() ? s.trim() : "unknown";
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const parts = [...counts.entries()].toSorted((a, b) => b[1] - a[1]).map(([key, n]) => `${key}${n > 1 ? `×${n}` : ""}`);
	return {
		label: parts.length > 0 ? parts.join("+") : "unknown",
		parts
	};
}
function formatTokenHint(token, opts) {
	const t = token.trim();
	if (!t) return "empty";
	if (!opts.showSecrets) return `sha256:${require_redact_identifier.sha256HexPrefix(t, 8)} · len ${t.length}`;
	const head = t.slice(0, 4);
	const tail = t.slice(-4);
	if (t.length <= 10) return `${t} · len ${t.length}`;
	return `${head}…${tail} · len ${t.length}`;
}
/** Returns the credential status sentence for enabled channel accounts, if the plugin exposes token fields. */
function summarizeTokenConfig(params) {
	const enabled = params.accounts.filter((a) => a.enabled);
	if (enabled.length === 0) return {
		state: null,
		detail: null
	};
	const accountRecs = enabled.map((a) => (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account));
	const hasBotTokenField = accountRecs.some((r) => "botToken" in r);
	const hasAppTokenField = accountRecs.some((r) => "appToken" in r);
	const hasSigningSecretField = accountRecs.some((r) => "signingSecret" in r || "signingSecretSource" in r || "signingSecretStatus" in r);
	const hasTokenField = accountRecs.some((r) => "token" in r);
	if (!hasBotTokenField && !hasAppTokenField && !hasSigningSecretField && !hasTokenField) return {
		state: null,
		detail: null
	};
	const accountIsHttpMode = (rec) => typeof rec.mode === "string" && rec.mode.trim() === "http";
	const hasCredentialAvailable = (rec, valueKey, statusKey) => {
		const value = rec[valueKey];
		if (typeof value === "string" && value.trim()) return true;
		return rec[statusKey] === "available";
	};
	if (hasBotTokenField && hasSigningSecretField && enabled.every((a) => accountIsHttpMode((0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account)))) {
		const unavailable = enabled.filter((a) => require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(a.account));
		const ready = enabled.filter((a) => {
			const rec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account);
			return hasCredentialAvailable(rec, "botToken", "botTokenStatus") && hasCredentialAvailable(rec, "signingSecret", "signingSecretStatus");
		});
		const partial = enabled.filter((a) => {
			const rec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account);
			const hasBot = hasCredentialAvailable(rec, "botToken", "botTokenStatus");
			const hasSigning = hasCredentialAvailable(rec, "signingSecret", "signingSecretStatus");
			return hasBot && !hasSigning || !hasBot && hasSigning;
		});
		if (unavailable.length > 0) return {
			state: "warn",
			detail: `configured http credentials unavailable in this command path · accounts ${unavailable.length}`
		};
		if (partial.length > 0) return {
			state: "warn",
			detail: `partial credentials (need bot+signing) · accounts ${partial.length}`
		};
		if (ready.length === 0) return {
			state: "setup",
			detail: "no credentials (need bot+signing)"
		};
		const botSources = summarizeSources(ready.map((a) => a.snapshot.botTokenSource ?? "none"));
		const signingSources = summarizeSources(ready.map((a) => a.snapshot.signingSecretSource ?? "none"));
		const sample = ready[0]?.account ? (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(ready[0].account) : {};
		const botToken = typeof sample.botToken === "string" ? sample.botToken : "";
		const signingSecret = typeof sample.signingSecret === "string" ? sample.signingSecret : "";
		const botHint = botToken.trim() ? formatTokenHint(botToken, { showSecrets: params.showSecrets }) : "";
		const signingHint = signingSecret.trim() ? formatTokenHint(signingSecret, { showSecrets: params.showSecrets }) : "";
		const hint = botHint || signingHint ? ` (bot ${botHint || "?"}, signing ${signingHint || "?"})` : "";
		return {
			state: "ok",
			detail: `credentials ok (bot ${botSources.label}, signing ${signingSources.label})${hint} · accounts ${ready.length}/${enabled.length || 1}`
		};
	}
	if (hasBotTokenField && hasAppTokenField) {
		const unavailable = enabled.filter((a) => require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(a.account));
		const ready = enabled.filter((a) => {
			const rec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account);
			const bot = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.botToken) ?? "";
			const app = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.appToken) ?? "";
			return Boolean(bot) && Boolean(app);
		});
		const partial = enabled.filter((a) => {
			const rec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account);
			const bot = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.botToken) ?? "";
			const app = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.appToken) ?? "";
			const hasBot = Boolean(bot);
			const hasApp = Boolean(app);
			return hasBot && !hasApp || !hasBot && hasApp;
		});
		if (partial.length > 0) return {
			state: "warn",
			detail: `partial tokens (need bot+app) · accounts ${partial.length}`
		};
		if (unavailable.length > 0) return {
			state: "warn",
			detail: `configured tokens unavailable in this command path · accounts ${unavailable.length}`
		};
		if (ready.length === 0) return {
			state: "setup",
			detail: "no tokens (need bot+app)"
		};
		const botSources = summarizeSources(ready.map((a) => a.snapshot.botTokenSource ?? "none"));
		const appSources = summarizeSources(ready.map((a) => a.snapshot.appTokenSource ?? "none"));
		const sample = ready[0]?.account ? (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(ready[0].account) : {};
		const botToken = typeof sample.botToken === "string" ? sample.botToken : "";
		const appToken = typeof sample.appToken === "string" ? sample.appToken : "";
		const botHint = botToken.trim() ? formatTokenHint(botToken, { showSecrets: params.showSecrets }) : "";
		const appHint = appToken.trim() ? formatTokenHint(appToken, { showSecrets: params.showSecrets }) : "";
		const hint = botHint || appHint ? ` (bot ${botHint || "?"}, app ${appHint || "?"})` : "";
		return {
			state: "ok",
			detail: `tokens ok (bot ${botSources.label}, app ${appSources.label})${hint} · accounts ${ready.length}/${enabled.length || 1}`
		};
	}
	if (hasBotTokenField) {
		const unavailable = enabled.filter((a) => require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(a.account));
		const ready = enabled.filter((a) => {
			const bot = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account).botToken) ?? "";
			return Boolean(bot);
		});
		if (unavailable.length > 0) return {
			state: "warn",
			detail: `configured bot token unavailable in this command path · accounts ${unavailable.length}`
		};
		if (ready.length === 0) return {
			state: "setup",
			detail: "no bot token"
		};
		const sample = ready[0]?.account ? (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(ready[0].account) : {};
		const botToken = typeof sample.botToken === "string" ? sample.botToken : "";
		const botHint = botToken.trim() ? formatTokenHint(botToken, { showSecrets: params.showSecrets }) : "";
		return {
			state: "ok",
			detail: `bot token config${botHint ? ` (${botHint})` : ""} · accounts ${ready.length}/${enabled.length || 1}`
		};
	}
	const unavailable = enabled.filter((a) => require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(a.account));
	const ready = enabled.filter((a) => {
		const rec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(a.account);
		return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.token));
	});
	if (unavailable.length > 0) return {
		state: "warn",
		detail: `configured token unavailable in this command path · accounts ${unavailable.length}`
	};
	if (ready.length === 0) return {
		state: "setup",
		detail: "no token"
	};
	const sources = summarizeSources(ready.map((a) => a.snapshot.tokenSource));
	const sample = ready[0]?.account ? (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(ready[0].account) : {};
	const token = typeof sample.token === "string" ? sample.token : "";
	const hint = token.trim() ? ` (${formatTokenHint(token, { showSecrets: params.showSecrets })})` : "";
	return {
		state: "ok",
		detail: `token ${sources.label}${hint} · accounts ${ready.length}/${enabled.length || 1}`
	};
}
//#endregion
//#region src/commands/status-all/channels.ts
function existsSyncMaybe(p) {
	const path = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p) ?? "";
	if (!path) return null;
	try {
		return node_fs.default.existsSync(path);
	} catch {
		return null;
	}
}
/** Resolves one configured/default account into the normalized row shape used by status rendering. */
async function resolveChannelAccountRow(params) {
	const { plugin, cfg, sourceConfig, accountId } = params;
	const { account, enabled, configured } = await require_account_inspection.resolveInspectedChannelAccount({
		plugin,
		cfg,
		sourceConfig,
		accountId
	});
	return {
		accountId,
		account,
		enabled,
		configured,
		snapshot: require_account_inspection.buildChannelAccountSnapshot({
			plugin,
			cfg,
			accountId,
			account,
			enabled,
			configured
		})
	};
}
const formatAccountLabel = (params) => {
	const base = params.accountId || "default";
	if (params.name?.trim()) return `${base} (${params.name.trim()})`;
	return base;
};
const buildAccountNotes = (params) => {
	const { plugin, cfg, entry } = params;
	const notes = [];
	const snapshot = entry.snapshot;
	if (snapshot.enabled === false) notes.push("disabled");
	if (snapshot.dmPolicy) notes.push(`dm:${snapshot.dmPolicy}`);
	if (snapshot.tokenSource && snapshot.tokenSource !== "none") notes.push(`token:${snapshot.tokenSource}`);
	if (snapshot.botTokenSource && snapshot.botTokenSource !== "none") notes.push(`bot:${snapshot.botTokenSource}`);
	if (snapshot.appTokenSource && snapshot.appTokenSource !== "none") notes.push(`app:${snapshot.appTokenSource}`);
	if (snapshot.signingSecretSource && snapshot.signingSecretSource !== "none") notes.push(`signing:${snapshot.signingSecretSource}`);
	if (params.liveCredentialAvailable) notes.push("credential available in gateway runtime");
	else if (params.credentialResolutionSkipped && require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(entry.account)) notes.push("credential not checked");
	else if (require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(entry.account)) notes.push("secret unavailable in this command path");
	if (snapshot.baseUrl) notes.push(snapshot.baseUrl);
	if (snapshot.port != null) notes.push(`port:${snapshot.port}`);
	if (snapshot.cliPath) notes.push(`cli:${snapshot.cliPath}`);
	if (snapshot.dbPath) notes.push(`db:${snapshot.dbPath}`);
	const allowFrom = plugin.config.resolveAllowFrom?.({
		cfg,
		accountId: snapshot.accountId
	}) ?? snapshot.allowFrom;
	if (allowFrom?.length) {
		const formatted = require_account_inspection.formatChannelAllowFrom({
			plugin,
			cfg,
			accountId: snapshot.accountId,
			allowFrom
		}).slice(0, 3);
		if (formatted.length > 0) notes.push(`allow:${formatted.join(",")}`);
	}
	return notes;
};
function resolveLinkFields(summary) {
	const rec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(summary);
	const statusState = typeof rec.statusState === "string" ? rec.statusState : null;
	const linked = typeof rec.linked === "boolean" ? rec.linked : null;
	const authAgeMs = typeof rec.authAgeMs === "number" ? rec.authAgeMs : null;
	const self = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(rec.self);
	return {
		statusState,
		linked,
		authAgeMs,
		selfE164: typeof self.e164 === "string" && self.e164.trim() ? self.e164.trim() : null
	};
}
function collectMissingPaths(accounts) {
	const missing = [];
	for (const entry of accounts) {
		const accountRec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(entry.account);
		const snapshotRec = (0, _gabrielvfonseca_normalization_core_record_coerce.asRecord)(entry.snapshot);
		for (const key of [
			"tokenFile",
			"botTokenFile",
			"appTokenFile",
			"cliPath",
			"dbPath",
			"authDir"
		]) {
			const raw = accountRec[key] ?? snapshotRec[key];
			if (existsSyncMaybe(raw) === false) missing.push(String(raw));
		}
	}
	return missing;
}
function isLikelyDependencyTreeCorruption(message) {
	return /(?:cannot find (?:module|package)|module_not_found|err_module_not_found|enoent|enotempty|missing package|failed to resolve)/iu.test(message);
}
function formatLoadFailureDetail(message) {
	return `plugin load failed: ${isLikelyDependencyTreeCorruption(message) ? "dependency tree corrupted" : "registration failed"}; run openclaw doctor --fix`;
}
/** Builds the `status --all` channel summary and per-account detail tables. */
async function buildChannelsTable(cfg, opts) {
	const showSecrets = opts?.showSecrets === true;
	const rows = [];
	const details = [];
	const sourceConfig = opts?.sourceConfig ?? cfg;
	const includeSetupFallbackPlugins = opts?.includeSetupFallbackPlugins ?? true;
	const credentialResolutionSkipped = opts?.credentialResolutionSkipped === true;
	const readOnlyPlugins = require_read_only.resolveReadOnlyChannelPluginsForConfig(cfg, {
		activationSourceConfig: sourceConfig,
		includeSetupFallbackPlugins
	});
	for (const plugin of readOnlyPlugins.plugins) {
		const accountIds = plugin.config.listAccountIds(cfg);
		const defaultAccountId = require_helpers.resolveChannelDefaultAccountId({
			plugin,
			cfg,
			accountIds
		});
		const resolvedAccountIds = accountIds.length > 0 ? accountIds : [defaultAccountId];
		const accounts = [];
		for (const accountId of resolvedAccountIds) accounts.push(await resolveChannelAccountRow({
			plugin,
			cfg,
			sourceConfig,
			accountId
		}));
		const liveAccounts = getRuntimeChannelAccounts({
			payload: opts?.liveChannelStatus,
			channelId: plugin.id
		});
		const anyEnabled = accounts.some((a) => a.enabled);
		const enabledAccounts = accounts.filter((a) => a.enabled);
		const configuredAccounts = enabledAccounts.filter((a) => a.configured);
		const unavailableConfiguredAccounts = enabledAccounts.filter((a) => require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(a.account) && !credentialResolutionSkipped && !hasRuntimeCredentialAvailable({
			liveAccounts,
			accountId: a.accountId
		}));
		const accountsForTokenSummary = accounts.map((entry) => require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(entry.account) && (credentialResolutionSkipped || hasRuntimeCredentialAvailable({
			liveAccounts,
			accountId: entry.accountId
		})) ? {
			...entry,
			account: markConfiguredUnavailableCredentialStatusesAvailable(entry.account)
		} : entry);
		const defaultEntry = accounts.find((a) => a.accountId === defaultAccountId) ?? accounts[0];
		const link = resolveLinkFields(plugin.status?.buildChannelSummary ? await plugin.status.buildChannelSummary({
			account: defaultEntry?.account ?? {},
			cfg,
			defaultAccountId,
			snapshot: defaultEntry?.snapshot ?? { accountId: defaultAccountId }
		}) : void 0);
		const missingPaths = collectMissingPaths(enabledAccounts);
		const tokenSummary = summarizeTokenConfig({
			accounts: accountsForTokenSummary,
			showSecrets
		});
		const issues = plugin.status?.collectStatusIssues ? plugin.status.collectStatusIssues(accounts.map((a) => a.snapshot)) : [];
		const label = plugin.meta.label ?? plugin.id;
		const state = (() => {
			if (!anyEnabled) return "off";
			if (missingPaths.length > 0) return "warn";
			if (issues.length > 0) return "warn";
			if (unavailableConfiguredAccounts.length > 0) return "warn";
			if (link.statusState === "unstable") return "warn";
			if (link.linked === false) return "setup";
			if (tokenSummary.state) return tokenSummary.state;
			if (link.linked === true) return "ok";
			if (configuredAccounts.length > 0) return "ok";
			return "setup";
		})();
		const detail = (() => {
			if (!anyEnabled) {
				if (!defaultEntry) return "disabled";
				return plugin.config.disabledReason?.(defaultEntry.account, cfg) ?? "disabled";
			}
			if (missingPaths.length > 0) return `missing file (${missingPaths[0]})`;
			if (issues.length > 0) return issues[0]?.message ?? "misconfigured";
			if (link.statusState) {
				if (link.statusState === "linked") {
					const extra = [];
					if (link.selfE164) extra.push(link.selfE164);
					if (link.authAgeMs != null && link.authAgeMs >= 0) extra.push(`auth ${require_format_relative.formatTimeAgo(link.authAgeMs)}`);
					if (accounts.length > 1 || plugin.meta.forceAccountBinding) extra.push(`accounts ${accounts.length || 1}`);
					return extra.length > 0 ? `${require_status_state.formatChannelStatusState(link.statusState)} · ${extra.join(" · ")}` : require_status_state.formatChannelStatusState(link.statusState);
				}
				return require_status_state.formatChannelStatusState(link.statusState);
			}
			if (link.linked !== null) {
				const base = link.linked ? "linked" : "not linked";
				const extra = [];
				if (link.linked && link.selfE164) extra.push(link.selfE164);
				if (link.linked && link.authAgeMs != null && link.authAgeMs >= 0) extra.push(`auth ${require_format_relative.formatTimeAgo(link.authAgeMs)}`);
				if (accounts.length > 1 || plugin.meta.forceAccountBinding) extra.push(`accounts ${accounts.length || 1}`);
				return extra.length > 0 ? `${base} · ${extra.join(" · ")}` : base;
			}
			if (unavailableConfiguredAccounts.length > 0) {
				if (tokenSummary.detail?.includes("unavailable")) return tokenSummary.detail;
				return `configured credentials unavailable in this command path · accounts ${unavailableConfiguredAccounts.length}`;
			}
			if (tokenSummary.detail) return tokenSummary.detail;
			if (configuredAccounts.length > 0) {
				const head = "configured";
				if (accounts.length <= 1 && !plugin.meta.forceAccountBinding) return head;
				return `${head} · accounts ${configuredAccounts.length}/${enabledAccounts.length || 1}`;
			}
			return (defaultEntry && plugin.config.unconfiguredReason ? plugin.config.unconfiguredReason(defaultEntry.account, cfg) : null) ?? "not configured";
		})();
		rows.push({
			id: plugin.id,
			label,
			enabled: anyEnabled,
			state,
			detail
		});
		if (configuredAccounts.length > 0) details.push({
			title: `${label} accounts`,
			columns: [
				"Account",
				"Status",
				"Notes"
			],
			rows: configuredAccounts.map((entry) => {
				const liveCredentialAvailable = hasRuntimeCredentialAvailable({
					liveAccounts,
					accountId: entry.accountId
				});
				const credentialUnknown = credentialResolutionSkipped && require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(entry.account);
				const notes = buildAccountNotes({
					plugin,
					cfg,
					entry,
					liveCredentialAvailable,
					credentialResolutionSkipped
				});
				return {
					Account: formatAccountLabel({
						accountId: entry.accountId,
						name: entry.snapshot.name
					}),
					Status: entry.enabled && (!require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(entry.account) || liveCredentialAvailable) ? "OK" : credentialUnknown ? "UNKNOWN" : "WARN",
					Notes: notes.join(" · ")
				};
			})
		});
	}
	const visibleChannelIds = new Set(rows.map((row) => row.id));
	const loadFailuresByChannel = new Map(readOnlyPlugins.loadFailures.map((failure) => [failure.channelId, failure]));
	for (const channelId of readOnlyPlugins.missingConfiguredChannelIds.toSorted((left, right) => left.localeCompare(right))) {
		if (visibleChannelIds.has(channelId)) continue;
		const failure = loadFailuresByChannel.get(channelId);
		if (!failure) continue;
		rows.push({
			id: channelId,
			label: channelId,
			enabled: true,
			state: "warn",
			detail: formatLoadFailureDetail(failure.message)
		});
		visibleChannelIds.add(channelId);
	}
	const missingCandidateChannelIds = [.../* @__PURE__ */ new Set([
		...readOnlyPlugins.missingConfiguredChannelIds,
		...require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig(sourceConfig),
		...require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig(cfg)
	])].toSorted((left, right) => left.localeCompare(right));
	const explicitConfiguredChannelIds = /* @__PURE__ */ new Set([...require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig(sourceConfig), ...require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig(cfg)]);
	for (const channelId of missingCandidateChannelIds) {
		if (visibleChannelIds.has(channelId)) continue;
		const hint = require_official_external_plugin_repair_hints.resolveMissingOfficialExternalChannelPluginRepairHint({
			config: cfg,
			activationSourceConfig: sourceConfig,
			channelId
		});
		if (!hint || hint.channelId !== channelId) {
			if (!includeSetupFallbackPlugins && explicitConfiguredChannelIds.has(channelId)) {
				rows.push({
					id: channelId,
					label: require_ansi.sanitizeForLog(channelId).trim() || "configured-channel",
					enabled: true,
					state: "setup",
					detail: "configured; status unavailable in fast mode"
				});
				visibleChannelIds.add(channelId);
			}
			continue;
		}
		rows.push({
			id: channelId,
			label: hint.label,
			enabled: true,
			state: "warn",
			detail: `plugin not installed - run ${hint.installCommand} or ${hint.doctorFixCommand}`
		});
		visibleChannelIds.add(channelId);
	}
	if (!includeSetupFallbackPlugins) for (const channelId of readOnlyPlugins.missingConfiguredChannelIds.toSorted((left, right) => left.localeCompare(right))) {
		if (visibleChannelIds.has(channelId)) continue;
		rows.push({
			id: channelId,
			label: require_ansi.sanitizeForLog(channelId).trim() || "configured-channel",
			enabled: true,
			state: "setup",
			detail: "configured; status unavailable in fast mode"
		});
		visibleChannelIds.add(channelId);
	}
	return {
		rows,
		details
	};
}
//#endregion
//#region src/commands/status.scan.runtime.ts
const statusScanRuntime = {
	collectChannelStatusIssues: require_channels_status_issues.collectChannelStatusIssues,
	buildChannelsTable
};
//#endregion
exports.statusScanRuntime = statusScanRuntime;
