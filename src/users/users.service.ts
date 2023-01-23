import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    async findOne(username: string) {
        return { username, password: process.env.PASSWORD };
    }
}
