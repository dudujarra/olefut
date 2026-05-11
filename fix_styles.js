const fs = require('fs');

const filesToFix = [
  './src/styles/luxury-arcade.css',
  './src/index.css',
  './src/components/ui/EfInput.jsx',
  './src/App.jsx'
];

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix fonts
  content = content.replace(/font-family:\s*['"]Inter['"],\s*sans-serif;/g, "font-family: 'Pixelify Sans', system-ui, sans-serif;");
  content = content.replace(/font-family:\s*['"]Outfit['"],\s*sans-serif;/g, "font-family: 'Press Start 2P', monospace;");
  
  // Fix rgba/opacity
  content = content.replace(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0?\.\d+\s*\)/g, 'transparent /* REPLACE_WITH_SOLID_OR_DITHER */');
  
  fs.writeFileSync(file, content);
  console.log(`Fixed fonts in ${file}`);
});
