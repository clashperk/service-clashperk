import { Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RostersService } from './rosters.service';

@Controller('/rosters')
@UseGuards(JwtAuthGuard)
@Roles(Role.Admin)
export class RostersController {
    constructor(private readonly rostersService: RostersService) {}

    @Get('/')
    async getRosters(@Query('guildId') guildId: string) {
        return this.rostersService.getRosters(guildId);
    }

    @Get('/:id')
    async getRoster(@Param('id') id: string) {
        return this.rostersService.getRoster(id);
    }

    @Delete('/:id')
    async deleteRoster(@Param('id') id: string) {
        return this.rostersService.deleteRoster(id);
    }

    @Put('/:id/members/:tag')
    async addMember(@Param('id') id: string, @Param('tag') tag: string) {
        return this.rostersService.addMember(id, tag);
    }

    @Delete('/:id/members/:tag')
    async removeMember(@Param('id') id: string, @Param('tag') tag: string) {
        return this.rostersService.removeMember(id, tag);
    }
}
