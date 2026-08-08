const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
require("./embedded-agent-helpers-DJEcJifp.cjs");
const require_errors$1 = require("./errors-DsTBGN_q.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_host_env_security = require("./host-env-security-DTRiezH-.cjs");
const require_node_commands = require("./node-commands-DQ3xnEUk.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_text_transforms_runtime = require("./text-transforms.runtime-B0pRaBUe.cjs");
const require_failover_error = require("./failover-error-voHYvp7k.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_embedded_agent_messaging = require("./embedded-agent-messaging-cGDfXH3g.cjs");
const require_embedded_agent_subscribe_tools = require("./embedded-agent-subscribe.tools-uz-J6wM0.cjs");
const require_embedded_agent_message_tool_source_reply = require("./embedded-agent-message-tool-source-reply-l_n9VmGj.cjs");
const require_bootstrap_budget = require("./bootstrap-budget-B73ETWvB.cjs");
const require_event_session_routing = require("./event-session-routing-BmkihcER.cjs");
const require_server_plugin_fallback_context = require("./server-plugin-fallback-context-A5MnRYGO.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_internal_source_reply = require("./internal-source-reply-CsvlwGQQ.cjs");
const require_env_overrides = require("./env-overrides-DD_3nCjH.cjs");
const require_bash_tools_exec_runtime = require("./bash-tools.exec-runtime-Bs5anBBF.cjs");
const require_bash_tools_exec_approval_request = require("./bash-tools.exec-approval-request-4RFFHNpX.cjs");
const require_mcp_http_loopback_runtime = require("./mcp-http.loopback-runtime-CtJBYKwk.cjs");
const require_cli_auth_epoch = require("./cli-auth-epoch-BktnfdBu.cjs");
const require_claude_live_session = require("./claude-live-session-CRdHSCWt.cjs");
const require_helpers = require("./helpers-D33_rP9K.cjs");
const require_claude_skills_plugin = require("./claude-skills-plugin-D_URs_L7.cjs");
const require_delivery_evidence = require("./delivery-evidence-DnnMJWya.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_util = require("node:util");
//#region src/gateway/node-agent-cli-runtime.ts
/** In-process Gateway seam for streaming a Claude CLI turn from a paired node. */
async function invokeNodeClaudeCliRun(params) {
	const context = require_server_plugin_fallback_context.getFallbackGatewayContext();
	if (!context) return {
		ok: false,
		error: {
			code: "UNAVAILABLE",
			message: "Gateway node runtime unavailable"
		}
	};
	const node = context.nodeRegistry.get(params.nodeId);
	if (!node?.commands.includes("agent.cli.claude.run.v1")) return {
		ok: false,
		error: {
			code: "UNAVAILABLE",
			message: "paired node does not advertise Claude CLI agent runs"
		}
	};
	const allowlist = require_node_command_policy.resolveNodeCommandAllowlist(context.getRuntimeConfig(), {
		...node,
		approvedCommands: node.commands
	});
	const allowed = require_node_command_policy.isNodeCommandAllowed({
		command: require_node_commands.NODE_AGENT_CLI_CLAUDE_RUN_COMMAND,
		declaredCommands: node.commands,
		allowlist
	});
	if (!allowed.ok) return {
		ok: false,
		error: {
			code: "PERMISSION_DENIED",
			message: `paired-node Claude CLI agent runs are blocked by node command policy (${allowed.reason})`
		}
	};
	return await context.nodeRegistry.invoke({
		nodeId: params.nodeId,
		expectedConnId: node.connId,
		command: require_node_commands.NODE_AGENT_CLI_CLAUDE_RUN_COMMAND,
		params: {
			argv: params.argv,
			stdin: params.stdin,
			...params.cwd ? { cwd: params.cwd } : {},
			...params.systemPrompt !== void 0 ? { systemPrompt: params.systemPrompt } : {},
			...params.agentId ? { agentId: params.agentId } : {},
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			...params.approvalDecision ? { approvalDecision: params.approvalDecision } : {},
			...params.systemRunPlan ? { systemRunPlan: params.systemRunPlan } : {},
			idleTimeoutMs: params.idleTimeoutMs,
			timeoutMs: params.timeoutMs
		},
		timeoutMs: params.timeoutMs,
		idleTimeoutMs: params.idleTimeoutMs,
		idempotencyKey: (0, node_crypto.randomUUID)(),
		onProgress: params.onProgress,
		...params.signal ? { signal: params.signal } : {}
	});
}
const OPERATOR_MCP_TOOL_PREFIX = "mcp__operator__";
function normalizeCliMessagingToolName(toolName) {
	return toolName.startsWith(OPERATOR_MCP_TOOL_PREFIX) ? toolName.slice(15) : toolName;
}
function extractCliMessagingTarget(context, toolName, args) {
	const normalizedToolName = normalizeCliMessagingToolName(toolName);
	const currentProvider = context.params.messageChannel ?? context.params.messageProvider;
	const hasExplicitProvider = typeof args.provider === "string" && args.provider.trim().length > 0 || typeof args.channel === "string" && args.channel.trim().length > 0;
	const targetArgs = normalizedToolName === "message" && currentProvider && !hasExplicitProvider ? {
		...args,
		provider: currentProvider
	} : args;
	if (!require_embedded_agent_messaging.isMessagingToolTargetEvidenceAction(normalizedToolName, targetArgs)) return;
	return require_embedded_agent_subscribe_tools.extractMessagingToolSend(normalizedToolName, targetArgs, {
		config: context.params.config,
		currentChannelId: context.params.currentChannelId,
		currentThreadId: context.params.currentThreadTs,
		currentMessageId: context.params.currentMessageId
	});
}
function buildMessagingToolSendEvidenceKey(send) {
	return node_crypto.default.createHash("sha256").update(JSON.stringify([
		send.tool,
		send.provider,
		send.accountId,
		send.to,
		send.threadId,
		send.threadImplicit,
		send.threadSuppressed,
		send.text,
		send.mediaUrls
	])).digest("hex");
}
function extractCliMessagingContent(args, result) {
	const text = [
		"message",
		"SendMessage",
		"content",
		"text",
		"caption"
	].map((key) => args[key]).find((value) => typeof value === "string" && value.trim().length > 0);
	const mediaUrls = [...require_embedded_agent_subscribe_tools.collectMessagingMediaUrlsFromRecord(args), ...require_embedded_agent_subscribe_tools.collectMessagingMediaUrlsFromToolResult(result)].filter((url, index, all) => all.indexOf(url) === index);
	return {
		...text ? { text } : {},
		...mediaUrls.length > 0 ? { mediaUrls } : {}
	};
}
function appendUniqueCliMessagingEvidence(values, valueKeys, additions) {
	for (const addition of additions) {
		if (!addition || valueKeys.has(addition)) continue;
		if (values.length >= 64) {
			const removed = values.shift();
			if (removed) valueKeys.delete(removed);
		}
		values.push(addition);
		valueKeys.add(addition);
	}
}
//#endregion
//#region src/agents/cli-runner/execute-node-claude.ts
const NODE_CLI_MAX_TIMEOUT_MS = 1440 * 60 * 1e3;
const NODE_CLI_MAX_IDLE_TIMEOUT_MS = 1800 * 1e3;
function resolveNodeClaudePlacement(context) {
	const entry = context.params.sessionEntry;
	const nodeId = entry?.execNode?.trim();
	if (context.backendResolved.id !== "claude-cli" || entry?.execHost !== "node") return null;
	if (!nodeId) throw new Error("node-placed Claude CLI session is missing execNode");
	return {
		nodeId,
		...entry.execCwd?.trim() ? { cwd: entry.execCwd.trim() } : {}
	};
}
const NODE_CLI_OMIT_BARE_ARGS = /* @__PURE__ */ new Set(["--strict-mcp-config"]);
const NODE_CLI_OMIT_VALUE_ARGS = /* @__PURE__ */ new Set([
	"--permission-mode",
	"--plugin-dir",
	"--plugin-dir-no-mcp"
]);
const NODE_CLI_OMIT_VARIADIC_ARGS = /* @__PURE__ */ new Set([
	"--mcp-config",
	"--allowedTools",
	"--allowed-tools"
]);
/** Remove Gateway-local file, plugin, MCP, and allow-list arguments. */
function stripGatewayLocalClaudeArgs(args) {
	const result = [];
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index] ?? "";
		const equalsIndex = arg.indexOf("=");
		const name = equalsIndex > 0 ? arg.slice(0, equalsIndex) : arg;
		if (NODE_CLI_OMIT_BARE_ARGS.has(name)) continue;
		if (NODE_CLI_OMIT_VALUE_ARGS.has(name)) {
			if (equalsIndex < 0) index += 1;
			continue;
		}
		if (NODE_CLI_OMIT_VARIADIC_ARGS.has(name)) {
			if (equalsIndex < 0) while (typeof args[index + 1] === "string" && !args[index + 1]?.startsWith("-")) index += 1;
			continue;
		}
		result.push(arg);
	}
	return result;
}
function parseNodeClaudeResultPayload(result) {
	const value = result.payloadJSON ? JSON.parse(result.payloadJSON) : result.payload;
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("paired node returned an invalid Claude CLI result");
	const record = value;
	if (!Number.isInteger(record.exitCode) || typeof record.stderrTail !== "string" || typeof record.truncated !== "boolean" || record.timeoutKind !== void 0 && record.timeoutKind !== "hard" && record.timeoutKind !== "idle") throw new Error("paired node returned an invalid Claude CLI result");
	return {
		exitCode: record.exitCode,
		stderrTail: record.stderrTail,
		truncated: record.truncated,
		...record.timeoutKind ? { timeoutKind: record.timeoutKind } : {}
	};
}
function parseNodeClaudeApprovalRequired(result) {
	if (!result.ok) return null;
	const value = result.payloadJSON ? JSON.parse(result.payloadJSON) : result.payload;
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const record = value;
	if (record.approvalRequired !== true || !record.systemRunPlan || typeof record.systemRunPlan !== "object" || Array.isArray(record.systemRunPlan) || record.security !== "deny" && record.security !== "allowlist" && record.security !== "full" || record.ask !== "off" && record.ask !== "on-miss" && record.ask !== "always") return null;
	return {
		systemRunPlan: record.systemRunPlan,
		security: record.security,
		ask: record.ask
	};
}
function createCliAbortError() {
	return require_abort_signal.createAbortError("CLI run aborted");
}
async function waitForNodeOperation(params) {
	if (!params.signal) return await params.operation;
	if (params.signal.aborted) throw createCliAbortError();
	return await new Promise((resolve, reject) => {
		const onAbort = () => reject(createCliAbortError());
		params.signal?.addEventListener("abort", onAbort, { once: true });
		params.operation.then(resolve, reject).finally(() => {
			params.signal?.removeEventListener("abort", onAbort);
		});
	});
}
async function executeNodeClaudeRun(params) {
	const contextParams = params.context.params;
	const startedAt = Date.now();
	const hardTimeoutMs = Math.min(contextParams.timeoutMs, NODE_CLI_MAX_TIMEOUT_MS);
	const hardDeadlineAt = startedAt + hardTimeoutMs;
	const nodeAbortController = new AbortController();
	const nodeRunAbortSignal = nodeAbortController.signal;
	let hardDeadlineReached = false;
	const hardDeadlineTimer = setTimeout(() => {
		hardDeadlineReached = true;
		nodeAbortController.abort();
	}, hardTimeoutMs);
	const abortNodeRun = () => nodeAbortController.abort();
	contextParams.abortSignal?.addEventListener("abort", abortNodeRun, { once: true });
	if (contextParams.abortSignal?.aborted) abortNodeRun();
	let replyBackendCompleted = false;
	const replyBackendHandle = contextParams.replyOperation ? {
		kind: "cli",
		cancel: abortNodeRun,
		isStreaming: () => !replyBackendCompleted
	} : void 0;
	if (replyBackendHandle) contextParams.replyOperation?.attachBackend(replyBackendHandle);
	let nodeResult;
	try {
		const invokeNode = async (approval) => {
			const remainingTimeoutMs = hardDeadlineAt - Date.now();
			if (remainingTimeoutMs <= 0) {
				hardDeadlineReached = true;
				nodeAbortController.abort();
				return {
					ok: false,
					error: {
						code: "TIMEOUT",
						message: "paired-node Claude CLI invocation exceeded its hard timeout"
					}
				};
			}
			return await params.deps.invokeNodeClaudeCliRun({
				nodeId: params.nodePlacement.nodeId,
				argv: params.executionArgs,
				stdin: params.stdinPayload,
				...params.nodePlacement.cwd ? { cwd: params.nodePlacement.cwd } : {},
				...params.nodeSystemPrompt !== void 0 ? { systemPrompt: params.nodeSystemPrompt } : {},
				...contextParams.agentId ? { agentId: contextParams.agentId } : {},
				...contextParams.sessionKey ? { sessionKey: contextParams.sessionKey } : {},
				...approval ? {
					approvalDecision: approval.decision,
					systemRunPlan: approval.plan
				} : {},
				timeoutMs: remainingTimeoutMs,
				idleTimeoutMs: Math.max(1e3, Math.min(params.noOutputTimeoutMs, NODE_CLI_MAX_IDLE_TIMEOUT_MS)),
				onProgress: params.consumeStdout,
				signal: nodeAbortController.signal
			});
		};
		nodeResult = await invokeNode();
		const approval = parseNodeClaudeApprovalRequired(nodeResult);
		if (approval) {
			const approvalId = node_crypto.default.randomUUID();
			const registration = await waitForNodeOperation({
				operation: params.deps.registerExecApprovalRequestForHostOrThrow({
					approvalId,
					command: approval.systemRunPlan.commandText,
					commandArgv: approval.systemRunPlan.argv,
					systemRunPlan: approval.systemRunPlan,
					workdir: approval.systemRunPlan.cwd ?? void 0,
					host: "node",
					nodeId: params.nodePlacement.nodeId,
					security: approval.security,
					ask: approval.ask,
					unavailableDecisions: ["allow-always"],
					agentId: contextParams.agentId,
					sessionKey: contextParams.sessionKey,
					...contextParams.approvalReviewerDeviceId ? { approvalReviewerDeviceIds: [contextParams.approvalReviewerDeviceId] } : {}
				}),
				signal: nodeAbortController.signal
			});
			const decision = await waitForNodeOperation({
				operation: params.deps.resolveRegisteredExecApprovalDecision({
					approvalId: registration.id,
					preResolvedDecision: registration.finalDecision
				}),
				signal: nodeAbortController.signal
			});
			if (decision === "allow-once" || decision === "allow-always") nodeResult = await invokeNode({
				decision,
				plan: approval.systemRunPlan
			});
			else nodeResult = {
				ok: false,
				error: {
					code: "PERMISSION_DENIED",
					message: "paired-node Claude CLI agent run was not approved"
				}
			};
		}
	} catch (error) {
		if (!hardDeadlineReached) throw error;
		nodeResult = {
			ok: false,
			error: {
				code: "TIMEOUT",
				message: "paired-node Claude CLI invocation exceeded its hard timeout"
			}
		};
	} finally {
		clearTimeout(hardDeadlineTimer);
		replyBackendCompleted = true;
		if (replyBackendHandle) contextParams.replyOperation?.detachBackend(replyBackendHandle);
		contextParams.abortSignal?.removeEventListener("abort", abortNodeRun);
	}
	if (hardDeadlineReached) nodeResult = {
		ok: false,
		error: {
			code: "TIMEOUT",
			message: "paired-node Claude CLI invocation exceeded its hard timeout"
		}
	};
	if (!nodeResult.ok) {
		const code = nodeResult.error?.code;
		const timedOut = code === "TIMEOUT" || code === "IDLE_TIMEOUT";
		const result = {
			reason: code === "IDLE_TIMEOUT" ? "no-output-timeout" : code === "TIMEOUT" ? "overall-timeout" : code === "ABORTED" ? "manual-cancel" : "exit",
			exitCode: timedOut || code === "ABORTED" ? null : 1,
			exitSignal: null,
			durationMs: Date.now() - startedAt,
			stdout: "",
			stderr: nodeResult.error?.message ?? "paired-node Claude CLI invocation failed",
			timedOut,
			noOutputTimedOut: code === "IDLE_TIMEOUT"
		};
		params.consumeStderr(result.stderr);
		return {
			result,
			nodeRunAbortSignal,
			nodeRunTruncated: false
		};
	}
	const payload = parseNodeClaudeResultPayload(nodeResult);
	if (payload.stderrTail) params.consumeStderr(payload.stderrTail);
	return {
		result: {
			reason: payload.timeoutKind === "idle" ? "no-output-timeout" : payload.timeoutKind === "hard" ? "overall-timeout" : "exit",
			exitCode: payload.timeoutKind ? null : payload.exitCode,
			exitSignal: null,
			durationMs: Date.now() - startedAt,
			stdout: "",
			stderr: payload.stderrTail,
			timedOut: payload.timeoutKind !== void 0,
			noOutputTimedOut: payload.timeoutKind === "idle"
		},
		nodeRunAbortSignal,
		nodeRunTruncated: payload.truncated
	};
}
//#endregion
//#region src/agents/cli-runner/execute-output-buffer.ts
const CLI_RUNNER_OUTPUT_TAIL_BYTES = 64 * 1024;
function appendCliOutputTail(tail, chunk) {
	if (!chunk) return tail;
	const chunkBuffer = Buffer.from(chunk);
	if (chunkBuffer.byteLength >= CLI_RUNNER_OUTPUT_TAIL_BYTES) return Buffer.from(chunkBuffer.subarray(chunkBuffer.byteLength - CLI_RUNNER_OUTPUT_TAIL_BYTES));
	const next = Buffer.concat([tail, chunkBuffer], tail.byteLength + chunkBuffer.byteLength);
	if (next.byteLength <= CLI_RUNNER_OUTPUT_TAIL_BYTES) return next;
	return Buffer.from(next.subarray(next.byteLength - CLI_RUNNER_OUTPUT_TAIL_BYTES));
}
//#endregion
//#region src/agents/cli-runner/execute.ts
/**
* Executes prepared CLI backend runs, including env isolation, streaming parse,
* live-session routing, and diagnostics.
*/
const CLI_RUNNER_OUTPUT_PARSE_BYTES = 1024 * 1024;
function appendCliOutputParseBuffer(buffer, chunk) {
	if (!chunk) return {
		buffer,
		exceeded: false
	};
	const chunkBuffer = Buffer.from(chunk);
	if (buffer.byteLength + chunkBuffer.byteLength > CLI_RUNNER_OUTPUT_PARSE_BYTES) {
		const remainingBytes = CLI_RUNNER_OUTPUT_PARSE_BYTES - buffer.byteLength;
		if (remainingBytes <= 0) return {
			buffer,
			exceeded: true
		};
		return {
			buffer: Buffer.concat([buffer, chunkBuffer.subarray(0, remainingBytes)], CLI_RUNNER_OUTPUT_PARSE_BYTES),
			exceeded: true
		};
	}
	return {
		buffer: Buffer.concat([buffer, chunkBuffer], buffer.byteLength + chunkBuffer.byteLength),
		exceeded: false
	};
}
const executeDeps = {
	getProcessSupervisor: require_bash_tools_exec_runtime.getProcessSupervisor,
	enqueueSystemEvent: require_system_events.enqueueSystemEvent,
	requestHeartbeat: require_heartbeat_wake.requestHeartbeat,
	writeCliSystemPromptFile: require_helpers.writeCliSystemPromptFile,
	invokeNodeClaudeCliRun,
	registerExecApprovalRequestForHostOrThrow: require_bash_tools_exec_approval_request.registerExecApprovalRequestForHostOrThrow,
	resolveRegisteredExecApprovalDecision: require_bash_tools_exec_approval_request.resolveRegisteredExecApprovalDecision
};
const CLI_LOOPBACK_CORRELATION_MAX_CALLS = 64;
const CLI_MCP_DELIVERY_DRAIN_GRACE_MS = 5e3;
const CLI_MCP_REQUEST_ADMISSION_GRACE_MS = 250;
function normalizeCliBackendThinkingLevel(level) {
	return level === "ultra" ? "max" : level;
}
function buildCliMcpCaptureKey(context) {
	if (!context.mcpDeliveryCapture) return;
	return node_crypto.default.randomUUID();
}
/** Overrides process/event dependencies for CLI runner execution tests. */
function setCliRunnerExecuteTestDeps(overrides) {
	Object.assign(executeDeps, overrides);
}
function buildCliLogArgs(params) {
	const logArgs = [];
	for (let i = 0; i < params.args.length; i += 1) {
		const arg = params.args[i] ?? "";
		if (arg === params.systemPromptArg) {
			const systemPromptValue = params.args[i + 1] ?? "";
			logArgs.push(arg, `<systemPrompt:${systemPromptValue.length} chars>`);
			i += 1;
			continue;
		}
		if (arg === params.sessionArg) {
			logArgs.push(arg, params.args[i + 1] ?? "");
			i += 1;
			continue;
		}
		if (arg === params.modelArg) {
			logArgs.push(arg, params.args[i + 1] ?? "");
			i += 1;
			continue;
		}
		if (arg === params.imageArg) {
			logArgs.push(arg, "<image>");
			i += 1;
			continue;
		}
		logArgs.push(arg);
	}
	if (params.argsPrompt) {
		const promptIndex = logArgs.indexOf(params.argsPrompt);
		if (promptIndex >= 0) logArgs[promptIndex] = `<prompt:${params.argsPrompt.length} chars>`;
	}
	return logArgs;
}
const CLI_ENV_AUTH_LOG_KEYS = [
	"AI_GATEWAY_API_KEY",
	"ANTHROPIC_API_KEY",
	"ANTHROPIC_API_KEY_OLD",
	"ANTHROPIC_API_TOKEN",
	"ANTHROPIC_AUTH_TOKEN",
	"ANTHROPIC_BASE_URL",
	"ANTHROPIC_CUSTOM_HEADERS",
	"ANTHROPIC_OAUTH_TOKEN",
	"ANTHROPIC_UNIX_SOCKET",
	"AZURE_OPENAI_API_KEY",
	"CLAUDE_CODE_OAUTH_TOKEN",
	"CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST",
	"OPENAI_API_KEY",
	"OPENAI_STEIPETE_API_KEY",
	"OPENROUTER_API_KEY"
];
const CLI_ENV_RUNTIME_LOG_KEYS = ["GEMINI_CLI_HOME", "GEMINI_CLI_SYSTEM_SETTINGS_PATH"];
const CLI_BACKEND_PRESERVE_ENV = "OPERATOR_LIVE_CLI_BACKEND_PRESERVE_ENV";
function parseCliBackendPreserveEnv(raw) {
	const trimmed = raw?.trim();
	if (!trimmed) return /* @__PURE__ */ new Set();
	if (trimmed.startsWith("[")) try {
		const parsed = JSON.parse(trimmed);
		return new Set(Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : []);
	} catch {
		return /* @__PURE__ */ new Set();
	}
	return new Set(trimmed.split(/[,\s]+/).map((entry) => entry.trim()).filter((entry) => entry.length > 0));
}
function listPresentCliAuthEnvKeys(env) {
	return CLI_ENV_AUTH_LOG_KEYS.filter((key) => {
		const value = env[key];
		return typeof value === "string" && value.length > 0;
	});
}
function listPresentCliRuntimeEnvKeys(env) {
	return CLI_ENV_RUNTIME_LOG_KEYS.filter((key) => {
		const value = env[key];
		return typeof value === "string" && value.length > 0;
	});
}
function formatCliEnvKeyList(keys) {
	return keys.length > 0 ? keys.join(",") : "none";
}
function buildCliEnvMcpLog(childEnv) {
	return [`token=${childEnv.OPERATOR_MCP_TOKEN ? "set" : "missing"}`, `capture=${childEnv.OPERATOR_MCP_CLI_CAPTURE_KEY ? "set" : "missing"}`].join(" ");
}
function fingerprintCliSessionId(sessionId) {
	const trimmed = sessionId?.trim();
	if (!trimmed) return "none";
	return node_crypto.default.createHash("sha256").update(trimmed).digest("hex").slice(0, 12);
}
function formatCliSessionReuseLogState(reusableSession) {
	switch (reusableSession.mode) {
		case "reuse": return "reusable";
		case "reuse-with-drift": return `reusable-drift:${reusableSession.drift.reasons.join(",")}`;
		case "invalidate": return `invalidated:${reusableSession.invalidatedReason}`;
		case "none": return "none";
	}
	return reusableSession;
}
/** Builds the compact execution summary logged before a CLI backend run. */
function buildCliExecLogLine(params) {
	return [
		`cli exec: provider=${params.provider}`,
		`model=${params.model}`,
		`promptChars=${params.promptChars}`,
		`trigger=${params.trigger ?? "unknown"}`,
		`useResume=${params.useResume ? "true" : "false"}`,
		`session=${params.cliSessionId ? "present" : "none"}`,
		`resumeSession=${params.useResume ? fingerprintCliSessionId(params.resolvedSessionId) : "none"}`,
		`reuse=${formatCliSessionReuseLogState(params.reusableSession)}`,
		`historyPrompt=${params.hasHistoryPrompt ? "present" : "none"}`
	].join(" ");
}
/** Summarizes auth-related env keys preserved or cleared for a CLI child process. */
function buildCliEnvAuthLog(childEnv) {
	const hostKeys = listPresentCliAuthEnvKeys(process.env);
	const childKeys = listPresentCliAuthEnvKeys(childEnv);
	const childKeySet = new Set(childKeys);
	const clearedKeys = hostKeys.filter((key) => !childKeySet.has(key));
	const runtimeHostKeys = listPresentCliRuntimeEnvKeys(process.env);
	const runtimeChildKeys = listPresentCliRuntimeEnvKeys(childEnv);
	const runtimeChildKeySet = new Set(runtimeChildKeys);
	const runtimeClearedKeys = runtimeHostKeys.filter((key) => !runtimeChildKeySet.has(key));
	return [
		`host=${formatCliEnvKeyList(hostKeys)}`,
		`child=${formatCliEnvKeyList(childKeys)}`,
		`cleared=${formatCliEnvKeyList(clearedKeys)}`,
		`runtimeHost=${formatCliEnvKeyList(runtimeHostKeys)}`,
		`runtimeChild=${formatCliEnvKeyList(runtimeChildKeys)}`,
		`runtimeCleared=${formatCliEnvKeyList(runtimeClearedKeys)}`
	].join(" ");
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.cliRunnerExecuteTestApi")] = {
	buildCliEnvAuthLog,
	buildCliExecLogLine,
	setCliRunnerExecuteTestDeps: (overrides) => {
		setCliRunnerExecuteTestDeps(overrides);
	}
};
/** Executes a prepared CLI run context and returns normalized CLI output. */
async function executePreparedCliRun(context, cliSessionIdToUse) {
	const params = context.params;
	if (params.abortSignal?.aborted) throw createCliAbortError();
	const backend = context.preparedBackend.backend;
	const nodePlacement = resolveNodeClaudePlacement(context);
	const { sessionId: resolvedSessionId, isNew } = require_helpers.resolveSessionIdToSend({
		backend,
		cliSessionId: cliSessionIdToUse
	});
	const useResume = Boolean(cliSessionIdToUse && resolvedSessionId && backend.resumeArgs && backend.resumeArgs.length > 0);
	const resendSystemPromptForSoftResume = context.reusableCliSession.mode === "reuse-with-drift";
	const systemPromptArg = require_helpers.resolveSystemPromptUsage({
		backend,
		isNewSession: isNew || resendSystemPromptForSoftResume,
		systemPrompt: context.systemPrompt
	});
	const systemPromptFile = !nodePlacement && systemPromptArg && (!useResume || backend.systemPromptWhen === "always" || resendSystemPromptForSoftResume) ? await executeDeps.writeCliSystemPromptFile({
		backend,
		systemPrompt: systemPromptArg
	}) : void 0;
	const nodeSystemPrompt = nodePlacement && systemPromptArg && (!useResume || backend.systemPromptWhen === "always" || resendSystemPromptForSoftResume) ? systemPromptArg : void 0;
	const basePrompt = cliSessionIdToUse ? params.prompt : context.openClawHistoryPrompt ?? params.prompt;
	let prompt = require_text_transforms_runtime.applyPluginTextReplacements(require_bootstrap_budget.appendBootstrapPromptWarning(basePrompt, context.bootstrapPromptWarningLines, { preserveExactPrompt: context.heartbeatPrompt }), context.backendResolved.textTransforms?.input);
	if (nodePlacement && ((params.images?.length ?? 0) > 0 || Boolean(params.imagePrompt?.trim()))) throw new Error("paired-node Claude CLI sessions do not support attachments or images");
	const { prompt: promptWithImages, imagePaths, cleanupImages } = nodePlacement ? {
		prompt,
		imagePaths: [],
		cleanupImages: async () => {}
	} : await require_helpers.prepareCliPromptImagePayload({
		backend,
		prompt,
		imagePrompt: params.imagePrompt,
		workspaceDir: context.workspaceDir,
		images: params.images,
		imageOrder: params.imageOrder
	});
	prompt = promptWithImages;
	const { argsPrompt, stdin } = require_helpers.resolvePromptInput({
		backend,
		prompt
	});
	const stdinPayload = stdin ?? "";
	const baseArgs = useResume ? backend.resumeArgs ?? backend.args ?? [] : backend.args ?? [];
	const resolvedArgs = useResume ? baseArgs.map((entry) => entry.replaceAll("{sessionId}", resolvedSessionId ?? "")) : baseArgs;
	const fallbackClaudeSkillsPlugin = !nodePlacement && context.claudeSkillsPluginArgs === void 0 ? await require_claude_skills_plugin.prepareClaudeCliSkillsPlugin({
		backendId: context.backendResolved.id,
		skillsSnapshot: params.skillsSnapshot
	}) : void 0;
	let fallbackClaudeSkillsPluginCleanupOwned = false;
	const claudeSkillsPluginArgs = nodePlacement ? [] : context.claudeSkillsPluginArgs ?? fallbackClaudeSkillsPlugin?.args ?? [];
	const baseArgsWithSkills = claudeSkillsPluginArgs.length > 0 ? [...resolvedArgs, ...claudeSkillsPluginArgs] : resolvedArgs;
	const resolvedExecutionArgs = context.backendResolved.resolveExecutionArgs?.({
		config: params.config,
		workspaceDir: context.workspaceDir,
		provider: params.provider,
		modelId: context.modelId,
		authProfileId: context.effectiveAuthProfileId,
		thinkingLevel: normalizeCliBackendThinkingLevel(params.thinkLevel),
		executionMode: params.executionMode ?? "agent",
		toolAvailability: nodePlacement && params.cliToolAvailability ? {
			native: params.cliToolAvailability.native,
			mcp: []
		} : params.cliToolAvailability,
		useResume,
		baseArgs: baseArgsWithSkills
	});
	if (params.cliToolAvailability && !resolvedExecutionArgs) throw new Error(`CLI backend ${context.backendResolved.id} did not enforce exact per-run tool availability`);
	const executionBaseArgs = nodePlacement ? stripGatewayLocalClaudeArgs(resolvedExecutionArgs ?? baseArgsWithSkills) : resolvedExecutionArgs ?? baseArgsWithSkills;
	const args = require_helpers.buildCliArgs({
		backend: nodePlacement ? {
			...backend,
			systemPromptArg: void 0,
			systemPromptFileArg: void 0
		} : backend,
		baseArgs: Array.from(executionBaseArgs),
		modelId: context.normalizedModel,
		sessionId: resolvedSessionId,
		systemPrompt: nodePlacement ? void 0 : systemPromptArg,
		systemPromptFilePath: systemPromptFile?.filePath,
		imagePaths,
		promptArg: argsPrompt,
		useResume,
		forkResume: params.forkCliSessionOnResume,
		sendSystemPromptOnResume: resendSystemPromptForSoftResume
	});
	const claudeOwnerKey = require_helpers.buildClaudeOwnerKey({
		agentAccountId: params.agentAccountId,
		agentId: params.agentId,
		authProfileId: context.effectiveAuthProfileId,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey
	});
	const queueKey = require_helpers.resolveCliRunQueueKey({
		backendId: context.backendResolved.id,
		liveSession: backend.liveSession,
		serialize: backend.serialize,
		runId: params.runId,
		workspaceDir: context.workspaceDir,
		cliSessionId: useResume ? resolvedSessionId : void 0,
		ownerKey: claudeOwnerKey
	});
	let completedOutput;
	let executionError;
	let forkResumeClaimed = false;
	let forkSuccessorObserved = false;
	let forkSuccessorPersistence;
	const observeForkSuccessor = (sessionId) => {
		if (forkSuccessorObserved || !forkResumeClaimed || !resolvedSessionId || sessionId === resolvedSessionId) return;
		forkSuccessorObserved = true;
		forkSuccessorPersistence = params.persistCliSessionForkSuccessor?.(sessionId);
		forkSuccessorPersistence?.catch(() => void 0);
	};
	const finishForkSuccessorPersistence = async () => {
		try {
			await forkSuccessorPersistence;
		} catch (error) {
			forkSuccessorObserved = false;
			throw error;
		}
	};
	const cleanupOuterResource = async (cleanup) => {
		try {
			await cleanup?.();
		} catch (error) {
			if (completedOutput?.didSendViaMessagingTool === true) {
				require_helpers.cliBackendLog.warn(`CLI outer resource cleanup failed after confirmed message delivery: ${require_errors.formatErrorMessage(error)}`);
				return;
			}
			if (executionError !== void 0) {
				require_helpers.cliBackendLog.warn(`CLI outer resource cleanup also failed after run error: ${require_errors.formatErrorMessage(error)}`);
				return;
			}
			throw error;
		}
	};
	try {
		completedOutput = await require_helpers.enqueueCliRun(queueKey, async () => {
			if (params.lifecycleGeneration) require_agent_events.assertAgentRunLifecycleGenerationCurrent(params.lifecycleGeneration);
			if (params.forkCliSessionOnResume && useResume) {
				if (!params.persistCliSessionForkSuccessor) throw new Error("CLI session fork successor persistence is unavailable");
				forkResumeClaimed = await params.claimCliSessionFork?.() === true;
				if (!forkResumeClaimed) throw new Error("CLI session fork marker is no longer available");
				await require_claude_live_session.closeClaudeLiveSessionForContext(context);
			}
			await context.preparedBackend.beforeExecution?.();
			const cliTurnStartedAt = Date.now();
			const restoreSkillEnv = params.skillsSnapshot ? require_env_overrides.applySkillEnvOverridesFromSnapshot({
				snapshot: params.skillsSnapshot,
				config: params.config
			}) : void 0;
			let gatewayCaptureKey;
			let cleanupMcpCaptureAttempt;
			let yielded = false;
			let didSendViaMessagingTool = false;
			let didDeliverSourceReplyViaMessageTool = false;
			let inFlightUnclassifiedMcpRequests = 0;
			let inFlightMessagingToolCalls = 0;
			const inFlightPreparedMessagingCalls = /* @__PURE__ */ new Set();
			const pendingMessagingCalls = /* @__PURE__ */ new Map();
			const cliLoopbackCalls = [];
			const activeCliTools = /* @__PURE__ */ new Map();
			let cliLoopbackCorrelationOverflowed = false;
			const matchesCliLoopbackCall = (toolName, toolArgs, call) => normalizeCliMessagingToolName(toolName) === call.toolName && (0, node_util.isDeepStrictEqual)(toolArgs, call.args);
			const markCliLoopbackCallsAmbiguous = (calls, activeEntries = Array.from(activeCliTools.entries()).filter(([, activeTool]) => activeTool.loopbackCall !== void 0 && calls.includes(activeTool.loopbackCall))) => {
				const groups = /* @__PURE__ */ new Set();
				for (const call of calls) if (call.ambiguityGroup) groups.add(call.ambiguityGroup);
				for (const [, activeTool] of activeEntries) if (activeTool.ambiguityGroup) groups.add(activeTool.ambiguityGroup);
				const group = groups.values().next().value ?? {
					calls: /* @__PURE__ */ new Set(),
					activeToolCallIds: /* @__PURE__ */ new Set()
				};
				for (const existing of groups) {
					if (existing === group) continue;
					for (const call of existing.calls) {
						call.ambiguityGroup = group;
						group.calls.add(call);
					}
					for (const toolCallId of existing.activeToolCallIds) {
						const activeTool = activeCliTools.get(toolCallId);
						if (activeTool) {
							activeTool.ambiguityGroup = group;
							group.activeToolCallIds.add(toolCallId);
						}
					}
					existing.calls.clear();
					existing.activeToolCallIds.clear();
				}
				for (const call of calls) {
					call.ambiguous = true;
					call.ambiguityGroup = group;
					group.calls.add(call);
				}
				for (const [toolCallId, activeTool] of activeEntries) {
					activeTool.loopbackAmbiguous = true;
					activeTool.ambiguityGroup = group;
					group.activeToolCallIds.add(toolCallId);
				}
			};
			const markCliLoopbackSignatureAmbiguous = (call) => {
				const calls = cliLoopbackCalls.filter((candidate) => matchesCliLoopbackCall(call.toolName, call.args, candidate.admitted));
				const activeEntries = Array.from(activeCliTools.entries()).filter(([, activeTool]) => matchesCliLoopbackCall(activeTool.toolName, activeTool.args, call));
				markCliLoopbackCallsAmbiguous(calls, activeEntries);
			};
			const retainCliLoopbackCall = (call) => {
				if (cliLoopbackCalls.length >= CLI_LOOPBACK_CORRELATION_MAX_CALLS) {
					cliLoopbackCorrelationOverflowed = true;
					for (const activeTool of activeCliTools.values()) if (activeTool.loopbackCall || activeTool.toolName.startsWith("mcp__")) activeTool.loopbackAmbiguous = true;
					cliLoopbackCalls.length = 0;
					return;
				}
				const retained = {
					admitted: call,
					current: call,
					ambiguous: false
				};
				cliLoopbackCalls.push(retained);
				return retained;
			};
			const bindCliLoopbackCall = (call, toolCallId, activeTool) => {
				call.boundToolCallId = toolCallId;
				activeTool.loopbackCall = call;
				activeTool.loopbackAmbiguous ||= call.ambiguous;
				if (call.ambiguityGroup) {
					activeTool.ambiguityGroup = call.ambiguityGroup;
					call.ambiguityGroup.activeToolCallIds.add(toolCallId);
				}
			};
			const removeCliLoopbackCall = (call) => {
				if (!call) return;
				const index = cliLoopbackCalls.indexOf(call);
				if (index >= 0) cliLoopbackCalls.splice(index, 1);
			};
			const retireCliLoopbackCorrelation = (toolCallId, activeTool) => {
				removeCliLoopbackCall(activeTool?.loopbackCall);
				const group = activeTool?.ambiguityGroup;
				if (!group) return;
				group.activeToolCallIds.delete(toolCallId);
				const hasUnboundCall = Array.from(group.calls).some((call) => call.boundToolCallId === void 0 && cliLoopbackCalls.includes(call));
				if (group.activeToolCallIds.size > 0 || hasUnboundCall) return;
				for (const call of group.calls) removeCliLoopbackCall(call);
				group.calls.clear();
			};
			const resolveCliLoopbackTerminalOutcome = (toolCallId) => {
				const activeTool = activeCliTools.get(toolCallId);
				if (activeTool?.loopbackAmbiguous) return { outcome: "unknown" };
				return activeTool?.loopbackCall?.outcome;
			};
			const matchingActiveCliTools = (call) => Array.from(activeCliTools.entries()).filter(([, activeTool]) => matchesCliLoopbackCall(activeTool.toolName, activeTool.args, call));
			const messagingToolSentTexts = [];
			const messagingToolSentTextKeys = /* @__PURE__ */ new Set();
			const messagingToolSentMediaUrls = [];
			const messagingToolSentMediaUrlKeys = /* @__PURE__ */ new Set();
			const messagingToolSentTargets = [];
			const messagingToolSentTargetKeys = /* @__PURE__ */ new Set();
			const messagingToolSourceReplyPayloads = [];
			const isPreparedInternalSourceReply = async (call) => {
				if (context.params.sourceReplyDeliveryMode !== "message_tool_only" || normalizeCliMessagingToolName(call.toolName) !== "message" || call.args.action !== "send" || !context.params.config) return false;
				return await require_internal_source_reply.shouldUseInternalSourceReplySink({
					cfg: context.params.config,
					action: "send",
					sessionKey: context.params.sessionKey,
					sourceReplyDeliveryMode: context.params.sourceReplyDeliveryMode,
					toolContext: {
						currentChannelProvider: context.params.messageChannel ?? context.params.messageProvider,
						currentChannelId: context.params.currentChannelId,
						currentThreadTs: context.params.currentThreadTs,
						currentMessageId: context.params.currentMessageId
					}
				}, call.args);
			};
			let runOutput;
			let runError;
			let runFailed = false;
			const recordRunError = (error) => {
				if (runFailed) return;
				runFailed = true;
				runError = error;
			};
			const withExecutionEvidence = (output) => {
				return {
					...output,
					...yielded ? { yielded: true } : {},
					...didSendViaMessagingTool ? { didSendViaMessagingTool: true } : {},
					...didDeliverSourceReplyViaMessageTool ? { didDeliverSourceReplyViaMessageTool: true } : {},
					...messagingToolSentTexts.length > 0 ? { messagingToolSentTexts: messagingToolSentTexts.slice() } : {},
					...messagingToolSentMediaUrls.length > 0 ? { messagingToolSentMediaUrls: messagingToolSentMediaUrls.slice() } : {},
					...messagingToolSentTargets.length > 0 ? { messagingToolSentTargets: messagingToolSentTargets.slice() } : {},
					...messagingToolSourceReplyPayloads.length > 0 ? { messagingToolSourceReplyPayloads: messagingToolSourceReplyPayloads.slice() } : {}
				};
			};
			let finalizeParsedTools = () => {};
			const useManagedClaudeLiveSession = require_claude_live_session.shouldUseClaudeLiveSession(context) && !params.onSuccessfulAuthBinding;
			try {
				require_helpers.cliBackendLog.info(buildCliExecLogLine({
					provider: params.provider,
					model: context.normalizedModel,
					promptChars: basePrompt.length,
					trigger: params.trigger,
					useResume,
					cliSessionId: cliSessionIdToUse,
					resolvedSessionId,
					reusableSession: context.reusableCliSession,
					hasHistoryPrompt: Boolean(context.openClawHistoryPrompt)
				}));
				const logOutputText = require_env.isTruthyEnvValue(process.env["OPERATOR_CLI_BACKEND_LOG_OUTPUT"]) || require_env.isTruthyEnvValue(process.env["OPERATOR_CLAUDE_CLI_LOG_OUTPUT"]);
				const outputMode = useResume ? backend.resumeOutput ?? backend.output : backend.output;
				const hasJsonlOutput = outputMode === "jsonl";
				const initialGatewayCaptureKey = useManagedClaudeLiveSession || nodePlacement ? void 0 : buildCliMcpCaptureKey(context);
				const mcpCaptureAttempt = nodePlacement ? {
					env: {},
					cleanup: void 0
				} : await require_claude_live_session.prepareCliBundleMcpCaptureAttempt({
					mode: context.backendResolved.bundleMcpMode,
					backend,
					env: context.preparedBackend.env,
					captureKey: initialGatewayCaptureKey
				});
				cleanupMcpCaptureAttempt = mcpCaptureAttempt.cleanup;
				const env = (() => {
					const next = require_host_env_security.sanitizeHostExecEnv({
						baseEnv: process.env,
						blockPathOverrides: true
					});
					const preservedEnv = parseCliBackendPreserveEnv(process.env[CLI_BACKEND_PRESERVE_ENV]);
					for (const key of backend.clearEnv ?? []) {
						if (preservedEnv.has(key)) continue;
						delete next[key];
					}
					const backendEnv = {
						...backend.env,
						...context.preparedBackend.env
					};
					if (Object.keys(backendEnv).length > 0) Object.assign(next, require_host_env_security.sanitizeHostExecEnv({
						baseEnv: {},
						overrides: backendEnv,
						blockPathOverrides: true
					}));
					Object.assign(next, mcpCaptureAttempt.env);
					delete next["CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST"];
					return next;
				})();
				let executionCommand = backend.command;
				let executionLeadingArgv = [];
				let executionArgs = args;
				context.runtimeOwnerFingerprint = void 0;
				context.runtimeArtifactFingerprint = void 0;
				if (params.onSuccessfulAuthBinding && !nodePlacement) {
					const executableIdentity = await require_cli_auth_epoch.resolveCliExecutableIdentity({
						command: backend.command,
						cwd: context.cwd ?? context.workspaceDir,
						env,
						...context.backendResolved.runtimeArtifact ? { runtimeArtifact: context.backendResolved.runtimeArtifact } : {}
					});
					if (!executableIdentity) throw new Error(`CLI backend ${context.backendResolved.id} executable cannot be bound to one durable absolute owner`);
					executionCommand = executableIdentity.invocation.command;
					executionLeadingArgv = executableIdentity.invocation.leadingArgv;
					executionArgs = args;
					context.runtimeArtifactFingerprint = require_cli_auth_epoch.fingerprintCliRuntimeArtifact({
						provider: params.provider,
						backendId: context.backendResolved.id,
						executableIdentity
					});
					if (!context.authBindingFingerprint) context.runtimeOwnerFingerprint = await require_cli_auth_epoch.resolveCliRuntimeOwnerFingerprint({
						provider: params.provider,
						config: params.config ?? context.contextEngineConfig,
						...context.agentDir ? { agentDir: context.agentDir } : {},
						agentId: params.agentId,
						runtimeOwnerId: context.backendResolved.id,
						...context.effectiveAuthProfileId ? { authProfileId: context.effectiveAuthProfileId } : {},
						...context.authBindingSkipsLocalCredential ? { skipLocalCredential: true } : {},
						runtimeArtifactFingerprint: context.runtimeArtifactFingerprint
					});
				}
				if (logOutputText) {
					const logArgs = buildCliLogArgs({
						args: executionArgs,
						systemPromptArg: backend.systemPromptArg,
						sessionArg: backend.sessionArg,
						modelArg: backend.modelArg,
						imageArg: backend.imageArg,
						argsPrompt
					});
					require_helpers.cliBackendLog.info(`cli argv: ${executionCommand} ${logArgs.join(" ")}`);
					require_helpers.cliBackendLog.info(`cli env auth: ${buildCliEnvAuthLog(env)}`);
					if (env.OPERATOR_MCP_TOKEN) require_helpers.cliBackendLog.info(`cli env mcp: ${buildCliEnvMcpLog(env)}`);
				}
				const runTimeoutOverrideMs = require_helpers.resolveCliRunTimeoutOverrideMs({
					config: params.config,
					lane: params.lane,
					timeoutMs: params.timeoutMs,
					runTimeoutOverrideMs: params.runTimeoutOverrideMs
				});
				const noOutputTimeoutMs = require_helpers.resolveCliNoOutputTimeoutMs({
					backend,
					timeoutMs: params.timeoutMs,
					runTimeoutOverrideMs,
					useResume,
					trigger: params.trigger
				});
				const commitMessagingToolResult = (paramsLocal) => {
					if (!require_embedded_agent_message_tool_source_reply.isDeliveredMessagingToolResult(paramsLocal)) return;
					didSendViaMessagingTool = true;
					const toolArgs = paramsLocal.args ?? {};
					const isMessagingSend = require_embedded_agent_messaging.isMessagingToolSendAction(paramsLocal.toolName, toolArgs);
					const content = isMessagingSend ? extractCliMessagingContent(toolArgs, paramsLocal.result) : {};
					if (isMessagingSend) {
						appendUniqueCliMessagingEvidence(messagingToolSentTexts, messagingToolSentTextKeys, content.text ? [content.text] : []);
						appendUniqueCliMessagingEvidence(messagingToolSentMediaUrls, messagingToolSentMediaUrlKeys, content.mediaUrls ?? []);
						if (require_embedded_agent_message_tool_source_reply.isDeliveredMessageToolOnlySourceReplyResult({
							sourceReplyDeliveryMode: context.params.sourceReplyDeliveryMode,
							toolName: paramsLocal.toolName,
							args: paramsLocal.args,
							result: paramsLocal.result,
							isError: paramsLocal.isError
						})) {
							didDeliverSourceReplyViaMessageTool = true;
							const sourceReplyPayload = require_embedded_agent_subscribe_tools.extractMessagingToolSourceReplyPayload(paramsLocal.result);
							if (sourceReplyPayload) {
								if (messagingToolSourceReplyPayloads.length >= 64) messagingToolSourceReplyPayloads.shift();
								messagingToolSourceReplyPayloads.push(sourceReplyPayload);
							}
						}
					}
					if (paramsLocal.target) {
						const targetWithContent = {
							...require_embedded_agent_subscribe_tools.extractMessagingToolSendResult(paramsLocal.target, paramsLocal.result),
							...content
						};
						const evidenceKey = buildMessagingToolSendEvidenceKey(targetWithContent);
						if (messagingToolSentTargetKeys.has(evidenceKey)) return;
						if (messagingToolSentTargets.length >= 64) {
							const removed = messagingToolSentTargets.shift();
							if (removed) messagingToolSentTargetKeys.delete(buildMessagingToolSendEvidenceKey(removed));
						}
						messagingToolSentTargets.push(targetWithContent);
						messagingToolSentTargetKeys.add(evidenceKey);
					}
				};
				const beginGatewayCapture = (captureKey) => {
					if (!captureKey) return;
					if (gatewayCaptureKey === captureKey) return;
					if (gatewayCaptureKey) throw new Error("CLI MCP capture key changed during an active attempt");
					context.preparedBackend.mcpClientGrantCapture?.activate(captureKey);
					gatewayCaptureKey = captureKey;
					const isAdmittedPotentialMessagingDelivery = (toolName) => {
						return require_embedded_agent_messaging.isMessagingTool(normalizeCliMessagingToolName(toolName));
					};
					const isPreparedMessagingDelivery = (toolName, toolArgs) => {
						return toolArgs.dryRun !== true && require_embedded_agent_messaging.isMessagingToolDeliveryAction(normalizeCliMessagingToolName(toolName), toolArgs);
					};
					require_mcp_http_loopback_runtime.beginMcpLoopbackToolCallCapture({
						captureKey: gatewayCaptureKey,
						onYield: () => {
							yielded = true;
						},
						onRequestStart: () => {
							inFlightUnclassifiedMcpRequests += 1;
						},
						onRequestClassified: () => {
							inFlightUnclassifiedMcpRequests = Math.max(0, inFlightUnclassifiedMcpRequests - 1);
						},
						onToolCallStart: (call) => {
							const retained = retainCliLoopbackCall(call);
							const candidates = matchingActiveCliTools(call);
							let matched = retained && candidates.length === 1 && !candidates[0]?.[1].loopbackCall && !candidates[0]?.[1].loopbackAmbiguous ? candidates[0] : void 0;
							if (retained && matched) bindCliLoopbackCall(retained, matched[0], matched[1]);
							else if (retained && candidates.length > 0) {
								markCliLoopbackSignatureAmbiguous(call);
								matched = candidates.find(([, activeTool]) => !activeTool.loopbackCall);
								if (matched) bindCliLoopbackCall(retained, matched[0], matched[1]);
							}
							if (isAdmittedPotentialMessagingDelivery(call.toolName)) inFlightMessagingToolCalls += 1;
							return matched?.[0];
						},
						onToolCallUpdate: ({ previous, current }) => {
							const candidates = cliLoopbackCalls.filter((candidate) => matchesCliLoopbackCall(previous.toolName, previous.args, candidate.current));
							const candidate = candidates.at(0);
							if (candidates.length === 1 && candidate && !candidate.ambiguous) candidate.current = current;
							else if (candidates.length > 0) markCliLoopbackCallsAmbiguous(candidates);
							inFlightPreparedMessagingCalls.delete(previous);
							const wasMessagingSend = isAdmittedPotentialMessagingDelivery(previous.toolName);
							const isMessagingSend = isPreparedMessagingDelivery(current.toolName, current.args);
							if (wasMessagingSend !== isMessagingSend) inFlightMessagingToolCalls = Math.max(0, inFlightMessagingToolCalls + (isMessagingSend ? 1 : -1));
							if (isMessagingSend) inFlightPreparedMessagingCalls.add(current);
						},
						onToolCallFinish: (call, { prepared }) => {
							if (prepared ? isPreparedMessagingDelivery(call.toolName, call.args) : isAdmittedPotentialMessagingDelivery(call.toolName)) inFlightMessagingToolCalls = Math.max(0, inFlightMessagingToolCalls - 1);
							inFlightPreparedMessagingCalls.delete(call);
						},
						onToolCallResult: (call) => {
							const terminalOutcome = call.outcome === "blocked" ? {
								outcome: call.outcome,
								deniedReason: call.deniedReason
							} : { outcome: call.outcome };
							const correlated = call.correlationId ? cliLoopbackCalls.find((candidate) => candidate.boundToolCallId === call.correlationId) : void 0;
							const candidates = correlated ? [correlated] : cliLoopbackCalls.filter((candidate) => matchesCliLoopbackCall(call.toolName, call.args, candidate.current));
							if (candidates.length === 1 && candidates[0]) candidates[0].outcome = terminalOutcome;
							else if (candidates.length > 1) markCliLoopbackCallsAmbiguous(candidates);
							const normalizedToolName = normalizeCliMessagingToolName(call.toolName);
							if (!require_embedded_agent_messaging.isMessagingToolDeliveryAction(normalizedToolName, call.args)) return;
							commitMessagingToolResult({
								toolName: normalizedToolName,
								target: extractCliMessagingTarget(context, normalizedToolName, call.args),
								args: call.args,
								result: "result" in call ? call.result : void 0,
								isError: call.outcome !== "completed"
							});
						}
					});
				};
				beginGatewayCapture(initialGatewayCaptureKey);
				let observedCliActivity = false;
				const emitLiveEvents = params.executionMode !== "side-question";
				const activeParsedTools = /* @__PURE__ */ new Map();
				const emitCliToolUseStart = (event) => {
					observedCliActivity = true;
					if (event.kind !== "server_tool_use") {
						const activeTool = {
							toolName: event.name,
							args: event.args,
							loopbackAmbiguous: cliLoopbackCorrelationOverflowed && event.name.startsWith("mcp__")
						};
						activeCliTools.set(event.toolCallId, activeTool);
						const admittedCall = {
							toolName: normalizeCliMessagingToolName(event.name),
							args: event.args
						};
						const pendingCandidates = cliLoopbackCalls.filter((candidate) => candidate.boundToolCallId === void 0 && matchesCliLoopbackCall(event.name, event.args, candidate.admitted));
						const hasAssociatedPeer = matchingActiveCliTools(admittedCall).some(([toolCallId, peer]) => toolCallId !== event.toolCallId && (peer.loopbackCall !== void 0 || peer.loopbackAmbiguous));
						const pending = pendingCandidates[0];
						if (hasAssociatedPeer || pendingCandidates.length > 1 || pending?.ambiguous) {
							markCliLoopbackSignatureAmbiguous(admittedCall);
							if (pending) bindCliLoopbackCall(pending, event.toolCallId, activeTool);
						} else if (pendingCandidates.length === 1 && pending) bindCliLoopbackCall(pending, event.toolCallId, activeTool);
					}
					const toolName = normalizeCliMessagingToolName(event.name);
					if (event.kind !== "server_tool_use" && !gatewayCaptureKey && event.args.dryRun !== true && require_embedded_agent_messaging.isMessagingToolDeliveryAction(toolName, event.args)) {
						if (pendingMessagingCalls.size >= 64) {
							const oldestToolCallId = pendingMessagingCalls.keys().next().value;
							if (oldestToolCallId !== void 0) {
								pendingMessagingCalls.delete(oldestToolCallId);
								didSendViaMessagingTool = true;
							}
						}
						pendingMessagingCalls.set(event.toolCallId, {
							toolName,
							args: event.args,
							target: extractCliMessagingTarget(context, toolName, event.args)
						});
					}
					if (!emitLiveEvents) return;
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "tool",
						data: {
							phase: "start",
							name: event.name,
							toolCallId: event.toolCallId,
							args: require_embedded_agent_subscribe_tools.sanitizeToolArgs(event.args)
						}
					});
				};
				const emitCliToolResult = (event) => {
					observedCliActivity = true;
					const activeTool = activeCliTools.get(event.toolCallId);
					activeCliTools.delete(event.toolCallId);
					retireCliLoopbackCorrelation(event.toolCallId, activeTool);
					const pending = pendingMessagingCalls.get(event.toolCallId);
					if (pending) {
						pendingMessagingCalls.delete(event.toolCallId);
						commitMessagingToolResult({
							toolName: pending.toolName,
							target: pending.target,
							args: pending.args,
							result: event.result,
							isError: event.isError
						});
					}
					if (!emitLiveEvents) return;
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "tool",
						data: {
							phase: "result",
							name: event.name,
							toolCallId: event.toolCallId,
							isError: event.isError,
							result: require_embedded_agent_subscribe_tools.sanitizeToolResult(event.result)
						}
					});
				};
				const emitParsedToolUseStart = (event) => {
					const startedAt = Date.now();
					activeParsedTools.set(event.toolCallId, {
						startedAt,
						toolName: event.name,
						kind: event.kind
					});
					require_diagnostic_events.emitTrustedDiagnosticEvent({
						type: "tool.execution.started",
						runId: params.runId,
						sessionId: params.sessionId,
						...params.sessionKey ? { sessionKey: params.sessionKey } : {},
						...params.agentId ? { agentId: params.agentId } : {},
						toolName: event.name,
						toolSource: event.name.startsWith("mcp__") ? "mcp" : "core",
						toolOwner: "cli-runner",
						toolCallId: event.toolCallId
					});
					emitCliToolUseStart(event);
				};
				const emitParsedToolTerminal = (event) => {
					const activeTool = activeParsedTools.get(event.toolCallId);
					activeParsedTools.delete(event.toolCallId);
					const trustedOutcome = resolveCliLoopbackTerminalOutcome(event.toolCallId);
					const toolName = activeTool?.toolName ?? event.name;
					const now = Date.now();
					const terminalReason = (trustedOutcome && trustedOutcome.outcome !== "blocked" && trustedOutcome.outcome !== "completed" && trustedOutcome.outcome !== "unknown" ? trustedOutcome.outcome : void 0) ?? require_run_termination.resolveCliToolTerminalReason({
						error: event.incomplete ? runError : void 0,
						abortSignal: params.abortSignal
					});
					const useEnclosingTerminalReason = event.incomplete && runFailed && activeTool !== void 0 && activeTool.kind !== "server_tool_use";
					const diagnosticBase = {
						runId: params.runId,
						sessionId: params.sessionId,
						...params.sessionKey ? { sessionKey: params.sessionKey } : {},
						...params.agentId ? { agentId: params.agentId } : {},
						toolName,
						toolSource: toolName.startsWith("mcp__") ? "mcp" : "core",
						toolOwner: "cli-runner",
						toolCallId: event.toolCallId,
						durationMs: Math.max(0, now - (activeTool?.startedAt ?? now))
					};
					if (trustedOutcome?.outcome === "unknown" && !useEnclosingTerminalReason) {
						require_diagnostic_events.emitTrustedDiagnosticEvent({
							type: "tool.execution.error",
							...diagnosticBase,
							errorCategory: "cli_tool_ambiguous",
							errorCode: "tool_outcome_unknown"
						});
						return;
					}
					if (event.incomplete && activeTool?.kind === "server_tool_use" && trustedOutcome === void 0) {
						require_diagnostic_events.emitTrustedDiagnosticEvent({
							type: "tool.execution.error",
							...diagnosticBase,
							errorCategory: "cli_tool_ambiguous",
							errorCode: "tool_outcome_unknown"
						});
						return;
					}
					const trustedFailure = trustedOutcome !== void 0 && trustedOutcome.outcome !== "completed";
					require_diagnostic_events.emitTrustedDiagnosticEvent(trustedOutcome?.outcome === "blocked" ? {
						type: "tool.execution.blocked",
						...diagnosticBase,
						deniedReason: trustedOutcome.deniedReason,
						reason: "blocked by before-tool policy"
					} : trustedFailure || trustedOutcome === void 0 && event.isError ? {
						type: "tool.execution.error",
						...diagnosticBase,
						errorCategory: terminalReason === "cancelled" ? "aborted" : event.incomplete && (!trustedOutcome || useEnclosingTerminalReason) ? "cli_tool_incomplete" : "cli_tool",
						terminalReason
					} : {
						type: "tool.execution.completed",
						...diagnosticBase
					});
				};
				const emitParsedToolResult = (event) => {
					emitParsedToolTerminal(event);
					emitCliToolResult(event);
				};
				finalizeParsedTools = () => {
					for (const [toolCallId, activeTool] of Array.from(activeParsedTools)) emitParsedToolTerminal({
						toolCallId,
						name: activeTool.toolName,
						isError: true,
						incomplete: true
					});
				};
				let commentaryCounter = 0;
				const emitCliCommentaryText = (text) => {
					if (!emitLiveEvents) return;
					commentaryCounter += 1;
					const transformedText = require_text_transforms_runtime.applyPluginTextReplacements(text, context.backendResolved.textTransforms?.output);
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "item",
						data: {
							kind: "preamble",
							itemId: `commentary-${params.runId}-${commentaryCounter}`,
							phase: "update",
							title: "commentary",
							status: "running",
							progressText: transformedText
						}
					});
				};
				const emitCliAssistantDelta = ({ text, delta }) => {
					if (text || delta) observedCliActivity = true;
					if (!emitLiveEvents) return;
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "assistant",
						data: {
							text: require_text_transforms_runtime.applyPluginTextReplacements(text, context.backendResolved.textTransforms?.output),
							delta: require_text_transforms_runtime.applyPluginTextReplacements(delta, context.backendResolved.textTransforms?.output)
						}
					});
				};
				const emitCliThinkingDelta = ({ text, delta, isReasoningSnapshot }) => {
					if (text || delta) observedCliActivity = true;
					if (!emitLiveEvents) return;
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "thinking",
						data: {
							text,
							delta,
							...isReasoningSnapshot ? { isReasoningSnapshot } : {}
						}
					});
				};
				const emitCliThinkingProgress = ({ progressTokens }) => {
					observedCliActivity = true;
					if (!emitLiveEvents) return;
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "thinking",
						data: { progressTokens }
					});
				};
				const emitCliPlanUpdate = ({ steps }) => {
					observedCliActivity = true;
					if (!emitLiveEvents) return;
					require_agent_events.emitAgentEvent({
						runId: params.runId,
						stream: "plan",
						data: {
							phase: "update",
							title: "Plan updated",
							source: "codex-exec",
							steps
						}
					});
				};
				if (useManagedClaudeLiveSession) {
					if (!hasJsonlOutput) throw new Error("Claude live session requires JSONL streaming parser");
					params.onExecutionPhase?.({
						phase: "process_spawned",
						provider: params.provider,
						model: context.modelId,
						backend: context.backendResolved.id
					});
					fallbackClaudeSkillsPluginCleanupOwned = fallbackClaudeSkillsPlugin !== void 0;
					const liveResult = await require_claude_live_session.runClaudeLiveSessionTurn({
						context,
						args: executionArgs,
						executableCommand: executionCommand,
						executableLeadingArgv: executionLeadingArgv,
						env,
						prompt,
						useResume,
						forceNewSession: cliSessionIdToUse === void 0 && context.openClawHistoryPrompt !== void 0,
						requiredSessionGeneration: cliSessionIdToUse ? context.requiredClaudeLiveSessionGeneration : void 0,
						noOutputTimeoutMs,
						getProcessSupervisor: executeDeps.getProcessSupervisor,
						onAssistantDelta: emitCliAssistantDelta,
						onThinkingDelta: emitCliThinkingDelta,
						onThinkingProgress: emitCliThinkingProgress,
						onToolUseStart: emitCliToolUseStart,
						onToolResult: emitCliToolResult,
						resolveToolResultTerminalOutcome: (event) => {
							const outcome = resolveCliLoopbackTerminalOutcome(event.toolCallId);
							return outcome?.outcome === "completed" ? void 0 : outcome;
						},
						onCommentaryText: emitLiveEvents && context.params.emitCommentaryText ? emitCliCommentaryText : void 0,
						onMcpCaptureReady: beginGatewayCapture,
						cleanup: async () => {
							await fallbackClaudeSkillsPlugin?.cleanup();
						},
						onSessionId: (sessionId) => {
							observeForkSuccessor(sessionId);
						}
					});
					const rawText = liveResult.output.text;
					runOutput = {
						...liveResult.output,
						rawText,
						finalPromptText: prompt,
						text: require_text_transforms_runtime.applyPluginTextReplacements(rawText, context.backendResolved.textTransforms?.output)
					};
				} else {
					const streamingParser = hasJsonlOutput ? require_claude_live_session.createCliJsonlStreamingParser({
						backend,
						providerId: context.backendResolved.id,
						onAssistantDelta: emitCliAssistantDelta,
						onThinkingDelta: emitCliThinkingDelta,
						onThinkingProgress: emitCliThinkingProgress,
						onPlanUpdate: emitCliPlanUpdate,
						onToolUseStart: emitParsedToolUseStart,
						onToolResult: emitParsedToolResult,
						onCommentaryText: emitLiveEvents && context.params.emitCommentaryText ? emitCliCommentaryText : void 0,
						onSessionId: (sessionId) => {
							observeForkSuccessor(sessionId);
						}
					}) : null;
					let stdoutTail = Buffer.alloc(0);
					let stdoutParseBuffer = Buffer.alloc(0);
					let stdoutBytes = 0;
					const stdoutHash = node_crypto.default.createHash("sha256");
					let stdoutParseExceeded = false;
					let stderrTail = Buffer.alloc(0);
					let stderrParseBuffer = Buffer.alloc(0);
					let stderrBytes = 0;
					const stderrHash = node_crypto.default.createHash("sha256");
					let stderrParseExceeded = false;
					const consumeStdout = (chunk) => {
						stdoutBytes += Buffer.byteLength(chunk);
						stdoutHash.update(chunk);
						stdoutTail = appendCliOutputTail(stdoutTail, chunk);
						if (!stdoutParseExceeded) {
							const nextStdoutParse = appendCliOutputParseBuffer(stdoutParseBuffer, chunk);
							stdoutParseBuffer = nextStdoutParse.buffer;
							stdoutParseExceeded = nextStdoutParse.exceeded;
						}
						streamingParser?.push(chunk);
					};
					const consumeStderr = (chunk) => {
						stderrBytes += Buffer.byteLength(chunk);
						stderrHash.update(chunk);
						stderrTail = appendCliOutputTail(stderrTail, chunk);
						if (!stderrParseExceeded) {
							const nextStderrParse = appendCliOutputParseBuffer(stderrParseBuffer, chunk);
							stderrParseBuffer = nextStderrParse.buffer;
							stderrParseExceeded = nextStderrParse.exceeded;
						}
					};
					params.onExecutionPhase?.({
						phase: "process_spawned",
						provider: params.provider,
						model: context.modelId,
						backend: context.backendResolved.id
					});
					let managedRunPid;
					let nodeRunAbortSignal;
					let nodeRunTruncated = false;
					let result;
					if (nodePlacement) {
						const nodeRun = await executeNodeClaudeRun({
							context,
							nodePlacement,
							executionArgs,
							stdinPayload,
							...nodeSystemPrompt !== void 0 ? { nodeSystemPrompt } : {},
							noOutputTimeoutMs,
							consumeStdout,
							consumeStderr,
							deps: executeDeps
						});
						result = nodeRun.result;
						nodeRunAbortSignal = nodeRun.nodeRunAbortSignal;
						nodeRunTruncated = nodeRun.nodeRunTruncated;
					} else {
						const supervisor = executeDeps.getProcessSupervisor();
						const scopeKey = require_helpers.buildCliSupervisorScopeKey({
							backend,
							backendId: context.backendResolved.id,
							cliSessionId: useResume ? resolvedSessionId : void 0
						});
						const managedRun = await supervisor.spawn({
							sessionId: params.sessionId,
							backendId: context.backendResolved.id,
							scopeKey,
							replaceExistingScope: Boolean(useResume && scopeKey),
							mode: "child",
							argv: [
								executionCommand,
								...executionLeadingArgv,
								...executionArgs
							],
							timeoutMs: params.timeoutMs,
							noOutputTimeoutMs,
							cwd: context.cwd ?? context.workspaceDir,
							env,
							input: stdinPayload,
							captureOutput: false,
							onStdout: consumeStdout,
							onStderr: consumeStderr
						});
						managedRunPid = managedRun.pid;
						let replyBackendCompleted = false;
						const replyBackendHandle = params.replyOperation ? {
							kind: "cli",
							cancel: () => {
								managedRun.cancel("manual-cancel");
							},
							isStreaming: () => !replyBackendCompleted
						} : void 0;
						if (replyBackendHandle) params.replyOperation?.attachBackend(replyBackendHandle);
						const abortManagedRun = () => {
							managedRun.cancel("manual-cancel");
						};
						params.abortSignal?.addEventListener("abort", abortManagedRun, { once: true });
						if (params.abortSignal?.aborted) abortManagedRun();
						try {
							result = await managedRun.wait();
						} finally {
							replyBackendCompleted = true;
							if (replyBackendHandle) params.replyOperation?.detachBackend(replyBackendHandle);
							params.abortSignal?.removeEventListener("abort", abortManagedRun);
						}
					}
					streamingParser?.finish();
					if ((params.abortSignal?.aborted || nodeRunAbortSignal?.aborted) && result.reason === "manual-cancel") throw createCliAbortError();
					const streamingParserErrorText = outputMode === "jsonl" ? streamingParser?.getErrorText() ?? null : null;
					if (streamingParserErrorText) throw new require_failover_error.FailoverError(streamingParserErrorText, {
						reason: "format",
						provider: params.provider,
						model: context.modelId,
						sessionId: params.sessionId,
						lane: params.lane,
						status: require_failover_error.resolveFailoverStatus("format")
					});
					if (nodeRunTruncated && result.exitCode === 0 && !result.timedOut && !streamingParser?.getOutput()) throw new require_failover_error.FailoverError("paired node truncated the Claude CLI stream before the terminal result; refusing to accept partial output.", {
						reason: "format",
						provider: params.provider,
						model: context.modelId,
						sessionId: params.sessionId,
						lane: params.lane,
						status: require_failover_error.resolveFailoverStatus("format")
					});
					const stdout = stdoutParseBuffer.toString("utf8").trim();
					const stdoutDiagnostic = stdoutTail.toString("utf8").trim();
					const stderr = stderrParseBuffer.toString("utf8").trim();
					const stderrDiagnostic = stderrTail.toString("utf8").trim();
					const processDiagnostics = {
						backendId: context.backendResolved.id,
						processReason: result.reason,
						exitCode: result.exitCode,
						exitSignal: result.exitSignal,
						durationMs: result.durationMs,
						stdoutBytes,
						stdoutHash: stdoutHash.digest("hex").slice(0, 12),
						stderrBytes,
						stderrHash: stderrHash.digest("hex").slice(0, 12),
						useResume
					};
					if (logOutputText) {
						if (stdoutDiagnostic) require_helpers.cliBackendLog.info(`cli stdout:\n${stdoutDiagnostic}`);
						if (stderrDiagnostic) require_helpers.cliBackendLog.info(`cli stderr:\n${stderrDiagnostic}`);
					}
					if (require_globals.shouldLogVerbose()) {
						if (stdoutDiagnostic) require_helpers.cliBackendLog.debug(`cli stdout:\n${stdoutDiagnostic}`);
						if (stderrDiagnostic) require_helpers.cliBackendLog.debug(`cli stderr:\n${stderrDiagnostic}`);
					}
					const streamedJsonlOutput = outputMode === "jsonl" ? streamingParser?.getOutput() ?? null : null;
					const parsedStructuredOutput = streamedJsonlOutput ?? (outputMode === "json" && !stdoutParseExceeded ? require_claude_live_session.parseCliOutput({
						raw: stdout,
						backend,
						providerId: context.backendResolved.id,
						outputMode,
						fallbackSessionId: resolvedSessionId
					}) : null);
					if (parsedStructuredOutput?.terminalFailure) {
						const terminalError = require_claude_live_session.createCliOutputFailoverError({
							output: parsedStructuredOutput,
							provider: params.provider,
							model: context.modelId,
							runId: params.runId,
							sessionId: params.sessionId,
							lane: params.lane
						});
						if (terminalError) throw terminalError;
					}
					if (result.exitCode !== 0 || result.reason !== "exit") {
						if (result.reason === "no-output-timeout" || result.noOutputTimedOut) {
							const timeoutReason = `CLI produced no output for ${Math.round(noOutputTimeoutMs / 1e3)}s and was terminated.`;
							require_helpers.cliBackendLog.warn(`cli watchdog timeout: provider=${params.provider} model=${context.modelId} session=${resolvedSessionId ?? params.sessionId} noOutputTimeoutMs=${noOutputTimeoutMs} pid=${managedRunPid ?? "node"}`);
							const retryableNoOutputTimeout = !observedCliActivity && stdoutDiagnostic.length === 0 && stderrDiagnostic.length === 0;
							const deferWatchdogNoticeForFreshRetry = retryableNoOutputTimeout && Boolean(cliSessionIdToUse) && Boolean(resolvedSessionId) && Boolean(context.openClawHistoryPrompt) && Boolean(params.sessionKey) && params.timeoutMs - (Date.now() - context.started) > 0;
							if (params.sessionKey && emitLiveEvents && !deferWatchdogNoticeForFreshRetry) {
								const stallNotice = [
									`CLI agent (${params.provider}) produced no output for ${Math.round(noOutputTimeoutMs / 1e3)}s and was terminated.`,
									"It may have been waiting for interactive input or an approval prompt.",
									...nodePlacement ? ["Check the node's Claude permission settings for pending prompts."] : ["For Claude Code, prefer --permission-mode bypassPermissions --print."]
								].join(" ");
								const eventRouting = require_event_session_routing.resolveEventSessionRoutingPolicy({
									cfg: params.config,
									sessionKey: params.sessionKey,
									channel: params.messageProvider,
									accountId: params.agentAccountId
								});
								executeDeps.enqueueSystemEvent(stallNotice, { sessionKey: require_event_session_routing.resolveEventSessionKeyForPolicy(params.sessionKey, eventRouting) });
								executeDeps.requestHeartbeat(require_event_session_routing.scopedHeartbeatWakeOptionsForPolicy(params.sessionKey, {
									source: "cli-watchdog",
									intent: "event",
									reason: "cli:watchdog:stall"
								}, eventRouting));
							}
							throw new require_failover_error.FailoverError(timeoutReason, {
								reason: "timeout",
								provider: params.provider,
								model: context.modelId,
								sessionId: params.sessionId,
								lane: params.lane,
								status: require_failover_error.resolveFailoverStatus("timeout"),
								code: retryableNoOutputTimeout ? "cli_no_output_timeout" : void 0
							});
						}
						if (result.reason === "overall-timeout") throw new require_failover_error.FailoverError(`CLI exceeded timeout (${Math.round(params.timeoutMs / 1e3)}s) and was terminated.`, {
							reason: "timeout",
							provider: params.provider,
							model: context.modelId,
							sessionId: params.sessionId,
							lane: params.lane,
							status: require_failover_error.resolveFailoverStatus("timeout"),
							code: "cli_overall_timeout"
						});
						const errorCandidates = [
							stderr,
							stdout,
							stderrDiagnostic,
							stdoutDiagnostic
						].filter((candidate) => candidate.length > 0);
						const structuredError = errorCandidates.map((candidate) => require_claude_live_session.extractCliErrorMessage(candidate)).find(Boolean) ?? null;
						let classifiedErrorText = structuredError;
						let reason = structuredError ? require_errors$1.classifyFailoverReason(structuredError, { provider: params.provider }) : null;
						if (!reason) for (const candidate of errorCandidates) {
							reason = require_errors$1.classifyFailoverReason(candidate, { provider: params.provider });
							if (reason) {
								classifiedErrorText = candidate;
								break;
							}
						}
						const err = structuredError || classifiedErrorText || errorCandidates[0] || "CLI failed.";
						reason = reason ?? "unknown";
						const status = require_failover_error.resolveFailoverStatus(reason);
						const retryCode = reason === "context_overflow" ? "cli_context_overflow" : reason === "unknown" && result.reason === "exit" && errorCandidates.length === 0 && !observedCliActivity ? "cli_unknown_empty_failure" : void 0;
						throw new require_failover_error.FailoverError(err, {
							reason,
							provider: params.provider,
							model: context.modelId,
							sessionId: params.sessionId,
							lane: params.lane,
							status,
							code: retryCode
						});
					}
					if (stdoutParseExceeded && !streamedJsonlOutput) throw new require_failover_error.FailoverError(`CLI stdout exceeded ${CLI_RUNNER_OUTPUT_PARSE_BYTES} bytes; refusing to parse truncated output.`, {
						reason: "format",
						provider: params.provider,
						model: context.modelId,
						sessionId: params.sessionId,
						lane: params.lane,
						status: require_failover_error.resolveFailoverStatus("format")
					});
					const parsed = parsedStructuredOutput ?? require_claude_live_session.parseCliOutput({
						raw: stdout,
						backend,
						providerId: context.backendResolved.id,
						outputMode,
						fallbackSessionId: resolvedSessionId
					});
					const parsedError = require_claude_live_session.createCliOutputFailoverError({
						output: parsed,
						provider: params.provider,
						model: context.modelId,
						runId: params.runId,
						sessionId: params.sessionId,
						lane: params.lane
					});
					if (parsedError) throw parsedError;
					const rawText = parsed.text;
					require_helpers.cliBackendLog.info(`cli turn: provider=${params.provider} model=${context.modelId} durationMs=${Date.now() - cliTurnStartedAt} ${require_helpers.formatCliBackendOutputDigest(rawText)}`);
					runOutput = {
						...parsed,
						diagnostics: {
							...parsed.diagnostics,
							process: processDiagnostics
						},
						rawText,
						finalPromptText: prompt,
						text: require_text_transforms_runtime.applyPluginTextReplacements(rawText, context.backendResolved.textTransforms?.output)
					};
				}
			} catch (error) {
				recordRunError(error);
			} finally {
				try {
					if (!gatewayCaptureKey && pendingMessagingCalls.size > 0) {
						const unresolvedJsonlMessagingCalls = Array.from(pendingMessagingCalls.values());
						if ((await Promise.all(unresolvedJsonlMessagingCalls.map(isPreparedInternalSourceReply))).some((isInternalSourceReply) => !isInternalSourceReply)) {
							didSendViaMessagingTool = true;
							recordRunError(/* @__PURE__ */ new Error("CLI JSONL message tool call remained unresolved after exit"));
						} else recordRunError(/* @__PURE__ */ new Error("CLI JSONL source reply call remained unresolved after exit"));
					}
					if (gatewayCaptureKey) {
						if (!await require_mcp_http_loopback_runtime.waitForMcpLoopbackToolCallCaptureIdle(gatewayCaptureKey, {
							timeoutMs: CLI_MCP_DELIVERY_DRAIN_GRACE_MS,
							admissionGraceMs: CLI_MCP_REQUEST_ADMISSION_GRACE_MS
						})) {
							if (useManagedClaudeLiveSession) await require_claude_live_session.rotateClaudeLiveMcpCaptureKeyForContext(context);
							const unresolvedPreparedMessagingCalls = Array.from(inFlightPreparedMessagingCalls);
							const internalSourceReplyCount = (await Promise.all(unresolvedPreparedMessagingCalls.map(isPreparedInternalSourceReply))).filter(Boolean).length;
							if (inFlightUnclassifiedMcpRequests > 0 || inFlightMessagingToolCalls > internalSourceReplyCount) {
								didSendViaMessagingTool = true;
								recordRunError(/* @__PURE__ */ new Error("CLI message tool call remained in flight after exit"));
							} else if (inFlightMessagingToolCalls > 0) recordRunError(/* @__PURE__ */ new Error("CLI source reply call remained in flight after exit"));
						}
					}
				} catch (error) {
					if (pendingMessagingCalls.size > 0 || inFlightUnclassifiedMcpRequests > 0 || inFlightMessagingToolCalls > 0) didSendViaMessagingTool = true;
					recordRunError(error);
				} finally {
					try {
						finalizeParsedTools();
					} finally {
						if (gatewayCaptureKey) try {
							context.preparedBackend.mcpClientGrantCapture?.deactivate(gatewayCaptureKey);
						} finally {
							require_mcp_http_loopback_runtime.clearMcpLoopbackToolCallCapture(gatewayCaptureKey);
						}
					}
				}
				try {
					await cleanupMcpCaptureAttempt?.();
				} catch (error) {
					recordRunError(error);
				}
				try {
					restoreSkillEnv?.();
				} catch (error) {
					recordRunError(error);
				}
			}
			if (runFailed) throw require_delivery_evidence.attachCliMessagingDeliveryEvidence(runError, {
				didSendViaMessagingTool,
				didDeliverSourceReplyViaMessageTool,
				messagingToolSentTexts,
				messagingToolSentMediaUrls,
				messagingToolSentTargets,
				messagingToolSourceReplyPayloads
			});
			if (!runOutput) throw new Error("CLI run completed without output");
			return withExecutionEvidence(runOutput);
		});
		if (completedOutput.sessionId) observeForkSuccessor(completedOutput.sessionId);
		await finishForkSuccessorPersistence();
		if (forkResumeClaimed && !forkSuccessorObserved) {
			await params.restoreCliSessionFork?.();
			forkResumeClaimed = false;
			throw new Error("forked CLI session did not report a successor session id");
		}
		return completedOutput;
	} catch (error) {
		executionError = error;
		let failure = error;
		try {
			await finishForkSuccessorPersistence();
		} catch (persistenceError) {
			failure = new AggregateError([error, persistenceError], "CLI turn failed and its fork successor could not be persisted");
		}
		if (forkResumeClaimed && !forkSuccessorObserved) await params.restoreCliSessionFork?.();
		throw failure;
	} finally {
		if (!fallbackClaudeSkillsPluginCleanupOwned) await cleanupOuterResource(fallbackClaudeSkillsPlugin?.cleanup);
		if (systemPromptFile) await cleanupOuterResource(systemPromptFile.cleanup);
		if (cleanupImages) await cleanupOuterResource(cleanupImages);
	}
}
//#endregion
//#region src/agents/cli-runner/execute.runtime.ts
var execute_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ executePreparedCliRun: () => executePreparedCliRun });
//#endregion
Object.defineProperty(exports, "executePreparedCliRun", {
	enumerable: true,
	get: function() {
		return executePreparedCliRun;
	}
});
Object.defineProperty(exports, "execute_runtime_exports", {
	enumerable: true,
	get: function() {
		return execute_runtime_exports;
	}
});
