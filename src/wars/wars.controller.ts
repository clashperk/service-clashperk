import { Controller, Get, Header, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WarsService } from './wars.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('/wars')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class WarsController {
    constructor(private warService: WarsService) {}

    @Header('Cache-Control', 'max-age=600')
    @Get('/members/:tag')
    async getWars(@Param('tag') tag: string, @Query('months') months: string) {
        return this.warService.getOne(tag, +months);
    }

    @Header('Cache-Control', 'max-age=600')
    @Get('/stats/cwl/:clanTag')
    async getCWLStats(@Param('clanTag') clanTag: string) {
        return this.warService.getCWLStats(clanTag);
    }

    @Header('Cache-Control', 'max-age=600')
    @Get('/:id')
    async getWar(@Param('id') id: string, @Query('clanTag') clanTag: string) {
        return this.warService.getWar(id, clanTag);
    }
}
