const fs = require('fs');
const data = JSON.parse(fs.readFileSync('apps/.i18n/native-source.json', 'utf8'));

// Check for duplicates based on surface+path+source (what the script considers unique)
const seen = new Map();
const duplicates = [];
for (const entry of data.entries) {
  const key = `${entry.surface}|||${entry.path}|||${entry.source}`;
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
console.log('Duplicates (same surface, path, source):', duplicates.length);
if (duplicates.length > 0) {
  console.log('First few duplicates:');
  for (let i = 0; i < Math.min(5, duplicates.length); i++) {
    const dup = duplicates[i];
    console.log(`  Source: "${dup.entry.source}"`);
    console.log(`    Surface: ${dup.entry.surface}`);
    console.log(`    Path: ${dup.entry.path}`);
    console.log(`    First ID: ${dup.firstId}`);
    console.log(`    Dup ID: ${dup.entry.id}`);
    console.log('');
  }
} else {
  console.log('No duplicates found based on surface+path+source - this is expected!');
}