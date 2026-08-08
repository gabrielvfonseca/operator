const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
//#region src/infra/remote-env.ts
function isRemoteEnvironment() {
	if (process.env.SSH_CLIENT || process.env.SSH_TTY || process.env.SSH_CONNECTION) return true;
	if (process.env.REMOTE_CONTAINERS || process.env.CODESPACES) return true;
	if (process.platform === "linux" && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY && !require_undici_global_dispatcher.isWSLEnv()) return true;
	return false;
}
//#endregion
Object.defineProperty(exports, "isRemoteEnvironment", {
	enumerable: true,
	get: function() {
		return isRemoteEnvironment;
	}
});
