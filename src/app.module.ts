import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';

import { AppService } from './app.service';
import { LinksController } from './links/links.controller';
import { LinksModule } from './links/links.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URL')
            }),
            inject: [ConfigService]
        }),
        LinksModule
    ],
    controllers: [AppController, LinksController],
    providers: [AppService]
})
export class AppModule {}
