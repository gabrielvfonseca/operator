import type { MemorySubsystemConfig } from "./config.js";
import { createEpisodicClient, type EpisodicClient } from "./episodic.js";
import { createProceduralClient, type ProceduralClient } from "./procedural.js";
import { createSemanticClient, type SemanticClient } from "./semantic.js";
// Unified memory orchestrator facade.
import { createWorkingMemoryClient, type WorkingMemoryClient } from "./working-memory.js";

export type MemoryOrchestrator = {
  working: WorkingMemoryClient;
  episodic: EpisodicClient;
  semantic: SemanticClient;
  procedural: ProceduralClient;
};

export function createMemoryOrchestrator(config: MemorySubsystemConfig): MemoryOrchestrator {
  if (!config.enabled) {
    return {
      working: createNoopWorkingClient(),
      episodic: createNoopEpisodicClient(),
      semantic: createNoopSemanticClient(),
      procedural: createNoopProceduralClient(),
    };
  }
  return {
    working: createWorkingMemoryClient(config.working),
    episodic: createEpisodicClient(config.episodic),
    semantic: createSemanticClient(config.semantic),
    procedural: createProceduralClient(config.procedural),
  };
}

function createNoopWorkingClient(): WorkingMemoryClient {
  return {
    async set() {},
    async get() {
      return null;
    },
    async del() {},
    async delByPrefix() {},
    async ttl() {
      return -1;
    },
    async exists() {
      return false;
    },
  };
}

function createNoopEpisodicClient(): EpisodicClient {
  return {
    async appendEvent() {
      return "";
    },
    async appendChunk() {
      return "";
    },
    async queryEvents() {
      return [];
    },
    async queryChunks() {
      return [];
    },
  };
}

function createNoopSemanticClient(): SemanticClient {
  return {
    async upsertChunk() {
      return "";
    },
    async deleteChunk() {},
    async query() {
      return [];
    },
  };
}

function createNoopProceduralClient(): ProceduralClient {
  return {
    async registerProcedure() {
      return "";
    },
    async getProcedure() {
      return null;
    },
    async queryProcedures() {
      return [];
    },
    async executeProcedure() {
      return { workflowRunId: "", status: "unavailable" };
    },
  };
}
