import Redis from 'ioredis';
import dotenv from 'dotenv';
import { rehydrateRedisCacheFromPostgres } from '../utils/redisRehydration';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6782;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let isRedisHealthy = false;

const redisOptions: any = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

if (REDIS_PASSWORD) {
  redisOptions.password = REDIS_PASSWORD;
}

const redis = new Redis(redisOptions);

redis.on('connect', () => {
  isRedisHealthy = true;
  console.log(`Successfully connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
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
