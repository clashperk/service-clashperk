import { Module } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

export const enum Collections {
    CLAN_STORES = 'ClanStores',
    DONATION_LOGS = 'DonationLogs',
    LAST_SEEN_LOGS = 'LastSeenLogs',
    CLAN_GAMES_LOGS = 'ClanGamesLogs',
    CLAN_EMBED_LOGS = 'ClanEmbedLogs',
    CLAN_FEED_LOGS = 'ClanFeedLogs',
    JOIN_LEAVE_LOGS = 'JoinLeaveLogs',
    CLAN_WAR_LOGS = 'ClanWarLogs',
    LEGEND_LOGS = 'LegendLogs',
    LEGEND_ATTACKS = 'LegendAttacks',

    CAPITAL_LOGS = 'CapitalLogs',

    EVENT_LOGS = 'EventLogs',

    FLAGS = 'Flags',

    PLAYER_LINKS = 'PlayerLinks',
    USERS = 'Users',

    REMINDERS = 'Reminders',
    SCHEDULERS = 'Schedulers',
    RAID_REMINDERS = 'RaidReminders',
    CG_REMINDERS = 'ClanGamesReminders',
    CG_SCHEDULERS = 'ClanGamesSchedulers',
    RAID_SCHEDULERS = 'RaidSchedulers',

    WAR_BASE_CALLS = 'WarBaseCalls',

    PATRONS = 'Patrons',
    SETTINGS = 'Settings',
    LAST_SEEN = 'LastSeen',
    CLAN_WARS = 'ClanWars',
    CLAN_GAMES = 'ClanGames',
    CWL_GROUPS = 'CWLGroups',

    PLAYER_RANKS = 'PlayerRanks',
    CAPITAL_RANKS = 'CapitalRanks',
    CLAN_RANKS = 'ClanRanks',

    CLAN_MEMBERS = 'ClanMembers',
    CLAN_GAMES_POINTS = 'ClanGamesPoints',
    PLAYER_SEASONS = 'PlayerSeasons',
    CAPITAL_CONTRIBUTIONS = 'CapitalContributions',
    CAPITAL_RAID_SEASONS = 'CapitalRaidSeasons',

    BOT_GROWTH = 'BotGrowth',
    BOT_USAGE = 'BotUsage',
    BOT_GUILDS = 'BotGuilds',
    BOT_USERS = 'BotUsers',
    BOT_STATS = 'BotStats',
    BOT_COMMANDS = 'BotCommands',
    BOT_INTERACTIONS = 'BotInteractions'
}

@Module({
    providers: [
        {
            provide: 'DATABASE_CONNECTION',
            useFactory: async (): Promise<Db> => {
                try {
                    const client = await MongoClient.connect(process.env.MONGODB_URL);
                    return client.db('clashperk');
                } catch (e) {
                    throw e;
                }
            }
        }
    ],
    exports: ['DATABASE_CONNECTION']
})
export class DatabaseModule {}
