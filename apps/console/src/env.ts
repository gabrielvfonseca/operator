/**
 * Build-time identity for the Operator Console artifact.
 *
 * The legacy Control UI read `OPENCLAW_CONTROL_UI_BUILD_INFO` (Vite-injected).
 * The console build injects the same global so About/diagnostics keep working
 * after migration. We keep a minimal normalized shape here rather than importing
 * the Lit app's internal module graph.
 */

export interface ControlUiBuildInfo {
  version: string;
  commit: string;
  buildHash: string;
  channel: string;
}

function normalize(raw: unknown): ControlUiBuildInfo {
  const value = (raw ?? {}) as Partial<ControlUiBuildInfo>;
  return {
    version: value.version?.trim() || "dev",
    commit: value.commit?.trim() || "",
    buildHash: value.buildHash?.trim() || "",
    channel: value.channel?.trim() || "dev",
  };
}

declare global {
  // Populated by the console build script at build time.
  var OPENCLAW_CONTROL_UI_BUILD_INFO: unknown;
}

const injected =
  typeof globalThis !== "undefined"
    ? (globalThis as { OPENCLAW_CONTROL_UI_BUILD_INFO?: unknown })
        .OPENCLAW_CONTROL_UI_BUILD_INFO
    : undefined;

export const CONSOLE_BUILD_INFO: ControlUiBuildInfo = normalize(injected);
