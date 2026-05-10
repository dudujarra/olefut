---
description: Reverter a última migration do Prisma em caso de problema no banco
---

1. **Verificar status das migrations**:
   // turbo
   - Run `npx prisma migrate status`

2. **Se a migration falhou (stuck)**:
   // turbo
   - Run `npx prisma migrate resolve --rolled-back "NOME_DA_MIGRATION"`

3. **Se precisa reverter manualmente**:
   - Identificar as tabelas/colunas criadas na migration problemática em `prisma/migrations/`
   - Criar SQL de rollback manual:
   ```sql
   -- Reverter alterações específicas
   ALTER TABLE "table_name" DROP COLUMN IF EXISTS "column_name";
   ```
   // turbo
   - Run `npx prisma db execute --file ./rollback.sql`

4. **Deletar a migration defeituosa**:
   - Remover a pasta da migration em `prisma/migrations/`
   // turbo
   - Run `npx prisma migrate dev`

5. **Validar integridade**:
   // turbo
   - Run `npx prisma validate`
   // turbo
   - Run `npx prisma generate`
