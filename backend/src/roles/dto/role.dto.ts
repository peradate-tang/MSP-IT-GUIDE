import { IsString, IsOptional, IsArray, IsInt, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  allowedCategories?: number[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  allowedCategories?: number[];
}
