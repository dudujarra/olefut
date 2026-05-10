# Design System: ELIFOOT WEB (ISS Deluxe Luxury Edition)

## 1. Visual Theme & Atmosphere
A high-end, Awwwards-tier translation of the retro "SNES International Superstar Soccer Deluxe" aesthetic. It replaces pixelated 16-bit nostalgia with a "Luxury Arcade" cockpit mode. The atmosphere feels like a premium broadcast overlay or a modern tactical engine — deep OLED stadium greens, high contrast geometric interfaces, liquid glass refraction, and aggressive but clean sports typography. It is densely packed but elegantly separated.

## 2. Color Palette & Roles
- **OLED Stadium Night** (`#050A07`) — Primary background surface.
- **Deep Pitch Green** (`#0D1A11`) — Card and container fill (replacing generic dark gray with subtle turf tones).
- **Chalk White** (`#FDFBF7`) — Primary text, maximum readability.
- **Muted Silver** (`#A1A1AA`) — Secondary text, descriptions, metadata.
- **Neon Turf Accent** (`#00E676`) — Single accent for CTAs, active states, focus rings, and radar dots.
- **Whisper Border** (`rgba(255,255,255,0.06)`) — Card borders, 1px structural lines for the Double-Bezel effect.
- **Referee Yellow / Warning** (`#FFD600`) — System warnings, yellow cards.
- **Crimson Red / Danger** (`#FF1744`) — Critical alerts, red cards.

*(Max 1 primary accent: Neon Turf Accent. No purple/neon pink. No oversaturated colors outside of explicit UI feedback).*

## 3. Typography Rules
- **Display/Headlines:** `Geist`, `Cabinet Grotesk`, or `Clash Display` — Track-tight, controlled scale. Massive and aggressive but perfectly legible. Replaces pixel-fonts.
- **Body:** `Geist` or `Inter` — Relaxed leading, 65ch max-width, chalk white or muted silver.
- **Mono/Data:** `Geist Mono` or `JetBrains Mono` — For match stats, week counters, numbers.
- **Banned:** Generic serif fonts. Pixel fonts (`VT323`, `Press Start 2P`). `Arial`, `Roboto`.

## 4. Component Stylings
- **Cards (Double-Bezel):** Generously rounded corners (`border-radius: 2rem`). Outer shell with a subtle background and 1px hairline border. Inner core with a distinct background and inner highlight (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`). Diffused whisper shadow. No generic box-shadows.
- **Buttons (Magnetic / Nested):** Fully rounded pills. Tactile push feedback (`scale-98`) on active state. Primary buttons use the Neon Turf Accent. No neon outer glows.
- **Shields & Avatars:** 1:1 square ratio for team crests, geometric, vector style on dark backgrounds.
- **Inputs:** Label above input, error below. Focus ring in accent color. Deep Pitch Green background.
- **Loaders:** Skeletal shimmer matching layout dimensions. No circular spinners.
- **Radar/Pitch:** Deep green overlay with blurred neon green dots for tactical representations.

## 5. Layout Principles
- **Grid-First:** Asymmetrical Bento grid for dashboards. CSS Grid over Flexbox math. 
- **Density:** Cockpit Dense (8/10). Data is packed but separated by 1px hairlines and distinct backgrounds.
- **Responsive:** Strict single-column collapse below 768px (`w-full`, `px-4`). No horizontal scroll. Max-width containment (`max-w-[1400px]`).
- **No Overlapping Elements:** Clean spatial separation always.

## 6. Motion & Interaction
- **Perpetual Micro-Interactions:** Constant subtle motion. Active components loop (Pulse, Typewriter).
- **Spring Physics:** `stiffness: 100, damping: 20` default. Premium, weighty feel. No linear easing.
- **Liquid Glass:** Inner refractions on glass elements. 
- **Scroll Interpolation:** Elements enter viewport with heavy fade-up (`translate-y-16 opacity-0` to `translate-y-0 opacity-100` over 800ms+).

## 7. Anti-Patterns (Banned)
- NO pixel art fonts for main UI reading (they break legibility).
- NO emojis. Use SVG or Phosphor Icons.
- NO pure black (`#000000`). Use OLED Stadium Night.
- NO neon/outer glow shadows on buttons.
- NO 3-column equal card layouts without hierarchy.
- NO "Acme" generic names.
- NO generic placeholders.
