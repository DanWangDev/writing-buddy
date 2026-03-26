import type { HubUser } from '@danwangdev/auth-client/types'
import type { IAppUserRepository } from '../repositories/interfaces/app-user-repository.js'
import { logger } from './logger.js'

/**
 * Lazily syncs hub user data into the local app_users table.
 * Called on every authenticated request. Uses upsert to keep
 * display_name / email / role up to date without extra queries.
 */
export function createUserSync(appUserRepo: IAppUserRepository) {
  return function syncUser(user: HubUser): void {
    try {
      appUserRepo.upsert(
        user.sub,
        user.display_name,
        user.email,
        user.role,
      )
    } catch (error) {
      logger.error('Failed to sync hub user', {
        hubUserId: user.sub,
        error: String(error),
      })
    }
  }
}
