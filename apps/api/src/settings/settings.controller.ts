import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { SettingsService } from './settings.service';
import { UserRole } from '@prisma/client';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async findAll() {
    const data = await this.settingsService.findAll();
    return { success: true, data };
  }

  @Patch(':key')
  async update(
    @Param('key') key: string,
    @Body('value') value: string,
    @Request() req: any,
  ) {
    const data = await this.settingsService.update(key, value, req.user.id);
    return { success: true, data, message: 'Setting updated successfully' };
  }
}
