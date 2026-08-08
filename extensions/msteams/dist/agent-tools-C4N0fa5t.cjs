const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_tool_images = require("./tool-images-BzMy_EyQ.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_glob_pattern = require("./glob-pattern-DmJJnFQo.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_constants = require("./constants-DD-eOR3_.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
require("./path-alias-guards-r6xSCXfB.cjs");
const require_path_policy = require("./path-policy-CP90OpIp.cjs");
const require_conversation_capability_profile = require("./conversation-capability-profile-Cn8o5WHy.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_sessions = require("./sessions-Bcpn-MAP.cjs");
const require_heartbeat_tool_response = require("./heartbeat-tool-response-DOTdTtHI.cjs");
const require_event_session_routing = require("./event-session-routing-BmkihcER.cjs");
const require_exec_policy = require("./exec-policy-BFFO-cIX.cjs");
const require_dangerous_tools = require("./dangerous-tools-DGtnzszS.cjs");
const require_bash_tools_descriptions = require("./bash-tools.descriptions-D_tiUDlt.cjs");
const require_openclaw_tools = require("./openclaw-tools-CDsUYzLX.cjs");
const require_bash_tools_schemas = require("./bash-tools.schemas-DAU-eSdE.cjs");
const require_codex_native_web_search_core = require("./codex-native-web-search-core-Ca08HKYE.cjs");
require("./codex-native-web-search-BtJQx4FC.cjs");
const require_tool_loop_detection_config = require("./tool-loop-detection-config-c-3qUtKe.cjs");
const require_workspace_mounts = require("./workspace-mounts-CgU9PRS7.cjs");
const require_tool_policy_pipeline = require("./tool-policy-pipeline-JYa4zOwK.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_async_hooks = require("node:async_hooks");
let typebox = require("typebox");
let node_child_process = require("node:child_process");
let _gabrielvfonseca_ai_internal_openai = require("@gabrielvfonseca/ai/internal/openai");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/agent-tools.ring-zero-context.ts
const activeRingZeroTools = new node_async_hooks.AsyncLocalStorage();
function isPromiseLike(value) {
	if ((typeof value !== "object" || value === null) && typeof value !== "function") return false;
	return "then" in value && typeof value.then === "function";
}
var HostScopedAgentToolAuthorizationError = class extends Error {
	constructor(message) {
		super(message);
		this.status = 403;
		this.name = "HostScopedAgentToolAuthorizationError";
	}
};
function bindToolToScope(tool, scope) {
	const execute = tool.execute;
	return {
		...tool,
		execute: async (toolCallId, params, signal, onUpdate) => {
			if (!scope.active) throw new HostScopedAgentToolAuthorizationError(`host-scoped tool "${tool.name}" is no longer authorized for this run`);
			return await execute(toolCallId, params, signal, onUpdate);
		}
	};
}
/**
* Bind host-owned tools to one selected harness run. The SDK reads this scope
* during tool construction, so plugins never receive private authority objects.
*/
function runWithAgentRingZeroTools(tools, run) {
	const scope = {
		active: true,
		tools: []
	};
	scope.tools = tools.map((tool) => bindToolToScope(tool, scope));
	try {
		const result = activeRingZeroTools.run(scope, run);
		if (isPromiseLike(result)) return Promise.resolve(result).finally(() => {
			scope.active = false;
		});
		scope.active = false;
		return result;
	} catch (error) {
		scope.active = false;
		throw error;
	}
}
/** Read the host-owned tools bound to the current harness run. */
function getActiveAgentRingZeroTools() {
	const scope = activeRingZeroTools.getStore();
	return scope?.active === true ? scope.tools : [];
}
function mergeAgentRingZeroTools(ringZeroTools, tools) {
	if (ringZeroTools.length === 0) return tools;
	const reservedNames = new Set(ringZeroTools.map((tool) => tool.name));
	return [...ringZeroTools, ...tools.filter((tool) => !reservedNames.has(tool.name))];
}
/**
* Read a host-owned tool fact for the current run. This does not activate or
* grant a tool; only the host can bind executable authority to the run scope.
*/
function isHostScopedAgentToolActive(toolName) {
	const normalizedName = toolName.trim().toLowerCase();
	return normalizedName.length > 0 && getActiveAgentRingZeroTools().some((tool) => tool.name.trim().toLowerCase() === normalizedName);
}
//#endregion
//#region src/agents/tool-replay-safety.ts
/**
* Defines the narrow set of tool instances that blind attempt retries may repeat.
*/
const UNCONDITIONALLY_REPLAY_SAFE_TOOL_NAMES = /* @__PURE__ */ new Set([
	"read",
	"search",
	"find",
	"grep",
	"glob",
	"ls",
	"web_search",
	"web_fetch",
	"x_search",
	"memory_get",
	"sessions_list",
	"sessions_history",
	"sessions_search",
	"agents_list",
	"get_goal",
	"update_plan",
	"tool_search",
	"tool_describe",
	"image"
]);
/**
* Tool names are not ownership boundaries. Callers must reject plugin/channel
* instances before using this audited core-tool allowlist.
*/
function isAgentToolReplaySafe(tool, options) {
	if (options?.declaredReplaySafe?.(tool) === false) return false;
	return UNCONDITIONALLY_REPLAY_SAFE_TOOL_NAMES.has(require_tool_policy.normalizeToolName(tool.name ?? ""));
}
/**
* Classify one concrete tool instance for an explicitly restart-safe turn.
* Unlike blind name-only replay, an owner declaration is sufficient because
* the host filters the concrete registered instance before execution.
*/
function isAgentToolRestartSafe(tool, options) {
	const declaredReplaySafe = options?.declaredReplaySafe?.(tool);
	if (declaredReplaySafe !== void 0) return declaredReplaySafe;
	return UNCONDITIONALLY_REPLAY_SAFE_TOOL_NAMES.has(require_tool_policy.normalizeToolName(tool.name ?? ""));
}
/**
* Name-only tool events are safe only when one concrete registered instance
* owns the name. Duplicate/shadowed names fail closed.
*/
function collectReplaySafeToolNames(tools, options) {
	const toolsByName = /* @__PURE__ */ new Map();
	for (const tool of tools) {
		const name = require_tool_policy.normalizeToolName(tool.name ?? "");
		if (!name) continue;
		const entries = toolsByName.get(name) ?? [];
		entries.push(tool);
		toolsByName.set(name, entries);
	}
	const replaySafeNames = /* @__PURE__ */ new Set();
	for (const [name, entries] of toolsByName) {
		const tool = entries.length === 1 ? entries[0] : void 0;
		if (tool && isAgentToolReplaySafe(tool, options)) replaySafeNames.add(name);
	}
	return replaySafeNames;
}
//#endregion
//#region src/agents/tool-search.ts
/**
* Tool Search catalog compaction.
*
* Presents large Operator/MCP/client tool inventories through search, describe, call, and optional code-mode tools.
*/
const TOOL_SEARCH_CODE_MODE_TOOL_NAME = "tool_search_code";
const TOOL_SEARCH_RAW_TOOL_NAME = "tool_search";
const TOOL_DESCRIBE_RAW_TOOL_NAME = "tool_describe";
const TOOL_CALL_RAW_TOOL_NAME = "tool_call";
const TOOL_SEARCH_CONTROL_TOOL_NAMES = /* @__PURE__ */ new Set([
	TOOL_SEARCH_CODE_MODE_TOOL_NAME,
	TOOL_SEARCH_RAW_TOOL_NAME,
	TOOL_DESCRIBE_RAW_TOOL_NAME,
	TOOL_CALL_RAW_TOOL_NAME
]);
const TOOL_SCHEMA_DIRECTORY_CONTROL_TOOL_NAMES = /* @__PURE__ */ new Set([
	TOOL_SEARCH_RAW_TOOL_NAME,
	TOOL_DESCRIBE_RAW_TOOL_NAME,
	TOOL_CALL_RAW_TOOL_NAME
]);
const DEFAULT_CODE_TIMEOUT_MS = 1e4;
const DEFAULT_SEARCH_LIMIT = 8;
const DEFAULT_MAX_SEARCH_LIMIT = 20;
const MAX_REUSABLE_CATALOG_SNAPSHOTS = 256;
const MAX_TOOL_SCHEMA_DIRECTORY_PROMPT_CHARS = 18e3;
const TOOL_DIRECTORY_IDENTIFIER_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/u;
const TOOL_SEARCH_CODE_MODE_CHILD_SOURCE = String.raw`
import vm from "node:vm";

let activeController;

function send(message) {
  if (typeof process.send === "function" && process.connected) {
    process.send(message);
  }
}

function sendAndFlush(message) {
  return new Promise((resolve) => {
    if (typeof process.send !== "function" || !process.connected) {
      resolve();
      return;
    }
    try {
      process.send(message, () => resolve());
    } catch {
      resolve();
    }
  });
}

function toJsonSafe(value) {
  if (value === undefined) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    if (value instanceof Error) {
      return value.message;
    }
    if (value === null) {
      return null;
    }
    switch (typeof value) {
      case "string":
        return value;
      case "number":
      case "boolean":
      case "bigint":
      case "symbol":
      case "function":
        return String(value);
      default:
        return Object.prototype.toString.call(value);
    }
  }
}

function formatLogItem(value) {
  if (typeof value === "string") {
    return value;
  }
  const safe = toJsonSafe(value);
  return typeof safe === "string" ? safe : JSON.stringify(safe);
}

function bridgeResultPayload(message) {
  if (!message.ok) {
    return typeof message.error === "string" ? message.error : "tool bridge failed";
  }
  const json = JSON.stringify(toJsonSafe(message.value));
  return typeof json === "string" ? json : "null";
}

function settleBridge(message) {
  if (!activeController) {
    return;
  }
  const id = typeof message?.id === "string" ? message.id : "";
  try {
    activeController.settleBridge(id, Boolean(message.ok), bridgeResultPayload(message));
  } catch (error) {
    send({
      type: "result",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function buildModelScriptSource(code) {
  return "(async (openclaw, console) => {\n" + code + "\n})(openclaw, console)";
}

function buildControllerSource() {
  // The controller returns promise-like bridge handles. The model code can await
  // them naturally, while the parent process serializes real tool calls.
  return (
    '"use strict";\n' +
    "(() => {\n" +
    "const pending = new Map();\n" +
    "const bridgeMessages = [];\n" +
    "const logs = [];\n" +
    "let idleWaiters = [];\n" +
    "let nextBridgeId = 1;\n" +
    toJsonSafe.toString() +
    "\n" +
    formatLogItem.toString() +
    "\n" +
    "function notifyBridgeIdle() {\n" +
    "  if (pending.size !== 0 || bridgeMessages.length !== 0) return;\n" +
    "  const waiters = idleWaiters;\n" +
    "  idleWaiters = [];\n" +
    "  for (const resolve of waiters) resolve();\n" +
    "}\n" +
    "function isBridgeIdle() {\n" +
    "  return pending.size === 0 && bridgeMessages.length === 0;\n" +
    "}\n" +
    "function waitForBridgeIdle() {\n" +
    "  if (isBridgeIdle()) return Promise.resolve();\n" +
    "  return new Promise((resolve) => idleWaiters.push(resolve));\n" +
    "}\n" +
    "function bridge(method, args) {\n" +
    "  let promise;\n" +
    "  const start = () => {\n" +
    "    if (!promise) {\n" +
    "      const id = String(nextBridgeId++);\n" +
    "      promise = new Promise((resolve, reject) => {\n" +
    "        pending.set(id, { resolve, reject });\n" +
    "        bridgeMessages.push({ id, method, args: toJsonSafe(args) });\n" +
    "      });\n" +
    "    }\n" +
    "    return promise;\n" +
    "  };\n" +
    "  return Object.freeze({\n" +
    "    then: (resolve, reject) => start().then(resolve, reject),\n" +
    "    catch: (reject) => start().catch(reject),\n" +
    "    finally: (onFinally) => start().finally(onFinally),\n" +
    "  });\n" +
    "}\n" +
    "const console = Object.freeze({\n" +
    "  log: (...items) => logs.push(items.map(formatLogItem)),\n" +
    "  warn: (...items) => logs.push(items.map(formatLogItem)),\n" +
    "  error: (...items) => logs.push(items.map(formatLogItem)),\n" +
    "});\n" +
    "const openclaw = Object.freeze({\n" +
    "  tools: Object.freeze({\n" +
    "    search: (query, options) => bridge('search', [query, options]),\n" +
    "    describe: (id) => bridge('describe', [id]),\n" +
    "    call: (id, input) => bridge('call', [id, input]),\n" +
    "  }),\n" +
    "});\n" +
    "return Object.freeze({\n" +
    "  openclaw,\n" +
    "  console,\n" +
    "  isBridgeIdle,\n" +
    "  waitForBridgeIdle,\n" +
    "  takeLogs: () => logs.splice(0),\n" +
    "  takeBridgeMessages: () => bridgeMessages.splice(0),\n" +
    "  settleBridge: (id, ok, payload) => {\n" +
    "    const waiter = pending.get(String(id));\n" +
    "    if (!waiter) return;\n" +
    "    pending.delete(String(id));\n" +
    "    if (ok) {\n" +
    "      waiter.resolve(JSON.parse(String(payload)));\n" +
    "    } else {\n" +
    "      waiter.reject(new Error(String(payload)));\n" +
    "    }\n" +
    "    Promise.resolve().then(notifyBridgeIdle);\n" +
    "  },\n" +
    "});\n" +
    "})()"
  );
}

function pumpController(controller) {
  for (const items of controller.takeLogs()) {
    send({ type: "log", items });
  }
  for (const message of controller.takeBridgeMessages()) {
    send({ type: "bridge", id: message.id, method: message.method, args: message.args });
  }
}

async function runModelCode(code, timeoutMs) {
  const sandbox = Object.create(null);
  const context = vm.createContext(sandbox, {
    name: "tool_search_code",
    codeGeneration: { strings: false, wasm: false },
  });
  const controllerScript = new vm.Script(buildControllerSource(), {
    filename: "tool_search_code:controller.js",
  });
  const controller = controllerScript.runInContext(context, {
    timeout: Math.max(1, Math.min(Number(timeoutMs) || 1, 2147483647)),
    breakOnSigint: false,
  });
  Object.defineProperties(sandbox, {
    console: { value: controller.console, enumerable: true },
    operator: { value: controller.operator, enumerable: true },
  });
  activeController = controller;
  const pumpTimer = setInterval(() => pumpController(controller), 1);
  try {
    const modelScript = new vm.Script(buildModelScriptSource(code), {
      filename: "tool_search_code:model.js",
    });
    const result = await Promise.resolve(
      modelScript.runInContext(context, {
        timeout: Math.max(1, Math.min(Number(timeoutMs) || 1, 2147483647)),
        breakOnSigint: false,
      }),
    ).then(
      (value) => ({ ok: true, value: toJsonSafe(value) }),
      (error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) }),
    );
    do {
      pumpController(controller);
      await controller.waitForBridgeIdle();
      pumpController(controller);
    } while (!controller.isBridgeIdle());
    pumpController(controller);
    await sendAndFlush(
      result.ok
        ? { type: "result", ok: true, value: result.value }
        : { type: "result", ok: false, error: result.error },
    );
  } finally {
    clearInterval(pumpTimer);
    activeController = undefined;
  }
}

process.on("message", (message) => {
  if (message?.type === "bridge-result") {
    settleBridge(message);
    return;
  }
  if (message?.type !== "run") {
    return;
  }
  const code = typeof message.code === "string" ? message.code : "";
  runModelCode(code, message.timeoutMs).catch((error) => {
    return sendAndFlush({
      type: "result",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }).finally(() => {
    setTimeout(() => process.exit(0), 100);
  });
});
`;
const SESSION_CATALOGS_KEY = Symbol.for("operator.toolSearch.sessionCatalogs");
const globalToolSearchState = globalThis;
const sessionCatalogs = globalToolSearchState[SESSION_CATALOGS_KEY] ?? (globalToolSearchState[SESSION_CATALOGS_KEY] = /* @__PURE__ */ new Map());
const reusableCatalogSnapshots = /* @__PURE__ */ new Map();
const catalogFingerprints = /* @__PURE__ */ new WeakMap();
const catalogToolIdentities = /* @__PURE__ */ new WeakMap();
let nextCatalogToolIdentity = 1;
function readToolSearchConfig(config) {
	const toolSearch = ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config?.tools) ? config.tools : void 0)?.toolSearch;
	if (toolSearch === true) return { enabled: true };
	if (toolSearch === false) return { enabled: false };
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(toolSearch) ? toolSearch : {};
}
function readBoolean(value, fallback) {
	return typeof value === "boolean" ? value : fallback;
}
function readInteger(value, fallback) {
	return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
let toolSearchCodeModeSupportedForTest;
let toolSearchMinCodeTimeoutMsForTest;
function isToolSearchCodeModeSupported() {
	if (toolSearchCodeModeSupportedForTest !== void 0) return toolSearchCodeModeSupportedForTest;
	return process.allowedNodeEnvironmentFlags.has("--permission");
}
function resolveMinCodeTimeoutMs() {
	return toolSearchMinCodeTimeoutMsForTest ?? 1e3;
}
function resolveToolSearchConfig(config) {
	const raw = readToolSearchConfig(config);
	const rawMode = typeof raw.mode === "string" ? raw.mode : "code";
	const requestedMode = rawMode === "tools" || rawMode === "directory" || rawMode === "code" ? rawMode : "code";
	const mode = requestedMode === "code" && !isToolSearchCodeModeSupported() ? "tools" : requestedMode;
	const configured = Object.keys(raw).some((key) => key !== "enabled");
	const maxSearchLimit = Math.max(1, Math.min(50, readInteger(raw.maxSearchLimit, DEFAULT_MAX_SEARCH_LIMIT)));
	return {
		enabled: readBoolean(raw.enabled, configured),
		mode,
		codeTimeoutMs: Math.max(resolveMinCodeTimeoutMs(), Math.min(6e4, readInteger(raw.codeTimeoutMs, DEFAULT_CODE_TIMEOUT_MS))),
		searchDefaultLimit: Math.max(1, Math.min(maxSearchLimit, readInteger(raw.searchDefaultLimit, DEFAULT_SEARCH_LIMIT))),
		maxSearchLimit
	};
}
function sessionCatalogKeys(input) {
	const runId = input.runId?.trim();
	if (runId) return [`run:${runId}`];
	const keys = [];
	if (input.sessionId?.trim()) keys.push(`session:${input.sessionId.trim()}`);
	if (input.sessionKey?.trim()) keys.push(`key:${input.sessionKey.trim()}`);
	if (input.agentId?.trim()) keys.push(`agent:${input.agentId.trim()}`);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(keys);
}
function sessionCatalogKey(input) {
	return sessionCatalogKeys(input)[0];
}
function reusableCatalogKey(input) {
	return sessionCatalogKey({
		sessionId: input.sessionId,
		sessionKey: input.sessionKey,
		agentId: input.agentId
	});
}
function stableJsonFingerprint(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
	if (seen.has(value)) return "\"[Circular]\"";
	seen.add(value);
	if (Array.isArray(value)) return `[${value.map((item) => stableJsonFingerprint(item, seen)).join(",")}]`;
	const record = value;
	return `{${Object.keys(record).toSorted().map((key) => `${JSON.stringify(key)}:${stableJsonFingerprint(record[key], seen)}`).join(",")}}`;
}
function catalogToolIdentity(tool) {
	const existing = catalogToolIdentities.get(tool);
	if (existing !== void 0) return existing;
	const next = nextCatalogToolIdentity;
	nextCatalogToolIdentity += 1;
	catalogToolIdentities.set(tool, next);
	return next;
}
function catalogEntriesFingerprint(entries) {
	return entries.map((entry) => [
		entry.id,
		entry.source,
		entry.sourceName ?? "",
		stableJsonFingerprint(entry.mcp),
		entry.name,
		entry.label ?? "",
		entry.description,
		stableJsonFingerprint(entry.parameters),
		String(catalogToolIdentity(entry.tool))
	].map((part) => JSON.stringify(part)).join(":")).toSorted().join("\n");
}
function restoreToolSearchCatalog(params) {
	const keys = sessionCatalogKeys(params);
	if (keys.length === 0 && !params.catalogRef) return;
	const next = {
		entries: params.entries,
		searchCount: 0,
		describeCount: 0,
		callCount: 0
	};
	if (params.catalogRef) params.catalogRef.current = next;
	catalogFingerprints.set(next, params.fingerprint);
	for (const key of keys) sessionCatalogs.set(key, next);
	return next;
}
function bindToolSearchCatalog(params) {
	if (params.catalogRef) params.catalogRef.current = params.catalog;
	for (const key of sessionCatalogKeys(params)) sessionCatalogs.set(key, params.catalog);
}
function rememberReusableCatalog(key, catalog) {
	if (!key) return;
	const fingerprint = catalogFingerprints.get(catalog);
	if (!fingerprint) return;
	if (reusableCatalogSnapshots.has(key)) reusableCatalogSnapshots.delete(key);
	reusableCatalogSnapshots.set(key, {
		entries: catalog.entries,
		fingerprint
	});
	while (reusableCatalogSnapshots.size > MAX_REUSABLE_CATALOG_SNAPSHOTS) {
		const oldestKey = reusableCatalogSnapshots.keys().next().value;
		if (!oldestKey) break;
		reusableCatalogSnapshots.delete(oldestKey);
	}
}
function classifyTool(tool) {
	const meta = require_tools.getPluginToolMeta(tool);
	const pluginId = meta?.pluginId?.trim();
	const mcp = meta?.mcp;
	if (mcp) return {
		source: "mcp",
		sourceName: mcp.safeServerName || pluginId || "mcp",
		mcp
	};
	if (pluginId === "bundle-mcp") return {
		source: "mcp",
		sourceName: pluginId
	};
	if (pluginId) return {
		source: "@gabrielvfonseca/operator",
		sourceName: pluginId
	};
	return {
		source: "@gabrielvfonseca/operator",
		sourceName: "core"
	};
}
function makeCatalogId(tool, source, sourceName) {
	return `${source}:${sourceName?.trim() || "core"}:${tool.name}`;
}
function wrapCatalogTool(tool, hookContext) {
	if (!hookContext || require_gateway.isToolWrappedWithBeforeToolCallHook(tool)) return tool;
	return require_hook_helpers.wrapToolWithBeforeToolCallHook(tool, hookContext);
}
function toCatalogEntry(tool, sourceOverride, hookContext) {
	const classified = classifyTool(tool);
	const source = sourceOverride ?? classified.source;
	const sourceName = sourceOverride === "client" ? "client" : classified.sourceName;
	const catalogTool = source === "client" ? tool : wrapCatalogTool(tool, hookContext);
	return {
		id: makeCatalogId(tool, source, sourceName),
		source,
		sourceName,
		...source === "mcp" && classified.mcp ? { mcp: classified.mcp } : {},
		name: tool.name,
		label: tool.label,
		description: tool.description ?? "",
		parameters: tool.parameters,
		tool: catalogTool
	};
}
function shouldCatalogTool(tool) {
	if (TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name)) return false;
	return tool.catalogMode !== "direct-only";
}
/**
* Register a catalog owned only by an explicit ref (no session keys), for
* headless callers like cron trigger evaluation. Registration internals stay
* module-private; this is the single public seam for ref-only catalogs.
*/
function registerHeadlessToolSearchCatalog(params) {
	const { catalogRef, tools, hookContext } = params;
	registerToolSearchCatalog({
		catalogRef,
		entries: tools.filter((tool) => shouldCatalogTool(tool)).map((tool) => {
			return toCatalogEntry(hookContext && require_gateway.isToolWrappedWithBeforeToolCallHook(tool) ? require_hook_helpers.rewrapToolWithBeforeToolCallHook(tool, hookContext) : tool, void 0, hookContext);
		})
	});
}
function collectUniqueCatalogToolNames(tools) {
	const nameCounts = /* @__PURE__ */ new Map();
	for (const tool of tools) if (shouldCatalogTool(tool)) nameCounts.set(tool.name, (nameCounts.get(tool.name) ?? 0) + 1);
	return new Set(Array.from(nameCounts).filter(([, count]) => count === 1).map(([name]) => name));
}
function shouldExposeControlTool(name, mode) {
	if (name === "tool_search_code") return mode === "code";
	if (name === "tool_search" || name === "tool_describe" || name === "tool_call") return mode === "tools";
	return false;
}
function readMessageToolResultId(message) {
	const record = message;
	const role = typeof record.role === "string" ? record.role : "";
	const canUseDirectId = role === "toolResult" || role === "tool";
	const direct = record.toolCallId ?? record.toolUseId ?? record.tool_use_id;
	if (canUseDirectId && typeof direct === "string" && direct.trim()) return direct;
	const content = record.content;
	if (!Array.isArray(content)) return;
	for (const block of content) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block)) continue;
		if (block.type !== "toolResult") continue;
		const nested = block.toolCallId ?? block.toolUseId ?? block.tool_use_id ?? block.id;
		if (typeof nested === "string" && nested.trim()) return nested;
	}
}
function textFromToolSearchProjectionResult(result, isError) {
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(result)) {
		const detailError = ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(result.details) ? result.details : void 0)?.error;
		if (typeof detailError === "string" && detailError.trim()) return detailError;
		const content = result.content;
		if (Array.isArray(content)) {
			const text = content.map((item) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(item) && typeof item.text === "string" ? item.text : "").filter(Boolean).join("\n");
			if (text.trim()) return text;
		}
	}
	const safe = toJsonSafe(result);
	if (typeof safe === "string") return safe;
	const encoded = JSON.stringify(safe);
	if (typeof encoded === "string") return encoded;
	return isError ? "Tool Search target tool failed." : "Tool Search target tool completed.";
}
function buildToolSearchTargetTranscriptMessages(projection) {
	const input = toJsonSafe(projection.input);
	const timestamp = projection.timestamp ?? Date.now();
	const resultRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(projection.result) ? projection.result : void 0;
	const resultContent = Array.isArray(resultRecord?.content) && resultRecord.content.length > 0 ? toJsonSafe(resultRecord.content) : [{
		type: "text",
		text: textFromToolSearchProjectionResult(projection.result, projection.isError === true)
	}];
	return [{
		role: "assistant",
		content: [{
			type: "toolCall",
			id: projection.toolCallId,
			name: projection.toolName,
			arguments: input,
			input
		}],
		stopReason: "toolUse",
		timestamp
	}, {
		role: "toolResult",
		toolCallId: projection.toolCallId,
		toolName: projection.toolName,
		isError: projection.isError === true,
		content: resultContent,
		timestamp
	}];
}
function projectToolSearchTargetTranscriptMessages(messages, projections) {
	if (projections.length === 0) return messages;
	const byParent = /* @__PURE__ */ new Map();
	const unmatched = [];
	for (const projection of projections) {
		const parent = projection.parentToolCallId?.trim();
		if (!parent) {
			unmatched.push(projection);
			continue;
		}
		const group = byParent.get(parent) ?? [];
		group.push(projection);
		byParent.set(parent, group);
	}
	const inserted = /* @__PURE__ */ new Set();
	const projected = [];
	for (const message of messages) {
		projected.push(message);
		const toolResultId = readMessageToolResultId(message);
		const group = toolResultId ? byParent.get(toolResultId) : void 0;
		if (!group) continue;
		for (const projection of group) {
			projected.push(...buildToolSearchTargetTranscriptMessages(projection));
			inserted.add(projection);
		}
	}
	for (const projection of [...unmatched, ...projections]) {
		if (inserted.has(projection)) continue;
		projected.push(...buildToolSearchTargetTranscriptMessages(projection));
		inserted.add(projection);
	}
	return projected;
}
/** Create an explicit catalog holder for callers that cannot rely on session keys. */
function createToolSearchCatalogRef() {
	return {};
}
/** Replace visible tools with Tool Search controls and register hidden catalog entries. */
function applyToolSearchCatalog(params) {
	const config = resolveToolSearchConfig(params.config);
	return applyToolCatalogCompaction({
		...params,
		enabled: config.enabled,
		isVisibleControlTool: (tool) => TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name) && shouldExposeControlTool(tool.name, config.mode)
	});
}
/** Keep tool names discoverable while deferring heavyweight JSON schemas behind describe/call. */
function applyToolSchemaDirectoryCatalog(params) {
	const config = resolveToolSearchConfig(params.config);
	if (!config.enabled) return {
		tools: params.tools,
		compacted: false,
		catalogToolCount: 0,
		catalogRegistered: false,
		catalogReused: false
	};
	if (!params.tools.some((tool) => tool.name === "tool_search")) return {
		tools: params.tools.filter((tool) => !TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name)),
		compacted: false,
		catalogToolCount: 0,
		catalogRegistered: false,
		catalogReused: false
	};
	const hydrateToolNames = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(Array.from(params.hydrateToolNames ?? [])));
	const uniqueCatalogToolNames = collectUniqueCatalogToolNames(params.tools);
	return applyToolCatalogCompaction({
		...params,
		enabled: config.enabled,
		isVisibleControlTool: (tool) => TOOL_SCHEMA_DIRECTORY_CONTROL_TOOL_NAMES.has(tool.name),
		isVisibleCatalogTool: (tool) => hydrateToolNames.has(tool.name) && uniqueCatalogToolNames.has(tool.name)
	});
}
function buildToolSchemaDirectoryPrompt(ctx, options) {
	return formatToolSearchCatalogDirectory(new ToolSearchRuntime(ctx, resolveToolSearchConfig(ctx.runtimeConfig ?? ctx.config)).all(options));
}
/** Resolve an exact hidden catalog tool name without exposing fuzzy search or catalog ids. */
function resolveToolSearchCatalogTool(ctx, name, options) {
	if (typeof name !== "string") return;
	const needle = name.trim();
	if (!needle) return;
	try {
		const matches = visibleCatalogEntries(resolveCatalog(ctx), options).filter((entry) => entry.name === needle);
		return matches.length === 1 ? matches[0]?.tool : void 0;
	} catch (error) {
		if (error instanceof require_common.ToolInputError) return;
		throw error;
	}
}
/** Move client-provided tools into an existing Tool Search catalog. */
function addClientToolsToToolSearchCatalog(params) {
	const config = resolveToolSearchConfig(params.config);
	if (config.mode === "directory") return {
		tools: params.tools,
		compacted: false,
		catalogToolCount: 0
	};
	return addClientToolsToToolCatalog({
		...params,
		enabled: config.enabled
	});
}
/** Register catalog entries under run/session keys and optional direct refs. */
function registerToolSearchCatalog(params) {
	const keys = sessionCatalogKeys(params);
	const primaryKey = keys[0];
	if (!primaryKey && !params.catalogRef) return;
	const prior = params.append ? params.catalogRef?.current ?? (primaryKey ? sessionCatalogs.get(primaryKey) : void 0) : void 0;
	const byId = /* @__PURE__ */ new Map();
	for (const entry of prior?.entries ?? []) byId.set(entry.id, entry);
	for (const entry of params.entries) {
		byId.set(entry.id, entry);
		byId.set(entry.name, entry);
	}
	const next = {
		entries: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueValues)(byId.values()).toSorted((a, b) => a.id.localeCompare(b.id)),
		searchCount: prior?.searchCount ?? 0,
		describeCount: prior?.describeCount ?? 0,
		callCount: prior?.callCount ?? 0
	};
	catalogFingerprints.set(next, catalogEntriesFingerprint(next.entries));
	if (params.catalogRef) params.catalogRef.current = next;
	for (const key of keys) sessionCatalogs.set(key, next);
	return next;
}
/** Clear Tool Search catalog state for a run/session/ref. */
function clearToolSearchCatalog(params) {
	if (params.catalogRef) params.catalogRef.current = void 0;
	for (const key of sessionCatalogKeys(params)) sessionCatalogs.delete(key);
	if (!params.runId?.trim()) {
		const snapshotKey = reusableCatalogKey(params);
		if (snapshotKey) reusableCatalogSnapshots.delete(snapshotKey);
	}
}
function resolveCatalog(ctx) {
	if (ctx.catalogRef?.current) return ctx.catalogRef.current;
	const keys = sessionCatalogKeys({
		sessionId: ctx.sessionId,
		sessionKey: ctx.sessionKey,
		agentId: ctx.agentId,
		runId: ctx.runId
	});
	for (const key of keys) {
		const catalog = sessionCatalogs.get(key);
		if (catalog) return catalog;
	}
	if (ctx.runId?.trim()) throw new require_common.ToolInputError("Tool Search catalog is unavailable for this run.");
	const uniqueCatalogs = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueValues)(sessionCatalogs.values());
	if (uniqueCatalogs.length === 1) {
		const catalog = uniqueCatalogs[0];
		if (catalog) return catalog;
	}
	throw new require_common.ToolInputError("Tool Search catalog is unavailable for this run.");
}
function compactEntry(entry) {
	return {
		id: entry.id,
		source: entry.source,
		sourceName: entry.sourceName,
		...entry.mcp ? { mcp: entry.mcp } : {},
		name: entry.name,
		label: entry.label,
		description: entry.description
	};
}
function compactDirectoryDescription(description) {
	const normalized = description.replace(/\s+/g, " ").trim();
	if (normalized.length <= 180) return normalized;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, 177).trimEnd()}...`;
}
function formatToolDirectoryIdentifier(value) {
	const trimmed = value?.trim();
	return trimmed && TOOL_DIRECTORY_IDENTIFIER_RE.test(trimmed) ? trimmed : void 0;
}
function formatToolDirectoryEntry(entry) {
	if (entry.source !== "@gabrielvfonseca/operator") return;
	const name = formatToolDirectoryIdentifier(entry.name);
	if (!name) return;
	const description = compactDirectoryDescription(entry.description);
	const ownerName = formatToolDirectoryIdentifier(entry.sourceName);
	return `- ${name}${ownerName ? ` (${ownerName})` : ""}: ${description || "No description."}`;
}
function renderToolSearchCatalogDirectory(lines, total) {
	const omitted = total - lines.length;
	const footer = omitted > 0 ? `${omitted} additional tools omitted. Use tool_search to find them, then tool_describe to load a full schema before tool_call.` : "Call tool_describe with a listed tool name to load its full schema before using tool_call.";
	return [
		"Available deferred-schema tools:",
		...lines,
		"",
		footer
	].join("\n");
}
function formatToolSearchCatalogDirectory(entries) {
	if (entries.length === 0) return "Available deferred-schema tools: none.";
	const nameCounts = /* @__PURE__ */ new Map();
	for (const entry of entries) nameCounts.set(entry.name, (nameCounts.get(entry.name) ?? 0) + 1);
	const lines = entries.filter((entry) => nameCounts.get(entry.name) === 1).toSorted((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)).map(formatToolDirectoryEntry).filter((line) => Boolean(line));
	const fullDirectory = renderToolSearchCatalogDirectory(lines, entries.length);
	if (fullDirectory.length <= MAX_TOOL_SCHEMA_DIRECTORY_PROMPT_CHARS) return fullDirectory;
	let low = 0;
	let high = lines.length;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (renderToolSearchCatalogDirectory(lines.slice(0, middle), entries.length).length <= MAX_TOOL_SCHEMA_DIRECTORY_PROMPT_CHARS) low = middle;
		else high = middle - 1;
	}
	return renderToolSearchCatalogDirectory(lines.slice(0, low), entries.length);
}
const TOOL_DIRECTORY_HYDRATION_KEYWORDS = [
	{
		terms: [
			"search",
			"lookup",
			"look",
			"find",
			"current",
			"today",
			"price",
			"latest",
			"news"
		],
		toolHints: ["searxng", "web"],
		weight: 8
	},
	{
		terms: [
			"url",
			"link",
			"page",
			"fetch",
			"read",
			"article",
			"http",
			"https"
		],
		toolHints: ["fetch", "browser"],
		weight: 8
	},
	{
		terms: [
			"send",
			"reply",
			"message",
			"post",
			"react",
			"embed",
			"discord",
			"imessage"
		],
		toolHints: [
			"message",
			"session",
			"send"
		],
		weight: 7
	},
	{
		terms: [
			"file",
			"path",
			"read",
			"write",
			"edit",
			"patch",
			"grep",
			"list"
		],
		toolHints: [
			"read",
			"write",
			"edit",
			"grep",
			"find",
			"ls",
			"patch"
		],
		weight: 6
	},
	{
		terms: [
			"run",
			"command",
			"shell",
			"terminal",
			"build",
			"test",
			"pnpm",
			"git"
		],
		toolHints: ["exec", "process"],
		weight: 7
	},
	{
		terms: [
			"remember",
			"recall",
			"memory",
			"memories",
			"known",
			"history",
			"previous",
			"prior",
			"earlier",
			"decided",
			"decision",
			"discussed"
		],
		toolHints: ["memory"],
		weight: 6
	},
	{
		terms: [
			"remind",
			"schedule",
			"later",
			"tomorrow",
			"daily",
			"weekly",
			"cron"
		],
		toolHints: [
			"cron",
			"automation",
			"heartbeat"
		],
		weight: 8
	},
	{
		terms: [
			"image",
			"picture",
			"photo",
			"meme",
			"gif",
			"screenshot",
			"visual"
		],
		toolHints: [
			"image",
			"vision",
			"browser"
		],
		weight: 6
	},
	{
		terms: [
			"audio",
			"voice",
			"speak",
			"tts",
			"transcribe"
		],
		toolHints: [
			"audio",
			"voice",
			"tts"
		],
		weight: 6
	}
];
function readToolDirectoryIntent(query) {
	const tokens = new Set(tokenize(query));
	const hasCurrentFact = [
		"current",
		"today",
		"latest",
		"price",
		"weather",
		"news"
	].some((term) => tokens.has(term));
	const hasExplicitMemoryRecall = [
		"remember",
		"recall",
		"memory",
		"memories",
		"known",
		"history",
		"previous",
		"prior",
		"earlier",
		"decided",
		"decision",
		"discussed"
	].some((term) => tokens.has(term));
	const hasIdentityRecall = /\b(?:do you know|who (?:is|are|was)|what did (?:we|i|you|they)|when did (?:we|i|you|they))\b/iu.test(query);
	return {
		tokens,
		hasUrl: tokens.has("http") || tokens.has("https") || /https?:\/\//iu.test(query),
		hasFilePath: tokens.has("/") || /(^|\s)(\.{1,2}\/|\/|[a-z]:\\)/iu.test(query),
		hasMention: /<@!?\d+>/u.test(query) || tokens.has("discord"),
		hasSchedule: [
			"remind",
			"schedule",
			"later",
			"tomorrow",
			"daily",
			"weekly",
			"cron"
		].some((term) => tokens.has(term)),
		hasCurrentFact,
		hasMemoryRecall: hasExplicitMemoryRecall || hasIdentityRecall && !hasCurrentFact
	};
}
function classifyDirectoryToolFamilies(tool, intent) {
	const toolText = `${tool.name} ${tool.description ?? ""}`.toLowerCase();
	const families = /* @__PURE__ */ new Set();
	if (TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name)) return families;
	const hasMemoryToolSignal = /\b(?:memory|memories|recall|remember|history|prior|knowledge|libravdb)\b/iu.test(toolText) || /(?:^|_)(?:memory|recall|remember|libravdb)(?:_|$)/iu.test(tool.name);
	const hasWebToolSignal = /\b(?:web|internet|online|browser|url|http|https|page|article|fetch|crawl|searxng|google|bing|brave|tavily|duckduckgo|serp)\b/iu.test(toolText) || /(?:^|_)(?:web|fetch|browser|searxng|google|bing|brave|tavily|duckduckgo|serp)(?:_|$)/iu.test(tool.name);
	const hasWebIntent = intent.hasUrl || intent.hasCurrentFact || [
		"search",
		"lookup",
		"look",
		"find",
		"current",
		"today",
		"price",
		"latest",
		"news"
	].some((term) => intent.tokens.has(term));
	if (hasWebToolSignal && hasWebIntent) families.add("web");
	if (hasMemoryToolSignal && intent.hasMemoryRecall) families.add("memory");
	return families;
}
function scoreDirectoryTool(tool, intent) {
	const toolText = `${tool.name} ${tool.description ?? ""}`.toLowerCase();
	const toolTokens = new Set(tokenize(toolText));
	let score = 0;
	for (const token of toolTokens) if (intent.tokens.has(token)) score += 2;
	for (const group of TOOL_DIRECTORY_HYDRATION_KEYWORDS) {
		if (!group.terms.some((term) => intent.tokens.has(term))) continue;
		if (group.toolHints.some((hint) => toolText.includes(hint))) score += group.weight;
	}
	if (intent.hasUrl && /fetch|browser|web/iu.test(toolText)) score += 10;
	if (intent.hasFilePath && /read|write|edit|grep|find|ls|file|patch/iu.test(toolText)) score += 8;
	if (intent.hasMention && /message|discord|react|send/iu.test(toolText)) score += 8;
	if (intent.hasSchedule && /cron|schedule|remind|heartbeat|automation/iu.test(toolText)) score += 8;
	if (intent.hasCurrentFact && /searxng|web|internet|online|fetch|weather|finance|price|google|bing|brave|tavily|duckduckgo|serp/iu.test(toolText)) score += 8;
	if (intent.hasMemoryRecall && /memory|memories|recall|remember|history|prior|knowledge|libravdb/iu.test(toolText)) score += 8;
	return score;
}
function expandDirectoryHydrationGroups(params) {
	if (params.maxTools <= 0) return [];
	const emitted = /* @__PURE__ */ new Set();
	const expandedFamilies = /* @__PURE__ */ new Set();
	const expanded = [];
	const toolsByName = new Map(params.tools.map((tool) => [tool.name, tool]));
	const toolsByFamily = /* @__PURE__ */ new Map();
	const selectedRank = new Map(params.selectedNames.map((name, index) => [name, index]));
	for (const tool of params.tools) for (const family of classifyDirectoryToolFamilies(tool, params.intent)) {
		const names = toolsByFamily.get(family) ?? [];
		names.push(tool.name);
		toolsByFamily.set(family, names);
	}
	for (const names of toolsByFamily.values()) names.sort((a, b) => (selectedRank.get(a) ?? Number.MAX_SAFE_INTEGER) - (selectedRank.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b));
	for (const selectedName of params.selectedNames) {
		if (expanded.length >= params.maxTools) break;
		if (!emitted.has(selectedName)) {
			expanded.push(selectedName);
			emitted.add(selectedName);
		}
		if (expanded.length >= params.maxTools) break;
		const selectedTool = toolsByName.get(selectedName);
		if (!selectedTool) continue;
		for (const family of classifyDirectoryToolFamilies(selectedTool, params.intent)) {
			if (expandedFamilies.has(family)) continue;
			expandedFamilies.add(family);
			for (const groupedName of toolsByFamily.get(family) ?? []) {
				if (expanded.length >= params.maxTools) return expanded;
				if (emitted.has(groupedName)) continue;
				expanded.push(groupedName);
				emitted.add(groupedName);
			}
		}
	}
	return expanded;
}
function estimateToolSchemaDirectoryToolNames(params) {
	const maxTools = Math.max(0, Math.min(12, params.maxTools ?? 4));
	const hydratableTools = [];
	const externalToolNames = /* @__PURE__ */ new Set();
	const uniqueCatalogToolNames = collectUniqueCatalogToolNames(params.tools);
	for (const tool of params.tools) {
		if (!uniqueCatalogToolNames.has(tool.name)) continue;
		if (classifyTool(tool).source === "mcp") {
			externalToolNames.add(tool.name);
			continue;
		}
		hydratableTools.push(tool);
	}
	const required = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(Array.from(params.requiredToolNames ?? [])).filter((name) => !externalToolNames.has(name));
	const requiredSet = new Set(required);
	const query = params.query?.trim() ?? "";
	if (!query && required.length >= maxTools) return required.slice(0, maxTools);
	const intent = readToolDirectoryIntent(query);
	const scored = hydratableTools.filter((tool) => !TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name)).map((tool) => ({
		name: tool.name,
		score: requiredSet.has(tool.name) ? Number.MAX_SAFE_INTEGER : scoreDirectoryTool(tool, intent)
	})).filter((entry) => entry.score > 0).toSorted((a, b) => b.score - a.score || a.name.localeCompare(b.name));
	return expandDirectoryHydrationGroups({
		selectedNames: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...required, ...scored.map((entry) => entry.name)]),
		tools: hydratableTools,
		intent,
		maxTools
	});
}
function describeEntry(entry) {
	return {
		...compactEntry(entry),
		parameters: entry.parameters ?? {}
	};
}
function tokenize(input) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(input.toLowerCase().split(/[^a-z0-9_./:-]+/u));
}
function scoreEntry(entry, terms) {
	if (terms.length === 0) return 1;
	const name = entry.name.toLowerCase();
	const id = entry.id.toLowerCase();
	const label = (entry.label ?? "").toLowerCase();
	const description = entry.description.toLowerCase();
	let score = 0;
	for (const term of terms) {
		if (name === term || id === term) score += 20;
		if (name.includes(term)) score += 8;
		if (id.includes(term)) score += 6;
		if (label.includes(term)) score += 4;
		if (description.includes(term)) score += 2;
	}
	return score;
}
function visibleCatalogEntries(catalog, options) {
	return options?.includeMcp === false ? catalog.entries.filter((entry) => entry.source !== "mcp") : catalog.entries;
}
function tokenizeLookupValue(input) {
	return new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(input.toLowerCase().split(/[^a-z0-9]+/u)));
}
function scoreUnknownToolSuggestion(needle, entry) {
	const normalizedNeedle = needle.toLowerCase();
	const name = entry.name.toLowerCase();
	const id = entry.id.toLowerCase();
	const label = (entry.label ?? "").toLowerCase();
	const description = entry.description.toLowerCase();
	const needleTokens = tokenizeLookupValue(needle);
	const entryTokens = tokenizeLookupValue(`${entry.name} ${entry.id} ${entry.label ?? ""} ${entry.description}`);
	let score = 0;
	if (name && normalizedNeedle.includes(name) || id.includes(normalizedNeedle)) score += 40;
	if (name && needleTokens.has(name)) score += 40;
	for (const token of needleTokens) if (entryTokens.has(token)) score += 12;
	if (label.includes(normalizedNeedle) || description.includes(normalizedNeedle)) score += 8;
	return score;
}
function formatUnknownToolIdError(needle, entries, options = {}) {
	const nameCounts = /* @__PURE__ */ new Map();
	for (const entry of entries) nameCounts.set(entry.name, (nameCounts.get(entry.name) ?? 0) + 1);
	const suggestions = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(entries.map((entry) => ({
		value: options.exactIdOnly || (nameCounts.get(entry.name) ?? 0) > 1 ? entry.id : entry.name,
		score: scoreUnknownToolSuggestion(needle, entry)
	})).filter((candidate) => candidate.score > 0).toSorted((a, b) => b.score - a.score || a.value.localeCompare(b.value)).map((candidate) => candidate.value)).slice(0, 3);
	const recoveryText = options.recoverySurface === "code-mode" ? "Use operator.tools.search to find a tool, operator.tools.describe to inspect it, then operator.tools.call with the exact id or name." : options.recoverySurface === "tools" ? "Use tools.search to find a tool, tools.describe to inspect it, then tools.call with the exact id or name." : "Use tool_search to find a tool, tool_describe to inspect it, then tool_call with the exact id or name.";
	if (suggestions.length === 0) return `Unknown tool id: ${needle}. ${recoveryText}`;
	return `Unknown tool id: ${needle}. Did you mean: ${suggestions.join(", ")}? ${recoveryText}`;
}
function findEntry(catalog, id, options, errorOptions) {
	const needle = id.trim();
	const entries = visibleCatalogEntries(catalog, options);
	const exactIdEntry = entries.find((candidate) => candidate.id === needle);
	if (exactIdEntry) return exactIdEntry;
	const namedEntries = entries.filter((candidate) => candidate.name === needle);
	if (namedEntries.length > 1) throw new require_common.ToolInputError(`Ambiguous tool name: ${needle}; use an exact tool id.`);
	const namedEntry = namedEntries[0];
	if (!namedEntry) throw new require_common.ToolInputError(formatUnknownToolIdError(needle, entries, errorOptions));
	return namedEntry;
}
function findEntryByExactId(catalog, id, errorOptions = {}) {
	const needle = id.trim();
	const entry = catalog.entries.find((candidate) => candidate.id === needle);
	if (!entry) throw new require_common.ToolInputError(formatUnknownToolIdError(needle, catalog.entries, {
		...errorOptions,
		exactIdOnly: true
	}));
	return entry;
}
function readId(args) {
	const params = require_common.asToolParamsRecord(args);
	const value = params.id ?? params.toolId ?? params.name;
	if (typeof value !== "string" || !value.trim()) throw new require_common.ToolInputError("id must be a non-empty string.");
	return value.trim();
}
function readLimit(value, config) {
	if (value === void 0) return config.searchDefaultLimit;
	if (typeof value !== "number" || !Number.isInteger(value) || value < 1) throw new require_common.ToolInputError("limit must be a positive integer.");
	return Math.min(value, config.maxSearchLimit);
}
function readSearchArgs(args, config) {
	const params = require_common.asToolParamsRecord(args);
	const query = params.query;
	if (typeof query !== "string") throw new require_common.ToolInputError("query must be a string.");
	const options = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.options) ? params.options : void 0;
	return {
		query,
		limit: readLimit(params.limit ?? options?.limit, config)
	};
}
function readCallArgs(args) {
	const params = require_common.asToolParamsRecord(args);
	return {
		id: readId(params),
		input: params.args ?? params.input ?? {}
	};
}
function getTelemetry(catalog) {
	const sources = {
		"@gabrielvfonseca/operator": 0,
		mcp: 0,
		client: 0
	};
	for (const entry of catalog.entries) sources[entry.source] += 1;
	return {
		catalogSize: catalog.entries.length,
		sources,
		searchCount: catalog.searchCount,
		describeCount: catalog.describeCount,
		callCount: catalog.callCount
	};
}
function sanitizeToolCallIdPart(value) {
	return value.trim().replace(/[^A-Za-z0-9_.:-]+/g, "_").slice(0, 120) || "call";
}
var ToolSearchRuntime = class {
	constructor(ctx, config) {
		this.ctx = ctx;
		this.config = config;
		this.callSequence = 0;
		this.search = async (query, options) => {
			const catalog = resolveCatalog(this.ctx);
			catalog.searchCount += 1;
			const limit = readLimit(options?.limit, this.config);
			const terms = tokenize(query);
			return visibleCatalogEntries(catalog, options).map((entry) => ({
				entry,
				score: scoreEntry(entry, terms)
			})).filter((hit) => hit.score > 0).toSorted((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id)).slice(0, limit).map((hit) => compactEntry(hit.entry));
		};
		this.all = (options) => {
			return visibleCatalogEntries(resolveCatalog(this.ctx), options).map((entry) => compactEntry(entry));
		};
		this.namespaceEntries = () => {
			return resolveCatalog(this.ctx).entries.map((entry) => Object.assign(compactEntry(entry), { parameters: entry.parameters ?? {} }));
		};
		this.describe = async (id, options) => {
			const catalog = resolveCatalog(this.ctx);
			catalog.describeCount += 1;
			return describeEntry(findEntry(catalog, id, options, options));
		};
		this.call = async (id, input, options) => {
			const catalog = resolveCatalog(this.ctx);
			const entry = findEntry(catalog, id, void 0, options);
			return await this.callEntry(catalog, entry, input, options);
		};
		this.callExactId = async (id, input, options) => {
			const catalog = resolveCatalog(this.ctx);
			const entry = findEntryByExactId(catalog, id, options);
			return await this.callEntry(catalog, entry, input, options);
		};
		this.isReplaySafeExactId = (id) => {
			let entry;
			try {
				entry = findEntryByExactId(resolveCatalog(this.ctx), id);
			} catch {
				return false;
			}
			if (entry.source !== "@gabrielvfonseca/operator") return false;
			const pluginMeta = require_tools.getPluginToolMeta(entry.tool);
			if (pluginMeta) return pluginMeta.mcp ? false : pluginMeta.replaySafe === true;
			if (require_gateway.getChannelAgentToolMeta(entry.tool)) return false;
			return isAgentToolReplaySafe(entry.tool);
		};
		this.callEntry = async (catalog, entry, input, options) => {
			catalog.callCount += 1;
			const toolCallId = `tool_search_code:${sanitizeToolCallIdPart(options?.parentToolCallId ?? "direct")}:${entry.name}:${++this.callSequence}`;
			const result = await (this.ctx.executeTool ?? (async (params) => await params.tool.execute(params.toolCallId, params.input, params.signal, params.onUpdate, void 0)))({
				tool: entry.tool,
				toolName: entry.name,
				source: entry.source,
				sourceName: entry.sourceName,
				toolCallId,
				parentToolCallId: options?.parentToolCallId,
				input: input ?? {},
				signal: options?.signal ?? this.ctx.abortSignal,
				onUpdate: options?.onUpdate
			});
			return {
				tool: compactEntry(entry),
				result
			};
		};
	}
	telemetry() {
		return getTelemetry(resolveCatalog(this.ctx));
	}
};
/** Compact a native tool list into visible control tools plus hidden catalog entries. */
function applyToolCatalogCompaction(params) {
	if (!params.enabled) return {
		tools: params.tools,
		compacted: false,
		catalogToolCount: 0,
		catalogRegistered: false,
		catalogReused: false
	};
	const hasControlTool = params.tools.some((tool) => params.isVisibleControlTool(tool));
	const key = sessionCatalogKey(params);
	if (!hasControlTool || !key && !params.catalogRef) return {
		tools: params.tools.filter((tool) => !TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name)),
		compacted: false,
		catalogToolCount: 0,
		catalogRegistered: false,
		catalogReused: false
	};
	const visible = [];
	const catalog = [];
	const shouldCatalog = (tool) => shouldCatalogTool(tool) && (params.shouldCatalogTool?.(tool) ?? true);
	for (const tool of params.tools) {
		if (params.isVisibleControlTool(tool)) {
			visible.push(tool);
			continue;
		}
		if (TOOL_SEARCH_CONTROL_TOOL_NAMES.has(tool.name)) continue;
		if (shouldCatalog(tool)) {
			catalog.push(toCatalogEntry(tool, void 0, params.toolHookContext));
			if (!params.isVisibleCatalogTool?.(tool)) continue;
		}
		visible.push(tool);
	}
	const incomingFingerprint = catalogEntriesFingerprint(catalog);
	const existingCatalog = params.catalogRef?.current ?? (key ? sessionCatalogs.get(key) : void 0);
	if (existingCatalog && catalogFingerprints.get(existingCatalog) === incomingFingerprint) {
		bindToolSearchCatalog({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			agentId: params.agentId,
			runId: params.runId,
			catalogRef: params.catalogRef,
			catalog: existingCatalog
		});
		return {
			tools: visible,
			compacted: catalog.length > 0,
			catalogToolCount: catalog.length,
			catalogRegistered: true,
			catalogReused: true
		};
	}
	const reusableKey = reusableCatalogKey(params);
	const reusableSnapshot = reusableKey ? reusableCatalogSnapshots.get(reusableKey) : void 0;
	if (reusableSnapshot?.fingerprint === incomingFingerprint) {
		restoreToolSearchCatalog({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			agentId: params.agentId,
			runId: params.runId,
			catalogRef: params.catalogRef,
			entries: reusableSnapshot.entries,
			fingerprint: reusableSnapshot.fingerprint
		});
		if (reusableKey) {
			reusableCatalogSnapshots.delete(reusableKey);
			reusableCatalogSnapshots.set(reusableKey, reusableSnapshot);
		}
		return {
			tools: visible,
			compacted: catalog.length > 0,
			catalogToolCount: catalog.length,
			catalogRegistered: true,
			catalogReused: true
		};
	}
	const registered = registerToolSearchCatalog({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		runId: params.runId,
		catalogRef: params.catalogRef,
		entries: catalog,
		append: false
	});
	if (registered) rememberReusableCatalog(reusableKey, registered);
	return {
		tools: visible,
		compacted: catalog.length > 0,
		catalogToolCount: catalog.length,
		catalogRegistered: true,
		catalogReused: false
	};
}
/** Append client-side tool definitions to an already registered catalog. */
function addClientToolsToToolCatalog(params) {
	const key = sessionCatalogKey(params);
	if (!params.enabled || !key && !params.catalogRef) return {
		tools: params.tools,
		compacted: false,
		catalogToolCount: 0
	};
	if (!(params.catalogRef?.current ?? (key ? sessionCatalogs.get(key) : void 0))) return {
		tools: params.tools,
		compacted: false,
		catalogToolCount: 0
	};
	registerToolSearchCatalog({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		runId: params.runId,
		catalogRef: params.catalogRef,
		entries: params.tools.map((tool) => toCatalogEntry(tool, "client")),
		append: true
	});
	return {
		tools: [],
		compacted: params.tools.length > 0,
		catalogToolCount: params.tools.length
	};
}
function toJsonSafe(value) {
	if (value === void 0) return null;
	try {
		const serialized = JSON.stringify(value);
		return serialized === void 0 ? null : JSON.parse(serialized);
	} catch {
		if (value instanceof Error) return value.message;
		if (value === null) return null;
		switch (typeof value) {
			case "string": return value;
			case "number":
			case "boolean":
			case "bigint":
			case "symbol":
			case "function": return String(value);
			default: return Object.prototype.toString.call(value);
		}
	}
}
async function runCodeMode(params) {
	const runtime = new ToolSearchRuntime(params.ctx, params.config);
	const logs = [];
	return {
		ok: true,
		value: toJsonSafe(await runCodeModeChild({
			code: params.code,
			config: params.config,
			logs,
			parentToolCallId: params.toolCallId,
			runtime,
			signal: params.signal,
			onUpdate: params.onUpdate
		})),
		logs,
		telemetry: runtime.telemetry()
	};
}
function buildCodeModeChildArgs() {
	if (!process.allowedNodeEnvironmentFlags.has("--permission")) throw new require_common.ToolInputError("tool_search_code requires a Node runtime with --permission support.");
	return [
		"--permission",
		"--input-type=module",
		"--eval",
		TOOL_SEARCH_CODE_MODE_CHILD_SOURCE
	];
}
function isCodeModeBridgeMethod(value) {
	return value === "search" || value === "describe" || value === "call";
}
async function runCodeModeBridgeRequest(runtime, method, args, options) {
	const values = Array.isArray(args) ? args : [];
	switch (method) {
		case "search": {
			const query = values[0];
			if (typeof query !== "string") throw new require_common.ToolInputError("search query must be a string.");
			const optionsLocal = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(values[1]) ? values[1] : void 0;
			return await runtime.search(query, { limit: typeof optionsLocal?.limit === "number" ? optionsLocal.limit : void 0 });
		}
		case "describe": {
			const id = values[0];
			if (typeof id !== "string") throw new require_common.ToolInputError("describe id must be a string.");
			return await runtime.describe(id, { recoverySurface: "code-mode" });
		}
		case "call": {
			const id = values[0];
			if (typeof id !== "string") throw new require_common.ToolInputError("call id must be a string.");
			return await runtime.call(id, values[1] ?? {}, {
				...options,
				recoverySurface: "code-mode"
			});
		}
	}
	throw new require_common.ToolInputError("Unsupported tool_search_code bridge method.");
}
function appendToolSearchCodeStderrTail(current, chunk) {
	return require_sessions.appendBoundedTextTail(current, chunk, require_sessions.SESSION_TOOL_STDERR_TAIL_BYTES);
}
function runCodeModeChild(params) {
	return new Promise((resolve, reject) => {
		const child = (0, node_child_process.spawn)(process.execPath, buildCodeModeChildArgs(), {
			cwd: node_os.default.tmpdir(),
			env: {},
			stdio: [
				"ignore",
				"ignore",
				"pipe",
				"ipc"
			]
		});
		let stderrTail = "";
		let settled = false;
		let timedOut = false;
		let exitRejectionTimer;
		const bridgeAbortController = new AbortController();
		const settle = (callback) => {
			if (settled) return;
			settled = true;
			if (timer) clearTimeout(timer);
			if (exitRejectionTimer) clearTimeout(exitRejectionTimer);
			params.signal?.removeEventListener("abort", abortFromParent);
			child.kill();
			callback();
		};
		const abortFromParent = () => {
			bridgeAbortController.abort(params.signal?.reason);
			child.kill("SIGKILL");
			settle(() => reject(/* @__PURE__ */ new Error("tool_search_code aborted")));
		};
		const timer = setTimeout(() => {
			timedOut = true;
			bridgeAbortController.abort(/* @__PURE__ */ new Error("tool_search_code timed out"));
			child.kill("SIGKILL");
			settle(() => reject(/* @__PURE__ */ new Error("tool_search_code timed out")));
		}, params.config.codeTimeoutMs);
		params.signal?.addEventListener("abort", abortFromParent, { once: true });
		if (params.signal?.aborted) {
			abortFromParent();
			return;
		}
		child.stderr?.setEncoding("utf8");
		child.stderr?.on("data", (chunk) => {
			stderrTail = appendToolSearchCodeStderrTail(stderrTail, chunk);
		});
		child.stderr?.on("error", (error) => {
			settle(() => reject(error));
		});
		child.on("error", (error) => {
			settle(() => reject(error));
		});
		child.on("exit", (code, signal) => {
			if (settled) return;
			const rejectOnExit = () => {
				const suffix = stderrTail.trim();
				const detail = suffix ? `: ${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(suffix, -500)}` : "";
				settle(() => reject(/* @__PURE__ */ new Error(timedOut ? "tool_search_code timed out" : `tool_search_code child exited with ${signal ?? code}${detail}`)));
			};
			if (code === 0 && signal === null) {
				exitRejectionTimer = setTimeout(rejectOnExit, 250);
				return;
			}
			rejectOnExit();
		});
		child.on("message", (message) => {
			if (settled) return;
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message) || typeof message.type !== "string") return;
			if (message.type === "log") {
				const items = Array.isArray(message.items) ? message.items : [];
				params.logs.push(items.map((item) => String(item)).join(" "));
				return;
			}
			if (message.type === "result") {
				if (message.ok) settle(() => resolve(message.value));
				else settle(() => reject(new Error(typeof message.error === "string" ? message.error : "code failed")));
				return;
			}
			if (message.type !== "bridge") return;
			const id = typeof message.id === "string" ? message.id : "";
			const method = isCodeModeBridgeMethod(message.method) ? message.method : void 0;
			if (!id || !method) return;
			runCodeModeBridgeRequest(params.runtime, method, message.args, {
				parentToolCallId: params.parentToolCallId,
				signal: bridgeAbortController.signal,
				onUpdate: params.onUpdate
			}).then((value) => {
				if (settled || !child.connected) return;
				const response = {
					type: "bridge-result",
					id,
					ok: true,
					value: toJsonSafe(value)
				};
				child.send(response, () => void 0);
			}).catch((error) => {
				if (settled || !child.connected) return;
				const response = {
					type: "bridge-result",
					id,
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				};
				child.send(response, () => void 0);
			});
		});
		child.send({
			type: "run",
			code: params.code,
			timeoutMs: params.config.codeTimeoutMs
		});
	});
}
function readCode(args) {
	const code = require_common.asToolParamsRecord(args).code;
	if (typeof code !== "string" || !code.trim()) throw new require_common.ToolInputError("code must be a non-empty string.");
	return code;
}
/** Create Tool Search control tools for the current run/session context. */
function createToolSearchTools(ctx) {
	const config = resolveToolSearchConfig(ctx.runtimeConfig ?? ctx.config);
	const runtime = new ToolSearchRuntime(ctx, config);
	return [
		{
			name: TOOL_SEARCH_CODE_MODE_TOOL_NAME,
			label: "Tool Search Code",
			description: "Run JavaScript in an isolated Node subprocess with operator.tools.search, operator.tools.describe, and operator.tools.call for large tool catalogs.",
			parameters: typebox.Type.Object({ code: typebox.Type.String({ description: "JavaScript body for an async function. Use return to return the final value. The operator.tools bridge is available." }) }),
			execute: async (toolCallId, args, signal, onUpdate) => require_common.jsonResult(await runCodeMode({
				toolCallId,
				ctx,
				code: readCode(args),
				config,
				signal,
				onUpdate
			}))
		},
		{
			name: TOOL_SEARCH_RAW_TOOL_NAME,
			label: "Tool Search",
			description: "Search the effective Tool Search catalog.",
			parameters: typebox.Type.Object({
				query: typebox.Type.String({ description: "Search query." }),
				limit: typebox.Type.Optional(typebox.Type.Number({ description: "Maximum number of results." }))
			}),
			execute: async (_toolCallId, args) => {
				const search = readSearchArgs(args, config);
				return require_common.jsonResult(await runtime.search(search.query, { limit: search.limit }));
			}
		},
		{
			name: TOOL_DESCRIBE_RAW_TOOL_NAME,
			label: "Tool Describe",
			description: "Load the full schema and metadata for one search result.",
			parameters: typebox.Type.Object({ id: typebox.Type.String({ description: "Tool search result id or tool name." }) }),
			execute: async (_toolCallId, args) => require_common.jsonResult(await runtime.describe(readId(args)))
		},
		{
			name: TOOL_CALL_RAW_TOOL_NAME,
			label: "Tool Call",
			description: "Call a selected Tool Search catalog entry through Operator.",
			parameters: typebox.Type.Object({
				id: typebox.Type.String({ description: "Tool search result id or tool name." }),
				args: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown(), { description: "Tool input." }))
			}),
			execute: async (_toolCallId, args, signal, onUpdate) => {
				const call = readCallArgs(args);
				return require_common.jsonResult(await runtime.call(call.id, call.input, {
					parentToolCallId: _toolCallId,
					signal,
					onUpdate
				}));
			}
		}
	];
}
const testing = {
	sessionCatalogs,
	reusableCatalogSnapshots,
	maxToolSchemaDirectoryPromptChars: MAX_TOOL_SCHEMA_DIRECTORY_PROMPT_CHARS,
	resolveToolSearchConfig,
	isToolSearchCodeModeSupported,
	setToolSearchCodeModeSupportedForTest: (value) => {
		toolSearchCodeModeSupportedForTest = value;
	},
	setToolSearchMinCodeTimeoutMsForTest: (value) => {
		toolSearchMinCodeTimeoutMsForTest = typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
	},
	applyToolSearchCatalog,
	addClientToolsToToolSearchCatalog,
	appendToolSearchCodeStderrTail,
	runCodeModeChild
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.toolSearchTestApi")] = testing;
//#endregion
//#region src/agents/agent-tools.abort.ts
/**
* Abort-signal wrapping for agent tools.
* Combines per-call cancellation with run-level aborts while preserving plugin,
* channel, and before_tool_call metadata on wrapped tools.
*/
function throwAbortError() {
	throw require_abort_signal.createAbortError("Aborted");
}
/** Wrap a tool so every execute call observes the supplied run abort signal. */
function wrapToolWithAbortSignal(tool, abortSignal) {
	if (!abortSignal) return tool;
	const execute = tool.execute;
	if (!execute) return tool;
	const wrappedTool = {
		...tool,
		execute: async (toolCallId, params, signal, onUpdate) => {
			const combinedSignal = signal ? AbortSignal.any([signal, abortSignal]) : abortSignal;
			if (combinedSignal.aborted) throwAbortError();
			return await execute(toolCallId, params, combinedSignal, onUpdate);
		}
	};
	require_tools.copyPluginToolMeta(tool, wrappedTool);
	require_gateway.copyChannelAgentToolMeta(tool, wrappedTool);
	require_gateway.copyBeforeToolCallHookMarker(tool, wrappedTool);
	return wrappedTool;
}
//#endregion
//#region src/agents/agent-tools.deferred-followup.ts
function replaceDescription(tool, description) {
	const updated = {
		...tool,
		description
	};
	require_tools.copyPluginToolMeta(tool, updated);
	require_gateway.copyChannelAgentToolMeta(tool, updated);
	require_gateway.copyBeforeToolCallHookMarker(tool, updated);
	require_gateway.copyToolTerminalPresentation(tool, updated);
	return updated;
}
/** Return tools with exec/process descriptions adjusted for cron availability. */
function applyDeferredFollowupToolDescriptions(tools, params) {
	const hasCronTool = tools.some((tool) => tool.name === "cron");
	return tools.map((tool) => {
		if (tool.name === "exec") return replaceDescription(tool, require_bash_tools_descriptions.describeExecTool({
			agentId: params?.agentId,
			hasCronTool
		}));
		if (tool.name === "process") return replaceDescription(tool, require_bash_tools_descriptions.describeProcessTool({ hasCronTool }));
		return tool;
	});
}
//#endregion
//#region src/agents/agent-tools.schema.ts
/**
* Tool schema normalization wrappers.
* Applies provider-compatible parameter schema cleanup while preserving plugin
* and channel metadata on normalized tools.
*/
function isObjectSchemaWithNoRequiredParams(schema) {
	if (!schema || typeof schema !== "object" || Array.isArray(schema)) return false;
	const record = schema;
	const type = record.type;
	if (!(type === "object" || Array.isArray(type) && type.some((entry) => entry === "object"))) return false;
	return !schemaHasRequiredParams(record);
}
function schemaHasRequiredParams(schema) {
	if (Array.isArray(schema.required) && schema.required.length > 0) return true;
	for (const key of [
		"allOf",
		"anyOf",
		"oneOf"
	]) {
		const variants = schema[key];
		if (!Array.isArray(variants)) continue;
		if (variants.some((variant) => variant !== null && typeof variant === "object" && !Array.isArray(variant) && schemaHasRequiredParams(variant))) return true;
	}
	return false;
}
function addEmptyObjectArgumentPreparation(tool, parameters) {
	if (!isObjectSchemaWithNoRequiredParams(parameters)) return tool;
	return {
		...tool,
		prepareArguments: (args) => {
			const prepared = tool.prepareArguments ? tool.prepareArguments(args) : args;
			return prepared === null || prepared === void 0 ? {} : prepared;
		}
	};
}
/** Normalize a tool's parameter schema for the selected provider/model. */
function normalizeToolParameters(tool, options) {
	function preserveToolMeta(target) {
		require_tools.copyPluginToolMeta(tool, target);
		require_gateway.copyChannelAgentToolMeta(tool, target);
		require_gateway.copyBeforeToolCallHookMarker(tool, target);
		require_gateway.copyToolTerminalPresentation(tool, target);
		return target;
	}
	const schema = tool.parameters && typeof tool.parameters === "object" ? tool.parameters : void 0;
	if (!schema) return tool;
	const parameters = (0, _gabrielvfonseca_ai_internal_openai.normalizeToolParameterSchema)(schema, options);
	return preserveToolMeta({
		...tool,
		...addEmptyObjectArgumentPreparation(tool, parameters),
		parameters
	});
}
//#endregion
//#region src/agents/apply-patch-model-policy.ts
function isApplyPatchAllowedForModel(params) {
	const allowModels = Array.isArray(params.allowModels) ? params.allowModels : [];
	if (allowModels.length === 0) return true;
	const modelId = params.modelId?.trim();
	if (!modelId) return false;
	const normalizedModelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId);
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.modelProvider);
	const normalizedFull = provider && !normalizedModelId.includes("/") ? `${provider}/${normalizedModelId}` : normalizedModelId;
	return allowModels.some((entry) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry);
		return Boolean(normalized && (normalized === normalizedModelId || normalized === normalizedFull));
	});
}
//#endregion
//#region src/agents/apply-patch-update.ts
/**
* Update-hunk application for the apply_patch parser.
* Locates expected old lines with tolerant matching, applies chunks in order,
* and returns normalized file contents with a trailing newline.
*/
const DASH_PUNCTUATION = /[\u2010-\u2015\u2212]/g;
const SINGLE_QUOTE_PUNCTUATION = /[\u2018-\u201B]/g;
const DOUBLE_QUOTE_PUNCTUATION = /[\u201C-\u201F]/g;
const SPACE_PUNCTUATION = /[\u00A0\u2002-\u200A\u202F\u205F\u3000]/g;
async function defaultReadFile(filePath) {
	return node_fs_promises.default.readFile(filePath, "utf8");
}
/** Apply parsed update chunks to one file and return the new file contents. */
async function applyUpdateHunk(filePath, chunks, options) {
	const originalLines = (await (options?.readFile ?? defaultReadFile)(filePath).catch((err) => {
		throw new Error(`Failed to read file to update ${filePath}: ${require_errors.formatErrorMessage(err)}`);
	})).split("\n");
	if (originalLines.length > 0 && originalLines[originalLines.length - 1] === "") originalLines.pop();
	let newLines = applyReplacements(originalLines, computeReplacements(originalLines, filePath, chunks));
	if (newLines.length === 0 || newLines[newLines.length - 1] !== "") newLines = [...newLines, ""];
	return newLines.join("\n");
}
function computeReplacements(originalLines, filePath, chunks) {
	const replacements = [];
	let lineIndex = 0;
	for (const chunk of chunks) {
		if (chunk.changeContext) {
			const ctxIndex = seekSequence(originalLines, [chunk.changeContext], lineIndex, false);
			if (ctxIndex === null) throw new Error(`Failed to find context '${chunk.changeContext}' in ${filePath}`);
			lineIndex = ctxIndex + 1;
		}
		if (chunk.oldLines.length === 0) {
			const insertionIndex = chunk.changeContext && !chunk.isEndOfFile ? lineIndex : originalLines.length > 0 && originalLines[originalLines.length - 1] === "" ? originalLines.length - 1 : originalLines.length;
			replacements.push([
				insertionIndex,
				0,
				chunk.newLines
			]);
			lineIndex = insertionIndex;
			continue;
		}
		let pattern = chunk.oldLines;
		let newSlice = chunk.newLines;
		let found = seekSequence(originalLines, pattern, lineIndex, chunk.isEndOfFile);
		if (found === null && pattern[pattern.length - 1] === "") {
			pattern = pattern.slice(0, -1);
			if (newSlice.length > 0 && newSlice[newSlice.length - 1] === "") newSlice = newSlice.slice(0, -1);
			found = seekSequence(originalLines, pattern, lineIndex, chunk.isEndOfFile);
		}
		if (found === null) throw new Error(`Failed to find expected lines in ${filePath}:\n${chunk.oldLines.join("\n")}`);
		replacements.push([
			found,
			pattern.length,
			newSlice
		]);
		lineIndex = found + pattern.length;
	}
	replacements.sort((a, b) => a[0] - b[0]);
	return replacements;
}
function applyReplacements(lines, replacements) {
	const result = [...lines];
	for (const [startIndex, oldLen, newLines] of [...replacements].toReversed()) {
		for (let i = 0; i < oldLen; i += 1) if (startIndex < result.length) result.splice(startIndex, 1);
		for (const [i, line] of newLines.entries()) result.splice(startIndex + i, 0, line);
	}
	return result;
}
function seekSequence(lines, pattern, start, eof) {
	if (pattern.length === 0) return start;
	if (pattern.length > lines.length) return null;
	const maxStart = lines.length - pattern.length;
	const searchStart = eof && lines.length >= pattern.length ? maxStart : start;
	if (searchStart > maxStart) return null;
	const normalizers = [
		(value) => value,
		(value) => value.trimEnd(),
		(value) => value.trim(),
		(value) => normalizePunctuation(value.trim())
	];
	for (const normalize of normalizers) for (let i = searchStart; i <= maxStart; i += 1) if (linesMatch(lines, pattern, i, normalize)) return i;
	return null;
}
function linesMatch(lines, pattern, start, normalize) {
	for (let idx = 0; idx < pattern.length; idx += 1) {
		const line = lines.at(start + idx);
		const expected = pattern.at(idx);
		if (line === void 0 || expected === void 0 || normalize(line) !== normalize(expected)) return false;
	}
	return true;
}
function normalizePunctuation(value) {
	return value.replace(DASH_PUNCTUATION, "-").replace(SINGLE_QUOTE_PUNCTUATION, "'").replace(DOUBLE_QUOTE_PUNCTUATION, "\"").replace(SPACE_PUNCTUATION, " ");
}
//#endregion
//#region src/agents/apply-patch.ts
/**
* Runtime apply_patch tool and parser.
* Parses OpenAI-style patch envelopes and applies add/update/delete/move hunks
* through guarded host or sandbox filesystem operations.
*/
const BEGIN_PATCH_MARKER = "*** Begin Patch";
const END_PATCH_MARKER = "*** End Patch";
const ADD_FILE_MARKER = "*** Add File: ";
const DELETE_FILE_MARKER = "*** Delete File: ";
const UPDATE_FILE_MARKER = "*** Update File: ";
const MOVE_TO_MARKER = "*** Move to: ";
const EOF_MARKER = "*** End of File";
const CHANGE_CONTEXT_MARKER = "@@ ";
const EMPTY_CHANGE_CONTEXT_MARKER = "@@";
function normalizeUpdateComparison(content) {
	const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	if (normalized.length === 0 || normalized.endsWith("\n")) return normalized;
	return `${normalized}\n`;
}
const applyPatchSchema = typebox.Type.Object({ input: typebox.Type.String({ description: "Patch content using the *** Begin Patch/End Patch format." }) });
/** Create the agent tool wrapper for applying patch-envelope input. */
function createApplyPatchTool(options = {}) {
	const cwd = options.cwd ?? process.cwd();
	const sandbox = options.sandbox;
	const workspaceOnly = options.workspaceOnly !== false;
	return {
		name: "apply_patch",
		label: "apply_patch",
		description: "Patch one/many files. Input requires *** Begin Patch and *** End Patch.",
		parameters: applyPatchSchema,
		execute: async (_toolCallId, args, signal) => {
			const params = args;
			const input = typeof params.input === "string" ? params.input : "";
			if (!input.trim()) throw new Error("Provide a patch input.");
			if (signal?.aborted) throw require_abort_signal.createAbortError("Aborted");
			const result = await applyPatch(input, {
				cwd,
				sandbox,
				workspaceOnly,
				signal
			});
			return {
				content: [{
					type: "text",
					text: result.text
				}],
				details: { summary: result.summary },
				...result.noOp ? { terminate: true } : {}
			};
		}
	};
}
/** Parse and apply a patch envelope to the configured filesystem target. */
async function applyPatch(input, options) {
	const parsed = parsePatchText(input);
	if (parsed.hunks.length === 0) throw new Error("No files were modified.");
	const summary = {
		added: [],
		modified: [],
		deleted: []
	};
	const seen = {
		added: /* @__PURE__ */ new Set(),
		modified: /* @__PURE__ */ new Set(),
		deleted: /* @__PURE__ */ new Set()
	};
	const noOpPaths = /* @__PURE__ */ new Set();
	const fileOps = resolvePatchFileOps(options);
	for (const hunk of parsed.hunks) {
		if (options.signal?.aborted) throw require_abort_signal.createAbortError("Aborted");
		if (hunk.kind === "add") {
			const target = await resolvePatchPath(hunk.path, options);
			await assertPatchParentPath(hunk.path, options);
			await ensureDir(target.resolved, fileOps);
			await fileOps.writeFile(target.resolved, hunk.contents);
			recordSummary(summary, seen, "added", target.display);
			continue;
		}
		if (hunk.kind === "delete") {
			const target = await resolvePatchPath(hunk.path, options, _openclaw_fs_safe_advanced.PATH_ALIAS_POLICIES.unlinkTarget);
			await fileOps.remove(target.resolved);
			recordSummary(summary, seen, "deleted", target.display);
			continue;
		}
		const target = await resolvePatchPath(hunk.path, options);
		const applied = await applyUpdateHunk(target.resolved, hunk.chunks, { readFile: (pathLocal) => fileOps.readFile(pathLocal) });
		if (hunk.movePath) {
			const moveTarget = await resolvePatchPath(hunk.movePath, options);
			await assertPatchParentPath(hunk.movePath, options);
			await ensureDir(moveTarget.resolved, fileOps);
			const moveResolvesToSource = node_path.default.resolve(moveTarget.resolved) === node_path.default.resolve(target.resolved);
			const destination = moveResolvesToSource ? target.resolved : moveTarget.resolved;
			if (moveResolvesToSource) if (normalizeUpdateComparison(await fileOps.readFile(target.resolved)) === normalizeUpdateComparison(applied)) noOpPaths.add(target.display);
			else {
				noOpPaths.delete(target.display);
				await fileOps.writeFile(destination, applied);
			}
			else {
				noOpPaths.delete(target.display);
				await fileOps.writeFile(destination, applied);
			}
			if (!moveResolvesToSource) await fileOps.remove(target.resolved);
			if (!noOpPaths.has(target.display)) recordSummary(summary, seen, "modified", moveResolvesToSource ? target.display : moveTarget.display);
		} else if (normalizeUpdateComparison(await fileOps.readFile(target.resolved)) === normalizeUpdateComparison(applied)) noOpPaths.add(target.display);
		else {
			noOpPaths.delete(target.display);
			await fileOps.writeFile(target.resolved, applied);
			recordSummary(summary, seen, "modified", target.display);
		}
	}
	const noOp = noOpPaths.size > 0 && Object.values(summary).every((paths) => paths.length === 0);
	return {
		summary,
		text: noOp ? `No changes made to ${Array.from(noOpPaths).join(", ")}.` : formatSummary(summary),
		...noOp ? { noOp: true } : {}
	};
}
function recordSummary(summary, seen, bucket, value) {
	if (seen[bucket].has(value)) return;
	seen[bucket].add(value);
	summary[bucket].push(value);
}
function formatSummary(summary) {
	const lines = ["Success. Updated the following files:"];
	for (const file of summary.added) lines.push(`A ${file}`);
	for (const file of summary.modified) lines.push(`M ${file}`);
	for (const file of summary.deleted) lines.push(`D ${file}`);
	return lines.join("\n");
}
function resolvePatchFileOps(options) {
	if (options.sandbox) {
		const { root, bridge } = options.sandbox;
		return {
			readFile: async (filePath) => {
				return (await bridge.readFile({
					filePath,
					cwd: root
				})).toString("utf8");
			},
			writeFile: (filePath, content) => bridge.writeFile({
				filePath,
				cwd: root,
				data: content
			}),
			remove: (filePath) => bridge.remove({
				filePath,
				cwd: root,
				force: false
			}),
			mkdirp: (dir) => bridge.mkdirp({
				filePath: dir,
				cwd: root
			})
		};
	}
	const workspaceOnly = options.workspaceOnly !== false;
	const rootPromise = workspaceOnly ? (0, _openclaw_fs_safe_root.root)(options.cwd) : void 0;
	return {
		readFile: async (filePath) => {
			if (!workspaceOnly) return await node_fs_promises.default.readFile(filePath, "utf8");
			const opened = await (0, _openclaw_fs_safe_advanced.openRootFile)({
				absolutePath: filePath,
				rootPath: options.cwd,
				boundaryLabel: "workspace root"
			});
			assertBoundaryRead(opened, filePath);
			try {
				return node_fs.default.readFileSync(opened.fd, "utf8");
			} finally {
				node_fs.default.closeSync(opened.fd);
			}
		},
		writeFile: async (filePath, content) => {
			if (!workspaceOnly) {
				await node_fs_promises.default.writeFile(filePath, content, "utf8");
				return;
			}
			const relative = require_path_policy.toRelativeSandboxPath(options.cwd, filePath);
			await (await rootPromise)?.write(relative, content, { encoding: "utf8" });
		},
		remove: async (filePath) => {
			if (!workspaceOnly) {
				await node_fs_promises.default.rm(filePath);
				return;
			}
			const relative = require_path_policy.toRelativeSandboxPath(options.cwd, filePath);
			await (await rootPromise)?.remove(relative);
		},
		mkdirp: async (dir) => {
			if (!workspaceOnly) {
				await node_fs_promises.default.mkdir(dir, { recursive: true });
				return;
			}
			const relative = require_path_policy.toRelativeSandboxPath(options.cwd, dir, { allowRoot: true });
			const root = await rootPromise;
			if (!root) return;
			if (relative === "" || relative === ".") {
				await root.ensureRoot();
				return;
			}
			await root.mkdir(relative);
		}
	};
}
async function ensureDir(filePath, ops) {
	const parent = node_path.default.dirname(filePath);
	if (!parent || parent === ".") return;
	await ops.mkdirp(parent);
}
async function assertPatchParentPath(filePath, options) {
	if (options.workspaceOnly === false || options.sandbox) return;
	const parent = node_path.default.dirname(filePath);
	if (!parent || parent === ".") return;
	await require_sandbox_paths.assertSandboxPath({
		filePath: parent,
		cwd: options.cwd,
		root: options.cwd
	});
	await assertNoExistingParentAliases({
		parentPath: require_path_policy.resolvePathFromInput(parent, options.cwd),
		rootPath: options.cwd
	});
}
async function assertNoExistingParentAliases(params) {
	const rootPath = node_path.default.resolve(params.rootPath);
	const parentPath = node_path.default.resolve(params.parentPath);
	const relative = node_path.default.relative(rootPath, parentPath);
	if (!relative || relative === "" || relativePathEscapesRoot(relative)) return;
	let current = rootPath;
	for (const segment of relative.split(node_path.default.sep)) {
		if (!segment) continue;
		current = node_path.default.join(current, segment);
		const stat = await node_fs_promises.default.lstat(current).catch((error) => {
			if (error.code === "ENOENT") return null;
			throw error;
		});
		if (!stat) return;
		if (stat.isSymbolicLink()) throw new Error(`Path alias under sandbox root: ${node_path.default.relative(rootPath, current)}`);
	}
}
async function resolvePatchPath(filePath, options, aliasPolicy = _openclaw_fs_safe_advanced.PATH_ALIAS_POLICIES.strict) {
	if (options.sandbox) {
		const resolved = options.sandbox.bridge.resolvePath({
			filePath,
			cwd: options.cwd
		});
		if (options.workspaceOnly !== false && resolved.hostPath) await require_sandbox_paths.assertSandboxPath({
			filePath: resolved.hostPath,
			cwd: options.cwd,
			root: options.cwd,
			allowFinalSymlinkForUnlink: aliasPolicy.allowFinalSymlinkForUnlink,
			allowFinalHardlinkForUnlink: aliasPolicy.allowFinalHardlinkForUnlink
		});
		return {
			resolved: resolved.hostPath ?? resolved.containerPath,
			display: resolved.relativePath || resolved.containerPath
		};
	}
	const resolved = options.workspaceOnly !== false ? (await require_sandbox_paths.assertSandboxPath({
		filePath,
		cwd: options.cwd,
		root: options.cwd,
		allowFinalSymlinkForUnlink: aliasPolicy.allowFinalSymlinkForUnlink,
		allowFinalHardlinkForUnlink: aliasPolicy.allowFinalHardlinkForUnlink
	})).resolved : require_path_policy.resolvePathFromInput(filePath, options.cwd);
	return {
		resolved,
		display: toDisplayPath(resolved, options.cwd)
	};
}
function assertBoundaryRead(opened, targetPath) {
	if (opened.ok) return;
	const reason = opened.reason === "validation" ? "unsafe path" : "path not found";
	throw new Error(`Failed boundary read for ${targetPath} (${reason})`);
}
function toDisplayPath(resolved, cwd) {
	const relative = node_path.default.relative(cwd, resolved);
	if (!relative || relative === "") return node_path.default.basename(resolved);
	if (relativePathEscapesRoot(relative)) return resolved;
	return relative;
}
function relativePathEscapesRoot(relativePath) {
	return relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("..\\") || node_path.default.isAbsolute(relativePath);
}
function parsePatchText(input) {
	const trimmed = input.trim();
	if (!trimmed) throw new Error("Invalid patch: input is empty.");
	const validated = checkPatchBoundariesLenient(trimmed.split(/\r?\n/));
	const hunks = [];
	const lastLineIndex = validated.length - 1;
	let remaining = validated.slice(1, lastLineIndex);
	let lineNumber = 2;
	while (remaining.length > 0) {
		const { hunk, consumed } = parseOneHunk(remaining, lineNumber);
		hunks.push(hunk);
		lineNumber += consumed;
		remaining = remaining.slice(consumed);
	}
	return {
		hunks,
		patch: validated.join("\n")
	};
}
function checkPatchBoundariesLenient(lines) {
	const strictError = checkPatchBoundariesStrict(lines);
	if (!strictError) return lines;
	if (lines.length < 4) throw new Error(strictError);
	const first = lines[0];
	const last = lines.at(-1);
	if (last && (first === "<<EOF" || first === "<<'EOF'" || first === "<<\"EOF\"") && last.endsWith("EOF")) {
		const inner = lines.slice(1, -1);
		const innerError = checkPatchBoundariesStrict(inner);
		if (!innerError) return inner;
		throw new Error(innerError);
	}
	throw new Error(strictError);
}
function checkPatchBoundariesStrict(lines) {
	const firstLine = lines[0]?.trim();
	const lastLine = lines[lines.length - 1]?.trim();
	if (firstLine === BEGIN_PATCH_MARKER && lastLine === END_PATCH_MARKER) return null;
	if (firstLine !== BEGIN_PATCH_MARKER) return "The first line of the patch must be '*** Begin Patch'";
	return "The last line of the patch must be '*** End Patch'";
}
function parseOneHunk(lines, lineNumber) {
	if (lines.length === 0) throw new Error(`Invalid patch hunk at line ${lineNumber}: empty hunk`);
	const firstLine = lines.at(0)?.trim();
	if (firstLine === void 0) throw new Error(`Invalid patch hunk at line ${lineNumber}: empty hunk`);
	if (firstLine.startsWith(ADD_FILE_MARKER)) {
		const targetPath = firstLine.slice(14);
		let contents = "";
		let consumed = 1;
		for (const addLine of lines.slice(1)) if (addLine.startsWith("+")) {
			contents += `${addLine.slice(1)}\n`;
			consumed += 1;
		} else break;
		return {
			hunk: {
				kind: "add",
				path: targetPath,
				contents
			},
			consumed
		};
	}
	if (firstLine.startsWith(DELETE_FILE_MARKER)) return {
		hunk: {
			kind: "delete",
			path: firstLine.slice(17)
		},
		consumed: 1
	};
	if (firstLine.startsWith(UPDATE_FILE_MARKER)) {
		const targetPath = firstLine.slice(17);
		let remaining = lines.slice(1);
		let consumed = 1;
		let movePath;
		const moveCandidate = remaining[0]?.trim();
		if (moveCandidate?.startsWith(MOVE_TO_MARKER)) {
			movePath = moveCandidate.slice(13);
			remaining = remaining.slice(1);
			consumed += 1;
		}
		const chunks = [];
		while (remaining.length > 0) {
			const firstRemaining = remaining.at(0);
			if (firstRemaining === void 0) break;
			if (firstRemaining.trim() === "") {
				remaining = remaining.slice(1);
				consumed += 1;
				continue;
			}
			if (firstRemaining.startsWith("***")) break;
			const { chunk, consumed: chunkLines } = parseUpdateFileChunk(remaining, lineNumber + consumed, chunks.length === 0);
			chunks.push(chunk);
			remaining = remaining.slice(chunkLines);
			consumed += chunkLines;
		}
		if (chunks.length === 0) throw new Error(`Invalid patch hunk at line ${lineNumber}: Update file hunk for path '${targetPath}' is empty`);
		return {
			hunk: {
				kind: "update",
				path: targetPath,
				movePath,
				chunks
			},
			consumed
		};
	}
	throw new Error(`Invalid patch hunk at line ${lineNumber}: '${lines[0]}' is not a valid hunk header. Valid hunk headers: '*** Add File: {path}', '*** Delete File: {path}', '*** Update File: {path}'`);
}
function parseUpdateFileChunk(lines, lineNumber, allowMissingContext) {
	if (lines.length === 0) throw new Error(`Invalid patch hunk at line ${lineNumber}: Update hunk does not contain any lines`);
	let changeContext;
	let startIndex = 0;
	const firstLine = lines.at(0);
	if (firstLine === EMPTY_CHANGE_CONTEXT_MARKER) startIndex = 1;
	else if (firstLine?.startsWith(CHANGE_CONTEXT_MARKER)) {
		changeContext = firstLine.slice(3);
		startIndex = 1;
	} else if (!allowMissingContext) throw new Error(`Invalid patch hunk at line ${lineNumber}: Expected update hunk to start with a @@ context marker, got: '${firstLine}'`);
	if (startIndex >= lines.length) throw new Error(`Invalid patch hunk at line ${lineNumber + 1}: Update hunk does not contain any lines`);
	const chunk = {
		changeContext,
		oldLines: [],
		newLines: [],
		isEndOfFile: false
	};
	let parsedLines = 0;
	for (const line of lines.slice(startIndex)) {
		if (line === EOF_MARKER) {
			if (parsedLines === 0) throw new Error(`Invalid patch hunk at line ${lineNumber + 1}: Update hunk does not contain any lines`);
			chunk.isEndOfFile = true;
			parsedLines += 1;
			break;
		}
		const marker = line[0];
		if (!marker) {
			chunk.oldLines.push("");
			chunk.newLines.push("");
			parsedLines += 1;
			continue;
		}
		if (marker === " ") {
			const content = line.slice(1);
			chunk.oldLines.push(content);
			chunk.newLines.push(content);
			parsedLines += 1;
			continue;
		}
		if (marker === "+") {
			chunk.newLines.push(line.slice(1));
			parsedLines += 1;
			continue;
		}
		if (marker === "-") {
			chunk.oldLines.push(line.slice(1));
			parsedLines += 1;
			continue;
		}
		if (parsedLines === 0) throw new Error(`Invalid patch hunk at line ${lineNumber + 1}: Unexpected line found in update hunk: '${line}'. Every line should start with ' ' (context line), '+' (added line), or '-' (removed line)`);
		break;
	}
	return {
		chunk,
		consumed: parsedLines + startIndex
	};
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.applyPatchTestApi")] = { applyPatch };
//#endregion
//#region src/agents/local-model-lean.ts
const LOCAL_MODEL_LEAN_DENY_TOOL_NAMES = /* @__PURE__ */ new Set([
	"browser",
	"cron",
	"image_generate",
	"message",
	"music_generate",
	"pdf",
	"tts",
	"video_generate"
]);
const LOCAL_MODEL_LEAN_DIRECT_TOOL_NAMES = /* @__PURE__ */ new Set(["exec"]);
const LOCAL_MODEL_LEAN_TOOL_SEARCH_DEFAULTS = {
	enabled: true,
	mode: "tools",
	searchDefaultLimit: 5,
	maxSearchLimit: 10
};
function resolvePreservedLocalModelLeanToolNames(names) {
	if (!names) return [];
	return require_glob_pattern.compileGlobPatterns({
		raw: require_tool_policy.expandToolGroups([...names]).filter((name) => require_tool_policy.normalizeToolName(name) !== "*"),
		normalize: require_tool_policy.normalizeToolName
	});
}
/** Resolves tool names that must survive local-model lean filtering. */
function resolveLocalModelLeanPreserveToolNames(params) {
	const names = [...params?.toolNames ?? []];
	if (params?.forceMessageTool || params?.sourceReplyDeliveryMode === "message_tool_only") names.push("message");
	return [...new Set(names)];
}
function resolveLocalModelLeanAgentId(params) {
	const explicitAgentId = typeof params.agentId === "string" && params.agentId.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : void 0;
	if (explicitAgentId) return explicitAgentId;
	const parsedSessionAgentId = require_session_key.parseAgentSessionKey(params.sessionKey)?.agentId;
	if (parsedSessionAgentId) return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsedSessionAgentId);
	return params.config ? require_agent_scope_config.resolveDefaultAgentId(params.config) : void 0;
}
/** Returns true when local-model lean mode is enabled for the selected agent. */
function isLocalModelLeanEnabled(params) {
	const normalizedAgentId = resolveLocalModelLeanAgentId(params);
	return (params.config && normalizedAgentId ? require_agent_scope_config.resolveAgentConfig(params.config, normalizedAgentId)?.experimental ?? params.config.agents?.defaults?.experimental : params.config?.agents?.defaults?.experimental)?.localModelLean ?? false;
}
/** Filters tools for local-model lean mode while preserving required delivery tools. */
function filterLocalModelLeanTools(params) {
	if (!isLocalModelLeanEnabled(params)) return params.tools;
	const preservedToolNames = resolvePreservedLocalModelLeanToolNames(params.preserveToolNames);
	return params.tools.filter((tool) => {
		const normalizedName = require_tool_policy.normalizeToolName(tool.name);
		return require_glob_pattern.matchesAnyGlobPattern(normalizedName, preservedToolNames) || !LOCAL_MODEL_LEAN_DENY_TOOL_NAMES.has(normalizedName);
	});
}
function shouldCatalogToolForLocalModelLean(tool) {
	return !LOCAL_MODEL_LEAN_DIRECT_TOOL_NAMES.has(require_tool_policy.normalizeToolName(tool.name));
}
function applyLocalModelLeanToolSearchDefaults(params) {
	if (!params.config || !isLocalModelLeanEnabled(params)) return params.config;
	if (params.config.tools?.toolSearch !== void 0) return params.config;
	return {
		...params.config,
		tools: {
			...params.config.tools,
			toolSearch: LOCAL_MODEL_LEAN_TOOL_SEARCH_DEFAULTS
		}
	};
}
//#endregion
//#region src/agents/agent-tools.ts
const MEMORY_FLUSH_ALLOWED_TOOL_NAMES = /* @__PURE__ */ new Set(["read", "write"]);
function hasExplicitDenyPolicy(policy) {
	return Array.isArray(policy?.deny) && policy.deny.some((entry) => typeof entry === "string" && entry.trim());
}
function readOnlySandboxReadMounts(sandbox) {
	if (!sandbox) return;
	const mounts = [];
	if (sandbox.workspaceAccess === "ro" && sandbox.agentWorkspaceDir !== sandbox.workspaceDir) mounts.push({
		containerRoot: require_constants.SANDBOX_AGENT_WORKSPACE_MOUNT,
		hostRoot: sandbox.agentWorkspaceDir
	});
	if (sandbox.workspaceAccess === "rw") mounts.push(...require_workspace_mounts.resolveReadOnlyWorkspaceSkillMounts({
		workspaceDir: sandbox.workspaceDir,
		agentWorkspaceDir: sandbox.agentWorkspaceDir,
		skillsWorkspaceDir: sandbox.skillsWorkspaceDir,
		workdir: sandbox.containerWorkdir,
		workspaceAccess: sandbox.workspaceAccess
	}).map((mount) => ({
		containerRoot: mount.containerPath,
		hostRoot: mount.hostPath
	})));
	return mounts.length > 0 ? mounts : void 0;
}
const bashToolsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./bash-tools-C75sROer.cjs")).then((n) => n.bash_tools_exports));
function loadBashToolsModule() {
	return bashToolsModuleLoader.load();
}
function createLazyProcessTool(defaults) {
	let loadedTool;
	const loadTool = async () => {
		if (!loadedTool) {
			const { createProcessTool } = await loadBashToolsModule();
			loadedTool = createProcessTool(defaults);
		}
		return loadedTool;
	};
	return {
		name: "process",
		label: "process",
		displaySummary: require_tool_policy.PROCESS_TOOL_DISPLAY_SUMMARY,
		description: require_bash_tools_descriptions.describeProcessTool({ hasCronTool: defaults?.hasCronTool === true }),
		parameters: require_bash_tools_schemas.processSchema,
		execute: async (...args) => (await loadTool()).execute(...args)
	};
}
/** Resolve the process-tool isolation key for exec/process session state. */
function resolveProcessToolScopeKey(params) {
	const explicitScopeKey = params.scopeKey?.trim();
	if (explicitScopeKey) return explicitScopeKey;
	const sessionKey = params.sessionKey?.trim();
	if (sessionKey) return sessionKey;
	const sessionId = params.sessionId?.trim();
	if (sessionId) return sessionId;
	const agentId = params.agentId?.trim();
	return agentId ? `agent:${agentId}` : void 0;
}
function applyModelProviderToolPolicy(toolsInput, params) {
	let tools = toolsInput;
	tools = filterLocalModelLeanTools({
		tools,
		config: params?.config,
		agentId: params?.agentId,
		sessionKey: params?.sessionKey,
		preserveToolNames: params?.localModelLeanPreserveToolNames ?? params?.runtimeToolAllowlist
	});
	if (params?.suppressManagedWebSearch !== false && require_codex_native_web_search_core.shouldSuppressManagedWebSearchTool({
		config: params?.config,
		modelProvider: params?.modelProvider,
		modelApi: params?.modelApi,
		modelId: params?.modelId,
		agentId: params?.agentId,
		sessionKey: params?.sessionKey,
		agentDir: params?.agentDir
	})) return tools.filter((tool) => tool.name !== "web_search");
	return tools;
}
function createOperatorCodingToolsInternal(options) {
	const execToolName = "exec";
	const sandbox = options?.sandbox?.enabled ? options.sandbox : void 0;
	const isMemoryFlushRun = options?.trigger === "memory";
	if (isMemoryFlushRun && !options?.memoryFlushWritePath) throw new Error("memoryFlushWritePath required for memory-triggered tool runs");
	const memoryFlushWritePath = isMemoryFlushRun ? options.memoryFlushWritePath : void 0;
	const cronSelfRemoveOnlyJobId = options?.trigger === "cron" && options.jobId?.trim() ? options.jobId.trim() : void 0;
	const sandboxToolPolicy = sandbox?.tools;
	const capabilityProfile = options?.conversationCapabilityProfile ?? require_conversation_capability_profile.resolveConversationCapabilityProfile({
		config: options?.config,
		sessionKey: options?.sessionKey,
		runSessionKey: options?.runSessionKey,
		sessionId: options?.sessionId,
		runId: options?.runId,
		agentId: options?.agentId,
		agentDir: options?.agentDir,
		agentAccountId: options?.agentAccountId,
		messageProvider: options?.messageProvider,
		messageChannel: options?.messageChannel,
		chatType: options?.chatType,
		messageTo: options?.messageTo,
		messageThreadId: options?.messageThreadId,
		currentChannelId: options?.currentChannelId,
		currentMessagingTarget: options?.currentMessagingTarget,
		currentThreadTs: options?.currentThreadTs,
		currentMessageId: options?.currentMessageId,
		groupId: options?.groupId,
		groupChannel: options?.groupChannel,
		groupSpace: options?.groupSpace,
		memberRoleIds: options?.memberRoleIds,
		spawnedBy: options?.spawnedBy,
		senderId: options?.senderId,
		senderName: options?.senderName,
		senderUsername: options?.senderUsername,
		senderE164: options?.senderE164,
		senderIsOwner: options?.senderIsOwner,
		modelProvider: options?.modelProvider,
		modelId: options?.modelId,
		modelApi: options?.modelApi,
		modelContextWindowTokens: options?.modelContextWindowTokens,
		modelHasVision: options?.modelHasVision,
		workspaceDir: options?.workspaceDir,
		cwd: options?.cwd,
		spawnWorkspaceDir: options?.spawnWorkspaceDir,
		sandboxToolPolicy,
		runtimeToolAllowlist: options?.runtimeToolAllowlist
	});
	const { agentId, globalPolicy, globalProviderPolicy, agentPolicy, agentProviderPolicy, profile, providerProfile, profilePolicy, providerProfilePolicy, profileAlsoAllow, providerProfileAlsoAllow, groupPolicy, senderPolicy, subagentPolicy, inheritedToolPolicy, runtimePluginToolGrant } = capabilityProfile.policy;
	const enableHeartbeatTool = options?.enableHeartbeatTool === true || options?.trigger === "heartbeat" && options?.config?.messages?.visibleReplies === "message_tool";
	const forceHeartbeatTool = options?.forceHeartbeatTool === true || enableHeartbeatTool;
	const toolSearchConfig = resolveToolSearchConfig(options?.config);
	const toolSearchControlsEnabled = options?.includeToolSearchControls === true && toolSearchConfig.enabled;
	const toolSearchControlAllowlist = toolSearchControlsEnabled ? [
		TOOL_SEARCH_CODE_MODE_TOOL_NAME,
		TOOL_SEARCH_RAW_TOOL_NAME,
		TOOL_DESCRIBE_RAW_TOOL_NAME,
		TOOL_CALL_RAW_TOOL_NAME
	] : [];
	const mergeToolSearchControlAllowlist = (policy) => require_tool_policy.mergeAlsoAllowPolicy(policy, toolSearchControlAllowlist);
	const runtimeToolAllowlistIncludesMessage = require_tool_policy.expandToolGroups(options?.runtimeToolAllowlist ?? []).some((toolName) => {
		const normalized = require_tool_policy.normalizeToolName(toolName);
		return normalized === "*" || normalized === "message";
	});
	const localModelLeanPreserveToolNames = resolveLocalModelLeanPreserveToolNames({
		toolNames: capabilityProfile.policy.explicitToolOverrideAllowlist,
		forceMessageTool: options?.forceMessageTool,
		sourceReplyDeliveryMode: options?.sourceReplyDeliveryMode
	});
	const runtimeProfileAlsoAllow = [
		...options?.forceMessageTool || options?.sourceReplyDeliveryMode === "message_tool_only" ? ["message"] : [],
		...runtimeToolAllowlistIncludesMessage ? ["message"] : [],
		...forceHeartbeatTool ? [require_heartbeat_tool_response.HEARTBEAT_RESPONSE_TOOL_NAME] : [],
		...toolSearchControlAllowlist
	];
	const profilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(profilePolicy, [...profileAlsoAllow ?? [], ...runtimeProfileAlsoAllow]);
	const providerProfilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(providerProfilePolicy, [...providerProfileAlsoAllow ?? [], ...runtimeProfileAlsoAllow]);
	const scopeKey = resolveProcessToolScopeKey({
		scopeKey: options?.exec?.scopeKey,
		sessionKey: options?.sessionKey,
		sessionId: options?.sessionId,
		agentId
	});
	const globalPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(globalPolicy);
	const globalProviderPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(globalProviderPolicy);
	const agentPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(agentPolicy);
	const agentProviderPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(agentProviderPolicy);
	const groupPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(groupPolicy);
	const senderPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(senderPolicy);
	const sandboxToolPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(sandboxToolPolicy);
	const subagentPolicyWithToolSearchControls = mergeToolSearchControlAllowlist(subagentPolicy);
	const allowBackground = require_tool_policy_match.isToolAllowedByPolicies("process", [
		profilePolicyWithAlsoAllow,
		providerProfilePolicyWithAlsoAllow,
		globalPolicyWithToolSearchControls,
		globalProviderPolicyWithToolSearchControls,
		agentPolicyWithToolSearchControls,
		agentProviderPolicyWithToolSearchControls,
		groupPolicyWithToolSearchControls,
		senderPolicyWithToolSearchControls,
		sandboxToolPolicyWithToolSearchControls,
		subagentPolicyWithToolSearchControls,
		inheritedToolPolicy
	]);
	options?.recordToolPrepStage?.("tool-policy");
	const execConfig = require_openclaw_tools.resolveExecToolConfig({
		cfg: options?.config,
		agentId
	});
	const fsConfig = require_local_roots.resolveToolFsConfig({
		cfg: options?.config,
		agentId
	});
	const fsPolicy = require_local_roots.createToolFsPolicy({ workspaceOnly: isMemoryFlushRun || fsConfig.workspaceOnly });
	const sandboxRoot = sandbox?.workspaceDir;
	const sandboxFsBridge = sandbox?.fsBridge;
	const allowWorkspaceWrites = sandbox?.workspaceAccess !== "ro";
	const workspaceRoot = capabilityProfile.workspace.workspaceRoot;
	const runtimeRoot = capabilityProfile.workspace.runtimeRoot;
	const codingRoot = sandboxRoot ?? runtimeRoot;
	const memoryFlushWriteRoot = sandboxRoot ?? workspaceRoot;
	const includeCoreTools = options?.includeCoreTools !== false;
	const toolConstructionPlan = options?.toolConstructionPlan ?? {
		includeBaseCodingTools: includeCoreTools,
		includeShellTools: includeCoreTools,
		includeChannelTools: includeCoreTools,
		includeOperatorTools: includeCoreTools,
		includePluginTools: true
	};
	const includeBaseCodingTools = includeCoreTools && toolConstructionPlan.includeBaseCodingTools;
	const includeShellTools = includeCoreTools && toolConstructionPlan.includeShellTools;
	const includeOperatorTools = includeCoreTools && toolConstructionPlan.includeOperatorTools;
	const includeChannelTools = toolConstructionPlan.includeChannelTools;
	const includePluginTools = toolConstructionPlan.includePluginTools;
	const workspaceOnly = fsPolicy.workspaceOnly;
	const applyPatchConfig = execConfig.applyPatch;
	const applyPatchWorkspaceOnly = workspaceOnly || applyPatchConfig?.workspaceOnly !== false;
	const applyPatchEnabled = applyPatchConfig?.enabled !== false && isApplyPatchAllowedForModel({
		modelProvider: options?.modelProvider,
		modelId: options?.modelId,
		allowModels: applyPatchConfig?.allowModels
	});
	if (sandboxRoot && !sandboxFsBridge) throw new Error("Sandbox filesystem bridge is unavailable.");
	const imageSanitization = require_tool_images.resolveImageSanitizationLimits(options?.config);
	options?.recordToolPrepStage?.("workspace-policy");
	const base = [];
	if (includeBaseCodingTools) for (const tool of require_sessions.createCodingTools(codingRoot)) {
		if (tool.name === "read") {
			if (sandboxRoot) {
				const sandboxed = require_web_tools.createSandboxedReadTool({
					root: sandboxRoot,
					bridge: sandboxFsBridge,
					modelContextWindowTokens: options?.modelContextWindowTokens,
					imageSanitization
				});
				const guarded = workspaceOnly ? require_web_tools.wrapToolWorkspaceRootGuardWithOptions(sandboxed, sandboxRoot, {
					additionalContainerMounts: readOnlySandboxReadMounts(sandbox),
					containerWorkdir: sandbox.containerWorkdir
				}) : sandboxed;
				base.push(guarded);
				continue;
			}
			const wrapped = require_web_tools.createOperatorReadTool(require_sessions.createReadTool(codingRoot), {
				modelContextWindowTokens: options?.modelContextWindowTokens,
				imageSanitization
			});
			const guarded = workspaceOnly ? require_web_tools.wrapToolWorkspaceRootGuardWithOptions(wrapped, codingRoot, { additionalRoots: [] }) : wrapped;
			base.push(guarded);
			continue;
		}
		if (tool.name === "bash" || tool.name === execToolName) continue;
		if (tool.name === "write") {
			if (sandboxRoot) continue;
			const wrapped = require_web_tools.createHostWorkspaceWriteTool(codingRoot, { workspaceOnly });
			base.push(workspaceOnly ? require_web_tools.wrapToolWorkspaceRootGuard(wrapped, codingRoot) : wrapped);
			continue;
		}
		if (tool.name === "edit") {
			if (sandboxRoot) continue;
			const wrapped = require_web_tools.createHostWorkspaceEditTool(codingRoot, { workspaceOnly });
			base.push(workspaceOnly ? require_web_tools.wrapToolWorkspaceRootGuard(wrapped, codingRoot) : wrapped);
			continue;
		}
		base.push(tool);
	}
	options?.recordToolPrepStage?.("base-coding-tools");
	const { cleanupMs: cleanupMsOverride, ...execDefaults } = options?.exec ?? {};
	const effectiveExecPolicy = require_exec_policy.applyExecPolicyLayer(execConfig, options?.exec);
	const execTool = includeShellTools ? require_openclaw_tools.createLazyExecTool({
		...execDefaults,
		host: options?.exec?.host ?? execConfig.host,
		mode: effectiveExecPolicy.mode,
		security: effectiveExecPolicy.security,
		ask: effectiveExecPolicy.ask,
		config: options?.exec?.config ?? options?.config,
		reviewer: options?.exec?.reviewer ?? execConfig.reviewer,
		trigger: options?.trigger,
		node: options?.exec?.node ?? execConfig.node,
		pathPrepend: options?.exec?.pathPrepend ?? execConfig.pathPrepend,
		safeBins: options?.exec?.safeBins ?? execConfig.safeBins,
		strictInlineEval: options?.exec?.strictInlineEval ?? execConfig.strictInlineEval,
		commandHighlighting: options?.exec?.commandHighlighting ?? execConfig.commandHighlighting,
		safeBinTrustedDirs: options?.exec?.safeBinTrustedDirs ?? execConfig.safeBinTrustedDirs,
		safeBinProfiles: options?.exec?.safeBinProfiles ?? execConfig.safeBinProfiles,
		agentId,
		cwd: codingRoot,
		allowBackground,
		scopeKey,
		sessionKey: options?.sessionKey,
		sessionId: options?.sessionId,
		sessionStore: options?.config?.session?.store,
		mainKey: options?.config?.session?.mainKey,
		sessionScope: options?.config?.session?.scope,
		eventRouting: require_event_session_routing.resolveEventSessionRoutingPolicy({
			cfg: options?.config,
			sessionKey: options?.sessionKey,
			channel: options?.messageProvider,
			accountId: options?.agentAccountId
		}),
		messageProvider: options?.messageProvider,
		currentChannelId: options?.currentChannelId,
		currentThreadTs: options?.currentThreadTs,
		channelContext: options?.channelContext,
		accountId: options?.agentAccountId,
		approvalReviewerDeviceId: options?.approvalReviewerDeviceId,
		backgroundMs: options?.exec?.backgroundMs ?? execConfig.backgroundMs,
		timeoutSec: options?.exec?.timeoutSec ?? execConfig.timeoutSec,
		approvalRunningNoticeMs: options?.exec?.approvalRunningNoticeMs ?? execConfig.approvalRunningNoticeMs,
		notifyOnExit: options?.exec?.notifyOnExit ?? execConfig.notifyOnExit,
		notifyOnExitEmptySuccess: options?.exec?.notifyOnExitEmptySuccess ?? execConfig.notifyOnExitEmptySuccess,
		sandbox: sandbox ? {
			containerName: sandbox.containerName,
			workspaceDir: sandbox.workspaceDir,
			containerWorkdir: sandbox.containerWorkdir,
			workdirValidation: sandbox.backend?.workdirValidation,
			validateWorkdir: sandbox.backend?.validateWorkdir?.bind(sandbox.backend),
			discardPreparedWorkdir: sandbox.backend?.discardPreparedWorkdir?.bind(sandbox.backend),
			workdirRoots: sandbox.backend?.workdirRoots,
			env: sandbox.backend?.env ?? sandbox.docker.env,
			buildExecSpec: sandbox.backend?.buildExecSpec.bind(sandbox.backend),
			finalizeExec: sandbox.backend?.finalizeExec?.bind(sandbox.backend)
		} : void 0
	}) : null;
	const processTool = includeShellTools ? createLazyProcessTool({
		cleanupMs: cleanupMsOverride ?? execConfig.cleanupMs,
		scopeKey
	}) : null;
	const applyPatchTool = !includeShellTools || !applyPatchEnabled || sandboxRoot && !allowWorkspaceWrites ? null : createApplyPatchTool({
		cwd: codingRoot,
		sandbox: sandboxRoot && allowWorkspaceWrites ? {
			root: sandboxRoot,
			bridge: sandboxFsBridge
		} : void 0,
		workspaceOnly: applyPatchWorkspaceOnly
	});
	options?.recordToolPrepStage?.("shell-tools");
	const ownerOnlyCoreToolDenylist = options?.senderIsOwner === false ? [...require_dangerous_tools.GATEWAY_OWNER_ONLY_CORE_TOOLS] : [];
	const ownerOnlyCoreToolPolicy = ownerOnlyCoreToolDenylist.length > 0 ? { deny: ownerOnlyCoreToolDenylist } : void 0;
	const pluginToolAllowlist = require_tools.appendRuntimePluginToolGrant(capabilityProfile.policy.explicitToolAllowlist, runtimePluginToolGrant);
	const pluginToolDenylist = [...capabilityProfile.policy.explicitToolDenylist, ...ownerOnlyCoreToolDenylist];
	const inheritedToolDenylist = [...pluginToolDenylist];
	const inheritedToolAllowlist = [];
	const toolPolicyInheritanceSources = capabilityProfile.policy.inheritancePolicies;
	const shouldInheritEffectiveToolAllowlist = toolPolicyInheritanceSources.some(require_tool_policy.hasRestrictiveAllowPolicy);
	const cronCreatorToolAllowlist = options?.cronCreatorToolAllowlistRef ?? [];
	const shouldCaptureCronCreatorToolAllowlist = toolPolicyInheritanceSources.some((policy) => require_tool_policy.hasRestrictiveAllowPolicy(policy) || hasExplicitDenyPolicy(policy));
	const pluginToolCallerIdentity = agentId && options?.sessionKey?.trim() ? {
		agentId,
		sessionKey: options.sessionKey.trim(),
		turnSourceChannel: require_message_channel.resolveGatewayMessageChannel(options.messageChannel ?? options.messageProvider),
		turnSourceTo: options.currentMessagingTarget ?? options.currentChannelId ?? options.messageTo,
		turnSourceAccountId: options.agentAccountId,
		turnSourceThreadId: options.currentThreadTs ?? options.messageThreadId
	} : void 0;
	const pluginToolsOnly = require_openclaw_tools.filterToolsByClientCaps(includeOperatorTools || !includePluginTools ? [] : require_openclaw_tools.resolveOperatorPluginToolsForOptions({
		options: {
			agentSessionKey: options?.sessionKey,
			agentChannel: require_message_channel.resolveGatewayMessageChannel(options?.messageChannel ?? options?.messageProvider),
			agentAccountId: options?.agentAccountId,
			agentTo: options?.messageTo,
			agentThreadId: options?.messageThreadId,
			nativeChannelId: options?.nativeChannelId,
			agentDir: options?.agentDir,
			workspaceDir: workspaceRoot,
			config: options?.config,
			fsPolicy,
			requesterSenderId: options?.senderId,
			senderIsOwner: options?.senderIsOwner,
			sessionId: options?.sessionId,
			oneShotCliRun: options?.oneShotCliRun,
			sandboxBrowserBridgeUrl: sandbox?.browser?.bridgeUrl,
			allowHostBrowserControl: sandbox ? sandbox.browserAllowHostControl : true,
			sandboxed: Boolean(sandbox),
			pluginToolAllowlist,
			pluginToolDenylist,
			currentChannelId: options?.currentChannelId,
			currentMessagingTarget: options?.currentMessagingTarget,
			currentThreadTs: options?.currentThreadTs,
			currentMessageId: options?.currentMessageId,
			modelProvider: options?.modelProvider,
			modelId: options?.modelId,
			modelHasVision: options?.modelHasVision,
			requireExplicitMessageTarget: options?.requireExplicitMessageTarget,
			disableMessageTool: options?.disableMessageTool,
			requesterAgentIdOverride: agentId,
			allowGatewaySubagentBinding: options?.allowGatewaySubagentBinding,
			authProfileStore: options?.authProfileStore
		},
		resolvedConfig: options?.config
	}), options?.clientCaps).map((tool) => require_gateway.wrapToolWithGatewayCallerIdentity(tool, pluginToolCallerIdentity));
	const ringZeroTools = includeOperatorTools ? getActiveAgentRingZeroTools() : [];
	const toolSearchTools = toolSearchControlsEnabled && ringZeroTools.length === 0 ? createToolSearchTools({
		config: options?.config,
		runtimeConfig: options?.config,
		agentId,
		sessionKey: options?.sessionKey,
		sessionId: options?.sessionId,
		runId: options?.runId,
		catalogRef: options?.toolSearchCatalogRef,
		abortSignal: options?.abortSignal,
		executeTool: options?.toolSearchCatalogExecutor
	}) : [];
	const tools = [
		...base,
		...includeBaseCodingTools && sandboxRoot ? allowWorkspaceWrites ? [workspaceOnly ? require_web_tools.wrapToolWorkspaceRootGuardWithOptions(require_web_tools.createSandboxedEditTool({
			root: sandboxRoot,
			bridge: sandboxFsBridge
		}), sandboxRoot, { containerWorkdir: sandbox.containerWorkdir }) : require_web_tools.createSandboxedEditTool({
			root: sandboxRoot,
			bridge: sandboxFsBridge
		}), workspaceOnly ? require_web_tools.wrapToolWorkspaceRootGuardWithOptions(require_web_tools.createSandboxedWriteTool({
			root: sandboxRoot,
			bridge: sandboxFsBridge
		}), sandboxRoot, { containerWorkdir: sandbox.containerWorkdir }) : require_web_tools.createSandboxedWriteTool({
			root: sandboxRoot,
			bridge: sandboxFsBridge
		})] : [] : [],
		...includeShellTools && applyPatchTool ? [applyPatchTool] : [],
		...execTool ? [execTool] : [],
		...processTool ? [processTool] : [],
		...includeChannelTools ? require_gateway.listChannelAgentTools({ cfg: options?.config }) : [],
		...includeOperatorTools ? mergeAgentRingZeroTools(ringZeroTools, require_openclaw_tools.createOperatorTools({
			...options?.systemAgentTool ? { systemAgentTool: options.systemAgentTool } : {},
			sandboxBrowserBridgeUrl: sandbox?.browser?.bridgeUrl,
			allowHostBrowserControl: sandbox ? sandbox.browserAllowHostControl : true,
			agentSessionKey: options?.sessionKey,
			runId: options?.runId,
			runSessionKey: options?.runSessionKey,
			agentChannel: require_message_channel.resolveGatewayMessageChannel(options?.messageChannel ?? options?.messageProvider),
			agentAccountId: options?.agentAccountId,
			agentTo: options?.messageTo,
			agentThreadId: options?.messageThreadId,
			nativeChannelId: options?.nativeChannelId,
			messageActionTurnCapability: options?.messageActionTurnCapability,
			agentGroupId: options?.groupId ?? null,
			agentGroupChannel: options?.groupChannel ?? null,
			agentGroupSpace: options?.groupSpace ?? null,
			agentMemberRoleIds: options?.memberRoleIds,
			agentDir: options?.agentDir,
			sandboxRoot,
			sandboxContainerWorkdir: sandbox?.containerWorkdir,
			sandboxFsBridge,
			fsPolicy,
			workspaceDir: workspaceRoot,
			spawnWorkspaceDir: capabilityProfile.workspace.spawnWorkspaceRoot,
			cwd: sandbox ? capabilityProfile.workspace.spawnWorkspaceRoot ?? runtimeRoot : runtimeRoot,
			sandboxed: Boolean(sandbox),
			config: options?.config,
			clientCaps: options?.clientCaps,
			pluginToolAllowlist,
			pluginToolDenylist,
			cronCreatorToolAllowlist: shouldCaptureCronCreatorToolAllowlist ? cronCreatorToolAllowlist : void 0,
			currentChannelId: options?.currentChannelId,
			currentChatType: options?.chatType,
			currentMessagingTarget: options?.currentMessagingTarget,
			currentThreadTs: options?.currentThreadTs,
			currentMessageId: options?.currentMessageId,
			currentInboundAudio: options?.currentInboundAudio,
			hasCurrentInboundAudio: options?.hasCurrentInboundAudio,
			modelProvider: options?.modelProvider,
			modelId: options?.modelId,
			replyToMode: options?.replyToMode,
			hasRepliedRef: options?.hasRepliedRef,
			modelHasVision: options?.modelHasVision,
			computerContextEpoch: options?.computerContextEpoch,
			requireExplicitMessageTarget: options?.requireExplicitMessageTarget,
			sourceReplyDeliveryMode: options?.sourceReplyDeliveryMode,
			taskSuggestionDeliveryMode: options?.taskSuggestionDeliveryMode,
			inboundEventKind: options?.inboundEventKind,
			disableMessageTool: options?.disableMessageTool,
			enableHeartbeatTool,
			disablePluginTools: !includePluginTools,
			wrapBeforeToolCallHook: false,
			...cronSelfRemoveOnlyJobId ? { cronSelfRemoveOnlyJobId } : {},
			requesterAgentIdOverride: agentId,
			requesterSenderId: options?.senderId,
			senderIsOwner: options?.senderIsOwner,
			authProfileStore: options?.authProfileStore,
			sessionId: options?.sessionId,
			oneShotCliRun: options?.oneShotCliRun,
			inheritedToolAllowlist,
			inheritedToolDenylist,
			onYield: options?.onYield,
			allowGatewaySubagentBinding: options?.allowGatewaySubagentBinding,
			recordToolPrepStage: options?.recordToolPrepStage
		})) : pluginToolsOnly,
		...toolSearchTools
	];
	options?.recordToolPrepStage?.("openclaw-tools");
	const toolsForMemoryFlush = isMemoryFlushRun && memoryFlushWritePath ? [] : tools;
	if (isMemoryFlushRun && memoryFlushWritePath) for (const tool of tools) {
		if (!MEMORY_FLUSH_ALLOWED_TOOL_NAMES.has(tool.name)) continue;
		if (tool.name === "write") {
			toolsForMemoryFlush.push(require_web_tools.wrapToolMemoryFlushAppendOnlyWrite(tool, {
				root: memoryFlushWriteRoot,
				relativePath: memoryFlushWritePath,
				containerWorkdir: sandbox?.containerWorkdir,
				sandbox: sandboxRoot && sandboxFsBridge ? {
					root: sandboxRoot,
					bridge: sandboxFsBridge
				} : void 0
			}));
			continue;
		}
		toolsForMemoryFlush.push(tool);
	}
	const unavailableCoreToolReason = isMemoryFlushRun && memoryFlushWritePath ? "memory-triggered compaction runs expose only read and append-only write" : void 0;
	const toolsForMessageProvider = require_openclaw_tools.filterToolsByMessageProvider(toolsForMemoryFlush, options?.toolPolicyMessageProvider ?? options?.messageProvider);
	options?.recordToolPrepStage?.("message-provider-policy");
	const toolsForModelProvider = applyModelProviderToolPolicy(toolsForMessageProvider, {
		config: options?.config,
		modelProvider: options?.modelProvider,
		modelApi: options?.modelApi,
		modelId: options?.modelId,
		agentId: options?.agentId,
		sessionKey: options?.sessionKey,
		agentDir: options?.agentDir,
		modelCompat: options?.modelCompat,
		suppressManagedWebSearch: options?.suppressManagedWebSearch,
		runtimeToolAllowlist: options?.runtimeToolAllowlist,
		localModelLeanPreserveToolNames
	});
	options?.recordToolPrepStage?.("model-provider-policy");
	const authorizedTools = mergeAgentRingZeroTools(ringZeroTools, require_tool_policy_pipeline.applyToolPolicyPipeline({
		tools: toolsForModelProvider,
		toolMeta: (tool) => require_tools.getPluginToolMeta(tool),
		warn: require_logger.logWarn,
		steps: [
			...require_tool_policy_pipeline.buildDefaultToolPolicyPipelineSteps({
				profilePolicy: profilePolicyWithAlsoAllow,
				profile,
				profileUnavailableCoreWarningAllowlist: profilePolicy?.allow,
				providerProfilePolicy: providerProfilePolicyWithAlsoAllow,
				providerProfile,
				providerProfileUnavailableCoreWarningAllowlist: providerProfilePolicy?.allow,
				globalPolicy: globalPolicyWithToolSearchControls,
				globalProviderPolicy: globalProviderPolicyWithToolSearchControls,
				agentPolicy: agentPolicyWithToolSearchControls,
				agentProviderPolicy: agentProviderPolicyWithToolSearchControls,
				groupPolicy: groupPolicyWithToolSearchControls,
				senderPolicy: senderPolicyWithToolSearchControls,
				agentId,
				unavailableCoreToolReason
			}),
			{
				policy: sandboxToolPolicyWithToolSearchControls,
				label: "sandbox tools.allow",
				unavailableCoreToolReason
			},
			{
				policy: ownerOnlyCoreToolPolicy,
				label: "gateway sender owner-only tools",
				unavailableCoreToolReason
			},
			{
				policy: subagentPolicyWithToolSearchControls,
				label: "subagent tools.allow",
				unavailableCoreToolReason
			},
			{
				policy: inheritedToolPolicy,
				label: "inherited tools",
				unavailableCoreToolReason
			}
		],
		auditLogLevel: options?.toolPolicyAuditLogLevel,
		declaredToolAllowlist: require_tool_policy_pipeline.buildDeclaredToolAllowlistContext({
			config: options?.config,
			workspaceDir: workspaceRoot,
			toolDenylist: pluginToolDenylist
		})
	}));
	if (shouldInheritEffectiveToolAllowlist) require_tool_policy.replaceWithEffectiveToolAllowlist(inheritedToolAllowlist, authorizedTools);
	if (shouldCaptureCronCreatorToolAllowlist) require_web_tools.replaceWithEffectiveCronCreatorToolAllowlist(cronCreatorToolAllowlist, authorizedTools, (tool) => require_tools.getPluginToolMeta(tool));
	options?.recordToolPrepStage?.("authorization-policy");
	const normalized = authorizedTools.map((tool) => normalizeToolParameters(tool, {
		modelProvider: options?.modelProvider,
		modelId: options?.modelId,
		modelCompat: options?.modelCompat
	}));
	options?.recordToolPrepStage?.("schema-normalization");
	const turnSourceChannel = options?.messageChannel ?? options?.messageProvider;
	const turnSourceTo = options?.currentMessagingTarget ?? options?.currentChannelId;
	const hookContext = {
		agentId,
		...options?.config ? { config: options.config } : {},
		cwd: codingRoot,
		workspaceDir: workspaceRoot,
		...sandboxRoot && allowWorkspaceWrites ? { sandbox: {
			root: sandboxRoot,
			bridge: sandboxFsBridge
		} } : {},
		sessionKey: options?.sessionKey,
		sessionId: options?.sessionId,
		runId: options?.runId,
		approvalReviewerDeviceId: options?.approvalReviewerDeviceId,
		channelId: options?.hookChannelId ?? options?.currentChannelId,
		...turnSourceChannel ? { turnSourceChannel } : {},
		...turnSourceTo ? { turnSourceTo } : {},
		...options?.agentAccountId ? { turnSourceAccountId: options.agentAccountId } : {},
		...options?.currentThreadTs ? { turnSourceThreadId: options.currentThreadTs } : {},
		...options?.trace ? { trace: options.trace } : {},
		loopDetection: require_tool_loop_detection_config.resolveToolLoopDetectionConfig({
			cfg: options?.config,
			agentId
		}),
		onToolOutcome: options?.onToolOutcome,
		allocateToolOutcomeOrdinal: options?.allocateToolOutcomeOrdinal
	};
	const hookOptions = { emitDiagnostics: options?.emitBeforeToolCallDiagnostics };
	const withHooks = normalized.map((tool) => require_gateway.isToolWrappedWithBeforeToolCallHook(tool) ? require_hook_helpers.rewrapToolWithBeforeToolCallHook(tool, hookContext, hookOptions) : require_hook_helpers.wrapToolWithBeforeToolCallHook(tool, hookContext, hookOptions));
	options?.recordToolPrepStage?.("tool-hooks");
	const withAbort = options?.abortSignal ? withHooks.map((tool) => wrapToolWithAbortSignal(tool, options.abortSignal)) : withHooks;
	options?.recordToolPrepStage?.("abort-wrappers");
	const withDeferredFollowupDescriptions = applyDeferredFollowupToolDescriptions(withAbort, { agentId });
	options?.recordToolPrepStage?.("deferred-followup-descriptions");
	return withDeferredFollowupDescriptions;
}
/** Build the runtime tool list exposed through the public agent harness SDK. */
function createOperatorCodingTools(options) {
	return createOperatorCodingToolsInternal(options);
}
//#endregion
Object.defineProperty(exports, "TOOL_CALL_RAW_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return TOOL_CALL_RAW_TOOL_NAME;
	}
});
Object.defineProperty(exports, "TOOL_DESCRIBE_RAW_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return TOOL_DESCRIBE_RAW_TOOL_NAME;
	}
});
Object.defineProperty(exports, "TOOL_SEARCH_CODE_MODE_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return TOOL_SEARCH_CODE_MODE_TOOL_NAME;
	}
});
Object.defineProperty(exports, "TOOL_SEARCH_RAW_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return TOOL_SEARCH_RAW_TOOL_NAME;
	}
});
Object.defineProperty(exports, "ToolSearchRuntime", {
	enumerable: true,
	get: function() {
		return ToolSearchRuntime;
	}
});
Object.defineProperty(exports, "addClientToolsToToolCatalog", {
	enumerable: true,
	get: function() {
		return addClientToolsToToolCatalog;
	}
});
Object.defineProperty(exports, "addClientToolsToToolSearchCatalog", {
	enumerable: true,
	get: function() {
		return addClientToolsToToolSearchCatalog;
	}
});
Object.defineProperty(exports, "applyLocalModelLeanToolSearchDefaults", {
	enumerable: true,
	get: function() {
		return applyLocalModelLeanToolSearchDefaults;
	}
});
Object.defineProperty(exports, "applyToolCatalogCompaction", {
	enumerable: true,
	get: function() {
		return applyToolCatalogCompaction;
	}
});
Object.defineProperty(exports, "applyToolSchemaDirectoryCatalog", {
	enumerable: true,
	get: function() {
		return applyToolSchemaDirectoryCatalog;
	}
});
Object.defineProperty(exports, "applyToolSearchCatalog", {
	enumerable: true,
	get: function() {
		return applyToolSearchCatalog;
	}
});
Object.defineProperty(exports, "buildToolSchemaDirectoryPrompt", {
	enumerable: true,
	get: function() {
		return buildToolSchemaDirectoryPrompt;
	}
});
Object.defineProperty(exports, "clearToolSearchCatalog", {
	enumerable: true,
	get: function() {
		return clearToolSearchCatalog;
	}
});
Object.defineProperty(exports, "collectReplaySafeToolNames", {
	enumerable: true,
	get: function() {
		return collectReplaySafeToolNames;
	}
});
Object.defineProperty(exports, "collectUniqueCatalogToolNames", {
	enumerable: true,
	get: function() {
		return collectUniqueCatalogToolNames;
	}
});
Object.defineProperty(exports, "createOperatorCodingTools", {
	enumerable: true,
	get: function() {
		return createOperatorCodingTools;
	}
});
Object.defineProperty(exports, "createToolSearchCatalogRef", {
	enumerable: true,
	get: function() {
		return createToolSearchCatalogRef;
	}
});
Object.defineProperty(exports, "estimateToolSchemaDirectoryToolNames", {
	enumerable: true,
	get: function() {
		return estimateToolSchemaDirectoryToolNames;
	}
});
Object.defineProperty(exports, "filterLocalModelLeanTools", {
	enumerable: true,
	get: function() {
		return filterLocalModelLeanTools;
	}
});
Object.defineProperty(exports, "getActiveAgentRingZeroTools", {
	enumerable: true,
	get: function() {
		return getActiveAgentRingZeroTools;
	}
});
Object.defineProperty(exports, "isAgentToolReplaySafe", {
	enumerable: true,
	get: function() {
		return isAgentToolReplaySafe;
	}
});
Object.defineProperty(exports, "isAgentToolRestartSafe", {
	enumerable: true,
	get: function() {
		return isAgentToolRestartSafe;
	}
});
Object.defineProperty(exports, "isHostScopedAgentToolActive", {
	enumerable: true,
	get: function() {
		return isHostScopedAgentToolActive;
	}
});
Object.defineProperty(exports, "isLocalModelLeanEnabled", {
	enumerable: true,
	get: function() {
		return isLocalModelLeanEnabled;
	}
});
Object.defineProperty(exports, "projectToolSearchTargetTranscriptMessages", {
	enumerable: true,
	get: function() {
		return projectToolSearchTargetTranscriptMessages;
	}
});
Object.defineProperty(exports, "registerHeadlessToolSearchCatalog", {
	enumerable: true,
	get: function() {
		return registerHeadlessToolSearchCatalog;
	}
});
Object.defineProperty(exports, "resolveLocalModelLeanPreserveToolNames", {
	enumerable: true,
	get: function() {
		return resolveLocalModelLeanPreserveToolNames;
	}
});
Object.defineProperty(exports, "resolveProcessToolScopeKey", {
	enumerable: true,
	get: function() {
		return resolveProcessToolScopeKey;
	}
});
Object.defineProperty(exports, "resolveToolSearchCatalogTool", {
	enumerable: true,
	get: function() {
		return resolveToolSearchCatalogTool;
	}
});
Object.defineProperty(exports, "resolveToolSearchConfig", {
	enumerable: true,
	get: function() {
		return resolveToolSearchConfig;
	}
});
Object.defineProperty(exports, "runWithAgentRingZeroTools", {
	enumerable: true,
	get: function() {
		return runWithAgentRingZeroTools;
	}
});
Object.defineProperty(exports, "shouldCatalogToolForLocalModelLean", {
	enumerable: true,
	get: function() {
		return shouldCatalogToolForLocalModelLean;
	}
});
