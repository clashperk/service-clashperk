import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { APIClan } from 'clashofclans.js';
import { Db } from 'mongodb';
import { Model } from 'mongoose';
import { RedisClient } from '../redis.module';
import { PlayerLink, PlayerLinkDocument } from './schemas/links.schema';

@Injectable()
export class LinksService {
    private readonly logger = new Logger(LinksService.name);
    constructor(
        @InjectModel(PlayerLink.name) private playerLinkModel: Model<PlayerLinkDocument>,
        @Inject('DATABASE_CONNECTION') private db: Db,
        @Inject('REDIS_CONNECTION') private redis: RedisClient
    ) {}

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
        return this.playerLinkModel
            .find(where, {
                name: 1,
                tag: 1,
                userId: 1,
                username: 1,
                order: 1,
                _id: 0,
                verified: 1
            })
            .sort({ order: 1 })
            .limit(100);
    }

    async findOne(query: string): Promise<PlayerLink[]> {
        if (typeof query !== 'string') {
            throw new HttpException({ reason: 'Argument must be a string.' }, 400);
        }
        const isId = /^\d{17,19}/.test(query);
        const where = isId ? { userId: query } : { tag: query };

        const links = await this.playerLinkModel
            .find(where, {
                name: 1,
                tag: 1,
                userId: 1,
                username: 1,
                order: 1,
                _id: 0,
                verified: 1
            })
            .sort({ order: 1 });
        return links;
    }

    async create(link: Omit<PlayerLink, 'order' | 'verified' | 'createdAt'>): Promise<PlayerLink> {
        const links = await this.playerLinkModel.find({ userId: link.userId });

        const createdLink = new this.playerLinkModel({
            name: link.name,
            tag: link.tag,
            userId: link.userId,
            username: link.username,
            displayName: link.displayName,
            discriminator: link.discriminator,
            order: links.length ? Math.max(...links.map((link) => link.order)) + 1 : 0,
            verified: false,
            createdAt: new Date()
        });

        this.logger.log(`Creating link for ${link.name} (${link.tag}) - ${link.username} (${link.userId})`);
        return createdLink.save();
    }

    async canUnlink(userId: string, clanTag: string, playerTag: string) {
        const clan = (await this.redis.json.get(`C${clanTag}`)) as unknown as APIClan;
        if (!clan) throw new HttpException('Targe clan not found.', 404);

        const [links, target] = await Promise.all([
            this.playerLinkModel.find({ userId, verified: true }),
            this.playerLinkModel.findOne({ tag: playerTag })
        ]);

        if (!target) throw new HttpException('Target player not found.', 404);
        if (target.userId !== userId && target.verified) {
            throw new HttpException('You cannot unlink an account that is verified.', 403);
        }

        const tags = links.map((link) => link.tag);
        const isLeader = clan.memberList.some((member) => tags.includes(member.tag) && ['leader', 'coLeader'].includes(member.role));
        if (!isLeader) {
            throw new HttpException('You can only unlink, if you are a verified Leader/Co-Leader in the clan.', 403);
        }

        const memberIsInClan = clan.memberList.some((member) => member.tag === playerTag);
        if (!memberIsInClan) throw new HttpException('The player is no longer in your clan.', 403);

        this.logger.log(`Deleting link ${target.name} (${target.tag}) - ${target.username} (${target.userId}) by ${userId}`);

        return isLeader;
    }

    async remove(tag: string) {
        await this.playerLinkModel.deleteOne({ tag });
        return { message: 'OK' };
    }
}
