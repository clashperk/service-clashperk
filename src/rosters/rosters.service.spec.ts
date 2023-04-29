import { Test, TestingModule } from '@nestjs/testing';
import { RostersService } from './rosters.service';

describe('RostersService', () => {
    let service: RostersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RostersService]
        }).compile();

        service = module.get<RostersService>(RostersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
