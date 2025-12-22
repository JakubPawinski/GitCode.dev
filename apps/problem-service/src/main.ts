import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from '@gitcode/common';
import { HttpExceptionFilter } from '@gitcode/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  // Global interceptor for response formatting
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter for error formatting
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('GitCode.dev problem-service')
    .setDescription('API documentation for the Problem Service')
    .addServer(`http://localhost:${process.env.PORT ?? 4002}`, 'Local server')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 4002, '0.0.0.0');
}
bootstrap();
