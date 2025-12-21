import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { UserBaseEvent } from './user-base.event.ts';

/*
 * Event emitted when a new user is created.
 */
export class UserCreatedEvent extends UserBaseEvent {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  constructor(
    userId: string,
    username: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ) {
    super(userId, username);
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
