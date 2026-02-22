import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../employee/employee.service';
import { AttendanceService } from '../attendance/attendance.service';
import { PayrollService } from '../payroll/payroll.service';

@Injectable()
export class DashboardService {
  constructor(
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService,
    private payrollService: PayrollService,
  ) {}

  async getStats() {
    const [totalEmployees, attendanceStats, currentPayrollTotal] = await Promise.all([
      this.employeeService.getActiveCount(),
      this.attendanceService.getTodayStats(),
      this.payrollService.getCurrentPeriodTotal(),
    ]);

    return {
      totalEmployees,
      presentToday: attendanceStats.presentToday,
      overtimeToday: attendanceStats.overtimeToday,
      currentPayrollTotal,
    };
  }
}
