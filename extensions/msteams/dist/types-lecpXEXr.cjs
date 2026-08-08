//#region src/plugins/hook-types.ts
const PLUGIN_HOOK_NAMES = [
	"before_model_resolve",
	"agent_turn_prepare",
	"before_prompt_build",
	"before_agent_start",
	"before_agent_reply",
	"model_call_started",
	"model_call_ended",
	"llm_input",
	"llm_output",
	"before_agent_finalize",
	"agent_end",
	"before_compaction",
	"after_compaction",
	"before_reset",
	"inbound_claim",
	"channel_pairing_requested",
	"message_received",
	"message_sending",
	"reply_payload_sending",
	"message_sent",
	"before_tool_call",
	"after_tool_call",
	"tool_result_persist",
	"before_message_write",
	"session_start",
	"session_end",
	"subagent_spawning",
	"subagent_delivery_target",
	"subagent_spawned",
	"subagent_ended",
	"deactivate",
	"gateway_start",
	"gateway_stop",
	"heartbeat_prompt_contribution",
	"cron_reconciled",
	"cron_changed",
	"before_dispatch",
	"reply_dispatch",
	"before_install",
	"before_agent_run",
	"resolve_exec_env"
];
const DEPRECATED_PLUGIN_HOOKS = {
	subagent_spawning: {
		replacement: "`subagent_spawned` for observation; core session bindings for routing",
		reason: "Core prepares thread-bound subagent bindings through channel session-binding adapters before `subagent_spawned` fires.",
		removeAfter: "2026-08-30"
	},
	deactivate: {
		replacement: "`gateway_stop`",
		reason: "`deactivate` is a legacy cleanup hook alias for `gateway_stop`.",
		removeAfter: "2026-08-16"
	}
};
const DEPRECATED_PLUGIN_HOOK_NAMES = Object.keys(DEPRECATED_PLUGIN_HOOKS);
const deprecatedPluginHookNameSet = new Set(DEPRECATED_PLUGIN_HOOK_NAMES);
const isDeprecatedPluginHookName = (hookName) => deprecatedPluginHookNameSet.has(hookName);
const pluginHookNameSet = new Set(PLUGIN_HOOK_NAMES);
const isPluginHookName = (hookName) => typeof hookName === "string" && pluginHookNameSet.has(hookName);
const promptInjectionHookNameSet = /* @__PURE__ */ new Set([
	"agent_turn_prepare",
	"before_prompt_build",
	"before_agent_start",
	"heartbeat_prompt_contribution"
]);
const isPromptInjectionHookName = (hookName) => promptInjectionHookNameSet.has(hookName);
const conversationHookNameSet = /* @__PURE__ */ new Set([
	"before_model_resolve",
	"before_agent_reply",
	"llm_input",
	"llm_output",
	"before_agent_finalize",
	"agent_end",
	"before_agent_run"
]);
const isConversationHookName = (hookName) => conversationHookNameSet.has(hookName);
//#endregion
Object.defineProperty(exports, "DEPRECATED_PLUGIN_HOOKS", {
	enumerable: true,
	get: function() {
		return DEPRECATED_PLUGIN_HOOKS;
	}
});
Object.defineProperty(exports, "isConversationHookName", {
	enumerable: true,
	get: function() {
		return isConversationHookName;
	}
});
Object.defineProperty(exports, "isDeprecatedPluginHookName", {
	enumerable: true,
	get: function() {
		return isDeprecatedPluginHookName;
	}
});
Object.defineProperty(exports, "isPluginHookName", {
	enumerable: true,
	get: function() {
		return isPluginHookName;
	}
});
Object.defineProperty(exports, "isPromptInjectionHookName", {
	enumerable: true,
	get: function() {
		return isPromptInjectionHookName;
	}
});
