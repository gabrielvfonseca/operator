const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
require("./logging-CPL2M9DX.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_file_read = require("./file-read-CEyyOznW.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/logging/log-tail.ts
const DEFAULT_LIMIT = 500;
const DEFAULT_MAX_BYTES = 25e4;
const MAX_LIMIT = 5e3;
const MAX_BYTES = 1e6;
const ROLLING_LOG_RE = /^operator-\d{4}-\d{2}-\d{2}\.log$/;
function isRollingLogFile(file) {
	return ROLLING_LOG_RE.test(node_path.default.basename(file));
}
/** Resolves a rolling daily log path to the newest existing rolling log when needed. */
async function resolveLogFile(file) {
	if (await node_fs_promises.default.stat(file).catch(() => null)) return file;
	if (!isRollingLogFile(file)) return file;
	const dir = node_path.default.dirname(file);
	const entries = await node_fs_promises.default.readdir(dir, { withFileTypes: true }).catch(() => null);
	if (!entries) return file;
	return (await Promise.all(entries.filter((entry) => entry.isFile() && ROLLING_LOG_RE.test(entry.name)).map(async (entry) => {
		const fullPath = node_path.default.join(dir, entry.name);
		const fileStat = await node_fs_promises.default.stat(fullPath).catch(() => null);
		return fileStat ? {
			path: fullPath,
			mtimeMs: fileStat.mtimeMs
		} : null;
	}))).filter((entry) => Boolean(entry)).toSorted((a, b) => b.mtimeMs - a.mtimeMs)[0]?.path ?? file;
}
async function readLogSlice(params) {
	const stat = await node_fs_promises.default.stat(params.file).catch(() => null);
	if (!stat) return {
		cursor: 0,
		size: 0,
		lines: [],
		truncated: false,
		reset: false
	};
	const size = stat.size;
	const maxBytes = require_utils.clamp(params.maxBytes, 1, MAX_BYTES);
	const limit = require_utils.clamp(params.limit, 1, MAX_LIMIT);
	let cursor = typeof params.cursor === "number" && Number.isFinite(params.cursor) ? Math.max(0, Math.floor(params.cursor)) : void 0;
	let reset = false;
	let truncated = false;
	let start;
	if (cursor != null) if (cursor > size) {
		reset = true;
		start = Math.max(0, size - maxBytes);
		truncated = start > 0;
	} else {
		start = cursor;
		if (size - start > maxBytes) {
			reset = true;
			truncated = true;
			start = Math.max(0, size - maxBytes);
		}
	}
	else {
		start = Math.max(0, size - maxBytes);
		truncated = start > 0;
	}
	if (size === 0 || size <= start) return {
		cursor: size,
		size,
		lines: [],
		truncated,
		reset
	};
	const handle = await node_fs_promises.default.open(params.file, "r");
	try {
		let prefix = "";
		if (start > 0) {
			const prefixBuf = Buffer.alloc(1);
			const prefixRead = await handle.read(prefixBuf, 0, 1, start - 1);
			prefix = prefixBuf.toString("utf8", 0, prefixRead.bytesRead);
		}
		const length = Math.max(0, size - start);
		const buffer = Buffer.alloc(length);
		const bytesRead = await require_file_read.readFileWindowFully(handle, buffer, start);
		let lines = buffer.toString("utf8", 0, bytesRead).split("\n");
		if (start > 0 && prefix !== "\n") lines = lines.slice(1);
		if (lines.length > 0 && lines[lines.length - 1] === "") lines = lines.slice(0, -1);
		if (lines.length > limit) lines = lines.slice(lines.length - limit);
		cursor = size;
		return {
			cursor,
			size,
			lines,
			truncated,
			reset
		};
	} finally {
		await handle.close();
	}
}
/** Reads and redacts the configured log tail with bounded bytes and line count. */
async function readConfiguredLogTail(params) {
	const file = await resolveLogFile(require_logger.getResolvedLoggerSettings().file);
	const result = await readLogSlice({
		file,
		cursor: params?.cursor,
		limit: params?.limit ?? DEFAULT_LIMIT,
		maxBytes: params?.maxBytes ?? DEFAULT_MAX_BYTES
	});
	const redaction = require_redact.resolveRedactOptions();
	return {
		file,
		...result,
		lines: require_redact.redactSensitiveLines(result.lines, redaction)
	};
}
//#endregion
//#region src/gateway/server-methods/logs.ts
/** Gateway handler for bounded reads from the configured gateway log. */
const logsHandlers = { "logs.tail": async ({ params, respond }) => {
	if (!require_src.validateLogsTailParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid logs.tail params: ${require_validation_errors.formatValidationErrors(require_src.validateLogsTailParams.errors)}`));
		return;
	}
	const p = params;
	try {
		respond(true, await readConfiguredLogTail({
			cursor: p.cursor,
			limit: p.limit,
			maxBytes: p.maxBytes
		}), void 0);
	} catch (err) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `log read failed: ${String(err)}`));
	}
} };
//#endregion
exports.logsHandlers = logsHandlers;
