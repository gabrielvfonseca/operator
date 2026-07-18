// Agent-facing memory tools for the tiered memory plugin.
import type { AgentToolResult } from "openclaw/plugin-sdk/agent-core";
import type { ProceduralClient } from "./procedural.js";
import type { SemanticClient } from "./semantic.js";
import type { WorkingMemoryClient } from "./working.js";

export type MemoryToolContext = {
  agentId: string;
  sessionId?: string;
  working: WorkingMemoryClient;
  semantic: SemanticClient;
  procedural: ProceduralClient;
};

function result<T>(details: T): AgentToolResult<T> {
  return { content: [], details };
}

export function createMemorySetTool(ctx: MemoryToolContext) {
  return {
    name: "memory_set",
    label: "Memory Set",
    description:
      "Write or update a short-lived working-memory entry with an optional TTL (seconds).",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Working-memory key" },
        value: { description: "Arbitrary JSON-serializable value" },
        ttlSeconds: { type: "number", description: "Optional TTL in seconds" },
      },
      required: ["key", "value"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const key = String(params.key ?? "");
      if (!key) return result({ ok: false, error: "key required" });
      await ctx.working.set({
        key,
        value: params.value,
        ...(typeof params.ttlSeconds === "number" ? { ttlSeconds: params.ttlSeconds } : {}),
      });
      return result({ ok: true, key });
    },
  };
}

export function createMemoryGetTool(ctx: MemoryToolContext) {
  return {
    name: "memory_get",
    label: "Memory Get",
    description: "Read a working-memory entry by key.",
    parameters: {
      type: "object",
      properties: { key: { type: "string", description: "Working-memory key" } },
      required: ["key"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const key = String(params.key ?? "");
      if (!key) return result({ key, value: null });
      const value = await ctx.working.get(key);
      return result({ key, value });
    },
  };
}

export function createMemoryDeleteTool(ctx: MemoryToolContext) {
  return {
    name: "memory_delete",
    label: "Memory Delete",
    description: "Delete a working-memory entry by key, or a prefix of keys with `prefix`.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Exact key to delete" },
        prefix: { type: "string", description: "Key prefix to delete" },
      },
      required: [],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      if (typeof params.key === "string" && params.key) {
        await ctx.working.del(params.key);
        return result({ ok: true, deleted: [params.key] });
      }
      if (typeof params.prefix === "string" && params.prefix) {
        await ctx.working.delByPrefix(params.prefix);
        return result({ ok: true, deletedPrefix: params.prefix });
      }
      return result({ ok: false, error: "provide key or prefix" });
    },
  };
}

export function createMemoryStoreTool(ctx: MemoryToolContext) {
  return {
    name: "memory_store",
    label: "Memory Store",
    description:
      "Persist a durable semantic fact/concept with an embedding (vector) for later similarity search.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "The fact or concept to remember" },
        sourceType: { type: "string", description: "Optional source category" },
        sourcePath: { type: "string", description: "Optional source path/identifier" },
        metadata: { type: "object", description: "Optional structured metadata" },
      },
      required: ["text"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const text = String(params.text ?? "");
      if (!text) return result({ ok: false, error: "text required" });
      const id = await ctx.semantic.upsertChunk({
        agentId: ctx.agentId,
        sourceType: typeof params.sourceType === "string" ? params.sourceType : "fact",
        sourcePath: typeof params.sourcePath === "string" ? params.sourcePath : undefined,
        text,
        ...(params.metadata && typeof params.metadata === "object"
          ? { metadata: params.metadata as Record<string, unknown> }
          : {}),
      });
      return result({ ok: true, id });
    },
  };
}

export function createMemorySearchTool(ctx: MemoryToolContext) {
  return {
    name: "memory_search",
    label: "Memory Search",
    description:
      "Semantic similarity search over stored durable memory. Returns ranked matches with scores.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language query" },
        limit: { type: "number", description: "Max results", default: 10 },
        minScore: { type: "number", description: "Minimum similarity score" },
        sourceType: { type: "string", description: "Optional source-type filter" },
      },
      required: ["query"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const query = String(params.query ?? "");
      const limit = typeof params.limit === "number" ? params.limit : 10;
      const scoreThreshold = typeof params.minScore === "number" ? params.minScore : undefined;
      const results = await ctx.semantic.query({
        agentId: ctx.agentId,
        queryText: query,
        limit,
        ...(scoreThreshold !== undefined ? { scoreThreshold } : {}),
        ...(typeof params.sourceType === "string" ? { sourceType: params.sourceType } : {}),
      });
      return result({ count: results.length, results });
    },
  };
}

export function createMemoryForgetTool(ctx: MemoryToolContext) {
  return {
    name: "memory_forget",
    label: "Memory Forget",
    description: "Delete a stored semantic memory chunk by its id (from memory_search results).",
    parameters: {
      type: "object",
      properties: { id: { type: "string", description: "Chunk id to delete" } },
      required: ["id"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const id = String(params.id ?? "");
      if (!id) return result({ ok: false, error: "id required" });
      await ctx.semantic.deleteChunk(id);
      return result({ ok: true, id });
    },
  };
}

export function createProcedureRecallTool(ctx: MemoryToolContext) {
  return {
    name: "procedure_recall",
    label: "Procedure Recall",
    description: "Find reusable procedures from procedural memory by tags or description.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or description" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
        limit: { type: "number", description: "Max results", default: 10 },
      },
      required: ["query"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const query = String(params.query ?? "");
      const tags = Array.isArray(params.tags) ? params.tags.map(String) : [];
      const limit = typeof params.limit === "number" ? params.limit : 10;
      const procedures = await ctx.procedural.queryProcedures({
        agentId: ctx.agentId,
        ...(tags.length ? { tags } : {}),
        queryText: query,
        limit,
      });
      return result({
        procedures: procedures.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          version: p.version,
          tags: p.tags,
          workflowId: p.workflowId,
        })),
      });
    },
  };
}

export function createProcedureRegisterTool(ctx: MemoryToolContext) {
  return {
    name: "procedure_register",
    label: "Procedure Register",
    description:
      "Register a reusable procedure (workflow) in procedural memory for later recall and execution.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        version: { type: "string", default: "1.0.0" },
        workflowId: { type: "string", description: "Optional Temporal workflow id" },
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
      },
      required: ["name", "description"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const name = String(params.name ?? "");
      const description = String(params.description ?? "");
      if (!name || !description) {
        return result({ ok: false, error: "name and description required" });
      }
      const id = await ctx.procedural.registerProcedure({
        name,
        description,
        tags: Array.isArray(params.tags) ? params.tags.map(String) : [],
        version: typeof params.version === "string" ? params.version : "1.0.0",
        ...(typeof params.workflowId === "string" ? { workflowId: params.workflowId } : {}),
        ...(params.inputSchema && typeof params.inputSchema === "object"
          ? { inputSchema: params.inputSchema as Record<string, unknown> }
          : {}),
        ...(params.outputSchema && typeof params.outputSchema === "object"
          ? { outputSchema: params.outputSchema as Record<string, unknown> }
          : {}),
      });
      return result({ ok: true, id });
    },
  };
}

export function createProcedureExecuteTool(ctx: MemoryToolContext) {
  return {
    name: "procedure_execute",
    label: "Procedure Execute",
    description: "Execute a stored procedural workflow by id with the given input payload.",
    parameters: {
      type: "object",
      properties: {
        procedureId: { type: "string" },
        input: { description: "Workflow input payload" },
      },
      required: ["procedureId"],
    } as never,
    async execute(_id: string, params: Record<string, unknown>) {
      const procedureId = String(params.procedureId ?? "");
      if (!procedureId) return result({ ok: false, error: "procedureId required" });
      const result2 = await ctx.procedural.executeProcedure({
        procedureId,
        input: params.input ?? {},
        agentId: ctx.agentId,
        ...(ctx.sessionId ? { sessionId: ctx.sessionId } : {}),
      });
      return result({ ok: result2.status === "started", ...result2 });
    },
  };
}

export function buildMemoryTools(ctx: MemoryToolContext) {
  return [
    createMemorySetTool(ctx),
    createMemoryGetTool(ctx),
    createMemoryDeleteTool(ctx),
    createMemoryStoreTool(ctx),
    createMemorySearchTool(ctx),
    createMemoryForgetTool(ctx),
    createProcedureRecallTool(ctx),
    createProcedureRegisterTool(ctx),
    createProcedureExecuteTool(ctx),
  ];
}
