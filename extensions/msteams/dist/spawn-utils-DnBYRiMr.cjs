require("./errors-BqS4bzom.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_child_process = require("node:child_process");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/infra/windows-encoding.ts
const WINDOWS_CODEPAGE_ENCODING_MAP = {
	65001: "utf-8",
	54936: "gb18030",
	874: "windows-874",
	936: "gbk",
	950: "big5",
	932: "shift_jis",
	949: "euc-kr",
	1250: "windows-1250",
	1251: "windows-1251",
	1252: "windows-1252",
	1253: "windows-1253",
	1254: "windows-1254",
	1255: "windows-1255",
	1256: "windows-1256",
	1257: "windows-1257",
	1258: "windows-1258"
};
let cachedWindowsConsoleEncoding;
let cachedWindowsSystemEncoding;
/** Extracts a Windows console code page number from localized `chcp` output. */
function parseWindowsCodePage(raw) {
	if (!raw) return null;
	const match = raw.match(/\b(\d{3,5})\b/);
	if (!match?.[1]) return null;
	const codePage = Number.parseInt(match[1], 10);
	if (!Number.isFinite(codePage) || codePage <= 0) return null;
	return codePage;
}
/** Resolves and caches the current Windows console encoding for subprocess output. */
function resolveWindowsConsoleEncoding() {
	if (process.platform !== "win32") return null;
	if (cachedWindowsConsoleEncoding !== void 0) return cachedWindowsConsoleEncoding;
	try {
		const result = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsCmdExePath(), [
			"/d",
			"/s",
			"/c",
			"chcp"
		], {
			windowsHide: true,
			encoding: "utf8",
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		const codePage = parseWindowsCodePage(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
		cachedWindowsConsoleEncoding = codePage !== null ? WINDOWS_CODEPAGE_ENCODING_MAP[codePage] ?? null : null;
	} catch {
		cachedWindowsConsoleEncoding = null;
	}
	return cachedWindowsConsoleEncoding;
}
/** Resolves and caches the Windows system encoding used by legacy text files. */
function resolveWindowsSystemEncoding() {
	if (process.platform !== "win32") return null;
	if (cachedWindowsSystemEncoding !== void 0) return cachedWindowsSystemEncoding;
	try {
		const result = (0, node_child_process.spawnSync)("powershell.exe", [
			"-NoLogo",
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			"[Text.Encoding]::Default.CodePage"
		], {
			windowsHide: true,
			encoding: "utf8",
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		const codePage = parseWindowsCodePage(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
		cachedWindowsSystemEncoding = codePage !== null ? WINDOWS_CODEPAGE_ENCODING_MAP[codePage] ?? null : null;
	} catch {
		cachedWindowsSystemEncoding = null;
	}
	return cachedWindowsSystemEncoding;
}
/** Decodes one complete subprocess output buffer, preferring valid UTF-8 before legacy code pages. */
function decodeWindowsOutputBuffer(params) {
	return decodeWindowsBufferWithFallback({
		...params,
		resolveFallbackEncoding: () => params.windowsEncoding ?? resolveWindowsConsoleEncoding()
	});
}
/** Decodes a text file, preferring valid UTF-8 before the Windows system encoding. */
function decodeWindowsTextFileBuffer(params) {
	return decodeWindowsBufferWithFallback({
		...params,
		resolveFallbackEncoding: () => params.windowsEncoding ?? resolveWindowsSystemEncoding()
	});
}
function decodeWindowsBufferWithFallback(params) {
	if ((params.platform ?? process.platform) !== "win32") return params.buffer.toString("utf8");
	const utf8 = decodeStrictUtf8(params.buffer);
	if (utf8 !== null) return utf8;
	const encoding = params.resolveFallbackEncoding();
	if (!encoding || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(encoding) === "utf-8") return params.buffer.toString("utf8");
	try {
		return new TextDecoder(encoding).decode(params.buffer);
	} catch {
		return params.buffer.toString("utf8");
	}
}
/** Creates a streaming decoder for subprocess output chunks that may split multibyte characters. */
function createWindowsOutputDecoder(params) {
	const platform = params?.platform ?? process.platform;
	const encoding = platform === "win32" ? params?.windowsEncoding ?? resolveWindowsConsoleEncoding() : null;
	const normalizedEncoding = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(encoding);
	const legacyDecoder = platform === "win32" && encoding && normalizedEncoding !== "utf-8" ? new TextDecoder(encoding) : null;
	const utf8Decoder = platform === "win32" && legacyDecoder ? new TextDecoder("utf-8", { fatal: true }) : null;
	const streamingUtf8Decoder = legacyDecoder ? null : new TextDecoder("utf-8");
	let useLegacyDecoder = false;
	let pendingUtf8Bytes = Buffer.alloc(0);
	return {
		decode(chunk) {
			const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			if (!legacyDecoder || !utf8Decoder) return streamingUtf8Decoder?.decode(buffer, { stream: true }) ?? "";
			if (useLegacyDecoder) return legacyDecoder.decode(buffer, { stream: true });
			const replayBuffer = pendingUtf8Bytes.length > 0 ? Buffer.concat([pendingUtf8Bytes, buffer]) : buffer;
			try {
				const decoded = utf8Decoder.decode(buffer, { stream: true });
				pendingUtf8Bytes = Buffer.from(getTrailingIncompleteUtf8Bytes(replayBuffer));
				return decoded;
			} catch {
				useLegacyDecoder = true;
				pendingUtf8Bytes = Buffer.alloc(0);
				return legacyDecoder.decode(replayBuffer, { stream: true });
			}
		},
		flush() {
			if (!legacyDecoder || !utf8Decoder) return streamingUtf8Decoder?.decode() ?? "";
			if (useLegacyDecoder) return legacyDecoder.decode();
			try {
				const decoded = utf8Decoder.decode();
				pendingUtf8Bytes = Buffer.alloc(0);
				return decoded;
			} catch {
				useLegacyDecoder = true;
				const replayBuffer = pendingUtf8Bytes;
				pendingUtf8Bytes = Buffer.alloc(0);
				return replayBuffer.length > 0 ? legacyDecoder.decode(replayBuffer) : "";
			}
		}
	};
}
function getTrailingIncompleteUtf8Bytes(buffer) {
	let index = buffer.length - 1;
	let continuationBytes = 0;
	while (index >= 0 && continuationBytes < 3) {
		const byte = buffer.at(index);
		if (byte === void 0 || byte < 128 || byte > 191) break;
		continuationBytes += 1;
		index -= 1;
	}
	if (index < 0) return buffer;
	const leadByte = buffer.at(index);
	if (leadByte === void 0) return Buffer.alloc(0);
	const sequenceLength = getUtf8SequenceLength(leadByte);
	if (sequenceLength <= 1) return Buffer.alloc(0);
	return continuationBytes + 1 < sequenceLength ? buffer.subarray(index) : Buffer.alloc(0);
}
function getUtf8SequenceLength(byte) {
	if (byte >= 194 && byte <= 223) return 2;
	if (byte >= 224 && byte <= 239) return 3;
	if (byte >= 240 && byte <= 244) return 4;
	return 1;
}
function decodeStrictUtf8(buffer) {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
	} catch {
		return null;
	}
}
//#endregion
//#region src/process/spawn-utils.ts
const DEFAULT_RETRY_CODES = ["EBADF"];
function resolveCommandStdio(params) {
	return [
		params.hasInput ? "pipe" : params.preferInherit ? "inherit" : "pipe",
		"pipe",
		"pipe"
	];
}
function shouldRetry(err, codes) {
	const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
	return code.length > 0 && codes.includes(code);
}
async function spawnAndWaitForSpawn(spawnImpl, argv, options) {
	const child = spawnImpl((0, _gabrielvfonseca_normalization_core.expectDefined)(argv[0], "argv entry at 0"), argv.slice(1), options);
	return await new Promise((resolve, reject) => {
		let settled = false;
		const cleanup = () => {
			child.removeListener("error", onError);
			child.removeListener("spawn", onSpawn);
		};
		const finishResolve = () => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(child);
		};
		const onError = (err) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(err, "Non-Error rejection"));
		};
		const onSpawn = () => {
			finishResolve();
		};
		child.once("error", onError);
		child.once("spawn", onSpawn);
		process.nextTick(() => {
			if (typeof child.pid === "number") finishResolve();
		});
	});
}
async function spawnWithFallback(params) {
	const spawnImpl = params.spawnImpl ?? node_child_process.spawn;
	const retryCodes = params.retryCodes ?? DEFAULT_RETRY_CODES;
	const baseOptions = { ...params.options };
	const fallbacks = params.fallbacks ?? [];
	const attempts = [{ options: baseOptions }, ...fallbacks.map((fallback) => ({
		label: fallback.label,
		options: {
			...baseOptions,
			...fallback.options
		}
	}))];
	let lastError;
	for (const [index, attempt] of attempts.entries()) try {
		return {
			child: await spawnAndWaitForSpawn(spawnImpl, params.argv, attempt.options),
			usedFallback: index > 0,
			fallbackLabel: attempt.label
		};
	} catch (err) {
		lastError = err;
		const nextFallback = fallbacks[index];
		if (!nextFallback || !shouldRetry(err, retryCodes)) throw err;
		params.onFallback?.(err, nextFallback);
	}
	throw lastError;
}
//#endregion
Object.defineProperty(exports, "createWindowsOutputDecoder", {
	enumerable: true,
	get: function() {
		return createWindowsOutputDecoder;
	}
});
Object.defineProperty(exports, "decodeWindowsOutputBuffer", {
	enumerable: true,
	get: function() {
		return decodeWindowsOutputBuffer;
	}
});
Object.defineProperty(exports, "decodeWindowsTextFileBuffer", {
	enumerable: true,
	get: function() {
		return decodeWindowsTextFileBuffer;
	}
});
Object.defineProperty(exports, "resolveCommandStdio", {
	enumerable: true,
	get: function() {
		return resolveCommandStdio;
	}
});
Object.defineProperty(exports, "resolveWindowsConsoleEncoding", {
	enumerable: true,
	get: function() {
		return resolveWindowsConsoleEncoding;
	}
});
Object.defineProperty(exports, "resolveWindowsSystemEncoding", {
	enumerable: true,
	get: function() {
		return resolveWindowsSystemEncoding;
	}
});
Object.defineProperty(exports, "spawnWithFallback", {
	enumerable: true,
	get: function() {
		return spawnWithFallback;
	}
});
