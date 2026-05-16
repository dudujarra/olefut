const fs = require('fs');
const path = require('path');

function walk(dir) {
   let results = [];
   const list = fs.readdirSync(dir);
   list.forEach(file => {
       const filePath = path.join(dir, file);
       const stat = fs.statSync(filePath);
       if (stat && stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) { 
           results = results.concat(walk(filePath));
       } else {
           if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) results.push(filePath);
       }
   });
   return results;
}

const files = walk(path.join(__dirname, '../src')).concat(walk(path.join(__dirname, '../tests')));

let updatedFiles = 0;

files.forEach(file => {
    // Skip engine.js and engineFactory.js
    if (file.endsWith('engine.js') || file.endsWith('engineFactory.js')) return;

    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    // Replace new Engine() first
    if (content.includes('new Engine()')) {
        content = content.replace(/new Engine\(\)/g, 'createEngine()');
        changed = true;
    }

    // Replace the import if createEngine is now used
    if (changed && content.includes('createEngine()') && !content.includes('import { createEngine }')) {
        // Find the import for Engine
        const engineImportRegex = /import\s+{\s*([^}]*)\bEngine\b([^}]*)\s*}\s+from\s+['"](.*)\/engine(?:\.js)?['"];/g;
        
        if (engineImportRegex.test(content)) {
            // reset regex index
            engineImportRegex.lastIndex = 0;
            content = content.replace(engineImportRegex, (match, p1, p2, p3) => {
                return `${match}\nimport { createEngine } from '${p3}/engineFactory.js';`;
            });
        } else {
            // Some files might just use it without importing if they are weird, but let's log them
            console.log('WARNING: new Engine() replaced but import { Engine } not found in', file);
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
        updatedFiles++;
    }
});

console.log(`Successfully killed the elephant. Decoupled ${updatedFiles} files to use createEngine() factory.`);
