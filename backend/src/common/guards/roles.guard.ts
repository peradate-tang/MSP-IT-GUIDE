import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Access denied');

    // admin always passes
    if (user.role === 'admin') return true;

    // wildcard permission
    if (user.permissions?.includes('*')) return true;

    // role name match (built-in roles like 'editor')
    if (requiredRoles.includes(user.role)) return true;

    // permission match (custom roles with specific permissions)
    if (user.permissions?.some((p: string) => requiredRoles.includes(p))) return true;

    throw new ForbiddenException('Insufficient permissions');
  }
}
