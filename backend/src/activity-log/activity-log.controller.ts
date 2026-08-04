import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRole } from '../common/decorators/roles.decorator';

@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole('admin', 'admin:access')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    return this.activityLogService.findAll({
      page: page ? +page : 1,
      limit: limit ? Math.min(+limit, 100) : 30,
      entityType,
      action,
    });
  }
}
