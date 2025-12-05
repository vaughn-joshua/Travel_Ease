/**
 * Service Layer Index
 * 
 * Re-exports all services for convenient importing:
 * 
 *   import { travelPlanService, businessService, activityService, userService, blogService } from '../services/index.js';
 *   
 * Or import specific functions:
 * 
 *   import { getUpcomingPlans, createPlan } from '../services/travelPlanService.js';
 */

export * as travelPlanService from './travelPlanService.js';
export * as businessService from './businessService.js';
export * as activityService from './activityService.js';
export * as userService from './userService.js';
export * as blogService from './blogService.js';

// Re-export commonly used types
export type {
  TravelPlanDTO,
  CreatePlanInput,
  UpdatePlanInput,
  PlanFilters,
} from './travelPlanService.js';

export type {
  BusinessDTO,
  BusinessListItemDTO,
  CreateBusinessInput,
  UpdateBusinessInput,
  BusinessFilters,
} from './businessService.js';

export type {
  ActivityDTO,
  CreateActivityInput,
  UpdateActivityInput,
} from './activityService.js';

export type {
  UserDTO,
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  LoginResult,
  RegisterResult,
} from './userService.js';

export type {
  BlogDTO,
  BlogListItemDTO,
  CreateBlogInput,
  UpdateBlogInput,
  BlogFilters,
} from './blogService.js';

