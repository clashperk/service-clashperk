import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

export class DeleteLinkInput {
    @IsNotEmpty()
    clanTag: string;

    @IsNotEmpty()
    tag: string;
}

export class BulkActionInput {
    @IsArray()
    @ArrayNotEmpty()
    items: string[];
}
