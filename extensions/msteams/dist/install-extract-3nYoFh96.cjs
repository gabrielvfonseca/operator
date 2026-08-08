require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
require("./archive-HshK6KD3.cjs");
const require_config_eval = require("./config-eval-fz8eE8a4.cjs");
require("./config-Dazx2uDq.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
//#region src/skills/lifecycle/install-tar-verbose.ts
const TAR_VERBOSE_MONTHS = /* @__PURE__ */ new Set([
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
]);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function mapTarVerboseTypeChar(typeChar) {
	switch (typeChar) {
		case "l": return "SymbolicLink";
		case "h": return "Link";
		case "b": return "BlockDevice";
		case "c": return "CharacterDevice";
		case "p": return "FIFO";
		case "s": return "Socket";
		case "d": return "Directory";
		default: return "File";
	}
}
function parseTarVerboseSize(line) {
	const tokens = line.trim().split(/\s+/).filter(Boolean);
	if (tokens.length < 6) throw new Error(`unable to parse tar verbose metadata: ${line}`);
	let dateIndex = tokens.findIndex((token) => TAR_VERBOSE_MONTHS.has(token));
	if (dateIndex > 0) return parseTarSizeToken(tokens[dateIndex - 1] ?? "", line);
	dateIndex = tokens.findIndex((token) => ISO_DATE_PATTERN.test(token));
	if (dateIndex > 0) return parseTarSizeToken(tokens[dateIndex - 1] ?? "", line);
	throw new Error(`unable to parse tar verbose metadata: ${line}`);
}
function parseTarSizeToken(raw, line) {
	if (!/^\d+$/.test(raw)) throw new Error(`unable to parse tar entry size: ${line}`);
	const size = Number(raw);
	if (!Number.isSafeInteger(size)) throw new Error(`unable to parse tar entry size: ${line}`);
	return size;
}
/** Parses tar verbose metadata into type and byte size entries. */
function parseTarVerboseMetadata(stdout) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(stdout.split("\n")).map((line) => {
		const typeChar = line[0] ?? "";
		if (!typeChar) throw new Error("unable to parse tar entry type");
		return {
			type: mapTarVerboseTypeChar(typeChar),
			size: parseTarVerboseSize(line)
		};
	});
}
//#endregion
//#region src/skills/lifecycle/install-extract.ts
function commandFailureResult(result, fallbackStderr) {
	return {
		stdout: result.stdout,
		stderr: result.stderr || fallbackStderr,
		code: result.code
	};
}
function buildTarExtractArgv(params) {
	const argv = [
		"tar",
		"xf",
		params.archivePath,
		"-C",
		params.targetDir
	];
	if (params.stripComponents > 0) argv.push("--strip-components", String(params.stripComponents));
	return argv;
}
async function readTarPreflight(params) {
	const listResult = await require_exec.runCommandWithTimeout([
		"tar",
		"tf",
		params.archivePath
	], { timeoutMs: params.timeoutMs });
	if (listResult.code !== 0) return commandFailureResult(listResult, "tar list failed");
	const entries = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(listResult.stdout.split("\n"));
	const verboseResult = await require_exec.runCommandWithTimeout([
		"tar",
		"tvf",
		params.archivePath
	], { timeoutMs: params.timeoutMs });
	if (verboseResult.code !== 0) return commandFailureResult(verboseResult, "tar verbose list failed");
	const metadata = parseTarVerboseMetadata(verboseResult.stdout);
	if (metadata.length !== entries.length) return {
		stdout: verboseResult.stdout,
		stderr: `tar verbose/list entry count mismatch (${metadata.length} vs ${entries.length})`,
		code: 1
	};
	return {
		entries,
		metadata
	};
}
function isArchiveExtractFailure(value) {
	return "code" in value;
}
async function verifyArchiveHashStable(params) {
	if (await require_crypto_digest.sha256File(params.archivePath) === params.expectedHash) return null;
	return {
		stdout: "",
		stderr: "tar archive changed during safety preflight; refusing to extract",
		code: 1
	};
}
async function extractTarBz2WithStaging(params) {
	return await (0, _openclaw_fs_safe_archive.withStagedArchiveDestination)({
		destinationRealDir: params.destinationRealDir,
		run: async (stagingDir) => {
			const extractResult = await require_exec.runCommandWithTimeout(buildTarExtractArgv({
				archivePath: params.archivePath,
				targetDir: stagingDir,
				stripComponents: params.stripComponents
			}), { timeoutMs: params.timeoutMs });
			if (extractResult.code !== 0) return extractResult;
			await (0, _openclaw_fs_safe_archive.mergeExtractedTreeIntoDestination)({
				sourceDir: stagingDir,
				destinationDir: params.destinationRealDir,
				destinationRealDir: params.destinationRealDir
			});
			return extractResult;
		}
	});
}
async function extractArchive(params) {
	const { archivePath, archiveType, targetDir, stripComponents, timeoutMs } = params;
	const strip = typeof stripComponents === "number" && Number.isFinite(stripComponents) ? Math.max(0, Math.floor(stripComponents)) : 0;
	try {
		if (archiveType === "zip") {
			await (0, _openclaw_fs_safe_archive.extractArchive)({
				archivePath,
				destDir: targetDir,
				timeoutMs,
				kind: "zip",
				stripComponents: strip
			});
			return {
				stdout: "",
				stderr: "",
				code: 0
			};
		}
		if (archiveType === "tar.gz") {
			await (0, _openclaw_fs_safe_archive.extractArchive)({
				archivePath,
				destDir: targetDir,
				timeoutMs,
				kind: "tar",
				stripComponents: strip,
				tarGzip: true
			});
			return {
				stdout: "",
				stderr: "",
				code: 0
			};
		}
		if (archiveType === "tar.bz2") {
			if (!require_config_eval.hasBinary("tar")) return {
				stdout: "",
				stderr: "tar not found on PATH",
				code: null
			};
			const destinationRealDir = await (0, _openclaw_fs_safe_archive.prepareArchiveDestinationDir)(targetDir);
			const preflightHash = await require_crypto_digest.sha256File(archivePath);
			const preflight = await readTarPreflight({
				archivePath,
				timeoutMs
			});
			if (isArchiveExtractFailure(preflight)) return preflight;
			const checkTarEntrySafety = (0, _openclaw_fs_safe_archive.createTarEntryPreflightChecker)({
				rootDir: destinationRealDir,
				stripComponents: strip,
				escapeLabel: "targetDir"
			});
			for (let i = 0; i < preflight.entries.length; i += 1) {
				const entryPath = preflight.entries[i];
				const entryMeta = preflight.metadata[i];
				if (!entryPath || !entryMeta) return {
					stdout: "",
					stderr: "tar metadata parse failure",
					code: 1
				};
				checkTarEntrySafety({
					path: entryPath,
					type: entryMeta.type,
					size: entryMeta.size
				});
			}
			const hashFailure = await verifyArchiveHashStable({
				archivePath,
				expectedHash: preflightHash
			});
			if (hashFailure) return hashFailure;
			return await extractTarBz2WithStaging({
				archivePath,
				destinationRealDir,
				stripComponents: strip,
				timeoutMs
			});
		}
		return {
			stdout: "",
			stderr: `unsupported archive type: ${archiveType}`,
			code: null
		};
	} catch (err) {
		return {
			stdout: "",
			stderr: require_errors.formatErrorMessage(err),
			code: 1
		};
	}
}
//#endregion
exports.extractArchive = extractArchive;
