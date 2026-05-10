import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');
const RNG_FILE = path.resolve('./src/engine/rng.js');
const PLAYER_DEV_FILE = path.resolve('./src/engine/PlayerDevelopment.js');
const DATA_FILE = path.resolve('./src/engine/data.js');

function findJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findJsFiles(filePath, fileList);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const allFiles = findJsFiles(SRC_DIR);

let modifiedCount = 0;

for (const file of allFiles) {
    if (file === RNG_FILE || file === PLAYER_DEV_FILE || file === DATA_FILE) continue;

    let content = fs.readFileSync(file, 'utf8');

    if (content.includes('Math.random')) {
        // Replace all Math.random
        content = content.replace(/Math\.random/g, 'systemRng');

        // Add import
        if (!content.includes('import { rng as systemRng }')) {
            let relPath = path.relative(path.dirname(file), RNG_FILE);
            let importPath = relPath.replace(/\\/g, '/');
            if (!importPath.startsWith('.')) {
                importPath = './' + importPath;
            }
            // remove extension
            importPath = importPath.replace(/\.js$/, '');
            
            const importStmt = `import { rng as systemRng } from '${importPath}';\n`;
            
            // Put it after the last import if there are any, else at the top.
            const importRegex = /^import\s+.*?;\s*$/gm;
            let lastImportIndex = -1;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                lastImportIndex = match.index + match[0].length;
            }
            
            if (lastImportIndex !== -1) {
                content = content.slice(0, lastImportIndex) + '\n' + importStmt + content.slice(lastImportIndex);
            } else {
                content = importStmt + content;
            }
        }
        
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Refactored ${modifiedCount} files.`);
