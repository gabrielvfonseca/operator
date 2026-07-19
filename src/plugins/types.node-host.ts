// Node-host plugin command contracts, including the opt-in duplex transport.
import type { OperatorConfig } from "../config/types.operator.js";

export type OperatorPluginNodeHostCommandAvailabilityContext = {
  /** Node-local configuration used to build this host's Gateway declaration. */
  config: OperatorConfig;
  /** Node-host process environment. */
  env: NodeJS.ProcessEnv;
};

export type OperatorPluginNodeHostCommandIo = {
  emitChunk(chunk: string): Promise<void>;
  onInput(callback: (payloadJSON: string) => void): void;
  signal: AbortSignal;
};

export type OperatorPluginNodeHostCommandContext = {
  /** Emit one node-owned event through the active Gateway connection. */
  sendNodeEvent(event: string, payload: unknown): Promise<unknown>;
  /** Agent session that owns this invocation, when the caller supplied one. */
  sessionKey?: string;
};

type OperatorPluginNodeHostCommandBase = {
  command: string;
  cap?: string;
  dangerous?: boolean;
  /** Return false to omit this command and capability from the node declaration. */
  isAvailable?: (context: OperatorPluginNodeHostCommandAvailabilityContext) => boolean;
  /** Watch node-local availability and request a fresh Gateway declaration. */
  watchAvailability?: (
    context: OperatorPluginNodeHostCommandAvailabilityContext,
    onChange: () => void,
  ) => (() => void) | void;
  agentTool?: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
    /** Platforms where this tool is allowlisted by default; omit for explicit config only. */
    defaultPlatforms?: Array<"ios" | "android" | "macos" | "windows" | "linux" | "unknown">;
    mcp?: { server: string; tool: string };
  };
};

export type OperatorPluginNodeHostCommand = OperatorPluginNodeHostCommandBase & {
  // Not a discriminated handle signature: a union of different arities makes
  // plain `command.handle(params)` uncallable for consumers holding the union.
  // The node host enforces io presence for duplex commands at runtime.
  duplex?: boolean;
  handle: (
    paramsJSON?: string | null,
    io?: OperatorPluginNodeHostCommandIo,
    context?: OperatorPluginNodeHostCommandContext,
  ) => Promise<string>;
};
