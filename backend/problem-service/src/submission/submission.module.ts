import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { SubmissionProcessor } from './submission.processor';
import { DockerExecutorService } from './docker-executor.service';
import { SubmissionGateway } from './submission.gateway';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'submissions',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [SubmissionController],
  providers: [
    SubmissionService,
    SubmissionProcessor,
    DockerExecutorService,
    SubmissionGateway,
  ],
  exports: [SubmissionService, SubmissionGateway],
})
export class SubmissionModule {}
