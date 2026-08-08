import { resolvePluginNpmRuntimeBuildPlan } from './scripts/lib/plugin-npm-runtime-build.mjs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const packageDir = path.join(repoRoot, 'extensions', 'tencent');

console.log('Calling resolvePluginNpmRuntimeBuildPlan with:');
console.log('  repoRoot:', repoRoot);
console.log('  packageDir:', packageDir);

const plan = resolvePluginNpmRuntimeBuildPlan({ repoRoot, packageDir });
console.log('Result:', plan);