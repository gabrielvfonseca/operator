const require_channel_config_helpers = require("./channel-config-helpers-B5LadJVY.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_host_env_security = require("./host-env-security-DTRiezH-.cjs");
const require_shell_wrapper_resolution = require("./shell-wrapper-resolution-DAYpyVkb.cjs");
const require_exec_approval_policy_snapshot = require("./exec-approval-policy-snapshot-BH5oRtPM.cjs");
require("./exec-wrapper-resolution-xo37iD2U.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/system-run-normalize.ts
/** Normalizes unknown system-run metadata to a trimmed non-empty string. */
function normalizeNonEmptyString(value) {
	return typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? null : null;
}
/** Coerces array entries to allow-list strings while rejecting non-array inputs. */
function normalizeStringArray(value) {
	return Array.isArray(value) ? require_channel_config_helpers.mapAllowFromEntries(value) : [];
}
//#endregion
//#region src/infra/system-run-approval-binding.ts
function normalizeSystemRunApprovalFileOperand(value) {
	if (value === void 0) return;
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const candidate = value;
	const argvIndex = typeof candidate.argvIndex === "number" && Number.isInteger(candidate.argvIndex) && candidate.argvIndex >= 0 ? candidate.argvIndex : null;
	const filePath = normalizeNonEmptyString(candidate.path);
	const sha256 = normalizeNonEmptyString(candidate.sha256);
	if (argvIndex === null || !filePath || !sha256) return null;
	return {
		argvIndex,
		path: filePath,
		sha256
	};
}
function normalizeSystemRunApprovalPlan(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const candidate = value;
	const argv = normalizeStringArray(candidate.argv);
	if (argv.length === 0) return null;
	const mutableFileOperand = normalizeSystemRunApprovalFileOperand(candidate.mutableFileOperand);
	if (candidate.mutableFileOperand !== void 0 && mutableFileOperand === null) return null;
	const policySnapshot = require_exec_approval_policy_snapshot.normalizeExecApprovalPolicySnapshot(candidate.policySnapshot);
	if (candidate.policySnapshot !== void 0 && policySnapshot === null) return null;
	const commandText = normalizeNonEmptyString(candidate.commandText) ?? normalizeNonEmptyString(candidate.rawCommand);
	if (!commandText) return null;
	return {
		argv,
		cwd: normalizeNonEmptyString(candidate.cwd),
		commandText,
		commandPreview: normalizeNonEmptyString(candidate.commandPreview),
		agentId: normalizeNonEmptyString(candidate.agentId),
		sessionKey: normalizeNonEmptyString(candidate.sessionKey),
		...policySnapshot ? { policySnapshot } : {},
		mutableFileOperand: mutableFileOperand ?? void 0
	};
}
function normalizeSystemRunEnvEntries(env) {
	if (!env || typeof env !== "object" || Array.isArray(env)) return [];
	const entries = [];
	for (const [rawKey, rawValue] of Object.entries(env)) {
		if (typeof rawValue !== "string") continue;
		const key = require_host_env_security.normalizeHostOverrideEnvVarKey(rawKey);
		if (!key) continue;
		entries.push([key, rawValue]);
	}
	entries.sort((a, b) => a[0].localeCompare(b[0]));
	return entries;
}
function hashSystemRunEnvEntries(entries) {
	if (entries.length === 0) return null;
	return require_crypto_digest.sha256Hex(JSON.stringify(entries));
}
function buildSystemRunApprovalEnvBinding(env) {
	const entries = normalizeSystemRunEnvEntries(env);
	return {
		envHash: hashSystemRunEnvEntries(entries),
		envKeys: entries.map(([key]) => key)
	};
}
function buildSystemRunApprovalBinding(params) {
	const envBinding = buildSystemRunApprovalEnvBinding(params.env);
	return {
		binding: {
			argv: normalizeStringArray(params.argv),
			cwd: normalizeNonEmptyString(params.cwd),
			agentId: normalizeNonEmptyString(params.agentId),
			sessionKey: normalizeNonEmptyString(params.sessionKey),
			envHash: envBinding.envHash
		},
		envKeys: envBinding.envKeys
	};
}
function argvMatches(expectedArgv, actualArgv) {
	if (expectedArgv.length === 0 || expectedArgv.length !== actualArgv.length) return false;
	for (let i = 0; i < expectedArgv.length; i += 1) if (expectedArgv[i] !== actualArgv[i]) return false;
	return true;
}
const APPROVAL_REQUEST_MISMATCH_MESSAGE = "approval id does not match request";
function requestMismatch(details) {
	return {
		ok: false,
		code: "APPROVAL_REQUEST_MISMATCH",
		message: APPROVAL_REQUEST_MISMATCH_MESSAGE,
		details
	};
}
function matchSystemRunApprovalEnvHash(params) {
	if (!params.expectedEnvHash && !params.actualEnvHash && params.actualEnvKeys.length > 0) return {
		ok: false,
		code: "APPROVAL_ENV_BINDING_MISSING",
		message: "approval id missing env binding for requested env overrides",
		details: { envKeys: params.actualEnvKeys }
	};
	if (!params.expectedEnvHash && !params.actualEnvHash) return { ok: true };
	if (!params.expectedEnvHash && params.actualEnvHash) return {
		ok: false,
		code: "APPROVAL_ENV_BINDING_MISSING",
		message: "approval id missing env binding for requested env overrides",
		details: { envKeys: params.actualEnvKeys }
	};
	if (params.expectedEnvHash !== params.actualEnvHash) return {
		ok: false,
		code: "APPROVAL_ENV_MISMATCH",
		message: "approval id env binding mismatch",
		details: {
			envKeys: params.actualEnvKeys,
			expectedEnvHash: params.expectedEnvHash,
			actualEnvHash: params.actualEnvHash
		}
	};
	return { ok: true };
}
function matchSystemRunApprovalBinding(params) {
	if (!argvMatches(params.expected.argv, params.actual.argv)) return requestMismatch();
	if (params.expected.cwd !== params.actual.cwd) return requestMismatch();
	if (params.expected.agentId !== params.actual.agentId) return requestMismatch();
	if (params.expected.sessionKey !== params.actual.sessionKey) return requestMismatch();
	return matchSystemRunApprovalEnvHash({
		expectedEnvHash: params.expected.envHash,
		actualEnvHash: params.actual.envHash,
		actualEnvKeys: params.actualEnvKeys
	});
}
function missingSystemRunApprovalBinding(params) {
	return requestMismatch({ envKeys: params.actualEnvKeys });
}
function toSystemRunApprovalMismatchError(params) {
	const details = {
		code: params.match.code,
		runId: params.runId
	};
	if (params.match.details) Object.assign(details, params.match.details);
	return {
		ok: false,
		message: params.match.message,
		details
	};
}
//#endregion
//#region src/infra/system-run-command.ts
/** Format argv with minimal shell-style quoting for display and consistency checks. */
function formatExecCommand(argv) {
	return argv.map((arg) => {
		if (arg.length === 0) return "\"\"";
		if (!/\s|"/.test(arg)) return arg;
		return `"${arg.replace(/"/g, "\\\"")}"`;
	}).join(" ");
}
/** Extract the inline shell payload carried by a shell wrapper argv. */
function extractShellCommandFromArgv(argv) {
	return require_shell_wrapper_resolution.extractShellWrapperCommand(argv).command;
}
const POSIX_OR_POWERSHELL_INLINE_WRAPPER_NAMES = /* @__PURE__ */ new Set([
	"ash",
	"bash",
	"dash",
	"fish",
	"ksh",
	"powershell",
	"pwsh",
	"sh",
	"zsh"
]);
function unwrapShellWrapperArgv(argv) {
	const dispatchUnwrapped = require_shell_wrapper_resolution.unwrapDispatchWrappersForResolution(argv);
	const shellMultiplexer = require_shell_wrapper_resolution.unwrapKnownShellMultiplexerInvocation(dispatchUnwrapped);
	return shellMultiplexer.kind === "unwrapped" ? shellMultiplexer.argv : dispatchUnwrapped;
}
function hasTrailingPositionalArgvAfterInlineCommand(argv) {
	const wrapperArgv = unwrapShellWrapperArgv(argv);
	const token0 = wrapperArgv[0]?.trim();
	if (!token0) return false;
	const wrapper = require_shell_wrapper_resolution.normalizeExecutableToken(token0);
	if (!POSIX_OR_POWERSHELL_INLINE_WRAPPER_NAMES.has(wrapper)) return false;
	const inlineCommandIndex = wrapper === "powershell" || wrapper === "pwsh" ? require_shell_wrapper_resolution.resolvePowerShellInlineCommandMatch(wrapperArgv).valueTokenIndex : require_shell_wrapper_resolution.resolveInlineCommandMatch(wrapperArgv, require_shell_wrapper_resolution.POSIX_INLINE_COMMAND_FLAGS, { allowCombinedC: true }).valueTokenIndex;
	if (inlineCommandIndex === null) return false;
	if ((wrapper === "powershell" || wrapper === "pwsh") && require_shell_wrapper_resolution.isPowerShellInlineRestCommandFlag(wrapperArgv[inlineCommandIndex - 1] ?? "")) return false;
	return wrapperArgv.slice(inlineCommandIndex + 1).some((entry) => entry.trim().length > 0);
}
function buildSystemRunCommandDisplay(argv, rawCommand) {
	const rawlessShellWrapperResolution = require_shell_wrapper_resolution.extractShellWrapperCommand(argv);
	const shellWrapperResolution = rawlessShellWrapperResolution.command === null && rawCommand !== null ? require_shell_wrapper_resolution.extractShellWrapperCommand(argv, rawCommand) : rawlessShellWrapperResolution;
	const shellPayload = shellWrapperResolution.command;
	const shellWrapperPositionalArgv = hasTrailingPositionalArgvAfterInlineCommand(argv);
	const envManipulationBeforeShellWrapper = shellWrapperResolution.isWrapper && require_shell_wrapper_resolution.hasEnvManipulationBeforeShellWrapper(argv);
	return {
		shellPayload,
		commandText: formatExecCommand(argv),
		previewText: shellPayload !== null && !envManipulationBeforeShellWrapper && !shellWrapperPositionalArgv ? shellPayload.trim() : null
	};
}
function normalizeRawCommandText(rawCommand) {
	return typeof rawCommand === "string" && rawCommand.trim().length > 0 ? rawCommand.trim() : null;
}
function validateSystemRunCommandConsistency(params) {
	const raw = normalizeRawCommandText(params.rawCommand);
	const display = buildSystemRunCommandDisplay(params.argv, raw);
	if (raw) {
		const matchesCanonicalArgv = raw === display.commandText;
		const matchesLegacyShellText = params.allowLegacyShellText === true && display.previewText !== null && raw === display.previewText;
		if (!matchesCanonicalArgv && !matchesLegacyShellText) return {
			ok: false,
			message: "INVALID_REQUEST: rawCommand does not match command",
			details: {
				code: "RAW_COMMAND_MISMATCH",
				rawCommand: raw,
				inferred: display.commandText,
				formattedArgv: display.commandText
			}
		};
	}
	return {
		ok: true,
		shellPayload: display.shellPayload,
		commandText: display.commandText,
		previewText: display.previewText
	};
}
/** Resolve request command fields while accepting the legacy shell-preview text. */
function resolveSystemRunCommandRequest(params) {
	return resolveSystemRunCommandWithMode(params, true);
}
function resolveSystemRunCommandWithMode(params, allowLegacyShellText) {
	const raw = normalizeRawCommandText(params.rawCommand);
	const command = Array.isArray(params.command) ? params.command : [];
	if (command.length === 0) {
		if (raw) return {
			ok: false,
			message: "rawCommand requires params.command",
			details: { code: "MISSING_COMMAND" }
		};
		return {
			ok: true,
			argv: [],
			commandText: "",
			shellPayload: null,
			previewText: null
		};
	}
	const argv = command.map((v) => String(v));
	const validation = validateSystemRunCommandConsistency({
		argv,
		rawCommand: raw,
		allowLegacyShellText
	});
	if (!validation.ok) return {
		ok: false,
		message: validation.message,
		details: validation.details ?? { code: "RAW_COMMAND_MISMATCH" }
	};
	return {
		ok: true,
		argv,
		commandText: validation.commandText,
		shellPayload: validation.shellPayload,
		previewText: validation.previewText
	};
}
//#endregion
//#region src/infra/system-run-approval-context.ts
function normalizeCommandText(value) {
	return typeof value === "string" ? value : "";
}
function normalizeCommandPreview(value, authoritative) {
	const preview = normalizeNonEmptyString(value);
	if (!preview || preview === authoritative) return null;
	return preview;
}
function normalizePreparedRunExecPolicy(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const raw = value;
	const security = raw.security;
	const ask = raw.ask;
	if ((security === "deny" || security === "allowlist" || security === "full") && (ask === "off" || ask === "on-miss" || ask === "always")) return {
		security,
		ask
	};
}
function normalizeAllowAlwaysCoverage(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const raw = value;
	if (!Array.isArray(raw.patterns)) return;
	const patterns = raw.patterns.flatMap((entry) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
		const pattern = normalizeNonEmptyString(entry.pattern);
		if (!pattern) return [];
		const argPattern = normalizeNonEmptyString(entry.argPattern);
		return [{
			pattern,
			...argPattern ? { argPattern } : {}
		}];
	});
	return {
		complete: raw.complete === true,
		patterns
	};
}
function parsePreparedSystemRunPayload(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
	const raw = payload;
	const execPolicy = normalizePreparedRunExecPolicy(raw.execPolicy);
	const allowAlwaysCoverage = normalizeAllowAlwaysCoverage(raw.allowAlwaysCoverage);
	const plan = normalizeSystemRunApprovalPlan(raw.plan);
	if (plan) return {
		plan,
		...execPolicy ? { execPolicy } : {},
		...allowAlwaysCoverage ? { allowAlwaysCoverage } : {}
	};
	if (!raw.plan || typeof raw.plan !== "object" || Array.isArray(raw.plan)) return null;
	const legacyPlan = raw.plan;
	const argv = normalizeStringArray(legacyPlan.argv);
	const commandText = normalizeNonEmptyString(legacyPlan.rawCommand) ?? normalizeNonEmptyString(raw.commandText) ?? normalizeNonEmptyString(raw.cmdText);
	if (argv.length === 0 || !commandText) return null;
	return {
		plan: {
			argv,
			cwd: normalizeNonEmptyString(legacyPlan.cwd),
			commandText,
			commandPreview: normalizeNonEmptyString(legacyPlan.commandPreview),
			agentId: normalizeNonEmptyString(legacyPlan.agentId),
			sessionKey: normalizeNonEmptyString(legacyPlan.sessionKey)
		},
		...execPolicy ? { execPolicy } : {},
		...allowAlwaysCoverage ? { allowAlwaysCoverage } : {}
	};
}
/** Build the approval request context from tool payload fields. */
function resolveSystemRunApprovalRequestContext(params) {
	const normalizedPlan = (normalizeNonEmptyString(params.host) ?? "") === "node" ? normalizeSystemRunApprovalPlan(params.systemRunPlan) : null;
	const fallbackArgv = normalizeStringArray(params.commandArgv);
	const fallbackCommand = normalizeCommandText(params.command);
	const commandText = normalizedPlan ? normalizedPlan.commandText || formatExecCommand(normalizedPlan.argv) : fallbackCommand;
	const commandPreview = normalizedPlan ? normalizeCommandPreview(normalizedPlan.commandPreview ?? fallbackCommand, commandText) : null;
	const plan = normalizedPlan ? {
		...normalizedPlan,
		commandPreview
	} : null;
	return {
		plan,
		commandArgv: plan?.argv ?? (fallbackArgv.length > 0 ? fallbackArgv : void 0),
		commandText,
		commandPreview,
		cwd: plan?.cwd ?? normalizeNonEmptyString(params.cwd),
		agentId: plan?.agentId ?? normalizeNonEmptyString(params.agentId),
		sessionKey: plan?.sessionKey ?? normalizeNonEmptyString(params.sessionKey)
	};
}
/** Build the runtime approval context from already-normalized command inputs. */
function resolveSystemRunApprovalRuntimeContext(params) {
	const normalizedPlan = normalizeSystemRunApprovalPlan(params.plan ?? null);
	if (normalizedPlan) return {
		ok: true,
		plan: normalizedPlan,
		argv: [...normalizedPlan.argv],
		cwd: normalizedPlan.cwd,
		agentId: normalizedPlan.agentId,
		sessionKey: normalizedPlan.sessionKey,
		commandText: normalizedPlan.commandText
	};
	const command = resolveSystemRunCommandRequest({
		command: params.command,
		rawCommand: params.rawCommand
	});
	if (!command.ok) return {
		ok: false,
		message: command.message,
		details: command.details
	};
	return {
		ok: true,
		plan: null,
		argv: command.argv,
		cwd: normalizeNonEmptyString(params.cwd),
		agentId: normalizeNonEmptyString(params.agentId),
		sessionKey: normalizeNonEmptyString(params.sessionKey),
		commandText: command.commandText
	};
}
//#endregion
Object.defineProperty(exports, "buildSystemRunApprovalBinding", {
	enumerable: true,
	get: function() {
		return buildSystemRunApprovalBinding;
	}
});
Object.defineProperty(exports, "buildSystemRunApprovalEnvBinding", {
	enumerable: true,
	get: function() {
		return buildSystemRunApprovalEnvBinding;
	}
});
Object.defineProperty(exports, "extractShellCommandFromArgv", {
	enumerable: true,
	get: function() {
		return extractShellCommandFromArgv;
	}
});
Object.defineProperty(exports, "matchSystemRunApprovalBinding", {
	enumerable: true,
	get: function() {
		return matchSystemRunApprovalBinding;
	}
});
Object.defineProperty(exports, "missingSystemRunApprovalBinding", {
	enumerable: true,
	get: function() {
		return missingSystemRunApprovalBinding;
	}
});
Object.defineProperty(exports, "parsePreparedSystemRunPayload", {
	enumerable: true,
	get: function() {
		return parsePreparedSystemRunPayload;
	}
});
Object.defineProperty(exports, "resolveSystemRunApprovalRequestContext", {
	enumerable: true,
	get: function() {
		return resolveSystemRunApprovalRequestContext;
	}
});
Object.defineProperty(exports, "resolveSystemRunApprovalRuntimeContext", {
	enumerable: true,
	get: function() {
		return resolveSystemRunApprovalRuntimeContext;
	}
});
Object.defineProperty(exports, "resolveSystemRunCommandRequest", {
	enumerable: true,
	get: function() {
		return resolveSystemRunCommandRequest;
	}
});
Object.defineProperty(exports, "toSystemRunApprovalMismatchError", {
	enumerable: true,
	get: function() {
		return toSystemRunApprovalMismatchError;
	}
});
