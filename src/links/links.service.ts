import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerLink, PlayerLinkDocument } from './schemas/links.schema';

@Injectable()
export class LinksService {
    constructor(@InjectModel(PlayerLink.name) private catModel: Model<PlayerLinkDocument>) {}

    async findAll(args: string[]): Promise<PlayerLink[]> {
        return this.catModel
            .find({
                tag: {
                    $in: args
                }
            })
            .limit(100);
    }

    async findOne(tag: string): Promise<PlayerLink> {
        return this.catModel.findOne({ tag });
    }
}
