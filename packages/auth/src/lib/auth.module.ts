import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [],
  providers: [JwtStrategy],
  exports: [PassportModule],
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
})
export class GitCodeAuthModule {}
