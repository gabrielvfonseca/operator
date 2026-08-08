import { resolveRuntimeBuildFormat } from './scripts/lib/plugin-npm-runtime-build.mjs';
import fs from 'node:fs';
import path from 'node:path';

const msteamsPackagePath = path.resolve('./extensions/msteams/package.json');
console.log('msteamsPackagePath:', msteamsPackagePath);
const msteamsPackageJson = JSON.parse(fs.readFileSync(msteamsPackagePath, 'utf8'));
console.log('msteamsPackageJson.operator.build:', JSON.stringify(msteamsPackageJson.operator.build, null, 2));

const runtimeFormat = resolveRuntimeBuildFormat(msteamsPackageJson);
console.log('resolved runtimeFormat:', runtimeFormat);
console.log('Expected: cjs');
console.log('Match:', runtimeFormat === 'cjs');