import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Db } from 'mongodb';

export const encrypt = async (value: string) => {
    const key = Buffer.from(process.env.CRYPTO_KEY, 'hex');
    const iv = Buffer.from(process.env.CRYPTO_IV, 'hex');
    const cipher = crypto.createCipheriv('aes256', key, iv);
    return Buffer.concat([cipher.update(value), cipher.final()]).toString('hex');
};

export const decrypt = async (value: string) => {
    const key = Buffer.from(process.env.CRYPTO_KEY, 'hex');
    const iv = Buffer.from(process.env.CRYPTO_IV, 'hex');
    const decipher = crypto.createDecipheriv('aes256', key, iv);
    return Buffer.concat([decipher.update(Buffer.from(value, 'hex')), decipher.final()]).toString();
};

@Injectable()
export class AppService {
    constructor(@Inject('DATABASE_CONNECTION') private readonly db: Db) {}

    getHello(): string {
        return 'Hello World!';
    }

    async getBots() {
        const bots = await this.db
            .collection('CustomBots')
            .find()
            .project({
                name: 0,
                serviceId: 0,
                patronId: 0,
                userId: 0,
                updatedAt: 0,
                createdAt: 0
            })
            .toArray();

        return { payload: await encrypt(JSON.stringify(bots)) };
    }
}
