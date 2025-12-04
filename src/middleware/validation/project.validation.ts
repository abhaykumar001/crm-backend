import Joi from 'joi';

// Project validation schemas (simplified for actual schema)
export const createProjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Project name is required',
      'string.min': 'Project name must be at least 2 characters',
      'string.max': 'Project name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'Project description cannot exceed 2000 characters'
    }),

  developerId: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Developer ID must be a number',
      'number.positive': 'Developer ID must be positive'
    }),

  location: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Location cannot exceed 200 characters'
    }),

  city: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),

  state: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'State cannot exceed 50 characters'
    }),

  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Pincode must be exactly 6 digits'
    }),

  projectType: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'Project type cannot exceed 50 characters'
    }),

  status: Joi.string()
    .trim()
    .max(50)
    .default('active')
    .messages({
      'string.max': 'Status cannot exceed 50 characters'
    }),

  launchDate: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Launch date must be a valid date'
    }),

  completionDate: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Completion date must be a valid date'
    }),

  minPrice: Joi.number()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Minimum price must be a number',
      'number.positive': 'Minimum price must be positive'
    }),

  maxPrice: Joi.number()
    .positive()
    .when('minPrice', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('minPrice')),
      otherwise: Joi.number()
    })
    .allow(null)
    .messages({
      'number.base': 'Maximum price must be a number',
      'number.positive': 'Maximum price must be positive',
      'number.greater': 'Maximum price must be greater than minimum price'
    })
});

export const updateProjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Project name must be at least 2 characters',
      'string.max': 'Project name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'Project description cannot exceed 2000 characters'
    }),

  developerId: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Developer ID must be a number',
      'number.positive': 'Developer ID must be positive'
    }),

  location: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Location cannot exceed 200 characters'
    }),

  city: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),

  state: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'State cannot exceed 50 characters'
    }),

  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Pincode must be exactly 6 digits'
    }),

  projectType: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'Project type cannot exceed 50 characters'
    }),

  status: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'Status cannot exceed 50 characters'
    }),

  launchDate: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Launch date must be a valid date'
    }),

  completionDate: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Completion date must be a valid date'
    }),

  minPrice: Joi.number()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Minimum price must be a number',
      'number.positive': 'Minimum price must be positive'
    }),

  maxPrice: Joi.number()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Maximum price must be a number',
      'number.positive': 'Maximum price must be positive'
    }),

  images: Joi.string()
    .allow('')
    .messages({
      'string.base': 'Images must be a string'
    }),

  brochure: Joi.string()
    .allow('', null)
    .messages({
      'string.base': 'Brochure must be a string'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const projectQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),

  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    }),

  developerId: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Developer ID must be a number',
      'number.positive': 'Developer ID must be positive'
    }),

  city: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),

  state: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'State cannot exceed 50 characters'
    }),

  projectType: Joi.string()
    .valid('residential', 'commercial', 'industrial', 'mixed')
    .messages({
      'any.only': 'Project type must be one of: residential, commercial, industrial, mixed'
    }),

  status: Joi.string()
    .valid('planning', 'under_construction', 'completed', 'on_hold', 'cancelled')
    .messages({
      'any.only': 'Status must be one of: planning, under_construction, completed, on_hold, cancelled'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    }),

  sortBy: Joi.string()
    .valid('name', 'createdAt', 'launchDate', 'completionDate', 'city')
    .default('createdAt')
    .messages({
      'any.only': 'sortBy must be one of: name, createdAt, launchDate, completionDate, city'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'sortOrder must be either "asc" or "desc"'
    })
});

// Developer validation schemas
export const createDeveloperSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Developer name is required',
      'string.min': 'Developer name must be at least 2 characters',
      'string.max': 'Developer name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),

  contactInfo: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Contact info cannot exceed 500 characters'
    }),

  logo: Joi.string()
    .trim()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Logo URL cannot exceed 255 characters'
    }),

  website: Joi.string()
    .trim()
    .max(255)
    .pattern(/^https?:\/\//)
    .allow('')
    .messages({
      'string.max': 'Website URL cannot exceed 255 characters',
      'string.pattern.base': 'Website must be a valid URL starting with http:// or https://'
    })
});

export const updateDeveloperSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Developer name must be at least 2 characters',
      'string.max': 'Developer name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),

  contactInfo: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Contact info cannot exceed 500 characters'
    }),

  logo: Joi.string()
    .trim()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Logo URL cannot exceed 255 characters'
    }),

  website: Joi.string()
    .trim()
    .max(255)
    .pattern(/^https?:\/\//)
    .allow('')
    .messages({
      'string.max': 'Website URL cannot exceed 255 characters',
      'string.pattern.base': 'Website must be a valid URL starting with http:// or https://'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Amenity validation schemas
export const assignAmenitiesdSchema = Joi.object({
  amenityIds: Joi.array()
    .items(
      Joi.number()
        .integer()
        .positive()
        .messages({
          'number.base': 'Amenity ID must be a number',
          'number.positive': 'Amenity ID must be positive'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one amenity ID is required',
      'any.required': 'Amenity IDs are required'
    })
});

export const createAmenitySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Amenity name is required',
      'string.min': 'Amenity name must be at least 2 characters',
      'string.max': 'Amenity name cannot exceed 50 characters'
    }),

  icon: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Icon cannot exceed 100 characters'
    })
});

export const updateAmenitySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Amenity name must be at least 2 characters',
      'string.max': 'Amenity name cannot exceed 50 characters'
    }),

  icon: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Icon cannot exceed 100 characters'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Media upload validation
export const uploadMediaSchema = Joi.object({
  mediaType: Joi.string()
    .valid('images', 'brochure', 'documents')
    .required()
    .messages({
      'any.only': 'Media type must be one of: images, brochure, documents',
      'any.required': 'Media type is required'
    }),

  files: Joi.array()
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one file is required',
      'any.required': 'Files are required'
    })
});