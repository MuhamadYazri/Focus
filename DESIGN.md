# Design System: Focus Dashboard
**Skill:** stitch-design-taste
**Design Type:** Minimalism — Swiss / Silent / Data-Forward

---

## Configuration — Set Your Style
Adjust these dials before using this design system. They control how creative, dense, and animated the output should be. Pick the level that fits your project.

| Dial | Level | Description |
|------|-------|-------------|
| **Creativity** | `1` | `1` = Ultra-minimal, Swiss, silent, monochrome. `5` = Balanced, clean but with personality. `10` = Expressive, editorial, bold typography experiments, inline images in headlines, strong asymmetry. Default: `1` |
| **Density** | `1` | `1` = Gallery-airy, massive whitespace. `5` = Balanced sections. `10` = Cockpit-dense, data-heavy. Default: `1` |
| **Variance** | `1` | `1` = Predictable, symmetric grids. `5` = Subtle offsets. `10` = Artsy chaotic, no two sections alike. Default: `1` |
| **Motion Intent** | `1` | `1` = Static, no animation noted. `5` = Subtle hover/entrance cues. `10` = Cinematic orchestration noted in every component. Default: `1` |

> **How to use:** Change the numbers above to match your project's vibe. At **Creativity 1–3**, the system produces clean, quiet, Notion-like interfaces. At **Creativity 7–10**, expect inline image typography, dramatic scale contrast, and strong editorial layouts. The rest of the rules below adapt to your chosen levels.

---

## 1. Visual Theme & Atmosphere
An ultra-minimalist, data-forward interface inspired by Swiss weather app aesthetics — prioritizing massive bold display typography, clean 2-column stat grids, and horizontal scroll chip rows. The atmosphere is clinical, silent, and highly functional. Surfaces are light cyan-washed, not white. Every element earns its place through pure function. Density is extremely low (Level 1), variance is strictly symmetric (Level 1), and motion is static (Level 1). The overall impression: pure, focused, quiet — like a well-calibrated instrument.

## 2. Color Palette & Roles
- **Pale Cyan Canvas** (#A8F1FF) — Primary background surface.
- **Soft Cyan Surface** (#6FE6FC) — Card and container fill, subtle highlights.
- **Vibrant Cyan Accent** (#4ED7F1) — Primary interactive elements, buttons, active states.
- **Pale Yellow Highlight** (#FFFA8D) — Secondary accent for warnings, badges, or warm contrast.
- **Charcoal Ink** (#18181B) — Primary text. Zinc-950 depth — never pure black.
- **Steel Secondary** (#71717A) — Body text, descriptions, metadata.

### Accent Selection
- **Vibrant Cyan** (#4ED7F1) — Primary action color

### Banned Colors
- Purple/Violet neon gradients — the "AI Purple" aesthetic
- Pure Black (#000000) — always Off-Black or Zinc-950
- Mixed warm/cool gray systems within one project

## 3. Typography Rules
- **Display:** `Geist`, `Satoshi`, `Cabinet Grotesk`, or `Outfit` — Track-tight (`-0.025em`), controlled fluid scale, weight-driven hierarchy (700–900). Not screaming. Leading compressed (`1.1`). Alternatives forced — `Inter` is BANNED for premium contexts
- **Body:** Same family at weight 400 — Relaxed leading (`1.65`), 65ch max-width, Steel Secondary color (#71717A)
- **Mono:** `Geist Mono` or `JetBrains Mono` — For code blocks, metadata, timestamps. When density exceeds Level 7, all numbers switch to monospace
- **Scale:** Display at `clamp(2.25rem, 5vw, 3.75rem)`. Body at `1rem/1.125rem`. Mono metadata at `0.8125rem`

### Banned Fonts
- `Inter` — banned everywhere in premium/creative contexts
- Generic serif fonts (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`) — BANNED. If serif is needed for editorial/creative, use only distinctive modern serifs like `Fraunces`, `Gambarino`, `Editorial New`, or `Instrument Serif`. Never use default browser serif stacks. Serif is always BANNED in dashboards or software UIs regardless

## 4. Component Stylings
* **Buttons:** Flat surface, no outer glow. Primary: Vibrant Cyan Accent (`#4ED7F1`) fill with Charcoal Ink text. Full-width on mobile. Active state: `scale(0.97)` for tactile push. No glow, ever.
* **Cards/Containers:** Generously rounded corners (`1rem`–`1.5rem`). Fill: Soft Cyan Surface (`#6FE6FC`) at 30% opacity or pure white. Whisper border (`1px solid rgba(78,215,241,0.15)`). Minimal diffused shadow. Internal padding `1rem`–`1.25rem`. Used ONLY when elevation communicates hierarchy.
* **Stat / Data Cards (2-column grid):** Each cell has a small uppercase LABEL on top (Steel Secondary, 8–9px, JetBrains Mono, `0.08em` tracking) and a large bold VALUE below (Charcoal Ink, 22–28px, Geist/Outfit, `-0.03em` tracking). This is the signature data-display pattern from the reference images.
* **List Rows (Clean Data Rows):** Full-width rows separated by a single `1px` border-top (`rgba(78,215,241,0.15)`). Left side: small metadata label above a bold value name. Right side: secondary info aligned right. No card containers — negative space creates the separation.
* **Horizontal Scroll Chips:** Pill-shaped filter chips. Active: Vibrant Cyan Accent (`#4ED7F1`) fill, Charcoal Ink text, no border. Inactive: transparent fill, `1px` Whisper Border, Steel Secondary text. No scrollbar visible. `gap: 0.5rem`.
* **Progress Bar:** Thin (`4px` height), full-width. Track: `rgba(78,215,241,0.15)`. Fill: Vibrant Cyan Accent (`#4ED7F1`). Rounded ends.
* **FAB (Floating Action Button):** Rounded square (`0.75rem` radius). Vibrant Cyan Accent fill. Plus icon in Charcoal Ink. Fixed bottom-right above bottom nav. No glow, no shadow.
* **Inputs/Forms:** Label positioned above input. Error text below. Focus ring in Vibrant Cyan Accent, `2px` offset. No floating labels.
* **Loaders:** Skeletal shimmer matching exact layout dimensions. Never circular spinners.
* **Empty States:** Centered mono-text message. Simple, not illustrated. Never just "No data found" — use brief directional copy.

## 5. Dashboard Header (Home Screen Top)
The top of the Home dashboard is the first impression — reference the weather app's Swiss typography approach.
- **Overline/Label:** Tiny uppercase monospace text (e.g., "FOCUS" or the current date) as a page context setter.
- **Display Metric:** One massive, bold number dominating the top area (e.g., today's focus hours, progress percentage). Font size: `clamp(3rem, 12vw, 5rem)`. Weight: 800. Color: Charcoal Ink.
- **Sub-label:** A single short descriptor below the display number (e.g., "hours focused today") in Steel Secondary.
- **No decorative illustration.** No icons in the headline zone. Pure typography.
- **Progress:** A thin full-width progress bar directly below the display metric block.
- **CTA Restraint:** No CTA in the header zone. The FAB handles primary action.

## 6. Layout Principles
- **Grid-First:** CSS Grid for all structural layouts. Never flexbox percentage math (`calc(33% - 1rem)` is BANNED).
- **No Overlapping:** Elements must never overlap each other. Every element occupies its own grid cell or flow position.
- **2-Column Stat Grid:** For displaying multiple data metrics (e.g., Hours / Streak / Progress / Tasks), use a strict `grid-template-columns: 1fr 1fr` layout. Each cell: label on top, bold value below. No cards — use subtle `1px` borders between cells or pure negative space.
- **Horizontal Scroll Rows:** For filter chips and categories, use a single horizontal scroll row. No wrapping. Hide scrollbars. `gap: 0.5rem`. Pad start/end `1rem`.
- **Clean List Rows:** Task lists use full-width row layout separated by `border-top` only. No card per item unless the item requires nested information requiring elevation.
- **Containment:** All content within `max-width: 480px` for mobile-first app, centered. Horizontal padding `1rem`.
- **Full-Height:** Use `min-height: 100dvh` — never `height: 100vh` (iOS Safari address bar jump).
- **Spacing Rhythm:** Vertical gaps between sections: `1.5rem`. Vertical gap inside a section: `0.75rem`.

## 7. Responsive Rules
Every screen must work flawlessly across all viewports. **Responsive is not optional — it is a hard requirement. Every single element must be tested at 375px, 768px, and 1440px.**
- **Mobile-First Collapse (< 768px):** All multi-column layouts collapse to a strict single column. `width: 100%`, `padding: 1rem`, `gap: 1.5rem`. No exceptions
- **No Horizontal Scroll:** Horizontal overflow on mobile is a critical failure. All elements must fit within viewport width. If any element causes horizontal scroll, the design is broken
- **Typography Scaling:** Headlines scale down gracefully via `clamp()`. Body text stays `1rem` minimum. Never shrink body below `14px`. Headlines must remain readable on 375px screens
- **Touch Targets:** All interactive elements minimum `44px` tap target. Generous spacing between clickable items. Buttons must be full-width on mobile
- **Image Behavior:** Hero and inline images scale proportionally. Inline typography images (photos between words) stack below the headline on mobile instead of inline
- **Navigation:** Desktop horizontal nav collapses to a clean mobile menu (slide-in or full-screen overlay). No tiny hamburger icons without labels
- **Cards & Grids:** Bento grids and asymmetric layouts revert to stacked single-column cards with full-width. Maintain internal padding (`1rem`)
- **Spacing Consistency:** Vertical section gaps reduce proportionally on mobile (`clamp(3rem, 8vw, 6rem)`). Never cramped, never excessively airy
- **Testing Viewports:** Designs must be verified at: `375px` (iPhone SE), `390px` (iPhone 14), `768px` (iPad), `1024px` (small laptop), `1440px` (desktop)

## 8. Motion & Interaction (Code-Phase Intent)
> **Note:** Stitch generates static screens — it does not animate. This section documents the **intended motion behavior** so that the coding agent (Antigravity, Cursor, etc.) knows exactly how to implement animations when building the exported design into a live product.

- **Physics Engine:** Spring-based exclusively. `stiffness: 100, damping: 20`. No linear easing anywhere. Premium, weighty feel on all interactive elements
- **Perpetual Micro-Loops:** Every active dashboard component has an infinite-loop state — Pulse on status dots, Typewriter on search bars, Float on feature icons, Shimmer on loading states
- **Staggered Orchestration:** Lists and grids mount with cascaded delays (`animation-delay: calc(var(--index) * 100ms)`). Waterfall reveals, never instant mount
- **Layout Transitions:** Smooth re-ordering via shared element IDs. Items swap positions with physics, simulating real-time intelligence
- **Hardware Rules:** Animate ONLY `transform` and `opacity`. Never `top`, `left`, `width`, `height`. Grain/noise filters on fixed, pointer-events-none pseudo-elements only
- **Performance:** CPU-heavy perpetual animations isolated in microscopic leaf components. Never trigger parent re-renders. Target 60fps minimum

## 9. Anti-Patterns (Banned)
- No emojis — anywhere in UI, code, or alt text
- No `Inter` font — use `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi`
- No generic serif fonts (`Times New Roman`, `Georgia`, `Garamond`) — if serif is needed, use distinctive modern serifs only (`Fraunces`, `Instrument Serif`)
- No pure black (`#000000`) — Off-Black or Zinc-950 only
- No neon outer glows or default box-shadow glows
- No oversaturated accent colors above 80%
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — text never overlaps images or other content. Clean spatial separation always
- No generic names: "John Doe", "Sarah Chan", "Acme", "Nexus", "SmartFlow"
- No fake round numbers: `99.99%`, `50%`, `1234567` — use organic data: `47.2%`, `+1 (312) 847-1928`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize"
- No broken Unsplash links — use `picsum.photos/seed/{id}/800/600` or SVG UI Avatars
- No generic `shadcn/ui` defaults — customize radii, colors, shadows to match this system
- No `z-index` spam — use only for Navbar, Modal, Overlay layer contexts
- No `h-screen` — always `min-h-[100dvh]`
- No circular loading spinners — skeletal shimmer only