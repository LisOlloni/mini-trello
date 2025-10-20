import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Your current password',
    example: 'oldPass123',
  })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'Your new password (minimum 5 characters)',
    example: 'newPass456',
  })
  @IsNotEmpty()
  @MinLength(5)
  newPassword: string;
}
