require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor-command-owner.ts
/** Doctor warning for missing command owners on privileged channel commands. */
function resolveConfiguredCommandOwners(cfg) {
	const owners = cfg.commands?.ownerAllowFrom;
	if (!Array.isArray(owners)) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(owners.map((entry) => String(entry ?? ""))).filter((entry) => entry !== "*" && !entry.endsWith(":*"));
}
/** Returns true when at least one owner sender id is configured. */
function hasConfiguredCommandOwners(cfg) {
	return resolveConfiguredCommandOwners(cfg).length > 0;
}
/** Emits setup guidance when privileged command ownership is not configured. */
function noteCommandOwnerHealth(cfg) {
	if (hasConfiguredCommandOwners(cfg)) return;
	require_note.note([
		"No command owner is configured.",
		"A command owner is the human operator account allowed to run owner-only commands and approve dangerous actions, including /diagnostics, /export-session, /export-trajectory, /config, and exec approvals.",
		"DM pairing only lets someone talk to the bot; it does not make that sender the owner for privileged commands.",
		`Fix: set commands.ownerAllowFrom to your channel user id, for example ${require_command_format.formatCliCommand("openclaw config set commands.ownerAllowFrom '[\"telegram:123456789\"]'")}`,
		"Restart the gateway after changing this if it is already running."
	].join("\n"), "Command owner");
}
//#endregion
exports.hasConfiguredCommandOwners = hasConfiguredCommandOwners;
exports.noteCommandOwnerHealth = noteCommandOwnerHealth;
