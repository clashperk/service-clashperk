import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlayerLinkDocument = HydratedDocument<PlayerLink>;

@Schema()
export class PlayerLink {
    @Prop()
    userId: string;

    @Prop()
    username: string;

    @Prop()
    displayName: string;

    @Prop()
    discriminator: string;

    @Prop()
    name: string;

    @Prop()
    tag: string;

    @Prop()
    source: string;

    @Prop()
    order: number;

    @Prop()
    verified: boolean;

    @Prop()
    createdAt: Date;
}

export const PlayerLinkSchema = SchemaFactory.createForClass(PlayerLink);
