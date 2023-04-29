import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuildsService } from './guilds.service';

@Controller('guilds')
export class GuildsController {
    constructor(private readonly guildService: GuildsService) {}

    @Get('/:id')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async getGuild(@Param('id') id: string) {
        return await this.guildService.getGuild(id);
    }

    @Get('/:id/members/search')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async getMembers(@Param('id') id: string, @Query('query') query: string) {
        return await this.guildService.getMembers(id, query);
    }

    @Post('/:id/rosters')
    // @Roles(Role.AppUser)
    // @UseGuards(JwtAuthGuard)
    async createRoster(@Param('id') id: string, @Body() body) {
        return await this.guildService.createRoster(id, {
            category: body.category,
            title: body.title,
            clanTag: body.clanTag
        });
    }

    @Get('/:id/rosters')
    // @Roles(Role.AppUser)
    // @UseGuards(JwtAuthGuard)
    async getRosters(@Param('id') id: string) {
        return await this.guildService.getRosters(id);
    }

    @Get('/:id/rosters/:rosterId')
    // @Roles(Role.AppUser)
    // @UseGuards(JwtAuthGuard)
    async getRoster(@Param('id') id: string, @Param('rosterId') rosterId) {
        return await this.guildService.getRoster(id, rosterId);
    }
}
