const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_typebox = require("./typebox-Cmpdg63i.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_operations = require("./operations-DJFq4EMx.cjs");
let node_crypto = require("node:crypto");
let typebox = require("typebox");
//#region src/agents/tools/system-agent-tool.ts
/**
* openclaw built-in tool: ring-zero setup/repair actions for the Operator
* agent. Never exposed to normal agents — construction is bound to a host-owned
* per-run scope, and every action funnels through Operator's typed operation
* union with approval assertions and the audit log.
*/
var system_agent_tool_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createSystemAgentTool: () => createSystemAgentTool,
	hashSystemAgentOperation: () => hashSystemAgentOperation,
	resolveSystemAgentDirectiveTransition: () => resolveSystemAgentDirectiveTransition,
	resolveSystemAgentProposalTransition: () => resolveSystemAgentProposalTransition
});
/** Canonical operation fingerprint used to bind "yes" to one exact mutation. */
function hashSystemAgentOperation(operation) {
	return (0, node_crypto.createHash)("sha256").update(require_stable_stringify.stableStringify(operation)).digest("hex");
}
/** Result markers shared with out-of-process hosts (CLI MCP runs). */
const SYSTEM_AGENT_NEEDS_APPROVAL_PREFIX = "needs-approval:";
const SYSTEM_AGENT_APPROVAL_MISMATCH_PREFIX = "approval-mismatch:";
const SYSTEM_AGENT_DIRECTIVE_PREFIX = "directive:";
const SYSTEM_AGENT_APPROVED_OPERATION_PREFIX = `${SYSTEM_AGENT_DIRECTIVE_PREFIX}approved-operation:`;
/**
* Reconstruct a host directive from an out-of-process tool result. Directive
* actions run inside the MCP subprocess on CLI-harness runs, so the host
* replays them from harness tool events the same way proposals are mirrored.
*/
function resolveSystemAgentDirectiveTransition(params) {
	if (!params.resultText.startsWith(SYSTEM_AGENT_DIRECTIVE_PREFIX)) return null;
	try {
		const operation = operationForAction(params.args);
		if (params.resultText.startsWith(SYSTEM_AGENT_APPROVED_OPERATION_PREFIX) && require_operations.isPersistentSystemAgentOperation(operation)) return {
			kind: "approved-operation",
			operation
		};
		return directiveForOperation(operation);
	} catch {
		return null;
	}
}
function directiveForOperation(operation) {
	if (operation.kind === "channel-setup") return {
		kind: "channel-setup",
		channel: operation.channel
	};
	if (operation.kind === "model-setup") return {
		kind: "model-setup",
		...operation.workspace ? { workspace: operation.workspace } : {}
	};
	if (operation.kind === "open-tui") return {
		kind: "open-tui",
		...operation.agentId ? { agentId: operation.agentId } : {},
		...operation.workspace ? { workspace: operation.workspace } : {}
	};
	if (operation.kind === "open-setup") return operation;
	return null;
}
/**
* Mirror a proposalRef transition from an out-of-process tool result. CLI MCP
* runs execute this tool in a stdio subprocess whose proposalRef dies with the
* run; the host replays the same lifecycle from harness tool events: denial
* registers the exact-operation hash, mismatch voids it, execution consumes it.
*/
function resolveSystemAgentProposalTransition(params) {
	let operation;
	try {
		operation = operationForAction(params.args);
	} catch {
		return null;
	}
	if (!require_operations.isPersistentSystemAgentOperation(operation)) return null;
	if (params.resultText.startsWith(SYSTEM_AGENT_APPROVAL_MISMATCH_PREFIX)) return { proposal: void 0 };
	if (params.resultText.startsWith(SYSTEM_AGENT_NEEDS_APPROVAL_PREFIX)) {
		const carriedHash = (params.resultText.split("\n", 1)[0] ?? "").slice(15).trim();
		return {
			proposal: /^[a-f0-9]{64}$/.test(carriedHash) ? carriedHash : hashSystemAgentOperation(operation),
			operation
		};
	}
	return { proposal: void 0 };
}
const SystemAgentToolSchema = typebox.Type.Object({
	action: require_typebox.stringEnum([...[
		"status",
		"models",
		"agents",
		"channels",
		"channel_info",
		"audit",
		"validate_config",
		"doctor",
		"config_get",
		"config_schema",
		"gateway_status",
		"plugin_search",
		"connect_channel",
		"configure_model_provider",
		"open_agent",
		"open_setup",
		"setup",
		"set_default_model",
		"config_set",
		"config_set_ref",
		"create_agent",
		"gateway_start",
		"gateway_stop",
		"gateway_restart",
		"plugin_install",
		"plugin_uninstall"
	]]),
	path: typebox.Type.Optional(typebox.Type.String({ description: "Config path for config_* actions" })),
	value: typebox.Type.Optional(typebox.Type.String({ description: "Value for config_set (JSON5 or string)" })),
	envVar: typebox.Type.Optional(typebox.Type.String({ description: "Env var name for config_set_ref" })),
	model: typebox.Type.Optional(typebox.Type.String({ description: "provider/model ref" })),
	workspace: typebox.Type.Optional(typebox.Type.String({ description: "Workspace directory" })),
	agentId: typebox.Type.Optional(typebox.Type.String({ description: "Agent id for create_agent/open_agent" })),
	channel: typebox.Type.Optional(typebox.Type.String({ description: "Channel id for connect_channel, channel_info, or open_setup channels" })),
	target: typebox.Type.Optional(require_typebox.stringEnum([
		"guided",
		"classic",
		"channels"
	], { description: "Setup target for open_setup. channels runs in this chat; guided/classic require exiting Operator and running openclaw onboard." })),
	query: typebox.Type.Optional(typebox.Type.String({ description: "Search query for plugin_search" })),
	spec: typebox.Type.Optional(typebox.Type.String({ description: "npm/clawhub spec for plugin_install" })),
	pluginId: typebox.Type.Optional(typebox.Type.String({ description: "Plugin id for plugin_uninstall" })),
	approved: typebox.Type.Optional(typebox.Type.Boolean({ description: "Set true ONLY after the user explicitly approved this exact change in the conversation." }))
});
function createCaptureRuntime() {
	const lines = [];
	return {
		log: (...args) => lines.push(args.join(" ")),
		error: (...args) => lines.push(args.join(" ")),
		exit: (code) => {
			throw new Error(`openclaw operation exited with code ${String(code)}`);
		},
		read: () => lines.join("\n").trim()
	};
}
function requireParam(params, name) {
	const value = require_common.readStringParam(params, name);
	if (!value?.trim()) throw new require_common.ToolInputError(`operator: "${name}" is required for this action`);
	return value.trim();
}
function readSetupTarget(params) {
	const target = require_common.readStringParam(params, "target")?.trim() ?? "guided";
	if (target === "guided" || target === "classic" || target === "channels") return target;
	throw new require_common.ToolInputError(`operator: unknown setup target "${target}"`);
}
function operationForAction(params) {
	const action = require_common.readStringParam(params, "action", { required: true });
	switch (action) {
		case "status": return { kind: "status" };
		case "models": return { kind: "models" };
		case "agents": return { kind: "agents" };
		case "channels": return { kind: "channel-list" };
		case "channel_info": return {
			kind: "channel-info",
			channel: requireParam(params, "channel").toLowerCase()
		};
		case "audit": return { kind: "audit" };
		case "validate_config": return { kind: "config-validate" };
		case "doctor": return { kind: "doctor" };
		case "config_get": return {
			kind: "config-get",
			path: requireParam(params, "path")
		};
		case "config_schema": {
			const path = require_common.readStringParam(params, "path")?.trim();
			return {
				kind: "config-schema",
				...path ? { path } : {}
			};
		}
		case "gateway_status": return { kind: "gateway-status" };
		case "connect_channel": return {
			kind: "channel-setup",
			channel: requireParam(params, "channel").toLowerCase()
		};
		case "configure_model_provider": {
			const workspace = require_common.readStringParam(params, "workspace")?.trim();
			return {
				kind: "model-setup",
				...workspace ? { workspace } : {}
			};
		}
		case "open_agent": {
			const agentId = require_common.readStringParam(params, "agentId")?.trim();
			const workspace = require_common.readStringParam(params, "workspace")?.trim();
			return {
				kind: "open-tui",
				...agentId ? { agentId } : {},
				...workspace ? { workspace } : {}
			};
		}
		case "open_setup": {
			const target = readSetupTarget(params);
			const channel = require_common.readStringParam(params, "channel")?.trim().toLowerCase();
			return {
				kind: "open-setup",
				target,
				...channel ? { channel } : {}
			};
		}
		case "gateway_start": return { kind: "gateway-start" };
		case "gateway_stop": return { kind: "gateway-stop" };
		case "gateway_restart": return { kind: "gateway-restart" };
		case "plugin_search": return {
			kind: "plugin-search",
			query: requireParam(params, "query")
		};
		case "plugin_install": {
			const spec = requireParam(params, "spec");
			const validationError = require_operations.validateSystemAgentPluginInstallSpec(spec);
			if (validationError) throw new require_common.ToolInputError(`operator: ${validationError}`);
			return {
				kind: "plugin-install",
				spec
			};
		}
		case "plugin_uninstall": return {
			kind: "plugin-uninstall",
			pluginId: requireParam(params, "pluginId")
		};
		case "setup": {
			const workspace = require_common.readStringParam(params, "workspace")?.trim();
			const model = require_common.readStringParam(params, "model")?.trim();
			return {
				kind: "setup",
				...workspace ? { workspace } : {},
				...model ? { model } : {}
			};
		}
		case "set_default_model": return {
			kind: "set-default-model",
			model: requireParam(params, "model")
		};
		case "create_agent": {
			const workspace = require_common.readStringParam(params, "workspace")?.trim();
			const model = require_common.readStringParam(params, "model")?.trim();
			return {
				kind: "create-agent",
				agentId: requireParam(params, "agentId"),
				...workspace ? { workspace } : {},
				...model ? { model } : {}
			};
		}
		case "config_set": return {
			kind: "config-set",
			path: requireParam(params, "path"),
			value: requireParam(params, "value")
		};
		case "config_set_ref": return {
			kind: "config-set-ref",
			path: requireParam(params, "path"),
			source: "env",
			id: requireParam(params, "envVar")
		};
		default: throw new require_common.ToolInputError(`operator: unknown action "${action}"`);
	}
}
function createSystemAgentTool(options) {
	return {
		name: "@gabrielvfonseca/operator",
		label: "Operator",
		catalogMode: "direct-only",
		description: [
			"System agent. Setup, config, channels, plugins, agents, repair.",
			"Read now: status, models, agents, channels, channel_info, config_get, config_schema, gateway_status, plugin_search, validate_config, doctor, audit.",
			"Handoff: connect_channel; open_setup target=channels; open_agent.",
			"Inference, provider, auth, credentials: exit; run `openclaw onboard`. Never request credentials.",
			"Write: setup, set_default_model, config_set, config_set_ref, create_agent, gateway_*, plugin_install. Exact user approval required; then approved=true. Host applies after turn; rechecks inference owner.",
			"plugin_install: ClawHub/bundled/official only. Arbitrary source: exit, trusted shell.",
			"Unknown config: config_schema first. Secrets: config_set_ref env. No plaintext. No raw auth/models/env/secrets/plugins/tools/agent-route/$include; typed workflows.",
			"No plugin uninstall. No doctor repair. Writes validated, audited. Invalid config: fix now."
		].join(" "),
		parameters: SystemAgentToolSchema,
		execute: async (_toolCallId, args) => {
			const params = args ?? {};
			const operation = operationForAction(params);
			const directive = directiveForOperation(operation);
			if (directive) {
				if (options.directiveRef && options.directiveRef.current?.kind !== "approved-operation") options.directiveRef.current = directive;
				return require_common.textResult(directive.kind === "channel-setup" ? `${SYSTEM_AGENT_DIRECTIVE_PREFIX} the host chat now starts the guided ${directive.channel} setup with the user. Tell the user the setup questions come next; do not describe steps yourself.` : directive.kind === "model-setup" ? `${SYSTEM_AGENT_DIRECTIVE_PREFIX} the active inference route cannot be changed inside Operator. Tell the user to exit Operator and run \`openclaw onboard\`; do not ask for provider credentials here.` : directive.kind === "open-tui" ? `${SYSTEM_AGENT_DIRECTIVE_PREFIX} the host now hands the user over to their normal agent. Say goodbye briefly.` : directive.target === "channels" ? `${SYSTEM_AGENT_DIRECTIVE_PREFIX} the host now opens channel setup${directive.channel ? ` for ${directive.channel}` : ""}. Tell the user the channel setup questions come next.` : `${SYSTEM_AGENT_DIRECTIVE_PREFIX} ${directive.target} setup cannot run inside Operator because it may change the active inference route. Tell the user to exit Operator and run \`openclaw onboard\`.`, {});
			}
			if (require_operations.isPersistentSystemAgentOperation(operation)) {
				const operationHash = hashSystemAgentOperation(operation);
				if (!(params.approved === true && options.approvalArmed === true && options.proposalRef?.current === operationHash)) {
					if (options.approvalArmed === true) {
						if (options.proposalRef) {
							options.proposalRef.current = void 0;
							options.proposalRef.operation = void 0;
						}
						return require_common.textResult(`${SYSTEM_AGENT_APPROVAL_MISMATCH_PREFIX} this call is not the operation the user approved. The approval is void; describe the new change and get a fresh yes before retrying.`, { needsApproval: true });
					}
					if (options.proposalRef) {
						options.proposalRef.current = operationHash;
						options.proposalRef.operation = operation;
					}
					return require_common.textResult(`${SYSTEM_AGENT_NEEDS_APPROVAL_PREFIX}${operationHash}\nThis action changes state. The proposal is registered; describe this exact change and ask the user to reply yes (their approval unlocks THIS action only — then retry the exact registered operation with approved=true).`, { needsApproval: true });
				}
				if (options.proposalRef) {
					options.proposalRef.current = void 0;
					options.proposalRef.operation = void 0;
				}
				const approvedDirective = {
					kind: "approved-operation",
					operation
				};
				if (options.directiveRef) options.directiveRef.current = approvedDirective;
				return require_common.textResult(`${SYSTEM_AGENT_APPROVED_OPERATION_PREFIX} the host accepted this exact approved action and will apply it after this turn. Do not call it again.`, {});
			}
			const capture = createCaptureRuntime();
			try {
				await require_operations.executeSystemAgentOperation(operation, capture, {
					approved: false,
					deps: { setupSurface: options.surface }
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return require_common.textResult([capture.read(), `error: ${message}`].filter(Boolean).join("\n"), { error: true });
			}
			return require_common.textResult(capture.read() || "done", {});
		}
	};
}
//#endregion
Object.defineProperty(exports, "hashSystemAgentOperation", {
	enumerable: true,
	get: function() {
		return hashSystemAgentOperation;
	}
});
Object.defineProperty(exports, "system_agent_tool_exports", {
	enumerable: true,
	get: function() {
		return system_agent_tool_exports;
	}
});
