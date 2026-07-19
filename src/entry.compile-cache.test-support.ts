import type { ChildProcess } from "node:child_process";
import type { RespawnChildRuntime } from "./process/respawn-child-runner.js";
import "./entry.compile-cache.js";

type CompileCacheParams = {
  env?: NodeJS.ProcessEnv;
  installRoot: string;
  nodeVersion?: string;
  platform?: NodeJS.Platform;
};

type CompileCacheRespawnPlan = {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  detachForProcessTree: boolean;
};

type CompileCacheTestApi = {
  buildOperatorCompileCacheRespawnPlan(params: {
    currentFile: string;
    env?: NodeJS.ProcessEnv;
    execArgv?: string[];
    execPath?: string;
    installRoot: string;
    argv?: string[];
    compileCacheDir?: string;
    nodeVersion?: string;
    platform?: NodeJS.Platform;
  }): CompileCacheRespawnPlan | undefined;
  isNodeVersionAffectedByCompileCacheDeadlock(nodeVersion: string | undefined): boolean;
  isSourceCheckoutInstallRoot(installRoot: string): boolean;
  resolveOperatorCompileCacheDirectory(params: {
    env?: NodeJS.ProcessEnv;
    installRoot: string;
  }): string;
  runOperatorCompileCacheRespawnPlan(
    plan: CompileCacheRespawnPlan,
    runtime?: RespawnChildRuntime & { writeError(message: string): void },
  ): ChildProcess;
  shouldEnableOperatorCompileCache(params: CompileCacheParams): boolean;
};

function getTestApi(): CompileCacheTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("operator.entryCompileCacheTestApi")
  ] as CompileCacheTestApi;
}

export function buildOperatorCompileCacheRespawnPlan(
  params: Parameters<CompileCacheTestApi["buildOperatorCompileCacheRespawnPlan"]>[0],
): CompileCacheRespawnPlan | undefined {
  return getTestApi().buildOperatorCompileCacheRespawnPlan(params);
}

export function isNodeVersionAffectedByCompileCacheDeadlock(
  nodeVersion: string | undefined,
): boolean {
  return getTestApi().isNodeVersionAffectedByCompileCacheDeadlock(nodeVersion);
}

export function isSourceCheckoutInstallRoot(installRoot: string): boolean {
  return getTestApi().isSourceCheckoutInstallRoot(installRoot);
}

export function resolveOperatorCompileCacheDirectory(
  params: Parameters<CompileCacheTestApi["resolveOperatorCompileCacheDirectory"]>[0],
): string {
  return getTestApi().resolveOperatorCompileCacheDirectory(params);
}

export function runOperatorCompileCacheRespawnPlan(
  ...args: Parameters<CompileCacheTestApi["runOperatorCompileCacheRespawnPlan"]>
): ChildProcess {
  return getTestApi().runOperatorCompileCacheRespawnPlan(...args);
}

export function shouldEnableOperatorCompileCache(params: CompileCacheParams): boolean {
  return getTestApi().shouldEnableOperatorCompileCache(params);
}
