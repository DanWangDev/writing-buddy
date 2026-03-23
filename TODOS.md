# TODOS

## Deferred from CEO Review (2026-03-23)

### P2: Coaching Tone Calibration
- **What:** Add per-student coaching style (enthusiastic/balanced/direct) that adapts the AI tutor's personality
- **Why:** Different kids respond to different tutoring styles. One-size-fits-all risks alienating students.
- **Effort:** S (human: ~1 day / CC: ~20 min)
- **Depends on:** Phase 1a coaching engine working well — need to nail the base tone first
- **Context:** System prompt variation only. Add `coaching_style` to student profile, branch system prompt accordingly. Parents or student set it in settings.

### P3: Vocab-Master Word Bank
- **What:** Curate a static list of age-appropriate "power words" by category (sensory, emotion, action, transition) for coaching suggestions
- **Why:** Makes coaching suggestions more concrete. Seeds architecture for cross-app vocab integration in Phase 4.
- **Effort:** S (human: ~2 days / CC: ~30 min)
- **Depends on:** Phase 1a coaching engine
- **Context:** Inject word lists into Pass 3 (Gentle Suggestions) prompts. Not full vocab-master integration — just a standalone word bank.
