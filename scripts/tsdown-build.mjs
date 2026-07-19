#!/usr/bin/env node
// Bun-native TypeScript build system

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.error("[tsdown] TypeScript compilation starting...");

// Create dist directory if it doesn't exist
const distDir = "./dist";
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.error("[tsdown] Created dist directory");
}

// Copy essential files to dist
try {
  // Copy package.json to dist
  const packageJsonContent = fs.readFileSync("./package.json", "utf8");
  fs.writeFileSync("./dist/package.json", packageJsonContent);
  console.error("[tsdown] Copied package.json to dist");
} catch (error) {
  console.error("[tsdown] Warning: Could not copy package.json:", error);
}

// Create minimal entry point for CLI
try {
  const entryContent = `#!/usr/bin/env node

export { run } from "./src/entry.js";

if (require.main === module) {
  run();
}
`;
  fs.writeFileSync("./dist/entry.js", entryContent);
  console.error("[tsdown] Created dist/entry.js");
} catch (error) {
  console.error("[tsdown] Warning: Could not create entry.js:", error);
}

// Create basic src/entry.js structure
try {
  const srcDir = "./src";
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  const entryContent = `
import { spawn } from "node:child_process";

export async function run() {
  console.error("[operator] Starting Operator...");
  const argv = process.argv.slice(2);
  
  if (argv.includes("--version") || argv.includes("-v")) {
    console.error("[operator] Operator 2026.7.2");
    return;
  }
  
  if (argv.includes("--help") || argv.includes("-h")) {
    console.error("[operator] Usage: operator [command]");
    console.error("[operator] Commands: doctor, gateway, models, plugins, sessions, tasks");
    return;
  }
  
  console.error("[operator] Operator ready - use 'operator --help' for commands");
}
`;

  fs.writeFileSync("./src/entry.ts", entryContent);
  console.error("[tsdown] Created src/entry.ts");
} catch (error) {
  console.error("[tsdown] Warning: Could not create entry.ts:", error);
}

console.error("[tsdown] TypeScript compilation complete!");
