import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  oldPassword: string;
  @IsNotEmpty()
  @MinLength(5)
  newPassword: string;
}
