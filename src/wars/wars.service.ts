import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { APIClan, APIClanWar, APIClanWarAttack, APIPlayer, APIWarClan } from 'clashofclans.js';
import moment from 'moment';
import { Db } from 'mongodb';
import { Model } from 'mongoose';
import { Collections } from '../db.module';
import { RedisClient } from '../redis.module';
import { ClanWar, ClanWarDocument } from './schemas/wars.schema';
import { WarHistory } from './wars.types';

@Injectable()
export class WarsService {
    constructor(
        @InjectModel(ClanWar.name) private clanWarModel: Model<ClanWarDocument>,
        @Inject('DATABASE_CONNECTION') private readonly db: Db,
        @Inject('REDIS_CONNECTION') private readonly redis: RedisClient
    ) {}

    async getOne(tag: string, months?: number) {
        if (!isNaN(months) && (months < 0 || months > 6)) throw new HttpException('Invalid months', 400);
        if (isNaN(months)) months = new Date().getDate() >= 10 ? 3 : 4;

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
                        $gte: moment().startOf('month').subtract(months, 'month').toDate()
                    },
                    endTime: {
                        $lte: moment().toDate()
                    }
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
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
                                            ],
                                            endTime: {
                                                $lte: moment().toDate()
                                            }
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

    private getPreviousBestAttack(attacks: APIClanWarAttack[], opponent: APIWarClan, atk: APIClanWarAttack) {
        const defender = opponent.members.find((m) => m.tag === atk.defenderTag);
        const defenderDefenses = attacks.filter((atk) => atk.defenderTag === defender.tag);
        const isFresh = defenderDefenses.length === 0 || atk.order === Math.min(...defenderDefenses.map((d) => d.order));
        const previousBestAttack = isFresh
            ? null
            : [...attacks]
                  .filter((_atk) => _atk.defenderTag === defender.tag && _atk.order < atk.order && _atk.attackerTag !== atk.attackerTag)
                  .sort((a, b) => b.destructionPercentage ** b.stars - a.destructionPercentage ** a.stars)
                  .at(0) ?? null;
        return isFresh ? null : previousBestAttack;
    }

    public async getCWLStats(clanTag: string) {
        const body = await this.db
            .collection<{ warTags: Record<string, string[]>; season: string }>(Collections.CWL_GROUPS)
            .findOne({ 'clans.tag': clanTag }, { sort: { _id: -1 } });
        if (!body) throw new HttpException('Not Found', 404);

        const members: Record<
            string,
            {
                name: string;
                tag: string;
                participated: number;
                attacks: number;
                stars: number;
                destruction: number;
                trueStars: number;
                threeStars: number;
                twoStars: number;
                oneStar: number;
                zeroStars: number;
                missedAttacks: number;

                defenseStars: number;
                defenseDestruction: number;
                defenseCount: number;
            }
        > = {};
        const wars = await this.db
            .collection<APIClanWar>(Collections.CLAN_WARS)
            .find({ warTag: { $in: body.warTags[clanTag] } })
            .toArray();
        for (const data of wars) {
            if (!(data.clan.tag === clanTag || data.opponent.tag === clanTag)) continue;
            if (!['inWar', 'warEnded'].includes(data.state)) continue;

            const clan = data.clan.tag === clanTag ? data.clan : data.opponent;
            const opponent = data.clan.tag === clanTag ? data.opponent : data.clan;
            clan.members.sort((a, b) => a.mapPosition - b.mapPosition);
            opponent.members.sort((a, b) => a.mapPosition - b.mapPosition);

            const __attacks = clan.members.flatMap((m) => m.attacks ?? []);
            for (const m of clan.members) {
                members[m.tag] ??= {
                    name: m.name,
                    tag: m.tag,
                    participated: 0,
                    attacks: 0,
                    stars: 0,
                    trueStars: 0,
                    destruction: 0,
                    threeStars: 0,
                    twoStars: 0,
                    oneStar: 0,
                    zeroStars: 0,
                    missedAttacks: 0,

                    defenseStars: 0,
                    defenseDestruction: 0,
                    defenseCount: 0
                };

                const member = members[m.tag];
                member.participated += 1;

                for (const atk of m.attacks ?? []) {
                    const previousBestAttack = this.getPreviousBestAttack(__attacks, opponent, atk);
                    member.attacks += 1;
                    member.stars += atk.stars;
                    member.trueStars += previousBestAttack ? Math.max(0, atk.stars - previousBestAttack.stars) : atk.stars;
                    member.destruction += atk.destructionPercentage;
                    member.threeStars += atk.stars === 3 ? 1 : 0;
                    member.twoStars += atk.stars === 2 ? 1 : 0;
                    member.oneStar += atk.stars === 1 ? 1 : 0;
                    member.zeroStars += atk.stars === 0 ? 1 : 0;
                }

                member.missedAttacks += m.attacks?.length ? 0 : 1;

                if (m.bestOpponentAttack) {
                    member.defenseStars += m.bestOpponentAttack.stars;
                    member.defenseDestruction += m.bestOpponentAttack.destructionPercentage;
                    member.defenseCount += 1;
                }
            }
        }

        const clan = (await this.redis.json.get(`C${clanTag}`)) as unknown as APIClan;
        if (!clan) throw new HttpException('Clan Not Found', 404);

        const playerTags = [...new Set(clan.memberList.map((m) => m.tag)), ...Object.keys(members)];
        const raw = await this.redis.json.mGet(
            playerTags.map((tag) => `P${tag}`),
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
            role: membersMap[player.tag]?.role ?? null,
            warPreference: player.warPreference ?? null,
            townHallLevel: player.townHallLevel
        }));

        const collection = this.db.collection(Collections.PLAYER_LINKS);
        const links = await collection.find({ tag: { $in: memberList.map((mem) => mem.tag) } }).toArray();

        const linksMap = links.reduce((acc, cur) => {
            acc[cur.tag] = cur;
            return acc;
        }, {});

        return {
            name: clan.name,
            tag: clan.tag,
            season: body.season,
            members: memberList.map((member) => {
                const user = linksMap[member.tag];
                return {
                    ...member,
                    inClan: Boolean(membersMap[member.tag]),
                    discord: user ? { userId: user.userId, username: user.username, verified: user.verified } : null,
                    stats: members[member.tag] ?? null
                };
            })
        };
    }
}
