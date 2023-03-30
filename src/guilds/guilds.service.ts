import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { fetch } from 'undici';
import { Collections } from '../db.module';

@Injectable()
export class GuildsService {
    constructor(@Inject('DATABASE_CONNECTION') private readonly db: Db) {}

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
                        as: 'clans'
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
}
