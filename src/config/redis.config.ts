import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export interface RedisConfiguration extends RedisOptions {
    externalApiUrl?: string;
    checkInterval: number;
}

export const redisConfig = (configService: ConfigService): RedisConfiguration => ({
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT', 6379),
    externalApiUrl: configService.get<string>('EXTERNAL_API_URL'),
    checkInterval: configService.get<number>('REDIS_CHECK_INTERVAL', 300000), // 5 minutos
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis reconnection attempt #${times} after ${delay}ms`);
        return delay;
    },
});