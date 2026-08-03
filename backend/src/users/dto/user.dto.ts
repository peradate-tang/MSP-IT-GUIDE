import {
  IsString, IsEmail, IsOptional, IsBoolean, IsInt,
  MinLength, MaxLength, Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'username ใช้ได้เฉพาะตัวอักษร ตัวเลข . _ - เท่านั้น' })
  username: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(8, { message: 'password ต้องมีอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(200)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsInt()
  departmentCategoryId?: number;

  @IsOptional()
  @IsInt()
  roleId?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsInt()
  departmentCategoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'password ต้องมีอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(200)
  password?: string;
}
