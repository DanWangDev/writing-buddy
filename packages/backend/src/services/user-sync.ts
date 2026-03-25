import type { HubTokenClaims } from '@labf/auth-client/types'
import type { IAppUserRepository } from '../repositories/interfaces/app-user-repository.js'
import { logger } from './logger.js'

/**
 * Lazily syncs hub user data into the local app_users table.
 * Called on every authenticated request. Uses upsert to keep
 * display_name / email / role up to date without extra queries.
 */
export function createUserSync(appUserRepo: IAppUserRepository) {
  return function syncUser(claims: HubTokenClaims): void {
    try {
      appUserRepo.upsert(
        claims.sub,
        claims.displayName,
        claims.email,
        claims.role,
      )
    } catch (error) {
      logger.error('Failed to sync hub user', {
        hubUserId: claims.sub,
        error: String(error),
      })
    }
  }
}
