import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';

@Injectable()
export class ChangesService implements OnModuleInit {
    private lastCheck: Date;
    private redisClient: Redis;

    constructor(
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        // Se inicializa el cliente Redis con las variables de entorno
        this.redisClient = new Redis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
        });
    }

    onModuleInit() {
        this.lastCheck = new Date();
    }

    async getChanges(fecha: string): Promise<any> {
        const query = 'CALL sp_get_changes(?)';
        const result = await this.dataSource.query(query, [fecha]);
        return result[0] || [];
    }

    @Cron('*/5 * * * *')
    async handleCron() {
        const lastCheckDate = this.lastCheck.toISOString().split('T')[0];
        const changes = await this.getChanges(lastCheckDate);

        this.lastCheck = new Date();

        if (changes && changes.length > 0) {
            const message = JSON.stringify(changes);
            await this.redisClient.publish('changes_channel', message);
        }
    }
}
