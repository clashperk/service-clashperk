import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { fetch } from 'undici';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('guilds')
export class GuildsController {
    constructor() {
        //
    }

    @Get('/:id/members/search')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async getMembers(@Param('id') id: string, @Query('query') query: string) {
        const res = await fetch(`https://discord.com/api/guilds/${id}/members/search?query=${query}&limit=50`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`
            }
        });
        return await res.json();
    }
}
