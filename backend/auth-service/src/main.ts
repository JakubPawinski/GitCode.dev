import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // To delete after creating User and auth modules
  app.setGlobalPrefix('auth');

  // Enable CORS for all origins
  app.enableCors({ origin: true });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('GitCode.dev auth-service')
    .setDescription('Auth Service for GitCode.dev microservices architecture')
    .addServer(
      `http://localhost:${process.env.PORT ?? 4001}/auth`,
      'Local server',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // App listen
  await app.listen(process.env.PORT ?? 4001);
}
bootstrap();
