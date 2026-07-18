import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './providers/social.service';
import { AuthPrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [SocialController],
  providers: [SocialService],
  imports: [AuthPrismaModule],
})
export class SocialModule {}
