# SPEC-022: Deploy & GitHub Pages

**Criticidade**: 🟡 ALTO  
**Módulo**: `.github/workflows/deploy.yml`, `scripts/deploy.sh`  
**Linhas**: ~200

---

## O que é

Automated deploy p/ GitHub Pages. Build → push → live em main commit. Versionamento semântico.

---

## Deploy Pipeline

| Stage | Trigger | Action | Target |
|-------|---------|--------|--------|
| Build | Commit main | `npm run build` | `/dist/` |
| Version | Tag (v*.*.*)| Semver bump | `package.json` |
| Push | CI success | Git push dist/ | GitHub Pages |
| Live | Pages build | Publish | `https://olefut.app/` |
| Artifact | After deploy | Save build | Release notes |

---

## Versioning Scheme

```
v<major>.<minor>.<patch>

Major: Breaking changes (FASE new major)
Minor: Features (SPEC group delivered)
Patch: Bug fixes (SPEC fix)

Examples:
v1.0.0 — FASE 1-2 (SDD + 8 core specs)
v1.1.0 — FASE 3 (secondary specs)
v1.1.1 — SPEC fix after v1.1.0
v2.0.0 — FASE 4-5 (major refactor)
```

---

## Input

```typescript
// Automatic on main commit (CI success):
// 1. Build artifact gerado
// 2. Version bumped (auto-detect minor/patch)
// 3. Tag created (annotated)
// 4. Release notes generated

// Manual trigger:
gh release create v1.1.0 --generate-notes

// Deploy to Pages:
git push origin dist/:gh-pages
```

---

## Output

```typescript
{
  status: 'success' | 'failure',
  deployment: {
    version: string,  // v1.0.0
    timestamp: string,
    url: string,  // https://olefut.app/
    buildSize: number,  // MB
    buildTime: number,  // seconds
    changelog: string
  },
  release: {
    id: string,
    url: string,
    notes: string,
    assets: [{ name, size, url }]
  }
}
```

---

## Validações

- [ ] Deploy somente após CI ✅
- [ ] Build size < 50MB
- [ ] GitHub Pages ativo (Settings)
- [ ] Version tag = semver format (v*.*.*)
- [ ] Release notes auto-gerado from commits
- [ ] Previous version acessível (v1.0.0, v1.1.0, etc)
- [ ] Rollback via tag reversal (git checkout v1.0.0)
- [ ] Artifact life: 30 days, depois delete

---

## Forbidden

- [ ] Deploy fora de main branch
- [ ] Deploy sem tests ✅
- [ ] Manual build + push (automation só)
- [ ] Version sem git tag
- [ ] Build size > 100MB
- [ ] Overwrite version tag (immutable)

---

## Testes

```javascript
test('Deploy triggered após main commit', async () => {
  // Faz commit em main c/ CI passing
  const workflows = await github.actions.listRuns('deploy.yml');
  const latest = workflows[0];
  
  expect(latest.status).toBe('in_progress');
  expect(latest.event).toBe('push');
});

test('Version semver auto-bumped', async () => {
  // Current: v1.0.0
  // Commit: feature (nova SPEC)
  
  const run = await github.actions.triggerWorkflow('deploy.yml');
  await run.waitForCompletion();
  
  const pkg = await github.repos.getContent({ path: 'package.json' });
  expect(pkg.version).toBe('1.1.0');  // Minor bump (feature)
});

test('GitHub Pages ativo', async () => {
  const pages = await github.repos.getPages();
  expect(pages.status).toBe('built');
  expect(pages.cname olefut');
});

test('Release notes auto-gerado', async () => {
  const release = await github.releases.getLatest();
  expect(release.body).toContain('SPEC-');  // Contains commit refs
  expect(release.body.length).toBeGreaterThan(100);
});

test('Build size < 50MB', async () => {
  const run = await github.actions.triggerWorkflow('deploy.yml');
  await run.waitForCompletion();
  
  const artifacts = await run.listArtifacts();
  const buildArtifact = artifacts.find(a => a.name === 'build');
  expect(buildArtifact.size).toBeLessThan(50 * 1024 * 1024);  // 50MB
});

test('Rollback via git tag', async () => {
  // Current version: v1.1.0
  // Want to rollback to: v1.0.0
  
  await github.repos.checkout({ ref: 'v1.0.0' });
  const pkg = await github.repos.getContent({ path: 'package.json' });
  expect(pkg.version).toBe('1.0.0');
});

test('Artifact life 30 days', async () => {
  const artifacts = await github.actions.listArtifacts();
  const old = artifacts.find(a => a.createdAt < Date.now() - 30*24*60*60*1000);
  
  if (old) {
    expect(old.expired).toBe(true);
  }
});
```

---

## GitHub Pages Configuration

```yaml
# Settings → Pages
Build and deployment:
  Source: GitHub Actions
  Branch: main
  Path: dist/

Custom domain: olefut.app  (if DNS configured)
```

---

## Release Notes Template

```markdown
## v${version}

**Release date**: ${date}

### 🎉 Features
${FEATURES}

### 🐛 Fixes
${FIXES}

### 📦 Build Info
- Size: ${buildSize}
- Time: ${buildTime}s
- Specs delivered: ${specCount}

### 📖 Docs
- Manual: [MANUAL.md](manual.md)
- Architecture: [CLAUDE.md](claude.md)

---
Made with ❤️ using Spec-Driven Development
```

---
