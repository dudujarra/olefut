import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');

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

for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('import { rng as systemRng } from')) {
        content = content.replace(/import \{ rng as systemRng \} from '([^']+?)';/g, (m, p) => {
            if (p.endsWith('.js')) return m;
            return `import { rng as systemRng } from '${p}.js';`;
        });
        fs.writeFileSync(file, content, 'utf8');
    }
}
