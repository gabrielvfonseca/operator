const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/sessions/session-key-utils.ts
const CASE_PRESERVING_PEERS = [{
	channel: "signal",
	peerKinds: /* @__PURE__ */ new Set(["group"]),
	span: "segment",
	unscoped: true
}, {
	channel: "matrix",
	peerKinds: /* @__PURE__ */ new Set(["channel", "group"]),
	span: "tail",
	unscoped: true
}];
/** True when (channel, peerKind) owns a case-sensitive opaque peer ID. */
function isCasePreservingPeer(channel, peerKind) {
	return findCasePreservingPeerDescriptor((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(channel), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(peerKind)) !== void 0;
}
function findCasePreservingPeerDescriptor(channel, peerKind) {
	const c = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(channel);
	const k = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(peerKind);
	return CASE_PRESERVING_PEERS.find((d) => d.channel === c && d.peerKinds.has(k));
}
function requiresFoldedSessionKeyAliasProof(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return false;
	const parts = raw.split(":");
	let bodyStartIndex = 0;
	let hasAgentWrapper = false;
	while (parts.length - bodyStartIndex >= 3 && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[bodyStartIndex]) === "agent") {
		hasAgentWrapper = true;
		bodyStartIndex += 2;
	}
	if (hasAgentWrapper) while (bodyStartIndex < parts.length && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[bodyStartIndex])) bodyStartIndex += 1;
	return findCasePreservingPeerDescriptor(parts[bodyStartIndex], parts[bodyStartIndex + 1])?.span === "tail";
}
function normalizeSessionPeerId(params) {
	const peerId = (params.peerId ?? "").trim();
	if (!peerId) return "";
	return isCasePreservingPeer(params.channel, params.peerKind) ? peerId : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(peerId);
}
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const NORMALIZED_SESSION_KEY_CACHE_MAX_ENTRIES = 2048;
const NORMALIZED_SESSION_KEY_CACHE_MAX_LENGTH = 4096;
const normalizedSessionKeyCache = /* @__PURE__ */ new Map();
function readNormalizedSessionKeyCache(raw) {
	return raw.length <= NORMALIZED_SESSION_KEY_CACHE_MAX_LENGTH ? normalizedSessionKeyCache.get(raw) : void 0;
}
function writeNormalizedSessionKeyCache(raw, normalized) {
	if (raw.length > NORMALIZED_SESSION_KEY_CACHE_MAX_LENGTH) return;
	normalizedSessionKeyCache.set(raw, normalized);
	while (normalizedSessionKeyCache.size > NORMALIZED_SESSION_KEY_CACHE_MAX_ENTRIES) {
		const oldest = normalizedSessionKeyCache.keys().next().value;
		if (oldest === void 0) return;
		normalizedSessionKeyCache.delete(oldest);
	}
}
function mayContainCasePreservingPeer(raw) {
	const folded = raw.toLowerCase();
	return CASE_PRESERVING_PEERS.some((descriptor) => folded.includes(`${descriptor.channel}:`));
}
/**
* Collect [start,end) index ranges in `raw` whose case must be preserved, per the
* CASE_PRESERVING_PEERS registry. Spans may come from multiple descriptors; the
* caller lowercases everything OUTSIDE their union — collect-then-emit, never
* sequential transforms that could re-lowercase an already-preserved span.
*/
function collectCasePreservedSpans(raw) {
	const spans = [];
	for (const descriptor of CASE_PRESERVING_PEERS) {
		const channel = escapeRegExp(descriptor.channel);
		for (const peerKind of descriptor.peerKinds) {
			const kind = escapeRegExp(peerKind);
			if (descriptor.span === "segment") {
				const re = new RegExp(`(^|:)${channel}:${kind}:([^:]+)`, "gi");
				for (const match of raw.matchAll(re)) {
					const matched = match[0] ?? "";
					const segment = match[2] ?? "";
					const segStart = (match.index ?? 0) + matched.length - segment.length;
					spans.push({
						start: segStart,
						end: segStart + segment.length,
						trim: true
					});
				}
			} else {
				const collectTailSpan = (tailStart) => {
					if (tailStart >= raw.length) return;
					const markerIndex = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw.slice(tailStart)).lastIndexOf(":thread:");
					if (markerIndex === -1) {
						spans.push({
							start: tailStart,
							end: raw.length,
							trim: false
						});
						return;
					}
					spans.push({
						start: tailStart,
						end: tailStart + markerIndex,
						trim: false
					});
					const threadIdStart = tailStart + markerIndex + 8;
					if (threadIdStart < raw.length) spans.push({
						start: threadIdStart,
						end: raw.length,
						trim: false
					});
				};
				const scopedMatch = new RegExp(`^(?:agent:[^:]*:)+:*${channel}:${kind}:`, "i").exec(raw);
				if (scopedMatch) {
					collectTailSpan(scopedMatch[0].length);
					continue;
				}
				if (descriptor.unscoped) {
					const unscopedMatch = new RegExp(`^${channel}:${kind}:`, "i").exec(raw);
					if (unscopedMatch) collectTailSpan(unscopedMatch[0].length);
				}
			}
		}
	}
	return spans;
}
function normalizeSessionKeyPreservingOpaquePeerIds(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return "";
	const cached = readNormalizedSessionKeyCache(raw);
	if (cached !== void 0) return cached;
	if (!mayContainCasePreservingPeer(raw)) {
		const normalized = raw.toLowerCase();
		writeNormalizedSessionKeyCache(raw, normalized);
		return normalized;
	}
	const spans = collectCasePreservedSpans(raw).filter((span) => span.end > span.start).toSorted((a, b) => a.start - b.start);
	let normalized = "";
	let cursor = 0;
	for (const span of spans) {
		if (span.start < cursor) continue;
		normalized += (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw.slice(cursor, span.start));
		const preserved = raw.slice(span.start, span.end);
		normalized += span.trim ? preserved.trim() : preserved;
		cursor = span.end;
	}
	normalized += (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw.slice(cursor));
	writeNormalizedSessionKeyCache(raw, normalized);
	return normalized;
}
/**
* Parse agent-scoped session keys in a canonical, case-insensitive way.
* Returned values are canonicalized for stable comparisons/routing while
* preserving provider-owned opaque peer IDs.
*/
function parseAgentSessionKey(sessionKey) {
	const raw = normalizeSessionKeyPreservingOpaquePeerIds(sessionKey);
	if (!raw) return null;
	const parts = raw.split(":");
	if (parts.length < 3 || !parts[1] || !parts[2]) return null;
	if (parts[0] !== "agent") return null;
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[1]);
	const rest = parts.slice(2).join(":");
	if (!agentId || !rest) return null;
	return {
		agentId,
		rest
	};
}
function isCronRunSessionKey(sessionKey) {
	const parsed = parseAgentSessionKey(sessionKey);
	if (!parsed) return false;
	return /^cron:[^:]+:run:[^:]+(?::|$)/.test(parsed.rest);
}
/**
* Splits the terminal per-run `:run:<id>` scope off an isolated cron session key
* (`agent:<id>:cron:<job>:run:<runId>`), yielding the cache-stable base key.
* The run scope is only ever appended to cron keys, so this is gated to that exact
* shape: any other key (including channel ids that embed a `:run:` segment) is returned
* unchanged with `runId` undefined, never truncating an unrelated session identity.
*/
function parseCronRunScopeSuffix(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return {
		baseSessionKey: void 0,
		runId: void 0
	};
	const parsed = parseAgentSessionKey(raw);
	if (!parsed || !/^cron:[^:]+:run:[^:]+$/.test(parsed.rest)) return {
		baseSessionKey: raw,
		runId: void 0
	};
	const markerIndex = raw.toLowerCase().lastIndexOf(":run:");
	return {
		baseSessionKey: raw.slice(0, markerIndex),
		runId: raw.slice(markerIndex + 5)
	};
}
function isCronSessionKey(sessionKey) {
	const parsed = parseAgentSessionKey(sessionKey);
	if (!parsed) return false;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parsed.rest)?.startsWith("cron:") === true;
}
function isSubagentSessionKey(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw)?.startsWith("subagent:")) return true;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parseAgentSessionKey(raw)?.rest)?.startsWith("subagent:") === true;
}
function getSubagentDepth(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(sessionKey);
	if (!raw) return 0;
	return (parseAgentSessionKey(raw)?.rest ?? raw).toLowerCase().match(/(^|:)subagent:/g)?.length ?? 0;
}
function isAcpSessionKey(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw).startsWith("acp:")) return true;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parseAgentSessionKey(raw)?.rest)?.startsWith("acp:") === true;
}
function parseThreadSessionSuffix(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return {
		baseSessionKey: void 0,
		threadId: void 0
	};
	const markerIndex = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw).lastIndexOf(":thread:");
	return {
		baseSessionKey: markerIndex === -1 ? raw : raw.slice(0, markerIndex),
		threadId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(markerIndex === -1 ? void 0 : raw.slice(markerIndex + 8))
	};
}
const SESSION_DELIVERY_PEER_KINDS = /* @__PURE__ */ new Set([
	"channel",
	"direct",
	"dm",
	"group"
]);
/** Parse only complete external delivery shapes; nested ownership stays opaque. */
function parseSessionDeliveryRoute(sessionKey) {
	const parsedThread = parseThreadSessionSuffix(sessionKey);
	const parsed = parseAgentSessionKey(parsedThread.baseSessionKey ?? sessionKey);
	if (!parsed) return null;
	const parts = parsed.rest.split(":");
	if (parts[0] === "agent" || parts.length < 3) return null;
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[0]);
	if (!channel) return null;
	if (parts.length >= 4 && (parts[2] === "direct" || parts[2] === "dm")) {
		const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[1]);
		const firstPeerIdSegment = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[3]);
		const peerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts.slice(3).join(":"));
		if (!accountId || !firstPeerIdSegment || !peerId) return null;
		return {
			accountId,
			channel,
			peerId,
			peerKind: parts[2],
			threadId: parsedThread.threadId
		};
	}
	const peerKind = parts[1];
	const firstPeerIdSegment = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[2]);
	const peerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts.slice(2).join(":"));
	if (!peerKind || !SESSION_DELIVERY_PEER_KINDS.has(peerKind) || !firstPeerIdSegment || !peerId) return null;
	return {
		channel,
		peerId,
		peerKind,
		threadId: parsedThread.threadId
	};
}
function parseRawSessionConversationRef(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!raw) return null;
	const rawParts = raw.split(":");
	const hasAgentWrapper = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(rawParts[0]) === "agent";
	if (hasAgentWrapper && (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawParts[1]) || rawParts.length < 3)) return null;
	const bodyStartIndex = hasAgentWrapper ? 2 : 0;
	const parts = rawParts.slice(bodyStartIndex);
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[0]) === "agent") return null;
	if (parts.length < 3 || !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts[2])) return null;
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[0]);
	const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(parts[1]);
	if (!channel || kind !== "group" && kind !== "channel") return null;
	const rawId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parts.slice(2).join(":"));
	const prefix = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawParts.slice(0, bodyStartIndex + 2).join(":"));
	if (!rawId || !prefix) return null;
	return {
		channel,
		kind,
		rawId,
		prefix
	};
}
//#endregion
//#region src/routing/session-key.ts
var session_key_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DEFAULT_ACCOUNT_ID: () => require_account_id.DEFAULT_ACCOUNT_ID,
	DEFAULT_AGENT_ID: () => DEFAULT_AGENT_ID,
	DEFAULT_MAIN_KEY: () => DEFAULT_MAIN_KEY,
	agentSessionKeysMatchByRequestKey: () => agentSessionKeysMatchByRequestKey,
	buildAgentMainSessionKey: () => buildAgentMainSessionKey,
	buildAgentPeerSessionKey: () => buildAgentPeerSessionKey,
	classifySessionKeyShape: () => classifySessionKeyShape,
	isUnscopedSessionKeySentinel: () => isUnscopedSessionKeySentinel,
	normalizeAgentId: () => _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId,
	normalizeMainKey: () => normalizeMainKey,
	normalizeOptionalAgentId: () => normalizeOptionalAgentId,
	resolveAgentIdFromSessionKey: () => resolveAgentIdFromSessionKey,
	resolveEventSessionKey: () => resolveEventSessionKey,
	resolveThreadSessionKeys: () => resolveThreadSessionKeys,
	sanitizeAgentId: () => sanitizeAgentId,
	scopeLegacySessionKeyToAgent: () => scopeLegacySessionKeyToAgent,
	scopedHeartbeatWakeOptions: () => scopedHeartbeatWakeOptions,
	toAgentRequestSessionKey: () => toAgentRequestSessionKey,
	toAgentStoreSessionKey: () => toAgentStoreSessionKey
});
const DEFAULT_AGENT_ID = "main";
const DEFAULT_MAIN_KEY = "main";
function normalizeToken(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
}
function scopedHeartbeatWakeOptions(sessionKey, wakeOptions, mainKey, scope) {
	const parsed = parseAgentSessionKey(sessionKey);
	if (!parsed) return wakeOptions;
	if (isCronRunSessionKey(sessionKey)) {
		if (scope === "global") return {
			...wakeOptions,
			agentId: parsed.agentId
		};
		return {
			...wakeOptions,
			sessionKey: buildAgentMainSessionKey({
				agentId: parsed.agentId,
				mainKey
			})
		};
	}
	return {
		...wakeOptions,
		sessionKey
	};
}
function resolveEventSessionKey(sessionKey, mainKey, scope) {
	const parsed = parseAgentSessionKey(sessionKey);
	if (!parsed || !isCronRunSessionKey(sessionKey)) return sessionKey;
	if (scope === "global") return "global";
	return buildAgentMainSessionKey({
		agentId: parsed.agentId,
		mainKey
	});
}
function normalizeMainKey(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value) || "main";
}
function toAgentRequestSessionKey(storeKey) {
	const raw = (storeKey ?? "").trim();
	if (!raw) return;
	return parseAgentSessionKey(raw)?.rest ?? raw;
}
function agentSessionKeysMatchByRequestKey(left, right) {
	const leftRaw = (left ?? "").trim();
	const rightRaw = (right ?? "").trim();
	if (!leftRaw || !rightRaw) return false;
	return leftRaw === rightRaw || toAgentRequestSessionKey(leftRaw) === toAgentRequestSessionKey(rightRaw);
}
function toAgentStoreSessionKey(params) {
	const raw = (params.requestKey ?? "").trim();
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (!raw || lowered === "main") return buildAgentMainSessionKey({
		agentId: params.agentId,
		mainKey: params.mainKey
	});
	const parsed = parseAgentSessionKey(raw);
	if (parsed) return `agent:${parsed.agentId}:${parsed.rest}`;
	const normalized = normalizeSessionKeyPreservingOpaquePeerIds(raw);
	if (lowered.startsWith("agent:")) return normalized;
	return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${normalized}`;
}
function resolveAgentIdFromSessionKey(sessionKey) {
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parseAgentSessionKey(sessionKey)?.agentId ?? "main");
}
function classifySessionKeyShape(sessionKey) {
	const raw = (sessionKey ?? "").trim();
	if (!raw) return "missing";
	if (parseAgentSessionKey(raw)) return "agent";
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw).startsWith("agent:") ? "malformed_agent" : "legacy_or_alias";
}
function isUnscopedSessionKeySentinel(sessionKey) {
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
	return lowered === "global" || lowered === "unknown";
}
function scopeLegacySessionKeyToAgent(params) {
	const raw = (params.sessionKey ?? "").trim();
	if (!raw) return;
	const agentId = params.agentId?.trim();
	if (!agentId || classifySessionKeyShape(raw) !== "legacy_or_alias") return raw;
	return toAgentStoreSessionKey({
		agentId,
		requestKey: raw,
		mainKey: params.mainKey
	});
}
function normalizeOptionalAgentId(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return trimmed ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(trimmed) : void 0;
}
function sanitizeAgentId(value) {
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(value);
}
function buildAgentMainSessionKey(params) {
	return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${normalizeMainKey(params.mainKey)}`;
}
function buildAgentPeerSessionKey(params) {
	const peerKind = params.peerKind ?? "direct";
	if (peerKind === "direct") {
		const dmScope = params.dmScope ?? "main";
		let peerId = (params.peerId ?? "").trim();
		const linkedPeerId = dmScope === "main" ? null : resolveLinkedPeerId({
			identityLinks: params.identityLinks,
			channel: params.channel,
			peerId
		});
		if (linkedPeerId) peerId = linkedPeerId;
		peerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(peerId);
		if (dmScope === "per-account-channel-peer" && peerId) {
			const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel) || "unknown";
			const accountId = require_account_id.normalizeAccountId(params.accountId);
			return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${channel}:${accountId}:direct:${peerId}`;
		}
		if (dmScope === "per-channel-peer" && peerId) {
			const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel) || "unknown";
			return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${channel}:direct:${peerId}`;
		}
		if (dmScope === "per-peer" && peerId) return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:direct:${peerId}`;
		return buildAgentMainSessionKey({
			agentId: params.agentId,
			mainKey: params.mainKey
		});
	}
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel) || "unknown";
	const peerId = normalizeSessionPeerId({
		channel: params.channel,
		peerKind,
		peerId: params.peerId
	}) || "unknown";
	return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${channel}:${peerKind}:${peerId}`;
}
function resolveLinkedPeerId(params) {
	const identityLinks = params.identityLinks;
	if (!identityLinks) return null;
	const peerId = params.peerId.trim();
	if (!peerId) return null;
	const candidates = /* @__PURE__ */ new Set();
	const rawCandidate = normalizeToken(peerId);
	if (rawCandidate) candidates.add(rawCandidate);
	const channel = normalizeToken(params.channel);
	if (channel) {
		const scopedCandidate = normalizeToken(`${channel}:${peerId}`);
		if (scopedCandidate) candidates.add(scopedCandidate);
	}
	if (candidates.size === 0) return null;
	for (const [canonical, ids] of Object.entries(identityLinks)) {
		const canonicalName = canonical.trim();
		if (!canonicalName) continue;
		if (!Array.isArray(ids)) continue;
		for (const id of ids) {
			const normalized = normalizeToken(id);
			if (normalized && candidates.has(normalized)) return canonicalName;
		}
	}
	return null;
}
function resolveThreadSessionKeys(params) {
	const threadId = (params.threadId ?? "").trim();
	if (!threadId) return {
		sessionKey: params.baseSessionKey,
		parentSessionKey: void 0
	};
	const normalizedThread = params.normalizeThreadId?.(threadId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(threadId);
	return {
		sessionKey: params.useSuffix ?? true ? `${params.baseSessionKey}:thread:${normalizedThread}` : params.baseSessionKey,
		parentSessionKey: params.parentSessionKey
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_AGENT_ID", {
	enumerable: true,
	get: function() {
		return DEFAULT_AGENT_ID;
	}
});
Object.defineProperty(exports, "DEFAULT_MAIN_KEY", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAIN_KEY;
	}
});
Object.defineProperty(exports, "agentSessionKeysMatchByRequestKey", {
	enumerable: true,
	get: function() {
		return agentSessionKeysMatchByRequestKey;
	}
});
Object.defineProperty(exports, "buildAgentMainSessionKey", {
	enumerable: true,
	get: function() {
		return buildAgentMainSessionKey;
	}
});
Object.defineProperty(exports, "buildAgentPeerSessionKey", {
	enumerable: true,
	get: function() {
		return buildAgentPeerSessionKey;
	}
});
Object.defineProperty(exports, "classifySessionKeyShape", {
	enumerable: true,
	get: function() {
		return classifySessionKeyShape;
	}
});
Object.defineProperty(exports, "getSubagentDepth", {
	enumerable: true,
	get: function() {
		return getSubagentDepth;
	}
});
Object.defineProperty(exports, "isAcpSessionKey", {
	enumerable: true,
	get: function() {
		return isAcpSessionKey;
	}
});
Object.defineProperty(exports, "isCronRunSessionKey", {
	enumerable: true,
	get: function() {
		return isCronRunSessionKey;
	}
});
Object.defineProperty(exports, "isCronSessionKey", {
	enumerable: true,
	get: function() {
		return isCronSessionKey;
	}
});
Object.defineProperty(exports, "isSubagentSessionKey", {
	enumerable: true,
	get: function() {
		return isSubagentSessionKey;
	}
});
Object.defineProperty(exports, "isUnscopedSessionKeySentinel", {
	enumerable: true,
	get: function() {
		return isUnscopedSessionKeySentinel;
	}
});
Object.defineProperty(exports, "normalizeMainKey", {
	enumerable: true,
	get: function() {
		return normalizeMainKey;
	}
});
Object.defineProperty(exports, "normalizeOptionalAgentId", {
	enumerable: true,
	get: function() {
		return normalizeOptionalAgentId;
	}
});
Object.defineProperty(exports, "normalizeSessionKeyPreservingOpaquePeerIds", {
	enumerable: true,
	get: function() {
		return normalizeSessionKeyPreservingOpaquePeerIds;
	}
});
Object.defineProperty(exports, "normalizeSessionPeerId", {
	enumerable: true,
	get: function() {
		return normalizeSessionPeerId;
	}
});
Object.defineProperty(exports, "parseAgentSessionKey", {
	enumerable: true,
	get: function() {
		return parseAgentSessionKey;
	}
});
Object.defineProperty(exports, "parseCronRunScopeSuffix", {
	enumerable: true,
	get: function() {
		return parseCronRunScopeSuffix;
	}
});
Object.defineProperty(exports, "parseRawSessionConversationRef", {
	enumerable: true,
	get: function() {
		return parseRawSessionConversationRef;
	}
});
Object.defineProperty(exports, "parseSessionDeliveryRoute", {
	enumerable: true,
	get: function() {
		return parseSessionDeliveryRoute;
	}
});
Object.defineProperty(exports, "parseThreadSessionSuffix", {
	enumerable: true,
	get: function() {
		return parseThreadSessionSuffix;
	}
});
Object.defineProperty(exports, "requiresFoldedSessionKeyAliasProof", {
	enumerable: true,
	get: function() {
		return requiresFoldedSessionKeyAliasProof;
	}
});
Object.defineProperty(exports, "resolveAgentIdFromSessionKey", {
	enumerable: true,
	get: function() {
		return resolveAgentIdFromSessionKey;
	}
});
Object.defineProperty(exports, "resolveEventSessionKey", {
	enumerable: true,
	get: function() {
		return resolveEventSessionKey;
	}
});
Object.defineProperty(exports, "resolveThreadSessionKeys", {
	enumerable: true,
	get: function() {
		return resolveThreadSessionKeys;
	}
});
Object.defineProperty(exports, "sanitizeAgentId", {
	enumerable: true,
	get: function() {
		return sanitizeAgentId;
	}
});
Object.defineProperty(exports, "scopeLegacySessionKeyToAgent", {
	enumerable: true,
	get: function() {
		return scopeLegacySessionKeyToAgent;
	}
});
Object.defineProperty(exports, "scopedHeartbeatWakeOptions", {
	enumerable: true,
	get: function() {
		return scopedHeartbeatWakeOptions;
	}
});
Object.defineProperty(exports, "session_key_exports", {
	enumerable: true,
	get: function() {
		return session_key_exports;
	}
});
Object.defineProperty(exports, "toAgentRequestSessionKey", {
	enumerable: true,
	get: function() {
		return toAgentRequestSessionKey;
	}
});
Object.defineProperty(exports, "toAgentStoreSessionKey", {
	enumerable: true,
	get: function() {
		return toAgentStoreSessionKey;
	}
});
