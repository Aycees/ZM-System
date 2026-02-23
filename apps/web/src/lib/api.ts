const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/** Reads the JWT from localStorage and attaches it automatically. */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zm_token');
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  // For file downloads
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('spreadsheetml') || contentType?.includes('octet-stream')) {
    return res.blob() as unknown as T;
  }

  return res.json();
}

// --- Auth ---
export const authApi = {
  login: (username: string, password: string) =>
    fetchApi<{ accessToken: string; user: { id: string; username: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
    ),
  signup: (data: { username: string; password: string; role: string; employeeId?: string }) =>
    fetchApi('/coca-cola', { method: 'POST', body: JSON.stringify(data) }),
};

// --- Dashboard ---
export const dashboardApi = {
  getStats: () =>
    fetchApi<{ success: boolean; data: any }>('/dashboard/stats'),
};

// --- Employees ---
export const employeeApi = {
  getAll: (status?: string) =>
    fetchApi<{ success: boolean; data: any[] }>(
      `/employees${status ? `?status=${status}` : ''}`,
    ),
  getOne: (id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/employees/${id}`),
  create: (data: any) =>
    fetchApi('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archive: (id: string) =>
    fetchApi(`/employees/${id}/archive`, { method: 'PATCH' }),
};

// --- Attendance ---
export const attendanceApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[]; total: number }>(`/attendance${query}`);
  },
  getToday: () =>
    fetchApi<{ success: boolean; data: any[] }>('/attendance/today'),
  clockIn: (data: any) =>
    fetchApi('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  clockOut: (id: string, data: any) =>
    fetchApi(`/attendance/${id}/clock-out`, { method: 'PATCH', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi(`/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi(`/attendance/${id}`, { method: 'DELETE' }),
};

// --- Payroll ---
export const payrollApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[]; total: number }>(`/payroll${query}`);
  },
  getOne: (id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/payroll/${id}`),
  generate: (data: any) =>
    fetchApi('/payroll/generate', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi(`/payroll/${id}`, { method: 'DELETE' }),
  addDeduction: (id: string, data: any) =>
    fetchApi(`/payroll/${id}/deductions`, { method: 'POST', body: JSON.stringify(data) }),
  updateDeduction: (id: string, deductionId: string, data: any) =>
    fetchApi(`/payroll/${id}/deductions/${deductionId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDeduction: (id: string, deductionId: string) =>
    fetchApi(`/payroll/${id}/deductions/${deductionId}`, { method: 'DELETE' }),
  addIncentive: (id: string, data: any) =>
    fetchApi(`/payroll/${id}/incentives`, { method: 'POST', body: JSON.stringify(data) }),
  updateIncentive: (id: string, incentiveId: string, data: any) =>
    fetchApi(`/payroll/${id}/incentives/${incentiveId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIncentive: (id: string, incentiveId: string) =>
    fetchApi(`/payroll/${id}/incentives/${incentiveId}`, { method: 'DELETE' }),
  finalize: (id: string) =>
    fetchApi(`/payroll/${id}/finalize`, { method: 'PATCH' }),
};

// --- Settings ---
export const settingsApi = {
  getAll: () =>
    fetchApi<{ success: boolean; data: any[] }>('/settings'),
  update: (key: string, value: string) =>
    fetchApi(`/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),
};

// --- Cash Advances ---
export const cashAdvanceApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[] }>(`/cash-advances${query}`);
  },
  getByEmployee: (employeeId: string) =>
    fetchApi<{ success: boolean; advances: any[]; summary: any }>(
      `/cash-advances/employee/${employeeId}`,
    ),
  create: (data: any) =>
    fetchApi('/cash-advances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi(`/cash-advances/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// --- Audit Logs ---
export const auditLogApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[]; total: number }>(`/audit-logs${query}`);
  },
};

// --- Reports ---
export const reportsApi = {
  downloadPayroll: (periodStart: string, periodEnd: string) =>
    fetchApi<Blob>(`/reports/payroll?periodStart=${periodStart}&periodEnd=${periodEnd}`),
  downloadAttendance: (dateFrom: string, dateTo: string) =>
    fetchApi<Blob>(`/reports/attendance?dateFrom=${dateFrom}&dateTo=${dateTo}`),
};
