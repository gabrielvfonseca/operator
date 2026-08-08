require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_completion_delivery_policy = require("./completion-delivery-policy-Djb6F8Lx.cjs");
const require_commands_flags = require("./commands.flags-BZYis-vI.cjs");
const require_commands_registry_list = require("./commands-registry-list-CKPjpslh.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
require("./usage-format-Ed9eVdJX.cjs");
require("./commands-registry-BvZ3TCTG.cjs");
const require_tool_description_summary = require("./tool-description-summary-C8K3io6j.cjs");
require("./status-message-Devhb-5B.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/command-status-builders.ts
/** Formats /help and /commands output for text and native command-list surfaces. */
const CATEGORY_LABELS = {
	session: "Session",
	options: "Options",
	status: "Status",
	management: "Management",
	media: "Media",
	tools: "Tools",
	docks: "Docks"
};
const CATEGORY_ORDER = [
	"session",
	"options",
	"status",
	"management",
	"media",
	"tools",
	"docks"
];
function groupCommandsByCategory(commands) {
	const grouped = /* @__PURE__ */ new Map();
	for (const category of CATEGORY_ORDER) grouped.set(category, []);
	for (const command of commands) {
		const category = command.category ?? "tools";
		const list = grouped.get(category) ?? [];
		list.push(command);
		grouped.set(category, list);
	}
	return grouped;
}
/** Builds the compact slash-command help text shown by `/help`. */
function buildHelpMessage(cfg) {
	const lines = ["ℹ️ Help", ""];
	lines.push("Session");
	lines.push("  /new  |  /reset  |  /compact [instructions]  |  /stop");
	lines.push("");
	const optionParts = [
		"/think <level|default>",
		"/model <id>",
		"/fast status|auto|on|off|default",
		"/verbose on|off|full",
		"/trace on|off|raw"
	];
	if (require_commands_flags.isCommandFlagEnabled(cfg, "config")) optionParts.push("/config");
	if (require_commands_flags.isCommandFlagEnabled(cfg, "debug")) optionParts.push("/debug");
	lines.push("Options");
	lines.push(`  ${optionParts.join("  |  ")}`);
	lines.push("");
	lines.push("Status");
	lines.push("  /status  |  /tasks  |  /whoami  |  /context");
	lines.push("");
	lines.push("Skills");
	lines.push("  /skill <name> [input]");
	lines.push("");
	lines.push("More: /commands for full list, /tools for available capabilities");
	return lines.join("\n");
}
const COMMANDS_PER_PAGE = 8;
function formatCommandEntry(command) {
	const primary = command.nativeName ? `/${command.nativeName}` : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(command.textAliases[0]) || `/${command.key}`;
	const seen = /* @__PURE__ */ new Set();
	const aliases = command.textAliases.map((alias) => alias.trim()).filter(Boolean).filter((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias) !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(primary)).filter((alias) => {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	return `${primary}${aliases.length ? ` (${aliases.join(", ")})` : ""}${command.scope === "text" ? " [text]" : ""} - ${command.description}`;
}
function buildCommandItems(commands, pluginCommands) {
	const grouped = groupCommandsByCategory(commands);
	const items = [];
	for (const category of CATEGORY_ORDER) {
		const categoryCommands = grouped.get(category) ?? [];
		if (categoryCommands.length === 0) continue;
		const label = CATEGORY_LABELS[category];
		for (const command of categoryCommands) items.push({
			label,
			text: formatCommandEntry(command)
		});
	}
	for (const command of pluginCommands) {
		const pluginLabel = command.pluginId ? ` (${command.pluginId})` : "";
		items.push({
			label: "Plugins",
			text: `/${command.name}${pluginLabel} - ${command.description}`
		});
	}
	return items;
}
function formatCommandList(items) {
	const lines = [];
	let currentLabel = null;
	for (const item of items) {
		if (item.label !== currentLabel) {
			if (lines.length > 0) lines.push("");
			lines.push(item.label);
			currentLabel = item.label;
		}
		lines.push(`  ${item.text}`);
	}
	return lines.join("\n");
}
/** Builds `/commands` text, returning only the rendered message body. */
function buildCommandsMessage(cfg, skillCommands, options) {
	return buildCommandsMessagePaginated(cfg, skillCommands, options).text;
}
/** Builds `/commands` text and pagination metadata for surfaces with native list controls. */
function buildCommandsMessagePaginated(cfg, skillCommands, options) {
	const page = Math.max(1, options?.page ?? 1);
	const surface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(options?.surface);
	const prefersPaginatedList = options?.forcePaginatedList === true || Boolean(surface && require_registry.getChannelPlugin(surface)?.commands?.buildCommandsListChannelData);
	const items = buildCommandItems(cfg ? require_commands_registry_list.listChatCommandsForConfig(cfg, { skillCommands }) : require_commands_registry_list.listChatCommands({ skillCommands }), require_completion_delivery_policy.listPluginCommands());
	if (!prefersPaginatedList) {
		const lines = ["ℹ️ Slash commands", ""];
		lines.push(formatCommandList(items));
		lines.push("", "More: /tools for available capabilities");
		return {
			text: lines.join("\n").trim(),
			totalPages: 1,
			currentPage: 1,
			hasNext: false,
			hasPrev: false
		};
	}
	const totalCommands = items.length;
	const totalPages = Math.max(1, Math.ceil(totalCommands / COMMANDS_PER_PAGE));
	const currentPage = Math.min(page, totalPages);
	const startIndex = (currentPage - 1) * COMMANDS_PER_PAGE;
	const endIndex = startIndex + COMMANDS_PER_PAGE;
	const pageItems = items.slice(startIndex, endIndex);
	const lines = [`ℹ️ Commands (${currentPage}/${totalPages})`, ""];
	lines.push(formatCommandList(pageItems));
	return {
		text: lines.join("\n").trim(),
		totalPages,
		currentPage,
		hasNext: currentPage < totalPages,
		hasPrev: currentPage > 1
	};
}
//#endregion
//#region src/auto-reply/status.ts
/** Auto-reply status/help message builders for commands, status, and tool inventory output. */
function sortToolsMessageItems(items) {
	return items.toSorted((a, b) => a.name.localeCompare(b.name));
}
function formatCompactToolEntry(tool) {
	if (tool.source === "plugin") return tool.pluginId ? `${tool.id} (${tool.pluginId})` : tool.id;
	if (tool.source === "channel") return tool.channelId ? `${tool.id} (${tool.channelId})` : tool.id;
	return tool.id;
}
function formatVerboseToolDescription(tool) {
	return require_tool_description_summary.describeToolForVerbose({
		rawDescription: tool.rawDescription,
		fallback: tool.description
	});
}
/** Formats the effective tool inventory shown by /tools. */
function buildToolsMessage(result, options) {
	const groups = [];
	for (const group of result.groups) {
		const tools = [];
		for (const tool of group.tools) tools.push({
			id: require_tool_policy.normalizeToolName(tool.id),
			name: tool.label,
			description: tool.description || "Tool",
			rawDescription: tool.rawDescription || tool.description || "Tool",
			source: tool.source,
			pluginId: tool.pluginId,
			channelId: tool.channelId
		});
		if (tools.length > 0) groups.push({
			label: group.label,
			tools: sortToolsMessageItems(tools)
		});
	}
	if (groups.length === 0) return [
		"No tools are available for this agent right now.",
		"",
		`Profile: ${result.profile}`
	].join("\n");
	const verbose = options?.verbose === true;
	const lines = verbose ? [
		"Available tools",
		"",
		`Profile: ${result.profile}`,
		"What this agent can use right now:"
	] : [
		"Available tools",
		"",
		`Profile: ${result.profile}`
	];
	for (const group of groups) {
		lines.push("", group.label);
		if (verbose) {
			for (const tool of group.tools) lines.push(`  ${tool.name} - ${formatVerboseToolDescription(tool)}`);
			continue;
		}
		const compactTools = [];
		for (const tool of group.tools) compactTools.push(formatCompactToolEntry(tool));
		lines.push(`  ${compactTools.join(", ")}`);
	}
	if (verbose) lines.push("", "Tool availability depends on this agent's configuration.");
	else lines.push("", "Use /tools verbose for descriptions.");
	if (result.notices?.length) {
		lines.push("", "Notes");
		for (const notice of result.notices) lines.push(`  ${notice.message}`);
	}
	return lines.join("\n");
}
//#endregion
Object.defineProperty(exports, "buildCommandsMessage", {
	enumerable: true,
	get: function() {
		return buildCommandsMessage;
	}
});
Object.defineProperty(exports, "buildCommandsMessagePaginated", {
	enumerable: true,
	get: function() {
		return buildCommandsMessagePaginated;
	}
});
Object.defineProperty(exports, "buildHelpMessage", {
	enumerable: true,
	get: function() {
		return buildHelpMessage;
	}
});
Object.defineProperty(exports, "buildToolsMessage", {
	enumerable: true,
	get: function() {
		return buildToolsMessage;
	}
});
