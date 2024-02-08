import { HttpException, Inject, Injectable } from '@nestjs/common';
import { AnyBulkWriteOperation, Db, ObjectId } from 'mongodb';
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

    async getClans(guildId: string) {
        const categories = await this.db.collection(Collections.CLAN_CATEGORIES).find({ guildId }).sort({ order: 1 }).toArray();
        const clans = await this.db.collection(Collections.CLAN_STORES).find({ guild: guildId }).sort({ order: 1 }).toArray();
        const categoryIds = categories.map((category) => category._id.toHexString());
        const categoryMap = Object.fromEntries(categories.map((cat) => [cat._id.toHexString(), cat]));

        const clansReduced = clans.reduce<Record<string, any[]>>((prev, curr) => {
            let categoryId = curr.categoryId?.toHexString() || 'general';
            if (!categoryIds.includes(categoryId)) categoryId = 'general';

            prev[categoryId] ??= [];
            prev[categoryId].push({
                _id: curr._id,
                name: curr.name,
                tag: curr.tag,
                order: curr.order ?? 0,
                guildId: curr.guild
            });
            return prev;
        }, {});

        const clansGrouped = Object.entries(clansReduced).map(([categoryId, clans]) => ({
            _id: categoryMap[categoryId]?._id || 'general',
            name: categoryMap[categoryId]?.displayName || 'General',
            order: categoryMap[categoryId]?.order || 0,
            clans
        }));

        for (const categoryId of categoryIds) {
            const category = categoryMap[categoryId];
            if (category && !(categoryId in clansReduced)) {
                clansGrouped.push({
                    _id: category._id,
                    name: category.displayName,
                    order: category.order,
                    clans: []
                });
            }
        }
        clansGrouped.sort((a, b) => a.order - b.order);

        return {
            categories: categories.map((category) => ({
                _id: category._id,
                name: category.displayName,
                order: category.order,
                guildId: category.guildId
            })),
            grouped: clansGrouped,
            clans: clans.map((clan) => ({
                _id: clan._id,
                name: clan.name,
                tag: clan.tag,
                order: clan.order,
                guildId: clan.guild
            }))
        };
    }

    async updateClanCategories(
        clanGroup: {
            _id: string | ObjectId;
            name: any;
            order: any;
            clans: any[];
        }[],
        guildId: string
    ) {
        const clanOps: AnyBulkWriteOperation<any>[] = [];
        const categoryOps: AnyBulkWriteOperation<any>[] = [];

        const clans = clanGroup
            .flatMap((cg) => cg.clans.map((clan) => ({ ...clan, categoryId: cg._id })))
            .sort((a, b) => {
                if (a.categoryId === 'general' && b.categoryId !== 'general') {
                    return -1; // a comes before b
                } else if (a.categoryId !== 'general' && b.categoryId === 'general') {
                    return 1; // b comes before a
                } else {
                    return 0; // maintain original order if neither or both are 'general'
                }
            });

        clans.forEach((clan, order) => {
            clanOps.push({
                updateOne: {
                    filter: { _id: new ObjectId(clan._id), guild: guildId },
                    update: {
                        $set: {
                            order,
                            categoryId: ObjectId.isValid(clan.categoryId) ? new ObjectId(clan.categoryId) : null
                        }
                    }
                }
            });
        });

        clanGroup.forEach((cat, order) => {
            if (ObjectId.isValid(cat._id)) {
                categoryOps.push({
                    updateOne: {
                        filter: { _id: new ObjectId(cat._id), guildId },
                        update: {
                            $set: {
                                order: order
                            }
                        }
                    }
                });
            }
        });

        await this.db.collection(Collections.CLAN_STORES).bulkWrite(clanOps);
        await this.db.collection(Collections.CLAN_CATEGORIES).bulkWrite(categoryOps);
        await this.db.collection(Collections.SETTINGS).updateOne({ guildId }, { $set: { clansSortingKey: 'order' } });

        return this.getClans(guildId);
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
