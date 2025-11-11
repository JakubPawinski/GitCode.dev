import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser middleware
  app.use(cookieParser());

  // Global interceptor for response formatting
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter for error formatting
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS with credentials
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('GitCode.dev auth-service')
    .setDescription('Auth Service for GitCode.dev microservices architecture')
    .addServer(
      `http://localhost:${process.env.PORT ?? 4001}/auth`,
      'Local server',
    )
    .addBearerAuth()
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 4001);
}
bootstrap();
