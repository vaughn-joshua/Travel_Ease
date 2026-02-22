/**
 * Routes Index
 * 
 * Aggregates and exports all route modules.
 * This provides a single entry point for importing routes.
 */

import businessRoutes from './businessRoutes.js';
import businessSearchRoutes from './businessSearchRoutes.js';
import travelPlanRoutes from './travelPlanRoutes.js';
import userRoutes from './userRoutes.js';
import mapRoutes from './mapRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import configRoutes from './configRoutes.js';
import utilsRoutes from './utilsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import { blogRoutes } from './blogRoutes.js';
import trafficRoutes from './trafficRoutes.js';
import weatherRoutes from './weatherRoutes.js';

// Legacy exports for backward compatibility
export const travel_plan_routes = travelPlanRoutes;
export const user_routes = userRoutes;
export const config_routes = configRoutes;
export const utils_routes = utilsRoutes;
export const business_routes = businessRoutes;
export const map_routes = mapRoutes;
export const review_routes = reviewRoutes;
export const notification_routes = notificationRoutes;
export const weather_routes = weatherRoutes;

// New exports with camelCase naming
export {
  businessRoutes,
  businessSearchRoutes,
  travelPlanRoutes,
  userRoutes,
  mapRoutes,
  reviewRoutes,
  configRoutes,
  utilsRoutes,
  notificationRoutes,
  blogRoutes,
  trafficRoutes,
  weatherRoutes,
};

export default {
  businessRoutes,
  travelPlanRoutes,
  userRoutes,
  mapRoutes,
  reviewRoutes,
  configRoutes,
  utilsRoutes,
  notificationRoutes,
  blogRoutes,
  trafficRoutes,
  weatherRoutes,
};

