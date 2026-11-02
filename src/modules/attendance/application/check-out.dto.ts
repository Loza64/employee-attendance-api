import { IsMongoId } from 'class-validator';

export class CheckOutDto {
  @IsMongoId()
  employeeId!: string;
}
