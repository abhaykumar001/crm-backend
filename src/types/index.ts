// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: any;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Filter types
export interface LeadFilters {
  search?: string;
  status?: number;
  source?: number;
  agent?: number;
  project?: number;
  dateFrom?: string;
  dateTo?: string;
  priority?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  department?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  designation?: string;
  reportingTo?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// User types
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
  profileImage?: string;
  designation?: string;
  joiningDate?: Date;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

// Lead types
export interface CreateLeadData {
  name: string;
  email?: string;
  mobileNumber?: string;
  alternateNumber?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  occupation?: string;
  designation?: string;
  companyName?: string;
  sourceId?: number;
  subSourceId?: number;
  projectId?: number;
  budget?: number;
  requirement?: string;
  remarks?: string;
  priority?: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  statusId?: number;
  subStatusId?: number;
  reasonId?: number;
  followUpDate?: Date;
}

// Project types
export interface CreateProjectData {
  name: string;
  description?: string;
  developerId?: number;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  projectType?: string;
  launchDate?: Date;
  completionDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: number[];
}

// Deal types
export interface CreateDealData {
  leadId: number;
  projectId: number;
  dealValue: number;
  commissionRate: number;
  paymentTerms?: string;
  notes?: string;
}

// Communication types
export interface SendMessageData {
  leadId: number;
  message: string;
  type: 'sms' | 'whatsapp' | 'email';
  templateId?: number;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  url: string;
}

// Activity log types
export interface ActivityLogData {
  logName?: string;
  description: string;
  subjectType?: string;
  subjectId?: number;
  properties?: any;
}

// Dashboard types
export interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  todayLeads: number;
  todayDeals: number;
  recentActivities: any[];
  leadsByStatus: any[];
  leadsBySource: any[];
  revenueByMonth: any[];
}

// Notification types
export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  data?: any;
}

// Error types
export interface ErrorDetails {
  message: string;
  statusCode: number;
  field?: string;
  code?: string;
}
