const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
require("./errors-BqS4bzom.cjs");
const require_media_services = require("./media-services-CA_NM3C2.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_media_core_base64 = require("@gabrielvfonseca/media-core/base64");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/image-sanitization.ts
const DEFAULT_IMAGE_MAX_DIMENSION_PX = 1200;
const DEFAULT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Resolve configured image sanitization limits for agent payloads. */
function resolveImageSanitizationLimits(cfg) {
	const configured = cfg?.agents?.defaults?.imageMaxDimensionPx;
	if (typeof configured !== "number" || !Number.isFinite(configured)) return {};
	return { maxDimensionPx: Math.max(1, Math.floor(configured)) };
}
//#endregion
//#region src/agents/tool-images.ts
/**
* Tool image output sanitizer.
*
* Downscales and recompresses oversized base64 image blocks before provider replay.
*/
const MAX_IMAGE_DIMENSION_PX = DEFAULT_IMAGE_MAX_DIMENSION_PX;
const MAX_IMAGE_BYTES = DEFAULT_IMAGE_MAX_BYTES;
const log = require_subsystem.createSubsystemLogger("agents/tool-images");
function isImageTypeBlock(block) {
	return Boolean(block) && typeof block === "object" && block.type === "image";
}
function isImageBlock(block) {
	if (!isImageTypeBlock(block)) return false;
	return typeof block.data === "string" && typeof block.mimeType === "string";
}
function isTextBlock(block) {
	if (!block || typeof block !== "object") return false;
	const rec = block;
	return rec.type === "text" && typeof rec.text === "string";
}
function inferMimeTypeFromBase64(base64) {
	const trimmed = base64.trim();
	if (!trimmed) return;
	if (trimmed.startsWith("/9j/")) return "image/jpeg";
	if (trimmed.startsWith("iVBOR")) return "image/png";
	if (trimmed.startsWith("R0lGOD")) return "image/gif";
}
function imageWithinLimits(buffer, metadata, maxDimensionPx, maxBytes) {
	const width = metadata?.width;
	const height = metadata?.height;
	return typeof width === "number" && typeof height === "number" && width > 0 && height > 0 && buffer.byteLength <= maxBytes && width <= maxDimensionPx && height <= maxDimensionPx && width * height <= 25e6;
}
function formatBytesShort(bytes) {
	if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, Math.round(bytes))}B`;
	return (0, _gabrielvfonseca_normalization_core.formatByteSize)(bytes, {
		style: "legacy-binary",
		maxUnit: "mega",
		separator: "",
		fractionDigits: (_value, unit) => unit === "kilo" ? 1 : 2
	});
}
function fileNameFromPathLike(pathLike) {
	const value = pathLike.trim();
	if (!value) return;
	try {
		const candidate = new URL(value).pathname.split("/").findLast(Boolean);
		return candidate && candidate.length > 0 ? candidate : void 0;
	} catch {}
	const candidate = value.replaceAll("\\", "/").split("/").findLast(Boolean);
	return candidate && candidate.length > 0 ? candidate : void 0;
}
function inferImageFileName(params) {
	const rec = params.block;
	for (const key of [
		"fileName",
		"filename",
		"path",
		"url"
	]) {
		const raw = rec[key];
		if (typeof raw !== "string" || raw.trim().length === 0) continue;
		const candidate = fileNameFromPathLike(raw);
		if (candidate) return candidate;
	}
	if (typeof rec.name === "string" && rec.name.trim().length > 0) return rec.name.trim();
	if (params.mediaPathHint) {
		const candidate = fileNameFromPathLike(params.mediaPathHint);
		if (candidate) return candidate;
	}
	if (typeof params.label === "string" && params.label.startsWith("read:")) {
		const candidate = fileNameFromPathLike(params.label.slice(5));
		if (candidate) return candidate;
	}
}
async function resizeImageBase64IfNeeded(params) {
	const buf = Buffer.from(params.base64, "base64");
	const headerMeta = require_media_services.readImageMetadataFromHeader(buf);
	if (imageWithinLimits(buf, headerMeta, params.maxDimensionPx, params.maxBytes)) return {
		base64: params.base64,
		mimeType: params.mimeType,
		resized: false,
		width: headerMeta.width,
		height: headerMeta.height
	};
	const meta = headerMeta ?? await require_media_services.getImageMetadata(buf);
	const width = meta?.width;
	const height = meta?.height;
	const overBytes = buf.byteLength > params.maxBytes;
	const hasDimensions = typeof width === "number" && typeof height === "number";
	const overDimensions = hasDimensions && (width > params.maxDimensionPx || height > params.maxDimensionPx);
	if (imageWithinLimits(buf, meta, params.maxDimensionPx, params.maxBytes)) return {
		base64: params.base64,
		mimeType: params.mimeType,
		resized: false,
		width,
		height
	};
	const maxDim = hasDimensions ? Math.max(width ?? 0, height ?? 0) : params.maxDimensionPx;
	const sideStart = maxDim > 0 ? Math.min(params.maxDimensionPx, maxDim) : params.maxDimensionPx;
	const sideGrid = require_media_services.buildImageResizeSideGrid(params.maxDimensionPx, sideStart);
	let smallest = null;
	let processorUnavailableError;
	for (const side of sideGrid) {
		for (const quality of require_media_services.IMAGE_REDUCE_QUALITY_STEPS) {
			let out;
			try {
				out = await require_media_services.resizeToJpeg({
					buffer: buf,
					maxSide: side,
					quality,
					withoutEnlargement: true
				});
			} catch (err) {
				if (require_media_services.isImageProcessorUnavailableError(err)) {
					processorUnavailableError = err;
					break;
				}
				throw err;
			}
			if (!smallest || out.byteLength < smallest.size) smallest = {
				buffer: out,
				size: out.byteLength
			};
			if (out.byteLength <= params.maxBytes) {
				const sourcePixels = typeof width === "number" && typeof height === "number" ? `${width}x${height}px` : "unknown";
				const sourceWithFile = params.fileName ? `${params.fileName} ${sourcePixels}` : sourcePixels;
				const byteReductionPct = buf.byteLength > 0 ? Number(((buf.byteLength - out.byteLength) / buf.byteLength * 100).toFixed(1)) : 0;
				log.info(`Image resized to fit limits: ${sourceWithFile} ${formatBytesShort(buf.byteLength)} -> ${formatBytesShort(out.byteLength)} (-${byteReductionPct}%)`, {
					label: params.label,
					fileName: params.fileName,
					sourceMimeType: params.mimeType,
					sourceWidth: width,
					sourceHeight: height,
					sourceBytes: buf.byteLength,
					maxBytes: params.maxBytes,
					maxDimensionPx: params.maxDimensionPx,
					triggerOverBytes: overBytes,
					triggerOverDimensions: overDimensions,
					outputMimeType: "image/jpeg",
					outputBytes: out.byteLength,
					outputQuality: quality,
					outputMaxSide: side,
					byteReductionPct
				});
				return {
					base64: out.toString("base64"),
					mimeType: "image/jpeg",
					resized: true,
					width,
					height
				};
			}
		}
		if (processorUnavailableError) break;
	}
	if (processorUnavailableError) throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(processorUnavailableError, "Non-Error thrown");
	const best = smallest?.buffer ?? buf;
	const maxMb = (params.maxBytes / (1024 * 1024)).toFixed(0);
	const gotMb = (best.byteLength / (1024 * 1024)).toFixed(2);
	const sourcePixels = typeof width === "number" && typeof height === "number" ? `${width}x${height}px` : "unknown";
	const sourceWithFile = params.fileName ? `${params.fileName} ${sourcePixels}` : sourcePixels;
	log.warn(`Image resize failed to fit limits: ${sourceWithFile} best=${formatBytesShort(best.byteLength)} limit=${formatBytesShort(params.maxBytes)}`, {
		label: params.label,
		fileName: params.fileName,
		sourceMimeType: params.mimeType,
		sourceWidth: width,
		sourceHeight: height,
		sourceBytes: buf.byteLength,
		maxDimensionPx: params.maxDimensionPx,
		maxBytes: params.maxBytes,
		smallestCandidateBytes: best.byteLength,
		triggerOverBytes: overBytes,
		triggerOverDimensions: overDimensions
	});
	throw new Error(`Image could not be reduced below ${maxMb}MB (got ${gotMb}MB)`);
}
async function sanitizeContentBlocksImages(blocks, label, opts = {}) {
	const maxDimensionPx = (0, _gabrielvfonseca_normalization_core.resolveIntegerOption)(opts.maxDimensionPx, MAX_IMAGE_DIMENSION_PX, { min: 1 });
	const maxBytes = (0, _gabrielvfonseca_normalization_core.resolveIntegerOption)(opts.maxBytes, MAX_IMAGE_BYTES, { min: 1 });
	const out = [];
	for (const block of blocks) {
		if (!isImageBlock(block)) {
			if (isImageTypeBlock(block)) {
				out.push({
					type: "text",
					text: `[${label}] omitted image payload: missing data or mimeType`
				});
				continue;
			}
			out.push(block);
			continue;
		}
		const data = block.data.trim();
		if (!data) {
			out.push({
				type: "text",
				text: `[${label}] omitted empty image payload`
			});
			continue;
		}
		const canonicalData = (0, _gabrielvfonseca_media_core_base64.canonicalizeBase64)(data);
		if (!canonicalData) {
			out.push({
				type: "text",
				text: `[${label}] omitted image payload: invalid base64`
			});
			continue;
		}
		try {
			const mimeType = inferMimeTypeFromBase64(canonicalData) ?? block.mimeType;
			const resized = await resizeImageBase64IfNeeded({
				base64: canonicalData,
				mimeType,
				maxDimensionPx,
				maxBytes,
				label,
				fileName: inferImageFileName({
					block,
					label
				})
			});
			out.push({
				...block,
				data: resized.base64,
				mimeType: resized.resized ? resized.mimeType : mimeType
			});
		} catch (err) {
			out.push({
				type: "text",
				text: `[${label}] omitted image payload: ${String(err)}`
			});
		}
	}
	return out;
}
async function sanitizeImageBlocks(images, label, opts = {}) {
	if (images.length === 0) return {
		images,
		dropped: 0
	};
	const next = (await sanitizeContentBlocksImages(images, label, opts)).filter(isImageBlock);
	return {
		images: next,
		dropped: Math.max(0, images.length - next.length)
	};
}
async function sanitizeToolResultImages(result, label, opts = {}) {
	const content = Array.isArray(result.content) ? result.content : [];
	if (!content.some((block) => isImageTypeBlock(block) || isTextBlock(block))) return result;
	const next = await sanitizeContentBlocksImages(content, label, opts);
	return {
		...result,
		content: next
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_IMAGE_MAX_DIMENSION_PX", {
	enumerable: true,
	get: function() {
		return DEFAULT_IMAGE_MAX_DIMENSION_PX;
	}
});
Object.defineProperty(exports, "resolveImageSanitizationLimits", {
	enumerable: true,
	get: function() {
		return resolveImageSanitizationLimits;
	}
});
Object.defineProperty(exports, "sanitizeContentBlocksImages", {
	enumerable: true,
	get: function() {
		return sanitizeContentBlocksImages;
	}
});
Object.defineProperty(exports, "sanitizeImageBlocks", {
	enumerable: true,
	get: function() {
		return sanitizeImageBlocks;
	}
});
Object.defineProperty(exports, "sanitizeToolResultImages", {
	enumerable: true,
	get: function() {
		return sanitizeToolResultImages;
	}
});
