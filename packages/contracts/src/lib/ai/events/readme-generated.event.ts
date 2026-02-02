import { IsNotEmpty, IsUUID } from 'class-validator';

export class ReadmeGeneratedEvent {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  readmeContent: string;

  constructor(userId: string, readmeContent: string) {
    this.userId = userId;
    this.readmeContent = readmeContent;
  }
}
