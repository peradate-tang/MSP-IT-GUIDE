import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch (e) {
      throw new ServiceUnavailableException('Database connection failed');
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
