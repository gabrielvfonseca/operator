import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();

const repls = [
  ["@operator/plugin-sdk", "@operator/plugin-sdk"],
  ["@operator/sdk", "@operator/operator-sdk"],
  ["packages/plugin-sdk", "sdks/plugin-sdk"],
  ["packages/sdk", "sdks/operator-sdk"],
];

const skipDirs = new Set([
  "node_modules",
  "dist",
  ".git",
  "bun.lockb",
  ".artifacts",
  "tests",
  ".kilo",
]);

const codeExts = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".toml", ".yaml", ".yml", ".md"]);

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = readdirSync(full);
    } catch {
      stat = null;
    }
    if (stat) {
      walk(full);
    } else if (codeExts.has(extname(entry))) {
      try {
        let content = readFileSync(full, "utf8");
        let changed = false;
        for (const [from, to] of repls) {
          if (content.includes(from)) {
            content = content.split(from).join(to);
            changed = true;
          }
        }
        if (changed) {
          writeFileSync(full, content, "utf8");
          console.log("updated", full);
        }
      } catch {
        // skip binary or unreadable files
      }
    }
  }
}

walk(root);
console.log("bulk replace complete");
