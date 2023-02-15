import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { APIClanWar, APIWarClan } from 'clashofclans.js';
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
            summary: {
                season: string;
                wars: number;
                rounds: number;
                stars: number;
                attacks: number;
                missed: number;
                destruction: number;
            }[];
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
                            .subtract(new Date().getDate() >= 10 ? 3 : 4, 'month')
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
                                        $set: {
                                            stars: {
                                                $sum: {
                                                    $max: ['$members.attacks.stars', 0]
                                                }
                                            },
                                            destruction: {
                                                $sum: {
                                                    $max: ['$members.attacks.destructionPercentage', 0]
                                                }
                                            },
                                            attacks: {
                                                $sum: {
                                                    $cond: [{ $eq: ['$members.attacks.stars', 0] }, 0, 1]
                                                }
                                            },
                                            missed: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $anyElementTrue: [['$members.attacks']]
                                                        },
                                                        0,
                                                        1
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $set: {
                                wars: {
                                    $size: '$wars'
                                },
                                stars: {
                                    $sum: '$wars.stars'
                                },
                                attacks: {
                                    $sum: '$wars.attacks'
                                },
                                missed: {
                                    $sum: '$wars.missed'
                                },
                                destruction: {
                                    $sum: '$wars.destruction'
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
                                missed: 1,
                                destruction: 1,
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
            const attacker = war.members.at(0);
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

    async getWar(id: string, clanTag?: string) {
        const body = (
            await this.clanWarModel.findOne(
                { id: Number(id) },
                { uid: 0, warType: 0, id: 0, updatedAt: 0, createdAt: 0, season: 0, _id: 0 }
            )
        ).toJSON() as unknown as APIClanWar;
        if (!body) throw new HttpException('Not Found', 404);

        const clan = [body.clan.tag, body.opponent.tag].includes(clanTag)
            ? body.clan.tag === clanTag
                ? body.clan
                : body.opponent
            : body.clan;
        const opponent = body.clan.tag === clan.tag ? body.opponent : body.clan;

        const __attacks = clan.members
            .filter((member) => member.attacks?.length)
            .map((m) => m.attacks)
            .flat()
            .sort((a, b) => a.order - b.order)
            .map((atk, _, __attacks) => {
                const defender = opponent.members.find((m) => m.tag === atk.defenderTag);
                const defenderDefenses = __attacks.filter((atk) => atk.defenderTag === defender.tag);
                const isFresh = defenderDefenses.length === 0 || atk.order === Math.min(...defenderDefenses.map((d) => d.order));
                const previousBestAttack = isFresh
                    ? null
                    : [...__attacks]
                          .filter(
                              (_atk) => _atk.defenderTag === defender.tag && _atk.order < atk.order && _atk.attackerTag !== atk.attackerTag
                          )
                          .sort((a, b) => b.destructionPercentage ** b.stars - a.destructionPercentage ** a.stars)
                          .at(0) ?? null;

                return {
                    ...atk,
                    isFresh,
                    oldStars: previousBestAttack?.stars ?? 0,
                    defender: {
                        name: defender.name,
                        tag: defender.tag,
                        townhallLevel: defender.townhallLevel,
                        mapPosition: defender.mapPosition
                    }
                };
            });

        const __defenses = opponent.members
            .filter((member) => member.attacks?.length)
            .map((m) => m.attacks)
            .flat()
            .sort((a, b) => a.order - b.order)
            .map((atk, _, __defenses) => {
                const defender = clan.members.find((m) => m.tag === atk.defenderTag);
                const defenderDefenses = __defenses.filter((atk) => atk.defenderTag === defender.tag);
                const isFresh = defenderDefenses.length === 0 || atk.order === Math.min(...defenderDefenses.map((d) => d.order));
                const previousBestAttack = isFresh
                    ? null
                    : [...__defenses]
                          .filter(
                              (_atk) => _atk.defenderTag === defender.tag && _atk.order < atk.order && _atk.attackerTag !== atk.attackerTag
                          )
                          .sort((a, b) => b.destructionPercentage ** b.stars - a.destructionPercentage ** a.stars)
                          .at(0) ?? null;

                return {
                    ...atk,
                    isFresh,
                    oldStars: previousBestAttack?.stars ?? 0,
                    defender: {
                        name: defender.name,
                        tag: defender.tag,
                        townhallLevel: defender.townhallLevel,
                        mapPosition: defender.mapPosition
                    }
                };
            });

        clan.members.sort((a, b) => a.mapPosition - b.mapPosition).map((member, n) => ({ ...member, mapPosition: n + 1 }));
        opponent.members.sort((a, b) => a.mapPosition - b.mapPosition).map((member, n) => ({ ...member, mapPosition: n + 1 }));

        return {
            ...body,
            clan: {
                ...clan,
                members: clan.members.map((member) => {
                    const attacks = __attacks.filter((a) => a.attackerTag === member.tag);
                    const defenses = __defenses.filter((d) => d.defenderTag === member.tag);

                    return {
                        name: member.name,
                        tag: member.tag,
                        townhallLevel: member.townhallLevel,
                        mapPosition: member.mapPosition,
                        attacks,
                        defenses
                    };
                })
            },
            opponent: {
                ...opponent,
                members: opponent.members.map((member) => {
                    const attacks = __defenses.filter((a) => a.attackerTag === member.tag);
                    const defenses = __attacks.filter((d) => d.defenderTag === member.tag);
                    return {
                        name: member.name,
                        tag: member.tag,
                        townhallLevel: member.townhallLevel,
                        mapPosition: member.mapPosition,
                        attacks,
                        defenses
                    };
                })
            },
            result: this.getWarResult(clan, opponent)
        };
    }

    private getWarResult(clan: APIWarClan, opponent: APIWarClan) {
        if (clan.stars === opponent.stars) {
            if (clan.destructionPercentage === opponent.destructionPercentage) return 'tied';
            if (clan.destructionPercentage > opponent.destructionPercentage) return 'won';
        }
        if (clan.stars > opponent.stars) return 'won';
        return 'lost';
    }
}
