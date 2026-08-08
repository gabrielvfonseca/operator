const require_runtime_state_key = require("./runtime-state-key-DcNuimnV.cjs");
//#region src/plugins/runtime-channel-state.ts
let activePluginChannelRegistrySnapshot;
function countChannels(registry) {
	return registry?.channels?.length ?? 0;
}
/** Returns a cached channel registry snapshot, preferring pinned channel state when populated. */
function getActivePluginChannelRegistrySnapshotFromState() {
	const state = globalThis[require_runtime_state_key.PLUGIN_REGISTRY_STATE];
	const pinnedRegistry = state?.channel?.registry ?? null;
	const activeRegistry = state?.activeRegistry ?? null;
	const pinnedChannelCount = countChannels(pinnedRegistry);
	const activeChannelCount = countChannels(activeRegistry);
	const selectedPinnedRegistry = pinnedChannelCount > 0 || pinnedRegistry !== null && activeChannelCount === 0;
	const version = selectedPinnedRegistry ? state?.channel?.version ?? 0 : state?.activeVersion ?? 0;
	const cached = activePluginChannelRegistrySnapshot;
	if (cached && cached.state === state && cached.pinnedRegistry === pinnedRegistry && cached.activeRegistry === activeRegistry && cached.pinnedChannelCount === pinnedChannelCount && cached.activeChannelCount === activeChannelCount && cached.snapshot.version === version) return cached.snapshot;
	const snapshot = {
		registry: selectedPinnedRegistry ? pinnedRegistry : activeRegistry,
		version
	};
	activePluginChannelRegistrySnapshot = {
		state,
		pinnedRegistry,
		activeRegistry,
		pinnedChannelCount,
		activeChannelCount,
		snapshot
	};
	return snapshot;
}
/** Returns the active plugin channel registry from global runtime state. */
function getActivePluginChannelRegistryFromState() {
	return getActivePluginChannelRegistrySnapshotFromState().registry;
}
/** Returns the active plugin channel registry version from global runtime state. */
function getActivePluginChannelRegistryVersionFromState() {
	return getActivePluginChannelRegistrySnapshotFromState().version;
}
//#endregion
Object.defineProperty(exports, "getActivePluginChannelRegistryFromState", {
	enumerable: true,
	get: function() {
		return getActivePluginChannelRegistryFromState;
	}
});
Object.defineProperty(exports, "getActivePluginChannelRegistrySnapshotFromState", {
	enumerable: true,
	get: function() {
		return getActivePluginChannelRegistrySnapshotFromState;
	}
});
Object.defineProperty(exports, "getActivePluginChannelRegistryVersionFromState", {
	enumerable: true,
	get: function() {
		return getActivePluginChannelRegistryVersionFromState;
	}
});
