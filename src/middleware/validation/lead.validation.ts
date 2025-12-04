import Joi from 'joi';

// Lead creation validation schema
export const createLeadSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().optional().allow('', null),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  alternateNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
  whatsappNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  city: Joi.string().max(50).optional().allow('', null),
  state: Joi.string().max(50).optional().allow('', null),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).optional().allow('', null),
  occupation: Joi.string().max(100).optional().allow('', null),
  designation: Joi.string().max(100).optional().allow('', null),
  companyName: Joi.string().max(100).optional().allow('', null),
  sourceId: Joi.number().integer().positive().required(),
  subSourceId: Joi.number().integer().positive().optional().allow(null),
  projectId: Joi.number().integer().positive().optional().allow(null),
  budget: Joi.number().precision(2).min(0).optional().allow(null),
  requirement: Joi.string().max(1000).optional().allow('', null),
  remarks: Joi.string().max(1000).optional().allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  followUpDate: Joi.date().min('now').optional().allow(null)
});

// Lead update validation schema
export const updateLeadSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  email: Joi.string().email().optional().allow('', null),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  alternateNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
  whatsappNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  city: Joi.string().max(50).optional().allow('', null),
  state: Joi.string().max(50).optional().allow('', null),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).optional().allow('', null),
  occupation: Joi.string().max(100).optional().allow('', null),
  designation: Joi.string().max(100).optional().allow('', null),
  companyName: Joi.string().max(100).optional().allow('', null),
  sourceId: Joi.number().integer().positive().optional(),
  subSourceId: Joi.number().integer().positive().optional().allow(null),
  projectId: Joi.number().integer().positive().optional().allow(null),
  budget: Joi.number().precision(2).min(0).optional().allow(null),
  requirement: Joi.string().max(1000).optional().allow('', null),
  remarks: Joi.string().max(1000).optional().allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  followUpDate: Joi.date().min('now').optional().allow(null)
});

// Lead assignment validation schema
export const assignLeadSchema = Joi.object({
  agentId: Joi.number().integer().positive().required(),
  reason: Joi.string().max(500).optional().allow('', null)
});

// Lead status update validation schema
export const updateStatusSchema = Joi.object({
  statusId: Joi.number().integer().positive().required(),
  subStatusId: Joi.number().integer().positive().optional().allow(null),
  superStatusId: Joi.number().integer().positive().optional().allow(null),
  reasonId: Joi.number().integer().positive().optional().allow(null),
  remarks: Joi.string().max(1000).optional().allow('', null),
  followUpDate: Joi.date().min('now').optional().allow(null)
});

// Lead note validation schema
export const addNoteSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().trim(),
  isPrivate: Joi.boolean().default(false)
});

// Follow-up validation schema
export const scheduleFollowUpSchema = Joi.object({
  followUpDate: Joi.date().min('now').required(),
  remarks: Joi.string().max(500).optional().allow('', null),
  reminderBefore: Joi.number().integer().min(5).max(1440).default(30) // minutes before
});

// Lead query filters validation
export const leadQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional().allow(''),
  sourceId: Joi.number().integer().positive().optional(),
  statusId: Joi.number().integer().positive().optional(),
  agentId: Joi.number().integer().positive().optional(),
  projectId: Joi.number().integer().positive().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  city: Joi.string().max(50).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(0).optional(),
  sortBy: Joi.string().valid('createdAt', 'name', 'budget', 'followUpDate', 'lastContactDate').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Call log validation schema
export const callLogSchema = Joi.object({
  callType: Joi.string().valid('incoming', 'outgoing', 'missed').required(),
  callDuration: Joi.number().integer().min(0).optional().allow(null), // in seconds
  callStatus: Joi.string().valid('answered', 'not_answered', 'busy', 'failed').required(),
  notes: Joi.string().max(1000).optional().allow('', null),
  callStartTime: Joi.date().required(),
  callEndTime: Joi.date().optional().allow(null)
});

// Bulk operations validation
export const bulkAssignSchema = Joi.object({
  leadIds: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).required(),
  agentId: Joi.number().integer().positive().required(),
  reason: Joi.string().max(500).optional().allow('', null)
});

export const bulkStatusUpdateSchema = Joi.object({
  leadIds: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).required(),
  statusId: Joi.number().integer().positive().required(),
  subStatusId: Joi.number().integer().positive().optional().allow(null),
  reasonId: Joi.number().integer().positive().optional().allow(null),
  remarks: Joi.string().max(1000).optional().allow('', null)
});
