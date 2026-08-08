const { resolvePluginNpmRuntimeBuildPlan } = require('./scripts/lib/plugin-npm-runtime-build.mjs');
const path = require('path');

const repoRoot = path.resolve(__dirname);
const packageDir = path.join(repoRoot, 'extensions', 'memory-lancedb');

console.log('packageDir:', packageDir);
const plan = resolvePluginNpmRuntimeBuildPlan({ repoRoot, packageDir });
console.log('plan:', plan);