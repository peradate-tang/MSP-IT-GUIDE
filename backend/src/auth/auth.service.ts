import { Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 ชั่วโมง

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, username: user.username, role: user.role?.name, permissions: user.role?.permissions || [] };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        departmentCategory: user.departmentCategory || null,
        role: user.role,
      },
    };
  }

  async me(userId: number) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      departmentCategory: user.departmentCategory || null,
      role: user.role,
    };
  }

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    if (!this.mailService.isConfigured) {
      // แจ้งตรงๆ ว่าระบบอีเมลยังไม่พร้อม (ผู้ดูแลระบบต้องตั้งค่า SMTP_* ใน env ก่อน) แทนที่จะทำเหมือนสำเร็จทั้งที่ไม่ได้ส่งจริง
      throw new ServiceUnavailableException(
        'ระบบยังไม่ได้ตั้งค่าอีเมลสำหรับรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบให้ช่วยรีเซ็ตรหัสผ่านให้โดยตรง',
      );
    }

    const user = await this.usersService.findByUsernameOrEmail(identifier);
    // ตอบข้อความเดียวกันไม่ว่าจะเจอ user หรือไม่ กัน user enumeration (เดาว่า username/email ไหนมีอยู่จริงในระบบ)
    const genericResponse = { message: 'ถ้ามีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลที่ผูกไว้แล้ว กรุณาตรวจสอบกล่องจดหมาย' };

    if (!user || !user.isActive) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.usersService.setResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = (this.config.get<string>('FRONTEND_URL') || '').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await this.mailService.sendPasswordReset(user.email, user.fullName || user.username, resetUrl);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${user.email}: ${err?.message}`);
      throw new ServiceUnavailableException('ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ');
    }

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetTokenHash(tokenHash);

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่');
    }

    await this.usersService.resetPasswordWithToken(user.id, newPassword);
    return { message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' };
  }
}
