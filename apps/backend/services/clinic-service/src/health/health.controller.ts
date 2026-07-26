import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { service: string; status: string } {
    return { service: 'clinic-service', status: 'ok' };
  }
}
