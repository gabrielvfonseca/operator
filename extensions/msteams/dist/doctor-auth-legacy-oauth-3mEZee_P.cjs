require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_repair = require("./repair-DpRcksFG.cjs");
//#region src/commands/doctor-auth-legacy-oauth.ts
/** Migrates legacy provider-declared OAuth profile ids to current auth profile ids. */
async function loadProviderRuntime() {
	return Promise.resolve().then(() => require("./providers.runtime-C5KyGi_O.cjs")).then((n) => n.providers_runtime_exports);
}
async function loadNoteRuntime() {
	return Promise.resolve().then(() => require("./note-DKh-wVkx.cjs")).then((n) => n.note_exports);
}
function hasConfigOAuthProfiles(cfg) {
	return Object.values(cfg.auth?.profiles ?? {}).some((profile) => profile?.mode === "oauth");
}
function sanitizePromptLabel(label) {
	return (label ? require_ansi.sanitizeForLog(label).trim() : void 0) || void 0;
}
/**
* Applies provider-declared OAuth profile id repairs to config after prompting.
*
* Providers own the legacy id mapping; doctor only loads setup-time provider metadata and asks
* before writing config so stale provider-specific ids do not silently shadow current profiles.
*/
async function maybeRepairLegacyOAuthProfileIds(cfg, prompter) {
	if (!hasConfigOAuthProfiles(cfg)) return cfg;
	const store = require_store.ensureAuthProfileStore();
	if (Object.keys(store.profiles).length === 0) return cfg;
	let nextCfg = cfg;
	const { resolvePluginProviders } = await loadProviderRuntime();
	const providers = resolvePluginProviders({
		config: cfg,
		env: process.env,
		mode: "setup"
	});
	for (const provider of providers) for (const repairSpec of provider.oauthProfileIdRepairs ?? []) {
		const repair = require_repair.repairOAuthProfileIdMismatch({
			cfg: nextCfg,
			store,
			provider: provider.id,
			legacyProfileId: repairSpec.legacyProfileId
		});
		if (!repair.migrated || repair.changes.length === 0) continue;
		const { note } = await loadNoteRuntime();
		note(repair.changes.map((c) => `- ${c}`).join("\n"), "Auth profiles");
		const label = sanitizePromptLabel(repairSpec.promptLabel) ?? sanitizePromptLabel(provider.label) ?? provider.id;
		if (!await prompter.confirm({
			message: `Update ${label} OAuth profile id in config now?`,
			initialValue: true
		})) continue;
		nextCfg = repair.config;
	}
	return nextCfg;
}
//#endregion
exports.maybeRepairLegacyOAuthProfileIds = maybeRepairLegacyOAuthProfileIds;
