import { Client as ElasticClient } from '@elastic/elasticsearch';
import { Module } from '@nestjs/common';
import * as Redis from 'redis';

export type RedisClient = ReturnType<typeof Redis.createClient>;

@Module({
    providers: [
        {
            provide: 'ELASTIC_CONNECTION',
            useFactory: async (): Promise<ElasticClient> => {
                const elastic = new ElasticClient({
                    node: process.env.ES_HOST,
                    auth: {
                        username: 'elastic',
                        password: process.env.ES_PASSWORD
                    },
                    tls: {
                        ca: process.env.ES_CA_CRT,
                        rejectUnauthorized: false
                    }
                });
                return elastic;
            }
        }
    ],
    exports: ['ELASTIC_CONNECTION']
})
export class RedisModule {}
