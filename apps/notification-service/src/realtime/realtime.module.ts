import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
