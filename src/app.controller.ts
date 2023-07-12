import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { fetch } from 'undici';
import { AppService } from './app.service';

@Controller()
export class AppController {
    private logger = new Logger(AppController.name);

    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Post('/webhook')
    async webhook(@Body() body) {
        if (body.type !== 'DEPLOY') return { message: 'OK' };
        this.logger.log(`Received webhook for ${body.service.name} (${body.status})`);

        const embed = {
            title: body.service.name,
            footer: { text: body.status, icon_url: 'https://railway.app/brand/logo-light.png' },
            fields: [
                {
                    name: 'Service ID',
                    value: `[${body.service.id}](https://railway.app/project/${body.project.id}/service/${body.service.id})`
                }
            ],
            color:
                body.status === 'SUCCESS'
                    ? 0x00ff00
                    : body.status === 'BUILDING'
                    ? 0xffff00
                    : body.status === 'DEPLOYING'
                    ? 0x5865f2
                    : 0xff0000,
            timestamp: new Date().toISOString()
        };

        const payload = { embeds: [embed], content: body.status === 'BUILDING' ? body.deployment.id : null };
        await fetch(process.env.DISCORD_WEBHOOK_TOKEN, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return { message: 'OK' };
    }
}
