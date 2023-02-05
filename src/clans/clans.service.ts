import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CapitalDonation, CapitalDonationDocument } from './schemas/capital.schema';

@Injectable()
export class ClansService {
    constructor(@InjectModel(CapitalDonation.name) private capitalDonationModel: Model<CapitalDonationDocument>) {}

    async getCapitalDonations(clanTag: string): Promise<CapitalDonation[]> {
        const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
        return this.capitalDonationModel
            .find({ 'clan.tag': clanTag, 'createdAt': { $gte: createdAt } })
            .sort({ _id: -1 })
            .exec();
    }
}
