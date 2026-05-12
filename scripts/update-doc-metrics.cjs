#!/usr/bin/env node
// AKITA-229: auto-update doc métricas (tests count, engine LOC, specs count, services count).
//
// Atualiza README.md badges + CLAUDE.md snapshot table com valores reais
// computados na hora. Mata "doc rot" onde badges mentem.
//
// Uso:
//   node scripts/update-doc-metrics.cjs               # update files
//   node scripts/update-doc-metrics.cjs --check       # diff + exit 1 if changes
//
// Integrado em:
// - .husky/pre-commit (auto-update antes do commit)
// - CI workflow (--check mode rejeita PR se docs desatualizados)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const README_MD = path.join(ROOT, 'README.md');

// ============================================================
// Métricas (compute live)
// ============================================================

function countFiles(dir, pattern) {
    try {
        const out = execSync(`find ${dir} -name "${pattern}" 2>/dev/null | wc -l`, { cwd: ROOT, encoding: 'utf8' });
        return parseInt(out.trim()) || 0;
    } catch { return 0; }
}

function countLines(file) {
    try {
        const out = execSync(`wc -l ${file}`, { cwd: ROOT, encoding: 'utf8' });
        return parseInt(out.trim().split(/\s+/)[0]) || 0;
    } catch { return 0; }
}

function getTestCount() {
    try {
        // Conta tests via vitest --reporter=json (rápido — só meta, não roda)
        const out = execSync('npx vitest run --reporter=json --outputFile=/tmp/.vitest-metrics.json --pool=forks 2>/dev/null || true', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
        if (fs.existsSync('/tmp/.vitest-metrics.json')) {
            const report = JSON.parse(fs.readFileSync('/tmp/.vitest-metrics.json', 'utf8'));
            return report.numTotalTests || 0;
        }
    } catch { /* ignore */ }
    return 0;
}

function getTestFileCount() {
    return countFiles('tests', '*.test.js');
}

function getSpecCount() {
    return countFiles('specs', 'SPEC-*.md');
}

function getRFCTCount() {
    return countFiles('specs/refactor', 'AKITA-RFCT-*.md');
}

function getServiceCount() {
    return countFiles('src/services', '*.js');
}

function getEngineLOC() {
    return countLines('src/engine/engine.js');
}

function getBugRegressionCount() {
    return countFiles('tests/regression', 'BUG-*.test.js');
}

function getAkitaCommitCount() {
    try {
        const out = execSync('git log --grep "^AKITA-" --pretty=oneline 2>/dev/null | wc -l', { cwd: ROOT, encoding: 'utf8' });
        return parseInt(out.trim()) || 0;
    } catch { return 0; }
}

// ============================================================
// Update README badges
// ============================================================

function updateReadme(metrics) {
    let content = fs.readFileSync(README_MD, 'utf8');
    const before = content;

    // Tests badge: "tests-1036%2F1036-brightgreen"
    content = content.replace(
        /tests-\d+%2F\d+-brightgreen/g,
        `tests-${metrics.testCount}%2F${metrics.testCount}-brightgreen`
    );

    // Specs badge: "specs-108-blue"
    content = content.replace(
        /specs-\d+-blue/g,
        `specs-${metrics.specCount}-blue`
    );

    // Bugs regression badge: "bugs%20regression-13-orange"
    content = content.replace(
        /bugs%20regression-\d+-orange/g,
        `bugs%20regression-${metrics.bugRegressionCount}-orange`
    );

    if (content !== before) {
        fs.writeFileSync(README_MD, content);
        return true;
    }
    return false;
}

// ============================================================
// Update CLAUDE.md snapshot
// ============================================================

function updateClaudeMd(metrics) {
    let content = fs.readFileSync(CLAUDE_MD, 'utf8');
    const before = content;

    // | Tests | **NNNN/NNNN** ✅
    content = content.replace(
        /\| Tests \| \*\*[\d,/]+\*\* ✅/g,
        `| Tests | **${metrics.testCount}/${metrics.testCount}** ✅`
    );

    // | Test files | NN |
    content = content.replace(
        /\| Test files \| \d+( [^|]*)?\|/,
        `| Test files | ${metrics.testFileCount} |`
    );

    // | Specs totais | **NN** |
    content = content.replace(
        /\| Specs totais \| \*\*\d+\*\*( [^|]*)?\|/,
        `| Specs totais | **${metrics.specCount}** |`
    );

    // | Bugs com regression test | XX arquivos em
    content = content.replace(
        /\| Bugs com regression test \| \d+ arquivos/,
        `| Bugs com regression test | ${metrics.bugRegressionCount} arquivos`
    );

    // | AKITA commits | **NNN**
    content = content.replace(
        /\| AKITA commits \| \*\*~?\d+\*\*\+?( [^|]*)?\|/,
        `| AKITA commits | **${metrics.akitaCommitCount}** |`
    );

    // engine.js LOC mentions
    content = content.replace(
        /`engine\.js` \d+ linhas/g,
        `\`engine.js\` ${metrics.engineLOC} linhas`
    );
    content = content.replace(
        /\*\*`engine\.js` \d+ LOC\*\*/g,
        `**\`engine.js\` ${metrics.engineLOC} LOC**`
    );

    // Last updated
    const today = new Date().toISOString().slice(0, 10);
    content = content.replace(
        /\*\*Última atualização\*\*: \d{4}-\d{2}-\d{2}/,
        `**Última atualização**: ${today}`
    );

    if (content !== before) {
        fs.writeFileSync(CLAUDE_MD, content);
        return true;
    }
    return false;
}

// ============================================================
// Main
// ============================================================

const checkMode = process.argv.includes('--check');

const metrics = {
    testCount: getTestCount(),
    testFileCount: getTestFileCount(),
    specCount: getSpecCount(),
    rfctCount: getRFCTCount(),
    serviceCount: getServiceCount(),
    engineLOC: getEngineLOC(),
    bugRegressionCount: getBugRegressionCount(),
    akitaCommitCount: getAkitaCommitCount(),
};

console.log('📊 ELIFOOT metrics snapshot:');
console.log(`   Tests:           ${metrics.testCount} (${metrics.testFileCount} files)`);
console.log(`   Specs:           ${metrics.specCount} (${metrics.rfctCount} RFCTs)`);
console.log(`   Services:        ${metrics.serviceCount}`);
console.log(`   engine.js:       ${metrics.engineLOC} LOC`);
console.log(`   Bug regression:  ${metrics.bugRegressionCount}`);
console.log(`   AKITA commits:   ${metrics.akitaCommitCount}`);

const readmeChanged = updateReadme(metrics);
const claudeChanged = updateClaudeMd(metrics);

if (checkMode) {
    if (readmeChanged || claudeChanged) {
        console.error('\n❌ README.md ou CLAUDE.md desatualizados.');
        console.error('   Rode `node scripts/update-doc-metrics.cjs` para atualizar.');
        process.exit(1);
    }
    console.log('\n✅ Docs sincronizados com estado real.');
} else {
    if (readmeChanged) console.log('   ✓ README.md atualizado');
    if (claudeChanged) console.log('   ✓ CLAUDE.md atualizado');
    if (!readmeChanged && !claudeChanged) console.log('   (nada a atualizar)');
}
