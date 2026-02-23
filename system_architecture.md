# ZM Systems — System Architecture Document

> **Employee Management System** for ZM Coca-Cola Distribution  
> Built with: Turborepo · Next.js · NestJS · Prisma · Supabase (PostgreSQL) · TypeScript

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Tech Stack](#tech-stack)
4. [Monorepo Structure](#monorepo-structure)
5. [Database Design](#database-design)
6. [Backend API Reference](#backend-api-reference)
7. [Frontend Pages](#frontend-pages)
8. [Authentication & Authorization](#authentication--authorization)
9. [Business Rules](#business-rules)
10. [Salary Calculation Formula](#salary-calculation-formula)
11. [Configuration](#configuration)
12. [Deployment Guide](#deployment-guide)

---

## System Overview

ZM Systems is a business management platform designed for a Coca-Cola distributor family business. The current subsystem focuses on **Employee Management** with the following core capabilities:

- **Employee Data Management** — Centralized CRUD with soft-delete (archive)
- **Attendance Tracking** — Manual clock-in/out with automatic hour calculation
- **Automated Payroll** — Salary calculation with daily rate, overtime, and deductions
- **Cash Advance Ledger** — Running balance tracking per employee
- **Report Export** — Excel reports for attendance and payroll
- **Role-Based Access Control** — Admin (full access) and Manager (limited access)

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                       Client (Browser)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (apps/web)                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │  Login   │ │Dashboard │ │Employees │ │Attendance│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Payroll  │ │   Cash   │ │ Settings │ │ Reports  │  │  │
│  │  │          │ │ Advances │ │          │ │  + Help  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │ HTTP (JWT Bearer Token)             │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │             NestJS Backend API (apps/api)               │  │
│  │  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐    │  │
│  │  │ Auth │ │ Employee │ │Attendance│ │  Payroll   │    │  │
│  │  └──────┘ └──────────┘ └──────────┘ └────────────┘    │  │
│  │  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐    │  │
│  │  │Setng │ │CashAdvnce│ │ Reports  │ │ AuditLog   │    │  │
│  │  └──────┘ └──────────┘ └──────────┘ └────────────┘    │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │ Prisma ORM                         │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │             Supabase PostgreSQL Database                 │  │
│  │   users │ employees │ attendance │ salary_records       │  │
│  │   deductions │ cash_advances │ audit_logs │ settings    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer      | Technology         | Purpose                  |
|------------|-------------------|--------------------------|
| Frontend   | Next.js 14        | React SSR/CSR framework  |
| UI         | Tailwind CSS + shadcn/ui | Component library   || Data Fetching | TanStack Query v5 | Server-state caching, mutations, optimistic updates || Backend    | NestJS 10         | REST API framework       |
| ORM        | Prisma 6          | Database client & schema |
| Database   | Supabase (PostgreSQL) | Hosted Postgres       |
| Auth       | JWT + Passport    | Token-based auth         |
| Monorepo   | Turborepo + pnpm  | Workspace management     |
| Reports    | ExcelJS           | xlsx export              |
| Language   | TypeScript        | Full-stack type safety   |

---

## Monorepo Structure

```
ZM-systems/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/            # Pages (App Router)
│   │       ├── components/     # UI components + layout
│   │       └── lib/            # API client, auth context, utils
│   └── api/                    # NestJS backend
│       └── src/
│           ├── auth/           # JWT login, signup, guards
│           ├── employee/       # Employee CRUD
│           ├── attendance/     # Clock-in/out
│           ├── payroll/        # Salary calculation
│           ├── cash-advance/   # Cash advance ledger
│           ├── settings/       # Configurable rates
│           ├── reports/        # Excel export
│           ├── audit-log/      # Change tracking
│           ├── dashboard/      # Stats aggregation
│           └── prisma/         # Database service
├── packages/
│   ├── shared/                 # Shared types & constants
│   └── db/                     # Prisma schema & client
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│    users     │────>│  employees   │<────│  attendance   │
│──────────────│     │──────────────│     │───────────────│
│ id           │     │ id           │     │ id            │
│ username  UK │     │ full_name    │     │ employee_id FK│
│ password_hash│     │ address      │     │ date          │
│ role         │     │ contact_number│    │ time_in       │
│ employee_id  │     │ emergency_cnt│     │ time_out      │
│ created_at   │     │ position     │     │ total_hours   │
│ updated_at   │     │ daily_rate   │     │ status        │
└──────┬───────┘     │ hire_date    │     │ locked        │
       │             │ status       │     └───────────────┘
       │             │ created_at   │             │
       │             │ updated_at   │     UNIQUE(employee_id, date)
       │             └──────┬───────┘
       │                    │
       ▼                    ├─────────────────────┐
┌──────────────┐    ┌───────▼───────┐     ┌───────▼──────┐
│  audit_logs  │    │salary_records │     │cash_advances │
│──────────────│    │───────────────│     │──────────────│
│ id           │    │ id            │     │ id           │
│ entity_type  │    │ employee_id FK│     │ employee_id  │
│ entity_id    │    │ period_start  │     │ amount       │
│ action       │    │ period_end    │     │ description  │
│ old_value    │    │ regular_days  │     │ date_given   │
│ new_value    │    │ overtime_hours│     │ remaining_bal│
│ performed_by │    │ daily_rate    │     │ status       │
│ timestamp    │    │ overtime_rate │     └──────────────┘
└──────────────┘    │ gross_pay     │
                    │ deductions    │     ┌──────────────┐
                    │ net_pay       │     │  settings    │
                    │ status        │     │──────────────│
                    └───────┬───────┘     │ id           │
                            │             │ key       UK │
                    ┌───────▼───────┐     │ value        │
                    │  deductions   │     │ updated_at   │
                    │───────────────│     │ updated_by   │
                    │ id            │     └──────────────┘
                    │ salary_rec_id │
                    │ type          │
                    │ description   │
                    │ amount        │
                    │ cash_adv_id   │
                    └───────────────┘
```

### Key Constraints

- **`attendance`**: Unique on `(employee_id, date)` — prevents duplicate logs
- **`users.employee_id`**: Unique — one user per employee
- **`settings.key`**: Unique — one value per setting key
- Decimal fields use `Decimal(10,2)` for currency, `Decimal(5,2)` for hours

---

## Backend API Reference

### Auth
| Method | Endpoint        | Access  | Description                    |
|--------|----------------|---------|--------------------------------|
| POST   | `/api/auth/login` | Public  | Login, returns JWT token       |
| POST   | `/api/coca-cola`  | Public  | Hidden signup (Admin/Manager)  |

### Employees
| Method | Endpoint                  | Access        | Description          |
|--------|--------------------------|---------------|----------------------|
| GET    | `/api/employees`          | Admin, Manager| List employees       |
| GET    | `/api/employees/:id`      | Admin, Manager| Get employee detail  |
| POST   | `/api/employees`          | Admin         | Create employee      |
| PATCH  | `/api/employees/:id`      | Admin         | Update (audit-logged)|
| PATCH  | `/api/employees/:id/archive` | Admin      | Archive employee     |

### Attendance
| Method | Endpoint                      | Access        | Description         |
|--------|-------------------------------|---------------|---------------------|
| GET    | `/api/attendance`             | Admin, Manager| List (with filters) |
| GET    | `/api/attendance/today`       | Admin, Manager| Today's attendance  |
| POST   | `/api/attendance`             | Admin, Manager| Log clock-in        |
| PATCH  | `/api/attendance/:id/clock-out` | Admin, Manager | Log clock-out     |
| PATCH  | `/api/attendance/:id`         | Admin         | Edit (audit-logged) |

### Payroll
| Method | Endpoint                       | Access | Description              |
|--------|-------------------------------|--------|--------------------------|
| GET    | `/api/payroll`                | Admin  | List payroll records     |
| GET    | `/api/payroll/:id`            | Admin  | Get detail + deductions  |
| POST   | `/api/payroll/generate`       | Admin  | Generate for period      |
| POST   | `/api/payroll/:id/deductions` | Admin  | Add deduction            |
| PATCH  | `/api/payroll/:id/finalize`   | Admin  | Finalize + lock period   |

### Cash Advances
| Method | Endpoint                        | Access | Description              |
|--------|---------------------------------|--------|--------------------------|
| GET    | `/api/cash-advances`            | Admin  | List all                 |
| GET    | `/api/cash-advances/employee/:id` | Admin | Get with running balance |
| POST   | `/api/cash-advances`            | Admin  | Record new advance       |
| PATCH  | `/api/cash-advances/:id`        | Admin  | Update                   |

### Settings
| Method | Endpoint                | Access | Description           |
|--------|------------------------|--------|-----------------------|
| GET    | `/api/settings`        | Admin  | Get all settings      |
| PATCH  | `/api/settings/:key`   | Admin  | Update (audit-logged) |

### Reports & Dashboard
| Method | Endpoint                 | Access        | Description           |
|--------|-------------------------|---------------|-----------------------|
| GET    | `/api/reports/payroll`   | Admin         | Download payroll xlsx  |
| GET    | `/api/reports/attendance`| Admin, Manager| Download attendance xlsx|
| GET    | `/api/dashboard/stats`   | Admin, Manager| Dashboard statistics  |
| GET    | `/api/audit-logs`        | Admin         | View audit trail      |

---

## Frontend Pages

| Route              | Access           | Description                              |
|-------------------|------------------|------------------------------------------|
| `/login`           | Public           | Login page                               |
| `/coca-cola`       | Public (hidden)  | Signup page for Admin/Manager             |
| `/dashboard`       | Admin, Manager   | Stats cards + today's attendance table    |
| `/employees`       | Admin, Manager   | Employee list with search/filter          |
| `/employees/new`   | Admin            | Add employee form                        |
| `/employees/[id]`  | Admin, Manager   | View/edit employee + recent attendance    |
| `/attendance`      | Admin, Manager   | Clock-in/out + date filter               |
| `/payroll`         | Admin            | Generate + list payroll records           |
| `/payroll/[id]`    | Admin            | Payroll detail + deductions               |
| `/cash-advances`   | Admin            | Cash advance ledger                      |
| `/settings`        | Admin            | Configure OT/on-call rates               |
| `/reports`         | Admin, Manager   | Export Excel reports                      |
| `/help`            | Admin, Manager   | User documentation                       |

---

## Authentication & Authorization

### Flow
1. User logs in via `/login` → POST `/api/auth/login` with username + password
2. Server validates credentials, returns JWT token (24h expiry)
3. Token stored in `localStorage` and sent as `Bearer` in `Authorization` header
4. All protected routes use `AuthGuard` (Passport JWT) + `RolesGuard` (RBAC)

### Roles
| Role    | Description                                                    |
|---------|---------------------------------------------------------------|
| ADMIN   | Full system access. Not an employee. Created via `/coca-cola` |
| MANAGER | Limited access. Is also an employee. Can log attendance only  |

### Manager Restrictions
- Cannot access: Payroll, Cash Advances, Settings, Audit Logs
- Cannot see salary details of Admin or other Manager users
- Cannot create, edit, or archive employees
- Can only log attendance for employees

---

## Business Rules

### Attendance
- ✅ Unique per employee per day (no duplicates)
- ✅ Auto-calculates `totalHours` on clock-out
- ✅ Status: **FULL_DAY** (>4h ≤8h), **HALF_DAY** (≤4h), **OVERTIME** (>8h)
- ✅ Maximum 24 hours per day
- ✅ Locked records cannot be edited
- ✅ All edits are audit-logged

### Employee
- ✅ Mandatory fields: fullName, address, contactNumber, emergencyContact, position, dailyRate, hireDate
- ✅ No hard-delete if payroll/attendance records exist — archive only
- ✅ Pay rate changes are audit-logged (old → new value)

### Payroll
- ✅ Prevents generation if attendance has missing clock-outs
- ✅ Finalizing locks all attendance in that period
- ✅ Cash advance deductions auto-reduce remaining balance

---

## Salary Calculation Formula

```
Regular Pay = RegularDays × DailyRate
Overtime Pay = OvertimeHours × OvertimeRatePerHour  (configurable)
Gross Pay = Regular Pay + Overtime Pay
Net Pay = Gross Pay − Total Deductions
```

### How Days/Hours Are Calculated

| Scenario            | Hours   | Effect                           |
|--------------------|---------|----------------------------------|
| Full 8-hour day    | 8.0     | regularDays += 1.0               |
| 6-hour day         | 6.0     | regularDays += 0.75 (6/8)        |
| 10-hour day        | 10.0    | regularDays += 1.0, overtimeHours += 2.0 |
| 4-hour half-day    | 4.0     | regularDays += 0.5 (4/8)         |

---

## Configuration

### Environment Variables (`.env`)

```bash
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3000"
PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### System Settings (Admin UI)

| Setting                  | Default | Description                           |
|-------------------------|---------|---------------------------------------|
| `overtime_rate_per_hour` | 100 ₱   | Flat rate per extra hour beyond 8     |
| `oncall_rate_per_day`    | 0 ₱     | Rate for on-call days (e.g., Sunday)  |

---

## Deployment Guide

### Prerequisites
- Node.js 18+
- pnpm 9+
- Supabase project (PostgreSQL database)

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and JWT_SECRET

# 3. Push schema to database
cd packages/db && npx prisma db push

# 4. Generate Prisma client
cd packages/db && npx prisma generate

# 5. Seed default data
cd packages/db && pnpm db:seed

# 6. Run development servers
pnpm dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Production (Vercel)
- Frontend (`apps/web`): Deploy as Next.js project on Vercel
- Backend (`apps/api`): Deploy on Railway, Render, or any Node.js host
- Set environment variables on each platform

---

> **Last Updated**: February 23, 2026  
> **Author**: ZM Systems Development  
> **Version**: 1.1.0

---

## Frontend Caching / Data-Fetching Strategy

All server-state management in the Next.js frontend is handled by **TanStack Query v5** (`@tanstack/react-query`). Every data fetch and mutation goes through centralized query hooks in `apps/web/src/lib/queries/`.

### QueryClient Defaults

| Option | Value | Reason |
|---|---|---|
| `staleTime` | 5 minutes | Avoids redundant refetches for reference data |
| `refetchOnWindowFocus` | `false` | Prevents background refetches disrupting user flow |
| `retry` | 1 | Single retry on transient failure |

### Query Key Conventions

```
['dashboard', 'stats']                     — dashboard stats
['attendance', 'today']                    — today's attendance (dashboard, live clock-in/out)
['attendance', 'list', { dateFrom, dateTo }]  — filtered attendance list
['employees', 'list', { status }]          — employee list (with optional status filter)
['employees', 'detail', id]               — single employee
['payroll', 'list', params]               — payroll records list
['payroll', 'detail', id]                 — single payroll record + deductions
['cash-advances', 'list', params]         — all cash advances
['cash-advances', 'by-employee', employeeId]  — cash advances for a specific employee
['settings']                               — system settings
['audit-logs', params]                    — audit trail
```

### Optimistic Updates

The following high-frequency write operations use optimistic updates for instant UI feedback:

| Operation | Key Updated Optimistically |
|---|---|
| Clock-in | `['attendance', 'today']` — new entry appended |
| Clock-out | `['attendance', 'today']` — matching entry `timeOut` set |
| Create cash advance | `['cash-advances', 'list', *]` — new entry appended |
| Add payroll deduction | `['payroll', 'detail', id]` — deduction appended, totals adjusted |

All optimistic updates roll back on error and always invalidate the related queries on settle.

### Cache Invalidation After Mutations

| Mutation | Invalidates |
|---|---|
| Archive employee | `['employees', 'list']` |
| Create / update employee | `['employees', 'list']`, `['employees', 'detail', id]` |
| Generate payroll | `['payroll', 'list']` |
| Finalize payroll | `['payroll', 'list']`, `['payroll', 'detail', id]` |
| Update setting | `['settings']` |
| Create / update cash advance | `['cash-advances']` |

### API Client — Auto JWT Attachment

The `fetchApi` utility in `apps/web/src/lib/api.ts` reads the JWT directly from `localStorage` (`zm_token` key) on every request. No token parameter is passed through component/hook call chains. React Query Devtools are available in development mode via `<ReactQueryDevtools initialIsOpen={false} />`.
