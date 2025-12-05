import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Submission deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'ID of deleted submission',
    example: 'b2fd53c1-4385-4b69-b381-bbf7b0ed89b8',
  })
  deletedId: string;
}
