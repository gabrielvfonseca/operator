import { isPublishablePluginPackage } from './scripts/lib/plugin-npm-runtime-build.mjs';
import { readJsonFile } from './scripts/lib/plugin-npm-runtime-build.mjs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const packageDir = path.join(repoRoot, 'extensions', 'nostr');
const packageJsonPath = path.join(packageDir, 'package.json');
const packageJson = readJsonFile(packageJsonPath);

console.log('packageJson:', JSON.stringify(packageJson, null, 2));
console.log('isPublishablePluginPackage:', isPublishablePluginPackage(packageJson));