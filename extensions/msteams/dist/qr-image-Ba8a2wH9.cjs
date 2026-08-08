const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
require("./private-temp-workspace-CZ5HRjLT.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/media/qr-runtime.ts
const qrCodeRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => import("qrcode").then((mod) => mod.default ?? mod));
/** Loads the qrcode package lazily so QR support does not affect media startup paths. */
async function loadQrCodeRuntime() {
	return await qrCodeRuntimeLoader.load();
}
//#endregion
//#region src/media/qr-image.ts
const DEFAULT_QR_PNG_SCALE = 6;
const DEFAULT_QR_PNG_MARGIN_MODULES = 4;
const MIN_QR_PNG_SCALE = 1;
const MAX_QR_PNG_SCALE = 12;
const MIN_QR_PNG_MARGIN_MODULES = 0;
const MAX_QR_PNG_MARGIN_MODULES = 16;
const QR_PNG_DATA_URL_PREFIX = "data:image/png;base64,";
function resolveQrPngIntegerOption(params) {
	if (params.value === void 0) return params.defaultValue;
	if (!Number.isFinite(params.value)) throw new RangeError(`${params.name} must be a finite number.`);
	const value = Math.floor(params.value);
	if (value < params.min || value > params.max) throw new RangeError(`${params.name} must be between ${params.min} and ${params.max}.`);
	return value;
}
/** Renders QR text as raw PNG base64 after validating bounded renderer options. */
async function renderQrPngBase64(input, opts = {}) {
	const scale = resolveQrPngIntegerOption({
		name: "scale",
		value: opts.scale,
		defaultValue: DEFAULT_QR_PNG_SCALE,
		min: MIN_QR_PNG_SCALE,
		max: MAX_QR_PNG_SCALE
	});
	const marginModules = resolveQrPngIntegerOption({
		name: "marginModules",
		value: opts.marginModules,
		defaultValue: DEFAULT_QR_PNG_MARGIN_MODULES,
		min: MIN_QR_PNG_MARGIN_MODULES,
		max: MAX_QR_PNG_MARGIN_MODULES
	});
	return (await (await loadQrCodeRuntime()).toBuffer(input, {
		margin: marginModules,
		scale
	})).toString("base64");
}
/** Wraps PNG base64 in the exact data URL prefix expected by chat/media callers. */
function formatQrPngDataUrl(base64) {
	return `${QR_PNG_DATA_URL_PREFIX}${base64}`;
}
/** Renders QR text as a PNG data URL. */
async function renderQrPngDataUrl(input, opts = {}) {
	return formatQrPngDataUrl(await renderQrPngBase64(input, opts));
}
//#endregion
Object.defineProperty(exports, "loadQrCodeRuntime", {
	enumerable: true,
	get: function() {
		return loadQrCodeRuntime;
	}
});
Object.defineProperty(exports, "renderQrPngDataUrl", {
	enumerable: true,
	get: function() {
		return renderQrPngDataUrl;
	}
});
