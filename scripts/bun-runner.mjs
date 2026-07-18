// Resolves and spawns bun commands portably across POSIX and Windows shells.
import { spawn } from "node:child_process";
import path from "node:path";
import { buildCmdExeCommandLine, resolveWindowsCmdExePath } from "./windows-cmd-helpers.mjs";

function getPortableBasename(value) {
  return value.split(/[/\\]/).at(-1) ?? value;
}

function getPortableExtension(value) {
  return path.posix.extname(getPortableBasename(value)).toLowerCase();
}

function isBunExecPath(value) {
  return /^bun(?:\.(?:[cm]?js|cmd|exe))?$/.test(getPortableBasename(value).toLowerCase());
}

function hasScriptShebang(value) {
  let fd;
  try {
    fd = openSync(value, "r");
    const header = Buffer.alloc(2);
    return (
      readSync(fd, header, 0, header.length, 0) === header.length &&
      header[0] === 0x23 &&
      header[1] === 0x21
    );
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      closeSync(fd);
    }
  }
}

function isExecutableFile(value) {
  try {
    if (!statSync(value).isFile()) {
      return false;
    }
    accessSync(value, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function isFile(value) {
  try {
    return statSync(value).isFile();
  } catch {
    return false;
  }
}

function findExecutableOnPath(command, envPath, platform, env, cwd) {
  if (typeof envPath !== "string" || envPath.length === 0) {
    return null;
  }
  const extensions =
    platform === "win32"
      ? (
          env[Object.keys(env).find((key) => key.toLowerCase() === "pathext") ?? "PATHEXT"] ??
          ".COM;.EXE;.BAT;.CMD"
        )
          .split(";")
          .filter(Boolean)
          .map((extension) => extension.toLowerCase())
      : [""];
  const pathDelimiter = platform === "win32" ? ";" : path.delimiter;
  for (const directory of envPath.split(pathDelimiter)) {
    if (!directory) {
      continue;
    }
    const resolvedDirectory = path.isAbsolute(directory) ? directory : path.resolve(cwd, directory);
    for (const extension of extensions) {
      const candidate = path.join(resolvedDirectory, `${command}${extension}`);
      if (platform === "win32" ? isFile(candidate) : isExecutableFile(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

function createWindowsRunner(command, args, comSpec) {
  const extension = getPortableExtension(command);
  if (extension === ".cmd" || extension === ".bat") {
    return {
      command: comSpec,
      args: ["/d", "/s", "/c", buildCmdExeCommandLine(command, args)],
      shell: false,
      windowsVerbatimArguments: true,
    };
  }
  return { command, args, shell: false };
}

function isNodeRunnableBunExecPath(value) {
  if (!isBunExecPath(value)) {
    return false;
  }
  const extension = getPortableExtension(value);
  if (extension === ".js" || extension === ".cjs" || extension === ".mjs") {
    return isFile(value);
  }
  if (extension.length > 0) {
    return false;
  }
  return hasScriptShebang(value);
}

/**
 * Resolves the command/args needed to invoke bun on the current platform.
 */
export function resolveBunRunner(params = {}) {
  const bunArgs = params.bunArgs ?? [];
  const nodeArgs = params.nodeArgs ?? [];
  const npmExecPath = params.npmExecPath ?? process.env.npm_execpath;
  const nodeExecPath = params.nodeExecPath ?? process.execPath;
  const platform = params.platform ?? process.platform;
  const env = params.env ?? process.env;
  const comSpec = params.comSpec ?? (platform === "win32" ? resolveWindowsCmdExePath(env) : "");
  const envPath = env[platform === "win32" ? resolvePathEnvKey(env) : "PATH"];
  const cwd = params.cwd ?? process.cwd();

  if (typeof npmExecPath === "string" && npmExecPath.length > 0 && isBunExecPath(npmExecPath)) {
    if (isNodeRunnableBunExecPath(npmExecPath)) {
      return {
        command: nodeExecPath,
        args: [...nodeArgs, npmExecPath, ...bunArgs],
        shell: false,
      };
    }

    const npmExecExtension = getPortableExtension(npmExecPath);
    if (platform !== "win32" && npmExecExtension.length === 0 && isExecutableFile(npmExecPath)) {
      return {
        command: npmExecPath,
        args: bunArgs,
        shell: false,
      };
    }
    if (platform === "win32" && npmExecExtension === ".exe") {
      return {
        command: npmExecPath,
        args: bunArgs,
        shell: false,
      };
    }
    if (platform === "win32" && npmExecExtension === ".cmd") {
      return {
        command: comSpec,
        args: ["/d", "/s", "/c", buildCmdExeCommandLine(npmExecPath, bunArgs)],
        shell: false,
        windowsVerbatimArguments: true,
      };
    }
  }

  const bunPath = findExecutableOnPath("bun", envPath, platform, env, cwd);
  if (bunPath) {
    return platform === "win32"
      ? createWindowsRunner(bunPath, bunArgs, comSpec)
      : { command: bunPath, args: bunArgs, shell: false };
  }

  if (platform === "win32") {
    return createWindowsRunner("bun.cmd", bunArgs, comSpec);
  }

  return {
    command: "bun",
    args: bunArgs,
    shell: false,
  };
}

/**
 * Creates a spawn-ready bun invocation with standard options.
 */
export function createBunRunnerSpawnSpec(params = {}) {
  const env = params.env ?? process.env;
  const runner = resolveBunRunner({ ...params, env });
  return {
    command: runner.command,
    args: runner.args,
    options: {
      cwd: params.cwd,
      detached: params.detached,
      stdio: params.stdio ?? "inherit",
      env: params.env ?? runner.env ?? process.env,
      shell: runner.shell,
      windowsVerbatimArguments: runner.windowsVerbatimArguments,
    },
  };
}

/**
 * Spawns a bun command using the portable runner resolution.
 */
export function spawnBunRunner(params = {}) {
  const spawnSpec = createBunRunnerSpawnSpec(params);
  return spawn(spawnSpec.command, spawnSpec.args, spawnSpec.options);
}

// Re-export fs functions used by the module
import { accessSync, closeSync, constants, openSync, readSync, statSync } from "node:fs";
