# Design System: OléFUT Dashboard (Minimalist UI)

## 1. Visual Theme & Atmosphere
A highly refined, ultra-minimalist, "document-style" dashboard. The atmosphere is clinical yet warm — focusing on extreme typographic contrast, bento-grid layouts, and meticulous macro-whitespace. The UI feels like a top-tier workspace platform, rejecting all generic SaaS design trends.

## 2. Color Palette & Roles
- **Canvas White** (#FBFBFA) — Primary background surface
- **Pure Surface** (#FFFFFF) — Card and container fill
- **Charcoal Ink** (#111111) — Primary text, primary CTA background
- **Muted Gray** (#787774) — Secondary text, metadata
- **Whisper Border** (#EAEAEA) — Structural borders, dividers, card outlines (1px solid)
- **Pale Blue** (#E1F3FE) — Accent background for tags or inline items
- **Pale Blue Text** (#1F6C9F) — Text over Pale Blue

## 3. Typography Rules
- **Display/Hero:** Lyon Text, Newsreader, Playfair Display — Track-tight (-0.02em), tight line-height (1.1).
- **Body/UI:** SF Pro Display, Geist Sans, Switzer — Relaxed leading (1.6), 65ch max-width, never absolute black.
- **Mono:** Geist Mono, JetBrains Mono — For keystrokes, stats, tags.
- **Banned:** Inter, Roboto, Open Sans. No generic serif fonts in UI (except for editorial hero/quotes).

## 4. Component Stylings
* **Buttons:** Flat, solid #111111 background, #FFFFFF text. Slight border-radius (4px). No box-shadow. Hover scales slightly down.
* **Cards (Bento Box):** 1px solid #EAEAEA border. Crisp border-radius (8px-12px max). Generous internal padding (24px-40px). No heavy drop shadows.
* **Tags/Badges:** Pill-shaped, text-xs, uppercase, wide tracking. Pale Blue background (#E1F3FE) with dark blue text.
* **Icons:** Phosphor Icons (Bold/Fill) or Radix UI Icons. No emojis.

## 5. Layout Principles
Grid-first bento box architecture. Asymmetric layouts preferred. Massive vertical padding between sections. Main typography constrained to max-w-4xl or max-w-5xl. No primary colored backgrounds for large sections.

## 6. Motion & Interaction
Scroll entry fades (translateY + opacity). Hover states lift with ultra-subtle shadow shift or scale(0.98). Staggered reveals for lists. Performance driven via transform and opacity only.

## 7. Anti-Patterns (Banned)
No emojis, no Inter/Roboto/Open Sans, no heavy drop shadows, no gradients or neon colors, no 3D glassmorphism, no rounded-full large containers, no generic placeholder names (use real football context), no AI copywriting clichés, no full primary colored backgrounds.
