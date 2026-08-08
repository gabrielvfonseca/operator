const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/bash-tools.descriptions.ts
/**
* Tool descriptions for bash exec and process-control tools.
* Descriptions include platform-specific guidance and approved executable
* hints that are safe to show to the model.
*/
/**
* Show the exact approved token in hints. Absolute paths stay absolute so the
* hint cannot imply an equivalent PATH lookup that resolves to a different binary.
*/
function deriveExecShortName(fullPath) {
	if (node_path.default.isAbsolute(fullPath)) return fullPath;
	const base = node_path.default.basename(fullPath);
	return base.replace(/\.exe$/i, "") || base;
}
/** Builds the model-facing exec tool description for the current platform/config. */
function describeExecTool(params) {
	const base = [
		"Run shell now; background continuation supported.",
		"Use yieldMs/background, then process for logs/status/input/intervention.",
		"Long run: automatic completion wake when enabled and output/failure occurs; otherwise process confirms completion.",
		params?.hasCronTool ? "No sleep/delay loops for reminders/follow-ups; use cron." : void 0,
		"TTY CLI/UI/coding agent: pty=true."
	].filter(Boolean).join(" ");
	if (process.platform !== "win32") return base;
	const lines = [base];
	lines.push("IMPORTANT (Windows): Run executables directly; do NOT wrap commands in `cmd /c`, `powershell -Command`, `& ` prefix, or WSL. Use backslash paths (C:\\path), not forward slashes. Use short executable names (e.g. `node`, `python3`) instead of full paths.");
	try {
		const allowlist = require_exec_approvals.resolveExecApprovalsFromFile({
			file: require_exec_approvals.loadExecApprovals(),
			agentId: params?.agentId
		}).allowlist.filter((entry) => {
			const pattern = entry.pattern?.trim() ?? "";
			return pattern.length > 0 && pattern !== "*" && !pattern.startsWith("=command:") && (pattern.includes("/") || pattern.includes("\\") || pattern.includes("~"));
		});
		if (allowlist.length > 0) {
			lines.push("Pre-approved executables (exact arguments are enforced at runtime; no approval prompt needed when args match):");
			for (const entry of allowlist.slice(0, 10)) {
				const shortName = deriveExecShortName(entry.pattern);
				const argNote = entry.argPattern ? "(restricted args)" : "(any arguments)";
				lines.push(`  ${shortName} ${argNote}`);
			}
		}
	} catch {}
	return lines.join("\n");
}
/** Builds the model-facing process-control tool description. */
function describeProcessTool(params) {
	return [
		"Control existing exec: list, poll, log, write, send-keys, submit, paste, kill.",
		"poll/log: status, output, quiet success, completion without auto-wake, input hints. Others: input/intervention.",
		params?.hasCronTool ? "No polling as timer/reminder; scheduled follow-up uses cron." : void 0
	].filter(Boolean).join(" ");
}
//#endregion
Object.defineProperty(exports, "describeExecTool", {
	enumerable: true,
	get: function() {
		return describeExecTool;
	}
});
Object.defineProperty(exports, "describeProcessTool", {
	enumerable: true,
	get: function() {
		return describeProcessTool;
	}
});
