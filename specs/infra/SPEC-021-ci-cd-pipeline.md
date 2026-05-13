# SPEC-021: CI/CD Pipeline & Automation

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `.github/workflows/ci.yml`, `scripts/ci-*.sh`  
**Linhas**: ~250

---

## O que é

GitHub Actions pipeline. Roda lint, tests, coverage, build em todo PR/commit. Rejeita se falhar.

---

## Pipeline Stages

| Stage | Trigger | Command | Timeout | Fail action |
|-------|---------|---------|---------|------------|
| Lint | PR/commit | `npm run lint` | 5 min | Block merge |
| Unit tests | PR/commit | `npm test` | 10 min | Block merge |
| Coverage | PR/commit | `npm run coverage` | 5 min | Report (no block) |
| Build | PR/commit | `npm run build` | 10 min | Block merge |
| E2E tests | PR only | `npm run e2e` | 15 min | Block merge |
| Spec validate | PR/commit | `spec-check.sh` | 3 min | Block merge |

---

## GitHub Actions Workflow

```yaml
name: OléFUT CI/CD

on:
  push:
    branches: [ main, claude/* ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Lint
        run: npm run lint
        
      - name: Unit tests
        run: npm test
        
      - name: Coverage
        run: npm run coverage
        
      - name: Build
        run: npm run build
        
      - name: Spec validation
        run: spec-check.sh validate
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
```

---

## Input

```typescript
// Automatic on:
// 1. Push to main / claude/* branches
// 2. PR to main
// 3. Manual trigger: gh workflow run ci.yml

// Env variables (set in GitHub):
GITHUB_TOKEN (automatic)
CODECOV_TOKEN (via secrets)
```

---

## Output

```typescript
{
  status: 'success' | 'failure',
  stages: [
    { name: 'Lint', duration: number, passed: boolean, logs: string },
    { name: 'Unit tests', duration: number, passed: boolean, coverage: number },
    ...
  ],
  totalDuration: number,
  pullRequestComment: string  // Postado automaticamente
}
```

---

## Validações

- [ ] Lint passa (ESLint config preenchido)
- [ ] Coverage ≥ 80% total
- [ ] Todos os testes passam (0 failures)
- [ ] Build produção completa sem warnings
- [ ] Spec validation passa (AKITA-XXX format)
- [ ] PR comment atualizado com status
- [ ] Artifact artifacts disponível para download
- [ ] Timeout respeitado por stage

---

## Forbidden

- [ ] Merge sem todos stages passando
- [ ] Skip lint/tests (--no-verify proibido)
- [ ] Coverage report falso (alterado manually)
- [ ] Secrets versionado em repo
- [ ] Pipeline config alterado sem rev. (SPEC alteração)

---

## Testes

```javascript
test('Lint job bloqueia PR se error', async () => {
  // Cria PR com eslint violation
  const badCode = `var x=  1`;  // Extra espaço
  
  const run = await github.actions.triggerWorkflow('ci.yml');
  await run.waitForCompletion();
  
  expect(run.status).toBe('failure');
  expect(run.stages.lint.passed).toBe(false);
});

test('Coverage report postado no PR', async () => {
  const run = await github.actions.triggerWorkflow('ci.yml');
  await run.waitForCompletion();
  
  const comments = await github.pulls.listComments();
  const coverageComment = comments.find(c => c.body.includes('Coverage'));
  
  expect(coverageComment).toBeDefined();
  expect(coverageComment.body).toContain('80%');
});

test('Build timeout 10 min', async () => {
  const start = Date.now();
  const run = await github.actions.triggerWorkflow('ci.yml');
  await run.waitForCompletion();
  
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(10 * 60 * 1000);  // 10 min
});

test('Spec validation falha se commit sem AKITA-XXX', async () => {
  // Commit message: "fix bug" (sem AKITA-XXX)
  
  const run = await github.actions.triggerWorkflow('ci.yml');
  await run.waitForCompletion();
  
  expect(run.status).toBe('failure');
  expect(run.stages.specValidation.logs).toContain('AKITA format required');
});

test('Artifacts disponível para download', async () => {
  const run = await github.actions.triggerWorkflow('ci.yml');
  await run.waitForCompletion();
  
  const artifacts = await run.listArtifacts();
  expect(artifacts.length).toBeGreaterThan(0);
  
  const coverage = artifacts.find(a => a.name === 'coverage-report');
  expect(coverage).toBeDefined();
});
```

---

## Local CI (developer machine)

```bash
#!/bin/bash
# run antes de git push

npm run lint || exit 1
npm test || exit 1
npm run build || exit 1
spec-check.sh validate || exit 1

echo "✅ Local CI passed. Ready to push."
```

---
