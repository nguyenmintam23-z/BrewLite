import {
  Controller,
  Get,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthCheckService,
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HealthCheck()
  async getHealth(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        async () => {
          try {
            await this.dataSource.query('SELECT 1');
            return this.healthIndicatorService.check('database').up();
          } catch {
            return this.healthIndicatorService
              .check('database')
              .down({ message: 'Database is unavailable' });
          }
        },
      ]);
    } catch {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Service unavailable',
      });
    }
  }
}
