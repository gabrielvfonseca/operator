import { resolvePluginNpmRuntimeBuildPlan } from './scripts/lib/plugin-npm-runtime-build.mjs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const pluginDir = 'extensions/memory-lancedb';
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
console.log('packageJson.operator?.compat?.pluginApi:', JSON.stringify(plan.packageJson.operator?.compat?.pluginApi));
console.log('packagePeerMetadata.peerDependencies.operator:', JSON.stringify(plan.packagePeerMetadata?.peerDependencies?.operator));
console.log('Are they equal?', Object.is(plan.packageJson.operator?.compat?.pluginApi, plan.packagePeerMetadata?.peerDependencies?.operator));