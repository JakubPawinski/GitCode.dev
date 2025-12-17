/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { rabbitMQOptions } from './app/config/rabbitmq.options';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor, HttpExceptionFilter } from '@gitcode/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<any>({
    transport: Transport.RMQ,
    options: rabbitMQOptions,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('GitCode.dev notification-service')
    .setDescription(
      'Notification Service for GitCode.dev microservices architecture',
    )
    .addServer(
      `http://localhost:${process.env.NOTIFICATION_PORT ?? 4003}`,
      'Local server',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.startAllMicroservices();

  const port = process.env.NOTIFICATION_PORT || 4003;
  await app.listen(port);
}

bootstrap();
