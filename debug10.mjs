import { resolvePluginNpmRuntimeBuildPlan } from './scripts/lib/plugin-npm-runtime-build.mjs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const pluginDir = 'qqbot';
const packageDir = path.join(repoRoot, 'extensions', pluginDir);

console.log('Testing plugin:', pluginDir);
const plan = resolvePluginNpmRuntimeBuildPlan({ repoRoot, packageDir });
console.log('plan:', plan);

if (!plan) {
  console.log('ERROR: plan is null');
  process.exit(1);
}

console.log('SUCCESS: plan is not null');
console.log('runtimeFormat:', plan.runtimeFormat);
console.log('Expected for qqbot (no runtimeFormat specified): esm');
console.log('Match:', plan.runtimeFormat === 'esm');
console.log('runtimeExtensions:', plan.runtimeExtensions);
console.log('runtimeSetupEntry:', plan.runtimeSetupEntry);