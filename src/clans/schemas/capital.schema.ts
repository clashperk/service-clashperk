import { Prop, Schema as SchemaType, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema } from 'mongoose';

export type CapitalDonationDocument = HydratedDocument<CapitalDonation>;

@SchemaType()
export class CapitalDonation {
    @Prop()
    name: string;

    @Prop()
    tag: string;

    @Prop({ type: Schema.Types.Mixed })
    clan: {
        tag: string;
        name: string;
    };

    @Prop()
    season: string;

    @Prop()
    initial: number;

    @Prop()
    current: number;

    @Prop()
    createdAt: Date;
}

export const CapitalDonationSchema = SchemaFactory.createForClass(CapitalDonation);
