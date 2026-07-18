# Four-Tier Memory Refactor Plan

## Goal

Replace the existing single memory plugin slot and native `SKILL.md` system with a core-owned four-tier memory architecture: working memory, episodic memory, semantic memory, and procedural memory.

## Out of Scope

- Paid service recommendations or managed SaaS onboarding.
- New external plugin marketplace surface for memory backends.
- Immediate rewrite of all docs; only the directly affected user-facing surfaces are in scope.

## Decisions

1. Remove the native `SKILL.md` skill discovery system and migrate procedural memory to a structured store instead of markdown skill files.
2. Keep `memory_search` and `memory_get` as the stable agent-facing tools for episodic and semantic tiers.
3. Introduce `procedure_recall` and `procedure_execute` as the agent-facing tools for procedural memory.
4. Make the four-tier memory system core-owned runtime infrastructure, not a plugin-slot feature.

## Tier Mapping

| Tier              | Store             | Purpose                                                 | Primary Interface                       |
| ----------------- | ----------------- | ------------------------------------------------------- | --------------------------------------- |
| Working Memory    | Redis             | Short-lived run state, session scratch, working context | Internal runtime only                   |
| Episodic Memory   | PostgreSQL + Loki | Session transcripts, events, time-indexed recall        | `memory_search`, `memory_get`           |
| Semantic Memory   | Qdrant            | Embedded concepts, long-term facts, indexed chunks      | `memory_search`, `memory_get`           |
| Procedural Memory | Neo4j + Temporal  | Reusable procedures, workflows, execution history       | `procedure_recall`, `procedure_execute` |

## Observability Stack

- Prometheus metrics emitted from the memory subsystem.
- Loki logs for memory workflows and audit trails.
- Grafana dashboards for memory health, latency, and throughput.

## Removals

### Memory Plugins

- Deprecate and remove the `plugins.slots.memory` contract.
- Remove bundled/external memory plugin activation paths: `memory-core`, `memory-lancedb`.
- Remove `memory-runtime.ts`, `memory-state.ts`, `memory-embedding-provider-runtime.ts`, `memory-embedding-providers.ts`, and related registry/bridge code under `src/plugins/`.
- Update config validation to remove memory slot warnings/issues in `config.plugin-validation`.

### Native Skill System

- Remove workspace skill discovery roots: `workspace/skills/**`, `.plugin-skills/**`, bundled plugin `skills/**` for `SKILL.md`/`skill.md`/`skills.md`/`SKILL.MD`.
- Remove `src/skills/loading/workspace.ts`, `src/skills/loading/local-loader.ts`, `src/skills/loading/bundled-dir.ts`, `src/skills/loading/symlink-targets.ts`, `src/skills/lifecycle/clawhub.ts`, `src/skills/types.ts`, `src/skills/workshop/*`, `src/skills/research/*`, and `src/skills/runtime/*` skill-snapshotting paths.
- Remove `skillsSnapshot` from session entry types in `src/config/sessions/types.ts`.
- Remove skill prompt injection from `src/agents/system-prompt.ts` and embedded runner compact paths.
- Remove skill-suggestion consumption from `src/auto-reply/reply/get-reply-run.ts` and `src/auto-reply/reply/session.ts`.
- Remove `SessionSkillSnapshot`, `SkillSnapshot`, `SkillEntry`, `SkillUsagePath`, and skill-suggestion schema/config surfaces.
- Remove ClawHub skill publishing/lockfile/origin metadata from `src/plugins/clawhub.ts` and related tests.
- Preserve plugin capability registration APIs unrelated to skills; do not remove generic plugin loading.

## New Core Surfaces

### Memory Subsystem Boundary

Create `src/memory/` as the owned boundary:

- `src/memory/working-memory.ts`: Redis client wrapper, run-local state cache, TTL management.
- `src/memory/episodic.ts`: PostgreSQL event store, transcript append, query API.
- `src/memory/semantic.ts`: Qdrant vector store client, chunk indexing, hybrid search orchestration.
- `src/memory/procedural.ts`: Neo4j graph client plus Temporal workflow client for procedure lifecycle.
- `src/memory/orchestrator.ts`: Unified facade used by agent runtime, tools, and compaction hooks.
- `src/memory/config.ts`: Memory subsystem config types and defaults.
- `src/memory/tools.ts`: `memory_search`, `memory_get`, `procedure_recall`, `procedure_execute` tool factories.
- `src/memory/observability.ts`: Prometheus metrics, Loki log helpers, Grafana dashboard config generator.

### Agent Runtime Integration

- Replace `ensureMemoryRuntime()` and `getActiveMemorySearchManager()` calls with `memory.orchestrator` methods.
- Replace compact/flush hook memory prompt supplements with episodic/semantic summarization workers triggered via Temporal.
- Replace `skillsSnapshot` usage with working-memory run context scoped to the current agent run.
- Remove skill prompt building from embedded agent runner and command preparation paths.

### Procedural Memory Migration

- Procedural content previously represented as `SKILL.md` files becomes Neo4j procedure nodes plus Temporal workflow definitions.
- Migration: one-time import tool that reads existing skill directories and writes procedure graph nodes and workflow schemas.
- After migration, procedure execution is auditable via Temporal history and graph lineage in Neo4j.

## Config Changes

### operator.json

- Remove `plugins.slots.memory`.
- Remove `plugins.entries.memory-core`, `plugins.entries.memory-lancedb`.
- Remove `skills.entries`, `skills.workspace`, `skills.sync`, `skills.lockfile`, skill-suggestion config, and skill-workshop config.
- Add `memory.working.redisUrl`, `memory.episodic.postgresUrl`, `memory.semantic.qdrantUrl`, `memory.procedural.neo4jUrl`, `memory.procedural.temporalNamespace`, `memory.observability.prometheusPushUrl`, `memory.observability.lokiUrl`, `memory.observability.grafanaDashboardDir`.
- Preserve `agents.defaults.memorySearch.*` embedding/search knobs for semantic search behavior; map them to Qdrant index tuning.

## Data Model

### Redis

- Key prefix: `memory:working:<agentId>:<sessionId>:*`
- TTL: run-bound; cleared on session end or compaction.

### PostgreSQL

- `episodic_events`: id, agent_id, session_id, event_type, payload_jsonb, occurred_at, ingested_at.
- `episodic_chunks`: id, event_id, chunk_text, embedding_model, chunk_meta_jsonb.
- Indexes on `agent_id`, `session_id`, `occurred_at`.

### Qdrant

- Collection: `semantic_memory`
- Payload: agent_id, source_type, source_path, chunk_id, created_at, updated_at, metadata_jsonb.
- Vector size matches active embedding provider.

### Neo4j

- Labels: `Procedure`, `Version`, `Input`, `Output`, `Requirement`, `Tag`
- Relationships: `HAS_VERSION`, `REQUIRES`, `PRODUCES`, `TAGGED`
- Temporal workflow metadata stored as node properties and referenced workflow IDs.

## Workflow

### Ingestion

- Workspace memory markdown files are still supported as episodic sources, but ingestion is core-owned.
- Chunking, embedding, and indexing happen via Temporal activities; no plugin runtime.

### Recall

- `memory_search`: semantic-first, reranked with episodic recency metadata from PostgreSQL.
- `memory_get`: fetch chunk or event by id, with lineage provenance.

### Execution

- `procedure_recall`: graph search in Neo4j for matching procedures by tags, inputs, or text similarity.
- `procedure_execute`: starts or signals a Temporal workflow; returns run id and status.

## Failure Modes

- Redis unavailable: degrade to in-process working memory with a startup warning.
- PostgreSQL unavailable: block episodic recall; continue semantic-only if Qdrant is healthy.
- Qdrant unavailable: block semantic recall; fall back to keyword/episodic search if available.
- Neo4j/Temporal unavailable: block procedural execution; return degraded response and emit metric.
- NATS unavailable: use in-process activity queue; log warning and retry once.

## Migration Path

1. Add new memory subsystem behind a feature flag in `operator.json`.
2. Ship `memory import-skills` migration command to convert existing workspace skills to procedural graph entries.
3. Deprecation period: keep `plugins.slots.memory` functional but emit deprecation warnings.
4. Remove old memory plugin slot and skill system in the next release after flag default is `true`.

## Validation

- Unit tests for each tier client wrapper with injected fake clients.
- Integration tests for orchestrator failover behavior.
- Update or remove existing memory plugin tests: `plugins/memory-runtime.test.ts`, `plugins/memory-state.test.ts`, `plugins/memory-embedding-provider-runtime.test.ts`, `plugins/memory-embedding-providers.test.ts`, `plugins/tools.optional.test.ts` memory cases.
- Update or remove skill tests: `skills/loading/*`, `skills/lifecycle/*`, `skills/runtime/*`, `skills/workshop/*`.
- Update system prompt tests for removed memory/skill sections.
- Add observability smoke tests for metrics/log emission.

## Open Questions

- Should `procedure_execute` return Temporal workflow results directly, or only run status/history references?
- Do we keep markdown memory files as a compatibility import source after the skill system is removed?
