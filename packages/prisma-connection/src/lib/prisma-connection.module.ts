import {
  DynamicModule,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export interface PrismaModuleAsyncOptions {
  inject?: any[];
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => { connectionString: string };
}

export function createPrismaConnectionModule<
  T extends { $connect(): Promise<void>; $disconnect(): Promise<void> },
>(PrismaClientClass: new (args: any) => T, token: string) {
  @Injectable()
  class PrismaConnectionService implements OnModuleInit, OnModuleDestroy {
    constructor(@Inject(token) private readonly client: T) {}
    onModuleInit() {
      return this.client.$connect();
    }
    onModuleDestroy() {
      return this.client.$disconnect();
    }
  }

  @Module({})
  class PrismaConnectionModule {
    static forRootAsync(options: PrismaModuleAsyncOptions): DynamicModule {
      const clientProvider: Provider = {
        provide: token,
        inject: options.inject ?? [],
        useFactory: async (...args: any[]) => {
          const { connectionString } = options.useFactory(...args);
          const pool = new Pool({ connectionString });
          const adapter = new PrismaPg(pool);
          return new PrismaClientClass({ adapter });
          },
      };

      return {
        module: PrismaConnectionModule,
        imports: options.imports ?? [],
        providers: [clientProvider, PrismaConnectionService],
        exports: [token],
      };
    }
  }

  return PrismaConnectionModule;
}
