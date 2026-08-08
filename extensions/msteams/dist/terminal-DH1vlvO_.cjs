require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
require("./errors-BqS4bzom.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_node_commands = require("./node-commands-DQ3xnEUk.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_terminal_upload_constants = require("./terminal-upload-constants-BNmT6J2I.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_node_invoke_plugin_policy = require("./node-invoke-plugin-policy-DabO7jAG.cjs");
const require_session_catalog = require("./session-catalog-BfN_zCEC.cjs");
const require_launch = require("./launch-B5we2Ctg.cjs");
const require_output_ring = require("./output-ring-CcdBFajR.cjs");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/gateway/terminal/buffer-text.ts
const C0_EXCEPT_TAB_CR_LF = `${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}`;
const C1 = `${String.fromCharCode(128)}-${String.fromCharCode(159)}`;
const CONTROL_BYTES_REGEX = new RegExp(`[${C0_EXCEPT_TAB_CR_LF}${C1}]`, "g");
/**
* Approximates what a terminal would show without running a VT emulator:
* strips ANSI sequences, collapses carriage-return overwrites (progress bars
* emit "10%\r20%\r30%" — keep the last write per line), and drops remaining
* C0/C1 control bytes. Cursor-movement layouts (vim, htop) will not reconstruct
* faithfully; a true screen snapshot is a tracked follow-up.
*/
function renderTerminalBufferText(raw) {
	return require_ansi.stripAnsiSequences(raw).split("\n").map((line) => {
		const segments = line.split("\r");
		const last = segments[segments.length - 1];
		return ((last === "" && segments.length > 1 ? segments[segments.length - 2] : last) ?? "").replace(CONTROL_BYTES_REGEX, "");
	}).join("\n");
}
//#endregion
//#region src/gateway/terminal/node-relay.ts
const DATA_INPUT_CHUNK_BYTES = 2 * 1024;
const MAX_PENDING_DATA_CHARS = 512 * 1024;
function parseExit(result) {
	if (!result.ok) return { error: `${result.error?.code ?? "NODE_INVOKE_FAILED"}: ${result.error?.message ?? "node terminal invoke failed"}` };
	try {
		const raw = result.payloadJSON ?? (result.payload === void 0 ? void 0 : JSON.stringify(result.payload));
		if (!raw) return { exitCode: 0 };
		const value = JSON.parse(raw);
		if (!value || typeof value !== "object" || Array.isArray(value)) return { exitCode: 0 };
		const record = value;
		return {
			...typeof record.exitCode === "number" ? { exitCode: record.exitCode } : {},
			...typeof record.signal === "number" ? { signal: record.signal } : {}
		};
	} catch {
		return { error: "node terminal returned an invalid exit result" };
	}
}
function splitInput(data) {
	const chunks = [];
	let start = 0;
	let bytes = 0;
	for (let index = 0; index < data.length; index += 1) {
		const codePoint = data.codePointAt(index);
		if (codePoint === void 0) break;
		const char = String.fromCodePoint(codePoint);
		const size = Buffer.byteLength(char, "utf8");
		if (bytes > 0 && bytes + size > DATA_INPUT_CHUNK_BYTES) {
			chunks.push(data.slice(start, index));
			start = index;
			bytes = 0;
		}
		bytes += size;
		if (char.length === 2) index += 1;
	}
	if (start < data.length) chunks.push(data.slice(start));
	return chunks;
}
async function createNodeRelayBackend(params) {
	let invokeId;
	let dataCallback;
	let exitCallback;
	const pendingData = new require_output_ring.BoundedBuffer(MAX_PENDING_DATA_CHARS, {
		mode: "drop-oldest",
		fit: require_output_ring.surrogateSafeTail
	}, (chunk) => chunk.length);
	let pendingExit;
	const abort = new AbortController();
	const result = params.registry.invoke({
		nodeId: params.nodeId,
		expectedConnId: params.expectedConnId,
		command: params.command,
		params: params.params,
		timeoutMs: 0,
		idleTimeoutMs: require_node_commands.NODE_DUPLEX_INVOKE_IDLE_TIMEOUT_MS,
		signal: abort.signal,
		onInvokeId: (id) => {
			invokeId = id;
		},
		onProgress: (chunk) => {
			if (!chunk) return;
			if (dataCallback) dataCallback(chunk);
			else pendingData.push(chunk);
		}
	}).then(parseExit).catch((error) => ({ error: error instanceof Error ? error.message : String(error) })).then((exit) => {
		if (exitCallback) exitCallback(exit);
		else pendingExit = exit;
		return exit;
	});
	await Promise.resolve();
	if (!invokeId) {
		const exit = await result;
		throw new Error(exit.error ?? "failed to start node terminal invoke");
	}
	const activeInvokeId = invokeId;
	const send = (payload) => params.registry.sendInvokeInput(activeInvokeId, payload);
	return {
		write(data) {
			for (const chunk of splitInput(data)) send({
				kind: "data",
				data: chunk
			});
		},
		resize(cols, rows) {
			send({
				kind: "resize",
				cols,
				rows
			});
		},
		pause() {},
		resume() {},
		kill() {
			abort.abort();
		},
		onData(callback) {
			dataCallback = callback;
			for (const chunk of pendingData.drain()) callback(chunk);
		},
		onExit(callback) {
			exitCallback = callback;
			if (pendingExit) {
				const exit = pendingExit;
				pendingExit = void 0;
				callback(exit);
			}
		}
	};
}
//#endregion
//#region src/gateway/server-methods/terminal-open-plan.ts
function authorizeTerminalNodeCommand(context, nodeId, command) {
	const node = context.nodeRegistry.get(nodeId);
	if (!node) return {
		ok: false,
		message: "terminal node is not connected"
	};
	if (!node.commands.includes(command)) return {
		ok: false,
		message: "terminal node command is not available"
	};
	const allowlist = require_node_command_policy.resolveNodeCommandAllowlist(context.getRuntimeConfig(), {
		...node,
		approvedCommands: node.commands
	});
	const allowed = require_node_command_policy.isNodeCommandAllowed({
		command,
		declaredCommands: node.commands,
		allowlist
	});
	return allowed.ok ? {
		ok: true,
		node
	} : {
		ok: false,
		message: allowed.reason
	};
}
function authorizeCatalogTerminalNode(context, plan) {
	return authorizeTerminalNodeCommand(context, plan.nodeId, plan.command);
}
function resolveTerminalOpenSpawnPlan(launchPlan, catalogPlan) {
	if (!catalogPlan) return require_launch.resolveTerminalSpawnPlan(launchPlan);
	if (catalogPlan.kind === "local") return require_launch.resolveTerminalSpawnPlan({
		...launchPlan,
		initialCommand: catalogPlan.argv,
		cwdOverride: catalogPlan.cwd
	});
	return {
		agentId: launchPlan.agentId,
		cwd: catalogPlan.cwd ?? launchPlan.cwd,
		shell: catalogPlan.title ?? catalogPlan.command,
		args: []
	};
}
//#endregion
//#region src/gateway/server-methods/terminal-upload.ts
function invalid$1(respond, detail) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, detail));
}
const terminalUploadHandlers = { "terminal.upload": async (opts) => {
	const { params, respond, context } = opts;
	if (!require_src.validateTerminalUploadParams(params)) {
		invalid$1(respond, `invalid terminal.upload params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalUploadParams.errors)}`);
		return;
	}
	const connId = opts.client?.connId;
	if (!connId) {
		invalid$1(respond, "terminal requires an authenticated connection");
		return;
	}
	const p = params;
	if (!require_terminal_upload_constants.isCanonicalTerminalUploadBase64(p.contentBase64)) {
		invalid$1(respond, "invalid terminal.upload base64 content");
		return;
	}
	if (!context.terminalSessions || !context.isTerminalEnabled()) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal is not available"));
		return;
	}
	try {
		const result = await context.terminalSessions.upload(connId, p.sessionId, {
			name: p.name,
			contentBase64: p.contentBase64
		});
		if (!result) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown terminal session "${p.sessionId}"`));
			return;
		}
		respond(true, result);
	} catch (error) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, error instanceof Error ? error.message : "terminal upload failed"));
	}
} };
//#endregion
//#region src/gateway/server-methods/terminal.ts
function invalid(respond, detail) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, detail));
}
function requireConnId(opts) {
	const connId = opts.client?.connId;
	if (!connId) {
		invalid(opts.respond, "terminal requires an authenticated connection");
		return null;
	}
	return connId;
}
function terminalEnabled(context) {
	return context.isTerminalEnabled();
}
const TERMINAL_OPEN_DEADLINE_MS = 3e4;
var TerminalOpenDeadlineError = class extends Error {
	constructor() {
		super("terminal open timed out");
		this.name = "TerminalOpenDeadlineError";
	}
};
function createTerminalOpenDeadline() {
	return {
		expiresAtMs: Date.now() + TERMINAL_OPEN_DEADLINE_MS,
		controller: new AbortController()
	};
}
function expireTerminalOpenDeadline(deadline) {
	if (!deadline.controller.signal.aborted) deadline.controller.abort(new TerminalOpenDeadlineError());
	return (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(deadline.controller.signal.reason, "Terminal open timed out");
}
async function waitForTerminalOpenDeadline(run, deadline) {
	if (deadline.controller.signal.aborted || Date.now() >= deadline.expiresAtMs) throw expireTerminalOpenDeadline(deadline);
	return await new Promise((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timer);
			reject(expireTerminalOpenDeadline(deadline));
		};
		const timer = setTimeout(() => expireTerminalOpenDeadline(deadline), Math.max(0, deadline.expiresAtMs - Date.now()));
		deadline.controller.signal.addEventListener("abort", onAbort, { once: true });
		let promise;
		try {
			promise = run();
		} catch (error) {
			if (deadline.controller.signal.aborted || Date.now() >= deadline.expiresAtMs) {
				expireTerminalOpenDeadline(deadline);
				return;
			}
			clearTimeout(timer);
			deadline.controller.signal.removeEventListener("abort", onAbort);
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Terminal open failed"));
			return;
		}
		promise.then((value) => {
			if (deadline.controller.signal.aborted || Date.now() >= deadline.expiresAtMs) {
				expireTerminalOpenDeadline(deadline);
				return;
			}
			clearTimeout(timer);
			deadline.controller.signal.removeEventListener("abort", onAbort);
			resolve(value);
		}, (error) => {
			if (deadline.controller.signal.aborted || Date.now() >= deadline.expiresAtMs) {
				expireTerminalOpenDeadline(deadline);
				return;
			}
			clearTimeout(timer);
			deadline.controller.signal.removeEventListener("abort", onAbort);
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Terminal open failed"));
		});
	});
}
function respondTerminalOpenTimeout(respond) {
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal open timed out"));
}
function parseNodePayload(payload, payloadJSON) {
	if (!payloadJSON) return payload;
	try {
		return JSON.parse(payloadJSON);
	} catch {
		return;
	}
}
async function stageNodeTerminalUpload(context, nodeId, file) {
	const access = authorizeTerminalNodeCommand(context, nodeId, require_node_commands.NODE_TERMINAL_UPLOAD_COMMAND);
	if (!access.ok) throw new Error(access.message);
	const result = await context.nodeRegistry.invoke({
		nodeId,
		expectedConnId: access.node.connId,
		command: require_node_commands.NODE_TERMINAL_UPLOAD_COMMAND,
		params: file,
		timeoutMs: 12e4
	});
	if (!result.ok) throw new Error(result.error?.message ?? "terminal node upload failed");
	const payload = parseNodePayload(result.payload, result.payloadJSON);
	if (!require_src.validateTerminalUploadResult(payload)) throw new Error("terminal node returned an invalid upload result");
	return payload;
}
function respondLaunchBlocked(respond, block) {
	if (block.kind === "disabled") {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal is disabled"));
		return;
	}
	if (block.kind === "unknown-agent") {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown agent "${block.agentId}"`));
		return;
	}
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `terminal unavailable: agent "${block.agentId}" runs in a sandbox (mode "${block.mode}"); in-sandbox terminals are not supported yet`));
}
/** Handlers for the operator terminal method family. */
const terminalHandlers = {
	...terminalUploadHandlers,
	"terminal.open": async (opts) => {
		const { params, respond, context } = opts;
		if (!require_src.validateTerminalOpenParams(params)) {
			invalid(respond, `invalid terminal.open params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalOpenParams.errors)}`);
			return;
		}
		const connId = requireConnId(opts);
		if (!connId) return;
		const manager = context.terminalSessions;
		if (!manager) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal is not available"));
			return;
		}
		const p = params;
		const launch = context.resolveTerminalLaunchPolicy(p.agentId);
		if (!launch.ok) {
			respondLaunchBlocked(respond, launch.block);
			return;
		}
		const deadline = createTerminalOpenDeadline();
		let catalogPlan;
		let title;
		let createBackend;
		let nodeRelay;
		let stageUpload;
		if (p.catalog) {
			const provider = require_session_catalog.resolveSessionCatalogProvider(p.catalog.catalogId);
			if (!provider) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown session catalog: ${p.catalog.catalogId}`));
				return;
			}
			if (!provider.openTerminal) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "session catalog cannot open terminals"));
				return;
			}
			const openTerminal = provider.openTerminal;
			const catalog = p.catalog;
			try {
				catalogPlan = await waitForTerminalOpenDeadline(() => openTerminal.call(provider, {
					hostId: catalog.hostId,
					threadId: catalog.threadId
				}), deadline);
			} catch (error) {
				if (error instanceof TerminalOpenDeadlineError) {
					respondTerminalOpenTimeout(respond);
					return;
				}
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, error instanceof Error ? error.message : "catalog terminal open failed"));
				return;
			}
			title = catalogPlan.title;
			if (catalogPlan.kind === "local") {
				if (catalogPlan.argv.length === 0) {
					invalid(respond, "catalog terminal plan has no command");
					return;
				}
			} else {
				const nodeCatalogPlan = catalogPlan;
				const access = authorizeCatalogTerminalNode(context, nodeCatalogPlan);
				if (!access.ok) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, access.message));
					return;
				}
				let nodeParams;
				try {
					const parsed = JSON.parse(catalogPlan.paramsJSON);
					if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid params");
					nodeParams = {
						...parsed,
						cols: p.cols,
						rows: p.rows
					};
				} catch {
					invalid(respond, "catalog terminal plan has invalid params");
					return;
				}
				let policyResult;
				try {
					policyResult = await waitForTerminalOpenDeadline(() => require_node_invoke_plugin_policy.applyPluginNodeInvokePolicy({
						context,
						client: opts.client,
						nodeSession: access.node,
						command: nodeCatalogPlan.command,
						params: nodeParams
					}), deadline);
				} catch (error) {
					if (error instanceof TerminalOpenDeadlineError) {
						respondTerminalOpenTimeout(respond);
						return;
					}
					throw error;
				}
				if (policyResult && !policyResult.ok) {
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, policyResult.message));
					return;
				}
				nodeRelay = {
					plan: nodeCatalogPlan,
					params: nodeParams
				};
				stageUpload = async (file) => await stageNodeTerminalUpload(context, nodeCatalogPlan.nodeId, file);
			}
		}
		if (context.isConnectionActive?.(connId) === false) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal connection closed"));
			return;
		}
		if (!terminalEnabled(context)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal is disabled"));
			return;
		}
		const refreshedLaunch = context.resolveTerminalLaunchPolicy(p.agentId);
		if (!refreshedLaunch.ok) {
			respondLaunchBlocked(respond, refreshedLaunch.block);
			return;
		}
		if (nodeRelay) {
			const relay = nodeRelay;
			const access = authorizeCatalogTerminalNode(context, relay.plan);
			if (!access.ok) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, access.message));
				return;
			}
			createBackend = async () => await createNodeRelayBackend({
				registry: context.nodeRegistry,
				nodeId: relay.plan.nodeId,
				expectedConnId: access.node.connId,
				command: relay.plan.command,
				params: relay.params
			});
		}
		const spawnPlan = resolveTerminalOpenSpawnPlan(refreshedLaunch.plan, catalogPlan);
		const terminalEnv = require_launch.buildTerminalEnv(process.env);
		if (catalogPlan?.kind === "local" && catalogPlan.pathEnv) terminalEnv.PATH = catalogPlan.pathEnv;
		let openingTerminal;
		let outcome;
		try {
			outcome = await waitForTerminalOpenDeadline(() => {
				openingTerminal = manager.open({
					connId,
					agentId: spawnPlan.agentId,
					cwd: spawnPlan.cwd,
					shell: spawnPlan.shell,
					args: spawnPlan.args,
					cols: p.cols,
					rows: p.rows,
					env: terminalEnv,
					signal: deadline.controller.signal,
					...createBackend ? { createBackend } : {},
					...stageUpload ? { stageUpload } : {}
				});
				return openingTerminal;
			}, deadline);
		} catch (error) {
			if (error instanceof TerminalOpenDeadlineError) {
				if (openingTerminal) openingTerminal.then((lateOutcome) => {
					if (lateOutcome.ok) manager.close(connId, lateOutcome.sessionId);
				}, () => void 0);
				respondTerminalOpenTimeout(respond);
				return;
			}
			throw error;
		}
		if (!outcome.ok) {
			respond(false, void 0, require_error_codes.errorShape(outcome.code === "limit" ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE, outcome.message));
			return;
		}
		if (context.isConnectionActive?.(connId) === false) {
			manager.close(connId, outcome.sessionId);
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal connection closed"));
			return;
		}
		context.logGateway.info(`terminal opened session=${outcome.sessionId} agent=${outcome.agentId} conn=${connId} shell=${outcome.shell}`);
		respond(true, {
			sessionId: outcome.sessionId,
			agentId: outcome.agentId,
			shell: outcome.shell,
			cwd: outcome.cwd,
			confined: false,
			...title ? { title } : {}
		});
	},
	"terminal.input": async (opts) => {
		const { params, respond, context } = opts;
		if (!require_src.validateTerminalInputParams(params)) {
			invalid(respond, `invalid terminal.input params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalInputParams.errors)}`);
			return;
		}
		const connId = requireConnId(opts);
		if (!connId) return;
		const p = params;
		if (!terminalEnabled(context)) {
			context.terminalSessions?.close(connId, p.sessionId);
			respond(true, { ok: false });
			return;
		}
		respond(true, { ok: context.terminalSessions?.write(connId, p.sessionId, p.data) ?? false });
	},
	"terminal.resize": async (opts) => {
		const { params, respond, context } = opts;
		if (!require_src.validateTerminalResizeParams(params)) {
			invalid(respond, `invalid terminal.resize params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalResizeParams.errors)}`);
			return;
		}
		const connId = requireConnId(opts);
		if (!connId) return;
		const p = params;
		if (!terminalEnabled(context)) {
			context.terminalSessions?.close(connId, p.sessionId);
			respond(true, { ok: false });
			return;
		}
		respond(true, { ok: context.terminalSessions?.resize(connId, p.sessionId, p.cols, p.rows) ?? false });
	},
	"terminal.close": async (opts) => {
		const { params, respond, context } = opts;
		if (!require_src.validateTerminalCloseParams(params)) {
			invalid(respond, `invalid terminal.close params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalCloseParams.errors)}`);
			return;
		}
		const connId = requireConnId(opts);
		if (!connId) return;
		const p = params;
		respond(true, { ok: context.terminalSessions?.close(connId, p.sessionId) ?? false });
	},
	"terminal.attach": async (opts) => {
		const { params, respond, context } = opts;
		if (!require_src.validateTerminalAttachParams(params)) {
			invalid(respond, `invalid terminal.attach params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalAttachParams.errors)}`);
			return;
		}
		const connId = requireConnId(opts);
		if (!connId) return;
		const p = params;
		if (!context.terminalSessions || !terminalEnabled(context)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal is not available"));
			return;
		}
		const attached = context.terminalSessions.attach(connId, p.sessionId);
		if (!attached) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown terminal session "${p.sessionId}"`));
			return;
		}
		context.logGateway.info(`terminal attached session=${attached.sessionId} agent=${attached.agentId} conn=${connId}`);
		const supportsOffsetSeq = require_client_info.hasGatewayClientCap(opts.client?.connect?.caps, require_client_info.GATEWAY_CLIENT_CAPS.TERMINAL_OFFSET_SEQ);
		respond(true, {
			sessionId: attached.sessionId,
			agentId: attached.agentId,
			shell: attached.shell,
			cwd: attached.cwd,
			confined: false,
			buffer: attached.buffer,
			...supportsOffsetSeq ? { seq: attached.seq } : {}
		});
	},
	"terminal.list": async (opts) => {
		const { respond, context } = opts;
		if (!requireConnId(opts)) return;
		respond(true, { sessions: context.terminalSessions && terminalEnabled(context) ? context.terminalSessions.list().map((session) => ({
			sessionId: session.sessionId,
			agentId: session.agentId,
			shell: session.shell,
			cwd: session.cwd,
			confined: false,
			attached: session.attached,
			createdAtMs: session.createdAtMs
		})) : [] });
	},
	"terminal.text": async (opts) => {
		const { params, respond, context } = opts;
		if (!require_src.validateTerminalTextParams(params)) {
			invalid(respond, `invalid terminal.text params: ${require_validation_errors.formatValidationErrors(require_src.validateTerminalTextParams.errors)}`);
			return;
		}
		if (!requireConnId(opts)) return;
		const p = params;
		if (!context.terminalSessions || !terminalEnabled(context)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "terminal is not available"));
			return;
		}
		const raw = context.terminalSessions.snapshot(p.sessionId);
		if (raw === void 0) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown terminal session "${p.sessionId}"`));
			return;
		}
		respond(true, { text: renderTerminalBufferText(raw) });
	}
};
//#endregion
exports.TERMINAL_OPEN_DEADLINE_MS = TERMINAL_OPEN_DEADLINE_MS;
exports.terminalHandlers = terminalHandlers;
