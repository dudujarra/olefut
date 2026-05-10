# Skill: Elifoot Bug Sweep (Caça Bug)

## Triggers
Quando o usuário disser qualquer uma dessas frases (ou variações):
- "caça bug"
- "caça bugs"  
- "debugga"
- "bug sweep"
- "roda os testes"
- "testa tudo"
- "QA"

## Ação
Executar automaticamente o workflow completo de QA do Elifoot, **sem pedir confirmação**:

### Passo 1: Rodar o Bug Sweep Script
```bash
cd /Users/dudujarra/Documents/ELIFOOT && ./scripts/elifoot-bug-sweep.sh all 2>&1
```

### Passo 2: Interpretar resultado
- Se **✅ APROVADO**: reportar "Zero bugs, X testes passando, build OK"
- Se **❌ REPROVADO**: listar os bugs encontrados e perguntar "quer que eu corrija?"

### Passo 3: Se houver bugs novos
1. Criar ticket no `BUGS.md`
2. Implementar o fix
3. Criar/atualizar teste em `tests/`
4. Rodar sweep de novo até ✅ APROVADO
5. Commit com prefixo 🐛

### Passo 4: Reportar
Formato de resposta:
```
✅ APROVADO — 0 bugs, X warnings, Y/Y testes, build OK
```
ou
```
❌ REPROVADO — N bugs encontrados:
- BUG-XXX: descrição
Corrigindo...
```

## Notas
- O script está em `/Users/dudujarra/Documents/ELIFOOT/scripts/elifoot-bug-sweep.sh`
- Testes em `/Users/dudujarra/Documents/ELIFOOT/tests/`
- Tracker em `/Users/dudujarra/Documents/ELIFOOT/BUGS.md`
- Relatório em `/Users/dudujarra/Documents/ELIFOOT/docs/qa-report.md`
