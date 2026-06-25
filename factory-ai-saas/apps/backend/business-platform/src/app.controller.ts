import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '健康检查' })
  getHello() {
    return this.appService.getHealth();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: '服务健康状态' })
  getHealth() {
    return this.appService.getHealth();
  }
}
