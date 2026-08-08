const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_net = require("./net-CakPoh2E.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_tool_result_error = require("./tool-result-error-CAe0MnLg.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
const require_tool_loop_detection_config = require("./tool-loop-detection-config-c-3qUtKe.cjs");
const require_mcp_http_loopback_runtime = require("./mcp-http.loopback-runtime-CtJBYKwk.cjs");
const require_mcp_grant_store = require("./mcp-grant-store-DElX7XIk.cjs");
const require_tool_resolution = require("./tool-resolution-BHDLwbdt.cjs");
const require_auth = require("./auth-DnGY7_cY.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_util = require("node:util");
let node_http = require("node:http");
let _modelcontextprotocol_sdk_types_js = require("@modelcontextprotocol/sdk/types.js");
//#region src/gateway/mcp-http.protocol.ts
/** Server identity advertised by the local MCP loopback initialize response. */
const MCP_LOOPBACK_SERVER_NAME = "@gabrielvfonseca/operator";
/** Protocol-facing loopback server version, independent from the Operator app version. */
const MCP_LOOPBACK_SERVER_VERSION = "0.1.0";
/** MCP protocol versions accepted by the loopback HTTP bridge, newest first for negotiation. */
const MCP_LOOPBACK_SUPPORTED_PROTOCOL_VERSIONS = ["2025-03-26", "2024-11-05"];
/**
* Builds a JSON-RPC success response, using null for notifications or malformed missing ids.
*/
function jsonRpcResult(id, result) {
	return {
		jsonrpc: "2.0",
		id: id ?? null,
		result
	};
}
/**
* Builds a JSON-RPC error response with the same id normalization as success responses.
*/
function jsonRpcError(id, code, message) {
	return {
		jsonrpc: "2.0",
		id: id ?? null,
		error: {
			code,
			message
		}
	};
}
//#endregion
//#region src/gateway/mcp-http.schema.ts
function readLoopbackToolField(tool, key) {
	try {
		return tool[key];
	} catch {
		return;
	}
}
/** Safely reads and normalizes a loopback tool name from plugin-provided tool objects. */
function readMcpLoopbackToolName(tool) {
	const value = readLoopbackToolField(tool, "name");
	if (typeof value !== "string") return;
	return value.trim() || void 0;
}
function readLoopbackToolDescription(tool) {
	const value = readLoopbackToolField(tool, "description");
	return typeof value === "string" ? value : void 0;
}
function readLoopbackToolParameters(tool) {
	let value;
	try {
		value = tool.parameters;
	} catch {
		return;
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return {};
	try {
		return { ...value };
	} catch {
		return;
	}
}
function readLiteralSchemaValues(schema) {
	const enumValues = Array.isArray(schema.enum) ? schema.enum : void 0;
	if (Object.hasOwn(schema, "const")) {
		if (!enumValues) return [schema.const];
		return enumValues.some((value) => (0, node_util.isDeepStrictEqual)(value, schema.const)) ? [schema.const] : [];
	}
	return enumValues;
}
function uniqueLiteralValues(values) {
	return values.filter((value, index) => values.findIndex((candidate) => (0, node_util.isDeepStrictEqual)(candidate, value)) === index);
}
const SCHEMA_ANNOTATION_KEYS = /* @__PURE__ */ new Set([
	"$comment",
	"default",
	"deprecated",
	"description",
	"example",
	"examples",
	"readOnly",
	"title",
	"writeOnly"
]);
function readLiteralValidationConstraints(schema) {
	return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "const" && key !== "enum" && !SCHEMA_ANNOTATION_KEYS.has(key)));
}
function mergeLiteralSchemas(existing, incoming) {
	const existingValues = readLiteralSchemaValues(existing);
	const incomingValues = readLiteralSchemaValues(incoming);
	if (existingValues === void 0 || incomingValues === void 0) return;
	if (!(0, node_util.isDeepStrictEqual)(readLiteralValidationConstraints(existing), readLiteralValidationConstraints(incoming))) return;
	const values = uniqueLiteralValues([...existingValues, ...incomingValues]);
	if (values.length === 0) return;
	const merged = {
		...existing,
		enum: values
	};
	delete merged.const;
	return merged;
}
function flattenUnionSchema(raw, toolName) {
	const variants = raw.anyOf ?? raw.oneOf;
	if (!Array.isArray(variants) || variants.length === 0) return raw;
	const mergedProps = Object.create(null);
	const requiredSets = [];
	for (const variant of variants) {
		if (variant === true) {
			requiredSets.push(/* @__PURE__ */ new Set());
			continue;
		}
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(variant)) continue;
		const props = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(variant.properties) ? variant.properties : void 0;
		if (props) for (const [key, schema] of Object.entries(props)) {
			if (!isPropertySchema(schema)) {
				warnSchemaOnce(`mcp loopback: malformed schema definition for "${toolName}.${key}", ignoring that variant`);
				continue;
			}
			if (!Object.hasOwn(mergedProps, key)) {
				mergedProps[key] = schema;
				continue;
			}
			const existing = mergedProps[key];
			const incoming = schema;
			if (existing === true || incoming === true) {
				mergedProps[key] = true;
				continue;
			}
			if (existing === false) {
				mergedProps[key] = incoming;
				continue;
			}
			if (incoming === false) continue;
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(incoming)) {
				if (existing !== incoming) warnSchemaOnce(`mcp loopback: conflicting schema definitions for "${toolName}.${key}", keeping the first variant`);
				continue;
			}
			if ((0, node_util.isDeepStrictEqual)(existing, incoming)) continue;
			const mergedLiterals = mergeLiteralSchemas(existing, incoming);
			if (mergedLiterals) {
				mergedProps[key] = mergedLiterals;
				continue;
			}
			warnSchemaOnce(`mcp loopback: conflicting schema definitions for "${toolName}.${key}", keeping the first variant`);
		}
		requiredSets.push(new Set(Array.isArray(variant.required) ? variant.required : []));
	}
	const required = requiredSets.length > 0 ? [...requiredSets[0] ?? []].filter((key) => Object.hasOwn(mergedProps, key) && requiredSets.every((set) => set.has(key))) : [];
	const { anyOf: _anyOf, oneOf: _oneOf, ...rest } = raw;
	return {
		...rest,
		type: "object",
		properties: mergedProps,
		required
	};
}
function isPropertySchema(value) {
	return typeof value === "boolean" || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value);
}
const emittedSchemaWarnings = /* @__PURE__ */ new Set();
function warnSchemaOnce(message) {
	if (emittedSchemaWarnings.has(message)) return;
	emittedSchemaWarnings.add(message);
	require_logger.logWarn(message);
}
/** Builds MCP-compatible tool schemas for loopback-visible gateway tools. */
function buildMcpToolSchema(tools) {
	return tools.flatMap((tool) => {
		const name = readMcpLoopbackToolName(tool);
		if (!name) return [];
		let raw = readLoopbackToolParameters(tool);
		if (!raw) return [];
		if (raw.anyOf || raw.oneOf) raw = flattenUnionSchema(raw, name);
		if (raw.type !== "object") raw.type = "object";
		if (!raw.properties) raw.properties = {};
		return {
			name,
			description: readLoopbackToolDescription(tool),
			inputSchema: raw
		};
	});
}
//#endregion
//#region src/gateway/mcp-http.handlers.ts
function stringifyMcpContent(value) {
	return typeof value === "string" ? value : JSON.stringify(value) ?? String(value);
}
const MCP_LOOPBACK_CONTENT_TYPES = /* @__PURE__ */ new Set([
	"text",
	"image",
	"resource"
]);
function normalizeToolCallContent(result) {
	const content = result?.content;
	if (Array.isArray(content)) return content.map((block) => {
		const parsed = _modelcontextprotocol_sdk_types_js.ContentBlockSchema.safeParse(block);
		if (parsed.success && MCP_LOOPBACK_CONTENT_TYPES.has(parsed.data.type)) return parsed.data;
		return {
			type: "text",
			text: stringifyMcpContent(block)
		};
	});
	return [{
		type: "text",
		text: stringifyMcpContent(result)
	}];
}
/** Handles one MCP loopback JSON-RPC message and returns a response or notification null. */
async function handleMcpJsonRpc(params) {
	const { id, method, params: methodParams } = params.message;
	switch (method) {
		case "initialize": {
			const clientVersion = methodParams?.protocolVersion ?? "";
			return jsonRpcResult(id, {
				protocolVersion: MCP_LOOPBACK_SUPPORTED_PROTOCOL_VERSIONS.find((version) => version === clientVersion) ?? MCP_LOOPBACK_SUPPORTED_PROTOCOL_VERSIONS[0],
				capabilities: { tools: {} },
				serverInfo: {
					name: MCP_LOOPBACK_SERVER_NAME,
					version: MCP_LOOPBACK_SERVER_VERSION
				}
			});
		}
		case "notifications/initialized":
		case "notifications/cancelled": return null;
		case "tools/list": return jsonRpcResult(id, { tools: params.toolSchema });
		case "tools/call": {
			const toolName = typeof methodParams?.name === "string" ? methodParams.name.trim() : "";
			const rawToolArgs = methodParams?.arguments;
			if (rawToolArgs !== void 0 && !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawToolArgs)) return jsonRpcError(id, -32602, "Invalid params: tools/call arguments must be an object");
			const toolArgs = rawToolArgs ?? {};
			if (!toolName) return jsonRpcResult(id, {
				content: [{
					type: "text",
					text: "Tool not available: unknown"
				}],
				isError: true
			});
			if (!params.toolSchema.some((tool) => tool.name === toolName)) return jsonRpcResult(id, {
				content: [{
					type: "text",
					text: `Tool not available: ${toolName}`
				}],
				isError: true
			});
			const tool = params.tools.find((candidate) => readMcpLoopbackToolName(candidate) === toolName);
			if (!tool) return jsonRpcResult(id, {
				content: [{
					type: "text",
					text: `Tool not available: ${toolName}`
				}],
				isError: true
			});
			const toolCallId = `mcp-${node_crypto.default.randomUUID()}`;
			let executedToolArgs = toolArgs;
			const reportToolCallResult = (outcome) => {
				try {
					params.onToolCallResult?.({
						toolName,
						args: executedToolArgs,
						...outcome
					});
				} catch {}
			};
			try {
				const preparedToolArgs = tool.prepareBeforeToolCallParams ? await tool.prepareBeforeToolCallParams(toolArgs, {
					toolCallId,
					hookContext: params.hookContext,
					signal: params.signal
				}) : toolArgs;
				executedToolArgs = preparedToolArgs;
				const hookResult = await require_hook_helpers.runBeforeToolCallHook({
					toolName,
					params: preparedToolArgs,
					toolCallId,
					ctx: params.hookContext,
					signal: params.signal
				});
				if (hookResult.blocked) {
					const disposition = hookResult.kind === "failure" ? hookResult.disposition : "blocked";
					reportToolCallResult(disposition === "blocked" ? {
						outcome: disposition,
						deniedReason: hookResult.deniedReason ?? "plugin-before-tool-call"
					} : { outcome: disposition });
					return jsonRpcResult(id, {
						content: [{
							type: "text",
							text: hookResult.reason
						}],
						isError: true
					});
				}
				const finalizedToolArgs = tool.finalizeBeforeToolCallParams?.(hookResult.params, preparedToolArgs) ?? hookResult.params;
				executedToolArgs = finalizedToolArgs;
				try {
					params.onToolCallPrepared?.({
						toolName,
						args: executedToolArgs
					});
				} catch {}
				if (params.authorizeToolCall && !params.authorizeToolCall()) {
					reportToolCallResult({
						outcome: "blocked",
						deniedReason: "client-grant-revoked"
					});
					return jsonRpcResult(id, {
						content: [{
							type: "text",
							text: "Tool call authorization expired"
						}],
						isError: true
					});
				}
				const result = await tool.execute(toolCallId, finalizedToolArgs, params.signal);
				const failureKind = require_tool_result_error.resolveToolResultFailureKind(result);
				reportToolCallResult(failureKind === "blocked" ? {
					outcome: "blocked",
					deniedReason: "tool_result_blocked"
				} : {
					outcome: failureKind ?? "completed",
					result
				});
				return jsonRpcResult(id, {
					content: normalizeToolCallContent(result),
					isError: failureKind !== void 0
				});
			} catch (error) {
				reportToolCallResult({
					outcome: params.signal?.aborted ? "unknown" : require_tool_result_error.resolveToolExecutionErrorKind(error),
					result: error
				});
				return jsonRpcResult(id, {
					content: [{
						type: "text",
						text: require_tool_result_error.formatToolExecutionErrorMessage(error, "tool execution failed") || "tool execution failed"
					}],
					isError: true
				});
			}
		}
		default: return jsonRpcError(id, -32601, `Method not found: ${method}`);
	}
}
//#endregion
//#region src/gateway/mcp-http.request.ts
const MAX_MCP_BODY_BYTES = 1048576;
const DEFAULT_MCP_BODY_TIMEOUT_MS = 3e4;
const MCP_HTTP_BODY_TOO_LARGE_CODE = "ETOOBIG";
const MCP_HTTP_BODY_TIMEOUT_CODE = "ETIMEDOUT";
const MCP_HTTP_BODY_CLOSED_CODE = "ECONNRESET";
function readPositiveIntEnv(name, fallback) {
	const raw = process.env[name]?.trim();
	if (!raw) return fallback;
	if (!/^\d+$/u.test(raw)) throw new Error(`${name} must be a positive integer. Got: ${JSON.stringify(raw)}`);
	const parsed = Number(raw);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer. Got: ${JSON.stringify(raw)}`);
	return parsed;
}
function shouldLogMcpLoopbackHttp() {
	return require_env.isTruthyEnvValue(process.env.OPERATOR_CLI_BACKEND_LOG_OUTPUT) || require_env.isTruthyEnvValue(process.env.OPERATOR_LIVE_CLI_BACKEND_DEBUG);
}
function logMcpLoopbackHttp(step, details) {
	if (!shouldLogMcpLoopbackHttp()) return;
	console.error(`[mcp-loopback] ${step} ${JSON.stringify(details)}`);
}
function resolveScopedSessionKey(cfg, rawSessionKey) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawSessionKey);
	return !trimmed || trimmed === "main" ? require_main_session.resolveMainSessionKey(cfg) : trimmed;
}
function normalizeMcpInboundEventKind(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return trimmed === "room_event" || trimmed === "user_request" ? trimmed : void 0;
}
function normalizeMcpSourceReplyDeliveryMode(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return trimmed === "automatic" || trimmed === "message_tool_only" ? trimmed : void 0;
}
function normalizeMcpTaskSuggestionDeliveryMode(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) === "gateway" ? "gateway" : void 0;
}
function normalizeMcpBooleanHeader(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return trimmed ? require_env.isTruthyEnvValue(trimmed) : void 0;
}
function rejectsBrowserLoopbackRequest(req) {
	const origin = require_http_auth_utils.getHeader(req, "origin");
	if (!origin) return false;
	return !require_auth.checkBrowserOrigin({
		requestHost: require_http_auth_utils.getHeader(req, "host"),
		origin,
		isLocalClient: require_net.isLoopbackAddress(req.socket?.remoteAddress)
	}).ok;
}
function resolveMcpSender(params) {
	const authHeader = require_http_auth_utils.getHeader(params.req, "authorization") ?? "";
	const ownerTokenMatched = require_secret_equal.safeEqualSecret(authHeader, `Bearer ${params.ownerToken}`);
	const nonOwnerTokenMatched = require_secret_equal.safeEqualSecret(authHeader, `Bearer ${params.nonOwnerToken}`);
	if (ownerTokenMatched || nonOwnerTokenMatched) return { senderIsOwner: ownerTokenMatched };
	const grantToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
	const captureKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(params.req, "x-operator-cli-capture-key"));
	const clientGrant = grantToken && captureKey ? require_mcp_grant_store.resolveMcpLoopbackClientGrant({
		token: grantToken,
		runtimeOwnerToken: params.ownerToken,
		captureKey
	}) : void 0;
	if (clientGrant) return {
		senderIsOwner: clientGrant.context.senderIsOwner,
		boundContext: clientGrant.context,
		boundCaptureKey: clientGrant.captureKey,
		boundGrantToken: grantToken
	};
	const grant = grantToken ? require_mcp_grant_store.resolveAttachGrant(grantToken) : void 0;
	if (grant) return {
		senderIsOwner: false,
		boundSessionKey: grant.sessionKey
	};
}
function validateMcpLoopbackRequest(params) {
	let url;
	try {
		url = new URL(params.req.url ?? "/", `http://${params.req.headers.host ?? "localhost"}`);
	} catch {
		logMcpLoopbackHttp("reject", {
			reason: "bad_request_url",
			method: params.req.method ?? ""
		});
		params.res.writeHead(400, { "Content-Type": "application/json" });
		params.res.end(JSON.stringify({ error: "bad_request" }));
		return null;
	}
	if (params.req.method === "GET" && url.pathname.startsWith("/.well-known/")) {
		params.res.writeHead(404);
		params.res.end();
		return null;
	}
	if (url.pathname !== "/mcp") {
		logMcpLoopbackHttp("reject", {
			reason: "not_found",
			method: params.req.method ?? "",
			path: url.pathname
		});
		params.res.writeHead(404, { "Content-Type": "application/json" });
		params.res.end(JSON.stringify({ error: "not_found" }));
		return null;
	}
	if (params.req.method === "GET" || params.req.method === "DELETE") {
		if (rejectsBrowserLoopbackRequest(params.req)) {
			params.res.writeHead(403, { "Content-Type": "application/json" });
			params.res.end(JSON.stringify({ error: "forbidden" }));
			return null;
		}
		if (!resolveMcpSender(params)) {
			params.res.writeHead(401, { "Content-Type": "application/json" });
			params.res.end(JSON.stringify({ error: "unauthorized" }));
			return null;
		}
		if (params.req.method === "GET") {
			logMcpLoopbackHttp("sse-open", {
				method: "GET",
				path: url.pathname
			});
			params.res.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive"
			});
			params.res.flushHeaders();
			params.res.write(":\n\n");
			params.onSseResponse?.(params.res);
			params.req.on("close", () => {
				if (!params.res.writableEnded) params.res.end();
			});
			return null;
		}
		logMcpLoopbackHttp("session-delete", {
			method: "DELETE",
			path: url.pathname
		});
		params.res.writeHead(200, { "Content-Type": "application/json" });
		params.res.end(JSON.stringify({ ok: true }));
		return null;
	}
	if (params.req.method !== "POST") {
		logMcpLoopbackHttp("reject", {
			reason: "method_not_allowed",
			method: params.req.method ?? "",
			path: url.pathname
		});
		params.res.writeHead(405, { Allow: "GET, POST, DELETE" });
		params.res.end();
		return null;
	}
	if (rejectsBrowserLoopbackRequest(params.req)) {
		logMcpLoopbackHttp("reject", {
			reason: "forbidden_origin",
			method: params.req.method ?? "",
			origin: require_http_auth_utils.getHeader(params.req, "origin") ?? ""
		});
		params.res.writeHead(403, { "Content-Type": "application/json" });
		params.res.end(JSON.stringify({ error: "forbidden" }));
		return null;
	}
	const sender = resolveMcpSender(params);
	if (!sender) {
		logMcpLoopbackHttp("reject", {
			reason: "unauthorized",
			method: params.req.method ?? "",
			hasAuthorization: (require_http_auth_utils.getHeader(params.req, "authorization") ?? "").length > 0
		});
		params.res.writeHead(401, { "Content-Type": "application/json" });
		params.res.end(JSON.stringify({ error: "unauthorized" }));
		return null;
	}
	const contentType = require_http_auth_utils.getHeader(params.req, "content-type") ?? "";
	if (!contentType.startsWith("application/json")) {
		logMcpLoopbackHttp("reject", {
			reason: "unsupported_media_type",
			method: params.req.method ?? "",
			contentType
		});
		params.res.writeHead(415, { "Content-Type": "application/json" });
		params.res.end(JSON.stringify({ error: "unsupported_media_type" }));
		return null;
	}
	return {
		senderIsOwner: sender.senderIsOwner,
		boundSessionKey: sender.boundSessionKey,
		boundContext: sender.boundContext,
		boundCaptureKey: sender.boundCaptureKey,
		boundGrantToken: sender.boundGrantToken
	};
}
async function readMcpHttpBody(req, options = {}) {
	return await new Promise((resolve, reject) => {
		const maxBytes = Math.max(1, Math.floor(options.maxBytes ?? MAX_MCP_BODY_BYTES));
		const timeoutMs = require_timeouts.resolveSafeTimeoutDelayMs(options.timeoutMs ?? DEFAULT_MCP_BODY_TIMEOUT_MS);
		const chunks = [];
		let received = 0;
		let settled = false;
		const cleanup = (cleanupOptions) => {
			req.off("data", onData);
			req.off("end", onEnd);
			req.off("close", onClose);
			if (cleanupOptions?.keepErrorListener !== true) req.off("error", onError);
			clearTimeout(timeout);
		};
		const rejectOnce = (error, rejectOptions) => {
			if (settled) return;
			settled = true;
			cleanup(rejectOptions);
			reject(error);
		};
		const onData = (chunk) => {
			received += chunk.length;
			if (received > maxBytes) {
				req.pause();
				rejectOnce(createMcpHttpBodyTooLargeError(maxBytes), { keepErrorListener: true });
				return;
			}
			chunks.push(chunk);
		};
		const onEnd = () => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(Buffer.concat(chunks).toString("utf-8"));
		};
		const onError = (error) => {
			rejectOnce(error);
		};
		const onClose = () => {
			rejectOnce(createMcpHttpBodyClosedError());
		};
		const timeout = setTimeout(() => {
			req.pause();
			rejectOnce(createMcpHttpBodyTimeoutError(), { keepErrorListener: true });
		}, timeoutMs);
		timeout.unref?.();
		req.on("data", onData);
		req.on("end", onEnd);
		req.on("close", onClose);
		req.on("error", onError);
	});
}
function createMcpHttpBodyTooLargeError(maxBytes) {
	return Object.assign(/* @__PURE__ */ new Error(`Request body exceeds ${maxBytes} bytes`), { code: MCP_HTTP_BODY_TOO_LARGE_CODE });
}
function createMcpHttpBodyTimeoutError() {
	return Object.assign(/* @__PURE__ */ new Error("Request body timed out"), { code: MCP_HTTP_BODY_TIMEOUT_CODE });
}
function createMcpHttpBodyClosedError() {
	return Object.assign(/* @__PURE__ */ new Error("Request body connection closed"), { code: MCP_HTTP_BODY_CLOSED_CODE });
}
function isMcpHttpBodyTooLargeError(error) {
	return typeof error === "object" && error !== null && error.code === MCP_HTTP_BODY_TOO_LARGE_CODE;
}
function isMcpHttpBodyTimeoutError(error) {
	return typeof error === "object" && error !== null && error.code === MCP_HTTP_BODY_TIMEOUT_CODE;
}
function resolveMcpHttpBodyTimeoutMs() {
	return readPositiveIntEnv("OPERATOR_MCP_LOOPBACK_BODY_TIMEOUT_MS", DEFAULT_MCP_BODY_TIMEOUT_MS);
}
function resolveMcpCliCaptureKey(req, auth) {
	if (auth.boundContext || auth.boundSessionKey) return auth.boundCaptureKey;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-cli-capture-key"));
}
function normalizeMcpClientCapsHeader(value) {
	const clientCaps = [...new Set((value ?? "").split(",").map((cap) => cap.trim()))].filter(Boolean);
	return clientCaps.length > 0 ? clientCaps : void 0;
}
function resolveMcpRequestContext(req, cfg, auth) {
	if (auth.boundContext) return structuredClone(auth.boundContext);
	if (auth.boundSessionKey) return {
		sessionKey: auth.boundSessionKey,
		sessionId: void 0,
		messageProvider: void 0,
		clientCaps: void 0,
		currentChannelId: void 0,
		currentThreadTs: void 0,
		currentMessageId: void 0,
		currentInboundAudio: void 0,
		accountId: void 0,
		inboundEventKind: void 0,
		sourceReplyDeliveryMode: void 0,
		taskSuggestionDeliveryMode: void 0,
		requireExplicitMessageTarget: void 0,
		senderIsOwner: auth.senderIsOwner
	};
	return {
		sessionKey: resolveScopedSessionKey(cfg, require_http_auth_utils.getHeader(req, "x-session-key")),
		sessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-session-id")),
		messageProvider: require_message_channel.normalizeMessageChannel(require_http_auth_utils.getHeader(req, "x-operator-message-channel")) ?? void 0,
		clientCaps: normalizeMcpClientCapsHeader(require_http_auth_utils.getHeader(req, "x-operator-client-caps")),
		currentChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-current-channel-id")),
		currentThreadTs: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-current-thread-ts")),
		currentMessageId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-current-message-id")),
		currentInboundAudio: normalizeMcpBooleanHeader(require_http_auth_utils.getHeader(req, "x-operator-current-inbound-audio")),
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-account-id")),
		inboundEventKind: normalizeMcpInboundEventKind(require_http_auth_utils.getHeader(req, "x-operator-inbound-event-kind")),
		sourceReplyDeliveryMode: normalizeMcpSourceReplyDeliveryMode(require_http_auth_utils.getHeader(req, "x-operator-source-reply-delivery-mode")),
		taskSuggestionDeliveryMode: normalizeMcpTaskSuggestionDeliveryMode(require_http_auth_utils.getHeader(req, "x-operator-task-suggestion-delivery-mode")),
		requireExplicitMessageTarget: normalizeMcpBooleanHeader(require_http_auth_utils.getHeader(req, "x-operator-require-explicit-message-target")),
		senderIsOwner: auth.senderIsOwner
	};
}
//#endregion
//#region src/gateway/mcp-http.runtime.ts
const TOOL_CACHE_TTL_MS = 3e4;
const TOOL_CACHE_MAX_ENTRIES = 256;
const NATIVE_TOOL_EXCLUDE = /* @__PURE__ */ new Set([
	"read",
	"write",
	"edit",
	"apply_patch",
	"exec",
	"process"
]);
/** Resolves loopback-visible tools after applying gateway scope and native-tool exclusions. */
function resolveMcpLoopbackScopedTools(params) {
	const excludeToolNames = new Set(NATIVE_TOOL_EXCLUDE);
	if (params.nodeExecAllowed === true) excludeToolNames.delete("exec");
	const scoped = require_tool_resolution.resolveGatewayScopedTools({
		...params,
		conversationReadOrigin: "delegated",
		surface: "loopback",
		excludeToolNames,
		includeNodeExecTool: params.nodeExecAllowed === true
	});
	return {
		agentId: scoped.agentId,
		tools: scoped.tools
	};
}
/** Short-lived cache for loopback tool lists keyed by session/channel context. */
var McpLoopbackToolCache = class {
	#entries = /* @__PURE__ */ new Map();
	resolve(params) {
		const clientCapsCacheKey = [...new Set(params.clientCaps ?? [])].toSorted().join(",");
		const cacheKey = [
			params.sessionKey,
			params.runtimePolicySessionKey ?? "",
			params.agentId ?? "",
			params.sessionId ?? "",
			params.modelProvider ?? "",
			params.modelId ?? "",
			params.yieldContextCacheKey ?? "",
			params.messageProvider ?? "",
			clientCapsCacheKey,
			params.currentChannelId ?? "",
			params.currentThreadTs ?? "",
			params.currentMessageId != null ? String(params.currentMessageId) : "",
			params.currentInboundAudio === true ? "audio" : "no-audio",
			params.accountId ?? "",
			params.inboundEventKind ?? "",
			params.sourceReplyDeliveryMode ?? "",
			params.taskSuggestionDeliveryMode ?? "",
			params.requireExplicitMessageTarget === true ? "explicit-message-target" : "",
			params.nodeExecAllowed === true ? "node-exec" : "",
			params.execSession?.execHost ?? "",
			params.execSession?.execSecurity ?? "",
			params.execSession?.execAsk ?? "",
			params.execSession?.execNode ?? "",
			params.execOverrides?.host ?? "",
			params.execOverrides?.security ?? "",
			params.execOverrides?.ask ?? "",
			params.execOverrides?.node ?? "",
			params.bashElevated ? "elevated-present" : "elevated-absent",
			params.bashElevated?.enabled === true ? "elevated-enabled" : "elevated-disabled",
			params.bashElevated?.allowed === true ? "elevated-allowed" : "elevated-blocked",
			params.bashElevated?.defaultLevel ?? "",
			params.bashElevated?.fullAccessAvailable === true ? "full-access-available" : params.bashElevated?.fullAccessAvailable === false ? "full-access-unavailable" : "",
			params.bashElevated?.fullAccessBlockedReason ?? "",
			params.trigger ?? "",
			params.approvalReviewerDeviceId ?? "",
			params.channelContext?.sender?.id ?? "",
			params.channelContext?.chat?.id ?? "",
			params.senderName ?? "",
			params.senderUsername ?? "",
			params.senderE164 ?? "",
			params.groupId ?? "",
			params.groupChannel ?? "",
			params.groupSpace ?? "",
			params.spawnedBy ?? "",
			params.senderIsOwner === true ? "owner" : params.senderIsOwner === false ? "non-owner" : "unknown-owner"
		].join("\0");
		const now = Date.now();
		for (const [key, entry] of this.#entries) if (now - entry.time >= TOOL_CACHE_TTL_MS) this.#entries.delete(key);
		const cached = this.#entries.get(cacheKey);
		if (cached && cached.configRef === params.cfg && now - cached.time < TOOL_CACHE_TTL_MS) return cached;
		const next = resolveMcpLoopbackScopedTools(params);
		const nextEntry = {
			agentId: next.agentId,
			tools: next.tools,
			toolSchema: buildMcpToolSchema(next.tools),
			configRef: params.cfg,
			time: now
		};
		this.#entries.set(cacheKey, nextEntry);
		while (this.#entries.size > TOOL_CACHE_MAX_ENTRIES) {
			const oldestKey = this.#entries.keys().next().value;
			if (oldestKey === void 0) break;
			this.#entries.delete(oldestKey);
		}
		return nextEntry;
	}
};
//#endregion
//#region src/gateway/mcp-http.ts
var mcp_http_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	closeMcpLoopbackServer: () => closeMcpLoopbackServer,
	ensureMcpLoopbackServer: () => ensureMcpLoopbackServer
});
let activeMcpLoopbackServer;
let activeMcpLoopbackServerPromise = null;
function createMcpJsonParseError(error) {
	return Object.assign(/* @__PURE__ */ new Error("MCP JSON parse error"), {
		cause: error,
		code: "mcp_json_parse_error"
	});
}
function isMcpJsonParseError(error) {
	return typeof error === "object" && error !== null && error.code === "mcp_json_parse_error";
}
function parseMcpJsonBody(body) {
	try {
		return JSON.parse(body);
	} catch (error) {
		throw createMcpJsonParseError(error);
	}
}
function readJsonRpcRequestId(message) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message)) return null;
	const id = message.id;
	return typeof id === "string" || typeof id === "number" || id === null ? id : void 0;
}
function isJsonRpcRequest(message) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message) && message.jsonrpc === "2.0" && typeof message.method === "string";
}
function jsonRpcInternalError(parsed) {
	if (Array.isArray(parsed)) return parsed.map((message) => jsonRpcError(readJsonRpcRequestId(message), -32603, "Internal error"));
	return jsonRpcError(readJsonRpcRequestId(parsed), -32603, "Internal error");
}
function shouldLogMcpLoopbackTraffic() {
	return require_env.isTruthyEnvValue(process.env.OPERATOR_CLI_BACKEND_LOG_OUTPUT) || require_env.isTruthyEnvValue(process.env.OPERATOR_LIVE_CLI_BACKEND_DEBUG);
}
function logMcpLoopbackTraffic(step, details) {
	if (!shouldLogMcpLoopbackTraffic()) return;
	console.error(`[mcp-loopback] ${step} ${JSON.stringify(details)}`);
}
function createRequestAbortSignal(req, res) {
	const controller = new AbortController();
	const abort = () => {
		if (!controller.signal.aborted) controller.abort();
	};
	const abortIfRequestIncomplete = () => {
		if (!req.complete) abort();
	};
	const abortIfResponseStillOpen = () => {
		if (!res.writableEnded) abort();
	};
	req.once("close", abortIfRequestIncomplete);
	res.once("close", abortIfResponseStillOpen);
	if (req.destroyed && !req.complete) abort();
	return {
		signal: controller.signal,
		cleanup: () => {
			req.off("close", abortIfRequestIncomplete);
			res.off("close", abortIfResponseStillOpen);
		}
	};
}
/** Starts a new MCP loopback HTTP server and registers its bearer tokens. */
async function startMcpLoopbackServer(port = 0) {
	const ownerToken = node_crypto.default.randomBytes(32).toString("hex");
	const nonOwnerToken = node_crypto.default.randomBytes(32).toString("hex");
	const toolCache = new McpLoopbackToolCache();
	const activeSseResponses = /* @__PURE__ */ new Set();
	const trackSseResponse = (res) => {
		activeSseResponses.add(res);
		const cleanup = () => {
			activeSseResponses.delete(res);
			res.off("close", cleanup);
			res.off("finish", cleanup);
		};
		res.once("close", cleanup);
		res.once("finish", cleanup);
	};
	const closeActiveSseResponses = () => {
		for (const res of activeSseResponses) if (!res.destroyed && !res.writableEnded) {
			const socket = res.socket;
			res.end();
			socket?.end();
		}
	};
	const httpServer = (0, node_http.createServer)((req, res) => {
		const auth = validateMcpLoopbackRequest({
			req,
			res,
			ownerToken,
			nonOwnerToken,
			onSseResponse: trackSseResponse
		});
		if (!auth) return;
		const cliRequestCaptureHandle = require_mcp_http_loopback_runtime.markMcpLoopbackRequestStarted(resolveMcpCliCaptureKey(req, auth));
		const requestAbort = createRequestAbortSignal(req, res);
		(async () => {
			let parsed;
			let cliCaptureHandles = [];
			try {
				parsed = parseMcpJsonBody(await readMcpHttpBody(req, { timeoutMs: resolveMcpHttpBodyTimeoutMs() }));
				const messages = Array.isArray(parsed) ? parsed : [parsed];
				cliCaptureHandles = messages.map((message) => {
					if (!cliRequestCaptureHandle || !isJsonRpcRequest(message) || message.method !== "tools/call") return;
					const admittedToolName = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message.params) && typeof message.params.name === "string" ? message.params.name : "";
					const toolArgs = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message.params) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message.params.arguments) ? message.params.arguments : {};
					return require_mcp_http_loopback_runtime.markMcpLoopbackToolCallStarted({
						requestCaptureHandle: cliRequestCaptureHandle,
						toolName: admittedToolName,
						args: toolArgs
					});
				});
				require_mcp_http_loopback_runtime.markMcpLoopbackRequestClassified(cliRequestCaptureHandle);
				const cfg = require_io.getRuntimeConfig();
				const requestContext = resolveMcpRequestContext(req, cfg, auth);
				const { boundGrantToken, boundCaptureKey } = auth;
				const authorizeToolCall = boundGrantToken && boundCaptureKey ? () => Boolean(require_mcp_grant_store.resolveMcpLoopbackClientGrant({
					token: boundGrantToken,
					runtimeOwnerToken: ownerToken,
					captureKey: boundCaptureKey
				})) : void 0;
				const harnessEntry = require_store.isAgentHarnessSessionKey(requestContext.sessionKey) ? require_session_accessor.resolveSessionEntryAccessTarget({
					cfg,
					sessionKey: requestContext.sessionKey
				}).entry : void 0;
				if (require_store.isAgentHarnessSessionKey(requestContext.sessionKey) && (!harnessEntry || require_store.isAgentHarnessSessionStoreEntryProtected(requestContext.sessionKey, harnessEntry))) {
					const errors = messages.map((message) => jsonRpcError(readJsonRpcRequestId(message), -32600, require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE));
					const payload = Array.isArray(parsed) ? JSON.stringify(errors) : JSON.stringify(errors[0]);
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(payload);
					return;
				}
				const yieldContext = require_mcp_http_loopback_runtime.resolveMcpLoopbackYieldContext(cliRequestCaptureHandle);
				const scopedTools = toolCache.resolve({
					cfg,
					sessionKey: requestContext.sessionKey,
					runtimePolicySessionKey: requestContext.runtimePolicySessionKey,
					agentId: requestContext.agentId,
					sessionId: requestContext.sessionId,
					modelProvider: requestContext.modelProvider,
					modelId: requestContext.modelId,
					yieldContextCacheKey: yieldContext?.cacheKey,
					onYield: yieldContext?.onYield,
					messageProvider: requestContext.messageProvider,
					clientCaps: requestContext.clientCaps,
					currentChannelId: requestContext.currentChannelId,
					currentThreadTs: requestContext.currentThreadTs,
					currentMessageId: requestContext.currentMessageId,
					currentInboundAudio: requestContext.currentInboundAudio,
					accountId: requestContext.accountId,
					inboundEventKind: requestContext.inboundEventKind,
					sourceReplyDeliveryMode: requestContext.sourceReplyDeliveryMode,
					taskSuggestionDeliveryMode: requestContext.taskSuggestionDeliveryMode,
					requireExplicitMessageTarget: requestContext.requireExplicitMessageTarget,
					senderIsOwner: requestContext.senderIsOwner,
					nodeExecAllowed: requestContext.nodeExecAllowed,
					execSession: requestContext.execSession,
					execOverrides: requestContext.execOverrides,
					bashElevated: requestContext.bashElevated,
					trigger: requestContext.trigger,
					approvalReviewerDeviceId: requestContext.approvalReviewerDeviceId,
					channelContext: requestContext.channelContext,
					senderName: requestContext.senderName,
					senderUsername: requestContext.senderUsername,
					senderE164: requestContext.senderE164,
					groupId: requestContext.groupId,
					groupChannel: requestContext.groupChannel,
					groupSpace: requestContext.groupSpace,
					spawnedBy: requestContext.spawnedBy
				});
				logMcpLoopbackTraffic("request", {
					batchSize: messages.length,
					methods: messages.map((message) => isJsonRpcRequest(message) ? message.method : void 0),
					sessionKey: requestContext.sessionKey,
					inboundEventKind: requestContext.inboundEventKind,
					senderIsOwner: requestContext.senderIsOwner,
					toolCount: scopedTools.toolSchema.length,
					cronVisible: scopedTools.toolSchema.some((tool) => tool.name === "cron")
				});
				const responses = [];
				for (const [messageIndex, message] of messages.entries()) {
					if (!isJsonRpcRequest(message)) {
						responses.push(jsonRpcError(readJsonRpcRequestId(message), -32600, "Invalid Request"));
						continue;
					}
					const cliCaptureHandle = cliCaptureHandles[messageIndex];
					let response;
					try {
						response = await handleMcpJsonRpc({
							message,
							tools: scopedTools.tools,
							toolSchema: scopedTools.toolSchema,
							hookContext: {
								agentId: scopedTools.agentId,
								config: cfg,
								sessionKey: requestContext.sessionKey,
								sessionId: requestContext.sessionId,
								runId: requestContext.runId,
								approvalReviewerDeviceId: requestContext.approvalReviewerDeviceId,
								channelId: requestContext.currentChannelId,
								turnSourceChannel: requestContext.messageProvider,
								turnSourceTo: requestContext.currentChannelId,
								turnSourceAccountId: requestContext.accountId,
								turnSourceThreadId: requestContext.currentThreadTs,
								loopDetection: require_tool_loop_detection_config.resolveToolLoopDetectionConfig({
									cfg,
									agentId: scopedTools.agentId
								})
							},
							signal: requestAbort.signal,
							authorizeToolCall,
							onToolCallPrepared: cliCaptureHandle ? ({ toolName: preparedToolName, args }) => {
								require_mcp_http_loopback_runtime.updateMcpLoopbackToolCallCapture(cliCaptureHandle, {
									toolName: preparedToolName,
									args
								});
							} : void 0,
							onToolCallResult: cliCaptureHandle ? (result) => {
								require_mcp_http_loopback_runtime.recordMcpLoopbackToolCallResult({
									captureHandle: cliCaptureHandle,
									...result
								});
							} : void 0
						});
					} finally {
						require_mcp_http_loopback_runtime.markMcpLoopbackToolCallFinished(cliCaptureHandle);
					}
					if (response !== null) {
						const responseToolName = message.method === "tools/call" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(message.params) ? message.params.name : void 0;
						const isError = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(response) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(response.result) && response.result.isError === true;
						logMcpLoopbackTraffic("response", {
							method: message.method,
							toolName: typeof responseToolName === "string" ? responseToolName : void 0,
							isError
						});
						responses.push(response);
					}
				}
				if (responses.length === 0) {
					res.writeHead(202);
					res.end();
					return;
				}
				const payload = Array.isArray(parsed) ? JSON.stringify(responses) : JSON.stringify(responses[0]);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(payload);
			} catch (error) {
				require_logger.logWarn(`mcp loopback: request handling failed: ${require_errors.formatErrorMessage(error)}`);
				logMcpLoopbackTraffic("request-failed", { message: require_errors.formatErrorMessage(error) });
				if (!res.headersSent) if (isMcpHttpBodyTooLargeError(error)) {
					res.writeHead(413, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "payload_too_large" }), () => {
						req.destroy();
					});
				} else if (isMcpHttpBodyTimeoutError(error)) {
					res.writeHead(408, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "request_body_timeout" }), () => {
						req.destroy();
					});
				} else if (isMcpJsonParseError(error)) {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify(jsonRpcError(null, -32700, "Parse error")));
				} else {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify(jsonRpcInternalError(parsed)));
				}
			} finally {
				requestAbort.cleanup();
				for (const captureHandle of cliCaptureHandles) require_mcp_http_loopback_runtime.markMcpLoopbackToolCallFinished(captureHandle);
				require_mcp_http_loopback_runtime.markMcpLoopbackRequestFinished(cliRequestCaptureHandle);
			}
		})();
	});
	await new Promise((resolve, reject) => {
		httpServer.once("error", reject);
		httpServer.listen(port, "127.0.0.1", () => {
			httpServer.removeListener("error", reject);
			resolve();
		});
	});
	const address = httpServer.address();
	if (!address || typeof address === "string") throw new Error("mcp loopback did not bind to a TCP port");
	require_mcp_http_loopback_runtime.setActiveMcpLoopbackRuntime({
		port: address.port,
		ownerToken,
		nonOwnerToken
	});
	require_logger.logDebug(`mcp loopback listening on 127.0.0.1:${address.port}`);
	const server = {
		port: address.port,
		close: () => {
			require_mcp_http_loopback_runtime.clearActiveMcpLoopbackRuntimeByOwnerToken(ownerToken);
			require_mcp_grant_store.revokeMcpLoopbackClientGrantsForRuntime(ownerToken);
			return new Promise((resolve, reject) => {
				httpServer.close((error) => {
					if (!error) {
						if (activeMcpLoopbackServer === server) activeMcpLoopbackServer = void 0;
					}
					if (error) {
						reject(error);
						return;
					}
					resolve();
				});
				closeActiveSseResponses();
			});
		}
	};
	return server;
}
/** Returns the active MCP loopback server or starts one if none exists. */
async function ensureMcpLoopbackServer(port = 0) {
	if (activeMcpLoopbackServer) return activeMcpLoopbackServer;
	if (!activeMcpLoopbackServerPromise) activeMcpLoopbackServerPromise = startMcpLoopbackServer(port).then((server) => {
		activeMcpLoopbackServer = server;
		return server;
	}).finally(() => {
		activeMcpLoopbackServerPromise = null;
	});
	return activeMcpLoopbackServerPromise;
}
/** Closes the active MCP loopback server if one has been started. */
async function closeMcpLoopbackServer() {
	const server = activeMcpLoopbackServer ?? (activeMcpLoopbackServerPromise ? await activeMcpLoopbackServerPromise : void 0);
	if (!server) return;
	activeMcpLoopbackServer = void 0;
	await server.close();
}
//#endregion
Object.defineProperty(exports, "ensureMcpLoopbackServer", {
	enumerable: true,
	get: function() {
		return ensureMcpLoopbackServer;
	}
});
Object.defineProperty(exports, "mcp_http_exports", {
	enumerable: true,
	get: function() {
		return mcp_http_exports;
	}
});
Object.defineProperty(exports, "resolveMcpLoopbackScopedTools", {
	enumerable: true,
	get: function() {
		return resolveMcpLoopbackScopedTools;
	}
});
