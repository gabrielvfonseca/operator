import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const roots = [process.argv[2], process.argv[3]].filter(Boolean);

const moved = [];
const skipped = [];

function walkDir(dir, callback) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walkDir(full, callback);
    } else {
      callback(full);
    }
  }
}

for (const root of roots) {
  for (const pkg of readdirSync(root)) {
    const srcRoot = join(root, pkg, "src");
    const testsRoot = join(root, pkg, "tests");
    let srcRootStat;
    try {
      srcRootStat = statSync(srcRoot);
    } catch {
      continue;
    }
    if (!srcRootStat.isDirectory()) continue;

    const testFiles = [];
    walkDir(srcRoot, (file) => {
      if (file.endsWith(".test.ts") || file.endsWith(".e2e.test.ts")) {
        testFiles.push(file);
      }
    });

    for (const srcPath of testFiles) {
      const relPath = relative(srcRoot, srcPath);
      const testPath = join(testsRoot, relPath);
      const testDir = dirname(testPath);
      mkdirSync(testDir, { recursive: true });
      try {
        renameSync(srcPath, testPath);
        moved.push(testPath);
      } catch (err) {
        skipped.push({ path: srcPath, reason: err.message });
        continue;
      }

      let content = readFileSync(testPath, "utf8");
      const oldDir = dirname(srcPath);
      const newDir = dirname(testPath);
      const relFromNew = relative(newDir, oldDir).replace(/\\/g, "/");
      const relFromOld = relative(oldDir, newDir).replace(/\\/g, "/");

      let changed = false;
      content = content.replace(
        /from\s+["'](\.{1,2}\/[^"']+)\/src\/([^"']+)["']/g,
        (match, p1, p2) => {
          const replaced = match.replace(`/src/${p2}`, `/${p2}`);
          if (replaced !== match) {
            changed = true;
            return replaced;
          }
          return match;
        },
      );

      if (changed) {
        writeFileSync(testPath, content, "utf8");
      }
    }
  }
}

console.log(`moved ${moved.length} test files`);
for (const s of skipped) {
  console.log("skipped", s.path, s.reason);
}
