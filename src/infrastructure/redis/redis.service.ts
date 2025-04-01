import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly redisClient: Redis;

    constructor(private configService: ConfigService) {
        try {
            this.redisClient = new Redis({
                host: this.configService.get<string>('REDIS_HOST'),
                port: this.configService.get<number>('REDIS_PORT'),
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    console.log(`Redis reconnection attempt #${times} after ${delay}ms`);
                    return delay;
                },
            });

        } catch (error) {
            this.redisClient.on('error', (error) => {
                console.error('Redis error:', error);
            });
        }
    }

    async publish(channel: string, message: string): Promise<number> {
        return this.redisClient.publish(channel, message);
    }

    async subscribe(channel: string): Promise<void> {
        const subscriber = this.redisClient.duplicate();
        await subscriber.subscribe(channel);
        subscriber.on('message', (channel, message) => {
            console.log(`Received message from ${channel}: ${message}`);
        });
    }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async set(
        key: string,
        value: string,
        expirationInSeconds?: number,
    ): Promise<'OK'> {
        if (expirationInSeconds) {
            return this.redisClient.set(key, value, 'EX', expirationInSeconds);
        }
        return this.redisClient.set(key, value);
    }

    getClient(): Redis {
        return this.redisClient;
    }
}
