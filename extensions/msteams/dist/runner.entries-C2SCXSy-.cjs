const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_fs_safe = require("./fs-safe-BptZQDa1.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
require("./private-temp-workspace-CZ5HRjLT.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_media_services = require("./media-services-CA_NM3C2.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_fetch = require("./fetch-Be5VK67y.cjs");
require("./local-file-access-r6xSCXfB.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_media_reference = require("./media-reference-1HgJGiDy.cjs");
const require_local_audio = require("./local-audio-D1069XCm.cjs");
const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
const require_defaults_constants = require("./defaults.constants-BV5EBB5p.cjs");
const require_resolve = require("./resolve-DZ2KQVXJ.cjs");
const require_operation_retry = require("./operation-retry-DQKBakBo.cjs");
const require_api_key_rotation = require("./api-key-rotation-CuaS0TdR.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_templating = require("./templating-CINnKoW9.cjs");
const require_proxy_fetch = require("./proxy-fetch-Dry5Rpb3.cjs");
const require_official_external_plugin_repair_hints = require("./official-external-plugin-repair-hints-BwPgYT4q.cjs");
const require_input_files = require("./input-files-CRcwDUo1.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let _gabrielvfonseca_media_core_inbound_path_policy = require("@gabrielvfonseca/media-core/inbound-path-policy");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
let _openclaw_fs_safe_errors = require("@openclaw/fs-safe/errors");
//#region src/media-understanding/attachments.normalize.ts
/** Normalizes a local attachment path while rejecting remote file URLs and Windows UNC paths. */
function normalizeAttachmentPath(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
	if (!value) return;
	if (value.startsWith("file://")) try {
		return (0, _openclaw_fs_safe_advanced.safeFileURLToPath)(value);
	} catch {
		return;
	}
	try {
		(0, _openclaw_fs_safe_advanced.assertNoWindowsNetworkPath)(value, "Attachment path");
	} catch {
		return;
	}
	return value;
}
/** Flattens legacy single-value and array media fields into indexed attachment records. */
function normalizeAttachments(ctx) {
	const pathsFromArray = Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths : void 0;
	const urlsFromArray = Array.isArray(ctx.MediaUrls) ? ctx.MediaUrls : void 0;
	const typesFromArray = Array.isArray(ctx.MediaTypes) ? ctx.MediaTypes : void 0;
	const transcribedIndexes = new Set(Array.isArray(ctx.MediaTranscribedIndexes) ? ctx.MediaTranscribedIndexes.filter((index) => Number.isInteger(index) && index >= 0) : []);
	const resolveMime = (count, index) => {
		const typeHint = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typesFromArray?.[index]);
		if (typeHint) return typeHint;
		return count === 1 ? ctx.MediaType : void 0;
	};
	if (pathsFromArray && pathsFromArray.length > 0) {
		const count = pathsFromArray.length;
		const urls = urlsFromArray && urlsFromArray.length > 0 ? urlsFromArray : void 0;
		return pathsFromArray.map((value, index) => ({
			path: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value),
			url: urls?.[index] ?? ctx.MediaUrl,
			mime: resolveMime(count, index),
			index,
			alreadyTranscribed: transcribedIndexes.has(index)
		})).filter((entry) => Boolean(entry.path ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.url)));
	}
	if (urlsFromArray && urlsFromArray.length > 0) {
		const count = urlsFromArray.length;
		return urlsFromArray.map((value, index) => ({
			path: void 0,
			url: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value),
			mime: resolveMime(count, index),
			index,
			alreadyTranscribed: transcribedIndexes.has(index)
		})).filter((entry) => Boolean(entry.url));
	}
	const pathValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MediaPath);
	const url = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MediaUrl);
	if (!pathValue && !url) return [];
	return [{
		path: pathValue || void 0,
		url: url || void 0,
		mime: ctx.MediaType,
		index: 0,
		alreadyTranscribed: transcribedIndexes.has(0)
	}];
}
/** Classifies an attachment by MIME first, then by filename/URL extension fallback. */
function resolveAttachmentKind(attachment) {
	const kind = (0, _gabrielvfonseca_media_core_mime.kindFromMime)(attachment.mime);
	if (kind === "image" || kind === "audio" || kind === "video") return kind;
	const ext = (0, _gabrielvfonseca_media_core_mime.getFileExtension)(attachment.path ?? attachment.url);
	if (!ext) return "unknown";
	if ([
		".mp4",
		".mov",
		".mkv",
		".webm",
		".avi",
		".m4v"
	].includes(ext)) return "video";
	if ((0, _gabrielvfonseca_media_core_mime.isAudioFileName)(attachment.path ?? attachment.url)) return "audio";
	if ([
		".png",
		".jpg",
		".jpeg",
		".webp",
		".gif",
		".bmp",
		".tiff",
		".tif"
	].includes(ext)) return "image";
	return "unknown";
}
/** Returns true when the attachment is classified as video media. */
function isVideoAttachment(attachment) {
	return resolveAttachmentKind(attachment) === "video";
}
/** Returns true when the attachment is classified as audio media. */
function isAudioAttachment(attachment) {
	return resolveAttachmentKind(attachment) === "audio";
}
/** Returns true when the attachment is classified as image media. */
function isImageAttachment(attachment) {
	return resolveAttachmentKind(attachment) === "image";
}
//#endregion
//#region src/media-understanding/attachments.select.ts
const DEFAULT_MAX_ATTACHMENTS = 1;
function orderAttachments(attachments, prefer) {
	const list = Array.isArray(attachments) ? attachments.filter(isAttachmentRecord) : [];
	if (!prefer || prefer === "first") return list;
	if (prefer === "last") return [...list].toReversed();
	if (prefer === "path") {
		const withPath = list.filter((item) => item.path);
		const withoutPath = list.filter((item) => !item.path);
		return [...withPath, ...withoutPath];
	}
	if (prefer === "url") {
		const withUrl = list.filter((item) => item.url);
		const withoutUrl = list.filter((item) => !item.url);
		return [...withUrl, ...withoutUrl];
	}
	return list;
}
function isAttachmentRecord(value) {
	if (!value || typeof value !== "object") return false;
	const entry = value;
	if (typeof entry.index !== "number") return false;
	if (entry.path !== void 0 && typeof entry.path !== "string") return false;
	if (entry.url !== void 0 && typeof entry.url !== "string") return false;
	if (entry.mime !== void 0 && typeof entry.mime !== "string") return false;
	if (entry.alreadyTranscribed !== void 0 && typeof entry.alreadyTranscribed !== "boolean") return false;
	return true;
}
/** Selects attachments for a media-understanding capability under configured ordering limits. */
function selectAttachments(params) {
	const { capability, attachments, policy } = params;
	const matches = (Array.isArray(attachments) ? attachments.filter(isAttachmentRecord) : []).filter((item) => {
		if (capability === "audio" && item.alreadyTranscribed) return false;
		if (capability === "image") return isImageAttachment(item);
		if (capability === "audio") return isAudioAttachment(item);
		return isVideoAttachment(item);
	});
	if (matches.length === 0) return [];
	const ordered = orderAttachments(matches, policy?.prefer);
	const mode = policy?.mode ?? "first";
	const maxAttachments = policy?.maxAttachments ?? DEFAULT_MAX_ATTACHMENTS;
	if (mode === "all") return ordered.slice(0, Math.max(1, maxAttachments));
	return ordered.slice(0, 1);
}
//#endregion
//#region packages/media-understanding-common/src/errors.ts
/** Error used when a media attachment should be skipped without failing the whole request. */
var MediaUnderstandingSkipError = class extends Error {
	constructor(reason, message) {
		super(message);
		this.reason = reason;
		this.name = "MediaUnderstandingSkipError";
	}
};
/** Narrow unknown errors to media-understanding skip errors. */
function isMediaUnderstandingSkipError(err) {
	return err instanceof MediaUnderstandingSkipError;
}
//#endregion
//#region src/media-understanding/attachments.cache.ts
const REMOTE_MEDIA_FETCH_RETRY = {
	attempts: 3,
	minDelayMs: 500,
	maxDelayMs: 3e3,
	jitter: .2
};
let defaultLocalPathRoots;
function concreteMime(mime) {
	const normalized = mime?.trim();
	if (!normalized || normalized.endsWith("/*")) return;
	return normalized;
}
function getDefaultLocalPathRoots() {
	defaultLocalPathRoots ??= (0, _gabrielvfonseca_media_core_inbound_path_policy.mergeInboundPathRoots)(require_local_roots.getDefaultMediaLocalRoots());
	return defaultLocalPathRoots;
}
function resolveUsableLocalCandidate(candidate, roots) {
	try {
		const realPath = (0, node_fs.realpathSync)(candidate);
		const canonicalRoots = roots.map((root) => {
			if (root.includes("*")) return root;
			try {
				return (0, node_fs.realpathSync)(root);
			} catch {
				return root;
			}
		});
		return (0, node_fs.statSync)(realPath).isFile() && (0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
			filePath: realPath,
			roots: canonicalRoots
		}) ? candidate : void 0;
	} catch {
		return;
	}
}
/**
* Lazy resolver for media-understanding attachments.
*
* The cache prefers allowed local paths, falls back to remote URLs when a local path is blocked
* or missing, and owns any temporary files created for providers that require a filesystem path.
*/
var MediaAttachmentCache = class {
	constructor(attachments, options) {
		this.entries = /* @__PURE__ */ new Map();
		this.attachments = attachments;
		this.ssrfPolicy = options?.ssrfPolicy;
		this.localPathRoots = options?.includeDefaultLocalPathRoots === false ? (0, _gabrielvfonseca_media_core_inbound_path_policy.mergeInboundPathRoots)(options.localPathRoots) : (0, _gabrielvfonseca_media_core_inbound_path_policy.mergeInboundPathRoots)(options?.localPathRoots, getDefaultLocalPathRoots());
		this.workspaceDir = options?.workspaceDir ? node_path.default.resolve(options.workspaceDir) : void 0;
		for (const attachment of attachments) this.entries.set(attachment.index, { attachment });
	}
	/** Returns attachment bytes, MIME hint, filename, and size within the requested byte limit. */
	async getBuffer(params) {
		const entry = await this.ensureEntry(params.attachmentIndex);
		const url = entry.attachment.url?.trim();
		if (entry.buffer) {
			if (entry.buffer.length > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			return {
				buffer: entry.buffer,
				mime: entry.bufferMime,
				fileName: entry.bufferFileName ?? `media-${params.attachmentIndex + 1}`,
				size: entry.buffer.length
			};
		}
		if (entry.resolvedPath) try {
			const size = await this.ensureLocalStat(entry);
			if (entry.resolvedPath) {
				if (size !== void 0 && size > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
				const { buffer, filePath } = await this.readLocalBuffer({
					attachmentIndex: params.attachmentIndex,
					filePath: entry.resolvedPath,
					maxBytes: params.maxBytes
				});
				entry.resolvedPath = filePath;
				entry.buffer = buffer;
				entry.bufferMime = entry.bufferMime ?? await (0, _gabrielvfonseca_media_core_mime.detectMime)({
					buffer,
					filePath,
					headerMime: concreteMime(entry.attachment.mime)
				});
				entry.bufferFileName = node_path.default.basename(filePath) || `media-${params.attachmentIndex + 1}`;
				return {
					buffer,
					mime: entry.bufferMime,
					fileName: entry.bufferFileName,
					size: buffer.length
				};
			}
		} catch (err) {
			if (!(err instanceof MediaUnderstandingSkipError) || !url || err.reason !== "blocked" && err.reason !== "empty") throw err;
		}
		if (!url) throw new MediaUnderstandingSkipError("empty", `Attachment ${params.attachmentIndex + 1} has no path or URL.`);
		try {
			const fetched = await require_fetch.readRemoteMediaBuffer({
				url,
				timeoutMs: params.timeoutMs,
				maxBytes: params.maxBytes,
				ssrfPolicy: this.ssrfPolicy,
				retry: REMOTE_MEDIA_FETCH_RETRY
			});
			entry.buffer = fetched.buffer;
			entry.bufferMime = await (0, _gabrielvfonseca_media_core_mime.detectMime)({
				buffer: fetched.buffer,
				filePath: fetched.fileName ?? url,
				headerMime: concreteMime(entry.attachment.mime),
				additionalMimeHints: [fetched.contentType]
			});
			entry.bufferFileName = fetched.fileName ?? `media-${params.attachmentIndex + 1}`;
			return {
				buffer: fetched.buffer,
				mime: entry.bufferMime,
				fileName: entry.bufferFileName,
				size: fetched.buffer.length
			};
		} catch (err) {
			if (err instanceof require_fetch.MediaFetchError && err.code === "max_bytes") throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			if (require_abort_signal.isAbortError(err)) throw new MediaUnderstandingSkipError("timeout", `Attachment ${params.attachmentIndex + 1} timed out while fetching.`);
			throw err;
		}
	}
	/** Returns a local path for providers that cannot accept buffers, creating a temp file if needed. */
	async getPath(params) {
		const entry = await this.ensureEntry(params.attachmentIndex);
		if (entry.resolvedPath) {
			if (params.maxBytes) try {
				const size = await this.ensureLocalStat(entry);
				if (entry.resolvedPath) {
					if (size !== void 0 && size > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
				}
			} catch (err) {
				if (!(err instanceof MediaUnderstandingSkipError) || err.reason !== "blocked" && err.reason !== "empty") throw err;
			}
			if (entry.resolvedPath) return { path: entry.resolvedPath };
		}
		if (entry.tempPath) {
			if (params.maxBytes && entry.buffer && entry.buffer.length > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			return {
				path: entry.tempPath,
				cleanup: entry.tempCleanup
			};
		}
		const maxBytes = params.maxBytes ?? Number.POSITIVE_INFINITY;
		const bufferResult = await this.getBuffer({
			attachmentIndex: params.attachmentIndex,
			maxBytes,
			timeoutMs: params.timeoutMs
		});
		const tmpPath = require_clawhub.buildRandomTempFilePath({
			prefix: "operator-media",
			extension: node_path.default.extname(bufferResult.fileName || "") || ""
		});
		await node_fs_promises.default.writeFile(tmpPath, bufferResult.buffer);
		entry.tempPath = tmpPath;
		entry.tempCleanup = async () => {
			await node_fs_promises.default.unlink(tmpPath).catch(() => {});
		};
		return {
			path: tmpPath,
			cleanup: entry.tempCleanup
		};
	}
	/** Removes temporary files created by `getPath`; callers should run this after provider use. */
	async cleanup() {
		const cleanups = [];
		for (const entry of this.entries.values()) if (entry.tempCleanup) {
			cleanups.push(entry.tempCleanup());
			entry.tempCleanup = void 0;
		}
		await Promise.all(cleanups);
	}
	async ensureEntry(attachmentIndex) {
		const existing = this.entries.get(attachmentIndex);
		if (existing) {
			if (!existing.resolvedPath) existing.resolvedPath = await this.resolveLocalPath(existing.attachment);
			return existing;
		}
		const attachment = this.attachments.find((item) => item.index === attachmentIndex) ?? { index: attachmentIndex };
		const entry = {
			attachment,
			resolvedPath: await this.resolveLocalPath(attachment)
		};
		this.entries.set(attachmentIndex, entry);
		return entry;
	}
	async resolveLocalPath(attachment) {
		const rawPath = normalizeAttachmentPath(attachment.path);
		if (!rawPath) return;
		const inboundReference = await require_media_reference.resolveInboundMediaReference(rawPath).catch(() => null);
		if (inboundReference) return inboundReference.physicalPath;
		if (this.workspaceDir) return node_path.default.resolve(this.workspaceDir, rawPath);
		if (!node_path.default.isAbsolute(rawPath)) {
			const usableCwdCandidate = resolveUsableLocalCandidate(node_path.default.resolve(rawPath), this.localPathRoots);
			if (usableCwdCandidate) return usableCwdCandidate;
			const usableStateCandidate = resolveUsableLocalCandidate(node_path.default.resolve(require_paths.resolveStateDir(), rawPath), this.localPathRoots);
			if (usableStateCandidate) return usableStateCandidate;
		}
		return node_path.default.resolve(rawPath);
	}
	async ensureLocalStat(entry) {
		if (!entry.resolvedPath) return;
		if (!(0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
			filePath: entry.resolvedPath,
			roots: this.localPathRoots
		})) {
			const canonicalRoots = await this.getCanonicalLocalPathRoots();
			if (!(0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
				filePath: entry.resolvedPath,
				roots: canonicalRoots
			})) {
				entry.resolvedPath = void 0;
				if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Blocked attachment path outside allowed roots: ${entry.attachment.path ?? entry.attachment.url ?? "(unknown)"}`);
				throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} path is outside allowed roots.`);
			}
		}
		if (entry.statSize !== void 0) return entry.statSize;
		try {
			const currentPath = entry.resolvedPath;
			const opened = await (0, _openclaw_fs_safe_root.openLocalFileSafely)({ filePath: currentPath });
			let canonicalRoots;
			try {
				canonicalRoots = await this.getCanonicalLocalPathRoots();
			} finally {
				await opened.handle.close().catch(() => {});
			}
			if (!(0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
				filePath: opened.realPath,
				roots: canonicalRoots
			})) {
				entry.resolvedPath = void 0;
				if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Blocked canonicalized attachment path outside allowed roots: ${opened.realPath}`);
				throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} path is outside allowed roots.`);
			}
			entry.resolvedPath = opened.realPath;
			entry.statSize = opened.stat.size;
			return opened.stat.size;
		} catch (err) {
			if (err instanceof MediaUnderstandingSkipError) throw err;
			if (err instanceof _openclaw_fs_safe_errors.FsSafeError) {
				entry.resolvedPath = void 0;
				if (err.code === "not-file") throw new MediaUnderstandingSkipError("empty", `Attachment ${entry.attachment.index + 1} path is not a regular file.`);
				if (err.code !== "not-found") throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} path is outside allowed roots.`);
			} else throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} could not be canonicalized.`);
			entry.resolvedPath = void 0;
			if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Failed to read attachment ${entry.attachment.index + 1}: ${String(err)}`);
			return;
		}
	}
	async getCanonicalLocalPathRoots() {
		if (this.canonicalLocalPathRoots) return await this.canonicalLocalPathRoots;
		this.canonicalLocalPathRoots = (async () => (0, _gabrielvfonseca_media_core_inbound_path_policy.mergeInboundPathRoots)(this.localPathRoots, await Promise.all(this.localPathRoots.map(async (root) => {
			if (root.includes("*")) return root;
			return await node_fs_promises.default.realpath(root).catch(() => root);
		}))))();
		return await this.canonicalLocalPathRoots;
	}
	async readLocalBuffer(params) {
		let opened;
		try {
			opened = await (0, _openclaw_fs_safe_root.openLocalFileSafely)({ filePath: params.filePath });
			if (opened.stat.size > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			const canonicalRoots = await this.getCanonicalLocalPathRoots();
			if (!(0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
				filePath: opened.realPath,
				roots: canonicalRoots
			})) throw new MediaUnderstandingSkipError("blocked", `Attachment ${params.attachmentIndex + 1} path is outside allowed roots.`);
			const buffer = await opened.handle.readFile();
			if (buffer.length > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			return {
				buffer,
				filePath: opened.realPath
			};
		} catch (err) {
			if (err instanceof _openclaw_fs_safe_errors.FsSafeError) {
				if (err.code === "too-large") throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
				if (err.code === "not-file" || err.code === "not-found") throw new MediaUnderstandingSkipError("empty", `Attachment ${params.attachmentIndex + 1} path is not a regular file.`);
				throw new MediaUnderstandingSkipError("blocked", `Attachment ${params.attachmentIndex + 1} path is outside allowed roots.`);
			}
			throw err;
		} finally {
			await opened?.handle.close().catch(() => {});
		}
	}
};
//#endregion
//#region src/media-understanding/openai-audio-api.ts
const OPENAI_AUDIO_TRANSCRIPTIONS_API = "openai-audio-transcriptions";
function resolveOpenAiAudioAuthModelApi(params) {
	if (params.capability === "audio" && params.providerId.trim().toLowerCase() === "openai") return OPENAI_AUDIO_TRANSCRIPTIONS_API;
}
//#endregion
//#region packages/media-understanding-common/src/output-extract.ts
/** Parse the last JSON object in a noisy provider output string. */
function extractLastJsonObject(raw) {
	const trimmed = raw.trim();
	const ranges = [];
	const starts = [];
	let inString = false;
	let escaped = false;
	let preambleQuote;
	let preambleEscaped = false;
	let previousSignificant;
	let lineHasNonWhitespace = false;
	let arrayDepth = 0;
	let candidateHasContent = false;
	for (let index = 0; index < trimmed.length; index += 1) {
		const character = trimmed.charAt(index);
		if (inString) {
			if (character === "\n" || character === "\r") {
				starts.length = 0;
				inString = false;
				escaped = false;
			} else if (escaped) escaped = false;
			else if (character === "\\") escaped = true;
			else if (character === "\"") inString = false;
			continue;
		}
		if (starts.length === 0) {
			if (preambleQuote !== void 0) {
				if (character === "\n" || character === "\r") {
					preambleQuote = void 0;
					preambleEscaped = false;
				} else if (preambleEscaped) preambleEscaped = false;
				else if (character === "\\") preambleEscaped = true;
				else if (character === preambleQuote) preambleQuote = void 0;
				continue;
			}
			if (character === "\"" || character === "'" || character === "`") {
				const previous = trimmed[index - 1];
				if (previous === void 0 || /[\s:([{]/.test(previous)) {
					preambleQuote = character;
					preambleEscaped = false;
					continue;
				}
			}
			if (character === "{") {
				arrayDepth = 0;
				candidateHasContent = false;
				starts.push(index);
			}
			if (!/\s/.test(character)) {
				previousSignificant = character;
				lineHasNonWhitespace = true;
			} else if (character === "\n" || character === "\r") lineHasNonWhitespace = false;
			continue;
		}
		const hadCandidateContent = candidateHasContent;
		if (character === "\"") inString = true;
		else if (character === "{") {
			if (previousSignificant === ":" || previousSignificant === "[" || previousSignificant === "\"" || previousSignificant === "," && (lineHasNonWhitespace || arrayDepth > 0)) starts.push(index);
			else if (!lineHasNonWhitespace && !hadCandidateContent) {
				starts.length = 1;
				starts[0] = index;
				arrayDepth = 0;
				candidateHasContent = false;
			}
		} else if (character === "}" && starts.length > 0) {
			const start = starts.pop();
			if (start !== void 0 && starts.length === 0) ranges.push({
				start,
				end: index
			});
		} else if (character === "[") arrayDepth += 1;
		else if (character === "]" && arrayDepth > 0) arrayDepth -= 1;
		if (!/\s/.test(character)) {
			candidateHasContent = true;
			previousSignificant = character;
			lineHasNonWhitespace = true;
		} else if (character === "\n" || character === "\r") lineHasNonWhitespace = false;
	}
	for (const range of ranges.toReversed()) try {
		return JSON.parse(trimmed.slice(range.start, range.end + 1));
	} catch {}
	return null;
}
/** Extract Gemini CLI-style response text from the last JSON object in output. */
function extractGeminiResponse(raw) {
	const payload = extractLastJsonObject(raw);
	if (!payload || typeof payload !== "object") return null;
	const response = payload.response;
	if (typeof response !== "string") return null;
	return response.trim() || null;
}
//#endregion
//#region packages/media-understanding-common/src/video.ts
/** Estimate base64 size for a byte count. */
function estimateBase64Size(bytes) {
	return Math.ceil(bytes / 3) * 4;
}
/** Resolve video base64 byte limit from raw byte limit and global cap. */
function resolveVideoMaxBase64Bytes(maxBytes) {
	const expanded = estimateBase64Size(maxBytes);
	return Math.min(expanded, require_defaults_constants.DEFAULT_VIDEO_MAX_BASE64_BYTES);
}
//#endregion
//#region src/media-understanding/image-input-normalize.ts
const HEIC_MIME_RE = /^image\/hei[cf]$/i;
const HEIC_EXT_RE = /\.(heic|heif)$/i;
function isHeicInput(params) {
	const mime = require_input_files.normalizeMimeType(params.mime);
	if (mime && HEIC_MIME_RE.test(mime)) return true;
	const fileName = params.fileName?.trim();
	return Boolean(fileName && HEIC_EXT_RE.test(fileName));
}
/** Normalizes image bytes before provider execution, converting HEIC/HEIF inputs to JPEG. */
async function normalizeImageDescriptionInput(params) {
	if (!isHeicInput(params)) return {
		buffer: params.buffer,
		mime: params.mime
	};
	const sourceMime = require_input_files.normalizeMimeType(params.mime) ?? "image/heic";
	const image = await require_input_files.extractImageContentFromSource({
		type: "base64",
		data: params.buffer.toString("base64"),
		mediaType: sourceMime
	}, {
		allowUrl: false,
		allowedMimes: /* @__PURE__ */ new Set([
			sourceMime.toLowerCase(),
			"image/heic",
			"image/heif",
			"image/jpeg"
		]),
		maxBytes: params.maxBytes ?? require_defaults_constants.DEFAULT_MAX_BYTES.image,
		maxRedirects: 0,
		timeoutMs: 0
	});
	return {
		buffer: Buffer.from(image.data, "base64"),
		mime: image.mimeType
	};
}
//#endregion
//#region src/media-understanding/runner.entries.ts
const loadModelAuth = require_lazy_runtime.createLazyRuntimeModule(async () => await Promise.resolve().then(() => require("./model-auth-D9ZnqE0T.cjs")).then((n) => n.model_auth_exports));
function resolveLiteralProviderApiKey(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(params.cfg.models?.providers?.[params.providerId]?.apiKey);
}
function sanitizeProviderHeaders(headers) {
	if (!headers) return;
	const next = {};
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value !== "string") continue;
		next[key] = value;
	}
	return Object.keys(next).length > 0 ? next : void 0;
}
function trimOutput(text, maxChars) {
	const trimmed = text.trim();
	if (!maxChars || trimmed.length <= maxChars) return trimmed;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, maxChars).trim();
}
function extractSherpaOnnxText(raw) {
	const noMatch = {
		matched: false,
		text: ""
	};
	const tryParse = (value) => {
		const trimmed = value.trim();
		if (!trimmed) return noMatch;
		const head = trimmed[0];
		if (head !== "{" && head !== "\"") return noMatch;
		try {
			const parsed = JSON.parse(trimmed);
			if (typeof parsed === "string") return tryParse(parsed);
			if (parsed && typeof parsed === "object") {
				const text = parsed.text;
				if (typeof text === "string") return {
					matched: true,
					text: text.trim()
				};
			}
		} catch {}
		return noMatch;
	};
	const direct = tryParse(raw);
	if (direct.matched) return direct;
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.split("\n"));
	for (let i = lines.length - 1; i >= 0; i -= 1) {
		const parsed = tryParse(lines[i] ?? "");
		if (parsed.matched) return parsed;
	}
	return noMatch;
}
function commandBase(command) {
	return node_path.default.parse(command).name;
}
function isAntigravityCliCommand(command) {
	const commandId = commandBase(command);
	return commandId === "agy" || commandId === "antigravity";
}
function findArgValue(args, keys) {
	for (const [index, arg] of args.entries()) {
		if (keys.includes(arg)) {
			const value = args[index + 1];
			if (value) return value;
		}
		for (const key of keys) {
			const prefix = `${key}=`;
			if (arg.startsWith(prefix)) {
				const value = arg.slice(prefix.length);
				if (value) return value;
			}
		}
	}
}
function hasArg(args, keys) {
	return args.some((arg) => keys.includes(arg));
}
function resolveWhisperOutputPath(args, mediaPath) {
	const outputDir = findArgValue(args, ["--output_dir", "-o"]);
	if (!outputDir) return null;
	const outputFormat = findArgValue(args, ["--output_format", "-f"]) ?? "all";
	if (outputFormat !== "txt" && outputFormat !== "all") return null;
	return node_path.default.join(outputDir, `${node_path.default.parse(mediaPath).name}.txt`);
}
function resolveWhisperCppOutputPath(args) {
	if (!hasArg(args, ["-otxt", "--output-txt"])) return null;
	const outputBase = findArgValue(args, ["-of", "--output-file"]);
	if (!outputBase) return null;
	return `${outputBase}.txt`;
}
function resolveParakeetOutputPath(args, mediaPath) {
	const outputDir = findArgValue(args, ["--output-dir"]);
	const outputFormat = findArgValue(args, ["--output-format"]) ?? (process.env.PARAKEET_OUTPUT_FORMAT || "srt");
	const outputTemplate = findArgValue(args, ["--output-template"]) ?? (process.env.PARAKEET_OUTPUT_TEMPLATE || "{filename}");
	if (!outputDir || outputFormat !== "txt" && outputFormat !== "all" || outputTemplate !== "{filename}") return null;
	return node_path.default.join(outputDir, `${node_path.default.parse(mediaPath).name}.txt`);
}
async function readCliTranscriptFile(filePath) {
	try {
		return (await node_fs_promises.default.readFile(filePath, "utf8")).trim();
	} catch (error) {
		if (require_errors.hasErrnoCode(error, "ENOENT")) return "";
		throw error;
	}
}
async function resolveCliOutput(params) {
	const commandId = commandBase(params.command);
	const fileOutput = commandId === "whisper-cli" ? resolveWhisperCppOutputPath(params.args) : commandId === "whisper" ? resolveWhisperOutputPath(params.args, params.mediaPath) : commandId === "parakeet-mlx" ? resolveParakeetOutputPath(params.args, params.mediaPath) : null;
	if (fileOutput) return await readCliTranscriptFile(fileOutput);
	if (commandId === "gemini") {
		const response = extractGeminiResponse(params.stdout);
		if (response) return response;
	}
	if (commandId === "sherpa-onnx-offline") {
		const response = extractSherpaOnnxText(params.stdout);
		if (response.matched) return response.text;
	}
	return params.stdout.trim();
}
async function resolveCliMediaPath(params) {
	const commandId = commandBase(params.command);
	if (params.capability !== "audio" || commandId !== "whisper-cli") return params.mediaPath;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.extname(params.mediaPath)) === ".wav") return params.mediaPath;
	const wavPath = node_path.default.join(params.outputDir, `${node_path.default.parse(params.mediaPath).name}.wav`);
	await node_fs_promises.default.mkdir(params.outputDir, { recursive: true });
	await require_fs_safe.writeExternalFileWithinRoot({
		rootDir: params.outputDir,
		path: node_path.default.basename(wavPath),
		write: async (outputPath) => {
			await require_media_services.runFfmpeg([
				"-y",
				"-i",
				params.mediaPath,
				"-ac",
				"1",
				"-ar",
				"16000",
				"-c:a",
				"pcm_s16le",
				"-f",
				"wav",
				outputPath
			]);
		}
	});
	return wavPath;
}
function normalizeProviderQuery(options) {
	if (!options) return;
	const query = {};
	for (const [key, value] of Object.entries(options)) {
		if (value === void 0) continue;
		query[key] = value;
	}
	return Object.keys(query).length > 0 ? query : void 0;
}
function buildDeepgramCompatQuery(options) {
	if (!options) return;
	const query = {};
	if (typeof options.detectLanguage === "boolean") query.detect_language = options.detectLanguage;
	if (typeof options.punctuate === "boolean") query.punctuate = options.punctuate;
	if (typeof options.smartFormat === "boolean") query.smart_format = options.smartFormat;
	return Object.keys(query).length > 0 ? query : void 0;
}
function normalizeDeepgramQueryKeys(query) {
	const normalized = { ...query };
	if ("detectLanguage" in normalized) {
		normalized.detect_language = normalized.detectLanguage;
		delete normalized.detectLanguage;
	}
	if ("smartFormat" in normalized) {
		normalized.smart_format = normalized.smartFormat;
		delete normalized.smartFormat;
	}
	return normalized;
}
function resolveProviderQuery(params) {
	const { providerId, config, entry } = params;
	const mergedOptions = normalizeProviderQuery({
		...config?.providerOptions?.[providerId],
		...entry.providerOptions?.[providerId]
	});
	if (providerId !== "deepgram") return mergedOptions;
	const query = normalizeDeepgramQueryKeys(mergedOptions ?? {});
	const compat = buildDeepgramCompatQuery({
		...config?.deepgram,
		...entry.deepgram
	});
	for (const [key, value] of Object.entries(compat ?? {})) if (query[key] === void 0) query[key] = value;
	return Object.keys(query).length > 0 ? query : void 0;
}
/** Builds the normalized decision record for one provider or CLI model attempt. */
function buildModelDecision(params) {
	if (params.entryType === "cli") {
		const command = params.entry.command?.trim();
		const requestedBackend = command ? require_local_audio.resolveRequestedLocalAudioBackend({
			command,
			args: params.entry.args ?? []
		}) : void 0;
		return {
			type: "cli",
			provider: command ?? "cli",
			model: params.entry.model ?? command,
			...requestedBackend ? { requestedBackend } : {},
			outcome: params.outcome,
			reason: params.reason
		};
	}
	const providerIdRaw = params.entry.provider?.trim();
	return {
		type: "provider",
		provider: (providerIdRaw ? require_provider_id.normalizeMediaProviderId(providerIdRaw) : void 0) ?? providerIdRaw,
		model: params.entry.model,
		outcome: params.outcome,
		reason: params.reason
	};
}
function resolveEntryRunOptions(params) {
	const { capability, entry, cfg } = params;
	const maxBytes = require_resolve.resolveMaxBytes({
		capability,
		entry,
		cfg,
		config: params.config
	});
	const maxChars = require_resolve.resolveMaxChars({
		capability,
		entry,
		cfg,
		config: params.config
	});
	const timeoutMs = require_resolve.resolveTimeoutMs(entry.timeoutSeconds ?? params.config?.timeoutSeconds ?? cfg.tools?.media?.[capability]?.timeoutSeconds, require_defaults_constants.DEFAULT_TIMEOUT_SECONDS[capability]);
	const configuredPrompt = entry.prompt ?? params.config?.prompt ?? cfg.tools?.media?.[capability]?.prompt;
	return {
		maxBytes,
		maxChars,
		timeoutMs,
		prompt: require_resolve.resolvePrompt(capability, configuredPrompt, maxChars),
		hasConfiguredPrompt: Boolean(configuredPrompt?.trim())
	};
}
function resolveMediaRequestOverrides(config) {
	const overrides = config ?? {};
	return {
		prompt: overrides["_requestPromptOverride"],
		language: overrides["_requestLanguageOverride"]
	};
}
function resolveAudioProviderPrompt(params) {
	const language = params.language?.trim().toLowerCase();
	const isEnglish = !language || language === "en" || language === "eng" || language === "english" || language.startsWith("en-") || language.startsWith("en_");
	if (params.hasConfiguredPrompt || isEnglish) return params.prompt;
}
function resolveProviderExecutionAuthModelApi(params) {
	return resolveOpenAiAudioAuthModelApi(params);
}
async function resolveProviderExecutionAuth(params) {
	const providerConfig = params.cfg.models?.providers?.[params.providerId];
	const modelApi = resolveProviderExecutionAuthModelApi({
		capability: params.capability,
		providerId: params.providerId
	});
	const literalApiKey = resolveLiteralProviderApiKey({
		cfg: params.cfg,
		providerId: params.providerId
	});
	if (literalApiKey) return {
		kind: "api-key",
		apiKeys: require_api_key_rotation.collectProviderApiKeysForExecution({
			provider: params.providerId,
			primaryApiKey: literalApiKey
		}),
		source: `models.providers.${params.providerId}.apiKey`,
		providerConfig
	};
	const resolveMediaProviderAuth = () => {
		const context = {
			config: params.cfg,
			provider: params.providerId,
			providerConfig
		};
		const providerAuth = params.provider?.resolveAuth?.(context);
		if (!providerAuth) {
			const syntheticAuth = params.provider?.resolveSyntheticAuth?.(context);
			const syntheticApiKey = syntheticAuth?.apiKey.trim();
			const syntheticSource = syntheticAuth?.source;
			return syntheticApiKey ? {
				kind: "api-key",
				apiKeys: require_api_key_rotation.collectProviderApiKeysForExecution({
					provider: params.providerId,
					primaryApiKey: syntheticApiKey
				}),
				source: syntheticSource,
				providerConfig
			} : void 0;
		}
		if (providerAuth.kind === "none") return {
			kind: "none",
			source: providerAuth.source,
			providerConfig
		};
		const apiKey = providerAuth.apiKey.trim();
		if (!apiKey) return;
		return {
			kind: "api-key",
			apiKeys: require_api_key_rotation.collectProviderApiKeysForExecution({
				provider: params.providerId,
				primaryApiKey: apiKey
			}),
			source: providerAuth.source,
			providerConfig
		};
	};
	const { isProviderAuthError, requireApiKey, resolveApiKeyForProvider } = await loadModelAuth();
	try {
		const auth = await resolveApiKeyForProvider({
			provider: params.providerId,
			cfg: params.cfg,
			profileId: params.entry.profile,
			preferredProfile: params.entry.preferredProfile,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			modelApi
		});
		const apiKey = requireApiKey(auth, params.providerId);
		return {
			kind: "api-key",
			apiKeys: require_api_key_rotation.collectProviderApiKeysForExecution({
				provider: params.providerId,
				primaryApiKey: apiKey
			}),
			source: auth.source,
			providerConfig
		};
	} catch (err) {
		if (!isProviderAuthError(err, "missing-provider-auth") && !isProviderAuthError(err, "missing-api-key")) throw err;
		const mediaAuth = resolveMediaProviderAuth();
		if (mediaAuth) return mediaAuth;
		throw err;
	}
}
async function resolveProviderExecutionContext(params) {
	const auth = await resolveProviderExecutionAuth({
		capability: params.capability,
		providerId: params.providerId,
		provider: params.provider,
		cfg: params.cfg,
		entry: params.entry,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
	const providerConfig = auth.providerConfig;
	const baseUrl = params.entry.baseUrl ?? params.config?.baseUrl ?? providerConfig?.baseUrl;
	const mergedHeaders = {
		...sanitizeProviderHeaders(providerConfig?.headers),
		...sanitizeProviderHeaders(params.config?.headers),
		...sanitizeProviderHeaders(params.entry.headers)
	};
	return {
		auth,
		baseUrl,
		headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : void 0,
		request: require_provider_request_config.mergeModelProviderRequestOverrides(require_provider_request_config.sanitizeConfiguredModelProviderRequest(providerConfig?.request), require_provider_request_config.sanitizeConfiguredProviderRequest(params.config?.request), require_provider_request_config.sanitizeConfiguredProviderRequest(params.entry.request))
	};
}
/** Formats a compact operator-facing summary of a media-understanding decision. */
function formatDecisionSummary(decision) {
	const attachments = Array.isArray(decision.attachments) ? decision.attachments : [];
	const total = attachments.length;
	const success = attachments.filter((entry) => entry?.chosen?.outcome === "success").length;
	const chosen = attachments.find((entry) => entry?.chosen)?.chosen;
	const provider = typeof chosen?.provider === "string" ? chosen.provider.trim() : void 0;
	const model = typeof chosen?.model === "string" ? chosen.model.trim() : void 0;
	const modelLabel = provider ? model && model !== provider ? `${provider}/${model}` : provider : void 0;
	const backendLabel = chosen?.observedBackend ? ` observed=${chosen.observedBackend}` : chosen?.requestedBackend ? ` requested=${chosen.requestedBackend}` : "";
	const shortReason = summarizeDecisionReason(findDecisionReason(decision, decision.outcome === "failed" ? "failed" : void 0));
	const countLabel = total > 0 ? ` (${success}/${total})` : "";
	const viaLabel = modelLabel ? ` via ${modelLabel}${backendLabel}` : "";
	const reasonLabel = shortReason ? ` reason=${shortReason}` : "";
	return `${decision.capability}: ${decision.outcome}${countLabel}${viaLabel}${reasonLabel}`;
}
/** Returns the first non-empty attempt reason, optionally filtered by outcome. */
function findDecisionReason(decision, outcome) {
	const attachments = Array.isArray(decision.attachments) ? decision.attachments : [];
	for (const attachment of attachments) {
		const attempts = Array.isArray(attachment?.attempts) ? attachment.attempts : [];
		for (const attempt of attempts) {
			if (outcome && attempt.outcome !== outcome) continue;
			if (typeof attempt.reason !== "string" || attempt.reason.trim().length === 0) continue;
			return attempt.reason;
		}
	}
}
/** Trims provider/runtime error prefixes into a stable human-readable reason. */
function normalizeDecisionReason(reason) {
	const trimmed = typeof reason === "string" ? reason.trim() : "";
	if (!trimmed) return;
	return trimmed.replace(/^Error:\s*/i, "").trim() || void 0;
}
/** Produces the short reason token used in status and decision summary output. */
function summarizeDecisionReason(reason) {
	const normalized = normalizeDecisionReason(reason);
	if (!normalized) return;
	return normalized.split(":")[0]?.trim() || void 0;
}
function assertMinAudioSize(params) {
	if (params.size >= 1024) return;
	throw new MediaUnderstandingSkipError("tooSmall", `Audio attachment ${params.attachmentIndex + 1} is too small (${params.size} bytes, minimum ${require_defaults_constants.MIN_AUDIO_FILE_BYTES})`);
}
/**
* Build an actionable hint suffix for "provider not available" errors.
*
* Restricts the hint to ids that are owned by the official external
* provider catalog — NOT the combined channel/plugin catalog — so a media
* provider id like `feishu` (an official channel, not a media provider)
* never emits a misleading install hint from a media-provider error.
*
* Tier 1: provider id is owned by an official external provider entry that
*   declares a `contracts.mediaUnderstandingProviders` block listing the
*   id — emit the catalog-backed install + registry refresh + doctor fix
*   commands.
* Tier 2: empty string — keeps the legacy message verbatim for ids that
*   are not in the provider catalog (channel ids, plugin ids, unknown
*   ids, internal ids, etc.). Newly externalized media providers must
*   register with the official external provider catalog to receive the
*   actionable hint.
*/
function formatMissingProviderHint(providerId) {
	const trimmed = providerId.trim();
	if (!trimmed) return "";
	if (!require_official_external_plugin_catalog.listOfficialExternalProviderCatalogEntries().find((entry) => {
		return (require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(entry)?.contracts?.mediaUnderstandingProviders ?? []).some((mediaId) => mediaId === trimmed);
	})) return "";
	const catalogHint = require_official_external_plugin_repair_hints.resolveOfficialExternalPluginRepairHint(trimmed);
	if (!catalogHint) return "";
	return ` Install the official external plugin with: ${require_command_format.formatCliCommand(catalogHint.installCommand)}, then run ${require_command_format.formatCliCommand("openclaw plugins registry --refresh")} and stop and start the gateway service, or run ${require_command_format.formatCliCommand(catalogHint.doctorFixCommand)} to repair automatically.`;
}
/** Executes one provider-backed media-understanding entry for one attachment. */
async function runProviderEntry(params) {
	const { entry, capability, cfg } = params;
	const providerIdRaw = entry.provider?.trim();
	if (!providerIdRaw) throw new Error(`Provider entry missing provider for ${capability}`);
	const providerId = require_provider_id.normalizeMediaProviderId(providerIdRaw);
	const requestProviderId = require_provider_id.normalizeMediaExecutionProviderId(providerIdRaw);
	const { maxBytes, maxChars, timeoutMs, prompt, hasConfiguredPrompt } = resolveEntryRunOptions({
		capability,
		entry,
		cfg,
		config: params.config
	});
	if (capability === "image") {
		if (!params.agentDir) throw new Error("Image understanding requires agentDir");
		const modelId = entry.model?.trim();
		if (!modelId) throw new Error("Image understanding requires model id");
		const media = await params.cache.getBuffer({
			attachmentIndex: params.attachmentIndex,
			maxBytes,
			timeoutMs
		});
		const normalizedMedia = await normalizeImageDescriptionInput({
			buffer: media.buffer,
			fileName: media.fileName,
			mime: media.mime,
			maxBytes
		});
		const requestOverrides = resolveMediaRequestOverrides(params.config);
		const provider = require_defaults_constants.getMediaUnderstandingProvider(requestProviderId, params.providerRegistry);
		const imageInput = {
			buffer: normalizedMedia.buffer,
			fileName: media.fileName,
			mime: normalizedMedia.mime,
			model: modelId,
			provider: requestProviderId,
			prompt: requestOverrides.prompt ?? prompt,
			timeoutMs,
			profile: entry.profile,
			preferredProfile: entry.preferredProfile,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			cfg: params.cfg
		};
		const result = await (provider?.describeImage ?? require_defaults_constants.describeImageWithModel)(imageInput);
		return {
			kind: "image.description",
			attachmentIndex: params.attachmentIndex,
			text: trimOutput(result.text, maxChars),
			provider: requestProviderId,
			model: result.model ?? modelId
		};
	}
	const provider = require_defaults_constants.getMediaUnderstandingProvider(providerId, params.providerRegistry);
	if (!provider) throw new Error(`Media provider not available: ${providerId}${formatMissingProviderHint(providerId)}`);
	const fetchFn = require_proxy_fetch.resolveProxyFetchFromEnv();
	if (capability === "audio") {
		if (!provider.transcribeAudio) throw new Error(`Audio transcription provider "${providerId}" not available.`);
		const transcribeAudio = provider.transcribeAudio;
		const requestOverrides = resolveMediaRequestOverrides(params.config);
		const media = await params.cache.getBuffer({
			attachmentIndex: params.attachmentIndex,
			maxBytes,
			timeoutMs
		});
		assertMinAudioSize({
			size: media.size,
			attachmentIndex: params.attachmentIndex
		});
		const audioLanguage = requestOverrides.language ?? entry.language ?? params.config?.language ?? cfg.tools?.media?.audio?.language;
		const audioPrompt = requestOverrides.prompt ?? resolveAudioProviderPrompt({
			prompt,
			hasConfiguredPrompt,
			language: audioLanguage
		});
		const { auth, baseUrl, headers, request } = await resolveProviderExecutionContext({
			capability,
			providerId,
			provider,
			cfg,
			entry,
			config: params.config,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir
		});
		const providerQuery = resolveProviderQuery({
			providerId,
			config: params.config,
			entry
		});
		const model = entry.model?.trim() || (await Promise.resolve().then(() => require("./defaults-B9T6G8PZ.cjs")).then((n) => n.defaults_exports)).resolveDefaultMediaModel({
			cfg,
			providerId,
			capability: "audio",
			workspaceDir: params.workspaceDir
		}) || entry.model;
		const authSource = auth.source ?? `provider:${providerId}`;
		const buildRequest = (requestAuth) => ({
			buffer: media.buffer,
			fileName: media.fileName,
			mime: media.mime,
			apiKey: requestAuth.kind === "api-key" ? requestAuth.apiKey : require_model_auth_markers.CUSTOM_LOCAL_AUTH_MARKER,
			auth: requestAuth.kind === "api-key" ? {
				kind: "api-key",
				apiKey: requestAuth.apiKey,
				source: auth.source
			} : {
				kind: "none",
				source: authSource
			},
			baseUrl,
			headers,
			request,
			model,
			language: audioLanguage,
			prompt: audioPrompt,
			query: providerQuery,
			timeoutMs,
			fetchFn
		});
		const result = auth.kind === "api-key" ? await require_api_key_rotation.executeWithApiKeyRotation({
			provider: providerId,
			apiKeys: auth.apiKeys,
			transientRetry: require_operation_retry.providerOperationRetryConfig("read"),
			execute: async (apiKey) => transcribeAudio(buildRequest({
				kind: "api-key",
				apiKey
			}))
		}) : await transcribeAudio(buildRequest({ kind: "none" }));
		return {
			kind: "audio.transcription",
			attachmentIndex: params.attachmentIndex,
			text: trimOutput(result.text, maxChars),
			provider: providerId,
			model: result.model ?? model
		};
	}
	if (!provider.describeVideo) throw new Error(`Video understanding provider "${providerId}" not available.`);
	const describeVideo = provider.describeVideo;
	const media = await params.cache.getBuffer({
		attachmentIndex: params.attachmentIndex,
		maxBytes,
		timeoutMs
	});
	const estimatedBase64Bytes = estimateBase64Size(media.size);
	const maxBase64Bytes = resolveVideoMaxBase64Bytes(maxBytes);
	if (estimatedBase64Bytes > maxBase64Bytes) throw new MediaUnderstandingSkipError("maxBytes", `Video attachment ${params.attachmentIndex + 1} base64 payload ${estimatedBase64Bytes} exceeds ${maxBase64Bytes}`);
	const { auth, baseUrl, headers, request } = await resolveProviderExecutionContext({
		capability,
		providerId,
		provider,
		cfg,
		entry,
		config: params.config,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
	const authSource = auth.source ?? `provider:${providerId}`;
	const buildRequest = (requestAuth) => ({
		buffer: media.buffer,
		fileName: media.fileName,
		mime: media.mime,
		apiKey: requestAuth.kind === "api-key" ? requestAuth.apiKey : require_model_auth_markers.CUSTOM_LOCAL_AUTH_MARKER,
		auth: requestAuth.kind === "api-key" ? {
			kind: "api-key",
			apiKey: requestAuth.apiKey,
			source: auth.source
		} : {
			kind: "none",
			source: authSource
		},
		baseUrl,
		headers,
		request,
		model: entry.model,
		prompt,
		timeoutMs,
		fetchFn
	});
	const result = auth.kind === "api-key" ? await require_api_key_rotation.executeWithApiKeyRotation({
		provider: providerId,
		apiKeys: auth.apiKeys,
		transientRetry: require_operation_retry.providerOperationRetryConfig("read"),
		execute: (apiKey) => describeVideo(buildRequest({
			kind: "api-key",
			apiKey
		}))
	}) : await describeVideo(buildRequest({ kind: "none" }));
	return {
		kind: "video.description",
		attachmentIndex: params.attachmentIndex,
		text: trimOutput(result.text, maxChars),
		provider: providerId,
		model: result.model ?? entry.model
	};
}
/** Executes one CLI-backed media-understanding entry for one attachment. */
async function runCliEntry(params) {
	const { entry, capability, cfg, ctx } = params;
	const command = entry.command?.trim();
	const args = entry.args ?? [];
	if (!command) throw new Error(`CLI entry missing command for ${capability}`);
	const requestOverrides = resolveMediaRequestOverrides(params.config);
	const { maxBytes, maxChars, timeoutMs, prompt } = resolveEntryRunOptions({
		capability,
		entry,
		cfg,
		config: params.config
	});
	const pathResult = await params.cache.getPath({
		attachmentIndex: params.attachmentIndex,
		maxBytes,
		timeoutMs
	});
	if (capability === "audio") assertMinAudioSize({
		size: (await node_fs_promises.default.stat(pathResult.path)).size,
		attachmentIndex: params.attachmentIndex
	});
	const outputDir = await node_fs_promises.default.mkdtemp(node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "operator-media-cli-"));
	const mediaPath = await resolveCliMediaPath({
		capability,
		command,
		mediaPath: pathResult.path,
		outputDir
	});
	const outputBase = node_path.default.join(outputDir, node_path.default.parse(mediaPath).name);
	const templCtx = {
		...ctx,
		MediaPath: mediaPath,
		MediaDir: node_path.default.dirname(mediaPath),
		OutputDir: outputDir,
		OutputBase: outputBase,
		Prompt: requestOverrides.prompt ?? prompt,
		...requestOverrides.language ? { Language: requestOverrides.language } : {},
		MaxChars: maxChars
	};
	const argv = [command, ...args].map((part, index) => index === 0 ? part : require_templating.applyTemplate(part, templCtx));
	try {
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Media understanding via CLI: ${argv.join(" ")}`);
		const { stdout, stderr } = await require_exec.runExec((0, _gabrielvfonseca_normalization_core.expectDefined)(argv[0], "argv entry at 0"), argv.slice(1), {
			timeoutMs,
			maxBuffer: require_defaults_constants.CLI_OUTPUT_MAX_BUFFER,
			cwd: isAntigravityCliCommand(command) ? node_path.default.dirname(mediaPath) : void 0
		});
		const requestedBackend = capability === "audio" ? require_local_audio.resolveRequestedLocalAudioBackend({
			command,
			args: argv.slice(1)
		}) : void 0;
		const observedBackend = capability === "audio" ? require_local_audio.recordLocalAudioBackendObservation({
			command,
			args: argv.slice(1),
			output: `${stderr ?? ""}\n${stdout}`
		}) : void 0;
		const text = trimOutput(await resolveCliOutput({
			command,
			args: argv.slice(1),
			stdout,
			mediaPath
		}), maxChars);
		if (!text) return null;
		return {
			kind: capability === "audio" ? "audio.transcription" : `${capability}.description`,
			attachmentIndex: params.attachmentIndex,
			text,
			provider: capability === "audio" ? commandBase(command) : "cli",
			model: command,
			...requestedBackend ? { requestedBackend } : {},
			...observedBackend ? { observedBackend } : {}
		};
	} finally {
		await node_fs_promises.default.rm(outputDir, {
			recursive: true,
			force: true
		}).catch(() => {});
	}
}
//#endregion
Object.defineProperty(exports, "MediaAttachmentCache", {
	enumerable: true,
	get: function() {
		return MediaAttachmentCache;
	}
});
Object.defineProperty(exports, "buildModelDecision", {
	enumerable: true,
	get: function() {
		return buildModelDecision;
	}
});
Object.defineProperty(exports, "findDecisionReason", {
	enumerable: true,
	get: function() {
		return findDecisionReason;
	}
});
Object.defineProperty(exports, "formatDecisionSummary", {
	enumerable: true,
	get: function() {
		return formatDecisionSummary;
	}
});
Object.defineProperty(exports, "isMediaUnderstandingSkipError", {
	enumerable: true,
	get: function() {
		return isMediaUnderstandingSkipError;
	}
});
Object.defineProperty(exports, "normalizeAttachments", {
	enumerable: true,
	get: function() {
		return normalizeAttachments;
	}
});
Object.defineProperty(exports, "resolveAttachmentKind", {
	enumerable: true,
	get: function() {
		return resolveAttachmentKind;
	}
});
Object.defineProperty(exports, "resolveOpenAiAudioAuthModelApi", {
	enumerable: true,
	get: function() {
		return resolveOpenAiAudioAuthModelApi;
	}
});
Object.defineProperty(exports, "runCliEntry", {
	enumerable: true,
	get: function() {
		return runCliEntry;
	}
});
Object.defineProperty(exports, "runProviderEntry", {
	enumerable: true,
	get: function() {
		return runProviderEntry;
	}
});
Object.defineProperty(exports, "selectAttachments", {
	enumerable: true,
	get: function() {
		return selectAttachments;
	}
});
Object.defineProperty(exports, "summarizeDecisionReason", {
	enumerable: true,
	get: function() {
		return summarizeDecisionReason;
	}
});
