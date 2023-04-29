import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../db.module';
import { RedisModule } from '../redis.module';
import { ClanWar, ClanWarSchema } from './schemas/wars.schema';
import { WarsController } from './wars.controller';
import { WarsService } from './wars.service';

@Module({
    imports: [
        DatabaseModule,
        RedisModule,
        MongooseModule.forFeature([{ name: ClanWar.name, collection: 'ClanWars', schema: ClanWarSchema }])
    ],
    providers: [WarsService],
    controllers: [WarsController]
})
export class WarsModule {}
