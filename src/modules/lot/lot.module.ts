import { Module } from '@nestjs/common';
import { LotController } from './lot.controller';
import { LotService } from './lot.service';
import { AuthModule } from '../../infrastructure/auth/auth.module';
import { KeycloakAuthGuard } from '../../infrastructure/auth/guard/keycloak-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [LotController],
  providers: [LotService, KeycloakAuthGuard],
})
export class LotModule { }


