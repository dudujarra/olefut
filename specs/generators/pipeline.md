# SPEC Generator — Pipeline

Use para specs de **pipeline / infra / automação** (CI, build, deploy, harnesses, scripts).

Copia, salva como `specs/infra/SPEC-XXX-pipeline-nome.md`, preenche.

---

```markdown
# SPEC-XXX: [Pipeline / job / harness]

**Tipo**: pipeline
**Status**: 📝 draft | ✅ approved | 🔨 implementing | ✔️ done | 🚫 cancelled
**Owner**: Dudu
**Criada**: YYYY-MM-DD

---

## 1. Objetivo

> O que este pipeline faz, em 1 frase.

## 2. Trigger

Quando roda:
- [ ] manual (`workflow_dispatch`)
- [ ] push em `main`
- [ ] PR em `main`
- [ ] cron `<expressão>`
- [ ] hook local (pre-commit / pre-push)
- [ ] outro: ...

## 3. Steps

1. Setup (node version, deps cache)
2. Step ... — comando exato
3. Step ... — comando exato
4. Artifact / publish — se houver

## 4. Inputs

- env vars: `KEY=...`
- secrets: `GITHUB_TOKEN`, etc.
- arquivos lidos: ...

## 5. Outputs

- exit code esperado: 0
- arquivos gerados: `dist/`, relatórios em `tests/.../`
- side effects: deploy / notificação / comentário no PR

## 6. Validação (Regra 0)

- [ ] Roda local sem erro (comando exato): ...
- [ ] CI roda sem erro (link do run de teste)
- [ ] Falha intencional bloqueia (negative test)

## 7. Forbidden

- ❌ Sem cache (build > N minutos)
- ❌ `--no-verify` em commits
- ❌ Skip de teste sem motivo registrado
- ❌ Chamada API paga (Mandamento #7)

## 8. Arquivos

- `.github/workflows/<nome>.yml` — novo / modificado
- `scripts/<nome>.sh` — se houver

## 9. Custo

- Minutos CI estimados: ...
- Quota Actions / Pages OK?

## 10. Rollback

Se o pipeline quebra produção:
1. Revert do workflow file.
2. Comando manual de fallback: ...
```
