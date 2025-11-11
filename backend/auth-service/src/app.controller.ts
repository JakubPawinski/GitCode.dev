import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
@ApiTags('Auth Service')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Get Auth Service hello message' })
  getHello(): string {
    return this.appService.getHello();
  }
}
