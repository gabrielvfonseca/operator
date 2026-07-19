/**
 * Static identity for names that select core agent factory families before assembly.
 */

export type CoreToolFactoryFamily = "base-coding" | "shell" | "operator";

type CoreToolFactoryDescriptor = {
  name: string;
  family: CoreToolFactoryFamily;
};

const CORE_TOOL_FACTORY_DESCRIPTORS = [
  { name: "edit", family: "base-coding" },
  { name: "read", family: "base-coding" },
  { name: "write", family: "base-coding" },
  { name: "apply_patch", family: "shell" },
  { name: "exec", family: "shell" },
  { name: "process", family: "shell" },
  { name: "agents_list", family: "operator" },
  { name: "operator", family: "operator" },
  { name: "computer", family: "operator" },
  { name: "cron", family: "operator" },
  { name: "gateway", family: "operator" },
  { name: "get_goal", family: "operator" },
  { name: "heartbeat_respond", family: "operator" },
  { name: "image", family: "operator" },
  { name: "image_generate", family: "operator" },
  { name: "message", family: "operator" },
  { name: "music_generate", family: "operator" },
  { name: "nodes", family: "operator" },
  { name: "pdf", family: "operator" },
  { name: "session_status", family: "operator" },
  { name: "sessions", family: "operator" },
  { name: "sessions_history", family: "operator" },
  { name: "sessions_list", family: "operator" },
  { name: "sessions_search", family: "operator" },
  { name: "sessions_send", family: "operator" },
  { name: "sessions_spawn", family: "operator" },
  { name: "sessions_yield", family: "operator" },
  { name: "skill_workshop", family: "operator" },
  { name: "spawn_task", family: "operator" },
  { name: "create_goal", family: "operator" },
  { name: "subagents", family: "operator" },
  { name: "transcripts", family: "operator" },
  { name: "tts", family: "operator" },
  { name: "update_goal", family: "operator" },
  { name: "update_plan", family: "operator" },
  { name: "dismiss_task", family: "operator" },
  { name: "video_generate", family: "operator" },
  { name: "web_fetch", family: "operator" },
  { name: "web_search", family: "operator" },
] as const satisfies readonly CoreToolFactoryDescriptor[];

const CORE_TOOL_FACTORY_FAMILY_BY_NAME = new Map<string, CoreToolFactoryFamily>(
  CORE_TOOL_FACTORY_DESCRIPTORS.map(({ name, family }) => [name, family]),
);

export type OperatorCodingToolConstructionPlan = {
  includeBaseCodingTools: boolean;
  includeShellTools: boolean;
  includeChannelTools: boolean;
  includeOperatorTools: boolean;
  includePluginTools: boolean;
};

export function resolveCoreToolFactoryFamily(name: string): CoreToolFactoryFamily | undefined {
  return CORE_TOOL_FACTORY_FAMILY_BY_NAME.get(name);
}
