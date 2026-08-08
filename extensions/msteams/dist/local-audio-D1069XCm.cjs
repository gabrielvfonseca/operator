const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/media-understanding/fs.ts
/** Safely checks optional media file paths without throwing on empty input. */
async function fileExists(filePath) {
	return filePath ? await (0, _openclaw_fs_safe_advanced.pathExists)(filePath) : false;
}
//#endregion
//#region src/media-understanding/local-audio.ts
const binaryCache = /* @__PURE__ */ new Map();
const libraryCache = /* @__PURE__ */ new Map();
const observedBackendCache = /* @__PURE__ */ new Map();
function clearLocalAudioInspectionCacheForTests() {
	binaryCache.clear();
	libraryCache.clear();
	observedBackendCache.clear();
}
function commandId(command) {
	return node_path.default.basename(command.trim()).toLowerCase();
}
function resolveRequestedLocalAudioBackend(params) {
	const command = commandId(params.command);
	if (command === "sherpa-onnx-offline") {
		const providerIndex = params.args.indexOf("--provider");
		return ((providerIndex >= 0 ? params.args[providerIndex + 1] : void 0) ?? params.args.find((arg) => arg.startsWith("--provider="))?.slice(11) ?? "cpu").trim().toLowerCase();
	}
	if (command === "whisper-cli") {
		if (params.args.includes("-ng") || params.args.includes("--no-gpu")) return "cpu";
		const deviceIndex = params.args.findIndex((arg) => arg === "-dev" || arg === "--device");
		const device = (deviceIndex >= 0 ? params.args[deviceIndex + 1] : void 0) ?? params.args.find((arg) => arg.startsWith("--device="))?.slice(9);
		return device?.trim() ? `device:${device.trim()}` : void 0;
	}
}
function observationKey(params) {
	return `${params.command.trim()}\0${resolveRequestedLocalAudioBackend(params) ?? "default"}`;
}
function recordLocalAudioBackendObservation(params) {
	if (commandId(params.command) !== "whisper-cli") return;
	const backend = /failed to initialize\s+(?:MTL\d+|Metal|CUDA\d*)\s+backend/i.test(params.output) ? "cpu" : /using\s+(?:MTL\d+|Metal)\s+backend/i.test(params.output) ? "metal" : /using\s+CUDA\d*\s+backend/i.test(params.output) ? "cuda" : /using\s+CPU\s+backend|no GPU found/i.test(params.output) ? "cpu" : void 0;
	if (backend) observedBackendCache.set(observationKey(params), backend);
	return backend;
}
function getObservedBackend(params) {
	return observedBackendCache.get(observationKey(params));
}
async function isExecutable(filePath, platform) {
	try {
		if (!(await node_fs_promises.default.stat(filePath)).isFile()) return false;
		if (platform !== "win32") await node_fs_promises.default.access(filePath, node_fs.constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
function binaryNames(name, platform, env) {
	if (platform !== "win32" || node_path.default.extname(name)) return [name];
	return [name, ...(env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";").map((extension) => extension.trim()).filter(Boolean).map((extension) => `${name}${extension}`)];
}
function expandHomeDir(value, env) {
	const trimmed = value.trim().replace(/^"(.*)"$/, "$1");
	if (trimmed === "~") return env.HOME ?? trimmed;
	if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) return env.HOME ? node_path.default.join(env.HOME, trimmed.slice(2)) : trimmed;
	return trimmed;
}
async function findBinary(name, env, platform, checkExecutable = isExecutable) {
	const key = `${platform}\0${env.PATH ?? ""}\0${env.PATHEXT ?? ""}\0${name}`;
	return await require_lazy_promise.getOrCreatePromise(binaryCache, key, async () => {
		const direct = name.trim();
		const candidates = binaryNames(direct, platform, env);
		if (direct.includes("/") || direct.includes("\\")) {
			for (const candidate of candidates) {
				const expanded = candidate === "~" || candidate.startsWith("~/") || candidate.startsWith("~\\") ? node_path.default.join(env.HOME ?? "~", candidate.slice(candidate === "~" ? 1 : 2)) : candidate;
				if (await checkExecutable(expanded, platform)) return expanded;
			}
			return null;
		}
		for (const directory of (env.PATH ?? "").split(node_path.default.delimiter)) {
			const expandedDirectory = expandHomeDir(directory, env);
			if (!expandedDirectory) continue;
			for (const candidate of candidates) {
				const fullPath = node_path.default.join(expandedDirectory, candidate);
				if (await checkExecutable(fullPath, platform)) return fullPath;
			}
		}
		return null;
	});
}
async function inspectLinkedLibraries(filePath, platform) {
	const key = `${platform}\0${filePath}`;
	return await require_lazy_promise.getOrCreatePromise(libraryCache, key, async () => {
		const command = platform === "darwin" ? "otool" : platform === "linux" ? "readelf" : null;
		if (!command) return null;
		try {
			const result = await require_exec.runExec(command, platform === "darwin" ? ["-L", filePath] : ["-d", filePath], { timeoutMs: 1500 });
			return `${result.stdout}\n${result.stderr ?? ""}`;
		} catch {
			return null;
		}
	});
}
async function inspectWhisperBackend(params) {
	const libraries = await params.libraries(params.command, params.platform);
	if (/(?:ggml[-_]?cuda|libcuda|libcudart)/i.test(libraries ?? "")) return {
		capableBackend: "cuda",
		evidence: "whisper-cli links a CUDA ggml runtime"
	};
	if (params.platform === "darwin" && params.arch === "arm64") {
		const realCommand = await params.realpath(params.command).catch(() => params.command);
		if (/(?:ggml[-_]?metal|Metal\.framework)/i.test(libraries ?? "") || /\/Cellar\/whisper-cpp\/[^/]+\/bin\/whisper-cli$/.test(realCommand)) return {
			capableBackend: "metal",
			evidence: "Apple Silicon Homebrew whisper-cpp runtime with Metal support"
		};
	}
	return { evidence: "whisper-cli backend cannot be proven without loading a model" };
}
function rank(candidate) {
	if (candidate.id === "whisper-cli" && (candidate.observedBackend === "metal" || candidate.observedBackend === "cuda")) return 0;
	if (candidate.id === "sherpa-onnx-offline") return 1;
	if (candidate.id === "whisper-cli") return 2;
	return candidate.id === "parakeet-mlx" ? 3 : 4;
}
async function inspectLocalAudioSelection(options = {}) {
	const env = options.env ?? process.env;
	const platform = options.platform ?? process.platform;
	const arch = options.arch ?? process.arch;
	const resolveBinary = async (name) => options.resolveBinary ? await options.resolveBinary(name, env) : await findBinary(name, env, platform, options.checkExecutable);
	const [parakeetCommand, whisperCommand, sherpaCommand, pythonCommand] = await Promise.all([
		"parakeet-mlx",
		"whisper-cli",
		"sherpa-onnx-offline",
		"whisper"
	].map(resolveBinary));
	const envModel = env.WHISPER_CPP_MODEL?.trim();
	const whisperModel = envModel && await fileExists(envModel) ? envModel : "/opt/homebrew/share/whisper-cpp/for-tests-ggml-tiny.bin";
	const whisperReady = Boolean(whisperCommand) && await fileExists(whisperModel);
	const whisperBackend = whisperCommand ? await inspectWhisperBackend({
		command: whisperCommand,
		platform,
		arch,
		realpath: options.resolveRealpath ?? node_fs_promises.default.realpath,
		libraries: options.inspectLinkedLibraries ?? inspectLinkedLibraries
	}) : { evidence: "whisper-cli command not found" };
	const sherpaDir = env.SHERPA_ONNX_MODEL_DIR?.trim();
	const sherpaFiles = sherpaDir ? [
		"tokens.txt",
		"encoder.onnx",
		"decoder.onnx",
		"joiner.onnx"
	].map((file) => node_path.default.join(sherpaDir, file)) : [];
	const sherpaReady = Boolean(sherpaCommand) && sherpaFiles.length === 4 && (await Promise.all(sherpaFiles.map(fileExists))).every(Boolean);
	const parakeetReady = Boolean(parakeetCommand) && platform === "darwin" && arch === "arm64";
	const parakeetArgs = [
		"{{MediaPath}}",
		"--output-format",
		"txt",
		"--output-dir",
		"{{OutputDir}}",
		"--output-template",
		"{filename}"
	];
	const whisperArgs = [
		"-m",
		whisperModel,
		"-otxt",
		"-of",
		"{{OutputBase}}",
		"-nt",
		"{{MediaPath}}"
	];
	const sherpaArgs = [
		`--tokens=${sherpaFiles[0]}`,
		`--encoder=${sherpaFiles[1]}`,
		`--decoder=${sherpaFiles[2]}`,
		`--joiner=${sherpaFiles[3]}`,
		"{{MediaPath}}"
	];
	const pythonArgs = [
		"--model",
		"turbo",
		"--output_format",
		"txt",
		"--output_dir",
		"{{OutputDir}}",
		"--verbose",
		"False",
		"{{MediaPath}}"
	];
	const candidates = [
		{
			id: "parakeet-mlx",
			command: "parakeet-mlx",
			resolvedCommand: parakeetCommand ?? void 0,
			available: Boolean(parakeetCommand),
			ready: parakeetReady,
			capableBackend: parakeetReady ? "mlx" : void 0,
			evidence: parakeetReady ? "parakeet-mlx is an MLX runtime on Apple Silicon; device use is unobserved" : "parakeet-mlx acceleration is only supported on Apple Silicon",
			selected: false,
			reason: parakeetCommand ? parakeetReady ? void 0 : "unsupported platform for MLX acceleration" : "command not found",
			entry: parakeetReady ? {
				type: "cli",
				command: "parakeet-mlx",
				args: parakeetArgs
			} : void 0
		},
		{
			id: "whisper-cli",
			command: "whisper-cli",
			resolvedCommand: whisperCommand ?? void 0,
			available: Boolean(whisperCommand),
			ready: whisperReady,
			...whisperBackend,
			requestedBackend: resolveRequestedLocalAudioBackend({
				command: "whisper-cli",
				args: whisperArgs
			}),
			observedBackend: getObservedBackend({
				command: "whisper-cli",
				args: whisperArgs
			}),
			selected: false,
			reason: whisperCommand ? whisperReady ? void 0 : "model file not found" : "command not found",
			entry: whisperReady ? {
				type: "cli",
				command: "whisper-cli",
				args: whisperArgs
			} : void 0
		},
		{
			id: "sherpa-onnx-offline",
			command: "sherpa-onnx-offline",
			resolvedCommand: sherpaCommand ?? void 0,
			available: Boolean(sherpaCommand),
			ready: sherpaReady,
			requestedBackend: "cpu",
			evidence: "Operator auto args omit --provider, so sherpa-onnx uses its CPU default",
			selected: false,
			reason: sherpaCommand ? sherpaReady ? void 0 : "SHERPA_ONNX_MODEL_DIR is missing required model files" : "command not found",
			entry: sherpaReady ? {
				type: "cli",
				command: "sherpa-onnx-offline",
				args: sherpaArgs
			} : void 0
		},
		{
			id: "whisper",
			command: "whisper",
			resolvedCommand: pythonCommand ?? void 0,
			available: Boolean(pythonCommand),
			ready: Boolean(pythonCommand),
			evidence: "Python Whisper chooses its runtime device when the model loads",
			selected: false,
			reason: pythonCommand ? void 0 : "command not found",
			entry: pythonCommand ? {
				type: "cli",
				command: "whisper",
				args: pythonArgs
			} : void 0
		}
	];
	candidates.sort((left, right) => rank(left) - rank(right));
	const selected = candidates.find((candidate) => candidate.ready && candidate.entry);
	if (selected) selected.selected = true;
	return {
		candidates,
		entries: candidates.flatMap((candidate) => candidate.ready && candidate.entry ? [candidate.entry] : []),
		selected
	};
}
function formatLocalAudioSelection(selection) {
	const selected = selection.selected;
	if (!selected) return null;
	const describeBackend = (candidate) => [
		candidate.capableBackend ? `capable=${candidate.capableBackend}` : null,
		candidate.requestedBackend ? `requested=${candidate.requestedBackend}` : null,
		`observed=${candidate.observedBackend ?? "unknown"}`
	].filter(Boolean).join(", ");
	const fallbacks = selection.candidates.filter((candidate) => candidate.ready && candidate !== selected).map((candidate) => `${candidate.command} (${describeBackend(candidate)})`);
	return `${selected.command} (${describeBackend(selected)}); ${selected.evidence}${fallbacks.length > 0 ? `; fallbacks: ${fallbacks.join(", ")}` : ""}`;
}
//#endregion
Object.defineProperty(exports, "clearLocalAudioInspectionCacheForTests", {
	enumerable: true,
	get: function() {
		return clearLocalAudioInspectionCacheForTests;
	}
});
Object.defineProperty(exports, "formatLocalAudioSelection", {
	enumerable: true,
	get: function() {
		return formatLocalAudioSelection;
	}
});
Object.defineProperty(exports, "inspectLocalAudioSelection", {
	enumerable: true,
	get: function() {
		return inspectLocalAudioSelection;
	}
});
Object.defineProperty(exports, "recordLocalAudioBackendObservation", {
	enumerable: true,
	get: function() {
		return recordLocalAudioBackendObservation;
	}
});
Object.defineProperty(exports, "resolveRequestedLocalAudioBackend", {
	enumerable: true,
	get: function() {
		return resolveRequestedLocalAudioBackend;
	}
});
