import Joi from 'joi';

// Create Call Log Schema
export const createCallLogSchema = Joi.object({
  leadId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive',
      'any.required': 'Lead ID is required'
    }),
  
  callType: Joi.string().valid('incoming', 'outgoing', 'missed').required()
    .messages({
      'string.base': 'Call type must be a string',
      'any.only': 'Call type must be: incoming, outgoing, or missed',
      'any.required': 'Call type is required'
    }),
  
  callDuration: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': 'Call duration must be a number',
      'number.integer': 'Call duration must be an integer',
      'number.min': 'Call duration cannot be negative'
    }),
  
  callStatus: Joi.string().valid('answered', 'not_answered', 'busy', 'failed', 'voicemail').required()
    .messages({
      'string.base': 'Call status must be a string',
      'any.only': 'Call status must be: answered, not_answered, busy, failed, or voicemail',
      'any.required': 'Call status is required'
    }),
  
  notes: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes cannot exceed 1000 characters'
    }),
  
  callStartTime: Joi.date().iso().default(() => new Date())
    .messages({
      'date.base': 'Call start time must be a valid date',
      'date.format': 'Call start time must be in ISO format'
    }),
  
  callEndTime: Joi.date().iso().min(Joi.ref('callStartTime')).optional()
    .messages({
      'date.base': 'Call end time must be a valid date',
      'date.format': 'Call end time must be in ISO format',
      'date.min': 'Call end time must be after call start time'
    }),
  
  recordingPath: Joi.string().max(255).optional()
    .messages({
      'string.base': 'Recording path must be a string',
      'string.max': 'Recording path cannot exceed 255 characters'
    })
});

// Update Call Log Schema
export const updateCallLogSchema = Joi.object({
  callDuration: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': 'Call duration must be a number',
      'number.integer': 'Call duration must be an integer',
      'number.min': 'Call duration cannot be negative'
    }),
  
  callStatus: Joi.string().valid('answered', 'not_answered', 'busy', 'failed', 'voicemail').optional()
    .messages({
      'string.base': 'Call status must be a string',
      'any.only': 'Call status must be: answered, not_answered, busy, failed, or voicemail'
    }),
  
  notes: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes cannot exceed 1000 characters'
    }),
  
  callEndTime: Joi.date().iso().optional()
    .messages({
      'date.base': 'Call end time must be a valid date',
      'date.format': 'Call end time must be in ISO format'
    }),
  
  recordingPath: Joi.string().max(255).optional()
    .messages({
      'string.base': 'Recording path must be a string',
      'string.max': 'Recording path cannot exceed 255 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Call Log Query Schema
export const callLogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  leadId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive'
    }),
  
  agentId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Agent ID must be a number',
      'number.integer': 'Agent ID must be an integer',
      'number.positive': 'Agent ID must be positive'
    }),
  
  callType: Joi.string().valid('incoming', 'outgoing', 'missed').optional()
    .messages({
      'string.base': 'Call type must be a string',
      'any.only': 'Call type must be: incoming, outgoing, or missed'
    }),
  
  callStatus: Joi.string().valid('answered', 'not_answered', 'busy', 'failed', 'voicemail').optional()
    .messages({
      'string.base': 'Call status must be a string',
      'any.only': 'Call status must be: answered, not_answered, busy, failed, or voicemail'
    }),
  
  startDate: Joi.date().iso().optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format'
    }),
  
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
  
  sortBy: Joi.string().valid('callStartTime', 'callDuration', 'createdAt').default('callStartTime')
    .messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Sort by must be: callStartTime, callDuration, or createdAt'
    }),
  
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be either asc or desc'
    })
});

// SMS Notification Schema
export const createSmsSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    .messages({
      'string.base': 'Phone number must be a string',
      'string.pattern.base': 'Phone number must be a valid format',
      'any.required': 'Phone number is required'
    }),
  
  message: Joi.string().min(1).max(1600).required()
    .messages({
      'string.base': 'Message must be a string',
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 1600 characters',
      'any.required': 'Message is required'
    }),
  
  templateId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Template ID must be a number',
      'number.integer': 'Template ID must be an integer',
      'number.positive': 'Template ID must be positive'
    }),
  
  leadId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive'
    }),
  
  scheduledAt: Joi.date().iso().min('now').optional()
    .messages({
      'date.base': 'Scheduled time must be a valid date',
      'date.format': 'Scheduled time must be in ISO format',
      'date.min': 'Scheduled time cannot be in the past'
    })
});

// Bulk SMS Schema
export const createBulkSmsSchema = Joi.object({
  phoneNumbers: Joi.array().items(
    Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
  ).min(1).max(1000).required()
    .messages({
      'array.base': 'Phone numbers must be an array',
      'array.min': 'At least one phone number is required',
      'array.max': 'Cannot send to more than 1000 numbers at once',
      'any.required': 'Phone numbers are required'
    }),
  
  message: Joi.string().min(1).max(1600).required()
    .messages({
      'string.base': 'Message must be a string',
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 1600 characters',
      'any.required': 'Message is required'
    }),
  
  templateId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Template ID must be a number',
      'number.integer': 'Template ID must be an integer',
      'number.positive': 'Template ID must be positive'
    }),
  
  scheduledAt: Joi.date().iso().min('now').optional()
    .messages({
      'date.base': 'Scheduled time must be a valid date',
      'date.format': 'Scheduled time must be in ISO format',
      'date.min': 'Scheduled time cannot be in the past'
    })
});

// WhatsApp Message Schema
export const createWhatsAppMessageSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    .messages({
      'string.base': 'Phone number must be a string',
      'string.pattern.base': 'Phone number must be a valid format',
      'any.required': 'Phone number is required'
    }),
  
  message: Joi.string().min(1).max(4096).required()
    .messages({
      'string.base': 'Message must be a string',
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 4096 characters',
      'any.required': 'Message is required'
    }),
  
  messageType: Joi.string().valid('text', 'template', 'media').default('text')
    .messages({
      'string.base': 'Message type must be a string',
      'any.only': 'Message type must be: text, template, or media'
    }),
  
  templateName: Joi.when('messageType', {
    is: 'template',
    then: Joi.string().required().messages({
      'any.required': 'Template name is required for template messages'
    }),
    otherwise: Joi.forbidden()
  }),
  
  mediaUrl: Joi.when('messageType', {
    is: 'media',
    then: Joi.string().uri().required().messages({
      'any.required': 'Media URL is required for media messages',
      'string.uri': 'Media URL must be a valid URL'
    }),
    otherwise: Joi.forbidden()
  }),
  
  leadId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive'
    })
});

// Email Template Schema
export const createEmailTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required()
    .messages({
      'string.base': 'Template name must be a string',
      'string.min': 'Template name cannot be empty',
      'string.max': 'Template name cannot exceed 100 characters',
      'any.required': 'Template name is required'
    }),
  
  subject: Joi.string().min(1).max(200).required()
    .messages({
      'string.base': 'Subject must be a string',
      'string.min': 'Subject cannot be empty',
      'string.max': 'Subject cannot exceed 200 characters',
      'any.required': 'Subject is required'
    }),
  
  body: Joi.string().min(1).required()
    .messages({
      'string.base': 'Email body must be a string',
      'string.min': 'Email body cannot be empty',
      'any.required': 'Email body is required'
    }),
  
  type: Joi.string().valid(
    'welcome', 'lead_assignment', 'deal_closed', 'follow_up', 
    'payment_reminder', 'newsletter', 'custom'
  ).required()
    .messages({
      'string.base': 'Template type must be a string',
      'any.only': 'Template type must be one of: welcome, lead_assignment, deal_closed, follow_up, payment_reminder, newsletter, custom',
      'any.required': 'Template type is required'
    }),
  
  variables: Joi.array().items(Joi.string()).optional()
    .messages({
      'array.base': 'Variables must be an array of strings'
    }),
  
  isActive: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean'
    })
});

// Send Email Schema
export const sendEmailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email()).min(1).max(100)
  ).required()
    .messages({
      'alternatives.match': 'Recipients must be a valid email or array of emails',
      'any.required': 'Recipients are required'
    }),
  
  subject: Joi.string().min(1).max(200).required()
    .messages({
      'string.base': 'Subject must be a string',
      'string.min': 'Subject cannot be empty',
      'string.max': 'Subject cannot exceed 200 characters',
      'any.required': 'Subject is required'
    }),
  
  body: Joi.string().min(1).required()
    .messages({
      'string.base': 'Email body must be a string',
      'string.min': 'Email body cannot be empty',
      'any.required': 'Email body is required'
    }),
  
  isHTML: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'isHTML must be a boolean'
    }),
  
  templateId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Template ID must be a number',
      'number.integer': 'Template ID must be an integer',
      'number.positive': 'Template ID must be positive'
    }),
  
  templateVariables: Joi.object().optional()
    .messages({
      'object.base': 'Template variables must be an object'
    }),
  
  leadId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Lead ID must be a number',
      'number.integer': 'Lead ID must be an integer',
      'number.positive': 'Lead ID must be positive'
    }),
  
  scheduledAt: Joi.date().iso().min('now').optional()
    .messages({
      'date.base': 'Scheduled time must be a valid date',
      'date.format': 'Scheduled time must be in ISO format',
      'date.min': 'Scheduled time cannot be in the past'
    })
});

// Notification Schema
export const createNotificationSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.positive': 'User ID must be positive',
      'any.required': 'User ID is required'
    }),
  
  title: Joi.string().min(1).max(100).required()
    .messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  
  message: Joi.string().min(1).max(500).required()
    .messages({
      'string.base': 'Message must be a string',
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 500 characters',
      'any.required': 'Message is required'
    }),
  
  type: Joi.string().valid('info', 'warning', 'error', 'success').default('info')
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be: info, warning, error, or success'
    }),
  
  data: Joi.object().optional()
    .messages({
      'object.base': 'Data must be an object'
    }),
  
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal')
    .messages({
      'string.base': 'Priority must be a string',
      'any.only': 'Priority must be: low, normal, high, or urgent'
    })
});

// Bulk Notification Schema
export const createBulkNotificationSchema = Joi.object({
  userIds: Joi.array().items(
    Joi.number().integer().positive()
  ).min(1).max(1000).required()
    .messages({
      'array.base': 'User IDs must be an array',
      'array.min': 'At least one user ID is required',
      'array.max': 'Cannot send to more than 1000 users at once',
      'any.required': 'User IDs are required'
    }),
  
  title: Joi.string().min(1).max(100).required()
    .messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  
  message: Joi.string().min(1).max(500).required()
    .messages({
      'string.base': 'Message must be a string',
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 500 characters',
      'any.required': 'Message is required'
    }),
  
  type: Joi.string().valid('info', 'warning', 'error', 'success').default('info')
    .messages({
      'string.base': 'Type must be a string',
      'any.only': 'Type must be: info, warning, error, or success'
    }),
  
  data: Joi.object().optional()
    .messages({
      'object.base': 'Data must be an object'
    }),
  
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal')
    .messages({
      'string.base': 'Priority must be a string',
      'any.only': 'Priority must be: low, normal, high, or urgent'
    })
});