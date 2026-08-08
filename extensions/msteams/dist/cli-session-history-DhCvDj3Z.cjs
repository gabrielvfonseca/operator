const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_strip_inbound_meta = require("./strip-inbound-meta-CE5-_osk.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_cli_session_binding = require("./cli-session-binding-BLYmlDx8.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/chat/tool-content.ts
const TOOL_USE_ID_FIELDS = [
	"id",
	"tool_call_id",
	"toolCallId",
	"tool_use_id",
	"toolUseId"
];
function normalizeToolContentType(value) {
	return typeof value === "string" ? value.toLowerCase() : "";
}
/** Accepts tool-call content type spellings used by provider SDKs and persisted transcripts. */
function isToolCallContentType(value) {
	const type = normalizeToolContentType(value);
	return type === "toolcall" || type === "tool_call" || type === "tooluse" || type === "tool_use";
}
/** Accepts tool-result content type spellings used by provider SDKs and persisted transcripts. */
function isToolResultContentType(value) {
	const type = normalizeToolContentType(value);
	return type === "toolresult" || type === "tool_result";
}
/** Narrows unknown chat content blocks to provider-shaped tool-call blocks. */
function isToolCallBlock(block) {
	return isToolCallContentType(block.type);
}
/** Narrows unknown chat content blocks to provider-shaped tool-result blocks. */
function isToolResultBlock(block) {
	return isToolResultContentType(block.type);
}
/** Reads the stable tool-use id across snake_case and camelCase provider field names. */
function resolveToolUseId(block) {
	for (const field of TOOL_USE_ID_FIELDS) {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block[field]);
		if (id) return id;
	}
}
//#endregion
//#region src/agents/cli-runner/reseed-envelope.ts
const RESEED_HEADER = [
	"Continue this conversation using the Operator transcript below as prior session history.",
	"Treat it as authoritative context for this fresh CLI session.",
	"",
	"<conversation_history>"
].join("\n");
const RESEED_PREFIX = `${RESEED_HEADER}\n`;
const RESEED_USER_BOUNDARY = "\n</conversation_history>\n\n<next_user_message>\n";
const RESEED_USER_CLOSE = "\n</next_user_message>";
function hashCliReseedPrompt(text) {
	return node_crypto.default.createHash("sha256").update(text).digest("hex");
}
function parseCliReseedPrompt(text) {
	if (!text.startsWith(RESEED_PREFIX)) return text.startsWith(RESEED_HEADER) ? { kind: "invalid" } : { kind: "none" };
	const boundaryIndex = text.indexOf(RESEED_USER_BOUNDARY);
	if (boundaryIndex !== text.lastIndexOf(RESEED_USER_BOUNDARY)) return { kind: "invalid" };
	if (boundaryIndex <= RESEED_PREFIX.length) return { kind: "invalid" };
	const promptStart = boundaryIndex + 46;
	const closeIndex = text.lastIndexOf(RESEED_USER_CLOSE);
	if (closeIndex < promptStart) return { kind: "invalid" };
	return {
		kind: "legacy",
		userMessage: text.slice(promptStart, closeIndex)
	};
}
//#endregion
//#region src/gateway/cli-session-history.claude.ts
const CLAUDE_CLI_PROVIDER = "claude-cli";
const CLAUDE_PROJECTS_RELATIVE_DIR = node_path.default.join(".claude", "projects");
function resolveHistoryHomeDir(homeDir) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(homeDir) || process.env.HOME || node_os.default.homedir();
}
function resolveClaudeProjectsDir(homeDir) {
	return node_path.default.join(resolveHistoryHomeDir(homeDir), CLAUDE_PROJECTS_RELATIVE_DIR);
}
function resolveClaudeCliBindingSessionId(entry) {
	return require_cli_session_binding.getCliSessionBinding(entry, CLAUDE_CLI_PROVIDER)?.sessionId;
}
function resolveClaudeCliTimestampMs(value) {
	if (typeof value !== "string") return;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function resolveClaudeCliUsage(raw) {
	if (!raw || typeof raw !== "object") return;
	const input = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(raw.input_tokens);
	const output = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(raw.output_tokens);
	const cacheRead = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(raw.cache_read_input_tokens);
	const cacheWrite = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(raw.cache_creation_input_tokens);
	if (input === void 0 && output === void 0 && cacheRead === void 0 && cacheWrite === void 0) return;
	return {
		...input !== void 0 ? { input } : {},
		...output !== void 0 ? { output } : {},
		...cacheRead !== void 0 ? { cacheRead } : {},
		...cacheWrite !== void 0 ? { cacheWrite } : {}
	};
}
function cloneJsonValue(value) {
	return structuredClone(value);
}
function removeContentBlock(content, blockIndex) {
	const nextContent = cloneJsonValue(content);
	nextContent.splice(blockIndex, 1);
	return nextContent.length > 0 ? nextContent : null;
}
function normalizeClaudeCliContent(content, toolNameRegistry) {
	if (!Array.isArray(content)) return cloneJsonValue(content);
	const normalized = [];
	for (const item of content) {
		if (!item || typeof item !== "object") {
			normalized.push(cloneJsonValue(item));
			continue;
		}
		const block = cloneJsonValue(item);
		const type = typeof block.type === "string" ? block.type : "";
		if (type === "tool_use") {
			const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.id) ?? "";
			const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.name) ?? "";
			if (id && name) toolNameRegistry.set(id, name);
			if (block.input !== void 0 && block.arguments === void 0) block.arguments = cloneJsonValue(block.input);
			block.type = "toolcall";
			delete block.input;
			normalized.push(block);
			continue;
		}
		if (type === "tool_result") {
			const toolUseId = resolveToolUseId(block);
			if (!block.name && toolUseId) {
				const toolName = toolNameRegistry.get(toolUseId);
				if (toolName) block.name = toolName;
			}
			normalized.push(block);
			continue;
		}
		normalized.push(block);
	}
	return normalized;
}
function getMessageBlocks(message) {
	if (!message || typeof message !== "object") return null;
	const content = message.content;
	return Array.isArray(content) ? content : null;
}
function isAssistantToolCallMessage(message) {
	if (!message || typeof message !== "object") return false;
	if (message.role !== "assistant") return false;
	const blocks = getMessageBlocks(message);
	return Boolean(blocks && blocks.length > 0 && blocks.every(isToolCallBlock));
}
function isUserToolResultMessage(message) {
	if (!message || typeof message !== "object") return false;
	if (message.role !== "user") return false;
	const blocks = getMessageBlocks(message);
	return Boolean(blocks && blocks.length > 0 && blocks.every(isToolResultBlock));
}
function coalesceClaudeCliToolMessages(messages) {
	const coalesced = [];
	for (let index = 0; index < messages.length; index += 1) {
		const current = messages.at(index);
		if (current === void 0) break;
		const next = messages[index + 1];
		if (!isAssistantToolCallMessage(current) || !isUserToolResultMessage(next)) {
			coalesced.push(current);
			continue;
		}
		const callBlocks = getMessageBlocks(current) ?? [];
		const resultBlocks = getMessageBlocks(next) ?? [];
		const callIds = new Set(callBlocks.map(resolveToolUseId).filter((id) => Boolean(id)));
		if (!(resultBlocks.length > 0 && resultBlocks.every((block) => {
			const toolUseId = resolveToolUseId(block);
			return Boolean(toolUseId && callIds.has(toolUseId));
		}))) {
			coalesced.push(current);
			continue;
		}
		coalesced.push({
			...current,
			content: [...callBlocks.map(cloneJsonValue), ...resultBlocks.map(cloneJsonValue)]
		});
		index += 1;
	}
	return coalesced;
}
function resolveClaudeCliPromptTextCandidates(entry, content) {
	if (entry.isMeta === true || entry.isCompactSummary === true) return [];
	if (typeof content === "string") return [{ text: content }];
	if (content.some((item) => item !== null && typeof item === "object" && "type" in item && item.type === "tool_result")) return [];
	return content.flatMap((item, blockIndex) => item !== null && typeof item === "object" && "type" in item && item.type === "text" && "text" in item && typeof item.text === "string" ? [{
		text: item.text,
		blockIndex
	}] : []);
}
function parseClaudeCliHistoryEntry(entry, cliSessionId, sourceLineNumber, toolNameRegistry, options) {
	if (entry.isSidechain === true || !entry.message || typeof entry.message !== "object") return null;
	const type = typeof entry.type === "string" ? entry.type : void 0;
	const role = typeof entry.message.role === "string" ? entry.message.role : void 0;
	if (type !== "user" && type !== "assistant" || role !== type) return null;
	const timestamp = resolveClaudeCliTimestampMs(entry.timestamp);
	const externalId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.uuid);
	const baseMeta = {
		id: externalId ?? `claude-cli:${cliSessionId}:line:${sourceLineNumber}`,
		importedFrom: CLAUDE_CLI_PROVIDER,
		cliSessionId,
		...externalId ? { externalId } : {}
	};
	let content = typeof entry.message.content === "string" || Array.isArray(entry.message.content) ? normalizeClaudeCliContent(entry.message.content, toolNameRegistry) : void 0;
	if (content === void 0) return null;
	if (type === "user") {
		const reseedState = options.reseedState;
		const promptTextCandidates = resolveClaudeCliPromptTextCandidates(entry, content);
		if (options.reseedMode === "recover" && reseedState && !reseedState.inspectedFirstUser && promptTextCandidates.length > 0) {
			reseedState.inspectedFirstUser = true;
			if (reseedState.receipt) {
				const candidate = promptTextCandidates.length === 1 ? promptTextCandidates[0] : void 0;
				if (candidate && hashCliReseedPrompt(candidate.text) === reseedState.receipt.promptHash) {
					if (candidate.blockIndex === void 0 || !Array.isArray(content)) return null;
					const nextContent = removeContentBlock(content, candidate.blockIndex);
					if (!nextContent) return null;
					content = nextContent;
				}
			} else for (const candidate of promptTextCandidates) {
				const reseedPrompt = parseCliReseedPrompt(candidate.text);
				if (reseedPrompt.kind === "legacy") {
					if (candidate.blockIndex === void 0) {
						if (!reseedPrompt.userMessage) return null;
						content = reseedPrompt.userMessage;
					} else if (Array.isArray(content)) {
						if (!reseedPrompt.userMessage) {
							const contentWithoutReseed = removeContentBlock(content, candidate.blockIndex);
							if (!contentWithoutReseed) return null;
							content = contentWithoutReseed;
							break;
						}
						const nextContent = cloneJsonValue(content);
						const block = nextContent[candidate.blockIndex];
						if (block && typeof block === "object") block.text = reseedPrompt.userMessage;
						content = nextContent;
					}
					break;
				}
			}
		}
		return require_session_transcript_readers.attachOperatorTranscriptMeta({
			role: "user",
			content,
			...timestamp !== void 0 ? { timestamp } : {}
		}, baseMeta);
	}
	return require_session_transcript_readers.attachOperatorTranscriptMeta({
		role: "assistant",
		content,
		api: "anthropic-messages",
		provider: CLAUDE_CLI_PROVIDER,
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.message.model) ? { model: entry.message.model } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.message.stop_reason) ? { stopReason: entry.message.stop_reason } : {},
		...resolveClaudeCliUsage(entry.message.usage) ? { usage: resolveClaudeCliUsage(entry.message.usage) } : {},
		...timestamp !== void 0 ? { timestamp } : {}
	}, baseMeta);
}
function resolveClaudeCliSessionFilePath(params) {
	const sessionId = params.cliSessionId.trim();
	if (!sessionId || sessionId === "." || sessionId === ".." || node_path.default.isAbsolute(sessionId) || sessionId.includes("/") || sessionId.includes("\\")) return;
	const projectsDir = resolveClaudeProjectsDir(params.homeDir);
	let projectEntries;
	try {
		projectEntries = node_fs.default.readdirSync(projectsDir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of projectEntries) {
		if (!entry.isDirectory()) continue;
		const projectDir = node_path.default.join(projectsDir, entry.name);
		const candidate = node_path.default.resolve(projectDir, `${sessionId}.jsonl`);
		const resolvedProjectDir = node_path.default.resolve(projectDir);
		if (!candidate.startsWith(`${resolvedProjectDir}${node_path.default.sep}`)) continue;
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
}
/** Reads visible messages for a bound Claude CLI session. */
function readClaudeCliSessionMessages(params) {
	const filePath = resolveClaudeCliSessionFilePath(params);
	if (!filePath) return [];
	let content;
	try {
		content = node_fs.default.readFileSync(filePath, "utf-8");
	} catch {
		return [];
	}
	const messages = [];
	const toolNameRegistry = /* @__PURE__ */ new Map();
	const localSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.localSessionId);
	const normalizedReceipt = require_cli_session_binding.normalizeCliSessionReseedReceipt(params.reseedReceipt);
	const reseedState = {
		receipt: normalizedReceipt && normalizedReceipt.localSessionId === localSessionId ? normalizedReceipt : void 0,
		inspectedFirstUser: false
	};
	const lines = content.split(/\r?\n/);
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex] ?? "";
		if (!line.trim()) continue;
		try {
			const message = parseClaudeCliHistoryEntry(JSON.parse(line), params.cliSessionId, lineIndex + 1, toolNameRegistry, {
				reseedMode: "recover",
				reseedState
			});
			if (message) messages.push(message);
		} catch {}
	}
	return coalesceClaudeCliToolMessages(messages);
}
function isCompactBoundary(entry) {
	if (entry.type !== "system") return false;
	const subtype = entry.subtype;
	return typeof subtype === "string" && subtype === "compact_boundary";
}
function extractCompactBoundaryFallbackText(entry) {
	const content = entry.content;
	return typeof content === "string" && content.trim() ? content.trim() : void 0;
}
function extractSummaryText(entry) {
	if (entry.type !== "summary") return;
	const summary = entry.summary;
	return typeof summary === "string" && summary.trim() ? summary.trim() : void 0;
}
function readClaudeCliFallbackSeed(params) {
	const filePath = resolveClaudeCliSessionFilePath(params);
	if (!filePath) return;
	let content;
	try {
		content = node_fs.default.readFileSync(filePath, "utf-8");
	} catch {
		return;
	}
	let pendingSummary;
	let lastSummary;
	let lastBoundaryFallback;
	let windowedTurns = [];
	const toolNameRegistry = /* @__PURE__ */ new Map();
	const lines = content.split(/\r?\n/);
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex] ?? "";
		if (!line.trim()) continue;
		let parsed;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}
		const explicitSummary = extractSummaryText(parsed);
		if (explicitSummary) {
			pendingSummary = explicitSummary;
			continue;
		}
		if (isCompactBoundary(parsed)) {
			lastSummary = pendingSummary;
			pendingSummary = void 0;
			lastBoundaryFallback = extractCompactBoundaryFallbackText(parsed) ?? lastBoundaryFallback;
			windowedTurns = [];
			toolNameRegistry.clear();
			continue;
		}
		const message = parseClaudeCliHistoryEntry(parsed, params.cliSessionId, lineIndex + 1, toolNameRegistry, { reseedMode: "preserve" });
		if (message) windowedTurns.push(message);
	}
	const recentTurns = coalesceClaudeCliToolMessages(windowedTurns);
	const resolvedSummaryText = lastSummary ?? pendingSummary ?? lastBoundaryFallback;
	if (!resolvedSummaryText && recentTurns.length === 0) return;
	return {
		...resolvedSummaryText ? { summaryText: resolvedSummaryText } : {},
		recentTurns
	};
}
//#endregion
//#region src/gateway/cli-session-history.merge.ts
const DEDUPE_TIMESTAMP_WINDOW_MS = 300 * 1e3;
function extractComparableText(message) {
	if (!message || typeof message !== "object") return;
	const record = message;
	const role = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(record.role);
	const parts = [];
	const text = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(record.text);
	if (text !== void 0) parts.push(text);
	const content = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(record.content);
	if (content !== void 0) parts.push(content);
	else if (Array.isArray(record.content)) {
		for (const block of record.content) if (block && typeof block === "object" && "text" in block) {
			const blockText = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(block.text);
			if (blockText !== void 0) parts.push(blockText);
		}
	}
	if (parts.length === 0) return;
	const joined = parts.join("\n").trim();
	if (!joined) return;
	return (role === "user" ? require_strip_inbound_meta.stripInboundMetadata(joined) : joined).replace(/\s+/g, " ").trim() || void 0;
}
function resolveComparableTimestamp(message) {
	if (!message || typeof message !== "object") return;
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(message.timestamp);
}
function resolveComparableRole(message) {
	if (!message || typeof message !== "object") return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(message.role);
}
function resolveImportedExternalIdentity(message) {
	if (!message || typeof message !== "object") return;
	const meta = "__openclaw" in message && message["__openclaw"] && typeof message["__openclaw"] === "object" ? message["__openclaw"] ?? {} : void 0;
	const externalId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(meta?.externalId);
	return externalId ? {
		externalId,
		importedFrom: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(meta?.importedFrom),
		cliSessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(meta?.cliSessionId)
	} : void 0;
}
function hasSameExternalIdentity(existing, imported) {
	const importedIdentity = resolveImportedExternalIdentity(imported);
	const existingIdentity = resolveImportedExternalIdentity(existing);
	if (!importedIdentity || !existingIdentity) return false;
	return importedIdentity.externalId === existingIdentity.externalId && importedIdentity.importedFrom === existingIdentity.importedFrom && importedIdentity.cliSessionId === existingIdentity.cliSessionId;
}
function isEquivalentImportedMessage(existing, imported) {
	if (hasSameExternalIdentity(existing, imported)) return true;
	const existingRole = resolveComparableRole(existing);
	const importedRole = resolveComparableRole(imported);
	if (!existingRole || existingRole !== importedRole) return false;
	const existingText = extractComparableText(existing);
	const importedText = extractComparableText(imported);
	if (!existingText || !importedText || existingText !== importedText) return false;
	const existingTimestamp = resolveComparableTimestamp(existing);
	const importedTimestamp = resolveComparableTimestamp(imported);
	if (existingTimestamp === void 0 || importedTimestamp === void 0) return true;
	return Math.abs(existingTimestamp - importedTimestamp) <= DEDUPE_TIMESTAMP_WINDOW_MS;
}
function compareHistoryMessages(a, b) {
	const aTimestamp = resolveComparableTimestamp(a.message);
	const bTimestamp = resolveComparableTimestamp(b.message);
	if (aTimestamp !== void 0 && bTimestamp !== void 0 && aTimestamp !== bTimestamp) return aTimestamp - bTimestamp;
	return a.order - b.order;
}
/** Merges imported CLI transcript messages into local history without duplicating overlaps. */
function mergeImportedChatHistoryMessages(params) {
	if (params.importedMessages.length === 0) return params.localMessages;
	const merged = params.localMessages.map((message, index) => ({
		message,
		order: index
	}));
	let nextOrder = merged.length;
	for (const imported of params.importedMessages) {
		if (merged.some((existing) => isEquivalentImportedMessage(existing.message, imported))) continue;
		merged.push({
			message: imported,
			order: nextOrder
		});
		nextOrder += 1;
	}
	merged.sort(compareHistoryMessages);
	return merged.map((entry) => entry.message);
}
//#endregion
//#region src/gateway/cli-session-history.ts
const ANTHROPIC_PROVIDER = "anthropic";
/** Resolves chat history plus whether a bound external transcript was actually incorporated. */
function resolveChatHistoryWithCliSessionImports(params) {
	const cliSessionBinding = require_cli_session_binding.getCliSessionBinding(params.entry, CLAUDE_CLI_PROVIDER);
	const cliSessionId = cliSessionBinding?.sessionId;
	if (!cliSessionId) return {
		messages: params.localMessages,
		imported: false
	};
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(params.provider ?? "");
	if (normalizedProvider && normalizedProvider !== "claude-cli" && normalizedProvider !== ANTHROPIC_PROVIDER && params.localMessages.length > 0) return {
		messages: params.localMessages,
		imported: false
	};
	const importedMessages = readClaudeCliSessionMessages({
		cliSessionId,
		homeDir: params.homeDir,
		localSessionId: params.entry?.sessionId,
		reseedReceipt: cliSessionBinding.reseedReceipt
	});
	if (importedMessages.length === 0) return {
		messages: params.localMessages,
		imported: false
	};
	const messages = mergeImportedChatHistoryMessages({
		localMessages: params.localMessages,
		importedMessages
	});
	return messages.length > params.localMessages.length ? {
		messages,
		imported: true
	} : {
		messages: params.localMessages,
		imported: false
	};
}
/** Augments local chat history with bound Claude CLI session messages when applicable. */
function augmentChatHistoryWithCliSessionImports(params) {
	return resolveChatHistoryWithCliSessionImports(params).messages;
}
//#endregion
Object.defineProperty(exports, "augmentChatHistoryWithCliSessionImports", {
	enumerable: true,
	get: function() {
		return augmentChatHistoryWithCliSessionImports;
	}
});
Object.defineProperty(exports, "hashCliReseedPrompt", {
	enumerable: true,
	get: function() {
		return hashCliReseedPrompt;
	}
});
Object.defineProperty(exports, "isToolCallBlock", {
	enumerable: true,
	get: function() {
		return isToolCallBlock;
	}
});
Object.defineProperty(exports, "readClaudeCliFallbackSeed", {
	enumerable: true,
	get: function() {
		return readClaudeCliFallbackSeed;
	}
});
Object.defineProperty(exports, "resolveChatHistoryWithCliSessionImports", {
	enumerable: true,
	get: function() {
		return resolveChatHistoryWithCliSessionImports;
	}
});
Object.defineProperty(exports, "resolveClaudeCliBindingSessionId", {
	enumerable: true,
	get: function() {
		return resolveClaudeCliBindingSessionId;
	}
});
Object.defineProperty(exports, "resolveToolUseId", {
	enumerable: true,
	get: function() {
		return resolveToolUseId;
	}
});
