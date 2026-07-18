#!/usr/bin/env node
// Bun-native TypeScript build system

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.error("[build] Starting Bun-native TypeScript compilation...");

// Check if TypeScript is available
try {
  // Try to compile using Bun's built-in TypeScript support
  console.error("[build] Compiling with Bun's TypeScript transpiler...");
  execSync("tsc --project tsconfig.json --outDir dist", { stdio: "inherit" });
  console.error("[build] TypeScript compilation complete!");
} catch (error) {
  console.error("[build] Error during TypeScript compilation:", error);
  process.exit(1);
}

console.error("[build] Build successful!");
