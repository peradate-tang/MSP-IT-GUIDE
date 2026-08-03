import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config),
    });
  }

  async validate(payload: any) {
    // ดึง role/permissions/สถานะบัญชีล่าสุดจาก DB ทุกครั้ง แทนที่จะเชื่อค่าที่ฝังไว้ใน token ตอน login
    // ป้องกันกรณี admin ปิดบัญชีหรือเปลี่ยนสิทธิ์ผู้ใช้แล้ว แต่ token เก่า (อายุ 7 วัน) ยังใช้สิทธิ์เดิมได้อยู่
    const user = await this.usersService.findByUsername(payload.username).catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('บัญชีถูกระงับหรือไม่พบผู้ใช้งานนี้แล้ว');
    }

    return {
      sub: user.id,
      username: user.username,
      role: user.role?.name,
      department: user.department,
      permissions: user.role?.permissions || [],
      allowedCategories: user.role?.allowedCategories || [],
    };
  }
}
