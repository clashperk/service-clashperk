export interface WarHistory {
    id: number;
    warType: number;
    startTime: string;
    endTime: string;
    clan: {
        name: string;
        tag: string;
    };
    opponent: {
        name: string;
        tag: string;
    };
    members: {
        name: string;
        tag: string;
        townhallLevel: number;
        mapPosition: number;
        attacks?: {
            stars: number;
            defenderTag: string;
            destructionPercentage: number;
        }[];
    }[];
    defenders: {
        tag: string;
        townhallLevel: number;
        mapPosition: number;
    }[];
}
