const fs = require('fs');
const path = require('path');

const forbiddenPatterns = [
  /rgba\(/i,
  /(?<!-)opacity\s*:\s*(0\.\d+|[1-9]\d*%|0)/i,
  /linear-gradient/i,
  /radial-gradient/i,
  /backdrop-filter/i,
  /blur\(/i,
  /font-family.*(Inter|Roboto|Outfit)/i,
  /box-shadow\s*:\s*[^;\n]*?(?!removed)/i, // this matches box-shadow without 'removed' next to it... hard to do in pure regex
];

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, results);
    } else if (/\.(css|jsx|js)$/.test(file)) {
      let content = fs.readFileSync(filePath, 'utf8');
      // strip comments
      content = content.replace(/\/\*[\s\S]*?\*\//g, '');
      content = content.replace(/\/\/.*$/gm, '');
      
      forbiddenPatterns.forEach(regex => {
        if (regex.test(content)) {
          // ensure box-shadow isn't just `box-shadow removed`
          if (regex.toString().includes('box-shadow') && !/box-shadow\s*:[^;]+;/i.test(content)) return;
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
