import { Prop, Schema as SchemaType, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema } from 'mongoose';

export type ClanWarDocument = HydratedDocument<ClanWar>;

// Don't have the time to write a proper schema. xD

@SchemaType()
export class ClanWar {
    @Prop()
    id: number;

    @Prop({ type: Schema.Types.Mixed })
    clan: {
        members: {
            tag: string;
        };
    };

    @Prop({ type: Schema.Types.Mixed })
    opponent: {
        members: {
            tag: string;
        };
    };
}

export const ClanWarSchema = SchemaFactory.createForClass(ClanWar);
