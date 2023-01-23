import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerLink, PlayerLinkDocument } from './schemas/links.schema';

@Injectable()
export class LinksService {
    constructor(@InjectModel(PlayerLink.name) private playerLinkModel: Model<PlayerLinkDocument>) {}

    async findAll(args: string[]): Promise<PlayerLink[]> {
        if (!Array.isArray(args)) {
            throw new HttpException({ reason: 'Argument must be an array of strings.' }, 400);
        }
        return this.playerLinkModel.find({ tag: { $in: args } }, { name: 1, tag: 1, userId: 1, username: 1, _id: 0 }).limit(100);
    }

    async findOne(tag: string): Promise<PlayerLink> {
        if (typeof tag !== 'string') {
            throw new HttpException({ reason: 'Argument must be a string.' }, 400);
        }

        const data = await this.playerLinkModel.findOne({ tag }, { name: 1, tag: 1, userId: 1, username: 1, _id: 0 });
        if (!data) throw new HttpException('Not Found', 404);
        return data;
    }
}
