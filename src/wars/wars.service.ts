import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { Model } from 'mongoose';
import { ClanWar, ClanWarDocument } from './schemas/wars.schema';
import { WarHistory } from './wars.types';

@Injectable()
export class WarsService {
    constructor(@InjectModel(ClanWar.name) private clanWarModel: Model<ClanWarDocument>) {}

    async getOne(tag: string) {
        const cursor = this.clanWarModel.aggregate<{
            history: WarHistory[];
            summary: { season: string; wars: number; rounds: number; stars: number; attacks: number }[];
        }>([
            {
                $match: {
                    $or: [
                        {
                            'clan.members.tag': tag
                        },
                        {
                            'opponent.members.tag': tag
                        }
                    ],
                    preparationStartTime: {
                        $gte: moment()
                            .startOf('month')
                            .subtract(new Date().getDate() >= 10 ? 2 : 3, 'month')
                            .toDate()
                    }
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            // {
            //     $sort: {
            //         endTime: -1
            //     }
            // },
            // {
            //     $limit: 30
            // },
            {
                $facet: {
                    history: [
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
                                id: 1,
                                warType: 1,
                                startTime: '$preparationStartTime',
                                endTime: '$preparationStartTime',
                                clan: {
                                    $cond: [
                                        {
                                            $in: [tag, '$clan.members.tag']
                                        },
                                        {
                                            name: '$clan.name',
                                            tag: '$clan.tag'
                                        },
                                        {
                                            name: '$opponent.name',
                                            tag: '$opponent.tag'
                                        }
                                    ]
                                },
                                opponent: {
                                    $cond: [
                                        {
                                            $in: [tag, '$clan.members.tag']
                                        },
                                        {
                                            name: '$opponent.name',
                                            tag: '$opponent.tag'
                                        },
                                        {
                                            name: '$clan.name',
                                            tag: '$clan.tag'
                                        }
                                    ]
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
                    ],
                    summary: [
                        {
                            $group: {
                                _id: '$leagueGroupId',
                                leagueGroupId: {
                                    $first: '$leagueGroupId'
                                },
                                season: {
                                    $first: '$season'
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'ClanWars',
                                localField: 'leagueGroupId',
                                foreignField: 'leagueGroupId',
                                as: 'wars',
                                pipeline: [
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
                                        $project: {
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
                                        $sort: {
                                            _id: -1
                                        }
                                    },
                                    {
                                        $unwind: '$members'
                                    },
                                    {
                                        $project: {
                                            stars: {
                                                $sum: {
                                                    $max: ['$members.attacks.stars', 0]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $set: {
                                            attacks: {
                                                $sum: {
                                                    $cond: [{ $eq: ['$stars', 0] }, 0, 1]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $set: {
                                attacks: {
                                    $sum: '$wars.attacks'
                                },
                                stars: {
                                    $sum: '$wars.stars'
                                },
                                wars: {
                                    $size: '$wars'
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'CWLGroups',
                                localField: 'leagueGroupId',
                                foreignField: 'id',
                                as: 'leagueGroup',
                                pipeline: [
                                    {
                                        $project: {
                                            rounds: {
                                                $subtract: [
                                                    {
                                                        $size: '$clans'
                                                    },
                                                    1
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: {
                                path: '$leagueGroup'
                            }
                        },
                        {
                            $project: {
                                attacks: 1,
                                season: 1,
                                wars: 1,
                                stars: 1,
                                rounds: '$leagueGroup.rounds'
                            }
                        },
                        {
                            $sort: {
                                season: -1
                            }
                        }
                    ]
                }
            }
        ]);

        const [{ history, summary }] = await cursor.exec();

        const wars = [];
        for (const war of history) {
            const attacker = war.members[0];
            const attacks = (attacker.attacks ?? []).map((attack) => {
                const defender = war.defenders.find((defender) => defender.tag === attack.defenderTag);
                return { ...attack, defender };
            });
            wars.push({
                id: war.id,
                warType: war.warType,
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

        return { wars, summary };
    }

    async getWar(id: string) {
        const data = await this.clanWarModel.findOne({ id: Number(id) });
        if (!data) throw new HttpException('Not Found', 404);
        return data;
    }
}
