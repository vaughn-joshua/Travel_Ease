/*
apis

get upcoming plans
get finished plans
get specific travel  plan

post travel plan (create plan)

put plan (edit travel plan)
put plan activity (edit activity) NOT SURE SA SEQUENCE, how will the sequence be kept
put plan participants (edit collaborators)

get public travel plans (for joiners)
get plans (for quick join)

put join plan (for anyone na magjjoin)*/

import { Router } from "express";
import {
  activity_edit,
  collaborators_edit,
  create_plan,
  finished_plan,
  join_plan,
  plan_edit,
  plans_id,
  public_plans,
  specific_plans,
  fetch_plans,
  ongoing_plan,
  previous_plans,
  create_activity,
  fetch_activities,
  quick_join,
  delete_activity,
} from "../travel_plan/index.js";

const router = Router();

router.get("/ongoing_plan", ongoing_plan);
router.get("/plans", fetch_plans);
router.get("/previous_plans", previous_plans);
router.get("/plans/:id", plans_id);
router.get("/activities/:id", fetch_activities);

router.post("/create_plan", create_plan);
router.post("/create_activity", create_activity);

router.put("/edit_plan/:id", plan_edit);
router.put("/activity_edit/:id", activity_edit);
router.put("/collaborators_edit/:id", collaborators_edit);

router.get("/public_plans", public_plans);
router.get("/specific_plans", specific_plans); //is this redudant?

router.put("/join_plan", join_plan);
router.post("/quick_join", quick_join);

router.delete("/delete_activity/:id", delete_activity);

export default router;
