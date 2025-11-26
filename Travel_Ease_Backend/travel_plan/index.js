import { create_plan } from "./controller/create_plan.js";
import { fetch_plans } from "./controller/fetch_plans.js";
import { ongoing_plan } from "./controller/ongoing_plans.js";
import { previous_plans } from "./controller/previous_plans.js";
import { public_plans } from "./controller/public_plans.js";
import { plans_id } from "./controller/plans_id.js";
import { create_activity } from "./controller/create_activity.js";
import { fetch_activities } from "./controller/fetch_activities.js";
import { activity_edit } from "./controller/activity_edit.js";
import { plan_edit } from "./controller/plan_edit.js";
import { quick_join } from "./controller/quick_join.js";
import { delete_activity } from "./controller/delete_activty.js";
import { update_activity } from "./controller/update_activity.js";
import {
  get_participants,
  add_participant,
  update_participant,
  remove_participant,
  collaborators_edit
} from "./controller/participants.js";

function travel_plan(req, res) {
  try {
    res.send("Travel Plan API - Use specific endpoints");
  } catch (e) {
    res.send({ error: e });
  }
}

function finished_plan(req, res) {
  try {
    // Redirect to previous_plans with Completed status
    res.send("Use /api/travel_plan/previous_plans for completed plans");
  } catch (e) {
    res.send({ error: e });
  }
}

function specific_plans(req, res) {
  try {
    // This seems redundant with plans_id
    res.send("Use /api/travel_plan/plans/:id for specific plan");
  } catch (e) {
    res.send({ error: e });
  }
}

// Join plan - add current user as participant
async function join_plan(req, res) {
  try {
    const { travel_plan_id, role = 'Viewer' } = req.body;
    const userId = req.user.id;

    // Use the add_participant logic
    req.params.id = travel_plan_id;
    req.body = { user_id: userId, role };
    
    return await add_participant(req, res);
  } catch (e) {
    console.error("Error in join_plan:", e);
    res.status(500).json({ error: e.message });
  }
}

export {
  travel_plan,
  finished_plan,
  plans_id,
  create_plan,
  plan_edit,
  create_activity,
  activity_edit,
  collaborators_edit,
  specific_plans,
  join_plan,
  fetch_plans,
  ongoing_plan,
  previous_plans,
  public_plans,
  fetch_activities,
  quick_join,
  delete_activity,
  update_activity,
  get_participants,
  add_participant,
  update_participant,
  remove_participant,
};
