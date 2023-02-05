import { Test, TestingModule } from '@nestjs/testing';
import { ClansController } from './clans.controller';

describe('ClansController', () => {
    let controller: ClansController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ClansController]
        }).compile();

        controller = module.get<ClansController>(ClansController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
