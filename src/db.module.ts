import { Module } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

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
