#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const operatorPath = path.dirname(fileURLToPath(import.meta.url)) + "/operator.mjs";
const child = spawn(process.execPath, [operatorPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code, signal) => {
  process.exit(code ?? 1);
});
