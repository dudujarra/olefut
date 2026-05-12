# SPEC-179 — Player Mode Features Scope + dist/audio Build Artifact Policy

**Status**: Decision documented (no engine refactor in this PR)
**Owner**: Dudu
**Created**: 2026-05-12
**Branch**: `claude/audio-playermode-cleanup` (worktree `/tmp/fix-audio`)
**Related audit**: AKITA-FEATURE-AUDIT-2026-05-12 + 40-features pass-2 findings
**Mandamentos**: #2 (audit antes de promover), #4 (CLAUDE.md fonte única), Regra 0 (cada afirmação tem evidência), 10-Mandamentos-Brutais #1 (zero feature nova).

---

## 1. Contexto

Auditoria interna identificou dois itens órfãos que precisam de decisão registrada:

1. **`dist/audio` ~465 MB** — investigação mostra que a fonte é `public/audio/fase1/` (440 MB, 40 WAVs **commitados** no repo desde AKITA-103). Vite copia `public/` integralmente para `dist/`, e o workflow `deploy.yml` empacota tudo no artifact do GitHub Pages. Cada visitante baixa centenas de MB (lazy via `AudioController.jsx`).
2. **6 features visíveis apenas em Player Career mode** (sub-1% dos saves), com efeito invisível em Manager mode (~95% dos usuários):
   - **Bench Events** (`src/engine/BenchEventsDeck.js`)
   - **OffPitch Events** (`src/engine/OffPitchEventsDeck.js`)
   - **Named NPCs** — implementados via cartas + perfis em `src/engine/NpcBehaviorProfile.js` / `NpcTacticAdvisor.js`
   - **Chain Flags** (`setFlag` / `hasFlag` / `clearFlag` em `src/engine/PlayerCareer.js` L411-419)
   - **Stress System** (`addStress` / `resolveMentalBreak` em `src/engine/PlayerCareer.js` L381-410)
   - **Bench Status Auto** (`checkBenchStatus` em `src/engine/PlayerCareer.js` L377)

Esta SPEC documenta a decisão (A/B/C por feature) + a política para o build artifact de áudio. Implementação concreta (promoção de StressSystem / NPC names pra Manager Mode) fica fora deste PR — apenas documentação e sinalização nos arquivos.

---

## 2. Decisão — `dist/audio` 465 MB (real finding, real fix em SPEC futura)

### Achados (correção da hipótese inicial)

A hipótese de trabalho era que `dist/audio` fosse um build artifact local **não commitado**. **Errado.** Investigação revela:

| Fonte | Tamanho | Status git |
|-------|---------|------------|
| `public/audio/fase1/` | **440 MB** (40 WAV files, 8 subgêneros × 5 stems each) | **COMMITTED** desde AKITA-103 (`Music Engine Fase 1`) |
| `public/audio/test-stems/` | 10 MB (4 WAVs) | COMMITTED |
| `public/audio/metadata.json` + `suno-prompts.json` | <1 MB | COMMITTED (ok) |
| `dist/audio/` | **465 MB** | gerado pelo Vite que **copia `public/audio/` integralmente** para `dist/` em todo build |

`.gitignore` ignora `dist/` ✅, mas isso é **irrelevante** — a fonte do problema (`public/audio/*.wav`) já está versionada.

`.github/workflows/deploy.yml` roda `npm run build` + `actions/upload-pages-artifact path: dist`. O artifact deployado ao GitHub Pages **inclui** os 465 MB de WAVs. Ou seja: **todo visitante do https://dudujarra.github.io/elifoot-web/ baixa 465 MB de samples WAV**.

`src/audio/AudioController.jsx` confirma o uso: linha 35 (`const STEMS_BASE_PATH = '/audio/fase1';`) + linha 122 (`fetch(\`${STEMS_BASE_PATH}/${subgenre}/master.wav\`)`). 8 subgêneros × ~50 MB master WAV ≈ 400 MB lazy-loaded conforme troca de view. O fallback "Master not found" só loga warning — não é música procedural.

### Conclusão (real)

**Ação corretiva necessária, MAS fora do escopo deste PR.** Esta SPEC documenta o achado e define a SPEC follow-up.

### Política documentada + roadmap

1. **Curto prazo** (este PR): documentar o achado, adicionar guard `build-budget` que detecte regressão futura, **não** remover os WAVs (scope minimum).
2. **Médio prazo** (SPEC-180 a abrir): decisão técnica em uma de três rotas:
   - **a)** Mover `public/audio/fase1/` para Git LFS (mantém o asset versionado, tira do bundle do clone) + adicionar deploy step que baixa de LFS.
   - **b)** Mover para CDN externo (S3 / Cloudflare R2) + URL configurável; `AudioController` faz fetch com fallback procedural.
   - **c)** Converter os 8 master WAVs para OGG/MP3 a 64-96kbps (~40 MB total). Trade-off de qualidade pro 10× de redução.
3. **Não** rodar `git rm` cego nos WAVs sem decisão de SPEC-180 — quebraria o `AudioController` em runtime sem fallback.

### Harness (Regra 0)

`tests/specs/SPEC-179-player-mode-scope.test.js` asserta:
- `.gitignore` contém `dist` (já tinha).
- SPEC-179 markdown existe (esta).

Build-budget hardening real fica para SPEC-180 (que vai precisar ajustar o teto e/ou excluir `public/audio/` da contagem).

---

## 3. Decisão — 6 Features Player-Only

Base de usuários: ~95% Manager Mode default. As 6 features só ficam visíveis quando `PlayerCareer.ProPlayer` está ativo (sub-1% dos saves).

### Decisão por feature

| # | Feature | Arquivo / método principal | Decisão | Plano futuro | Justificativa |
|---|---------|----------------------------|---------|--------------|---------------|
| 1 | **Stress System** | `PlayerCareer.js` L164-165 (state) + L381-410 (`addStress`, `resolveMentalBreak`) | **A — Promote (futuro)** | Surfacear como widget "Tensão do elenco" no `DashboardView` — agregar avg(stress) do plantel afeta morale, já calculado internamente | ROI alto — efeito já existe na engine; só falta UI. Manager Mode ganharia métrica nova sem refactor. |
| 2 | **Named NPCs** | `BenchEventsDeck.js` + `OffPitchEventsDeck.js` (nomes Marcos Oliveira, Patrícia Lemos, Rafael Monteiro, Tio Dinho etc.) + `NpcBehaviorProfile.js` + `NpcTacticAdvisor.js` | **A — Promote parcial (futuro)** | Reusar nomes nos diálogos de `TransferOffer` / `PressConference` (já existem). Adicionar nome do agente/manager rival nos popups Manager. | Nomes já existem em texto; quick win é trocar "manager rival" genérico por NPC do roster. |
| 3 | **Bench Status Auto** | `PlayerCareer.js` L377 (`checkBenchStatus`) | **B — Hide (Player-Only)** | Manter como está; só emite via `ProPlayer.weekEvents` | Mecânica específica do jogador-protagonista (titular/reserva). Sem sentido pra Manager. |
| 4 | **Bench Events** | `BenchEventsDeck.js` (12 cartas) | **B — Hide (Player-Only)** | Manter como está | Eventos narrativos POV do jogador no banco. Não cabem em Manager Mode. |
| 5 | **OffPitch Events** | `OffPitchEventsDeck.js` (20 cartas) | **B — Hide (Player-Only)** | Manter como está | Eventos fora-de-campo do protagonista (entrevista, treino individual, vida social). |
| 6 | **Chain Flags** | `PlayerCareer.js` L411-419 (`setFlag` / `hasFlag` / `clearFlag`) | **B — Hide (Player-Only)** | Manter como está | Mecânica de gatilhos encadeados (arcos narrativos). Vinculada a estado do jogador-protagonista. |

**Resumo**: 2× Promote (A — futuro, ROI alto, SPECs separadas no Bloco 2/3), 4× Hide (B — manter player-only com sinalização clara). **Zero decommission** (C) — código funciona, custo de manutenção baixo, valor narrativo preservado pro modo player.

### Saída deste PR (escopo mínimo)

- **Documentar** a decisão acima neste SPEC-179.
- **Adicionar marker** `PLAYER MODE ONLY — see SPEC-179` no header dos 4 arquivos relevantes (`BenchEventsDeck.js`, `OffPitchEventsDeck.js`, `NpcBehaviorProfile.js`, `PlayerCareer.js`) — futuros agentes leem antes de modificar.
- **NÃO** promover para Manager Mode neste PR (fora de escopo conforme nota do issuer: "este PR pode ser menor scope; foco em decision + document, não exige refactor massivo").
- **NÃO** decomissionar nada.

Implementação efetiva da promoção (#1 Stress widget no Dashboard, #2 NPC names em diálogos Manager) → SPECs separadas, priorizadas no Bloco 2 / 3.

---

## 4. Plano de implementação (este PR)

### Tarefas

- [x] Confirmar `dist` em `.gitignore` (linha 2) → confirmado
- [x] Verificar `.github/workflows/deploy.yml` não roda `render:*` → confirmado (só `npm ci && npm run build`)
- [x] Confirmar `public/audio/` inexistente → confirmado (música 100% procedural via Tone.js)
- [x] Mapear 6 features (arquivo + emissão + consumidor UI) → tabela acima
- [ ] Adicionar marker `PLAYER MODE ONLY — see SPEC-179` no header de cada arquivo player-only
- [ ] Harness `tests/specs/SPEC-179-player-mode-scope.test.js` (3 asserts: markers + `.gitignore` `dist` + SPEC presente)
- [ ] Atualizar `CHANGELOG.md` com entry deste PR

### Harness (Regra 0)

`tests/specs/SPEC-179-player-mode-scope.test.js`:

1. Lê os 4 arquivos sinalizados.
2. Asserta que cada um contém o marker `PLAYER MODE ONLY` + referência `SPEC-179` nos primeiros 25 linhas.
3. Asserta que `.gitignore` contém uma regra `dist` (sentinela contra regressão acidental do commit do build artifact).
4. Asserta que `specs/SPEC-179-player-mode-features-scope.md` existe e cita `dist/audio`.

---

## 5. Critérios de aceitação (DoD)

- [ ] SPEC-179 (este arquivo) commitado em `specs/`.
- [ ] Marker em 4 arquivos engine (`BenchEventsDeck`, `OffPitchEventsDeck`, `NpcBehaviorProfile`, `PlayerCareer`).
- [ ] Harness `tests/specs/SPEC-179-player-mode-scope.test.js` verde.
- [ ] CHANGELOG entry adicionada.
- [ ] `npm test` sem regressão; `npm run lint` sem regressão.

## 6. Riscos e tradeoffs

- **Não promover já**: deixa Stress System invisível pra 95% dos usuários por mais N semanas/sprints. Aceitável — feature funciona internamente; promoção é UI work (widget Dashboard), não engine work.
- **Hide em vez de Decommission**: mantém ~1.5k LOC engine code para sub-1% saves. Aceitável — zero acoplamento com engine principal (só `PlayerCareer` consome), custo de manutenção mínimo, e a feature está estável.
- **`dist/audio` 465 MB não é resolvido neste PR**: ação real precisa de decisão técnica (LFS / CDN / formato comprimido) — fica para SPEC-180. Risco aceito: usuários novos do GitHub Pages continuam baixando centenas de MB por sessão até a SPEC-180 fechar.

---

## 7. Histórico

- 2026-05-12 — SPEC criada após auditoria pass-2 (40-features + dist size).
