import 'reflect-metadata';
import { FactoryProvider } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPrismaConnectionModule } from './prisma-connection.module.ts';
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(),
}));

describe('createPrismaConnectionModule', () => {
  const token = 'TEST_PRISMA_CLIENT';

  class FakePrismaClient {
    static instances: FakePrismaClient[] = [];

    public readonly options: unknown;
    public readonly $connect = jest.fn().mockResolvedValue(undefined);
    public readonly $disconnect = jest.fn().mockResolvedValue(undefined);

    constructor(options: unknown) {
      this.options = options;
      FakePrismaClient.instances.push(this);
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    FakePrismaClient.instances = [];
  });
  it('should build a dynamic module with default imports and inject', async () => {
    const mockedPool = jest.mocked(Pool);
    const mockedPrismaPg = jest.mocked(PrismaPg);

    const PrismaConnectionModule = createPrismaConnectionModule(
      FakePrismaClient,
      token,
    );

    const dynamicModule = PrismaConnectionModule.forRootAsync({
      useFactory: () => ({
        connectionString: 'postgresql://user:pass@localhost:5432/db',
      }),
    });

    expect(dynamicModule.module).toBe(PrismaConnectionModule);
    expect(dynamicModule.imports).toEqual([]);
    expect(dynamicModule.exports).toEqual([token]);
    expect(dynamicModule.providers).toHaveLength(2);

    const clientProvider = dynamicModule.providers?.find(
      (provider): provider is FactoryProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        'useFactory' in provider &&
        provider.provide === token,
    );

    expect(clientProvider).toBeDefined();
    expect(clientProvider?.inject).toEqual([]);

    const client = await clientProvider!.useFactory();

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@localhost:5432/db',
    });
    expect(PrismaPg).toHaveBeenCalledWith(mockedPool.mock.instances[0]);
    expect(client).toBeInstanceOf(FakePrismaClient);
    expect(FakePrismaClient.instances[0]?.options).toEqual({
      adapter: mockedPrismaPg.mock.instances[0],
    });
  });

  it('should pass inject values to options factory and preserve imports', async () => {
    const PrismaConnectionModule = createPrismaConnectionModule(
      FakePrismaClient,
      token,
    );

    const factory = jest.fn((prefix: string, database: string) => ({
      connectionString: `${prefix}/${database}`,
    }));

    class ImportedModule {}

    const dynamicModule = PrismaConnectionModule.forRootAsync({
      imports: [ImportedModule],
      inject: ['CONFIG', 'DATABASE_NAME'],
      useFactory: factory,
    });

    expect(dynamicModule.imports).toEqual([ImportedModule]);

    const clientProvider = dynamicModule.providers?.find(
      (provider): provider is FactoryProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        'useFactory' in provider &&
        provider.provide === token,
    );

    expect(clientProvider?.inject).toEqual(['CONFIG', 'DATABASE_NAME']);

    await clientProvider!.useFactory('postgresql://localhost:5432', 'gitcode');

    expect(factory).toHaveBeenCalledWith(
      'postgresql://localhost:5432',
      'gitcode',
    );
    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://localhost:5432/gitcode',
    });
  });

  it('should connect on module init and disconnect on module destroy', async () => {
    const PrismaConnectionModule = createPrismaConnectionModule(
      FakePrismaClient,
      token,
    );

    const testingModule = await Test.createTestingModule({
      imports: [
        PrismaConnectionModule.forRootAsync({
          useFactory: () => ({
            connectionString: 'postgresql://user:pass@localhost:5432/db',
          }),
        }),
      ],
    }).compile();

    await testingModule.init();

    const client = testingModule.get<FakePrismaClient>(token);

    expect(client.$connect).toHaveBeenCalledTimes(1);
    expect(client.$disconnect).not.toHaveBeenCalled();

    await testingModule.close();

    expect(client.$disconnect).toHaveBeenCalledTimes(1);
  });
});
