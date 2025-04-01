import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import mysqlConfig from './config/database.config';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChangesModule } from './modules/changes/changes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      name: 'mysqlConnection',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mysqlConfig,
    }),
    RedisModule,
    ScheduleModule.forRoot(),
    ChangesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
