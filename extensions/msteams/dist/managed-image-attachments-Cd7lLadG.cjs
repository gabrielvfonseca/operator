const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_media_services = require("./media-services-CA_NM3C2.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_local_media_access = require("./local-media-access-BP_UZdmB.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
const require_managed_image_record_store = require("./managed-image-record-store-B6rMSrpG.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
//#region src/gateway/managed-image-attachments.ts
var managed_image_attachments_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS: () => DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS,
	attachManagedOutgoingImagesToMessage: () => attachManagedOutgoingImagesToMessage,
	cleanupManagedOutgoingImageRecords: () => cleanupManagedOutgoingImageRecords,
	createManagedOutgoingImageBlocks: () => createManagedOutgoingImageBlocks,
	handleManagedOutgoingImageHttpRequest: () => handleManagedOutgoingImageHttpRequest,
	resolveManagedImageAttachmentLimits: () => resolveManagedImageAttachmentLimits
});
const OUTGOING_IMAGE_ROUTE_PREFIX = "/api/chat/media/outgoing";
const DEFAULT_TRANSIENT_OUTGOING_IMAGE_TTL_MS = 900 * 1e3;
const MANAGED_OUTGOING_ATTACHMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS = {
	maxBytes: 12 * 1024 * 1024,
	maxWidth: 4096,
	maxHeight: 4096,
	maxPixels: 2e7
};
const sessionManagedOutgoingAttachmentIndexCache = /* @__PURE__ */ new Map();
const MAX_SESSION_MANAGED_OUTGOING_ATTACHMENT_INDEX_CACHE_ENTRIES = 500;
function buildSessionManagedOutgoingAttachmentIndexCacheKey(sessionKey, agentId) {
	return sessionKey === "global" && agentId ? `agent:${agentId}:global` : sessionKey;
}
function resolveManagedImageAttachmentLimits(config) {
	return {
		maxBytes: config?.maxBytes ?? DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS.maxBytes,
		maxWidth: config?.maxWidth ?? DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS.maxWidth,
		maxHeight: config?.maxHeight ?? DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS.maxHeight,
		maxPixels: config?.maxPixels ?? DEFAULT_MANAGED_IMAGE_ATTACHMENT_LIMITS.maxPixels
	};
}
function formatLimitMiB(bytes) {
	if (bytes < 1024 * 1024) return `${bytes} bytes`;
	return Number.isInteger(bytes / (1024 * 1024)) ? `${bytes / (1024 * 1024)} MiB` : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
function createManagedImageAttachmentError(message) {
	const error = new Error(message);
	error.name = "ManagedImageAttachmentError";
	return error;
}
function isManagedImageAttachmentSafeError(error) {
	if (!(error instanceof Error)) return false;
	if (error.name === "ManagedImageAttachmentError") return true;
	return error.message.startsWith("Managed image attachment ") || error.message.startsWith("Invalid image data URL");
}
function getSanitizedManagedImageAttachmentError(error, alt) {
	if (isManagedImageAttachmentSafeError(error)) return error;
	return createManagedImageAttachmentError(`Managed image attachment ${JSON.stringify(alt)} could not be prepared`);
}
function validateManagedImageBuffer(buffer, alt, limits) {
	if (buffer.byteLength > limits.maxBytes) throw createManagedImageAttachmentError(`Managed image attachment ${JSON.stringify(alt)} exceeds the ${formatLimitMiB(limits.maxBytes)} byte limit`);
}
function estimateBase64DecodedByteLength(base64) {
	const normalized = base64.replace(/\s+/g, "");
	const paddingMatch = /=+$/u.exec(normalized);
	const padding = Math.min(paddingMatch?.[0].length ?? 0, 2);
	return Math.floor(normalized.length * 3 / 4) - padding;
}
function getManagedImageMetadataLimitError(metadata, alt, limits) {
	if (!metadata) return `Managed image attachment ${JSON.stringify(alt)} is missing readable dimensions`;
	if (metadata.width > limits.maxWidth) return `Managed image attachment ${JSON.stringify(alt)} exceeds the ${limits.maxWidth}px width limit`;
	if (metadata.height > limits.maxHeight) return `Managed image attachment ${JSON.stringify(alt)} exceeds the ${limits.maxHeight}px height limit`;
	if (metadata.width * metadata.height > limits.maxPixels) return `Managed image attachment ${JSON.stringify(alt)} exceeds the ${limits.maxPixels.toLocaleString("en-US")} pixel limit`;
	return null;
}
function orientManagedImageMetadata(buffer, metadata) {
	if (!metadata) return null;
	const orientation = require_media_services.readImageProbeFromHeader(buffer)?.orientation;
	return orientation === 5 || orientation === 6 || orientation === 7 || orientation === 8 ? {
		width: metadata.height,
		height: metadata.width
	} : metadata;
}
async function resizeManagedImageBufferToLimits(params) {
	const resized = await require_media_services.createImageProcessor().encode(params.buffer, {
		format: "auto",
		limits: {
			maxWidth: params.limits.maxWidth,
			maxHeight: params.limits.maxHeight,
			maxPixels: params.limits.maxPixels
		},
		opaque: {
			format: "jpeg",
			quality: 92
		},
		transparent: {
			format: "png",
			compressionLevel: 9
		},
		transparency: "auto"
	});
	return {
		buffer: resized.data,
		contentType: resized.mimeType,
		width: resized.width,
		height: resized.height
	};
}
function resolveManagedImageOriginalPath(record) {
	if (!node_path.default.isAbsolute(record.original.mediaRoot) || record.original.mediaSubdir !== "outgoing/originals" || !record.original.mediaId || record.original.mediaId.includes("/") || record.original.mediaId.includes("\\") || record.original.mediaId.includes("\0")) throw new Error("Managed image record has an unsafe media identity");
	return node_path.default.join(record.original.mediaRoot, record.original.mediaSubdir, record.original.mediaId);
}
function resolveManagedImageOriginalsDir(stateDir) {
	const runtimeMediaRoot = node_path.default.resolve(stateDir) === node_path.default.resolve(require_paths.resolveStateDir()) ? require_store.getMediaDir() : node_path.default.join(stateDir, "media");
	return node_path.default.join(runtimeMediaRoot, require_managed_image_record_store.MANAGED_OUTGOING_ORIGINALS_SUBDIR);
}
async function hasUnmigratedManagedImageMetadata(stateDir) {
	try {
		return (await node_fs_promises.default.readdir(node_path.default.join(stateDir, "media", "outgoing", "records"))).some((name) => name.endsWith(".json") || name.includes(".json.doctor-importing-"));
	} catch (error) {
		return error.code !== "ENOENT";
	}
}
async function deleteAgedOrphanManagedImageFiles(params) {
	if (await hasUnmigratedManagedImageMetadata(params.stateDir)) return 0;
	const referencedMediaIds = new Set(require_managed_image_record_store.listManagedImageRecordEntries({ stateDir: params.stateDir }).map(({ record }) => record.original.mediaId));
	const originalsDir = resolveManagedImageOriginalsDir(params.stateDir);
	let names;
	try {
		names = await node_fs_promises.default.readdir(originalsDir);
	} catch {
		return 0;
	}
	let deletedCount = 0;
	for (const name of names) {
		if (referencedMediaIds.has(name)) continue;
		const filePath = node_path.default.join(originalsDir, name);
		try {
			const stat = await node_fs_promises.default.lstat(filePath);
			if (!stat.isFile() || stat.isSymbolicLink() || params.nowMs - stat.mtimeMs < params.minAgeMs) continue;
			await node_fs_promises.default.rm(filePath, { force: true });
			deletedCount += 1;
		} catch {}
	}
	return deletedCount;
}
function buildOutgoingVariantUrl(sessionKey, attachmentId, variant) {
	return `${OUTGOING_IMAGE_ROUTE_PREFIX}/${encodeURIComponent(sessionKey)}/${attachmentId}/${variant}`;
}
function deriveAltText(source, index) {
	const fallback = `Generated image ${index + 1}`;
	try {
		if (/^https?:\/\//i.test(source)) {
			const parsed = new URL(source);
			return node_path.default.basename(parsed.pathname || "").trim() || fallback;
		}
	} catch {}
	return node_path.default.basename(source).trim() || fallback;
}
function parseImageDataUrl(source, alt, limits) {
	const trimmed = source.trim();
	if (!trimmed.startsWith("data:")) return { kind: "not-data-url" };
	const afterPrefix = trimmed.slice(5);
	const commaIdx = afterPrefix.indexOf(",");
	const mimeAndParams = commaIdx < 0 ? "" : afterPrefix.slice(0, commaIdx);
	if (mimeAndParams.slice(-7).toLowerCase() !== ";base64") throw new Error("Invalid image data URL");
	const semicolonIdx = mimeAndParams.indexOf(";");
	const contentType = (semicolonIdx < 0 ? mimeAndParams : mimeAndParams.slice(0, semicolonIdx)).trim().toLowerCase();
	if (!contentType) throw new Error("Invalid image data URL");
	const base64Part = afterPrefix.slice(commaIdx + 1);
	if (!/^[A-Za-z0-9+/=\s]+$/.test(base64Part)) throw new Error("Invalid image data URL");
	if (!contentType.startsWith("image/")) return { kind: "non-image-data-url" };
	if (estimateBase64DecodedByteLength(base64Part) > limits.maxBytes) throw createManagedImageAttachmentError(`Managed image attachment ${JSON.stringify(alt)} exceeds the ${formatLimitMiB(limits.maxBytes)} byte limit`);
	return {
		kind: "image-data-url",
		buffer: Buffer.from(base64Part.replace(/\s+/g, ""), "base64"),
		contentType
	};
}
async function getVariantStats(params) {
	const loaded = params.buffer ? {
		buffer: params.buffer,
		sizeBytes: params.sizeBytes ?? params.buffer.byteLength
	} : await (async () => {
		const { buffer, stat } = await (0, _openclaw_fs_safe_root.readLocalFileSafely)({ filePath: params.filePath });
		return {
			buffer,
			sizeBytes: stat.size
		};
	})();
	const metadataBuffer = loaded.buffer;
	const metadata = await require_media_services.getImageMetadata(metadataBuffer).catch(() => null) ?? {
		width: null,
		height: null
	};
	return {
		width: metadata.width ?? null,
		height: metadata.height ?? null,
		sizeBytes: Number.isFinite(loaded.sizeBytes) ? loaded.sizeBytes : null
	};
}
async function deleteManagedImageRecordArtifacts(record, stateDir = require_paths.resolveStateDir(), alreadyClaimed = false) {
	if (!alreadyClaimed && !require_managed_image_record_store.claimManagedImageRecordCleanupIfCurrent(record, stateDir)) return {
		deletedRecord: false,
		deletedFileCount: 0
	};
	try {
		await node_fs_promises.default.rm(resolveManagedImageOriginalPath(record), { force: true });
	} catch {
		return {
			deletedRecord: false,
			deletedFileCount: 0
		};
	}
	return {
		deletedRecord: require_managed_image_record_store.deleteClaimedManagedImageRecord(record, stateDir),
		deletedFileCount: 1
	};
}
async function cleanupManagedOutgoingImageRecords(params) {
	const stateDir = params?.stateDir ?? require_paths.resolveStateDir();
	const nowMs = params?.nowMs ?? Date.now();
	const transientMaxAgeMs = params?.transientMaxAgeMs ?? DEFAULT_TRANSIENT_OUTGOING_IMAGE_TTL_MS;
	const sessionKeyFilter = params?.sessionKey ?? null;
	const agentIdFilter = params?.agentId?.trim() || void 0;
	const defaultAgentId = sessionKeyFilter === "global" ? require_agent_scope_config.resolveDefaultAgentId(require_io.getRuntimeConfig()) : void 0;
	const forceDeleteSessionRecords = params?.forceDeleteSessionRecords === true;
	const entries = require_managed_image_record_store.listManagedImageRecordEntries({ stateDir });
	let deletedRecordCount = 0;
	let deletedFileCount = 0;
	let retainedCount = 0;
	const transcriptAttachmentIndexCache = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const { record } = entry;
		if (sessionKeyFilter && record.sessionKey !== sessionKeyFilter) {
			retainedCount += 1;
			continue;
		}
		if (sessionKeyFilter === "global" && record.sessionKey === "global" && (agentIdFilter && resolveManagedImageRecordAgentId(record, defaultAgentId) !== agentIdFilter || !agentIdFilter && typeof record.agentId === "string" && record.agentId.trim())) {
			retainedCount += 1;
			continue;
		}
		let shouldDelete = entry.cleanupPending;
		if (!entry.cleanupPending && forceDeleteSessionRecords && (!sessionKeyFilter || record.sessionKey === sessionKeyFilter)) shouldDelete = true;
		else if (!entry.cleanupPending && record.messageId) shouldDelete = !await recordMatchesTranscriptMessage(record, transcriptAttachmentIndexCache);
		else if (!entry.cleanupPending) {
			const createdAtMs = Date.parse(record.createdAt);
			shouldDelete = Number.isFinite(createdAtMs) && nowMs - createdAtMs >= transientMaxAgeMs;
		}
		if (shouldDelete) {
			const deleted = await deleteManagedImageRecordArtifacts(record, stateDir, entry.cleanupPending);
			if (deleted.deletedRecord) {
				deletedRecordCount += 1;
				deletedFileCount += deleted.deletedFileCount;
			} else retainedCount += 1;
		} else retainedCount += 1;
	}
	deletedFileCount += await deleteAgedOrphanManagedImageFiles({
		stateDir,
		nowMs,
		minAgeMs: Math.max(transientMaxAgeMs, DEFAULT_TRANSIENT_OUTGOING_IMAGE_TTL_MS)
	});
	return {
		deletedRecordCount,
		deletedFileCount,
		retainedCount
	};
}
function resolveManagedImageRecordAgentId(record, defaultAgentId) {
	return record.agentId?.trim() || defaultAgentId;
}
function buildManagedImageBlock(record) {
	const fullUrl = buildOutgoingVariantUrl(record.sessionKey, record.attachmentId, "full");
	return {
		type: "image",
		url: fullUrl,
		openUrl: fullUrl,
		alt: record.alt,
		mimeType: record.original.contentType,
		width: record.original.width,
		height: record.original.height
	};
}
function buildManagedOutgoingAttachmentRefKey(messageId, attachmentId) {
	return `${messageId}::${attachmentId}`;
}
function buildManagedImageResizeWarningBlock(params) {
	return {
		type: "text",
		text: `[Image warning] ${params.alt} exceeded gateway dimension/pixel limits and was resized from ${params.originalWidth}×${params.originalHeight} to ${params.resizedWidth}×${params.resizedHeight}.`
	};
}
function toRecordFilename(filePath) {
	return node_path.default.basename(filePath).trim() || null;
}
function asArray(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}
function parseManagedOutgoingRoute(value) {
	try {
		const match = new URL(value, "http://localhost").pathname.match(/^\/api\/chat\/media\/outgoing\/([^/]+)\/([^/]+)\/full$/);
		if (!match) return null;
		if (!MANAGED_OUTGOING_ATTACHMENT_ID_RE.test((0, _gabrielvfonseca_normalization_core.expectDefined)(match[2], "managed image attachments regex capture 2"))) return null;
		return {
			sessionKey: decodeURIComponent((0, _gabrielvfonseca_normalization_core.expectDefined)(match[1], "managed image attachments regex capture 1")),
			attachmentId: match[2]
		};
	} catch {
		return null;
	}
}
function collectManagedOutgoingAttachmentRefs(blocks, expectedSessionKey) {
	const refs = /* @__PURE__ */ new Map();
	for (const block of blocks ?? []) {
		if (block?.type !== "image") continue;
		for (const candidate of [block.url, block.openUrl]) {
			if (typeof candidate !== "string") continue;
			const parsed = parseManagedOutgoingRoute(candidate);
			if (!parsed) continue;
			if (expectedSessionKey && parsed.sessionKey !== expectedSessionKey) continue;
			const attachmentId = (0, _gabrielvfonseca_normalization_core.expectDefined)(parsed.attachmentId, "managed image attachment id");
			refs.set(attachmentId, {
				attachmentId,
				sessionKey: parsed.sessionKey
			});
		}
	}
	return [...refs.values()];
}
function getCachedSessionManagedOutgoingAttachmentIndex(sessionKey, agentId, stat) {
	const cacheKey = buildSessionManagedOutgoingAttachmentIndexCacheKey(sessionKey, agentId);
	const cached = sessionManagedOutgoingAttachmentIndexCache.get(cacheKey);
	if (!cached) return null;
	if (cached.transcriptPath !== stat.transcriptPath || cached.mtimeMs !== stat.mtimeMs || cached.size !== stat.size) {
		sessionManagedOutgoingAttachmentIndexCache.delete(cacheKey);
		return null;
	}
	sessionManagedOutgoingAttachmentIndexCache.delete(cacheKey);
	sessionManagedOutgoingAttachmentIndexCache.set(cacheKey, cached);
	return cached.index;
}
function setCachedSessionManagedOutgoingAttachmentIndex(sessionKey, agentId, stat, index) {
	sessionManagedOutgoingAttachmentIndexCache.set(buildSessionManagedOutgoingAttachmentIndexCacheKey(sessionKey, agentId), {
		transcriptPath: stat.transcriptPath,
		mtimeMs: stat.mtimeMs,
		size: stat.size,
		index
	});
	while (sessionManagedOutgoingAttachmentIndexCache.size > MAX_SESSION_MANAGED_OUTGOING_ATTACHMENT_INDEX_CACHE_ENTRIES) {
		const oldestKey = sessionManagedOutgoingAttachmentIndexCache.keys().next().value;
		if (!oldestKey) break;
		sessionManagedOutgoingAttachmentIndexCache.delete(oldestKey);
	}
}
function sameManagedOutgoingAttachmentTranscriptStat(left, right) {
	return left?.transcriptPath === right?.transcriptPath && left?.mtimeMs === right?.mtimeMs && left?.size === right?.size;
}
async function getSessionManagedOutgoingAttachmentIndex(sessionKey, cache, agentId) {
	const cacheKey = buildSessionManagedOutgoingAttachmentIndexCacheKey(sessionKey, agentId);
	if (cache?.has(cacheKey)) return cache.get(cacheKey) ?? null;
	const { storePath, entry } = require_session_utils.loadSessionEntry(sessionKey, sessionKey === "global" && agentId ? { agentId } : void 0);
	const sessionId = entry?.sessionId;
	if (!sessionId) {
		cache?.set(cacheKey, null);
		return null;
	}
	let transcriptStat = null;
	const resolvedTranscriptPath = await require_session_transcript_readers.resolveSessionHistoryTranscriptPathAsync(sessionId, storePath, entry.sessionFile, { allowResetArchiveFallback: true });
	if (resolvedTranscriptPath) try {
		const stat = await node_fs_promises.default.stat(resolvedTranscriptPath);
		transcriptStat = {
			transcriptPath: resolvedTranscriptPath,
			mtimeMs: stat.mtimeMs,
			size: stat.size
		};
		const cachedIndex = getCachedSessionManagedOutgoingAttachmentIndex(sessionKey, agentId, transcriptStat);
		if (cachedIndex) {
			cache?.set(cacheKey, cachedIndex);
			return cachedIndex;
		}
	} catch {
		sessionManagedOutgoingAttachmentIndexCache.delete(cacheKey);
	}
	else sessionManagedOutgoingAttachmentIndexCache.delete(cacheKey);
	const readResult = await require_session_transcript_readers.readSessionMessagesWithSourceAsync({
		agentId,
		sessionEntry: entry,
		sessionId,
		sessionKey,
		storePath
	}, {
		mode: "full",
		reason: "managed outgoing attachment index",
		allowResetArchiveFallback: true
	});
	const messages = readResult.messages;
	const preReadTranscriptStat = transcriptStat;
	if (readResult.transcriptPath) try {
		const stat = await node_fs_promises.default.stat(readResult.transcriptPath);
		const postReadTranscriptStat = {
			transcriptPath: readResult.transcriptPath,
			mtimeMs: stat.mtimeMs,
			size: stat.size
		};
		transcriptStat = sameManagedOutgoingAttachmentTranscriptStat(preReadTranscriptStat, postReadTranscriptStat) ? postReadTranscriptStat : null;
	} catch {
		transcriptStat = null;
	}
	else transcriptStat = null;
	const index = /* @__PURE__ */ new Set();
	for (const message of messages) {
		const messageId = (message?.["__openclaw"])?.id;
		if (typeof messageId !== "string" || !messageId) continue;
		for (const ref of collectManagedOutgoingAttachmentRefs(Array.isArray(message?.content) ? message.content : [], sessionKey)) index.add(buildManagedOutgoingAttachmentRefKey(messageId, ref.attachmentId));
	}
	if (transcriptStat) setCachedSessionManagedOutgoingAttachmentIndex(sessionKey, agentId, transcriptStat, index);
	cache?.set(cacheKey, index);
	return index;
}
async function recordMatchesTranscriptMessage(record, cache) {
	if (!record.messageId) return false;
	return (await getSessionManagedOutgoingAttachmentIndex(record.sessionKey, cache, record.agentId))?.has(buildManagedOutgoingAttachmentRefKey(record.messageId, record.attachmentId)) ?? false;
}
async function attachManagedOutgoingImagesToMessage(params) {
	const messageId = params.messageId.trim();
	if (!messageId) return;
	const refs = collectManagedOutgoingAttachmentRefs(params.blocks);
	if (refs.length === 0) return;
	await Promise.all(refs.map(async ({ attachmentId, sessionKey }) => {
		require_managed_image_record_store.attachManagedImageRecordToMessage({
			attachmentId,
			sessionKey,
			messageId,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			stateDir: params.stateDir
		});
	}));
}
async function createManagedOutgoingImageBlocks(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey) return [];
	const mediaUrls = asArray(params.mediaUrls);
	if (mediaUrls.length === 0) return [];
	const stateDir = params.stateDir ?? require_paths.resolveStateDir();
	const limits = resolveManagedImageAttachmentLimits(params.limits);
	const blocks = [];
	let resolvedLocalRoots;
	for (const [index, mediaUrl] of mediaUrls.entries()) {
		const fallbackAlt = `Generated image ${index + 1}`;
		const parsedDataUrl = parseImageDataUrl(mediaUrl, fallbackAlt, limits);
		const alt = parsedDataUrl.kind === "image-data-url" ? fallbackAlt : deriveAltText(mediaUrl, index);
		if (parsedDataUrl.kind === "non-image-data-url") continue;
		let savedOriginalPath = null;
		try {
			let resizeWarning = null;
			if (parsedDataUrl.kind === "image-data-url") validateManagedImageBuffer(parsedDataUrl.buffer, alt, limits);
			let savedOriginal = parsedDataUrl.kind === "image-data-url" ? await require_store.saveMediaBuffer(parsedDataUrl.buffer, parsedDataUrl.contentType, "outgoing/originals", limits.maxBytes, `generated-image-${index + 1}`) : await (async () => {
				const localMediaPath = require_local_roots.resolveLocalMediaPath(mediaUrl);
				if (localMediaPath) {
					const localRoots = params.localRoots;
					await require_local_media_access.assertLocalMediaAllowed(localMediaPath, localRoots, localRoots === "any" ? void 0 : { resolveRoots: async () => {
						resolvedLocalRoots ??= await require_local_media_access.resolveLocalMediaRoots(localRoots);
						return resolvedLocalRoots;
					} });
				}
				return await require_store.saveMediaSource(mediaUrl, void 0, "outgoing/originals", Math.max(limits.maxBytes, require_store.MEDIA_MAX_BYTES));
			})();
			savedOriginalPath = savedOriginal.path;
			let savedOriginalContentType = savedOriginal.contentType;
			if (!savedOriginalContentType?.startsWith("image/")) {
				await node_fs_promises.default.rm(savedOriginal.path, { force: true }).catch(() => {});
				savedOriginalPath = null;
				continue;
			}
			if (savedOriginal.size > limits.maxBytes) throw createManagedImageAttachmentError(`Managed image attachment ${JSON.stringify(alt)} exceeds the ${formatLimitMiB(limits.maxBytes)} byte limit`);
			let originalBuffer = parsedDataUrl.kind === "image-data-url" ? parsedDataUrl.buffer : (await (0, _openclaw_fs_safe_root.readLocalFileSafely)({ filePath: savedOriginal.path })).buffer;
			validateManagedImageBuffer(originalBuffer, alt, limits);
			let originalStats = await getVariantStats({
				filePath: savedOriginal.path,
				buffer: originalBuffer,
				sizeBytes: savedOriginal.size
			});
			if (originalStats.sizeBytes != null && originalStats.sizeBytes > limits.maxBytes) throw createManagedImageAttachmentError(`Managed image attachment ${JSON.stringify(alt)} exceeds the ${formatLimitMiB(limits.maxBytes)} byte limit`);
			const originalMetadata = originalStats.width != null && originalStats.height != null ? {
				width: originalStats.width,
				height: originalStats.height
			} : await require_media_services.getImageMetadata(originalBuffer);
			const originalDisplayMetadata = orientManagedImageMetadata(originalBuffer, originalMetadata);
			let effectiveMetadata = originalDisplayMetadata;
			let metadataLimitError = getManagedImageMetadataLimitError(effectiveMetadata, alt, limits);
			for (let resizeAttempt = 0; metadataLimitError; resizeAttempt += 1) {
				if (!effectiveMetadata) throw createManagedImageAttachmentError(metadataLimitError);
				if (resizeAttempt >= 3) throw createManagedImageAttachmentError(metadataLimitError);
				const resized = await resizeManagedImageBufferToLimits({
					buffer: originalBuffer,
					limits
				});
				validateManagedImageBuffer(resized.buffer, alt, limits);
				const replacement = await require_store.saveMediaBuffer(resized.buffer, resized.contentType, "outgoing/originals", limits.maxBytes, toRecordFilename(savedOriginal.path) ?? `generated-image-${index + 1}`);
				await node_fs_promises.default.rm(savedOriginal.path, { force: true }).catch(() => {});
				savedOriginal = replacement;
				savedOriginalContentType = replacement.contentType ?? resized.contentType;
				savedOriginalPath = savedOriginal.path;
				originalBuffer = resized.buffer;
				originalStats = await getVariantStats({
					filePath: savedOriginal.path,
					buffer: originalBuffer,
					sizeBytes: savedOriginal.size
				});
				effectiveMetadata = orientManagedImageMetadata(originalBuffer, originalStats.width != null && originalStats.height != null ? {
					width: originalStats.width,
					height: originalStats.height
				} : await require_media_services.getImageMetadata(originalBuffer));
				metadataLimitError = getManagedImageMetadataLimitError(effectiveMetadata, alt, limits);
				if (!metadataLimitError) resizeWarning = buildManagedImageResizeWarningBlock({
					alt,
					originalWidth: originalDisplayMetadata?.width ?? effectiveMetadata?.width ?? resized.width,
					originalHeight: originalDisplayMetadata?.height ?? effectiveMetadata?.height ?? resized.height,
					resizedWidth: effectiveMetadata?.width ?? resized.width,
					resizedHeight: effectiveMetadata?.height ?? resized.height
				});
			}
			const record = {
				attachmentId: (0, node_crypto.randomUUID)(),
				sessionKey,
				...sessionKey === "global" && params.agentId?.trim() ? { agentId: params.agentId.trim() } : {},
				messageId: params.messageId ?? null,
				createdAt: (/* @__PURE__ */ new Date()).toISOString(),
				retentionClass: params.messageId ? "history" : "transient",
				alt,
				original: {
					mediaRoot: node_path.default.dirname(node_path.default.dirname(node_path.default.dirname(node_path.default.resolve(savedOriginal.path)))),
					mediaId: savedOriginal.id,
					mediaSubdir: require_managed_image_record_store.MANAGED_OUTGOING_ORIGINALS_SUBDIR,
					contentType: savedOriginalContentType,
					width: originalStats.width,
					height: originalStats.height,
					sizeBytes: originalStats.sizeBytes,
					filename: toRecordFilename(savedOriginal.path)
				}
			};
			require_managed_image_record_store.insertManagedImageRecord(record, stateDir);
			blocks.push(buildManagedImageBlock(record));
			if (resizeWarning) blocks.push(resizeWarning);
		} catch (error) {
			if (savedOriginalPath) await node_fs_promises.default.rm(savedOriginalPath, { force: true }).catch(() => {});
			const sanitizedError = getSanitizedManagedImageAttachmentError(error, alt);
			if (params.continueOnPrepareError) {
				params.onPrepareError?.(sanitizedError);
				continue;
			}
			throw sanitizedError;
		}
	}
	return blocks;
}
function sendStatus(res, statusCode, body) {
	if (res.writableEnded) return;
	res.statusCode = statusCode;
	res.setHeader("content-type", "text/plain; charset=utf-8");
	res.end(body);
}
function safeAttachmentFilename(value) {
	const fallback = "generated-image";
	return (value ?? fallback).replace(/[\r\n"\\]/g, "_").trim() || fallback;
}
async function handleManagedOutgoingImageHttpRequest(req, res, opts) {
	const match = new URL(req.url ?? "/", "http://localhost").pathname.match(/^\/api\/chat\/media\/outgoing\/([^/]+)\/([^/]+)\/full$/);
	if (!match) return false;
	if (req.method !== "GET") {
		require_http_common.sendMethodNotAllowed(res, "GET");
		return true;
	}
	const requestAuth = await require_http_auth_utils.authorizeGatewayHttpRequestOrReply({
		req,
		res,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter
	});
	if (!requestAuth) return true;
	const scopeAuth = require_method_scopes.authorizeOperatorScopesForMethod("chat.history", require_http_auth_utils.resolveOpenAiCompatibleHttpOperatorScopes(req, requestAuth));
	if (!scopeAuth.allowed) {
		require_http_common.sendMissingScopeForbidden(res, scopeAuth.missingScope);
		return true;
	}
	const encodedSessionKey = match[1];
	const attachmentId = match[2];
	if (!encodedSessionKey || !attachmentId) return false;
	if (!MANAGED_OUTGOING_ATTACHMENT_ID_RE.test(attachmentId)) {
		sendStatus(res, 404, "not found");
		return true;
	}
	let sessionKey;
	try {
		sessionKey = decodeURIComponent(encodedSessionKey);
	} catch {
		sendStatus(res, 404, "not found");
		return true;
	}
	const record = require_managed_image_record_store.readManagedImageRecord(attachmentId, opts.stateDir);
	if (!record || record.sessionKey !== sessionKey) {
		sendStatus(res, 404, "not found");
		return true;
	}
	if (!require_http_auth_utils.resolveOpenAiCompatibleHttpSenderIsOwner(req, requestAuth)) {
		require_http_common.sendJson(res, 403, {
			ok: false,
			error: {
				type: "forbidden",
				message: "owner access required"
			}
		});
		return true;
	}
	if (!await recordMatchesTranscriptMessage(record)) {
		sendStatus(res, 404, "not found");
		return true;
	}
	let body;
	try {
		body = (await (0, _openclaw_fs_safe_root.readLocalFileSafely)({ filePath: resolveManagedImageOriginalPath(record) })).buffer;
	} catch {
		sendStatus(res, 404, "not found");
		return true;
	}
	res.statusCode = 200;
	res.setHeader("content-type", record.original.contentType || "application/octet-stream");
	res.setHeader("content-length", String(body.byteLength));
	res.setHeader("cache-control", "private, max-age=31536000, immutable");
	res.setHeader("content-disposition", `inline; filename="${safeAttachmentFilename(record.original.filename)}"`);
	res.end(body);
	return true;
}
//#endregion
Object.defineProperty(exports, "attachManagedOutgoingImagesToMessage", {
	enumerable: true,
	get: function() {
		return attachManagedOutgoingImagesToMessage;
	}
});
Object.defineProperty(exports, "cleanupManagedOutgoingImageRecords", {
	enumerable: true,
	get: function() {
		return cleanupManagedOutgoingImageRecords;
	}
});
Object.defineProperty(exports, "createManagedOutgoingImageBlocks", {
	enumerable: true,
	get: function() {
		return createManagedOutgoingImageBlocks;
	}
});
Object.defineProperty(exports, "managed_image_attachments_exports", {
	enumerable: true,
	get: function() {
		return managed_image_attachments_exports;
	}
});
