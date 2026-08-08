const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
//#region src/infra/safe-package-install.ts
/**
* Creates a project-local npm install environment for untrusted package dirs.
* It disables lifecycle scripts, global/workspace leakage, prompts, and noisy
* npm features while preserving caller-supplied process env values.
*/
function createSafeNpmInstallEnv(env, options = {}) {
	const nextEnv = {
		...require_install_source_utils.createNpmProjectInstallEnv(env, options),
		COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
		NPM_CONFIG_IGNORE_SCRIPTS: "true",
		npm_config_audit: "false",
		npm_config_fund: "false",
		npm_config_ignore_scripts: "true",
		npm_config_legacy_peer_deps: options.legacyPeerDeps ? "true" : "false",
		npm_config_package_lock: options.packageLock === true ? "true" : "false",
		npm_config_strict_peer_deps: "false",
		...options.packageLock === true ? { npm_config_save: "true" } : {},
		...options.ignoreWorkspaces ? { npm_config_workspaces: "false" } : {}
	};
	if (options.quiet) Object.assign(nextEnv, {
		npm_config_loglevel: "error",
		npm_config_progress: "false",
		npm_config_yes: "true"
	});
	return nextEnv;
}
/**
* Builds npm install argv that mirrors the safe environment defaults.
* Callers opt into dependency omission, legacy peer resolution, and quiet flags.
*/
function createSafeNpmInstallArgs(options = {}) {
	return [
		"install",
		...options.omitDev ? ["--omit=dev"] : [],
		...options.omitPeer ? ["--omit=peer"] : [],
		...options.legacyPeerDeps ? ["--legacy-peer-deps"] : [],
		...options.loglevel ? [`--loglevel=${options.loglevel}`] : [],
		"--ignore-scripts",
		...options.ignoreWorkspaces ? ["--workspaces=false"] : [],
		...options.noAudit ? ["--no-audit"] : [],
		...options.noFund ? ["--no-fund"] : []
	];
}
//#endregion
Object.defineProperty(exports, "createSafeNpmInstallArgs", {
	enumerable: true,
	get: function() {
		return createSafeNpmInstallArgs;
	}
});
Object.defineProperty(exports, "createSafeNpmInstallEnv", {
	enumerable: true,
	get: function() {
		return createSafeNpmInstallEnv;
	}
});
