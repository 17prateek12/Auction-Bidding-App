import Redis from 'ioredis';
import dotenv from 'dotenv';
import { rehydrateRedisCacheFromPostgres } from '../utils/redisRehydration';

import { URL } from 'url';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6782;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let isRedisHealthy = false;

const isUrl = REDIS_HOST.startsWith('redis://') || REDIS_HOST.startsWith('rediss://');

// Helper to parse Redis URL for BullMQ/ioredis compatibility
export const parseRedisUrl = (urlStr: string) => {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  } catch (err) {
    console.error('Failed to parse Redis URL:', err);
    return {
      host: 'localhost',
      port: 6782,
    };
  }
};

const redis = isUrl
  ? new Redis(REDIS_HOST, {
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    })
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

export const redisConnection = isUrl
  ? parseRedisUrl(REDIS_HOST)
  : {
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
    };

redis.on('connect', () => {
  isRedisHealthy = true;
  const displayHost = isUrl ? new URL(REDIS_HOST).hostname : `${REDIS_HOST}:${REDIS_PORT}`;
  console.log(`Successfully connected to Redis at ${displayHost}`);
  // Automatically re-hydrate Redis ZSET cache from PostgreSQL on connection
  rehydrateRedisCacheFromPostgres().catch((err) =>
    console.error('Failed auto rehydration on Redis connect:', err)
  );
});

redis.on('reconnecting', () => {
  console.warn('⚠️ Redis is reconnecting...');
});

redis.on('error', (err) => {
  isRedisHealthy = false;
  console.error('Redis Connection Error:', err?.message || err);
});

redis.on('end', () => {
  isRedisHealthy = false;
  console.warn('⚠️ Redis connection ended');
});

export const isRedisConnected = (): boolean => isRedisHealthy;

export { redis };
