import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProjectDto {
  @ApiProperty({ example: 'My Project' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
