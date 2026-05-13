---
description: Brand operations — gen DESIGN.md, validate, audit, sync to Stitch
argument-hint: "gen | validate | audit | sync"
---

# /brand

Brand operations entry point.

## Subcommands

Parse `$ARGUMENTS` to route:

### `gen` — Generate DESIGN.md

```bash
node scripts/generate-design-md.cjs
```

Reads `docs/brand-guidelines.md` + `assets/design-tokens.json` → writes `DESIGN.md` (root).

### `validate` — Run brand compliance checks

```bash
npm run lint 2>&1 | grep -E "error|warning" | head -20
npm test -- SPEC-171 SPEC-178 2>&1 | tail -10
```

Checks:
- ESLint clean
- SPEC-171 (font tokens) passing
- SPEC-178 (stitch integration) passing
- Zero hardcoded hex outside intentional locations

### `audit` — Full design system audit

Invoke `Skill(skill="design:design-system", args="audit")` skill.

Output: `docs/DESIGN-SYSTEM-AUDIT.md` with scored breakdown:
- Naming Consistency
- Token Coverage
- Component Completeness
- Accessibility
- Forbidden Compliance
- Voice & Tone

### `sync` — Sync DESIGN.md to Stitch MCP

Requires Stitch MCP connector active.

```bash
# Read current DESIGN.md
DESIGN_CONTENT=$(cat DESIGN.md)

# Then invoke MCP:
# mcp__stitch__create_design_system_from_design_md with content
```

## Default (no args)

Show this help.

## Examples

```
/brand gen          # generate DESIGN.md from sources
/brand validate     # run compliance checks
/brand audit        # full scored audit
/brand sync         # push to Stitch MCP
```

## Related

- `/stitch-brand-integrate` — alias to `/brand gen --mcp-sync`
- `docs/brand-guidelines.md` — brand source (v1.1)
- `assets/design-tokens.json` — token source
- `DESIGN.md` — generated output (root)
