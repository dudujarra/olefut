import fs from 'fs';
import path from 'path';

const targetDir = new URL('src/services/season', import.meta.url).pathname;
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.js'));

for (const file of files) {
    const filePath = path.join(targetDir, file);
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Replace import paths
    // '../engine/' -> '../../engine/'
    // './learning/' -> '../learning/'
    
    code = code.replace(/from '\.\.\/engine/g, "from '../../engine");
    code = code.replace(/from '\.\/learning/g, "from '../learning");
    
    fs.writeFileSync(filePath, code);
    console.log(`Fixed imports in ${file}`);
}
