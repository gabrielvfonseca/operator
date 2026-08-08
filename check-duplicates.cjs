const fs = require('fs');
const data = JSON.parse(fs.readFileSync('apps/.i18n/native-source.json', 'utf8'));
console.log('Total entries:', data.entries.length);

// Check for duplicate source texts
const sources = new Map();
let duplicates = 0;
const duplicateDetails = [];
for (const entry of data.entries) {
  if (sources.has(entry.source)) {
    duplicates++;
    // Only store first few for reporting
    if (duplicateDetails.length < 5) {
      duplicateDetails.push({
        source: entry.source,
        first: sources.get(entry.source),
        current: entry.id
      });
    }
  } else {
    sources.set(entry.source, entry.id);
  }
}
console.log('Duplicate source texts:', duplicates);
console.log('Unique source texts:', sources.size);
if (duplicates > 0) {
  console.log('First few duplicates:');
  for (let i = 0; i < Math.min(5, duplicateDetails.length); i++) {
    const dd = duplicateDetails[i];
    console.log(`  Source: "${dd.source}"`);
    console.log(`    First ID: ${dd.first}`);
    console.log(`    Dup ID: ${dd.current}`);
  }
}
// Check for empty sources
let emptyCount = 0;
for (const entry of data.entries) {
  if (entry.source === '') {
    emptyCount++;
  }
}
console.log('Empty source entries:', emptyCount);