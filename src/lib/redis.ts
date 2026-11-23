import { Redis } from '@upstash/redis';

let client: Redis | undefined;

// Call from server-side code after the environment has been loaded.
export function getRedis(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured.');
  }

  return client ??= Redis.fromEnv();
}
