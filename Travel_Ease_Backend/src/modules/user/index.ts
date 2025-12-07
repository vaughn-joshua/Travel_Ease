/**
 * User Module
 * 
 * Exports all user-related functionality.
 * This module provides a single entry point for user operations.
 */

export { 
  register, 
  login, 
  favorite, 
  remove_favorite, 
  favorite_id, 
  user_id, 
  oauth_sync, 
  update_profile, 
  get_me, 
  delete_account,
  search_users,
  disconnect_google
} from './controllers/userController.js';
