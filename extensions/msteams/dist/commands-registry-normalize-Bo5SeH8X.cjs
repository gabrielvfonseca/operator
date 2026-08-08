const require_regexp = require("./regexp-C8Y0xoXY.cjs");
require("./utils-CXqBhRFw.cjs");
const require_commands_registry_data = require("./commands-registry.data-Yy8_zwjC.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/commands-registry-normalize.ts
/** Normalizes slash-command text aliases and builds command detection caches. */
let cachedTextAliasMap = null;
let cachedTextAliasCommands = null;
let cachedDetection;
let cachedDetectionCommands = null;
function appendMultilineTail(head, tail, spec) {
	if (!tail) return head;
	if (!spec || spec.key === "skill" || spec.key === "learn") return `${head}\n${tail}`;
	if (spec.key === "reset") {
		const flattened = tail.replace(/\s+/g, " ").trim();
		return flattened ? `${head} ${flattened}` : head;
	}
	return head;
}
function getTextAliasMap() {
	const commands = require_commands_registry_data.getChatCommands();
	if (cachedTextAliasMap && cachedTextAliasCommands === commands) return cachedTextAliasMap;
	const map = /* @__PURE__ */ new Map();
	for (const command of commands) {
		const canonical = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(command.textAliases[0]) || `/${command.key}`;
		const acceptsArgs = Boolean(command.acceptsArgs);
		for (const alias of command.textAliases) {
			const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(alias);
			if (!normalized) continue;
			if (!map.has(normalized)) map.set(normalized, {
				key: command.key,
				canonical,
				acceptsArgs
			});
		}
	}
	cachedTextAliasMap = map;
	cachedTextAliasCommands = commands;
	return map;
}
/** Normalizes command text to canonical aliases, removing bot mentions when appropriate. */
function normalizeCommandBody(raw, options) {
	const trimmed = raw.trim();
	if (!trimmed.startsWith("/")) return trimmed;
	const newline = trimmed.indexOf("\n");
	const singleLine = newline === -1 ? trimmed : trimmed.slice(0, newline).trim();
	const multilineTail = newline === -1 ? void 0 : trimmed.slice(newline + 1).trimStart();
	const colonMatch = singleLine.match(/^\/([^\s:]+)\s*:(.*)$/);
	const normalized = colonMatch ? (() => {
		const [, command, rest] = colonMatch;
		const normalizedRest = (0, _gabrielvfonseca_normalization_core.expectDefined)(rest, "commands registry normalize rest").trimStart();
		return normalizedRest ? `/${command} ${normalizedRest}` : `/${command}`;
	})() : singleLine;
	const normalizedBotUsername = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(options?.botUsername);
	const mentionMatch = normalizedBotUsername ? normalized.match(/^\/([^\s@]+)@([^\s]+)(.*)$/) : null;
	const commandBody = mentionMatch && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(mentionMatch[2]) === normalizedBotUsername ? `/${mentionMatch[1]}${mentionMatch[3] ?? ""}` : normalized;
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(commandBody);
	const textAliasMap = getTextAliasMap();
	const exact = textAliasMap.get(lowered);
	if (exact) return appendMultilineTail(exact.canonical, multilineTail, exact);
	const tokenMatch = commandBody.match(/^\/([^\s]+)(?:\s+([\s\S]+))?$/);
	if (!tokenMatch) return appendMultilineTail(commandBody, multilineTail);
	const [, token, rest] = tokenMatch;
	const tokenKey = `/${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(token)}`;
	const tokenSpec = textAliasMap.get(tokenKey);
	if (!tokenSpec) return appendMultilineTail(commandBody, multilineTail);
	if (rest && !tokenSpec.acceptsArgs) return commandBody;
	const normalizedRest = rest?.trimStart();
	return appendMultilineTail(normalizedRest ? `${tokenSpec.canonical} ${normalizedRest}` : tokenSpec.canonical, multilineTail, tokenSpec);
}
/** Returns cached exact and regex detectors for the current command registry instance. */
function getCommandDetection(_cfg) {
	const commands = require_commands_registry_data.getChatCommands();
	if (cachedDetection && cachedDetectionCommands === commands) return cachedDetection;
	const exact = /* @__PURE__ */ new Set();
	const patterns = [];
	for (const cmd of commands) for (const alias of cmd.textAliases) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(alias);
		if (!normalized) continue;
		exact.add(normalized);
		const escaped = require_regexp.escapeRegExp(normalized);
		if (!escaped) continue;
		if (cmd.acceptsArgs) patterns.push(`${escaped}(?:\\s+[\\s\\S]+|\\s*:\\s*[\\s\\S]*)?`);
		else patterns.push(`${escaped}(?:\\s*:\\s*)?`);
	}
	cachedDetection = {
		exact,
		regex: patterns.length ? new RegExp(`^(?:${patterns.join("|")})$`, "i") : /$^/
	};
	cachedDetectionCommands = commands;
	return cachedDetection;
}
/** Resolves a raw text command to the matching normalized alias when known. */
function maybeResolveTextAlias(raw, cfg) {
	const trimmed = normalizeCommandBody(raw).trim();
	if (!trimmed.startsWith("/")) return null;
	const detection = getCommandDetection(cfg);
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	if (detection.exact.has(normalized)) return normalized;
	if (!detection.regex.test(normalized)) return null;
	const tokenMatch = normalized.match(/^\/([^\s:]+)(?:\s|$)/);
	if (!tokenMatch) return null;
	const tokenKey = `/${tokenMatch[1]}`;
	return getTextAliasMap().has(tokenKey) ? tokenKey : null;
}
/** Resolves a raw text command into its command definition and raw argument tail. */
function resolveTextCommand(raw, cfg) {
	const trimmed = normalizeCommandBody(raw).trim();
	const alias = maybeResolveTextAlias(trimmed, cfg);
	if (!alias) return null;
	const spec = getTextAliasMap().get(alias);
	if (!spec) return null;
	const command = require_commands_registry_data.getChatCommands().find((entry) => entry.key === spec.key);
	if (!command) return null;
	if (!spec.acceptsArgs) return { command };
	return {
		command,
		args: trimmed.slice(alias.length).trim() || void 0
	};
}
//#endregion
Object.defineProperty(exports, "normalizeCommandBody", {
	enumerable: true,
	get: function() {
		return normalizeCommandBody;
	}
});
Object.defineProperty(exports, "resolveTextCommand", {
	enumerable: true,
	get: function() {
		return resolveTextCommand;
	}
});
