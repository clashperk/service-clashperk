import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuildsService } from './guilds.service';

@Controller('/guilds')
@UseGuards(JwtAuthGuard)
export class GuildsController {
    constructor(private readonly guildService: GuildsService) {}

    @Get('/:id')
    async getGuild(@Param('id') id: string) {
        return await this.guildService.getGuild(id);
    }

    @Get('/:id/clans/categories')
    async getClans(@Param('id') id: string) {
        return await this.guildService.getClans(id);
    }

    @Patch('/:id/clans')
    async updateClanCategories(@Param('id') id: string, @Body() body) {
        return await this.guildService.updateClanCategories(body, id);
    }

    @Get('/:id/members/search')
    async getMembers(@Param('id') id: string, @Query('query') query: string) {
        return await this.guildService.getMembers(id, query);
    }
}
