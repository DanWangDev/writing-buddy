import { Router } from 'express'
import { z } from 'zod'
import {
  discoverOidc,
  exchangeCode,
  refreshAccessToken,
} from '@danwangdev/auth-client/server'
import type { AuthServerConfig, OidcMetadata } from '@danwangdev/auth-client/server'
import { env } from '../config/env.js'
import { logger } from '../services/logger.js'

const exchangeSchema = z.object({
  code: z.string().min(1),
  code_verifier: z.string().min(1),
  redirect_uri: z.string().url(),
})

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
})

function buildConfig(redirectUri: string): AuthServerConfig {
  return {
    issuer: env.OIDC_ISSUER,
    internalIssuer: env.OIDC_INTERNAL_ISSUER,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET,
    redirectUri,
    postLogoutRedirectUri: '',
    sessionSecret: 'not-used-for-bff',
  }
}

async function getMetadata(): Promise<OidcMetadata> {
  const metadata = await discoverOidc(env.OIDC_ISSUER, env.OIDC_INTERNAL_ISSUER)

  // Rewrite token_endpoint and jwks_uri for Docker internal networking
  if (env.OIDC_INTERNAL_ISSUER !== env.OIDC_ISSUER) {
    return {
      ...metadata,
      token_endpoint: metadata.token_endpoint.replace(env.OIDC_ISSUER, env.OIDC_INTERNAL_ISSUER),
      jwks_uri: metadata.jwks_uri.replace(env.OIDC_ISSUER, env.OIDC_INTERNAL_ISSUER),
    }
  }

  return metadata
}

export function createAuthExchangeRouter(): Router {
  const router = Router()

  router.post('/exchange', async (req, res) => {
    const parsed = exchangeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
      return
    }

    const { code, code_verifier, redirect_uri } = parsed.data

    try {
      const config = buildConfig(redirect_uri)
      const metadata = await getMetadata()
      const result = await exchangeCode(code, code_verifier, config, metadata)

      res.json({
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
        id_token: result.tokens.id_token,
        expires_at: result.tokens.expires_at,
      })
    } catch (error) {
      logger.error('Token exchange failed', { error: String(error) })
      res.status(502).json({ error: 'Token exchange failed' })
    }
  })

  router.post('/refresh', async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() })
      return
    }

    const { refresh_token } = parsed.data

    try {
      const config = buildConfig(env.OIDC_REDIRECT_URI)
      const metadata = await getMetadata()
      const tokens = await refreshAccessToken(
        { refresh_token, access_token: '', id_token: '', expires_at: 0 },
        config,
        metadata,
      )

      res.json({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
        expires_at: tokens.expires_at,
      })
    } catch (error) {
      logger.error('Token refresh failed', { error: String(error) })
      res.status(502).json({ error: 'Token refresh failed' })
    }
  })

  return router
}
