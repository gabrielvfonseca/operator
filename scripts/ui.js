#!/usr/bin/env node
// UI build script (stub for Bun)

import fs from "node:fs";

console.error("[ui] Building UI...");

// Create dist/ui directory if it doesn't exist
const distUIDir = "./dist/ui";
if (!fs.existsSync(distUIDir)) {
  fs.mkdirSync(distUIDir, { recursive: true });
  console.error("[ui] Created dist/ui directory");
}

// Create minimal index.html
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Operator UI</title>
</head>
<body>
  <div id="app">Operator UI Placeholder</div>
  <script type="module" src="/@vite/client"></script>
</body>
</html>`;

fs.writeFileSync("./dist/ui/index.html", indexHtml);
console.error("[ui] Created dist/ui/index.html");

console.error("[ui] UI build complete!");
