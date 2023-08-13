import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, Roles } from '../auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';
import { CreateLinkInput } from './dto/create-input';
import { BulkActionInput, DeleteLinkInput } from './dto/update-input';
import { LinksService } from './links.service';

@Controller('/links')
@UsePipes(new ValidationPipe({ transform: true, disableErrorMessages: true }))
export class LinksController {
    constructor(private readonly linksService: LinksService) {}

    @Get('/ping')
    async getLinks() {
        return { message: 'Pong!' };
    }

    @UseGuards(JwtAuthGuard, RateLimitGuard)
    @Throttle(15, 60)
    @Post('/bulk')
    @HttpCode(200)
    async batch(@Body() body: BulkActionInput) {
        return this.linksService.findAll(body.items);
    }

    @UseGuards(JwtAuthGuard, RateLimitGuard)
    @Throttle(15, 60)
    @Get('/:id')
    async getLink(@Param('id') id: string) {
        return this.linksService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Roles(Role.AppUser)
    @Post('/')
    async createLink(@Body() body: CreateLinkInput) {
        return this.linksService.create(body);
    }

    @Delete('/')
    @Roles(Role.AppUser)
    @UseGuards(JwtAuthGuard)
    async unlink(@CurrentUser() user, @Body() body: DeleteLinkInput) {
        await this.linksService.canUnlink(user.user_id, body.clanTag, body.tag);
        return this.linksService.remove(body.tag);
    }
}
