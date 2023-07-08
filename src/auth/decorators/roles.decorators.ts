import { SetMetadata } from '@nestjs/common';

export enum Role {
    User = 'user',
    Admin = 'admin',
    AppUser = 'appUser'
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN_KEY = 'roles';
export const Admin = (...roles: Role[]) => SetMetadata(ADMIN_KEY, roles);
