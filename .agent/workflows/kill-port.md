---
description: Matar processo travado na porta 3000 (ou outra porta) do dev server
---

1. **Identificar processo na porta**:
   // turbo
   - Run `lsof -ti:3000`

2. **Matar o processo**:
   // turbo
   - Run `kill -9 $(lsof -ti:3000) 2>/dev/null && echo "✅ Porta 3000 liberada" || echo "ℹ️ Nenhum processo na porta 3000"`

3. **Verificar se liberou**:
   // turbo
   - Run `lsof -ti:3000 && echo "❌ Ainda ocupada" || echo "✅ Porta livre"`
