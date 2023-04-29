import { HttpException, Inject, Injectable } from '@nestjs/common';
import { APIPlayer } from 'clashofclans.js';
import { Db, ObjectId } from 'mongodb';
import { Collections } from '../db.module';
import { RedisClient } from '../redis.module';

@Injectable()
export class RostersService {
    public constructor(
        @Inject('DATABASE_CONNECTION') private readonly db: Db,
        @Inject('REDIS_CONNECTION') private readonly redis: RedisClient
    ) {}

    async getRoster(rosterId: string) {
        if (!ObjectId.isValid(rosterId)) throw new HttpException('Not Found', 404);

        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        const roster = await collection.findOne({ _id: new ObjectId(rosterId) });
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
            ...roster,
            members
        };
    }

    async deleteRoster(rosterId: string) {
        if (!ObjectId.isValid(rosterId)) throw new HttpException('Not Found', 404);

        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        const result = await collection.deleteOne({ _id: new ObjectId(rosterId) });
        if (!result.deletedCount) throw new HttpException('Not Found', 404);

        return { message: 'OK' };
    }

    async addMember(rosterId: string, playerTag: string) {
        if (!ObjectId.isValid(rosterId)) throw new HttpException('Not Found', 404);

        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        const result = await collection.updateOne(
            { _id: new ObjectId(rosterId) },
            {
                $addToSet: { members: playerTag }
            }
        );

        if (!result.matchedCount) throw new HttpException('Not Found', 404);
        return { message: 'OK' };
    }

    async removeMember(rosterId: string, playerTag: string) {
        if (!ObjectId.isValid(rosterId)) throw new HttpException('Not Found', 404);

        const collection = this.db.collection(Collections.CLAN_ROSTERS);
        const result = await collection.updateOne(
            { _id: new ObjectId(rosterId) },
            {
                $pull: { members: playerTag }
            }
        );

        if (!result.matchedCount) throw new HttpException('Not Found', 404);
        return { message: 'OK' };
    }
}
