//#region src/tasks/detached-task-runtime-state.ts
let detachedTaskLifecycleRuntimeRegistration;
/** Registers the active detached task lifecycle runtime implementation. */
function registerDetachedTaskLifecycleRuntime(pluginId, runtime) {
	detachedTaskLifecycleRuntimeRegistration = {
		pluginId,
		runtime
	};
}
function getDetachedTaskLifecycleRuntimeRegistration() {
	if (!detachedTaskLifecycleRuntimeRegistration) return;
	return {
		pluginId: detachedTaskLifecycleRuntimeRegistration.pluginId,
		runtime: detachedTaskLifecycleRuntimeRegistration.runtime
	};
}
function getRegisteredDetachedTaskLifecycleRuntime() {
	return detachedTaskLifecycleRuntimeRegistration?.runtime;
}
function restoreDetachedTaskLifecycleRuntimeRegistration(registration) {
	detachedTaskLifecycleRuntimeRegistration = registration ? {
		pluginId: registration.pluginId,
		runtime: registration.runtime
	} : void 0;
}
function clearDetachedTaskLifecycleRuntimeRegistration() {
	detachedTaskLifecycleRuntimeRegistration = void 0;
}
//#endregion
Object.defineProperty(exports, "clearDetachedTaskLifecycleRuntimeRegistration", {
	enumerable: true,
	get: function() {
		return clearDetachedTaskLifecycleRuntimeRegistration;
	}
});
Object.defineProperty(exports, "getDetachedTaskLifecycleRuntimeRegistration", {
	enumerable: true,
	get: function() {
		return getDetachedTaskLifecycleRuntimeRegistration;
	}
});
Object.defineProperty(exports, "getRegisteredDetachedTaskLifecycleRuntime", {
	enumerable: true,
	get: function() {
		return getRegisteredDetachedTaskLifecycleRuntime;
	}
});
Object.defineProperty(exports, "registerDetachedTaskLifecycleRuntime", {
	enumerable: true,
	get: function() {
		return registerDetachedTaskLifecycleRuntime;
	}
});
Object.defineProperty(exports, "restoreDetachedTaskLifecycleRuntimeRegistration", {
	enumerable: true,
	get: function() {
		return restoreDetachedTaskLifecycleRuntimeRegistration;
	}
});
