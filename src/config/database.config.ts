import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const mysqlConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST_MYSQL'),
    port: configService.get<number>('DB_PORT_MYSQL'),
    username: configService.get<string>('DB_USER_MYSQL'),
    password: configService.get<string>('DB_PASSWORD_MYSQL'),
    database: configService.get<string>('DB_NAME_MYSQL'),
});

export default mysqlConfig;