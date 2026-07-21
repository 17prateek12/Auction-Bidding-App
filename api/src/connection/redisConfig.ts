import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6782;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

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
  console.log(`Successfully connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

export { redis };
