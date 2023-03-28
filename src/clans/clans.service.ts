import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { APIClan, APIPlayer } from 'clashofclans.js';
import { Db } from 'mongodb';
import { Model } from 'mongoose';
import { RedisClient } from '../redis.module';
import { CapitalDonation, CapitalDonationDocument } from './schemas/capital.schema';

@Injectable()
export class ClansService {
    constructor(
        @InjectModel(CapitalDonation.name) private capitalDonationModel: Model<CapitalDonationDocument>,
        @Inject('REDIS_CONNECTION') private redis: RedisClient,
        @Inject('DATABASE_CONNECTION') private db: Db
    ) {}

    async getCapitalDonations(clanTag: string): Promise<CapitalDonation[]> {
        const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
        return this.capitalDonationModel
            .find({ 'clan.tag': clanTag, 'createdAt': { $gte: createdAt } })
            .sort({ _id: -1 })
            .exec();
    }

    async getClanMembers(clanTag: string) {
        const clan = (await this.redis.json.get(`C${clanTag}`)) as unknown as APIClan;
        if (!clan) throw new HttpException('Not found', 404);
        const raw = await this.redis.json.mGet(
            clan.memberList.map((mem) => `P${mem.tag}`),
            '$'
        );

        const membersMap = clan.memberList.reduce((acc, cur) => {
            acc[cur.tag] = cur;
            return acc;
        }, {});

        const players = raw.filter((_) => _).flat() as unknown as APIPlayer[];
        const memberList = players.map((player) => ({
            tag: player.tag,
            name: player.name,
            role: membersMap[player.tag].role,
            townHallLevel: player.townHallLevel
        }));

        const links = await this.db
            .collection('PlayerLinks')
            .find({ tag: { $in: memberList.map((mem) => mem.tag) } })
            .toArray();
        const linksMap = links.reduce((acc, cur) => {
            acc[cur.tag] = cur;
            return acc;
        }, {});

        return {
            name: clan.name,
            tag: clan.tag,
            members: clan.members,
            memberList: memberList.map((member) => {
                const user = linksMap[member.tag];
                return { ...member, userId: user?.userId, username: user?.username, verified: user?.verified };
            })
        };
    }
}
