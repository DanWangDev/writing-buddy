import type { HubUser } from "@danwangdev/auth-client/types";
import type { IAppUserRepository } from "../repositories/interfaces/app-user-repository.js";
import { logger } from "./logger.js";

const SYNC_TTL_MS = 5 * 60 * 1000; // 5 minutes
const recentSyncs = new Map<string, number>();

/**
 * Lazily syncs hub user data into the local app_users table.
 * Called on every authenticated request. Uses upsert to keep
 * display_name / email / role up to date without extra queries.
 *
 * Throttled to at most once per 5 minutes per user to avoid
 * unnecessary database writes on every request.
 */
export function createUserSync(appUserRepo: IAppUserRepository) {
  return function syncUser(user: HubUser): void {
    const now = Date.now();
    const lastSync = recentSyncs.get(user.sub);
    if (lastSync && now - lastSync < SYNC_TTL_MS) {
      return;
    }

    try {
      appUserRepo.upsert(user.sub, user.display_name, user.email, user.role);
      recentSyncs.set(user.sub, now);

      // Prune stale entries to prevent unbounded memory growth
      if (recentSyncs.size > 1000) {
        for (const [sub, ts] of recentSyncs) {
          if (now - ts >= SYNC_TTL_MS) {
            recentSyncs.delete(sub);
          }
        }
      }
    } catch (error) {
      logger.error("Failed to sync hub user", {
        hubUserId: user.sub,
        error: String(error),
      });
    }
  };
}

/**
 * Export for testing — reset the throttle cache.
 */
export function _resetSyncCache(): void {
  recentSyncs.clear();
}
