# Design System: Focus Dashboard
**Skill:** stitch-design-taste
**Design Type:** Organic Minimalism & Typographic Bento — Japandi / Zen / Warm & Calm

---

## Configuration — Set Your Style

| Dial | Level | Description |
|------|-------|-------------|
| **Creativity** | `6` | Elegant typography mixed with playful, soft bento-box layouts. |
| **Density** | `3` | Breathable whitespace, using bento grids to organize data without feeling cramped. |
| **Variance** | `5` | Mix of massive display numbers and structured, symmetric stat cards. |
| **Motion Intent** | `3` | Gentle, fluid transitions. Smooth scaling when pressing cards. |

---

## 1. Visual Theme & Atmosphere
An organic, Japandi-inspired minimalist interface that relies heavily on **massive, elegant typography** and **soft bento-box grids**. The atmosphere is warm, calm, tactile, and Zen-like. Surfaces use soft, unbleached paper textures and warm sand tones. 

During normal use (dashboards, stats), it feels like a beautifully typeset modern planner. During the "Focus Mode", the app transforms into a bold, distraction-free, full-screen typographic poster.

## 2. Color Palette & Roles
- **Warm Canvas** (`#F9F8F6`) — Primary background surface. Feels like unbleached paper.
- **Soft Beige Surface** (`#EFE9E3`) — Card and container fill. Used for the bento-box cards.
- **Muted Taupe** (`#D9CFC7`) — Borders, dividers, inactive states, and secondary text/icons.
- **Warm Sand Accent** (`#C9B59C`) — Primary interactive elements, active buttons, progress bars, and solid backgrounds for the active Pomodoro timer.
- **Espresso Ink** (`#2C2825`) — Primary text. A very dark, warm brown/charcoal. Never pure black.
- **Tomato/Coral Accent (Optional)** (`#E07A5F` or similar warm rust) — Used sparingly for the "Focus" state or crucial notifications to contrast with the beige.

## 3. Typography Rules (Crucial for this style)
- **Massive Display Numbers:** The timer (e.g., "25:00") and dates (e.g., "7") must be absolutely massive and dominate the screen. Use a bold, clean sans-serif like `Outfit`, `Satoshi`, or `SF Pro Display`.
- **Headlines:** Clean sans-serif or an elegant modern serif for greetings (e.g., "Good morning").
- **Body:** `Geist` or `Outfit` at weight 400. Relaxed leading (`1.65`). Color: Espresso Ink or Muted Taupe.
- **Scale:** Display numbers at `clamp(5rem, 15vw, 8rem)` for the active timer.

## 4. Component Stylings & UI Patterns
* **Bento-Box Grid:** The dashboard and statistics should use a bento-box layout. Cards of varying sizes (squares and rectangles) fitted neatly together with `1rem` gaps.
* **Cards/Containers:** Generous border radius (`1.5rem` to `2rem`). Fill: Soft Beige Surface (`#EFE9E3`). No borders, or very soft whisper borders. No drop shadows—rely on the slight color contrast against the `#F9F8F6` canvas.
* **Pill Buttons:** Soft, pill-shaped tags and buttons. 
* **The "Poster" Timer:** When the timer is active, the background should shift to a solid color (like Warm Sand), and the timer numbers should be massive, taking up the center of the screen, with tiny minimalist controls (Play/Pause) at the bottom.

## 5. App Flow & Feature Description (Behavior Context for Stitch)

### Screen 1: The Home Dashboard (Bento Layout)
- **Header:** A gentle greeting with a subtle date display.
- **Grid Layout:** A bento-box grid containing:
  - A large card showing the current "Mood" or "Energy".
  - A medium card showing "Hours Focused Today".
  - Small quick-action pill buttons (e.g., "Quick Start").
- **Task List:** Below the grid, a clean list of tasks.

### Screen 2: The Focus Environment (Immersive Poster Mode)
- **State:** Full-screen minimal view. 
- **Visuals:** The background becomes a solid Warm Sand (`#C9B59C`) or rust color.
- **The Timer:** A massive, thick countdown timer ("25:00") dead center.
- **Controls:** Tiny, elegant text or simple minimalist icons below it: "WORK", "SHORT", "LONG".

### Screen 3: Deep Analytics (Reports & Charts)
- **Visuals:** A "GitHub-style" contribution heatmap using shades of Warm Sand and Rust to show days with high focus hours.
- **Weekly Bar Charts:** Soft, rounded vertical bars sitting inside a neat bento card.

## 6. External References & Inspiration (For Stitch's AI Context)
To achieve this specific look, reference the following design movements and styles:
1. **Dieter Rams / Braun Design:** For the minimalist, functional layout of the timer screen. High contrast between massive typography and tiny control labels.
2. **Apple's "Bento" Keynote Slides:** For the layout of the dashboard and statistics cards—soft rounded rectangles tightly packed with consistent gaps.
3. **Muji / Japandi Aesthetic:** For the color theory. Unbleached paper, warm woods, and soft taupes.
4. **Swiss Typographic Posters:** For the bold use of negative space and oversized numbers in the active timer state.
5. **Headspace / Calm App:** For the soft, rounded UI elements, pill shapes, and friendly, stress-free vibe.

## 7. Anti-Patterns (Banned)
- Sharp corners on cards.
- Drop shadows (keep it flat and soft).
- Cluttered navigation bars.
- Outlined/wireframe icons (use solid, soft, chunky icons instead).