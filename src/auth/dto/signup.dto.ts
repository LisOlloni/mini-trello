import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  name: string;
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(3)
  password: string;
}
