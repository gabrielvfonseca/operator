require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
//#region src/cli/plugins-json-logger.ts
const quietPluginJsonLogger = {
	debug: () => void 0,
	info: () => void 0,
	warn: () => void 0,
	error: () => void 0
};
//#endregion
//#region src/cli/plugins-list-command.ts
async function loadHumanListModules() {
	const [sourceDisplay, table, themeModule, commandFormat, listFormat] = await Promise.all([
		Promise.resolve().then(() => require("./source-display-DbBscqmH.cjs")),
		Promise.resolve().then(() => require("./table-B4dxfer5.cjs")).then((n) => n.table_exports),
		Promise.resolve().then(() => require("./theme-DwRpEiJc.cjs")).then((n) => n.theme_exports),
		Promise.resolve().then(() => require("./command-format-C4ZW2nwK.cjs")).then((n) => n.command_format_exports),
		Promise.resolve().then(() => require("./plugins-list-format-CAPrKBNd.cjs"))
	]);
	return {
		formatPluginLine: listFormat.formatPluginLine,
		formatPluginSourceForTable: sourceDisplay.formatPluginSourceForTable,
		formatCliCommand: commandFormat.formatCliCommand,
		getTerminalTableWidth: table.getTerminalTableWidth,
		renderTable: table.renderTable,
		resolvePluginSourceRoots: sourceDisplay.resolvePluginSourceRoots,
		theme: themeModule.theme
	};
}
/** Render installed plugin discovery state as JSON, compact table, or verbose text. */
async function runPluginsListCommand(opts, runtime = require_runtime.defaultRuntime) {
	const { buildPluginRegistrySnapshotReport } = await Promise.resolve().then(() => require("./status-snapshot-Bz-edBxw.cjs")).then((n) => n.status_snapshot_exports);
	const report = buildPluginRegistrySnapshotReport({
		config: require_io.getRuntimeConfig(),
		...opts.json ? { logger: quietPluginJsonLogger } : {}
	});
	const list = opts.enabled ? report.plugins.filter((p) => p.enabled) : report.plugins;
	if (opts.json) {
		require_runtime.writeRuntimeJson(runtime, {
			workspaceDir: report.workspaceDir,
			registry: {
				source: report.registrySource,
				diagnostics: report.registryDiagnostics
			},
			plugins: list,
			diagnostics: report.diagnostics
		});
		return;
	}
	const { formatCliCommand, formatPluginLine, formatPluginSourceForTable, getTerminalTableWidth, renderTable, resolvePluginSourceRoots, theme } = await loadHumanListModules();
	if (list.length === 0) {
		runtime.log(theme.muted(`No plugins found. Run ${formatCliCommand("openclaw plugins install <plugin>")} to add one, or ${formatCliCommand("openclaw plugins list --json")} to inspect raw discovery state.`));
		return;
	}
	const enabled = list.filter((p) => p.enabled).length;
	runtime.log(`${theme.heading("Plugins")} ${theme.muted(`(${enabled}/${list.length} enabled)`)}`);
	if (!opts.verbose) {
		const tableWidth = getTerminalTableWidth();
		const sourceRoots = resolvePluginSourceRoots({ workspaceDir: report.workspaceDir });
		const usedRoots = /* @__PURE__ */ new Set();
		const rows = list.map((plugin) => {
			const desc = plugin.description ? theme.muted(plugin.description) : "";
			const formattedSource = formatPluginSourceForTable(plugin, sourceRoots);
			if (formattedSource.rootKey) usedRoots.add(formattedSource.rootKey);
			const sourceLine = desc ? `${formattedSource.value}\n${desc}` : formattedSource.value;
			return {
				Name: plugin.name || plugin.id,
				ID: plugin.name && plugin.name !== plugin.id ? plugin.id : "",
				Format: plugin.format ?? "@gabrielvfonseca/operator",
				Status: plugin.status === "error" ? theme.error("error") : plugin.enabled ? theme.success("enabled") : theme.warn("disabled"),
				Source: sourceLine,
				Version: plugin.version ?? ""
			};
		});
		if (usedRoots.size > 0) {
			runtime.log(theme.muted("Source roots:"));
			for (const key of [
				"stock",
				"workspace",
				"global"
			]) {
				if (!usedRoots.has(key)) continue;
				const dir = sourceRoots[key];
				if (!dir) continue;
				runtime.log(`  ${theme.command(`${key}:`)} ${theme.muted(dir)}`);
			}
			runtime.log("");
		}
		runtime.log(renderTable({
			width: tableWidth,
			columns: [
				{
					key: "Name",
					header: "Name",
					minWidth: 14,
					flex: true
				},
				{
					key: "ID",
					header: "ID",
					minWidth: 10,
					flex: true
				},
				{
					key: "Format",
					header: "Format",
					minWidth: 9
				},
				{
					key: "Status",
					header: "Status",
					minWidth: 10
				},
				{
					key: "Source",
					header: "Source",
					minWidth: 26,
					flex: true
				},
				{
					key: "Version",
					header: "Version",
					minWidth: 8
				}
			],
			rows
		}).trimEnd());
		return;
	}
	const lines = [];
	for (const plugin of list) {
		lines.push(formatPluginLine(plugin, true));
		lines.push("");
	}
	runtime.log(lines.join("\n").trim());
}
//#endregion
exports.runPluginsListCommand = runPluginsListCommand;
