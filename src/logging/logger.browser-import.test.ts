// Logger browser import tests cover safe import behavior in browser-like runtimes.
import { importFreshModule } from "@gabrielvfonseca/operator/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredOperatorTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredOperatorTmpDir: ReturnType<typeof vi.fn>;
}> {
  const resolvePreferredOperatorTmpDir =
    params?.resolvePreferredOperatorTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredOperatorTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-operator-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-operator-dir.js")>(
      "../infra/tmp-operator-dir.js",
    );
    return {
      ...actual,
      resolvePreferredOperatorTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await importFreshModule<LoggerModule>(
    import.meta.url,
    "./logger.js?scope=browser-safe",
  );
  return { module, resolvePreferredOperatorTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.doUnmock("../infra/tmp-operator-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredOperatorTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredOperatorTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/openclaw");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/openclaw/operator.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredOperatorTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toStrictEqual({
      level: "silent",
      file: "/tmp/openclaw/operator.log",
      maxFileBytes: 100 * 1024 * 1024,
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(module.getLogger().info("browser-safe")).toBeUndefined();
    expect(resolvePreferredOperatorTmpDir).not.toHaveBeenCalled();
  });
});
