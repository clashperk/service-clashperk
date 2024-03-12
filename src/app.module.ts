import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClansModule } from './clans/clans.module';
import { DatabaseModule } from './db.module';
import { GuildsModule } from './guilds/guilds.module';
import { HealthController } from './health.controller';
import { LinksModule } from './links/links.module';
import { RedisModule } from './redis.module';
import { RostersModule } from './rosters/rosters.module';
import { UsersModule } from './users/users.module';
import { WarsModule } from './wars/wars.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URL')
            }),
            inject: [ConfigService]
        }),
        ThrottlerModule.forRoot({
            ttl: 10,
            limit: 30
        }),
        DatabaseModule,
        RedisModule,
        UsersModule,
        AuthModule,
        LinksModule,
        WarsModule,
        ClansModule,
        GuildsModule,
        RostersModule,
        TerminusModule
    ],
    controllers: [HealthController, AppController],
    providers: [AppService]
})
export class AppModule {}
