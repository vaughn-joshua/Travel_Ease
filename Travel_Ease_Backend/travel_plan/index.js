import { create_plan } from "./controller/create_plan.js";
import { fetch_plans } from "./controller/fetch_plans.js";
import { ongoing_plan } from "./controller/ongoing_plans.js";
import { previous_plans } from "./controller/previous_plans.js";
import { public_plans } from "./controller/public_plans.js";

function travel_plan(req, res) {
  try {
    console.log("hello, your in travel-plan, index.js");
    res.send("hello");
  } catch (e) {
    console.log({ error: e });
    res.send({ error: e });
  }
}

function plans(req, res) {
  try {
    res.send("here are at the plans");
  } catch (e) {
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

function plans_id(req, res) {
  try {
    res.send("here are at the plans_id");
  } catch (e) {
    res.send({ error: e });
  }
}

// function create_plan(req, res) {
//   try {
//     res.status(201).json({ messageg: "you are at create plan" });
//   } catch (e) {
//     res.send({ error: e });
//   }
// }

function plan_edit(req, res) {
  try {
    res.send("here are at the plan_edit");
  } catch (e) {
    res.send({ error: e });
  }
}

function activity_edit(req, res) {
  try {
    res.send("here are at the activity_edit");
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

// function public_plans(req, res) {
//   try {
//     res.send("here are at the public_plans");
//   } catch (e) {
//     res.send({ error: e });
//   }
// }

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
  plans,
  finished_plan,
  plans_id,
  create_plan,
  plan_edit,
  activity_edit,
  collaborators_edit,
  specific_plans,
  join_plan,
  fetch_plans,
  ongoing_plan,
  previous_plans,
  public_plans,
};
