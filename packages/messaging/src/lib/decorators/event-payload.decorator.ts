import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const EventPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToRpc().getData();

    if (request && typeof request === 'object' && request.payload) {
      return request.payload;
    }

    return request;
  },
);
