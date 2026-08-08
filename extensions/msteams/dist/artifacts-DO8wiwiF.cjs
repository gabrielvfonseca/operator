require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_task_status_access = require("./task-status-access-B4LbHuEr.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_server_session_key = require("./server-session-key-BqgIl_27.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/server-methods/artifacts.ts
function artifactError(type, message, details) {
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, message, { details: {
		type,
		...details
	} });
}
function resolveRequesterSessionAgentId(sessionKey, cfg) {
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!key) return;
	const parsed = require_session_key.parseAgentSessionKey(key);
	if (!parsed && key.toLowerCase().startsWith("agent:")) return;
	if (cfg) return require_session_accessor.resolveSessionStoreAgentId(cfg, require_session_accessor.resolveSessionStoreKey({
		cfg,
		sessionKey: key
	}));
	if (parsed) return parsed.agentId;
	return require_session_key.resolveAgentIdFromSessionKey(key);
}
/** Applies an optional agent scope to a transcript session key without crossing stores. */
function resolveScopedArtifactSessionKey(sessionKey, agentId, cfg) {
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!key) return;
	const scopedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentId);
	if (!scopedAgentId) return key;
	const parsed = require_session_key.parseAgentSessionKey(key);
	if (!parsed && key.toLowerCase().startsWith("agent:")) return;
	if (cfg) {
		const scopedKey = require_session_accessor.resolveStoredSessionKeyForAgentStore({
			cfg,
			agentId: scopedAgentId,
			sessionKey: key
		});
		if (scopedKey !== "global" && scopedKey !== "unknown" && require_session_accessor.resolveSessionStoreAgentId(cfg, scopedKey) !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(scopedAgentId)) return;
		return scopedKey;
	}
	if (parsed && parsed.agentId !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(scopedAgentId)) return;
	return require_session_key.toAgentStoreSessionKey({
		agentId: scopedAgentId,
		requestKey: key
	});
}
function normalizeArtifactType(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "image" || normalized === "input_image" || normalized === "image_url") return "image";
	if (normalized === "audio" || normalized === "input_audio") return "audio";
	if (normalized === "file" || normalized === "input_file") return "file";
	return "file";
}
function mimeFromDataUrl(value) {
	return /^data:([^;,]+)(?:;[^,]*)?,/i.exec(value.trim())?.[1]?.toLowerCase();
}
function base64FromDataUrl(value) {
	const trimmed = value.trim();
	const commaIndex = trimmed.indexOf(",");
	if (commaIndex < 0 || trimmed.slice(0, 5).toLowerCase() !== "data:") return;
	if (!trimmed.slice(0, commaIndex).toLowerCase().includes(";base64")) return;
	return trimmed.slice(commaIndex + 1);
}
function isBase64Whitespace(value) {
	return value === " " || value === "\n" || value === "\r" || value === "	";
}
function isArtifactBase64DataChar(value) {
	const code = value.charCodeAt(0);
	return code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 48 && code <= 57 || value === "+" || value === "/" || value === "-" || value === "_";
}
function normalizeArtifactBase64Char(value) {
	if (value === "-") return "+";
	if (value === "_") return "/";
	return value;
}
function readArtifactBase64Payload(value, opts) {
	if (!value) return;
	let encodedLength = 0;
	let padding = 0;
	let sawPadding = false;
	let data = opts.includeData ? "" : void 0;
	for (const char of value) {
		if (isBase64Whitespace(char)) continue;
		if (char === "=") {
			padding += 1;
			if (padding > 2) return;
			sawPadding = true;
			encodedLength += 1;
			if (data !== void 0) data += char;
			continue;
		}
		if (sawPadding || !isArtifactBase64DataChar(char)) return;
		encodedLength += 1;
		if (data !== void 0) data += normalizeArtifactBase64Char(char);
	}
	if (encodedLength === 0) return;
	const remainder = encodedLength % 4;
	if (padding > 0 && remainder !== 0 || remainder === 1) return;
	if (data !== void 0 && padding === 0 && remainder > 0) data += "=".repeat(4 - remainder);
	return {
		...data !== void 0 ? { data } : {},
		sizeBytes: Math.max(0, Math.floor(encodedLength * 3 / 4) - padding)
	};
}
function mediaUrlValue(value) {
	if (typeof value === "string") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value)?.url);
}
function isSafeDownloadUrl(value) {
	const trimmed = value.trim();
	if (!trimmed || /^data:/i.test(trimmed)) return false;
	if (trimmed.startsWith("/")) return !trimmed.startsWith("//") && trimmed.startsWith("/api/");
	return (0, _gabrielvfonseca_net_policy_url_protocol.isHttpUrl)(trimmed);
}
/** Generates a stable id from transcript position plus display metadata. */
function artifactId(parts) {
	return `artifact_${(0, node_crypto.createHash)("sha256").update(`${parts.sessionKey}\0${parts.messageSeq}\0${parts.contentIndex}\0${parts.type}\0${parts.title}`).digest("base64url").slice(0, 18)}`;
}
function resolveMessageSeq(message, fallback) {
	const seq = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(message["__openclaw"])?.seq;
	return typeof seq === "number" && Number.isInteger(seq) && seq > 0 ? seq : fallback;
}
function resolveMessageRunId(message) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(message["__openclaw"])?.runId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.runId);
}
function resolveMessageTaskId(message) {
	const meta = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(message["__openclaw"]);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(meta?.messageTaskId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(meta?.taskId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.messageTaskId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.taskId);
}
function resolveBlockDownload(block, opts) {
	const data = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.data);
	const content = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.content);
	const url = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.url) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.openUrl);
	const imageUrl = mediaUrlValue(block.image_url);
	const audioUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.audio_url);
	const source = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(block.source);
	const sourceData = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source?.data);
	const sourceUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source?.url);
	const dataUrl = [
		url,
		sourceUrl,
		imageUrl,
		audioUrl,
		data,
		content,
		sourceData
	].find((value) => typeof value === "string" && /^data:/i.test(value));
	const base64FromDetectedDataUrl = readArtifactBase64Payload(dataUrl ? base64FromDataUrl(dataUrl) : void 0, opts);
	const directBase64 = [
		data,
		sourceData,
		content
	].filter((value) => typeof value === "string" && !/^data:/i.test(value)).map((value) => readArtifactBase64Payload(value, opts)).find((value) => value !== void 0);
	const base64 = base64FromDetectedDataUrl ?? directBase64;
	const remoteUrl = [
		url,
		sourceUrl,
		imageUrl,
		audioUrl
	].find((value) => typeof value === "string" && isSafeDownloadUrl(value));
	const mimeType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.mimeType) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.media_type) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source?.media_type) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source?.mimeType) ?? (dataUrl ? mimeFromDataUrl(dataUrl) : void 0);
	const explicitSize = block.sizeBytes ?? source?.sizeBytes;
	const sizeBytes = typeof explicitSize === "number" && Number.isFinite(explicitSize) && explicitSize >= 0 ? Math.floor(explicitSize) : base64?.sizeBytes;
	if (base64) return {
		mode: "bytes",
		...base64.data ? { data: base64.data } : {},
		mimeType,
		sizeBytes
	};
	if (remoteUrl) return {
		mode: "url",
		url: remoteUrl,
		mimeType,
		sizeBytes
	};
	return {
		mode: "unsupported",
		mimeType,
		sizeBytes
	};
}
function isArtifactBlock(block) {
	const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type)?.toLowerCase();
	if (type === "image" || type === "audio" || type === "file" || type === "input_image" || type === "input_audio" || type === "input_file" || type === "image_url") return true;
	return Boolean(block.url || block.openUrl || block.data || block.source || block.image_url || block.audio_url);
}
function collectArtifactsFromMessage(params) {
	const msg = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(params.message);
	if (!msg) return;
	const messageSeq = resolveMessageSeq(msg, params.messageFallbackSeq);
	const messageRunId = resolveMessageRunId(msg);
	const messageTaskId = resolveMessageTaskId(msg);
	if (params.runId && messageRunId !== params.runId) return;
	if (params.taskId && messageTaskId !== params.taskId) return;
	const content = Array.isArray(msg.content) ? msg.content : [];
	for (let contentIndex = 0; contentIndex < content.length; contentIndex += 1) {
		const block = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(content[contentIndex]);
		if (!block || !isArtifactBlock(block)) continue;
		const type = normalizeArtifactType((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type) ?? "file");
		const title = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.title) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.fileName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.filename) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.alt) ?? `${type} ${params.artifacts.length + 1}`;
		const id = artifactId({
			sessionKey: params.sessionKey,
			messageSeq,
			contentIndex,
			title,
			type
		});
		const download = resolveBlockDownload(block, { includeData: params.downloadArtifactId ? params.downloadArtifactId === id : params.includeDownloadData !== false });
		const summary = {
			id,
			type,
			title,
			...download.mimeType ? { mimeType: download.mimeType } : {},
			...download.sizeBytes !== void 0 ? { sizeBytes: download.sizeBytes } : {},
			sessionKey: params.sessionKey,
			...messageRunId ? { runId: messageRunId } : {},
			...messageTaskId ? { taskId: messageTaskId } : {},
			messageSeq,
			source: "session-transcript",
			download: { mode: download.mode },
			...download.data ? { data: download.data } : {},
			...download.url ? { url: download.url } : {}
		};
		params.artifacts.push(summary);
	}
}
function resolveQuerySession(query, cfg) {
	if (query.sessionKey) {
		const sessionKey = resolveScopedArtifactSessionKey(query.sessionKey, query.agentId, cfg);
		if (!sessionKey) return;
		return {
			sessionKey,
			...query.agentId ? { agentId: query.agentId } : {}
		};
	}
	if (query.runId) {
		const agentId = query.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg ?? {});
		const scopedSessionKey = resolveScopedArtifactSessionKey(require_server_session_key.resolveSessionKeyForRun(query.runId, { agentId }), agentId, cfg);
		return scopedSessionKey ? {
			sessionKey: scopedSessionKey,
			agentId
		} : void 0;
	}
	if (query.taskId) {
		const task = require_task_status_access.getTaskSessionLookupByIdForStatus(query.taskId);
		const requesterSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task?.requesterSessionKey);
		const ownerAgentId = require_session_key.parseAgentSessionKey(task?.ownerKey)?.agentId;
		const requesterAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task?.requesterAgentId) ?? ownerAgentId ?? (requesterSessionKey === "global" ? void 0 : resolveRequesterSessionAgentId(requesterSessionKey, cfg));
		const taskAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task?.agentId) ?? requesterAgentId;
		if (query.agentId && taskAgentId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(query.agentId) !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(taskAgentId)) return;
		if (requesterSessionKey) {
			const sessionAgentId = requesterAgentId ?? taskAgentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg ?? {});
			const scopedSessionKey = resolveScopedArtifactSessionKey(requesterSessionKey, sessionAgentId, cfg);
			return scopedSessionKey ? {
				sessionKey: scopedSessionKey,
				agentId: sessionAgentId
			} : void 0;
		}
		const agentId = query.agentId ?? taskAgentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg ?? {});
		const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task?.runId);
		const scopedSessionKey = resolveScopedArtifactSessionKey(runId ? require_server_session_key.resolveSessionKeyForRun(runId, { agentId }) : void 0, agentId, cfg);
		return scopedSessionKey ? {
			sessionKey: scopedSessionKey,
			agentId
		} : void 0;
	}
}
/** Loads artifacts from the transcript selected by sessionKey, runId, or taskId. */
async function loadArtifacts(query, cfg, opts = {}) {
	const resolved = resolveQuerySession(query, cfg);
	if (!resolved) return { artifacts: [] };
	const { sessionKey } = resolved;
	const scopedGlobalAgentId = cfg?.session?.scope === "global" && sessionKey === "global" ? resolved.agentId : void 0;
	const { storePath, entry } = scopedGlobalAgentId ? require_session_utils.loadSessionEntry(sessionKey, { agentId: scopedGlobalAgentId }) : require_session_utils.loadSessionEntry(sessionKey);
	const sessionId = entry?.sessionId;
	if (!sessionId || !storePath) return {
		sessionKey,
		artifacts: []
	};
	const artifacts = [];
	await require_session_transcript_readers.visitSessionMessagesAsync({
		agentId: resolved.agentId ?? require_session_key.resolveAgentIdFromSessionKey(sessionKey),
		sessionEntry: entry,
		sessionId,
		sessionKey,
		storePath
	}, (message, seq) => {
		collectArtifactsFromMessage({
			message,
			messageFallbackSeq: seq,
			artifacts,
			sessionKey,
			runId: query.runId,
			taskId: query.taskId,
			includeDownloadData: opts.includeDownloadData,
			downloadArtifactId: opts.downloadArtifactId
		});
	}, {
		mode: "full",
		reason: "artifact query transcript scan",
		cache: "skip"
	});
	return {
		sessionKey,
		artifacts
	};
}
function requireQueryable(params, respond) {
	if (params.sessionKey || params.runId || params.taskId) return true;
	respond(false, void 0, artifactError("artifact_query_unsupported", "artifacts require one of sessionKey, runId, or taskId"));
	return false;
}
async function findArtifact(params, cfg, opts = {}) {
	const loaded = await loadArtifacts(params, cfg, opts);
	return {
		sessionKey: loaded.sessionKey,
		artifact: loaded.artifacts.find((artifact) => artifact.id === params.artifactId)
	};
}
function toSummary(artifact) {
	const { data: _dataValue, url: _url, ...summary } = artifact;
	return summary;
}
/** Gateway handlers for listing, summarizing, and downloading transcript artifacts. */
const artifactsHandlers = {
	"artifacts.list": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateArtifactsListParams, "artifacts.list", respond)) return;
		if (!requireQueryable(params, respond)) return;
		const { artifacts, sessionKey } = await loadArtifacts(params, context.getRuntimeConfig?.(), { includeDownloadData: false });
		if (!sessionKey && (params.runId || params.taskId)) {
			respond(false, void 0, artifactError("artifact_scope_not_found", "no session found for artifact query"));
			return;
		}
		respond(true, { artifacts: artifacts.map(toSummary) });
	},
	"artifacts.get": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateArtifactsGetParams, "artifacts.get", respond)) return;
		if (!requireQueryable(params, respond)) return;
		const { artifact } = await findArtifact(params, context.getRuntimeConfig?.(), { includeDownloadData: false });
		if (!artifact) {
			respond(false, void 0, artifactError("artifact_not_found", "artifact not found", { artifactId: params.artifactId }));
			return;
		}
		respond(true, { artifact: toSummary(artifact) });
	},
	"artifacts.download": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validateArtifactsDownloadParams, "artifacts.download", respond)) return;
		if (!requireQueryable(params, respond)) return;
		const { artifact } = await findArtifact(params, context.getRuntimeConfig?.(), { downloadArtifactId: params.artifactId });
		if (!artifact) {
			respond(false, void 0, artifactError("artifact_not_found", "artifact not found", { artifactId: params.artifactId }));
			return;
		}
		if (artifact.download.mode === "unsupported") {
			respond(false, void 0, artifactError("artifact_download_unsupported", "artifact download is unsupported", { artifactId: artifact.id }));
			return;
		}
		respond(true, {
			artifact: toSummary(artifact),
			...artifact.download.mode === "bytes" ? {
				encoding: "base64",
				data: artifact.data
			} : {},
			...artifact.download.mode === "url" ? { url: artifact.url } : {}
		});
	}
};
//#endregion
exports.artifactsHandlers = artifactsHandlers;
