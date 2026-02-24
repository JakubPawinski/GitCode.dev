import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dtos/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const ctxType = context.getType();

    // Only intercept HTTP requests
    if (ctxType !== 'http') {
      return next.handle() as Observable<ApiResponseDto<T>>;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          response.status(HttpStatus.NO_CONTENT);
          return null as any;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          message: data?.message || 'Operation successful',
          data: data?.data !== undefined ? data.data : data,
          meta: data?.meta,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
