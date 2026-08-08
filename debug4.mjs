import { resolvePackageDir, readJsonFile } from './scripts/lib/plugin-npm-runtime-build.mjs';
import { normalizePackageEntry, isTypeScriptEntry, collectPluginSourceEntries, collectTopLevelPublicSurfaceEntries, packageEntryKey, normalizeOpenclawPeerRange, resolveRuntimeBuildFormat, toPackageRuntimeEntry } from './scripts/lib/bundled-plugin-build-entries.mjs';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const pluginDir = 'extensions/tencent';
const packageDir = resolvePackageDir(repoRoot, pluginDir);
console.log('packageDir:', packageDir);
const packageJsonPath = path.join(packageDir, "package.json");
console.log('packageJsonPath:', packageJsonPath);
console.log('fs.existsSync(packageJsonPath):', fs.existsSync(packageJsonPath));
if (!fs.existsSync(packageJsonPath)) {
  console.log('package.json does not exist');
  process.exit(1);
}
const packageJson = readJsonFile(packageJsonPath);
console.log('packageJson:', JSON.stringify(packageJson, null, 2));

// Check isPublishablePluginPackage
const isPublishable = (packageJson.operator?.release?.publishToNpm === true) ||
  (packageJson.operator?.release?.publishToClawHub === true);
console.log('isPublishable:', isPublishable);
if (!isPublishable) {
  console.log('Not publishable');
  process.exit(0);
}

// Check collectPluginSourceEntries
const packageEntries = collectPluginSourceEntries(packageJson).map(normalizePackageEntry);
console.log('packageEntries:', packageEntries);

// Check isTypeScriptEntry for each entry
const typeScriptEntries = packageEntries.filter(isTypeScriptEntry);
console.log('typeScriptEntries:', typeScriptEntries);
const requiresRuntimeBuild = typeScriptEntries.length > 0;
console.log('requiresRuntimeBuild:', requiresRuntimeBuild);
if (!requiresRuntimeBuild) {
  console.log('Does not require runtime build');
  process.exit(0);
}

// Check resolveRuntimeBuildFormat
const runtimeFormat = resolveRuntimeBuildFormat(packageJson);
console.log('runtimeFormat:', runtimeFormat);

// Check collectTopLevelPublicSurfaceEntries
const topLevelEntries = collectTopLevelPublicSurfaceEntries(packageDir).map(normalizePackageEntry);
console.log('topLevelEntries:', topLevelEntries);

// Check sourceEntries combination
const sourceEntries = [
  ...new Set([
    ...packageEntries,
    ...topLevelEntries,
  ]),
].filter(Boolean);
console.log('sourceEntries:', sourceEntries);

// Check entry creation
const entry = Object.fromEntries(
  sourceEntries.map((sourceEntry) => [
    packageEntryKey(sourceEntry),
    path.join(packageDir, sourceEntry.replace(/^\.\//u, "")),
  ]),
);
console.log('entry:', entry);

// If we get here, then the plan should not be null
console.log('Should have a plan');