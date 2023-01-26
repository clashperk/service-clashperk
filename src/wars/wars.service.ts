import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClanWar, ClanWarDocument } from './schemas/wars.schema';
import { WarHistory } from './wars.types';

@Injectable()
export class WarsService {
    constructor(@InjectModel(ClanWar.name) private clanWarModel: Model<ClanWarDocument>) {}

    async getOne(tag: string) {
        const cursor = this.clanWarModel.aggregate<WarHistory>([
            {
                $match: {
                    $or: [
                        {
                            'clan.members.tag': tag
                        },
                        {
                            'opponent.members.tag': tag
                        }
                    ]
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $limit: 30
            },
            {
                $set: {
                    members: {
                        $filter: {
                            input: {
                                $concatArrays: ['$opponent.members', '$clan.members']
                            },
                            as: 'member',
                            cond: {
                                $eq: ['$$member.tag', tag]
                            }
                        }
                    }
                }
            },
            {
                $set: {
                    defenderTags: {
                        $arrayElemAt: ['$members.attacks.defenderTag', 0]
                    }
                }
            },
            {
                $set: {
                    defenders: {
                        $filter: {
                            input: {
                                $concatArrays: ['$opponent.members', '$clan.members']
                            },
                            as: 'member',
                            cond: {
                                $in: [
                                    '$$member.tag',
                                    {
                                        $cond: [{ $anyElementTrue: [['$defenderTags']] }, '$defenderTags', []]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    startTime: 1,
                    endTime: 1,
                    clan: {
                        name: 1,
                        tag: 1
                    },
                    opponent: {
                        name: 1,
                        tag: 1
                    },
                    members: {
                        tag: 1,
                        name: 1,
                        townhallLevel: 1,
                        mapPosition: 1,
                        attacks: {
                            stars: 1,
                            defenderTag: 1,
                            destructionPercentage: 1
                        }
                    },
                    defenders: {
                        tag: 1,
                        townhallLevel: 1,
                        mapPosition: 1
                    }
                }
            }
        ]);

        const wars = await cursor.exec();

        const history = [];
        for (const war of wars) {
            const attacker = war.members[0];
            const attacks = (attacker.attacks ?? []).map((attack) => {
                const defender = war.defenders.find((defender) => defender.tag === attack.defenderTag);
                return { ...attack, defender };
            });
            history.push({
                startTime: war.startTime,
                endTime: war.endTime,
                clan: war.clan,
                opponent: war.opponent,
                attacker: {
                    name: attacker.name,
                    tag: attacker.tag,
                    townhallLevel: attacker.townhallLevel,
                    mapPosition: attacker.mapPosition
                },
                attacks
            });
        }

        return history;
    }

    async getWar(id: string) {
        const data = await this.clanWarModel.findOne({ id: Number(id) });
        if (!data) throw new HttpException('Not Found', 404);
        return data;
    }
}
