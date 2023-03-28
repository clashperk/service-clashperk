import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../db.module';
import { RedisModule } from '../redis.module';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';
import { CapitalDonation, CapitalDonationSchema } from './schemas/capital.schema';

@Module({
    imports: [
        RedisModule,
        DatabaseModule,
        MongooseModule.forFeature([{ name: CapitalDonation.name, collection: 'CapitalContributions', schema: CapitalDonationSchema }])
    ],
    providers: [ClansService],
    controllers: [ClansController]
})
export class ClansModule {}
