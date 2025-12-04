import Joi from 'joi';

// Dashboard statistics query validation
export const dashboardStatsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  projectId: Joi.number().integer().positive().optional(),
  includeComparison: Joi.boolean().optional().default(false)
});

// Lead analytics query validation
export const leadAnalyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  source: Joi.string().valid('website', 'referral', 'social_media', 'advertisement', 'walk_in', 'phone_call', 'email', 'other').optional(),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'unqualified', 'nurturing', 'converted', 'lost').optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'source', 'status', 'agent').optional().default('day'),
  limit: Joi.number().integer().min(1).max(1000).optional().default(100)
});

// Sales analytics query validation
export const salesAnalyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  projectId: Joi.number().integer().positive().optional(),
  dealStatus: Joi.string().valid('draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed').optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'project', 'agent', 'status').optional().default('month'),
  includeCommissions: Joi.boolean().optional().default(false)
});

// Agent performance query validation
export const agentPerformanceQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  includeCallStats: Joi.boolean().optional().default(true),
  includeLeadStats: Joi.boolean().optional().default(true),
  includeDealStats: Joi.boolean().optional().default(true),
  sortBy: Joi.string().valid('leads', 'deals', 'revenue', 'calls', 'conversion').optional().default('revenue'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  limit: Joi.number().integer().min(1).max(100).optional().default(20)
});

// Revenue analytics query validation
export const revenueAnalyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  projectId: Joi.number().integer().positive().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').optional().default('month'),
  includeProjections: Joi.boolean().optional().default(false),
  includeCommissions: Joi.boolean().optional().default(true)
});

// Communication analytics query validation
export const communicationAnalyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  leadId: Joi.number().integer().positive().optional(),
  communicationType: Joi.string().valid('call', 'sms', 'whatsapp', 'email', 'notification').optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'type', 'agent').optional().default('day')
});

// Lead conversion funnel query validation
export const conversionFunnelQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  agentId: Joi.number().integer().positive().optional(),
  source: Joi.string().valid('website', 'referral', 'social_media', 'advertisement', 'walk_in', 'phone_call', 'email', 'other').optional(),
  includeTimeToConversion: Joi.boolean().optional().default(true)
});

// Project performance query validation
export const projectPerformanceQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  projectId: Joi.number().integer().positive().optional(),
  developerId: Joi.number().integer().positive().optional(),
  includeLeadMetrics: Joi.boolean().optional().default(true),
  includeDealMetrics: Joi.boolean().optional().default(true),
  sortBy: Joi.string().valid('leads', 'deals', 'revenue', 'conversion').optional().default('revenue'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
});

// Custom report query validation
export const customReportQuerySchema = Joi.object({
  reportType: Joi.string().valid('leads', 'deals', 'revenue', 'agents', 'projects', 'communication').required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  filters: Joi.object({
    agentId: Joi.number().integer().positive().optional(),
    projectId: Joi.number().integer().positive().optional(),
    leadStatus: Joi.string().optional(),
    dealStatus: Joi.string().optional(),
    source: Joi.string().optional()
  }).optional(),
  groupBy: Joi.array().items(Joi.string().valid('day', 'week', 'month', 'agent', 'project', 'status', 'source')).optional(),
  metrics: Joi.array().items(Joi.string().valid('count', 'revenue', 'conversion', 'duration', 'commission')).optional(),
  format: Joi.string().valid('json', 'csv', 'excel').optional().default('json')
});

// Export report validation
export const exportReportQuerySchema = Joi.object({
  reportType: Joi.string().valid('dashboard', 'leads', 'deals', 'revenue', 'agents', 'projects', 'communication').required(),
  format: Joi.string().valid('csv', 'excel', 'pdf').required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  filters: Joi.object().optional(),
  fileName: Joi.string().max(100).optional()
});