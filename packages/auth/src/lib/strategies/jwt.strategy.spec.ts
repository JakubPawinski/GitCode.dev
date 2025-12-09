import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should throw error if JWT_SECRET is missing', () => {
    const configService = { get: jest.fn().mockReturnValue(null) };
    expect(() => new JwtStrategy(configService as any)).toThrow(
      'JWT_SECRET is not defined in configuration',
    );
  });

  it('should validate payload and return user data', async () => {
    const payload = {
      sub: '1',
      email: 'test@example.com',
      username: 'test',
      roles: ['user'],
      permissions: ['read'],
    };
    const result = await strategy.validate(payload);
    expect(result).toEqual({
      id: '1',
      email: 'test@example.com',
      username: 'test',
      roles: ['user'],
      permissions: ['read'],
    });
  });

  it('should throw UnauthorizedException for invalid payload', async () => {
    await expect(strategy.validate({})).rejects.toThrow(UnauthorizedException);
  });
});
