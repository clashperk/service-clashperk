import { IsNotEmpty } from 'class-validator';

export class CreateLinkInput {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    tag: string;

    @IsNotEmpty()
    userId: string;

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    displayName: string;

    @IsNotEmpty()
    discriminator: string;
}
