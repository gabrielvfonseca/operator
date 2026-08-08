const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./private-temp-workspace-CZ5HRjLT.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_resolve_system_bin = require("./resolve-system-bin-B1IIqmHp.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
require("@gabrielvfonseca/normalization-core/string-coerce");
require("@gabrielvfonseca/media-core/file-name");
let rastermill = require("rastermill");
/** Default ffmpeg timeout for bounded media conversion work. */
const MEDIA_FFMPEG_TIMEOUT_MS = 45e3;
//#endregion
//#region src/media/ffmpeg-exec.ts
function resolveExecOptions(defaultTimeoutMs, options) {
	return {
		input: options?.input,
		logOutput: false,
		maxBuffer: options?.maxBufferBytes ?? 10485760,
		timeoutMs: options?.timeoutMs ?? defaultTimeoutMs
	};
}
function requireSystemBin(name) {
	const resolved = require_resolve_system_bin.resolveSystemBin(name, { trust: "standard" });
	if (!resolved) {
		const hint = process.platform === "darwin" ? "e.g. brew install ffmpeg" : "e.g. apt install ffmpeg / dnf install ffmpeg";
		throw new Error(`${name} not found in trusted system directories. Install it via your system package manager (${hint}).`);
	}
	return resolved;
}
/** Resolves ffmpeg from trusted system paths before command execution. */
function resolveFfmpegBin() {
	return requireSystemBin("ffmpeg");
}
/** Runs ffmpeg with bounded timeout and buffer settings. */
async function runFfmpeg(args, options) {
	const { stdout } = await require_exec.runExec(resolveFfmpegBin(), args, resolveExecOptions(MEDIA_FFMPEG_TIMEOUT_MS, options));
	return stdout;
}
//#endregion
//#region src/media/image-ops.ts
/** Operator-facing image backend availability error, preserving the failed operation and causes. */
var ImageProcessorUnavailableError = class extends Error {
	constructor(operation, message, causes = []) {
		super(message ?? `Image processor unavailable for ${operation}`, { cause: causes.find((cause) => cause instanceof Error) });
		this.code = "IMAGE_PROCESSOR_UNAVAILABLE";
		this.name = "ImageProcessorUnavailableError";
		this.operation = operation;
		this.causes = causes;
	}
};
/** Ordered JPEG quality ladder used when shrinking generated or attached images. */
const IMAGE_REDUCE_QUALITY_STEPS = [
	85,
	75,
	65,
	55,
	45,
	35
];
/** Shared input/output pixel cap for Rastermill-backed image operations. */
const MAX_IMAGE_INPUT_PIXELS = 25e6;
const loadPhotonRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./photon.runtime-BcWMdN43.cjs")));
/** Creates a Rastermill processor with Operator temp-dir, pixel-limit, and command trust policy. */
function createImageProcessor() {
	return (0, rastermill.createRastermill)({
		execution: "auto",
		limits: {
			inputPixels: MAX_IMAGE_INPUT_PIXELS,
			outputPixels: MAX_IMAGE_INPUT_PIXELS
		},
		temp: {
			rootDir: require_tmp_operator_dir.resolvePreferredOperatorTmpDir(),
			prefix: "operator-img-"
		},
		commandResolver: (command) => require_resolve_system_bin.resolveSystemBin(command, { trust: command === "powershell" ? "strict" : "standard" })
	});
}
/** Detects either Operator's wrapper error or Rastermill's native unavailable error. */
function isImageProcessorUnavailableError(err) {
	return err instanceof ImageProcessorUnavailableError || (0, rastermill.isRastermillUnavailableError)(err);
}
/** Builds a descending, de-duplicated max-side search grid for iterative image resizing. */
function buildImageResizeSideGrid(maxSide, sideStart) {
	return [
		sideStart,
		1800,
		1600,
		1400,
		1200,
		1e3,
		800
	].map((value) => Math.min(maxSide, value)).filter((value, idx, arr) => value > 0 && arr.indexOf(value) === idx).toSorted((a, b) => b - a);
}
/** Reads dimensions from image header bytes without invoking a full image decode. */
function readImageMetadataFromHeader(buffer) {
	return (0, rastermill.readImageMetadataFromHeader)(buffer);
}
/** Reads image probe data from header bytes without invoking a full image decode. */
function readImageProbeFromHeader(buffer) {
	return (0, rastermill.readImageProbeFromHeader)(buffer);
}
function wrapRastermillUnavailable(operation, error) {
	if (error instanceof rastermill.RastermillUnavailableError) throw new ImageProcessorUnavailableError(operation, error.message, error.causes);
	throw error;
}
/** Fully probes image dimensions through Rastermill when header-only metadata is insufficient. */
async function getImageMetadata(buffer) {
	const info = await createImageProcessor().probe(buffer);
	return info ? {
		width: info.width,
		height: info.height
	} : null;
}
/** Resizes or encodes image bytes as JPEG through the shared image processor. */
async function resizeToJpeg(params) {
	try {
		return (await createImageProcessor().encode(params.buffer, {
			format: "jpeg",
			resize: {
				maxSide: params.maxSide,
				enlarge: params.withoutEnlargement === false
			},
			quality: params.quality
		})).data;
	} catch (error) {
		return wrapRastermillUnavailable("resizeToJpeg", error);
	}
}
/** Converts HEIC/HEIF-like image bytes into JPEG through the shared image processor. */
async function convertHeicToJpeg(buffer) {
	try {
		return (await createImageProcessor().encode(buffer, { format: "jpeg" })).data;
	} catch (error) {
		return wrapRastermillUnavailable("convertHeicToJpeg", error);
	}
}
/** Converts image bytes to PNG, including BMP fallback unsupported by Rastermill's Photon gate. */
async function convertImageToPng(buffer) {
	try {
		return (await createImageProcessor().encode(buffer, { format: "png" })).data;
	} catch (error) {
		const probe = (0, rastermill.readImageProbeFromHeader)(buffer);
		if (!(probe && probe.format === "bmp" && probe.width > 0 && probe.height > 0 && probe.width <= 25e6 / probe.height)) throw error;
		try {
			return (await loadPhotonRuntime()).convertBmpToPngWithPhoton(buffer);
		} catch {
			throw error;
		}
	}
}
/** Optimizes PNG bytes under a target size and returns the chosen search parameters. */
async function optimizeImageToPng(buffer, maxBytes, options) {
	let out;
	try {
		out = await createImageProcessor().encode(buffer, {
			format: "png",
			maxBytes,
			search: options?.sides === void 0 ? {} : { maxSide: options.sides }
		});
	} catch (error) {
		wrapRastermillUnavailable("optimizeImageToPng", error);
	}
	return {
		buffer: out.data,
		optimizedSize: out.bytes,
		resizeSide: out.chosen.maxSide ?? out.width,
		compressionLevel: out.chosen.compressionLevel ?? 6
	};
}
//#endregion
Object.defineProperty(exports, "IMAGE_REDUCE_QUALITY_STEPS", {
	enumerable: true,
	get: function() {
		return IMAGE_REDUCE_QUALITY_STEPS;
	}
});
Object.defineProperty(exports, "MAX_IMAGE_INPUT_PIXELS", {
	enumerable: true,
	get: function() {
		return MAX_IMAGE_INPUT_PIXELS;
	}
});
Object.defineProperty(exports, "buildImageResizeSideGrid", {
	enumerable: true,
	get: function() {
		return buildImageResizeSideGrid;
	}
});
Object.defineProperty(exports, "convertHeicToJpeg", {
	enumerable: true,
	get: function() {
		return convertHeicToJpeg;
	}
});
Object.defineProperty(exports, "convertImageToPng", {
	enumerable: true,
	get: function() {
		return convertImageToPng;
	}
});
Object.defineProperty(exports, "createImageProcessor", {
	enumerable: true,
	get: function() {
		return createImageProcessor;
	}
});
Object.defineProperty(exports, "getImageMetadata", {
	enumerable: true,
	get: function() {
		return getImageMetadata;
	}
});
Object.defineProperty(exports, "isImageProcessorUnavailableError", {
	enumerable: true,
	get: function() {
		return isImageProcessorUnavailableError;
	}
});
Object.defineProperty(exports, "optimizeImageToPng", {
	enumerable: true,
	get: function() {
		return optimizeImageToPng;
	}
});
Object.defineProperty(exports, "readImageMetadataFromHeader", {
	enumerable: true,
	get: function() {
		return readImageMetadataFromHeader;
	}
});
Object.defineProperty(exports, "readImageProbeFromHeader", {
	enumerable: true,
	get: function() {
		return readImageProbeFromHeader;
	}
});
Object.defineProperty(exports, "resizeToJpeg", {
	enumerable: true,
	get: function() {
		return resizeToJpeg;
	}
});
Object.defineProperty(exports, "runFfmpeg", {
	enumerable: true,
	get: function() {
		return runFfmpeg;
	}
});
