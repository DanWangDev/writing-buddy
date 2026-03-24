# TODOS

## Auth Migration (in progress)

### P1: Migrate Writing-Buddy to Hub Auth
- **Status:** IN PROGRESS (branch: `feat/hub-auth-migration`)
- **What:** Strip standalone auth, install `@labf/auth-client` SDK, recreate DB schema with hub_user_id references. Clean slate (no production data).
- **Why:** Writing-buddy stops maintaining its own auth. Same login works across all apps.
- **Effort:** S (human: ~1 day / CC: ~20 min)
- **Depends on:** Hub app (11plus-hub) Phase A must be complete
- **Context:**
  - Delete: auth-service.ts, auth middleware, auth routes, user-repository.ts
  - Add: `@labf/auth-client` SDK middleware, `app_users` table (hub_user_id + app prefs)
  - Clean slate: recreate DB schema (no migration needed, zero prod data)
  - user_id columns in domain tables (submissions, progress, etc.) reference hub_user_id
  - All existing domain tests must pass with hub JWT

## Deferred Features

### P2: Coaching Tone Calibration (planned)
- **What:** Add per-student coaching style (enthusiastic/balanced/direct) that adapts the AI tutor's personality
- **Why:** Different kids respond to different tutoring styles.
- **Effort:** S (human: ~1 day / CC: ~20 min)
- **Depends on:** Phase 1a coaching engine working well
- **Context:** System prompt variation only. Add `coaching_style` to student profile, branch system prompt accordingly.

### P3: Vocab-Master Word Bank (planned)
- **What:** Curate a static list of age-appropriate "power words" by category (sensory, emotion, action, transition) for coaching suggestions
- **Why:** Makes coaching suggestions more concrete. Seeds architecture for cross-app vocab integration.
- **Effort:** S (human: ~2 days / CC: ~30 min)
- **Depends on:** Phase 1a coaching engine
- **Context:** Inject word lists into Pass 3 (Gentle Suggestions) prompts. Not full vocab-master integration.
