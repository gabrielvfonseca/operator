// Neo4j + Temporal procedural memory client for reusable procedures.
import type { MemorySubsystemConfig } from "./types.js";

export type ProcedureNode = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  version: string;
  workflowId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProcedureQuery = {
  agentId?: string;
  tags?: string[];
  queryText?: string;
  limit?: number;
};

export type ProcedureExecuteInput = {
  procedureId: string;
  input: unknown;
  agentId: string;
  sessionId?: string;
};

export type ProcedureExecuteResult = {
  workflowRunId: string;
  status: "started" | "already_running" | "unavailable";
};

export type ProceduralClient = {
  registerProcedure(
    procedure: Omit<ProcedureNode, "id" | "createdAt" | "updatedAt">,
  ): Promise<string>;
  getProcedure(id: string): Promise<ProcedureNode | null>;
  queryProcedures(q: ProcedureQuery): Promise<ProcedureNode[]>;
  executeProcedure(params: ProcedureExecuteInput): Promise<ProcedureExecuteResult>;
};

export function createProceduralClient(
  config: MemorySubsystemConfig["procedural"],
): ProceduralClient {
  let neo4j: {
    query: (
      cypher: string,
      params?: Record<string, unknown>,
    ) => Promise<{ records: Array<{ toObject: () => Record<string, unknown> }> }>;
  } | null = null;
  let temporal: {
    connect: () => Promise<void>;
    start: (params: {
      workflowId: string;
      taskQueue: string;
      args: unknown[];
    }) => Promise<{ runId: string }>;
  } | null = null;

  async function ensureNeo4j() {
    if (neo4j) return neo4j;
    try {
      const mod: any = await import("neo4j-driver");
      const driver = mod.driver(
        config.neo4jUrl ?? "bolt://localhost:7687",
        mod.auth.basic("neo4j", "neo4j"),
      );
      const session = driver.session();
      await session.run("RETURN 1");
      neo4j = session;
      return neo4j;
    } catch {
      return null;
    }
  }

  async function ensureTemporal() {
    if (temporal) return temporal;
    try {
      const { TemporalClient }: any = await import("@temporalio/client");
      const client = new TemporalClient({
        address: `${config.temporalHost ?? "localhost"}:${config.temporalPort ?? 7233}`,
        namespace: config.temporalNamespace ?? "default",
      });
      await client.connect();
      temporal = client;
      return temporal;
    } catch {
      return null;
    }
  }

  return {
    async registerProcedure(procedure) {
      const db = await ensureNeo4j();
      if (!db) throw new Error("procedural store unavailable");
      const id =
        procedure.workflowId ?? `proc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();
      await db.query(
        `MERGE (p:Procedure {id: $id}) SET p.name = $name, p.description = $description, p.tags = $tags, p.inputSchema = $inputSchema, p.outputSchema = $outputSchema, p.version = $version, p.workflowId = $workflowId, p.updatedAt = $updatedAt, p.createdAt = coalesce(p.createdAt, $updatedAt)`,
        {
          id,
          name: procedure.name,
          description: procedure.description,
          tags: procedure.tags,
          inputSchema: procedure.inputSchema ?? {},
          outputSchema: procedure.outputSchema ?? {},
          version: procedure.version,
          workflowId: procedure.workflowId ?? null,
          updatedAt: now,
          createdAt: now,
        },
      );
      for (const tag of procedure.tags) {
        await db.query(`MERGE (t:Tag {name: $tag}) MERGE (p)-[:TAGGED]->(t) WHERE p.id = $id`, {
          tag,
          id,
        });
      }
      return id;
    },
    async getProcedure(id) {
      const db = await ensureNeo4j();
      if (!db) return null;
      const res = await db.query(`MATCH (p:Procedure {id: $id}) RETURN p`, { id });
      const record = res.records[0];
      if (!record) return null;
      const p = record.toObject().p as Record<string, unknown>;
      return {
        id: String(p.id),
        name: String(p.name),
        description: String(p.description),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        inputSchema: p.inputSchema as Record<string, unknown> | undefined,
        outputSchema: p.outputSchema as Record<string, unknown> | undefined,
        version: String(p.version),
        workflowId: p.workflowId ? String(p.workflowId) : undefined,
        createdAt: new Date(String(p.createdAt)),
        updatedAt: new Date(String(p.updatedAt)),
      };
    },
    async queryProcedures(q) {
      const db = await ensureNeo4j();
      if (!db) return [];
      const clauses: string[] = [];
      const params: Record<string, unknown> = {};
      if (q.agentId) {
        clauses.push(`p.agentId = $agentId`);
        params.agentId = q.agentId;
      }
      if (q.tags?.length) {
        clauses.push(`ANY(tag IN $tags WHERE tag IN p.tags)`);
        params.tags = q.tags;
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = q.limit ?? 50;
      const res = await db.query(
        `MATCH (p:Procedure) ${where} RETURN p ORDER BY p.updatedAt DESC LIMIT ${limit}`,
        params,
      );
      return res.records.map((record) => {
        const p = record.toObject().p as Record<string, unknown>;
        return {
          id: String(p.id),
          name: String(p.name),
          description: String(p.description),
          tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
          inputSchema: p.inputSchema as Record<string, unknown> | undefined,
          outputSchema: p.outputSchema as Record<string, unknown> | undefined,
          version: String(p.version),
          workflowId: p.workflowId ? String(p.workflowId) : undefined,
          createdAt: new Date(String(p.createdAt)),
          updatedAt: new Date(String(p.updatedAt)),
        };
      });
    },
    async executeProcedure(params) {
      const t = await ensureTemporal();
      if (!t) return { workflowRunId: "", status: "unavailable" };
      const proc = await this.getProcedure(params.procedureId);
      if (!proc) return { workflowRunId: "", status: "unavailable" };
      if (!proc.workflowId) return { workflowRunId: "", status: "unavailable" };
      try {
        const run = await t.start({
          workflowId: `${proc.workflowId}:${params.sessionId ?? params.agentId}`,
          taskQueue: "memory-procedural",
          args: [params.input],
        });
        return { workflowRunId: run.runId, status: "started" };
      } catch (err) {
        const msg = String(err);
        if (msg.includes("already running")) {
          return { workflowRunId: "", status: "already_running" };
        }
        return { workflowRunId: "", status: "unavailable" };
      }
    },
  };
}
