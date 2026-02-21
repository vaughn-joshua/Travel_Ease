import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// User / Auth Schemas
export const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  contact_no: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  contact_no: z.string().optional()
});

// Collaborator schema for create plan
const collaboratorSchema = z.object({
  user_id: z.number().int().positive().or(z.string().transform(Number).pipe(z.number().int().positive())),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional(),
  status: z.boolean().optional()
});

// Travel Plan Schemas
export const createPlanSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().or(z.string().datetime().optional()),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().or(z.string().datetime().optional()),
  slots: z.number().int().positive().optional().or(z.string().transform(Number).pipe(z.number().int().positive()).optional()),
  max_slots: z.number().int().positive().optional().or(z.string().transform(Number).pipe(z.number().int().positive()).optional()),
  accommodation_id: z.number().int().positive().optional().or(z.string().transform(Number).pipe(z.number().int().positive()).optional()).nullable(),
  collaborators: z.array(collaboratorSchema).optional().default([])
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date', path: ['end_date'] }
);

export const editPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_slots: z.number().int().positive().optional().or(z.string().transform(Number).pipe(z.number().int().positive()).optional()).nullable(),
  visibility: z.boolean().optional(),
  status: z.enum(['Draft', 'Active', 'Completed', 'Cancelled']).optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date', path: ['end_date'] }
);

// Budget range values - accepts both API format (RANGE_X_Y) and DB format (X-Y)
const budgetRangeValues = [
  // DB format (preferred)
  '0-100', '100-200', '200-400', '400-700', '700-1000', '1000-1500', '1500+',
  // API format (legacy, normalized in controller)
  'RANGE_0_100', 'RANGE_100_200', 'RANGE_200_400', 'RANGE_400_700', 'RANGE_700_1000', 'RANGE_1000_1500', 'RANGE_1500_PLUS'
] as const;

// Activity Schemas
export const createActivitySchema = z.object({
  travel_plan_id: z.number().int().positive().or(z.string().transform(Number)),
  business_id: z.number().int().positive().or(z.string().transform(Number)).optional(),
  insert_after_activity_id: z.number().int().positive().or(z.string().transform(Number)).optional(),
  notes: z.string().optional(),
  target_date: z.string().optional(),
  budget_range: z.enum(budgetRangeValues).optional(),
  lat: z.number().or(z.string().transform(Number)).optional(),
  lng: z.number().or(z.string().transform(Number)).optional(),
  location: z.string().optional(),
  name: z.string().optional(),
  brgy: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional()
});

export const editActivitySchema = z.object({
  budget_range: z.enum(budgetRangeValues).optional(),
  is_priority: z.boolean().optional(),
  notes: z.string().optional(),
  target_date: z.string().optional()
});

// Business Schemas
// Price State Machine:
//   - both null: price not set
//   - only min_price set: minimum price known
//   - only max_price set: maximum price known
//   - both set: min_price <= max_price enforced by validation
export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(200),
  house_no: z.string().optional(),
  street: z.string().optional(), // Optional but used for deduplication if provided
  brgy: z.string().optional(),
  city: z.string().min(1, 'City is required'), // City is required for deduplication
  description: z.string().optional(),
  lat: z.number().or(z.string()).nullable().optional(),
  lng: z.number().or(z.string()).nullable().optional(),
  secure_url: z.string().optional(), // Can be JSON string or URL
  category: z.array(z.string()).min(1, 'At least one category is required'),
  business_hrs: z.array(z.object({
    day: z.string(),
    start: z.string().optional(),
    end: z.string().optional()
  })).optional(),
  min_price: z.number().int().min(0).optional().or(z.string().transform(Number).pipe(z.number().int().min(0)).optional()),
  max_price: z.number().int().min(0).optional().or(z.string().transform(Number).pipe(z.number().int().min(0)).optional()),
}).refine(
  (data) => {
    if (data.min_price !== undefined && data.max_price !== undefined) {
      return data.min_price <= data.max_price;
    }
    return true;
  },
  { message: 'min_price must be less than or equal to max_price', path: ['min_price'] }
);

export const editBusinessSchema = z.object({
  name: z.string().max(200).optional(),
  // Accept both naming conventions (form sends house_no, controller expects house_number)
  house_no: z.string().optional(),
  house_number: z.string().optional(),
  street: z.string().optional(),
  brgy: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  // Accept both naming conventions for coordinates
  lat: z.number().optional().or(z.string().transform(Number).optional()),
  lng: z.number().optional().or(z.string().transform(Number).optional()),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  longtitude: z.number().optional(), // Legacy typo, kept for backward compatibility
  rating: z.number().min(0).max(5).optional(),
  status: z.boolean().optional(),
  // Accept both naming conventions for picture
  secure_url: z.string().optional(),
  picture: z.string().optional(),
  // Category and hours for updates
  category: z.array(z.string()).optional(),
  business_hrs: z.array(z.object({
    day: z.string(),
    start: z.string().optional(),
    end: z.string().optional()
  })).optional(),
  // Price range fields - stored directly on business table
  min_price: z.number().int().min(0).optional().or(z.string().transform(Number).pipe(z.number().int().min(0)).optional()),
  max_price: z.number().int().min(0).optional().or(z.string().transform(Number).pipe(z.number().int().min(0)).optional()),
}).refine(
  (data) => {
    if (data.min_price !== undefined && data.max_price !== undefined) {
      return data.min_price <= data.max_price;
    }
    return true;
  },
  { message: 'min_price must be less than or equal to max_price', path: ['min_price'] }
);

// Review Schemas
export const createReviewSchema = z.object({
  business_id: z.number().int().positive().optional(),
  travel_plan_id: z.number().int().positive().optional(),
  rating: z.number().min(0, 'Rating must be at least 0').max(5, 'Rating cannot exceed 5'),
  content: z.string().optional()
}).refine(data => data.business_id || data.travel_plan_id, {
  message: 'Either business_id or travel_plan_id must be provided'
});

// Favorite Schema
export const createFavoriteSchema = z.object({
  business_id: z.number().int().positive().optional(),
  travel_plan_id: z.number().int().positive().optional()
}).refine(data => data.business_id || data.travel_plan_id, {
  message: 'Either business_id or travel_plan_id must be provided'
});

// Participant Schemas
export const addParticipantSchema = z.object({
  user_id: z.number().int().positive('user_id must be a positive integer'),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional()
});

export const updateParticipantSchema = z.object({
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional(),
  status: z.boolean().optional()
});

export const joinPlanSchema = z.object({
  travel_plan_id: z.number().int().positive('travel_plan_id is required'),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional()
});

export const quickJoinSearchSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  name: z.string().min(1, 'Name is required').optional()
}).refine(data => data.code || data.name, {
  message: 'Either code or name must be provided'
});

// Price Range Schema
export const priceRangeSchema = z.object({
  categories: z.array(z.object({
    category_id: z.number().int().positive(),
    min_price: z.number().int().min(0),
    max_price: z.number().int().min(0)
  })).optional(),
  menu: z.any().optional(),
  pictures: z.string().optional(),
  id: z.number().int().positive()
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

/** Pagination query params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/** Search/filter query params for travel plans */
export const planQuerySchema = paginationSchema.extend({
  status: z.enum(['Draft', 'Active', 'Completed', 'Cancelled']).optional(),
  search: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
});

/** Search/filter query params for businesses */
export const businessQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  city: z.string().max(200).optional(),
  search: z.string().max(200).optional(),
  status: z.coerce.boolean().optional(),
  // Price filtering - filter businesses whose price range overlaps with given range
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
}).refine(
  (data) => {
    // If both minPrice and maxPrice are provided, ensure minPrice <= maxPrice
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: 'minPrice must be less than or equal to maxPrice', path: ['minPrice'] }
);

// ============================================================================
// Route Parameter Schemas
// ============================================================================

/** Single numeric ID param (e.g., /plans/:id) */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

/** Travel plan ID param */
export const planIdParamSchema = z.object({
  plan_id: z.coerce.number().int().positive('Plan ID must be a positive integer'),
});

/** Activity ID param */
export const activityIdParamSchema = z.object({
  activity_id: z.coerce.number().int().positive('Activity ID must be a positive integer'),
});

/** Business ID param */
export const businessIdParamSchema = z.object({
  business_id: z.coerce.number().int().positive('Business ID must be a positive integer'),
});

/** Participant ID param */
export const participantIdParamSchema = z.object({
  participant_id: z.coerce.number().int().positive('Participant ID must be a positive integer'),
});

// ============================================================================
// Validation Middleware Factories
// ============================================================================

/** Validate request body */
export const validate = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.validated = validated; // Attach validated data to request
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/** Validate query parameters */
export const validateQuery = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    req.validatedQuery = result.data;
    next();
  };
};

/** Validate route parameters */
export const validateParams = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid route parameters',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    req.validatedParams = result.data;
    next();
  };
};

/** Combined validation for body, query, and params */
export const validateAll = <
  TBody extends z.ZodType,
  TQuery extends z.ZodType,
  TParams extends z.ZodType
>(schemas: {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ source: string; field: string; message: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          source: 'body',
          field: err.path.join('.'),
          message: err.message
        })));
      } else {
        req.validated = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          source: 'query',
          field: err.path.join('.'),
          message: err.message
        })));
      } else {
        req.validatedQuery = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          source: 'params',
          field: err.path.join('.'),
          message: err.message
        })));
      } else {
        req.validatedParams = result.data;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

