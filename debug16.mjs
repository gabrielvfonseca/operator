const { resolveOpenclawPeerRange } = require('./scripts/lib/plugin-npm-runtime-build.mjs');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

async function test() {
  const packageDir = 'extensions/acpx';
  const packageJsonPath = join(packageDir, 'package.json');
  const packageJsonText = await readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonText);

  console.log('packageJson.operator:', packageJson.operator);
  console.log('packageJson[\'@gabrielvfonseca/operator\"]:', packageJson['@gabrielvfonseca/operator']);

  const operatorConfig = packageJson.operator ?? packageJson['@gabrielvfonseca/operator'];
  console.log('operatorConfig:', operatorConfig);

  if (operatorConfig) {
    console.log('operatorConfig.compat:', operatorConfig.compat);
    console.log('operatorConfig.compat?.pluginApi:', operatorConfig.compat?.pluginApi);
    
    const result = resolveOpenclawPeerRange(packageJson, {});
    console.log('resolveOpenclawPeerRange result:', JSON.stringify(result));
  } else {
    console.log('No operator config found!');
  }
}

test().catch(console.error);