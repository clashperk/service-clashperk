import { Module } from '@nestjs/common';
import * as Redis from 'redis';

export type RedisClient = ReturnType<typeof Redis.createClient>;

@Module({
    providers: [
        {
            provide: 'REDIS_CONNECTION',
            useFactory: async (): Promise<RedisClient> => {
                try {
                    const redis = Redis.createClient({
                        url: process.env.REDIS_URL,
                        database: 0
                    });

                    await redis.connect();
                    return redis;
                } catch (e) {
                    throw e;
                }
            }
        }
    ],
    exports: ['REDIS_CONNECTION']
})
export class RedisModule {}
