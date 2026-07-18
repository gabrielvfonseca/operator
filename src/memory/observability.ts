// Observability helpers for the memory subsystem.
import type { MemoryObservabilityConfig } from "./config.js";

export type MemoryMetrics = {
  recordWorkingSet(key: string, ttlSeconds: number): void;
  recordEpisodicAppend(latencyMs: number): void;
  recordSemanticUpsert(latencyMs: number): void;
  recordProceduralExecute(status: string): void;
  recordStoreUnavailable(store: string): void;
};

export type MemoryLogEmitter = {
  emitMemoryEvent(line: string): void;
};

export type GrafanaDashboard = {
  title: string;
  panels: Array<{ title: string; targets: Array<{ expr: string; legend?: string }> }>;
};

let metrics: MemoryMetrics | null = null;
let logs: MemoryLogEmitter | null = null;

export function configureMemoryObservability(config: MemoryObservabilityConfig) {
  metrics = createMetrics(config);
  logs = createLogEmitter(config);
}

export function getMemoryMetrics(): MemoryMetrics | null {
  return metrics;
}

export function getMemoryLogEmitter(): MemoryLogEmitter | null {
  return logs;
}

export function generateGrafanaDashboard(): GrafanaDashboard {
  return {
    title: "Operator Memory Subsystem",
    panels: [
      {
        title: "Working Memory Keys",
        targets: [{ expr: "memory_working_keys_total", legend: "keys" }],
      },
      {
        title: "Episodic Append Latency",
        targets: [{ expr: "memory_episodic_append_duration_seconds", legend: "latency" }],
      },
      {
        title: "Semantic Upsert Latency",
        targets: [{ expr: "memory_semantic_upsert_duration_seconds", legend: "latency" }],
      },
      {
        title: "Procedural Executions",
        targets: [{ expr: "memory_procedural_execute_total{status}", legend: "{{status}}" }],
      },
      {
        title: "Store Unavailability",
        targets: [{ expr: "memory_store_unavailable_total", legend: "unavailable" }],
      },
    ],
  };
}

function createMetrics(_config: MemoryObservabilityConfig): MemoryMetrics {
  return {
    recordWorkingSet(key, ttlSeconds) {
      // Metrics emission stub; integrate with Prometheus client in full build.
      void key;
      void ttlSeconds;
    },
    recordEpisodicAppend(latencyMs) {
      void latencyMs;
    },
    recordSemanticUpsert(latencyMs) {
      void latencyMs;
    },
    recordProceduralExecute(status) {
      void status;
    },
    recordStoreUnavailable(store) {
      void store;
    },
  };
}

function createLogEmitter(_config: MemoryObservabilityConfig): MemoryLogEmitter {
  return {
    emitMemoryEvent(line) {
      // Log emission stub; integrate with Loki/pino in full build.
      void line;
    },
  };
}
