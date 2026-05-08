// Regression test for BUG-010
// scripts/debug-bug.sh: bash interpretava 008+ como octal inválido
// Issue: https://github.com/dudujarra/elifoot-web/issues/5
// Validação: escript não falha em BUG-008 ou superior
import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const script = path.join(projectRoot, 'scripts/debug-bug.sh');

describe('BUG-010 regression: shell script octal handling', () => {
    test('Script roda help sem erro', () => {
        const out = execSync(`bash ${script} help`, { cwd: projectRoot, encoding: 'utf-8' });
        expect(out).toMatch(/debug-bug/);
    });

    test('Script search funcional', () => {
        const out = execSync(`bash ${script} search "SponsorsSystem"`, { cwd: projectRoot, encoding: 'utf-8' });
        expect(out).toMatch(/Search complete/);
    });

    test('Bash 10# base force aplicado', () => {
        // Confirma que script tem fix 10# em arithmetic
        const fs = require('fs');
        const content = fs.readFileSync(script, 'utf-8');
        expect(content).toMatch(/10#\$next_num/);
    });
});
