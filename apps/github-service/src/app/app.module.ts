import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubModule } from '../github/github.module';
import { GitCodeAuthModule } from '@gitcode/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [
        () => ({
          jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            accessExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
          },
        }),
      ],
    }),
    GitCodeAuthModule,
    GithubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
