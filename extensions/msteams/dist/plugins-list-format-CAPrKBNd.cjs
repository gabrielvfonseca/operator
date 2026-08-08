require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/cli/plugins-list-format.ts
function formatPluginLine(plugin, verbose = false) {
	const status = plugin.status === "error" ? require_theme.theme.error("error") : plugin.enabled ? require_theme.theme.success("enabled") : require_theme.theme.warn("disabled");
	const name = require_theme.theme.command(plugin.name || plugin.id);
	const idSuffix = plugin.name && plugin.name !== plugin.id ? require_theme.theme.muted(` (${plugin.id})`) : "";
	const desc = plugin.description ? require_theme.theme.muted(plugin.description.length > 60 ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(plugin.description, 57)}...` : plugin.description) : require_theme.theme.muted("(no description)");
	const format = plugin.format ?? "@gabrielvfonseca/operator";
	if (!verbose) return `${name}${idSuffix} ${status} ${require_theme.theme.muted(`[${format}]`)} - ${desc}`;
	const parts = [
		`${name}${idSuffix} ${status}`,
		`  format: ${format}`,
		`  source: ${require_theme.theme.muted(require_utils.shortenHomeInString(plugin.source))}`,
		`  origin: ${plugin.origin}`
	];
	if (plugin.bundleFormat) parts.push(`  bundle format: ${plugin.bundleFormat}`);
	if (plugin.version) parts.push(`  version: ${plugin.version}`);
	if (plugin.activated !== void 0) parts.push(`  activated: ${plugin.activated ? "yes" : "no"}`);
	if (plugin.imported !== void 0) parts.push(`  imported: ${plugin.imported ? "yes" : "no"}`);
	if (plugin.explicitlyEnabled !== void 0) parts.push(`  explicitly enabled: ${plugin.explicitlyEnabled ? "yes" : "no"}`);
	if (plugin.activationSource) parts.push(`  activation source: ${plugin.activationSource}`);
	if (plugin.activationReason) parts.push(`  activation reason: ${require_safe_text.sanitizeTerminalText(plugin.activationReason)}`);
	if (plugin.providerIds.length > 0) parts.push(`  providers: ${plugin.providerIds.join(", ")}`);
	if (plugin.activated !== void 0 || plugin.activationSource || plugin.activationReason) {
		const activationSummary = plugin.activated === false ? "inactive" : plugin.activationSource ?? (plugin.activated ? "active" : "inactive");
		parts.push(`  activation: ${activationSummary}`);
	}
	if (plugin.error) parts.push(require_theme.theme.error(`  error: ${plugin.error}`));
	return parts.join("\n");
}
//#endregion
exports.formatPluginLine = formatPluginLine;
