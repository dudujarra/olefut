# SPEC-RULES.md — Spec-Driven Development (SDD) para ELIFOOT RPG

**Data de adoção**: 2026-05-07  
**Escopo**: 100% do projeto. Todas as features, bugs, testes, infra, docs.  
**Regra absoluta**: Nada é feito sem spec escrita e aprovada.  
**Protocolo**: AKITA Spec-Driven Development

---

## O que é SDD no ELIFOOT

SDD é o **sistema operacional** do projeto.

Antes de qualquer ação produtiva — escrever feature, corrigir bug, criar teste, modificar infra — existe uma spec que define:
- O que **entra** (input)
- O que **sai** (output)
- Como **validar**
- O que é **proibido**

Se a spec não existe, a primeira tarefa é escrevê-la.

---

## O ciclo universal

```
1. SPEC     — definir objetivo, input, output, validação, forbidden
2. BUILD    — executar contra a spec
3. VALIDATE — verificar se resultado satisfaz a spec
4. DEPLOY   — só se VALIDATE passar
```

Vale para TUDO:

| Tipo de trabalho | Exemplo |
|-----------------|---------|
| Feature | Match Engine, Formation System, Player Development |
| Bug fix | Reprodução, resultado correto, teste de regressão |
| Teste | O que validar, casos de cobertura, fixtures |
| Infra | CI/CD, deploy, database schema |
| Documentação | Seções, público, critérios de completude |
| Script/Harness | Input, output, edge cases, validação |

---

## Formato mínimo de uma spec

```markdown
# SPEC-XXX: [nome]

## O que é
(1-2 frases — objetivo claro)

## Input
(o que entra — tipo, formato, origem)

## Output esperado
(o que sai — tipo, formato, exemplo concreto JSON/código)

## Regras de validação
(como verificar que o output está correto — 8+ checklist objetiva)

## Forbidden
(o que NÃO pode acontecer — 5+ casos explícitos)

## Implementação
(arquivo, método, referências)

## Testes esperados
(casos, fixtures, assertions)
```

**Seções obrigatórias**: As 5 primeiras. Resto é opcional conforme necessidade.

---

## Regras de execução

### 1. Spec antes de tudo — sempre
Agente NÃO inicia nenhum trabalho sem spec. Se Dudu pede algo e não existe spec:
1. Agente escreve a spec primeiro
2. Apresenta para aprovação
3. Só executa após aprovação

### 2. Spec aprovada pelo Dudu
Agente propõe spec. Dudu aprova, ajusta ou rejeita.
- Aprovação explícita: "ok", "vai", "faz sentido"
- Aprovação implícita: não objetar
- Execução só começa após aprovação

### 3. Validação obrigatória
Toda spec define como verificar resultado. Sem validação = spec incompleta.

Tipos:
- **Algorítmica**: script que checa formato, contagem, padrões
- **Semântica**: LLM que verifica conteúdo vs critério
- **Comparativa**: resultado vs exemplo de referência
- **Automatizada**: `npm test` + CI/CD

### 4. Spec é viva
Se durante BUILD ou VALIDATE descobre-se que a spec está errada:
1. Parar
2. Atualizar a spec
3. Comunicar ao Dudu
4. Continuar com spec atualizada

### 5. Gate permanente
- Nenhum código vai para produção sem validação da spec
- Nenhum teste roda sem spec do que valida
- Nenhum bug é corrigido sem spec de reprodução
- Nenhuma feature implementada sem spec de comportamento

---

## Estrutura de diretórios

```
.claude/specs/
  SPEC-RULES.md                      ← este documento (fundamento SDD)
  SPEC-TEMPLATE.md                   ← template + exemplo preenchido
  engine/
    SPEC-001-match-engine-simulation.md
    SPEC-002-match-events-deck.md
    SPEC-003-player-development.md
    SPEC-004-formation-tactic-system.md
    SPEC-005-injury-system.md
    SPEC-006-board-system.md
    SPEC-007-personality-system.md
    SPEC-008-stress-system.md
  ui/
    SPEC-009-dashboard-view.md
    SPEC-010-match-view.md
    (mais specs de views conforme necessidade)
  data/
    SPEC-020-database-schema.md
    SPEC-021-players-generation.md
    (mais specs de dados)
  infra/
    SPEC-030-ci-cd-pipeline.md
    SPEC-031-deploy-github-pages.md
    (mais specs de infra)
  tests/
    SPEC-040-test-coverage.md
    (specs de suite de testes)
```

---

## Padrão de nome

```
SPEC-XXX-name-kebab-case.md

XXX = 3 dígitos (001, 002, ..., 099)
name = descrição em kebab-case (lowercase, hífens)

Exemplo:
✅ SPEC-001-match-engine-simulation.md
✅ SPEC-021-players-generation.md
❌ SPEC-1-match.md (número não padronizado)
❌ SPEC-001_match_engine.md (underscore em vez de hífen)
```

---

## Regra de priorização (FASE)

Specs são organizadas por fase de implementação:

| Fase | Range | Escopo | Bloqueador? |
|------|-------|--------|-----------|
| **FASE 1** | 001-019 | Infraestrutura SDD | 🔴 SIM |
| **FASE 2** | 020-039 | Features core (engine, ui, data) | 🔴 SIM |
| **FASE 3** | 040-059 | Features secundárias (staff, stadium, etc) | 🟡 NÃO |
| **FASE 4** | 060-079 | Infra (CI/CD, deploy, monitoring) | 🟡 NÃO |
| **FASE 5** | 080-099 | Backlog (polish, refinamentos, features novas) | 🟢 NÃO |

---

## Harness — regra obrigatória

**Regra AKITA #2**: Toda spec entrega um harness executável que valida a spec.

Harness = teste automatizado + script de validação.

Exemplo:
```javascript
// tests/SPEC-001-match-engine-simulation.test.js

describe('SPEC-001: Match Engine Simulation', () => {
  test('input: valid home/away teams → output: valid match result', () => {
    const match = engine.playMatch(homeId, awayId);
    
    // Validações obrigatórias:
    expect(match.homeGoals).toBeGreaterThanOrEqual(0);
    expect(match.awayGoals).toBeGreaterThanOrEqual(0);
    expect(match.events).toHaveLength(match.totalEvents);
    expect(match.narration.length).toBeGreaterThan(0);
    // ... 8+ mais validações
  });

  test('forbidden: home goals < 0', () => {
    // Garantir que resultado nunca viola esta regra
    expect(() => engine.playMatch(homeId, awayId)).not.toThrow();
    // result.homeGoals sempre >= 0
  });
});
```

Sem harness = spec rejeitada.

---

## Git — commits AKITA

Todo commit relacionado a spec tem formato:

```
AKITA-XXX: SPEC-00Y Description

Detalhe do trabalho em bullets.
- Escrita de SPEC-001
- Validação contra código existente
- Harness criado e passando
```

Exemplo:
```
AKITA-021: SPEC-001 Match Engine Simulation

- Documentado contrato de input/output
- 12 regras de validação definidas
- 8 casos forbidden listados
- Harness criado: tests/SPEC-001-match-engine-simulation.test.js
- Código validado contra spec
- npm test passando 100%
```

Pre-commit hook valida formato.

---

## Ciclo de uma spec

1. **Proposta**: Agente ou Dudu propõe spec (rascunho)
2. **Apresentação**: Agente mostra a Dudu em formato markdown
3. **Aprovação**: Dudu aprova, ajusta ou rejeita
4. **Salva**: Salvo em `.claude/specs/[tipo]/SPEC-XXX-name.md`
5. **Build**: Agente implementa contra a spec
6. **Harness**: Teste automatizado valida spec
7. **Validação**: `npm test` + `npm run build` + `spec-check.sh`
8. **Deploy**: Commit com `AKITA-XXX:` merge to main

---

## Gerador de specs

Para criar nova spec, usar template:

```bash
cat .claude/specs/SPEC-TEMPLATE.md
```

Template tem:
1. Estrutura das 5 seções obrigatórias
2. Exemplo preenchido (Match Engine)
3. Guia de como preencher cada seção
4. Checklist de completude

Processo:
1. Copiar template
2. Preencher as 5 seções
3. Testar com agente (faz sentido?)
4. Apresentar ao Dudu
5. Ajustar feedback
6. Salvar em `.claude/specs/[tipo]/SPEC-XXX-name.md`

---

## Por que SDD agora

ELIFOOT foi implementado sem specs. Resultado:
- ❌ Impossível validar se bug está "realmente" errado
- ❌ Fixes podem quebrar outra coisa sem saber
- ❌ Não há testes de regressão definidos
- ❌ Documentação desincronizada do código

SDD resolve isso:
- ✅ Spec define exatamente o que é "correto"
- ✅ Testes validam contra spec
- ✅ Mudanças futuras rastreáveis
- ✅ Documentação vinculada a código

Decisão: Dudu, 2026-05-07. SDD completo em 6 weeks.

---

## Para todos os agentes

Ao iniciar sessão em ELIFOOT:

1. Verificar se trabalho solicitado tem spec: `ls .claude/specs/*/SPEC-*.md`
2. Se sim: seguir a spec
3. Se não:
   - Usar gerador: `cat .claude/specs/SPEC-TEMPLATE.md`
   - Preencher as 5 seções obrigatórias
   - Apresentar ao Dudu
   - Esperar aprovação
   - NUNCA começar work sem spec — mesmo que pareça simples
4. Criar harness que valida a spec
5. Commit com `AKITA-XXX: SPEC-00Y Name`

---

**Status**: FUNDAMENTO SDD ATIVO  
**Ciclo**: SPEC → BUILD → VALIDATE → DEPLOY  
**Regra absoluta**: Sem spec = sem work
