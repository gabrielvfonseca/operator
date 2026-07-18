// Migration helpers for importing legacy skill data into procedural memory.
import type { MemorySubsystemConfig } from "./config.js";
import type { ProceduralClient } from "./procedural.js";

export type SkillImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ path: string; error: string }>;
};

export async function importWorkspaceSkillsToProcedural(params: {
  config: MemorySubsystemConfig;
  procedural: ProceduralClient;
  workspaceDir: string;
}): Promise<SkillImportResult> {
  const result: SkillImportResult = { imported: 0, skipped: 0, errors: [] };
  // Stub implementation: in a full build this would scan legacy skill directories,
  // extract descriptions/tags from SKILL.md frontmatter, and register them as procedures.
  void params.config;
  void params.procedural;
  void params.workspaceDir;
  return result;
}
