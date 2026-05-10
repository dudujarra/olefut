---
description: Analisar e otimizar o tamanho do bundle de produção Next.js
---

1. **Instalar analyzer (se não tiver)**:
   // turbo
   - Run `npm list @next/bundle-analyzer 2>/dev/null || npm install --save-dev @next/bundle-analyzer`

2. **Rodar build com análise**:
   // turbo
   - Run `ANALYZE=true npm run build`

3. **Identificar pacotes pesados**:
   - Analisar o relatório gerado
   - Listar os 5 maiores pacotes no bundle
   - Sugerir alternativas leves:
     - `moment.js` → `date-fns` ou `dayjs`
     - `lodash` → imports individuais ou JS nativo
     - icons pesados → tree-shakeable alternatives

4. **Verificar imports desnecessários**:
   // turbo
   - Run `grep -r "import.*from 'lodash'" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20`

5. **Reportar resultado**:
   - Tamanho total do bundle
   - Top 5 dependências mais pesadas
   - Sugestões de otimização
