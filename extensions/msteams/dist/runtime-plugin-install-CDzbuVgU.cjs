const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/commands/runtime-plugin-install.ts
/**
* Runtime plugin install helpers for model selection.
*
* Model choices can require runtime plugins such as Codex or Copilot; this
* module installs, enables, or repairs those plugins from a shared descriptor.
*/
function isInstalledRecordPresentOnDisk(record, env) {
	const installPath = record?.installPath?.trim();
	if (!installPath) return false;
	return (0, node_fs.existsSync)(node_path.default.join(require_home_dir.resolveUserPath(installPath, env), "package.json"));
}
/** Ensures the runtime plugin required by the selected model is installed and enabled. */
async function ensureRuntimePluginForModelSelection(params) {
	if (!params.shouldEnsure({
		cfg: params.cfg,
		model: params.model,
		agentId: params.agentId
	})) return {
		cfg: params.cfg,
		required: false,
		installed: false
	};
	if (isInstalledRecordPresentOnDisk((await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords({ env: process.env }))[params.descriptor.pluginId], process.env)) {
		const repair = await repairRuntimePluginInstallForModelSelection({
			cfg: params.cfg,
			model: params.model,
			agentId: params.agentId,
			env: process.env,
			descriptor: params.descriptor,
			shouldEnsure: params.shouldEnsure
		});
		for (const change of repair.changes) params.runtime.log?.(change);
		for (const warning of repair.warnings) params.runtime.log?.(`${params.descriptor.warningLabel} update warning: ${warning}`);
		const enableResult = require_enable.enablePluginInConfig(params.cfg, params.descriptor.pluginId);
		return {
			cfg: enableResult.config,
			required: true,
			installed: enableResult.enabled,
			status: enableResult.enabled ? "installed" : "failed",
			...enableResult.reason ? { reason: enableResult.reason } : {}
		};
	}
	const { ensureOnboardingPluginInstalled } = await Promise.resolve().then(() => require("./onboarding-plugin-install-BVkG7njW.cjs")).then((n) => n.onboarding_plugin_install_exports);
	const result = await ensureOnboardingPluginInstalled({
		cfg: params.cfg,
		entry: {
			pluginId: params.descriptor.pluginId,
			label: params.descriptor.label,
			install: {
				npmSpec: params.descriptor.npmSpec,
				defaultChoice: "npm"
			},
			trustedSourceLinkedOfficialInstall: true
		},
		prompter: params.prompter,
		runtime: params.runtime,
		...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
		promptInstall: false,
		autoConfirmSingleSource: true
	});
	return {
		cfg: result.cfg,
		required: true,
		installed: result.installed,
		status: result.status,
		...result.error ? { reason: result.error } : {}
	};
}
/** Repairs missing install records for runtime plugins required by model selection. */
async function repairRuntimePluginInstallForModelSelection(params) {
	if (!params.shouldEnsure({
		cfg: params.cfg,
		model: params.model,
		agentId: params.agentId
	})) return {
		required: false,
		changes: [],
		warnings: []
	};
	const { repairMissingPluginInstallsForIds } = await Promise.resolve().then(() => require("./missing-configured-plugin-install-BXc1994T.cjs"));
	const result = await repairMissingPluginInstallsForIds({
		cfg: params.cfg,
		pluginIds: [params.descriptor.pluginId],
		...params.env !== void 0 ? { env: params.env } : {}
	});
	return {
		required: true,
		changes: result.changes,
		warnings: [...result.warnings, ...result.notices ?? []]
	};
}
/** Creates ensure/repair helpers pre-bound to a runtime plugin descriptor. */
function createRuntimePluginModelSelectionHelpers(params) {
	return {
		ensure: (ensureParams) => ensureRuntimePluginForModelSelection({
			...ensureParams,
			descriptor: params.descriptor,
			shouldEnsure: params.shouldEnsure
		}),
		repair: (repairParams) => repairRuntimePluginInstallForModelSelection({
			...repairParams,
			descriptor: params.descriptor,
			shouldEnsure: params.shouldEnsure
		})
	};
}
//#endregion
Object.defineProperty(exports, "createRuntimePluginModelSelectionHelpers", {
	enumerable: true,
	get: function() {
		return createRuntimePluginModelSelectionHelpers;
	}
});
