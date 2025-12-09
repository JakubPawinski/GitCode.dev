import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './providers/social.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [SocialController],
  providers: [SocialService],
  imports: [PrismaModule],
})
export class SocialModule {}
