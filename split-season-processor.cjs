const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/services/SeasonProcessor.js');
let code = fs.readFileSync(srcPath, 'utf8');

const targetDir = path.join(__dirname, 'src/services/season');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

// Extract all imports from SeasonProcessor.js
let importsEnd = code.indexOf('export class SeasonProcessor');
let imports = code.substring(0, importsEnd);

const methods = [
    '_processLegacy',
    '_processManagerIdentity',
    '_processContractGoals',
    '_processPromoRelegation',
    '_processTournamentPrizes',
    '_processBoardTension',
    '_processChronicle',
    '_processHallOfLegends',
    '_processHeritageTraits',
    '_processRivalryUpgrade',
    '_processFilhosRegen',
    '_processLuxuryTax',
    '_processMetaProgression'
];

let classStart = code.indexOf('export class SeasonProcessor {');
let classContent = code.substring(classStart);

let extractedCode = {};
let newSeasonProcessorContent = code;

for (const method of methods) {
    let methodIndex = classContent.indexOf(`${method}(`);
    if (methodIndex === -1) {
        methodIndex = classContent.indexOf(`    ${method}(`);
    }
    if (methodIndex === -1) {
        methodIndex = classContent.indexOf(`/** @private */\n    ${method}(`);
        if (methodIndex !== -1) {
            methodIndex = classContent.indexOf(`${method}(`, methodIndex);
        }
    }
    
    let startIndex = methodIndex;
    while (classContent[startIndex] !== '{' && startIndex < classContent.length) {
        startIndex++;
    }
    
    let braceCount = 1;
    let endIndex = startIndex + 1;
    while (braceCount > 0 && endIndex < classContent.length) {
        if (classContent[endIndex] === '{') braceCount++;
        else if (classContent[endIndex] === '}') braceCount--;
        endIndex++;
    }
    
    let declStart = methodIndex;
    while (declStart > 0 && classContent[declStart] !== '\n') {
        declStart--;
    }
    
    let jsDocStart = classContent.lastIndexOf('/** @private */', declStart);
    if (jsDocStart !== -1 && declStart - jsDocStart < 50) {
        declStart = jsDocStart;
    }

    let fullMethod = classContent.substring(declStart, endIndex);
    
    // Rewrite method inside SeasonProcessor to call the exported function
    const funcName = method.replace('_', '');
    
    // We create the new file
    // Replace 'this._' with just calling the function if needed (e.g. this._processSomething -> we don't have nested calls in these methods, they are mostly flat).
    let funcBody = classContent.substring(methodIndex + method.length, endIndex);
    let newFileContent = `${imports}\nexport function ${funcName}${funcBody}\n`;
    
    fs.writeFileSync(path.join(targetDir, `${funcName}.js`), newFileContent);
    console.log(`Extracted ${funcName}.js`);
    
    // Replace in SeasonProcessor.js body
    // The original call in process() is like `this._processX(engine, ...)`
    // We will change it to `processX(engine, ...)` later using regex.
    newSeasonProcessorContent = newSeasonProcessorContent.replace(fullMethod, `
    /** @private */
    ${method}(...args) {
        ${funcName}(...args);
    }
    `);
}

// Now replace the `this._processX` calls in `process()` method with direct imports? No, keeping `this._processX` wrapper is fine for backwards compatibility, we just need to import the new functions at the top!
let newImports = methods.map(m => `import { ${m.replace('_', '')} } from './season/${m.replace('_', '')}.js';`).join('\n');
newSeasonProcessorContent = newImports + '\n' + newSeasonProcessorContent;

fs.writeFileSync(srcPath, newSeasonProcessorContent);
console.log('SeasonProcessor.js rewritten.');

