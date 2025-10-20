import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Finish API' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Complete task API for projects' })
  description: string;

  @ApiProperty({ example: 'TODO', required: false })
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
