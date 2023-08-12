import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
    id: string;
}

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
});
