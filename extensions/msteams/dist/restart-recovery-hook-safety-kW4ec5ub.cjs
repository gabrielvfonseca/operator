const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
//#region src/plugins/restart-recovery-hook-safety.ts
const RESTART_RECOVERY_UNSAFE_REPLY_HOOKS = [
	"before_dispatch",
	"before_agent_reply",
	"before_agent_run",
	"before_message_write",
	"reply_dispatch"
];
const RESTART_RECOVERY_UNSAFE_CHAT_ADMISSION_HOOKS = [
	"before_dispatch",
	"before_agent_run",
	"before_message_write",
	"reply_dispatch"
];
function findRestartRecoveryUnsafeReplyHook() {
	return RESTART_RECOVERY_UNSAFE_REPLY_HOOKS.find((hookName) => require_hook_runner_global.hasGlobalHooks(hookName));
}
/** Initial chat admission defers before_agent_reply until after its durable checkpoint. */
function findRestartRecoveryUnsafeChatAdmissionHook() {
	return RESTART_RECOVERY_UNSAFE_CHAT_ADMISSION_HOOKS.find((hookName) => require_hook_runner_global.hasGlobalHooks(hookName));
}
//#endregion
Object.defineProperty(exports, "findRestartRecoveryUnsafeChatAdmissionHook", {
	enumerable: true,
	get: function() {
		return findRestartRecoveryUnsafeChatAdmissionHook;
	}
});
Object.defineProperty(exports, "findRestartRecoveryUnsafeReplyHook", {
	enumerable: true,
	get: function() {
		return findRestartRecoveryUnsafeReplyHook;
	}
});
