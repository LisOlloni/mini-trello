import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class TaskDto {
  @ApiProperty({ example: 'Finish API' })
  @IsNotEmpty()
  @IsString()
  title: string;
  @ApiProperty({ example: 'Complete task API for projects' })
  @IsString()
  description: string;
  @ApiProperty({ example: 'TODO', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status: TaskStatus;

  @IsNotEmpty()
  file: Express.Multer.File;
}
