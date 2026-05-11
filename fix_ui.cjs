const fs = require('fs');
const path = require('path');

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, results);
    } else if (/\.(css|jsx|js)$/.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

const files = scanDirectory('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Font violations
  if (/font-family:\s*['"]Inter['"],\s*sans-serif;?/i.test(content)) {
    content = content.replace(/font-family:\s*['"]Inter['"],\s*sans-serif;?/gi, "font-family: 'Pixelify Sans', system-ui, sans-serif;");
    modified = true;
  }
  if (/font-family:\s*['"]Outfit['"],\s*sans-serif;?/i.test(content)) {
    content = content.replace(/font-family:\s*['"]Outfit['"],\s*sans-serif;?/gi, "font-family: 'Press Start 2P', monospace;");
    modified = true;
  }
  
  // Glassmorphism and Gradients
  if (/backdrop-filter/i.test(content)) {
    content = content.replace(/backdrop-filter.*?;/gi, "/* backdrop-filter removed */");
    modified = true;
  }
  if (/linear-gradient/i.test(content)) {
    content = content.replace(/background(-image)?:\s*linear-gradient.*?;/gi, "background: #111417; /* Replaced gradient */");
    modified = true;
  }
  if (/radial-gradient/i.test(content)) {
    content = content.replace(/background(-image)?:\s*radial-gradient.*?;/gi, "background: #111417; /* Replaced gradient */");
    modified = true;
  }
  if (/(?<!-)opacity\s*:\s*(0\.\d+|[1-9]\d*%|0)/i.test(content)) {
    content = content.replace(/(?<!-)opacity\s*:\s*(0\.\d+|[1-9]\d*%|0)\s*;/gi, "/* opacity removed for brand compliance */");
    modified = true;
  }
  
  // rgba colors -> solid colors or removed
  if (/rgba\(/i.test(content)) {
    // We will replace rgba(0,0,0,x) with #040805
    content = content.replace(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.\d+\s*\)/gi, '#040805');
    // rgba(255,255,255,x) with #F1FAEE
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0?\.\d+\s*\)/gi, '#F1FAEE');
    // other rgbas
    content = content.replace(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0?\.\d+\s*\)/gi, '#111417 /* Fallback CRT Black */');
    modified = true;
  }

  // Box shadow removed
  if (/box-shadow\s*:/i.test(content)) {
    content = content.replace(/box-shadow\s*:.*?;/gi, "/* box-shadow removed for brand compliance */");
    modified = true;
  }
  
  // Border radius zero
  if (/border-radius\s*:/i.test(content)) {
    // Replace all border-radius with 0 EXCEPT if it's already 0
    // Actually, simply do: border-radius: 0 !important;
    content = content.replace(/border-radius\s*:\s*[^0][^;]*;/gi, "border-radius: 0;");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Cleaned up: ${file}`);
  }
});
