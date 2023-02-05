import { Controller, Get, Param } from '@nestjs/common';
import { ClansService } from './clans.service';

@Controller('clans')
export class ClansController {
    constructor(private clansService: ClansService) {}

    @Get('/capital-donations/:clanTag')
    async getCapitalDonations(@Param('clanTag') clanTag: string) {
        return this.clansService.getCapitalDonations(clanTag);
    }
}
