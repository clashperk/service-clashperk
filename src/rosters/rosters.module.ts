import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db.module';
import { RedisModule } from '../redis.module';
import { RostersController } from './rosters.controller';
import { RostersService } from './rosters.service';

@Module({
    imports: [DatabaseModule, RedisModule],
    providers: [RostersService],
    controllers: [RostersController],
    exports: [RostersService]
})
export class RostersModule {}
