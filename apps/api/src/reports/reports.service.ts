import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generatePayrollReport(periodStart: string, periodEnd: string): Promise<Buffer> {
    // Validate date inputs
    const startDate = new Date(periodStart + 'T00:00:00.000Z');
    const endDate = new Date(periodEnd + 'T00:00:00.000Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }

    const records = await this.prisma.salaryRecord.findMany({
      where: {
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      include: {
        employee: true,
        deductionItems: true,
        incentiveItems: true,
      },
      orderBy: { employee: { fullName: 'asc' } },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ZM Systems';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Payroll Report');

    // Header styling
    sheet.columns = [
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Period Start', key: 'periodStart', width: 15 },
      { header: 'Period End', key: 'periodEnd', width: 15 },
      { header: 'Regular Hours', key: 'regularHours', width: 15 },
      { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
      { header: 'Daily Rate', key: 'dailyRate', width: 15 },
      { header: 'OT Rate/hr', key: 'overtimeRate', width: 15 },
      { header: 'Gross Pay', key: 'grossPay', width: 15 },
      { header: 'Incentives', key: 'incentives', width: 15 },
      { header: 'Deductions', key: 'deductions', width: 15 },
      { header: 'Net Pay', key: 'netPay', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DC2626' },
    };

    for (const record of records) {
      sheet.addRow({
        name: record.employee.fullName,
        position: record.employee.position,
        periodStart: new Date(record.periodStart).toLocaleDateString(),
        periodEnd: new Date(record.periodEnd).toLocaleDateString(),
        regularHours: Number(record.regularHours),
        overtimeHours: Number(record.overtimeHours),
        dailyRate: Number(record.dailyRate),
        overtimeRate: Number(record.overtimeRate),
        grossPay: Number(record.grossPay),
        incentives: Number(record.incentives),
        deductions: Number(record.deductions),
        netPay: Number(record.netPay),
        status: record.status,
      });
    }

    // Add totals row
    if (records.length > 0) {
      const totalRow = sheet.addRow({
        name: 'TOTAL',
        grossPay: records.reduce((s: number, r: any) => s + Number(r.grossPay), 0),
        incentives: records.reduce((s: number, r: any) => s + Number(r.incentives), 0),
        deductions: records.reduce((s: number, r: any) => s + Number(r.deductions), 0),
        netPay: records.reduce((s: number, r: any) => s + Number(r.netPay), 0),
      });
      totalRow.font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateAttendanceReport(dateFrom: string, dateTo: string): Promise<Buffer> {
    // Validate date inputs
    const fromDate = new Date(dateFrom + 'T00:00:00.000Z');
    const toDate = new Date(dateTo + 'T00:00:00.000Z');

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }

    const records = await this.prisma.attendance.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
      },
      include: { employee: true },
      orderBy: [{ date: 'asc' }, { employee: { fullName: 'asc' } }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ZM Systems';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Attendance Report');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Time In', key: 'timeIn', width: 20 },
      { header: 'Time Out', key: 'timeOut', width: 20 },
      { header: 'Total Hours', key: 'totalHours', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DC2626' },
    };

    for (const record of records) {
      sheet.addRow({
        date: new Date(record.date).toLocaleDateString(),
        name: record.employee.fullName,
        position: record.employee.position,
        timeIn: new Date(record.timeIn).toLocaleTimeString(),
        timeOut: record.timeOut ? new Date(record.timeOut).toLocaleTimeString() : 'Pending',
        totalHours: record.totalHours ? Number(record.totalHours) : '-',
        status: record.status,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
