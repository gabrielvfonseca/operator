const require_kill_tree = require("./kill-tree-BxZeSfim.cjs");
//#region src/process/child-process-tree.ts
function shouldDetachChildForProcessTree() {
	return process.platform !== "win32";
}
function signalChildProcessTree(child, signal) {
	if (typeof child.pid === "number" && child.pid > 0) {
		require_kill_tree.signalProcessTree(child.pid, signal, { detached: shouldDetachChildForProcessTree() });
		return;
	}
	child.kill(signal);
}
function forceKillChildProcessTree(child) {
	signalChildProcessTree(child, "SIGKILL");
}
//#endregion
Object.defineProperty(exports, "forceKillChildProcessTree", {
	enumerable: true,
	get: function() {
		return forceKillChildProcessTree;
	}
});
Object.defineProperty(exports, "shouldDetachChildForProcessTree", {
	enumerable: true,
	get: function() {
		return shouldDetachChildForProcessTree;
	}
});
Object.defineProperty(exports, "signalChildProcessTree", {
	enumerable: true,
	get: function() {
		return signalChildProcessTree;
	}
});
