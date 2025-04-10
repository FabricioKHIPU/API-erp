import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import Redis from 'ioredis';
import axios from 'axios';
import { redisConfig, RedisConfiguration } from '../../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit {
    private readonly publisher: Redis;
    private readonly subscriber: Redis;
    private readonly logger = new Logger(RedisService.name);
    private readonly externalApiUrl: string;
    private readonly checkInterval: number;
    private pendingChanges: DatabaseChange[] = [];
    private static readonly DB_CHANGES_CHANNEL = 'db_changes';

    constructor(private readonly configService: ConfigService) {
        const config = this.getRedisConfig();
        this.publisher = new Redis(config);
        this.subscriber = new Redis(config);
        this.externalApiUrl = config.externalApiUrl!;
        this.checkInterval = config.checkInterval;
    }

    private getRedisConfig(): RedisConfiguration {
        return redisConfig(this.configService);
    }

    async onModuleInit() {
        await this.initializeSubscriber();
    }

    private async initializeSubscriber() {
        try {
            await this.subscriber.subscribe(RedisService.DB_CHANGES_CHANNEL);
            this.logger.log(`Subscribed to channel: ${RedisService.DB_CHANGES_CHANNEL}`);

            this.subscriber.on('message', this.handleMessage.bind(this));
        } catch (error) {
            this.logger.error(`Error initializing subscriber: ${error.message}`);
        }
    }

    private async handleMessage(channel: string, message: string) {
        if (channel === RedisService.DB_CHANGES_CHANNEL) {
            try {
                const change = JSON.parse(message) as DatabaseChange;
                this.pendingChanges.push(change);
                this.logger.log(`Change queued: ${JSON.stringify(change)}`);
            } catch (error) {
                this.logger.error(`Error processing message: ${error.message}`);
            }
        }
    }

    @Interval('processChanges', 300000)
    private async processQueuedChanges() {
        if (this.pendingChanges.length === 0) return;

        try {
            const changes = [...this.pendingChanges];
            this.pendingChanges = [];

            await this.notifyExternalApi(changes);
        } catch (error) {
            this.logger.error(`Error processing queued changes: ${error.message}`);
            this.pendingChanges = [...this.pendingChanges];
        }
    }

    private async notifyExternalApi(changes: DatabaseChange[]) {
        if (!this.externalApiUrl) {
            this.logger.warn('External API URL not configured');
            return;
        }

        try {
            const response = await axios.post(this.externalApiUrl, { changes });
            this.logger.log(`Changes sent to external API. Status: ${response.status}`);
        } catch (error) {
            this.logger.error(`Error notifying external API: ${error.message}`);
            throw error;
        }
    }

    async publishDatabaseChange(change: DatabaseChange): Promise<void> {
        try {
            const message = JSON.stringify({
                ...change,
                timestamp: new Date().toISOString()
            });

            await this.publisher.publish(RedisService.DB_CHANGES_CHANNEL, message);
            this.logger.log(`Published change: ${message}`);
        } catch (error) {
            this.logger.error(`Error publishing change: ${error.message}`);
            throw error;
        }
    }

    async get(key: string): Promise<string | null> {
        return this.publisher.get(key);
    }

    async set(key: string, value: string, expiry?: number): Promise<'OK'> {
        if (expiry) {
            return this.publisher.set(key, value, 'EX', expiry);
        }
        return this.publisher.set(key, value);
    }
}

export interface DatabaseChange {
    entity: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    id: number | string;
    data: any;
    timestamp?: string;
}


// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis from 'ioredis';

// @Injectable()
// export class RedisService {
//     private readonly redisClient: Redis;

//     constructor(private configService: ConfigService) {
//         try {
//             this.redisClient = new Redis({
//                 host: this.configService.get<string>('REDIS_HOST'),
//                 port: this.configService.get<number>('REDIS_PORT'),
//                 retryStrategy: (times) => {
//                     const delay = Math.min(times * 50, 2000);
//                     console.log(`Redis reconnection attempt #${times} after ${delay}ms`);
//                     return delay;
//                 },
//             });

//         } catch (error) {
//             this.redisClient.on('error', (error) => {
//                 console.error('Redis error:', error);
//             });
//         }
//     }

//     async publish(channel: string, message: string): Promise<number> {
//         return this.redisClient.publish(channel, message);
//     }

//     async subscribe(channel: string): Promise<void> {
//         const subscriber = this.redisClient.duplicate();
//         await subscriber.subscribe(channel);
//         subscriber.on('message', (channel, message) => {
//             console.log(`Received message from ${channel}: ${message}`);
//         });
//     }

//     async get(key: string): Promise<string | null> {
//         return this.redisClient.get(key);
//     }

//     async set(
//         key: string,
//         value: string,
//         expirationInSeconds?: number,
//     ): Promise<'OK'> {
//         if (expirationInSeconds) {
//             return this.redisClient.set(key, value, 'EX', expirationInSeconds);
//         }
//         return this.redisClient.set(key, value);
//     }

//     getClient(): Redis {
//         return this.redisClient;
//     }
// }