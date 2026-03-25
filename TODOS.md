# TODOS

## From Eng Review — SSO / Platform (2026-03-24)

### P0: Build Hub App (hub.labf.app) — Identity Provider
- **What:** New standalone repo/app that serves as the platform's OIDC identity provider. Owns all authentication, user management, subscriptions, and application registry. All apps authenticate through it via standard OIDC Authorization Code + PKCE flow.
- **Why:** Eliminates duplicated auth code across apps. Enables true SSO — log in once, access all apps. Each app stays fully independent (own repo, own DB, own CI/CD). Future apps get auth for free by registering as an OIDC client.
- **Effort:** M (human: ~1 week / CC: ~1.5 hours)
- **Depends on:** Nothing — this is the foundation everything else depends on
- **Blocks:** P1 (vocab-master migration), P1 (writing-buddy migration)
- **Context:**
  - Stack: Express + React + postgres.js + TypeScript + `oidc-provider` npm package
  - PostgreSQL in its own Docker container (hub's stack, not shared infra)
  - Cloudflare Tunnel for HTTPS (same as existing apps)
  - Application registry: admin registers apps, gets client_id/secret for OIDC
  - Auth UI: login (email/password + Google OAuth), registration, password reset
  - App dashboard: shows user's entitled apps, links to each
  - Subscriptions: plan types (free/writing/vocab/bundle/family), feature entitlements in JWT claims
  - Publishes `@danwangdev/auth-client` SDK to GitHub Packages (~100-line OIDC client wrapper)
  - Google OAuth + Turnstile move here from vocab-master (hub is the only place that talks to Google)
  - SSO is a side effect: hub session cookie on .labf.app → silent auth when visiting second app
  - User model: adopts vocab-master's existing schema (INTEGER IDs, username-based)

### P1: Migrate Vocab-Master to Hub Auth
- **What:** Strip auth code from vocab-master, install `@danwangdev/auth-client` SDK, redirect to hub for login. Keep SQLite for domain data.
- **Why:** Vocab-master becomes a pure domain app — no auth maintenance burden. Single account across all apps.
- **Effort:** S (human: ~2 days / CC: ~30 min)
- **Depends on:** P0 (hub app must exist)
- **Context:**
  - Delete: authService, googleAuthService, auth middleware, turnstile middleware, auth routes, userRepository, tokenRepository, passwordResetRepository
  - Add: `@danwangdev/auth-client` SDK middleware, lightweight `app_users` table (hub_user_id + app-specific prefs)
  - Lazy user sync: valid JWT → check if local app_users record exists → create if not
  - All existing domain tests must pass with hub JWT instead of local auth
  - Run full test suite before merging — this is a high-risk change to a production app

### P1: Migrate Writing-Buddy to Hub Auth
- **What:** Strip standalone auth, install `@danwangdev/auth-client` SDK, recreate DB schema with hub_user_id references. Clean slate (no production data).
- **Why:** Writing-buddy stops maintaining its own auth. Same login works across all apps.
- **Effort:** S (human: ~1 day / CC: ~20 min)
- **Depends on:** P0 (hub app must exist)
- **Context:**
  - Delete: auth-service.ts, auth middleware, auth routes, user-repository.ts
  - Add: `@danwangdev/auth-client` SDK middleware, `app_users` table (hub_user_id + app prefs)
  - Clean slate: recreate DB schema (no migration needed, zero prod data)
  - user_id columns in domain tables (submissions, progress, etc.) reference hub_user_id
  - All existing domain tests must pass with hub JWT

## Deferred from Design Review — Hub IdP (2026-03-24)

### P1: Hub DESIGN.md
- **What:** Create a standalone DESIGN.md in the hub repo with the hub's design system: Inter typography, slate neutrals, wireframes, interaction states, responsive specs, and accessibility requirements.
- **Why:** The hub's design identity is currently embedded in the plan document. Engineers need a single source of truth in the hub repo itself — same pattern as writing-buddy's DESIGN.md.
- **Effort:** S (human: ~1 day / CC: ~15 min)
- **Depends on:** Hub repo creation (Phase A)
- **Context:** Extract the "Hub Design System" section from `docs/designs/hub-idp-app.md` into a standalone `DESIGN.md` in the hub repo. Include: Inter font loading, slate color tokens, component specs, wireframes. Keep writing-buddy's DESIGN.md unchanged.

## Deferred from CEO Review — Hub IdP (2026-03-24)

### P1: Hub Resilience Hardening
- **What:** Address 3 critical failure mode gaps identified during CEO review: (1) SSO cookie blocking detection, (2) concurrent token refresh race condition, (3) OIDC signing key loss protection.
- **Why:** These are silent failure modes — no error message, no log, no alert. Users just get broken SSO, random logouts, or total auth failure.
- **Effort:** S (human: ~2 days / CC: ~30 min)
- **Depends on:** P0 (hub app must exist — address during Phase A implementation)
- **Context:**
  - Cookie blocking: detect SSO failure on client side, fall back to explicit login redirect. Safari ITP and privacy browsers may block `.labf.app` cross-subdomain cookies.
  - Token refresh race: implement refresh token rotation with 30-second grace period for old token after new one issued. Two tabs refreshing simultaneously = one gets revoked token.
  - Signing key protection: startup health check that verifies `OIDC_SIGNING_KEY` can sign/verify a test token. Document backup procedure. Key loss = all tokens invalid across all apps.

### P2: Stripe Billing Integration
- **What:** Add Stripe as payment provider for self-service subscription management. Connect to existing subscription types (free/writing/vocab/bundle/family).
- **Why:** Admin-assigned subscriptions don't scale. Parents need to self-serve upgrade/downgrade/cancel. Revenue infrastructure.
- **Effort:** M (human: ~1 week / CC: ~45 min)
- **Depends on:** P0 (hub app) + Phase B (app migrations) must be stable. Subscription types and admin assignment must be working first.
- **Context:**
  - Stripe Checkout for new subscriptions, Stripe Customer Portal for management
  - Webhook handler for subscription lifecycle events (created, updated, cancelled, payment_failed)
  - Map Stripe price IDs to existing plan types
  - Free tier stays free (no Stripe involvement)
  - Family plan: one Stripe subscription, multiple child accounts

### P3: Weekly Parent Email Digest
- **What:** Automated weekly email to parents summarizing their child's progress across all apps.
- **Why:** Parents want visibility without logging in. Builds engagement and retention.
- **Effort:** S (human: ~1 day / CC: ~20 min)
- **Depends on:** Phase C (Resend email integration) + Phase D (parent dashboard / cross-app stats)
- **Context:**
  - Resend scheduled send or cron job on hub
  - Aggregate stats from each app's stats API (same data as parent dashboard)
  - Digest template: streak, words learned, stories completed, techniques mastered
  - Unsubscribe link required (CAN-SPAM)
  - Only send if child had activity that week

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
