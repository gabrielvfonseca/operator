import type { AgentToolResult } from "../agents/runtime/index.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
// Memory tool factories for agent-facing surfaces.
import type { MemoryOrchestrator } from "./orchestrator.js";

export type MemoryToolContext = {
  orchestrator: MemoryOrchestrator;
  agentId: string;
  sessionId?: string;
};

function asToolResult<T>(details: T): AgentToolResult<T> {
  return { content: [], details };
}

export function createMemorySearchTool(ctx: MemoryToolContext): AnyAgentTool {
  return {
    name: "memory_search",
    label: "Memory Search",
    description: "Search episodic and semantic memory for relevant context.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        limit: { type: "number", description: "Maximum results to return", default: 10 },
      },
      required: ["query"],
    } as any,
    async execute(_toolCallId, _params, _signal, _onUpdate) {
      const params = _params as Record<string, unknown>;
      const query = String(params.query ?? "");
      const limit = Number(params.limit ?? 10);
      const episodic = await ctx.orchestrator.episodic.queryEvents({
        agentId: ctx.agentId,
        sessionId: ctx.sessionId,
        limit,
      });
      const semantic = await ctx.orchestrator.semantic.query({
        agentId: ctx.agentId,
        queryText: query,
        limit,
      });
      return asToolResult({
        episodic: episodic.map((e) => ({
          id: `${e.sessionId}:${e.occurredAt.getTime()}`,
          type: e.eventType,
          occurredAt: e.occurredAt,
          payload: e.payload,
        })),
        semantic: semantic.map((s) => ({
          id: s.id,
          score: s.score,
          text: s.text,
          metadata: s.metadata,
        })),
      });
    },
  } as AnyAgentTool;
}

export function createMemoryGetTool(ctx: MemoryToolContext): AnyAgentTool {
  return {
    name: "memory_get",
    label: "Memory Get",
    description: "Fetch a specific memory chunk or event by id.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Memory chunk or event id" },
      },
      required: ["id"],
    } as any,
    async execute(_toolCallId, _params, _signal, _onUpdate) {
      const params = _params as Record<string, unknown>;
      const id = String(params.id ?? "");
      return asToolResult({ id, source: "memory", content: null });
    },
  } as AnyAgentTool;
}

export function createProcedureRecallTool(ctx: MemoryToolContext): AnyAgentTool {
  return {
    name: "procedure_recall",
    label: "Procedure Recall",
    description: "Find reusable procedures from procedural memory by tags or description.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or tag list" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
        limit: { type: "number", description: "Maximum results", default: 10 },
      },
      required: ["query"],
    } as any,
    async execute(_toolCallId, _params, _signal, _onUpdate) {
      const params = _params as Record<string, unknown>;
      const query = String(params.query ?? "");
      const tags = Array.isArray(params.tags) ? params.tags.map(String) : [];
      const limit = Number(params.limit ?? 10);
      const procedures = await ctx.orchestrator.procedural.queryProcedures({
        agentId: ctx.agentId,
        tags: tags.length ? tags : undefined,
        queryText: query,
        limit,
      });
      return asToolResult({
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
  } as AnyAgentTool;
}

export function createProcedureExecuteTool(ctx: MemoryToolContext): AnyAgentTool {
  return {
    name: "procedure_execute",
    label: "Procedure Execute",
    description: "Execute a stored procedural workflow by id.",
    parameters: {
      type: "object",
      properties: {
        procedureId: { type: "string", description: "Procedure id to execute" },
        input: { type: "object", description: "Workflow input payload" },
      },
      required: ["procedureId", "input"],
    } as any,
    async execute(_toolCallId, _params, _signal, _onUpdate) {
      const params = _params as Record<string, unknown>;
      const procedureId = String(params.procedureId ?? "");
      const input = params.input ?? {};
      const result = await ctx.orchestrator.procedural.executeProcedure({
        procedureId,
        input,
        agentId: ctx.agentId,
        sessionId: ctx.sessionId,
      });
      return asToolResult(result);
    },
  } as AnyAgentTool;
}

export function buildMemoryTools(
  orchestrator: MemoryOrchestrator,
  agentId: string,
  sessionId?: string,
): AnyAgentTool[] {
  const ctx: MemoryToolContext = { orchestrator, agentId, sessionId };
  return [
    createMemorySearchTool(ctx),
    createMemoryGetTool(ctx),
    createProcedureRecallTool(ctx),
    createProcedureExecuteTool(ctx),
  ];
}
