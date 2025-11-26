import { z } from 'zod';

// User / Auth Schemas
export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  contact_no: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

// Travel Plan Schemas
export const createPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.string().datetime().optional()),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.string().datetime().optional()),
  slots: z.number().int().positive().optional().or(z.string().transform(Number).pipe(z.number().int().positive()).optional()),
  max_slots: z.number().int().positive().optional().or(z.string().transform(Number).pipe(z.number().int().positive()).optional()),
  collaborators: z.array(z.any()).optional()
});

export const editPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_slots: z.number().or(z.string()).optional(),
  visibility: z.boolean().optional(),
  status: z.enum(['Draft', 'Active', 'Completed', 'Cancelled']).optional()
});

// Activity Schemas
export const createActivitySchema = z.object({
  travel_plan_id: z.number().int().positive().or(z.string().transform(Number)),
  notes: z.string().optional(),
  target_date: z.string().optional(),
  budget_range: z.enum(['RANGE_0_100', 'RANGE_100_200', 'RANGE_200_400', 'RANGE_400_700', 'RANGE_700_1000', 'RANGE_1000_1500', 'RANGE_1500_PLUS']).optional(),
  lat: z.number().or(z.string().transform(Number)).optional(),
  lng: z.number().or(z.string().transform(Number)).optional(),
  location: z.string().optional(),
  brgy: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional()
});

export const editActivitySchema = z.object({
  budget_range: z.string().optional(),
  is_priority: z.boolean().optional(),
  notes: z.string().optional(),
  target_date: z.string().optional()
});

// Business Schemas
export const createBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(200),
  house_no: z.string().optional(),
  street: z.string().optional(),
  brgy: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  lat: z.number().or(z.string()).optional(),
  lng: z.number().or(z.string()).optional(),
  secure_url: z.string().url().optional().or(z.string().optional()),
  category: z.array(z.string()).min(1, "At least one category is required"),
  business_hrs: z.array(z.object({
    day: z.string(),
    start: z.string().optional(),
    end: z.string().optional()
  })).optional()
});

export const editBusinessSchema = z.object({
  name: z.string().max(200).optional(),
  house_number: z.string().optional(),
  street: z.string().optional(),
  brgy: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longtitude: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.boolean().optional(),
  picture: z.string().optional()
});

// Review Schemas
export const createReviewSchema = z.object({
  business_id: z.number().int().positive().optional(),
  travel_plan_id: z.number().int().positive().optional(),
  rating: z.number().min(0, "Rating must be at least 0").max(5, "Rating cannot exceed 5"),
  content: z.string().optional()
}).refine(data => data.business_id || data.travel_plan_id, {
  message: "Either business_id or travel_plan_id must be provided"
});

// Favorite Schema
export const createFavoriteSchema = z.object({
  business_id: z.number().int().positive().optional(),
  travel_plan_id: z.number().int().positive().optional()
}).refine(data => data.business_id || data.travel_plan_id, {
  message: "Either business_id or travel_plan_id must be provided"
});

// Participant Schemas
export const addParticipantSchema = z.object({
  user_id: z.number().int().positive("user_id must be a positive integer"),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional()
});

export const updateParticipantSchema = z.object({
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional(),
  status: z.boolean().optional()
});

export const joinPlanSchema = z.object({
  travel_plan_id: z.number().int().positive("travel_plan_id is required"),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional()
});

export const quickJoinSearchSchema = z.object({
  code: z.string().min(1, "Code is required").optional(),
  name: z.string().min(1, "Name is required").optional()
}).refine(data => data.code || data.name, {
  message: "Either code or name must be provided"
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

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validated = validated; // Attach validated data to request
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
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
