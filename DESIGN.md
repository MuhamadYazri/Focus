# Design System: Focus Dashboard
**Skill:** frontend-design / organic-minimalism
**Design Type:** Organic Minimalism & Typographic Bento — Botanical Sage, Celadon & Forest Light Mode

---

## Configuration — Set Your Style

| Dial | Level | Description |
|------|-------|-------------|
| **Creativity** | `7` | Sculptural typography with organic botanical depth and tactile clarity. |
| **Density** | `2` | Ultra-streamlined, ruthlessly simplified layouts with zero redundant data. |
| **Variance** | `5` | Monumental display numerals balanced against clean, structured stat cards. |
| **Motion Intent** | `3` | Fluid, spring-physics micro-interactions anchored to 120Hz GPU compositor. |

---

## 1. Visual Theme & Atmosphere
An organic, botanical-inspired minimalist interface that relies on **monumental typography**, **tactile bento cards**, and **pure Light Mode simplicity**. The atmosphere is crisp, serene, and deeply focused. Surfaces use unbleached botanical paper canvas (`#F6F8F5`) with floating crisp white surfaces (`#FFFFFF`).

The app avoids visual clutter and generic "AI slop" aesthetics:
- Every screen is simplified to essential controls and metrics only.
- Duplicate counts and redundant cards have been completely removed.
- Visual hierarchy is anchored in Charcoal Forest (`#1B1F1A`) with Deep Olive Slate, Muted Moss, and Pale Mint accents.

---

## 2. Color Palette & Roles (ColorKit: 667463-8b9e87-b1c9ac-d6f3d0-1b1f1a-41493f)

*Palette Source: [ColorKit Palette](https://colorkit.co/palette/667463-8b9e87-b1c9ac-d6f3d0-1b1f1a-41493f/)*

| Token | Hex | Role | Contrast Ratio & WCAG Rating |
|---|---|---|---|
| `--theme-canvas` | `#F6F8F5` | Whispering Sage Alabaster (Paper background) | — (Base) |
| `--theme-surface` | `#FFFFFF` | Floating card surfaces | — (Surface) |
| `--theme-border` | `#D6E0D4` | Hairline card boundaries & dividers | Clean 1px boundary |
| `--theme-track` | `#CBD7C9` | Mechanical dial track & slider grooves | Soft organic track |
| `--theme-ink-dark` | `#1B1F1A` | Charcoal Forest — Headings, monumental numerals | **16.70:1 on White (AAA)** / **15.64:1 on Canvas (AAA)** |
| `--theme-primary` | `#41493F` | Deep Olive Slate — FAB, hero play, active navigation pill | **9.34:1 on White (AAA)** |
| `--theme-secondary` | `#667463` | Muted Moss — Running arcs, focus badges, streaks | **4.95:1 on White (AA)** |
| `--theme-text-sub` | `#5F6C5C` | Moss Charcoal — Subtitles, dates, pips, captions | **5.55:1 on White (AA)** / **5.19:1 on Canvas (AA)** |
| `--theme-sage` | `#8B9E87` | Soft Sage — Break mode indicators, pill borders | **5.84:1 with #1B1F1A (AA)** |
| `--theme-celadon` | `#B1C9AC` | Light Sage Celadon — Progress fills, tag chips | **5.25:1 with #41493F (AA)** / **9.40:1 with #1B1F1A (AAA)** |
| `--theme-mint` | `#D6F3D0` | Pale Mint — Focus rings, halos, highlight jewels | **7.82:1 with #41493F (AAA)** / **13.99:1 with #1B1F1A (AAA)** |

---

## 3. Contrast Checker Verification (Matrix Validation)

Based on the Color Contrast Checker matrix (verified for 4.5:1 WCAG AA and 7:1 AAA):

1. **Text & Number Legibility:**
   - `#1B1F1A` on `#FFFFFF` / `#F6F8F5`: **16.70:1 / 15.64:1** (Passes WCAG AAA)
   - `#41493F` on `#FFFFFF`: **9.34:1** (Passes WCAG AAA)
   - `#5F6C5C` on `#F6F8F5`: **5.19:1** (Passes WCAG AA)
2. **Buttons & Action Controls:**
   - Pure White text on Deep Olive Slate (`#41493F`): **9.34:1** (Passes WCAG AAA)
   - Pure White text on Muted Moss (`#667463`): **4.95:1** (Passes WCAG AA)
3. **Badges & Highlight Pills:**
   - Charcoal text (`#1B1F1A`) on Pale Mint (`#D6F3D0`): **13.99:1** (Passes WCAG AAA)
   - Deep Olive text (`#41493F`) on Pale Mint (`#D6F3D0`): **7.82:1** (Passes WCAG AAA)
   - Deep Olive text (`#41493F`) on Celadon (`#B1C9AC`): **5.25:1** (Passes WCAG AA)

---

## 4. Screen Simplification & Architecture

### Screen 1: Home Dashboard (`TaskList.jsx`)
- **Editorial Masthead:** Single clean date stamp (`TUE, OCT 13 · SOLO_OS`) and greeting (`Good afternoon.`). Redundant duplicate task counts removed.
- **Compact Daily Target & Streak Card:** Sleek 60px architectural bento card pairing Daily Target progress (`0h / 4h · 0%`) with Streak counter (`0 DAYS`). Brings tasks above the fold immediately.
- **Unified Timeline & Sort Horizon:** Timeline segment tabs (`Today`, `This Week`, `Planned`, `Done`) include live badges (`Today 3`), with the sort toggle neatly docked on the far right. Redundant `TASKS · 3 ACTIVE` subheader row eliminated.
- **Category Chips:** Compact horizontal scroll chips (`All Tasks`, `Study`, `Personal App Dev`, etc.).
- **Bottom Navigation:** Custom animated `HomeIcon` SVG replaces unreliable Lottie canvas for 100% reliable icon rendering across all viewports.

### Screen 2: Focus Environment (`TimerView.jsx`)
- **Balanced Top Header:** Left-aligned active task or `SOLO_OS` status paired with the `NORMAL / STRICT` lock toggle on the right.
- **Clock Dial Ring:** Mechanical track (`#CBD7C9`) with Muted Moss progress arc (`#667463`) and 4 session pips.
- **Hero Controls:** Circular hero play/pause in Deep Olive Slate (`#41493F`) with Pale Mint glow halo (`#D6F3D0`), flanked by reset and skip buttons.
- **Soundscape Capsule:** Clean floating pill with headphones icon, current soundscape label, and volume percentage badge. Tapping opens the sound & volume modal with dedicated slider.
- **Live Focus Fullscreen Mode:** Alabaster Mint canvas with atmospheric moss glow, monumental Charcoal Forest numerals, and tactile pause button.

### Screen 3: Reports & Deep Analytics (`AnalyticsDashboard.jsx` & `SharedActivitySection.jsx`)
- **Zero Redundancy KPIs:** The redundant dark `YOUR FOCUS LOG` card has been removed. Metric clarity is provided directly by the dual tiles:
  - `FOCUS TIME: 0h 00m`
  - `SESSIONS: 0`
- **Timeframe Horizon:** Cohesive segmented period switcher (`All`, `Daily`, `Weekly`, `Monthly`, `Yearly`) and floating date navigation capsule.
- **Heatmap & Bar Charts:** Deep Olive Slate (`#41493F`), Muted Moss (`#667463`), and Celadon fills representing daily and weekly progress.

### Screen 4: Profile & Preferences (`ProfileView.jsx`)
- **Telemetry Card:** Lifetime streak, hours, sessions, and active days.
- **Share Profile Action:** Deep Olive Slate CTA pill.
- **Project Categories:** Color-coded with ColorKit palette swatches.
- **Timer Durations:** Tactile duration capsules (`25m`, `45m`, `60m`, `Custom`).

---

## 5. Anti-Patterns (Banned)
- Duplicate metric cards repeating the same numbers in adjacent blocks.
- Dark mode elements or dark cards in Light Mode.
- Unreliable third-party canvas or Lottie loaders for core navigation icons.
- Awkward inline range sliders inside compact mobile capsules.