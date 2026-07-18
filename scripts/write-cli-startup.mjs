#!/usr/bin/env node
// Write CLI startup metadata

import fs from "node:fs";
import path from "node:path";

console.error("[write-cli-startup] Writing CLI startup metadata...");

const metadata = {
  version: "2026.7.2",
  build: "bun-native",
  timestamp: new Date().toISOString(),
  runtime: "node",
};

fs.writeFileSync("./dist/cli-startup-metadata.json", JSON.stringify(metadata, null, 2));
console.error("[write-cli-startup] CLI startup metadata created");
