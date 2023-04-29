import { HttpException, Inject, Injectable } from '@nestjs/common';
import { APIClan, APIPlayer } from 'clashofclans.js';
import { Db, ObjectId } from 'mongodb';
import { fetch } from 'undici';
import { Collections } from '../db.module';
import { RedisClient } from '../redis.module';

@Injectable()
export class GuildsService {
    constructor(@Inject('DATABASE_CONNECTION') private readonly db: Db, @Inject('REDIS_CONNECTION') private readonly redis: RedisClient) {}

    async getGuild(guildId: string) {
        const guild = await this.db
            .collection(Collections.BOT_GUILDS)
            .aggregate([
                {
                    $match: {
                        guild: guildId
                    }
                },
                {
                    $lookup: {
                        from: Collections.CLAN_STORES,
                        localField: 'guild',
                        foreignField: 'guild',
                        as: 'clans',
                        pipeline: [
                            {
                                $sort: { name: 1 }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        name: 1,
                        id: '$guild',
                        clans: {
                            name: 1,
                            tag: 1
                        }
                    }
                }
            ])
            .next();

        if (!guild) throw new HttpException('Not Found', 404);
        return guild;
    }

    async getMembers(guildId: string, query: string) {
        const res = await fetch(`https://discord.com/api/guilds/${guildId}/members/search?query=${query}&limit=50`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`
            }
        });
        return await res.json();
    }

    async createRoster(
        guildId: string,
        roster: {
            clanTag: string;
            title: string;
            category: string;
        }
    ) {
        const clan = (await this.redis.json.get(`C${roster.clanTag}`)) as unknown as APIClan;
        if (!clan) throw new HttpException('Not found', 404);

        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        await collection.insertOne({
            tag: clan.tag,
            name: clan.name,
            title: roster.title,
            category: roster.category,
            guildId: guildId,
            members: []
        });

        return { message: 'OK' };
    }

    async getRosters(guildId: string) {
        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        return collection.find({ guildId }).toArray();
    }

    async getRoster(guildId: string, rosterId: string) {
        if (!ObjectId.isValid(rosterId)) throw new HttpException('Not Found', 404);

        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        const roster = await collection.findOne({ guildId, _id: new ObjectId(rosterId) });
        if (!roster) throw new HttpException('Not Found', 404);

        const raw = roster.members.length
            ? await this.redis.json.mGet(
                  roster.members.map((tag) => `P${tag}`),
                  '$'
              )
            : [];

        const players = raw.filter((_) => _).flat() as unknown as APIPlayer[];
        const members = players.map((player) => ({
            tag: player.tag,
            name: player.name,
            role: player.role,
            townHallLevel: player.townHallLevel
        }));

        return {
            roster,
            members
        };
    }
}
