import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.resolve('./node_modules/plugin-sdk');
console.log('pkgPath:', pkgPath);
console.log('fs.existsSync(pkgPath):', fs.existsSync(pkgPath));

const corePath = path.join(pkgPath, 'dist', 'src', 'plugin-sdk', 'core.d.ts');
console.log('corePath:', corePath);
console.log('fs.existsSync(corePath):', fs.existsSync(corePath));

if (fs.existsSync(corePath)) {
  const content = fs.readFileSync(corePath, 'utf8');
  console.log('core.d.ts file exists and has length:', content.length);
} else {
  console.log('core.d.ts file does not exist');
}