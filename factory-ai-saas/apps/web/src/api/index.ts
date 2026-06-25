import request from '../utils/request';

export const authApi = {
  login: (data: { username: string; password: string; tenantCode: string }) =>
    request.post('/auth/login', data),
  profile: () => request.get('/auth/profile'),
};

export const billingApi = {
  account: () => request.get('/billing/account'),
  packages: () => request.get('/billing/packages'),
  recharge: (data: { packageId: string; paymentMethod: string }) =>
    request.post('/billing/recharge', data),
  orders: (params?: any) => request.get('/billing/orders', { params }),
  consumeLogs: (params?: any) => request.get('/billing/consume-logs', { params }),
  checkAi: () => request.get('/billing/check-ai'),
};

export const quotationApi = {
  list: (params?: any) => request.get('/quotations', { params }),
  create: (data: any) => request.post('/quotations', data),
  detail: (id: string) => request.get(`/quotations/${id}`),
  update: (id: string, data: any) => request.patch(`/quotations/${id}`, data),
  remove: (id: string) => request.delete(`/quotations/${id}`),
  submit: (id: string) => request.post(`/quotations/${id}/submit`),
  aiCalculate: (id: string) => request.post(`/quotations/${id}/ai-calculate`),
  review: (id: string, data: any) => request.post(`/quotations/${id}/review`, data),
  confirm: (id: string) => request.post(`/quotations/${id}/confirm`),
  statistics: () => request.get('/quotations/statistics'),
  customers: () => request.get('/quotations/master/customers'),
  createCustomer: (data: any) => request.post('/quotations/master/customers', data),
  materials: () => request.get('/quotations/master/materials'),
  processes: () => request.get('/quotations/master/processes'),
};

export const orderApi = {
  list: (params?: any) => request.get('/orders', { params }),
  create: (data: any) => request.post('/orders', data),
  fromQuotation: (quotationId: string, data?: any) =>
    request.post(`/orders/from-quotation/${quotationId}`, data),
  detail: (id: string) => request.get(`/orders/${id}`),
  update: (id: string, data: any) => request.patch(`/orders/${id}`, data),
  updateProgress: (id: string, data: any) => request.patch(`/orders/${id}/progress`, data),
  dashboard: () => request.get('/orders/dashboard'),
  ship: (id: string, data: any) => request.post(`/orders/${id}/ship`, data),
  deliver: (id: string, data: any) => request.post(`/orders/${id}/deliver`, data),
  complete: (id: string) => request.post(`/orders/${id}/complete`),
  cancel: (id: string) => request.post(`/orders/${id}/cancel`),
};

export const costApi = {
  records: (params?: any) => request.get('/cost/records', { params }),
  addRecord: (data: any) => request.post('/cost/records', data),
  payments: (params?: any) => request.get('/cost/payments', { params }),
  addPayment: (data: any) => request.post('/cost/payments', data),
  profitAnalysis: (params?: any) => request.get('/cost/profit-analysis', { params }),
  dashboard: () => request.get('/cost/dashboard'),
  orderCost: (orderId: string) => request.get(`/cost/orders/${orderId}`),
};

export const userApi = {
  list: (params?: any) => request.get('/users', { params }),
  create: (data: any) => request.post('/users', data),
  detail: (id: string) => request.get(`/users/${id}`),
  update: (id: string, data: any) => request.patch(`/users/${id}`, data),
  remove: (id: string) => request.delete(`/users/${id}`),
  resetPassword: (id: string) => request.post(`/users/${id}/reset-password`),
  changePassword: (data: any) => request.post('/users/change-password', data),
  assignRoles: (id: string, roleIds: string[]) =>
    request.post(`/users/${id}/roles`, { roleIds }),
};

export const rbacApi = {
  roles: () => request.get('/rbac/roles'),
  createRole: (data: any) => request.post('/rbac/roles', data),
  permissions: () => request.get('/rbac/permissions'),
  groupedPermissions: () => request.get('/rbac/permissions/grouped'),
  assignRolePermissions: (roleId: string, permissionCodes: string[]) =>
    request.post(`/rbac/roles/${roleId}/permissions`, { permissionCodes }),
};

export const erpApi = {
  types: () => request.get('/erp/types'),
  config: () => request.get('/erp/config'),
  saveConfig: (data: any) => request.post('/erp/config', data),
  updateConfig: (id: string, data: any) => request.patch(`/erp/config/${id}`, data),
  testConnection: () => request.post('/erp/test-connection'),
  sync: (data: any) => request.post('/erp/sync', data),
  syncLogs: (params?: any) => request.get('/erp/sync-logs', { params }),
};
