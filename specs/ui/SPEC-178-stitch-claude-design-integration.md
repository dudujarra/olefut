# SPEC-178: Integração Stitch + Claude Design + Claude Code com Design System ISSSD

**Tipo**: infrastructure  
**Status**: 📝 draft  
**Owner**: Dudu  
**Prioridade**: B3.3 (após B3.2 playtest)  
**Criada em**: 2026-05-13  
**Relacionado**: SPEC-176 (brand), SPEC-178 (design tokens), SPEC-179 (logo), SPEC-163 (UI sweep)

---

## O que é

Integração end-to-end de **Stitch** (design system) + **Claude Design** (UI mockup) + **Claude Code** (dev agent) usando **design tokens ISSSD** como fonte única de verdade visual.

Fluxo:
```
Claude Design        Stitch           Claude Code
(mockup)      →  (canvas + system) → (implementação)
   ↓                   ↓                    ↓
variações            DESIGN.md       React component
user feedback        tokens           com design tokens
```

**Objetivo**: 
- Eliminar manual de design-to-code
- Manter coesão visual ISSSD em 100% das telas
- Gerar DESIGN.md automático do brand + tokens
- Permitir Claude Code ler DESIGN.md via MCP e implementar sem drift

---

## Input

### 2.1 Requisitos obrigatórios

1. **docs/brand-guidelines.md v1.1** (SPEC-176 aprovado)
   - Paleta: Neon Green, Gold Trophy, Pitch Green, CRT Black
   - Tipografia: Press Start 2P, Pixelify Sans, IBM Plex Mono
   - Proibições: zero border-radius, zero rgba, zero blur
   - Voice: Nostálgico, Autoritativo, Vibrante

2. **assets/design-tokens.json** (SPEC-178 merged)
   - 3-layer architecture: primitive → semantic → component
   - 169 tokens mapeados
   - CSS vars em `assets/design-tokens.css`

3. **Google Stitch MCP** (conectado em Claude Code)
   - Acesso a API Stitch via MCP
   - Leitura/escrita de projects e screens

4. **Google Nano Banana Pro** (SPEC-XXX — geração de assets)
   - API key Dudu (env `GOOGLE_AI_API_KEY`)
   - Acesso a `gemini-3-pro-image-preview`

5. **Repositório GitHub público** (https://github.com/dudujarra/olefut)
   - Branch `main` com build verde
   - Stitch MCP configurado em `.claude/settings.json`

### 2.2 Artefatos de entrada

- `docs/brand-guidelines.md` (165 linhas, seções 1-10)
- `assets/design-tokens.json` (320 linhas, 3 camadas)
- `src/styles/design-tokens.css` (gerado, ~200 linhas)
- Projeto Stitch no Google Cloud (URL TBD)
- Claude Code com Stitch skill instalada

---

## Output

### 3.1 Artefatos entregáveis

1. **DESIGN.md** (gerado automático)
   - Location: `DESIGN.md` (raiz)
   - Formato: markdown estruturado, legível por Stitch MCP
   - Conteúdo:
     ```markdown
     # OléFUT Design System ISSSD Premium
     
     ## Colors
     - Primary (Neon Green): #39FF14
     - Secondary (Gold): #FFD700
     - ...
     
     ## Typography
     - Display: Press Start 2P 1.2rem
     - Body: Pixelify Sans 0.85rem
     - ...
     
     ## Components
     - Button: 48px, 2px border, squareCorners
     - Card: bevel effect, dark bg, gold trim
     - ...
     ```
   - Gerado por: script `scripts/generate-design-md.js` (novo)
   - Fonte: docs/brand-guidelines.md + design-tokens.json

2. **Skill `/stitch-brand-integrate`** (novo)
   - Location: `skills/stitch-brand-integration.skill.md`
   - Função: orquestra fluxo Stitch + Claude Design + Claude Code
   - Chamada:
     ```bash
     /stitch-brand-integrate \
       --brand docs/brand-guidelines.md \
       --tokens assets/design-tokens.json \
       --output DESIGN.md
     ```
   - Código: TypeScript/Node em `src/skills/stitch-brand-integration.ts`
   - Referencia: SPEC-178 no corpo do skill

3. **Harness executável** (`scripts/generate-design-md.js`)
   - Lê brand-guidelines.md + design-tokens.json
   - Gera DESIGN.md
   - Valida: zero erros, zero campos vazios
   - Output: `DESIGN.md` commitável

4. **Stitch project MCP config**
   - Location: `.claude/settings.json`
   - Conteúdo:
     ```json
     {
       "mcp_servers": {
         "stitch": {
           "url": "https://mcp.stitch.com/v1",
           "auth": "oauth",
           "design_system_id": "olefut-isssd"
         }
       }
     }
     ```

5. **Documentação de integração** (novo)
   - Location: `docs/STITCH_CLAUDE_WORKFLOW.md`
   - Conteúdo: passo-a-passo de como usar os 3 juntos
   - Público: devs, Claude Code, Stitch users

6. **Tests (harness)** (novo)
   - Location: `tests/specs/SPEC-178.test.js`
   - Valida:
     - DESIGN.md é gerado corretamente
     - Tokens aparecem em DESIGN.md
     - MCP consegue ler DESIGN.md
     - Zero warnings/errors em CI

### 3.2 Critério de conclusão

- [ ] `DESIGN.md` gerado com 100% de cobertura (brand + tokens)
- [ ] Skill `/stitch-brand-integrate` funcional e documentada
- [ ] Stitch MCP config + acesso testado
- [ ] Harness passa: `npm run test:specs -- SPEC-178`
- [ ] CI verde (lint + build + test)
- [ ] CHANGELOG atualizado
- [ ] Documentação em `docs/STITCH_CLAUDE_WORKFLOW.md` completa

---

## Validação:

### 4.1 Harness: `tests/specs/SPEC-178.test.js`

```javascript
describe('SPEC-178: Stitch + Claude Design + Claude Code', () => {
  
  it('deve gerar DESIGN.md com 100% de cobertura', async () => {
    const design = require('../../DESIGN.md');
    expect(design).toContain('Colors');
    expect(design).toContain('Typography');
    expect(design).toContain('Components');
    expect(design.match(/##/g).length).toBeGreaterThan(8);
  });

  it('deve ter tokens mapeiados semanticamente', async () => {
    const tokens = require('../../assets/design-tokens.json');
    const primitive = tokens.primitive.colors;
    const semantic = tokens.semantic.color;
    expect(Object.keys(semantic).length).toBeGreaterThan(5);
  });

  it('deve gerar DESIGN.md sem erros via script', async () => {
    const { execSync } = require('child_process');
    const output = execSync('node scripts/generate-design-md.js').toString();
    expect(output).toContain('✓ DESIGN.md gerado');
  });

  it('Stitch MCP config em .claude/settings.json', async () => {
    const settings = require('../../.claude/settings.json');
    expect(settings.mcp_servers).toBeDefined();
    expect(settings.mcp_servers.stitch).toBeDefined();
  });

  it('skill /stitch-brand-integrate existe e referencia SPEC-178', async () => {
    const skill = require('../../skills/stitch-brand-integration.skill.md');
    expect(skill).toContain('SPEC-178');
  });

  it('CI verde: lint + build (1.5s)', async () => {
    const { execSync } = require('child_process');
    execSync('npm run lint');
    execSync('npm run build');
  });
});
```

### 4.2 Checklist de validação manual

- [ ] DESIGN.md aberto no Stitch MCP — zero erros
- [ ] Claude Code consegue ler DESIGN.md via skill
- [ ] Mockup Claude Design feito com 3 variações
- [ ] Skill gera DESIGN.md em < 5s
- [ ] Build não regride (iguais a main: size, speed)
- [ ] Documentação `STITCH_CLAUDE_WORKFLOW.md` clara pra dev novo

---

## Forbidden

### 5.1 O que **NÃO FAZER**

❌ **NÃO** criar DESIGN.md manualmente (sempre via script)  
❌ **NÃO** quebrar design tokens JSON (é fonte única)  
❌ **NÃO** commitar DESIGN.md que não passou harness  
❌ **NÃO** usar `/stitch-brand-integrate` sem Stitch MCP conectado  
❌ **NÃO** modificar brand-guidelines.md sem SPEC-176 atualização  
❌ **NÃO** adicionar cores fora da paleta ISSSD  
❌ **NÃO** deixar skill sem referência para SPEC-178  
❌ **NÃO** mergear sem testes passando  

### 5.2 Constraints técnicos

- Stitch MCP URL não pode ser hardcoded (usar env ou config)
- DESIGN.md deve ser versionável (sem binários, puro markdown)
- Script geração < 2s (não bloqueia dev loop)
- API key nunca em código (usar `.env.local` + `.gitignore`)

---

## 6. Decomposição em tasks

1. **SPEC-178a**: Script `generate-design-md.js` (harness)
   - Lê brand + tokens
   - Gera DESIGN.md
   - Valida sintaxe

2. **SPEC-178b**: Stitch MCP config + tests
   - Setup `.claude/settings.json`
   - Testa leitura MCP
   - Integração CI

3. **SPEC-178c**: Skill `/stitch-brand-integrate`
   - Orquestra fluxo
   - Referencia SPEC-178
   - Documentação

4. **SPEC-178d**: Documentação + workflow
   - `docs/STITCH_CLAUDE_WORKFLOW.md`
   - Exemplos end-to-end
   - Troubleshooting

---

## 7. Referências

- **SPEC-176**: Brand Identity ISSSD-Premium (decisão)
- **SPEC-178**: Design Tokens Three-Layer (implementação)
- **SPEC-179**: Logo Guide (futuro)
- **docs/brand-guidelines.md**: Fonte visual única
- **assets/design-tokens.json**: Tokens estruturados
- **Stitch MCP**: https://github.com/google-labs-code/stitch-skills
- **Claude Code**: https://claude.com/claude-code
- **Claude Design**: https://claude.com/design

---

**Próximo passo**: Aprovação Dudu → decomposição em 4 PRs → implementação SPEC-178a..d
