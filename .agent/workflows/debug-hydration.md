---
description: Debugar erros de hydration do Next.js (Text content does not match server-rendered HTML)
---

1. **Identificar o componente com problema**:
   - Verificar o console do browser para a mensagem de erro exata
   - O React 19 mostra o diff entre server e client render

2. **Checar causas comuns**:
   - **HTML inválido**: `<div>` dentro de `<p>`, `<a>` dentro de `<a>`
   // turbo
   - Run `grep -rn '<p.*<div\|<a.*<a\|<button.*<button' src/ --include="*.tsx" 2>/dev/null | head -10`

3. **Checar acesso a APIs do browser no server**:
   // turbo
   - Run `grep -rn 'window\.\|document\.\|localStorage\.\|navigator\.' src/ --include="*.tsx" 2>/dev/null | grep -v "typeof window" | grep -v "useEffect" | head -20`

4. **Verificar uso de Date/random sem controle**:
   // turbo
   - Run `grep -rn 'new Date()\|Math.random()' src/ --include="*.tsx" 2>/dev/null | grep -v "useEffect\|useState" | head -10`

5. **Fix padrão**:
   - Mover código browser-only para dentro de `useEffect`
   - Usar `suppressHydrationWarning` como último recurso
   - Usar dynamic import com `{ ssr: false }` para componentes client-only
