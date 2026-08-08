const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
require("./install-safe-path-delEgqLr.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_npm_integrity = require("./npm-integrity-D0RjjSoX.cjs");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/infra/npm-pack-install.ts
/**
* Adapts installers with additional domain params to the shared npm-pack flow.
* The archive path stays owned by this module so callers cannot install a stale
* or caller-supplied tarball while reusing the npm resolution checks.
*/
async function installFromNpmSpecArchiveWithInstaller(params) {
	return await installFromNpmSpecArchive({
		tempDirPrefix: params.tempDirPrefix,
		spec: params.spec,
		timeoutMs: params.timeoutMs,
		expectedIntegrity: params.expectedIntegrity,
		onIntegrityDrift: params.onIntegrityDrift,
		warn: params.warn,
		installFromArchive: async ({ archivePath }) => await params.installFromArchive({
			archivePath,
			...params.archiveInstallParams
		})
	});
}
function isSuccessfulInstallResult(result) {
	return result.ok;
}
/**
* Collapses the shared flow result back into the installer's result union while
* preserving npm metadata only for a successful install.
*/
function finalizeNpmSpecArchiveInstall(flowResult) {
	if (!flowResult.ok) return flowResult;
	const installResult = flowResult.installResult;
	if (!isSuccessfulInstallResult(installResult)) return installResult;
	return {
		...installResult,
		npmResolution: flowResult.npmResolution,
		...flowResult.integrityDrift ? { integrityDrift: flowResult.integrityDrift } : {}
	};
}
/**
* Packs a validated registry npm spec into a temporary tarball, verifies the
* resolved package metadata, then delegates archive extraction to the caller.
*/
async function installFromNpmSpecArchive(params) {
	return await require_install_source_utils.withTempDir(params.tempDirPrefix, async (tmpDir) => {
		const parsedSpec = require_npm_registry_spec.parseRegistryNpmSpec(params.spec);
		if (!parsedSpec) return {
			ok: false,
			error: "unsupported npm spec"
		};
		const packedResult = await require_install_source_utils.packNpmSpecToArchive({
			spec: params.spec,
			timeoutMs: params.timeoutMs,
			cwd: tmpDir
		});
		if (!packedResult.ok) return packedResult;
		const npmResolution = {
			...packedResult.metadata,
			resolvedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		if (npmResolution.version && !require_npm_registry_spec.isPrereleaseResolutionAllowed({
			spec: parsedSpec,
			resolvedVersion: npmResolution.version
		})) return {
			ok: false,
			error: require_npm_registry_spec.formatPrereleaseResolutionError({
				spec: parsedSpec,
				resolvedVersion: npmResolution.version
			})
		};
		const driftResult = await require_npm_integrity.resolveNpmIntegrityDriftWithDefaultMessage({
			spec: params.spec,
			expectedIntegrity: params.expectedIntegrity,
			resolution: npmResolution,
			onIntegrityDrift: params.onIntegrityDrift,
			warn: params.warn
		});
		if (driftResult.error) return {
			ok: false,
			error: driftResult.error
		};
		return {
			ok: true,
			installResult: await params.installFromArchive({ archivePath: packedResult.archivePath }),
			npmResolution,
			integrityDrift: driftResult.integrityDrift
		};
	});
}
//#endregion
//#region src/infra/install-mode-options.ts
/** Resolves shared install/update mode options with a required logger fallback. */
function resolveInstallModeOptions(params, defaultLogger) {
	return {
		logger: params.logger ?? defaultLogger,
		mode: params.mode ?? "install",
		dryRun: params.dryRun ?? false
	};
}
/** Resolves install/update mode options plus an operation timeout default. */
function resolveTimedInstallModeOptions(params, defaultLogger, defaultTimeoutMs = 12e4) {
	return {
		...resolveInstallModeOptions(params, defaultLogger),
		timeoutMs: params.timeoutMs ?? defaultTimeoutMs
	};
}
//#endregion
//#region src/infra/install-target.ts
/** Resolves and verifies an install target directory under a canonical base directory. */
async function resolveCanonicalInstallTarget(params) {
	await node_fs_promises.default.mkdir(params.baseDir, { recursive: true });
	const targetDirResult = (0, _openclaw_fs_safe_advanced.resolveSafeInstallDir)({
		baseDir: params.baseDir,
		id: params.id,
		invalidNameMessage: params.invalidNameMessage,
		nameEncoder: params.nameEncoder
	});
	if (!targetDirResult.ok) return {
		ok: false,
		error: targetDirResult.error
	};
	try {
		await (0, _openclaw_fs_safe_advanced.assertCanonicalPathWithinBase)({
			baseDir: params.baseDir,
			candidatePath: targetDirResult.path,
			boundaryLabel: params.boundaryLabel
		});
	} catch (err) {
		return {
			ok: false,
			error: require_errors.formatErrorMessage(err)
		};
	}
	return {
		ok: true,
		targetDir: targetDirResult.path
	};
}
/** Ensures install mode does not overwrite an existing target; update mode may reuse it. */
async function ensureInstallTargetAvailable(params) {
	if (params.mode === "install" && await (0, _openclaw_fs_safe_advanced.pathExists)(params.targetDir)) return {
		ok: false,
		error: params.alreadyExistsError
	};
	return { ok: true };
}
//#endregion
Object.defineProperty(exports, "ensureInstallTargetAvailable", {
	enumerable: true,
	get: function() {
		return ensureInstallTargetAvailable;
	}
});
Object.defineProperty(exports, "finalizeNpmSpecArchiveInstall", {
	enumerable: true,
	get: function() {
		return finalizeNpmSpecArchiveInstall;
	}
});
Object.defineProperty(exports, "installFromNpmSpecArchiveWithInstaller", {
	enumerable: true,
	get: function() {
		return installFromNpmSpecArchiveWithInstaller;
	}
});
Object.defineProperty(exports, "resolveCanonicalInstallTarget", {
	enumerable: true,
	get: function() {
		return resolveCanonicalInstallTarget;
	}
});
Object.defineProperty(exports, "resolveInstallModeOptions", {
	enumerable: true,
	get: function() {
		return resolveInstallModeOptions;
	}
});
Object.defineProperty(exports, "resolveTimedInstallModeOptions", {
	enumerable: true,
	get: function() {
		return resolveTimedInstallModeOptions;
	}
});
