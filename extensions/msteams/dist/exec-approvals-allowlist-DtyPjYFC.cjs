const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_exec_safe_bin_trust = require("./exec-safe-bin-trust-CoGK22qG.cjs");
const require_shell_wrapper_resolution = require("./shell-wrapper-resolution-DAYpyVkb.cjs");
require("./exec-wrapper-resolution-xo37iD2U.cjs");
const require_extract = require("./extract-D3xT_vMP.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/windows-shell-command.ts
const WINDOWS_UNSUPPORTED_TOKENS = /* @__PURE__ */ new Set([
	"&",
	"|",
	"<",
	">",
	";",
	"^",
	"(",
	")",
	"%",
	"!",
	"`",
	"\n",
	"\r"
]);
const WINDOWS_ALWAYS_UNSAFE_TOKENS = /* @__PURE__ */ new Set([
	"\n",
	"\r",
	"%",
	"`"
]);
function findWindowsUnsupportedToken(command) {
	let inDouble = false;
	for (let i = 0; i < command.length; i++) {
		const ch = command.charAt(i);
		if (ch === "\"") {
			inDouble = !inDouble;
			continue;
		}
		if (ch === "$") {
			const next = command[i + 1];
			if (next !== void 0 && /[A-Za-z_{(?$]/.test(next)) return "$";
			continue;
		}
		if (WINDOWS_UNSUPPORTED_TOKENS.has(ch)) {
			if (inDouble && !WINDOWS_ALWAYS_UNSAFE_TOKENS.has(ch)) continue;
			if (ch === "\n" || ch === "\r") return "newline";
			return ch;
		}
	}
	return null;
}
function tokenizeWindowsSegment(segment) {
	const tokens = [];
	let buf = "";
	let inDouble = false;
	let inSingle = false;
	let wasQuoted = false;
	const pushToken = () => {
		if (buf.length > 0 || wasQuoted) {
			tokens.push(buf);
			buf = "";
		}
		wasQuoted = false;
	};
	for (let i = 0; i < segment.length; i += 1) {
		const ch = segment.charAt(i);
		if (ch === "\"" && !inSingle) {
			if (!inDouble) wasQuoted = true;
			inDouble = !inDouble;
			continue;
		}
		if (ch === "'" && !inDouble) {
			if (inSingle && segment[i + 1] === "'") {
				buf += "'";
				i += 1;
				continue;
			}
			if (!inSingle) wasQuoted = true;
			inSingle = !inSingle;
			continue;
		}
		if (!inDouble && !inSingle && /\s/.test(ch)) {
			pushToken();
			continue;
		}
		buf += ch;
	}
	if (inDouble || inSingle) return null;
	pushToken();
	return tokens.length > 0 ? tokens : null;
}
function stripWindowsShellWrapper(command) {
	const maxDepth = 5;
	let result = command;
	for (let i = 0; i < maxDepth; i++) {
		const previous = result;
		result = stripWindowsShellWrapperOnce(result.trim());
		if (result === previous) break;
	}
	return result;
}
function stripWindowsShellWrapperOnce(command) {
	const psCallMatch = command.match(/^&\s+(.+)$/s);
	if (psCallMatch) return (0, _gabrielvfonseca_normalization_core.expectDefined)(psCallMatch[1], "ps call match capture group 1");
	const psFlags = /(?:-(?!c(?:ommand)?\b|-command\b)\w+(?:\s+(?!-)(?:"[^"]*(?:""[^"]*)*"|'[^']*(?:''[^']*)*'|\S+))?\s+)*/i.source;
	const psCommandFlag = `(?:-command|-c|--command)`;
	const psInvokeMatch = command.match(new RegExp(`^(?:powershell|pwsh)(?:\\.exe)?\\s+${psFlags}${psCommandFlag}\\s+"(.+)"$`, "is"));
	if (psInvokeMatch) return (0, _gabrielvfonseca_normalization_core.expectDefined)(psInvokeMatch[1], "ps invoke match capture group 1").replace(/""/g, "\"");
	const psInvokeSingleQuote = command.match(new RegExp(`^(?:powershell|pwsh)(?:\\.exe)?\\s+${psFlags}${psCommandFlag}\\s+'(.+)'$`, "is"));
	if (psInvokeSingleQuote) return (0, _gabrielvfonseca_normalization_core.expectDefined)(psInvokeSingleQuote[1], "ps invoke single quote capture group 1").replace(/''/g, "'");
	const psInvokeNoQuote = command.match(new RegExp(`^(?:powershell|pwsh)(?:\\.exe)?\\s+${psFlags}${psCommandFlag}\\s+(.+)$`, "is"));
	if (psInvokeNoQuote) return (0, _gabrielvfonseca_normalization_core.expectDefined)(psInvokeNoQuote[1], "ps invoke no quote capture group 1");
	return command;
}
function analyzeWindowsShellCommand(params) {
	const effective = stripWindowsShellWrapper(params.command.trim());
	const unsupported = findWindowsUnsupportedToken(effective);
	if (unsupported) return {
		ok: false,
		reason: `unsupported windows shell token: ${unsupported}`,
		segments: []
	};
	const argv = tokenizeWindowsSegment(effective);
	if (!argv || argv.length === 0) return {
		ok: false,
		reason: "unable to parse windows command",
		segments: []
	};
	return {
		ok: true,
		segments: [{
			raw: params.command,
			argv,
			resolution: require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(argv, params.cwd, params.env, params.platform ?? void 0)
		}]
	};
}
function isWindowsPlatform(platform) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(platform).startsWith("win");
}
const WINDOWS_UNSAFE_CMD_META = /[%`]|\$(?=[A-Za-z_{(?$])/;
function windowsEscapeArg(value) {
	if (value === "") return {
		ok: true,
		escaped: "\"\""
	};
	if (WINDOWS_UNSAFE_CMD_META.test(value)) return { ok: false };
	if (/^[a-zA-Z0-9_./:~\\=-]+$/.test(value)) return {
		ok: true,
		escaped: value
	};
	return {
		ok: true,
		escaped: `"${value.replace(/"/g, "\"\"")}"`
	};
}
function rebuildWindowsShellCommandFromSource(params) {
	const source = stripWindowsShellWrapper(params.command.trim());
	if (!source) return {
		ok: false,
		reason: "empty command"
	};
	const unsupported = findWindowsUnsupportedToken(source);
	if (unsupported) return {
		ok: false,
		reason: `unsupported windows shell token: ${unsupported}`
	};
	const rendered = params.renderSegment(source, 0);
	if (!rendered.ok) return {
		ok: false,
		reason: rendered.reason
	};
	return {
		ok: true,
		command: `& ${rendered.rendered}`,
		segmentCount: 1
	};
}
//#endregion
//#region src/infra/exec-argv-analysis.ts
function analyzeArgvCommand(params) {
	const argv = params.argv.filter((entry) => entry.trim().length > 0);
	if (argv.length === 0) return {
		ok: false,
		reason: "empty argv",
		segments: []
	};
	return {
		ok: true,
		segments: [{
			raw: argv.join(" "),
			argv,
			sourceArgv: [...params.argv],
			resolution: require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(argv, params.cwd, params.env, params.platform ?? void 0)
		}]
	};
}
//#endregion
//#region src/infra/exec-approvals-analysis.ts
function renderWindowsQuotedArgv(argv) {
	const parts = [];
	for (const token of argv) {
		const result = windowsEscapeArg(token);
		if (!result.ok) return {
			ok: false,
			reason: `unsafe windows token: ${token}`
		};
		parts.push(result.escaped);
	}
	return {
		ok: true,
		rendered: parts.join(" ")
	};
}
function resolvePlannedSegmentArgv(segment) {
	if (segment.resolution?.policyBlocked === true) return null;
	const baseArgv = segment.resolution?.effectiveArgv && segment.resolution.effectiveArgv.length > 0 ? segment.resolution.effectiveArgv : segment.argv;
	if (baseArgv.length === 0) return null;
	const argv = [...baseArgv];
	const execution = segment.resolution?.execution;
	const resolvedExecutable = execution?.resolvedRealPath?.trim() ?? execution?.resolvedPath?.trim() ?? "";
	if (resolvedExecutable) argv[0] = resolvedExecutable;
	return argv;
}
function buildEnforcedShellCommand(params) {
	if (params.platform !== "win32") return {
		ok: false,
		reason: "unsupported platform"
	};
	const rebuilt = rebuildWindowsShellCommandFromSource({
		command: params.command,
		renderSegment: (_raw, segmentIndex) => {
			const segment = params.segments[segmentIndex];
			if (!segment) return {
				ok: false,
				reason: "segment mapping failed"
			};
			const argv = resolvePlannedSegmentArgv(segment);
			if (!argv) return {
				ok: false,
				reason: "segment execution plan unavailable"
			};
			return renderWindowsQuotedArgv(argv);
		}
	});
	if (!rebuilt.ok) return {
		ok: false,
		reason: rebuilt.reason
	};
	if (rebuilt.segmentCount !== params.segments.length) return {
		ok: false,
		reason: "segment count mismatch"
	};
	return {
		ok: true,
		command: rebuilt.command
	};
}
//#endregion
//#region src/infra/exec-authorization-plan.ts
const POSIX_SHELL_NAMES = new Set(require_shell_wrapper_resolution.POSIX_SHELL_WRAPPERS);
const PROMPT_ONLY_RISKS = /* @__PURE__ */ new Set([
	"eval",
	"source",
	"alias",
	"shell-wrapper-through-carrier",
	"command-carrier"
]);
const NON_REUSABLE_RISKS = /* @__PURE__ */ new Set(["inline-eval"]);
const UNANALYZABLE_RISKS = /* @__PURE__ */ new Set([
	"command-substitution",
	"dynamic-executable",
	"line-continuation",
	"heredoc",
	"here-string",
	"process-substitution",
	"redirect",
	"syntax-error",
	"function-definition"
]);
const POSITIONAL_CARRIER_BLOCKED_EXECUTABLES = /* @__PURE__ */ new Set(["find", "xargs"]);
const SHELL_WRAPPER_PRELUDE_REASON = "shell-env-assignment";
const UNSUPPORTED_DIRECT_SHELL_TOPOLOGY_SHAPES = /* @__PURE__ */ new Set([
	"background",
	"if",
	"for",
	"while",
	"case",
	"subshell",
	"group"
]);
function normalizePlanningPlatform(platform) {
	switch (platform) {
		case "aix":
		case "android":
		case "cygwin":
		case "darwin":
		case "freebsd":
		case "haiku":
		case "linux":
		case "netbsd":
		case "openbsd":
		case "sunos":
		case "win32": return platform;
		default: return;
	}
}
function commandSegmentFromStep(step, context) {
	return {
		raw: step.text,
		argv: step.argv,
		resolution: require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(step.argv, context.cwd, context.env, context.platform)
	};
}
function commandSegmentFromArgv(argv, context, sourceArgv) {
	return {
		raw: argv.join(" "),
		argv,
		sourceArgv,
		resolution: require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(argv, context.cwd, context.env, context.platform)
	};
}
function authorizationOperatorForTopology(operator) {
	switch (operator.kind) {
		case "and": return "&&";
		case "or": return "||";
		case "pipe":
		case "stderr-pipe": return "pipe";
		case "sequence":
		case "newline-sequence": return ";";
		case "background": return "&";
		default: return operator.kind;
	}
}
function riskInsideStep(risk, step) {
	return risk.span.startIndex >= step.span.startIndex && risk.span.endIndex <= step.span.endIndex;
}
function riskBeforeStepExecutable(risk, step) {
	return riskInsideStep(risk, step) && risk.span.endIndex <= step.executableSpan.startIndex;
}
function stepReasons(step, risks) {
	const reasons = [];
	for (const risk of risks) if (PROMPT_ONLY_RISKS.has(risk.kind) && riskInsideStep(risk, step)) reasons.push(risk.kind);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(reasons);
}
function nonReusableStepReasons(step, risks) {
	const reasons = [];
	for (const risk of risks) if (NON_REUSABLE_RISKS.has(risk.kind) && riskInsideStep(risk, step)) reasons.push(risk.kind);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(reasons);
}
function isShellExpansionDynamicArgument(risk) {
	return risk.kind === "dynamic-argument" && /(?:\$[A-Za-z0-9_@*?#$!-]|\$\{|`|\$\(|[<>]\()/u.test(risk.text);
}
function riskInsidePromptOnlyStep(risk, explanation) {
	return [...explanation.topLevelCommands, ...explanation.nestedCommands].some((step) => riskInsideStep(risk, step) && stepReasons(step, explanation.risks).length > 0);
}
function findUnanalyzableRisk(explanation) {
	return explanation.risks.find((entry) => UNANALYZABLE_RISKS.has(entry.kind)) ?? null;
}
function hasBlockingRisk(explanation) {
	const risk = findUnanalyzableRisk(explanation);
	if (risk) return risk.kind;
	const unsupportedShape = explanation.shapes.find((shape) => UNSUPPORTED_DIRECT_SHELL_TOPOLOGY_SHAPES.has(shape));
	if (unsupportedShape) return unsupportedShape;
	const dynamicArgument = explanation.risks.find((entry) => isShellExpansionDynamicArgument(entry) && !riskInsidePromptOnlyStep(entry, explanation));
	if (dynamicArgument) return dynamicArgument.kind;
	return null;
}
function shellWrapperPreludeReasons(params) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(params.risks.filter((risk) => UNANALYZABLE_RISKS.has(risk.kind) && riskBeforeStepExecutable(risk, params.step)).map((risk) => risk.kind));
}
function isPathScopedExecutableToken$1(token) {
	return token.includes("/") || token.includes("\\");
}
function hasResolvedExecutionPath(segment) {
	const execution = segment.resolution?.execution;
	return Boolean(execution?.resolvedPath?.trim() || execution?.resolvedRealPath?.trim());
}
function isUnresolvedPathScopedExecutable(segment) {
	return isPathScopedExecutableToken$1(segment.argv[0]?.trim() ?? "") && !hasResolvedExecutionPath(segment);
}
function canUseReusableWrapperPayloadCandidates(segments) {
	if (!(segments[0]?.argv[0]?.trim() ?? "")) return false;
	if (segments.some((segment) => isPathScopedExecutableToken$1(segment.argv[0]?.trim() ?? ""))) return false;
	return !segments.some((segment) => require_shell_wrapper_resolution.normalizeExecutableToken(segment.argv[0] ?? "").endsWith("-wrapper"));
}
function isShellExecutable(argv) {
	const executable = require_shell_wrapper_resolution.normalizeExecutableToken(argv[0] ?? "");
	return POSIX_SHELL_NAMES.has(executable);
}
function canUseWrapperShellInvocation(segment) {
	const argv = segment.argv;
	if (isPathScopedExecutableToken$1(argv[0]?.trim() ?? "")) return false;
	return isShellExecutable(argv) && !require_shell_wrapper_resolution.hasPosixInteractiveStartupBeforeInlineCommand(argv, require_shell_wrapper_resolution.POSIX_INLINE_COMMAND_FLAGS) && !require_shell_wrapper_resolution.hasPosixLoginStartupBeforeInlineCommand(argv, require_shell_wrapper_resolution.POSIX_INLINE_COMMAND_FLAGS);
}
function wrapperPrefixForStep(step) {
	const executableStart = Math.max(0, step.executableSpan.startIndex - step.span.startIndex);
	return step.text.slice(0, executableStart);
}
function hasCommandPrelude(step) {
	return /^[A-Za-z_][A-Za-z0-9_]*=/u.test(wrapperPrefixForStep(step).trimStart());
}
function positionalCarrierSteps(params) {
	const inlineMatch = require_shell_wrapper_resolution.resolveInlineCommandMatch(params.wrapper.segment.argv, require_shell_wrapper_resolution.POSIX_INLINE_COMMAND_FLAGS, { allowCombinedC: true });
	if (inlineMatch.valueTokenIndex === null || !inlineMatch.command) return null;
	if (!canUseWrapperShellInvocation(params.wrapper.segment)) return null;
	if (!require_shell_wrapper_resolution.isDirectShellPositionalCarrierCommand(inlineMatch.command)) return null;
	const carriedArgv = params.wrapper.segment.argv.slice(inlineMatch.valueTokenIndex + 1).filter((token) => token.trim().length > 0);
	if (carriedArgv.length === 0) return null;
	const carriedName = require_shell_wrapper_resolution.normalizeExecutableToken(carriedArgv[0] ?? "");
	if (require_shell_wrapper_resolution.isDispatchWrapperExecutable(carriedName) || POSITIONAL_CARRIER_BLOCKED_EXECUTABLES.has(carriedName) || POSIX_SHELL_NAMES.has(carriedName) || carriedName.endsWith("-wrapper")) return null;
	const raw = carriedArgv.join(" ");
	const carriedSpan = {
		startIndex: params.wrapper.step.span.endIndex,
		endIndex: params.wrapper.step.span.endIndex,
		startPosition: params.wrapper.step.span.endPosition,
		endPosition: params.wrapper.step.span.endPosition
	};
	return [{
		step: {
			context: "wrapper-payload",
			executable: carriedArgv[0] ?? "",
			argv: carriedArgv,
			text: raw,
			span: carriedSpan,
			executableSpan: carriedSpan
		},
		segment: commandSegmentFromArgv(carriedArgv, params.context, params.wrapper.segment.sourceArgv)
	}];
}
function shouldPersistCandidate(params) {
	if (params.trustMode !== "executable") return false;
	if (params.relationship === "pipeline" && isShellExecutable(params.segment.argv)) return false;
	return params.segment.resolution?.policyBlocked !== true;
}
function createCandidate(params) {
	const isDirectShellWrapper = params.transport.kind === "direct" && require_shell_wrapper_resolution.extractBindableShellWrapperInlineCommand(params.segment.argv);
	const stepPromptReasons = stepReasons(params.step, params.risks);
	const stepNonReusableReasons = nonReusableStepReasons(params.step, params.risks);
	const preludeReasons = hasCommandPrelude(params.step) ? shellWrapperPreludeReasons({
		step: params.step,
		risks: params.risks
	}) : [];
	if (hasCommandPrelude(params.step) && preludeReasons.length === 0) preludeReasons.push(SHELL_WRAPPER_PRELUDE_REASON);
	const reasons = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		...stepPromptReasons,
		...stepNonReusableReasons,
		...preludeReasons
	]);
	const trustMode = params.segment.resolution?.policyBlocked === true ? "prompt-only" : preludeReasons.length > 0 ? "prompt-only" : isDirectShellWrapper ? "exact-command" : stepPromptReasons.length > 0 ? "prompt-only" : "executable";
	return {
		sourceSegment: params.segment,
		sourceStep: params.step,
		...params.step.id ? { sourceStepId: params.step.id } : {},
		transport: params.transport,
		trustMode,
		allowAlways: stepNonReusableReasons.length === 0 && shouldPersistCandidate({
			segment: params.segment,
			relationship: params.relationship,
			trustMode
		}),
		reasons
	};
}
function finalizeGroup(params) {
	const relationship = params.steps.length > 1 ? "pipeline" : params.relationship;
	return {
		opToNext: params.opToNext,
		candidates: params.steps.map((entry) => createCandidate({
			step: entry.step,
			segment: entry.segment,
			relationship,
			transport: params.transport,
			risks: params.risks
		}))
	};
}
function groupsFromSteps(params) {
	const sorted = params.steps.toSorted((left, right) => left.step.span.startIndex - right.step.span.startIndex);
	const groups = [];
	let current = [];
	const operatorByFromCommandId = /* @__PURE__ */ new Map();
	for (const operator of params.operators ?? []) operatorByFromCommandId.set(operator.fromCommandId, authorizationOperatorForTopology(operator));
	if (sorted.length > 1 && operatorByFromCommandId.size === 0) return [finalizeGroup({
		steps: sorted,
		relationship: "pipeline",
		opToNext: null,
		transport: params.transport,
		risks: params.risks
	})];
	for (const entry of sorted) {
		if (current.length === 0) {
			current = [entry];
			continue;
		}
		const previous = current[current.length - 1];
		if (!previous) {
			current = [entry];
			continue;
		}
		const previousCommandId = previous.step.id;
		const operator = previousCommandId ? operatorByFromCommandId.get(previousCommandId) : void 0;
		if (operator === "pipe") {
			current.push(entry);
			continue;
		}
		const opToNext = operator === "&&" || operator === "||" || operator === ";" || operator === "&" ? operator : ";";
		groups.push(finalizeGroup({
			steps: current,
			relationship: "simple",
			opToNext,
			transport: params.transport,
			risks: params.risks
		}));
		current = [entry];
	}
	if (current.length > 0) groups.push(finalizeGroup({
		steps: current,
		relationship: "simple",
		opToNext: null,
		transport: params.transport,
		risks: params.risks
	}));
	return groups;
}
function shellWrapperRiskForStep(step, risks) {
	return risks.find((entry) => entry.kind === "shell-wrapper" && riskInsideStep(entry, step)) ?? null;
}
function shouldUseWrapperPayload(params) {
	if (params.topLevelSteps.length !== 1 || params.nestedSteps.length === 0) return false;
	const wrapperStep = params.topLevelSteps[0]?.step;
	if (!wrapperStep || !shellWrapperRiskForStep(wrapperStep, params.risks)) return false;
	return canUseReusableWrapperPayloadCandidates((params.wrapperCommandId ? params.nestedSteps.filter((entry) => entry.step.parentCommandId === params.wrapperCommandId) : params.nestedSteps).map((entry) => entry.segment));
}
function applyWrapperPayloadPersistenceBoundary(params) {
	if (!isUnresolvedPathScopedExecutable(params.wrapper.segment)) return params.groups;
	return params.groups.map((group) => ({
		...group,
		candidates: group.candidates.map((candidate) => ({
			...candidate,
			allowAlways: false
		}))
	}));
}
function wrapperPayloadPlan(params) {
	const wrapper = params.topLevelSteps[0];
	if (!wrapper) return null;
	const wrapperRisk = shellWrapperRiskForStep(wrapper.step, params.risks);
	if (!wrapperRisk) return null;
	if (hasCommandPrelude(wrapper.step)) return null;
	if (!canUseWrapperShellInvocation(wrapper.segment)) return null;
	if (!params.allowNestedPayload) return null;
	const carriedSteps = positionalCarrierSteps({
		wrapper,
		context: params.context
	});
	if (carriedSteps) {
		const groups = groupsFromSteps({
			steps: carriedSteps,
			transport: {
				kind: "shell-wrapper",
				wrapperSegment: wrapper.segment,
				wrapperArgv: wrapper.segment.argv,
				wrapperPrefix: wrapperPrefixForStep(wrapper.step),
				inlineCommand: wrapperRisk.payload
			},
			risks: params.risks
		});
		return groups.length > 0 ? applyWrapperPayloadPersistenceBoundary({
			wrapper,
			groups
		}) : null;
	}
	if (!shouldUseWrapperPayload({
		wrapperCommandId: wrapper.step.id,
		topLevelSteps: params.topLevelSteps,
		nestedSteps: params.nestedSteps,
		risks: params.risks
	})) return null;
	const transport = {
		kind: "shell-wrapper",
		wrapperSegment: wrapper.segment,
		wrapperArgv: wrapper.segment.argv,
		wrapperPrefix: wrapperPrefixForStep(wrapper.step),
		inlineCommand: wrapperRisk.payload
	};
	const groups = groupsFromSteps({
		steps: wrapper.step.id ? params.nestedSteps.filter((entry) => entry.step.parentCommandId === wrapper.step.id) : params.nestedSteps,
		operators: wrapper.step.id ? params.operators.filter((operator) => operator.parentCommandId === wrapper.step.id) : params.operators,
		transport,
		risks: params.risks
	});
	return groups.length > 0 ? applyWrapperPayloadPersistenceBoundary({
		wrapper,
		groups
	}) : null;
}
function unanalyzablePlan(params) {
	return {
		ok: false,
		dialect: params.dialect,
		originalCommand: params.command,
		reason: params.reason,
		groups: [],
		operators: []
	};
}
function planFromExplanation(params) {
	const topLevelSteps = params.explanation.topLevelCommands.map((step) => ({
		step,
		segment: commandSegmentFromStep(step, params.context)
	}));
	const nestedSteps = params.explanation.nestedCommands.filter((step) => step.context === "wrapper-payload").map((step) => ({
		step,
		segment: commandSegmentFromStep(step, params.context)
	}));
	const blockingRisk = hasBlockingRisk(params.explanation);
	const unanalyzableRisk = findUnanalyzableRisk(params.explanation);
	const topLevelStep = topLevelSteps[0]?.step;
	const canFallBackToExactWrapper = topLevelSteps.length === 1 && Boolean(topLevelStep && shellWrapperRiskForStep(topLevelStep, params.explanation.risks) && (!unanalyzableRisk || riskInsideStep(unanalyzableRisk, topLevelStep)));
	if (!params.explanation.ok || blockingRisk && !canFallBackToExactWrapper) return unanalyzablePlan({
		dialect: "posix-shell",
		command: params.command,
		reason: blockingRisk ?? "unable to parse command"
	});
	const groups = wrapperPayloadPlan({
		context: params.context,
		allowNestedPayload: !blockingRisk && !params.explanation.shapes.some((shape) => UNSUPPORTED_DIRECT_SHELL_TOPOLOGY_SHAPES.has(shape)),
		topLevelSteps,
		nestedSteps,
		operators: params.explanation.operators ?? [],
		risks: params.explanation.risks
	}) ?? groupsFromSteps({
		steps: topLevelSteps,
		operators: (params.explanation.operators ?? []).filter((operator) => operator.parentCommandId === void 0),
		transport: { kind: "direct" },
		risks: params.explanation.risks
	});
	if (groups.length === 0) return unanalyzablePlan({
		dialect: "posix-shell",
		command: params.command,
		reason: "no commands to authorize"
	});
	return {
		ok: true,
		dialect: "posix-shell",
		originalCommand: params.command,
		groups,
		operators: params.explanation.operators ?? []
	};
}
async function planShellAuthorization(params) {
	if (params.platform === "win32") return unanalyzablePlan({
		dialect: "windows-cmd",
		command: params.command,
		reason: "non-POSIX shell command"
	});
	try {
		const explanation = await require_extract.explainShellCommand(params.command);
		return planFromExplanation({
			command: params.command,
			explanation,
			context: {
				cwd: params.cwd,
				env: params.env,
				platform: normalizePlanningPlatform(params.platform)
			}
		});
	} catch (error) {
		return unanalyzablePlan({
			dialect: "posix-shell",
			command: params.command,
			reason: error instanceof Error ? error.message : "unable to parse command"
		});
	}
}
//#endregion
//#region src/infra/exec-safe-builtins.ts
const DEFAULT_SAFE_BUILTINS = /* @__PURE__ */ new Set([
	":",
	"cd",
	"false",
	"pwd",
	"test",
	"true"
]);
/** Returns true when a parsed POSIX shell segment is one of the closed safe builtin forms. */
function isSafeBuiltinSegment(params) {
	if (isWindowsPlatform(params.platform ?? process.platform)) return false;
	const head = params.segment.argv[0]?.trim().toLowerCase();
	if (!head) return false;
	if (head === "[") return params.segment.argv.at(-1) === "]" || params.segment.raw.trim().endsWith("]");
	return DEFAULT_SAFE_BUILTINS.has(head);
}
//#endregion
//#region src/infra/package-manager-exec-wrapper.ts
const NPM_EXEC_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set([
	"--cache",
	"--loglevel",
	"--package",
	"--prefix",
	"--script-shell",
	"--userconfig",
	"--workspace",
	"-p",
	"-w"
]);
const NPM_EXEC_FLAG_OPTIONS = /* @__PURE__ */ new Set([
	"--no",
	"--quiet",
	"--ws",
	"--workspaces",
	"--yes",
	"-q",
	"-y"
]);
const NPM_EXEC_SUBCOMMANDS = /* @__PURE__ */ new Set(["exec", "x"]);
const PNPM_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set([
	"--config",
	"--dir",
	"--filter",
	"--reporter",
	"--stream",
	"--test-pattern",
	"--workspace-concurrency"
]);
const PNPM_CASE_SENSITIVE_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set(["-C"]);
const PNPM_FLAG_OPTIONS = /* @__PURE__ */ new Set([
	"--aggregate-output",
	"--color",
	"--parallel",
	"--recursive",
	"--silent",
	"--workspace-root",
	"-r",
	"-s",
	"-w"
]);
const PNPM_DLX_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set([
	"--allow-build",
	"--package",
	"-p"
]);
const PNPM_EXEC_SUBCOMMANDS = /* @__PURE__ */ new Set([
	"exec",
	"dlx",
	"node"
]);
const PNPM_SCRIPT_RUN_SUBCOMMANDS = /* @__PURE__ */ new Set([
	"restart",
	"run",
	"start",
	"stop",
	"test"
]);
const PNPM_BUILTIN_NON_EXEC_SUBCOMMANDS = /* @__PURE__ */ new Set([
	"add",
	"audit",
	"bin",
	"config",
	"dedupe",
	"deploy",
	"help",
	"import",
	"init",
	"install",
	"licenses",
	"link",
	"list",
	"outdated",
	"patch",
	"prune",
	"publish",
	"rebuild",
	"remove",
	"root",
	"server",
	"store",
	"unlink",
	"update",
	"view",
	"why"
]);
const YARN_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set(["--cwd"]);
const YARN_FLAG_OPTIONS = /* @__PURE__ */ new Set([
	"--immutable",
	"--silent",
	"-s"
]);
const YARN_DLX_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set(["--package", "-p"]);
const YARN_DLX_FLAG_OPTIONS = /* @__PURE__ */ new Set(["--quiet", "-q"]);
const YARN_EXEC_SUBCOMMANDS = /* @__PURE__ */ new Set(["exec", "dlx"]);
const YARN_BUILTIN_NON_EXEC_SUBCOMMANDS = /* @__PURE__ */ new Set([
	"add",
	"audit",
	"autoclean",
	"bin",
	"cache",
	"check",
	"config",
	"create",
	"dedupe",
	"generate-lock-entry",
	"global",
	"help",
	"import",
	"info",
	"init",
	"install",
	"licenses",
	"link",
	"list",
	"login",
	"logout",
	"outdated",
	"owner",
	"pack",
	"policies",
	"prune",
	"publish",
	"remove",
	"self-update",
	"tag",
	"team",
	"unlink",
	"upgrade",
	"upgrade-interactive",
	"version",
	"versions",
	"why",
	"workspace"
]);
function normalizeOptionFlag(token) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_shell_wrapper_resolution.parseInlineOptionToken(token).name);
}
function containsSubcommandToken(argv, subcommands) {
	return argv.some((token) => subcommands.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(token)));
}
function normalizePackageManagerExecToken(token) {
	return require_shell_wrapper_resolution.normalizeExecutableToken(token).replace(/\.(?:c|m)?js$/i, "");
}
function firstSubcommandAfterOptions(argv, params) {
	let idx = 1;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (token === "--") {
			idx += 1;
			continue;
		}
		if (!token.startsWith("-")) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(token);
		const parsedOption = require_shell_wrapper_resolution.parseInlineOptionToken(token);
		if (params.caseSensitiveOptionsWithValue?.has(parsedOption.name)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		const flag = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsedOption.name);
		if (params.optionsWithValue.has(flag)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (params.flagOptions.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	return null;
}
function unwrapPnpmExecInvocation(argv) {
	let idx = 1;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (token === "--") {
			idx += 1;
			continue;
		}
		if (!token.startsWith("-")) {
			if (token === "exec") {
				if (idx + 1 >= argv.length) return null;
				const tail = argv.slice(idx + 1);
				const normalizedTail = tail[0] === "--" ? tail.slice(1) : tail;
				const firstExecArg = normalizeOptionFlag(normalizedTail[0] ?? "");
				if (firstExecArg === "-c" || firstExecArg === "--shell-mode") return null;
				return normalizedTail.length > 0 ? normalizedTail : null;
			}
			if (token === "dlx") return unwrapPnpmDlxInvocation(argv.slice(idx + 1));
			if (token === "node") {
				const tail = argv.slice(idx + 1);
				return ["node", ...tail[0] === "--" ? tail.slice(1) : tail];
			}
			return null;
		}
		const parsedOption = require_shell_wrapper_resolution.parseInlineOptionToken(token);
		const flag = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsedOption.name);
		if (PNPM_OPTIONS_WITH_VALUE.has(flag) || PNPM_DLX_OPTIONS_WITH_VALUE.has(flag)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (PNPM_CASE_SENSITIVE_OPTIONS_WITH_VALUE.has(parsedOption.name)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (PNPM_FLAG_OPTIONS.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	return null;
}
function unwrapPnpmDlxInvocation(argv) {
	let idx = 0;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (token === "--") {
			const tail = argv.slice(idx + 1);
			return tail.length > 0 ? tail : null;
		}
		if (!token.startsWith("-")) return argv.slice(idx);
		const parsedOption = require_shell_wrapper_resolution.parseInlineOptionToken(token);
		const flag = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsedOption.name);
		if (flag === "-c" || flag === "--shell-mode") return null;
		if (PNPM_OPTIONS_WITH_VALUE.has(flag) || PNPM_DLX_OPTIONS_WITH_VALUE.has(flag)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (PNPM_CASE_SENSITIVE_OPTIONS_WITH_VALUE.has(parsedOption.name)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (PNPM_FLAG_OPTIONS.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	return null;
}
function unwrapDirectPackageExecInvocation(argv) {
	let idx = 1;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (!token.startsWith("-")) return argv.slice(idx);
		const flag = normalizeOptionFlag(token);
		if (flag === "-c" || flag === "--call") return null;
		if (NPM_EXEC_OPTIONS_WITH_VALUE.has(flag)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (NPM_EXEC_FLAG_OPTIONS.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	return null;
}
function unwrapNpmExecInvocation(argv) {
	let idx = 1;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (!token.startsWith("-")) {
			if (!NPM_EXEC_SUBCOMMANDS.has(token)) return null;
			idx += 1;
			break;
		}
		const parsedOption = require_shell_wrapper_resolution.parseInlineOptionToken(token);
		const flag = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsedOption.name);
		if (NPM_EXEC_OPTIONS_WITH_VALUE.has(flag) || parsedOption.name === "-C") {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (NPM_EXEC_FLAG_OPTIONS.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	if (idx >= argv.length) return null;
	const tail = argv.slice(idx);
	if (tail[0] === "--") return tail.length > 1 ? tail.slice(1) : null;
	return unwrapDirectPackageExecInvocation(["npx", ...tail]);
}
function unwrapYarnDlxInvocation(argv) {
	let idx = 0;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (token === "--") {
			const tail = argv.slice(idx + 1);
			return tail.length > 0 ? tail : null;
		}
		if (!token.startsWith("-")) return argv.slice(idx);
		const flag = normalizeOptionFlag(token);
		if (YARN_DLX_OPTIONS_WITH_VALUE.has(flag)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (YARN_DLX_FLAG_OPTIONS.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	return null;
}
function unwrapYarnExecInvocation(argv) {
	let idx = 1;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (token === "--") {
			idx += 1;
			continue;
		}
		if (!token.startsWith("-")) {
			if (token === "exec") {
				const tail = argv.slice(idx + 1);
				const normalizedTail = tail[0] === "--" ? tail.slice(1) : tail;
				return normalizedTail.length > 0 ? normalizedTail : null;
			}
			if (token === "dlx") return unwrapYarnDlxInvocation(argv.slice(idx + 1));
			return null;
		}
		const flag = normalizeOptionFlag(token);
		if (YARN_OPTIONS_WITH_VALUE.has(flag)) {
			idx += token.includes("=") ? 1 : 2;
			continue;
		}
		if (YARN_FLAG_OPTIONS.has(flag)) {
			idx += 1;
			continue;
		}
		return null;
	}
	return null;
}
function resolveKnownPackageManagerExecInvocation(argv) {
	switch (normalizePackageManagerExecToken(argv[0] ?? "")) {
		case "npm": {
			const unwrapped = unwrapNpmExecInvocation(argv);
			if (unwrapped) return {
				kind: "unwrapped",
				argv: unwrapped
			};
			const firstSubcommand = firstSubcommandAfterOptions(argv, {
				optionsWithValue: NPM_EXEC_OPTIONS_WITH_VALUE,
				caseSensitiveOptionsWithValue: /* @__PURE__ */ new Set(["-C"]),
				flagOptions: NPM_EXEC_FLAG_OPTIONS
			});
			return NPM_EXEC_SUBCOMMANDS.has(firstSubcommand ?? "") ? { kind: "unsafe-exec" } : firstSubcommand === null && containsSubcommandToken(argv.slice(1), NPM_EXEC_SUBCOMMANDS) ? { kind: "unsafe-exec" } : { kind: "not-exec" };
		}
		case "npx":
		case "bunx": {
			const unwrapped = unwrapDirectPackageExecInvocation(argv);
			return unwrapped ? {
				kind: "unwrapped",
				argv: unwrapped
			} : { kind: "unsafe-exec" };
		}
		case "pnpm": {
			const unwrapped = unwrapPnpmExecInvocation(argv);
			if (unwrapped) return {
				kind: "unwrapped",
				argv: unwrapped
			};
			const firstSubcommand = firstSubcommandAfterOptions(argv, {
				optionsWithValue: /* @__PURE__ */ new Set([...PNPM_OPTIONS_WITH_VALUE, ...PNPM_DLX_OPTIONS_WITH_VALUE]),
				caseSensitiveOptionsWithValue: PNPM_CASE_SENSITIVE_OPTIONS_WITH_VALUE,
				flagOptions: PNPM_FLAG_OPTIONS
			});
			const detectedKnownExec = PNPM_EXEC_SUBCOMMANDS.has(firstSubcommand ?? "");
			const hiddenKnownExec = firstSubcommand === null && containsSubcommandToken(argv.slice(1), PNPM_EXEC_SUBCOMMANDS);
			const implicitExecShorthand = firstSubcommand !== null && !PNPM_SCRIPT_RUN_SUBCOMMANDS.has(firstSubcommand) && !PNPM_BUILTIN_NON_EXEC_SUBCOMMANDS.has(firstSubcommand);
			return detectedKnownExec || hiddenKnownExec || implicitExecShorthand ? { kind: "unsafe-exec" } : { kind: "not-exec" };
		}
		case "yarn": {
			const unwrapped = unwrapYarnExecInvocation(argv);
			if (unwrapped) return {
				kind: "unwrapped",
				argv: unwrapped
			};
			const firstSubcommand = firstSubcommandAfterOptions(argv, {
				optionsWithValue: /* @__PURE__ */ new Set([...YARN_OPTIONS_WITH_VALUE, ...YARN_DLX_OPTIONS_WITH_VALUE]),
				flagOptions: /* @__PURE__ */ new Set([...YARN_FLAG_OPTIONS, ...YARN_DLX_FLAG_OPTIONS])
			});
			const detectedKnownExec = YARN_EXEC_SUBCOMMANDS.has(firstSubcommand ?? "");
			const hiddenKnownExec = firstSubcommand === null && containsSubcommandToken(argv.slice(1), YARN_EXEC_SUBCOMMANDS);
			const implicitRunOrBin = firstSubcommand !== null && (firstSubcommand === "run" || !YARN_BUILTIN_NON_EXEC_SUBCOMMANDS.has(firstSubcommand));
			return detectedKnownExec || hiddenKnownExec || implicitRunOrBin ? { kind: "unsafe-exec" } : { kind: "not-exec" };
		}
		default: return { kind: "not-package-manager" };
	}
}
//#endregion
//#region src/infra/exec-approvals-allowlist.ts
function hasShellLineContinuation(command) {
	return /\\(?:\r\n|\n|\r)/.test(command);
}
function commandStepToPolicySegment(step, params) {
	return {
		raw: step.text,
		argv: step.argv,
		resolution: require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(step.argv, params.cwd, params.env, params.platform ?? void 0)
	};
}
async function explainShellPolicySegments(params) {
	try {
		const explanation = await require_extract.explainShellCommand(params.command);
		return [...explanation.topLevelCommands, ...explanation.nestedCommands].map((step) => commandStepToPolicySegment(step, params));
	} catch {
		return [];
	}
}
function normalizeSafeBins(entries) {
	if (!Array.isArray(entries)) return /* @__PURE__ */ new Set();
	const normalized = entries.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry)).filter((entry) => entry.length > 0);
	return new Set(normalized);
}
function resolveSafeBins(entries) {
	if (entries === void 0) return normalizeSafeBins(require_exec_safe_bin_trust.DEFAULT_SAFE_BINS);
	return normalizeSafeBins(entries ?? []);
}
function isSafeBinUsage(params) {
	if (isWindowsPlatform(params.platform ?? process.platform)) return false;
	if (params.safeBins.size === 0) return false;
	const resolution = params.resolution;
	const execName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(resolution?.executableName);
	if (!execName) return false;
	if (!params.safeBins.has(execName)) return false;
	const trustPath = require_exec_safe_bin_trust.resolveExecutableTrustPath(resolution);
	if (!trustPath) return false;
	if (!(params.isTrustedSafeBinPathFn ?? require_exec_safe_bin_trust.isTrustedSafeBinPath)({
		resolvedPath: trustPath,
		trustedDirs: params.trustedSafeBinDirs
	})) return false;
	const argv = params.argv.slice(1);
	const profile = (params.safeBinProfiles ?? require_exec_safe_bin_trust.SAFE_BIN_PROFILES)[execName];
	if (!profile) return false;
	return require_exec_safe_bin_trust.validateSafeBinArgv(argv, profile, { binName: execName });
}
function isPathScopedExecutableToken(token) {
	return token.includes("/") || token.includes("\\");
}
function pickExecAllowlistContext(params) {
	return {
		allowlist: params.allowlist,
		safeBins: params.safeBins,
		safeBinProfiles: params.safeBinProfiles,
		cwd: params.cwd,
		env: params.env,
		platform: params.platform,
		trustedSafeBinDirs: params.trustedSafeBinDirs,
		skillBins: params.skillBins,
		autoAllowSkills: params.autoAllowSkills,
		allowShellBuiltins: params.allowShellBuiltins
	};
}
function normalizeSkillBinName(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	return trimmed && trimmed.length > 0 ? trimmed : null;
}
function normalizeSkillBinResolvedPath(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return null;
	const resolved = node_path.default.resolve(trimmed);
	if (process.platform === "win32") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(resolved.replace(/\\/g, "/"));
	return resolved;
}
function buildSkillBinTrustIndex(entries) {
	const trustByName = /* @__PURE__ */ new Map();
	if (!entries || entries.length === 0) return trustByName;
	for (const entry of entries) {
		const name = normalizeSkillBinName(entry.name);
		const resolvedPath = normalizeSkillBinResolvedPath(entry.resolvedPath);
		if (!name || !resolvedPath) continue;
		const paths = trustByName.get(name) ?? /* @__PURE__ */ new Set();
		paths.add(resolvedPath);
		trustByName.set(name, paths);
	}
	return trustByName;
}
function isSkillAutoAllowedSegment(params) {
	if (!params.allowSkills) return false;
	const resolution = params.segment.resolution;
	const execution = require_exec_safe_bin_trust.resolveExecutionTargetResolution(resolution);
	const trustPath = require_exec_safe_bin_trust.resolveExecutionTargetTrustPath(resolution);
	if (!execution?.resolvedPath || !trustPath) return false;
	const rawExecutable = execution.rawExecutable?.trim() ?? "";
	if (!rawExecutable || isPathScopedExecutableToken(rawExecutable)) return false;
	const executableName = normalizeSkillBinName(execution.executableName);
	const resolvedPath = normalizeSkillBinResolvedPath(trustPath);
	if (!executableName || !resolvedPath) return false;
	return Boolean(params.skillBinTrust.get(executableName)?.has(resolvedPath));
}
const MAX_SHELL_WRAPPER_INLINE_EVAL_DEPTH = 3;
const MAX_PACKAGE_MANAGER_EXEC_UNWRAP_DEPTH = 6;
function resolvePackageManagerTrustTargetArgv(argv, platform = process.platform) {
	let current = argv;
	let sawPackageManagerExec = false;
	for (let depth = 0; depth < MAX_PACKAGE_MANAGER_EXEC_UNWRAP_DEPTH; depth += 1) {
		const dispatchPlan = require_shell_wrapper_resolution.resolveDispatchWrapperTrustPlan(current, void 0, platform);
		if (dispatchPlan.policyBlocked) return { kind: "blocked" };
		current = dispatchPlan.argv;
		const packageManagerExec = resolveKnownPackageManagerExecInvocation(current);
		if (packageManagerExec.kind === "unsafe-exec") return { kind: "blocked" };
		if (packageManagerExec.kind !== "unwrapped") return sawPackageManagerExec ? {
			kind: "package-manager",
			argv: current
		} : {
			kind: "not-package-manager",
			argv: current
		};
		sawPackageManagerExec = true;
		current = packageManagerExec.argv;
	}
	return { kind: "blocked" };
}
function resolvePackageManagerAllowlistTargetArgv(argv, platform = process.platform) {
	const packageManagerTarget = resolvePackageManagerTrustTargetArgv(argv, platform);
	if (packageManagerTarget.kind === "blocked") return null;
	if (packageManagerTarget.kind !== "package-manager") return;
	const trustPlan = require_exec_safe_bin_trust.resolveExecWrapperTrustPlan(packageManagerTarget.argv, void 0, platform);
	if (trustPlan.policyBlocked || trustPlan.shellWrapperExecutable && trustPlan.shellInlineCommand) return null;
	return trustPlan.argv;
}
function matchExecutableAllowlistForSegment(params) {
	if (params.isPositionalCarrierInvocation) return null;
	const match = require_exec_safe_bin_trust.matchAllowlist(params.allowlist, params.candidateResolution, params.effectiveArgv, params.platform);
	const hasBoundArgPattern = typeof match?.argPattern === "string" && match.argPattern.trim().length > 0;
	const isBareWildcardMatch = match?.pattern?.trim() === "*" && !hasBoundArgPattern;
	if (params.allowlistTargetIsExecutionTarget && (params.inlineCommand !== null || params.isShellWrapperInvocation && params.effectiveArgv.length > 1) && !hasBoundArgPattern && !isBareWildcardMatch) return null;
	return match;
}
function executableResolutionsReferToSameTarget(left, right) {
	if (!left || !right) return false;
	return left.rawExecutable === right.rawExecutable && left.resolvedPath === right.resolvedPath && left.resolvedRealPath === right.resolvedRealPath && left.executableName === right.executableName;
}
function resolveShellWrapperScriptArgv(params) {
	const scriptBase = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(params.shellScriptCandidatePath));
	const cwdBase = params.cwd?.trim() ? params.cwd.trim() : process.cwd();
	const resolveArgPath = (a) => node_path.default.isAbsolute(a) ? a : node_path.default.resolve(cwdBase, a);
	let idx = params.effectiveArgv.findIndex((a) => resolveArgPath(a) === params.shellScriptCandidatePath);
	if (idx === -1) idx = params.effectiveArgv.findIndex((a) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(a)) === scriptBase);
	const scriptArgs = idx !== -1 ? params.effectiveArgv.slice(idx + 1) : [];
	return [params.shellScriptCandidatePath, ...scriptArgs];
}
function resolvePowerShellFileScriptArgv(params) {
	const argv = resolveSegmentSourceArgv(params.segment);
	if (!Array.isArray(argv) || argv.length < 3) return null;
	const wrapperName = require_shell_wrapper_resolution.normalizeExecutableToken(argv[0] ?? "");
	if (!require_shell_wrapper_resolution.POWERSHELL_WRAPPERS.has(wrapperName)) return null;
	const match = require_shell_wrapper_resolution.resolvePowerShellInlineCommandMatch(argv);
	if (match.valueTokenIndex === null || !match.command) return null;
	if (!require_shell_wrapper_resolution.isPowerShellInlineFileCommandFlag(argv[match.valueTokenIndex - 1] ?? "")) return null;
	const scriptToken = argv[match.valueTokenIndex]?.trim();
	if (!scriptToken) return null;
	const expanded = scriptToken.startsWith("~") ? require_home_dir.expandHomePrefix(scriptToken) : scriptToken;
	const base = params.cwd && params.cwd.trim().length > 0 ? params.cwd : process.cwd();
	return [node_path.default.isAbsolute(expanded) ? expanded : node_path.default.resolve(base, expanded), ...argv.slice(match.valueTokenIndex + 1)];
}
function resolveSegmentSourceArgv(segment) {
	const sourceArgv = segment.sourceArgv;
	if (!Array.isArray(sourceArgv) || sourceArgv.length === 0) return segment.argv;
	const segmentExecutable = require_shell_wrapper_resolution.normalizeExecutableToken(segment.argv[0] ?? "");
	if (!segmentExecutable) return segment.argv;
	if (require_shell_wrapper_resolution.normalizeExecutableToken(sourceArgv[0] ?? "") === segmentExecutable) return sourceArgv;
	const unwrappedSourceArgv = require_shell_wrapper_resolution.unwrapDispatchWrappersForResolution(sourceArgv);
	return require_shell_wrapper_resolution.normalizeExecutableToken(unwrappedSourceArgv[0] ?? "") === segmentExecutable ? unwrappedSourceArgv : segment.argv;
}
function resolveSegmentAllowlistMatch(params) {
	const effectiveArgv = params.segment.resolution?.effectiveArgv && params.segment.resolution.effectiveArgv.length > 0 ? params.segment.resolution.effectiveArgv : params.segment.argv;
	const packageManagerTargetArgv = resolvePackageManagerAllowlistTargetArgv(effectiveArgv, params.context.platform ?? void 0);
	if (packageManagerTargetArgv === null) return {
		effectiveArgv,
		inlineCommand: null,
		match: null
	};
	const matchArgv = packageManagerTargetArgv ?? effectiveArgv;
	const matchResolution = matchArgv === effectiveArgv ? params.segment.resolution : require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(matchArgv, params.context.cwd, params.context.env, params.context.platform ?? void 0);
	const allowlistSegment = matchArgv === params.segment.argv ? params.segment : {
		...params.segment,
		argv: matchArgv,
		resolution: matchResolution
	};
	const executableResolution = require_exec_safe_bin_trust.resolvePolicyTargetResolution(matchResolution);
	const executionResolution = require_exec_safe_bin_trust.resolveExecutionTargetResolution(params.segment.resolution);
	const candidatePath = require_exec_safe_bin_trust.resolvePolicyTargetCandidatePath(matchResolution, params.context.cwd);
	const trustPath = require_exec_safe_bin_trust.resolvePolicyTargetTrustPath(matchResolution, params.context.cwd);
	const candidateResolution = candidatePath && executableResolution ? {
		...executableResolution,
		resolvedPath: candidatePath,
		resolvedRealPath: trustPath
	} : executableResolution;
	const matchExecutionResolution = require_exec_safe_bin_trust.resolveExecutionTargetResolution(matchResolution);
	const inlineCommand = require_shell_wrapper_resolution.extractBindableShellWrapperInlineCommand(allowlistSegment.argv);
	const powerShellFileScriptArgv = resolvePowerShellFileScriptArgv({
		segment: allowlistSegment,
		cwd: params.context.cwd
	});
	const isShellWrapperInvocation = isShellWrapperSegment(allowlistSegment);
	const isPositionalCarrierInvocation = inlineCommand !== null && require_shell_wrapper_resolution.isDirectShellPositionalCarrierCommand(inlineCommand);
	const executableMatch = matchExecutableAllowlistForSegment({
		allowlist: params.context.allowlist,
		candidateResolution,
		effectiveArgv: matchArgv,
		platform: params.context.platform,
		inlineCommand,
		isShellWrapperInvocation,
		isPositionalCarrierInvocation,
		allowlistTargetIsExecutionTarget: executableResolutionsReferToSameTarget(executableResolution, matchExecutionResolution ?? executionResolution)
	});
	const shellPositionalArgvCandidatePath = inlineCommand !== null ? resolveShellWrapperPositionalArgvCandidatePath({
		segment: allowlistSegment,
		cwd: params.context.cwd,
		env: params.context.env,
		platform: params.context.platform
	}) : void 0;
	const shellPositionalArgvMatch = shellPositionalArgvCandidatePath ? require_exec_safe_bin_trust.matchAllowlist(params.context.allowlist, {
		rawExecutable: shellPositionalArgvCandidatePath,
		resolvedPath: shellPositionalArgvCandidatePath,
		resolvedRealPath: resolveCandidateTrustPath(shellPositionalArgvCandidatePath),
		executableName: node_path.default.basename(shellPositionalArgvCandidatePath)
	}, void 0, params.context.platform) : null;
	const shellScriptCandidatePath = powerShellFileScriptArgv?.[0] ?? (inlineCommand === null ? resolveShellWrapperScriptCandidatePath({
		segment: allowlistSegment,
		cwd: params.context.cwd
	}) : void 0);
	const shellScriptArgv = shellScriptCandidatePath ? powerShellFileScriptArgv ?? resolveShellWrapperScriptArgv({
		shellScriptCandidatePath,
		effectiveArgv: matchArgv,
		cwd: params.context.cwd
	}) : null;
	const shellScriptMatch = shellScriptCandidatePath && shellScriptArgv ? require_exec_safe_bin_trust.matchAllowlist(params.context.allowlist, {
		rawExecutable: shellScriptCandidatePath,
		resolvedPath: shellScriptCandidatePath,
		resolvedRealPath: resolveCandidateTrustPath(shellScriptCandidatePath),
		executableName: node_path.default.basename(shellScriptCandidatePath)
	}, shellScriptArgv, params.context.platform) : null;
	return {
		effectiveArgv,
		inlineCommand: powerShellFileScriptArgv ? null : inlineCommand,
		match: executableMatch ?? shellPositionalArgvMatch ?? shellScriptMatch
	};
}
function resolveSegmentSatisfaction(params) {
	if (params.match) return "allowlist";
	if (isSafeBinUsage({
		argv: params.effectiveArgv,
		resolution: require_exec_safe_bin_trust.resolveExecutionTargetResolution(params.segment.resolution),
		safeBins: params.context.safeBins,
		safeBinProfiles: params.context.safeBinProfiles,
		platform: params.context.platform,
		trustedSafeBinDirs: params.context.trustedSafeBinDirs
	})) return "safeBins";
	if (params.context.allowShellBuiltins === true && isSafeBuiltinSegment({
		segment: params.segment,
		platform: params.context.platform
	})) return "safeBuiltins";
	return isSkillAutoAllowedSegment({
		segment: params.segment,
		allowSkills: params.allowSkills,
		skillBinTrust: params.skillBinTrust
	}) ? "skills" : null;
}
function resolveInlineCommandFallback(params) {
	if (params.by !== null || !params.inlineCommand) return null;
	if (!isWindowsPlatform(params.context.platform)) return null;
	return evaluateShellWrapperInlineCommand({
		inlineCommand: params.inlineCommand,
		context: params.context,
		inlineDepth: params.inlineDepth + 1
	});
}
function evaluateShellWrapperInlineCommand(params) {
	if (params.inlineDepth >= MAX_SHELL_WRAPPER_INLINE_EVAL_DEPTH) return null;
	if (hasShellLineContinuation(params.inlineCommand)) return null;
	const analysis = analyzeWindowsShellCommand({
		command: params.inlineCommand,
		cwd: params.context.cwd,
		env: params.context.env,
		platform: params.context.platform
	});
	if (!analysis.ok || analysis.segments.length === 0) return null;
	const matches = [];
	for (const group of resolveAnalysisSegmentGroups(analysis)) {
		const result = evaluateSegments(group, params.context, params.inlineDepth);
		if (!result.satisfied) return null;
		matches.push(...result.matches);
	}
	return {
		matches,
		satisfiedBy: "allowlist"
	};
}
function evaluateSegments(segments, params, inlineDepth = 0) {
	const matches = [];
	const skillBinTrust = buildSkillBinTrustIndex(params.skillBins);
	const allowSkills = params.autoAllowSkills === true && skillBinTrust.size > 0;
	const segmentAllowlistEntries = [];
	const segmentSatisfiedBy = [];
	return {
		satisfied: segments.every((segment) => {
			if (segment.resolution?.policyBlocked === true) {
				segmentAllowlistEntries.push(null);
				segmentSatisfiedBy.push(null);
				return false;
			}
			const { effectiveArgv, inlineCommand, match } = resolveSegmentAllowlistMatch({
				segment,
				context: params
			});
			if (match) matches.push(match);
			segmentAllowlistEntries.push(match ?? null);
			const by = resolveSegmentSatisfaction({
				match,
				segment,
				effectiveArgv,
				context: params,
				allowSkills,
				skillBinTrust
			});
			const inlineResult = resolveInlineCommandFallback({
				by,
				inlineCommand,
				context: params,
				inlineDepth
			});
			if (inlineResult) {
				matches.push(...inlineResult.matches);
				segmentSatisfiedBy.push(inlineResult.satisfiedBy);
				return true;
			}
			segmentSatisfiedBy.push(by);
			return Boolean(by);
		}),
		matches,
		segmentAllowlistEntries,
		segmentSatisfiedBy
	};
}
function resolveAnalysisSegmentGroups(analysis) {
	if (analysis.chains) return analysis.chains;
	return [analysis.segments];
}
function evaluateAuthorizationCandidate(params) {
	if (params.candidate.trustMode === "prompt-only") return {
		match: null,
		satisfiedBy: null
	};
	const { effectiveArgv, match } = resolveSegmentAllowlistMatch({
		segment: params.candidate.sourceSegment,
		context: params.context
	});
	if (match) return {
		match,
		satisfiedBy: "allowlist"
	};
	return {
		match,
		satisfiedBy: resolveSegmentSatisfaction({
			match,
			segment: params.candidate.sourceSegment,
			effectiveArgv,
			context: params.context,
			allowSkills: params.allowSkills,
			skillBinTrust: params.skillBinTrust
		})
	};
}
function evaluateAuthorizationPlanGroup(params) {
	const matches = [];
	const segmentAllowlistEntries = [];
	const segmentSatisfiedBy = [];
	const segments = [];
	let allowlistSatisfied = true;
	for (const candidate of params.group.candidates) {
		const result = evaluateAuthorizationCandidate({
			candidate,
			context: params.context,
			allowSkills: params.allowSkills,
			skillBinTrust: params.skillBinTrust
		});
		if (result.match) matches.push(result.match);
		segments.push(candidate.sourceSegment);
		segmentAllowlistEntries.push(result.match);
		segmentSatisfiedBy.push(result.satisfiedBy);
		if (!result.satisfiedBy) allowlistSatisfied = false;
	}
	return {
		evaluation: {
			allowlistSatisfied,
			allowlistMatches: matches,
			segmentAllowlistEntries,
			segmentSatisfiedBy
		},
		segments
	};
}
function finalizeShellAllowlistEvaluations(params) {
	const allowlistMatches = [];
	const segments = [];
	const segmentAllowlistEntries = [];
	const segmentSatisfiedBy = [];
	let allowlistSatisfied = true;
	for (const { analysis, evaluation } of params.evaluations) {
		segments.push(...analysis.segments);
		allowlistMatches.push(...evaluation.allowlistMatches);
		segmentAllowlistEntries.push(...evaluation.segmentAllowlistEntries);
		segmentSatisfiedBy.push(...evaluation.segmentSatisfiedBy);
		if (!evaluation.allowlistSatisfied) allowlistSatisfied = false;
	}
	return {
		analysisOk: true,
		allowlistSatisfied,
		allowlistMatches,
		segments,
		segmentAllowlistEntries,
		segmentSatisfiedBy,
		...params.authorizationPlan ? { authorizationPlan: params.authorizationPlan } : {}
	};
}
function evaluateAuthorizationPlan(params) {
	const analysisFailure = () => ({
		analysisOk: false,
		allowlistSatisfied: false,
		allowlistMatches: [],
		segments: [],
		segmentAllowlistEntries: [],
		segmentSatisfiedBy: [],
		authorizationPlan: params.plan
	});
	if (!params.plan.ok) return analysisFailure();
	const skillBins = params.context.skillBins ?? [];
	const allowSkills = params.context.autoAllowSkills === true && skillBins.length > 0;
	const skillBinTrust = buildSkillBinTrustIndex(skillBins);
	return finalizeShellAllowlistEvaluations({
		evaluations: params.plan.groups.map((group) => {
			const { evaluation, segments } = evaluateAuthorizationPlanGroup({
				group,
				context: params.context,
				allowSkills,
				skillBinTrust
			});
			return {
				analysis: {
					ok: true,
					segments
				},
				evaluation,
				opToNext: group.opToNext ?? null
			};
		}),
		authorizationPlan: params.plan
	});
}
function evaluateExecAllowlist(params) {
	const allowlistMatches = [];
	const segmentAllowlistEntries = [];
	const segmentSatisfiedBy = [];
	if (!params.analysis.ok || params.analysis.segments.length === 0) return {
		allowlistSatisfied: false,
		allowlistMatches,
		segmentAllowlistEntries,
		segmentSatisfiedBy
	};
	const allowlistContext = pickExecAllowlistContext(params);
	const hasChains = Boolean(params.analysis.chains);
	for (const group of resolveAnalysisSegmentGroups(params.analysis)) {
		const result = evaluateSegments(group, allowlistContext);
		if (!result.satisfied) {
			if (!hasChains) return {
				allowlistSatisfied: false,
				allowlistMatches: result.matches,
				segmentAllowlistEntries: result.segmentAllowlistEntries,
				segmentSatisfiedBy: result.segmentSatisfiedBy
			};
			return {
				allowlistSatisfied: false,
				allowlistMatches: [],
				segmentAllowlistEntries: [],
				segmentSatisfiedBy: []
			};
		}
		allowlistMatches.push(...result.matches);
		segmentAllowlistEntries.push(...result.segmentAllowlistEntries);
		segmentSatisfiedBy.push(...result.segmentSatisfiedBy);
	}
	return {
		allowlistSatisfied: true,
		allowlistMatches,
		segmentAllowlistEntries,
		segmentSatisfiedBy
	};
}
function hasSegmentExecutableMatch(segment, predicate) {
	const execution = require_exec_safe_bin_trust.resolveExecutionTargetResolution(segment.resolution);
	const candidates = [
		execution?.executableName,
		execution?.rawExecutable,
		segment.argv[0]
	];
	for (const candidate of candidates) {
		if (typeof candidate !== "string") continue;
		const trimmed = candidate.trim();
		if (!trimmed) continue;
		if (predicate(trimmed)) return true;
	}
	return false;
}
function isShellWrapperSegment(segment) {
	return hasSegmentExecutableMatch(segment, require_shell_wrapper_resolution.isShellWrapperExecutable);
}
const SHELL_WRAPPER_OPTIONS_WITH_VALUE = /* @__PURE__ */ new Set([
	"-c",
	"--command",
	"-o",
	"-O",
	"+O"
]);
const SHELL_WRAPPER_DISQUALIFYING_SCRIPT_OPTIONS = [
	"--rcfile",
	"--init-file",
	"--startup-file"
];
function hasDisqualifyingShellWrapperScriptOption(token) {
	return SHELL_WRAPPER_DISQUALIFYING_SCRIPT_OPTIONS.some((option) => token === option || token.startsWith(`${option}=`));
}
const POWERSHELL_OPTIONS_WITH_VALUE_RE = /^-(?:executionpolicy|ep|windowstyle|w|workingdirectory|wd|inputformat|outputformat|settingsfile|configurationfile|version|v|psconsolefile|pscf|encodedcommand|en|enc|encodedarguments|ea)$/i;
function resolveShellWrapperScriptCandidatePath(params) {
	if (!isShellWrapperSegment(params.segment)) return;
	const argv = params.segment.argv;
	if (!Array.isArray(argv) || argv.length < 2) return;
	const wrapperName = require_shell_wrapper_resolution.normalizeExecutableToken(argv[0] ?? "");
	const isPowerShell = require_shell_wrapper_resolution.POWERSHELL_WRAPPERS.has(wrapperName);
	let idx = 1;
	while (idx < argv.length) {
		const token = argv[idx]?.trim() ?? "";
		if (!token) {
			idx += 1;
			continue;
		}
		if (token === "--") {
			idx += 1;
			break;
		}
		if (token === "-c" || token === "--command") return;
		if (!isPowerShell && /^-[^-]*c[^-]*$/i.test(token)) return;
		if (token === "-s" || !isPowerShell && /^-[^-]*s[^-]*$/i.test(token)) return;
		if (hasDisqualifyingShellWrapperScriptOption(token)) return;
		if (SHELL_WRAPPER_OPTIONS_WITH_VALUE.has(token)) {
			idx += 2;
			continue;
		}
		if (isPowerShell && POWERSHELL_OPTIONS_WITH_VALUE_RE.test(token)) {
			idx += 2;
			continue;
		}
		if (token.startsWith("-") || token.startsWith("+")) {
			idx += 1;
			continue;
		}
		break;
	}
	const scriptToken = argv[idx]?.trim();
	if (!scriptToken) return;
	if (node_path.default.isAbsolute(scriptToken)) return scriptToken;
	const expanded = scriptToken.startsWith("~") ? require_home_dir.expandHomePrefix(scriptToken) : scriptToken;
	const base = params.cwd && params.cwd.trim().length > 0 ? params.cwd : process.cwd();
	return node_path.default.resolve(base, expanded);
}
function resolveShellWrapperPositionalArgvCandidatePath(params) {
	if (!isShellWrapperSegment(params.segment)) return;
	const argv = params.segment.argv;
	if (!Array.isArray(argv) || argv.length < 4) return;
	const wrapper = require_shell_wrapper_resolution.normalizeExecutableToken(argv[0] ?? "");
	if (![
		"ash",
		"bash",
		"dash",
		"fish",
		"ksh",
		"sh",
		"zsh"
	].includes(wrapper)) return;
	const inlineMatch = require_shell_wrapper_resolution.resolveInlineCommandMatch(argv, require_shell_wrapper_resolution.POSIX_INLINE_COMMAND_FLAGS, { allowCombinedC: true });
	if (inlineMatch.valueTokenIndex === null || !inlineMatch.command) return;
	if (!require_shell_wrapper_resolution.isDirectShellPositionalCarrierCommand(inlineMatch.command)) return;
	const carriedExecutable = argv.slice(inlineMatch.valueTokenIndex + 1).map((token) => token.trim()).find((token) => token.length > 0);
	if (!carriedExecutable) return;
	const carriedName = require_shell_wrapper_resolution.normalizeExecutableToken(carriedExecutable);
	if (require_shell_wrapper_resolution.isDispatchWrapperExecutable(carriedName) || require_shell_wrapper_resolution.isShellWrapperExecutable(carriedName)) return;
	return require_exec_safe_bin_trust.resolveExecutionTargetCandidatePath(require_exec_safe_bin_trust.resolveCommandResolutionFromArgv([carriedExecutable], params.cwd, params.env, params.platform ?? void 0), params.cwd);
}
function escapeRegExpLiteral(input) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildScriptArgPatternFromArgv(argv, scriptPath, cwd, platform) {
	if (!isWindowsPlatform(platform ?? process.platform)) return;
	const scriptBase = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(scriptPath));
	const base = cwd?.trim() ? cwd.trim() : process.cwd();
	const resolveArgPath = (arg) => node_path.default.isAbsolute(arg) ? arg : node_path.default.resolve(base, arg);
	let scriptIdx = argv.findIndex((arg) => resolveArgPath(arg) === scriptPath);
	if (scriptIdx === -1) scriptIdx = argv.findIndex((arg) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(arg)) === scriptBase);
	const normalized = (scriptIdx !== -1 ? argv.slice(scriptIdx + 1) : []).map((a) => a.replace(/\//g, "\\"));
	if (normalized.length === 0) return "^\0\0$";
	return `^${normalized.map(escapeRegExpLiteral).join("\0")}\x00$`;
}
function buildArgPatternFromArgv(argv, platform) {
	if (!isWindowsPlatform(platform ?? process.platform)) return;
	const normalized = argv.slice(1).map((a) => a.replace(/\//g, "\\"));
	if (normalized.length === 0) return "^\0\0$";
	return `^${escapeRegExpLiteral(normalized.join("\0"))}\x00$`;
}
function addAllowAlwaysPattern(out, pattern, argPattern) {
	if (!out.some((p) => p.pattern === pattern && (p.argPattern ?? void 0) === (argPattern ?? void 0))) out.push({
		pattern,
		argPattern
	});
}
function resolveCandidateTrustPath(candidatePath) {
	if (!candidatePath) return;
	return require_exec_safe_bin_trust.resolveExecutableTrustPath({
		rawExecutable: candidatePath,
		resolvedPath: candidatePath,
		executableName: node_path.default.basename(candidatePath)
	});
}
function resolveAllowAlwaysPatternArgv(argv, platform = process.platform) {
	const packageManagerTarget = resolvePackageManagerTrustTargetArgv(argv, platform);
	if (packageManagerTarget.kind === "blocked") return null;
	return packageManagerTarget.argv;
}
function collectAllowAlwaysPatterns(params) {
	if (params.depth >= 3) return;
	const patternArgv = resolveAllowAlwaysPatternArgv(params.segment.argv, params.platform ?? void 0);
	if (!patternArgv) return;
	const trustPlan = require_exec_safe_bin_trust.resolveExecWrapperTrustPlan(patternArgv, void 0, params.platform ?? void 0);
	if (trustPlan.policyBlocked) return;
	const segment = trustPlan.argv === params.segment.argv ? params.segment : {
		raw: trustPlan.argv.join(" "),
		argv: trustPlan.argv,
		sourceArgv: params.segment.sourceArgv,
		resolution: require_exec_safe_bin_trust.resolveCommandResolutionFromArgv(trustPlan.argv, params.cwd, params.env, params.platform ?? void 0)
	};
	const candidatePath = require_exec_safe_bin_trust.resolveExecutionTargetTrustPath(segment.resolution, params.cwd);
	if (!candidatePath) return;
	if (require_extract.isInterpreterLikeAllowlistPattern(candidatePath)) {
		const effectiveArgv = segment.resolution?.effectiveArgv ?? segment.argv;
		if (params.strictInlineEval !== true || require_extract.detectInlineEvalArgv(effectiveArgv) !== null) return;
	}
	if (!trustPlan.shellWrapperExecutable) {
		const argPattern = buildArgPatternFromArgv(segment.argv, params.platform);
		addAllowAlwaysPattern(params.out, candidatePath, argPattern);
		return;
	}
	const powerShellFileScriptArgv = resolvePowerShellFileScriptArgv({
		segment,
		cwd: params.cwd
	});
	const inlineCommand = powerShellFileScriptArgv ? null : trustPlan.shellInlineCommand;
	const positionalArgvPath = inlineCommand !== null ? resolveShellWrapperPositionalArgvCandidatePath({
		segment,
		cwd: params.cwd,
		env: params.env,
		platform: params.platform
	}) : void 0;
	if (positionalArgvPath) {
		addAllowAlwaysPattern(params.out, resolveCandidateTrustPath(positionalArgvPath) ?? positionalArgvPath);
		return;
	}
	if (!inlineCommand) {
		const scriptPath = powerShellFileScriptArgv?.[0] ?? resolveShellWrapperScriptCandidatePath({
			segment,
			cwd: params.cwd
		});
		if (scriptPath) {
			const scriptTrustPath = resolveCandidateTrustPath(scriptPath) ?? scriptPath;
			const argPattern = buildScriptArgPatternFromArgv(powerShellFileScriptArgv ?? segment.argv, scriptPath, params.cwd, params.platform);
			addAllowAlwaysPattern(params.out, scriptTrustPath, argPattern);
		}
		return;
	}
	if (!isWindowsPlatform(params.platform)) return;
	const nested = analyzeWindowsShellCommand({
		command: inlineCommand,
		cwd: params.cwd,
		env: params.env,
		platform: params.platform
	});
	if (!nested.ok || !canUseReusableWrapperPayloadCandidates(nested.segments)) return;
	for (const nestedSegment of nested.segments) collectAllowAlwaysPatterns({
		segment: nestedSegment,
		cwd: params.cwd,
		env: params.env,
		platform: params.platform,
		strictInlineEval: params.strictInlineEval,
		depth: params.depth + 1,
		out: params.out
	});
}
/**
* Derive persisted allowlist patterns for an "allow always" decision.
* When a command is wrapped in a shell (for example `zsh -lc "<cmd>"`),
* persist the inner executable(s) rather than the shell binary.
*/
function resolveAllowAlwaysPatternEntries(params) {
	const patterns = [];
	for (const segment of params.segments) collectAllowAlwaysPatterns({
		segment,
		cwd: params.cwd,
		env: params.env,
		platform: params.platform,
		strictInlineEval: params.strictInlineEval,
		depth: 0,
		out: patterns
	});
	return patterns;
}
/**
* Evaluates allowlist for shell commands (including &&, ||, ;) and returns analysis metadata.
*/
function evaluateShellAllowlist(params) {
	const allowlistContext = {
		...pickExecAllowlistContext(params),
		allowShellBuiltins: true
	};
	const analysisFailure = () => ({
		analysisOk: false,
		allowlistSatisfied: false,
		allowlistMatches: [],
		segments: [],
		segmentAllowlistEntries: [],
		segmentSatisfiedBy: []
	});
	if (hasShellLineContinuation(params.command)) return analysisFailure();
	if (!isWindowsPlatform(params.platform)) return analysisFailure();
	const analysis = analyzeWindowsShellCommand({
		command: params.command,
		cwd: params.cwd,
		env: params.env,
		platform: params.platform
	});
	if (!analysis.ok) return analysisFailure();
	const evaluation = evaluateExecAllowlist({
		analysis,
		...allowlistContext
	});
	return {
		analysisOk: true,
		allowlistSatisfied: evaluation.allowlistSatisfied,
		allowlistMatches: evaluation.allowlistMatches,
		segments: analysis.segments,
		segmentAllowlistEntries: evaluation.segmentAllowlistEntries,
		segmentSatisfiedBy: evaluation.segmentSatisfiedBy
	};
}
async function evaluateShellAllowlistWithAuthorization(params) {
	const allowlistContext = {
		...pickExecAllowlistContext(params),
		allowShellBuiltins: true
	};
	const analysisFailure = (segments = [], authorizationPlan) => ({
		analysisOk: false,
		allowlistSatisfied: false,
		allowlistMatches: [],
		segments,
		segmentAllowlistEntries: [],
		segmentSatisfiedBy: [],
		...authorizationPlan ? { authorizationPlan } : {}
	});
	if (!isWindowsPlatform(params.platform)) {
		const authorizationPlan = await planShellAuthorization({
			command: params.command,
			cwd: params.cwd,
			env: params.env,
			platform: params.platform
		});
		if (!authorizationPlan.ok) return analysisFailure(await explainShellPolicySegments({
			command: params.command,
			cwd: params.cwd,
			env: params.env,
			platform: params.platform
		}), authorizationPlan);
		return evaluateAuthorizationPlan({
			plan: authorizationPlan,
			context: allowlistContext
		});
	}
	return evaluateShellAllowlist(params);
}
//#endregion
Object.defineProperty(exports, "analyzeArgvCommand", {
	enumerable: true,
	get: function() {
		return analyzeArgvCommand;
	}
});
Object.defineProperty(exports, "buildEnforcedShellCommand", {
	enumerable: true,
	get: function() {
		return buildEnforcedShellCommand;
	}
});
Object.defineProperty(exports, "evaluateExecAllowlist", {
	enumerable: true,
	get: function() {
		return evaluateExecAllowlist;
	}
});
Object.defineProperty(exports, "evaluateShellAllowlist", {
	enumerable: true,
	get: function() {
		return evaluateShellAllowlist;
	}
});
Object.defineProperty(exports, "evaluateShellAllowlistWithAuthorization", {
	enumerable: true,
	get: function() {
		return evaluateShellAllowlistWithAuthorization;
	}
});
Object.defineProperty(exports, "isSafeBinUsage", {
	enumerable: true,
	get: function() {
		return isSafeBinUsage;
	}
});
Object.defineProperty(exports, "normalizeSafeBins", {
	enumerable: true,
	get: function() {
		return normalizeSafeBins;
	}
});
Object.defineProperty(exports, "resolveAllowAlwaysPatternEntries", {
	enumerable: true,
	get: function() {
		return resolveAllowAlwaysPatternEntries;
	}
});
Object.defineProperty(exports, "resolvePlannedSegmentArgv", {
	enumerable: true,
	get: function() {
		return resolvePlannedSegmentArgv;
	}
});
Object.defineProperty(exports, "resolveSafeBins", {
	enumerable: true,
	get: function() {
		return resolveSafeBins;
	}
});
