import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [ProblemModule, PrismaModule, SubmissionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
