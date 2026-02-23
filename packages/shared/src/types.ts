// ============================================================
// ZM Systems — Shared Types
// ============================================================

// --- User & Auth ---
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface SignupDto {
  username: string;
  password: string;
  role: UserRole;
  employeeId?: string; // Required for MANAGER
}

export interface JwtPayload {
  sub: string; // userId
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}

// --- Employee ---
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface Employee {
  id: string;
  fullName: string;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  position: string;
  dailyRate?: number; // Hidden from Manager
  hireDate: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  fullName: string;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  position: string;
  dailyRate: number;
  hireDate: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  address?: string;
  contactNumber?: string;
  emergencyContact?: string;
  position?: string;
  dailyRate?: number;
  status?: EmployeeStatus;
}

// --- Attendance ---
export enum AttendanceStatus {
  FULL_DAY = 'FULL_DAY',
  HALF_DAY = 'HALF_DAY',
  OVERTIME = 'OVERTIME',
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
  totalHours: number | null;
  status: AttendanceStatus;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface LogAttendanceDto {
  employeeId: string;
  date?: string; // defaults to today
  timeIn: string;
}

export interface ClockOutDto {
  timeOut: string;
}

// --- Payroll Frequency ---
export enum PayrollFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
}

// --- Salary / Payroll ---
export enum SalaryStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  frequency: PayrollFrequency;
  regularDays: number;
  regularHours: number;
  overtimeHours: number;
  dailyRate: number;
  overtimeRate: number;
  grossPay: number;
  incentives: number;
  deductions: number;
  netPay: number;
  status: SalaryStatus;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  deductionItems?: Deduction[];
  incentiveItems?: Incentive[];
}

export interface GeneratePayrollDto {
  periodStart: string;
  periodEnd?: string; // Auto-calculated from frequency if not provided
  frequency: PayrollFrequency;
  employeeIds?: string[]; // If not provided, all active employees
}

// --- Incentives ---
export enum IncentiveType {
  BONUS = 'BONUS',
  ALLOWANCE = 'ALLOWANCE',
  OTHER = 'OTHER',
}

export interface Incentive {
  id: string;
  salaryRecordId: string;
  type: IncentiveType;
  description: string;
  amount: number;
  createdAt: string;
}

export interface AddIncentiveDto {
  type: IncentiveType;
  description: string;
  amount: number;
}

// --- Deductions ---
export enum DeductionType {
  ABSENCE = 'ABSENCE',
  CASH_ADVANCE = 'CASH_ADVANCE',
  OTHER = 'OTHER',
}

export interface Deduction {
  id: string;
  salaryRecordId: string;
  type: DeductionType;
  description: string;
  amount: number;
  createdAt: string;
}

export interface AddDeductionDto {
  type: DeductionType;
  description: string;
  amount: number;
  cashAdvanceId?: string; // If deducting from a cash advance
}

export interface UpdateDeductionDto {
  description?: string;
  amount?: number;
}

// --- Cash Advance ---
export enum CashAdvanceStatus {
  ACTIVE = 'ACTIVE',
  FULLY_DEDUCTED = 'FULLY_DEDUCTED',
}

export interface CashAdvance {
  id: string;
  employeeId: string;
  amount: number;
  description: string;
  dateGiven: string;
  remainingBalance: number;
  status: CashAdvanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashAdvanceDto {
  employeeId: string;
  amount: number;
  description: string;
  dateGiven: string;
}

// --- Audit Log ---
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  performedBy: string;
  timestamp: string;
}

// --- Settings ---
export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

// --- Dashboard ---
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  overtimeToday: number;
  currentPayrollTotal: number;
}

// --- API Response Wrapper ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
