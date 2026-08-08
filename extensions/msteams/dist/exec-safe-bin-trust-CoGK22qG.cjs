const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_executable_path = require("./executable-path-BHxqQqcc.cjs");
const require_shell_wrapper_resolution = require("./shell-wrapper-resolution-DAYpyVkb.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/exec-safe-bin-policy-profiles.ts
const NO_FLAGS$1 = /* @__PURE__ */ new Set();
const DEFAULT_SAFE_BINS = [
	"cut",
	"uniq",
	"head",
	"tail",
	"tr",
	"wc"
];
const toFlagSet = (flags) => {
	if (!flags || flags.length === 0) return NO_FLAGS$1;
	return new Set(flags);
};
function collectKnownLongFlags(allowedValueFlags, deniedFlags, allowedBooleanFlags = NO_FLAGS$1) {
	const known = /* @__PURE__ */ new Set();
	for (const flag of allowedValueFlags) if (flag.startsWith("--")) known.add(flag);
	for (const flag of allowedBooleanFlags) if (flag.startsWith("--")) known.add(flag);
	for (const flag of deniedFlags) if (flag.startsWith("--")) known.add(flag);
	return Array.from(known);
}
function buildLongFlagPrefixMap(knownLongFlags) {
	const prefixMap = /* @__PURE__ */ new Map();
	for (const flag of knownLongFlags) {
		if (!flag.startsWith("--") || flag.length <= 2) continue;
		for (let length = 3; length <= flag.length; length += 1) {
			const prefix = flag.slice(0, length);
			const existing = prefixMap.get(prefix);
			if (existing === void 0) {
				prefixMap.set(prefix, flag);
				continue;
			}
			if (existing !== flag) prefixMap.set(prefix, null);
		}
	}
	return prefixMap;
}
function compileSafeBinProfile(fixture) {
	const allowedValueFlags = toFlagSet(fixture.allowedValueFlags);
	const allowedBooleanFlags = toFlagSet(fixture.allowedBooleanFlags);
	const deniedFlags = toFlagSet(fixture.deniedFlags);
	const knownLongFlags = collectKnownLongFlags(allowedValueFlags, deniedFlags, allowedBooleanFlags);
	return {
		minPositional: fixture.minPositional,
		maxPositional: fixture.maxPositional,
		allowedValueFlags,
		allowedBooleanFlags,
		deniedFlags,
		knownLongFlags,
		knownLongFlagsSet: new Set(knownLongFlags),
		longFlagPrefixMap: buildLongFlagPrefixMap(knownLongFlags)
	};
}
function compileSafeBinProfiles(fixtures) {
	return Object.fromEntries(Object.entries(fixtures).map(([name, fixture]) => [name, compileSafeBinProfile(fixture)]));
}
const SAFE_BIN_PROFILES = compileSafeBinProfiles({
	jq: {
		maxPositional: 1,
		allowedValueFlags: [
			"--arg",
			"--argjson",
			"--argstr"
		],
		deniedFlags: [
			"--argfile",
			"--rawfile",
			"--slurpfile",
			"--from-file",
			"--library-path",
			"-L",
			"-f"
		]
	},
	grep: {
		maxPositional: 0,
		allowedValueFlags: [
			"--regexp",
			"--max-count",
			"--after-context",
			"--before-context",
			"--context",
			"--devices",
			"--binary-files",
			"--exclude",
			"--include",
			"--label",
			"-e",
			"-m",
			"-A",
			"-B",
			"-C",
			"-D"
		],
		deniedFlags: [
			"--file",
			"--exclude-from",
			"--dereference-recursive",
			"--directories",
			"--recursive",
			"-f",
			"-d",
			"-r",
			"-R"
		]
	},
	cut: {
		maxPositional: 0,
		allowedValueFlags: [
			"--bytes",
			"--characters",
			"--fields",
			"--delimiter",
			"--output-delimiter",
			"-b",
			"-c",
			"-f",
			"-d"
		],
		allowedBooleanFlags: [
			"--complement",
			"--only-delimited",
			"--zero-terminated",
			"-n",
			"-s",
			"-z"
		]
	},
	sort: {
		maxPositional: 0,
		allowedValueFlags: [
			"--key",
			"--field-separator",
			"--buffer-size",
			"--parallel",
			"--batch-size",
			"-k",
			"-t",
			"-S"
		],
		deniedFlags: [
			"--compress-program",
			"--files0-from",
			"--output",
			"--random-source",
			"--temporary-directory",
			"-T",
			"-o"
		]
	},
	uniq: {
		maxPositional: 0,
		allowedValueFlags: [
			"--skip-fields",
			"--skip-chars",
			"--check-chars",
			"--group",
			"-f",
			"-s",
			"-w"
		],
		allowedBooleanFlags: [
			"--count",
			"--repeated",
			"--unique",
			"--ignore-case",
			"--zero-terminated",
			"-c",
			"-d",
			"-u",
			"-i",
			"-z"
		]
	},
	head: {
		maxPositional: 0,
		allowedValueFlags: [
			"--lines",
			"--bytes",
			"-n",
			"-c"
		],
		allowedBooleanFlags: [
			"--quiet",
			"--silent",
			"--verbose",
			"--zero-terminated",
			"-q",
			"-v",
			"-z"
		]
	},
	tail: {
		maxPositional: 0,
		allowedValueFlags: [
			"--lines",
			"--bytes",
			"--sleep-interval",
			"--max-unchanged-stats",
			"--pid",
			"-n",
			"-c"
		],
		allowedBooleanFlags: [
			"--quiet",
			"--silent",
			"--verbose",
			"--zero-terminated",
			"-q",
			"-v",
			"-z"
		],
		deniedFlags: [
			"--follow",
			"--retry",
			"-F",
			"-f"
		]
	},
	tr: {
		minPositional: 1,
		maxPositional: 2,
		allowedBooleanFlags: [
			"--complement",
			"--delete",
			"--squeeze-repeats",
			"--truncate-set1",
			"-C",
			"-c",
			"-d",
			"-s",
			"-t"
		]
	},
	wc: {
		maxPositional: 0,
		allowedBooleanFlags: [
			"--bytes",
			"--chars",
			"--lines",
			"--max-line-length",
			"--words",
			"-L",
			"-c",
			"-l",
			"-m",
			"-w"
		],
		deniedFlags: ["--files0-from"]
	}
});
function normalizeSafeBinProfileName(raw) {
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	return name.length > 0 ? name : null;
}
function normalizeFixtureLimit(raw) {
	if (typeof raw !== "number" || !Number.isFinite(raw)) return;
	const next = Math.trunc(raw);
	return next >= 0 ? next : void 0;
}
function normalizeFixtureFlags(flags) {
	if (!Array.isArray(flags) || flags.length === 0) return;
	const normalized = Array.from(new Set(flags.map((flag) => flag.trim()).filter((flag) => flag.length > 0))).toSorted((a, b) => a.localeCompare(b));
	return normalized.length > 0 ? normalized : void 0;
}
function normalizeSafeBinProfileFixture(fixture) {
	const minPositional = normalizeFixtureLimit(fixture.minPositional);
	const maxPositionalRaw = normalizeFixtureLimit(fixture.maxPositional);
	return {
		minPositional,
		maxPositional: minPositional !== void 0 && maxPositionalRaw !== void 0 && maxPositionalRaw < minPositional ? minPositional : maxPositionalRaw,
		allowedValueFlags: normalizeFixtureFlags(fixture.allowedValueFlags),
		deniedFlags: normalizeFixtureFlags(fixture.deniedFlags)
	};
}
function normalizeSafeBinProfileFixtures(fixtures) {
	const normalized = {};
	if (!fixtures) return normalized;
	for (const [rawName, fixture] of Object.entries(fixtures)) {
		const name = normalizeSafeBinProfileName(rawName);
		if (!name) continue;
		normalized[name] = normalizeSafeBinProfileFixture(fixture);
	}
	return normalized;
}
function resolveSafeBinProfiles(fixtures) {
	const normalizedFixtures = normalizeSafeBinProfileFixtures(fixtures);
	if (Object.keys(normalizedFixtures).length === 0) return SAFE_BIN_PROFILES;
	return {
		...SAFE_BIN_PROFILES,
		...compileSafeBinProfiles(normalizedFixtures)
	};
}
//#endregion
//#region src/infra/exec-allowlist-pattern.ts
const GLOB_REGEX_CACHE_LIMIT = 512;
const globRegexCache = /* @__PURE__ */ new Map();
function normalizeMatchTarget(value) {
	if (process.platform === "win32") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value.replace(/^\\\\[?.]\\/, "").replace(/\\/g, "/"));
	const normalized = value.replace(/\\\\/g, "/");
	if (process.platform === "darwin") {
		if (normalized === "/private/var") return "/var";
		if (normalized.startsWith("/private/var/")) return normalized.slice(8);
	}
	return normalized;
}
function tryRealpath(value) {
	try {
		return node_fs.default.realpathSync(value);
	} catch {
		return null;
	}
}
function hasDotPathSegment(value) {
	return value.replace(/\\/g, "/").split("/").some((segment) => segment === "." || segment === "..");
}
function normalizeDotPathSegments(value) {
	return normalizeMatchTarget(process.platform === "win32" ? node_path.default.win32.normalize(value) : node_path.default.posix.normalize(value));
}
function escapeRegExpLiteral(input) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function compileGlobRegex(pattern) {
	const cacheKey = `${process.platform}:${pattern}`;
	const cached = globRegexCache.get(cacheKey);
	if (cached) return cached;
	let regex = "^";
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern.charAt(i);
		if (ch === "*") {
			if (pattern[i + 1] === "*") {
				regex += ".*";
				i += 2;
				continue;
			}
			regex += "[^/]*";
			i += 1;
			continue;
		}
		if (ch === "?") {
			regex += "[^/]";
			i += 1;
			continue;
		}
		regex += escapeRegExpLiteral(ch);
		i += 1;
	}
	regex += "$";
	const compiled = new RegExp(regex, process.platform === "win32" ? "i" : "");
	if (globRegexCache.size >= GLOB_REGEX_CACHE_LIMIT) globRegexCache.clear();
	globRegexCache.set(cacheKey, compiled);
	return compiled;
}
function matchesExecAllowlistPattern(pattern, target) {
	const trimmed = pattern.trim();
	if (!trimmed) return false;
	const expanded = trimmed.startsWith("~") ? require_home_dir.expandHomePrefix(trimmed) : trimmed;
	const hasWildcard = /[*?]/.test(expanded);
	let normalizedPattern = expanded;
	let normalizedTarget = target;
	if (process.platform === "win32" && !hasWildcard) {
		normalizedPattern = tryRealpath(expanded) ?? expanded;
		normalizedTarget = tryRealpath(target) ?? target;
	}
	normalizedPattern = normalizeMatchTarget(normalizedPattern);
	normalizedTarget = normalizeMatchTarget(normalizedTarget);
	if (hasWildcard && hasDotPathSegment(normalizedTarget)) normalizedTarget = normalizeDotPathSegments(normalizedTarget);
	return compileGlobRegex(normalizedPattern).test(normalizedTarget);
}
//#endregion
//#region src/infra/exec-wrapper-trust-plan.ts
function blockedExecWrapperTrustPlan(params) {
	return {
		argv: params.argv,
		policyArgv: params.policyArgv ?? params.argv,
		wrapperChain: params.wrapperChain,
		policyBlocked: true,
		blockedWrapper: params.blockedWrapper,
		shellWrapperExecutable: false,
		shellInlineCommand: null
	};
}
function finalizeExecWrapperTrustPlan(argv, policyArgv, wrapperChain, policyBlocked) {
	const rawExecutable = argv[0]?.trim() ?? "";
	const shellWrapperExecutable = !policyBlocked && rawExecutable.length > 0 && require_shell_wrapper_resolution.isShellWrapperExecutable(rawExecutable);
	return {
		argv,
		policyArgv,
		wrapperChain,
		policyBlocked,
		shellWrapperExecutable,
		shellInlineCommand: shellWrapperExecutable ? require_shell_wrapper_resolution.extractBindableShellWrapperInlineCommand(argv) : null
	};
}
/**
* Resolves transparent dispatch wrappers into the executable that policy should inspect.
* Shell multiplexers keep their original argv as the trust target while exposing the
* nested shell command for shell-specific approval checks.
*/
function resolveExecWrapperTrustPlan(argv, maxDepth = 4, platform = process.platform) {
	let current = argv;
	let policyArgv = argv;
	let sawShellMultiplexer = false;
	const wrapperChain = [];
	for (let depth = 0; depth < maxDepth; depth += 1) {
		const dispatchPlan = require_shell_wrapper_resolution.resolveDispatchWrapperTrustPlan(current, maxDepth - wrapperChain.length, platform);
		if (dispatchPlan.policyBlocked) return blockedExecWrapperTrustPlan({
			argv: dispatchPlan.argv,
			policyArgv: dispatchPlan.argv,
			wrapperChain,
			blockedWrapper: dispatchPlan.blockedWrapper ?? current[0] ?? "unknown"
		});
		if (dispatchPlan.wrappers.length > 0) {
			wrapperChain.push(...dispatchPlan.wrappers);
			current = dispatchPlan.argv;
			if (!sawShellMultiplexer) policyArgv = current;
			if (wrapperChain.length >= maxDepth) break;
			continue;
		}
		const shellMultiplexerUnwrap = require_shell_wrapper_resolution.unwrapKnownShellMultiplexerInvocation(current);
		if (shellMultiplexerUnwrap.kind === "blocked") return blockedExecWrapperTrustPlan({
			argv: current,
			policyArgv,
			wrapperChain,
			blockedWrapper: shellMultiplexerUnwrap.wrapper
		});
		if (shellMultiplexerUnwrap.kind === "unwrapped") {
			wrapperChain.push(shellMultiplexerUnwrap.wrapper);
			if (!sawShellMultiplexer) {
				policyArgv = current;
				sawShellMultiplexer = true;
			}
			current = shellMultiplexerUnwrap.argv;
			if (wrapperChain.length >= maxDepth) break;
			continue;
		}
		break;
	}
	if (wrapperChain.length >= maxDepth) {
		const dispatchOverflow = require_shell_wrapper_resolution.unwrapKnownDispatchWrapperInvocation(current, platform);
		if (dispatchOverflow.kind === "blocked" || dispatchOverflow.kind === "unwrapped") return blockedExecWrapperTrustPlan({
			argv: current,
			policyArgv,
			wrapperChain,
			blockedWrapper: dispatchOverflow.wrapper
		});
		const shellMultiplexerOverflow = require_shell_wrapper_resolution.unwrapKnownShellMultiplexerInvocation(current);
		if (shellMultiplexerOverflow.kind === "blocked" || shellMultiplexerOverflow.kind === "unwrapped") return blockedExecWrapperTrustPlan({
			argv: current,
			policyArgv,
			wrapperChain,
			blockedWrapper: shellMultiplexerOverflow.wrapper
		});
	}
	return finalizeExecWrapperTrustPlan(current, policyArgv, wrapperChain, false);
}
//#endregion
//#region src/infra/exec-command-resolution.ts
function isCommandResolution(resolution) {
	return Boolean(resolution && "execution" in resolution && "policy" in resolution);
}
function tryResolveRealpath(filePath) {
	if (!filePath) return;
	try {
		return node_fs.default.realpathSync(filePath);
	} catch {
		return;
	}
}
function buildExecutableResolution(rawExecutable, params) {
	const resolvedPath = require_executable_path.resolveExecutablePath(rawExecutable, {
		cwd: params.cwd,
		env: params.env
	});
	return {
		rawExecutable,
		resolvedPath,
		resolvedRealPath: tryResolveRealpath(resolvedPath),
		executableName: resolvedPath ? node_path.default.basename(resolvedPath) : rawExecutable
	};
}
function buildCommandResolution(params) {
	const execution = buildExecutableResolution(params.rawExecutable, params);
	const policy = params.policyRawExecutable ? buildExecutableResolution(params.policyRawExecutable, params) : execution;
	const resolution = {
		execution,
		policy,
		effectiveArgv: params.effectiveArgv,
		wrapperChain: params.wrapperChain,
		policyBlocked: params.policyBlocked,
		blockedWrapper: params.blockedWrapper
	};
	return Object.defineProperties(resolution, {
		rawExecutable: { get: () => execution.rawExecutable },
		resolvedPath: { get: () => execution.resolvedPath },
		resolvedRealPath: { get: () => execution.resolvedRealPath },
		executableName: { get: () => execution.executableName },
		policyResolution: { get: () => policy === execution ? void 0 : policy }
	});
}
function resolveCommandResolutionFromArgv(argv, cwd, env, platform = process.platform) {
	const plan = resolveExecWrapperTrustPlan(argv, void 0, platform);
	const effectiveArgv = plan.argv;
	const rawExecutable = effectiveArgv[0]?.trim();
	if (!rawExecutable) return null;
	return buildCommandResolution({
		rawExecutable,
		policyRawExecutable: plan.policyArgv[0]?.trim(),
		effectiveArgv,
		wrapperChain: plan.wrapperChain,
		policyBlocked: plan.policyBlocked,
		blockedWrapper: plan.blockedWrapper,
		cwd,
		env
	});
}
function resolveExecutableCandidatePathFromResolution(resolution, cwd) {
	if (!resolution) return;
	if (resolution.resolvedPath) return resolution.resolvedPath;
	const raw = resolution.rawExecutable?.trim();
	if (!raw) return;
	return require_executable_path.resolveExecutablePathCandidate(raw, {
		cwd,
		requirePathSeparator: true
	});
}
function resolveExecutableTrustPath(resolution, cwd) {
	const realPath = resolution?.resolvedRealPath?.trim();
	if (realPath) return realPath;
	const candidatePath = resolveExecutableCandidatePathFromResolution(resolution, cwd);
	return tryResolveRealpath(candidatePath) ?? candidatePath;
}
function resolveExecutionTargetResolution(resolution) {
	if (!resolution) return null;
	return isCommandResolution(resolution) ? resolution.execution : resolution;
}
function resolvePolicyTargetResolution(resolution) {
	if (!resolution) return null;
	return isCommandResolution(resolution) ? resolution.policy : resolution;
}
function resolveExecutionTargetCandidatePath(resolution, cwd) {
	return resolveExecutableCandidatePathFromResolution(isCommandResolution(resolution) ? resolution.execution : resolution, cwd);
}
function resolveExecutionTargetTrustPath(resolution, cwd) {
	return resolveExecutableTrustPath(isCommandResolution(resolution) ? resolution.execution : resolution, cwd);
}
function resolvePolicyTargetCandidatePath(resolution, cwd) {
	return resolveExecutableCandidatePathFromResolution(isCommandResolution(resolution) ? resolution.policy : resolution, cwd);
}
function resolvePolicyTargetTrustPath(resolution, cwd) {
	return resolveExecutableTrustPath(isCommandResolution(resolution) ? resolution.policy : resolution, cwd);
}
function resolveApprovalAuditTrustPath(resolution, cwd) {
	return resolvePolicyTargetTrustPath(resolution, cwd);
}
function matchArgPattern(argPattern, argv, platform) {
	const sep = argPattern.includes("\0") ? "\0" : " ";
	const argsSlice = argv.slice(1);
	const argsString = sep === "\0" ? argsSlice.length === 0 ? "\0\0" : argsSlice.join(sep) + sep : argsSlice.join(sep);
	try {
		const regex = new RegExp(argPattern);
		if (regex.test(argsString)) return true;
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(platform ?? process.platform).startsWith("win")) {
			const normalized = argsString.replace(/\//g, "\\");
			if (normalized !== argsString && regex.test(normalized)) return true;
		}
		return false;
	} catch {
		return false;
	}
}
function hasPathSelector$1(value) {
	return value.includes("/") || value.includes("\\") || value.includes("~");
}
function matchesExecutableBasenamePattern(pattern, resolution) {
	if (hasPathSelector$1(resolution.rawExecutable)) return false;
	const candidates = /* @__PURE__ */ new Set();
	if (resolution.executableName) candidates.add(resolution.executableName);
	if (resolution.resolvedPath) candidates.add(node_path.default.basename(resolution.resolvedPath));
	return [...candidates].some((candidate) => matchesExecAllowlistPattern(pattern, candidate));
}
function matchAllowlist(entries, resolution, argv, platform) {
	if (!entries.length) return null;
	const bareWild = entries.find((e) => e.pattern?.trim() === "*" && !e.argPattern);
	if (bareWild && resolution) return bareWild;
	if (!resolution?.resolvedPath) return null;
	const trustPath = resolution.resolvedRealPath?.trim() || resolution.resolvedPath;
	if (!trustPath) return null;
	let pathOnlyMatch = null;
	for (const entry of entries) {
		const pattern = entry.pattern?.trim();
		if (!pattern) continue;
		if (!(hasPathSelector$1(pattern) ? matchesExecAllowlistPattern(pattern, trustPath) : pattern !== "*" && matchesExecutableBasenamePattern(pattern, resolution))) continue;
		if (!entry.argPattern) {
			if (!pathOnlyMatch) pathOnlyMatch = entry;
			continue;
		}
		if (argv && matchArgPattern(entry.argPattern, argv, platform)) return entry;
	}
	return pathOnlyMatch;
}
/**
* Tokenizes a single argv entry into a normalized option/positional model.
* Consumers can share this model to keep argv parsing behavior consistent.
*/
function parseExecArgvToken(raw) {
	if (!raw) return {
		kind: "empty",
		raw
	};
	if (raw === "--") return {
		kind: "terminator",
		raw
	};
	if (raw === "-") return {
		kind: "stdin",
		raw
	};
	if (!raw.startsWith("-")) return {
		kind: "positional",
		raw
	};
	if (raw.startsWith("--")) {
		const eqIndex = raw.indexOf("=");
		if (eqIndex > 0) return {
			kind: "option",
			raw,
			style: "long",
			flag: raw.slice(0, eqIndex),
			inlineValue: raw.slice(eqIndex + 1)
		};
		return {
			kind: "option",
			raw,
			style: "long",
			flag: raw
		};
	}
	const cluster = raw.slice(1);
	return {
		kind: "option",
		raw,
		style: "short-cluster",
		cluster,
		flags: cluster.split("").map((entry) => `-${entry}`)
	};
}
//#endregion
//#region src/infra/exec-safe-bin-semantics.ts
const ALWAYS_DENY_SAFE_BIN_SEMANTICS = () => false;
const UNSAFE_SAFE_BIN_WARNINGS = {
	awk: "awk-family interpreters can execute commands, access ENVIRON, and write files, so prefer explicit allowlist entries or approval-gated runs instead of safeBins.",
	jq: "jq can read environment data and load jq code from modules or startup files, so prefer explicit allowlist entries or approval-gated runs instead of safeBins.",
	sed: "sed scripts can execute commands and write files, so prefer explicit allowlist entries or approval-gated runs instead of safeBins."
};
const SAFE_BIN_SEMANTIC_RULES = {
	jq: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.jq
	},
	awk: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.awk
	},
	gawk: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.awk
	},
	mawk: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.awk
	},
	nawk: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.awk
	},
	sed: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.sed
	},
	gsed: {
		validate: ALWAYS_DENY_SAFE_BIN_SEMANTICS,
		configWarning: UNSAFE_SAFE_BIN_WARNINGS.sed
	}
};
/** Normalizes a configured safe-bin entry to its executable basename without Windows suffixes. */
function normalizeSafeBinName(raw) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (!trimmed) return "";
	return (trimmed.split(/[\\/]/).at(-1) ?? trimmed).replace(/\.(?:exe|cmd|bat|com)$/i, "");
}
function getSafeBinSemanticRule(binName) {
	const normalized = typeof binName === "string" ? normalizeSafeBinName(binName) : "";
	return normalized ? SAFE_BIN_SEMANTIC_RULES[normalized] : void 0;
}
/** Applies command-specific semantic gates for executables that are risky as broad safeBins. */
function validateSafeBinSemantics(params) {
	return getSafeBinSemanticRule(params.binName)?.validate?.(params) ?? true;
}
/** Lists configured safeBins that need operator warnings because their semantics are broad. */
function listRiskyConfiguredSafeBins(entries) {
	const hits = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const normalized = normalizeSafeBinName(entry);
		if (!normalized || hits.has(normalized)) continue;
		const warning = getSafeBinSemanticRule(normalized)?.configWarning;
		if (!warning) continue;
		hits.set(normalized, warning);
	}
	return Array.from(hits.entries()).map(([bin, warning]) => ({
		bin,
		warning
	})).toSorted((a, b) => a.bin.localeCompare(b.bin));
}
//#endregion
//#region src/infra/exec-safe-bin-policy-validator.ts
function isPathLikeToken(value) {
	const trimmed = value.trim();
	if (!trimmed) return false;
	if (trimmed === "-") return false;
	if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("~")) return true;
	if (trimmed.startsWith("/")) return true;
	return /^[A-Za-z]:[\\/]/.test(trimmed);
}
function hasGlobToken(value) {
	return /[*?[\]]/.test(value);
}
function hasShellExpansionToken(value) {
	return /\$(?:[A-Za-z0-9_@*?!$#-]|\{|\(|\[)/.test(value);
}
const NO_FLAGS = /* @__PURE__ */ new Set();
function isSafeLiteralToken(value) {
	if (!value || value === "-") return true;
	return !hasGlobToken(value) && !hasShellExpansionToken(value) && !isPathLikeToken(value);
}
function isInvalidValueToken(value) {
	return !value || !isSafeLiteralToken(value);
}
function resolveCanonicalLongFlag(params) {
	if (!params.flag.startsWith("--") || params.flag.length <= 2) return null;
	if (params.knownLongFlagsSet.has(params.flag)) return params.flag;
	return params.longFlagPrefixMap.get(params.flag) ?? null;
}
function consumeLongOptionToken(params) {
	const canonicalFlag = resolveCanonicalLongFlag({
		flag: params.flag,
		knownLongFlagsSet: params.knownLongFlagsSet,
		longFlagPrefixMap: params.longFlagPrefixMap
	});
	if (!canonicalFlag) return -1;
	if (params.deniedFlags.has(canonicalFlag)) return -1;
	const expectsValue = params.allowedValueFlags.has(canonicalFlag);
	if (params.inlineValue !== void 0) {
		if (!expectsValue) return -1;
		return isSafeLiteralToken(params.inlineValue) ? params.index + 1 : -1;
	}
	if (!expectsValue) return params.index + 1;
	return isInvalidValueToken(params.args[params.index + 1]) ? -1 : params.index + 2;
}
function consumeShortOptionClusterToken(params) {
	for (const [j, flag] of params.flags.entries()) {
		if (params.deniedFlags.has(flag)) return -1;
		if (params.allowedValueFlags.has(flag)) {
			const inlineValue = params.cluster.slice(j + 1);
			if (inlineValue) return isSafeLiteralToken(inlineValue) ? params.index + 1 : -1;
			return isInvalidValueToken(params.args[params.index + 1]) ? -1 : params.index + 2;
		}
		if (params.allowedBooleanFlags.has(flag)) continue;
		return -1;
	}
	return params.index + 1;
}
function consumePositionalToken(token, positional) {
	if (!isSafeLiteralToken(token)) return false;
	positional.push(token);
	return true;
}
function validatePositionalCount(positional, profile) {
	const minPositional = profile.minPositional ?? 0;
	if (positional.length < minPositional) return false;
	if (typeof profile.maxPositional === "number" && positional.length > profile.maxPositional) return false;
	return true;
}
function collectPositionalTokens(args, profile) {
	const allowedValueFlags = profile.allowedValueFlags ?? NO_FLAGS;
	const allowedBooleanFlags = profile.allowedBooleanFlags ?? NO_FLAGS;
	const deniedFlags = profile.deniedFlags ?? NO_FLAGS;
	const knownLongFlags = profile.knownLongFlags ?? collectKnownLongFlags(allowedValueFlags, deniedFlags, allowedBooleanFlags);
	const knownLongFlagsSet = profile.knownLongFlagsSet ?? new Set(knownLongFlags);
	const longFlagPrefixMap = profile.longFlagPrefixMap ?? buildLongFlagPrefixMap(knownLongFlags);
	const positional = [];
	let i = 0;
	while (i < args.length) {
		const token = parseExecArgvToken(args[i] ?? "");
		if (token.kind === "empty" || token.kind === "stdin") {
			i += 1;
			continue;
		}
		if (token.kind === "terminator") {
			for (let j = i + 1; j < args.length; j += 1) {
				const rest = args[j];
				if (!rest || rest === "-") continue;
				if (!consumePositionalToken(rest, positional)) return null;
			}
			break;
		}
		if (token.kind === "positional") {
			if (!consumePositionalToken(token.raw, positional)) return null;
			i += 1;
			continue;
		}
		if (token.style === "long") {
			const nextIndex = consumeLongOptionToken({
				args,
				index: i,
				flag: token.flag,
				inlineValue: token.inlineValue,
				allowedValueFlags,
				deniedFlags,
				knownLongFlagsSet,
				longFlagPrefixMap
			});
			if (nextIndex < 0) return null;
			i = nextIndex;
			continue;
		}
		const nextIndex = consumeShortOptionClusterToken({
			args,
			index: i,
			cluster: token.cluster,
			flags: token.flags,
			allowedValueFlags,
			allowedBooleanFlags,
			deniedFlags
		});
		if (nextIndex < 0) return null;
		i = nextIndex;
	}
	return positional;
}
function validateSafeBinArgv(args, profile, options) {
	const positional = collectPositionalTokens(args, profile);
	if (!positional) return false;
	if (!validatePositionalCount(positional, profile)) return false;
	return validateSafeBinSemantics({
		binName: options?.binName,
		positional
	});
}
//#endregion
//#region src/infra/exec-safe-bin-trust.ts
const DEFAULT_SAFE_BIN_TRUSTED_DIRS = ["/bin", "/usr/bin"];
let trustedSafeBinCache = null;
function swapAsciiCase(value) {
	return value.replace(/[A-Za-z]/g, (char) => {
		const lower = char.toLowerCase();
		return char === lower ? char.toUpperCase() : lower;
	});
}
function sameFsObject(a, b) {
	return a.dev === b.dev && a.ino === b.ino;
}
function pathCaseInsensitive(value) {
	let candidate = value;
	for (;;) {
		const swapped = swapAsciiCase(candidate);
		if (swapped !== candidate) try {
			const original = node_fs.default.statSync(candidate);
			try {
				return sameFsObject(original, node_fs.default.statSync(swapped));
			} catch {
				return false;
			}
		} catch {}
		const parent = node_path.default.dirname(candidate);
		if (parent === candidate) return process.platform === "win32";
		candidate = parent;
	}
}
function normalizeTrustComparisonPath(value) {
	const resolved = node_path.default.resolve(value);
	return pathCaseInsensitive(resolved) ? resolved.toLowerCase() : resolved;
}
function normalizeTrustedDir(value, forComparison = true) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	return forComparison ? normalizeTrustComparisonPath(trimmed) : node_path.default.resolve(trimmed);
}
function normalizeTrustedSafeBinDirs(entries) {
	if (!Array.isArray(entries)) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(entries.map((entry) => entry.trim()).filter((entry) => entry.length > 0));
}
function resolveTrustedSafeBinDirs(entries, forComparison = true) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(entries.map((entry) => normalizeTrustedDir(entry, forComparison)).filter((entry) => Boolean(entry)));
}
function hasPathSelector(value) {
	return value.includes("/") || value.includes("\\");
}
function isExecutableSafeBinFile(value) {
	try {
		if (!node_fs.default.statSync(value).isFile()) return false;
		if (process.platform === "win32") return true;
		node_fs.default.accessSync(value, node_fs.default.constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
function resolveTrustedSafeBinTargetDirs(entries, safeBins, forComparison = true) {
	const dirs = [];
	const bins = Array.from(new Set(safeBins.map((entry) => entry.trim()).filter((entry) => entry && !hasPathSelector(entry)))).toSorted();
	if (bins.length === 0) return dirs;
	for (const entry of normalizeTrustedSafeBinDirs(entries)) {
		const dir = node_path.default.resolve(entry);
		for (const bin of bins) {
			const candidate = node_path.default.join(dir, bin);
			if (!isExecutableSafeBinFile(candidate)) continue;
			try {
				const normalized = normalizeTrustedDir(node_path.default.dirname(node_fs.default.realpathSync(candidate)), forComparison);
				if (normalized) dirs.push(normalized);
			} catch {}
		}
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(dirs);
}
function buildTrustedSafeBinCacheKey(entries, safeBins, targetDirs) {
	return `${resolveTrustedSafeBinDirs(normalizeTrustedSafeBinDirs(entries)).join("")}\u0002${(0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(safeBins).join("")}\u0002${targetDirs.join("")}`;
}
function getTrustedSafeBinDirs(params = {}) {
	const baseDirs = params.baseDirs ?? DEFAULT_SAFE_BIN_TRUSTED_DIRS;
	const extraDirs = params.extraDirs ?? [];
	const safeBins = params.safeBins ?? [];
	const entries = [...normalizeTrustedSafeBinDirs(baseDirs), ...normalizeTrustedSafeBinDirs(extraDirs)];
	const targetDirs = resolveTrustedSafeBinTargetDirs(entries, safeBins);
	const key = buildTrustedSafeBinCacheKey(entries, safeBins, targetDirs);
	if (!params.refresh && trustedSafeBinCache?.key === key) return trustedSafeBinCache.dirs;
	const dirs = /* @__PURE__ */ new Set([...resolveTrustedSafeBinDirs(entries), ...targetDirs]);
	trustedSafeBinCache = {
		key,
		dirs
	};
	return dirs;
}
function isTrustedSafeBinPath(params) {
	const trustedDirs = params.trustedDirs ?? getTrustedSafeBinDirs();
	const resolvedDir = normalizeTrustComparisonPath(node_path.default.dirname(node_path.default.resolve(params.resolvedPath)));
	return trustedDirs.has(resolvedDir);
}
function listWritableExplicitTrustedSafeBinDirs(entries) {
	if (process.platform === "win32") return [];
	const resolved = resolveTrustedSafeBinDirs(normalizeTrustedSafeBinDirs(entries), false);
	const hits = [];
	for (const dir of resolved) {
		let stat;
		try {
			stat = node_fs.default.statSync(dir);
		} catch {
			continue;
		}
		if (!stat.isDirectory()) continue;
		const mode = stat.mode & 511;
		const groupWritable = (mode & 16) !== 0;
		const worldWritable = (mode & 2) !== 0;
		if (!groupWritable && !worldWritable) continue;
		hits.push({
			dir,
			groupWritable,
			worldWritable
		});
	}
	return hits;
}
//#endregion
Object.defineProperty(exports, "DEFAULT_SAFE_BINS", {
	enumerable: true,
	get: function() {
		return DEFAULT_SAFE_BINS;
	}
});
Object.defineProperty(exports, "SAFE_BIN_PROFILES", {
	enumerable: true,
	get: function() {
		return SAFE_BIN_PROFILES;
	}
});
Object.defineProperty(exports, "getTrustedSafeBinDirs", {
	enumerable: true,
	get: function() {
		return getTrustedSafeBinDirs;
	}
});
Object.defineProperty(exports, "isTrustedSafeBinPath", {
	enumerable: true,
	get: function() {
		return isTrustedSafeBinPath;
	}
});
Object.defineProperty(exports, "listRiskyConfiguredSafeBins", {
	enumerable: true,
	get: function() {
		return listRiskyConfiguredSafeBins;
	}
});
Object.defineProperty(exports, "listWritableExplicitTrustedSafeBinDirs", {
	enumerable: true,
	get: function() {
		return listWritableExplicitTrustedSafeBinDirs;
	}
});
Object.defineProperty(exports, "matchAllowlist", {
	enumerable: true,
	get: function() {
		return matchAllowlist;
	}
});
Object.defineProperty(exports, "normalizeSafeBinName", {
	enumerable: true,
	get: function() {
		return normalizeSafeBinName;
	}
});
Object.defineProperty(exports, "normalizeSafeBinProfileFixtures", {
	enumerable: true,
	get: function() {
		return normalizeSafeBinProfileFixtures;
	}
});
Object.defineProperty(exports, "normalizeTrustedSafeBinDirs", {
	enumerable: true,
	get: function() {
		return normalizeTrustedSafeBinDirs;
	}
});
Object.defineProperty(exports, "resolveApprovalAuditTrustPath", {
	enumerable: true,
	get: function() {
		return resolveApprovalAuditTrustPath;
	}
});
Object.defineProperty(exports, "resolveCommandResolutionFromArgv", {
	enumerable: true,
	get: function() {
		return resolveCommandResolutionFromArgv;
	}
});
Object.defineProperty(exports, "resolveExecWrapperTrustPlan", {
	enumerable: true,
	get: function() {
		return resolveExecWrapperTrustPlan;
	}
});
Object.defineProperty(exports, "resolveExecutableTrustPath", {
	enumerable: true,
	get: function() {
		return resolveExecutableTrustPath;
	}
});
Object.defineProperty(exports, "resolveExecutionTargetCandidatePath", {
	enumerable: true,
	get: function() {
		return resolveExecutionTargetCandidatePath;
	}
});
Object.defineProperty(exports, "resolveExecutionTargetResolution", {
	enumerable: true,
	get: function() {
		return resolveExecutionTargetResolution;
	}
});
Object.defineProperty(exports, "resolveExecutionTargetTrustPath", {
	enumerable: true,
	get: function() {
		return resolveExecutionTargetTrustPath;
	}
});
Object.defineProperty(exports, "resolvePolicyTargetCandidatePath", {
	enumerable: true,
	get: function() {
		return resolvePolicyTargetCandidatePath;
	}
});
Object.defineProperty(exports, "resolvePolicyTargetResolution", {
	enumerable: true,
	get: function() {
		return resolvePolicyTargetResolution;
	}
});
Object.defineProperty(exports, "resolvePolicyTargetTrustPath", {
	enumerable: true,
	get: function() {
		return resolvePolicyTargetTrustPath;
	}
});
Object.defineProperty(exports, "resolveSafeBinProfiles", {
	enumerable: true,
	get: function() {
		return resolveSafeBinProfiles;
	}
});
Object.defineProperty(exports, "validateSafeBinArgv", {
	enumerable: true,
	get: function() {
		return validateSafeBinArgv;
	}
});
