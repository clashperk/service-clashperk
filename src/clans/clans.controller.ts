import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClansService } from './clans.service';

@Controller('clans')
export class ClansController {
    constructor(private clansService: ClansService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @Header('Cache-Control', 'max-age=60')
    @Get('/capital-donations/:clanTag')
    async getCapitalDonations(@Param('clanTag') clanTag: string) {
        return this.clansService.getCapitalDonations(clanTag);
    }

    @Get('/:clanTag/members')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async getClanMembers(@CurrentUser() userInfo, @Param('clanTag') clanTag: string) {
        return this.clansService.getClanMembers(userInfo.user_id, clanTag);
    }
}
