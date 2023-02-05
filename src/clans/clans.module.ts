import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';
import { CapitalDonation, CapitalDonationSchema } from './schemas/capital.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CapitalDonation.name, collection: 'CapitalContributions', schema: CapitalDonationSchema }])
    ],
    providers: [ClansService],
    controllers: [ClansController]
})
export class ClansModule {}
