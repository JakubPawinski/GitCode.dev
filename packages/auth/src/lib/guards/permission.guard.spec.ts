import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PermissionsGuards } from './permission.guard';
import { AppPermission } from '@gitcode/types';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuards;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsGuards, Reflector],
    }).compile();

    guard = module.get<PermissionsGuards>(PermissionsGuards);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access if no permissions required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({}) }),
    };
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should deny access if user has no permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read']);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
    };
    expect(guard.canActivate(context as any)).toBe(false);
  });

  it('should allow access if user has required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read']);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { permissions: ['read'] } }),
      }),
    };
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should allow access with ADMIN_ALL', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['write']);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions: [AppPermission.ADMIN_ALL] },
        }),
      }),
    };
    expect(guard.canActivate(context as any)).toBe(true);
  });
});
