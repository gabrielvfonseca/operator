const fs = require('fs');
const data = JSON.parse(fs.readFileSync('apps/.i18n/native-source.json', 'utf8'));

// Find duplicates considering source, kind, and surface
const seen = new Map();
const duplicates = [];
for (const entry of data.entries) {
  const key = `${entry.source}|||${entry.kind}|||${entry.surface}`;
  if (seen.has(key)) {
    duplicates.push({
      entry: entry,
      firstId: seen.get(key),
      key: key
    });
  } else {
    seen.set(key, entry.id);
  }
}
console.log('Total entries:', data.entries.length);
console.log('Duplicates (same source, kind, surface):', duplicates.length);
if (duplicates.length > 0) {
  console.log('First few duplicates:');
  for (let i = 0; i < Math.min(5, duplicates.length); i++) {
    const dup = duplicates[i];
    console.log(`  Source: "${dup.entry.source}"`);
    console.log(`    Kind: ${dup.entry.kind}, Surface: ${dup.entry.surface}`);
    console.log(`    First ID: ${dup.firstId}`);
    console.log(`    Dup ID: ${dup.entry.id}`);
    console.log(`    First path: ${data.entries.find(e => e.id === dup.firstId).path}`);
    console.log(`    Dup path: ${dup.entry.path}`);
    console.log('');
  }
}