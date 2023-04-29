import { Test, TestingModule } from '@nestjs/testing';
import { RostersController } from './rosters.controller';

describe('RostersController', () => {
    let controller: RostersController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RostersController]
        }).compile();

        controller = module.get<RostersController>(RostersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
