#!/bin/bin/env node
// Create build stamp file

import fs from "node:fs";
import path from "node:path";

console.error("[build-stamp] Creating build stamp...");

const stamp = {
  version: "2026.7.2",
  timestamp: new Date().toISOString(),
  commit: "unknown",
  buildType: "bun-native",
};

fs.writeFileSync("./dist/build-info.json", JSON.stringify(stamp, null, 2));
console.error("[build-stamp] Build stamp created: build-info.json");
