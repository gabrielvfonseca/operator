#!/usr/bin/env node
// Runtime post-build stamp

import fs from "node:fs";
import path from "node:path";

console.error("[runtime-postbuild-stamp] Creating runtime post-build stamp...");

fs.writeFileSync("./dist/runtime-postbuild.stamp", "Bun-native runtime ready");
console.error("[runtime-postbuild-stamp] Runtime post-build stamp created");
