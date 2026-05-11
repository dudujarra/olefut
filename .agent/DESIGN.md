# Elifoot Luxury Arcade Design System

## 1. Core Concept
"Luxury Arcade": A synthesis of classic 16-bit SNES aesthetics with high-end, modern agency-level UI/UX. 
- Deep CRT blacks and high-contrast neon accents.
- Hardware-accelerated micro-animations.
- No generic AI-generated "glassmorphism" or cheap rounded borders.
- Strict deterministic pixel art for avatars and shields.

## 2. Token System (The Single Source of Truth)

### Color Palette
- **Background (CRT)**: `--bg-dark: #111417` (Deep OLED Night)
- **Panel Background**: `--bg-panel: #1A1F24` (Elevated dark)
- **Primary**: `--primary: #00FF66` (Neon Turf Green)
- **Primary Dark**: `--primary-dark: #00CC52`
- **Primary Glow**: `--primary-glow: rgba(0, 255, 102, 0.25)`
- **Accent**: `--accent: #FFD600` (Arcade Yellow)
- **Danger**: `--danger: #FF1744` (Crimson Red)
- **Info**: `--info: #00E5FF` (Electric Blue)
- **Text Main**: `--text-main: #FDFBF7` (Chalk White)
- **Text Muted**: `--text-muted: #8E9E94` (Silver Green)

### Typography
- **Display/Headings**: `Outfit` (Bold, uppercase, geometric)
- **Body**: `Inter` (Clean, legible, modern)
- **Data/Monospace**: `Geist Mono` or `Courier Prime`

### Borders & Layout
- **Glass Border**: `rgba(0, 255, 102, 0.3)`
- **Subtle Border**: `rgba(253, 251, 247, 0.08)`
- **Radius**: `--radius: 8px`, `--radius-sm: 4px`, `--radius-xs: 2px`
- **Bezel**: `inset 0 0 0 4px rgba(0,0,0,0.5), inset 0 0 0 5px rgba(255,255,255,0.05)`

## 3. Component Governance
- **NO INLINE STYLES**: All inline `style={{}}` must be removed and replaced with semantic CSS classes.
- **Buttons**: Must use `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-accent`. Pill-shaped (`9999px`), bold typography.
- **Cards**: Must use `.card`, `.card-compact`. Double-bezel arcade style.
- **Tables**: `.standings-table` with strict spacing.
- **Alerts**: `.alert-badge` with semantic colors.
- **Layout**: CSS Grid and Flexbox using standard utility/component classes.

## 4. CSS Architecture
- `src/index.css` is the master file. All disparate theme files (`32bit-theme.css`, `8bit-theme.css`, `mobile.css`, etc.) must be audited. Any conflicting or duplicated token definitions must be purged.
