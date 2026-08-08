require("./rolldown-runtime-u92d-OFm.cjs");
let node_child_process = require("node:child_process");
//#region src/commands/doctor-session-sqlite-github-issue.ts
/** Creates GitHub issues for sanitized session SQLite recovery reports. */
/** Creates an operator/operator issue through the GitHub CLI using sanitized stdin. */
function createSessionSqliteGithubIssue(issue, spawnGh = defaultSpawnGh) {
	const result = spawnGh([
		"issue",
		"create",
		"--repo",
		"operator/operator",
		"--title",
		issue.title,
		"--body-file",
		"-"
	], { input: issue.body });
	if (!result.error && result.status === 0) {
		const url = String(result.stdout).trim().split(/\r?\n/).at(-1);
		return {
			ok: true,
			url: url && url.length > 0 ? url : "https://github.com/operator/operator/issues"
		};
	}
	const stderr = String(result.stderr).trim();
	const error = result.error ? result.error.message : stderr || `gh exited ${result.status ?? "unknown"}`;
	return {
		fallbackUrl: issue.url,
		message: error,
		ok: false
	};
}
function defaultSpawnGh(args, options) {
	return (0, node_child_process.spawnSync)("gh", [...args], {
		encoding: "buffer",
		input: options.input,
		maxBuffer: 1024 * 1024
	});
}
//#endregion
exports.createSessionSqliteGithubIssue = createSessionSqliteGithubIssue;
