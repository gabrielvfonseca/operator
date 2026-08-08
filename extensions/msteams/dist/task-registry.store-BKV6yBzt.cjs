const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_task_registry_store_sqlite = require("./task-registry.store.sqlite-CCfs-gtZ.cjs");
//#region src/tasks/task-registry.store.ts
var task_registry_store_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	configureTaskRegistryRuntime: () => configureTaskRegistryRuntime,
	getTaskRegistryObservers: () => getTaskRegistryObservers,
	getTaskRegistryStore: () => getTaskRegistryStore,
	resetTaskRegistryRuntimeForTests: () => resetTaskRegistryRuntimeForTests
});
const defaultTaskRegistryStore = {
	loadSnapshot: require_task_registry_store_sqlite.loadTaskRegistryStateFromSqlite,
	saveSnapshot: require_task_registry_store_sqlite.saveTaskRegistryStateToSqlite,
	listTasksForOwnerKey: require_task_registry_store_sqlite.listTaskRegistryRecordsByOwnerKeyFromSqlite,
	upsertTaskWithDeliveryState: require_task_registry_store_sqlite.upsertTaskWithDeliveryStateToSqlite,
	upsertTask: require_task_registry_store_sqlite.upsertTaskRegistryRecordToSqlite,
	deleteTaskWithDeliveryState: require_task_registry_store_sqlite.deleteTaskAndDeliveryStateFromSqlite,
	deleteTask: require_task_registry_store_sqlite.deleteTaskRegistryRecordFromSqlite,
	upsertDeliveryState: require_task_registry_store_sqlite.upsertTaskDeliveryStateToSqlite,
	deleteDeliveryState: require_task_registry_store_sqlite.deleteTaskDeliveryStateFromSqlite,
	close: require_task_registry_store_sqlite.closeTaskRegistryDatabase
};
let configuredTaskRegistryStore = defaultTaskRegistryStore;
let configuredTaskRegistryObservers = null;
function getTaskRegistryStore() {
	return configuredTaskRegistryStore;
}
function getTaskRegistryObservers() {
	return configuredTaskRegistryObservers;
}
function configureTaskRegistryRuntime(params) {
	if (params.store) configuredTaskRegistryStore = params.store;
	if ("observers" in params) configuredTaskRegistryObservers = params.observers ?? null;
}
function resetTaskRegistryRuntimeForTests() {
	configuredTaskRegistryStore.close?.();
	configuredTaskRegistryStore = defaultTaskRegistryStore;
	configuredTaskRegistryObservers = null;
}
//#endregion
Object.defineProperty(exports, "getTaskRegistryObservers", {
	enumerable: true,
	get: function() {
		return getTaskRegistryObservers;
	}
});
Object.defineProperty(exports, "getTaskRegistryStore", {
	enumerable: true,
	get: function() {
		return getTaskRegistryStore;
	}
});
Object.defineProperty(exports, "resetTaskRegistryRuntimeForTests", {
	enumerable: true,
	get: function() {
		return resetTaskRegistryRuntimeForTests;
	}
});
Object.defineProperty(exports, "task_registry_store_exports", {
	enumerable: true,
	get: function() {
		return task_registry_store_exports;
	}
});
