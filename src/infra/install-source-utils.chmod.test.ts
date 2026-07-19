import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAutoCleanupTempDirTracker } from "../../test/helpers/temp-dir.js";

const resolvePreferredOperatorTmpDirMock = vi.hoisted(() => vi.fn());

vi.mock("./tmp-operator-dir.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./tmp-operator-dir.js")>();
  return {
    ...actual,
    resolvePreferredOperatorTmpDir: resolvePreferredOperatorTmpDirMock,
  };
});

import { withTempDir } from "./install-source-utils.js";

describe("withTempDir private root", () => {
  const tempDirs = useAutoCleanupTempDirTracker(afterEach);

  it.runIf(process.platform !== "win32")(
    "preserves parent temp root permissions when using private Operator temp root",
    async () => {
      const mockParentRoot = tempDirs.make("operator-chmod-test-");
      const mockOperatorDir = path.join(mockParentRoot, "@gabrielvfonseca/operator");

      await fs.mkdir(mockOperatorDir, { recursive: true });
      await fs.chmod(mockParentRoot, 0o1777);
      const canonicalOperatorDir = await fs.realpath(mockOperatorDir);

      resolvePreferredOperatorTmpDirMock.mockReturnValue(mockOperatorDir);

      let observedDir = "";
      const value = await withTempDir("operator-test-", async (tmpDir) => {
        observedDir = tmpDir;
        expect(path.dirname(tmpDir)).toBe(canonicalOperatorDir);
        await fs.writeFile(path.join(tmpDir, "marker.txt"), "ok");
        return "done";
      });

      expect(value).toBe("done");

      await expect(
        fs.stat(observedDir).then(
          () => true,
          () => false,
        ),
      ).resolves.toBe(false);

      const privateRootStat = await fs.stat(mockOperatorDir);
      expect(privateRootStat.mode & 0o7777).toBe(0o700);

      const parentStat = await fs.stat(mockParentRoot);
      expect(parentStat.mode & 0o7777).toBe(0o1777);
    },
  );
});
