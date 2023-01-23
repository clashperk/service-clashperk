import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LinksService } from './links.service';

@Controller('/links')
export class LinksController {
    constructor(private readonly linksService: LinksService) {}

    @Get('/ping')
    async getLinks() {
        return { message: 'Pong!' };
    }

    @Post('/bulk')
    @UseGuards(JwtAuthGuard)
    async batch(@Body() body: string[]) {
        return this.linksService.findAll(body);
    }

    @Get('/:tag')
    @UseGuards(JwtAuthGuard)
    async getLink(@Param('tag') tag: string) {
        return this.linksService.findOne(tag);
    }
}
