import { resolvePluginNpmRuntimeBuildPlan } from './scripts/lib/plugin-npm-runtime-build.mjs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const pluginDir = 'extensions/qqbot';
const packageDir = path.join(repoRoot, pluginDir);

console.log('Testing plugin:', pluginDir);
console.log('packageDir:', packageDir);
const plan = resolvePluginNpmRuntimeBuildPlan({ repoRoot, packageDir });
console.log('plan:', plan);

if (!plan) {
  console.log('ERROR: plan is null');
  process.exit(1);
}

console.log('SUCCESS: plan is not null');