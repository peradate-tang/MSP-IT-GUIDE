import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // ไม่ throw error ถ้าไม่มี token — แค่ req.user = undefined
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
