# @labf/auth-client

OIDC client SDK for authenticating with the [11plus-hub](https://github.com/DanWangDev/11plus-hub) identity provider.

## Install

```bash
npm install @labf/auth-client --registry=https://npm.pkg.github.com
```

## Backend Usage

```typescript
import { createAuthMiddleware } from '@labf/auth-client'

const { requireAuth, optionalAuth } = createAuthMiddleware({
  issuer: process.env.HUB_URL,
  clientId: process.env.OIDC_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  redirectUri: process.env.OIDC_REDIRECT_URI,
  appSlug: 'writing-buddy',
})

// Protected route
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.hubUser })
})

// Optional auth
app.get('/api/public', optionalAuth, (req, res) => {
  res.json({ user: req.hubUser ?? null })
})
```

### Lazy User Sync

```typescript
const { requireAuth } = createAuthMiddleware(config, {
  onAuthenticated: async (claims) => {
    await appUserRepo.upsert(claims.sub, { plan: claims.plan })
  },
})
```

## Frontend Usage

```typescript
import { startLogin, handleCallback, startLogout } from '@labf/auth-client/browser'

// Redirect to hub login
startLogin(oidcEndpoints, config)

// Handle callback after login
const tokens = await handleCallback(oidcEndpoints, config)

// Logout
startLogout(oidcEndpoints)
```

## JWT Claims

Verified tokens expose `HubTokenClaims` on `req.hubUser`:

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | `string` | Hub user ID |
| `email` | `string` | User email |
| `username` | `string` | Hub username |
| `plan` | `string` | Subscription plan (free/writing/vocab/bundle/family) |
| `features` | `string[]` | Feature entitlements |
| `apps` | `string[]` | App slugs user has access to |

## Testing

```typescript
import { mockHubClaims } from '@labf/auth-client/test-helpers'

const claims = mockHubClaims({ sub: '42', plan: 'writing' })
```

## Publishing

Published to GitHub Packages on every push to `main` via CI. Bump `version` in `package.json` before merging to publish a new version.
