//#region src/plugins/install-security-scan.ts
/** Lazily loads install scanning so normal plugin startup avoids policy/runtime imports. */
async function loadInstallSecurityScanRuntime() {
	return await Promise.resolve().then(() => require("./install-security-scan.runtime-baHPoeks.cjs"));
}
/** Scans an unpacked bundle source before plugin install/update. */
async function scanBundleInstallSource(params) {
	const { scanBundleInstallSourceRuntime } = await loadInstallSecurityScanRuntime();
	return await scanBundleInstallSourceRuntime(params);
}
/** Scans a package source directory and executable metadata before install/update. */
async function scanPackageInstallSource(params) {
	const { scanPackageInstallSourceRuntime } = await loadInstallSecurityScanRuntime();
	return await scanPackageInstallSourceRuntime(params);
}
/** Scans the installed package dependency tree after npm resolution. */
async function scanInstalledPackageDependencyTree(params) {
	const { scanInstalledPackageDependencyTreeRuntime } = await loadInstallSecurityScanRuntime();
	return await scanInstalledPackageDependencyTreeRuntime(params);
}
/**
* Retained for install.runtime compatibility with pre-v2026.6.5 lazy install chunks.
* Remove only with the matching runtime-postbuild legacy alias cleanup.
*/
async function scanFileInstallSource(params) {
	const { scanFileInstallSourceRuntime } = await loadInstallSecurityScanRuntime();
	return await scanFileInstallSourceRuntime(params);
}
/** Runs npm install policy checks before package install side effects. */
async function preflightPluginNpmInstallPolicy(params) {
	const { preflightPluginNpmInstallPolicyRuntime } = await loadInstallSecurityScanRuntime();
	return await preflightPluginNpmInstallPolicyRuntime(params);
}
/** Runs git install policy checks before plugin install side effects. */
async function preflightPluginGitInstallPolicy(params) {
	const { preflightPluginGitInstallPolicyRuntime } = await loadInstallSecurityScanRuntime();
	return await preflightPluginGitInstallPolicyRuntime(params);
}
/** Evaluates shared install policy for skill-managed dependency installs. */
async function evaluateSkillInstallPolicy(params) {
	const { evaluateSkillInstallPolicyRuntime } = await loadInstallSecurityScanRuntime();
	return await evaluateSkillInstallPolicyRuntime(params);
}
//#endregion
Object.defineProperty(exports, "evaluateSkillInstallPolicy", {
	enumerable: true,
	get: function() {
		return evaluateSkillInstallPolicy;
	}
});
Object.defineProperty(exports, "preflightPluginGitInstallPolicy", {
	enumerable: true,
	get: function() {
		return preflightPluginGitInstallPolicy;
	}
});
Object.defineProperty(exports, "preflightPluginNpmInstallPolicy", {
	enumerable: true,
	get: function() {
		return preflightPluginNpmInstallPolicy;
	}
});
Object.defineProperty(exports, "scanBundleInstallSource", {
	enumerable: true,
	get: function() {
		return scanBundleInstallSource;
	}
});
Object.defineProperty(exports, "scanFileInstallSource", {
	enumerable: true,
	get: function() {
		return scanFileInstallSource;
	}
});
Object.defineProperty(exports, "scanInstalledPackageDependencyTree", {
	enumerable: true,
	get: function() {
		return scanInstalledPackageDependencyTree;
	}
});
Object.defineProperty(exports, "scanPackageInstallSource", {
	enumerable: true,
	get: function() {
		return scanPackageInstallSource;
	}
});
