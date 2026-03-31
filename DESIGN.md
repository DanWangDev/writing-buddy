# Design System — Writing Buddy (Manga Burst Edition)

## Product Context
- **What this is:** An AI coaching app that helps 10-11 year olds prepare for 11+ creative writing exams through iterative, voice-preserving coaching passes
- **Who it's for:** Primary: children aged 10-11 (targeting early-teen aesthetic appeal). Secondary: parents who purchase/oversee
- **Space/industry:** EdTech, kids' learning apps (peers: Writeasy, Duolingo, Night Zookeeper)
- **Project type:** Web app (React SPA) — tablet-first, responsive

## Aesthetic Direction
- **Style:** Neubrutalism / Manga Burst — bold, graphic, high-energy comic book aesthetic with thick ink outlines, hard offset shadows, vivid flat colors, and halftone textures
- **Decoration level:** Expressive — layered depth with halftone dot patterns, speech bubbles, bold outlines, and comic-style lettering. Every element has weight and presence
- **Mood:** Like flipping through a manga or comic book — exciting, energetic, rewarding. The app feels like a creative adventure, not homework
- **Key visual principles:**
  - **Bold ink outlines:** 2-3px solid `var(--color-ink)` borders on all interactive elements
  - **Hard offset shadows:** `4px 4px 0` (cards), `2px 2px 0` (badges/pills) using `var(--color-ink)`
  - **Flat vivid colors:** No gradients, no blur/glass effects. Solid saturated fills
  - **Comic lettering:** ALL CAPS headings in Bangers font with wide tracking
  - **Halftone backgrounds:** Subtle dot pattern on page backgrounds (`.bg-manga-page`)
  - **Speech bubbles:** Gold-background callouts with triangular tails for mascot dialogue

## Typography
- **Display/Hero:** Bangers (regular weight) — comic book display font, always uppercase with `tracking-wider`. Used for page titles, hero text, section headings, celebration headings. Loaded via Google Fonts
- **Body:** Comic Neue (400, 700 weight) — friendly, readable, approachable. Used for all body text, UI labels, navigation, AND the writing area (per user preference)
- **Writing area:** Comic Neue (`font-body`) — NOT Caveat. User explicitly chose Comic Neue for the writing space for readability
- **Data/Tables:** Comic Neue with `tabular-nums` (for scores, word counts, progress numbers)
- **Loading:** Google Fonts CDN: `Bangers`, `Comic Neue` (300/400/700, italic variants)
- **Scale:**
  - `text-xs`: 12px / 0.75rem — badge text, fine metadata
  - `text-sm`: 14px / 0.875rem — captions, helper text
  - `text-base`: 16px / 1rem — body text (minimum for kids)
  - `text-lg`: 18px / 1.125rem — card titles, sidebar headings
  - `text-xl`: 20px / 1.25rem — section headings, prompt titles
  - `text-2xl`: 24px / 1.5rem — sub-page titles
  - `text-3xl`: 30px / 1.875rem — page titles (Bangers, uppercase)
  - `text-4xl`: 36px / 2.25rem — hero headings
  - `text-5xl`: 48px / 3rem — celebration/splash screens

## Color

### Ink (Border/Shadow Color)
- **Ink:** `#1a1a2e` (`--color-ink`) — deep blue-black used for all borders, outlines, and hard shadows. This is the signature manga outline color

### Core Palette (More Saturated)
- **Sky Blue (Primary):** `#2563EB` — bolder, more vivid blue. Used for primary buttons, active states, header background, links
- **Warm Coral (Secondary):** `#F97316` — energy, warmth. Used for streaks, highlights, stat icons
- **Sunshine Gold (Accent):** `#FACC15` — brighter gold. Used for speech bubbles, active nav, achievements, star ratings
- **Soft Violet (Magic):** `#8B5CF6` — deeper violet. Used for AI coaching, mystery genre, suggestion buttons

### Neutrals (Warm Gray) — unchanged
- `warm-50` through `warm-900` (same stone scale)

### Semantic Colors
- **Success:** `#22C55E` (green-500) — completed badges, accept buttons
- **Warning:** `#F59E0B` (amber-500) — approaching limits
- **Error:** `#EF4444` (red-500) — validation errors, overtime indicator, challenge difficulty
- **Info:** `#2563EB` (sky) — tips, coaching

### Surface Colors
- **Paper:** `#FFFBEB` (amber-50) — writing area background
- **Notebook Lines:** `rgba(37, 99, 235, 0.15)` — blue-tinted ruled lines (39px spacing)
- **Card:** `#FFFFFF` with `border: 3px solid var(--color-ink)` and hard shadow
- **Page background:** `.bg-manga-page` — halftone dot pattern on warm-50

## CSS Utility Classes

### Cards
- `.card-clay` — Interactive card: white bg, 3px ink border, 4px hard shadow, hover lifts to 7px shadow with -3px translate
- `.card-clay-static` — Non-interactive card: same as above but no hover effect
- Both have `rounded-[12px]` and `cursor-pointer` (clay only)

### Badges
- `.badge-manga` — Pill badge: 2px ink border, 2px hard shadow, `font-bold`, `rounded-full`, `px-2.5 py-1`

### Buttons
- `.btn-manga` — Bold button: 3px ink border, 4px hard shadow, hover lifts to 5px shadow, active presses to 1px shadow. `font-bold`, `rounded-[10px]`, 48px min-height

### Speech Bubble
- `.speech-bubble` — Gold background, 3px ink border, 4px shadow, rounded-[16px], with `::after` triangular tail pointing down-left

### Background
- `.bg-manga-page` — Radial halftone dot pattern: `radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)` at 20px spacing

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — generous whitespace for young readers
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined with bold graphic elements
- **Grid:**
  - Mobile (< 640px): single column, 16px gutter
  - Tablet (640-1024px): 2-column grid, 24px gutter — PRIMARY target
  - Desktop (> 1024px): 3-column grid, 32px gutter
- **Max content width:** 1280px (80rem)
- **Border radius:** sm:6px, md:10px, lg:16px (cards/dialogs use 12px-16px)
- **Touch targets:** 48px minimum (WCAG 2.2 Level AAA for kids)
- **Min font size:** 16px for body text

### Sidebar Navigation
- **Desktop:** Collapsible sky blue sidebar (default: collapsed 60px icon rail, expanded: 224px). Bangers logo with text-shadow, gold active nav items with ink border. Collapse toggle at bottom. User menu popover (avatar with initials) at sidebar footer with hub link and logout.
- **Mobile:** Sky blue top bar with hamburger menu, slide-down nav panel matching header color. Inline user menu at bottom of dropdown with hub link and logout.

## Illustration & Mascot
- **Style:** Manga-influenced ink illustrations (Inkwell mascot)
- **Mascot states:** InkwellWriting (active), InkwellSleeping (empty state)
- **Margin doodles:** `MarginDoodles` component with variant-based decorative elements
- **Icon style:** Lucide icons at 24px, stroke-width 2

## Motion
- **Approach:** Snappy, comic-book energy
- **Card hover:** `translate(-3px, -3px)` with shadow expansion (150ms ease)
- **Button press:** `translate(2px, 2px)` with shadow shrink (active state)
- **Celebration:** Pop-in animation with confetti overlay
- **Easing:** `transition-all duration-150` for interactive elements
- **Reduced motion:** Respect `prefers-reduced-motion`

## Accessibility (Kids-Specific)
- **Touch targets:** 48px minimum
- **Font size:** 16px minimum body text, 14px absolute minimum for metadata
- **Color contrast:** WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- **Focus indicators:** Visible 3px outline in Sky Blue
- **Keyboard navigation:** Full support, visible focus ring, logical tab order
- **Reading level:** All UI copy at Year 5-6 reading level (age 10-11)

## Tailwind Custom Classes
- `font-display` — Bangers (headings, always uppercase with tracking-wider)
- `font-body` — Comic Neue (everything else including writing areas)
- `font-handwriting` — Caveat (available but NOT used for writing areas)
- `bg-sky` / `text-sky` / `border-sky` — primary blue (#2563EB)
- `bg-coral` / `text-coral` — secondary orange
- `bg-gold` / `text-gold` — accent yellow
- `bg-violet` / `text-violet` — magic purple
- `bg-warm-*` — warm neutral scale (50-900)
- `border-ink` / `text-ink` — manga ink color (#1a1a2e)
- `.writing-paper` — notebook-lined paper background (39px line spacing, blue lines)
- `.card-clay` / `.card-clay-static` — manga-style cards
- `.badge-manga` — pill badges with ink border
- `.btn-manga` — bold buttons with ink border and shadow
- `.speech-bubble` — gold speech callout with tail
- `.bg-manga-page` — halftone dot page background

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system created | Created by /design-consultation based on competitive analysis |
| 2026-03-23 | Chose "Storybook Playground" aesthetic | Original design direction |
| 2026-03-30 | Switched to "Manga Burst" neubrutalist style | User found original too boring for teenager appeal. Bold comic/manga aesthetic is more engaging |
| 2026-03-30 | Bangers replaces Fredoka for display font | Comic book display font matches manga aesthetic, always uppercase |
| 2026-03-30 | Comic Neue for writing area (not Caveat) | User explicitly preferred Comic Neue readability over Caveat handwriting style |
| 2026-03-30 | Added --color-ink (#1a1a2e) | Deep blue-black for all borders/shadows, signature manga outline color |
| 2026-03-30 | Saturated core palette | Sky=#2563EB, Violet=#8B5CF6, Gold=#FACC15 — bolder for neubrutalist energy |
| 2026-03-30 | Hard offset shadows replace soft shadows | 4px/2px hard shadows using ink color, no blur — core neubrutalist principle |
| 2026-03-30 | Halftone dot background | Manga-style texture on page backgrounds (.bg-manga-page) |
