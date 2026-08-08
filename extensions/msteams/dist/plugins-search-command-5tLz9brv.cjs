require("./rolldown-runtime-u92d-OFm.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_catalog_search = require("./catalog-search-Dtuw8S01.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cli/plugins-search-command.ts
function formatPackageSearchLine(entry) {
	const pkg = entry.package;
	const flags = [
		pkg.family,
		pkg.channel,
		pkg.isOfficial && pkg.channel !== "official" ? "official" : void 0,
		pkg.latestVersion ? `v${pkg.latestVersion}` : void 0
	].filter(Boolean);
	const summary = pkg.summary ? require_theme.theme.muted(` — ${pkg.summary}`) : "";
	return `${pkg.name}  ${require_theme.theme.muted(flags.join(" | "))}${summary}\n  ${require_theme.theme.muted(`Install: openclaw plugins install clawhub:${pkg.name}`)}`;
}
/** Search ClawHub for installable plugins and write JSON or terminal output. */
async function runPluginsSearchCommand(queryParts, opts = {}, runtime = require_runtime.defaultRuntime) {
	const query = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(Array.isArray(queryParts) ? queryParts.join(" ") : queryParts);
	if (!query) {
		runtime.error("Usage: openclaw plugins search <query>");
		return runtime.exit(1);
	}
	try {
		const results = await require_catalog_search.searchInstallablePluginPackages({
			query,
			limit: opts.limit
		});
		if (opts.json) {
			require_runtime.writeRuntimeJson(runtime, { results });
			return;
		}
		if (results.length === 0) {
			runtime.log("No ClawHub plugins found.");
			return;
		}
		runtime.log(`${require_theme.theme.heading("ClawHub plugins")} ${require_theme.theme.muted(`(${results.length})`)}`);
		runtime.log(results.map(formatPackageSearchLine).join("\n"));
	} catch (error) {
		runtime.error(require_errors.formatErrorMessage(error));
		runtime.exit(1);
	}
}
//#endregion
exports.runPluginsSearchCommand = runPluginsSearchCommand;
