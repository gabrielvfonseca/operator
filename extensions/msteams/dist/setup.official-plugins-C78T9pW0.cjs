require("./rolldown-runtime-u92d-OFm.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_onboarding_plugin_install = require("./onboarding-plugin-install-BVkG7njW.cjs");
//#region src/wizard/setup.official-plugins.ts
const SKIP_VALUE = "__skip__";
function isInstalledOrConfigured(config, pluginId) {
	return Boolean(config.plugins?.entries?.[pluginId] || config.plugins?.installs?.[pluginId]);
}
function isGenericOfficialPluginEntry(entry) {
	const manifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(entry);
	return entry.source === "official" && entry.kind === "plugin" && Boolean(manifest?.plugin?.id) && !manifest?.channel && (manifest?.providers?.length ?? 0) === 0 && (manifest?.webSearchProviders?.length ?? 0) === 0;
}
function formatInstallHint(install) {
	if (install.clawhubSpec && install.npmSpec) return install.defaultChoice === "clawhub" ? "ClawHub, with npm fallback" : "npm, with ClawHub fallback";
	if (install.clawhubSpec) return "ClawHub";
	if (install.npmSpec) return "npm";
	if (install.localPath) return "local path";
	return "install source";
}
function resolveOfficialPluginOnboardingInstallEntries(params) {
	const entries = [];
	for (const entry of require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries()) {
		if (!isGenericOfficialPluginEntry(entry)) continue;
		const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry);
		const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
		if (!pluginId || !install || isInstalledOrConfigured(params.config, pluginId)) continue;
		entries.push({
			pluginId,
			label: require_official_external_plugin_catalog.resolveOfficialExternalPluginLabel(entry),
			...entry.description ? { description: entry.description } : {},
			install,
			trustedSourceLinkedOfficialInstall: true
		});
	}
	return entries.toSorted((left, right) => left.label.localeCompare(right.label));
}
async function setupOfficialPluginInstalls(params) {
	const installEntries = resolveOfficialPluginOnboardingInstallEntries({ config: params.config });
	if (installEntries.length === 0) return params.config;
	const selected = await params.prompter.multiselect({
		message: require_i18n.t("wizard.plugins.officialInstall"),
		options: [{
			value: SKIP_VALUE,
			label: require_i18n.t("common.skipForNow"),
			hint: require_i18n.t("wizard.plugins.officialSkipHint")
		}, ...installEntries.map((entry) => ({
			value: entry.pluginId,
			label: entry.label,
			hint: entry.description ?? formatInstallHint(entry.install)
		}))]
	});
	let next = params.config;
	for (const pluginId of selected.filter((value) => value !== SKIP_VALUE)) {
		const entry = installEntries.find((candidate) => candidate.pluginId === pluginId);
		if (!entry) continue;
		next = (await require_onboarding_plugin_install.ensureOnboardingPluginInstalled({
			cfg: next,
			entry,
			prompter: params.prompter,
			runtime: params.runtime,
			workspaceDir: params.workspaceDir,
			promptInstall: false
		})).cfg;
	}
	return next;
}
//#endregion
exports.setupOfficialPluginInstalls = setupOfficialPluginInstalls;
