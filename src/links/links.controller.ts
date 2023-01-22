import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LinksService } from './links.service';

@Controller('/links')
export class LinksController {
    constructor(private readonly linksService: LinksService) {}

    @Get('/ping')
    async getLinks() {
        return {
            message: 'Pong!'
        };
    }

    @Post('/bulk')
    async batch(@Body() body: string[]) {
        return this.linksService.findAll(body);
    }

    @Get('/:tag')
    async getLink(@Param('tag') tag: string) {
        return this.linksService.findOne(tag);
    }
}
