const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_json_files = require("./json-files-Bp0Z4DKb.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor-heartbeat-template-repair.ts
/** Doctor repair for HEARTBEAT.md files that accidentally contain docs template wrappers. */
const HEARTBEAT_TEMPLATE_CHECK_ID = "core/doctor/heartbeat-template";
const LEGACY_HEARTBEAT_PROSE_TEMPLATE = ["# HEARTBEAT.md", "Keep this file empty unless you want a tiny checklist. Keep it small."];
const LEGACY_HEARTBEAT_HEADING_FENCED_TEMPLATE = [
	"# HEARTBEAT.md Template",
	"```markdown",
	"# Keep this file empty (or with only comments) to skip heartbeat API calls.",
	"# Add tasks below when you want the agent to check something periodically.",
	"```"
];
const LEGACY_HEARTBEAT_FENCED_TEMPLATE = [
	"```markdown",
	"# Keep this file empty (or with only comments) to skip heartbeat API calls.",
	"# Add tasks below when you want the agent to check something periodically.",
	"```"
];
const LEGACY_HEARTBEAT_FENCED_RELATED_TEMPLATE = [
	"```markdown",
	"# Keep this file empty (or with only comments) to skip heartbeat API calls.",
	"# Add tasks below when you want the agent to check something periodically.",
	"```",
	"## Related",
	"- [Heartbeat config](/gateway/config-agents)"
];
const DOCS_HEARTBEAT_TEMPLATE_PAGE_AS_TEMPLATE = [
	"# HEARTBEAT.md template",
	"`HEARTBEAT.md` lives in the agent workspace. Keep the file empty, or with only Markdown comments and headings, when you want Operator to skip heartbeat model calls.",
	"The default runtime template is:",
	"```markdown",
	"# Keep this file empty (or with only comments) to skip heartbeat API calls.",
	"# Add tasks below when you want the agent to check something periodically.",
	"```",
	"Add short tasks below the comments only when you want the agent to check something periodically. Keep heartbeat instructions small because they are read during recurring wakes.",
	"## Related",
	"- [Heartbeat config](/gateway/config-agents)"
];
const HEARTBEAT_DEFAULT_BODY_LINES = ["# Keep this file empty (or with only comments) to skip heartbeat API calls.", "# Add tasks below when you want the agent to check something periodically."];
const DIRTY_HEARTBEAT_DOC_WRAPPER_LINES = /* @__PURE__ */ new Set([
	"```markdown",
	"# HEARTBEAT.md Template",
	"# HEARTBEAT.md template",
	"- [Heartbeat config](/gateway/config-agents)"
]);
const KNOWN_DIRTY_HEARTBEAT_TEMPLATE_LINES = /* @__PURE__ */ new Set([
	"```markdown",
	"```",
	"# HEARTBEAT.md Template",
	"# HEARTBEAT.md template",
	"`HEARTBEAT.md` lives in the agent workspace. Keep the file empty, or with only Markdown comments and headings, when you want Operator to skip heartbeat model calls.",
	"The default runtime template is:",
	"Add short tasks below the comments only when you want the agent to check something periodically. Keep heartbeat instructions small because they are read during recurring wakes.",
	...LEGACY_HEARTBEAT_PROSE_TEMPLATE,
	"# Keep this file empty (or with only comments) to skip heartbeat API calls.",
	"# Add tasks below when you want the agent to check something periodically.",
	"## Related",
	"- [Heartbeat config](/gateway/config-agents)"
]);
const KNOWN_REPAIRABLE_DIRTY_HEARTBEAT_TEMPLATES = [
	LEGACY_HEARTBEAT_PROSE_TEMPLATE,
	LEGACY_HEARTBEAT_HEADING_FENCED_TEMPLATE,
	LEGACY_HEARTBEAT_FENCED_TEMPLATE,
	LEGACY_HEARTBEAT_FENCED_RELATED_TEMPLATE,
	DOCS_HEARTBEAT_TEMPLATE_PAGE_AS_TEMPLATE
];
function linesEqual(left, right) {
	return left.length === right.length && left.every((line, index) => line === right[index]);
}
/** Classifies heartbeat template content as clean, repairable, or risky because it has user text. */
function analyzeHeartbeatTemplateForRepair(content) {
	const lines = content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
	if (KNOWN_REPAIRABLE_DIRTY_HEARTBEAT_TEMPLATES.some((template) => linesEqual(lines, template))) return { status: "dirty-template" };
	const hasDefaultTemplateBody = HEARTBEAT_DEFAULT_BODY_LINES.every((line) => lines.includes(line));
	const hasDirtyDocWrapper = lines.some((line) => DIRTY_HEARTBEAT_DOC_WRAPPER_LINES.has(line));
	const hasLegacyProseTemplate = LEGACY_HEARTBEAT_PROSE_TEMPLATE.every((line) => lines.includes(line));
	if ((!hasDefaultTemplateBody || !hasDirtyDocWrapper) && !hasLegacyProseTemplate) return { status: "clean" };
	return {
		status: "dirty-template-with-custom-content",
		customLines: lines.filter((line) => !KNOWN_DIRTY_HEARTBEAT_TEMPLATE_LINES.has(line))
	};
}
async function readCleanHeartbeatTemplate() {
	const templateDir = await require_workspace.resolveWorkspaceTemplateDir();
	const templatePath = node_path.default.join(templateDir, require_workspace.DEFAULT_HEARTBEAT_FILENAME);
	return await node_fs_promises.default.readFile(templatePath, "utf-8");
}
function heartbeatTemplateAnalysisToHealthFinding(heartbeatPath, analysis) {
	if (analysis.status === "dirty-template-with-custom-content") return {
		checkId: HEARTBEAT_TEMPLATE_CHECK_ID,
		severity: "warning",
		message: "HEARTBEAT.md contains an older heartbeat template wrapper plus custom or unrecognized content.",
		path: heartbeatPath,
		requirement: "legacy-template-with-custom-content",
		fixHint: "Remove the fenced template and Related lines manually if they are not intentional."
	};
	return {
		checkId: HEARTBEAT_TEMPLATE_CHECK_ID,
		severity: "warning",
		message: "HEARTBEAT.md contains an older heartbeat documentation template.",
		path: heartbeatPath,
		requirement: "legacy-template",
		fixHint: "Run \"operator doctor --fix\" to replace it with the clean heartbeat template."
	};
}
/** Collects read-only structured findings for legacy HEARTBEAT.md template wrappers. */
async function collectHeartbeatTemplateHealthFindings(cfg, deps) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg));
	const heartbeatPath = node_path.default.join(workspaceDir, require_workspace.DEFAULT_HEARTBEAT_FILENAME);
	const readFile = deps?.readFile ?? ((filePath) => node_fs_promises.default.readFile(filePath, "utf-8"));
	let content;
	try {
		content = await readFile(heartbeatPath);
	} catch (error) {
		if (error?.code === "ENOENT") return [];
		return [{
			checkId: HEARTBEAT_TEMPLATE_CHECK_ID,
			severity: "warning",
			message: `Could not inspect HEARTBEAT.md: ${require_errors.formatErrorMessage(error)}`,
			path: heartbeatPath,
			requirement: "inspect-failed",
			fixHint: "Check file permissions, then rerun doctor."
		}];
	}
	const analysis = analyzeHeartbeatTemplateForRepair(content);
	if (analysis.status === "clean") return [];
	return [heartbeatTemplateAnalysisToHealthFinding(heartbeatPath, analysis)];
}
/** Replaces known dirty heartbeat templates with the clean runtime template when repair is enabled. */
async function maybeRepairHeartbeatTemplate(params) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const heartbeatPath = node_path.default.join(workspaceDir, require_workspace.DEFAULT_HEARTBEAT_FILENAME);
	let content;
	try {
		content = await node_fs_promises.default.readFile(heartbeatPath, "utf-8");
	} catch (error) {
		if (error?.code === "ENOENT") return;
		require_note.note(`Could not inspect ${require_utils.shortenHomePath(heartbeatPath)}: ${require_errors.formatErrorMessage(error)}`, "Heartbeat template");
		return;
	}
	const analysis = analyzeHeartbeatTemplateForRepair(content);
	if (analysis.status === "clean") return;
	if (analysis.status === "dirty-template-with-custom-content") {
		require_note.note([`${require_utils.shortenHomePath(heartbeatPath)} contains an older heartbeat template wrapper plus custom or unrecognized content.`, "Doctor left it unchanged so it does not delete user tasks. Remove the fenced template and Related lines manually if they are not intentional."].join("\n"), "Heartbeat template");
		return;
	}
	if (!params.shouldRepair) {
		require_note.note([`${require_utils.shortenHomePath(heartbeatPath)} contains an older heartbeat documentation template.`, "Run \"operator doctor --fix\" to replace it with the clean heartbeat template."].join("\n"), "Heartbeat template");
		return;
	}
	try {
		await require_json_files.writeTextAtomic(heartbeatPath, await readCleanHeartbeatTemplate(), { mode: 384 });
		require_note.note(`Replaced ${require_utils.shortenHomePath(heartbeatPath)} with the clean heartbeat template.`, "Doctor changes");
	} catch (error) {
		require_note.note(`Could not repair ${require_utils.shortenHomePath(heartbeatPath)}: ${require_errors.formatErrorMessage(error)}`, "Heartbeat template");
	}
}
//#endregion
exports.collectHeartbeatTemplateHealthFindings = collectHeartbeatTemplateHealthFindings;
exports.maybeRepairHeartbeatTemplate = maybeRepairHeartbeatTemplate;
