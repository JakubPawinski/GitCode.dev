import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule],
})
export class UsersModule {}
