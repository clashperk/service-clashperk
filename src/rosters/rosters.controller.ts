import { Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { RostersService } from './rosters.service';

@Controller('rosters')
export class RostersController {
    constructor(private readonly rostersService: RostersService) {}

    @Get('/:id')
    async getRoster(@Param('id') id: string) {
        return await this.rostersService.getRoster(id);
    }

    @Delete('/:id')
    async deleteRoster(@Param('id') id: string) {
        return await this.rostersService.deleteRoster(id);
    }

    @Put('/:id/members/:tag')
    async addMember(@Param('id') id: string, @Param('tag') tag: string) {
        return await this.rostersService.addMember(id, tag);
    }

    @Delete('/:id/members/:tag')
    async removeMember(@Param('id') id: string, @Param('tag') tag: string) {
        return await this.rostersService.removeMember(id, tag);
    }
}
