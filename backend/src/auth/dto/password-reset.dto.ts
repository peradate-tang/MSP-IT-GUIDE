import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  identifier: string; // username หรือ email ก็ได้
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8, { message: 'password ต้องมีอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(200)
  newPassword: string;
}
