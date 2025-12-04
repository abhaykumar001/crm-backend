import Joi from 'joi';

// User creation validation schema
export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(8).max(50).required(),
  mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow('', null),
  designation: Joi.string().max(100).optional().allow('', null),
  joiningDate: Joi.date().optional().allow(null),
  reportingTo: Joi.number().integer().positive().optional().allow(null),
  isActive: Joi.boolean().default(true)
});

// User update validation schema
export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  email: Joi.string().email().optional().trim().lowercase(),
  mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow('', null),
  designation: Joi.string().max(100).optional().allow('', null),
  joiningDate: Joi.date().optional().allow(null),
  reportingTo: Joi.number().integer().positive().optional().allow(null),
  isActive: Joi.boolean().optional()
});

// Role assignment validation schema
export const assignRoleSchema = Joi.object({
  roleId: Joi.number().integer().positive().required()
});

// Password change validation schema
export const changePasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(50).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({
      'any.only': 'Passwords do not match'
    })
});

// Profile update validation schema
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow('', null),
  designation: Joi.string().max(100).optional().allow('', null),
  profileImage: Joi.string().uri().optional().allow('', null)
});

// User query parameters validation schema
export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).optional().allow(''),
  role: Joi.string().valid('admin', 'hr', 'team_leader', 'agent').optional(),
  isActive: Joi.boolean().optional(),
  designation: Joi.string().max(100).optional(),
  reportingTo: Joi.number().integer().positive().optional(),
  sortBy: Joi.string().valid('name', 'email', 'designation', 'joiningDate', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional().when('dateFrom', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('dateFrom')),
    otherwise: Joi.date()
  })
});

// Bulk user update validation schema
export const bulkUpdateUserSchema = Joi.object({
  userIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  updates: Joi.object({
    isActive: Joi.boolean().optional(),
    reportingTo: Joi.number().integer().positive().optional().allow(null)
  }).required()
});

// User import validation schema
export const importUserSchema = Joi.object({
  users: Joi.array().items(
    Joi.object({
      name: Joi.string().min(2).max(100).required().trim(),
      email: Joi.string().email().required().trim().lowercase(),
      mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow('', null),
      designation: Joi.string().max(100).optional().allow('', null),
      role: Joi.string().valid('admin', 'hr', 'team_leader', 'agent').required()
    })
  ).min(1).max(100).required()
});