require("./rolldown-runtime-u92d-OFm.cjs");
//#region src/gateway/server-retained-plugin-cleanup.ts
async function cleanupRetainedPluginInstallGenerations(params) {
	try {
		const records = (await Promise.resolve().then(() => require("./installed-plugin-index-records-2CPyZnZe.cjs")).then((n) => n.installed_plugin_index_records_exports)).loadInstalledPluginIndexInstallRecordsSync();
		const { cleanupRetainedManagedNpmInstallGenerations } = await Promise.resolve().then(() => require("./managed-npm-retention-edlbaFsN.cjs")).then((n) => n.managed_npm_retention_exports);
		const removedGenerations = await cleanupRetainedManagedNpmInstallGenerations({
			activeInstallPaths: Object.values(records).flatMap((record) => record.installPath ? [record.installPath] : []),
			onError: (error, projectRoot) => params.log.warn(`failed to clean retained npm generation ${projectRoot}: ${String(error)}`)
		});
		if (removedGenerations > 0) params.log.info(`cleaned ${removedGenerations} retained npm plugin generation(s)`);
	} catch (error) {
		params.log.warn(`retained npm generation cleanup unavailable: ${String(error)}`);
	}
}
//#endregion
exports.cleanupRetainedPluginInstallGenerations = cleanupRetainedPluginInstallGenerations;
