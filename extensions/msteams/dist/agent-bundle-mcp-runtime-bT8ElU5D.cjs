const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_schema_validator = require("./schema-validator-pDawCDK6.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
require("./errors-BqS4bzom.cjs");
const require_kill_tree = require("./kill-tree-BxZeSfim.cjs");
const require_agent_bundle_mcp_names = require("./agent-bundle-mcp-names-DiSt2aZy.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_mcp_stdio = require("./mcp-stdio-o-OVj7D4.cjs");
const require_mcp_auth_profile = require("./mcp-auth-profile-B7BJ2g-9.cjs");
const require_linux_oom_score = require("./linux-oom-score-DsJe3nUs.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let typebox_compile = require("typebox/compile");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_child_process = require("node:child_process");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
let _modelcontextprotocol_sdk_client_index_js = require("@modelcontextprotocol/sdk/client/index.js");
let _modelcontextprotocol_sdk_client_streamableHttp_js = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
let _modelcontextprotocol_sdk_types_js = require("@modelcontextprotocol/sdk/types.js");
let _modelcontextprotocol_sdk_validation_ajv_provider_js = require("@modelcontextprotocol/sdk/validation/ajv-provider.js");
let node_stream = require("node:stream");
let _modelcontextprotocol_sdk_client_stdio_js = require("@modelcontextprotocol/sdk/client/stdio.js");
let _modelcontextprotocol_sdk_shared_stdio_js = require("@modelcontextprotocol/sdk/shared/stdio.js");
let _modelcontextprotocol_sdk_client_sse_js = require("@modelcontextprotocol/sdk/client/sse.js");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/agent-bundle-mcp-combined.ts
const COMBINED_SESSION_MCP_RUNTIME = Symbol.for("operator.combinedSessionMcpRuntime");
function isCombinedSessionMcpRuntime(runtime) {
	return runtime[COMBINED_SESSION_MCP_RUNTIME] !== void 0;
}
/**
* Merge catalogs from static + requester partitions.
* Safe names are precomputed from the full declared set, so no re-suffix is needed.
*/
function mergeMcpToolCatalogs(catalogs) {
	const servers = {};
	const tools = [];
	const diagnostics = [];
	for (const catalog of catalogs) {
		for (const [serverName, server] of Object.entries(catalog.servers).toSorted(([a], [b]) => a.localeCompare(b))) servers[serverName] = server;
		tools.push(...catalog.tools);
		if (catalog.diagnostics) diagnostics.push(...catalog.diagnostics);
	}
	tools.sort((a, b) => {
		const serverOrder = a.safeServerName.localeCompare(b.safeServerName);
		if (serverOrder !== 0) return serverOrder;
		const toolOrder = a.toolName.localeCompare(b.toolName);
		if (toolOrder !== 0) return toolOrder;
		return a.serverName.localeCompare(b.serverName);
	});
	return {
		version: 1,
		generatedAt: Math.max(0, ...catalogs.map((catalog) => catalog.generatedAt)),
		servers,
		tools,
		...diagnostics.length > 0 ? { diagnostics } : {}
	};
}
function createCombinedSessionMcpRuntime(params) {
	if (params.parts.length === 1) return params.parts[0];
	const parts = params.parts;
	let lastUsedAt = Math.max(...parts.map((part) => part.lastUsedAt));
	let cachedCatalog = null;
	let mergedSourceCatalogs = null;
	let catalogInFlight;
	const serverOwner = /* @__PURE__ */ new Map();
	const rememberServerOwners = (catalog, owner) => {
		for (const serverName of Object.keys(catalog.servers)) serverOwner.set(serverName, owner);
	};
	const cachedCatalogIsCurrent = () => cachedCatalog !== null && mergedSourceCatalogs !== null && parts.every((part, index) => part.peekCatalog() === mergedSourceCatalogs?.[index]);
	const loadCatalog = async () => {
		if (cachedCatalog && cachedCatalogIsCurrent()) return cachedCatalog;
		if (catalogInFlight) return catalogInFlight;
		const inFlight = (async () => {
			const catalogs = await Promise.all(parts.map((part) => part.getCatalog()));
			serverOwner.clear();
			for (let index = 0; index < parts.length; index += 1) rememberServerOwners(catalogs[index], parts[index]);
			mergedSourceCatalogs = catalogs;
			cachedCatalog = mergeMcpToolCatalogs(catalogs);
			return cachedCatalog;
		})();
		catalogInFlight = inFlight;
		try {
			return await inFlight;
		} finally {
			if (catalogInFlight === inFlight) catalogInFlight = void 0;
		}
	};
	const ownerForServer = async (serverName) => {
		if (serverOwner.size === 0) await loadCatalog();
		const owner = serverOwner.get(serverName);
		if (owner) return owner;
		throw new Error(`bundle-mcp server "${serverName}" is not connected`);
	};
	return {
		[COMBINED_SESSION_MCP_RUNTIME]: true,
		managedParts: parts,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		workspaceDir: params.workspaceDir,
		agentDir: params.agentDir,
		configFingerprint: parts.map((part) => part.configFingerprint).join(":"),
		isRequesterScopedServer(serverName) {
			return serverOwner.get(serverName)?.requesterScope !== void 0;
		},
		mcpAppsEnabled: parts.some((part) => part.mcpAppsEnabled === true),
		createdAt: Math.min(...parts.map((part) => part.createdAt)),
		get lastUsedAt() {
			return lastUsedAt;
		},
		get activeLeases() {
			return parts.reduce((sum, part) => sum + (part.activeLeases ?? 0), 0);
		},
		acquireLease() {
			const releases = parts.map((part) => part.acquireLease?.());
			let released = false;
			return () => {
				if (released) return;
				released = true;
				for (const release of releases) release?.();
			};
		},
		getCatalog: loadCatalog,
		peekCatalog() {
			if (cachedCatalog && cachedCatalogIsCurrent()) return cachedCatalog;
			const peeked = parts.map((part) => part.peekCatalog());
			if (peeked.some((catalog) => catalog === null)) return null;
			return mergeMcpToolCatalogs(peeked);
		},
		markUsed() {
			lastUsedAt = Date.now();
			for (const part of parts) part.markUsed();
		},
		async callTool(serverName, toolName, input) {
			return await (await ownerForServer(serverName)).callTool(serverName, toolName, input);
		},
		async listTools(serverName, requestParams) {
			const owner = await ownerForServer(serverName);
			if (!owner.listTools) throw new Error(`bundle-mcp server "${serverName}" does not support listTools`);
			return await owner.listTools(serverName, requestParams);
		},
		async listResources(serverName, options) {
			const owner = await ownerForServer(serverName);
			if (!owner.listResources) throw new Error(`bundle-mcp server "${serverName}" does not support listResources`);
			return await owner.listResources(serverName, options);
		},
		async readResource(serverName, uri, options) {
			const owner = await ownerForServer(serverName);
			if (!owner.readResource) throw new Error(`bundle-mcp server "${serverName}" does not support readResource`);
			return await owner.readResource(serverName, uri, options);
		},
		async listResourceTemplates(serverName, requestParams) {
			const owner = await ownerForServer(serverName);
			if (!owner.listResourceTemplates) throw new Error(`bundle-mcp server "${serverName}" does not support listResourceTemplates`);
			return await owner.listResourceTemplates(serverName, requestParams);
		},
		async listPrompts(serverName) {
			const owner = await ownerForServer(serverName);
			if (!owner.listPrompts) throw new Error(`bundle-mcp server "${serverName}" does not support listPrompts`);
			return await owner.listPrompts(serverName);
		},
		async getPrompt(serverName, name, args) {
			const owner = await ownerForServer(serverName);
			if (!owner.getPrompt) throw new Error(`bundle-mcp server "${serverName}" does not support getPrompt`);
			return await owner.getPrompt(serverName, name, args);
		},
		async dispose() {
			await Promise.allSettled(parts.map((part) => part.dispose()));
		}
	};
}
//#endregion
//#region src/agents/agent-bundle-mcp-filter.ts
/** Match the documented MCP tool-filter glob syntax: exact text plus `*`. */
function matchesMcpToolFilterPattern(pattern, value) {
	const trimmed = pattern.trim();
	if (!trimmed) return false;
	if (!trimmed.includes("*")) return trimmed === value;
	const parts = trimmed.split("*");
	const first = parts[0] ?? "";
	const last = parts.at(-1) ?? "";
	let cursor = 0;
	if (first) {
		if (!value.startsWith(first)) return false;
		cursor = first.length;
	}
	const endBound = last ? value.length - last.length : value.length;
	if (last && (!value.endsWith(last) || endBound < cursor)) return false;
	for (const part of parts.slice(1, -1)) {
		if (!part) continue;
		const index = value.indexOf(part, cursor);
		if (index === -1 || index + part.length > endBound) return false;
		cursor = index + part.length;
	}
	return true;
}
//#endregion
//#region src/agents/embedded-agent-mcp.ts
/** Loads merged MCP server config for an embedded agent workspace. */
function loadEmbeddedAgentMcpConfig(params) {
	const bundleMcp = require_mcp_auth_profile.loadMergedBundleMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		manifestRegistry: params.manifestRegistry
	});
	return {
		mcpServers: bundleMcp.config.mcpServers,
		diagnostics: bundleMcp.diagnostics
	};
}
//#endregion
//#region src/agents/agent-bundle-mcp-runtime-config.ts
/** Session MCP config loading, filtering, and catalog fingerprints. */
function digestSafeServerNameAssignments(safeServerNamesByServer) {
	if (!safeServerNamesByServer || safeServerNamesByServer.size === 0) return;
	return Object.fromEntries([...safeServerNamesByServer.entries()].toSorted(([a], [b]) => a.localeCompare(b)));
}
function createCatalogFingerprint(params) {
	return node_crypto.default.createHash("sha256").update(JSON.stringify(params)).digest("hex");
}
function filterMcpServers(mcpServers, options) {
	if (!options?.includeServerNames && !options?.excludeServerNames) return mcpServers;
	const filtered = {};
	for (const [serverName, rawServer] of Object.entries(mcpServers)) {
		if (options.includeServerNames && !options.includeServerNames.has(serverName)) continue;
		if (options.excludeServerNames?.has(serverName)) continue;
		filtered[serverName] = rawServer;
	}
	return filtered;
}
function loadSessionMcpConfig(params) {
	const loaded = loadEmbeddedAgentMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		manifestRegistry: params.manifestRegistry
	});
	if (params.logDiagnostics !== false) for (const diagnostic of loaded.diagnostics) require_logger.logWarn(`bundle-mcp: ${diagnostic.pluginId}: ${diagnostic.message}`);
	const mcpServers = filterMcpServers(loaded.mcpServers, {
		includeServerNames: params.includeServerNames,
		excludeServerNames: params.excludeServerNames
	});
	const fingerprintServers = params.redactConnectionServerNames?.size ? require_mcp_auth_profile.redactMcpServersForFingerprint(mcpServers, params.redactConnectionServerNames) : mcpServers;
	const safeServerNames = digestSafeServerNameAssignments(params.safeServerNamesByServer);
	return {
		loaded: {
			...loaded,
			mcpServers
		},
		fingerprint: createCatalogFingerprint({
			servers: fingerprintServers,
			mcpAppsEnabled: params.cfg?.mcp?.apps?.enabled === true,
			...safeServerNames ? { safeServerNames } : {}
		})
	};
}
/**
* Loads enabled MCP config metadata for a session without creating runtimes,
* connecting transports, or issuing MCP tools/list requests.
*/
function resolveSessionMcpConfigSummary(params) {
	const { loaded, fingerprint } = loadSessionMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		logDiagnostics: false,
		manifestRegistry: params.manifestRegistry
	});
	const serverNames = Object.keys(loaded.mcpServers).toSorted((a, b) => a.localeCompare(b));
	if (serverNames.length === 0) return {
		fingerprint,
		serverNames
	};
	const safeServerNamesByServer = require_agent_bundle_mcp_names.assignSafeServerNames(Object.keys(loaded.mcpServers));
	const { requesterScopedServerNames } = require_mcp_auth_profile.partitionMcpServersByConnectionScope(loaded.mcpServers);
	const { fingerprint: bareRuntimeFingerprint } = loadSessionMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		logDiagnostics: false,
		manifestRegistry: params.manifestRegistry,
		...requesterScopedServerNames.length > 0 ? { excludeServerNames: new Set(requesterScopedServerNames) } : {},
		safeServerNamesByServer
	});
	return {
		fingerprint: bareRuntimeFingerprint,
		serverNames
	};
}
//#endregion
//#region src/agents/agent-bundle-mcp-manager-install.ts
const matchesStaticReuse = (params) => params.candidate.workspaceDir === params.workspaceDir && params.candidate.agentDir === params.agentDir && params.candidate.configFingerprint === params.configFingerprint;
function createSessionMcpRuntimeManagerInstall(lifecycle) {
	const { store } = lifecycle;
	/** Static/session runtime get-or-create (createInFlight dedup for bare keys only). */
	const getOrCreateRuntimeEntry = async (params) => {
		const nextFingerprint = params.configFingerprint ?? loadSessionMcpConfig({
			workspaceDir: params.workspaceDir,
			cfg: params.cfg,
			logDiagnostics: false,
			manifestRegistry: params.manifestRegistry,
			includeServerNames: params.includeServerNames,
			excludeServerNames: params.excludeServerNames,
			redactConnectionServerNames: params.redactConnectionServerNames,
			safeServerNamesByServer: params.safeServerNamesByServer
		}).fingerprint;
		const existing = store.runtimesBySessionId.get(params.runtimeKey);
		if (existing) if (!matchesStaticReuse({
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			configFingerprint: nextFingerprint,
			candidate: existing
		})) {
			store.runtimesBySessionId.delete(params.runtimeKey);
			store.idleTtlMsBySessionId.delete(params.runtimeKey);
			store.connectionMetaByRuntimeKey.delete(params.runtimeKey);
			await existing.dispose();
		} else {
			store.deferredRetirementSessionIds.delete(params.sessionId);
			existing.markUsed();
			store.idleTtlMsBySessionId.set(params.runtimeKey, params.idleTtlMs);
			return existing;
		}
		const inFlight = store.createInFlight.get(params.runtimeKey);
		if (inFlight) {
			if (matchesStaticReuse({
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				configFingerprint: nextFingerprint,
				candidate: inFlight
			})) return inFlight.promise;
			store.createInFlight.delete(params.runtimeKey);
			const staleRuntime = await inFlight.promise.catch(() => void 0);
			store.runtimesBySessionId.delete(params.runtimeKey);
			store.idleTtlMsBySessionId.delete(params.runtimeKey);
			store.connectionMetaByRuntimeKey.delete(params.runtimeKey);
			await staleRuntime?.dispose();
		}
		const created = Promise.resolve(store.createRuntime({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			cfg: params.cfg,
			manifestRegistry: params.manifestRegistry,
			includeServerNames: params.includeServerNames,
			excludeServerNames: params.excludeServerNames,
			safeServerNamesByServer: params.safeServerNamesByServer,
			connectionOverrides: params.connectionOverrides,
			redactConnectionServerNames: params.redactConnectionServerNames,
			requesterScope: params.requesterScope,
			configFingerprint: nextFingerprint
		})).then((runtime) => {
			store.deferredRetirementSessionIds.delete(params.sessionId);
			runtime.markUsed();
			store.runtimesBySessionId.set(params.runtimeKey, runtime);
			store.idleTtlMsBySessionId.set(params.runtimeKey, params.idleTtlMs);
			return runtime;
		});
		store.createInFlight.set(params.runtimeKey, {
			promise: created,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			configFingerprint: nextFingerprint
		});
		try {
			return await created;
		} finally {
			store.createInFlight.delete(params.runtimeKey);
		}
	};
	/**
	* Install or reuse a requester runtime for already-resolved connections.
	* Must run inside runExclusiveOnRuntimeKey for this runtimeKey.
	*/
	const installRequesterRuntime = async (params) => {
		const resolvedNameSet = new Set(params.connectionOverrides.keys());
		const { fingerprint: resolvedFingerprint } = loadSessionMcpConfig({
			workspaceDir: params.workspaceDir,
			cfg: params.cfg,
			logDiagnostics: false,
			manifestRegistry: params.manifestRegistry,
			includeServerNames: resolvedNameSet,
			redactConnectionServerNames: params.redactConnectionServerNames,
			safeServerNamesByServer: params.safeServerNamesByServer
		});
		const connectionHash = require_mcp_auth_profile.hashMcpResolvedConnections(params.connectionOverrides);
		const existing = store.runtimesBySessionId.get(params.runtimeKey);
		const meta = store.connectionMetaByRuntimeKey.get(params.runtimeKey);
		if (existing && meta?.connectionHash === connectionHash && matchesStaticReuse({
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			configFingerprint: resolvedFingerprint,
			candidate: existing
		})) {
			store.deferredRetirementSessionIds.delete(params.sessionId);
			existing.markUsed();
			store.idleTtlMsBySessionId.set(params.runtimeKey, params.idleTtlMs);
			store.connectionMetaByRuntimeKey.set(params.runtimeKey, {
				connectionHash,
				resolvedAt: store.now()
			});
			return existing;
		}
		if (existing) {
			store.runtimesBySessionId.delete(params.runtimeKey);
			store.idleTtlMsBySessionId.delete(params.runtimeKey);
			store.connectionMetaByRuntimeKey.delete(params.runtimeKey);
			await existing.dispose();
		}
		const runtime = await getOrCreateRuntimeEntry({
			runtimeKey: params.runtimeKey,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			cfg: params.cfg,
			manifestRegistry: params.manifestRegistry,
			idleTtlMs: params.idleTtlMs,
			includeServerNames: resolvedNameSet,
			safeServerNamesByServer: params.safeServerNamesByServer,
			connectionOverrides: params.connectionOverrides,
			redactConnectionServerNames: params.redactConnectionServerNames,
			requesterScope: params.requesterScope,
			configFingerprint: resolvedFingerprint
		});
		store.connectionMetaByRuntimeKey.set(params.runtimeKey, {
			connectionHash,
			resolvedAt: store.now()
		});
		return runtime;
	};
	/** Revoke cached scoped runtime (empty re-resolution). Auth boundary: leases do not block. */
	const revokeRequesterRuntime = async (runtimeKey) => {
		await lifecycle.disposeRuntimeKeyNow(runtimeKey);
	};
	/**
	* Full requester section for one runtimeKey: reuse / resolve / install / revoke.
	* Always invoked under runExclusiveOnRuntimeKey.
	*/
	const resolveAndInstallRequesterRuntime = async (params) => {
		const existing = store.runtimesBySessionId.get(params.runtimeKey);
		const meta = store.connectionMetaByRuntimeKey.get(params.runtimeKey);
		const revalidateMs = require_mcp_auth_profile.resolveMcpConnectionRevalidateMs();
		if (meta !== void 0 && store.now() - meta.resolvedAt < revalidateMs && existing && matchesStaticReuse({
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			configFingerprint: params.fullScopedFingerprint,
			candidate: existing
		})) {
			store.deferredRetirementSessionIds.delete(params.sessionId);
			existing.markUsed();
			store.idleTtlMsBySessionId.set(params.runtimeKey, params.idleTtlMs);
			return existing;
		}
		const connectionOverrides = await require_mcp_auth_profile.resolveRequesterScopedMcpConnections({
			serverNames: params.requesterScopedServerNames,
			requesterSenderId: params.requesterSenderId,
			agentAccountId: params.agentAccountId,
			messageChannel: params.messageChannel
		});
		if (connectionOverrides.size === 0) {
			if (store.runtimesBySessionId.has(params.runtimeKey) || store.createInFlight.has(params.runtimeKey)) await revokeRequesterRuntime(params.runtimeKey);
			return;
		}
		return await installRequesterRuntime({
			runtimeKey: params.runtimeKey,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			cfg: params.cfg,
			manifestRegistry: params.manifestRegistry,
			idleTtlMs: params.idleTtlMs,
			safeServerNamesByServer: params.safeServerNamesByServer,
			connectionOverrides,
			redactConnectionServerNames: params.scopedNameSet,
			requesterScope: params.requesterScope
		});
	};
	return {
		getOrCreateRuntimeEntry,
		resolveAndInstallRequesterRuntime
	};
}
//#endregion
//#region src/agents/agent-bundle-mcp-runtime-shared.ts
const SESSION_MCP_RUNTIME_MANAGER_KEY = Symbol.for("operator.sessionMcpRuntimeManager");
const DEFAULT_SESSION_MCP_RUNTIME_IDLE_TTL_MS = 600 * 1e3;
function resolveSessionMcpRuntimeIdleTtlMs(cfg) {
	const raw = cfg?.mcp?.sessionIdleTtlMs;
	if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
	return DEFAULT_SESSION_MCP_RUNTIME_IDLE_TTL_MS;
}
//#endregion
//#region src/agents/agent-bundle-mcp-manager-lifecycle.ts
/** Session MCP runtime manager lifecycle: maps, idle sweep, dispose, advertised catalog. */
function parseRuntimeCacheSessionId(runtimeKey) {
	if (!runtimeKey.startsWith("{")) return runtimeKey;
	try {
		const parsed = JSON.parse(runtimeKey);
		return typeof parsed.sessionId === "string" ? parsed.sessionId : runtimeKey;
	} catch {
		return runtimeKey;
	}
}
function createSessionMcpRuntimeManagerStore(opts, createSessionMcpRuntime) {
	return {
		runtimesBySessionId: /* @__PURE__ */ new Map(),
		sessionIdBySessionKey: /* @__PURE__ */ new Map(),
		idleTtlMsBySessionId: /* @__PURE__ */ new Map(),
		deferredRetirementSessionIds: /* @__PURE__ */ new Set(),
		connectionMetaByRuntimeKey: /* @__PURE__ */ new Map(),
		/**
		* Session-stable advertised catalogs for requester-scoped servers.
		* Keyed by sessionId → serverName. Specs must not vary per sender or shared
		* Codex threads rotate (dynamicToolsFingerprint churn).
		*/
		advertisedScopedCatalogBySessionId: /* @__PURE__ */ new Map(),
		/**
		* Per-runtimeKey serialization for requester resolve+install and dispose.
		* Sections never overlap for one key, so a slow resolve cannot clobber a newer install.
		* Entries are removed when their chain drains.
		*/
		requesterWorkChains: /* @__PURE__ */ new Map(),
		createRuntime: opts.createRuntime ?? createSessionMcpRuntime,
		now: opts.now ?? Date.now,
		createInFlight: /* @__PURE__ */ new Map(),
		idleSweepIntervalMs: opts.idleSweepIntervalMs ?? 6e4,
		maxIdleRequesterRuntimes: opts.maxIdleRequesterRuntimesPerSession ?? 64,
		enableIdleSweepTimer: opts.enableIdleSweepTimer !== false,
		idleSweepTimer: void 0,
		idleSweepInFlight: void 0
	};
}
function scopedCatalogToolsSignature(tools) {
	return JSON.stringify(tools.map((tool) => [
		tool.serverName,
		tool.safeServerName,
		tool.toolName,
		tool.title ?? "",
		tool.description ?? "",
		tool.fallbackDescription,
		tool.inputSchema,
		tool.uiResourceUri ?? "",
		tool.uiVisibility ?? null
	]));
}
function createSessionMcpRuntimeManagerLifecycle(store) {
	const forgetSessionKeysForSessionId = (sessionId) => {
		for (const [sessionKey, mappedSessionId] of store.sessionIdBySessionKey.entries()) if (mappedSessionId === sessionId) store.sessionIdBySessionKey.delete(sessionKey);
	};
	const runtimeKeysForSessionId = (sessionId) => {
		const keys = [];
		for (const [runtimeKey, runtime] of store.runtimesBySessionId.entries()) if (runtime.sessionId === sessionId) keys.push(runtimeKey);
		return keys;
	};
	const totalActiveLeasesForSessionId = (sessionId) => {
		let total = 0;
		for (const runtimeKey of runtimeKeysForSessionId(sessionId)) total += store.runtimesBySessionId.get(runtimeKey)?.activeLeases ?? 0;
		return total;
	};
	const runExclusiveOnRuntimeKey = (runtimeKey, work) => {
		const run = (store.requesterWorkChains.get(runtimeKey) ?? Promise.resolve()).catch(() => void 0).then(() => work());
		const settled = run.then(() => void 0, () => void 0);
		store.requesterWorkChains.set(runtimeKey, settled);
		settled.finally(() => {
			if (store.requesterWorkChains.get(runtimeKey) === settled) store.requesterWorkChains.delete(runtimeKey);
		});
		return run;
	};
	const sweepIdleRuntimes = async () => {
		const nowMs = store.now();
		const expired = [];
		for (const [runtimeKey, runtime] of store.runtimesBySessionId.entries()) {
			const idleTtlMs = store.idleTtlMsBySessionId.get(runtimeKey) ?? store.idleTtlMsBySessionId.get(runtime.sessionId) ?? 6e5;
			if (idleTtlMs <= 0 || (runtime.activeLeases ?? 0) > 0) continue;
			if (nowMs - runtime.lastUsedAt < idleTtlMs) continue;
			store.runtimesBySessionId.delete(runtimeKey);
			store.idleTtlMsBySessionId.delete(runtimeKey);
			store.connectionMetaByRuntimeKey.delete(runtimeKey);
			expired.push(runtime);
		}
		const touchedSessionIds = new Set(expired.map((runtime) => runtime.sessionId));
		for (const sessionId of touchedSessionIds) if (runtimeKeysForSessionId(sessionId).length === 0) {
			store.deferredRetirementSessionIds.delete(sessionId);
			forgetSessionKeysForSessionId(sessionId);
		}
		await Promise.allSettled(expired.map((runtime) => runtime.dispose()));
		return expired.length;
	};
	/**
	* A busy shared channel can otherwise accumulate one live scoped runtime per
	* sender until the idle TTL fires. Evict LRU zero-lease requester runtimes
	* beyond the cap; leased runtimes and the bare static runtime never evict.
	*/
	const enforceRequesterRuntimeCap = async (sessionId, keepRuntimeKey) => {
		const requesterKeys = runtimeKeysForSessionId(sessionId).filter((runtimeKey) => runtimeKey !== sessionId);
		const overflow = requesterKeys.length - store.maxIdleRequesterRuntimes;
		if (overflow <= 0) return;
		const evictable = requesterKeys.filter((runtimeKey) => runtimeKey !== keepRuntimeKey).map((runtimeKey) => ({
			runtimeKey,
			runtime: store.runtimesBySessionId.get(runtimeKey)
		})).filter((entry) => entry.runtime !== void 0 && (entry.runtime.activeLeases ?? 0) === 0).toSorted((a, b) => a.runtime.lastUsedAt - b.runtime.lastUsedAt).slice(0, overflow);
		for (const { runtimeKey, runtime } of evictable) await runExclusiveOnRuntimeKey(runtimeKey, async () => {
			const current = store.runtimesBySessionId.get(runtimeKey);
			if (current !== runtime || (current.activeLeases ?? 0) > 0) return;
			store.runtimesBySessionId.delete(runtimeKey);
			store.idleTtlMsBySessionId.delete(runtimeKey);
			store.connectionMetaByRuntimeKey.delete(runtimeKey);
			await current.dispose();
		});
	};
	const queueIdleSweep = () => {
		if (store.idleSweepInFlight) return;
		store.idleSweepInFlight = sweepIdleRuntimes().then(() => void 0).catch((error) => {
			require_logger.logWarn(`bundle-mcp: idle runtime sweep failed: ${String(error)}`);
		}).finally(() => {
			store.idleSweepInFlight = void 0;
		});
	};
	const ensureIdleSweepTimer = () => {
		if (!store.enableIdleSweepTimer || store.idleSweepIntervalMs <= 0 || store.idleSweepTimer) return;
		store.idleSweepTimer = setInterval(queueIdleSweep, store.idleSweepIntervalMs);
		store.idleSweepTimer.unref?.();
	};
	const clearIdleSweepTimer = () => {
		if (!store.idleSweepTimer) return;
		clearInterval(store.idleSweepTimer);
		store.idleSweepTimer = void 0;
	};
	const disposeRuntimeKeyNow = async (runtimeKey) => {
		const inFlight = store.createInFlight.get(runtimeKey);
		store.createInFlight.delete(runtimeKey);
		let runtime = store.runtimesBySessionId.get(runtimeKey);
		if (!runtime && inFlight) runtime = await inFlight.promise.catch(() => void 0);
		store.runtimesBySessionId.delete(runtimeKey);
		store.idleTtlMsBySessionId.delete(runtimeKey);
		store.connectionMetaByRuntimeKey.delete(runtimeKey);
		if (runtime) await runtime.dispose();
	};
	const disposeManagedSession = async (sessionId) => {
		store.deferredRetirementSessionIds.delete(sessionId);
		store.advertisedScopedCatalogBySessionId.delete(sessionId);
		const runtimeKeys = new Set(runtimeKeysForSessionId(sessionId));
		for (const runtimeKey of store.createInFlight.keys()) if (parseRuntimeCacheSessionId(runtimeKey) === sessionId) runtimeKeys.add(runtimeKey);
		for (const runtimeKey of store.requesterWorkChains.keys()) if (parseRuntimeCacheSessionId(runtimeKey) === sessionId) runtimeKeys.add(runtimeKey);
		await Promise.allSettled([...runtimeKeys].map((runtimeKey) => runtimeKey.startsWith("{") ? runExclusiveOnRuntimeKey(runtimeKey, () => disposeRuntimeKeyNow(runtimeKey)) : disposeRuntimeKeyNow(runtimeKey)));
		forgetSessionKeysForSessionId(sessionId);
	};
	const rememberAdvertisedScopedCatalog = (sessionId, catalog) => {
		let entry = store.advertisedScopedCatalogBySessionId.get(sessionId);
		if (!entry) {
			entry = {
				servers: /* @__PURE__ */ new Map(),
				toolsByServer: /* @__PURE__ */ new Map(),
				signaturesByServer: /* @__PURE__ */ new Map()
			};
			store.advertisedScopedCatalogBySessionId.set(sessionId, entry);
		}
		const toolsByServerName = /* @__PURE__ */ new Map();
		for (const tool of catalog.tools) {
			const list = toolsByServerName.get(tool.serverName) ?? [];
			list.push(tool);
			toolsByServerName.set(tool.serverName, list);
		}
		for (const [serverName, server] of Object.entries(catalog.servers)) {
			const tools = (toolsByServerName.get(serverName) ?? []).toSorted((a, b) => a.toolName.localeCompare(b.toolName));
			const signature = scopedCatalogToolsSignature(tools);
			if (entry.signaturesByServer.get(serverName) === signature) continue;
			entry.servers.set(serverName, server);
			entry.toolsByServer.set(serverName, tools);
			entry.signaturesByServer.set(serverName, signature);
		}
	};
	const getAdvertisedScopedCatalog = (sessionId) => {
		const entry = store.advertisedScopedCatalogBySessionId.get(sessionId);
		if (!entry || entry.servers.size === 0) return null;
		const servers = {};
		const tools = [];
		for (const serverName of [...entry.servers.keys()].toSorted((a, b) => a.localeCompare(b))) {
			servers[serverName] = entry.servers.get(serverName);
			tools.push(...entry.toolsByServer.get(serverName) ?? []);
		}
		tools.sort((a, b) => {
			const serverOrder = a.safeServerName.localeCompare(b.safeServerName);
			if (serverOrder !== 0) return serverOrder;
			return a.toolName.localeCompare(b.toolName);
		});
		return {
			version: 1,
			generatedAt: store.now(),
			servers,
			tools
		};
	};
	return {
		store,
		forgetSessionKeysForSessionId,
		runtimeKeysForSessionId,
		totalActiveLeasesForSessionId,
		runExclusiveOnRuntimeKey,
		sweepIdleRuntimes,
		enforceRequesterRuntimeCap,
		ensureIdleSweepTimer,
		clearIdleSweepTimer,
		disposeRuntimeKeyNow,
		disposeManagedSession,
		rememberAdvertisedScopedCatalog,
		getAdvertisedScopedCatalog
	};
}
//#endregion
//#region src/agents/agent-bundle-mcp-manager.ts
/** Session MCP runtime manager: get-or-create and requester-scoped install orchestration. */
/** Bound from agent-bundle-mcp-runtime.ts to avoid an import cycle with the facade. */
let defaultCreateSessionMcpRuntime;
function setDefaultCreateSessionMcpRuntime(fn) {
	defaultCreateSessionMcpRuntime = fn;
}
function resolveCreateSessionMcpRuntime(createRuntime) {
	const resolved = createRuntime ?? defaultCreateSessionMcpRuntime;
	if (!resolved) throw new Error("Session MCP runtime factory is not bound");
	return resolved;
}
function createSessionMcpRuntimeManager(opts = {}) {
	const store = createSessionMcpRuntimeManagerStore(opts, resolveCreateSessionMcpRuntime(opts.createRuntime));
	const lifecycle = createSessionMcpRuntimeManagerLifecycle(store);
	const install = createSessionMcpRuntimeManagerInstall(lifecycle);
	const manager = {
		async getOrCreate(params) {
			const idleTtlMs = resolveSessionMcpRuntimeIdleTtlMs(params.cfg);
			await lifecycle.sweepIdleRuntimes();
			if (idleTtlMs > 0) lifecycle.ensureIdleSweepTimer();
			if (params.sessionKey) store.sessionIdBySessionKey.set(params.sessionKey, params.sessionId);
			const fullConfig = loadSessionMcpConfig({
				workspaceDir: params.workspaceDir,
				cfg: params.cfg,
				logDiagnostics: false,
				manifestRegistry: params.manifestRegistry
			});
			const safeServerNamesByServer = require_agent_bundle_mcp_names.assignSafeServerNames(Object.keys(fullConfig.loaded.mcpServers));
			const { staticServers, requesterScopedServerNames } = require_mcp_auth_profile.partitionMcpServersByConnectionScope(fullConfig.loaded.mcpServers);
			if (!(requesterScopedServerNames.length > 0)) return await install.getOrCreateRuntimeEntry({
				runtimeKey: params.sessionId,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				cfg: params.cfg,
				manifestRegistry: params.manifestRegistry,
				idleTtlMs,
				safeServerNamesByServer
			});
			const parts = [];
			const scopedNameSet = new Set(requesterScopedServerNames);
			let emptyStaticRuntime;
			if (Object.keys(staticServers).length > 0) parts.push(await install.getOrCreateRuntimeEntry({
				runtimeKey: params.sessionId,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				cfg: params.cfg,
				manifestRegistry: params.manifestRegistry,
				idleTtlMs,
				excludeServerNames: scopedNameSet,
				safeServerNamesByServer
			}));
			else emptyStaticRuntime = await install.getOrCreateRuntimeEntry({
				runtimeKey: params.sessionId,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				cfg: params.cfg,
				manifestRegistry: params.manifestRegistry,
				idleTtlMs,
				includeServerNames: /* @__PURE__ */ new Set(),
				safeServerNamesByServer
			});
			const requesterSenderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderId);
			if (requesterSenderId) {
				const requesterScope = {
					requesterSenderId,
					...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) ? { agentAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) } : {},
					...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) ? { messageChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) } : {}
				};
				const runtimeKey = require_mcp_auth_profile.buildMcpRequesterRuntimeCacheKey({
					sessionId: params.sessionId,
					messageChannel: params.messageChannel,
					agentAccountId: params.agentAccountId,
					requesterSenderId
				});
				const { fingerprint: fullScopedFingerprint } = loadSessionMcpConfig({
					workspaceDir: params.workspaceDir,
					cfg: params.cfg,
					logDiagnostics: false,
					manifestRegistry: params.manifestRegistry,
					includeServerNames: scopedNameSet,
					redactConnectionServerNames: scopedNameSet,
					safeServerNamesByServer
				});
				const scopedRuntime = await lifecycle.runExclusiveOnRuntimeKey(runtimeKey, () => install.resolveAndInstallRequesterRuntime({
					runtimeKey,
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					workspaceDir: params.workspaceDir,
					agentDir: params.agentDir,
					cfg: params.cfg,
					manifestRegistry: params.manifestRegistry,
					idleTtlMs,
					requesterScopedServerNames,
					scopedNameSet,
					safeServerNamesByServer,
					fullScopedFingerprint,
					requesterSenderId,
					agentAccountId: params.agentAccountId,
					messageChannel: params.messageChannel,
					requesterScope
				}));
				if (scopedRuntime) parts.push(scopedRuntime);
				await lifecycle.enforceRequesterRuntimeCap(params.sessionId, runtimeKey);
			}
			if (parts.length === 0) return emptyStaticRuntime ?? await install.getOrCreateRuntimeEntry({
				runtimeKey: params.sessionId,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				cfg: params.cfg,
				manifestRegistry: params.manifestRegistry,
				idleTtlMs,
				includeServerNames: /* @__PURE__ */ new Set(),
				safeServerNamesByServer
			});
			return createCombinedSessionMcpRuntime({
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				parts
			});
		},
		async getOrCreateRequesterScoped(params) {
			const idleTtlMs = resolveSessionMcpRuntimeIdleTtlMs(params.cfg);
			await lifecycle.sweepIdleRuntimes();
			if (idleTtlMs > 0) lifecycle.ensureIdleSweepTimer();
			if (params.sessionKey) store.sessionIdBySessionKey.set(params.sessionKey, params.sessionId);
			const requesterSenderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderId);
			if (!requesterSenderId) return;
			const fullConfig = loadSessionMcpConfig({
				workspaceDir: params.workspaceDir,
				cfg: params.cfg,
				logDiagnostics: false,
				manifestRegistry: params.manifestRegistry
			});
			const { requesterScopedServerNames } = require_mcp_auth_profile.partitionMcpServersByConnectionScope(fullConfig.loaded.mcpServers);
			if (requesterScopedServerNames.length === 0) return;
			const safeServerNamesByServer = require_agent_bundle_mcp_names.assignSafeServerNames(Object.keys(fullConfig.loaded.mcpServers));
			const scopedNameSet = new Set(requesterScopedServerNames);
			const requesterScope = {
				requesterSenderId,
				...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) ? { agentAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentAccountId) } : {},
				...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) ? { messageChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageChannel) } : {}
			};
			const runtimeKey = require_mcp_auth_profile.buildMcpRequesterRuntimeCacheKey({
				sessionId: params.sessionId,
				messageChannel: params.messageChannel,
				agentAccountId: params.agentAccountId,
				requesterSenderId
			});
			const { fingerprint: fullScopedFingerprint } = loadSessionMcpConfig({
				workspaceDir: params.workspaceDir,
				cfg: params.cfg,
				logDiagnostics: false,
				manifestRegistry: params.manifestRegistry,
				includeServerNames: scopedNameSet,
				redactConnectionServerNames: scopedNameSet,
				safeServerNamesByServer
			});
			const scopedRuntime = await lifecycle.runExclusiveOnRuntimeKey(runtimeKey, () => install.resolveAndInstallRequesterRuntime({
				runtimeKey,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				cfg: params.cfg,
				manifestRegistry: params.manifestRegistry,
				idleTtlMs,
				requesterScopedServerNames,
				scopedNameSet,
				safeServerNamesByServer,
				fullScopedFingerprint,
				requesterSenderId,
				agentAccountId: params.agentAccountId,
				messageChannel: params.messageChannel,
				requesterScope
			}));
			if (scopedRuntime) await lifecycle.enforceRequesterRuntimeCap(params.sessionId, runtimeKey);
			return scopedRuntime;
		},
		rememberAdvertisedScopedCatalog: lifecycle.rememberAdvertisedScopedCatalog,
		getAdvertisedScopedCatalog: lifecycle.getAdvertisedScopedCatalog,
		bindSessionKey(sessionKey, sessionId) {
			store.sessionIdBySessionKey.set(sessionKey, sessionId);
		},
		resolveSessionId(sessionKey) {
			return store.sessionIdBySessionKey.get(sessionKey);
		},
		peekSession(params) {
			const sessionId = params.sessionId ?? (params.sessionKey ? store.sessionIdBySessionKey.get(params.sessionKey) : void 0);
			return sessionId ? store.runtimesBySessionId.get(sessionId) : void 0;
		},
		async disposeSession(sessionId) {
			await lifecycle.disposeManagedSession(sessionId);
		},
		deferRetirement(sessionId) {
			if (lifecycle.runtimeKeysForSessionId(sessionId).length === 0) return false;
			store.deferredRetirementSessionIds.add(sessionId);
			return true;
		},
		async completeDeferredRetirement(sessionId, runtime) {
			if (!store.deferredRetirementSessionIds.has(sessionId) || runtime.sessionId !== sessionId) return false;
			if (lifecycle.totalActiveLeasesForSessionId(sessionId) > 0 || (runtime.activeLeases ?? 0) > 0) return false;
			const managed = lifecycle.runtimeKeysForSessionId(sessionId).map((runtimeKey) => store.runtimesBySessionId.get(runtimeKey)).filter((entry) => Boolean(entry));
			if (managed.length === 0) return false;
			const managedSet = new Set(managed);
			if (isCombinedSessionMcpRuntime(runtime)) {
				if (!runtime.managedParts.every((part) => managedSet.has(part))) return false;
			} else if (!managedSet.has(runtime)) return false;
			await lifecycle.disposeManagedSession(sessionId);
			return true;
		},
		async disposeAll() {
			lifecycle.clearIdleSweepTimer();
			const chains = Array.from(store.requesterWorkChains.values());
			store.requesterWorkChains.clear();
			await Promise.allSettled(chains);
			const inFlightRuntimes = Array.from(store.createInFlight.values());
			store.createInFlight.clear();
			const runtimes = Array.from(store.runtimesBySessionId.values());
			store.runtimesBySessionId.clear();
			store.sessionIdBySessionKey.clear();
			store.idleTtlMsBySessionId.clear();
			store.deferredRetirementSessionIds.clear();
			store.connectionMetaByRuntimeKey.clear();
			store.advertisedScopedCatalogBySessionId.clear();
			const lateRuntimes = await Promise.all(inFlightRuntimes.map(async ({ promise }) => await promise.catch(() => void 0)));
			const allRuntimes = new Set(runtimes);
			for (const runtime of lateRuntimes) if (runtime) allRuntimes.add(runtime);
			await Promise.allSettled(Array.from(allRuntimes, (runtime) => runtime.dispose()));
		},
		sweepIdleRuntimes: lifecycle.sweepIdleRuntimes,
		listSessionIds() {
			return [...new Set(Array.from(store.runtimesBySessionId.values(), (runtime) => runtime.sessionId))].toSorted((a, b) => a.localeCompare(b));
		},
		listRuntimeKeys() {
			return Array.from(store.runtimesBySessionId.keys()).toSorted((a, b) => a.localeCompare(b));
		},
		totalActiveLeasesForSession(sessionId) {
			return lifecycle.totalActiveLeasesForSessionId(sessionId);
		}
	};
	Object.assign(manager, { bookkeepingSizesForTest: () => ({
		runtimes: store.runtimesBySessionId.size,
		connectionMeta: store.connectionMetaByRuntimeKey.size,
		createInFlight: store.createInFlight.size,
		requesterWorkChains: store.requesterWorkChains.size,
		sessionKeys: store.sessionIdBySessionKey.size,
		idleTtl: store.idleTtlMsBySessionId.size,
		deferredRetirement: store.deferredRetirementSessionIds.size,
		advertisedScopedCatalogs: store.advertisedScopedCatalogBySessionId.size
	}) });
	return manager;
}
//#endregion
//#region src/agents/agent-bundle-mcp-manager-api.ts
/** Module-level session MCP runtime manager entry APIs. */
function getSessionMcpRuntimeManager() {
	return require_global_singleton.resolveGlobalSingleton(SESSION_MCP_RUNTIME_MANAGER_KEY, createSessionMcpRuntimeManager);
}
async function getOrCreateSessionMcpRuntime(params) {
	return await getSessionMcpRuntimeManager().getOrCreate(params);
}
/** Looks up an existing session MCP runtime without creating it or connecting transports. */
function peekSessionMcpRuntime(params) {
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionId);
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	return getSessionMcpRuntimeManager().peekSession({
		...sessionId ? { sessionId } : {},
		...sessionKey ? { sessionKey } : {}
	});
}
async function disposeSessionMcpRuntime(sessionId) {
	await getSessionMcpRuntimeManager().disposeSession(sessionId);
}
async function retireSessionMcpRuntime(params) {
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionId);
	if (!sessionId) return false;
	const manager = getSessionMcpRuntimeManager();
	if (params.preserveActiveLeases === true && manager.totalActiveLeasesForSession(sessionId) > 0) {
		manager.deferRetirement(sessionId);
		return true;
	}
	try {
		await disposeSessionMcpRuntime(sessionId);
		return true;
	} catch (error) {
		params.onError?.(error, sessionId, params.reason);
		return false;
	}
}
/** Completes a one-shot retirement after its final run, view, or request lease releases. */
async function completeDeferredSessionMcpRuntimeRetirement(runtime) {
	return await getSessionMcpRuntimeManager().completeDeferredRetirement(runtime.sessionId, runtime);
}
async function retireSessionMcpRuntimeForSessionKey(params) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	if (!sessionKey) return false;
	return await retireSessionMcpRuntime({
		sessionId: getSessionMcpRuntimeManager().resolveSessionId(sessionKey),
		reason: params.reason,
		preserveActiveLeases: params.preserveActiveLeases,
		onError: params.onError
	});
}
async function disposeAllSessionMcpRuntimes() {
	await getSessionMcpRuntimeManager().disposeAll();
}
//#endregion
//#region src/agents/mcp-json-schema-validator.ts
const DRAFT_2020_12_SCHEMA = "https://json-schema.org/draft/2020-12/schema";
function isDraft202012Schema(schema) {
	return schema.$schema === DRAFT_2020_12_SCHEMA;
}
function formatTypeBoxErrors(errors) {
	return errors.map((error) => {
		const message = error.message?.trim() || "schema validation failed";
		return error.instancePath ? `${error.instancePath} ${message}` : message;
	}).join(", ") || "schema validation failed";
}
const schemaMapKeywords = /* @__PURE__ */ new Set([
	"$defs",
	"definitions",
	"dependentSchemas",
	"patternProperties",
	"properties"
]);
const schemaValueKeywords = /* @__PURE__ */ new Set([
	"additionalItems",
	"additionalProperties",
	"contains",
	"else",
	"if",
	"items",
	"not",
	"propertyNames",
	"then",
	"unevaluatedItems",
	"unevaluatedProperties"
]);
const schemaArrayKeywords = /* @__PURE__ */ new Set([
	"allOf",
	"anyOf",
	"oneOf",
	"prefixItems"
]);
function stripSchemaMapFormats(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, stripJsonSchemaFormats(entry)]));
}
function expandJsonSchemaTypeArray(schema) {
	const { type, ...rest } = schema;
	if (!Array.isArray(type)) return schema;
	return { anyOf: type.map((entry) => Object.assign({}, rest, { type: entry })) };
}
function stripJsonSchemaFormats(schema) {
	if (Array.isArray(schema)) return schema.map((entry) => stripJsonSchemaFormats(entry));
	if (!schema || typeof schema !== "object") return schema;
	const normalizedSchema = expandJsonSchemaTypeArray(schema);
	return Object.fromEntries(Object.entries(normalizedSchema).filter(([key]) => key !== "format").map(([key, value]) => {
		if (schemaMapKeywords.has(key)) return [key, stripSchemaMapFormats(value)];
		if (key === "dependencies") return [key, stripSchemaMapFormats(value)];
		if (schemaValueKeywords.has(key) || schemaArrayKeywords.has(key)) return [key, stripJsonSchemaFormats(value)];
		return [key, value];
	}));
}
/** MCP SDK validator with draft-2020-12 support for external tool schemas. */
function createMcpJsonSchemaValidator() {
	const defaultValidator = new _modelcontextprotocol_sdk_validation_ajv_provider_js.AjvJsonSchemaValidator();
	return { getValidator(schema) {
		if (!isDraft202012Schema(schema)) return defaultValidator.getValidator(schema);
		let validator;
		try {
			const schemaError = require_schema_validator.findJsonSchemaShapeError(schema);
			if (schemaError) throw new Error(schemaError);
			validator = (0, typebox_compile.Compile)(require_schema_validator.normalizeJsonSchemaForTypeBox(stripJsonSchemaFormats(schema)));
		} catch (error) {
			const setupError = (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "schema setup failed");
			throw new Error(`Invalid MCP draft-2020-12 JSON Schema: ${setupError.message}`, { cause: error });
		}
		return (input) => {
			if (validator.Check(input)) return {
				valid: true,
				data: input,
				errorMessage: void 0
			};
			return {
				valid: false,
				data: void 0,
				errorMessage: formatTypeBoxErrors([...validator.Errors(input)])
			};
		};
	} };
}
//#endregion
//#region src/agents/mcp-metadata.ts
const MCP_METADATA_TEXT_LIMIT = 1200;
/** Scrubs untrusted MCP metadata before exposing it to a model. */
function sanitizeMcpMetadataText(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!normalized) return;
	const scrubbed = normalized.replace(/ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/gi, "[redacted MCP metadata instruction]").replace(/disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/gi, "[redacted MCP metadata instruction]").replace(/system\s+prompt/gi, "system prompt");
	return scrubbed.length > MCP_METADATA_TEXT_LIMIT ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(scrubbed, MCP_METADATA_TEXT_LIMIT)}...` : scrubbed;
}
//#endregion
//#region src/agents/mcp-stdio-transport.ts
/**
* Operator stdio transport wrapper for MCP server subprocesses.
*/
const CLOSE_TIMEOUT_MS = 2e3;
const SIGKILL_REAP_TIMEOUT_MS = 500;
function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms).unref();
	});
}
var OperatorStdioClientTransport = class {
	constructor(serverParams) {
		this.serverParams = serverParams;
		this.readBuffer = new _modelcontextprotocol_sdk_shared_stdio_js.ReadBuffer();
		this.stderrStream = null;
		if (serverParams.stderr === "pipe" || serverParams.stderr === "overlapped") this.stderrStream = new node_stream.PassThrough();
	}
	async start() {
		if (this.process) throw new Error("OperatorStdioClientTransport already started; Client.connect() starts transports automatically.");
		await new Promise((resolve, reject) => {
			const baseEnv = {
				...(0, _modelcontextprotocol_sdk_client_stdio_js.getDefaultEnvironment)(),
				...this.serverParams.env
			};
			const preparedSpawn = require_linux_oom_score.prepareOomScoreAdjustedSpawn(this.serverParams.command, this.serverParams.args ?? [], { env: baseEnv });
			const child = (0, node_child_process.spawn)(preparedSpawn.command, preparedSpawn.args, {
				cwd: this.serverParams.cwd,
				detached: node_process.default.platform !== "win32",
				env: preparedSpawn.env,
				shell: false,
				stdio: [
					"pipe",
					"pipe",
					this.serverParams.stderr ?? "inherit"
				],
				windowsHide: node_process.default.platform === "win32"
			});
			this.process = child;
			child.on("error", (error) => {
				reject(error);
				this.onerror?.(error);
			});
			child.on("spawn", () => resolve());
			child.on("close", () => {
				this.process = void 0;
				this.onclose?.();
			});
			child.stdin?.on("error", (error) => this.onerror?.(error));
			child.stdout?.on("data", (chunk) => {
				this.readBuffer.append(chunk);
				this.processReadBuffer();
			});
			child.stdout?.on("error", (error) => this.onerror?.(error));
			if (this.stderrStream && child.stderr) {
				child.stderr.on("error", (error) => this.onerror?.(error));
				child.stderr.pipe(this.stderrStream);
			}
		});
	}
	get stderr() {
		return this.stderrStream ?? this.process?.stderr ?? null;
	}
	get pid() {
		return this.process?.pid ?? this.closingProcess?.pid ?? null;
	}
	processReadBuffer() {
		while (true) try {
			const message = this.readBuffer.readMessage();
			if (message === null) break;
			this.onmessage?.(message);
		} catch (error) {
			this.onerror?.(error instanceof Error ? error : new Error(String(error)));
		}
	}
	async close() {
		const processToClose = this.process ?? this.closingProcess;
		this.process = void 0;
		this.closingProcess = processToClose;
		if (processToClose) this.closingProcess = processToClose;
		if (processToClose) {
			const closePromise = new Promise((resolve) => {
				processToClose.once("close", () => resolve());
			});
			try {
				processToClose.stdin?.end();
			} catch {}
			await Promise.race([closePromise, delay(CLOSE_TIMEOUT_MS)]);
			if (processToClose.exitCode === null && processToClose.pid) {
				require_kill_tree.killProcessTree(processToClose.pid);
				await Promise.race([closePromise, delay(CLOSE_TIMEOUT_MS)]);
				if (processToClose.exitCode === null && processToClose.pid) {
					require_kill_tree.signalProcessTree(processToClose.pid, "SIGKILL");
					await Promise.race([closePromise, delay(SIGKILL_REAP_TIMEOUT_MS)]);
				}
			}
		}
		if (this.closingProcess === processToClose) this.closingProcess = void 0;
		this.readBuffer.clear();
	}
	async forceClose() {
		const processToClose = this.process ?? this.closingProcess;
		this.process = void 0;
		if (processToClose?.pid && processToClose.exitCode === null) {
			const closePromise = new Promise((resolve) => {
				processToClose.once("close", () => resolve());
			});
			require_kill_tree.signalProcessTree(processToClose.pid, "SIGKILL");
			await Promise.race([closePromise, delay(SIGKILL_REAP_TIMEOUT_MS)]);
		}
		if (this.closingProcess === processToClose) this.closingProcess = void 0;
		this.readBuffer.clear();
	}
	send(message) {
		return new Promise((resolve, reject) => {
			const stdin = this.process?.stdin;
			if (!stdin) throw new Error("Not connected");
			const json = (0, _modelcontextprotocol_sdk_shared_stdio_js.serializeMessage)(message);
			try {
				if (!stdin.write(json, (err) => {
					if (err) reject(err);
					else resolve();
				})) stdin.once("drain", () => {});
			} catch (err) {
				reject(err instanceof Error ? err : new Error(String(err)));
			}
		});
	}
};
//#endregion
//#region src/agents/mcp-transport.ts
/**
* MCP client transport factory.
*
* This module turns normalized MCP server config into stdio, SSE, or
* streamable-HTTP SDK transports with Operator auth, redirect, and logging rules.
*/
function attachStderrLogging(serverName, transport) {
	const stderr = transport.stderr;
	if (!stderr || typeof stderr.on !== "function") return;
	const onData = (chunk) => {
		const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typeof chunk === "string" ? chunk : String(chunk)) ?? "";
		if (!message) return;
		for (const line of message.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (trimmed) require_logger.logDebug(`bundle-mcp:${serverName}: ${trimmed}`);
		}
	};
	stderr.on("data", onData);
	return () => {
		if (typeof stderr.off === "function") stderr.off("data", onData);
		else if (typeof stderr.removeListener === "function") stderr.removeListener("data", onData);
	};
}
function buildSseEventSourceFetch(headers, baseFetch) {
	return (url, init) => {
		const mergedHeaders = {};
		for (const [key, value] of new Headers(init?.headers)) mergedHeaders[key.toLowerCase()] = value;
		for (const [key, value] of Object.entries(headers)) mergedHeaders[key.toLowerCase()] = value;
		return baseFetch(url, {
			...init,
			headers: mergedHeaders
		});
	};
}
/** Resolves a configured MCP server into a live SDK transport instance. */
function resolveMcpTransport(serverName, rawServer, options) {
	const resolved = require_mcp_auth_profile.resolveMcpTransportConfig(serverName, rawServer);
	if (!resolved) return null;
	if (resolved.kind === "stdio") {
		const transport = new OperatorStdioClientTransport({
			command: resolved.command,
			args: resolved.args,
			env: resolved.env,
			cwd: resolved.cwd,
			stderr: "pipe"
		});
		return {
			transport,
			description: resolved.description,
			transportType: "stdio",
			connectionTimeoutMs: resolved.connectionTimeoutMs,
			requestTimeoutMs: resolved.requestTimeoutMs,
			supportsParallelToolCalls: resolved.supportsParallelToolCalls,
			detachStderr: attachStderrLogging(serverName, transport)
		};
	}
	const authProfileId = require_mcp_auth_profile.resolveMcpAuthProfileId(rawServer);
	const authProvider = resolved.auth === "oauth" && !authProfileId ? require_mcp_auth_profile.createMcpOAuthClientProvider({
		serverName,
		serverUrl: resolved.url,
		config: resolved.oauth
	}) : void 0;
	const baseFetch = require_mcp_auth_profile.buildMcpHttpFetch({
		sslVerify: resolved.sslVerify,
		clientCert: resolved.clientCert,
		clientKey: resolved.clientKey,
		resourceUrl: resolved.url
	});
	const headers = resolved.auth === "oauth" || authProfileId ? require_mcp_auth_profile.withoutMcpAuthorizationHeader(resolved.headers) : resolved.headers;
	const httpFetch = authProfileId ? require_mcp_auth_profile.withMcpAuthProfileBearer({
		fetchFn: baseFetch,
		serverName,
		resourceUrl: resolved.url,
		headers,
		authProfileId,
		cfg: options?.cfg,
		agentDir: options?.agentDir
	}) : resolved.auth === "oauth" ? require_mcp_auth_profile.withSameOriginMcpHttpHeaders({
		fetchFn: baseFetch,
		headers,
		resourceUrl: resolved.url
	}) : baseFetch;
	if (resolved.transportType === "streamable-http") return {
		transport: new _modelcontextprotocol_sdk_client_streamableHttp_js.StreamableHTTPClientTransport(new URL(resolved.url), {
			requestInit: resolved.auth === "oauth" || !headers ? void 0 : { headers },
			fetch: httpFetch,
			authProvider
		}),
		description: resolved.description,
		transportType: "streamable-http",
		connectionTimeoutMs: resolved.connectionTimeoutMs,
		requestTimeoutMs: resolved.requestTimeoutMs,
		supportsParallelToolCalls: resolved.supportsParallelToolCalls
	};
	const sseHeaders = { ...headers };
	const hasHeaders = Object.keys(sseHeaders).length > 0;
	return {
		transport: new _modelcontextprotocol_sdk_client_sse_js.SSEClientTransport(new URL(resolved.url), {
			requestInit: resolved.auth === "oauth" || !hasHeaders ? void 0 : { headers: sseHeaders },
			fetch: httpFetch,
			eventSourceInit: { fetch: buildSseEventSourceFetch(resolved.auth === "oauth" ? {} : sseHeaders, httpFetch) },
			authProvider
		}),
		description: resolved.description,
		transportType: "sse",
		connectionTimeoutMs: resolved.connectionTimeoutMs,
		requestTimeoutMs: resolved.requestTimeoutMs,
		supportsParallelToolCalls: resolved.supportsParallelToolCalls
	};
}
//#endregion
//#region src/agents/agent-bundle-mcp-runtime.ts
/** Session-scoped MCP runtime catalog loader and transport lifecycle. */
var agent_bundle_mcp_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createBundleMcpJsonSchemaValidator: () => createMcpJsonSchemaValidator,
	createSessionMcpRuntime: () => createSessionMcpRuntime
});
const MCP_APPS_CLIENT_EXTENSION = "io.modelcontextprotocol/ui";
const MCP_APP_RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
const BUNDLE_MCP_FAILURE_THRESHOLD = 3;
const BUNDLE_MCP_FAILURE_COOLDOWN_MS = 6e4;
const BUNDLE_MCP_CATALOG_LIST_TIMEOUT_MS = 1500;
const BUNDLE_MCP_DISPOSE_TIMEOUT_MS = 5e3;
const BUNDLE_MCP_CATALOG_CONNECT_CONCURRENCY = 6;
const BUNDLE_MCP_TEST_STATE_KEY = Symbol.for("operator.bundleMcpTestState");
function getBundleMcpTestState() {
	const globalStore = globalThis;
	const existing = globalStore[BUNDLE_MCP_TEST_STATE_KEY];
	if (existing) return existing;
	const state = {};
	globalStore[BUNDLE_MCP_TEST_STATE_KEY] = state;
	return state;
}
function connectWithTimeout(client, transport, timeoutMs) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error(`MCP server connection timed out after ${timeoutMs}ms`)), timeoutMs);
		client.connect(transport).then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (error) => {
			clearTimeout(timer);
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Non-Error rejection"));
		});
	});
}
function redactErrorUrls(error) {
	return (0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(String(error));
}
async function listAllTools(client, timeoutMs) {
	const tools = [];
	let cursor;
	do {
		const params = cursor ? { cursor } : void 0;
		const page = await client.listTools(params, { timeout: timeoutMs });
		tools.push(...page.tools);
		cursor = page.nextCursor;
	} while (cursor);
	return tools;
}
function isMcpMethodNotFoundError(error) {
	if (require_mcp_stdio.isMcpConfigRecord(error) && error.code === _modelcontextprotocol_sdk_types_js.ErrorCode.MethodNotFound) return true;
	const message = String(error);
	return message.includes("-32601") || /method not found/i.test(message);
}
async function listAllToolsBestEffort(params) {
	try {
		return await listAllTools(params.client, params.timeoutMs);
	} catch (error) {
		if (params.suppressUnsupported && isMcpMethodNotFoundError(error)) return [];
		throw error;
	}
}
function hasConfiguredMcpRequestTimeout(rawServer) {
	if (!rawServer || typeof rawServer !== "object") return false;
	const record = rawServer;
	for (const key of ["requestTimeoutMs", "timeout"]) {
		const value = record[key];
		if (typeof value === "number" && Number.isFinite(value) && value > 0) return true;
	}
	return false;
}
function getCatalogListTimeoutMs(rawServer, requestTimeoutMs) {
	return hasConfiguredMcpRequestTimeout(rawServer) ? requestTimeoutMs : BUNDLE_MCP_CATALOG_LIST_TIMEOUT_MS;
}
function buildMcpClientCapabilities(mcpAppsEnabled) {
	return mcpAppsEnabled ? { extensions: { [MCP_APPS_CLIENT_EXTENSION]: { mimeTypes: [MCP_APP_RESOURCE_MIME_TYPE] } } } : {};
}
function buildMcpClientOptions(mcpAppsEnabled) {
	return { capabilities: buildMcpClientCapabilities(mcpAppsEnabled) };
}
async function listAllResources(client, timeoutMs) {
	const resources = [];
	let cursor;
	do {
		const params = cursor ? { cursor } : void 0;
		const page = await client.listResources(params, { timeout: timeoutMs });
		resources.push(...page.resources);
		cursor = page.nextCursor;
	} while (cursor);
	return resources;
}
async function listAllPrompts(client, timeoutMs) {
	const prompts = [];
	let cursor;
	do {
		const params = cursor ? { cursor } : void 0;
		const page = await client.listPrompts(params, { timeout: timeoutMs });
		prompts.push(...page.prompts);
		cursor = page.nextCursor;
	} while (cursor);
	return prompts;
}
function normalizeStringList(value) {
	if (!Array.isArray(value)) return;
	const entries = value.filter((entry) => typeof entry === "string");
	return entries.length > 0 ? entries : void 0;
}
function normalizeToolUiVisibility(value) {
	if (!Array.isArray(value)) return;
	const normalized = value.filter((entry) => entry === "app" || entry === "model");
	return [...new Set(normalized)].toSorted();
}
function getMcpToolSelection(rawServer) {
	if (!require_mcp_stdio.isMcpConfigRecord(rawServer) || !require_mcp_stdio.isMcpConfigRecord(rawServer.toolFilter)) return {};
	return {
		include: normalizeStringList(rawServer.toolFilter.include),
		exclude: normalizeStringList(rawServer.toolFilter.exclude)
	};
}
function shouldExposeMcpTool(selection, toolName) {
	const include = selection.include ?? [];
	const exclude = selection.exclude ?? [];
	if (include.length > 0 && !include.some((pattern) => matchesMcpToolFilterPattern(pattern, toolName))) return false;
	return !exclude.some((pattern) => matchesMcpToolFilterPattern(pattern, toolName));
}
function summarizeServerCapabilities(capabilities) {
	return {
		resources: capabilities?.resources ? { listChanged: capabilities.resources.listChanged === true } : void 0,
		prompts: capabilities?.prompts ? { listChanged: capabilities.prompts.listChanged === true } : void 0,
		tools: capabilities?.tools ? { listChanged: capabilities.tools.listChanged === true } : void 0
	};
}
async function settleWithin(promise, timeoutMs) {
	let timer;
	return await Promise.race([promise.then(() => true, () => true), new Promise((resolve) => {
		timer = setTimeout(() => {
			resolve();
		}, timeoutMs);
		timer.unref?.();
	}).then(() => false)]).finally(() => {
		if (timer) clearTimeout(timer);
	});
}
async function disposeSession(session) {
	session.detachStderr?.();
	const timeoutMs = getBundleMcpTestState().disposeTimeoutMs ?? BUNDLE_MCP_DISPOSE_TIMEOUT_MS;
	if (!await settleWithin((async () => {
		if (session.transportType === "streamable-http") await session.transport.terminateSession().catch(() => {});
		await session.transport.close().catch(() => {});
		await session.client.close().catch(() => {});
	})(), timeoutMs)) {
		const transportClose = session.transport instanceof OperatorStdioClientTransport ? session.transport.forceClose() : session.transport.close();
		await settleWithin(Promise.allSettled([transportClose, session.client.close()]), timeoutMs);
	}
}
function createDisposedError(sessionId) {
	return /* @__PURE__ */ new Error(`bundle-mcp runtime disposed for session ${sessionId}`);
}
function createSessionMcpRuntime(params) {
	const { loaded, fingerprint: computedFingerprint } = loadSessionMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.cfg,
		logDiagnostics: true,
		manifestRegistry: params.manifestRegistry,
		includeServerNames: params.includeServerNames,
		excludeServerNames: params.excludeServerNames,
		redactConnectionServerNames: params.redactConnectionServerNames,
		safeServerNamesByServer: params.safeServerNamesByServer
	});
	const configFingerprint = params.configFingerprint ?? computedFingerprint;
	const mcpAppsEnabled = params.cfg?.mcp?.apps?.enabled === true;
	const createdAt = Date.now();
	let lastUsedAt = createdAt;
	let activeLeases = 0;
	let disposed = false;
	let catalog = null;
	let catalogInFlight;
	let catalogInvalidationGeneration = 0;
	const sessions = /* @__PURE__ */ new Map();
	const serverBackoff = /* @__PURE__ */ new Map();
	const recordServerToolFailure = (serverName, nowMs) => {
		const failures = (serverBackoff.get(serverName)?.failures ?? 0) + 1;
		const nextBackoff = { failures };
		if (failures >= BUNDLE_MCP_FAILURE_THRESHOLD) nextBackoff.retryAfterMs = nowMs + BUNDLE_MCP_FAILURE_COOLDOWN_MS;
		serverBackoff.set(serverName, nextBackoff);
	};
	const runGuardedServerRequest = async (serverName, request, options) => {
		const tracksFailureBackoff = options?.failureBackoff !== "ignore";
		const nowMs = Date.now();
		const backoff = serverBackoff.get(serverName);
		if (tracksFailureBackoff && backoff?.retryAfterMs && nowMs < backoff.retryAfterMs) throw new Error(`bundle-mcp server "${serverName}" is paused after repeated tool failures; retry after ${new Date(backoff.retryAfterMs).toISOString()}`);
		try {
			const result = await request();
			if (tracksFailureBackoff) serverBackoff.delete(serverName);
			return result;
		} catch (error) {
			if (tracksFailureBackoff) recordServerToolFailure(serverName, nowMs);
			throw error;
		}
	};
	const failIfDisposed = () => {
		if (disposed) throw createDisposedError(params.sessionId);
	};
	const requireConnectedSession = (serverName) => {
		const session = sessions.get(serverName);
		if (!session?.connected) throw new Error(session?.disconnectReason ? `bundle-mcp server "${serverName}" is disconnected: ${session.disconnectReason}` : `bundle-mcp server "${serverName}" is not connected`);
		return session;
	};
	const ensureSessionConnected = async (session, connectionTimeoutMs) => {
		if (session.retiring) throw new Error(`bundle-mcp server "${session.serverName}" is retiring`);
		if (session.connected) return;
		session.connectPromise ??= connectWithTimeout(session.client, session.transport, connectionTimeoutMs).then(() => {
			session.connected = true;
		}).finally(() => {
			session.connectPromise = void 0;
		});
		await session.connectPromise;
	};
	const retireSessionIfCurrent = async (serverName, session) => {
		if (sessions.get(serverName) !== session) return false;
		session.retiring = true;
		sessions.delete(serverName);
		await disposeSession(session);
		return true;
	};
	const getCatalog = async () => {
		failIfDisposed();
		if (catalog) return catalog;
		if (catalogInFlight) return catalogInFlight;
		const catalogGeneration = catalogInvalidationGeneration;
		const inFlight = (async () => {
			if (Object.keys(loaded.mcpServers).length === 0) return {
				version: 1,
				generatedAt: Date.now(),
				servers: {},
				tools: []
			};
			const servers = {};
			const tools = [];
			const diagnostics = [];
			const safeServerNamesByServer = params.safeServerNamesByServer ?? require_agent_bundle_mcp_names.assignSafeServerNames(Object.keys(loaded.mcpServers));
			const usedServerNames = new Set([...safeServerNamesByServer.values()].map((name) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name)));
			try {
				const preparedEntries = [];
				for (const [serverName, rawServer] of Object.entries(loaded.mcpServers)) {
					failIfDisposed();
					const override = params.connectionOverrides?.get(serverName);
					const resolved = resolveMcpTransport(serverName, override ? require_mcp_auth_profile.applyMcpConnectionOverride(rawServer, override) : rawServer, {
						cfg: params.cfg,
						agentDir: params.agentDir
					});
					if (!resolved) continue;
					const safeServerName = safeServerNamesByServer.get(serverName) ?? require_agent_bundle_mcp_names.sanitizeServerName(serverName, usedServerNames);
					if (safeServerName !== serverName) require_logger.logWarn(`bundle-mcp: server key "${serverName}" registered as "${safeServerName}" for provider-safe tool names.`);
					const launchDescription = override ? `${serverName}: requester-scoped connection` : resolved.description;
					preparedEntries.push({
						serverName,
						rawServer,
						resolved,
						safeServerName,
						launchDescription
					});
				}
				const { results, firstError, hasError } = await require_resolve.runTasksWithConcurrency({
					tasks: preparedEntries.map(({ serverName, rawServer, resolved, safeServerName, launchDescription }) => async () => {
						failIfDisposed();
						let session = sessions.get(serverName);
						while (session && !session.retiring && !session.connected && !session.connectPromise) {
							await retireSessionIfCurrent(serverName, session);
							session = sessions.get(serverName);
						}
						if (session?.retiring) session = void 0;
						const reusedSession = Boolean(session);
						if (!session) {
							const client = new _modelcontextprotocol_sdk_client_index_js.Client({
								name: "operator-bundle-mcp",
								version: "0.0.0"
							}, {
								...buildMcpClientOptions(mcpAppsEnabled),
								jsonSchemaValidator: createMcpJsonSchemaValidator(),
								listChanged: { tools: {
									autoRefresh: false,
									debounceMs: 0,
									onChanged: (error) => {
										if (error) require_logger.logWarn(`bundle-mcp: failed to refresh changed tool list for server "${serverName}": ${redactErrorUrls(error)}`);
										catalogInvalidationGeneration += 1;
										catalog = null;
										catalogInFlight = void 0;
									}
								} }
							});
							const createdSession = {
								serverName,
								client,
								transport: resolved.transport,
								transportType: resolved.transportType,
								requestTimeoutMs: resolved.requestTimeoutMs,
								supportsParallelToolCalls: resolved.supportsParallelToolCalls,
								connected: false,
								retiring: false,
								catalogUseCount: 0,
								sharedAcrossCatalogGenerations: false,
								detachStderr: resolved.detachStderr
							};
							client.onclose = () => {
								createdSession.connected = false;
								createdSession.disconnectReason = "mcp transport closed";
							};
							session = createdSession;
							sessions.set(serverName, session);
						}
						if (session.catalogUseCount === 0) session.sharedAcrossCatalogGenerations = false;
						if (reusedSession && session.catalogUseCount > 0) session.sharedAcrossCatalogGenerations = true;
						session.catalogUseCount += 1;
						try {
							failIfDisposed();
							await ensureSessionConnected(session, resolved.connectionTimeoutMs);
							failIfDisposed();
							const capabilities = summarizeServerCapabilities(session.client.getServerCapabilities());
							const listedTools = await listAllToolsBestEffort({
								client: session.client,
								timeoutMs: getCatalogListTimeoutMs(rawServer, resolved.requestTimeoutMs),
								suppressUnsupported: Boolean(!capabilities.tools && (capabilities.resources || capabilities.prompts))
							});
							failIfDisposed();
							const selection = getMcpToolSelection(rawServer);
							const exposedTools = listedTools.filter((tool) => shouldExposeMcpTool(selection, tool.name.trim()));
							const serverEntry = {
								serverName,
								safeServerName,
								launchSummary: launchDescription,
								toolCount: exposedTools.length,
								requestTimeoutMs: resolved.requestTimeoutMs,
								supportsParallelToolCalls: resolved.supportsParallelToolCalls,
								...capabilities.resources ? { resources: capabilities.resources } : {},
								...capabilities.prompts ? { prompts: capabilities.prompts } : {},
								...capabilities.tools ? { tools: {
									...capabilities.tools,
									...exposedTools.length !== listedTools.length ? { filteredCount: listedTools.length - exposedTools.length } : {}
								} } : {},
								...selection.include || selection.exclude ? { toolFilter: {
									...selection.include ? { include: [...selection.include] } : {},
									...selection.exclude ? { exclude: [...selection.exclude] } : {}
								} } : {}
							};
							const toolEntries = [];
							for (const tool of exposedTools) {
								const toolName = tool.name.trim();
								if (!toolName) continue;
								const { _meta: metadata } = tool;
								const uiMeta = metadata?.ui && typeof metadata.ui === "object" && !Array.isArray(metadata.ui) ? metadata.ui : void 0;
								const rawResourceUri = uiMeta?.resourceUri ?? metadata?.["ui/resourceUri"];
								const uiResourceUri = typeof rawResourceUri === "string" && rawResourceUri.startsWith("ui://") ? rawResourceUri : void 0;
								const uiVisibility = normalizeToolUiVisibility(uiMeta?.visibility);
								toolEntries.push({
									serverName,
									safeServerName,
									toolName,
									title: tool.title,
									description: sanitizeMcpMetadataText(tool.description),
									inputSchema: tool.inputSchema,
									fallbackDescription: `Provided by bundle MCP server "${serverName}" (${launchDescription}).`,
									...uiResourceUri ? { uiResourceUri } : {},
									...uiVisibility ? { uiVisibility } : {}
								});
							}
							return {
								serverName,
								serverEntry,
								toolEntries,
								diagnostics: []
							};
						} catch (error) {
							const message = redactErrorUrls(error);
							if (!disposed) require_logger.logWarn(`bundle-mcp: failed to ${reusedSession ? "refresh" : "start"} server "${serverName}" (${launchDescription}): ${message}`);
							const diags = [{
								serverName,
								safeServerName,
								launchSummary: launchDescription,
								message
							}];
							const sharedWithNewerGeneration = session.sharedAcrossCatalogGenerations || session.catalogUseCount > 1;
							if (!session.connected) await retireSessionIfCurrent(serverName, session);
							else if (!reusedSession && !sharedWithNewerGeneration) await retireSessionIfCurrent(serverName, session);
							failIfDisposed();
							return {
								serverName,
								serverEntry: null,
								toolEntries: [],
								diagnostics: diags
							};
						} finally {
							session.catalogUseCount -= 1;
							if (session.catalogUseCount === 0) session.sharedAcrossCatalogGenerations = false;
						}
					}),
					limit: BUNDLE_MCP_CATALOG_CONNECT_CONCURRENCY,
					errorMode: "continue"
				});
				if (hasError) throw firstError;
				for (const result of results) {
					if (!result) continue;
					const { serverEntry, toolEntries, diagnostics: serverDiags } = result;
					if (serverEntry) servers[result.serverName] = serverEntry;
					tools.push(...toolEntries);
					diagnostics.push(...serverDiags);
				}
				failIfDisposed();
				return {
					version: 1,
					generatedAt: Date.now(),
					servers,
					tools,
					...diagnostics.length > 0 ? { diagnostics } : {}
				};
			} catch (error) {
				await Promise.allSettled(Array.from(sessions.values(), (session) => disposeSession(session)));
				sessions.clear();
				throw error;
			}
		})();
		catalogInFlight = inFlight;
		try {
			const nextCatalog = await inFlight;
			failIfDisposed();
			if (catalogInvalidationGeneration === catalogGeneration) catalog = nextCatalog;
			return nextCatalog;
		} finally {
			if (catalogInFlight === inFlight) catalogInFlight = void 0;
		}
	};
	return {
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		workspaceDir: params.workspaceDir,
		agentDir: params.agentDir,
		configFingerprint,
		...params.requesterScope ? { requesterScope: params.requesterScope } : {},
		isRequesterScopedServer: () => params.requesterScope !== void 0,
		mcpAppsEnabled,
		createdAt,
		get lastUsedAt() {
			return lastUsedAt;
		},
		get activeLeases() {
			return activeLeases;
		},
		acquireLease() {
			activeLeases += 1;
			let released = false;
			return () => {
				if (released) return;
				released = true;
				activeLeases = Math.max(0, activeLeases - 1);
			};
		},
		getCatalog,
		/** Synchronous catalog snapshot only; must not connect transports or issue tools/list. */
		peekCatalog() {
			return catalog;
		},
		markUsed() {
			lastUsedAt = Date.now();
		},
		async callTool(serverName, toolName, input) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => await session.client.callTool({
				name: toolName,
				arguments: require_mcp_stdio.isMcpConfigRecord(input) ? input : {}
			}, void 0, { timeout: session.requestTimeoutMs }));
		},
		async listTools(serverName, requestParams) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => session.client.listTools(requestParams, { timeout: session.requestTimeoutMs }));
		},
		async listResources(serverName, options) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => listAllResources(session.client, session.requestTimeoutMs), options);
		},
		async readResource(serverName, uri, options) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => await session.client.readResource({ uri }, { timeout: session.requestTimeoutMs }), options);
		},
		async listResourceTemplates(serverName, requestParams) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => session.client.listResourceTemplates(requestParams, { timeout: session.requestTimeoutMs }));
		},
		async listPrompts(serverName) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => listAllPrompts(session.client, session.requestTimeoutMs));
		},
		async getPrompt(serverName, name, args) {
			failIfDisposed();
			await getCatalog();
			const session = requireConnectedSession(serverName);
			return await runGuardedServerRequest(serverName, async () => await session.client.getPrompt({
				name,
				...args ? { arguments: args } : {}
			}, { timeout: session.requestTimeoutMs }));
		},
		async dispose() {
			if (disposed) return;
			disposed = true;
			catalog = null;
			catalogInFlight = void 0;
			const sessionsToClose = Array.from(sessions.values());
			sessions.clear();
			await Promise.allSettled(sessionsToClose.map((session) => disposeSession(session)));
		}
	};
}
setDefaultCreateSessionMcpRuntime(createSessionMcpRuntime);
//#endregion
Object.defineProperty(exports, "agent_bundle_mcp_runtime_exports", {
	enumerable: true,
	get: function() {
		return agent_bundle_mcp_runtime_exports;
	}
});
Object.defineProperty(exports, "completeDeferredSessionMcpRuntimeRetirement", {
	enumerable: true,
	get: function() {
		return completeDeferredSessionMcpRuntimeRetirement;
	}
});
Object.defineProperty(exports, "disposeAllSessionMcpRuntimes", {
	enumerable: true,
	get: function() {
		return disposeAllSessionMcpRuntimes;
	}
});
Object.defineProperty(exports, "getOrCreateSessionMcpRuntime", {
	enumerable: true,
	get: function() {
		return getOrCreateSessionMcpRuntime;
	}
});
Object.defineProperty(exports, "loadEmbeddedAgentMcpConfig", {
	enumerable: true,
	get: function() {
		return loadEmbeddedAgentMcpConfig;
	}
});
Object.defineProperty(exports, "matchesMcpToolFilterPattern", {
	enumerable: true,
	get: function() {
		return matchesMcpToolFilterPattern;
	}
});
Object.defineProperty(exports, "peekSessionMcpRuntime", {
	enumerable: true,
	get: function() {
		return peekSessionMcpRuntime;
	}
});
Object.defineProperty(exports, "resolveSessionMcpConfigSummary", {
	enumerable: true,
	get: function() {
		return resolveSessionMcpConfigSummary;
	}
});
Object.defineProperty(exports, "retireSessionMcpRuntime", {
	enumerable: true,
	get: function() {
		return retireSessionMcpRuntime;
	}
});
Object.defineProperty(exports, "retireSessionMcpRuntimeForSessionKey", {
	enumerable: true,
	get: function() {
		return retireSessionMcpRuntimeForSessionKey;
	}
});
