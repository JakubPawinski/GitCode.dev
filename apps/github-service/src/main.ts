import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { ResponseInterceptor, HttpExceptionFilter } from '@gitcode/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe for request validation
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
  app.useGlobalFilters(new HttpExceptionFilter('github-service'));

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('GitCode.dev github-service')
    .setDescription(
      'GitHub Integration Service for GitCode.dev microservices architecture',
    )
    .addServer(`http://localhost:${process.env.PORT ?? 4004}`, 'Local server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'Bearer Auth',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4004;
  await app.listen(port, '0.0.0.0');
  console.log(
    `🚀 GitHub Service is running on: http://localhost:${port}`,
  );
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
