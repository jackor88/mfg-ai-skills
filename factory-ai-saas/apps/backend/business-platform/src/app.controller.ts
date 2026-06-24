import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  getHello() {
    return this.appService.getHealth();
  }

  @Get('health')
  @ApiOperation({ summary: '服务健康状态' })
  getHealth() {
    return this.appService.getHealth();
  }
}
