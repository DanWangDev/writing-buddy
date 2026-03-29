# TODOS

## Auth Migration (COMPLETE)

### P1: Migrate Writing-Buddy to Hub Auth
- **Status:** COMPLETE (PRs #25-#32)
- **What:** Stripped standalone auth, installed `@danwangdev/auth-client` SDK, recreated DB schema with hub_user_id references.
- **Why:** Writing-buddy no longer maintains its own auth. Same login works across all apps.

## Active Features

### P2: Admin Prompt Editor
- **Status:** COMPLETE (branch: `feat/admin-prompt-editor`)
- **What:** Full CRUD UI for admin users to create, edit, and soft-delete writing prompts. Includes Content Gap Heatmap (genre x difficulty coverage), per-prompt submission counts, live preview, and admin role gating via hub OIDC claims.
- **Why:** Prompts were hardcoded in seed file — no way to add/edit/remove without code changes. Admins need a scalable way to manage prompt content.
- **Effort:** M (human: ~1 week / CC: ~45 min)
- **Context:**
  - Backend: migration 003 (archived_at, updated_at), repository update/delete, requireAdmin middleware, CRUD + stats routes
  - Frontend: AdminPrompts page (list/form views), ContentHeatmap, AdminRoute guard, Toast notifications
  - Admin bypass in requireEntitlement (admins manage prompts regardless of subscription)
  - Soft-delete preserves FK integrity with submissions table

## Deferred Features

### P2: Coaching Tone Calibration (planned)
- **What:** Add per-student coaching style (enthusiastic/balanced/direct) that adapts the AI tutor's personality
- **Why:** Different kids respond to different tutoring styles.
- **Effort:** S (human: ~1 day / CC: ~20 min)
- **Depends on:** Phase 1a coaching engine working well
- **Context:** System prompt variation only. Add `coaching_style` to student profile, branch system prompt accordingly.

### P3: AI Prompt Generation (planned)
- **What:** LLM-generated prompts that land as drafts for admin review. Add `source` and `status` columns, "Generate Prompts" button in admin UI.
- **Why:** Scale prompt library beyond manual creation while maintaining quality via human review.
- **Effort:** M (human: ~1 week / CC: ~30 min)
- **Depends on:** P2 Admin Prompt Editor (complete)
- **Context:** AI-generated prompts get `status: 'draft'`, reviewed in existing admin UI. Student-facing queries filter to `status = 'published'` only.

### P3: Prompt Duplication (planned)
- **What:** "Use as Template" button that pre-fills the admin form with existing prompt data for quick variations.
- **Why:** Creating similar prompts (same genre, different scenario) is common — avoid re-typing shared fields.
- **Effort:** XS (human: ~2 hours / CC: ~5 min)
- **Depends on:** P2 Admin Prompt Editor (complete)

### P3: Admin Pagination (planned)
- **What:** Paginate admin prompt list when count exceeds ~100.
- **Why:** Performance and usability degrade with large unpaginated lists.
- **Effort:** S (human: ~4 hours / CC: ~15 min)
- **Depends on:** P2 Admin Prompt Editor (complete)

### P3: Vocab-Master Word Bank (planned)
- **What:** Curate a static list of age-appropriate "power words" by category (sensory, emotion, action, transition) for coaching suggestions
- **Why:** Makes coaching suggestions more concrete. Seeds architecture for cross-app vocab integration.
- **Effort:** S (human: ~2 days / CC: ~30 min)
- **Depends on:** Phase 1a coaching engine
- **Context:** Inject word lists into Pass 3 (Gentle Suggestions) prompts. Not full vocab-master integration.
