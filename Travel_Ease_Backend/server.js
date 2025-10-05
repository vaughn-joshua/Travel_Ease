import express from "express";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
} from "./routes/index.js";
const app = express();

app.use(express.json()); // parse application/json

//routes

app.use("/api/travel_plan", travel_plan_routes);

app.use("/api/user", user_routes);

app.use("/api/config", config_routes);

//server

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
