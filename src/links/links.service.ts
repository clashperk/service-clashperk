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
        const isString = args.every((arg) => typeof arg === 'string');
        if (!isString) {
            throw new HttpException({ reason: 'Argument must be an array of strings.' }, 400);
        }

        const isId = args.every((id) => /^\d{17,19}/.test(id));
        const where = isId ? { userId: { $in: args } } : { tag: { $in: args } };
        return this.playerLinkModel.find(where, { name: 1, tag: 1, userId: 1, username: 1, _id: 0 }).limit(100);
    }

    async findOne(query: string): Promise<PlayerLink[]> {
        if (typeof query !== 'string') {
            throw new HttpException({ reason: 'Argument must be a string.' }, 400);
        }
        const isId = /^\d{17,19}/.test(query);
        const where = isId ? { userId: query } : { tag: query };

        const links = await this.playerLinkModel.find(where, {
            name: 1,
            tag: 1,
            userId: 1,
            username: 1,
            _id: 0
        });
        return links;
    }

    async create(link: Omit<PlayerLink, 'order' | 'verified' | 'createdAt'>): Promise<PlayerLink> {
        const links = await this.playerLinkModel.find({ userId: link.userId });

        const createdLink = new this.playerLinkModel({
            name: link.name,
            tag: link.tag,
            userId: link.userId,
            username: link.username,
            order: Math.max(...links.map((link) => link.order)) + 1,
            verified: false,
            createdAt: new Date()
        });

        return createdLink.save();
    }
}
