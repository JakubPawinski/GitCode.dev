import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { Observable } from 'rxjs';

@Injectable()
export class RmqMetadataInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RmqMetadataInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (isRabbitContext(context)) {
      const msg = context.switchToRpc().getData();

      const eventId = msg?.eventId || 'N/A';
      const eventName = msg?.event || 'Unknown';
      const correlationId = msg?.correlationId || 'N/A';

      this.logger.log(
        `Received RabbitMQ message - Event: ${eventName}, Event ID: ${eventId}, Correlation ID: ${correlationId}`,
      );
    }

    return next.handle();
  }
}
