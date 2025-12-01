/**
 * Shared formatter for TravelPlan DTOs
 * Normalizes backend field names to a consistent shape for the frontend:
 *   - id (from travel_plan_id)
 *   - title (from name)
 *   - slots (from max_slots)
 *   - is_public (from visibility)
 *   - status (PascalCase: Draft, Active, Completed, Cancelled)
 *
 * Also includes original fields for backward compatibility.
 */

/**
 * Format a single plan to the normalized DTO shape
 * @param {object} plan - Sequelize model instance or plain object
 * @param {object} extras - Additional fields to merge (e.g., approvedParticipants)
 * @returns {object} - Normalized plan DTO
 */
export function formatPlan(plan, extras = {}) {
  // Handle Sequelize model or plain object
  const data = plan.toJSON ? plan.toJSON() : plan;

  return {
    // Normalized fields (frontend-preferred)
    id: data.travel_plan_id,
    title: data.name,
    slots: data.max_slots,
    is_public: data.visibility ?? false,
    
    // Original fields for backward compatibility
    travel_plan_id: data.travel_plan_id,
    name: data.name,
    max_slots: data.max_slots,
    visibility: data.visibility ?? false,
    
    // Common fields
    user_id: data.user_id,
    description: data.description,
    location: data.location,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status, // Already PascalCase from DB
    visibility_timestamp: data.visibility_timestamp,
    visibility_end_date: data.visibility_end_date,
    
    // Include user relation if present
    ...(data.user && { user: data.user }),
    
    // Merge any extras (e.g., approvedParticipants, slotsAvailable)
    ...extras
  };
}

/**
 * Format an array of plans
 * @param {Array} plans - Array of Sequelize model instances or plain objects
 * @param {Function} extrasMapper - Optional function (plan) => extras object
 * @returns {Array} - Array of normalized plan DTOs
 */
export function formatPlans(plans, extrasMapper = () => ({})) {
  return plans.map(plan => formatPlan(plan, extrasMapper(plan)));
}

