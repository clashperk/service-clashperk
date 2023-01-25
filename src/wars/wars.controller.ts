import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WarsService } from './wars.service';

@Controller('/wars')
export class WarsController {
    constructor(private warService: WarsService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @Get('/members/:tag')
    async getWars(@Param('tag') tag: string) {
        return this.warService.getOne(tag);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @Get('/:id')
    async getWar(@Param('id') id: string) {
        return this.warService.getWar(id);
    }
}
