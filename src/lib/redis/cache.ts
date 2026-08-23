import { Redis } from '@upstash/redis';
import { env } from '@/env';

import { unstable_after as after } from 'next/server';

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

interface CacheOptions {
  ttlSeconds: number; // Max time the key lives in Redis
  staleSeconds: number; // Time after which the data is considered stale (triggering background refresh)
}

/**
 * Fetch from Redis Cache with Stale-While-Revalidate pattern.
 * Solves Cache Stampede, Avalanche (jitter), and Penetration (caching nulls).
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = { ttlSeconds: 3600, staleSeconds: 300 }
): Promise<T> {
  const cachedData = await redis.get<{ data: T; staleAt: number }>(key);

  const now = Date.now();

  if (cachedData) {
    if (now > cachedData.staleAt) {
      after(() => {
        revalidateBackground(key, fetcher, options).catch(console.error);
      });
    }
    return cachedData.data;
  }

  // Cache Miss (or Penetration). Fetch synchronously.
  const data = await fetcher();
  
  // Add jitter to TTL to prevent Cache Avalanche
  const jitter = Math.floor(Math.random() * 300); // 0 to 5 mins jitter
  const finalTtl = options.ttlSeconds + jitter;
  
  const staleAt = now + (options.staleSeconds * 1000);

  // Note: we cache even if data is null to prevent Cache Penetration
  await redis.set(key, { data, staleAt }, { ex: finalTtl });

  return data;
}

async function revalidateBackground<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
) {
  const data = await fetcher();
  const now = Date.now();
  const jitter = Math.floor(Math.random() * 300);
  const finalTtl = options.ttlSeconds + jitter;
  const staleAt = now + (options.staleSeconds * 1000);

  await redis.set(key, { data, staleAt }, { ex: finalTtl });
}

/**
 * Manually invalidate a cache key (solves Cache Staleness).
 */
export async function invalidateCache(key: string) {
  await redis.del(key);
}

/**
 * Helper to invalidate course-related caches
 */
export async function invalidateCourseCache(slug?: string) {
  await invalidateCache('cache:courses:active');
  if (slug) {
    await invalidateCache(`cache:course:slug:${slug}`);
  }
}
