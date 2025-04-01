import { RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379
};

export default redisConfig;
