/**
 * Static identity for names that select core agent factory families before assembly.
 */

export type CoreToolFactoryFamily = "base-coding" | "shell" | "@gabrielvfonseca/operator";

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
  { name: "agents_list", family: "@gabrielvfonseca/operator" },
  { name: "@gabrielvfonseca/operator", family: "@gabrielvfonseca/operator" },
  { name: "computer", family: "@gabrielvfonseca/operator" },
  { name: "cron", family: "@gabrielvfonseca/operator" },
  { name: "gateway", family: "@gabrielvfonseca/operator" },
  { name: "get_goal", family: "@gabrielvfonseca/operator" },
  { name: "heartbeat_respond", family: "@gabrielvfonseca/operator" },
  { name: "image", family: "@gabrielvfonseca/operator" },
  { name: "image_generate", family: "@gabrielvfonseca/operator" },
  { name: "message", family: "@gabrielvfonseca/operator" },
  { name: "music_generate", family: "@gabrielvfonseca/operator" },
  { name: "nodes", family: "@gabrielvfonseca/operator" },
  { name: "pdf", family: "@gabrielvfonseca/operator" },
  { name: "session_status", family: "@gabrielvfonseca/operator" },
  { name: "sessions", family: "@gabrielvfonseca/operator" },
  { name: "sessions_history", family: "@gabrielvfonseca/operator" },
  { name: "sessions_list", family: "@gabrielvfonseca/operator" },
  { name: "sessions_search", family: "@gabrielvfonseca/operator" },
  { name: "sessions_send", family: "@gabrielvfonseca/operator" },
  { name: "sessions_spawn", family: "@gabrielvfonseca/operator" },
  { name: "sessions_yield", family: "@gabrielvfonseca/operator" },
  { name: "skill_workshop", family: "@gabrielvfonseca/operator" },
  { name: "spawn_task", family: "@gabrielvfonseca/operator" },
  { name: "create_goal", family: "@gabrielvfonseca/operator" },
  { name: "subagents", family: "@gabrielvfonseca/operator" },
  { name: "transcripts", family: "@gabrielvfonseca/operator" },
  { name: "tts", family: "@gabrielvfonseca/operator" },
  { name: "update_goal", family: "@gabrielvfonseca/operator" },
  { name: "update_plan", family: "@gabrielvfonseca/operator" },
  { name: "dismiss_task", family: "@gabrielvfonseca/operator" },
  { name: "video_generate", family: "@gabrielvfonseca/operator" },
  { name: "web_fetch", family: "@gabrielvfonseca/operator" },
  { name: "web_search", family: "@gabrielvfonseca/operator" },
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
