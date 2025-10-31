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

function travel_plan(req, res) {
  try {
    console.log("hello, your in travel-plan, index.js");
    res.send("hello");
  } catch (e) {
    console.log({ error: e });
    res.send({ error: e });
  }
}

function finished_plan(req, res) {
  try {
    res.send("here are at the finished_plan");
  } catch (e) {
    res.send({ error: e });
  }
}

function collaborators_edit(req, res) {
  try {
    res.send("here are at the collaborators_edit");
  } catch (e) {
    res.send({ error: e });
  }
}

function specific_plans(req, res) {
  try {
    res.send("here are at the specific_plans");
  } catch (e) {
    res.send({ error: e });
  }
}

function join_plan(req, res) {
  try {
    res.send("here are at the join_plan");
  } catch (e) {
    res.send({ error: e });
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
};
