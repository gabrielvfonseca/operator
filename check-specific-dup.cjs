const fs = require('fs');
const data = JSON.parse(fs.readFileSync('apps/.i18n/native-source.json', 'utf8'));

// Find a specific duplicate to investigate
const targetSource = "Connecting...";
const targetSurface = "apple";
const targetPath = "apps/ios/ActivityWidget/OperatorLiveActivity.swift";

const matchingEntries = data.entries.filter(
  entry => entry.source === targetSource && 
           entry.surface === targetSurface && 
           entry.path === targetPath
);

console.log(`Found ${matchingEntries.length} entries for source="${targetSource}" in ${targetPath}:`);
matchingEntries.forEach((entry, index) => {
  console.log(`  ${index + 1}. ID: ${entry.id}, line: ${entry.line}`);
});