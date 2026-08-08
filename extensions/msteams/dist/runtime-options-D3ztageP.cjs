require("./rolldown-runtime-u92d-OFm.cjs");
const require_task_status = require("./task-status-CjWQHsl4.cjs");
const require_task_owner_access = require("./task-owner-access-C26i741X.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_manager_turn_timeout = require("./manager.turn-timeout-B9btqP_E.cjs");
const require_shared = require("./shared-C-iBBXn5.cjs");
const require_targets = require("./targets-CAV0R_ib.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_acp_core_runtime_session_identifiers = require("@gabrielvfonseca/acp-core/runtime/session-identifiers");
//#region src/auto-reply/reply/commands-acp/runtime-options.ts
async function resolveTargetSessionKeyOrStop(params) {
	const target = await require_targets.resolveAcpTargetSessionKey({
		commandParams: params.commandParams,
		token: params.token
	});
	if (!target.ok) return require_shared.stopWithText(`⚠️ ${target.error}`);
	return target.sessionKey;
}
async function resolveOptionalSingleTargetOrStop(params) {
	const parsed = require_shared.parseOptionalSingleTarget(params.restTokens, params.usage);
	if (!parsed.ok) return require_shared.stopWithText(`⚠️ ${parsed.error}`);
	return await resolveTargetSessionKeyOrStop({
		commandParams: params.commandParams,
		token: parsed.sessionToken
	});
}
async function resolveSingleTargetValueOrStop(params) {
	const parsed = require_shared.parseSingleValueCommandInput(params.restTokens, params.usage);
	if (!parsed.ok) return require_shared.stopWithText(`⚠️ ${parsed.error}`);
	const targetSessionKey = await resolveTargetSessionKeyOrStop({
		commandParams: params.commandParams,
		token: parsed.value.sessionToken
	});
	if (typeof targetSessionKey !== "string") return targetSessionKey;
	return {
		targetSessionKey,
		value: parsed.value.value
	};
}
async function withSingleTargetValue(params) {
	const resolved = await resolveSingleTargetValueOrStop({
		commandParams: params.commandParams,
		restTokens: params.restTokens,
		usage: params.usage
	});
	if (!("targetSessionKey" in resolved)) return resolved;
	return await params.run(resolved);
}
async function handleSingleRuntimeOptionAction(commandParams, restTokens, action) {
	return await withSingleTargetValue({
		commandParams,
		restTokens,
		usage: action.usage,
		run: async ({ targetSessionKey, value }) => await require_shared.withAcpCommandErrorBoundary({
			run: async () => {
				const parsedValue = action.parseValue(value);
				return {
					parsedValue,
					options: await action.update(targetSessionKey, parsedValue)
				};
			},
			fallbackCode: "ACP_TURN_FAILED",
			fallbackMessage: `Could not update ACP ${action.optionLabel}.`,
			onSuccess: ({ parsedValue, options }) => {
				const valueText = action.formatValue?.(parsedValue) ?? String(parsedValue);
				return require_shared.stopWithText(`✅ Updated ACP ${action.optionLabel} for ${targetSessionKey}: ${valueText}. Effective options: ${require_shared.formatRuntimeOptionsText(options)}`);
			}
		})
	});
}
async function handleAcpStatusAction(params, restTokens) {
	const targetSessionKey = await resolveOptionalSingleTargetOrStop({
		commandParams: params,
		restTokens,
		usage: require_shared.ACP_STATUS_USAGE
	});
	if (typeof targetSessionKey !== "string") return targetSessionKey;
	return await require_shared.withAcpCommandErrorBoundary({
		run: async () => await require_manager.getAcpSessionManager().getSessionStatus({
			cfg: params.cfg,
			sessionKey: targetSessionKey
		}),
		fallbackCode: "ACP_TURN_FAILED",
		fallbackMessage: "Could not read ACP session status.",
		onSuccess: (status) => {
			const linkedTask = require_task_owner_access.findLatestTaskForRelatedSessionKeyForOwner({
				relatedSessionKey: status.sessionKey,
				callerOwnerKey: params.sessionKey
			});
			const sessionIdentifierLines = (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpSessionIdentifierLinesFromIdentity)({
				backend: status.backend,
				identity: status.identity
			});
			const taskProgress = require_task_status.sanitizeTaskStatusText(linkedTask?.progressSummary);
			const taskSummary = require_task_status.sanitizeTaskStatusText(linkedTask?.terminalSummary, { errorContext: true });
			const taskError = require_task_status.sanitizeTaskStatusText(linkedTask?.error, { errorContext: true });
			const lastError = require_task_status.sanitizeTaskStatusText(status.lastError, { errorContext: true });
			const runtimeSummary = require_task_status.sanitizeTaskStatusText(status.runtimeStatus?.summary, { errorContext: true });
			const runtimeDetails = require_task_status.sanitizeTaskStatusText(status.runtimeStatus?.details, { errorContext: true });
			const taskUpdatedAt = typeof linkedTask?.lastEventAt === "number" ? (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(linkedTask.lastEventAt) : void 0;
			const lastActivityAt = (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(status.lastActivityAt) ?? "n/a";
			return require_shared.stopWithText([
				"ACP status:",
				"-----",
				`session: ${status.sessionKey}`,
				`backend: ${status.backend}`,
				`agent: ${status.agent}`,
				...sessionIdentifierLines,
				`sessionMode: ${status.mode}`,
				`state: ${status.state}`,
				...linkedTask ? [
					`taskId: ${linkedTask.taskId}`,
					`taskStatus: ${linkedTask.status}`,
					`delivery: ${linkedTask.deliveryStatus}`,
					...taskProgress ? [`taskProgress: ${taskProgress}`] : [],
					...taskSummary ? [`taskSummary: ${taskSummary}`] : [],
					...taskError ? [`taskError: ${taskError}`] : [],
					...taskUpdatedAt ? [`taskUpdatedAt: ${taskUpdatedAt}`] : []
				] : [],
				`runtimeOptions: ${require_shared.formatRuntimeOptionsText(status.runtimeOptions)}`,
				`capabilities: ${require_shared.formatAcpCapabilitiesText(status.capabilities.controls)}`,
				`lastActivityAt: ${lastActivityAt}`,
				...lastError ? [`lastError: ${lastError}`] : [],
				...runtimeSummary ? [`runtime: ${runtimeSummary}`] : [],
				...runtimeDetails ? [`runtimeDetails: ${runtimeDetails}`] : []
			].join("\n"));
		}
	});
}
async function handleAcpSetModeAction(params, restTokens) {
	return await withSingleTargetValue({
		commandParams: params,
		restTokens,
		usage: require_shared.ACP_SET_MODE_USAGE,
		run: async ({ targetSessionKey, value }) => await require_shared.withAcpCommandErrorBoundary({
			run: async () => {
				const runtimeMode = require_manager_turn_timeout.validateRuntimeModeInput(value);
				return {
					runtimeMode,
					options: await require_manager.getAcpSessionManager().setSessionRuntimeMode({
						cfg: params.cfg,
						sessionKey: targetSessionKey,
						runtimeMode
					})
				};
			},
			fallbackCode: "ACP_TURN_FAILED",
			fallbackMessage: "Could not update ACP runtime mode.",
			onSuccess: ({ runtimeMode, options }) => require_shared.stopWithText(`✅ Updated ACP runtime mode for ${targetSessionKey}: ${runtimeMode}. Effective options: ${require_shared.formatRuntimeOptionsText(options)}`)
		})
	});
}
async function handleAcpSetAction(params, restTokens) {
	const parsed = require_shared.parseSetCommandInput(restTokens);
	if (!parsed.ok) return require_shared.stopWithText(`⚠️ ${parsed.error}`);
	const target = await require_targets.resolveAcpTargetSessionKey({
		commandParams: params,
		token: parsed.value.sessionToken
	});
	if (!target.ok) return require_shared.stopWithText(`⚠️ ${target.error}`);
	const key = parsed.value.key.trim();
	const value = parsed.value.value.trim();
	return await require_shared.withAcpCommandErrorBoundary({
		run: async () => {
			if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key) === "cwd") {
				const cwd = require_manager_turn_timeout.validateRuntimeCwdInput(value);
				const options = await require_manager.getAcpSessionManager().updateSessionRuntimeOptions({
					cfg: params.cfg,
					sessionKey: target.sessionKey,
					patch: { cwd }
				});
				return { text: `✅ Updated ACP cwd for ${target.sessionKey}: ${cwd}. Effective options: ${require_shared.formatRuntimeOptionsText(options)}` };
			}
			const validated = require_manager_turn_timeout.validateRuntimeConfigOptionInput(key, value);
			const options = await require_manager.getAcpSessionManager().setSessionConfigOption({
				cfg: params.cfg,
				sessionKey: target.sessionKey,
				key: validated.key,
				value: validated.value
			});
			return { text: `✅ Updated ACP config option for ${target.sessionKey}: ${validated.key}=${validated.value}. Effective options: ${require_shared.formatRuntimeOptionsText(options)}` };
		},
		fallbackCode: "ACP_TURN_FAILED",
		fallbackMessage: "Could not update ACP config option.",
		onSuccess: ({ text }) => require_shared.stopWithText(text)
	});
}
async function handleAcpCwdAction(params, restTokens) {
	return await handleSingleRuntimeOptionAction(params, restTokens, {
		usage: require_shared.ACP_CWD_USAGE,
		optionLabel: "cwd",
		parseValue: require_manager_turn_timeout.validateRuntimeCwdInput,
		update: async (targetSessionKey, value) => await require_manager.getAcpSessionManager().updateSessionRuntimeOptions({
			cfg: params.cfg,
			sessionKey: targetSessionKey,
			patch: { cwd: value }
		})
	});
}
async function handleAcpPermissionsAction(params, restTokens) {
	return await handleSingleRuntimeOptionAction(params, restTokens, {
		usage: require_shared.ACP_PERMISSIONS_USAGE,
		optionLabel: "permissions profile",
		parseValue: require_manager_turn_timeout.validateRuntimePermissionProfileInput,
		update: async (targetSessionKey, value) => await require_manager.getAcpSessionManager().setSessionConfigOption({
			cfg: params.cfg,
			sessionKey: targetSessionKey,
			key: "approval_policy",
			value
		})
	});
}
async function handleAcpTimeoutAction(params, restTokens) {
	return await handleSingleRuntimeOptionAction(params, restTokens, {
		usage: require_shared.ACP_TIMEOUT_USAGE,
		optionLabel: "timeout",
		parseValue: require_manager_turn_timeout.parseRuntimeTimeoutSecondsInput,
		formatValue: (value) => `${value}s`,
		update: async (targetSessionKey, value) => await require_manager.getAcpSessionManager().setSessionConfigOption({
			cfg: params.cfg,
			sessionKey: targetSessionKey,
			key: "timeout",
			value: String(value)
		})
	});
}
async function handleAcpModelAction(params, restTokens) {
	return await handleSingleRuntimeOptionAction(params, restTokens, {
		usage: require_shared.ACP_MODEL_USAGE,
		optionLabel: "model",
		parseValue: require_manager_turn_timeout.validateRuntimeModelInput,
		update: async (targetSessionKey, value) => await require_manager.getAcpSessionManager().setSessionConfigOption({
			cfg: params.cfg,
			sessionKey: targetSessionKey,
			key: "model",
			value
		})
	});
}
async function handleAcpResetOptionsAction(params, restTokens) {
	const targetSessionKey = await resolveOptionalSingleTargetOrStop({
		commandParams: params,
		restTokens,
		usage: require_shared.ACP_RESET_OPTIONS_USAGE
	});
	if (typeof targetSessionKey !== "string") return targetSessionKey;
	return await require_shared.withAcpCommandErrorBoundary({
		run: async () => await require_manager.getAcpSessionManager().resetSessionRuntimeOptions({
			cfg: params.cfg,
			sessionKey: targetSessionKey
		}),
		fallbackCode: "ACP_TURN_FAILED",
		fallbackMessage: "Could not reset ACP runtime options.",
		onSuccess: () => require_shared.stopWithText(`✅ Reset ACP runtime options for ${targetSessionKey}.`)
	});
}
//#endregion
exports.handleAcpCwdAction = handleAcpCwdAction;
exports.handleAcpModelAction = handleAcpModelAction;
exports.handleAcpPermissionsAction = handleAcpPermissionsAction;
exports.handleAcpResetOptionsAction = handleAcpResetOptionsAction;
exports.handleAcpSetAction = handleAcpSetAction;
exports.handleAcpSetModeAction = handleAcpSetModeAction;
exports.handleAcpStatusAction = handleAcpStatusAction;
exports.handleAcpTimeoutAction = handleAcpTimeoutAction;
