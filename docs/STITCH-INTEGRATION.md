# Stitch MCP Integration — Live Status

**Last sync**: 2026-05-13
**Status**: ✅ Active

---

## Stitch Project

| Field | Value |
|-------|-------|
| Project ID | `1129586751616590793` |
| Title | OléFUT ISSSD-Premium 32-bit |
| Origin | STITCH |
| Type | PROJECT_DESIGN |
| Visibility | PRIVATE |

## Design System Asset

| Field | Value |
|-------|-------|
| Asset ID | `assets/88a8720bc4f7464e9923da6c676f6074` |
| Version | 1 |
| Display Name | OléFUT Design System |
| Color Mode | DARK |
| Color Variant | FIDELITY |
| Primary Color | `#39ff14` |
| Body Font | RUBIK |
| Headline Font | Press Start 2P |
| Label Font | JETBRAINS_MONO |
| Device Type | DESKTOP |

## Initial Screen Instance

| Field | Value |
|-------|-------|
| Screen ID | `2828233793268488775` |
| Source | `projects/1129586751616590793/screens/2828233793268488775` |
| Dimensions | 390×884 (mobile portrait) |

## Tokens Synced

11 named brand colors + 30+ Material Design surface containers (auto-generated):

| Token | Hex |
|-------|-----|
| neon | #39FF14 |
| pitch | #52B788 |
| forest | #1B4332 |
| forest-dark | #0E1F14 |
| trophy | #FFD700 |
| amber | #FBBF24 |
| danger | #FF3333 |
| danger-dark | #8B0000 |
| crt-black | #111417 |
| abyss | #040805 |
| smoke | #A0BAAE |
| parchment | #F1FAEE |

## Style Guidelines Recognized

Stitch parsed and codified:

- **Brand philosophy**: "Premium Nostalgia" rejecting clinical spreadsheet UX
- **Aesthetic**: Retro/Vaporwave + Brutalism, 16-bit/32-bit era SNES reference (ISSSD)
- **Grid**: 4px baseline, 12-col desktop / 4-col mobile
- **Depth**: Bold borders + tonal layering (NO soft shadows, NO gradients)
- **CRT atmosphere**: Scanline overlay recommendation
- **Components**: Button (3 states), Panel, Input (terminal feel), Chips, Progress bars

## Workflow

### Generate latest DESIGN.md

```bash
/brand gen          # or: node scripts/generate-design-md.cjs
```

### Re-sync to Stitch

```bash
/stitch-brand-integrate
```

Manual re-sync via MCP:
1. `base64 -i DESIGN.md` → b64 string
2. `mcp__stitch__upload_design_md` with projectId + b64
3. `mcp__stitch__create_design_system_from_design_md` with returned screen

### Apply to new screens

```bash
mcp__stitch__apply_design_system
  assetId: 88a8720bc4f7464e9923da6c676f6074
  projectId: 1129586751616590793
  selectedScreenInstances: [<new screens>]
```

## Next Steps

Stitch suggested workflows:
- ☐ Generate team management screen using OléFUT style
- ☐ Create match preview layout
- ☐ Design player stats card

## Re-sync Triggers

Re-run `/stitch-brand-integrate` when:
- `docs/brand-guidelines.md` updated
- `assets/design-tokens.json` updated
- New component tokens added to `src/styles/isssd-premium.css`
- Brand voice/messaging changes

---

**Skill**: `/stitch-brand-integrate`
**Generator**: `scripts/generate-design-md.cjs`
**SPEC**: `specs/ui/SPEC-178-stitch-claude-design-integration.md`
