const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_command_registration = require("./command-registration-COcka0py.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
require("./private-temp-workspace-CZ5HRjLT.cjs");
const require_tool_images = require("./tool-images-BzMy_EyQ.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_private_file_store = require("./private-file-store-C0DdQCy-.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_availability = require("./availability-BtRDBgBn.cjs");
const require_shell_utils = require("./shell-utils-VLuMOGgy.cjs");
const require_lanes = require("./lanes-CNGMiDO4.cjs");
const require_system_prompt_params = require("./system-prompt-params-Bvd3P1G7.cjs");
const require_images = require("./images-BJHuSgLg.cjs");
const require_os_summary = require("./os-summary-DapJiOfZ.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_ai_internal_shared = require("@gabrielvfonseca/ai/internal/shared");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let _gabrielvfonseca_media_core_constants = require("@gabrielvfonseca/media-core/constants");
let _openclaw_fs_safe_temp = require("@openclaw/fs-safe/temp");
//#region src/agents/cli-runner/toml-inline.ts
/**
* Minimal TOML inline serializer for CLI config overrides.
*/
function escapeTomlString(value) {
	return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}
function formatTomlKey(key) {
	return /^[A-Za-z0-9_-]+$/.test(key) ? key : `"${escapeTomlString(key)}"`;
}
/** Serialize a supported value into TOML inline syntax. */
function serializeTomlInlineValue(value) {
	if (typeof value === "string") return `"${escapeTomlString(value)}"`;
	if (typeof value === "number" || typeof value === "bigint") return String(value);
	if (typeof value === "boolean") return value ? "true" : "false";
	if (Array.isArray(value)) return `[${value.map((entry) => serializeTomlInlineValue(entry)).join(", ")}]`;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return `{ ${Object.entries(value).map(([key, entry]) => `${formatTomlKey(key)} = ${serializeTomlInlineValue(entry)}`).join(", ")} }`;
	throw new Error(`Unsupported TOML inline value: ${String(value)}`);
}
/** Format one CLI config override as `key=value`. */
function formatTomlConfigOverride(key, value) {
	return `${key}=${serializeTomlInlineValue(value)}`;
}
//#endregion
//#region src/agents/cli-runner/log.ts
/**
* Shared logging helpers for CLI backend diagnostics.
*/
/** Subsystem logger for CLI backend execution diagnostics. */
const cliBackendLog = require_subsystem.createSubsystemLogger("agent/cli-backend");
/** Env var that enables CLI backend output logging. */
const CLI_BACKEND_LOG_OUTPUT_ENV = "OPERATOR_CLI_BACKEND_LOG_OUTPUT";
/** Legacy env var accepted for Claude CLI output logging. */
const LEGACY_CLAUDE_CLI_LOG_OUTPUT_ENV = "OPERATOR_CLAUDE_CLI_LOG_OUTPUT";
/** Return a compact byte/hash summary for CLI backend output. */
function formatCliBackendOutputDigest(text) {
	return `outBytes=${Buffer.byteLength(text, "utf8")} outHash=${node_crypto.default.createHash("sha256").update(text).digest("hex").slice(0, 12)}`;
}
//#endregion
//#region src/agents/cli-watchdog-defaults.ts
const CLI_WATCHDOG_MIN_TIMEOUT_MS = 1e3;
const CLI_FRESH_WATCHDOG_DEFAULTS = {
	noOutputTimeoutRatio: .8,
	minMs: 18e4,
	maxMs: 6e5
};
const CLI_RESUME_WATCHDOG_DEFAULTS = {
	noOutputTimeoutRatio: .3,
	minMs: 6e4,
	maxMs: 18e4
};
//#endregion
//#region src/agents/cli-runner/reliability.ts
/**
* Watchdog and supervisor key helpers for CLI runner reliability.
*/
function pickWatchdogProfile(backend, useResume, trigger, hasExplicitRunTimeout) {
	const configured = useResume ? backend.reliability?.watchdog?.resume : backend.reliability?.watchdog?.fresh;
	const defaults = useResume && !configured && (trigger === "cron" || hasExplicitRunTimeout === true) ? CLI_FRESH_WATCHDOG_DEFAULTS : useResume ? CLI_RESUME_WATCHDOG_DEFAULTS : CLI_FRESH_WATCHDOG_DEFAULTS;
	const ratio = (() => {
		const value = configured?.noOutputTimeoutRatio;
		if (typeof value !== "number" || !Number.isFinite(value)) return defaults.noOutputTimeoutRatio;
		return Math.max(.05, Math.min(.95, value));
	})();
	const minMs = (() => {
		const value = configured?.minMs;
		if (typeof value !== "number" || !Number.isFinite(value)) return defaults.minMs;
		return Math.max(CLI_WATCHDOG_MIN_TIMEOUT_MS, Math.floor(value));
	})();
	const maxMs = (() => {
		const value = configured?.maxMs;
		if (typeof value !== "number" || !Number.isFinite(value)) return defaults.maxMs;
		return Math.max(CLI_WATCHDOG_MIN_TIMEOUT_MS, Math.floor(value));
	})();
	return {
		noOutputTimeoutMs: typeof configured?.noOutputTimeoutMs === "number" && Number.isFinite(configured.noOutputTimeoutMs) ? Math.max(CLI_WATCHDOG_MIN_TIMEOUT_MS, Math.floor(configured.noOutputTimeoutMs)) : void 0,
		noOutputTimeoutRatio: ratio,
		minMs: Math.min(minMs, maxMs),
		maxMs: Math.max(minMs, maxMs)
	};
}
/** Resolves the no-output watchdog timeout for a fresh or resumed CLI run. */
function resolveCliNoOutputTimeoutMs(params) {
	const hasExplicitRunTimeout = typeof params.runTimeoutOverrideMs === "number" && Number.isFinite(params.runTimeoutOverrideMs) && params.runTimeoutOverrideMs > 0;
	const profile = pickWatchdogProfile(params.backend, params.useResume, params.trigger, hasExplicitRunTimeout);
	const cap = Math.max(CLI_WATCHDOG_MIN_TIMEOUT_MS, params.timeoutMs - 1e3);
	if (profile.noOutputTimeoutMs !== void 0) return Math.min(profile.noOutputTimeoutMs, cap);
	const computed = Math.floor(params.timeoutMs * profile.noOutputTimeoutRatio);
	const bounded = Math.min(profile.maxMs, Math.max(profile.minMs, computed));
	return Math.min(bounded, cap);
}
function resolveCliRunTimeoutOverrideMs(params) {
	if (params.runTimeoutOverrideMs !== void 0) return params.runTimeoutOverrideMs;
	const configuredTimeoutSeconds = params.config?.agents?.defaults?.timeoutSeconds;
	return params.lane !== require_lanes.AGENT_LANE_SUBAGENT && typeof configuredTimeoutSeconds === "number" && Number.isFinite(configuredTimeoutSeconds) && configuredTimeoutSeconds > 0 ? params.timeoutMs : void 0;
}
/** Builds a supervisor scope key for session-owned CLI processes. */
function buildCliSupervisorScopeKey(params) {
	const commandToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(params.backend.command ?? ""));
	const backendToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.backendId);
	const sessionToken = params.cliSessionId?.trim();
	if (!sessionToken) return;
	return `cli:${backendToken}:${commandToken}:${sessionToken}`;
}
//#endregion
//#region src/agents/cli-runner/helpers.ts
/**
* Shared helpers for CLI runner prompts, args, queueing, sessions, and image
* payload preparation.
*/
const CLI_RUN_QUEUE = new require_keyed_async_queue.KeyedAsyncQueue();
const CLI_IMAGE_SWEEP_TTL_MS = 10080 * 60 * 1e3;
const sweptCliImageRoots = /* @__PURE__ */ new Set();
function isClaudeCliProvider(providerId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId) === "claude-cli";
}
/** Enqueues a CLI run under a backend/session key to prevent unsafe overlap. */
function enqueueCliRun(key, task) {
	return CLI_RUN_QUEUE.enqueue(key, task);
}
/**
* Hashes the (account, agent, auth-profile, session) tuple to a stable owner key
* shared between the CLI run queue (`resolveCliRunQueueKey`) and the Claude live
* session map (`buildClaudeLiveKey`). The two paths must agree byte-for-byte
* within a single process so a fresh queued turn picks up the same live session
* the registry already holds; the golden-hash test below pins the encoding.
*/
function buildClaudeOwnerKey(input) {
	return node_crypto.default.createHash("sha256").update(JSON.stringify({
		agentAccountId: input.agentAccountId,
		agentId: input.agentId,
		authProfileId: input.authProfileId,
		sessionId: input.sessionId,
		sessionKey: input.sessionKey
	})).digest("hex");
}
/** Resolves the serialization key for a CLI backend run. */
function resolveCliRunQueueKey(params) {
	const requiresLiveSessionSerialization = isClaudeCliProvider(params.backendId) && params.liveSession === "claude-stdio";
	if (params.serialize === false && !requiresLiveSessionSerialization) return `${params.backendId}:${params.runId}`;
	if (isClaudeCliProvider(params.backendId)) {
		const ownerKey = params.ownerKey?.trim();
		if (requiresLiveSessionSerialization && ownerKey) return `${params.backendId}:owner:${ownerKey}`;
		const sessionId = params.cliSessionId?.trim();
		if (sessionId) return `${params.backendId}:session:${sessionId}`;
		if (ownerKey) return `${params.backendId}:owner:${ownerKey}`;
		const workspaceDir = params.workspaceDir.trim();
		if (workspaceDir) return `${params.backendId}:workspace:${workspaceDir}`;
	}
	return params.backendId;
}
/** Builds the system prompt sent to a CLI-backed agent runtime. */
function buildCliAgentSystemPrompt(params) {
	const runtimeWorkspaceDir = params.cwd?.trim() || params.workspaceDir;
	const defaultModelRef = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.config ?? {},
		agentId: params.agentId
	});
	const defaultModelLabel = `${defaultModelRef.provider}/${defaultModelRef.model}`;
	const { runtimeInfo, userTimezone, userTime, userTimeFormat } = require_system_prompt_params.buildSystemPromptParams({
		config: params.config,
		agentId: params.agentId,
		workspaceDir: runtimeWorkspaceDir,
		cwd: runtimeWorkspaceDir,
		runtime: {
			sessionKey: params.sessionKey,
			sessionId: params.sessionId,
			host: "@gabrielvfonseca/operator",
			os: require_os_summary.resolveRuntimeOsLabel(),
			arch: node_os.default.arch(),
			node: process.version,
			model: params.modelDisplay,
			defaultModel: defaultModelLabel,
			shell: require_shell_utils.detectRuntimeShell(),
			channel: params.runtimeChannel,
			chatType: params.runtimeChatType,
			capabilities: params.runtimeCapabilities
		}
	});
	return require_system_prompt_params.buildConfiguredAgentSystemPrompt({
		config: params.config,
		agentId: params.agentId,
		workspaceDir: runtimeWorkspaceDir,
		defaultThinkLevel: params.defaultThinkLevel,
		extraSystemPrompt: params.extraSystemPrompt,
		sourceReplyDeliveryMode: params.sourceReplyDeliveryMode,
		requireExplicitMessageTarget: params.requireExplicitMessageTarget,
		silentReplyPromptMode: params.silentReplyPromptMode,
		ownerNumbers: params.ownerNumbers,
		reasoningTagHint: false,
		heartbeatPrompt: params.heartbeatPrompt,
		docsPath: params.docsPath,
		sourcePath: params.sourcePath,
		acpEnabled: require_availability.isAcpRuntimeSpawnAvailable({ config: params.config }),
		promptSurface: "cli_backend",
		nativeCommandGuidanceLines: require_command_registration.listRegisteredPluginAgentPromptGuidance({ surface: "cli_backend" }),
		runtimeInfo,
		toolNames: params.tools.map((tool) => tool.name),
		skillsPrompt: params.skillsPrompt,
		userTimezone,
		userTime,
		userTimeFormat,
		contextFiles: params.contextFiles,
		bootstrapMode: params.bootstrapMode
	});
}
/** Applies backend model aliases to a requested CLI model id. */
function normalizeCliModel(modelId, backend) {
	const trimmed = modelId.trim();
	if (!trimmed) return trimmed;
	const direct = backend.modelAliases?.[trimmed];
	if (direct) return direct;
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	const mapped = backend.modelAliases?.[lower];
	if (mapped) return mapped;
	return trimmed;
}
/** Decides whether a system prompt should be sent for this CLI turn. */
function resolveSystemPromptUsage(params) {
	const systemPrompt = params.systemPrompt?.trim();
	if (!systemPrompt) return null;
	const when = params.backend.systemPromptWhen ?? "first";
	if (when === "never") return null;
	if (when === "first" && !params.isNewSession) return null;
	if (!params.backend.systemPromptArg?.trim() && !params.backend.systemPromptFileArg?.trim() && !params.backend.systemPromptFileConfigKey?.trim()) return null;
	return systemPrompt;
}
/** Resolves the CLI session id to send and whether the turn starts a new session. */
function resolveSessionIdToSend(params) {
	const mode = params.backend.sessionMode ?? "always";
	const existing = params.cliSessionId?.trim();
	if (mode === "none") return {
		sessionId: void 0,
		isNew: !existing
	};
	if (mode === "existing") return {
		sessionId: existing,
		isNew: !existing
	};
	if (existing) return {
		sessionId: existing,
		isNew: false
	};
	return {
		sessionId: node_crypto.default.randomUUID(),
		isNew: true
	};
}
/** Routes prompt text to argv or stdin based on backend input policy. */
function resolvePromptInput(params) {
	if ((params.backend.input ?? "arg") === "stdin") return { stdin: params.prompt };
	if (params.backend.maxPromptArgChars && params.prompt.length > params.backend.maxPromptArgChars) return { stdin: params.prompt };
	return { argsPrompt: params.prompt };
}
function resolveCliImagePath(image) {
	const ext = (0, _gabrielvfonseca_media_core_mime.extensionForMime)(image.mimeType) ?? ".bin";
	const digest = node_crypto.default.createHash("sha256").update(image.mimeType).update("\0").update(image.data).digest("hex");
	return node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "operator-cli-images", `${digest}${ext}`);
}
function resolveCliImageRoot(params) {
	if (params.backend.imagePathScope === "workspace") return node_path.default.join(params.workspaceDir, ".operator-cli-images");
	return node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "operator-cli-images");
}
function isFileNotFoundError(error) {
	return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
async function sweepCliImageRoot(imageRoot) {
	if (sweptCliImageRoots.has(imageRoot)) return;
	sweptCliImageRoots.add(imageRoot);
	try {
		const cutoffMs = Date.now() - CLI_IMAGE_SWEEP_TTL_MS;
		const entries = await node_fs_promises.default.readdir(imageRoot, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			const entryPath = node_path.default.join(imageRoot, entry.name);
			const stat = await node_fs_promises.default.stat(entryPath).catch((error) => {
				if (isFileNotFoundError(error)) return;
				throw error;
			});
			if (!stat) continue;
			if (stat.mtimeMs >= cutoffMs) continue;
			try {
				await node_fs_promises.default.rm(entryPath, { force: true });
			} catch (error) {
				if (!isFileNotFoundError(error)) throw error;
			}
		}
	} catch (error) {
		cliBackendLog.debug(`cli image cache sweep failed: ${String(error)}`);
	}
}
function appendImagePathsToPrompt(prompt, paths, prefix = "") {
	if (!paths.length) return prompt;
	const trimmed = prompt.trimEnd();
	return `${trimmed}${trimmed ? "\n\n" : ""}${paths.map((entry) => `${prefix}${entry}`).join("\n")}`;
}
/** Loads and sanitizes image references found in prompt text. */
async function loadPromptRefImages(params) {
	const refs = require_images.detectImageReferences(params.prompt);
	if (refs.length === 0) return [];
	const maxBytes = params.maxBytes ?? _gabrielvfonseca_media_core_constants.MAX_IMAGE_BYTES;
	const seen = /* @__PURE__ */ new Set();
	const images = [];
	for (const ref of refs) {
		const key = `${ref.type}:${ref.resolved}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const image = await require_images.loadImageFromRef(ref, params.workspaceDir, {
			maxBytes,
			workspaceOnly: params.workspaceOnly,
			sandbox: params.sandbox
		});
		if (image) images.push(image);
	}
	const { images: sanitizedImages } = await require_tool_images.sanitizeImageBlocks(images, "prompt:images", { maxBytes });
	return sanitizedImages;
}
/** Writes CLI image payloads to private paths and returns their file paths. */
async function writeCliImages(params) {
	const imageRoot = resolveCliImageRoot({
		backend: params.backend,
		workspaceDir: params.workspaceDir
	});
	await node_fs_promises.default.mkdir(imageRoot, {
		recursive: true,
		mode: 448
	});
	await sweepCliImageRoot(imageRoot);
	const store = require_private_file_store.privateFileStore(imageRoot);
	const paths = [];
	for (const image of params.images) {
		const fileName = node_path.default.basename(resolveCliImagePath(image));
		const buffer = Buffer.from(image.data, "base64");
		await store.writeText(fileName, buffer);
		paths.push(store.path(fileName));
	}
	const cleanup = async () => {};
	return {
		paths,
		cleanup
	};
}
/** Writes a temporary system prompt file when the backend needs file-based prompts. */
async function writeCliSystemPromptFile(params) {
	if (!params.backend.systemPromptFileArg?.trim() && !params.backend.systemPromptFileConfigKey?.trim()) return { cleanup: async () => {} };
	const workspace = await (0, _openclaw_fs_safe_temp.tempWorkspace)({
		rootDir: require_tmp_operator_dir.resolvePreferredOperatorTmpDir(),
		prefix: "operator-cli-system-prompt-"
	});
	return {
		filePath: await workspace.write("system-prompt.md", (0, _gabrielvfonseca_ai_internal_shared.stripSystemPromptCacheBoundary)(params.systemPrompt)),
		cleanup: async () => await workspace.cleanup()
	};
}
/** Prepares prompt text and image paths for a CLI backend run. */
async function prepareCliPromptImagePayload(params) {
	let prompt = params.prompt;
	const resolvedImages = params.imagePrompt !== void 0 ? (await require_images.detectAndLoadPromptImages({
		prompt: params.imagePrompt,
		workspaceDir: params.workspaceDir,
		model: { input: ["text", "image"] },
		existingImages: params.images,
		imageOrder: params.imageOrder,
		maxBytes: _gabrielvfonseca_media_core_constants.MAX_IMAGE_BYTES
	})).images : params.images && params.images.length > 0 ? params.images : await loadPromptRefImages({
		prompt,
		workspaceDir: params.workspaceDir
	});
	if (resolvedImages.length === 0) return { prompt };
	const imagePayload = await writeCliImages({
		backend: params.backend,
		workspaceDir: params.workspaceDir,
		images: resolvedImages
	});
	const imagePaths = imagePayload.paths;
	if (!params.backend.imageArg || params.backend.input === "stdin" || params.backend.imageArg === "@") prompt = appendImagePathsToPrompt(prompt, imagePaths, params.backend.imageArg === "@" ? "@" : "");
	return {
		prompt,
		imagePaths,
		cleanupImages: imagePayload.cleanup
	};
}
/** Builds final CLI argv from backend config and prepared prompt/session inputs. */
function buildCliArgs(params) {
	const args = [...params.baseArgs];
	const shouldSendSystemPrompt = !params.useResume || params.backend.systemPromptWhen === "always" || params.sendSystemPromptOnResume;
	if (params.backend.modelArg && params.modelId) args.push(params.backend.modelArg, params.modelId);
	if (shouldSendSystemPrompt && params.systemPrompt && params.systemPromptFilePath && params.backend.systemPromptFileArg) args.push(params.backend.systemPromptFileArg, params.systemPromptFilePath);
	else if (shouldSendSystemPrompt && params.systemPrompt && params.systemPromptFilePath && params.backend.systemPromptFileConfigKey) args.push(params.backend.systemPromptFileConfigArg ?? "-c", formatTomlConfigOverride(params.backend.systemPromptFileConfigKey, params.systemPromptFilePath));
	else if (shouldSendSystemPrompt && params.systemPrompt && params.backend.systemPromptArg) args.push(params.backend.systemPromptArg, (0, _gabrielvfonseca_ai_internal_shared.stripSystemPromptCacheBoundary)(params.systemPrompt));
	if (!params.useResume && params.sessionId) {
		if (params.backend.sessionArgs && params.backend.sessionArgs.length > 0) for (const entry of params.backend.sessionArgs) args.push(entry.replaceAll("{sessionId}", params.sessionId));
		else if (params.backend.sessionArg) args.push(params.backend.sessionArg, params.sessionId);
	}
	if (params.useResume && params.forkResume) {
		if (!params.backend.forkArg) throw new Error("CLI backend does not support forked session resume");
		args.push(params.backend.forkArg);
	}
	if (params.promptArg !== void 0) {
		let replacedPromptPlaceholder = false;
		for (let i = 0; i < args.length; i += 1) if (args[i] === "{prompt}") {
			args[i] = params.promptArg;
			replacedPromptPlaceholder = true;
		}
		if (!replacedPromptPlaceholder) args.push(params.promptArg);
	}
	if (params.imagePaths && params.imagePaths.length > 0) {
		const mode = params.backend.imageMode ?? "repeat";
		const imageArg = params.backend.imageArg;
		if (imageArg && imageArg !== "@") if (mode === "list") args.push(imageArg, params.imagePaths.join(","));
		else for (const imagePath of params.imagePaths) args.push(imageArg, imagePath);
	}
	return args;
}
//#endregion
Object.defineProperty(exports, "CLI_BACKEND_LOG_OUTPUT_ENV", {
	enumerable: true,
	get: function() {
		return CLI_BACKEND_LOG_OUTPUT_ENV;
	}
});
Object.defineProperty(exports, "LEGACY_CLAUDE_CLI_LOG_OUTPUT_ENV", {
	enumerable: true,
	get: function() {
		return LEGACY_CLAUDE_CLI_LOG_OUTPUT_ENV;
	}
});
Object.defineProperty(exports, "buildClaudeOwnerKey", {
	enumerable: true,
	get: function() {
		return buildClaudeOwnerKey;
	}
});
Object.defineProperty(exports, "buildCliAgentSystemPrompt", {
	enumerable: true,
	get: function() {
		return buildCliAgentSystemPrompt;
	}
});
Object.defineProperty(exports, "buildCliArgs", {
	enumerable: true,
	get: function() {
		return buildCliArgs;
	}
});
Object.defineProperty(exports, "buildCliSupervisorScopeKey", {
	enumerable: true,
	get: function() {
		return buildCliSupervisorScopeKey;
	}
});
Object.defineProperty(exports, "cliBackendLog", {
	enumerable: true,
	get: function() {
		return cliBackendLog;
	}
});
Object.defineProperty(exports, "enqueueCliRun", {
	enumerable: true,
	get: function() {
		return enqueueCliRun;
	}
});
Object.defineProperty(exports, "formatCliBackendOutputDigest", {
	enumerable: true,
	get: function() {
		return formatCliBackendOutputDigest;
	}
});
Object.defineProperty(exports, "normalizeCliModel", {
	enumerable: true,
	get: function() {
		return normalizeCliModel;
	}
});
Object.defineProperty(exports, "prepareCliPromptImagePayload", {
	enumerable: true,
	get: function() {
		return prepareCliPromptImagePayload;
	}
});
Object.defineProperty(exports, "resolveCliNoOutputTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveCliNoOutputTimeoutMs;
	}
});
Object.defineProperty(exports, "resolveCliRunQueueKey", {
	enumerable: true,
	get: function() {
		return resolveCliRunQueueKey;
	}
});
Object.defineProperty(exports, "resolveCliRunTimeoutOverrideMs", {
	enumerable: true,
	get: function() {
		return resolveCliRunTimeoutOverrideMs;
	}
});
Object.defineProperty(exports, "resolvePromptInput", {
	enumerable: true,
	get: function() {
		return resolvePromptInput;
	}
});
Object.defineProperty(exports, "resolveSessionIdToSend", {
	enumerable: true,
	get: function() {
		return resolveSessionIdToSend;
	}
});
Object.defineProperty(exports, "resolveSystemPromptUsage", {
	enumerable: true,
	get: function() {
		return resolveSystemPromptUsage;
	}
});
Object.defineProperty(exports, "serializeTomlInlineValue", {
	enumerable: true,
	get: function() {
		return serializeTomlInlineValue;
	}
});
Object.defineProperty(exports, "writeCliSystemPromptFile", {
	enumerable: true,
	get: function() {
		return writeCliSystemPromptFile;
	}
});
