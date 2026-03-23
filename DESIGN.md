# Design System — Writing Buddy

## Product Context
- **What this is:** An AI coaching app that helps 10-11 year olds prepare for 11+ creative writing exams through iterative, voice-preserving coaching passes
- **Who it's for:** Primary: children aged 10-11. Secondary: parents who purchase/oversee
- **Space/industry:** EdTech, kids' learning apps (peers: Writeasy, Duolingo, Night Zookeeper)
- **Project type:** Web app (React SPA) — tablet-first, responsive

## Aesthetic Direction
- **Direction:** Storybook Playground — a creative writing adventure that feels like opening a favorite storybook. Illustrated, warm, inviting, with just enough whimsy to spark imagination without feeling babyish
- **Decoration level:** Expressive — layered depth with paper textures, subtle grain, illustrated elements, and hand-drawn accents. The app should feel crafted, not generated
- **Mood:** Like sitting in a cozy library corner with your favorite notebook and a kind, encouraging tutor. Warm, safe, creative, celebratory of effort
- **Reference sites:** Writeasy (hand-drawn illustrations, yellow notebook aesthetic), Duolingo (gamification, mascot-driven engagement, celebration moments), Night Zookeeper (creative writing for kids, illustrated world-building)

## Typography
- **Display/Hero:** Fredoka (600-700 weight) — rounded, friendly, substantial presence without being childish. Used for page titles, hero text, celebration headings
- **Body:** Quicksand (400-600 weight) — geometric, highly readable, warm personality that pairs naturally with Fredoka. Used for all body text, UI labels, navigation
- **UI/Labels:** Quicksand (500-600 weight)
- **Writing/Handwriting:** Caveat (400-700 weight) — natural handwriting feel for student writing display, coaching annotations, and the "notebook" experience. This is the signature font that makes the writing feel personal
- **Data/Tables:** Quicksand with tabular-nums (for scores, word counts, progress numbers)
- **Loading:** Google Fonts CDN
- **Scale:**
  - `text-xs`: 12px / 0.75rem — fine print, metadata
  - `text-sm`: 14px / 0.875rem — captions, helper text
  - `text-base`: 16px / 1rem — body text (minimum for kids)
  - `text-lg`: 18px / 1.125rem — emphasized body, card titles
  - `text-xl`: 20px / 1.25rem — section headings
  - `text-2xl`: 24px / 1.5rem — page subtitles
  - `text-3xl`: 30px / 1.875rem — page titles
  - `text-4xl`: 36px / 2.25rem — hero headings
  - `text-5xl`: 48px / 3rem — celebration/splash screens

## Color
- **Approach:** Expressive — color is a primary design tool, with a warm vibrant palette that energizes without overwhelming

### Core Palette
- **Sky Blue (Primary):** `#0EA5E9` — trust, creativity, open sky. Used for primary buttons, active states, links, progress indicators
- **Warm Coral (Secondary):** `#F97316` — energy, encouragement, warmth. Used for secondary actions, highlights, badges, streak indicators
- **Sunshine Gold (Accent):** `#FBBF24` — achievement, celebration, stars. Used for XP, scores, achievements, gold stars, celebration moments
- **Soft Violet (Magic):** `#A78BFA` — imagination, AI/coaching moments, creativity sparks. Used for AI coaching indicators, suggestion highlights, "magic" moments

### Neutrals (Warm Gray)
- `warm-50`: `#FAFAF9` — page backgrounds
- `warm-100`: `#F5F5F4` — card backgrounds, input backgrounds
- `warm-200`: `#E7E5E4` — borders, dividers
- `warm-300`: `#D6D3D1` — disabled states
- `warm-400`: `#A8A29E` — placeholder text
- `warm-500`: `#78716C` — secondary text
- `warm-600`: `#57534E` — body text
- `warm-700`: `#44403C` — headings
- `warm-800`: `#292524` — high-emphasis text
- `warm-900`: `#1C1917` — maximum contrast

### Semantic Colors
- **Success:** `#22C55E` (green-500) — completed passes, positive feedback
- **Warning:** `#F59E0B` (amber-500) — approaching limits, gentle nudges
- **Error:** `#EF4444` (red-500) — validation errors, content safety flags
- **Info:** `#0EA5E9` (sky-500) — tips, coaching suggestions

### Surface Colors
- **Paper:** `#FFFBEB` (amber-50) — writing area background, simulates warm paper
- **Notebook Lines:** `#93C5FD` (blue-300 at 30% opacity) — ruled lines in writing area
- **Card:** `#FFFFFF` — elevated card surfaces
- **Sidebar:** `#F5F5F4` — navigation background

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — generous whitespace for young readers, nothing should feel cramped
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined with playful elements
- **Grid:**
  - Mobile (< 640px): 4 columns, 16px gutter
  - Tablet (640-1024px): 8 columns, 24px gutter — PRIMARY target
  - Desktop (> 1024px): 12 columns, 32px gutter
- **Max content width:** 1280px (80rem)
- **Border radius:** sm:6px, md:10px, lg:16px, xl:24px, full:9999px
- **Touch targets:** 48px minimum (WCAG 2.2 Level AAA for kids)
- **Min font size:** 16px for body text

## Illustration & Mascot
- **Style:** Semi-flat illustration with subtle texture/grain
- **Mascot:** A friendly owl character as the AI coaching persona
- **Icon style:** Lucide icons at 24px, stroke-width 2, with rounded line caps

## Motion
- **Approach:** Intentional + playful
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out) bounce(cubic-bezier(0.34,1.56,0.64,1))
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Reduced motion:** Respect `prefers-reduced-motion`

## Accessibility (Kids-Specific)
- **Touch targets:** 48px minimum
- **Font size:** 16px minimum body text, 14px absolute minimum for metadata
- **Color contrast:** WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- **Focus indicators:** Visible 3px outline in Sky Blue
- **Keyboard navigation:** Full support, visible focus ring, logical tab order
- **Reading level:** All UI copy at Year 5-6 reading level (age 10-11)

## Tailwind Custom Classes
- `font-display` — Fredoka (headings)
- `font-body` — Quicksand (everything else)
- `font-handwriting` — Caveat (writing areas)
- `bg-sky` / `text-sky` / `border-sky` — primary blue
- `bg-coral` / `text-coral` — secondary orange
- `bg-gold` / `text-gold` — accent yellow
- `bg-violet` / `text-violet` — magic purple
- `bg-warm-*` — warm neutral scale (50-900)
- `.writing-paper` — notebook-lined paper background

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system created | Created by /design-consultation based on competitive analysis |
| 2026-03-23 | Chose "Storybook Playground" aesthetic | Differentiates from Writeasy while keeping warmth |
| 2026-03-23 | Fredoka + Quicksand + Caveat typography | Fredoka for personality, Quicksand for readability, Caveat for handwriting |
| 2026-03-23 | Sky Blue as primary | Trust + creativity, avoids EdTech cliche green |
| 2026-03-23 | 48px touch targets | Target audience is 10-11 year olds on tablets |
| 2026-03-23 | Paper texture for writing area | Makes writing feel personal and familiar |
