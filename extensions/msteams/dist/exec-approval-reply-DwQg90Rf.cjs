const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_markdown_code = require("./markdown-code-XePB7Ipf.cjs");
const require_approval_id = require("./approval-id-Nv7Zcdte.cjs");
const require_human_list = require("./human-list-DQq9aDxT.cjs");
const require_exec_approval_surface = require("./exec-approval-surface-DwRK9eNC.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/approval-display-paths.ts
/** Formats user-home paths compactly for approval prompts without normalizing unsafe paths. */
function formatApprovalDisplayPath(value) {
	const normalized = value.trim();
	if (!normalized || hasRelativePathSegment(normalized)) return normalized;
	const unixHomeMatch = normalized.match(/^\/(?:home|Users)\/([^/]+)(.*)$/);
	if (unixHomeMatch && isSafeHomeSegment(unixHomeMatch[1])) return compactHomeSuffix(unixHomeMatch[2] ?? "");
	const windowsHomeMatch = normalized.match(/^[A-Za-z]:[\\/]Users[\\/]([^\\/]+)(.*)$/i);
	if (windowsHomeMatch && isSafeHomeSegment(windowsHomeMatch[1])) return compactHomeSuffix(windowsHomeMatch[2] ?? "");
	return normalized;
}
function compactHomeSuffix(suffix) {
	return `~${suffix.replace(/\\/g, "/")}`;
}
function isSafeHomeSegment(segment) {
	return segment !== void 0 && segment !== "." && segment !== "..";
}
function hasRelativePathSegment(value) {
	return /(^|[\\/])\.{1,2}(?=[\\/]|$)/.test(value);
}
//#endregion
//#region src/infra/exec-approval-reply.ts
var exec_approval_reply_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildApprovalInteractiveReplyFromActionDescriptors: () => buildApprovalInteractiveReplyFromActionDescriptors,
	buildApprovalPresentation: () => buildApprovalPresentation,
	buildApprovalPresentationFromActionDescriptors: () => buildApprovalPresentationFromActionDescriptors,
	buildExecApprovalActionDescriptors: () => buildExecApprovalActionDescriptors,
	buildExecApprovalCommandText: () => buildExecApprovalCommandText,
	buildExecApprovalPendingReplyPayload: () => buildExecApprovalPendingReplyPayload,
	buildExecApprovalPresentation: () => buildExecApprovalPresentation,
	buildExecApprovalUnavailableReplyPayload: () => buildExecApprovalUnavailableReplyPayload,
	buildTypedApprovalActionDescriptors: () => buildTypedApprovalActionDescriptors,
	buildTypedApprovalPresentation: () => buildTypedApprovalPresentation,
	buildTypedExecApprovalPendingReplyPayload: () => buildTypedExecApprovalPendingReplyPayload,
	buildTypedExecApprovalPresentation: () => buildTypedExecApprovalPresentation,
	formatExecApprovalExpiresIn: () => formatExecApprovalExpiresIn,
	getExecApprovalApproverDmNoticeText: () => getExecApprovalApproverDmNoticeText,
	getExecApprovalReplyMetadata: () => getExecApprovalReplyMetadata,
	parseExecApprovalCommandText: () => parseExecApprovalCommandText
});
function resolveNativeExecApprovalClientList(params) {
	return require_human_list.formatHumanList(require_exec_approval_surface.listNativeExecApprovalClientLabels({ excludeChannel: params?.excludeChannel }));
}
function buildGenericNativeExecApprovalFallbackText(params) {
	const clients = resolveNativeExecApprovalClientList({ excludeChannel: params?.excludeChannel });
	let manualRecovery = "Print the Control UI URL with `openclaw dashboard --no-open`, open it in a browser, then use the approval inbox.";
	if (params?.host === "node") {
		const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.nodeId) ?? "<id|name|ip>";
		manualRecovery += ` Inspect the node's effective exec policy with \`openclaw approvals get --node ${nodeId}\`.`;
	}
	return clients ? `Approve it from the Web UI or terminal UI, or enable a native chat approval client such as ${clients}. ${manualRecovery} If those accounts already know your owner ID via allowFrom or owner config, Operator can often infer approvers automatically.` : `Approve it from the Web UI or terminal UI. ${manualRecovery}`;
}
function resolveAllowedDecisions(params) {
	return params.allowedDecisions ?? require_exec_approvals.resolveExecApprovalAllowedDecisions({ ask: params.ask });
}
function buildApprovalCommandFence(descriptors) {
	if (descriptors.length === 0) return null;
	return require_markdown_code.formatFencedCodeBlock(descriptors.map((descriptor) => descriptor.command).join("\n"), "txt");
}
function buildExecApprovalCommandText(params) {
	return `/approve ${params.approvalCommandId} ${params.decision}`;
}
function buildApprovalActionDescriptors(approvalCommandId, allowedDecisions) {
	const descriptors = [];
	const buildDescriptor = (descriptor) => {
		return {
			...descriptor,
			command: buildExecApprovalCommandText({
				approvalCommandId,
				decision: descriptor.decision
			})
		};
	};
	if (allowedDecisions.includes("allow-once")) descriptors.push(buildDescriptor({
		decision: "allow-once",
		label: "Allow Once",
		style: "success"
	}));
	if (allowedDecisions.includes("allow-always")) descriptors.push(buildDescriptor({
		decision: "allow-always",
		label: "Allow Always",
		style: "primary"
	}));
	if (allowedDecisions.includes("deny")) descriptors.push(buildDescriptor({
		decision: "deny",
		label: "Deny",
		style: "danger"
	}));
	return descriptors;
}
function buildExecApprovalActionDescriptors(params) {
	const approvalCommandId = params.approvalCommandId.trim();
	return approvalCommandId ? buildApprovalActionDescriptors(approvalCommandId, resolveAllowedDecisions(params)) : [];
}
/** Build approval descriptors with explicit owner-aware typed actions. */
function buildTypedApprovalActionDescriptors(params) {
	const approvalId = params.approvalCommandId;
	if (!require_approval_id.isWellFormedApprovalId(approvalId)) return [];
	return buildApprovalActionDescriptors(approvalId, resolveAllowedDecisions(params)).map((descriptor) => {
		return {
			decision: descriptor.decision,
			label: descriptor.label,
			style: descriptor.style,
			command: descriptor.command,
			action: {
				type: "approval",
				approvalId,
				approvalKind: params.approvalKind,
				decision: descriptor.decision
			}
		};
	});
}
function buildApprovalInteractiveButtons(descriptors) {
	return descriptors.map((descriptor) => {
		const action = descriptor.action ?? {
			type: "command",
			command: descriptor.command
		};
		return {
			label: descriptor.label,
			action,
			...descriptor.action ? {} : { value: descriptor.command },
			style: descriptor.style
		};
	});
}
function buildApprovalPresentationButtons(descriptors) {
	return descriptors.map((descriptor) => {
		const action = descriptor.action ?? {
			type: "command",
			command: descriptor.command
		};
		return {
			label: descriptor.label,
			action,
			...descriptor.action ? {} : { value: descriptor.command },
			style: descriptor.style
		};
	});
}
/** Build portable approval controls from decision descriptors. */
function buildApprovalPresentationFromActionDescriptors(actions) {
	const buttons = buildApprovalPresentationButtons(actions);
	return buttons.length > 0 ? { blocks: [{
		type: "buttons",
		buttons
	}] } : void 0;
}
/** Build the shipped command-backed portable approval controls. */
function buildApprovalPresentation(params) {
	return buildApprovalPresentationFromActionDescriptors(buildExecApprovalActionDescriptors({
		approvalCommandId: params.approvalId,
		ask: params.ask,
		allowedDecisions: params.allowedDecisions
	}));
}
/** Build portable approval controls with explicit owner-aware typed actions. */
function buildTypedApprovalPresentation(params) {
	return buildApprovalPresentationFromActionDescriptors(buildTypedApprovalActionDescriptors({
		approvalCommandId: params.approvalId,
		approvalKind: params.approvalKind,
		ask: params.ask,
		allowedDecisions: params.allowedDecisions
	}));
}
/** Build the shipped command-backed exec-approval presentation. */
function buildExecApprovalPresentation(params) {
	return buildApprovalPresentation({
		approvalId: params.approvalCommandId,
		ask: params.ask,
		allowedDecisions: params.allowedDecisions
	});
}
/** Build an exec-approval presentation with canonical typed decision actions. */
function buildTypedExecApprovalPresentation(params) {
	return buildTypedApprovalPresentation({
		approvalId: params.approvalCommandId,
		approvalKind: "exec",
		ask: params.ask,
		allowedDecisions: params.allowedDecisions
	});
}
/**
* @deprecated Use buildApprovalPresentationFromActionDescriptors.
*/
function buildApprovalInteractiveReplyFromActionDescriptors(actions) {
	const buttons = buildApprovalInteractiveButtons(actions);
	return buttons.length > 0 ? { blocks: [{
		type: "buttons",
		buttons
	}] } : void 0;
}
function getExecApprovalApproverDmNoticeText() {
	return "Approval required. I sent approval DMs to the approvers for this account.";
}
function parseExecApprovalCommandText(raw) {
	const match = raw.trim().match(/^\/?approve(?:@[^\s]+)?\s+([A-Za-z0-9][A-Za-z0-9._:-]*)\s+(allow-once|allow-always|always|deny)\b/i);
	if (!match) return null;
	const rawDecision = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(match[2]) ?? "";
	return {
		approvalId: (0, _gabrielvfonseca_normalization_core.expectDefined)(match[1], "exec approval reply regex capture 1"),
		decision: rawDecision === "always" ? "allow-always" : rawDecision
	};
}
function formatExecApprovalExpiresIn(expiresAtMs, nowMs) {
	const totalSeconds = Math.max(0, Math.round((expiresAtMs - nowMs) / 1e3));
	if (totalSeconds < 60) return `${totalSeconds}s`;
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor(totalSeconds % 3600 / 60);
	const seconds = totalSeconds % 60;
	const parts = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (hours === 0 && minutes < 5 && seconds > 0) parts.push(`${seconds}s`);
	return parts.join(" ");
}
function getExecApprovalReplyMetadata(payload) {
	const channelData = payload.channelData;
	if (!channelData || typeof channelData !== "object" || Array.isArray(channelData)) return null;
	const execApproval = channelData.execApproval;
	if (!execApproval || typeof execApproval !== "object" || Array.isArray(execApproval)) return null;
	const record = execApproval;
	const approvalId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.approvalId) ?? "";
	const approvalSlug = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.approvalSlug) ?? "";
	if (!approvalId || !approvalSlug) return null;
	const approvalKind = record.approvalKind === "plugin" ? "plugin" : "exec";
	const allowedDecisions = Array.isArray(record.allowedDecisions) ? record.allowedDecisions.filter((value) => value === "allow-once" || value === "allow-always" || value === "deny") : void 0;
	return {
		approvalId,
		approvalSlug,
		approvalKind,
		agentId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.agentId),
		allowedDecisions,
		sessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.sessionKey)
	};
}
function buildExecApprovalPendingReplyPayload(params) {
	const approvalCommandId = params.approvalCommandId?.trim() || params.approvalSlug;
	const allowedDecisions = resolveAllowedDecisions(params);
	const descriptors = buildExecApprovalActionDescriptors({
		approvalCommandId,
		allowedDecisions
	});
	const primaryAction = descriptors[0] ?? null;
	const secondaryActions = descriptors.slice(1);
	const lines = [];
	const warningText = params.warningText?.trim();
	if (warningText) lines.push(warningText);
	lines.push("Approval required.");
	if (primaryAction) {
		lines.push("Run:");
		lines.push(require_markdown_code.formatFencedCodeBlock(primaryAction.command, "txt"));
	}
	lines.push("Pending command:");
	lines.push(require_markdown_code.formatFencedCodeBlock(params.command, "sh"));
	const secondaryFence = buildApprovalCommandFence(secondaryActions);
	if (secondaryFence) {
		lines.push("Other options:");
		lines.push(secondaryFence);
	}
	if (!allowedDecisions.includes("allow-always")) lines.push("Allow Always is unavailable for this command.");
	const info = [];
	info.push(`Host: ${params.host}`);
	if (params.nodeId) info.push(`Node: ${params.nodeId}`);
	if (params.cwd) info.push(`CWD: ${formatApprovalDisplayPath(params.cwd)}`);
	if (typeof params.expiresAtMs === "number" && Number.isFinite(params.expiresAtMs)) info.push(`Expires in: ${formatExecApprovalExpiresIn(params.expiresAtMs, params.nowMs ?? Date.now())}`);
	info.push(`Full id: \`${params.approvalId}\``);
	lines.push(info.join("\n"));
	return {
		text: lines.join("\n\n"),
		presentation: buildApprovalPresentation({
			approvalId: params.approvalId,
			allowedDecisions
		}),
		channelData: { execApproval: {
			approvalId: params.approvalId,
			approvalSlug: params.approvalSlug,
			approvalKind: "exec",
			agentId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId),
			allowedDecisions,
			sessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey)
		} }
	};
}
/** Build an exec approval prompt with canonical typed decision actions. */
function buildTypedExecApprovalPendingReplyPayload(params) {
	return {
		...buildExecApprovalPendingReplyPayload(params),
		presentation: buildTypedExecApprovalPresentation({
			approvalCommandId: params.approvalId,
			allowedDecisions: resolveAllowedDecisions(params)
		})
	};
}
function buildExecApprovalUnavailableReplyPayload(params) {
	const lines = [];
	const warningText = params.warningText?.trim();
	if (warningText) lines.push(warningText);
	if (params.sentApproverDms) {
		lines.push(getExecApprovalApproverDmNoticeText());
		return { text: lines.join("\n\n") };
	}
	if (params.reason === "initiating-platform-disabled") {
		lines.push(`Exec approval is required, but native chat exec approvals are not configured on ${params.channelLabel ?? "this platform"}.`);
		const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
		const setupText = channel && params.channelLabel && require_exec_approval_surface.supportsNativeExecApprovalClient(channel) ? require_exec_approval_surface.describeNativeExecApprovalClientSetup({
			channel,
			channelLabel: params.channelLabel,
			accountId: params.accountId
		}) : null;
		if (setupText) lines.push(setupText);
		else lines.push(buildGenericNativeExecApprovalFallbackText({
			host: params.host,
			nodeId: params.nodeId
		}));
	} else if (params.reason === "initiating-platform-unsupported") {
		lines.push(`Exec approval is required, but ${params.channelLabel ?? "this platform"} does not support chat exec approvals.`);
		lines.push(buildGenericNativeExecApprovalFallbackText({
			excludeChannel: params.channel,
			host: params.host,
			nodeId: params.nodeId
		}));
	} else {
		lines.push("Exec approval is required, but no interactive approval client is currently available.");
		lines.push(`${buildGenericNativeExecApprovalFallbackText({
			host: params.host,
			nodeId: params.nodeId
		})} Then retry the command. You can usually leave execApprovals.approvers unset when owner config already identifies the approvers.`);
	}
	return { text: lines.join("\n\n") };
}
//#endregion
Object.defineProperty(exports, "buildApprovalPresentation", {
	enumerable: true,
	get: function() {
		return buildApprovalPresentation;
	}
});
Object.defineProperty(exports, "buildExecApprovalUnavailableReplyPayload", {
	enumerable: true,
	get: function() {
		return buildExecApprovalUnavailableReplyPayload;
	}
});
Object.defineProperty(exports, "buildTypedApprovalActionDescriptors", {
	enumerable: true,
	get: function() {
		return buildTypedApprovalActionDescriptors;
	}
});
Object.defineProperty(exports, "buildTypedApprovalPresentation", {
	enumerable: true,
	get: function() {
		return buildTypedApprovalPresentation;
	}
});
Object.defineProperty(exports, "exec_approval_reply_exports", {
	enumerable: true,
	get: function() {
		return exec_approval_reply_exports;
	}
});
Object.defineProperty(exports, "formatExecApprovalExpiresIn", {
	enumerable: true,
	get: function() {
		return formatExecApprovalExpiresIn;
	}
});
