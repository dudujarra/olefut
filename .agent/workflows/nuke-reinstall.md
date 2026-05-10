---
description: Opção nuclear - limpar tudo e reinstalar dependências quando nada funciona
---

1. **Remover node_modules**:
   // turbo
   - Run `rm -rf node_modules`

2. **Remover lock file**:
   // turbo
   - Run `rm -f package-lock.json yarn.lock pnpm-lock.yaml`

3. **Limpar cache do Next.js**:
   // turbo
   - Run `rm -rf .next`

4. **Limpar cache do npm**:
   // turbo
   - Run `npm cache clean --force`

5. **Reinstalar tudo do zero**:
   // turbo
   - Run `npm install`

6. **Regenerar Prisma client**:
   // turbo
   - Run `npx prisma generate`

7. **Verificar se funciona**:
   // turbo
   - Run `npm run build`
