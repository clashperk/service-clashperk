import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
    protected getTracker(req: Request): string {
        // Individualize IP extraction to meet your own needs
        return req.ips.length ? req.ips[0] : req.ip;
    }

    // async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
    //     const request = context.switchToHttp().getRequest<Request>();
    //     console.log(this.getTracker(request));

    //     const suffix = request.headers['authorization'] ?? (request.ips.length ? request.ips[0] : request.ip);
    //     const key = this.generateKey(context, suffix);
    //     const { totalHits } = await this.storageService.increment(key, ttl);

    //     if (totalHits > limit) throw new ThrottlerException();

    //     return Promise.resolve(true);
    // }
}
