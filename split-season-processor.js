const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/services/SeasonProcessor.js');
let code = fs.readFileSync(srcPath, 'utf8');

const targetDir = path.join(__dirname, 'src/services/season');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

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

let extractedMethods = {};
let newImports = [];

for (const method of methods) {
    let methodIndex = classContent.indexOf(`${method}(`);
    if (methodIndex === -1) {
        methodIndex = classContent.indexOf(`    ${method}(`);
    }
    if (methodIndex === -1) {
        // Search with private tag
        methodIndex = classContent.indexOf(`/** @private */\n    ${method}(`);
        if (methodIndex !== -1) {
            methodIndex = classContent.indexOf(`${method}(`, methodIndex);
        }
    }
    
    // We will parse it simply by matching braces
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
    
    // Find where the method declaration actually starts
    let declStart = methodIndex;
    while (declStart > 0 && classContent[declStart] !== '\n') {
        declStart--;
    }
    
    // if there's a JSDoc, include it
    let jsDocStart = classContent.lastIndexOf('/** @private */', declStart);
    if (jsDocStart !== -1 && declStart - jsDocStart < 50) {
        declStart = jsDocStart;
    }

    let fullMethod = classContent.substring(declStart, endIndex);
    
    // Create the new module code
    // We need to identify all imports used in this method and include them!
    // But since that's hard, we will just export the function and let the caller pass whatever is needed, or we just put it in a file.
    let funcCode = `export function ${method.replace('_', '')}` + classContent.substring(methodIndex + method.length, endIndex);
    
    fs.writeFileSync(path.join(targetDir, `${method.replace('_', '')}.js`), funcCode);
    console.log(`Extracted ${method}`);
}
