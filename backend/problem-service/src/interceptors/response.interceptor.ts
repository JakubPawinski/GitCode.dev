import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from 'src/problem/dto/api-response-dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200;
        const { pagination, ...rest } = data || {};

        return {
          success: true,
          statusCode,
          message: data?.message || 'Operation successful',
          data: rest?.data !== undefined ? rest.data : rest,
          ...(pagination && { pagination }),
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
