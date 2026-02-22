import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { DashboardService } from './dashboard.service';
import { UserRole } from '@prisma/client';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { success: true, data };
  }
}
