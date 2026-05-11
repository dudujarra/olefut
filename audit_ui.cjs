const fs = require('fs');
const path = require('path');

const forbiddenPatterns = [
  /rgba\(/i,
  /opacity\s*:/i,
  /border-?radius/i,
  /linear-gradient/i,
  /radial-gradient/i,
  /backdrop-filter/i,
  /blur\(/i,
  /font-family.*(Inter|Roboto|Outfit)/i,
  /box-shadow/i
];

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, results);
    } else if (/\.(css|jsx|js)$/.test(file)) {
      const content = fs.readFileSync(filePath, 'utf8');
      forbiddenPatterns.forEach(regex => {
        if (regex.test(content)) {
          results.push(`${filePath} - matches ${regex}`);
        }
      });
    }
  }
  return results;
}

const violations = scanDirectory('./src');
console.log(`Found ${violations.length} potential violations:`);
violations.forEach(v => console.log(v));
