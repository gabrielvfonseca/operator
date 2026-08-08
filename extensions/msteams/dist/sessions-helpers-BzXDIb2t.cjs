const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_src = require("./src-Bt6t_5vk.cjs");
require("./client-start-readiness-CjzVtlBH.cjs");
const require_call = require("./call-CphTnsHC.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugin-sdk/session-visibility.ts
let callGatewayForListSpawned = require_call.callGateway;
/** Test hook: must stay aligned with `sessions-resolution` `testing.setDepsForTest`. */
const sessionVisibilityGatewayTesting = { setCallGatewayForListSpawned(overrides) {
	callGatewayForListSpawned = overrides ?? require_call.callGateway;
} };
/** List sessions spawned by the requester through the gateway session list method. */
async function listSpawnedSessionKeys(params) {
	const limit = typeof params.limit === "number" && Number.isFinite(params.limit) ? Math.max(1, Math.floor(params.limit)) : void 0;
	try {
		const list = await callGatewayForListSpawned({
			method: "sessions.list",
			params: {
				includeGlobal: false,
				includeUnknown: false,
				...limit !== void 0 ? { limit } : {},
				spawnedBy: params.requesterSessionKey
			}
		});
		const keys = require_string_normalization.normalizeTrimmedStringList((Array.isArray(list?.sessions) ? list.sessions : []).map((entry) => entry?.key));
		return new Set(keys);
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
/** Resolve configured session-tool visibility, defaulting invalid or missing values to tree. */
function resolveSessionToolsVisibility(cfg) {
	const raw = cfg.tools?.sessions?.visibility;
	const value = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	if (value === "self" || value === "tree" || value === "agent" || value === "all") return value;
	return "tree";
}
/** Resolve visibility after applying sandbox clamps for spawned-session-only agents. */
function resolveEffectiveSessionToolsVisibility(params) {
	const visibility = resolveSessionToolsVisibility(params.cfg);
	if (!params.sandboxed) return visibility;
	if ((params.cfg.agents?.defaults?.sandbox?.sessionToolsVisibility ?? "spawned") === "spawned" && visibility !== "tree") return "tree";
	return visibility;
}
/** Resolve sandbox-specific session visibility clamp for agent defaults. */
function resolveSandboxSessionToolsVisibility(cfg) {
	return cfg.agents?.defaults?.sandbox?.sessionToolsVisibility ?? "spawned";
}
function compileAgentAllowPattern(pattern) {
	const raw = require_string_coerce.normalizeOptionalString(pattern) ?? "";
	if (!raw) return { kind: "deny" };
	if (raw === "*") return { kind: "all" };
	if (!raw.includes("*")) return {
		kind: "exact",
		value: raw
	};
	const parts = raw.toLowerCase().split("*");
	return {
		kind: "wildcard",
		first: parts[0] ?? "",
		last: parts[parts.length - 1] ?? "",
		interior: parts.slice(1, -1).filter(Boolean)
	};
}
/**
* Linear-time case-insensitive glob matcher for precompiled `*` patterns.
* Checks prefix, suffix, then ordered interior segments without entering the
* regex engine, avoiding polynomial backtracking on repeated wildcards.
*/
function matchesCompiledWildcard(pattern, lower) {
	let pos = 0;
	if (pattern.first) {
		if (!lower.startsWith(pattern.first)) return false;
		pos = pattern.first.length;
	}
	const endBound = pattern.last ? lower.length - pattern.last.length : lower.length;
	if (pattern.last && (!lower.endsWith(pattern.last) || endBound < pos)) return false;
	for (const part of pattern.interior) {
		const idx = lower.indexOf(part, pos);
		if (idx === -1 || idx + part.length > endBound) return false;
		pos = idx + part.length;
	}
	return true;
}
/** Compile agent-to-agent allow rules into reusable matching predicates. */
function createAgentToAgentPolicy(cfg) {
	const routingA2A = cfg.tools?.agentToAgent;
	const enabled = routingA2A?.enabled === true;
	const allowPatterns = (Array.isArray(routingA2A?.allow) ? routingA2A.allow : []).map((pattern) => compileAgentAllowPattern(pattern));
	const hasWildcardPatterns = allowPatterns.some((pattern) => pattern.kind === "wildcard");
	const matchesAllow = (agentId) => {
		if (allowPatterns.length === 0) return true;
		const lowerAgentId = hasWildcardPatterns ? agentId.toLowerCase() : "";
		return allowPatterns.some((pattern) => {
			if (pattern.kind === "all") return true;
			if (pattern.kind === "deny") return false;
			if (pattern.kind === "exact") return pattern.value === agentId;
			return matchesCompiledWildcard(pattern, lowerAgentId);
		});
	};
	const isAllowed = (requesterAgentId, targetAgentId) => {
		if (requesterAgentId === targetAgentId) return true;
		if (!enabled) return false;
		return matchesAllow(requesterAgentId) && matchesAllow(targetAgentId);
	};
	return {
		enabled,
		matchesAllow,
		isAllowed
	};
}
function actionPrefix(action) {
	if (action === "history") return "Session history";
	if (action === "send") return "Session send";
	if (action === "status") return "Session status";
	return "Session list";
}
function a2aDisabledMessage(action) {
	if (action === "history") return "Agent-to-agent history is disabled. Set tools.agentToAgent.enabled=true to allow cross-agent access.";
	if (action === "send") return "Agent-to-agent messaging is disabled. Set tools.agentToAgent.enabled=true to allow cross-agent sends.";
	if (action === "status") return "Agent-to-agent status is disabled. Set tools.agentToAgent.enabled=true to allow cross-agent access.";
	return "Agent-to-agent listing is disabled. Set tools.agentToAgent.enabled=true to allow cross-agent visibility.";
}
function a2aDeniedMessage(action) {
	if (action === "history") return "Agent-to-agent history denied by tools.agentToAgent.allow.";
	if (action === "send") return "Agent-to-agent messaging denied by tools.agentToAgent.allow.";
	if (action === "status") return "Agent-to-agent status denied by tools.agentToAgent.allow.";
	return "Agent-to-agent listing denied by tools.agentToAgent.allow.";
}
function crossVisibilityMessage(action) {
	const suffix = "Set tools.sessions.visibility=all and tools.agentToAgent.enabled=true to allow cross-agent access; use tools.agentToAgent.allow to restrict permitted agent pairs.";
	if (action === "history") return `Session history visibility is restricted. ${suffix}`;
	if (action === "send") return `Session send visibility is restricted. ${suffix}`;
	if (action === "status") return `Session status visibility is restricted. ${suffix}`;
	return `Session list visibility is restricted. ${suffix}`;
}
function selfVisibilityMessage(action) {
	return `${actionPrefix(action)} visibility is restricted to the current session (tools.sessions.visibility=self).`;
}
function treeVisibilityMessage(action) {
	return `${actionPrefix(action)} visibility is restricted to the current session tree (tools.sessions.visibility=tree).`;
}
/** Create a direct session-key visibility checker for one requester/action pair. */
function createSessionVisibilityChecker(params) {
	const spawnedKeys = params.spawnedKeys;
	const rowChecker = createSessionVisibilityRowChecker({
		action: params.action,
		requesterAgentId: params.requesterAgentId,
		requesterSessionKey: params.requesterSessionKey,
		visibility: params.visibility,
		a2aPolicy: params.a2aPolicy
	});
	const check = (targetSessionKey) => {
		const isSpawnedSession = spawnedKeys?.has(targetSessionKey) === true;
		return rowChecker.check({
			key: targetSessionKey,
			spawnedBy: isSpawnedSession ? params.requesterSessionKey : void 0
		});
	};
	return { check };
}
function rowOwnedByRequester(row, requesterSessionKey) {
	return row.ownerSessionKey === requesterSessionKey || row.spawnedBy === requesterSessionKey || row.parentSessionKey === requesterSessionKey;
}
/** Create a row-aware visibility checker that can use owner/spawn metadata. */
function createSessionVisibilityRowChecker(params) {
	const requesterAgentId = require_string_coerce.normalizeLowercaseStringOrEmpty(params.requesterAgentId) || require_session_key.resolveAgentIdFromSessionKey(params.requesterSessionKey);
	const check = (row) => {
		const targetSessionKey = row.key;
		const targetAgentId = row.agentId ?? require_session_key.resolveAgentIdFromSessionKey(targetSessionKey);
		const isRequesterSession = targetSessionKey === params.requesterSessionKey || targetSessionKey === "current";
		const isRequesterOwned = rowOwnedByRequester(row, params.requesterSessionKey);
		if (!isRequesterSession && isRequesterOwned && (params.visibility === "tree" || params.visibility === "all")) return { allowed: true };
		if (targetAgentId !== requesterAgentId) {
			if (params.visibility !== "all") return {
				allowed: false,
				status: "forbidden",
				error: crossVisibilityMessage(params.action)
			};
			if (!params.a2aPolicy.enabled) return {
				allowed: false,
				status: "forbidden",
				error: a2aDisabledMessage(params.action)
			};
			if (!params.a2aPolicy.isAllowed(requesterAgentId, targetAgentId)) return {
				allowed: false,
				status: "forbidden",
				error: a2aDeniedMessage(params.action)
			};
			return { allowed: true };
		}
		if (params.visibility === "self" && !isRequesterSession) return {
			allowed: false,
			status: "forbidden",
			error: selfVisibilityMessage(params.action)
		};
		if (params.visibility === "tree" && !isRequesterSession && !isRequesterOwned) return {
			allowed: false,
			status: "forbidden",
			error: treeVisibilityMessage(params.action)
		};
		return { allowed: true };
	};
	return { check };
}
/** Create a visibility guard, loading spawned-session ownership when direct keys need it. */
async function createSessionVisibilityGuard(params) {
	const spawnedKeys = params.action !== "list" && (params.visibility === "tree" || params.visibility === "all") ? await listSpawnedSessionKeys({ requesterSessionKey: params.requesterSessionKey }) : null;
	return createSessionVisibilityChecker({
		action: params.action,
		requesterAgentId: params.requesterAgentId,
		requesterSessionKey: params.requesterSessionKey,
		visibility: params.visibility,
		a2aPolicy: params.a2aPolicy,
		spawnedKeys
	});
}
//#endregion
//#region src/sessions/session-id.ts
const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function looksLikeSessionId(value) {
	return SESSION_ID_RE.test(value.trim());
}
//#endregion
//#region src/agents/tools/sessions-resolution.ts
/**
* Session key resolution helpers.
*
* Normalizes display/internal/current-session aliases and resolves session-id inputs through Gateway.
*/
const defaultSessionsResolutionDeps = { callGateway: require_call.callGateway };
const CURRENT_SESSION_CLIENT_ALIAS_IDS = /* @__PURE__ */ new Set([
	require_client_info.GATEWAY_CLIENT_IDS.TUI,
	require_client_info.GATEWAY_CLIENT_IDS.CLI,
	require_client_info.GATEWAY_CLIENT_IDS.WEBCHAT_UI,
	require_client_info.GATEWAY_CLIENT_IDS.CONTROL_UI,
	require_client_info.GATEWAY_CLIENT_IDS.MACOS_APP,
	require_client_info.GATEWAY_CLIENT_IDS.IOS_APP,
	require_client_info.GATEWAY_CLIENT_IDS.ANDROID_APP
]);
let sessionsResolutionDeps = defaultSessionsResolutionDeps;
function resolveMainSessionAlias(cfg) {
	const mainKey = require_session_key.normalizeMainKey(cfg.session?.mainKey);
	const scope = cfg.session?.scope ?? "per-sender";
	return {
		mainKey,
		alias: scope === "global" ? "global" : mainKey,
		scope
	};
}
function resolveDisplaySessionKey(params) {
	if (params.key === params.alias) return "main";
	if (params.key === params.mainKey) return "main";
	return params.key;
}
function resolveInternalSessionKey(params) {
	if (params.key === "current") return params.requesterInternalKey ?? params.key;
	if (params.key === "main") return params.alias;
	return params.key;
}
function resolveCurrentSessionClientAlias(params) {
	const requesterKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterInternalKey);
	if (!requesterKey) return;
	const clientId = require_client_info.normalizeGatewayClientId(params.key);
	if (!clientId || !CURRENT_SESSION_CLIENT_ALIAS_IDS.has(clientId)) return;
	return requesterKey;
}
async function isRequesterSpawnedSessionVisible(params) {
	if (params.requesterSessionKey === params.targetSessionKey) return true;
	try {
		const resolved = await sessionsResolutionDeps.callGateway({
			method: "sessions.resolve",
			params: {
				key: params.targetSessionKey,
				spawnedBy: params.requesterSessionKey
			}
		});
		if (typeof resolved?.key === "string" && resolved.key.trim() === params.targetSessionKey) return true;
	} catch {}
	return (await listSpawnedSessionKeys({
		requesterSessionKey: params.requesterSessionKey,
		limit: params.limit
	})).has(params.targetSessionKey);
}
function looksLikeSessionKey(value) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
	if (!raw) return false;
	if (raw === "main" || raw === "global" || raw === "unknown" || raw === "current") return true;
	if (require_session_key.isAcpSessionKey(raw)) return true;
	if (raw.startsWith("agent:")) return true;
	if (raw.startsWith("cron:") || raw.startsWith("hook:")) return true;
	if (raw.startsWith("node-") || raw.startsWith("node:")) return true;
	if (raw.includes(":group:") || raw.includes(":channel:")) return true;
	return false;
}
function shouldResolveSessionIdInput(value) {
	return looksLikeSessionId(value) || !looksLikeSessionKey(value);
}
function buildResolvedSessionReference(params) {
	return {
		ok: true,
		key: params.key,
		displayKey: resolveDisplaySessionKey({
			key: params.key,
			alias: params.alias,
			mainKey: params.mainKey
		}),
		resolvedViaSessionId: params.resolvedViaSessionId
	};
}
function buildSessionIdResolveParams(params) {
	return {
		sessionId: params.sessionId,
		spawnedBy: params.restrictToSpawned ? params.requesterInternalKey : void 0,
		includeGlobal: !params.restrictToSpawned,
		includeUnknown: !params.restrictToSpawned,
		...params.allowMissing ? { allowMissing: true } : {}
	};
}
async function callGatewayResolveSession(params) {
	try {
		return await sessionsResolutionDeps.callGateway({
			method: "sessions.resolve",
			params
		});
	} catch (error) {
		if (!(params.allowMissing === true && error instanceof require_src.GatewayClientRequestError && error.gatewayCode === "INVALID_REQUEST" && error.message.includes("invalid sessions.resolve params") && error.message.includes("unexpected property 'allowMissing'"))) throw error;
		const legacyParams = { ...params };
		delete legacyParams.allowMissing;
		return await sessionsResolutionDeps.callGateway({
			method: "sessions.resolve",
			params: legacyParams
		});
	}
}
async function callGatewayResolveSessionId(params) {
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await callGatewayResolveSession(buildSessionIdResolveParams(params)))?.key) ?? "";
	if (!key) throw new Error(`Session not found: ${params.sessionId} (use the full sessionKey from sessions_list)`);
	return key;
}
async function resolveSessionKeyFromSessionId(params) {
	try {
		return buildResolvedSessionReference({
			key: await callGatewayResolveSessionId(params),
			alias: params.alias,
			mainKey: params.mainKey,
			resolvedViaSessionId: true
		});
	} catch (err) {
		if (params.restrictToSpawned) return {
			ok: false,
			status: "forbidden",
			error: `Session not visible from this sandboxed agent session: ${params.sessionId}`
		};
		return {
			ok: false,
			status: "error",
			error: require_errors.formatErrorMessage(err) || `Session not found: ${params.sessionId} (use the full sessionKey from sessions_list)`
		};
	}
}
async function resolveSessionKeyFromKey(params) {
	try {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await callGatewayResolveSession({
			key: params.key,
			spawnedBy: params.restrictToSpawned ? params.requesterInternalKey : void 0,
			...params.allowMissing ? { allowMissing: true } : {}
		}))?.key) ?? "";
		if (!key) return null;
		return buildResolvedSessionReference({
			key,
			alias: params.alias,
			mainKey: params.mainKey,
			resolvedViaSessionId: false
		});
	} catch {
		return null;
	}
}
async function tryResolveSessionKeyFromSessionId(params) {
	try {
		return buildResolvedSessionReference({
			key: await callGatewayResolveSessionId(params),
			alias: params.alias,
			mainKey: params.mainKey,
			resolvedViaSessionId: true
		});
	} catch {
		return null;
	}
}
async function resolveSessionReferenceByKeyOrSessionId(params) {
	if (!params.skipKeyLookup) {
		const resolvedByKey = await resolveSessionKeyFromKey({
			key: params.raw,
			alias: params.alias,
			mainKey: params.mainKey,
			requesterInternalKey: params.requesterInternalKey,
			restrictToSpawned: params.restrictToSpawned,
			allowMissing: params.allowMissing
		});
		if (resolvedByKey) return resolvedByKey;
	}
	if (!(params.forceSessionIdLookup || shouldResolveSessionIdInput(params.raw))) return null;
	if (params.allowUnresolvedSessionId) return await tryResolveSessionKeyFromSessionId({
		sessionId: params.raw,
		alias: params.alias,
		mainKey: params.mainKey,
		requesterInternalKey: params.requesterInternalKey,
		restrictToSpawned: params.restrictToSpawned,
		allowMissing: params.allowMissing
	});
	return await resolveSessionKeyFromSessionId({
		sessionId: params.raw,
		alias: params.alias,
		mainKey: params.mainKey,
		requesterInternalKey: params.requesterInternalKey,
		restrictToSpawned: params.restrictToSpawned,
		allowMissing: params.allowMissing
	});
}
async function resolveSessionReference(params) {
	const rawInput = resolveCurrentSessionClientAlias({
		key: params.sessionKey,
		requesterInternalKey: params.requesterInternalKey
	}) ?? params.sessionKey.trim();
	if (rawInput === "current") {
		const resolvedCurrent = await resolveSessionReferenceByKeyOrSessionId({
			raw: rawInput,
			alias: params.alias,
			mainKey: params.mainKey,
			requesterInternalKey: params.requesterInternalKey,
			restrictToSpawned: params.restrictToSpawned,
			allowUnresolvedSessionId: true,
			allowMissing: true,
			skipKeyLookup: params.restrictToSpawned,
			forceSessionIdLookup: true
		});
		if (resolvedCurrent) return resolvedCurrent;
	}
	const raw = rawInput === "current" && params.requesterInternalKey ? params.requesterInternalKey : rawInput;
	if (shouldResolveSessionIdInput(raw)) {
		const resolvedByGateway = await resolveSessionReferenceByKeyOrSessionId({
			raw,
			alias: params.alias,
			mainKey: params.mainKey,
			requesterInternalKey: params.requesterInternalKey,
			restrictToSpawned: params.restrictToSpawned,
			allowUnresolvedSessionId: false
		});
		if (resolvedByGateway) return resolvedByGateway;
	}
	const resolvedKey = resolveInternalSessionKey({
		key: raw,
		alias: params.alias,
		mainKey: params.mainKey,
		requesterInternalKey: params.requesterInternalKey
	});
	return {
		ok: true,
		key: resolvedKey,
		displayKey: resolveDisplaySessionKey({
			key: resolvedKey,
			alias: params.alias,
			mainKey: params.mainKey
		}),
		resolvedViaSessionId: false
	};
}
async function resolveVisibleSessionReference(params) {
	const resolvedKey = params.resolvedSession.key;
	const displayKey = params.resolvedSession.displayKey;
	if (!(!(params.restrictToSpawned && !params.resolvedSession.resolvedViaSessionId && params.requesterSessionKey !== resolvedKey) || await isRequesterSpawnedSessionVisible({
		requesterSessionKey: params.requesterSessionKey,
		targetSessionKey: resolvedKey
	}))) return {
		ok: false,
		status: "forbidden",
		error: `Session not visible from this sandboxed agent session: ${params.visibilitySessionKey}`,
		displayKey
	};
	return {
		ok: true,
		key: resolvedKey,
		displayKey
	};
}
const testing = { setDepsForTest(overrides) {
	sessionsResolutionDeps = overrides ? {
		...defaultSessionsResolutionDeps,
		...overrides
	} : defaultSessionsResolutionDeps;
	sessionVisibilityGatewayTesting.setCallGatewayForListSpawned(overrides?.callGateway ?? defaultSessionsResolutionDeps.callGateway);
} };
if (process.env.VITEST || false) globalThis[Symbol.for("operator.sessionsResolutionTestApi")] = { testing };
//#endregion
//#region src/agents/tools/sessions-access.ts
/**
* Session visibility and access helpers for session tools.
*
* Adds Operator session-key alias normalization and sandbox requester scoping over SDK visibility contracts.
*/
/** Resolves the requester context used to filter sandboxed session-tool access. */
function resolveSandboxedSessionToolContext(params) {
	const { mainKey, alias } = resolveMainSessionAlias(params.cfg);
	const visibility = resolveSandboxSessionToolsVisibility(params.cfg);
	const requesterSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentSessionKey);
	const requesterInternalKey = requesterSessionKey ? resolveInternalSessionKey({
		key: requesterSessionKey,
		alias,
		mainKey
	}) : void 0;
	return {
		mainKey,
		alias,
		visibility,
		requesterInternalKey,
		effectiveRequesterKey: requesterInternalKey ?? alias,
		restrictToSpawned: params.sandboxed === true && visibility === "spawned" && Boolean(requesterInternalKey) && !require_session_key.isSubagentSessionKey(requesterInternalKey)
	};
}
//#endregion
//#region src/agents/tools/sessions-helpers.ts
/** Resolves config plus sandbox visibility context for a session tool call. */
function resolveSessionToolContext(opts) {
	const cfg = opts?.config ?? require_io.getRuntimeConfig();
	return {
		cfg,
		...resolveSandboxedSessionToolContext({
			cfg,
			agentSessionKey: opts?.agentSessionKey,
			sandboxed: opts?.sandboxed
		})
	};
}
/** Classifies a session key/gateway kind into the row category used by tools. */
function classifySessionKind(params) {
	const key = params.key;
	if (key === params.alias || key === params.mainKey) return "main";
	if (key.startsWith("cron:")) return "cron";
	if (key.startsWith("hook:")) return "hook";
	if (key.startsWith("node-") || key.startsWith("node:")) return "node";
	if (params.gatewayKind === "group") return "group";
	if (key.includes(":group:") || key.includes(":channel:")) return "group";
	return "other";
}
/** Derives the best channel label for a session row. */
function deriveChannel(params) {
	if (params.kind === "cron" || params.kind === "hook" || params.kind === "node") return "internal";
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel ?? void 0);
	if (channel) return channel;
	const lastChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.lastChannel ?? void 0);
	if (lastChannel) return lastChannel;
	return require_session_key.parseRawSessionConversationRef(params.key)?.channel ?? "unknown";
}
//#endregion
Object.defineProperty(exports, "SESSION_ID_RE", {
	enumerable: true,
	get: function() {
		return SESSION_ID_RE;
	}
});
Object.defineProperty(exports, "classifySessionKind", {
	enumerable: true,
	get: function() {
		return classifySessionKind;
	}
});
Object.defineProperty(exports, "createAgentToAgentPolicy", {
	enumerable: true,
	get: function() {
		return createAgentToAgentPolicy;
	}
});
Object.defineProperty(exports, "createSessionVisibilityGuard", {
	enumerable: true,
	get: function() {
		return createSessionVisibilityGuard;
	}
});
Object.defineProperty(exports, "createSessionVisibilityRowChecker", {
	enumerable: true,
	get: function() {
		return createSessionVisibilityRowChecker;
	}
});
Object.defineProperty(exports, "deriveChannel", {
	enumerable: true,
	get: function() {
		return deriveChannel;
	}
});
Object.defineProperty(exports, "looksLikeSessionId", {
	enumerable: true,
	get: function() {
		return looksLikeSessionId;
	}
});
Object.defineProperty(exports, "resolveCurrentSessionClientAlias", {
	enumerable: true,
	get: function() {
		return resolveCurrentSessionClientAlias;
	}
});
Object.defineProperty(exports, "resolveDisplaySessionKey", {
	enumerable: true,
	get: function() {
		return resolveDisplaySessionKey;
	}
});
Object.defineProperty(exports, "resolveEffectiveSessionToolsVisibility", {
	enumerable: true,
	get: function() {
		return resolveEffectiveSessionToolsVisibility;
	}
});
Object.defineProperty(exports, "resolveInternalSessionKey", {
	enumerable: true,
	get: function() {
		return resolveInternalSessionKey;
	}
});
Object.defineProperty(exports, "resolveMainSessionAlias", {
	enumerable: true,
	get: function() {
		return resolveMainSessionAlias;
	}
});
Object.defineProperty(exports, "resolveSandboxedSessionToolContext", {
	enumerable: true,
	get: function() {
		return resolveSandboxedSessionToolContext;
	}
});
Object.defineProperty(exports, "resolveSessionReference", {
	enumerable: true,
	get: function() {
		return resolveSessionReference;
	}
});
Object.defineProperty(exports, "resolveSessionToolContext", {
	enumerable: true,
	get: function() {
		return resolveSessionToolContext;
	}
});
Object.defineProperty(exports, "resolveVisibleSessionReference", {
	enumerable: true,
	get: function() {
		return resolveVisibleSessionReference;
	}
});
Object.defineProperty(exports, "shouldResolveSessionIdInput", {
	enumerable: true,
	get: function() {
		return shouldResolveSessionIdInput;
	}
});
