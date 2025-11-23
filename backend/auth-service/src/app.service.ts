import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return { status: 'Auth Service is healthy' };
  }

  getHello(): string {
    return 'Hello from Auth Service!';
  }
}
