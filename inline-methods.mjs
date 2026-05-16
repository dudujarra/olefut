import fs from 'fs';
import path from 'path';

const file = 'src/services/SeasonProcessor.js';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace this._processXYZ(...) with processXYZ(...) (or handlePromoRelegation for processPromoRelegation)
code = code.replace(/this\._processPromoRelegation\((.*?)\)/g, 'handlePromoRelegation($1)');
code = code.replace(/this\._process([A-Za-z]+)\((.*?)\)/g, 'process$1($2)');

// 2. Remove the method definitions
// The methods look like:
//   _processXYZ(...) {
//     processXYZ(...);
//   }
// Or handlePromoRelegation, etc.
// We can use a regex to match from `  _process` to the matching closing brace.
code = code.replace(/^[ \t]*_process[A-Za-z]+\(.*?\)\s*\{\s*[\s\S]*?^\s*\}/gm, '');

// Also remove `/** @private */` that were above those methods
code = code.replace(/^[ \t]*\/\*\* @private \*\/[\r\n]+(?=[\r\n])/gm, '');

// Clean up extra blank lines created by removal
code = code.replace(/(\n\s*){3,}/g, '\n\n');

fs.writeFileSync(file, code);
console.log('Inlined proxy methods in SeasonProcessor.js');
