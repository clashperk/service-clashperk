import { BadGatewayException, Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
    async createLink() {
        throw new BadGatewayException('Endpoint disabled');
    }

    @Delete('/')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async removeLink() {
        throw new BadGatewayException('Endpoint disabled');
    }
}
