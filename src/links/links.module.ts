import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../db.module';
import { RedisModule } from '../redis.module';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { PlayerLink, PlayerLinkSchema } from './schemas/links.schema';

@Module({
    imports: [
        DatabaseModule,
        RedisModule,
        MongooseModule.forFeature([{ name: PlayerLink.name, collection: 'PlayerLinks', schema: PlayerLinkSchema }])
    ],
    controllers: [LinksController],
    providers: [LinksService],
    exports: [LinksService]
})
export class LinksModule {}
