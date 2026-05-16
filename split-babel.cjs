const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const srcPath = path.join(__dirname, 'src/services/SeasonProcessor.js');
const code = fs.readFileSync(srcPath, 'utf8');

const targetDir = path.join(__dirname, 'src/services/season');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['classProperties']
});

let imports = [];
traverse(ast, {
    ImportDeclaration(path) {
        imports.push(generate(path.node).code);
    }
});

const importsCode = imports.join('\n');

let extractedMethods = [];

traverse(ast, {
    ClassMethod(path) {
        if (path.node.key.name && path.node.key.name.startsWith('_process')) {
            const originalName = path.node.key.name;
            const newName = originalName.replace('_', '');
            extractedMethods.push({ originalName, newName });
            
            // Create a standalone function declaration
            const funcDecl = t.functionDeclaration(
                t.identifier(newName),
                path.node.params,
                path.node.body
            );
            
            const exportNamed = t.exportNamedDeclaration(funcDecl, []);
            
            // Generate code for the new file
            let funcCode = generate(exportNamed).code;
            
            // We need to inject the imports
            let fileContent = `${importsCode}\n\n${funcCode}\n`;
            
            fs.writeFileSync(require('path').join(targetDir, `${newName}.js`), fileContent);
            console.log(`Extracted ${newName}.js`);
            
            // Replace the method body in the class
            path.get('body').replaceWith(
                t.blockStatement([
                    t.expressionStatement(
                        t.callExpression(
                            t.identifier(newName),
                            path.node.params.map(p => {
                                if (p.type === 'AssignmentPattern') return p.left;
                                if (p.type === 'RestElement') return t.spreadElement(p.argument);
                                return p;
                            })
                        )
                    )
                ])
            );
        }
    }
});

let newCode = generate(ast).code;

// Prepend imports
let newImports = extractedMethods.map(m => `import { ${m.newName} } from './season/${m.newName}.js';`).join('\n');
// We insert newImports after the last existing import.
const lastImportIndex = newCode.lastIndexOf('import ');
let insertPos = newCode.indexOf('\n', lastImportIndex);
if (insertPos === -1) insertPos = 0;

newCode = newCode.slice(0, insertPos) + '\n' + newImports + newCode.slice(insertPos);

fs.writeFileSync(srcPath, newCode);
console.log('SeasonProcessor.js rewritten with babel!');
