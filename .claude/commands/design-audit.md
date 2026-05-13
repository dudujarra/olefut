---
description: Run full design system audit (token coverage, naming, accessibility, voice)
---

# /design-audit

Run comprehensive design system audit.

## Execute

Invoke `Skill(skill="design:design-system", args="audit OléFUT design system. brand: docs/brand-guidelines.md. tokens: assets/design-tokens.json. validate token coverage, naming consistency, contrast ratios.")`.

## Output

File: `docs/DESIGN-SYSTEM-AUDIT.md`

Categories scored (weighted):
- Naming Consistency (15%)
- Token Coverage (25%)
- Component Completeness (20%)
- Accessibility (15%)
- Forbidden Compliance (15%)
- Voice & Tone (10%)

Total: X/100

## Current baseline

Last audit: **90.75/100 (A-)** — see `docs/DESIGN-SYSTEM-AUDIT.md`

## Path to 95+

1. Migrate legacy luxury-arcade classes → ef-* namespace
2. Refactor AutoPlayView structural (952 LOC)
3. Add CSS files for 19 remaining components
4. Document UI primitive variants
