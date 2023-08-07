import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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

    @Get('/:id/members/search')
    async getMembers(@Param('id') id: string, @Query('query') query: string) {
        return await this.guildService.getMembers(id, query);
    }
}
