---
description: Generate DESIGN.md from brand-guidelines.md + design-tokens.json (Stitch-ready source of truth)
argument-hint: "[--mcp-sync] [--validate]"
---

# /stitch-brand-integrate

Orchestrate **Stitch + Claude Design + Claude Code** integration with ISSSD-Premium design system.

**SPEC**: SPEC-178 (specs/ui/SPEC-178-stitch-claude-design-integration.md)

## What this does

Runs `scripts/generate-design-md.cjs` to:

1. Parse `docs/brand-guidelines.md` (brand identity v1.1)
2. Parse `assets/design-tokens.json` (three-layer tokens)
3. Merge into `DESIGN.md` (root) — single source of truth Stitch-ready
4. (Optional) Validate via harness `tests/specs/SPEC-178.test.js`
5. (Optional) Sync to Stitch MCP project

## Execute

```bash
node scripts/generate-design-md.cjs
```

Expected output:
```
✓ DESIGN.md generated (~280 lines)
  Path: <root>/DESIGN.md
✓ Tokens: N color groups, N component specs
✓ Brand: N lines parsed
```

## Arguments

`$ARGUMENTS` interpretation:
- `--validate` → run `npm test -- SPEC-178` after generation
- `--mcp-sync` → sync DESIGN.md to Stitch MCP project (requires STITCH_API_KEY)
- `--audit` → also run `design:design-system audit` skill

## Output sections in DESIGN.md

1. Brand Manifesto
2. Colors (primitive + semantic layers)
3. Typography (families, sizes, weights, rules)
4. Spacing
5. Components (button, panel, card, input, notification, badge, frame)
6. Forbidden techniques
7. Accessibility contrast ratios
8. Voice & tone
9. Visual direction (luxury arcade 32-bit + trophy hierarchy)
10. Integration (Stitch MCP + Claude Code + CSS)

## After generation

Use DESIGN.md as input for:
- Stitch design generation (`mcp__stitch__create_design_system_from_design_md`)
- Claude Code component generation
- Frontend dev reference

## Validation

Self-check (auto-applied):
- ✅ Zero hardcoded hex outside palette
- ✅ Zero gradient/rgba/border-radius
- ✅ Font stack: Press Start 2P / Pixelify Sans / IBM Plex Mono
- ✅ WCAG AAA on primary text pairs
