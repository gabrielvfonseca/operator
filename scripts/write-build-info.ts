#!/usr/bin/env node
// Write build info metadata

import fs from "node:fs";
import path from "node:path";

console.error("[write-build-info] Writing build metadata...");

const buildInfo = {
  version: "2026.7.2",
  build: "bun-native",
  timestamp: new Date().toISOString(),
  commit: "unknown",
  platform: process.platform,
  architecture: process.arch,
  nodeVersion: process.version,
};

fs.writeFileSync("./dist/build-info.json", JSON.stringify(buildInfo, null, 2));
console.error("[write-build-info] Build info created: dist/build-info.json");
