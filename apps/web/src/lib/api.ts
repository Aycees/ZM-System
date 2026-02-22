const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
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
  getStats: (token: string) =>
    fetchApi<{ success: boolean; data: any }>('/dashboard/stats', { token }),
};

// --- Employees ---
export const employeeApi = {
  getAll: (token: string, status?: string) =>
    fetchApi<{ success: boolean; data: any[] }>(
      `/employees${status ? `?status=${status}` : ''}`,
      { token },
    ),
  getOne: (token: string, id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/employees/${id}`, { token }),
  create: (token: string, data: any) =>
    fetchApi('/employees', { method: 'POST', body: JSON.stringify(data), token }),
  update: (token: string, id: string, data: any) =>
    fetchApi(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  archive: (token: string, id: string) =>
    fetchApi(`/employees/${id}/archive`, { method: 'PATCH', token }),
};

// --- Attendance ---
export const attendanceApi = {
  getAll: (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[]; total: number }>(
      `/attendance${query}`,
      { token },
    );
  },
  getToday: (token: string) =>
    fetchApi<{ success: boolean; data: any[] }>('/attendance/today', { token }),
  clockIn: (token: string, data: any) =>
    fetchApi('/attendance', { method: 'POST', body: JSON.stringify(data), token }),
  clockOut: (token: string, id: string, data: any) =>
    fetchApi(`/attendance/${id}/clock-out`, { method: 'PATCH', body: JSON.stringify(data), token }),
  update: (token: string, id: string, data: any) =>
    fetchApi(`/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
};

// --- Payroll ---
export const payrollApi = {
  getAll: (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[]; total: number }>(
      `/payroll${query}`,
      { token },
    );
  },
  getOne: (token: string, id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/payroll/${id}`, { token }),
  generate: (token: string, data: any) =>
    fetchApi('/payroll/generate', { method: 'POST', body: JSON.stringify(data), token }),
  addDeduction: (token: string, id: string, data: any) =>
    fetchApi(`/payroll/${id}/deductions`, { method: 'POST', body: JSON.stringify(data), token }),
  finalize: (token: string, id: string) =>
    fetchApi(`/payroll/${id}/finalize`, { method: 'PATCH', token }),
};

// --- Settings ---
export const settingsApi = {
  getAll: (token: string) =>
    fetchApi<{ success: boolean; data: any[] }>('/settings', { token }),
  update: (token: string, key: string, value: string) =>
    fetchApi(`/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }), token }),
};

// --- Cash Advances ---
export const cashAdvanceApi = {
  getAll: (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[] }>(`/cash-advances${query}`, { token });
  },
  getByEmployee: (token: string, employeeId: string) =>
    fetchApi<{ success: boolean; advances: any[]; summary: any }>(
      `/cash-advances/employee/${employeeId}`,
      { token },
    ),
  create: (token: string, data: any) =>
    fetchApi('/cash-advances', { method: 'POST', body: JSON.stringify(data), token }),
  update: (token: string, id: string, data: any) =>
    fetchApi(`/cash-advances/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
};

// --- Audit Logs ---
export const auditLogApi = {
  getAll: (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<{ success: boolean; data: any[]; total: number }>(
      `/audit-logs${query}`,
      { token },
    );
  },
};

// --- Reports ---
export const reportsApi = {
  downloadPayroll: (token: string, periodStart: string, periodEnd: string) =>
    fetchApi<Blob>(
      `/reports/payroll?periodStart=${periodStart}&periodEnd=${periodEnd}`,
      { token },
    ),
  downloadAttendance: (token: string, dateFrom: string, dateTo: string) =>
    fetchApi<Blob>(
      `/reports/attendance?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      { token },
    ),
};
