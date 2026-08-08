const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_gateway_entrypoint = require("./gateway-entrypoint-BSWI2mN9.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_child_process = require("node:child_process");
//#region src/daemon/program-args.ts
/** Builds runtime command arguments for gateway and node service installs. */
const OPERATOR_WRAPPER_ENV_KEY = "OPERATOR_WRAPPER";
async function resolveCliEntrypointPathForService() {
	const argv1 = process.argv[1];
	if (!argv1) throw new Error("Unable to resolve CLI entrypoint path");
	const normalized = node_path.default.resolve(argv1);
	const resolvedPath = await resolveRealpathSafe(normalized);
	if (require_gateway_entrypoint.isGatewayDistEntrypointPath(resolvedPath)) {
		const preferredDistEntrypoint = await require_gateway_entrypoint.findFirstAccessibleGatewayEntrypoint(require_gateway_entrypoint.buildGatewayDistEntrypointCandidates(normalized, resolvedPath), async (candidate) => {
			try {
				await node_fs_promises.default.access(candidate);
				return true;
			} catch {
				return false;
			}
		});
		if (preferredDistEntrypoint) return preferredDistEntrypoint;
		if (require_gateway_entrypoint.isGatewayDistEntrypointPath(normalized) && normalized !== resolvedPath) try {
			await node_fs_promises.default.access(normalized);
			return normalized;
		} catch {}
		return resolvedPath;
	}
	const distCandidates = buildDistCandidates(resolvedPath, normalized);
	for (const candidate of distCandidates) try {
		await node_fs_promises.default.access(candidate);
		return candidate;
	} catch {}
	throw new Error(`Cannot find built CLI at ${distCandidates.join(" or ")}. Run "pnpm build" first, or use dev mode.`);
}
async function resolveRealpathSafe(inputPath) {
	try {
		return await node_fs_promises.default.realpath(inputPath);
	} catch {
		return inputPath;
	}
}
function buildDistCandidates(...inputs) {
	const candidates = [];
	const seen = /* @__PURE__ */ new Set();
	for (const inputPath of inputs) {
		if (!inputPath) continue;
		const baseDir = node_path.default.dirname(inputPath);
		appendDistCandidates(candidates, seen, node_path.default.resolve(baseDir, ".."));
		appendDistCandidates(candidates, seen, baseDir);
		appendNodeModulesBinCandidates(candidates, seen, inputPath);
	}
	return candidates;
}
function appendDistCandidates(candidates, seen, baseDir) {
	const distDir = node_path.default.resolve(baseDir, "dist");
	const distEntries = [
		node_path.default.join(distDir, "index.js"),
		node_path.default.join(distDir, "index.mjs"),
		node_path.default.join(distDir, "entry.js"),
		node_path.default.join(distDir, "entry.mjs")
	];
	for (const entry of distEntries) {
		if (seen.has(entry)) continue;
		seen.add(entry);
		candidates.push(entry);
	}
}
function appendNodeModulesBinCandidates(candidates, seen, inputPath) {
	const parts = inputPath.split(node_path.default.sep);
	const binIndex = parts.lastIndexOf(".bin");
	if (binIndex <= 0) return;
	if (parts[binIndex - 1] !== "node_modules") return;
	const binName = node_path.default.basename(inputPath);
	const nodeModulesDir = parts.slice(0, binIndex).join(node_path.default.sep);
	appendDistCandidates(candidates, seen, node_path.default.join(nodeModulesDir, binName));
}
function resolveRepoRootForDev() {
	const argv1 = process.argv[1];
	if (!argv1) throw new Error("Unable to resolve repo root");
	const parts = node_path.default.resolve(argv1).split(node_path.default.sep);
	const srcIndex = parts.lastIndexOf("src");
	if (srcIndex === -1) throw new Error("Dev mode requires running from repo (src/entry.ts)");
	return parts.slice(0, srcIndex).join(node_path.default.sep);
}
async function resolveNodePath() {
	return await resolveBinaryPath("node");
}
async function resolveBinaryPath(binary) {
	const cmd = process.platform === "win32" ? require_windows_install_roots.getWindowsSystem32ExePath("where.exe") : "which";
	try {
		const resolved = (0, node_child_process.execFileSync)(cmd, [binary], { encoding: "utf8" }).trim().split(/\r?\n/)[0]?.trim();
		if (!resolved) throw new Error("empty");
		await node_fs_promises.default.access(resolved);
		return resolved;
	} catch {
		throw new Error("Node not found in PATH. Install Node 24.15+ (recommended) or Node 22 LTS (22.22.3+).");
	}
}
async function resolveOperatorWrapperPath(inputPath) {
	const trimmed = inputPath?.trim();
	if (!trimmed) return;
	const resolved = node_path.default.resolve(trimmed);
	try {
		if (!(await node_fs_promises.default.stat(resolved)).isFile()) throw new Error("not a regular file");
		await node_fs_promises.default.access(resolved, node_fs.constants.X_OK);
	} catch (error) {
		const detail = error instanceof Error ? ` (${error.message})` : "";
		throw new Error(`${OPERATOR_WRAPPER_ENV_KEY} must point to an executable file: ${resolved}${detail}`, { cause: error });
	}
	return resolved;
}
async function resolveCliProgramArguments(params) {
	const wrapperPath = await resolveOperatorWrapperPath(params.wrapperPath);
	if (wrapperPath) return { programArguments: [wrapperPath, ...params.args] };
	const execPath = process.execPath;
	const nodePath = params.nodePath ?? (require_redact.isNodeRuntime(execPath) ? execPath : await resolveNodePath());
	if (params.dev) {
		const repoRoot = resolveRepoRootForDev();
		const devCliPath = node_path.default.join(repoRoot, "src", "entry.ts");
		await node_fs_promises.default.access(devCliPath);
		return {
			programArguments: [
				nodePath,
				"--import",
				"tsx",
				devCliPath,
				...params.args
			],
			workingDirectory: repoRoot
		};
	}
	return { programArguments: [
		nodePath,
		await resolveCliEntrypointPathForService(),
		...params.args
	] };
}
async function resolveGatewayProgramArguments(params) {
	return resolveCliProgramArguments({
		args: [
			"gateway",
			"--port",
			String(params.port)
		],
		dev: params.dev,
		runtime: params.runtime,
		nodePath: params.nodePath,
		wrapperPath: params.wrapperPath
	});
}
//#endregion
Object.defineProperty(exports, "OPERATOR_WRAPPER_ENV_KEY", {
	enumerable: true,
	get: function() {
		return OPERATOR_WRAPPER_ENV_KEY;
	}
});
Object.defineProperty(exports, "resolveGatewayProgramArguments", {
	enumerable: true,
	get: function() {
		return resolveGatewayProgramArguments;
	}
});
Object.defineProperty(exports, "resolveOperatorWrapperPath", {
	enumerable: true,
	get: function() {
		return resolveOperatorWrapperPath;
	}
});
