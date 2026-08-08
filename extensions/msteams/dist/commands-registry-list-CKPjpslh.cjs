const require_commands_flags = require("./commands.flags-BZYis-vI.cjs");
const require_commands_registry_data = require("./commands-registry.data-Yy8_zwjC.cjs");
//#region src/auto-reply/commands-registry-list.ts
/** Command-list assembly and config filtering for chat command registries. */
/** Builds dynamic command definitions exported by installed skills. */
function buildSkillCommandDefinitions(skillCommands) {
	if (!skillCommands || skillCommands.length === 0) return [];
	return skillCommands.map((spec) => {
		const command = {
			key: `skill:${spec.skillName}`,
			nativeName: spec.name,
			description: spec.description,
			textAliases: [`/${spec.name}`],
			acceptsArgs: true,
			argsParsing: "none",
			scope: "both",
			category: "tools"
		};
		if (spec.descriptionLocalizations) command.descriptionLocalizations = spec.descriptionLocalizations;
		return command;
	});
}
/** Lists built-in commands plus optional skill-provided commands. */
function listChatCommands(params) {
	const commands = require_commands_registry_data.getChatCommands();
	if (!params?.skillCommands?.length) return [...commands];
	return [...commands, ...buildSkillCommandDefinitions(params.skillCommands)];
}
/** Applies config feature flags to command keys that can be operator-disabled. */
function isCommandEnabled(cfg, commandKey) {
	if (commandKey === "config") return require_commands_flags.isCommandFlagEnabled(cfg, "config");
	if (commandKey === "mcp") return require_commands_flags.isCommandFlagEnabled(cfg, "mcp");
	if (commandKey === "plugins") return require_commands_flags.isCommandFlagEnabled(cfg, "plugins");
	if (commandKey === "debug") return require_commands_flags.isCommandFlagEnabled(cfg, "debug");
	if (commandKey === "bash") return require_commands_flags.isCommandFlagEnabled(cfg, "bash");
	return true;
}
/** Lists commands visible for a specific config, preserving dynamic skill commands. */
function listChatCommandsForConfig(cfg, params) {
	const base = require_commands_registry_data.getChatCommands().filter((command) => isCommandEnabled(cfg, command.key));
	if (!params?.skillCommands?.length) return base;
	return [...base, ...buildSkillCommandDefinitions(params.skillCommands)];
}
//#endregion
Object.defineProperty(exports, "listChatCommands", {
	enumerable: true,
	get: function() {
		return listChatCommands;
	}
});
Object.defineProperty(exports, "listChatCommandsForConfig", {
	enumerable: true,
	get: function() {
		return listChatCommandsForConfig;
	}
});
