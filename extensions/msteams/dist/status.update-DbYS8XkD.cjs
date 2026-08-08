const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
const require_update_check = require("./update-check-yvbRd7TR.cjs");
//#region src/commands/status.update.ts
var status_update_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	formatUpdateAvailableHint: () => formatUpdateAvailableHint,
	formatUpdateOneLiner: () => formatUpdateOneLiner,
	getUpdateCheckResult: () => getUpdateCheckResult,
	resolveUpdateAvailability: () => resolveUpdateAvailability
});
/** Runs the update check using the configured update channel and current install root. */
async function getUpdateCheckResult(params) {
	const configChannel = require_update_channels.normalizeUpdateChannel(params.updateConfigChannel);
	return await require_update_check.checkUpdateStatus({
		root: await require_openclaw_root.resolveOperatorPackageRoot({
			moduleUrl: require("url").pathToFileURL(__filename).href,
			argv1: process.argv[1],
			cwd: process.cwd()
		}),
		timeoutMs: params.timeoutMs,
		fetchGit: params.fetchGit,
		includeRegistry: params.includeRegistry,
		registryChannel: require_update_channels.resolveRegistryUpdateChannel({
			configChannel,
			currentVersion: require_version.VERSION
		})
	});
}
/** Determines whether git and/or registry data indicate an available update. */
function resolveUpdateAvailability(update) {
	const latestVersion = update.registry?.latestVersion ?? null;
	const registryCmp = latestVersion ? require_update_check.compareSemverStrings(require_version.VERSION, latestVersion) : null;
	const hasRegistryUpdate = registryCmp != null && registryCmp < 0;
	const gitBehind = update.installKind === "git" && typeof update.git?.behind === "number" ? update.git.behind : null;
	const hasGitUpdate = gitBehind != null && gitBehind > 0;
	return {
		available: hasGitUpdate || hasRegistryUpdate,
		hasGitUpdate,
		hasRegistryUpdate,
		latestVersion: hasRegistryUpdate ? latestVersion : null,
		gitBehind
	};
}
/** Formats the actionable update hint shown in status footers. */
function formatUpdateAvailableHint(update) {
	const availability = resolveUpdateAvailability(update);
	if (!availability.available) return null;
	const details = [];
	if (availability.hasGitUpdate && availability.gitBehind != null) details.push(`git behind ${availability.gitBehind}`);
	if (availability.hasRegistryUpdate && availability.latestVersion) details.push(`npm ${availability.latestVersion}`);
	return `Update available${details.length > 0 ? ` (${details.join(" · ")})` : ""}. Run: ${require_command_format.formatCliCommand("openclaw update")}`;
}
/** Formats a compact one-line update summary for overview rows. */
function formatUpdateOneLiner(update) {
	const parts = [];
	const appendRegistryUpdateSummary = () => {
		const registryLabel = update.registry?.tag && update.registry.tag !== "latest" ? `npm ${update.registry.tag}` : "npm latest";
		if (update.registry?.latestVersion) {
			const cmp = require_update_check.compareSemverStrings(require_version.VERSION, update.registry.latestVersion);
			if (cmp === 0) {
				if (update.installKind !== "git") parts.push("up to date");
				parts.push(`${registryLabel} ${update.registry.latestVersion}`);
			} else if (cmp != null && cmp < 0) parts.push(update.registry.tag && update.registry.tag !== "latest" ? `${registryLabel} update ${update.registry.latestVersion}` : `npm update ${update.registry.latestVersion}`);
			else parts.push(update.registry.tag === "extended-stable" ? `ahead of extended-stable (${update.registry.latestVersion})` : `${registryLabel} ${update.registry.latestVersion} (local newer)`);
			return;
		}
		if (update.registry?.error) {
			if (update.registry.reason === "unsupported_git_channel") {
				parts.push("extended-stable requires a package install");
				return;
			}
			if (update.registry.reason === "selector_missing") {
				parts.push("npm extended-stable selector missing");
				return;
			}
			if (update.registry.reason === "selector_query_failed") {
				parts.push("npm extended-stable query failed");
				return;
			}
			if (update.registry.reason === "exact_package_mismatch") {
				parts.push("npm extended-stable exact package verification failed");
				return;
			}
			parts.push(`${registryLabel} unknown`);
		}
	};
	if (update.installKind === "git" && update.git) {
		const branch = update.git.branch ? `git ${update.git.branch}` : "git";
		parts.push(branch);
		if (update.git.upstream) parts.push(`↔ ${update.git.upstream}`);
		if (update.git.dirty === true) parts.push("dirty");
		if (update.git.behind != null && update.git.ahead != null) {
			if (update.git.behind === 0 && update.git.ahead === 0) parts.push("up to date");
			else if (update.git.behind > 0 && update.git.ahead === 0) parts.push(`behind ${update.git.behind}`);
			else if (update.git.behind === 0 && update.git.ahead > 0) parts.push(`ahead ${update.git.ahead}`);
			else if (update.git.behind > 0 && update.git.ahead > 0) parts.push(`diverged (ahead ${update.git.ahead}, behind ${update.git.behind})`);
		}
		if (update.git.fetchOk === false) parts.push("fetch failed");
		appendRegistryUpdateSummary();
	} else {
		parts.push(update.packageManager !== "unknown" ? update.packageManager : "pkg");
		appendRegistryUpdateSummary();
	}
	if (update.deps) {
		if (update.deps.status === "ok") parts.push("deps ok");
		if (update.deps.status === "missing") parts.push("deps missing");
		if (update.deps.status === "stale") parts.push("deps stale");
	}
	return `Update: ${parts.join(" · ")}`;
}
//#endregion
Object.defineProperty(exports, "formatUpdateAvailableHint", {
	enumerable: true,
	get: function() {
		return formatUpdateAvailableHint;
	}
});
Object.defineProperty(exports, "formatUpdateOneLiner", {
	enumerable: true,
	get: function() {
		return formatUpdateOneLiner;
	}
});
Object.defineProperty(exports, "resolveUpdateAvailability", {
	enumerable: true,
	get: function() {
		return resolveUpdateAvailability;
	}
});
Object.defineProperty(exports, "status_update_exports", {
	enumerable: true,
	get: function() {
		return status_update_exports;
	}
});
