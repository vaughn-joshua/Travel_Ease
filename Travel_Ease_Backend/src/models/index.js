/**
 * Sequelize Models Index
 * Exports all models and sets up associations
 */

import { sequelize } from '../lib/sequelize.js';
import { DataTypes } from 'sequelize';

// Import model definitions
import defineUser from './User.js';
import defineBlog from './Blog.js';
import defineLegacyBlog from './LegacyBlog.js';
import defineBusiness from './Business.js';
import defineBusinessCategory from './BusinessCategory.js';
import defineBusinessFavorite from './BusinessFavorite.js';
import defineBusinessHours from './BusinessHours.js';
import definePriceRange from './PriceRange.js';
import defineMenuItem from './MenuItem.js';
import defineTravelPlan from './TravelPlan.js';
import defineActivity from './Activity.js';
import defineParticipant from './Participant.js';
import defineTravelPlanFavorite from './TravelPlanFavorite.js';
import defineBusinessReview from './BusinessReview.js';
import defineTravelPlanReview from './TravelPlanReview.js';

// Initialize models
const User = defineUser(sequelize, DataTypes);
const Blog = defineBlog(sequelize, DataTypes);
const LegacyBlog = defineLegacyBlog(sequelize, DataTypes);
const Business = defineBusiness(sequelize, DataTypes);
const BusinessCategory = defineBusinessCategory(sequelize, DataTypes);
const BusinessFavorite = defineBusinessFavorite(sequelize, DataTypes);
const BusinessHours = defineBusinessHours(sequelize, DataTypes);
const PriceRange = definePriceRange(sequelize, DataTypes);
const MenuItem = defineMenuItem(sequelize, DataTypes);
const TravelPlan = defineTravelPlan(sequelize, DataTypes);
const Activity = defineActivity(sequelize, DataTypes);
const Participant = defineParticipant(sequelize, DataTypes);
const TravelPlanFavorite = defineTravelPlanFavorite(sequelize, DataTypes);
const BusinessReview = defineBusinessReview(sequelize, DataTypes);
const TravelPlanReview = defineTravelPlanReview(sequelize, DataTypes);

// Define associations
// User associations
User.hasMany(Blog, { foreignKey: 'user_id', as: 'blogs' });
User.hasMany(LegacyBlog, { foreignKey: 'user_id', as: 'legacyBlogs' });
User.hasMany(Business, { foreignKey: 'user_id', as: 'businesses' });
User.hasMany(BusinessFavorite, { foreignKey: 'user_id', as: 'businessFavorites' });
User.hasMany(BusinessReview, { foreignKey: 'user_id', as: 'businessReviews' });
User.hasMany(TravelPlan, { foreignKey: 'user_id', as: 'travelPlans' });
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
User.hasMany(Participant, { foreignKey: 'user_id', as: 'participations' });
User.hasMany(TravelPlanFavorite, { foreignKey: 'user_id', as: 'travelPlanFavorites' });
User.hasMany(TravelPlanReview, { foreignKey: 'user_id', as: 'travelPlanReviews' });

// Blog associations
Blog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LegacyBlog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Business associations
Business.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Business.hasMany(BusinessCategory, { foreignKey: 'business_id', as: 'categories' });
Business.hasMany(BusinessFavorite, { foreignKey: 'business_id', as: 'favorites' });
Business.hasMany(BusinessHours, { foreignKey: 'business_id', as: 'businessHours' });
Business.hasMany(BusinessReview, { foreignKey: 'business_id', as: 'reviews' });
Business.hasMany(MenuItem, { foreignKey: 'business_id', as: 'menuItems' });
Business.hasMany(Activity, { foreignKey: 'business_id', as: 'activities' });

// BusinessCategory associations
BusinessCategory.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
BusinessCategory.hasMany(PriceRange, { foreignKey: 'category_id', as: 'priceRanges' });

// BusinessFavorite associations
BusinessFavorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
BusinessFavorite.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// BusinessHours associations
BusinessHours.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// PriceRange associations
PriceRange.belongsTo(BusinessCategory, { foreignKey: 'category_id', as: 'category' });

// MenuItem associations
MenuItem.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// BusinessReview associations
BusinessReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
BusinessReview.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// TravelPlan associations
TravelPlan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
TravelPlan.hasMany(Activity, { foreignKey: 'travel_plan_id', as: 'activities' });
TravelPlan.hasMany(Participant, { foreignKey: 'travel_plan_id', as: 'participants' });
TravelPlan.hasMany(TravelPlanFavorite, { foreignKey: 'travel_plan_id', as: 'favorites' });
TravelPlan.hasMany(TravelPlanReview, { foreignKey: 'travel_plan_id', as: 'reviews' });

// Activity associations
Activity.belongsTo(TravelPlan, { foreignKey: 'travel_plan_id', as: 'travelPlan' });
Activity.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Participant associations
Participant.belongsTo(TravelPlan, { foreignKey: 'travel_plan_id', as: 'travelPlan' });
Participant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// TravelPlanFavorite associations
TravelPlanFavorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
TravelPlanFavorite.belongsTo(TravelPlan, { foreignKey: 'travel_plan_id', as: 'travelPlan' });

// TravelPlanReview associations
TravelPlanReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
TravelPlanReview.belongsTo(TravelPlan, { foreignKey: 'travel_plan_id', as: 'travelPlan' });

// Export models and sequelize instance
export {
  sequelize,
  User,
  Blog,
  LegacyBlog,
  Business,
  BusinessCategory,
  BusinessFavorite,
  BusinessHours,
  PriceRange,
  MenuItem,
  TravelPlan,
  Activity,
  Participant,
  TravelPlanFavorite,
  BusinessReview,
  TravelPlanReview
};

// Default export for convenience
export default {
  sequelize,
  User,
  Blog,
  LegacyBlog,
  Business,
  BusinessCategory,
  BusinessFavorite,
  BusinessHours,
  PriceRange,
  MenuItem,
  TravelPlan,
  Activity,
  Participant,
  TravelPlanFavorite,
  BusinessReview,
  TravelPlanReview
};

