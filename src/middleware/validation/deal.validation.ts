import Joi from 'joi';

// Create Deal Schema
export const createDealSchema = Joi.object({
  leadId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive',
      'any.required': 'Lead ID is required'
    }),
  
  projectId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.positive': 'Project ID must be positive',
      'any.required': 'Project ID is required'
    }),
  
  agentId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Agent ID must be a number',
      'number.integer': 'Agent ID must be an integer',
      'number.positive': 'Agent ID must be positive'
    }),
  
  dealValue: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Deal value must be a number',
      'number.positive': 'Deal value must be positive',
      'any.required': 'Deal value is required'
    }),
  
  commissionRate: Joi.number().min(0).max(100).precision(2).required()
    .messages({
      'number.base': 'Commission rate must be a number',
      'number.min': 'Commission rate cannot be negative',
      'number.max': 'Commission rate cannot exceed 100%',
      'any.required': 'Commission rate is required'
    }),
  
  status: Joi.string().valid('pending', 'approved', 'rejected', 'closed_won', 'closed_lost')
    .default('pending')
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: pending, approved, rejected, closed_won, closed_lost'
    }),
  
  dealDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'Deal date must be a valid date',
      'date.format': 'Deal date must be in ISO format'
    }),
  
  closingDate: Joi.date().iso().min('now').optional()
    .messages({
      'date.base': 'Closing date must be a valid date',
      'date.format': 'Closing date must be in ISO format',
      'date.min': 'Closing date cannot be in the past'
    }),
  
  paymentTerms: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'Payment terms must be a string',
      'string.max': 'Payment terms cannot exceed 1000 characters'
    }),
  
  notes: Joi.string().max(2000).optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes cannot exceed 2000 characters'
    })
});

// Update Deal Schema
export const updateDealSchema = Joi.object({
  leadId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive'
    }),
  
  projectId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.positive': 'Project ID must be positive'
    }),
  
  agentId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Agent ID must be a number',
      'number.integer': 'Agent ID must be an integer',
      'number.positive': 'Agent ID must be positive'
    }),
  
  dealValue: Joi.number().positive().precision(2).optional()
    .messages({
      'number.base': 'Deal value must be a number',
      'number.positive': 'Deal value must be positive'
    }),
  
  commissionRate: Joi.number().min(0).max(100).precision(2).optional()
    .messages({
      'number.base': 'Commission rate must be a number',
      'number.min': 'Commission rate cannot be negative',
      'number.max': 'Commission rate cannot exceed 100%'
    }),
  
  status: Joi.string().valid('pending', 'approved', 'rejected', 'closed_won', 'closed_lost').optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: pending, approved, rejected, closed_won, closed_lost'
    }),
  
  dealDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'Deal date must be a valid date',
      'date.format': 'Deal date must be in ISO format'
    }),
  
  closingDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'Closing date must be a valid date',
      'date.format': 'Closing date must be in ISO format'
    }),
  
  paymentTerms: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'Payment terms must be a string',
      'string.max': 'Payment terms cannot exceed 1000 characters'
    }),
  
  notes: Joi.string().max(2000).optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes cannot exceed 2000 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Deal Query Schema (for filtering and searching)
export const dealQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  search: Joi.string().trim().max(100).optional()
    .messages({
      'string.base': 'Search must be a string',
      'string.max': 'Search cannot exceed 100 characters'
    }),
  
  status: Joi.string().valid('pending', 'approved', 'rejected', 'closed_won', 'closed_lost').optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: pending, approved, rejected, closed_won, closed_lost'
    }),
  
  agentId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Agent ID must be a number',
      'number.integer': 'Agent ID must be an integer',
      'number.positive': 'Agent ID must be positive'
    }),
  
  projectId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.positive': 'Project ID must be positive'
    }),
  
  minValue: Joi.number().positive().optional()
    .messages({
      'number.base': 'Minimum value must be a number',
      'number.positive': 'Minimum value must be positive'
    }),
  
  maxValue: Joi.number().positive().optional()
    .messages({
      'number.base': 'Maximum value must be a number',
      'number.positive': 'Maximum value must be positive'
    }),
  
  startDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format'
    }),
  
  endDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format'
    }),
  
  sortBy: Joi.string().valid('dealValue', 'createdAt', 'updatedAt', 'dealDate', 'closingDate')
    .default('createdAt')
    .messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Sort by must be one of: dealValue, createdAt, updatedAt, dealDate, closingDate'
    }),
  
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Deal Approval Schema
export const dealApprovalSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required()
    .messages({
      'string.base': 'Action must be a string',
      'any.only': 'Action must be either approve or reject',
      'any.required': 'Action is required'
    }),
  
  comments: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Comments must be a string',
      'string.max': 'Comments cannot exceed 500 characters'
    }),
  
  rejectionReason: Joi.when('action', {
    is: 'reject',
    then: Joi.string().required().messages({
      'any.required': 'Rejection reason is required when rejecting a deal'
    }),
    otherwise: Joi.forbidden()
  })
});

// Payment Record Schema
export const createPaymentSchema = Joi.object({
  paymentAmount: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Payment amount must be a number',
      'number.positive': 'Payment amount must be positive',
      'any.required': 'Payment amount is required'
    }),
  
  paymentDate: Joi.date().iso().default(() => new Date())
    .messages({
      'date.base': 'Payment date must be a valid date',
      'date.format': 'Payment date must be in ISO format'
    }),
  
  paymentMethod: Joi.string().valid(
    'cash', 'cheque', 'bank_transfer', 'card', 'upi', 'wallet', 'other'
  ).required()
    .messages({
      'string.base': 'Payment method must be a string',
      'any.only': 'Payment method must be one of: cash, cheque, bank_transfer, card, upi, wallet, other',
      'any.required': 'Payment method is required'
    }),
  
  transactionId: Joi.string().max(100).optional()
    .messages({
      'string.base': 'Transaction ID must be a string',
      'string.max': 'Transaction ID cannot exceed 100 characters'
    }),
  
  receiptNumber: Joi.string().max(50).optional()
    .messages({
      'string.base': 'Receipt number must be a string',
      'string.max': 'Receipt number cannot exceed 50 characters'
    }),
  
  notes: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

// Commission Calculation Schema
export const commissionCalculationSchema = Joi.object({
  dealId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Deal ID must be a number',
      'number.integer': 'Deal ID must be an integer',
      'number.positive': 'Deal ID must be positive',
      'any.required': 'Deal ID is required'
    }),
  
  agentId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Agent ID must be a number',
      'number.integer': 'Agent ID must be an integer',
      'number.positive': 'Agent ID must be positive',
      'any.required': 'Agent ID is required'
    }),
  
  commissionType: Joi.string().valid('primary', 'secondary', 'override', 'bonus')
    .default('primary')
    .messages({
      'string.base': 'Commission type must be a string',
      'any.only': 'Commission type must be one of: primary, secondary, override, bonus'
    })
});

// Deal Status Update Schema
export const dealStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'closed_won', 'closed_lost').required()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: pending, approved, rejected, closed_won, closed_lost',
      'any.required': 'Status is required'
    }),
  
  reason: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Reason must be a string',
      'string.max': 'Reason cannot exceed 500 characters'
    }),
  
  closingDate: Joi.when('status', {
    is: Joi.string().valid('closed_won', 'closed_lost'),
    then: Joi.date().iso().default(() => new Date()),
    otherwise: Joi.forbidden()
  })
});