// Runs Biome with local heavy-check policy, sparse-checkout filtering, and
// plugin package-boundary artifact preparation when needed.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  acquireLocalHeavyCheckLockSync,
  applyLocalBiomePolicy,
  resolveLocalHeavyCheckEnv,
  shouldAcquireLocalHeavyCheckLockForBiome,
} from "./lib/local-heavy-check-runtime.mjs";
import { createManagedCommandInvocation, runManagedCommand } from "./lib/managed-child-process.mjs";

const biomePath = path.resolve("node_modules", ".bin", "biome");
const PREPARE_EXTENSION_BOUNDARY_ARGS = [
  path.resolve("scripts", "prepare-extension-package-boundary-artifacts.mjs"),
];
const BIOME_PREPARE_SKIP_FLAGS = new Set([
  "--help",
  "-h",
  "--version",
  "-V",
  "--print-config",
  "--json",
  "--help",
]);

/**
 * Returns whether biome args need package-boundary declaration artifacts first.
 */
export function shouldPrepareExtensionPackageBoundaryArtifacts(args) {
  return !args.some((arg) => BIOME_PREPARE_SKIP_FLAGS.has(arg));
}

/**
 * Drops tracked-but-missing sparse-checkout targets so narrow sparse checks can pass.
 */
export function filterSparseMissingBiomeTargets(
  args,
  {
    cwd = process.cwd(),
    fileExists = fs.existsSync,
    isSparseCheckoutEnabled = getSparseCheckoutEnabled,
    isTrackedPath = hasTrackedPath,
  } = {},
) {
  if (!isSparseCheckoutEnabled({ cwd })) {
    return {
      args,
      hadExplicitTargets: false,
      remainingExplicitTargets: 0,
      skippedTargets: [],
      skippedConfigs: [],
    };
  }

  const filteredArgs = [];
  const skippedTargets = [];
  let hadExplicitTargets = false;
  let remainingExplicitTargets = 0;
  let consumeNextValue = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (consumeNextValue) {
      filteredArgs.push(arg);
      consumeNextValue = false;
      continue;
    }

    if (arg === "--") {
      filteredArgs.push(arg);
      continue;
    }

    if (arg.startsWith("--")) {
      if (arg === "--config" || arg === "--extends" || arg === "--reporter" || arg === "--cwd") {
        const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : args[index + 1];
        if (!arg.includes("=")) {
          index += 1;
        }
        if (
          value &&
          !fileExists(path.resolve(cwd, value)) &&
          isTrackedPath({ cwd, target: value })
        ) {
          skippedConfigs.push(value);
          continue;
        }
        filteredArgs.push(arg);
        if (!arg.includes("=")) {
          filteredArgs.push(value);
        }
        continue;
      }
      filteredArgs.push(arg);
      continue;
    }

    if (arg.startsWith("-")) {
      filteredArgs.push(arg);
      continue;
    }

    hadExplicitTargets = true;
    const absoluteTarget = path.resolve(cwd, arg);
    if (!fileExists(absoluteTarget) && isTrackedPath({ cwd, target: arg })) {
      skippedTargets.push(arg);
      continue;
    }

    remainingExplicitTargets += 1;
    filteredArgs.push(arg);
  }

  return {
    args: filteredArgs,
    hadExplicitTargets,
    remainingExplicitTargets,
    skippedTargets,
    skippedConfigs,
  };
}

function getSparseCheckoutEnabled({ cwd }) {
  const git = createManagedCommandInvocation({
    args: ["config", "--get", "--bool", "core.sparseCheckout"],
    bin: "git",
  });
  const result = spawnSync(git.command, git.args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: git.shell,
    windowsVerbatimArguments: git.windowsVerbatimArguments,
  });

  return result.status === 0 && result.stdout.trim() === "true";
}

function hasTrackedPath({ cwd, target }) {
  const git = createManagedCommandInvocation({
    args: ["ls-files", "--", target],
    bin: "git",
  });
  const result = spawnSync(git.command, git.args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: git.shell,
    windowsVerbatimArguments: git.windowsVerbatimArguments,
  });

  return result.status === 0 && result.stdout.trim().length > 0;
}

async function prepareExtensionPackageBoundaryArtifacts(env) {
  const releaseArtifactsLock = acquireLocalHeavyCheckLockSync({
    cwd: process.cwd(),
    env,
    toolName: "extension-package-boundary-artifacts",
    lockName: "extension-package-boundary-artifacts",
  });

  try {
    const status = await runManagedCommand({
      bin: process.execPath,
      args: PREPARE_EXTENSION_BOUNDARY_ARGS,
      env,
    });

    if (status !== 0) {
      throw new Error(
        `prepare-extension-package-boundary-artifacts failed with exit code ${status}`,
      );
    }
  } finally {
    releaseArtifactsLock();
  }
}

/**
 * Applies wrapper policy and runs biome with the final argument list.
 */
export async function main(argv = process.argv.slice(2), runtimeEnv = process.env) {
  const { args: policyArgs, env } = applyLocalBiomePolicy(
    argv,
    resolveLocalHeavyCheckEnv(runtimeEnv),
  );
  const sparseTargets = filterSparseMissingBiomeTargets(policyArgs);
  const finalArgs = sparseTargets.args;
  if (sparseTargets.skippedTargets.length > 0) {
    console.error(
      `[biome] sparse checkout is missing tracked target(s); skipping ${sparseTargets.skippedTargets.join(", ")}`,
    );
  }
  if (sparseTargets.skippedConfigs.length > 0) {
    console.error(
      `[biome] sparse checkout is missing tracked config(s); skipping biome: ${sparseTargets.skippedConfigs.join(", ")}`,
    );
    return;
  }
  if (sparseTargets.hadExplicitTargets && sparseTargets.remainingExplicitTargets === 0) {
    console.error("[biome] no present sparse-checkout targets remain; skipping biome.");
    return;
  }

  const releaseLock =
    env.OPERATOR_BIOME_SKIP_LOCK === "1"
      ? () => {}
      : shouldAcquireLocalHeavyCheckLockForBiome(finalArgs, {
            cwd: process.cwd(),
            env,
          })
        ? acquireLocalHeavyCheckLockSync({
            cwd: process.cwd(),
            env,
            toolName: "biome",
          })
        : () => {};

  try {
    if (
      env.OPERATOR_BIOME_SKIP_PREPARE !== "1" &&
      shouldPrepareExtensionPackageBoundaryArtifacts(finalArgs)
    ) {
      await prepareExtensionPackageBoundaryArtifacts(env);
    }

    const status = await runManagedCommand({
      bin: biomePath,
      args: finalArgs,
      env,
    });
    process.exitCode = status;
  } finally {
    releaseLock();
  }
}

if (import.meta.main) {
  await main();
}
