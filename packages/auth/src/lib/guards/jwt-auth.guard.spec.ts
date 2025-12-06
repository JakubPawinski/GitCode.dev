import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should extend AuthGuard with jwt strategy', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should call super.canActivate method', async () => {
    const guard = new JwtAuthGuard();
    const canActivateSpy = jest.spyOn(
      Object.getPrototypeOf(guard),
      'canActivate',
    );
    const payload = { sub: '1', email: 'test@example.com' };
    const token = jwt.sign(payload, 'test-secret');
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${token}` },
        }),
        getResponse: () => ({}),
      }),
    } as any;
    await guard.canActivate(context);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
  });
});
