import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK_SECRET = 'staffguide-secret-change-in-prod';

/**
 * คืนค่า JWT secret จาก env
 * ถ้า NODE_ENV=production แต่ไม่ได้ตั้ง JWT_SECRET ไว้ → throw ทันทีตอน start service
 * (กันไม่ให้ deploy จริงหลุดไปใช้ secret ที่เดาได้จาก source code แบบเงียบๆ)
 */
export function resolveJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;

  if (config.get('NODE_ENV') === 'production') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production with a default/guessable secret. ' +
        'Please set the JWT_SECRET environment variable.',
    );
  }

  console.warn('⚠️  JWT_SECRET ไม่ได้ถูกตั้งค่า — ใช้ค่า default สำหรับ development เท่านั้น อย่าใช้ค่านี้ใน production');
  return DEV_FALLBACK_SECRET;
}
