require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./safe-text-BAHCZAPT.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
require("./parse-finite-number-BTqU_Omp.cjs");
require("./plugins-_-82JYfc.cjs");
const require_dm_policy_shared = require("./dm-policy-shared-Cznamk_3.cjs");
const require_channel_config_helpers = require("./channel-config-helpers-B5LadJVY.cjs");
require("./helpers-Dw37GavQ.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
require("./globals-D7PiAd5y.cjs");
require("./errors-BqS4bzom.cjs");
require("./http-body-BwUnoq2M.cjs");
require("./media-services-CA_NM3C2.cjs");
require("./net-CakPoh2E.cjs");
require("./registry-raOBfWNF.cjs");
require("./qr-terminal-D8aVGvhO.cjs");
require("./command-turn-context-DgIVffox.cjs");
require("./completion-delivery-policy-Djb6F8Lx.cjs");
const require_dispatch = require("./dispatch-DMC5F8fZ.cjs");
require("./chunk-qjERm7HU.cjs");
const require_text_chunking = require("./text-chunking-T7WdRIQ1.cjs");
require("./reply-payload-DomDFObW.cjs");
require("./directive-tags-8jEdunuA.cjs");
require("./sanitize-user-facing-text-B2i4WcAm.cjs");
require("./selection-BpqUSi0C.cjs");
require("./pairing-store-qtDtw17r.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_tables = require("./tables-c2KKeZEl.cjs");
const require_dangerous_name_matching = require("./dangerous-name-matching-CRIv1nH4.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
require("./account-snapshot-fields-B_iADxHC.cjs");
require("./file-lock-BhHrzsWW.cjs");
require("./store-BW6t6tIi.cjs");
require("./fetch-Be5VK67y.cjs");
const require_load_options = require("./load-options-28l5_jW7.cjs");
require("./local-roots-w2A4ItE4.cjs");
const require_web_media = require("./web-media-CQULBkBb.cjs");
require("./outbound-attachment-ry_WMADm.cjs");
require("./qr-image-Ba8a2wH9.cjs");
require("./runner.entries-C2SCXSy-.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store$1 = require("./store-DCwJguwr.cjs");
require("./http-route-overlap-JQrpGIgZ.cjs");
require("./defaults.constants-BV5EBB5p.cjs");
require("./echo-transcript-DSMSepK_.cjs");
require("./defaults-B9T6G8PZ.cjs");
require("./kernel-BQTSZWlX.cjs");
require("./mentions-xs5giNxG.cjs");
require("./sessions-BOjfaI9B.cjs");
require("./runtime-B6pBPYCa.cjs");
const require_envelope = require("./envelope-BwASvxGn.cjs");
require("./ssrf-runtime-xKtaXpSS.cjs");
require("./http-registry-CuAISLrz.cjs");
require("./auth-rate-limit-BjLy1S3-.cjs");
require("@gabrielvfonseca/normalization-core/string-normalization");
require("@gabrielvfonseca/normalization-core");
require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
require("node:crypto");
require("@gabrielvfonseca/media-core/mime");
require("@gabrielvfonseca/media-core/base64");
require("@gabrielvfonseca/media-core/content-length");
require("@gabrielvfonseca/media-core/constants");
require("@gabrielvfonseca/media-core/inbound-path-policy");
require("node:zlib");
//#region src/channels/plugins/chat-target-prefixes.ts
/**
* Chat target prefix parsers.
*
* Parses service-qualified chat ids, guids, identifiers, and sender allowlist targets.
*/
//#endregion
//#region src/shared/string-sample.ts
/**
* Shared string sampling for operator logs and SDK helpers that need bounded readable lists.
* This intentionally formats for humans, not for machine parsing.
*/
/** Formats a bounded comma-separated sample of string entries with a hidden-count suffix. */
function summarizeStringEntries(params) {
	const entries = params.entries ?? [];
	if (entries.length === 0) return params.emptyText ?? "";
	const rawLimit = params.limit ?? 6;
	const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.floor(rawLimit)) : 6;
	const sample = entries.slice(0, limit);
	const suffix = entries.length > sample.length ? ` (+${entries.length - sample.length})` : "";
	return `${sample.join(", ")}${suffix}`;
}
//#endregion
//#region src/channels/allowlists/resolve-utils.ts
/**
* Channel allowlist resolution helpers.
*
* Dedupes allowFrom entries and canonicalizes user lookups into stable id additions.
*/
function dedupeAllowlistEntries(entries) {
	const seen = /* @__PURE__ */ new Set();
	const deduped = [];
	for (const entry of entries) {
		const normalized = entry.trim();
		if (!normalized) continue;
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(normalized);
	}
	return deduped;
}
function mergeAllowlist(params) {
	return dedupeAllowlistEntries([...require_channel_config_helpers.mapAllowFromEntries(params.existing), ...params.additions]);
}
/** Logs a compact resolved/unresolved allowlist lookup summary when there is anything to report. */
function summarizeMapping(label, mapping, unresolved, runtime) {
	if (mapping.length > 0) runtime.log?.(`${label} resolved: ${summarizeStringEntries({
		entries: mapping,
		limit: 6
	})}`);
	if (unresolved.length > 0) runtime.log?.(`${label} unresolved: ${summarizeStringEntries({
		entries: unresolved,
		limit: 6
	})}`);
}
//#endregion
//#region src/plugin-sdk/allow-from.ts
/** Lowercase and optionally strip prefixes from allowlist entries before sender comparisons. */
function formatAllowFromLowercase(params) {
	return require_string_normalization.normalizeStringEntries(params.allowFrom).map((entry) => params.stripPrefixRe ? entry.replace(params.stripPrefixRe, "") : entry).map((entry) => require_string_coerce.normalizeOptionalLowercaseString(entry)).filter((entry) => Boolean(entry));
}
/** Map allowlist inputs sequentially so resolver side effects stay ordered and predictable. */
async function mapAllowlistResolutionInputs(params) {
	const results = [];
	for (const input of params.inputs) results.push(await params.mapInput(input));
	return results;
}
//#endregion
//#region src/plugin-sdk/channel-lifecycle.core.ts
/**
* Keep a channel/provider task pending until the HTTP server closes.
*
* When an abort signal is provided, `onAbort` is invoked once and should
* trigger server shutdown. The returned promise resolves only after `close`.
*/
async function keepHttpServerTaskAlive(params) {
	const { server, abortSignal, onAbort } = params;
	let abortTask = Promise.resolve();
	let abortTriggered = false;
	const triggerAbort = () => {
		if (abortTriggered) return;
		abortTriggered = true;
		abortTask = Promise.resolve(onAbort?.()).then(() => void 0);
	};
	const onAbortSignal = () => {
		triggerAbort();
	};
	if (abortSignal) if (abortSignal.aborted) triggerAbort();
	else abortSignal.addEventListener("abort", onAbortSignal, { once: true });
	await new Promise((resolve) => {
		server.once("close", () => resolve());
	});
	if (abortSignal) abortSignal.removeEventListener("abort", onAbortSignal);
	await abortTask;
}
//#endregion
//#region src/channels/plugins/media-payload.ts
/**
* Builds single-item and list media fields for channel outbound helpers.
*/
function buildMediaPayload(mediaList, opts) {
	const first = mediaList[0];
	const mediaPaths = mediaList.map((media) => media.path);
	const rawMediaTypes = mediaList.map((media) => media.contentType ?? "");
	const mediaTypes = opts?.preserveMediaTypeCardinality ? rawMediaTypes : rawMediaTypes.filter((value) => Boolean(value));
	return {
		MediaPath: first?.path,
		MediaType: first?.contentType,
		MediaUrl: first?.path,
		MediaPaths: mediaPaths.length > 0 ? mediaPaths : void 0,
		MediaUrls: mediaPaths.length > 0 ? mediaPaths : void 0,
		MediaTypes: mediaTypes.length > 0 ? mediaTypes : void 0
	};
}
//#endregion
//#region src/channels/logging.ts
/** Emits a normalized inbound-drop diagnostic for channel plugins. */
function logInboundDrop(params) {
	const target = params.target ? ` target=${params.target}` : "";
	params.log(`${params.channel}: drop ${params.reason}${target}`);
}
/** Emits a normalized typing-indicator failure diagnostic for channel plugins. */
function logTypingFailure(params) {
	const target = params.target ? ` target=${params.target}` : "";
	const action = params.action ? ` action=${params.action}` : "";
	params.log(`${params.channel} typing${action} failed${target}: ${String(params.error)}`);
}
//#endregion
//#region src/pairing/pairing-challenge.ts
async function runPairingRequestedHook(params) {
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("channel_pairing_requested")) return;
	await hookRunner.runChannelPairingRequested({
		channel: params.channel,
		accountId: params.accountId,
		senderId: params.senderId,
		code: params.code,
		metadata: params.meta
	}, {
		channelId: params.channel,
		accountId: params.accountId,
		senderId: params.senderId
	});
}
/**
* Shared pairing challenge issuance for DM pairing policy pathways.
* Ensures every channel follows the same create-if-missing + reply flow.
*/
async function issuePairingChallenge(params) {
	const { code, created } = await params.upsertPairingRequest({
		id: params.senderId,
		meta: params.meta
	});
	if (!created) return { created: false };
	params.onCreated?.({ code });
	const accountId = params.accountId ? require_account_id.normalizeAccountId(params.accountId) : void 0;
	runPairingRequestedHook({
		channel: params.channel,
		accountId,
		senderId: params.senderId,
		code,
		meta: params.meta
	}).catch(() => void 0);
	const replyText = params.buildReplyText?.({
		code,
		senderIdLine: params.senderIdLine
	}) ?? require_tables.buildPairingReply({
		channel: params.channel,
		idLine: params.senderIdLine,
		code
	});
	try {
		await params.sendPairingReply(replyText);
	} catch (err) {
		params.onReplyError?.(err);
	}
	return {
		created: true,
		code
	};
}
//#endregion
//#region src/plugin-sdk/pairing-access.ts
/** Scope pairing store operations to one channel/account pair for plugin-facing helpers. */
function createScopedPairingAccess(params) {
	const resolvedAccountId = require_account_id.normalizeAccountId(params.accountId);
	return {
		/** Normalized account id used by every channel-scoped pairing store operation. */
		accountId: resolvedAccountId,
		/** Read allow-list entries for the scoped channel/account pair. */
		readAllowFromStore: () => params.core.channel.pairing.readAllowFromStore({
			channel: params.channel,
			accountId: resolvedAccountId
		}),
		/** Delete one approval after the owning channel durably consumes it. */
		removeAllowFromStoreEntry: (entry) => params.core.channel.pairing.removeAllowFromStoreEntry({
			channel: params.channel,
			accountId: resolvedAccountId,
			entry
		}),
		/** Read another channel/account allow-list for DM policy cross-checks. */
		readStoreForDmPolicy: (provider, accountId) => params.core.channel.pairing.readAllowFromStore({
			channel: provider,
			accountId: require_account_id.normalizeAccountId(accountId)
		}),
		/** Upsert a pairing request with the scoped channel/account injected. */
		upsertPairingRequest: (input) => params.core.channel.pairing.upsertPairingRequest({
			channel: params.channel,
			accountId: resolvedAccountId,
			...input
		})
	};
}
//#endregion
//#region src/plugin-sdk/channel-pairing.ts
/** Pre-bind the channel id and storage sink for pairing challenges. */
function createChannelPairingChallengeIssuer(params) {
	return (challenge) => issuePairingChallenge({
		channel: params.channel,
		accountId: params.accountId,
		upsertPairingRequest: params.upsertPairingRequest,
		...challenge
	});
}
/** Build the full scoped pairing controller used by channel runtime code. */
function createChannelPairingController(params) {
	const access = createScopedPairingAccess(params);
	return {
		...access,
		issueChallenge: createChannelPairingChallengeIssuer({
			channel: params.channel,
			accountId: access.accountId,
			upsertPairingRequest: access.upsertPairingRequest
		})
	};
}
//#endregion
//#region src/channels/plugins/group-policy-warnings.ts
/**
* Channel group-policy warning collectors.
*
* Composes warning helpers for default, allowlist, and open-provider group policy states.
*/
function projectWarningCollector(project, collector) {
	return (params) => collector(project(params));
}
function projectConfigWarningCollector(collector) {
	return projectWarningCollector((params) => ({ cfg: params.cfg }), collector);
}
function collectAllowlistProviderGroupPolicyWarnings(params) {
	const defaultGroupPolicy = require_dm_policy_shared.resolveDefaultGroupPolicy(params.cfg);
	const { groupPolicy } = require_dm_policy_shared.resolveAllowlistProviderRuntimeGroupPolicy({
		providerConfigPresent: params.providerConfigPresent,
		groupPolicy: params.configuredGroupPolicy ?? void 0,
		defaultGroupPolicy
	});
	return params.collect(groupPolicy);
}
/** Build a config-aware allowlist-provider warning collector from an arbitrary policy resolver. */
function createAllowlistProviderGroupPolicyWarningCollector(params) {
	return (runtime) => collectAllowlistProviderGroupPolicyWarnings({
		cfg: runtime.cfg,
		providerConfigPresent: params.providerConfigPresent(runtime.cfg),
		configuredGroupPolicy: params.resolveGroupPolicy(runtime),
		collect: (groupPolicy) => params.collect({
			...runtime,
			groupPolicy
		})
	});
}
//#endregion
//#region src/config/group-scope-tree.ts
const encodeScopeSegment = (value) => `${value.length}:${value}`;
function scopeKey(...segments) {
	return segments.map(([prefix, value]) => `${prefix}:${encodeScopeSegment(value)}`).join("/");
}
function resolveFromScopes(params) {
	for (let index = params.path.length - 1; index >= 0; index -= 1) {
		const key = params.path[index];
		if (key === void 0 || !Object.hasOwn(params.tree.scopes, key)) continue;
		const node = params.tree.scopes[key];
		if (!node) continue;
		const value = params.resolveNode(node);
		if (value !== void 0) return value;
	}
	return params.tree.defaults ? params.resolveNode(params.tree.defaults) : void 0;
}
function resolveScopeToolsPolicy(params) {
	return resolveFromScopes({
		tree: params.tree,
		path: params.path,
		resolveNode: (node) => require_agent_tools_policy.resolveToolsBySender({
			toolsBySender: node.toolsBySender,
			senderId: params.senderId,
			senderName: params.senderName,
			senderUsername: params.senderUsername,
			senderE164: params.senderE164,
			messageProvider: params.messageProvider
		}) ?? node.tools
	});
}
//#endregion
//#region src/plugin-sdk/channel-policy.ts
function collectMutableAllowlistWarningLines(hits, channel) {
	if (hits.length === 0) return [];
	const exampleLines = hits.slice(0, 8).map((hit) => `- ${require_ansi.sanitizeForLog(hit.path)}: ${require_ansi.sanitizeForLog(hit.entry)}`);
	const remaining = hits.length > 8 ? `- +${hits.length - 8} more mutable allowlist entries.` : null;
	const flagPaths = require_string_normalization.uniqueStrings(hits.map((hit) => hit.dangerousFlagPath));
	const flagHint = flagPaths.length === 1 ? require_ansi.sanitizeForLog(flagPaths[0] ?? "") : `${require_ansi.sanitizeForLog(flagPaths[0] ?? "")} (and ${flagPaths.length - 1} other scope flags)`;
	return [
		`- Found ${hits.length} mutable allowlist ${hits.length === 1 ? "entry" : "entries"} across ${channel} while name matching is disabled by default.`,
		...exampleLines,
		...remaining ? [remaining] : [],
		`- Option A (break-glass): enable ${flagHint}=true to keep name/email/nick matching.`,
		"- Option B (recommended): resolve names/emails/nicks to stable sender IDs and rewrite the allowlist entries."
	];
}
/**
* Create a warning collector for mutable name/email/nick allowlists while stable-id matching is required.
* Channel plugins provide a detector for entries that depend on dangerous name matching.
*/
function createDangerousNameMatchingMutableAllowlistWarningCollector(params) {
	return ({ cfg }) => {
		const hits = [];
		for (const scope of require_dangerous_name_matching.collectProviderDangerousNameMatchingScopes(cfg, params.channel)) {
			if (scope.dangerousNameMatchingEnabled) continue;
			for (const candidate of params.collectLists(scope)) {
				if (!Array.isArray(candidate.list)) continue;
				for (const entry of candidate.list) {
					const text = String(entry).trim();
					if (!text || text === "*" || !params.detector(text)) continue;
					hits.push({
						path: candidate.pathLabel,
						entry: text,
						dangerousFlagPath: scope.dangerousFlagPath
					});
				}
			}
		}
		return collectMutableAllowlistWarningLines(hits, params.channel);
	};
}
//#endregion
//#region src/channels/plugins/status-issues/shared.ts
/**
* Channel status issue helper utilities.
*
* Formats status metadata and finds enabled/configured account ids for diagnostics.
*/
//#endregion
//#region src/plugin-sdk/status-helpers.ts
function buildComputedAccountStatusAdapterBase(options) {
	return {
		defaultRuntime: options.defaultRuntime,
		buildChannelSummary: options.buildChannelSummary,
		probeAccount: options.probeAccount,
		formatCapabilitiesProbe: options.formatCapabilitiesProbe,
		auditAccount: options.auditAccount,
		buildCapabilitiesDiagnostics: options.buildCapabilitiesDiagnostics,
		logSelfId: options.logSelfId,
		resolveAccountState: options.resolveAccountState,
		collectStatusIssues: options.collectStatusIssues
	};
}
/** Create the baseline runtime snapshot shape used by channel/account status stores. */
function createDefaultChannelRuntimeState(accountId, extra) {
	return {
		accountId,
		running: false,
		lastStartAt: null,
		lastStopAt: null,
		lastError: null,
		...extra ?? {}
	};
}
/** Normalize a channel-level status summary so missing lifecycle fields become explicit nulls. */
function buildBaseChannelStatusSummary(snapshot, extra) {
	return {
		configured: snapshot.configured ?? false,
		...extra ?? {},
		running: snapshot.running ?? false,
		lastStartAt: snapshot.lastStartAt ?? null,
		lastStopAt: snapshot.lastStopAt ?? null,
		lastError: snapshot.lastError ?? null
	};
}
/** Extend the base summary with probe fields while preserving stable null defaults. */
function buildProbeChannelStatusSummary(snapshot, extra) {
	return {
		...buildBaseChannelStatusSummary(snapshot, extra),
		probe: snapshot.probe,
		lastProbeAt: snapshot.lastProbeAt ?? null
	};
}
/** Build the standard per-account status payload from config metadata plus runtime state. */
function buildBaseAccountStatusSnapshot(params, extra) {
	const { account, runtime, probe } = params;
	return {
		accountId: account.accountId,
		name: account.name,
		enabled: account.enabled,
		configured: account.configured,
		...buildRuntimeAccountStatusSnapshot({
			runtime,
			probe
		}),
		lastInboundAt: runtime?.lastInboundAt ?? null,
		lastOutboundAt: runtime?.lastOutboundAt ?? null,
		...extra ?? {}
	};
}
/** Convenience wrapper when the caller already has flattened account fields instead of an account object. */
function buildComputedAccountStatusSnapshot(params, extra) {
	const { accountId, name, enabled, configured, runtime, probe } = params;
	return buildBaseAccountStatusSnapshot({
		account: {
			accountId,
			name,
			enabled,
			configured
		},
		runtime,
		probe
	}, extra);
}
/** Build a full status adapter when only configured/extras vary per account. */
function createComputedAccountStatusAdapter(options) {
	return {
		...buildComputedAccountStatusAdapterBase(options),
		buildAccountSnapshot: (params) => {
			const typedParams = params;
			const { extra, ...snapshot } = options.resolveAccountSnapshot(typedParams);
			return buildComputedAccountStatusSnapshot({
				...snapshot,
				runtime: typedParams.runtime,
				probe: typedParams.probe
			}, extra);
		}
	};
}
/** Normalize runtime-only account state into the shared status snapshot fields. */
function buildRuntimeAccountStatusSnapshot(params, extra) {
	const { runtime, probe } = params;
	return {
		running: runtime?.running ?? false,
		lastStartAt: runtime?.lastStartAt ?? null,
		lastStopAt: runtime?.lastStopAt ?? null,
		lastError: runtime?.lastError ?? null,
		probe,
		...typeof runtime?.connected === "boolean" ? { connected: runtime.connected } : {},
		...typeof runtime?.restartPending === "boolean" ? { restartPending: runtime.restartPending } : {},
		...typeof runtime?.reconnectAttempts === "number" ? { reconnectAttempts: runtime.reconnectAttempts } : {},
		...typeof runtime?.lastConnectedAt === "number" ? { lastConnectedAt: runtime.lastConnectedAt } : {},
		...runtime?.lastDisconnect ? { lastDisconnect: runtime.lastDisconnect } : {},
		...typeof runtime?.lastEventAt === "number" ? { lastEventAt: runtime.lastEventAt } : {},
		...typeof runtime?.lastTransportActivityAt === "number" ? { lastTransportActivityAt: runtime.lastTransportActivityAt } : {},
		...typeof runtime?.healthState === "string" ? { healthState: runtime.healthState } : {},
		...runtime?.terminalDisconnect ? { terminalDisconnect: runtime.terminalDisconnect } : {},
		...extra ?? {}
	};
}
//#endregion
//#region src/channels/plugins/pairing-message.ts
/**
* Default approval message sent after channel pairing succeeds.
*/
const PAIRING_APPROVED_MESSAGE = "✅ Operator access approved. Send a message to start chatting.";
(() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let i = 0; i < 256; i += 1) {
		let c = i;
		for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[i] = c >>> 0;
	}
	return table;
})();
//#endregion
//#region src/channels/plugins/media-limits.ts
const MB = 1024 * 1024;
/** Resolves channel media limit bytes from account-specific config or agent defaults. */
function resolveChannelMediaMaxBytes(params) {
	const accountId = require_account_id.normalizeAccountId(params.accountId);
	const channelLimit = params.resolveChannelLimitMb({
		cfg: params.cfg,
		accountId
	});
	if (channelLimit) return channelLimit * MB;
	if (params.cfg.agents?.defaults?.mediaMaxMb) return params.cfg.agents.defaults.mediaMaxMb * MB;
}
//#endregion
//#region src/channels/direct-dm-guard-policy.ts
/**
* Direct-DM pre-crypto guard policy.
*
* Defines conservative shape, size, timestamp, and rate limits before decryption work starts.
*/
//#endregion
//#region src/channels/inbound-debounce-policy.ts
/**
* Channel inbound debounce policy.
*
* Decides when text events can be delayed/merged before agent dispatch.
*/
//#endregion
//#region src/channels/session-envelope.ts
/** Resolves envelope options and previous timestamp for one inbound channel session. */
function resolveInboundSessionEnvelopeContext(params) {
	const storePath = require_paths.resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
	return {
		storePath,
		envelopeOptions: require_envelope.resolveEnvelopeFormatOptions(params.cfg),
		previousTimestamp: require_store$1.readSessionUpdatedAt({
			storePath,
			sessionKey: params.sessionKey
		})
	};
}
//#endregion
//#region src/channels/message/inbound-reply-dispatch.ts
/**
* Shared inbound reply dispatch helpers for channel message adapters.
*/
/** Run `dispatchReplyFromConfig` with a dispatcher that always gets its settled callback. */
async function dispatchReplyFromConfigWithSettledDispatcher(params) {
	return await require_dispatch.withReplyDispatcher({
		dispatcher: params.dispatcher,
		onSettled: params.onSettled,
		run: () => require_dispatch.dispatchReplyFromConfig({
			ctx: params.ctxPayload,
			cfg: params.cfg,
			dispatcher: params.dispatcher,
			replyOptions: params.replyOptions,
			configOverride: params.configOverride
		})
	});
}
//#endregion
//#region src/plugin-sdk/outbound-media.ts
/** Load outbound media from a remote URL or approved local path using the shared web-media policy. */
async function loadOutboundMediaFromUrl(mediaUrl, options = {}) {
	return await require_web_media.loadWebMedia(mediaUrl, require_load_options.buildOutboundMediaLoadOptions({
		maxBytes: options.maxBytes,
		mediaAccess: options.mediaAccess,
		mediaLocalRoots: options.mediaLocalRoots,
		mediaReadFile: options.mediaReadFile,
		workspaceDir: options.workspaceDir,
		proxyUrl: options.proxyUrl,
		fetchImpl: options.fetchImpl,
		requestInit: options.requestInit,
		trustExplicitProxyDns: options.trustExplicitProxyDns
	}));
}
//#endregion
//#region src/plugin-sdk/text-chunking.ts
/**
* Splits outbound channel text into chunks no longer than the requested limit.
* Newline boundaries win over spaces; text without usable separators falls back
* to a hard character split so channel senders always receive bounded strings.
*/
function chunkTextForOutbound(text, limit) {
	return require_text_chunking.chunkTextByBreakResolver(text, limit, (window) => {
		const lastNewline = window.lastIndexOf("\n");
		const lastSpace = window.lastIndexOf(" ");
		return lastNewline > 0 ? lastNewline : lastSpace;
	});
}
Object.freeze({
	windowMs: 6e4,
	maxRequests: 120,
	maxTrackedKeys: 4096
});
Object.freeze({
	maxTrackedKeys: 4096,
	ttlMs: 360 * 6e4,
	logEvery: 25
});
Object.freeze([
	400,
	401,
	408,
	413,
	415,
	429
]);
Object.freeze({
	preAuth: {
		maxBytes: 64 * 1024,
		timeoutMs: 5e3
	},
	postAuth: {
		maxBytes: 1024 * 1024,
		timeoutMs: 3e4
	}
});
Object.freeze({
	maxInFlightPerKey: 8,
	maxTrackedKeys: 4096
});
//#endregion
Object.defineProperty(exports, "PAIRING_APPROVED_MESSAGE", {
	enumerable: true,
	get: function() {
		return PAIRING_APPROVED_MESSAGE;
	}
});
Object.defineProperty(exports, "buildMediaPayload", {
	enumerable: true,
	get: function() {
		return buildMediaPayload;
	}
});
Object.defineProperty(exports, "buildProbeChannelStatusSummary", {
	enumerable: true,
	get: function() {
		return buildProbeChannelStatusSummary;
	}
});
Object.defineProperty(exports, "chunkTextForOutbound", {
	enumerable: true,
	get: function() {
		return chunkTextForOutbound;
	}
});
Object.defineProperty(exports, "createAllowlistProviderGroupPolicyWarningCollector", {
	enumerable: true,
	get: function() {
		return createAllowlistProviderGroupPolicyWarningCollector;
	}
});
Object.defineProperty(exports, "createChannelPairingController", {
	enumerable: true,
	get: function() {
		return createChannelPairingController;
	}
});
Object.defineProperty(exports, "createComputedAccountStatusAdapter", {
	enumerable: true,
	get: function() {
		return createComputedAccountStatusAdapter;
	}
});
Object.defineProperty(exports, "createDangerousNameMatchingMutableAllowlistWarningCollector", {
	enumerable: true,
	get: function() {
		return createDangerousNameMatchingMutableAllowlistWarningCollector;
	}
});
Object.defineProperty(exports, "createDefaultChannelRuntimeState", {
	enumerable: true,
	get: function() {
		return createDefaultChannelRuntimeState;
	}
});
Object.defineProperty(exports, "dispatchReplyFromConfigWithSettledDispatcher", {
	enumerable: true,
	get: function() {
		return dispatchReplyFromConfigWithSettledDispatcher;
	}
});
Object.defineProperty(exports, "formatAllowFromLowercase", {
	enumerable: true,
	get: function() {
		return formatAllowFromLowercase;
	}
});
Object.defineProperty(exports, "keepHttpServerTaskAlive", {
	enumerable: true,
	get: function() {
		return keepHttpServerTaskAlive;
	}
});
Object.defineProperty(exports, "loadOutboundMediaFromUrl", {
	enumerable: true,
	get: function() {
		return loadOutboundMediaFromUrl;
	}
});
Object.defineProperty(exports, "logInboundDrop", {
	enumerable: true,
	get: function() {
		return logInboundDrop;
	}
});
Object.defineProperty(exports, "logTypingFailure", {
	enumerable: true,
	get: function() {
		return logTypingFailure;
	}
});
Object.defineProperty(exports, "mapAllowlistResolutionInputs", {
	enumerable: true,
	get: function() {
		return mapAllowlistResolutionInputs;
	}
});
Object.defineProperty(exports, "mergeAllowlist", {
	enumerable: true,
	get: function() {
		return mergeAllowlist;
	}
});
Object.defineProperty(exports, "projectConfigWarningCollector", {
	enumerable: true,
	get: function() {
		return projectConfigWarningCollector;
	}
});
Object.defineProperty(exports, "resolveChannelMediaMaxBytes", {
	enumerable: true,
	get: function() {
		return resolveChannelMediaMaxBytes;
	}
});
Object.defineProperty(exports, "resolveInboundSessionEnvelopeContext", {
	enumerable: true,
	get: function() {
		return resolveInboundSessionEnvelopeContext;
	}
});
Object.defineProperty(exports, "resolveScopeToolsPolicy", {
	enumerable: true,
	get: function() {
		return resolveScopeToolsPolicy;
	}
});
Object.defineProperty(exports, "scopeKey", {
	enumerable: true,
	get: function() {
		return scopeKey;
	}
});
Object.defineProperty(exports, "summarizeMapping", {
	enumerable: true,
	get: function() {
		return summarizeMapping;
	}
});
