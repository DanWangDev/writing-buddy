# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **User menu with hub navigation** — Click your avatar in the sidebar to access "Back to 11+ Hub" and logout. Hub URL is configurable via `VITE_HUB_URL` env var. (#39)
- **Admin prompt editor** — Full CRUD interface for managing writing prompts. Create, edit, and archive prompts with live preview. Content gap heatmap shows genre x difficulty coverage at a glance. (#35)
- **Writing stopwatch** — Timed writing sessions with a kid-friendly countdown display. (#34)
- **Celebration overlay** — Confetti and achievement animations when students complete milestones. (#33)

### Changed
- **Docker network switched to `labf-net`** — Backend joins the shared cross-app `labf-net` network instead of `11plus-hub_default`. OIDC internal issuer default updated to `hub-backend`. Container names added for deterministic service discovery. (#current)
- **Manga Burst redesign** — Complete visual overhaul with neubrutalist/manga aesthetic: bold ink borders, hard offset shadows, vivid colors, Bangers + Comic Neue fonts, halftone textures. Every page and component updated. (#37)
- **Sidebar navigation** — Moved from top bar to collapsible sidebar (defaults to a compact 60px icon rail). Mobile keeps the hamburger menu. (#37)
- **Prompt cards now have consistent heights** within grid rows — titles clamped to 2 lines, badges pinned to bottom. (#38)

### Fixed
- **Time limit display** on prompt cards, writing desk, and stopwatch. (#36)
- **Auth migration complete** — Fully migrated from standalone JWT to hub OIDC session auth via `@danwangdev/auth-client`. (#25-#32)
