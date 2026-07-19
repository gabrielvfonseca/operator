// Verifies logging config parsing and file path handling.
import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { withTempDirSync } from "../test-helpers/temp-dir.js";

const mocks = vi.hoisted(() => ({
  createConfigIO: vi.fn().mockReturnValue({
    configPath: "/tmp/operator-dev/operator.json",
  }),
}));

vi.mock("./io.js", () => ({
  createConfigIO: mocks.createConfigIO,
}));

let formatConfigPath: typeof import("./logging.js").formatConfigPath;
let formatConfigUpdatedMessage: typeof import("./logging.js").formatConfigUpdatedMessage;
let logConfigUpdated: typeof import("./logging.js").logConfigUpdated;

beforeAll(async () => {
  ({ formatConfigPath, formatConfigUpdatedMessage, logConfigUpdated } =
    await import("./logging.js"));
});

beforeEach(() => {
  mocks.createConfigIO.mockClear();
});

describe("config logging", () => {
  it("formats the live config path when no explicit path is provided", () => {
    expect(formatConfigPath()).toBe("/tmp/operator-dev/operator.json");
  });

  it("logs the live config path when no explicit path is provided", () => {
    const runtime = { log: vi.fn() };
    logConfigUpdated(runtime as never);
    expect(runtime.log).toHaveBeenCalledWith("Updated config: /tmp/operator-dev/operator.json");
  });

  it("formats backup as an indented detail when present", () => {
    withTempDirSync({ prefix: "operator-config-log-" }, (dir) => {
      const configPath = path.join(dir, "operator.json");
      const backupPath = `${configPath}.bak`;
      fs.writeFileSync(backupPath, "{}", "utf8");

      expect(
        formatConfigUpdatedMessage(configPath, {
          backupPath,
        }),
      ).toBe(`Updated config: ${configPath}\n  Backup: ${backupPath}`);
    });
  });
});
