import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService, HealthIndicatorResult, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
    constructor(private health: HealthCheckService, private memory: MemoryHealthIndicator) {}

    @Get()
    @HealthCheck()
    check(): Promise<HealthCheckResult> {
        return this.health.check([
            (): Promise<HealthIndicatorResult> => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
            (): Promise<HealthIndicatorResult> => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024)
        ]);
    }
}
