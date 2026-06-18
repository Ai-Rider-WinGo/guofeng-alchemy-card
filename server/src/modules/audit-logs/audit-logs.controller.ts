import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('操作日志')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: '获取操作日志列表' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('target') target?: string,
    @Query('username') username?: string,
  ) {
    return this.auditLogsService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      target,
      username,
    });
  }
}
