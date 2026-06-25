export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface PaginatedData<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export enum TenantStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  LOCKED = 'locked',
}

export enum ApprovalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ProductionOrderStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  tenantId: string;
  username: string;
  realName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  status: TenantStatus;
  contactPerson?: string;
  contactPhone?: string;
  expireAt?: Date;
}

export interface PricingCalculationRequest {
  productName: string;
  productCode?: string;
  quantity: number;
  materials: MaterialItem[];
  processes: ProcessItem[];
}

export interface MaterialItem {
  materialId?: string;
  materialName: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
}

export interface ProcessItem {
  processName: string;
  workTime: number;
  workCenter?: string;
  hourlyRate?: number;
}

export interface PricingCalculationResult {
  materialCost: number;
  laborCost: number;
  manufacturingCost: number;
  totalCost: number;
  suggestedPrice: number;
  marginRate: number;
  details: {
    materialBreakdown: { name: string; cost: number }[];
    processBreakdown: { name: string; cost: number }[];
  };
}
