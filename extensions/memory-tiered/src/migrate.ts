// Migration of legacy Markdown memory (MEMORY.md + memory/*.md) into
// semantic memory. Idempotent: best-effort, skips files that fail to embed.
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MemoryTieredPluginConfig } from "./config.js";
import { createEmbedder } from "./embedding.js";
import { createSemanticClient } from "./semantic.js";

export type MigrateResult = {
  filesScanned: number;
  chunksStored: number;
  errors: Array<{ file: string; error: string }>;
};

function resolveWorkspaceDir(): string {
  return join(homedir(), ".openclaw", "workspace");
}

function splitMarkdownChunks(text: string): string[] {
  // Split on blank-line-separated paragraphs and headings; skip very short lines.
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length >= 24);
}

export async function migrateMarkdownToSemantic(params: {
  pluginConfig: MemoryTieredPluginConfig;
  getConfig: () => OpenClawConfig | undefined;
  workspaceDir?: string;
}): Promise<MigrateResult> {
  const result: MigrateResult = { filesScanned: 0, chunksStored: 0, errors: [] };
  const workspaceDir = params.workspaceDir ?? resolveWorkspaceDir();
  const embedder = createEmbedder(params.pluginConfig, params.getConfig);
  const semantic = createSemanticClient(params.pluginConfig.semantic, embedder);
  const agentId = "main";

  const candidates: string[] = [];
  try {
    const memoryDir = join(workspaceDir, "memory");
    const rootMemory = join(workspaceDir, "MEMORY.md");
    try {
      await fs.access(rootMemory);
      candidates.push(rootMemory);
    } catch {
      // absent is fine
    }
    try {
      const entries = await fs.readdir(memoryDir);
      for (const entry of entries.sort()) {
        if (entry.endsWith(".md")) {
          candidates.push(join(memoryDir, entry));
        }
      }
    } catch {
      // no memory dir
    }
  } catch (err) {
    result.errors.push({ file: workspaceDir, error: String(err) });
    return result;
  }

  for (const file of candidates) {
    result.filesScanned += 1;
    try {
      const text = await fs.readFile(file, "utf8");
      for (const chunk of splitMarkdownChunks(text)) {
        await semantic.upsertChunk({
          agentId,
          sourceType: "migration:markdown",
          sourcePath: file,
          text: chunk,
          metadata: { migratedFrom: file },
        });
        result.chunksStored += 1;
      }
    } catch (err) {
      result.errors.push({ file, error: String(err) });
    }
  }
  return result;
}
