import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import type { Command } from "commander";
import type { OperatorConfig } from "../config/types.operator.js";
import type {
  DiagnosticEventPrivateData,
  DiagnosticEventInput,
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
} from "../infra/diagnostic-events.js";
import type { SecurityAuditFinding } from "../security/audit.types.js";
import type { PluginLogger } from "./logger-types.js";

type ChannelPlugin = import("../channels/plugins/types.plugin.js").ChannelPlugin;

type PluginInteractiveHandlerResult = {
  handled?: boolean;
} | void;

export type PluginInteractiveRegistration<
  TContext = unknown,
  TChannel extends string = string,
  TResult = PluginInteractiveHandlerResult,
> = {
  channel: TChannel;
  namespace: string;
  handler: (ctx: TContext) => Promise<TResult> | TResult;
};

export type PluginInteractiveHandlerRegistration = PluginInteractiveRegistration;

export type OperatorPluginHttpRouteAuth = "gateway" | "plugin";
export type OperatorPluginHttpRouteMatch = "exact" | "prefix";
export type OperatorPluginGatewayRuntimeScopeSurface = "write-default" | "trusted-operator";

export type OperatorPluginHttpRouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<boolean | void> | boolean | void;

export type OperatorPluginHttpRouteUpgradeHandler = (
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => Promise<boolean | void> | boolean | void;

export type OperatorPluginHttpRouteParams = {
  path: string;
  handler: OperatorPluginHttpRouteHandler;
  handleUpgrade?: OperatorPluginHttpRouteUpgradeHandler;
  auth: OperatorPluginHttpRouteAuth;
  match?: OperatorPluginHttpRouteMatch;
  gatewayRuntimeScopeSurface?: OperatorPluginGatewayRuntimeScopeSurface;
  nodeCapability?: {
    surface: string;
    ttlMs?: number;
  };
  replaceExisting?: boolean;
};

export type OperatorPluginHostedMediaResolver = (
  mediaUrl: string,
) => string | null | undefined | Promise<string | null | undefined>;

export type OperatorPluginCliContext = {
  /**
   * Command object where this plugin should register its commands.
   *
   * For root CLI registrations this is the root `openclaw` program. For nested
   * registrations it is the resolved parent command from `parentPath`.
   */
  program: Command;
  parentPath: readonly string[];
  config: OperatorConfig;
  workspaceDir?: string;
  logger: PluginLogger;
};

export type OperatorPluginCliRegistrar = (ctx: OperatorPluginCliContext) => void | Promise<void>;

/**
 * Top-level CLI metadata for plugin-owned commands.
 *
 * Descriptors are the parse-time contract for lazy plugin CLI registration.
 * If you want Operator to keep a plugin command lazy-loaded while still
 * advertising it at the root CLI level, provide descriptors that cover every
 * top-level command root registered by that plugin CLI surface.
 */
export type OperatorPluginCliCommandDescriptor = {
  name: string;
  description: string;
  hasSubcommands: boolean;
};

export type OperatorPluginNodeCliFeatureOptions = {
  /** Explicit node feature command names owned under `openclaw nodes`. */
  commands?: string[];
  /**
   * Parse-time command descriptors for lazy node feature CLI registration.
   *
   * Descriptors are registered under `openclaw nodes`, so a descriptor named
   * `"camera"` exposes `openclaw nodes camera`.
   */
  descriptors?: OperatorPluginCliCommandDescriptor[];
};

export type OperatorPluginReloadRegistration = {
  restartPrefixes?: string[];
  hotPrefixes?: string[];
  noopPrefixes?: string[];
};

export type {
  OperatorPluginNodeHostCommand,
  OperatorPluginNodeHostCommandAvailabilityContext,
  OperatorPluginNodeHostCommandIo,
} from "./types.node-host.js";

export type OperatorPluginNodeInvokeTransportResult =
  | {
      ok: true;
      payload?: unknown;
      payloadJSON?: string | null;
    }
  | {
      ok: false;
      code?: string;
      message: string;
      details?: Record<string, unknown>;
    };

type OperatorPluginNodeInvokeApprovalDecision = "allow-once" | "allow-always" | "deny";

type OperatorPluginNodeInvokePolicyApprovalRuntime = {
  request: (input: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    toolName?: string;
    toolCallId?: string;
    agentId?: string;
    sessionKey?: string;
    timeoutMs?: number;
  }) => Promise<{
    id?: string;
    decision?: OperatorPluginNodeInvokeApprovalDecision | null;
  }>;
};

export type OperatorPluginNodeInvokePolicyContext = {
  nodeId: string;
  command: string;
  params: unknown;
  timeoutMs?: number;
  idempotencyKey?: string;
  config: OperatorConfig;
  pluginConfig?: Record<string, unknown>;
  node?: {
    nodeId: string;
    displayName?: string;
    platform?: string;
    deviceFamily?: string;
    commands?: string[];
  };
  client?: {
    connId?: string;
    scopes?: string[];
  } | null;
  approvals?: OperatorPluginNodeInvokePolicyApprovalRuntime;
  invokeNode: (input?: {
    params?: unknown;
    timeoutMs?: number;
    idempotencyKey?: string;
  }) => Promise<OperatorPluginNodeInvokeTransportResult>;
};

export type OperatorPluginNodeInvokePolicyResult =
  | {
      ok: true;
      payload?: unknown;
      payloadJSON?: string | null;
    }
  | {
      ok: false;
      message: string;
      code?: string;
      details?: Record<string, unknown>;
      unavailable?: boolean;
    };

export type OperatorPluginNodeInvokePolicy = {
  commands: string[];
  /**
   * Platforms where these node-handled commands should be allowlisted by default.
   * Omit for commands that require explicit `gateway.nodes.allowCommands`.
   */
  defaultPlatforms?: Array<"ios" | "android" | "macos" | "windows" | "linux" | "unknown">;
  /**
   * Dangerous policy commands are filtered out of default allowlists unless
   * explicitly allowed by config.
   */
  dangerous?: boolean;
  /**
   * iOS foreground-restricted commands should be queued for foreground delivery
   * when an iOS node reports BACKGROUND_UNAVAILABLE.
   */
  foregroundRestrictedOnIos?: boolean;
  handle: (
    ctx: OperatorPluginNodeInvokePolicyContext,
  ) => Promise<OperatorPluginNodeInvokePolicyResult> | OperatorPluginNodeInvokePolicyResult;
};

export type OperatorPluginSecurityAuditContext = {
  config: OperatorConfig;
  sourceConfig: OperatorConfig;
  env: NodeJS.ProcessEnv;
  stateDir: string;
  configPath: string;
};

export type OperatorPluginSecurityAuditCollector = (
  ctx: OperatorPluginSecurityAuditContext,
) => SecurityAuditFinding[] | Promise<SecurityAuditFinding[]>;

export type OperatorGatewayDiscoveryAdvertiseContext = {
  machineDisplayName: string;
  gatewayPort: number;
  gatewayTlsEnabled: boolean;
  gatewayTlsFingerprintSha256?: string;
  gatewayDirectReachable: boolean;
  canvasPort?: number;
  tailnetDns?: string;
  sshPort?: number;
  cliPath?: string;
  minimal: boolean;
};

export type OperatorGatewayDiscoveryService = {
  id: string;
  advertise: (
    ctx: OperatorGatewayDiscoveryAdvertiseContext,
  ) => void | Promise<void | { stop?: () => void | Promise<void> }>;
};

/** Context passed to long-lived plugin services. */
export type OperatorPluginServiceContext = {
  config: OperatorConfig;
  workspaceDir?: string;
  stateDir: string;
  logger: PluginLogger;
  gatewayEvents?: import("./gateway-events.js").OperatorPluginGatewayEvents;
  startupTrace?: {
    detail?: (name: string, metrics: ReadonlyArray<readonly [string, number | string]>) => void;
    measure: <T>(name: string, run: () => T | Promise<T>) => Promise<T>;
  };
  internalDiagnostics?: {
    emit: (event: DiagnosticEventInput, privateData?: DiagnosticEventPrivateData) => void;
    onEvent: (
      listener: (
        event: DiagnosticEventPayload,
        metadata: DiagnosticEventMetadata,
        privateData: DiagnosticEventPrivateData,
      ) => void,
    ) => () => void;
  };
};

/** Background service registered by a plugin during `register(api)`. */
export type OperatorPluginService = {
  id: string;
  start: (ctx: OperatorPluginServiceContext) => void | Promise<void>;
  stop?: (ctx: OperatorPluginServiceContext) => void | Promise<void>;
};

export type OperatorPluginChannelRegistration = {
  plugin: ChannelPlugin;
};

/**
 * Public label exposed to plugin `register(api)` calls.
 *
 * Keep this as a compatibility signal for plugin authors. Loader internals
 * should derive explicit capability booleans from the mode instead of branching
 * on raw strings throughout the code path.
 *
 * - `full`: live runtime activation; long-lived side effects may start.
 * - `discovery`: read-only capability discovery; skip sockets/workers/clients.
 * - `tool-discovery`: capability discovery for executable tools; skip channel runtime hydration.
 * - `setup-only`: lightweight channel setup entry only.
 * - `setup-runtime`: setup flow that also needs the runtime channel entry.
 * - `cli-metadata`: CLI command metadata collection.
 */
export type PluginRegistrationMode =
  | "full"
  | "discovery"
  | "tool-discovery"
  | "setup-only"
  | "setup-runtime"
  | "cli-metadata";
