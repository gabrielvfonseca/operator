import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const repoRoot = process.argv[2] || process.cwd();

function updateTsconfig(filePath, relativeExtends) {
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return false;
  }
  const config = JSON.parse(content);

  let newExtends;
  if (relativeExtends.startsWith("../../tsconfig.json")) {
    newExtends = "@operator/typescript-config/core";
  } else if (relativeExtends.includes("tsconfig.package-boundary")) {
    newExtends = "@operator/typescript-config/extensions";
  } else if (relativeExtends.includes("tsconfig.json")) {
    newExtends = "@operator/typescript-config/core";
  } else {
    newExtends = relativeExtends;
  }

  const keepKeys = ["compilerOptions", "include", "exclude", "files", "references"];
  const newConfig = {};
  for (const key of keepKeys) {
    if (config[key] !== undefined) {
      newConfig[key] = config[key];
    }
  }

  if (Object.keys(newConfig).length === 0) {
    newConfig.compilerOptions = {};
  }

  newConfig.extends = newExtends;

  const normalized = JSON.stringify(newConfig, null, 2) + "\n";
  if (normalized !== content) {
    writeFileSync(filePath, normalized, "utf8");
    console.log("updated", filePath);
    return true;
  }
  return false;
}

let updatedCount = 0;

for (const pkg of readdirSync(join(repoRoot, "packages"))) {
  const tsconfigPath = join(repoRoot, "packages", pkg, "tsconfig.json");
  try {
    statSync(tsconfigPath);
  } catch {
    continue;
  }
  const content = readFileSync(tsconfigPath, "utf8");
  const config = JSON.parse(content);
  const extendsVal = config.extends || "";
  if (updateTsconfig(tsconfigPath, extendsVal)) {
    updatedCount++;
  }
}

for (const pkg of readdirSync(join(repoRoot, "sdks"))) {
  const tsconfigPath = join(repoRoot, "sdks", pkg, "tsconfig.json");
  try {
    statSync(tsconfigPath);
  } catch {
    continue;
  }
  const content = readFileSync(tsconfigPath, "utf8");
  const config = JSON.parse(content);
  const extendsVal = config.extends || "";
  if (updateTsconfig(tsconfigPath, extendsVal)) {
    updatedCount++;
  }
}

for (const ext of readdirSync(join(repoRoot, "extensions"))) {
  const tsconfigPath = join(repoRoot, "extensions", ext, "tsconfig.json");
  try {
    statSync(tsconfigPath);
  } catch {
    continue;
  }
  const content = readFileSync(tsconfigPath, "utf8");
  const config = JSON.parse(content);
  const extendsVal = config.extends || "";
  if (updateTsconfig(tsconfigPath, extendsVal)) {
    updatedCount++;
  }
}

console.log(`updated ${updatedCount} tsconfig files`);
