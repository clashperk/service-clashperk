import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db.module';
import { RedisModule } from '../redis.module';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';

@Module({
    imports: [DatabaseModule, RedisModule],
    controllers: [GuildsController],
    providers: [GuildsService],
    exports: [GuildsService]
})
export class GuildsModule {}
