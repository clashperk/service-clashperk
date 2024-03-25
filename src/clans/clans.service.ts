import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { APIClan, APIPlayer } from 'clashofclans.js';
import { Db } from 'mongodb';
import { Model } from 'mongoose';
import { Collections } from '../db.module';
import { RedisClient } from '../redis.module';
import { CapitalDonation, CapitalDonationDocument } from './schemas/capital.schema';

const deletableRoles = ['leader', 'coLeader'];

@Injectable()
export class ClansService {
    constructor(
        @InjectModel(CapitalDonation.name) private capitalDonationModel: Model<CapitalDonationDocument>,
        @Inject('REDIS_CONNECTION') private redis: RedisClient,
        @Inject('DATABASE_CONNECTION') private db: Db
    ) {}

    async getCapitalDonations(clanTag: string): Promise<CapitalDonation[]> {
        const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
        return this.capitalDonationModel
            .find({ 'clan.tag': clanTag, 'createdAt': { $gte: createdAt } })
            .sort({ _id: -1 })
            .exec();
    }

    public async getClanFromRedis(clanTag: string) {
        const raw = await this.redis.json.mGet([`CLAN:${clanTag}`, `C${clanTag}`], '$');
        return raw.flat().filter((_) => _)[0] as unknown as APIClan | null;
    }

    async getClanMembers(authUserId: string, clanTag: string) {
        const clan = await this.getClanFromRedis(clanTag);
        if (!clan) throw new HttpException('Not found', 404);
        const raw = await this.redis.json.mGet(clan.memberList.map((mem) => [`P${mem.tag}`, `PLAYER:${mem.tag}`]).flat(), '$');

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

        const collection = this.db.collection(Collections.PLAYER_LINKS);
        const [links, userLinks] = await Promise.all([
            collection.find({ tag: { $in: memberList.map((mem) => mem.tag) } }).toArray(),
            collection.find({ userId: authUserId, verified: true }).toArray()
        ]);
        const userTags = userLinks.map((link) => link.tag);

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
                return {
                    ...member,
                    userId: user?.userId,
                    username: user?.username,
                    verified: user?.verified,
                    deletable: userTags.some((tag) => membersMap[tag] && deletableRoles.includes(membersMap[tag].role))
                };
            })
        };
    }
}
