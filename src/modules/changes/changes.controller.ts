import { Controller, Get, Query } from '@nestjs/common';
import { ChangesService } from './changes.service';

@Controller('changes')
export class ChangesController {
    constructor(private readonly changesService: ChangesService) { }

    @Get()
    async getChanges(@Query('fecha') fecha: string) {
        if (!fecha) {
            const now = new Date();
            fecha = now.toISOString().split('T')[0];
        }
        const result = await this.changesService.getChanges(fecha);
        return result;
    }
}
