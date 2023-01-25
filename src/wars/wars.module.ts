import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClanWar, ClanWarSchema } from './schemas/wars.schema';
import { WarsController } from './wars.controller';
import { WarsService } from './wars.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: ClanWar.name, collection: 'ClanWars', schema: ClanWarSchema }])],
    providers: [WarsService],
    controllers: [WarsController]
})
export class WarsModule {}
