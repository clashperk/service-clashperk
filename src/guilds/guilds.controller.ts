import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
}
