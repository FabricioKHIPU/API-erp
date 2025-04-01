import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangesController } from './changes.controller';
import { ChangesService } from './changes.service';

@Module({
    imports: [TypeOrmModule],
    controllers: [ChangesController],
    providers: [ChangesService],
})
export class ChangesModule { }
