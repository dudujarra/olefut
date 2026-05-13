// Regression test for BUG-011
// regression.yml step "Comment on PR" falhava 403 (Resource not accessible)
// Fix: adicionar permissions: pull-requests/issues write no workflow
// Issue: https://github.com/dudujarra/olefut/issues/7
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('BUG-011 regression: regression.yml has PR write permissions', () => {
    test('regression.yml exists', () => {
        const p = path.join(projectRoot, '.github/workflows/regression.yml');
        expect(fs.existsSync(p)).toBe(true);
    });

    test('Workflow has permissions block', () => {
        const p = path.join(projectRoot, '.github/workflows/regression.yml');
        const content = fs.readFileSync(p, 'utf-8');
        expect(content).toMatch(/permissions:/);
    });

    test('pull-requests: write set', () => {
        const p = path.join(projectRoot, '.github/workflows/regression.yml');
        const content = fs.readFileSync(p, 'utf-8');
        expect(content).toMatch(/pull-requests:\s*write/);
    });

    test('issues: write set', () => {
        const p = path.join(projectRoot, '.github/workflows/regression.yml');
        const content = fs.readFileSync(p, 'utf-8');
        expect(content).toMatch(/issues:\s*write/);
    });
});
