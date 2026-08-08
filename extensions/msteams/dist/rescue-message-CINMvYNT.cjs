require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_plugin_state_store = require("./plugin-state-store-BnlgUGbF.cjs");
const require_operations = require("./operations-DJFq4EMx.cjs");
const require_approval_intent = require("./approval-intent-BJO_PmMk.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/system-agent/rescue-policy.ts
function resolvePendingTtlMinutes(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 15;
}
function resolveAgentEntry(cfg, agentId) {
	if (!agentId) return;
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return cfg.agents?.list?.find((entry) => entry !== null && typeof entry === "object" && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === id);
}
function resolveScopedExecConfig(cfg, agentId) {
	return resolveAgentEntry(cfg, agentId)?.tools?.exec;
}
function resolveScopedSandboxMode(cfg, agentId) {
	return resolveAgentEntry(cfg, agentId)?.sandbox?.mode ?? cfg.agents?.defaults?.sandbox?.mode ?? "off";
}
function isYoloHostPosture(cfg, agentId) {
	const scopedExec = resolveScopedExecConfig(cfg, agentId);
	const globalExec = cfg.tools?.exec;
	const security = scopedExec?.security ?? globalExec?.security ?? "full";
	const ask = scopedExec?.ask ?? globalExec?.ask ?? "off";
	return security === "full" && ask === "off";
}
/** Decide whether a message-channel rescue command is allowed for this sender/context. */
function resolveSystemAgentRescuePolicy(input) {
	const rescue = input.cfg.systemAgent?.rescue;
	const configuredEnabled = rescue?.enabled ?? "auto";
	const ownerDmOnly = rescue?.ownerDmOnly ?? true;
	const pendingTtlMinutes = resolvePendingTtlMinutes(rescue?.pendingTtlMinutes);
	const sandboxActive = resolveScopedSandboxMode(input.cfg, input.agentId) !== "off";
	const yolo = !sandboxActive && isYoloHostPosture(input.cfg, input.agentId);
	const enabled = configuredEnabled === "auto" ? yolo : configuredEnabled;
	if (!enabled) return {
		allowed: false,
		enabled,
		ownerDmOnly,
		pendingTtlMinutes,
		yolo,
		sandboxActive,
		reason: "disabled",
		message: "Operator rescue is disabled. Set systemAgent.rescue.enabled=true or use YOLO host posture with sandboxing off."
	};
	if (sandboxActive) return {
		allowed: false,
		enabled,
		ownerDmOnly,
		pendingTtlMinutes,
		yolo,
		sandboxActive,
		reason: "sandbox-active",
		message: "Operator rescue is blocked because Operator sandboxing is active. Fix the install locally or disable sandboxing before using remote rescue."
	};
	if (configuredEnabled === "auto" && !yolo) return {
		allowed: false,
		enabled,
		ownerDmOnly,
		pendingTtlMinutes,
		yolo,
		sandboxActive,
		reason: "not-yolo",
		message: "Operator rescue auto-mode only opens in YOLO host posture: tools.exec.security=full, tools.exec.ask=off, and sandboxing off."
	};
	if (!input.senderIsOwner) return {
		allowed: false,
		enabled,
		ownerDmOnly,
		pendingTtlMinutes,
		yolo,
		sandboxActive,
		reason: "not-owner",
		message: "Operator rescue only accepts commands from an Operator owner."
	};
	if (ownerDmOnly && !input.isDirectMessage) return {
		allowed: false,
		enabled,
		ownerDmOnly,
		pendingTtlMinutes,
		yolo,
		sandboxActive,
		reason: "not-direct-message",
		message: "Operator rescue is restricted to owner DMs by default."
	};
	return {
		allowed: true,
		enabled: true,
		ownerDmOnly,
		pendingTtlMinutes,
		yolo: true,
		sandboxActive: false
	};
}
//#endregion
//#region src/system-agent/rescue-message.ts
const SYSTEM_AGENT_COMMAND = "/operator";
const RESCUE_PENDING_NAMESPACE = "rescue-pending";
const RESCUE_PENDING_MAX_ENTRIES = 1024;
function createCaptureRuntime() {
	const lines = [];
	const push = (...args) => {
		lines.push(args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" "));
	};
	return {
		runtime: {
			log: push,
			error: push,
			exit: (code) => {
				throw new Error(`Operator operation exited with code ${code}`);
			}
		},
		read: () => lines.join("\n").trim()
	};
}
/** Extract the command body after `/operator`, or null when the message is not for rescue. */
function extractSystemAgentRescueMessage(commandBody) {
	const normalized = commandBody.trim();
	const lower = normalized.toLowerCase();
	if (lower !== SYSTEM_AGENT_COMMAND && !lower.startsWith(`${SYSTEM_AGENT_COMMAND} `)) return null;
	return normalized.slice(9).trim();
}
function resolvePendingKey(input) {
	const key = JSON.stringify({
		accountId: resolveAccountDiscriminator(input.command),
		channel: input.command.channelId ?? input.command.channel,
		from: input.command.from,
		senderId: input.command.senderId
	});
	return (0, node_crypto.createHash)("sha256").update(key).digest("hex").slice(0, 32);
}
function resolveAccountDiscriminator(command) {
	return command.accountId?.trim() || command.to?.trim() || "default";
}
function openPendingStore(env) {
	return require_plugin_state_store.createCorePluginStateSyncKeyedStore({
		ownerId: "core:system-agent",
		namespace: RESCUE_PENDING_NAMESPACE,
		maxEntries: RESCUE_PENDING_MAX_ENTRIES,
		overflowPolicy: "reject-new",
		...env ? { env } : {}
	});
}
function isPlainRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function hasExactKeys(value, required, optional = []) {
	const allowed = /* @__PURE__ */ new Set([...required, ...optional]);
	return required.every((key) => Object.hasOwn(value, key)) && Object.keys(value).every((key) => allowed.has(key));
}
function hasOptionalString(value, key) {
	return !Object.hasOwn(value, key) || isNonEmptyString(value[key]);
}
function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function parsePendingOperation(value) {
	if (!isPlainRecord(value) || value.version !== 1 || !isPlainRecord(value.operation)) return null;
	const operation = value.operation;
	if (typeof operation.kind !== "string") return null;
	switch (operation.kind) {
		case "set-default-model":
			if (!hasExactKeys(operation, ["kind", "model"]) || !isNonEmptyString(operation.model)) return null;
			break;
		case "config-set":
			if (!hasExactKeys(operation, [
				"kind",
				"path",
				"value"
			]) || !isNonEmptyString(operation.path) || !isNonEmptyString(operation.value)) return null;
			break;
		case "config-set-ref":
			if (!hasExactKeys(operation, [
				"kind",
				"path",
				"source",
				"id"
			], ["provider"]) || !isNonEmptyString(operation.path) || operation.source !== "env" && operation.source !== "file" && operation.source !== "exec" || !isNonEmptyString(operation.id) || !hasOptionalString(operation, "provider")) return null;
			break;
		case "setup":
			if (!hasExactKeys(operation, ["kind"], ["workspace", "model"]) || !hasOptionalString(operation, "workspace") || !hasOptionalString(operation, "model")) return null;
			break;
		case "plugin-install":
			if (!hasExactKeys(operation, ["kind", "spec"]) || !isNonEmptyString(operation.spec)) return null;
			break;
		case "create-agent":
			if (!hasExactKeys(operation, ["kind", "agentId"], ["workspace", "model"]) || !isNonEmptyString(operation.agentId) || !hasOptionalString(operation, "workspace") || !hasOptionalString(operation, "model")) return null;
			break;
		case "gateway-start":
		case "gateway-stop":
		case "gateway-restart":
			if (!hasExactKeys(operation, ["kind"])) return null;
			break;
		default: return null;
	}
	return require_operations.isPersistentSystemAgentOperation(operation) ? operation : null;
}
function buildAuditDetails(input) {
	return {
		rescue: true,
		channel: input.command.channelId ?? input.command.channel,
		accountId: resolveAccountDiscriminator(input.command),
		senderId: input.command.senderId,
		from: input.command.from
	};
}
function formatPersistentPlan(operation) {
	return require_operations.formatSystemAgentPersistentPlan(operation).replace("Say yes to apply.", "Reply /operator yes to apply.");
}
function formatUnsupportedRemoteOperation(operation) {
	if (operation.kind === "open-tui") return ["Operator rescue cannot open the local TUI from a message channel.", "Use local `operator` for agent handoff, or ask for status, doctor, config, gateway, agents, or models."].join(" ");
	if (operation.kind === "channel-setup") return ["Operator rescue cannot host the interactive channel setup from a message channel.", `Run \`operator setup\` locally and say \`connect ${operation.channel}\` instead.`].join(" ");
	if (operation.kind === "model-setup") return ["Operator rescue cannot host model-provider credential setup from a message channel.", "Run `operator onboard` locally; it live-tests the candidate route before saving it."].join(" ");
	if (operation.kind === "doctor-fix") return ["Operator rescue cannot run doctor repairs from a message channel because they can change the inference route powering this session.", "Exit Operator and run `operator doctor --fix` in a terminal."].join(" ");
	if (operation.kind === "plugin-install") return ["Operator rescue cannot install plugins from a message channel by default because plugin install downloads executable code.", "Use local `operator setup` or `operator plugins install` instead."].join(" ");
	return null;
}
/** Process one rescue message and return a reply, or null when not a rescue command. */
async function runSystemAgentRescueMessage(input) {
	const rescueMessage = extractSystemAgentRescueMessage(input.commandBody);
	if (rescueMessage === null) return null;
	const policy = resolveSystemAgentRescuePolicy({
		cfg: input.cfg,
		agentId: input.agentId,
		senderIsOwner: input.command.senderIsOwner,
		isDirectMessage: !input.isGroup
	});
	if (!policy.allowed) return policy.message;
	const pendingStore = openPendingStore(input.env);
	const pendingKey = resolvePendingKey(input);
	const approvalIntent = require_approval_intent.classifySystemAgentApprovalText(rescueMessage);
	if (approvalIntent === "approve") {
		const operation = parsePendingOperation(pendingStore.consume(pendingKey));
		if (!operation) return "No pending Operator rescue change is waiting for approval.";
		const unsupported = formatUnsupportedRemoteOperation(operation);
		if (unsupported) return unsupported;
		const capture = createCaptureRuntime();
		await require_operations.executeSystemAgentOperation(operation, capture.runtime, {
			approved: true,
			auditDetails: buildAuditDetails(input),
			deps: input.deps
		});
		return capture.read() || "Operator rescue change applied.";
	}
	if (approvalIntent === "decline") return parsePendingOperation(pendingStore.consume(pendingKey)) ? "Dropped the pending Operator rescue change." : "No pending Operator rescue change is waiting for approval.";
	pendingStore.delete(pendingKey);
	const operation = require_operations.parseSystemAgentOperation(rescueMessage);
	const unsupported = formatUnsupportedRemoteOperation(operation);
	if (unsupported) return unsupported;
	if (require_operations.isPersistentSystemAgentOperation(operation)) {
		const nowMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)((/* @__PURE__ */ new Date()).getTime());
		const expiresAtMs = nowMs === void 0 ? void 0 : (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(policy.pendingTtlMinutes * 6e4, { nowMs });
		if (nowMs === void 0 || expiresAtMs === void 0) return "Operator rescue could not create a pending approval because the expiry clock is invalid.";
		const ttlMs = expiresAtMs - nowMs;
		pendingStore.register(pendingKey, {
			version: 1,
			operation
		}, { ttlMs });
		return formatPersistentPlan(operation);
	}
	const capture = createCaptureRuntime();
	await require_operations.executeSystemAgentOperation(operation, capture.runtime, {
		approved: true,
		auditDetails: buildAuditDetails(input),
		deps: input.deps
	});
	return capture.read() || "Operator listened, clicked a claw, and found nothing to change.";
}
//#endregion
exports.extractSystemAgentRescueMessage = extractSystemAgentRescueMessage;
exports.runSystemAgentRescueMessage = runSystemAgentRescueMessage;
