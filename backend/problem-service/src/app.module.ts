import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';

@Module({
  imports: [ProblemModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
