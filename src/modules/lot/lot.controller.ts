import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LotService } from './lot.service';
import { KeycloakAuthGuard } from '../../infrastructure/auth/guard/keycloak-auth.guard';

@ApiTags('lot')
@Controller('lot')
export class LotController {
  constructor(private readonly lotService: LotService) { }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio en formato YYYY-MM-DD', required: true })
  @ApiResponse({ status: 200, description: 'Listado de lotes obtenidos correctamente.' })
  @ApiResponse({ status: 400, description: 'Parámetro startDate obligatorio.' })
  @UseGuards(KeycloakAuthGuard)
  async getLots(@Query('startDate') startDate: string): Promise<any[]> {
    if (!startDate) {
      throw new BadRequestException('El parámetro startDate es obligatorio.');
    }
    return this.lotService.getLots(startDate);
  }
}