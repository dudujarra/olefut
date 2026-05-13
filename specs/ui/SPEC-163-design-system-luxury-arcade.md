# SPEC-163: Luxury Arcade Design System Reconciliation

## Pergunta/Objetivo
Como unificar as diretrizes de design do OléFUT RPG para garantir uma estética consistente e de alta qualidade (Luxury Arcade) em toda a interface do usuário?

## Sintoma/Motivação (Por que foi feito)
Existiam dois documentos de design conflitantes (`OléFUT_DESIGN_SYSTEM.md` na raiz e `.agent/DESIGN.md`), causando divergências (ex: o uso da fonte 'Inter' era banido no documento principal, mas prescrito no arquivo `.agent`). A duplicidade gerava inconsistências arquitetônicas na UI.

## Método
- Exclusão do arquivo desatualizado e incorreto `.agent/DESIGN.md`.
- Formalização do `OléFUT_DESIGN_SYSTEM.md` como a única fonte canônica da verdade visual para todos os agentes.
- Banimento formal da fonte genérica 'Inter' em prol de tipografias mais ricas adequadas à estética "Luxury Arcade" (ex: Clash Display, Satoshi, ou nativas otimizadas).
- Troca programada de emojis inline por ícones SVG vetoriais (`Phosphor Icons`) para garantir renderização perfeita em qualquer motor ou OS.

## Critério de Respondida
- Apenas um documento de design system deve existir na raiz.
- A paleta de cores, tipografia (sem Inter), e iconografia (sem Emojis) devem ser estritamente controladas pelas diretrizes do `OléFUT_DESIGN_SYSTEM.md`.

## Resultado
Implementado com sucesso no decorrer da branch `claude/akita-retroactive-features` via `AKITA-210`. O documento de design .agent foi deletado, e as especificações formais de tipografia "Luxury Arcade" foram declaradas invioláveis.
