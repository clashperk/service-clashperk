import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db.module';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';

@Module({
    imports: [DatabaseModule],
    controllers: [GuildsController],
    providers: [GuildsService],
    exports: [GuildsService]
})
export class GuildsModule {}
