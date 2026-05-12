# SPEC-164: E2E Test Coverage (Playwright)

> **Bloco 2.4 do MASTER-ROADMAP-FOUNDATION-FIRST.**
> Fecha o gap "0/40 features com Playwright E2E" identificado pelo audit AKITA-233
> (`specs/AKITA-FEATURE-AUDIT-2026-05-12.md`).
>
> Não introduz feature de jogo: instala um chão de **testes de fluxo** ao redor do
> que já existe, para que qualquer refactor do Bloco 1/2 quebre testes em vez de
> chegar à produção sem rede.

---

## O que é

Suite de 6 testes Playwright (mais 1 unit-test de configuração) que exercitam
os fluxos críticos do usuário ponta-a-ponta:

1. Carregar a tela inicial e selecionar um time.
2. Save manual + reload e verificar round-trip.
3. Navegar do dashboard para a tabela depois de progredir o estado.
4. Clicar todos os itens do Sidebar sem quebrar nada.
5. Completar o tutorial de 5 passos.
6. Smoke responsivo em viewport mobile (375x667).

Cada teste é determinístico, não usa `waitForTimeout` mágico e suporta o
seletor de fallback por texto quando não há `data-testid`. Não modifica
componentes da `src/` (Mandamento #2: zero acoplamento UI↔testes).

---

## Input

### Tipo
```typescript
{
  baseURL: 'http://localhost:5173', // dev server Vite
  browser: 'chromium',
  viewport: { width: number, height: number }
}
```

### Origem
- Local: `npm run test:e2e` (dev server iniciado automático via `webServer` em playwright.config.js)
- CI: workflow `e2e` em `.github/workflows/ci.yml` (depende de `validate`)

### Validação de input
- Dev server responde em `http://localhost:5173` antes do teste rodar
- `npx playwright install chromium` executado previamente
- `localStorage` é limpado no início dos testes que dependem de estado fresco

---

## Output esperado

### Tipo
Playwright report (HTML + lista de specs aprovadas). Cada `.spec.js` deve
encerrar com todos os `test()` em verde.

### Exemplo concreto
```
Running 6 tests using 1 worker

  ✓ start-team-select.spec.js:1 (1.2s)
  ✓ save-reload-roundtrip.spec.js:1 (3.1s)
  ✓ advance-week-standings.spec.js:1 (2.4s)
  ✓ sidebar-nav-no-crash.spec.js:1 (4.8s)
  ✓ tutorial-completable.spec.js:1 (2.0s)
  ✓ responsive-mobile.spec.js:1 (1.6s)

  6 passed (15.1s)
```

---

## Regras de validação

### 1. Start → Team Select (`start-team-select.spec.js`)
- [ ] StartView renderiza (logo OléFUT visível)
- [ ] Existe `select#select-team` com 100+ opções
- [ ] Preencher nome e selecionar time habilita botão "COMEÇAR CARREIRA"
- [ ] Clicar no botão muda view para dashboard (top-bar visível)

### 2. Save Reload Roundtrip (`save-reload-roundtrip.spec.js`)
- [ ] Após iniciar carreira, top-bar mostra o nome do manager
- [ ] Botão de save (💾) está visível e clicável
- [ ] Toast "Salvo!" aparece
- [ ] Payload `elifoot_save_v1` contém `gameState.started=true`, `manager`, `version`, `checksum`, `engine.teams`
- [ ] Após reload, a chave `elifoot_save_v1` continua intacta com o mesmo manager
- [ ] **GAP DOCUMENTADO**: a renderização do `<DashboardView>` após reload dispara erro de error-boundary (bug existente fora do escopo desta SPEC; ticket criado em sessão separada via spawn_task). Por isso o teste isola o contrato de persistência e deixa o render-restore para o ticket dedicado.

### 3. Advance Week → Standings (`advance-week-standings.spec.js`)
- [ ] StandingsView é navegável via sidebar
- [ ] Tabela exibe ao menos uma linha de classificação
- [ ] Time do usuário aparece na lista
- [ ] Mudar zona/divisão (se houver) não quebra nada

### 4. Sidebar Nav Sem Crash (`sidebar-nav-no-crash.spec.js`)
- [ ] Cada item do Sidebar do modo manager é clicável
- [ ] Nenhum `pageerror` é capturado durante a navegação
- [ ] Cada view renderiza ≥50 caracteres de texto visível
- [ ] Voltar para dashboard mantém estado

### 5. Tutorial Completável (`tutorial-completable.spec.js`)
- [ ] localStorage começa limpo
- [ ] Tutorial avança pelos 5 passos com botão PRÓXIMO
- [ ] No último passo o botão vira "INICIAR CARREIRA"
- [ ] Após finalizar, `elifoot_tutorial_done` está em localStorage

### 6. Responsive Mobile (`responsive-mobile.spec.js`)
- [ ] Em viewport 375x667 não há overflow horizontal além de 10px
- [ ] StartView carrega
- [ ] Após iniciar, navegar 3 itens do sidebar não dispara `pageerror`

### 7. Unit Harness (`tests/integration/e2e-config.test.js`)
- [ ] `playwright.config.js` exporta objeto com `testDir`, `webServer`, `projects`
- [ ] `webServer.port` === 5173
- [ ] `projects` inclui pelo menos `chromium`
- [ ] `package.json` expõe scripts `test:e2e`, `test:e2e:ui`, `test:e2e:install`

---

## Forbidden

- ❌ Adicionar `data-testid` em arquivos da `src/` para conveniência de teste.
- ❌ Usar `page.waitForTimeout(N)` como mecanismo principal de sincronização.
- ❌ Tornar engine `window.engine = …` em código de produção só para teste.
- ❌ Testar lógica de regras de negócio (isso é trabalho de Vitest, não E2E).
- ❌ Testes que dependem de ordem entre arquivos.
- ❌ Test files acima de ~100 LOC (mantemos foco).
- ❌ Adicionar specs E2E sem entrada no CI.

---

## Implementação

### Arquivos
- `playwright.config.js` (existente, sem mudança funcional)
- `tests/e2e/start-team-select.spec.js`
- `tests/e2e/save-reload-roundtrip.spec.js`
- `tests/e2e/advance-week-standings.spec.js`
- `tests/e2e/sidebar-nav-no-crash.spec.js`
- `tests/e2e/tutorial-completable.spec.js`
- `tests/e2e/responsive-mobile.spec.js`
- `tests/integration/e2e-config.test.js` (harness Vitest da Regra 0)
- `package.json` (3 scripts adicionados)
- `.github/workflows/ci.yml` (job `e2e` adicionado)

### Dependências internas
- `@playwright/test` ^1.59.1 (já estava no package.json)
- StartView, Sidebar, DashboardView, TutorialView, StandingsView (read-only)

### Convenções
- Cada teste limpa `localStorage` no início via `page.evaluate(() => localStorage.clear())`
  quando depende de estado virgem.
- Seletores preferem `text=`, `role=` e ids existentes (`#input-name`, `#select-team`, `#btn-start`).
- Determinismo via `playwright.config.js` (`workers: 1`, `retries: 1`).

---

## Testes esperados (harness Regra 0)

Implementados em `tests/integration/e2e-config.test.js`:

```javascript
describe('SPEC-164: E2E config integrity', () => {
  test('playwright.config.js exporta webServer port 5173', async () => { ... });
  test('package.json tem scripts test:e2e e variantes', async () => { ... });
  test('todos os arquivos .spec.js esperados existem', async () => { ... });
  test('nenhum arquivo .spec.js usa data-testid em src/', async () => { ... });
});
```

---

## Checklist conclusão

- [ ] 6 arquivos .spec.js criados
- [ ] Unit harness `e2e-config.test.js` criado
- [ ] `npm run test:e2e` roda verde local
- [ ] `npm run lint` 0 erros
- [ ] `npm test` continua verde (1036+)
- [ ] `npm run build` continua ≤1.5s, dentro do budget
- [ ] Job `e2e` adicionado ao CI

---

**Versão**: 1.0
**Owner**: Dudu
**Criada**: 2026-05-12 (sessão `claude/b24-e2e-scaffolding`)
**Protocolo**: AKITA SDD — Mandamento #1 (spec antes do código) + Regra 0 (harness no mesmo PR)
