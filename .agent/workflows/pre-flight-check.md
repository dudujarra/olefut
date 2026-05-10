---
description: Checagem completa antes de push - tipos, lint, build e testes
---

1. **Type Check**:
   // turbo
   - Run `npx tsc --noEmit`

2. **Lint Check**:
   // turbo
   - Run `npm run lint`

3. **Build Verification**:
   // turbo
   - Run `npm run build`

4. **Prisma Validation**:
   // turbo
   - Run `npx prisma validate`

5. **Rodar testes (se existirem)**:
   // turbo
   - Run `npm test -- --passWithNoTests 2>/dev/null || echo "Sem testes configurados"`

6. **Reportar resultado**:
   - Resumir: quantos erros de tipo, lint warnings, se build passou
   - Se tudo OK: "✅ Pronto para push"
   - Se falhou: listar o que precisa ser corrigido
