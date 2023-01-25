import { Test, TestingModule } from '@nestjs/testing';
import { WarsService } from './wars.service';

describe('WarsService', () => {
  let service: WarsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WarsService],
    }).compile();

    service = module.get<WarsService>(WarsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
