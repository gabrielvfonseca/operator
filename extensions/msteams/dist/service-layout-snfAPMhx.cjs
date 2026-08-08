const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_package_json = require("./package-json-B6KtcVRf.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/daemon/service-layout.ts
/** Summarizes installed service command paths and Operator package layout. */
function shellQuoteArg(value) {
	if (/^[A-Za-z0-9_./:@%+=,-]+$/u.test(value)) return value;
	return `'${value.replaceAll("'", "'\\''")}'`;
}
function formatExecStart(programArguments) {
	return programArguments.map(shellQuoteArg).join(" ");
}
function resolveSystemdScopeFromServicePath(sourcePath) {
	const normalized = sourcePath?.replaceAll("\\", "/") ?? "";
	if (!normalized.endsWith(".service")) return;
	if (normalized.startsWith("/etc/systemd/") || normalized.startsWith("/usr/lib/systemd/") || normalized.startsWith("/lib/systemd/")) return "system";
	return "user";
}
function resolveGatewayServiceEntrypoint(command) {
	const gatewayIndex = command.programArguments.indexOf("gateway");
	if (gatewayIndex <= 0) return;
	const entrypoint = command.programArguments[gatewayIndex - 1];
	if (!entrypoint) return;
	if (node_path.default.isAbsolute(entrypoint) || node_path.default.win32.isAbsolute(entrypoint)) return entrypoint;
	const workingDirectory = command.workingDirectory?.trim();
	if (!workingDirectory) return;
	if (node_path.default.isAbsolute(workingDirectory)) return node_path.default.resolve(workingDirectory, entrypoint);
	if (node_path.default.win32.isAbsolute(workingDirectory)) return node_path.default.win32.resolve(workingDirectory, entrypoint);
}
async function tryRealpath(value) {
	if (!value) return;
	const resolved = node_path.default.resolve(value);
	try {
		return await node_fs_promises.default.realpath(resolved);
	} catch {
		return resolved;
	}
}
async function isSourceCheckoutRoot(candidate) {
	if (!(await (0, _openclaw_fs_safe_advanced.pathExists)(node_path.default.join(candidate, ".git")) || await (0, _openclaw_fs_safe_advanced.pathExists)(node_path.default.join(candidate, "pnpm-workspace.yaml")))) return false;
	return await (0, _openclaw_fs_safe_advanced.pathExists)(node_path.default.join(candidate, "src")) && await (0, _openclaw_fs_safe_advanced.pathExists)(node_path.default.join(candidate, "extensions"));
}
async function resolveOperatorPackageRoot(entrypoint) {
	let current = node_path.default.dirname(node_path.default.resolve(entrypoint));
	for (let depth = 0; depth < 8; depth += 1) {
		if (await (0, _openclaw_fs_safe_advanced.pathExists)(node_path.default.join(current, "package.json"))) {
			if (await require_package_json.readPackageName(current) === "@gabrielvfonseca/operator") return current;
		}
		const next = node_path.default.dirname(current);
		if (next === current) return;
		current = next;
	}
}
async function summarizeGatewayServiceLayout(command) {
	if (!command) return;
	const sourcePath = command.sourcePath?.trim() || void 0;
	const entrypoint = resolveGatewayServiceEntrypoint(command);
	const [sourcePathReal, entrypointReal] = await Promise.all([tryRealpath(sourcePath), tryRealpath(entrypoint)]);
	const packageRoot = entrypointReal ? await resolveOperatorPackageRoot(entrypointReal) : void 0;
	const packageRootReal = await tryRealpath(packageRoot);
	const packageVersion = packageRoot ? await require_package_json.readPackageVersion(packageRoot) ?? void 0 : void 0;
	const entrypointSourceCheckout = packageRootReal ? await isSourceCheckoutRoot(packageRootReal) : void 0;
	return {
		execStart: formatExecStart(command.programArguments),
		...sourcePath ? { sourcePath } : {},
		...sourcePathReal ? { sourcePathReal } : {},
		...sourcePath ? { sourceScope: resolveSystemdScopeFromServicePath(sourcePath) } : {},
		...entrypoint ? { entrypoint } : {},
		...entrypointReal ? { entrypointReal } : {},
		...packageRoot ? { packageRoot } : {},
		...packageRootReal ? { packageRootReal } : {},
		...packageVersion ? { packageVersion } : {},
		...entrypointSourceCheckout !== void 0 ? { entrypointSourceCheckout } : {}
	};
}
//#endregion
Object.defineProperty(exports, "summarizeGatewayServiceLayout", {
	enumerable: true,
	get: function() {
		return summarizeGatewayServiceLayout;
	}
});
