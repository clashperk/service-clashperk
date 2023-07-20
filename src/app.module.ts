import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClansModule } from './clans/clans.module';
import { GuildsModule } from './guilds/guilds.module';
import { LinksModule } from './links/links.module';
import { RedisModule } from './redis.module';
import { RostersModule } from './rosters/rosters.module';
import { UsersModule } from './users/users.module';
import { WarsModule } from './wars/wars.module';
import { DatabaseModule } from './db.module';

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
            ttl: 60,
            limit: 10
        }),
        DatabaseModule,
        RedisModule,
        UsersModule,
        AuthModule,
        LinksModule,
        WarsModule,
        ClansModule,
        GuildsModule,
        RostersModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
