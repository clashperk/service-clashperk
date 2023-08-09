import { Body, Controller, Delete, Get, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';
import { LinksService } from './links.service';

@Controller('/links')
export class LinksController {
    constructor(private readonly linksService: LinksService) {}

    @Get('/ping')
    async getLinks() {
        return { message: 'Pong!' };
    }

    @Post('/bulk')
    @UseGuards(JwtAuthGuard, RateLimitGuard)
    @Throttle(15, 60)
    async batch(@Body() body: string[]) {
        return this.linksService.findAll(body);
    }

    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    @UseGuards(JwtAuthGuard, RateLimitGuard)
    @Throttle(15, 60)
    async getLink(@Param('id') id: string) {
        return this.linksService.findOne(id);
    }

    @Post('/')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async createLink(
        @Body() body: { name: string; tag: string; userId: string; username: string; displayName: string; discriminator: string }
    ) {
        if (!(body.name && body.tag && body.userId && body.username && body.displayName && body.discriminator)) {
            throw new HttpException({ reason: 'Missing required fields.' }, 400);
        }

        return this.linksService.create(body);
    }

    @Delete('/')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async removeLink(@CurrentUser() user, @Body() body: { clanTag: string; tag: string }) {
        await this.linksService.canUnlink(user.user_id, body.clanTag, body.tag);
        return this.linksService.remove(body.tag);
    }
}
